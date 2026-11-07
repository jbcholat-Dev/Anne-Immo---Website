// Tableau du boîtage (story 18.19, ticket n° 249) : un passage de boîtage vu comme une ligne d'un tableau, avec les colonnes
// qu'Anne tient dans son classeur : date, ville, quartier, type de bien, flyers, numéro de message, relances R1 et R2,
// commentaires. Même table que les passages de /ajouter (`passage_boitage`, migrations 0007, 0010 et 0023) : « date » est
// `fait_le`, « flyers » est `mots`. `secteur` reste obligatoire (bilan par secteur, boîtage à refaire, choix du passage à la
// saisie d'un contact) : il est tenu à jour ici, « ville · quartier » ou la ville seule. Le coût du passage (`cout_centimes`)
// n'est ni lu ni écrit ici : il reste saisi sur /ajouter.
// Hypothèse à confirmer par Anne : R1 et R2 sont les dates des deux relances (second passage ou rappel), pas des résultats.
import type { EnvSite } from '@site/server/env';
import { ulid } from '@site/server/ulid';
import { aujourdhui } from './pipeline';

export const TYPES_BIEN = { maison: 'Maison', appartement: 'Appartement' } as const;
export type TypeBien = keyof typeof TYPES_BIEN;

export interface LigneBoitage {
  id: string;
  fait_le: string;
  ville: string;
  quartier: string | null;
  type_bien: TypeBien | null;
  flyers: number | null;
  message: string | null;
  r1: string | null;
  r2: string | null;
  commentaire: string | null;
}
export type ChampsBoitage = Omit<LigneBoitage, 'id'>;

/** Au plus ce nombre de lignes dans le tableau (une ligne par passage : plusieurs années de boîtage). */
export const MAX_LIGNES = 500;
const CLES = ['fait_le', 'ville', 'quartier', 'type_bien', 'flyers', 'message', 'r1', 'r2', 'commentaire'] as const;
const estDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().startsWith(v);

/** « ville · quartier », ou la ville seule : ce qui remplit `secteur`. */
export const secteurDe = (ville: string, quartier: string | null) => (quartier ? `${ville} · ${quartier}` : ville);

/**
 * Vérifie les champs reçus (JSON). Valeur hors vocabulaire, type inattendu ou champ inconnu : message d'erreur.
 * `complet` : un passage neuf, date et ville exigées ; sinon seuls les champs présents sont vérifiés (correction).
 * Un champ facultatif vide ('' ou null) devient null.
 */
export function verifierBoitage(d: Record<string, unknown>, complet: boolean): Partial<ChampsBoitage> | string {
  if (Object.keys(d).some((k) => !(CLES as readonly string[]).includes(k))) return 'Champ inconnu.';
  const vide = (v: unknown) => v === null || v === '';
  const texte = (k: string, max: number): string | null | undefined => {
    const v = d[k];
    if (v === undefined) return undefined;
    if (vide(v)) return null;
    if (typeof v !== 'string') return undefined;
    return v.trim().slice(0, max) || null;
  };
  const sortie: Partial<ChampsBoitage> = {};
  if (complet || d.fait_le !== undefined) {
    if (!estDate(d.fait_le)) return 'Indiquez la date du passage.';
    if (d.fait_le > aujourdhui()) return 'La date du passage ne peut pas être dans le futur.';
    sortie.fait_le = d.fait_le;
  }
  if (complet || d.ville !== undefined) {
    if (typeof d.ville !== 'string' || !d.ville.trim()) return 'Indiquez la ville.';
    if (d.ville.trim().length > 80) return 'La ville est trop longue (80 caractères au plus).';
    sortie.ville = d.ville.trim();
  }
  for (const [k, max, nom] of [['quartier', 80, 'Le quartier'], ['message', 40, 'Le numéro de message'], ['commentaire', 1000, 'Le commentaire']] as const) {
    if (d[k] === undefined) continue;
    if (!vide(d[k]) && (typeof d[k] !== 'string' || (d[k] as string).trim().length > max)) return `${nom} est trop long (${max} caractères au plus) ou n'est pas un texte.`;
    sortie[k] = texte(k, max) ?? null;
  }
  if (d.type_bien !== undefined) {
    if (!vide(d.type_bien) && !(typeof d.type_bien === 'string' && Object.hasOwn(TYPES_BIEN, d.type_bien))) return 'Le type de bien est « maison » ou « appartement ».';
    sortie.type_bien = vide(d.type_bien) ? null : d.type_bien as TypeBien;
  }
  if (d.flyers !== undefined) {
    if (!vide(d.flyers) && !(typeof d.flyers === 'number' && Number.isInteger(d.flyers) && d.flyers >= 0 && d.flyers <= 999_999)) return 'Le nombre de flyers est un nombre entier, de 0 à 999 999.';
    sortie.flyers = vide(d.flyers) ? null : d.flyers as number;
  }
  for (const k of ['r1', 'r2'] as const) {
    if (d[k] === undefined) continue;
    if (!vide(d[k]) && !estDate(d[k])) return `La date de ${k.toUpperCase()} ne semble pas valable.`;
    sortie[k] = vide(d[k]) ? null : d[k] as string;
  }
  return sortie;
}

