// Le carnet (story 18.6, FR-4, FR-5, AD-22, AD-24, AD-29, AD-31) : seul module qui écrit le classement d'un contact,
// c'est-à-dire sa catégorie, son projet, sa température, « vérifié » (`verifie_le`) et « écarté » (`ecarte_le`).
// Il ne touche jamais aux colonnes du suivi des ventes (`etape`, `prochaine_action*`, `parcours`… : `pipeline`), ni à
// l'accord e-mail (`accord`). Story 18.7 : la fiche d'un contact (coordonnées, appel autorisé, à rappeler le), la note, la
// création à la main, et le dernier contact (`dernier_contact_*`), écrit seulement par `noterContact` (AD-28 amendé).
// Chaque écriture est un lot : toutes les lignes changent en une seule exécution D1 (`batch`, une transaction), et chaque
// contact touché reçoit un `contact_evenement` de type `classement` qui garde son avant-image :
// `donnees` = { avant: {colonne: valeur}, apres: {colonne: valeur}, lot } (AD-29), `source_id` = « lot.contact » (index
// unique déjà présent, qui sert aussi à retrouver un lot pour l'annuler). Annuler un lot réécrit `avant` par ce module,
// pour les seuls contacts qui n'ont reçu aucun événement depuis le lot (sinon une écriture plus récente l'emporte, AD-29).
// Revue de code 18.6 : chaque écriture n'a lieu que si le contact est encore tel qu'il a été lu ; un classement ne fait
// pas avancer `last_activity_at` (ce n'est pas un échange, AD-22 amendé).
// Règles (PRD FR-4, AD-24) : choisir une catégorie la confirme (vérifié) ; un projet sans température (à qualifier,
// ambassadeur) ou incompatible efface la température ; « avec Anne » et « terminé » ne se choisissent jamais ici (ils
// viennent du suivi des ventes) ; un contact suivi (étape autre que perdu ou en sommeil) garde la température que le suivi
// lui donne, et reçoit « avec Anne » (« terminé » s'il est vendu ou acté) quand son projet devient connu.
// Les CHECK de la migration 0018 restent le dernier filet : une combinaison refusée fait échouer tout le lot.
// Jamais appelé par les routes /api/claude/… (Claude ne lit ni n'écrit les contacts, AD-26), à une exception près : les
// écritures d'un import (`ecrireImport`, `annulerImport`, story 18.9), appelées seulement par `server/import`, lui-même
// appelé seulement par /api/claude/import, et qui ne renvoient que des compteurs et des repères de lignes du fichier.
import type { EnvSite } from '@site/server/env';
import { ulid } from '@site/server/ulid';
import { trouver } from '@site/server/contacts';
import { empreinteOpposition } from '@site/server/opposition';
import { e164, emailValide } from '@site/server/schema';
import { journal } from '@site/server/journal';
import { accordImport, noterAccord, retraitAccordImport, retraitAccordNote } from './accord';
import { PROJETS, PROJETS_DU_SUIVI, TEMPERATURES_CHOIX, suiviEnCours, temperaturePermise } from './tableau-colonnes';

/** Au plus 2 000 contacts par lot (le classement de départ se fait par vues de quelques centaines). */
export const MAX_LOT = 2000;

const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const ID_CATEGORIE = /^(?:[a-z_]{1,40}|[0-9A-HJKMNP-TV-Z]{26})$/;

/** Ce qu'un lot change ; une clé absente ne change rien. `temperature: null` efface la température. */
export interface Changements {
  categorie_id?: string;
  projet?: string;
  temperature?: string | null;
  /** true : marquer vérifié ; false : remettre « à vérifier ». */
  verifie?: boolean;
  /** true : écarter ; false : faire revenir. */
  ecarte?: boolean;
  /** Interne (story 18.15, retrait d'une catégorie) : changer la catégorie sans marquer vérifié. Jamais lu de l'API. */
  sansVerifier?: boolean;
}

/** Les colonnes de classement, telles qu'en base. */
interface Classement { categorie_id: string | null; projet: string; temperature: string | null; verifie_le: string | null; ecarte_le: string | null }
type Colonne = keyof Classement;
const COLONNES: Colonne[] = ['categorie_id', 'projet', 'temperature', 'verifie_le', 'ecarte_le'];
interface Etat extends Classement { id: string; etape: string | null }

/** Lit la liste des identifiants : 1 à 2 000 ULID, doublons retirés ; ou le message d'erreur. */
export function lireIds(brut: unknown): string[] | string {
  if (!Array.isArray(brut) || !brut.length) return 'Cochez au moins un contact.';
  if (brut.length > MAX_LOT) return `Au plus ${MAX_LOT} contacts à la fois.`;
  if (!brut.every((x) => typeof x === 'string' && ULID.test(x))) return 'Identifiant de contact invalide.';
  return [...new Set(brut as string[])];
}

/** Lit les changements demandés, dans le vocabulaire fermé ; ou le message d'erreur (400). */
export function lireChangements(brut: unknown, categories: ReadonlySet<string>): Changements | string {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return 'Changements attendus.';
  const ch: Changements = {};
  for (const [cle, v] of Object.entries(brut as Record<string, unknown>)) {
    switch (cle) {
      case 'categorie_id':
        if (typeof v !== 'string' || !ID_CATEGORIE.test(v) || !categories.has(v)) return 'Catégorie inconnue.';
        ch.categorie_id = v; break;
      case 'projet':
        if (typeof v !== 'string' || !Object.prototype.hasOwnProperty.call(PROJETS, v)) return 'Projet inconnu.';
        ch.projet = v; break;
      case 'temperature':
        if (v !== null && !(typeof v === 'string' && (TEMPERATURES_CHOIX as readonly string[]).includes(v))) return 'Température inconnue ou réservée au suivi des ventes.';
        ch.temperature = v as string | null; break;
      case 'verifie': case 'ecarte':
        if (typeof v !== 'boolean') return `${cle} : vrai ou faux attendu.`;
        ch[cle] = v; break;
      default: return `Changement inconnu : ${cle.slice(0, 40)}`;
    }
  }
  if (!Object.keys(ch).length) return 'Aucun changement demandé.';
  return ch;
}

/**
 * Le classement d'un contact après les changements, selon les règles de FR-4 et d'AD-24. `ignore` : la température
 * demandée ne s'applique pas à ce contact (projet sans température ou incompatible, ou contact suivi).
 */
export function appliquer(e: Etat, ch: Changements, maintenant: string): { apres: Classement; ignore: boolean } {
  const a: Classement = { categorie_id: e.categorie_id, projet: e.projet, temperature: e.temperature, verifie_le: e.verifie_le, ecarte_le: e.ecarte_le };
  let ignore = false;
  if (ch.categorie_id !== undefined) { a.categorie_id = ch.categorie_id; if (!ch.sansVerifier) a.verifie_le ??= maintenant; }
  if (ch.verifie !== undefined) a.verifie_le = ch.verifie ? a.verifie_le ?? maintenant : null;
  if (ch.ecarte !== undefined) a.ecarte_le = ch.ecarte ? a.ecarte_le ?? maintenant : null;
  if (ch.projet !== undefined) {
    a.projet = ch.projet;
    if (!temperaturePermise(a.temperature, a.projet)) a.temperature = null;
    if (suiviEnCours(e.etape) && PROJETS_DU_SUIVI.includes(a.projet) && a.temperature === null) {
      a.temperature = e.etape === 'vendu' || e.etape === 'acte_signe' ? 'termine' : 'avec_anne';
    }
  }
  if (ch.temperature !== undefined) {
    if (suiviEnCours(e.etape) || !temperaturePermise(ch.temperature, a.projet)) ignore = true;
    else a.temperature = ch.temperature;
  }
  return { apres: a, ignore };
}

/** Une ligne du tableau après écriture : de quoi la page se met à jour sans recharger. */
export interface LigneClassee { id: string; categorie_id: string | null; categorie: string | null; projet: string; temperature: string | null; verifie: boolean; ecarte: boolean }

/** `garde` : `etape` et les colonnes telles que lues avant le lot ; l'écriture n'a lieu que si le contact n'a pas changé depuis. */
interface Ecriture { id: string; avant: Partial<Classement>; apres: Partial<Classement>; garde: Partial<Classement> & { etape: string | null } }

/**
 * Écrit un lot en une seule exécution D1 (revue de code 18.6) : d'abord un événement par contact encore tel qu'il a été lu
 * (`etape` et colonnes de `garde`) et dont la catégorie écrite existe toujours ; puis les colonnes de `apres`, seulement
 * pour les contacts qui ont reçu leur événement. Un contact changé ou effacé entre la lecture et l'écriture, ou une
 * catégorie supprimée entre-temps, n'est donc ni écrit ni cause d'échec du lot. Pas de `last_activity_at` : un classement
 * n'est pas un échange avec la personne (AD-22 amendé). Renvoie les identifiants réellement écrits.
 */
