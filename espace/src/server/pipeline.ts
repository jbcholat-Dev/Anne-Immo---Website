// Écrivain des contacts de l'espace d'Anne (AD-20, CAP-12 v7). Le site n'écrit dans ces tables que par le rattachement
// d'une demande (site/src/server/contacts.ts) ; tout le reste passe ici : saisie à la main, passages de boîtage,
// prescripteurs et import d'une liste (story 13.7). Une personne n'existe qu'une fois : même téléphone E.164 ou même
// e-mail = même contact, qui est complété, jamais recréé. Chaque création est notée dans l'historique avec le compte
// qui a agi. La règle des prochaines actions est tenue par la base (CHECK de la migration 0007).
import type { EnvSite } from '@site/server/env';
import { ACTION_QUALIFIER, CANAUX_ORIGINE, LIBELLES_ETAPES, type Canal, type Etape } from '@site/server/contacts';
import { e164, emailValide } from '@site/server/schema';
import { filtreRecherche } from '@site/server/recherche';
import { ulid } from '@site/server/ulid';

export const aujourdhui = () => new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());
const texte = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
export const estCanal = (v: string): v is Canal => v in CANAUX_ORIGINE;

export interface Passage { id: string; secteur: string; fait_le: string; mots: number | null; contacts: number }
export interface Prescripteur { id: string; nom: string; role: string | null; commune: string | null }

export interface Personne {
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  email: string | null;
  commune: string | null;
}

/** Nettoie une personne saisie ou importée. Renvoie null si elle n'a ni téléphone, ni e-mail, ni nom. */
export function personne(d: Record<string, unknown>): Personne | null {
  let tel = texte(d.telephone, 40);
  // Un tableur range souvent le numéro comme un nombre et perd le 0 : « 601020304 » redevient « 0601020304 ».
  if (/^[1-9]\d{8}$/.test(tel.replace(/[\s.]/g, ''))) tel = `0${tel.replace(/[\s.]/g, '')}`;
  const mail = texte(d.email, 254).toLowerCase();
  const p: Personne = {
    prenom: texte(d.prenom, 80) || null,
    nom: texte(d.nom, 80) || null,
    telephone: tel ? e164(tel) : null,
    email: mail && emailValide(mail) ? mail : null,
    commune: texte(d.commune, 80) || null,
  };
  return p.telephone || p.email || p.nom ? p : null;
}

/** Le contact qui porte ce téléphone ou cet e-mail ; le téléphone l'emporte. */
export async function contactConnu(env: EnvSite, telephone: string | null, email: string | null): Promise<{ id: string; etape: Etape } | null> {
  if (!telephone && !email) return null;
  return env.DB.prepare(
    `SELECT id, etape FROM contact WHERE (?1 IS NOT NULL AND telephone = ?1) OR (?2 IS NOT NULL AND email = ?2)
     ORDER BY (telephone IS ?1) DESC LIMIT 1`,
  ).bind(telephone, email).first<{ id: string; etape: Etape }>();
}

/** Complète un contact existant avec ce qui lui manque, sans prendre un téléphone ou un e-mail porté par un autre. */
function completer(env: EnvSite, id: string, p: Personne, maintenant: string) {
  return env.DB.prepare(
    `UPDATE contact SET
       last_activity_at = ?2,
       prenom = COALESCE(prenom, ?3),
       nom = COALESCE(nom, ?4),
       telephone = COALESCE(telephone, CASE WHEN ?5 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM contact WHERE telephone = ?5) THEN ?5 END),
       email = COALESCE(email, CASE WHEN ?6 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM contact WHERE email = ?6) THEN ?6 END),
       commune = COALESCE(commune, ?7)
     WHERE id = ?1`,
  ).bind(id, maintenant, p.prenom, p.nom, p.telephone, p.email, p.commune);
}

export interface Origine {
  canal: Canal;
  origine_detail: string | null;
  passage_id: string | null;
  prescripteur_id: string | null;
  parcours: 'vendeur' | 'acheteur' | null;
  rappel_individuel_seul?: boolean;
}

function inserer(env: EnvSite, id: string, p: Personne, o: Origine, maintenant: string, is_test: number) {
  return env.DB.prepare(
    `INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, email, commune, parcours, etape,
       prochaine_action, prochaine_action_le, canal, origine_detail, passage_id, prescripteur_id, rappel_individuel_seul, is_test)
     VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 'a_qualifier', ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)`,
  ).bind(id, maintenant, p.prenom, p.nom, p.telephone, p.email, p.commune, o.parcours, ACTION_QUALIFIER, aujourdhui(),
    o.canal, o.origine_detail, o.passage_id, o.prescripteur_id, o.rappel_individuel_seul ? 1 : 0, is_test);
}

function evenement(env: EnvSite, contactId: string, a: string, type: 'creation' | 'note' | 'qualification', source: 'anne' | 'import', texteEv: string, par: string, donnees?: unknown) {
  return env.DB.prepare('INSERT INTO contact_evenement (contact_id, a, type, source, texte, donnees, par) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)')
    .bind(contactId, a, type, source, texteEv, donnees === undefined ? null : JSON.stringify(donnees), par);
}

export function libelleOrigine(o: Pick<Origine, 'canal' | 'origine_detail'>, passage?: Passage | null, prescripteur?: Prescripteur | null): string {
  const base = CANAUX_ORIGINE[o.canal];
  if (passage) return `${base} ${passage.secteur}, ${passage.fait_le}`;
  if (prescripteur) return `${base} de ${prescripteur.nom}`;
  return o.origine_detail ? `${base} : ${o.origine_detail}` : base;
}

/** Saisie à la main : crée le contact, ou complète celui qui a déjà ce téléphone ou cet e-mail. */
export async function saisirContact(env: EnvSite, p: Personne, o: Origine, note: string, par: string): Promise<{ id: string; existant: boolean }> {
  const maintenant = new Date().toISOString();
  const connu = await contactConnu(env, p.telephone, p.email);
  if (connu) {
    const lot = [completer(env, connu.id, p, maintenant)];
    if (note) lot.push(evenement(env, connu.id, maintenant, 'note', 'anne', note, par));
    await env.DB.batch(lot);
    return { id: connu.id, existant: true };
  }
  const id = ulid();
  const lot = [
    inserer(env, id, p, o, maintenant, 0),
    evenement(env, id, maintenant, 'creation', 'anne', `Contact ajouté à la main · ${CANAUX_ORIGINE[o.canal]}`, par, o),
  ];
  if (note) lot.push(evenement(env, id, maintenant, 'note', 'anne', note, par));
  try {
    await env.DB.batch(lot);
  } catch (e) {
    // Une autre saisie a pris ce téléphone ou cet e-mail entre-temps : on ouvre la sienne.
    const autre = await contactConnu(env, p.telephone, p.email);
    if (autre) return { id: autre.id, existant: true };
    throw e;
  }
  return { id, existant: false };
}

