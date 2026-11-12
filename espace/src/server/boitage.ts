// Tableau du boîtage (story 18.19, ticket n° 249) : un passage de boîtage vu comme une ligne d'un tableau, avec les colonnes
// qu'Anne tient dans son classeur : date, ville, quartier, type de bien, flyers, numéro de message, R1 et R2, commentaires.
// Même table que les passages de /ajouter (`passage_boitage`, migrations 0007, 0010, 0023 et 0024) : « date » est `fait_le`,
// « flyers » est `mots`. `secteur` reste obligatoire (bilan par secteur, boîtage à refaire, choix du passage à la saisie d'un
// contact) : il est tenu à jour ici, « ville · quartier » ou la ville seule.
// Story 18.20 (tickets n° 256 à 258) : R1 et R2 sont le NOMBRE de premiers et de seconds rendez-vous qu'un passage a amenés
// (`r1_nb`, `r2_nb`, entiers de 0 à 9999), et non des dates de relance comme 18.19 l'avait cru ; les anciennes colonnes
// `r1` et `r2` de la migration 0023 ne sont plus lues ni écrites. La date de chaque rendez-vous vit sur la fiche du contact
// (`contact.r1_le`, `contact.r2_le`). Le coût du passage (`cout_centimes`) n'est pas un champ du tableau : seul /ajouter le fournit, à `ajouterBoitage`.
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
  /** Nombre de premiers rendez-vous amenés par ce passage. */
  r1: number | null;
  /** Nombre de seconds rendez-vous. */
  r2: number | null;
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
    if (!vide(d[k]) && !(typeof d[k] === 'number' && Number.isInteger(d[k]) && (d[k] as number) >= 0 && (d[k] as number) <= 9999)) return `${k.toUpperCase()} est un nombre entier de rendez-vous, de 0 à 9 999.`;
    sortie[k] = vide(d[k]) ? null : d[k] as number;
  }
  return sortie;
}

// Un passage noté sur /ajouter n'a pas de ville : son secteur en tient lieu.
const SELECTION = `SELECT id, fait_le, coalesce(ville, secteur) AS ville, quartier, type_bien, mots AS flyers, message, r1_nb AS r1, r2_nb AS r2, commentaire FROM passage_boitage`;

/** Les passages, du plus récent au plus ancien. */
export async function listerBoitage(env: EnvSite): Promise<LigneBoitage[]> {
  const { results } = await env.DB.prepare(`${SELECTION} ORDER BY fait_le DESC, created_at DESC, id DESC LIMIT ?1`).bind(MAX_LIGNES).all<LigneBoitage>();
  return results;
}

/** Les villes déjà notées (suggestions de /ajouter) ; un passage d'avant 18.19, sans ville, donne son secteur. */
export async function listerVilles(env: EnvSite): Promise<string[]> {
  const { results } = await env.DB.prepare('SELECT DISTINCT coalesce(ville, secteur) AS ville FROM passage_boitage ORDER BY 1 LIMIT 200').all<{ ville: string }>();
  return results.map((r) => r.ville);
}

export async function lireBoitage(env: EnvSite, id: string): Promise<LigneBoitage | null> {
  return env.DB.prepare(`${SELECTION} WHERE id = ?1`).bind(id).first<LigneBoitage>();
}

/** Ajoute un passage (champs déjà vérifiés en mode complet) ; `coutCentimes` : le coût des flyers, saisi sur /ajouter. Renvoie son id. */
export async function ajouterBoitage(env: EnvSite, c: ChampsBoitage, coutCentimes: number | null = null): Promise<string> {
  const id = ulid();
  await env.DB.prepare(
    `INSERT INTO passage_boitage (id, created_at, secteur, fait_le, mots, ville, quartier, type_bien, message, r1_nb, r2_nb, commentaire, cout_centimes)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
  ).bind(id, new Date().toISOString(), secteurDe(c.ville, c.quartier), c.fait_le, c.flyers, c.ville, c.quartier, c.type_bien, c.message, c.r1, c.r2, c.commentaire, coutCentimes).run();
  return id;
}

/**
 * Corrige un passage : seuls les champs présents changent. Renvoie la ligne à jour, ou `null` si le passage n'existe pas.
 */
export async function corrigerBoitage(env: EnvSite, id: string, patch: Partial<ChampsBoitage>): Promise<LigneBoitage | null> {
  const avant = await lireBoitage(env, id);
  if (!avant) return null;
  const { id: _, ...courant } = avant;
  const apres: ChampsBoitage = { ...courant, ...patch };
  // Seuls les champs reçus sont écrits : corriger un ancien passage (sans ville) ne lui en invente pas une. Le secteur suit la
  // ville et le quartier quand l'un des deux est touché.
  const colonne = { fait_le: 'fait_le', ville: 'ville', quartier: 'quartier', type_bien: 'type_bien', flyers: 'mots', message: 'message', r1: 'r1_nb', r2: 'r2_nb', commentaire: 'commentaire' } as const;
  const cles = (Object.keys(patch) as (keyof ChampsBoitage)[]).filter((k) => k in colonne);
  const colonnes = cles.map((k, i) => `${colonne[k]} = ?${i + 2}`);
  const valeurs: unknown[] = cles.map((k) => patch[k]);
  if ('ville' in patch || 'quartier' in patch) { colonnes.push(`secteur = ?${valeurs.length + 2}`); valeurs.push(secteurDe(apres.ville, apres.quartier)); }
  await env.DB.prepare(`UPDATE passage_boitage SET ${colonnes.join(', ')} WHERE id = ?1`).bind(id, ...valeurs).run();
  return lireBoitage(env, id);
}
