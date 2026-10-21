// Écrivain des contacts de l'espace d'Anne (AD-20, CAP-12 v7). Le site n'écrit dans ces tables que par le rattachement
// d'une demande (site/src/server/contacts.ts) ; tout le reste passe ici : saisie à la main, passages de boîtage,
// prescripteurs et import d'une liste (story 13.7). Une personne n'existe qu'une fois : même téléphone E.164 ou même
// e-mail = même contact, qui est complété, jamais recréé. Chaque création est notée dans l'historique avec le compte
// qui a agi. La règle des prochaines actions est tenue par la base (CHECK de la migration 0007).
import type { EnvSite } from '@site/server/env';
import { ACTION_QUALIFIER, CANAUX_ORIGINE, type Canal, type Etape } from '@site/server/contacts';
import { e164, emailValide } from '@site/server/schema';
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

function evenement(env: EnvSite, contactId: string, a: string, type: 'creation' | 'note', source: 'anne' | 'import', texteEv: string, par: string, donnees?: unknown) {
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

/** Passage de boîtage : un secteur, une date, un nombre de mots déposés. */
export async function noterPassage(env: EnvSite, secteur: string, fait_le: string, mots: number | null): Promise<string> {
  const id = ulid();
  await env.DB.prepare('INSERT INTO passage_boitage (id, created_at, secteur, fait_le, mots) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(id, new Date().toISOString(), secteur, fait_le, mots).run();
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

export async function listerContacts(env: EnvSite, q = '', limite = 200): Promise<ResumeContact[]> {
  const r = q.trim().toLowerCase().replace(/[%_]/g, '');
  const chiffres = r.replace(/[\s.\-()]/g, '');
  const tel = /^0\d{9}$/.test(chiffres) ? `%+33${chiffres.slice(1)}%` : /^\+?\d{4,}$/.test(chiffres) ? `%${chiffres}%` : `%${r}%`;
  const champs = 'id, prenom, nom, telephone, email, commune, parcours, etape, prochaine_action, prochaine_action_le, canal, origine_detail, last_activity_at, is_test';
  const requete = r
    ? env.DB.prepare(`SELECT ${champs} FROM contact WHERE lower(coalesce(nom, '')) LIKE ?2 OR lower(coalesce(prenom, '')) LIKE ?2
        OR coalesce(email, '') LIKE ?2 OR coalesce(telephone, '') LIKE ?3 OR lower(coalesce(commune, '')) LIKE ?2
        ORDER BY last_activity_at DESC LIMIT ?1`).bind(limite, `%${r}%`, tel)
    : env.DB.prepare(`SELECT ${champs} FROM contact ORDER BY last_activity_at DESC LIMIT ?1`).bind(limite);
  return (await requete.all<ResumeContact>()).results;
}

export interface EvenementContact { a: string; type: string; source: string; texte: string | null; par: string | null }

export interface Contact extends ResumeContact {
  passage_id: string | null; prescripteur_id: string | null; bien_ref: string | null; qualification: string | null;
  qualifie_le: string | null; reveil_le: string | null; motif_perte: string | null; rappel_individuel_seul: number; created_at: string;
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