async function ecrire(env: EnvSite, ecritures: Ecriture[], lot: string, par: string, texte: string, annule?: string, extra: Record<string, string> = {}): Promise<string[]> {
  if (!ecritures.length) return [];
  const maintenant = new Date().toISOString();
  const set = COLONNES.map((c) => `${c} = CASE WHEN json_type(j.value, '$.apres.${c}') IS NULL THEN contact.${c} ELSE json_extract(j.value, '$.apres.${c}') END`).join(', ');
  const garde = [...COLONNES, 'etape'].map((c) => `(json_type(j.value, '$.garde.${c}') IS NULL OR c.${c} IS json_extract(j.value, '$.garde.${c}'))`).join(' AND ');
  const charge = JSON.stringify(ecritures.map((x) => ({
    id: x.id, apres: x.apres, garde: x.garde, donnees: JSON.stringify({ avant: x.avant, apres: x.apres, lot, ...(annule ? { annule } : {}), ...extra }),
  })));
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees, par)
       SELECT c.id, ?2, 'classement', 'anne', ?3 || '.' || c.id, ?4, json_extract(j.value, '$.donnees'), ?5
       FROM json_each(?1) AS j JOIN contact c ON c.id = json_extract(j.value, '$.id')
       WHERE ${garde}
         AND (json_type(j.value, '$.apres.categorie_id') IS NOT 'text' OR EXISTS (SELECT 1 FROM categorie k WHERE k.id = json_extract(j.value, '$.apres.categorie_id')))`)
      .bind(charge, maintenant, lot, texte, par),
    // Une boucle sur le lot, chaque contact trouvé par sa clé (plan vérifié : pas de parcours de toute la table).
    env.DB.prepare(`UPDATE contact SET ${set} FROM json_each(?1) AS j WHERE contact.id = json_extract(j.value, '$.id')
       AND EXISTS (SELECT 1 FROM contact_evenement e WHERE e.source = 'anne' AND e.source_id = ?2 || '.' || contact.id)`)
      .bind(charge, lot),
  ]);
  return (await env.DB.prepare(`SELECT contact_id FROM contact_evenement WHERE source = 'anne' AND source_id > ?1 AND source_id < ?2`)
    .bind(`${lot}.`, `${lot}/`).all<{ contact_id: string }>()).results.map((x) => x.contact_id);
}

/** Parmi des contacts non écrits, ceux qui n'existent plus (effacés entre la lecture et l'écriture). */
async function effaces(env: EnvSite, ids: string[]): Promise<number> {
  if (!ids.length) return 0;
  const r = await env.DB.prepare('SELECT count(*) AS n FROM contact WHERE id IN (SELECT value FROM json_each(?1))').bind(JSON.stringify(ids)).first<{ n: number }>();
  return ids.length - (r?.n ?? 0);
}

async function lireEtats(env: EnvSite, ids: string[]): Promise<Etat[]> {
  return (await env.DB.prepare(
    `SELECT id, categorie_id, projet, temperature, verifie_le, ecarte_le, etape FROM contact WHERE id IN (SELECT value FROM json_each(?1))`,
  ).bind(JSON.stringify(ids)).all<Etat>()).results;
}

async function lignes(env: EnvSite, ids: string[]): Promise<LigneClassee[]> {
  if (!ids.length) return [];
  const r = await env.DB.prepare(
    `SELECT c.id, c.categorie_id, k.nom AS categorie, c.projet, c.temperature, c.verifie_le, c.ecarte_le
     FROM contact c LEFT JOIN categorie k ON k.id = c.categorie_id WHERE c.id IN (SELECT value FROM json_each(?1))`,
  ).bind(JSON.stringify(ids)).all<Classement & { id: string; categorie: string | null }>();
  return r.results.map((c) => ({ id: c.id, categorie_id: c.categorie_id, categorie: c.categorie, projet: c.projet, temperature: c.temperature, verifie: !!c.verifie_le, ecarte: !!c.ecarte_le }));
}

/** Résumé lisible d'un lot, gardé dans l'historique du contact. */
function resume(ch: Changements): string {
  const p: string[] = [];
  if (ch.categorie_id !== undefined) p.push('catégorie');
  if (ch.projet !== undefined) p.push('projet');
  if (ch.temperature !== undefined) p.push('température');
  if (ch.verifie !== undefined) p.push(ch.verifie ? 'vérifié' : 'à vérifier');
  if (ch.ecarte !== undefined) p.push(ch.ecarte ? 'écarté' : 'revenu');
  return `Classement : ${p.join(', ')}`;
}

export interface ResultatLot { lot: string | null; touches: number; ignores: number; inchanges: number; inconnus: number; lignes: LigneClassee[] }

/**
 * Classe un lot de contacts. `touches` : contacts réellement changés (chacun a son événement) ; `ignores` : température
 * qui ne s'applique pas, ou contact changé entre la lecture et l'écriture (revue de code 18.6) ; `inchanges` : déjà dans
 * l'état demandé ; `inconnus` : identifiants absents (effacés, même entre la lecture et l'écriture).
 */
export async function classer(env: EnvSite, ids: string[], ch: Changements, par: string, extra: Record<string, string> = {}): Promise<ResultatLot> {
  const etats = await lireEtats(env, ids);
  const maintenant = new Date().toISOString();
  const lot = ulid();
  const ecritures: Ecriture[] = [];
  let ignores = 0;
  for (const e of etats) {
    const { apres, ignore } = appliquer(e, ch, maintenant);
    if (ignore) ignores++;
    const x: Ecriture = { id: e.id, avant: {}, apres: {}, garde: { etape: e.etape } };
    for (const c of COLONNES) {
      if (apres[c] !== e[c]) { (x.avant as Record<string, unknown>)[c] = e[c]; (x.apres as Record<string, unknown>)[c] = apres[c]; (x.garde as Record<string, unknown>)[c] = e[c]; }
    }
    // Revue de code 18.7 : projet et température se gardent ensemble (le CHECK de 0018 les lie).
    if ('projet' in x.apres || 'temperature' in x.apres) Object.assign(x.garde, { projet: e.projet, temperature: e.temperature });
    if (Object.keys(x.apres).length) ecritures.push(x);
  }
  const ecrits = await ecrire(env, ecritures, lot, par, resume(ch), undefined, extra);
  const faits = new Set(ecrits);
  const manques = ecritures.filter((x) => !faits.has(x.id)).map((x) => x.id);
  const partis = await effaces(env, manques);
  return {
    lot: ecrits.length ? lot : null, touches: ecrits.length, ignores: ignores + manques.length - partis, inchanges: etats.length - ecritures.length,
    inconnus: ids.length - etats.length + partis, lignes: await lignes(env, ecrits),
  };
}

export interface ResultatAnnulation { lot: string | null; rendus: number; gardes: number; lignes: LigneClassee[] }

/**
 * Annule un lot : rejoue l'avant-image de chaque contact qu'il a touché, si ce contact n'a rien reçu depuis (aucun
 * `contact_evenement` plus récent que celui du lot, quelle qu'en soit la source : règle d'AD-29, revue de code 18.6), s'il
 * est encore tel que le lot l'a laissé, si le classement rendu reste permis avec le projet d'aujourd'hui et si la
 * catégorie rendue existe encore. Les autres (modifiés depuis, effacés, catégorie supprimée) sont gardés et comptés. Un
 * lot déjà annulé ne rend plus rien. L'annulation est elle-même un lot, avec ses événements (`annule` = lot annulé).
 */
export async function annulerLot(env: EnvSite, lot: string, par: string): Promise<ResultatAnnulation | null> {
  const evs = (await env.DB.prepare(
    `SELECT e.contact_id, e.donnees, NOT EXISTS (SELECT 1 FROM contact_evenement x WHERE x.contact_id = e.contact_id AND x.id > e.id) AS dernier
     FROM contact_evenement e WHERE e.source = 'anne' AND e.source_id > ?1 AND e.source_id < ?2 AND e.type = 'classement'`,
  ).bind(`${lot}.`, `${lot}/`).all<{ contact_id: string; donnees: string; dernier: number }>()).results;
  if (!evs.length) return null;
  const parContact = new Map<string, { avant: Partial<Classement>; apres: Partial<Classement>; dernier: boolean }>();
  for (const e of evs) {
    try { const d = JSON.parse(e.donnees) as { avant: Partial<Classement>; apres: Partial<Classement>; lot: string }; if (d.lot === lot) parContact.set(e.contact_id, { ...d, dernier: !!e.dernier }); } catch {}
  }
  const [etats, categories] = await Promise.all([lireEtats(env, [...parContact.keys()]), env.DB.prepare('SELECT id FROM categorie').all<{ id: string }>()]);
  const existantes = new Set(categories.results.map((c) => c.id));
  const ecritures: Ecriture[] = [];
  for (const e of etats) {
    const d = parContact.get(e.id)!;
    const cles = Object.keys(d.apres) as Colonne[];
    const intact = d.dernier && cles.every((c) => COLONNES.includes(c) && e[c] === d.apres[c]);
    // Le classement rendu doit rester permis avec le projet d'aujourd'hui (CHECK de 0018), sinon le contact est gardé.
    const projet = d.avant.projet ?? e.projet, temperature = d.avant.temperature !== undefined ? d.avant.temperature : e.temperature;
    const categorieOk = !d.avant.categorie_id || existantes.has(d.avant.categorie_id);
    if (intact && categorieOk && temperaturePermise(temperature, projet)) {
      const garde: Ecriture['garde'] = { etape: e.etape };
      for (const c of cles) (garde as Record<string, unknown>)[c] = e[c];
      if (cles.includes('projet') || cles.includes('temperature')) Object.assign(garde, { projet: e.projet, temperature: e.temperature });
      ecritures.push({ id: e.id, avant: d.apres, apres: d.avant, garde });
    }
  }
  const nouveau = ulid();
  const ecrits = await ecrire(env, ecritures, nouveau, par, 'Classement annulé', lot);
  return { lot: ecrits.length ? nouveau : null, rendus: ecrits.length, gardes: parContact.size - ecrits.length, lignes: await lignes(env, ecrits) };
}

// ——— Fiche d'un contact et création à la main (story 18.7, FR-26, FR-28, AD-22, AD-28, AD-29, AD-34) ———
// Écritures d'un seul contact depuis sa fiche. Corriger : prénom, nom, entreprise, ville, téléphones et e-mails (le
// premier sur `contact`, les autres dans `contact_coordonnee`), classement (mêmes règles que `appliquer`), « appel
// autorisé » et « à rappeler le ». Une correction n'est pas un échange avec la personne : `last_activity_at` ne bouge pas
// (la purge des trois ans et les « récents » du suivi comptent les échanges). Une note et un contact noté hors séance,
// eux, sont des échanges. Chaque écriture garde son avant-image (AD-29). Le dernier contact (`dernier_contact_*`) ne
// s'écrit que par `noterContact`, la fonction que la coche d'une séance appellera aussi (AD-28 amendé le 2026-11-02).

/** Au plus 10 téléphones et 10 e-mails par contact. */
export const MAX_COORDONNEES = 10;
export const CANAUX_DERNIER = ['whatsapp', 'sms', 'email', 'appel', 'rencontre', 'autre'] as const;
const JOUR = /^\d{4}-\d{2}-\d{2}$/;
const jourParisDe = (t = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(t);
const jourValide = (v: string) => JOUR.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;

/** Ce qu'une correction de fiche change ; une clé absente ne change rien. */
export interface Correction extends Changements {
  prenom?: string | null; nom?: string | null; entreprise?: string | null; commune?: string | null;
  telephones?: string[]; emails?: string[];
  /** null : la règle de la catégorie ; true / false : décidé pour cette personne (AD-25). */
  appel_autorise?: boolean | null;
  /** AAAA-MM-JJ, ou null pour l'effacer. */
  a_rappeler_le?: string | null;
}

const TEXTES: Record<string, number> = { prenom: 80, nom: 80, entreprise: 120, commune: 80 };

/** Un téléphone saisi, en E.164 (un numéro de tableur sans son 0 est repris, comme `pipeline.personne`) ; null si non valable. */
export function telephoneSaisi(v: string): string | null {
  let t = v.trim();
  if (/^[1-9]\d{8}$/.test(t.replace(/[\s.]/g, ''))) t = `0${t.replace(/[\s.]/g, '')}`;
  return e164(t);
}

function lireListe(brut: unknown, type: 'telephone' | 'email'): string[] | string {
  if (!Array.isArray(brut) || brut.length > MAX_COORDONNEES || !brut.every((x) => typeof x === 'string' && x.length <= 254)) {
    return `${type === 'telephone' ? 'Téléphones' : 'E-mails'} : au plus ${MAX_COORDONNEES}.`;
  }
  const r: string[] = [];
  for (const brute of brut as string[]) {
    if (!brute.trim()) continue;
    const v = type === 'telephone' ? telephoneSaisi(brute) : brute.trim().toLowerCase();
    if (!v || (type === 'email' && !emailValide(v))) {
      return type === 'telephone' ? `Le téléphone « ${brute.trim().slice(0, 30)} » ne semble pas valable : dix chiffres, ou +41… pour la Suisse.` : `L'adresse « ${brute.trim().slice(0, 60)} » ne semble pas valable.`;
    }
    if (!r.includes(v)) r.push(v);
  }
  return r;
}