/** Passage de boîtage : un secteur, une date, un nombre de mots déposés, et ce qu'ils ont coûté (centimes, story 13.17). */
export async function noterPassage(env: EnvSite, secteur: string, fait_le: string, mots: number | null, cout_centimes: number | null = null): Promise<string> {
  const id = ulid();
  await env.DB.prepare('INSERT INTO passage_boitage (id, created_at, secteur, fait_le, mots, cout_centimes) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
    .bind(id, new Date().toISOString(), secteur, fait_le, mots, cout_centimes).run();
  return id;
}

/** Les derniers passages, avec le nombre de contacts qu'ils ont amenés. */
export async function listerPassages(env: EnvSite, limite = 30): Promise<Passage[]> {
  const { results } = await env.DB.prepare(
    `SELECT p.id, p.secteur, p.fait_le, p.mots, (SELECT count(*) FROM contact c WHERE c.passage_id = p.id) AS contacts
     FROM passage_boitage p ORDER BY p.fait_le DESC, p.created_at DESC LIMIT ?1`,
  ).bind(limite).all<Passage>();
  return results;
}

export async function lirePassage(env: EnvSite, id: string): Promise<Passage | null> {
  return env.DB.prepare('SELECT id, secteur, fait_le, mots, 0 AS contacts FROM passage_boitage WHERE id = ?1').bind(id).first<Passage>();
}

export async function listerPrescripteurs(env: EnvSite): Promise<Prescripteur[]> {
  const { results } = await env.DB.prepare('SELECT id, nom, role, commune FROM prescripteur ORDER BY nom COLLATE NOCASE LIMIT 300').all<Prescripteur>();
  return results;
}

export async function lirePrescripteur(env: EnvSite, id: string): Promise<Prescripteur | null> {
  return env.DB.prepare('SELECT id, nom, role, commune FROM prescripteur WHERE id = ?1').bind(id).first<Prescripteur>();
}

/** Nouveau prescripteur, saisi en même temps que le contact qu'il recommande (la page Prescripteurs vient en 13.14). */
export async function creerPrescripteur(env: EnvSite, nom: string, role: string | null): Promise<string> {
  const existant = await env.DB.prepare('SELECT id FROM prescripteur WHERE lower(nom) = lower(?1)').bind(nom).first<{ id: string }>();
  if (existant) return existant.id;
  const id = ulid();
  const maintenant = new Date().toISOString();
  await env.DB.prepare('INSERT INTO prescripteur (id, created_at, last_activity_at, nom, role, dernier_contact_le) VALUES (?1, ?2, ?2, ?3, ?4, ?5)')
    .bind(id, maintenant, nom, role, aujourdhui()).run();
  return id;
}

// ——— Import d'une liste (événement, ancien fichier) ———

export const IMPORT_MAX = 500;

/** Reconnaît les colonnes d'un tableur par leur titre (Prénom, Nom, Téléphone, E-mail, Commune et variantes). */
export function colonnes(entetes: string[]): Partial<Record<keyof Personne, number>> {
  const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  const reperes: [keyof Personne, RegExp][] = [
    ['prenom', /^(prenom|firstname|first)$/],
    ['nom', /^(nom|name|lastname|nomdefamille|last)$/],
    ['telephone', /(tel|telephone|portable|mobile|phone|gsm)/],
    ['email', /(mail|courriel)/],
    ['commune', /^(commune|ville|city|localite)$/],
  ];
  const trouve: Partial<Record<keyof Personne, number>> = {};
  entetes.forEach((e, i) => {
    const s = sansAccents(e);
    for (const [cle, re] of reperes) if (trouve[cle] === undefined && re.test(s)) { trouve[cle] = i; break; }
  });
  return trouve;
}

export interface Ligne extends Personne { connu: boolean }

/** Les contacts déjà connus parmi ces personnes, en une seule requête : téléphone ou e-mail → id du contact. */
async function connus(env: EnvSite, personnes: Personne[]): Promise<{ parTel: Map<string, string>; parEmail: Map<string, string> }> {
  const tels = personnes.map((p) => p.telephone).filter(Boolean);
  const mails = personnes.map((p) => p.email).filter(Boolean);
  const { results } = await env.DB.prepare(
    `SELECT id, telephone, email FROM contact
     WHERE telephone IN (SELECT value FROM json_each(?1)) OR email IN (SELECT value FROM json_each(?2))`,
  ).bind(JSON.stringify(tels), JSON.stringify(mails)).all<{ id: string; telephone: string | null; email: string | null }>();
  const parTel = new Map<string, string>(), parEmail = new Map<string, string>();
  for (const r of results) { if (r.telephone) parTel.set(r.telephone, r.id); if (r.email) parEmail.set(r.email, r.id); }
  return { parTel, parEmail };
}
const idConnu = (c: Awaited<ReturnType<typeof connus>>, p: Personne) =>
  (p.telephone && c.parTel.get(p.telephone)) || (p.email && c.parEmail.get(p.email)) || null;

/** Lit les lignes d'un tableur : chaque personne, et si elle est déjà connue. Les doublons du fichier sont écartés. */
export async function preparerImport(env: EnvSite, lignes: string[][]): Promise<{ lignes: Ligne[]; ignorees: number; colonnesVues: string[] }> {
  const [entetes = [], ...corps] = lignes;
  const cols = colonnes(entetes);
  const valeur = (l: string[], c?: number) => (c === undefined ? '' : (l[c] ?? ''));
  const vues = new Set<string>();
  const personnes: Personne[] = [];
  let ignorees = Math.max(0, corps.length - IMPORT_MAX);
  for (const l of corps.slice(0, IMPORT_MAX)) {
    const p = personne({ prenom: valeur(l, cols.prenom), nom: valeur(l, cols.nom), telephone: valeur(l, cols.telephone), email: valeur(l, cols.email), commune: valeur(l, cols.commune) });
    if (!p) { if (l.some((v) => v.trim())) ignorees++; continue; }
    const cles = [p.telephone, p.email, !p.telephone && !p.email ? `nom:${p.prenom ?? ''} ${p.nom ?? ''}`.toLowerCase() : null].filter((k): k is string => !!k);
    if (cles.some((k) => vues.has(k))) { ignorees++; continue; }
    cles.forEach((k) => vues.add(k));
    personnes.push(p);
  }
  const c = await connus(env, personnes);
  return { lignes: personnes.map((p) => ({ ...p, connu: !!idConnu(c, p) })), ignorees, colonnesVues: Object.keys(cols) };
}

/** Enregistre l'import : nouveaux contacts créés, contacts connus complétés. Écrit par lots de 40 personnes. */
export async function importer(env: EnvSite, lignes: Personne[], o: Origine, par: string): Promise<{ nouveaux: number; completes: number }> {
  const maintenant = new Date().toISOString();
  const personnes = lignes.slice(0, IMPORT_MAX).map((b) => personne(b as unknown as Record<string, unknown>)).filter((p): p is Personne => !!p);
  const c = await connus(env, personnes);
  let nouveaux = 0, completes = 0;
  for (let i = 0; i < personnes.length; i += 40) {
    const morceau = personnes.slice(i, i + 40).map((p) => {
      const existant = idConnu(c, p);
      const id = existant ?? ulid();
      const ecritures = existant
        ? [completer(env, id, p, maintenant), evenement(env, id, maintenant, 'note', 'import', `Présent dans la liste importée : ${libelleOrigine(o)}`, par)]
        : [inserer(env, id, p, o, maintenant, 0), evenement(env, id, maintenant, 'creation', 'import', `Contact importé · ${libelleOrigine(o)}`, par, o)];
      return { p, existant: !!existant, ecritures };
    });
    try {
      await env.DB.batch(morceau.flatMap((m) => m.ecritures));
      for (const m of morceau) m.existant ? completes++ : nouveaux++;
    } catch {
      // Une personne du lot a été créée entre-temps par une autre écriture : on reprend ce lot une personne à la fois.
      for (const m of morceau) {
        if (m.existant) { await env.DB.batch(m.ecritures); completes++; continue; }
        const r = await saisirContact(env, m.p, o, '', par);
        r.existant ? completes++ : nouveaux++;
      }
    }
  }
  return { nouveaux, completes };
}

// ——— Lecture pour la liste et la fiche ———

export interface ResumeContact {
  id: string;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  email: string | null;
  commune: string | null;
  parcours: string | null;
  etape: Etape;
  prochaine_action: string | null;
  prochaine_action_le: string | null;
  canal: Canal;
  origine_detail: string | null;
  last_activity_at: string;
  is_test: number;
}

/** Les filtres d'une touche de la liste des contacts (story 13.24). */
export const FILTRES_CONTACTS = { a_qualifier: 'À qualifier', retard: 'En retard', vendeurs: 'Vendeurs', acheteurs: 'Acheteurs', sommeil: 'En sommeil' } as const;
export type FiltreContacts = keyof typeof FILTRES_CONTACTS;

/**
 * Les contacts, les plus récemment actifs d'abord. Recherche (story 13.24) : un début de numéro tapé en 0, ou des mots
 * cherchés chacun dans prénom, nom, commune et e-mail (`filtreRecherche`). Filtre facultatif d'une touche.
 */
export async function listerContacts(env: EnvSite, q = '', limite = 200, filtre: FiltreContacts | null = null): Promise<ResumeContact[]> {
  const champs = 'id, prenom, nom, telephone, email, commune, parcours, etape, prochaine_action, prochaine_action_le, canal, origine_detail, last_activity_at, is_test';
  const conditions: string[] = [];
  const valeurs: (string | number)[] = [limite];
  const f = filtreRecherche(q, ['prenom', 'nom', 'commune', 'email'], 'telephone', 2);
  if (f) { conditions.push(`(${f.sql})`); valeurs.push(...f.valeurs); }
  const n = valeurs.length + 1;
  if (filtre === 'a_qualifier') conditions.push(`etape = 'a_qualifier'`);
  else if (filtre === 'vendeurs') conditions.push(`parcours = 'vendeur' AND etape NOT IN ('perdu', 'vendu')`);
  else if (filtre === 'acheteurs') conditions.push(`parcours = 'acheteur' AND etape NOT IN ('perdu', 'acte_signe')`);
  else if (filtre === 'sommeil') conditions.push(`etape = 'en_sommeil'`);
  else if (filtre === 'retard') {
    // Une date seule est en retard si elle est passée ; une date et heure, si elle tombe avant aujourd'hui (Paris).
    conditions.push(`etape NOT IN ('perdu', 'vendu', 'acte_signe', 'en_sommeil') AND prochaine_action_le IS NOT NULL
      AND (CASE WHEN length(prochaine_action_le) = 10 THEN prochaine_action_le < ?${n} ELSE prochaine_action_le < ?${n + 1} END)`);
    valeurs.push(aujourdhui(), parisVersUtc(`${aujourdhui()}T00:00`) ?? '');
  }
  const ordre = filtre === 'retard' ? 'prochaine_action_le ASC' : 'last_activity_at DESC';
  const { results } = await env.DB.prepare(`SELECT ${champs} FROM contact ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY ${ordre} LIMIT ?1`)
    .bind(...valeurs).all<ResumeContact>();
  return results;
}

export interface EvenementContact { a: string; type: string; source: string; texte: string | null; par: string | null }

export interface Contact extends ResumeContact {
  passage_id: string | null; prescripteur_id: string | null; bien_ref: string | null; qualification: string | null;
  qualifie_le: string | null; reveil_le: string | null; motif_perte: string | null; rappel_individuel_seul: number; created_at: string;
  action_id: string | null;
  synthese_leedflow: string | null; synthese_leedflow_le: string | null; synthese: string | null; synthese_le: string | null;
}

export interface FicheContact {
  contact: Contact;
  historique: EvenementContact[];
  demandes: { id: string; created_at: string; source: string }[];
  passage: Passage | null;
  prescripteur: Prescripteur | null;
}

export async function lireContact(env: EnvSite, id: string): Promise<FicheContact | null> {
  const contact = await env.DB.prepare('SELECT * FROM contact WHERE id = ?1').bind(id).first<Contact>();
  if (!contact) return null;
  const [historique, demandes, passage, prescripteur] = await Promise.all([
    env.DB.prepare('SELECT a, type, source, texte, par FROM contact_evenement WHERE contact_id = ?1 ORDER BY a DESC, id DESC LIMIT 200').bind(id).all<EvenementContact>(),
    env.DB.prepare('SELECT id, created_at, source FROM lead WHERE contact_id = ?1 ORDER BY created_at DESC').bind(id).all<{ id: string; created_at: string; source: string }>(),
    contact.passage_id ? lirePassage(env, contact.passage_id) : null,
    contact.prescripteur_id ? lirePrescripteur(env, contact.prescripteur_id) : null,
  ]);
  return { contact, historique: historique.results, demandes: demandes.results, passage, prescripteur };
}

/** Une date d'échéance lisible : « 21 oct. 2026 » pour un jour seul, avec l'heure de Paris sinon. */
export function echeance(d: string | null): string {
  if (!d) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return new Date(d).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ——— Qualifier en deux minutes (story 13.6, maquette v2 écran 2) ———

/** Les cinq questions de la qualification, une touche chacune. Les réponses sont gardées en JSON sur le contact. */
export const QUESTIONS = [
  { id: 'delai', titre: 'Projet et délai', options: ['Ce mois-ci', 'Dans 3 mois', 'Dans 6 mois', 'Plus tard', 'Ne sait pas'] },
  { id: 'agence', titre: 'Déjà avec une agence ?', options: ['Non', 'Oui, sans exclusivité', 'Oui, en exclusif', 'Vend seul'] },
  { id: 'bien', titre: 'Le bien', options: ['Maison', 'Appartement', 'Terrain', 'Bord du lac', 'Hauteurs'] },
  { id: 'motif', titre: 'Pourquoi ce projet ?', options: ['Succession', 'Séparation', 'Achète plus grand', 'Retraite, départ', 'Autre'] },
  { id: 'vend_avant', titre: 'Acheteur : un bien à vendre d’abord ?', options: ['Oui', 'Non', 'Sans objet'] },
] as const;
/** Ce que cherche un acheteur (story 13.15) : gardé avec les réponses, pour la liste des acheteurs actifs. */
export const RECHERCHE_ACHETEUR = [
  { id: 'budget', titre: 'Budget' },
  { id: 'secteur', titre: 'Secteur recherché (communes)' },
] as const;
export const FINANCEMENTS = ['Vérifié', 'À vérifier', 'Après sa vente'] as const;
export type Reponses = Partial<Record<(typeof QUESTIONS)[number]['id'] | 'budget' | 'secteur' | 'financement', string>>;

export const MOTIFS_PERTE = ['Exclusif ailleurs', 'Pas de projet', 'Hors secteur', 'Veut vendre seul', 'Injoignable', 'Autre'] as const;

export type Issue =
  | { type: 'rdv'; le: string }            // date et heure ISO en UTC
  | { type: 'sommeil'; reveil: string }    // AAAA-MM-JJ
  | { type: 'perdu'; motif: string }
  | { type: 'rappel'; le: string };        // pas joint : rappeler ce jour-là (AAAA-MM-JJ)

/** Convertit une date et heure saisie à l'heure de Paris (« 2026-10-23T10:00 ») en ISO UTC. */
export function parisVersUtc(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const naif = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  // Décalage de Paris à cet instant (une ou deux heures), lu par Intl ; recalculé une fois autour du changement d'heure.
  const decalage = (t: number) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(new Date(t)).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t;
  };
  let t = naif - decalage(naif);
  t = naif - decalage(t);
  return new Date(t).toISOString();
}

/** Ajoute des jours ou des mois à aujourd'hui (heure de Paris), au format AAAA-MM-JJ. */
export function plusTard(jours: number, mois = 0): string {
  const d = new Date(`${aujourdhui()}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + mois);
  d.setUTCDate(d.getUTCDate() + jours);
  return d.toISOString().slice(0, 10);
}

/** Enregistre la qualification et son issue : l'étape et la prochaine action sont fixées, l'historique noté. */
export async function qualifier(env: EnvSite, id: string, reponses: Reponses, parcours: 'vendeur' | 'acheteur' | null, issue: Issue, par: string): Promise<boolean> {
  const c = await env.DB.prepare('SELECT etape, parcours FROM contact WHERE id = ?1').bind(id).first<{ etape: Etape; parcours: string | null }>();
  if (!c) return false;
  const p = parcours ?? (c.parcours as 'vendeur' | 'acheteur' | null);
  const maintenant = new Date().toISOString();
  let etape: Etape, action: string | null = null, le: string | null = null, reveil: string | null = null, motif: string | null = null, resume: string;
  switch (issue.type) {
    case 'rdv':
      etape = p === 'acheteur' ? 'besoin_defini' : 'premier_rdv';
      action = p === 'acheteur' ? 'Rendez-vous : définir la recherche' : 'Premier rendez-vous';
      le = issue.le;
      resume = `${action} le ${echeance(le)}`;
      break;
    case 'sommeil':
      etape = 'en_sommeil'; action = 'Réveiller : rappeler'; le = issue.reveil; reveil = issue.reveil;
      resume = `En sommeil, à réveiller le ${echeance(reveil)}`;
      break;
    case 'perdu':
      etape = 'perdu'; motif = issue.motif;
      resume = `Perdu : ${motif}`;
      break;
    case 'rappel':
      etape = c.etape === 'en_sommeil' || c.etape === 'perdu' ? 'a_qualifier' : c.etape;
      action = 'Rappeler pour qualifier (pas joint)'; le = issue.le;
      resume = `Pas joint, à rappeler le ${echeance(le)}`;
      break;
  }
  const texteReponses = [...QUESTIONS, ...RECHERCHE_ACHETEUR, { id: 'financement', titre: 'Financement' } as const]
    .filter((q) => reponses[q.id]).map((q) => `${q.titre} ${reponses[q.id]}`).join(' · ');
  const lot = [
    env.DB.prepare(
      `UPDATE contact SET last_activity_at = ?2, parcours = COALESCE(?3, parcours), etape = ?4, prochaine_action = ?5, prochaine_action_le = ?6,
         reveil_le = ?7, motif_perte = ?8, qualification = ?9, qualifie_le = CASE WHEN ?10 THEN ?2 ELSE qualifie_le END
       WHERE id = ?1`,
    ).bind(id, maintenant, parcours, etape, action, le, reveil, motif, JSON.stringify(reponses), issue.type === 'rappel' ? 0 : 1),
    evenement(env, id, maintenant, 'qualification', 'anne', texteReponses ? `${resume}\n${texteReponses}` : resume, par, { reponses, issue }),
  ];
  if (etape !== c.etape) lot.push(evenementEtape(env, id, maintenant, c.etape, etape, '', par));
  await env.DB.batch(lot);
  return true;
}

/** Corrige les réponses d'un contact déjà en cours (story 13.22) : l'étape et la prochaine action ne bougent pas. */
export async function corrigerQualification(env: EnvSite, id: string, reponses: Reponses, parcours: 'vendeur' | 'acheteur' | null, par: string): Promise<boolean> {
  const maintenant = new Date().toISOString();
  const texteReponses = [...QUESTIONS, ...RECHERCHE_ACHETEUR, { id: 'financement', titre: 'Financement' } as const]
    .filter((q) => reponses[q.id]).map((q) => `${q.titre} ${reponses[q.id]}`).join(' · ');
  const r = await env.DB.batch([
    env.DB.prepare(`UPDATE contact SET last_activity_at = ?2, parcours = COALESCE(?3, parcours), qualification = ?4, qualifie_le = ?2 WHERE id = ?1`)
      .bind(id, maintenant, parcours, JSON.stringify(reponses)),
    evenement(env, id, maintenant, 'qualification', 'anne', texteReponses ? `Qualification corrigée\n${texteReponses}` : 'Qualification corrigée', par, { reponses }),
  ]);
  return (r[0].meta.changes ?? 0) > 0;
}

// ——— Aujourd'hui (story 13.5, maquette v2 écran 1) ———

/** Un secteur est à refaire quand son dernier passage date d'au moins six semaines (réglage à revoir avec Anne). */
export const BOITAGE_A_REFAIRE_JOURS = 42;

export interface ContactDuJour extends ResumeContact { created_at: string; reveil_le: string | null; passage_secteur: string | null; passage_le: string | null; prescripteur_nom: string | null; dernier_texte: string | null }
export interface RelancePrescripteur { id: string; nom: string; role: string | null; prochaine_relance_le: string; relance_raison: string | null; dernier_contact_le: string | null }
export interface SecteurARefaire { secteur: string; dernier: string; mots: number | null; contacts: number; jours: number }

/** Fin de la journée de Paris, en ISO UTC : tout ce qui est prévu avant est dû aujourd'hui. */
function finDeJournee(): string {
  return parisVersUtc(`${plusTard(1)}T00:00`) ?? new Date().toISOString();
}

export async function journee(env: EnvSite): Promise<{ nouveaux: ContactDuJour[]; rappels: ContactDuJour[]; prescripteurs: RelancePrescripteur[]; secteurs: SecteurARefaire[] }> {
  const auj = aujourdhui();
  const fin = finDeJournee();
  // Une date seule (AAAA-MM-JJ) est due si elle est aujourd'hui ou avant ; une date et heure si elle tombe avant la fin de la journée.
  const du = `(CASE WHEN length(c.prochaine_action_le) = 10 THEN c.prochaine_action_le <= ?1 ELSE c.prochaine_action_le < ?2 END)`;
  const champs = `c.id, c.prenom, c.nom, c.telephone, c.email, c.commune, c.parcours, c.etape, c.prochaine_action, c.prochaine_action_le, c.canal,
    c.origine_detail, c.last_activity_at, c.is_test, c.created_at, c.reveil_le, p.secteur AS passage_secteur, p.fait_le AS passage_le, r.nom AS prescripteur_nom,
    (SELECT e.texte FROM contact_evenement e WHERE e.contact_id = c.id AND e.type IN ('demande', 'note', 'qualification', 'appel')
      AND json_extract(e.donnees, '$.modifies') IS NULL ORDER BY e.a DESC, e.id DESC LIMIT 1) AS dernier_texte`; // une correction de coordonnées n'est pas un « dernier texte » (13.23)
  const joints = 'FROM contact c LEFT JOIN passage_boitage p ON p.id = c.passage_id LEFT JOIN prescripteur r ON r.id = c.prescripteur_id';
  const [nouveaux, rappels, prescripteurs, secteurs] = await env.DB.batch([
    env.DB.prepare(`SELECT ${champs} ${joints} WHERE c.etape = 'a_qualifier' AND ${du} ORDER BY c.created_at ASC LIMIT 100`).bind(auj, fin),
    env.DB.prepare(`SELECT ${champs} ${joints}
      WHERE c.etape NOT IN ('a_qualifier', 'perdu', 'vendu', 'acte_signe')
        AND (${du} OR (c.etape = 'en_sommeil' AND c.reveil_le <= ?1))
      ORDER BY coalesce(c.prochaine_action_le, c.reveil_le) ASC LIMIT 100`).bind(auj, fin),
    env.DB.prepare(`SELECT id, nom, role, prochaine_relance_le, relance_raison, dernier_contact_le FROM prescripteur
      WHERE prochaine_relance_le IS NOT NULL AND prochaine_relance_le <= ?1 ORDER BY prochaine_relance_le LIMIT 50`).bind(auj),
    env.DB.prepare(`SELECT secteur, max(fait_le) AS dernier,
        (SELECT p2.mots FROM passage_boitage p2 WHERE p2.secteur = p.secteur ORDER BY p2.fait_le DESC, p2.created_at DESC LIMIT 1) AS mots,
        (SELECT count(*) FROM contact c JOIN passage_boitage p3 ON p3.id = c.passage_id WHERE p3.secteur = p.secteur
           AND p3.fait_le = (SELECT max(fait_le) FROM passage_boitage p4 WHERE p4.secteur = p.secteur)) AS contacts
      FROM passage_boitage p GROUP BY secteur HAVING max(fait_le) <= date(?1, ?2) ORDER BY dernier ASC LIMIT 10`).bind(auj, `-${BOITAGE_A_REFAIRE_JOURS} days`),
  ]);
  const jours = (d: string) => Math.round((Date.parse(`${auj}T12:00:00Z`) - Date.parse(`${d}T12:00:00Z`)) / 86_400_000);
  return {
    nouveaux: nouveaux.results as ContactDuJour[],
    rappels: rappels.results as ContactDuJour[],
    prescripteurs: prescripteurs.results as RelancePrescripteur[],
    secteurs: (secteurs.results as Omit<SecteurARefaire, 'jours'>[]).map((s) => ({ ...s, jours: jours(s.dernier) })),
  };
}

/** Temps écoulé depuis une date, comme on le dit : « il y a 2 h », « hier, 18 h », « il y a 3 jours ». */
export function depuis(iso: string, maintenant = Date.now()): string {
  const min = Math.max(0, Math.round((maintenant - Date.parse(iso)) / 60_000));
  if (min < 60) return `il y a ${min} min`;
  if (min < 12 * 60) return `il y a ${Math.round(min / 60)} h`;
  const jour = (t: number) => new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date(t));
  const heure = new Date(iso).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit' }).replace(/\s/g, ' ');
  if (jour(Date.parse(iso)) === jour(maintenant)) return `aujourd'hui, ${heure}`;
  if (jour(Date.parse(iso)) === jour(maintenant - 86_400_000)) return `hier, ${heure}`;
  const j = Math.round(min / 1440);
  return j < 14 ? `il y a ${j} jours` : `il y a ${Math.round(j / 7)} semaines`;
}

/** En retard : la prochaine action tombait avant aujourd'hui. */
export function enRetard(d: string | null): boolean {
  if (!d) return false;
  return d.length === 10 ? d < aujourdhui() : (parisVersUtc(`${aujourdhui()}T00:00`) ?? '') > d;
}

// ——— Bilan du lundi par canal (story 13.13, maquette v2 écran 4) ———

export const PERIODES = { semaine: { jours: 7, libelle: '7 derniers jours' }, mois: { jours: 28, libelle: '4 dernières semaines' }, trimestre: { jours: 91, libelle: '3 derniers mois' } } as const;
export type Periode = keyof typeof PERIODES;

const ETAPES_RDV = ['premier_rdv', 'estimation', 'second_rdv', 'mandat_exclusif', 'en_vente', 'vendu', 'besoin_defini', 'mandat_recherche', 'visites', 'offre_acceptee', 'acte_signe'];
const ETAPES_MANDAT = ['mandat_exclusif', 'en_vente', 'vendu', 'mandat_recherche', 'visites', 'offre_acceptee', 'acte_signe'];
const liste = (v: string[]) => v.map((e) => `'${e}'`).join(', ');
/** Un contact a eu un rendez-vous (ou un mandat) s'il y est passé un jour, même s'il en est sorti depuis. */
const aAtteint = (etapes: string[]) => `(c.etape IN (${liste(etapes)}) OR EXISTS (SELECT 1 FROM contact_evenement e WHERE e.contact_id = c.id AND e.type = 'etape' AND json_extract(e.donnees, '$.vers') IN (${liste(etapes)})))`;

export interface LigneCanal { canal: Canal; contacts: number; qualifies: number; rdv: number; mandats: number }
export interface SecteurBilan { secteur: string; dernier: string; mots: number | null; contacts: number; jours: number; suite: string }

export async function bilan(env: EnvSite, periode: Periode) {
  const debut = new Date(Date.now() - PERIODES[periode].jours * 86_400_000).toISOString();
  const auj = aujourdhui();
  const [canaux, delai, secteurs, perdus] = await env.DB.batch([
    env.DB.prepare(`SELECT c.canal, count(*) AS contacts, sum(c.qualifie_le IS NOT NULL) AS qualifies,
        sum(${aAtteint(ETAPES_RDV)}) AS rdv, sum(${aAtteint(ETAPES_MANDAT)}) AS mandats
      FROM contact c WHERE c.created_at >= ?1 GROUP BY c.canal`).bind(debut),
    // Délai de rappel : de l'arrivée du contact à la première tentative d'Anne (qualification, même « pas joint », ou appel
    // qu'elle a passé, relevé par Leedflow ; un appel ou un SMS reçu ne compte pas).
    env.DB.prepare(`SELECT avg((julianday(premier) - julianday(created_at)) * 24) AS heures, count(*) AS n FROM (
        SELECT c.created_at, (SELECT min(e.a) FROM contact_evenement e WHERE e.contact_id = c.id
          AND (e.type = 'qualification' OR (e.type = 'appel' AND json_extract(e.donnees, '$.sens') = 'sortant' AND json_extract(e.donnees, '$.genre') = 'appel'))) AS premier
        FROM contact c WHERE c.created_at >= ?1) WHERE premier IS NOT NULL`).bind(debut),
    env.DB.prepare(`SELECT p.secteur, p.fait_le AS dernier, p.mots, (SELECT count(*) FROM contact c WHERE c.passage_id = p.id) AS contacts
      FROM passage_boitage p WHERE p.id = (SELECT p2.id FROM passage_boitage p2 WHERE p2.secteur = p.secteur ORDER BY p2.fait_le DESC, p2.created_at DESC LIMIT 1)
      ORDER BY p.fait_le DESC LIMIT 30`),
    env.DB.prepare(`SELECT c.motif_perte AS motif, count(*) AS n FROM contact c WHERE c.etape = 'perdu'
        AND EXISTS (SELECT 1 FROM contact_evenement e WHERE e.contact_id = c.id AND e.type = 'etape' AND json_extract(e.donnees, '$.vers') = 'perdu' AND e.a >= ?1)
      GROUP BY c.motif_perte ORDER BY n DESC`).bind(debut),
  ]);
  const parCanal = new Map((canaux.results as LigneCanal[]).map((l) => [l.canal, l]));
  const lignes: LigneCanal[] = (Object.keys(CANAUX_ORIGINE) as Canal[]).map((canal) => parCanal.get(canal) ?? { canal, contacts: 0, qualifies: 0, rdv: 0, mandats: 0 })
    .sort((a, b) => b.rdv - a.rdv || b.contacts - a.contacts);
  const total = lignes.reduce((t, l) => ({ contacts: t.contacts + l.contacts, qualifies: t.qualifies + l.qualifies, rdv: t.rdv + l.rdv, mandats: t.mandats + l.mandats }), { contacts: 0, qualifies: 0, rdv: 0, mandats: 0 });
  const jours = (d: string) => Math.round((Date.parse(`${auj}T12:00:00Z`) - Date.parse(`${d}T12:00:00Z`)) / 86_400_000);
  const parSecteur: SecteurBilan[] = (secteurs.results as Omit<SecteurBilan, 'jours' | 'suite'>[]).map((s) => {
    const j = jours(s.dernier);
    const suite = j >= BOITAGE_A_REFAIRE_JOURS ? 'Repasser cette semaine'
      : s.contacts === 0 && j >= 21 ? 'Changer de secteur ?'
      : `Repasser vers le ${echeance(plusTard(BOITAGE_A_REFAIRE_JOURS - j))}`;
    return { ...s, jours: j, suite };
  });
  const d = delai.results[0] as { heures: number | null; n: number } | undefined;
  return { lignes, total, delaiHeures: d?.heures ?? null, delaiN: d?.n ?? 0, secteurs: parSecteur, perdus: perdus.results as { motif: string; n: number }[], debut };
}

/** Quelques phrases tirées des chiffres, sans rien inventer : le canal qui donne des rendez-vous, les secteurs à refaire, les pertes. */
export function constats(b: Awaited<ReturnType<typeof bilan>>): string[] {
  const phrases: string[] = [];
  const meilleur = b.lignes.find((l) => l.rdv > 0);
  if (meilleur) phrases.push(`${CANAUX_ORIGINE[meilleur.canal]} donne le plus de rendez-vous : ${meilleur.rdv} pour ${meilleur.contacts} contact(s).`);
  const sansSuite = b.lignes.filter((l) => l.contacts >= 3 && l.rdv === 0);
  for (const l of sansSuite) phrases.push(`${CANAUX_ORIGINE[l.canal]} : ${l.contacts} contacts, aucun rendez-vous pour l'instant.`);
  const nonQualifies = b.total.contacts - b.total.qualifies;
  if (nonQualifies > 0) phrases.push(`${nonQualifies} contact(s) de la période ne sont pas encore qualifiés.`);
  const aRefaire = b.secteurs.filter((s) => s.jours >= BOITAGE_A_REFAIRE_JOURS);
  if (aRefaire.length) phrases.push(`${aRefaire.map((s) => s.secteur).join(', ')} : pas de boîtage depuis ${Math.round(aRefaire[0].jours / 7)} semaines ou plus.`);
  const ailleurs = b.perdus.find((p) => p.motif === 'Exclusif ailleurs');
  if (ailleurs) phrases.push(`${ailleurs.n} perdu(s) car déjà en exclusif ailleurs : arrivés trop tard, à rapprocher du délai de rappel.`);
  return phrases;
}

/** « 3 h », « 45 min », « 2 j » */
export function duree(heures: number): string {
  if (heures < 1) return `${Math.max(1, Math.round(heures * 60))} min`;
  if (heures < 48) return `${Math.round(heures)} h`;
  return `${Math.round(heures / 24)} j`;
}

// ——— Prescripteurs (story 13.14, maquette v2 écran 5) ———

export interface PrescripteurSuivi {
  id: string; nom: string; role: string | null; commune: string | null; telephone: string | null; email: string | null; notes: string | null;
  dernier_contact_le: string | null; prochaine_relance_le: string | null; relance_raison: string | null; recommandes: number; mandats: number;
}

const champsPrescripteur = `p.id, p.nom, p.role, p.commune, p.telephone, p.email, p.notes, p.dernier_contact_le, p.prochaine_relance_le, p.relance_raison,
  (SELECT count(*) FROM contact c WHERE c.prescripteur_id = p.id AND c.created_at >= ?1) AS recommandes,
  (SELECT count(*) FROM contact c WHERE c.prescripteur_id = p.id AND ${aAtteint(ETAPES_MANDAT)}) AS mandats`;
const ilYa12Mois = () => new Date(Date.now() - 365 * 86_400_000).toISOString();

/** Les prescripteurs : relance due ou en retard d'abord, puis les autres par date de relance, ceux sans relance à la fin. */
export async function suiviPrescripteurs(env: EnvSite): Promise<PrescripteurSuivi[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${champsPrescripteur} FROM prescripteur p ORDER BY p.prochaine_relance_le IS NULL, p.prochaine_relance_le, p.nom COLLATE NOCASE LIMIT 300`,
  ).bind(ilYa12Mois()).all<PrescripteurSuivi>();
  return results;
}

export async function fichePrescripteur(env: EnvSite, id: string): Promise<{ p: PrescripteurSuivi; contacts: ResumeContact[] } | null> {
  const p = await env.DB.prepare(`SELECT ${champsPrescripteur} FROM prescripteur p WHERE p.id = ?2`).bind(ilYa12Mois(), id).first<PrescripteurSuivi>();
  if (!p) return null;
  const { results } = await env.DB.prepare(
    `SELECT id, prenom, nom, telephone, email, commune, parcours, etape, prochaine_action, prochaine_action_le, canal, origine_detail, last_activity_at, is_test
     FROM contact WHERE prescripteur_id = ?1 ORDER BY created_at DESC LIMIT 100`,
  ).bind(id).all<ResumeContact>();
  return { p, contacts: results };
}

export interface ChampsPrescripteur { nom: string; role: string | null; commune: string | null; telephone: string | null; email: string | null; notes: string | null; prochaine_relance_le: string | null; relance_raison: string | null }

/** Crée un prescripteur, ou met à jour sa fiche (id donné). */
export async function enregistrerPrescripteur(env: EnvSite, id: string | null, f: ChampsPrescripteur): Promise<string> {
  const maintenant = new Date().toISOString();
  if (id) {
    await env.DB.prepare(`UPDATE prescripteur SET last_activity_at = ?2, nom = ?3, role = ?4, commune = ?5, telephone = ?6, email = ?7, notes = ?8,
        prochaine_relance_le = ?9, relance_raison = ?10 WHERE id = ?1`)
      .bind(id, maintenant, f.nom, f.role, f.commune, f.telephone, f.email, f.notes, f.prochaine_relance_le, f.relance_raison).run();
    return id;
  }
  const nouveau = ulid();
  await env.DB.prepare(`INSERT INTO prescripteur (id, created_at, last_activity_at, nom, role, commune, telephone, email, notes, prochaine_relance_le, relance_raison)
      VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`)
    .bind(nouveau, maintenant, f.nom, f.role, f.commune, f.telephone, f.email, f.notes, f.prochaine_relance_le, f.relance_raison).run();
  return nouveau;
}

/** « Je l'ai vu ou appelé aujourd'hui » : dernier contact à aujourd'hui, et la prochaine relance avec sa raison. */
export async function noterEchangePrescripteur(env: EnvSite, id: string, relance_le: string, raison: string | null, note: string | null): Promise<boolean> {
  const r = await env.DB.prepare(`UPDATE prescripteur SET last_activity_at = ?2, dernier_contact_le = ?3, prochaine_relance_le = ?4, relance_raison = ?5,
      notes = CASE WHEN ?6 IS NULL THEN notes ELSE trim(coalesce(notes, '') || char(10) || ?3 || ' : ' || ?6) END WHERE id = ?1`)
    .bind(id, new Date().toISOString(), aujourdhui(), relance_le, raison, note).run();
  return r.meta.changes > 0;
}

// ——— Acheteurs actifs (story 13.15, maquette v2 écran 6) ———

export interface Acheteur extends ResumeContact { created_at: string; qualification: string | null }

/** Les acheteurs qualifiés qui cherchent en ce moment (ni perdus, ni en sommeil, ni passés à l'acte). */
export async function acheteursActifs(env: EnvSite): Promise<(Acheteur & { reponses: Reponses; aussiVendeur: boolean; communes: string[] })[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, prenom, nom, telephone, email, commune, parcours, etape, prochaine_action, prochaine_action_le, canal, origine_detail, last_activity_at, is_test,
       created_at, qualification
     FROM contact WHERE parcours = 'acheteur' AND qualifie_le IS NOT NULL AND etape NOT IN ('perdu', 'en_sommeil', 'acte_signe')
     ORDER BY last_activity_at DESC LIMIT 200`,
  ).all<Acheteur>();
  return results.map((a) => {
    let reponses: Reponses = {};
    try { reponses = a.qualification ? JSON.parse(a.qualification) : {}; } catch {}
    return { ...a, reponses, aussiVendeur: reponses.vend_avant === 'Oui' || reponses.financement === 'Après sa vente', communes: communesDe(reponses.secteur ?? '') };
  });
}

/** « Anthy, Sciez et Margencel » → ['anthy', 'sciez', 'margencel'] */
export function communesDe(secteur: string): string[] {
  return secteur.split(/,|;|\bet\b|\//).map((c) => c.trim().toLowerCase()).filter((c) => c.length >= 2);
}

/** Les vendeurs en sommeil de ces communes : ceux à rappeler avec « j'ai un acheteur ». */
export async function vendeursEnSommeil(env: EnvSite, communes: string[]): Promise<ResumeContact[]> {
  if (!communes.length) return [];
  const { results } = await env.DB.prepare(
    `SELECT id, prenom, nom, telephone, email, commune, parcours, etape, prochaine_action, prochaine_action_le, canal, origine_detail, last_activity_at, is_test
     FROM contact WHERE etape = 'en_sommeil' AND coalesce(parcours, 'vendeur') = 'vendeur' AND lower(commune) IN (SELECT value FROM json_each(?1))
     ORDER BY reveil_le LIMIT 100`,
  ).bind(JSON.stringify(communes)).all<ResumeContact>();
  return results;
}

// ——— Vue pipeline (story 13.16) ———

export const ETAPES_FINALES: Etape[] = ['vendu', 'acte_signe'];

/** Les contacts d'un parcours, pour les colonnes du pipeline. Les contacts sans parcours vont avec les vendeurs. Perdus : 90 derniers jours. */
export async function contactsDuPipeline(env: EnvSite, parcours: 'vendeur' | 'acheteur'): Promise<ResumeContact[]> {
  const depuis90 = new Date(Date.now() - 90 * 86_400_000).toISOString();
  const { results } = await env.DB.prepare(
    `SELECT id, prenom, nom, telephone, email, commune, parcours, etape, prochaine_action, prochaine_action_le, canal, origine_detail, last_activity_at, is_test
     FROM contact WHERE (parcours = ?1 OR (?1 = 'vendeur' AND parcours IS NULL))
       AND (etape <> 'perdu' OR last_activity_at >= ?2)
     ORDER BY coalesce(prochaine_action_le, '9999') ASC LIMIT 500`,
  ).bind(parcours, depuis90).all<ResumeContact>();
  return results;
}

export type Changement = { etape: Etape; action: string | null; le: string | null; reveil: string | null; motif: string | null };

/** Change l'étape d'un contact, avec la prochaine action exigée par la règle d'AD-20, et note le changement. */
export async function changerEtape(env: EnvSite, id: string, ch: Changement, par: string): Promise<boolean> {
  const c = await env.DB.prepare('SELECT etape FROM contact WHERE id = ?1').bind(id).first<{ etape: Etape }>();
  if (!c) return false;
  const maintenant = new Date().toISOString();
  await env.DB.batch([majEtape(env, id, maintenant, ch), evenementEtape(env, id, maintenant, c.etape, ch.etape, resumeChangement(ch), par)]);
  return true;
}

const resumeChangement = (ch: Changement) =>
  ch.etape === 'perdu' ? `motif : ${ch.motif}` : ch.etape === 'en_sommeil' ? `réveil le ${echeance(ch.reveil)}` : ch.le ? `${ch.action} · ${echeance(ch.le)}` : '';

/** Écrit l'étape et ce que la règle d'AD-20 exige avec elle. En sommeil, la prochaine action tombe le jour du réveil. */
function majEtape(env: EnvSite, id: string, maintenant: string, ch: Changement) {
  return env.DB.prepare(`UPDATE contact SET last_activity_at = ?2, etape = ?3, prochaine_action = ?4, prochaine_action_le = ?5, reveil_le = ?6, motif_perte = ?7 WHERE id = ?1`)
    .bind(id, maintenant, ch.etape, ch.action, ch.le ?? (ch.etape === 'en_sommeil' ? ch.reveil : null), ch.reveil, ch.motif);
}

/**
 * Le changement d'étape noté dans l'historique, avec l'étape quittée et l'étape atteinte en données (le bilan les lit).
 * Tous les changements d'étape passent ici (pipeline, qualification, suite) : c'est l'endroit où brancher ce qu'un
 * mandat signé déclenche (story 13.9, Modelo).
 */
function evenementEtape(env: EnvSite, id: string, maintenant: string, de: Etape, vers: Etape, suite: string, par: string) {
  return env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, texte, donnees, par) VALUES (?1, ?2, 'etape', 'anne', ?3, ?4, ?5)`)
    .bind(id, maintenant, `${LIBELLES_ETAPES[de]} → ${LIBELLES_ETAPES[vers]}${suite ? ` (${suite})` : ''}`, JSON.stringify({ de, vers }), par);
}

// ——— Noter la suite d'un contact en cours (story 13.22) ———

/** L'action qui suit d'habitude l'arrivée à une étape : préremplie dans « Noter la suite », Anne la corrige d'un mot. */
export const ACTIONS_HABITUELLES: Partial<Record<Etape, string>> = {
  a_qualifier: ACTION_QUALIFIER,
  premier_rdv: 'Premier rendez-vous',
  estimation: 'Envoyer l’estimation',
  second_rdv: 'Second rendez-vous : présenter l’estimation',
  mandat_exclusif: 'Préparer la mise en vente',
  en_vente: 'Faire le point avec le vendeur',
  besoin_defini: 'Proposer le mandat de recherche',
  mandat_recherche: 'Envoyer une sélection de biens',
  visites: 'Organiser la prochaine visite',
  offre_acceptee: 'Préparer le compromis',
};

/** Ce qui s'est passé depuis la dernière fois : l'action prévue est faite, la personne n'a pas répondu, ou juste une note. */
export const RESULTATS_SUITE = { fait: 'Fait', pas_joint: 'Pas joint', note: 'Note seule' } as const;
export type ResultatSuite = keyof typeof RESULTATS_SUITE;

/** Une suite : pour « pas joint », seul `le` compte (l'étape et l'action prévue restent) ; sinon `ch` dit la nouvelle étape. */
export type Suite = { resultat: 'pas_joint'; le: string; note: string | null } | { resultat: 'fait' | 'note'; ch: Changement; note: string | null };

/**
 * Note la suite d'un contact en cours en un seul enregistrement : étape (si elle change), prochaine action datée,
 * une ligne d'historique (« Fait : … », « Pas joint, à rappeler le … », la note) et la date de dernière activité.
 */
export async function noterSuite(env: EnvSite, id: string, s: Suite, par: string): Promise<boolean> {
  const c = await env.DB.prepare('SELECT etape, prochaine_action, prochaine_action_le FROM contact WHERE id = ?1').bind(id)
    .first<{ etape: Etape; prochaine_action: string | null; prochaine_action_le: string | null }>();
  if (!c) return false;
  const maintenant = new Date().toISOString();
  const lignes: string[] = [];
  const lot = [];
  if (s.resultat === 'pas_joint') {
    lignes.push(`Pas joint, à rappeler le ${echeance(s.le)}${c.prochaine_action ? ` (${c.prochaine_action})` : ''}`);
    lot.push(env.DB.prepare('UPDATE contact SET last_activity_at = ?2, prochaine_action_le = ?3 WHERE id = ?1').bind(id, maintenant, s.le));
  } else {
    if (s.resultat === 'fait') lignes.push(`Fait : ${c.prochaine_action ?? 'action prévue'}`);
    lot.push(majEtape(env, id, maintenant, s.ch));
    const suite = resumeChangement(s.ch);
    if (s.ch.etape !== c.etape) lot.push(evenementEtape(env, id, maintenant, c.etape, s.ch.etape, suite, par));
    else if (s.ch.le && s.ch.etape !== 'en_sommeil' && (s.ch.action !== c.prochaine_action || s.ch.le !== c.prochaine_action_le)) lignes.push(`Prochaine action : ${suite}`);
  }
  if (s.note) lignes.push(s.note);
  if (lignes.length) lot.push(evenement(env, id, maintenant, 'note', 'anne', lignes.join('\n'), par, { suite: s.resultat }));
  await env.DB.batch(lot);
  return true;
}

// ——— Fiche modifiable (story 13.23) ———

export interface Coordonnees extends Personne { parcours: 'vendeur' | 'acheteur' | null; origine: Origine }

const LIBELLES_CHAMPS: Record<string, string> = {
  prenom: 'prénom', nom: 'nom', telephone: 'téléphone', email: 'e-mail', commune: 'commune', parcours: 'parcours',
  canal: 'origine', origine_detail: 'précision d’origine', passage_id: 'passage de boîtage', prescripteur_id: 'prescripteur',
};

/**
 * Corrige les coordonnées et l'origine d'un contact. Un téléphone ou un e-mail déjà porté par un autre contact est
 * refusé (jamais de doublon, jamais de fusion silencieuse) : renvoie alors l'identifiant de cet autre contact.
 * L'historique dit quels champs ont changé, sans les anciennes valeurs.
 */
export async function modifierCoordonnees(env: EnvSite, id: string, n: Coordonnees, par: string): Promise<{ ok: true; changes: string[] } | { ok: false; conflit: string } | null> {
  const c = await env.DB.prepare('SELECT * FROM contact WHERE id = ?1').bind(id).first<Contact>();
  if (!c) return null;
  const autre = await env.DB.prepare(
    `SELECT id FROM contact WHERE id <> ?1 AND ((?2 IS NOT NULL AND telephone = ?2) OR (?3 IS NOT NULL AND email = ?3)) LIMIT 1`,
  ).bind(id, n.telephone, n.email).first<{ id: string }>();
  if (autre) return { ok: false, conflit: autre.id };
  const nouveau: Record<string, string | null> = {
    prenom: n.prenom, nom: n.nom, telephone: n.telephone, email: n.email, commune: n.commune, parcours: n.parcours,
    canal: n.origine.canal, origine_detail: n.origine.origine_detail, passage_id: n.origine.passage_id, prescripteur_id: n.origine.prescripteur_id,
  };
  const changes = Object.keys(nouveau).filter((k) => (nouveau[k] ?? null) !== ((c as unknown as Record<string, string | null>)[k] ?? null));
  if (!changes.length) return { ok: true, changes };
  const maintenant = new Date().toISOString();
  const texteEv = changes.length === 1 ? `${LIBELLES_CHAMPS[changes[0]].replace(/^./, (l) => l.toUpperCase())} modifié` : `Coordonnées modifiées : ${changes.map((k) => LIBELLES_CHAMPS[k]).join(', ')}`;
  try {
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE contact SET last_activity_at = ?2, prenom = ?3, nom = ?4, telephone = ?5, email = ?6, commune = ?7, parcours = ?8,
           canal = ?9, origine_detail = ?10, passage_id = ?11, prescripteur_id = ?12 WHERE id = ?1`,
      ).bind(id, maintenant, n.prenom, n.nom, n.telephone, n.email, n.commune, n.parcours, n.origine.canal, n.origine.origine_detail, n.origine.passage_id, n.origine.prescripteur_id),
      evenement(env, id, maintenant, 'note', 'anne', texteEv, par, { modifies: changes }),
    ]);
  } catch (e) {
    // Un autre contact a pris ce téléphone ou cet e-mail entre-temps.
    const pris = await contactConnu(env, n.telephone, n.email);
    if (pris && pris.id !== id) return { ok: false, conflit: pris.id };
    throw e;
  }
  return { ok: true, changes };
}

