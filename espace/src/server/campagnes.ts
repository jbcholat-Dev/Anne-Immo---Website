// Campagnes e-mail d'Anne (story 13.27, AD-21) : écrites dans l'espace, envoyées par l'adaptateur Resend du site, sans
// liste copiée ailleurs. Une campagne est un brouillon (objet, texte, bouton, filtres) ; « Envoyer » fige la liste de ses
// destinataires, en ne gardant que les contacts qui peuvent la recevoir (règle unique : accord.ts) ; la tâche planifiée
// de l'espace l'envoie ensuite par paquets, dans la limite du jour, en repassant la règle juste avant chaque e-mail.
// Expéditeur : un sous-domaine réservé aux campagnes (réglage EXPEDITEUR_CAMPAGNES), pour qu'une campagne signalée comme
// indésirable n'abîme pas les e-mails du site. Tant qu'il n'est pas posé, rien ne part en production ; sur l'aperçu, tout va
// à la boîte de test comme le reste du site. Aucun suivi d'ouverture ni de clic (AD-11) : les liens vers le site portent
// seulement les paramètres de la campagne (utm_*), que le site garde avec une demande.
import { envoyerEmail, type Email, type ResultatEnvoi } from '@site/server/adapters/email';
import logo from '@site/server/email-logo.png?inline';
import verso from './carte-ambassadeur-verso.jpg?inline';
import { CANAUX_ORIGINE, LIBELLES_ETAPES, type Canal, type Etape } from '@site/server/contacts';
import { enHtml, enTexte } from '@site/server/email-html';
import { enProduction, type EnvSite } from '@site/server/env';
import { journal } from '@site/server/journal';
import { lienDesinscriptionContact, urlSite } from '@site/server/liens';
import { ulid } from '@site/server/ulid';
import { etatEmail, peutRecevoirCampagne, RAISONS_ECART, SQL_ACCORD, type DonneesAccord } from './accord';
import { formuleAppel, JETON_FORMULE } from './categories-regles';
import { lireTableau } from './tableau';
import { indexer, preparerRecherche } from './tableau-colonnes';
import { preparerFiltre } from './vues';
import { listerVues } from './vues-base';

export type Statut = 'brouillon' | 'envoi' | 'envoyee';

export interface Filtres {
  parcours: 'vendeur' | 'acheteur' | '';
  etapes: Etape[];
  commune: string;
  canal: Canal | '';
  /** Story 18.18 : destinataires choisis un par un (cases cochées du tableau). Non vide : ces contacts, et eux seuls (accord revérifié). */
  ids: string[];
  /** Story 18.18 : identifiant d'une vue enregistrée (Contacts) ; sans `ids`, ses contacts sont les destinataires. */
  vue: string;
  /** Story 18.18 : joindre le verso de la carte ambassadeur dans le corps de l'e-mail. */
  verso: boolean;
  /** Story 18.18 : cette campagne sert de modèle (« Envoyer un modèle » du tableau, « Écrire » des fiches). */
  modele: boolean;
}

/** Au plus 2 000 destinataires choisis à la main (comme un lot du carnet). */
export const MAX_IDS = 2000;
const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;
export type ModeDestinataires = 'liste' | 'vue' | 'filtres';
export const modeDe = (f: Filtres): ModeDestinataires => (f.ids.length ? 'liste' : f.vue ? 'vue' : 'filtres');

export interface Campagne {
  id: string;
  created_at: string;
  maj_le: string;
  nom: string;
  objet: string;
  texte: string;
  bouton_libelle: string | null;
  bouton_lien: string | null;
  filtres: string;
  statut: Statut;
  lancee_le: string | null;
  finie_le: string | null;
  par: string | null;
}

export interface Compteurs { a_envoyer: number; envoye: number; echec: number; annule: number }

export const ESSAIS_MAX = 5;
/** E-mails de campagne par passage de la tâche planifiée (toutes les 10 minutes) : 8 = 48 par heure. */
const PAR_PASSAGE = 8;
/** Plafond d'e-mails par jour, site et campagnes ensemble (offre gratuite de Resend : 100 par jour). */
const QUOTA_JOUR = 90;

/** Les étapes proposées par défaut : tout contact sauf les perdus. */
export const ETAPES_PAR_DEFAUT = (Object.keys(LIBELLES_ETAPES) as Etape[]).filter((e) => e !== 'perdu');