/** Une relance ne précède ni le passage ni la relance précédente ; renvoie le message d'erreur, sinon null. */
export function incoherence(c: Pick<ChampsBoitage, 'fait_le' | 'r1' | 'r2'>): string | null {
  if (c.r1 && c.r1 < c.fait_le) return 'R1 est avant la date du passage.';
  if (c.r2 && c.r2 < c.fait_le) return 'R2 est avant la date du passage.';
  if (c.r1 && c.r2 && c.r2 < c.r1) return 'R2 est avant R1.';
  return null;
}

// Un passage noté sur /ajouter n'a pas de ville : son secteur en tient lieu.
const SELECTION = `SELECT id, fait_le, coalesce(ville, secteur) AS ville, quartier, type_bien, mots AS flyers, message, r1, r2, commentaire FROM passage_boitage`;

/** Les passages, du plus récent au plus ancien. */
export async function listerBoitage(env: EnvSite): Promise<LigneBoitage[]> {
  const { results } = await env.DB.prepare(`${SELECTION} ORDER BY fait_le DESC, created_at DESC, id DESC LIMIT ?1`).bind(MAX_LIGNES).all<LigneBoitage>();
  return results;
}

export async function lireBoitage(env: EnvSite, id: string): Promise<LigneBoitage | null> {
  return env.DB.prepare(`${SELECTION} WHERE id = ?1`).bind(id).first<LigneBoitage>();
}

/** Ajoute un passage (champs déjà vérifiés en mode complet). Renvoie son id. */
export async function ajouterBoitage(env: EnvSite, c: ChampsBoitage): Promise<string> {
  const id = ulid();
  await env.DB.prepare(
    `INSERT INTO passage_boitage (id, created_at, secteur, fait_le, mots, ville, quartier, type_bien, message, r1, r2, commentaire)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`,
  ).bind(id, new Date().toISOString(), secteurDe(c.ville, c.quartier), c.fait_le, c.flyers, c.ville, c.quartier, c.type_bien, c.message, c.r1, c.r2, c.commentaire).run();
  return id;
}

/**
 * Corrige un passage : seuls les champs présents changent. Renvoie la ligne à jour, `null` si le passage n'existe pas, ou le
 * message d'erreur si le résultat serait incohérent (relance avant le passage).
 */
export async function corrigerBoitage(env: EnvSite, id: string, patch: Partial<ChampsBoitage>): Promise<LigneBoitage | null | string> {
  const avant = await lireBoitage(env, id);
  if (!avant) return null;
  const { id: _, ...courant } = avant;
  const apres: ChampsBoitage = { ...courant, ...patch };
  const refus = incoherence(apres);
  if (refus) return refus;
  // Seuls les champs reçus sont écrits : corriger un ancien passage (sans ville) ne lui en invente pas une. Le secteur suit la
  // ville et le quartier quand l'un des deux est touché.
  const colonne = { fait_le: 'fait_le', ville: 'ville', quartier: 'quartier', type_bien: 'type_bien', flyers: 'mots', message: 'message', r1: 'r1', r2: 'r2', commentaire: 'commentaire' } as const;
  const cles = (Object.keys(patch) as (keyof ChampsBoitage)[]).filter((k) => k in colonne);
  const colonnes = cles.map((k, i) => `${colonne[k]} = ?${i + 2}`);
  const valeurs: unknown[] = cles.map((k) => patch[k]);
  if ('ville' in patch || 'quartier' in patch) { colonnes.push(`secteur = ?${valeurs.length + 2}`); valeurs.push(secteurDe(apres.ville, apres.quartier)); }
  await env.DB.prepare(`UPDATE passage_boitage SET ${colonnes.join(', ')} WHERE id = ?1`).bind(id, ...valeurs).run();
  return lireBoitage(env, id);
}
