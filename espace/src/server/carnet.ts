// Le carnet (story 18.6, FR-4, FR-5, AD-22, AD-24, AD-29, AD-31) : seul module qui écrit le classement d'un contact,
// c'est-à-dire sa catégorie, son projet, sa température, « vérifié » (`verifie_le`) et « écarté » (`ecarte_le`).
// Il ne touche jamais aux colonnes du suivi des ventes (`etape`, `prochaine_action*`, `parcours`… : `pipeline`), ni au
// dernier contact (`dernier_contact_*` : la coche d'une séance, AD-28), ni à l'accord e-mail (`accord`).
// Chaque écriture est un lot : toutes les lignes changent en une seule exécution D1 (`batch`, une transaction), et chaque
// contact touché reçoit un `contact_evenement` de type `classement` qui garde son avant-image :
// `donnees` = { avant: {colonne: valeur}, apres: {colonne: valeur}, lot } (AD-29), `source_id` = « lot.contact » (index
// unique déjà présent, qui sert aussi à retrouver un lot pour l'annuler). Annuler un lot réécrit `avant` par ce module,
// pour les seuls contacts restés tels que le lot les a laissés (sinon une écriture plus récente l'emporte, AD-29).
// Règles (PRD FR-4, AD-24) : choisir une catégorie la confirme (vérifié) ; un projet sans température (à qualifier,
// ambassadeur) ou incompatible efface la température ; « avec Anne » et « terminé » ne se choisissent jamais ici (ils
// viennent du suivi des ventes) ; un contact suivi (étape autre que perdu ou en sommeil) garde la température que le suivi
// lui donne, et reçoit « avec Anne » (« terminé » s'il est vendu ou acté) quand son projet devient connu.
// Les CHECK de la migration 0018 restent le dernier filet : une combinaison refusée fait échouer tout le lot.
// Jamais appelé par les routes /api/claude/… (Claude ne lit ni n'écrit les contacts, AD-26).
import type { EnvSite } from '@site/server/env';
import { ulid } from '@site/server/ulid';
import { PROJETS, PROJETS_AVEC_TEMPERATURE, TEMPERATURES_CHOIX, suiviEnCours, temperaturePermise } from './tableau-colonnes';

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
  if (ch.categorie_id !== undefined) { a.categorie_id = ch.categorie_id; a.verifie_le ??= maintenant; }
  if (ch.verifie !== undefined) a.verifie_le = ch.verifie ? a.verifie_le ?? maintenant : null;
  if (ch.ecarte !== undefined) a.ecarte_le = ch.ecarte ? a.ecarte_le ?? maintenant : null;
  if (ch.projet !== undefined) {
    a.projet = ch.projet;
    if (!temperaturePermise(a.temperature, a.projet)) a.temperature = null;
    if (suiviEnCours(e.etape) && PROJETS_AVEC_TEMPERATURE.includes(a.projet) && a.temperature === null) {
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

interface Ecriture { id: string; avant: Partial<Classement>; apres: Partial<Classement> }

/** Écrit un lot en une seule exécution : les colonnes de `apres` de chaque contact, puis un événement par contact. */
async function ecrire(env: EnvSite, ecritures: Ecriture[], lot: string, par: string, texte: string, annule?: string): Promise<void> {
  if (!ecritures.length) return;
  const maintenant = new Date().toISOString();
  const set = COLONNES.map((c) => `${c} = CASE WHEN json_type(j.value, '$.apres.${c}') IS NULL THEN contact.${c} ELSE json_extract(j.value, '$.apres.${c}') END`).join(', ');
  const charge = JSON.stringify(ecritures.map((x) => ({ id: x.id, apres: x.apres })));
  const evenements = JSON.stringify(ecritures.map((x) => ({
    id: x.id, donnees: JSON.stringify({ avant: x.avant, apres: x.apres, lot, ...(annule ? { annule } : {}) }),
  })));
  await env.DB.batch([
    // Une boucle sur le lot, chaque contact trouvé par sa clé (plan vérifié : pas de parcours de toute la table).
    env.DB.prepare(`UPDATE contact SET ${set}, last_activity_at = ?2 FROM json_each(?1) AS j WHERE contact.id = json_extract(j.value, '$.id')`)
      .bind(charge, maintenant),
    env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees, par)
       SELECT json_extract(value, '$.id'), ?2, 'classement', 'anne', ?3 || '.' || json_extract(value, '$.id'), ?4, json_extract(value, '$.donnees'), ?5
       FROM json_each(?1)`).bind(evenements, maintenant, lot, texte, par),
  ]);
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
 * qui ne s'applique pas ; `inchanges` : déjà dans l'état demandé ; `inconnus` : identifiants absents (effacés entre-temps).
 */
export async function classer(env: EnvSite, ids: string[], ch: Changements, par: string): Promise<ResultatLot> {
  const etats = await lireEtats(env, ids);
  const maintenant = new Date().toISOString();
  const lot = ulid();
  const ecritures: Ecriture[] = [];
  let ignores = 0;
  for (const e of etats) {
    const { apres, ignore } = appliquer(e, ch, maintenant);
    if (ignore) ignores++;
    const x: Ecriture = { id: e.id, avant: {}, apres: {} };
    for (const c of COLONNES) {
      if (apres[c] !== e[c]) { (x.avant as Record<string, unknown>)[c] = e[c]; (x.apres as Record<string, unknown>)[c] = apres[c]; }
    }
    if (Object.keys(x.apres).length) ecritures.push(x);
  }
  await ecrire(env, ecritures, lot, par, resume(ch));
  return {
    lot: ecritures.length ? lot : null, touches: ecritures.length, ignores, inchanges: etats.length - ecritures.length,
    inconnus: ids.length - etats.length, lignes: await lignes(env, ecritures.map((x) => x.id)),
  };
}

export interface ResultatAnnulation { lot: string | null; rendus: number; gardes: number; lignes: LigneClassee[] }

/**
 * Annule un lot : rejoue l'avant-image de chaque contact qu'il a touché, si ce contact est encore tel que le lot l'a
 * laissé (colonnes de `apres` inchangées) ; les autres, modifiés depuis, sont gardés et comptés. Un lot déjà annulé ne
 * rend plus rien. L'annulation est elle-même un lot, avec ses événements (`annule` = lot annulé).
 */
export async function annulerLot(env: EnvSite, lot: string, par: string): Promise<ResultatAnnulation | null> {
  const evs = (await env.DB.prepare(
    `SELECT contact_id, donnees FROM contact_evenement WHERE source = 'anne' AND source_id > ?1 AND source_id < ?2 AND type = 'classement'`,
  ).bind(`${lot}.`, `${lot}/`).all<{ contact_id: string; donnees: string }>()).results;
  if (!evs.length) return null;
  const parContact = new Map<string, { avant: Partial<Classement>; apres: Partial<Classement> }>();
  for (const e of evs) {
    try { const d = JSON.parse(e.donnees) as { avant: Partial<Classement>; apres: Partial<Classement>; lot: string }; if (d.lot === lot) parContact.set(e.contact_id, d); } catch {}
  }
  const etats = await lireEtats(env, [...parContact.keys()]);
  const ecritures: Ecriture[] = [];
  for (const e of etats) {
    const d = parContact.get(e.id)!;
    const intact = (Object.keys(d.apres) as Colonne[]).every((c) => COLONNES.includes(c) && e[c] === d.apres[c]);
    // Le classement rendu doit rester permis avec le projet d'aujourd'hui (CHECK de 0018), sinon le contact est gardé.
    const projet = d.avant.projet ?? e.projet, temperature = d.avant.temperature !== undefined ? d.avant.temperature : e.temperature;
    if (intact && temperaturePermise(temperature, projet)) ecritures.push({ id: e.id, avant: d.apres, apres: d.avant });
  }
  const nouveau = ulid();
  await ecrire(env, ecritures, nouveau, par, 'Classement annulé', lot);
  return { lot: ecritures.length ? nouveau : null, rendus: ecritures.length, gardes: parContact.size - ecritures.length, lignes: await lignes(env, ecritures.map((x) => x.id)) };
}