export function lireFiltres(json: string): Filtres {
  let f: Partial<Filtres> = {};
  try { f = JSON.parse(json); } catch {}
  return {
    parcours: f.parcours === 'vendeur' || f.parcours === 'acheteur' ? f.parcours : '',
    etapes: Array.isArray(f.etapes) ? f.etapes.filter((e): e is Etape => e in LIBELLES_ETAPES) : ETAPES_PAR_DEFAUT,
    commune: typeof f.commune === 'string' ? f.commune.slice(0, 80) : '',
    canal: typeof f.canal === 'string' && f.canal in CANAUX_ORIGINE ? (f.canal as Canal) : '',
    ids: Array.isArray(f.ids) ? [...new Set(f.ids.filter((x): x is string => typeof x === 'string' && ULID.test(x)))].slice(0, MAX_IDS) : [],
    vue: typeof f.vue === 'string' && ULID.test(f.vue) ? f.vue : '',
    verso: f.verso === true,
    modele: f.modele === true,
  };
}

export async function creerCampagne(env: EnvSite, nom: string, par: string): Promise<string> {
  const id = ulid();
  const maintenant = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO campagne (id, created_at, maj_le, nom, filtres, par) VALUES (?1, ?2, ?2, ?3, ?4, ?5)`)
    .bind(id, maintenant, nom, JSON.stringify({ parcours: '', etapes: ETAPES_PAR_DEFAUT, commune: '', canal: '', ids: [], vue: '', verso: false, modele: false }), par).run();
  return id;
}

export async function lireCampagne(env: EnvSite, id: string): Promise<Campagne | null> {
  return env.DB.prepare('SELECT * FROM campagne WHERE id = ?1').bind(id).first<Campagne>();
}

export async function listerCampagnes(env: EnvSite): Promise<(Campagne & Compteurs)[]> {
  const { results } = await env.DB.prepare(
    `SELECT c.*,
       (SELECT count(*) FROM campagne_destinataire d WHERE d.campagne_id = c.id AND d.statut = 'a_envoyer') AS a_envoyer,
       (SELECT count(*) FROM campagne_destinataire d WHERE d.campagne_id = c.id AND d.statut = 'envoye') AS envoye,
       (SELECT count(*) FROM campagne_destinataire d WHERE d.campagne_id = c.id AND d.statut = 'echec') AS echec,
       (SELECT count(*) FROM campagne_destinataire d WHERE d.campagne_id = c.id AND d.statut = 'annule') AS annule
     FROM campagne c ORDER BY c.created_at DESC LIMIT 100`,
  ).all<Campagne & Compteurs>();
  return results;
}

export async function compteurs(env: EnvSite, id: string): Promise<Compteurs> {
  const { results } = await env.DB.prepare('SELECT statut, count(*) AS n FROM campagne_destinataire WHERE campagne_id = ?1 GROUP BY statut')
    .bind(id).all<{ statut: keyof Compteurs; n: number }>();
  const c: Compteurs = { a_envoyer: 0, envoye: 0, echec: 0, annule: 0 };
  for (const r of results) c[r.statut] = r.n;
  return c;
}

/** Destinataires en échec ou écartés au dernier moment, avec la raison (page d'une campagne envoyée). */
export async function nonEnvoyes(env: EnvSite, id: string): Promise<{ contact_id: string; nom: string; statut: string; erreur: string | null }[]> {
  const { results } = await env.DB.prepare(
    `SELECT d.contact_id, trim(coalesce(d.prenom, '') || ' ' || coalesce(c.nom, '')) AS nom, d.statut, d.erreur
     FROM campagne_destinataire d LEFT JOIN contact c ON c.id = d.contact_id
     WHERE d.campagne_id = ?1 AND d.statut IN ('echec', 'annule') ORDER BY nom LIMIT 200`,
  ).bind(id).all<{ contact_id: string; nom: string; statut: string; erreur: string | null }>();
  return results;
}

export interface Contenu { nom: string; objet: string; texte: string; bouton_libelle: string | null; bouton_lien: string | null; filtres: Filtres }

/** Un lien de bouton accepté : une page du site (« /diagnostic ») ou une adresse https complète. */
export const lienValable = (l: string) => /^\/[^\s]*$/.test(l) || /^https:\/\/[^\s]+$/.test(l);

/** Enregistre le brouillon. Faux si la campagne n'est plus un brouillon (déjà envoyée). */
export async function enregistrerBrouillon(env: EnvSite, id: string, c: Contenu, par: string): Promise<boolean> {
  const r = await env.DB.prepare(
    `UPDATE campagne SET nom = ?2, objet = ?3, texte = ?4, bouton_libelle = ?5, bouton_lien = ?6, filtres = ?7, maj_le = ?8, par = ?9
     WHERE id = ?1 AND statut = 'brouillon'`,
  ).bind(id, c.nom, c.objet, c.texte, c.bouton_libelle, c.bouton_lien, JSON.stringify(c.filtres), new Date().toISOString(), par).run();
  return !!r.meta.changes;
}

export async function supprimerBrouillon(env: EnvSite, id: string): Promise<boolean> {
  const r = await env.DB.prepare(`DELETE FROM campagne WHERE id = ?1 AND statut = 'brouillon'`).bind(id).run();
  return !!r.meta.changes;
}

// ——— À qui ———

export interface Personne { id: string; prenom: string | null; nom: string | null; email: string | null }

/** 1 si la catégorie du contact permet l'envoi groupé (ou s'il n'a pas de catégorie), 0 sinon (méthode de la catégorie, story 18.8). */
const SQL_ENVOI_GROUPE = `coalesce((SELECT k.envoi_groupe_permis FROM categorie k WHERE k.id = c.categorie_id), 1)`;
const RAISON_CATEGORIE = 'Catégorie sans envoi groupé';

const RAISON_ECARTE = 'Contact écarté du tableau';

/** Les contacts d'une vue enregistrée, calculés comme le tableau le fait (mêmes filtres, même recherche) ; ou le message d'erreur. */
async function idsDeVue(env: EnvSite, id: string): Promise<string[] | string> {
  const vue = (await listerVues(env)).find((v) => v.id === id);
  if (!vue) return 'Cette vue n\'existe plus : choisissez-en une autre.';
  // Une vue invalide ne garde aucun contact (revue de code 18.5) : jamais élargie en silence.
  if (vue.invalide) return `Cette vue n'est plus valable (${vue.invalide}) : corrigez-la dans Contacts.`;
  const garde = preparerFiltre(vue.filtre), cherche = vue.filtre.recherche ? preparerRecherche(vue.filtre.recherche) : null;
  return (await lireTableau(env)).filter((l) => { const x = indexer(l); return garde(l, x) && (!cherche || cherche(x)); }).map((l) => l.id);
}