/** Lit une correction de fiche (vocabulaire fermé) ; ou le message d'erreur (400). */
export function lireCorrection(brut: unknown, categories: ReadonlySet<string>): Correction | string {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return 'Correction attendue.';
  const classement: Record<string, unknown> = {};
  const c: Correction = {};
  for (const [cle, v] of Object.entries(brut as Record<string, unknown>)) {
    if (cle in TEXTES) {
      if (v !== null && typeof v !== 'string') return `${cle} : texte attendu.`;
      const t = typeof v === 'string' ? v.trim() : '';
      if (t.length > TEXTES[cle]) return `${cle} : ${TEXTES[cle]} caractères au plus.`;
      (c as Record<string, unknown>)[cle] = t || null;
    } else if (cle === 'telephones' || cle === 'emails') {
      const l = lireListe(v, cle === 'telephones' ? 'telephone' : 'email');
      if (typeof l === 'string') return l;
      c[cle] = l;
    } else if (cle === 'appel_autorise') {
      if (v !== null && typeof v !== 'boolean') return 'Appel autorisé : oui, non ou selon la catégorie.';
      c.appel_autorise = v as boolean | null;
    } else if (cle === 'a_rappeler_le') {
      if (v !== null && !(typeof v === 'string' && jourValide(v))) return 'Date « à rappeler le » invalide.';
      c.a_rappeler_le = v as string | null;
    } else if (['categorie_id', 'projet', 'temperature', 'verifie', 'ecarte'].includes(cle)) {
      classement[cle] = v;
    } else return `Champ inconnu : ${cle.slice(0, 40)}`;
  }
  if (Object.keys(classement).length) {
    const ch = lireChangements(classement, categories);
    if (typeof ch === 'string') return ch;
    Object.assign(c, ch);
  }
  if (!Object.keys(c).length) return 'Aucun changement demandé.';
  return c;
}

/** L'état d'un contact tel que la fiche le corrige. */
interface EtatFiche extends Etat {
  prenom: string | null; nom: string | null; entreprise: string | null; commune: string | null;
  telephone: string | null; email: string | null; appel_autorise: number | null; a_rappeler_le: string | null;
  email_accord_le: string | null;
}
type Valeur = string | number | null | string[];

export type ResultatCorrection =
  | { ok: true; changes: string[]; ignore: boolean; telephoneChange: boolean }
  | { ok: false; conflit: { id: string; nom: string } }
  | { ok: false; opposition: true }
  | { ok: false; indisponible: true }
  | { ok: false; refus: string };

const nomCourt = (c: { prenom: string | null; nom: string | null; telephone?: string | null; email?: string | null }) =>
  [c.prenom, c.nom].filter(Boolean).join(' ') || c.telephone || c.email || 'Sans nom';

/** Le contact (autre que `id`) qui porte déjà l'un de ces téléphones ou e-mails, principal ou secondaire. */
async function conflitCoordonnees(env: EnvSite, id: string, valeurs: string[]): Promise<{ id: string; nom: string } | null> {
  if (!valeurs.length) return null;
  const r = await env.DB.prepare(
    `SELECT c.id, c.prenom, c.nom, c.telephone, c.email FROM contact c WHERE c.id <> ?1 AND (
       c.telephone IN (SELECT value FROM json_each(?2)) OR c.email IN (SELECT value FROM json_each(?2))
       OR c.id IN (SELECT contact_id FROM contact_coordonnee WHERE valeur IN (SELECT value FROM json_each(?2))))
     LIMIT 1`,
  ).bind(id, JSON.stringify(valeurs)).first<{ id: string; prenom: string | null; nom: string | null; telephone: string | null; email: string | null }>();
  return r ? { id: r.id, nom: nomCourt(r) } : null;
}

const LIBELLES_FICHE: Record<string, string> = {
  prenom: 'prénom', nom: 'nom', entreprise: 'entreprise', commune: 'ville', telephones: 'téléphones', emails: 'e-mails',
  categorie_id: 'catégorie', projet: 'projet', temperature: 'température', verifie_le: 'vérifié', ecarte_le: 'écarté',
  appel_autorise: 'appel autorisé', a_rappeler_le: 'à rappeler le',
};

/**
 * Corrige la fiche d'un contact, en une seule exécution D1 : coordonnées secondaires retirées, colonnes de `contact`,
 * coordonnées secondaires ajoutées, puis un événement `classement` avec l'avant-image des seuls champs changés. L'écriture
 * n'a lieu que si le contact est encore tel qu'il a été lu (sinon, refus « modifié entre-temps »). Un téléphone ou un
 * e-mail déjà porté par un autre contact est refusé avec ce contact (jamais de fusion silencieuse). null : contact inconnu.
 * `extra` : clés ajoutées à `donnees` de l'événement (la barre « Nouveaux » y met `nouveau`, pour l'annuler, story 18.13).
 */