/** Une note libre, horodatée, rangée dans l'historique ; elle devient le « dernier texte » sur « Aujourd'hui ». */
export async function ajouterNote(env: EnvSite, id: string, note: string, par: string): Promise<boolean> {
  const maintenant = new Date().toISOString();
  const r = await env.DB.prepare('UPDATE contact SET last_activity_at = ?2 WHERE id = ?1').bind(id, maintenant).run();
  if (!r.meta.changes) return false;
  await evenement(env, id, maintenant, 'note', 'anne', note, par).run();
  return true;
}

// ——— Synthèse du contact (story 13.25) ———

/** Les rubriques de la synthèse, comme dans Leedflow : le modèle proposé pour un contact sans synthèse. */
export const MODELE_SYNTHESE = ['Qui est ce contact', 'Notre relation', 'À retenir', 'Situation actuelle', 'Échanges récents']
  .map((t) => `## ${t}\n`).join('\n');

/**
 * La synthèse à afficher : celle d'Anne si elle l'a écrite, sinon celle de Leedflow. `plusRecente` : Leedflow a changé
 * la sienne depuis qu'Anne a enregistré la sienne (la fiche propose de la reprendre).
 */
export function syntheseAffichee(c: Pick<Contact, 'synthese' | 'synthese_le' | 'synthese_leedflow' | 'synthese_leedflow_le'>) {
  if (c.synthese) return { texte: c.synthese, par: 'anne' as const, le: c.synthese_le, plusRecente: !!c.synthese_leedflow && (c.synthese_leedflow_le ?? '') > (c.synthese_le ?? '') };
  if (c.synthese_leedflow) return { texte: c.synthese_leedflow, par: 'leedflow' as const, le: c.synthese_leedflow_le, plusRecente: false };
  return null;
}