export interface Selection { recoivent: Personne[]; ecartes: { raison: string; personnes: Personne[] }[]; probleme?: string }

/**
 * Les contacts que la campagne désigne (liste cochée, vue enregistrée, ou anciens filtres), partagés entre ceux qui
 * recevront la campagne et ceux écartés (par raison). Quel que soit le choix, la même règle décide (accord.ts) : un
 * contact sans accord et qui n'est pas ancien client est écarté, même coché à la main ou dans une vue.
 */
export async function selectionner(env: EnvSite, f: Filtres): Promise<Selection> {
  const mode = modeDe(f);
  const conditions: string[] = [];
  const valeurs: unknown[] = [];
  if (mode === 'liste') {
    valeurs.push(JSON.stringify(f.ids)); conditions.push('c.id IN (SELECT value FROM json_each(?1))');
  } else if (mode === 'vue') {
    const ids = await idsDeVue(env, f.vue);
    if (typeof ids === 'string') return { recoivent: [], ecartes: [], probleme: ids };
    if (!ids.length) return { recoivent: [], ecartes: [] };
    valeurs.push(JSON.stringify(ids)); conditions.push('c.id IN (SELECT value FROM json_each(?1))');
  } else {
    if (!f.etapes.length) return { recoivent: [], ecartes: [] };
    conditions.push(`c.etape IN (SELECT value FROM json_each(?1))`);
    valeurs.push(JSON.stringify(f.etapes));
    if (f.parcours) { valeurs.push(f.parcours); conditions.push(`c.parcours = ?${valeurs.length}`); }
    if (f.canal) { valeurs.push(f.canal); conditions.push(`c.canal = ?${valeurs.length}`); }
    if (f.commune.trim()) { valeurs.push(`%${f.commune.trim().toLowerCase()}%`); conditions.push(`lower(coalesce(c.commune, '')) LIKE ?${valeurs.length}`); }
  }
  const { results } = await env.DB.prepare(
    `SELECT c.id, c.prenom, c.nom, c.ecarte_le IS NOT NULL AS ecarte, ${SQL_ACCORD}, ${SQL_ENVOI_GROUPE} AS envoi_groupe FROM contact c WHERE ${conditions.join(' AND ')} ORDER BY c.nom, c.prenom LIMIT 5000`,
  ).bind(...valeurs).all<Personne & DonneesAccord & { envoi_groupe: number; ecarte: number }>();
  const recoivent: Personne[] = [];
  const parRaison = new Map<string, Personne[]>();
  for (const r of results) {
    const e = etatEmail(r);
    const p = { id: r.id, prenom: r.prenom, nom: r.nom, email: r.email };
    // Revue de code 18.8 : la méthode de la catégorie restreint (jamais n'élargit) : « pas d'envoi groupé » écarte tous ses contacts, accord ou non.
    const raison = mode !== 'filtres' && r.ecarte ? RAISON_ECARTE : !r.envoi_groupe ? RAISON_CATEGORIE : peutRecevoirCampagne(e) ? null : RAISONS_ECART[e.statut as keyof typeof RAISONS_ECART];
    if (!raison) recoivent.push(p);
    else parRaison.set(raison, [...(parRaison.get(raison) ?? []), p]);
  }
  const ecartes = [...parRaison.entries()].map(([raison, personnes]) => ({ raison, personnes }));
  return { recoivent, ecartes };
}