export async function corrigerFiche(env: EnvSite, id: string, corr: Correction, par: string, extra: Record<string, string | number> = {}): Promise<ResultatCorrection | null> {
  const [e, sec, site] = await env.DB.batch([
    env.DB.prepare(`SELECT id, prenom, nom, entreprise, commune, telephone, email, categorie_id, projet, temperature, verifie_le, ecarte_le,
      appel_autorise, a_rappeler_le, etape, email_accord_le FROM contact WHERE id = ?1`).bind(id),
    env.DB.prepare(`SELECT type, valeur FROM contact_coordonnee WHERE contact_id = ?1 AND type IN ('telephone', 'email') ORDER BY id`).bind(id),
    // Revue de code 18.8 : l'accord du site ne vaut que pour la demande faite avec l'adresse du contact.
    env.DB.prepare('SELECT max(l.newsletter_opt_in_at) AS le FROM lead l JOIN contact c ON c.id = l.contact_id WHERE l.contact_id = ?1 AND lower(l.email) = lower(c.email)').bind(id),
  ]) as [D1Result<EtatFiche>, D1Result<{ type: string; valeur: string }>, D1Result<{ le: string | null }>];
  const etat = e.results[0];
  if (!etat) return null;
  const maintenant = new Date().toISOString();
  const { apres: cl, ignore } = appliquer(etat, corr, maintenant);
  const avantListes = {
    telephones: [etat.telephone, ...sec.results.filter((x) => x.type === 'telephone').map((x) => x.valeur)].filter((x): x is string => !!x),
    emails: [etat.email, ...sec.results.filter((x) => x.type === 'email').map((x) => x.valeur)].filter((x): x is string => !!x),
  };
  const avantTout: Record<string, Valeur> = {
    prenom: etat.prenom, nom: etat.nom, entreprise: etat.entreprise, commune: etat.commune, ...avantListes,
    categorie_id: etat.categorie_id, projet: etat.projet, temperature: etat.temperature, verifie_le: etat.verifie_le, ecarte_le: etat.ecarte_le,
    appel_autorise: etat.appel_autorise, a_rappeler_le: etat.a_rappeler_le,
  };
  const apresTout: Record<string, Valeur> = {
    ...avantTout, ...cl,
    ...(corr.prenom !== undefined ? { prenom: corr.prenom } : {}), ...(corr.nom !== undefined ? { nom: corr.nom } : {}),
    ...(corr.entreprise !== undefined ? { entreprise: corr.entreprise } : {}), ...(corr.commune !== undefined ? { commune: corr.commune } : {}),
    ...(corr.telephones !== undefined ? { telephones: corr.telephones } : {}), ...(corr.emails !== undefined ? { emails: corr.emails } : {}),
    ...(corr.appel_autorise !== undefined ? { appel_autorise: corr.appel_autorise === null ? null : corr.appel_autorise ? 1 : 0 } : {}),
    ...(corr.a_rappeler_le !== undefined ? { a_rappeler_le: corr.a_rappeler_le } : {}),
  };
  const meme = (a: Valeur, b: Valeur) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const changes = Object.keys(apresTout).filter((k) => !meme(avantTout[k], apresTout[k]));
  if (!changes.length) return { ok: true, changes, ignore, telephoneChange: false };
  const tels = apresTout.telephones as string[], mails = apresTout.emails as string[];
  // La base exige un nom, un téléphone ou un e-mail (CHECK de 0018).
  if (!apresTout.nom && !tels.length && !mails.length) return { ok: false, refus: 'Il faut garder au moins un nom, un téléphone ou un e-mail.' };
  const coords = changes.includes('telephones') || changes.includes('emails');
  if (coords) {
    const nouvelles = [...tels, ...mails].filter((v) => !avantListes.telephones.includes(v) && !avantListes.emails.includes(v));
    const autre = await conflitCoordonnees(env, id, nouvelles);
    if (autre) return { ok: false, conflit: autre };
    // Revue de code 18.7 : une personne qui a demandé l'effacement ne revient pas par une coordonnée ajoutée.
    const opp = await enOpposition(env, nouvelles);
    if (opp === 'oui') return { ok: false, opposition: true };
    if (opp === 'sans_secret') return { ok: false, indisponible: true };
  }
  // Revue de code 18.7 : un accord vaut pour une adresse. Si le premier e-mail change, l'accord noté est retiré (par
  // `accord`) et celui du site n'est pas reporté sur la nouvelle adresse (« à reconfirmer », lu par `etatEmail`).
  const emailChange = changes.includes('emails') && (mails[0] ?? null) !== (etat.email ?? null);
  const siteAccord = site.results[0]?.le ?? null;
  const changeEmail = emailChange ? {
    avant: etat.email, apres: mails[0] ?? null, accord_note_retire: !!etat.email_accord_le, accord_site_a_reconfirmer: !!siteAccord,
  } : null;
  const avant: Record<string, Valeur> = {}, apres: Record<string, Valeur> = {};
  for (const k of changes) { avant[k] = avantTout[k]; apres[k] = apresTout[k]; }
  // Colonnes de `contact` à écrire (noms tirés du code, valeurs liées) ; la garde compare chaque colonne à ce qui a été lu.
  const colonnes: [string, Valeur][] = changes.filter((k) => k !== 'telephones' && k !== 'emails').map((k) => [k, apresTout[k]]);
  if (changes.includes('telephones')) colonnes.push(['telephone', tels[0] ?? null]);
  if (changes.includes('emails')) colonnes.push(['email', mails[0] ?? null]);
  const lus: [string, Valeur][] = (['prenom', 'nom', 'entreprise', 'commune', 'telephone', 'email', 'categorie_id', 'projet', 'temperature', 'verifie_le', 'ecarte_le', 'appel_autorise', 'a_rappeler_le', 'etape'] as const)
    .map((k) => [k, etat[k] as Valeur]);
  const garde = JSON.stringify(Object.fromEntries(lus));
  const gardeSql = lus.map(([k]) => `${k} IS json_extract(?2, '$.${k}')`).join(' AND ');
  const secondaires = JSON.stringify([...tels.slice(1).map((v) => ({ type: 'telephone', valeur: v })), ...mails.slice(1).map((v) => ({ type: 'email', valeur: v }))]);
  const lot = ulid();
  const texte = `Fiche corrigée : ${changes.map((k) => LIBELLES_FICHE[k] ?? k).join(', ')}`
    + (changeEmail && (changeEmail.accord_note_retire || changeEmail.accord_site_a_reconfirmer) ? ' ; accord e-mail à reconfirmer pour la nouvelle adresse' : '');
  // Revue de code 18.7 : la garde compare aussi les coordonnées secondaires lues (empreinte, dans l'ordre), et vérifie
  // qu'aucune des valeurs écrites n'a été prise entre-temps par un autre contact (sinon rien n'est écrit : conflit).
  const empreinte = JSON.stringify(sec.results.map((x) => `${x.type}:${x.valeur}`));
  const valeurs = JSON.stringify(coords ? [...tels, ...mails] : []);
  const gardeComplete = `${gardeSql}
    AND (SELECT json_group_array(t) FROM (SELECT type || ':' || valeur AS t FROM contact_coordonnee WHERE contact_id = ?1 AND type IN ('telephone', 'email') ORDER BY id)) = ?8
    AND NOT EXISTS (SELECT 1 FROM contact_coordonnee k WHERE k.contact_id <> ?1 AND k.valeur IN (SELECT value FROM json_each(?9)))
    AND NOT EXISTS (SELECT 1 FROM contact o WHERE o.id <> ?1 AND (o.telephone IN (SELECT value FROM json_each(?9)) OR o.email IN (SELECT value FROM json_each(?9))))`;
  const ecritures: D1PreparedStatement[] = [
    // L'événement d'abord, et seulement si le contact est encore tel qu'il a été lu : le reste du lot suit la même garde.
    env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees, par)
       SELECT ?1, ?3, 'classement', 'anne', ?4, ?5, ?6, ?7 WHERE EXISTS (SELECT 1 FROM contact WHERE id = ?1 AND ${gardeComplete})`)
      .bind(id, garde, maintenant, `${lot}.${id}`, texte, JSON.stringify({ avant, apres, lot, ...extra, ...(changeEmail ? { email_change: changeEmail } : {}) }), par, empreinte, valeurs),
  ];
  const evenementEcrit = `EXISTS (SELECT 1 FROM contact_evenement WHERE source = 'anne' AND source_id = ?9)`;
  // Revue de code 18.8 : poussé dès que l'adresse change (l'écriture garde sa propre condition, accord présent et événement écrit).
  if (changeEmail) ecritures.push(retraitAccordNote(env, id, evenementEcrit.replace('?9', '?2'), `${lot}.${id}`));
  if (coords) {
    ecritures.push(env.DB.prepare(`DELETE FROM contact_coordonnee WHERE contact_id = ?1 AND type IN ('telephone', 'email')
       AND valeur NOT IN (SELECT json_extract(value, '$.valeur') FROM json_each(?2)) AND ${evenementEcrit.replace('?9', '?3')}`)
      .bind(id, secondaires, `${lot}.${id}`));
  }
  const set = colonnes.map(([k], i) => `${k} = ?${i + 3}`).join(', ');
  ecritures.push(env.DB.prepare(`UPDATE contact SET ${set} WHERE id = ?1 AND ${evenementEcrit.replace('?9', '?2')}`)
    .bind(id, `${lot}.${id}`, ...colonnes.map(([, v]) => v)));
  if (coords) {
    ecritures.push(env.DB.prepare(`INSERT INTO contact_coordonnee (contact_id, type, valeur, ajoute_le)
       SELECT ?1, json_extract(j.value, '$.type'), json_extract(j.value, '$.valeur'), ?3 FROM json_each(?2) j
       WHERE NOT EXISTS (SELECT 1 FROM contact_coordonnee k WHERE k.valeur = json_extract(j.value, '$.valeur'))
         AND ${evenementEcrit.replace('?9', '?4')}`).bind(id, secondaires, maintenant, `${lot}.${id}`));
  }
  try {
    const r = await env.DB.batch(ecritures);
    if (!r[0].meta.changes) {
      const autre = coords ? await conflitCoordonnees(env, id, [...tels, ...mails]) : null;
      if (autre) return { ok: false, conflit: autre };
      return { ok: false, refus: 'Ce contact vient d\'être modifié ailleurs : la fiche est rechargée, recommencez.' };
    }
  } catch (err) {
    // Un autre contact a pris ce téléphone ou cet e-mail entre-temps : tout le lot est annulé par D1.
    const autre = coords ? await conflitCoordonnees(env, id, [...tels, ...mails]) : null;
    if (autre) return { ok: false, conflit: autre };
    throw err;
  }
  return { ok: true, changes, ignore, telephoneChange: changes.includes('telephones') && tels[0] !== avantListes.telephones[0] };
}

/** Une note de la fiche : un échange, donc `last_activity_at` avance ; avant-image gardée (AD-29). false : contact inconnu. */
export async function ajouterNote(env: EnvSite, id: string, texte: string, par: string): Promise<boolean> {
  const maintenant = new Date().toISOString();
  const lot = ulid();
  const [ev] = await env.DB.batch([
    env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees, par)
       SELECT id, ?2, 'note', 'anne', ?3, ?4, json_object('avant', json_object('last_activity_at', last_activity_at), 'apres', json_object('last_activity_at', ?2), 'lot', ?5), ?6
       FROM contact WHERE id = ?1`).bind(id, maintenant, `${lot}.${id}`, texte, lot, par),
    env.DB.prepare('UPDATE contact SET last_activity_at = ?2 WHERE id = ?1').bind(id, maintenant),
  ]);
  return !!ev.meta.changes;
}