/**
 * Enregistre la synthèse d'Anne. Vide, ou identique à celle de Leedflow : la sienne est retirée et celle de Leedflow
 * reprend la main (c'est aussi « La reprendre »). Notée dans l'historique, sans le texte.
 */
export async function enregistrerSynthese(env: EnvSite, id: string, texte: string | null, par: string): Promise<boolean> {
  const c = await env.DB.prepare('SELECT synthese, synthese_leedflow FROM contact WHERE id = ?1').bind(id).first<{ synthese: string | null; synthese_leedflow: string | null }>();
  if (!c) return false;
  const propre = texte?.replace(/\r\n/g, '\n').trim() || null;
  const sienne = propre && propre !== c.synthese_leedflow?.trim() && propre !== MODELE_SYNTHESE.trim() ? propre : null;
  if (sienne === c.synthese) return true;
  const maintenant = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE contact SET synthese = ?2, synthese_le = ?3, last_activity_at = ?4 WHERE id = ?1').bind(id, sienne, sienne ? maintenant : null, maintenant),
    evenement(env, id, maintenant, 'note', 'anne', sienne ? 'Synthèse modifiée' : c.synthese_leedflow ? 'Synthèse de Leedflow reprise' : 'Synthèse effacée', par, { modifies: ['synthese'] }),
  ]);
  return true;
}