// ——— L'e-mail ———

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'campagne';

/** Adresse du bouton : une page du site devient une adresse complète, avec les paramètres de la campagne (AD-11). */
export function lienBouton(env: EnvSite, c: Pick<Campagne, 'nom' | 'bouton_lien'>): string | null {
  if (!c.bouton_lien) return null;
  const site = urlSite(env);
  const complet = c.bouton_lien.startsWith('/') ? `${site}${c.bouton_lien}` : c.bouton_lien;
  if (!site || !complet.startsWith(site)) return complet;
  const u = new URL(complet);
  u.searchParams.set('utm_source', 'espace');
  u.searchParams.set('utm_medium', 'email');
  u.searchParams.set('utm_campaign', slug(c.nom));
  return u.toString();
}

const PIED = 'Vous recevez cet e-mail parce que vous êtes en relation avec Anne VIAL-TISSOT, conseillère en immobilier dans le Chablais et au bord du Léman.';

/** Le verso de la carte ambassadeur, joint à l'e-mail (appelé par `cid:`) quand la campagne l'active (story 18.18). */
const CID_VERSO = 'verso-carte';
const VERSO_BASE64 = verso.slice(verso.indexOf(',') + 1);
const ALT_VERSO = 'Verso de la carte ambassadeur d\'Anne VIAL-TISSOT';

/**
 * Le Markdown de la campagne pour une personne : [Prénom] et [Formule] remplacés, bouton ajouté en dernier paragraphe.
 * `formule` (story 18.18) : « Bonjour Claire », tirée de la catégorie (`formuleAppel`) ; à défaut, celle d'un prénom.
 */
export function corps(env: EnvSite, c: Pick<Campagne, 'nom' | 'texte' | 'bouton_libelle' | 'bouton_lien'>, prenom: string | null, formule?: string): string {
  const p = (prenom ?? '').trim();
  const texte = c.texte.split(JETON_FORMULE).join(formule ?? formuleAppel(null, p, null)).replace(/\[Prénom\]/g, p).replace(/^(Bonjour|Hello) ,/m, '$1,').trim();
  const lien = lienBouton(env, c);
  return c.bouton_libelle && lien ? `${texte}\n\n[${c.bouton_libelle.replace(/[[\]]/g, '')}](${lien})` : texte;
}

/** L'e-mail tel que la personne le verra, pour l'aperçu de la page (logo et verso en images intégrées, lien de désinscription inactif). */
// Sans les polices du site : le cadre isolé de l'aperçu ne peut pas les charger, et le texte resterait invisible en les attendant.
export function apercuHtml(env: EnvSite, c: Pick<Campagne, 'nom' | 'texte' | 'bouton_libelle' | 'bouton_lien' | 'filtres'>): string {
  const image = lireFiltres(c.filtres).verso ? { src: verso, alt: ALT_VERSO } : undefined;
  return enHtml(corps(env, c, 'Marie', formuleAppel(null, 'Marie', null)), { lang: 'fr', pied: `${PIED} [Ne plus recevoir ces e-mails](#)`, image }, logo).replace(/@font-face\s*\{[^}]*\}/g, '');
}