export interface ContactNote { jour: string; canal: (typeof CANAUX_DERNIER)[number]; note: string | null }

/** Lit un contact fait (date AAAA-MM-JJ passée ou du jour, en jours de Paris ; canal fermé ; note facultative) ; ou l'erreur. */
export function lireContactNote(brut: unknown): ContactNote | string {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return 'Contact attendu.';
  const d = brut as Record<string, unknown>;
  if (Object.keys(d).some((k) => !['jour', 'canal', 'note'].includes(k))) return 'Champ inconnu.';
  if (typeof d.jour !== 'string' || !jourValide(d.jour) || d.jour < '2000-01-01') return 'Date invalide.';
  if (d.jour > jourParisDe()) return 'La date est dans le futur : notez un contact déjà fait.';
  if (typeof d.canal !== 'string' || !(CANAUX_DERNIER as readonly string[]).includes(d.canal)) return 'Canal inconnu.';
  if (d.note !== undefined && d.note !== null && typeof d.note !== 'string') return 'Note : texte attendu.';
  const note = typeof d.note === 'string' ? d.note.trim().slice(0, 2000) : '';
  return { jour: d.jour, canal: d.canal as ContactNote['canal'], note: note || null };
}

const CANAUX_LISIBLES: Record<string, string> = { whatsapp: 'WhatsApp', sms: 'SMS', email: 'E-mail', appel: 'Appel', rencontre: 'Rencontre', autre: 'Autre' };

/**
 * Le seul écrivain du dernier contact (`dernier_contact_le`, `dernier_contact_canal`, AD-28 amendé) : aujourd'hui pour un
 * contact noté hors séance depuis la fiche (FR-28), demain pour la coche « contacté » d'une séance (`seance`, epic 19).
 * Un contact du jour prend l'heure présente ; un jour passé, midi UTC. Un contact plus ancien que le dernier connu est
 * gardé dans l'historique sans remplacer le dernier contact. C'est un échange : `last_activity_at` avance. Un événement
 * garde l'avant-image (AD-29). Renvoie le dernier contact après écriture, ou null pour un contact inconnu.
 */
export async function noterContact(env: EnvSite, id: string, c: ContactNote, par: string, origine: 'hors_seance' = 'hors_seance', reprise = false): Promise<{ remplace: boolean; le: string | null; canal: string | null } | 'conflit' | null> {
  const etat = await env.DB.prepare('SELECT dernier_contact_le, dernier_contact_canal, last_activity_at FROM contact WHERE id = ?1').bind(id)
    .first<{ dernier_contact_le: string | null; dernier_contact_canal: string | null; last_activity_at: string }>();
  if (!etat) return null;
  const maintenant = new Date().toISOString();
  const le = c.jour === jourParisDe() ? maintenant : `${c.jour}T12:00:00.000Z`;
  const remplace = !etat.dernier_contact_le || le >= etat.dernier_contact_le;
  const avant: Record<string, string | null> = { last_activity_at: etat.last_activity_at }, apres: Record<string, string | null> = { last_activity_at: maintenant };
  if (remplace) {
    Object.assign(avant, { dernier_contact_le: etat.dernier_contact_le, dernier_contact_canal: etat.dernier_contact_canal });
    Object.assign(apres, { dernier_contact_le: le, dernier_contact_canal: c.canal });
  }
  const lot = ulid();
  const jourLisible = new Date(`${c.jour}T12:00:00Z`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const texte = `Contact hors séance · ${CANAUX_LISIBLES[c.canal]} · ${jourLisible}${c.note ? `\n${c.note}` : ''}`;
  // Revue de code 18.7 : l'événement porte la même garde que l'écriture (un contact plus récent noté entre-temps, par une
  // autre fiche ou une séance, l'emporte), et l'écriture n'a lieu que si l'événement a été écrit : jamais d'avant-image
  // fausse. Si la garde a sauté, le contact est noté à nouveau sans remplacer le dernier contact (une seule reprise).
  const gardeEv = remplace ? 'AND (dernier_contact_le IS NULL OR dernier_contact_le <= ?7) AND dernier_contact_le IS ?8' : '';
  const ecrit = `EXISTS (SELECT 1 FROM contact_evenement WHERE source = 'anne' AND source_id = ?5)`;
  const [ev] = await env.DB.batch([
    env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees, par)
       SELECT ?1, ?2, 'note', 'anne', ?3, ?4, ?5, ?6 FROM contact WHERE id = ?1 ${gardeEv}`)
      .bind(id, maintenant, `${lot}.${id}`, texte, JSON.stringify({ avant, apres, lot, [origine]: { jour: c.jour, canal: c.canal } }), par,
        ...(remplace ? [le, etat.dernier_contact_le] : [])),
    remplace
      ? env.DB.prepare(`UPDATE contact SET dernier_contact_le = ?2, dernier_contact_canal = ?3, last_activity_at = ?4 WHERE id = ?1 AND ${ecrit}`)
        .bind(id, le, c.canal, maintenant, `${lot}.${id}`)
      : env.DB.prepare(`UPDATE contact SET last_activity_at = ?2 WHERE id = ?1 AND ${ecrit.replace('?5', '?3')}`).bind(id, maintenant, `${lot}.${id}`),
  ]);
  // Revue de code 18.8 : une garde qui saute deux fois (ou un contact effacé entre-temps) n'est pas un « contact inconnu ».
  if (!ev.meta.changes) {
    if (remplace && !reprise) return noterContact(env, id, c, par, origine, true);
    return (await env.DB.prepare('SELECT 1 AS n FROM contact WHERE id = ?1').bind(id).first()) ? 'conflit' : null;
  }
  return remplace ? { remplace, le, canal: c.canal } : { remplace, le: etat.dernier_contact_le, canal: etat.dernier_contact_canal };
}

/** Une saisie de « + Nouveau contact » (FR-26), nettoyée. */
export interface Saisie {
  prenom: string | null; nom: string | null; telephone: string | null; email: string | null; commune: string | null; entreprise: string | null;
  categorie_id: string; projet: string; temperature: string | null; note: string | null; accord: boolean;
}

/** Lit la saisie d'un nouveau contact ; ou le message d'erreur (400). */
export function lireSaisie(brut: unknown, categories: ReadonlySet<string>): Saisie | string {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return 'Saisie attendue.';
  const d = brut as Record<string, unknown>;
  const permis = ['prenom', 'nom', 'telephone', 'email', 'commune', 'entreprise', 'categorie_id', 'projet', 'temperature', 'note', 'accord'];
  const inconnu = Object.keys(d).find((k) => !permis.includes(k));
  if (inconnu) return `Champ inconnu : ${inconnu.slice(0, 40)}`;
  const txt = (k: string, max: number): string | null | false => {
    const v = d[k];
    if (v === undefined || v === null) return null;
    if (typeof v !== 'string' || v.trim().length > max) return false;
    return v.trim() || null;
  };
  const champs: Record<string, string | null> = {};
  for (const [k, max] of [['prenom', 80], ['nom', 80], ['commune', 80], ['entreprise', 120], ['telephone', 40], ['email', 254], ['note', 2000]] as const) {
    const v = txt(k, max);
    if (v === false) return `${k} : texte de ${max} caractères au plus attendu.`;
    champs[k] = v;
  }
  const telephone = champs.telephone ? telephoneSaisi(champs.telephone) : null;
  if (champs.telephone && !telephone) return 'Le téléphone ne semble pas valable : dix chiffres, ou +41… pour la Suisse.';
  const email = champs.email ? champs.email.toLowerCase() : null;
  if (email && !emailValide(email)) return 'L\'adresse e-mail ne semble pas valable.';
  if (!champs.nom && !telephone) return 'Il faut au moins un nom ou un téléphone.';
  if (typeof d.categorie_id !== 'string' || !categories.has(d.categorie_id)) return 'Choisissez une catégorie.';
  const projet = d.projet === undefined ? 'a_qualifier' : d.projet;
  if (typeof projet !== 'string' || !Object.prototype.hasOwnProperty.call(PROJETS, projet)) return 'Projet inconnu.';
  const temperature = d.temperature === undefined || d.temperature === null || d.temperature === '' ? null : d.temperature;
  if (temperature !== null && !(typeof temperature === 'string' && (TEMPERATURES_CHOIX as readonly string[]).includes(temperature) && temperaturePermise(temperature, projet))) {
    return 'Température inconnue, ou sans objet pour ce projet.';
  }
  if (d.accord !== undefined && typeof d.accord !== 'boolean') return 'Accord : vrai ou faux attendu.';
  if (d.accord === true && !email) return 'L\'accord pour les e-mails demande une adresse e-mail.';
  return { prenom: champs.prenom, nom: champs.nom, telephone, email, commune: champs.commune, entreprise: champs.entreprise,
    categorie_id: d.categorie_id, projet, temperature: temperature as string | null, note: champs.note, accord: d.accord === true };
}

export type ResultatCreation =
  | { ok: true; id: string }
  | { ok: false; existant: { id: string; nom: string } }
  | { ok: false; opposition: true }
  | { ok: false; indisponible: true };

async function existant(env: EnvSite, telephone: string | null, email: string | null): Promise<{ id: string; nom: string } | null> {
  const t = await trouver(env, telephone, email);
  if (!t) return null;
  const c = await env.DB.prepare('SELECT id, prenom, nom, telephone, email FROM contact WHERE id = ?1').bind(t.id)
    .first<{ id: string; prenom: string | null; nom: string | null; telephone: string | null; email: string | null }>();
  return c ? { id: c.id, nom: nomCourt(c) } : null;
}

/**
 * La personne a-t-elle demandé l'effacement (table `opposition`, AD-31) ? Revue de code 18.7 : sans LIEN_SECRET, rien ne
 * peut être comparé ; c'est journalisé comme sur le site (`opposition_sans_secret`), et si la liste n'est pas vide la
 * réponse est `sans_secret` (création ou ajout de coordonnée refusés, 503), sinon `non`.
 */
export async function enOpposition(env: EnvSite, valeurs: (string | null)[]): Promise<'oui' | 'non' | 'sans_secret'> {
  const v = valeurs.filter((x): x is string => !!x);
  if (!v.length) return 'non';
  if (!env.LIEN_SECRET) {
    journal('opposition_sans_secret', { valeurs: v.length });
    return (await env.DB.prepare('SELECT 1 AS n FROM opposition LIMIT 1').first()) ? 'sans_secret' : 'non';
  }
  const empreintes = await Promise.all(v.map((x) => empreinteOpposition(env.LIEN_SECRET!, x)));
  return (await env.DB.prepare('SELECT 1 AS n FROM opposition WHERE empreinte IN (SELECT value FROM json_each(?1)) LIMIT 1').bind(JSON.stringify(empreintes)).first()) ? 'oui' : 'non';
}

/**
 * Crée un contact à la main (FR-26, AD-34) : vérifié (catégorie choisie par Anne), hors suivi des ventes (`etape` NULL),
 * sans origine marketing (`canal` NULL), source « saisie » (`contact_source`). Un téléphone ou un e-mail déjà connu
 * (`contact` ou `contact_coordonnee`) ne crée rien : le contact existant est renvoyé pour être ouvert. Une personne qui a
 * demandé l'effacement (opposition) n'est pas recréée. L'accord e-mail, s'il est coché, est noté par `accord` (AD-21).
 */
export async function creerContact(env: EnvSite, s: Saisie, par: string, depuis?: { source: 'leedflow'; nouveau: string }): Promise<ResultatCreation> {
  const deja = await existant(env, s.telephone, s.email);
  if (deja) return { ok: false, existant: deja };
  const opp = await enOpposition(env, [s.telephone, s.email]);
  if (opp === 'oui') return { ok: false, opposition: true };
  if (opp === 'sans_secret') return { ok: false, indisponible: true };
  const id = ulid(), lot = ulid(), maintenant = new Date().toISOString();
  const colonnes = { prenom: s.prenom, nom: s.nom, telephone: s.telephone, email: s.email, commune: s.commune, entreprise: s.entreprise,
    categorie_id: s.categorie_id, projet: s.projet, temperature: s.temperature, verifie_le: maintenant };
  const ecritures = [
    env.DB.prepare(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, email, commune, entreprise, categorie_id, projet, temperature, verifie_le)
       VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?2)`)
      .bind(id, maintenant, s.prenom, s.nom, s.telephone, s.email, s.commune, s.entreprise, s.categorie_id, s.projet, s.temperature),
    // Story 18.11 : depuis la barre « Nouveaux », la source est celle de la demande (un numéro vu par Leedflow), et
    // l'événement porte la ligne `nouveau`, pour que le geste s'annule (`annulerCreation`).
    env.DB.prepare(`INSERT INTO contact_source (contact_id, source, a) VALUES (?1, ?3, ?2)`).bind(id, maintenant, depuis?.source ?? 'saisie'),
    env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees, par) VALUES (?1, ?2, 'creation', 'anne', ?3, ?6, ?4, ?5)`)
      .bind(id, maintenant, `${lot}.${id}`, JSON.stringify({ avant: {}, apres: colonnes, lot, ...(depuis ? { nouveau: depuis.nouveau } : {}) }), par,
        depuis ? 'Contact créé depuis « Nouveaux » : numéro vu par Leedflow' : 'Contact créé à la main'),
  ];
  if (s.note) ecritures.push(env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, texte, par) VALUES (?1, ?2, 'note', 'anne', ?3, ?4)`).bind(id, maintenant, s.note, par));
  try {
    await env.DB.batch(ecritures);
  } catch (err) {
    // Une autre saisie a pris ce téléphone ou cet e-mail entre-temps : on propose la sienne.
    const autre = await existant(env, s.telephone, s.email);
    if (autre) return { ok: false, existant: autre };
    throw err;
  }
  if (s.accord) {
    await noterAccord(env, id, true, par);
  }
  return { ok: true, id };
}

/**
 * Annule « Ajouter aux contacts » de la barre « Nouveaux » (story 18.11, AD-29) : l'avant-image d'une création est
 * l'absence du contact. Il est supprimé seulement si tout son historique vient de ce geste (événements qui portent la
 * même ligne `nouveau` : création, entrée dans le suivi) ; sinon il a été modifié depuis (note, appel rattaché…) et il est
 * gardé. Les lignes qui le référencent partent avec lui (ON DELETE CASCADE, dont le classement « prospect » du numéro).
 */
export async function annulerCreation(env: EnvSite, id: string, nouveau: string): Promise<'supprime' | 'garde' | 'absent'> {
  const r = await env.DB.prepare(
    `DELETE FROM contact WHERE id = ?1
       AND EXISTS (SELECT 1 FROM contact_evenement e WHERE e.contact_id = ?1 AND e.type = 'creation' AND json_valid(e.donnees) AND json_extract(e.donnees, '$.nouveau') = ?2)
       AND NOT EXISTS (SELECT 1 FROM contact_evenement e WHERE e.contact_id = ?1 AND (e.donnees IS NULL OR NOT json_valid(e.donnees) OR json_extract(e.donnees, '$.nouveau') IS NOT ?2))`,
  ).bind(id, nouveau).run();
  if (r.meta.changes) return 'supprime';
  return (await env.DB.prepare('SELECT 1 AS n FROM contact WHERE id = ?1').bind(id).first()) ? 'garde' : 'absent';
}