/** Expéditeur des campagnes : le sous-domaine en production (rien ne part sans lui) ; sur l'aperçu, l'expéditeur du site à défaut. */
export function expediteur(env: EnvSite): string | null | undefined {
  const de = String((env as unknown as { EXPEDITEUR_CAMPAGNES?: string }).EXPEDITEUR_CAMPAGNES ?? '').trim();
  if (de) return de;
  return enProduction(env) ? null : undefined;
}

async function construire(env: EnvSite, c: Campagne, a: string, prenom: string | null, contactId: string | null, test: boolean, idempotence: string, formule?: string): Promise<Email | string> {
  const de = expediteur(env);
  if (de === null) return 'adresse d\'envoi des campagnes pas encore posée';
  const lien = contactId ? await lienDesinscriptionContact(env, contactId) : `${urlSite(env)}/desabonnement`;
  if (!lien) return 'LIEN_SECRET absent';
  const md = corps(env, c, prenom, formule);
  const avecVerso = lireFiltres(c.filtres).verso;
  const apercu = enTexte(md).split('\n').map((x) => x.trim()).filter((x) => x && !/^(Bonjour|Hello)\b/.test(x))[0] ?? '';
  const piedMd = `${PIED} [Ne plus recevoir ces e-mails](${lien})`;
  const unClic = lien.replace('/desabonnement?', '/api/desabonnement?');
  return {
    de, a, test, idempotence,
    objet: c.objet,
    texte: `${enTexte(md)}\n\n—\nAnne VIAL-TISSOT\nConseillère en immobilier · Chablais, Léman · réseau eXp France\nwww.annevialtissot.fr\n\n${PIED} Pour ne plus les recevoir : ${lien}`,
    html: enHtml(md, { lang: 'fr', apercu: apercu.slice(0, 140), pied: piedMd, ...(avecVerso ? { image: { src: `cid:${CID_VERSO}`, alt: ALT_VERSO } } : {}) }),
    ...(avecVerso ? { images: [{ id: CID_VERSO, nom: 'carte-ambassadeur-verso.jpg', base64: VERSO_BASE64, type: 'image/jpeg' }] } : {}),
    repondreA: env.BOITE_ANNE ?? undefined,
    ...(contactId ? { entetes: { 'List-Unsubscribe': `<${unClic}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
  };
}

/** Envoie la campagne telle qu'elle est à l'adresse de la personne connectée (sur l'aperçu, à la boîte de test). */
export async function envoyerEssai(env: EnvSite, c: Campagne, a: string): Promise<ResultatEnvoi> {
  const e = await construire(env, { ...c, objet: `[ESSAI] ${c.objet}` }, a, 'Anne', null, !enProduction(env), `campagne-essai:${c.id}:${Date.now()}`, formuleAppel(null, 'Anne', null));
  return typeof e === 'string' ? { ok: false, erreur: e } : envoyerEmail(env, e);
}

/** « Envoyer » : fige les destinataires et passe la campagne en envoi. Le message d'erreur, ou le nombre de destinataires. */
export async function lancer(env: EnvSite, id: string, par: string): Promise<{ n: number } | string> {
  const c = await lireCampagne(env, id);
  if (!c || c.statut !== 'brouillon') return 'Cette campagne est déjà partie.';
  if (!c.objet.trim() || !c.texte.trim()) return 'Écrivez l\'objet et le texte avant d\'envoyer.';
  if (expediteur(env) === null) return 'L\'adresse d\'envoi des campagnes n\'est pas encore posée : demandez à Jean-Baptiste (RUNBOOK).';
  const { recoivent, probleme } = await selectionner(env, lireFiltres(c.filtres));
  if (probleme) return probleme;
  if (!recoivent.length) return 'Personne ne peut recevoir cette campagne avec ces filtres.';
  const maintenant = new Date().toISOString();
  const pris = await env.DB.prepare(`UPDATE campagne SET statut = 'envoi', lancee_le = ?2, maj_le = ?2, par = ?3 WHERE id = ?1 AND statut = 'brouillon'`)
    .bind(id, maintenant, par).run();
  if (!pris.meta.changes) return 'Cette campagne est déjà partie.';
  for (let i = 0; i < recoivent.length; i += 50) {
    await env.DB.batch(recoivent.slice(i, i + 50).map((p) => env.DB.prepare(
      `INSERT OR IGNORE INTO campagne_destinataire (campagne_id, contact_id, email, prenom, prochain_essai) VALUES (?1, ?2, ?3, ?4, ?5)`,
    ).bind(id, p.id, p.email, p.prenom, maintenant)));
  }
  journal('campagne_lancee', { campagne: id, destinataires: recoivent.length });
  return { n: recoivent.length };
}

// ——— Envoi par paquets (tâche planifiée de l'espace) ———

const entier = (v: unknown, defaut: number) => { const n = Number(v); return Number.isInteger(n) && n > 0 ? n : defaut; };

/** E-mails déjà partis aujourd'hui (UTC, comme le compteur de Resend) : ceux du site et ceux des campagnes. */
async function partisAujourdhui(env: EnvSite): Promise<number> {
  const debut = `${new Date().toISOString().slice(0, 10)}T00:00:00`;
  const r = await env.DB.prepare(
    `SELECT (SELECT count(*) FROM lead_delivery WHERE status = 'delivered' AND delivered_at >= ?1)
          + (SELECT count(*) FROM campagne_destinataire WHERE statut = 'envoye' AND envoye_le >= ?1) AS n`,
  ).bind(debut).first<{ n: number }>();
  return r?.n ?? 0;
}

interface ADestinataire { campagne_id: string; contact_id: string; email: string; prenom: string | null; essais: number; is_test: number }

/** Un passage : envoie au plus un paquet, en repassant la règle d'accord juste avant chaque e-mail. Renvoie le nombre envoyé. */
export async function envoyerCampagnes(env: EnvSite): Promise<number> {
  if (!env.RESEND_API_KEY) return 0;
  const reglages = env as unknown as { CAMPAGNE_PAR_PASSAGE?: string; CAMPAGNE_QUOTA_JOUR?: string };
  const place = entier(reglages.CAMPAGNE_QUOTA_JOUR, QUOTA_JOUR) - (await partisAujourdhui(env));
  const n = Math.min(entier(reglages.CAMPAGNE_PAR_PASSAGE, PAR_PASSAGE), place);
  let envoyes = 0;
  if (n > 0 && expediteur(env) !== null) {
    const maintenant = new Date().toISOString();
    const { results } = await env.DB.prepare(
      `SELECT d.campagne_id, d.contact_id, d.email, d.prenom, d.essais, coalesce(c.is_test, 0) AS is_test
       FROM campagne_destinataire d JOIN campagne k ON k.id = d.campagne_id LEFT JOIN contact c ON c.id = d.contact_id
       WHERE d.statut = 'a_envoyer' AND d.prochain_essai <= ?1 AND k.statut = 'envoi'
       ORDER BY k.lancee_le, d.rowid LIMIT ?2`,
    ).bind(maintenant, n).all<ADestinataire>();
    const campagnes = new Map<string, Campagne | null>();
    for (const d of results) {
      if (!campagnes.has(d.campagne_id)) campagnes.set(d.campagne_id, await lireCampagne(env, d.campagne_id));
      const c = campagnes.get(d.campagne_id);
      if (c && await envoyerA(env, c, d)) envoyes++;
    }
  }
  await env.DB.prepare(
    `UPDATE campagne SET statut = 'envoyee', finie_le = ?1 WHERE statut = 'envoi'
     AND NOT EXISTS (SELECT 1 FROM campagne_destinataire d WHERE d.campagne_id = campagne.id AND d.statut = 'a_envoyer')`,
  ).bind(new Date().toISOString()).run();
  if (envoyes) journal('campagnes_envoi', { envoyes });
  return envoyes;
}

async function envoyerA(env: EnvSite, c: Campagne, d: ADestinataire): Promise<boolean> {
  const ici = 'WHERE campagne_id = ?1 AND contact_id = ?2';
  // La personne a pu se désinscrire, perdre son accord ou changer d'adresse depuis le lancement.
  // Revue de code 18.8 : ou être passée dans une catégorie sans envoi groupé.
  const accord = await env.DB.prepare(`SELECT ${SQL_ACCORD}, ${SQL_ENVOI_GROUPE} AS envoi_groupe, c.nom, c.categorie_id, c.ecarte_le IS NOT NULL AS ecarte FROM contact c WHERE c.id = ?1`).bind(d.contact_id).first<DonneesAccord & { envoi_groupe: number; nom: string | null; categorie_id: string | null; ecarte: number }>();
  // Story 18.18 : pour une liste cochée ou une vue, un contact écarté du tableau depuis le lancement ne reçoit plus rien.
  const ecarte = !!accord?.ecarte && modeDe(lireFiltres(c.filtres)) !== 'filtres';
  const etat = accord ? etatEmail(accord) : null;
  if (!accord || !etat || ecarte || !accord.envoi_groupe || !peutRecevoirCampagne(etat) || accord.email !== d.email) {
    const raison = !accord || !etat ? 'contact effacé' : ecarte ? RAISON_ECARTE.toLowerCase() : !accord.envoi_groupe ? RAISON_CATEGORIE.toLowerCase() : etat.statut !== 'accord' && etat.statut !== 'client' ? RAISONS_ECART[etat.statut].toLowerCase() : 'adresse changée';
    await env.DB.prepare(`UPDATE campagne_destinataire SET statut = 'annule', erreur = ?3 ${ici}`).bind(d.campagne_id, d.contact_id, raison).run();
    return false;
  }
  // Réservation : un seul passage envoie cet e-mail, même si deux tâches se chevauchent.
  const maintenant = new Date();
  const reserve = await env.DB.prepare(
    `UPDATE campagne_destinataire SET essais = essais + 1, prochain_essai = ?4 ${ici} AND essais = ?3 AND statut = 'a_envoyer'`,
  ).bind(d.campagne_id, d.contact_id, d.essais, new Date(maintenant.getTime() + 15 * 60_000).toISOString()).run();
  if (reserve.meta.changes !== 1) return false;
  const test = d.is_test === 1 || !enProduction(env);
  const e = await construire(env, c, d.email, d.prenom, d.contact_id, test, `campagne:${c.id}:${d.contact_id}`, formuleAppel(accord.categorie_id, d.prenom, accord.nom));
  const r: ResultatEnvoi = typeof e === 'string' ? { ok: false, erreur: e } : await envoyerEmail(env, e);
  if (r.ok) {
    const a = new Date().toISOString();
    // Story 18.18 : l'e-mail parti met à jour le dernier contact (date du jour, canal e-mail) et laisse une trace lisible sur la fiche,
    // avec l'avant-image du dernier contact (AD-29). `envoi_modele` : marque l'état « Contacté » des ambassadeurs. Ce n'est pas un échange :
    // `last_activity_at` ne bouge pas.
    await env.DB.batch([
      env.DB.prepare(`UPDATE campagne_destinataire SET statut = 'envoye', envoye_le = ?3, erreur = NULL ${ici}`).bind(d.campagne_id, d.contact_id, a),
      env.DB.prepare(
        `INSERT OR IGNORE INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees, par)
         SELECT id, ?2, 'email', 'anne', ?3, ?4,
           json_object('avant', json_object('dernier_contact_le', dernier_contact_le, 'dernier_contact_canal', dernier_contact_canal),
             'apres', json_object('dernier_contact_le', ?2, 'dernier_contact_canal', 'email'), 'campagne', ?5, 'envoi_modele', ?6), ?7
         FROM contact WHERE id = ?1`,
      ).bind(d.contact_id, a, `campagne:${c.id}:${d.contact_id}`, `Campagne « ${c.nom} » envoyée : ${c.objet}`, c.id, c.nom, c.par),
      env.DB.prepare(`UPDATE contact SET dernier_contact_le = ?2, dernier_contact_canal = 'email' WHERE id = ?1 AND (dernier_contact_le IS NULL OR dernier_contact_le <= ?2)`)
        .bind(d.contact_id, a),
    ]);
    return true;
  }
  const fin = d.essais + 1 >= ESSAIS_MAX;
  await env.DB.prepare(`UPDATE campagne_destinataire SET statut = ?3, erreur = ?4 ${ici}`)
    .bind(d.campagne_id, d.contact_id, fin ? 'echec' : 'a_envoyer', r.erreur.slice(0, 300)).run();
  journal('campagne_echec', { campagne: c.id, detail: r.erreur.slice(0, 200) });
  return false;
}

// ——— Modèles : « Envoyer un modèle » du tableau et « Écrire » de la fiche (story 18.18) ———

export interface Modele { id: string; nom: string; objet: string; statut: Statut; verso: boolean }

/** Les campagnes marquées « modèle », la plus récente d'abord (brouillon gardé pour resservir, ou campagne déjà partie). */
export async function listerModeles(env: EnvSite): Promise<Modele[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, nom, objet, statut, filtres FROM campagne WHERE CASE WHEN json_valid(filtres) THEN json_extract(filtres, '$.modele') END = 1 ORDER BY created_at DESC LIMIT 30`,
  ).all<{ id: string; nom: string; objet: string; statut: Statut; filtres: string }>();
  return results.map((r) => ({ id: r.id, nom: r.nom, objet: r.objet, statut: r.statut, verso: lireFiltres(r.filtres).verso }));
}

/**
 * Prépare une campagne à partir d'un modèle (ou vide) pour des contacts cochés ou une vue : un brouillon neuf, que la page
 * de la campagne fait relire, essayer et envoyer. La règle d'accord s'applique à l'envoi comme à toute campagne.
 * Renvoie l'identifiant, ou le message d'erreur.
 */
export async function creerDepuisModele(env: EnvSite, d: { modele?: string; ids?: string[]; vue?: string }, par: string): Promise<string | { erreur: string }> {
  const ids = [...new Set((d.ids ?? []).filter((x) => ULID.test(x)))].slice(0, MAX_IDS);
  const vue = d.vue && ULID.test(d.vue) ? d.vue : '';
  if (!ids.length && !vue) return { erreur: 'Aucun contact choisi.' };
  let base: Campagne | null = null;
  if (d.modele) {
    base = await lireCampagne(env, d.modele);
    if (!base || !lireFiltres(base.filtres).modele) return { erreur: 'Ce modèle n\'existe plus.' };
  }
  const id = ulid();
  const maintenant = new Date().toISOString();
  const jour = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'long' }).format(new Date());
  const filtres = { parcours: '', etapes: ETAPES_PAR_DEFAUT, commune: '', canal: '', ids: ids.length ? ids : [], vue: ids.length ? '' : vue, verso: base ? lireFiltres(base.filtres).verso : false, modele: false };
  await env.DB.prepare(
    `INSERT INTO campagne (id, created_at, maj_le, nom, objet, texte, bouton_libelle, bouton_lien, filtres, par) VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
  ).bind(id, maintenant, `${base ? base.nom : 'Envoi'} · ${jour}`.slice(0, 120), base?.objet ?? '', base?.texte ?? '', base?.bouton_libelle ?? null, base?.bouton_lien ?? null, JSON.stringify(filtres), par).run();
  return id;
}

/** Signature ajoutée au texte d'un message écrit à la main (celle des e-mails de campagne, en texte). */
const SIGNATURE_TEXTE = 'Anne VIAL-TISSOT\nConseillère en immobilier · Chablais, Léman · réseau eXp France\nwww.annevialtissot.fr';

/** L'objet et le texte d'un modèle pour un contact, formule remplie, prêts pour un `mailto:` ; ou le message d'erreur. */
export async function ecritureAMain(env: EnvSite, modeleId: string, contactId: string): Promise<{ a: string; objet: string; texte: string; modele: string } | { erreur: string }> {
  const c = await lireCampagne(env, modeleId);
  if (!c || !lireFiltres(c.filtres).modele) return { erreur: 'Ce modèle n\'existe plus.' };
  const k = await env.DB.prepare('SELECT prenom, nom, email, categorie_id FROM contact WHERE id = ?1').bind(contactId)
    .first<{ prenom: string | null; nom: string | null; email: string | null; categorie_id: string | null }>();
  if (!k) return { erreur: 'Contact inconnu.' };
  if (!k.email) return { erreur: 'Ce contact n\'a pas d\'adresse e-mail.' };
  const md = corps(env, c, k.prenom, formuleAppel(k.categorie_id, k.prenom, k.nom));
  return { a: k.email, objet: c.objet, texte: `${enTexte(md)}\n\n${SIGNATURE_TEXTE}`, modele: c.nom };
}