// ——— Import par Claude (story 18.9, AD-22, AD-26, AD-29) ———
// `server/import` lit le fichier et décide ; ce module écrit. Un contact créé par l'import est hors suivi (`etape` NULL),
// sans origine marketing (`canal` NULL : le déclencheur `contact_action_auto` ne fait rien), « à vérifier » (`verifie_le`
// NULL), avec la catégorie proposée par FR-9. Un contact existant reçoit seulement ce que `import` a décidé (coordonnées
// manquantes, et pour un contact non vérifié : nom, ville, entreprise vides, catégorie proposée plus haute, projet). Un
// import n'est pas un échange avec la personne : `last_activity_at` d'un contact complété ne bouge pas.
// Chaque contact touché reçoit un `contact_evenement` de type `import`, source `claude`, `source_id` = « lot.contact »,
// `donnees` = { avant, apres, lot, ligne, creation, coordonnees, sources, accord } (AD-29) ; ses notes ont un `source_id`
// « lot.contact.nK », pour qu'elles ne comptent pas comme une modification faite depuis le lot.

/** Une écriture décidée par `server/import` pour un contact. */
export interface EcritureImport {
  id: string; nouveau: boolean; ligne: string;
  avant: Record<string, string | null>; apres: Record<string, string | null>; garde: Record<string, string | null>;
  secondaires: { type: string; valeur: string; reseau?: string | null }[];
  sources: string[]; notes: string[]; accord: boolean; detail: string | null;
  /** Story 18.17 : les lignes de `contact_source` à écrire (source, avec le lieu et le mois de la rencontre s'il y en a une). */
  lignesSource: LigneSourceImport[];
  /** Story 18.17 : lignes de source d'un autre lot dont l'import complète le lieu et le mois ; l'annulation les vide à nouveau. */
  sourcesCompletees: SourceCompletee[];
}
export interface LigneSourceImport { source: string; lieu: string | null; mois: string | null }
export interface SourceCompletee { id: number; lieu: string | null; mois: string | null; avant_lieu: string | null; avant_mois: string | null }

const COLONNES_IMPORT = ['prenom', 'nom', 'telephone', 'email', 'commune', 'entreprise', 'categorie_id', 'projet'] as const;
const GARDE_IMPORT = [...COLONNES_IMPORT, 'temperature', 'verifie_le', 'ecarte_le', 'etape', 'email_accord_le'] as const;
const jx = (chemin: string) => `json_extract(j.value, '${chemin}')`;
/** La valeur n'est portée par aucun contact (principal) ni aucune coordonnée, sauf par `soi` (expression SQL) ; NULL passe. */
const libre = (valeur: string, soi = 'NULL') => `(${valeur} IS NULL OR (NOT EXISTS (SELECT 1 FROM contact o WHERE (o.telephone = ${valeur} OR o.email = ${valeur}) AND o.id IS NOT ${soi})
  AND NOT EXISTS (SELECT 1 FROM contact_coordonnee k WHERE k.valeur = ${valeur})))`;

/**
 * Écrit un morceau d'import en une exécution D1 (une transaction). Nouveaux contacts d'abord (seulement si leurs
 * coordonnées sont toujours libres), puis un événement par contact complété encore tel que l'aperçu l'a lu (`garde`) et
 * dont le nouveau téléphone ou e-mail principal est libre ; ensuite colonnes, coordonnées, sources, notes et accord, pour
 * les seuls contacts dont l'événement est écrit. Rien ne peut faire échouer le morceau pour un contact changé entre-temps.
 */
export async function ecrireImport(env: EnvSite, lot: string, ecritures: EcritureImport[], maintenant: string, par: string): Promise<{ nouveaux: number; complements: number; accords: number }> {
  if (!ecritures.length) return { nouveaux: 0, complements: 0, accords: 0 };
  const charge = JSON.stringify(ecritures.map((x) => {
    const origine = [x.sources.join(', ') || 'complément', x.detail].filter(Boolean).join(', ');
    return {
      ...x, texte: x.nouveau ? `Contact importé par Claude (${origine})` : `Complété par un import de Claude (${origine})`,
      donnees: JSON.stringify({ avant: x.avant, apres: x.apres, lot, ligne: x.ligne, creation: x.nouveau, coordonnees: x.secondaires.map((s) => s.valeur), sources: x.sources, accord: x.accord, completees: x.sourcesCompletees }),
    };
  }));
  const ecrit = (id: string) => `EXISTS (SELECT 1 FROM contact_evenement e WHERE e.source = 'claude' AND e.source_id = ?2 || '.' || ${id})`;
  const garde = GARDE_IMPORT.map((c) => `c.${c} IS ${jx(`$.garde.${c}`)}`).join(' AND ');
  const set = COLONNES_IMPORT.map((c) => `${c} = CASE WHEN json_type(j.value, '$.apres.${c}') IS NULL THEN contact.${c} ELSE ${jx(`$.apres.${c}`)} END`).join(', ');
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, email, commune, entreprise, categorie_id, projet)
       SELECT ${jx('$.id')}, ?2, ?2, ${COLONNES_IMPORT.map((c) => jx(`$.apres.${c}`)).join(', ')}
       FROM json_each(?1) AS j WHERE ${jx('$.nouveau')} = 1 AND ${libre(jx('$.apres.telephone'))} AND ${libre(jx('$.apres.email'))}`)
      .bind(charge, maintenant),
    env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees, par)
       SELECT c.id, ?3, 'import', 'claude', ?2 || '.' || c.id, ${jx('$.texte')}, ${jx('$.donnees')}, ?4
       FROM json_each(?1) AS j JOIN contact c ON c.id = ${jx('$.id')}
       WHERE (${jx('$.nouveau')} = 1) OR (${garde} AND ${libre(jx('$.apres.telephone'), 'c.id')} AND ${libre(jx('$.apres.email'), 'c.id')})`)
      .bind(charge, lot, maintenant, par),
    env.DB.prepare(`UPDATE contact SET ${set} FROM json_each(?1) AS j
       WHERE contact.id = ${jx('$.id')} AND ${jx('$.nouveau')} = 0 AND ${ecrit('contact.id')}`).bind(charge, lot),
    env.DB.prepare(`INSERT INTO contact_coordonnee (contact_id, type, reseau, valeur, ajoute_le)
       SELECT ${jx('$.id')}, json_extract(s.value, '$.type'), json_extract(s.value, '$.reseau'), json_extract(s.value, '$.valeur'), ?3
       FROM json_each(?1) AS j, json_each(j.value, '$.secondaires') AS s
       WHERE ${ecrit(jx('$.id'))} AND ${libre("json_extract(s.value, '$.valeur')")}`).bind(charge, lot, maintenant),
    env.DB.prepare(`INSERT INTO contact_source (contact_id, source, lieu, mois, import_lot_id, a)
       SELECT ${jx('$.id')}, json_extract(s.value, '$.source'), json_extract(s.value, '$.lieu'), json_extract(s.value, '$.mois'), ?2, ?3
       FROM json_each(?1) AS j, json_each(j.value, '$.lignesSource') AS s WHERE ${ecrit(jx('$.id'))}`)
      .bind(charge, lot, maintenant),
    // Story 18.17 : une rencontre complète la ligne de source d'un import précédent (seulement si elle n'a pas changé depuis).
    env.DB.prepare(`UPDATE contact_source SET lieu = json_extract(s.value, '$.lieu'), mois = json_extract(s.value, '$.mois')
       FROM json_each(?1) AS j, json_each(j.value, '$.sourcesCompletees') AS s
       WHERE contact_source.id = json_extract(s.value, '$.id') AND contact_source.contact_id = ${jx('$.id')}
         AND contact_source.lieu IS json_extract(s.value, '$.avant_lieu') AND contact_source.mois IS json_extract(s.value, '$.avant_mois') AND ${ecrit(jx('$.id'))}`)
      .bind(charge, lot),
    env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, par)
       SELECT ${jx('$.id')}, ?3, 'note', 'claude', ?2 || '.' || ${jx('$.id')} || '.n' || s.key, s.value, ?4
       FROM json_each(?1) AS j, json_each(j.value, '$.notes') AS s WHERE ${ecrit(jx('$.id'))}`).bind(charge, lot, maintenant, par),
    accordImport(env, charge, lot, maintenant),
  ]);
  const ids = JSON.stringify(ecritures.map((x) => `${lot}.${x.id}`));
  const [faits, accords] = await env.DB.batch([
    env.DB.prepare(`SELECT json_extract(donnees, '$.creation') AS creation, count(*) AS n FROM contact_evenement
       WHERE source = 'claude' AND source_id IN (SELECT value FROM json_each(?1)) GROUP BY 1`).bind(ids),
    env.DB.prepare(`SELECT count(*) AS n FROM contact WHERE id IN (SELECT value FROM json_each(?1)) AND email_accord_source = 'import' AND email_accord_le = ?2`)
      .bind(JSON.stringify(ecritures.map((x) => x.id)), maintenant),
  ]) as [D1Result<{ creation: number; n: number }>, D1Result<{ n: number }>];
  return {
    nouveaux: faits.results.find((x) => x.creation === 1)?.n ?? 0,
    complements: faits.results.find((x) => x.creation === 0)?.n ?? 0,
    accords: accords.results[0]?.n ?? 0,
  };
}

export type RaisonGarde = 'modifie_depuis' | 'dans_le_suivi' | 'demande_du_site' | 'modifie_entre_temps';
export interface ResultatAnnulationImport { supprimes: number; rendus: number; gardes: { ligne: string; raison: RaisonGarde }[] }

/**
 * Annule un lot d'import (AD-26, AD-29). Supprime les contacts qu'il a créés et rejoue l'avant-image de ceux qu'il a
 * complétés (colonnes, coordonnées ajoutées, sources, notes, accord), sauf les contacts modifiés depuis : un événement
 * postérieur à celui du lot et qui n'est pas de ce lot (Anne, JB, une séance, un autre import, une demande du site), un
 * contact entré dans le suivi ou rattaché à une demande. Ceux-là restent, et sont listés par leur repère de ligne dans le
 * fichier (jamais par leurs données). L'annulation est elle-même écrite comme un lot, avec ses événements (`annule`).
 */
export async function annulerImport(env: EnvSite, lot: string, par: string): Promise<ResultatAnnulationImport> {
  const info = await env.DB.prepare('SELECT a FROM import_lot WHERE id = ?1').bind(lot).first<{ a: string }>();
  const debut = `${lot}.`, fin = `${lot}/`;
  const hors = `NOT (x.source = 'claude' AND x.source_id > ?2 AND x.source_id < ?3)`;
  const evs = (await env.DB.prepare(
    `SELECT e.id AS ev, e.contact_id AS id, e.donnees, c.etape,
       EXISTS (SELECT 1 FROM contact_evenement x WHERE x.contact_id = e.contact_id AND x.id > e.id AND ${hors}) AS modifie,
       EXISTS (SELECT 1 FROM lead l WHERE l.contact_id = e.contact_id) AS demande
     FROM contact_evenement e JOIN contact c ON c.id = e.contact_id
     WHERE e.source = 'claude' AND e.type = 'import' AND e.source_id > ?2 AND e.source_id < ?3 AND e.source_id = ?1 || e.contact_id`,
  ).bind(debut, debut, fin).all<{ ev: number; id: string; donnees: string; etape: string | null; modifie: number; demande: number }>()).results;
  const gardes: ResultatAnnulationImport['gardes'] = [];
  const aSupprimer: { id: string; ev: number; ligne: string }[] = [];
  const aRendre: { id: string; ev: number; ligne: string; avant: Record<string, string | null>; apres: Record<string, string | null>; coordonnees: string[]; accord: boolean; completees: SourceCompletee[] }[] = [];
  for (const e of evs) {
    let d: { avant: Record<string, string | null>; apres: Record<string, string | null>; ligne: string; creation: boolean; coordonnees: string[]; accord: boolean; completees?: SourceCompletee[] };
    try { d = JSON.parse(e.donnees); } catch { continue; }
    const raison: RaisonGarde | null = e.modifie ? 'modifie_depuis' : e.demande ? 'demande_du_site' : e.etape !== null && d.creation ? 'dans_le_suivi' : null;
    if (raison) { gardes.push({ ligne: d.ligne, raison }); continue; }
    if (d.creation) aSupprimer.push({ id: e.id, ev: e.ev, ligne: d.ligne });
    else aRendre.push({ id: e.id, ev: e.ev, ligne: d.ligne, avant: d.avant, apres: d.apres, coordonnees: d.coordonnees ?? [], accord: !!d.accord, completees: d.completees ?? [] });
  }
  const ann = ulid(), maintenant = new Date().toISOString();
  const sansSuite = (idSql: string, evSql: string) => `NOT EXISTS (SELECT 1 FROM contact_evenement x WHERE x.contact_id = ${idSql} AND x.id > ${evSql} AND ${hors})`;
  const ecritures: D1PreparedStatement[] = [];
  if (aSupprimer.length) {
    // Les tables filles (coordonnées, sources, événements, Nouveaux…) suivent par ON DELETE CASCADE (AD-31).
    ecritures.push(env.DB.prepare(`DELETE FROM contact WHERE etape IS NULL AND NOT EXISTS (SELECT 1 FROM lead l WHERE l.contact_id = contact.id)
       AND id IN (SELECT ${jx('$.id')} FROM json_each(?1) AS j WHERE ${sansSuite(jx('$.id'), jx('$.ev'))})`).bind(JSON.stringify(aSupprimer), debut, fin));
  }
  if (aRendre.length) {
    const charge = JSON.stringify(aRendre.map((x) => ({ ...x, donnees: JSON.stringify({ avant: x.apres, apres: x.avant, lot: ann, annule: lot, ligne: x.ligne }) })));
    const garde = COLONNES_IMPORT.map((c) => `(json_type(j.value, '$.apres.${c}') IS NULL OR c.${c} IS ${jx(`$.apres.${c}`)})`).join(' AND ');
    const rendu = (id: string) => `EXISTS (SELECT 1 FROM contact_evenement r WHERE r.source = 'claude' AND r.source_id = ?4 || '.' || ${id})`;
    const set = COLONNES_IMPORT.map((c) => `${c} = CASE WHEN json_type(j.value, '$.avant.${c}') IS NULL THEN contact.${c} ELSE ${jx(`$.avant.${c}`)} END`).join(', ');
    ecritures.push(
      env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees, par)
         SELECT c.id, ?5, 'import', 'claude', ?4 || '.' || c.id, 'Import annulé', ${jx('$.donnees')}, ?6
         FROM json_each(?1) AS j JOIN contact c ON c.id = ${jx('$.id')} WHERE ${garde} AND ${sansSuite('c.id', jx('$.ev'))}`)
        .bind(charge, debut, fin, ann, maintenant, par),
      env.DB.prepare(`UPDATE contact SET ${set} FROM json_each(?1) AS j WHERE contact.id = ${jx('$.id')} AND ${rendu('contact.id')}`)
        .bind(charge, debut, fin, ann),
      env.DB.prepare(`DELETE FROM contact_coordonnee WHERE id IN (SELECT k.id FROM json_each(?1) AS j, json_each(j.value, '$.coordonnees') AS v
         JOIN contact_coordonnee k ON k.contact_id = ${jx('$.id')} AND k.valeur = v.value WHERE ${rendu(jx('$.id'))})`).bind(charge, debut, fin, ann),
      env.DB.prepare(`DELETE FROM contact_source WHERE import_lot_id = ?2 AND contact_id IN (SELECT ${jx('$.id')} FROM json_each(?1) AS j WHERE ${rendu(jx('$.id'))})`)
        .bind(charge, lot, fin, ann),
      // Story 18.17 : les lignes de source complétées par ce lot (autre lot) retrouvent leur lieu et leur mois d'avant, si personne n'y a touché.
      env.DB.prepare(`UPDATE contact_source SET lieu = json_extract(s.value, '$.avant_lieu'), mois = json_extract(s.value, '$.avant_mois')
         FROM json_each(?1) AS j, json_each(j.value, '$.completees') AS s
         WHERE contact_source.id = json_extract(s.value, '$.id') AND contact_source.lieu IS json_extract(s.value, '$.lieu') AND contact_source.mois IS json_extract(s.value, '$.mois')
           AND contact_source.contact_id = ${jx('$.id')} AND ${rendu(jx('$.id'))}`).bind(charge, debut, fin, ann),
      env.DB.prepare(`DELETE FROM contact_evenement WHERE source = 'claude' AND type = 'note' AND source_id > ?2 AND source_id < ?3
         AND contact_id IN (SELECT ${jx('$.id')} FROM json_each(?1) AS j WHERE ${rendu(jx('$.id'))})`).bind(charge, debut, fin, ann),
    );
    if (info) {
      ecritures.push(retraitAccordImport(env, JSON.stringify(aRendre.filter((x) => x.accord).map((x) => x.id)), info.a,
        `EXISTS (SELECT 1 FROM contact_evenement r WHERE r.source = 'claude' AND r.source_id = ?3 || '.' || contact.id)`, ann));
    }
  }
  if (ecritures.length) await env.DB.batch(ecritures);
  const [restants, rendus] = await env.DB.batch([
    env.DB.prepare('SELECT id FROM contact WHERE id IN (SELECT value FROM json_each(?1))').bind(JSON.stringify(aSupprimer.map((x) => x.id))),
    env.DB.prepare(`SELECT contact_id AS id FROM contact_evenement WHERE source = 'claude' AND source_id > ?1 AND source_id < ?2`).bind(`${ann}.`, `${ann}/`),
  ]) as [D1Result<{ id: string }>, D1Result<{ id: string }>];
  const reste = new Set(restants.results.map((x) => x.id)), faits = new Set(rendus.results.map((x) => x.id));
  for (const x of aSupprimer) if (reste.has(x.id)) gardes.push({ ligne: x.ligne, raison: 'modifie_entre_temps' });
  for (const x of aRendre) if (!faits.has(x.id)) gardes.push({ ligne: x.ligne, raison: 'modifie_entre_temps' });
  return { supprimes: aSupprimer.length - reste.size, rendus: faits.size, gardes };
}
