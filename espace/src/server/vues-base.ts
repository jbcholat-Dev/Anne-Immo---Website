// Vues enregistrées de la page Contacts (story 18.5, AD-27) : seul module qui lit et écrit la table `vue` (migration 0018).
// Chaque filtre est revérifié contre le vocabulaire fermé de `vues.ts` avant d'être écrit, et aussi à la lecture : une
// valeur refusée d'une liste (une catégorie supprimée) est retirée, jamais la clé entière ; si une clé se retrouve vide, ou
// si une clé à valeur unique est refusée, la vue est marquée invalide et ne garde aucun contact (revue de code 18.5 : une
// vue élargie en silence servirait plus tard à choisir les destinataires d'une campagne, FR-17).
// « Tous les contacts » n'est pas en base : elle ne peut être ni renommée ni supprimée.
// Jamais lu par les routes /api/claude/… (AD-26 : Claude ne lit ni les contacts ni les vues).
import type { EnvSite } from '@site/server/env';
import { ulid } from '@site/server/ulid';
import { VOCABULAIRE, verifierFiltre, type Filtre, type Vue } from './vues';

/** Au plus 100 vues (revue de code 18.5). */
export const MAX_VUES = 100;
export const nombreVues = async (env: EnvSite) => (await env.DB.prepare('SELECT count(*) AS n FROM vue').first<{ n: number }>())?.n ?? 0;

interface LigneVue { id: string; nom: string; ordre: number; filtre: string }

/** Les identifiants de la table `categorie` (une vue ne cite qu'une catégorie qui existe, AD-25). */
export async function idsCategories(env: EnvSite): Promise<Set<string>> {
  return new Set((await env.DB.prepare('SELECT id FROM categorie').all<{ id: string }>()).results.map((c) => c.id));
}

function lire(v: LigneVue, categories: ReadonlySet<string>): Vue {
  let brut: unknown = null;
  try { brut = JSON.parse(v.filtre); } catch {}
  const filtre = verifierFiltre(brut, categories);
  if (typeof filtre !== 'string') return { id: v.id, nom: v.nom, ordre: v.ordre, filtre };
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return { id: v.id, nom: v.nom, ordre: v.ordre, filtre: {}, invalide: 'filtre illisible' };
  // Clé par clé : dans une liste, seules les valeurs refusées partent ; une liste vidée ou une autre clé refusée rend la vue invalide.
  const garde: Record<string, unknown> = {};
  let invalide: string | undefined;
  for (const [k, val] of Object.entries(brut as Record<string, unknown>)) {
    const une = verifierFiltre({ [k]: val }, categories);
    if (typeof une !== 'string') { Object.assign(garde, une); continue; }
    const restes = Array.isArray(val) ? val.filter((x) => typeof verifierFiltre({ [k]: [x] }, categories) !== 'string') : [];
    const liste = Array.isArray(val) && val.length > 0 && Object.prototype.hasOwnProperty.call(VOCABULAIRE, k) && 'liste' in VOCABULAIRE[k as keyof typeof VOCABULAIRE];
    if (liste && restes.length) { garde[k] = [...new Set(restes)]; continue; }
    invalide ??= k === 'categorie_id' ? 'une catégorie a disparu' : 'un filtre n\'est plus reconnu';
    garde[k] = val;
  }
  return invalide ? { id: v.id, nom: v.nom, ordre: v.ordre, filtre: garde as Filtre, invalide } : { id: v.id, nom: v.nom, ordre: v.ordre, filtre: garde as Filtre };
}

export async function listerVues(env: EnvSite): Promise<Vue[]> {
  const [vues, categories] = await Promise.all([
    // Ordres égaux départagés par l'identifiant, comme dans le navigateur (revue de code 18.5).
    env.DB.prepare('SELECT id, nom, ordre, filtre FROM vue ORDER BY ordre, id').all<LigneVue>(),
    idsCategories(env),
  ]);
  return vues.results.map((v) => lire(v, categories));
}

/**
 * Crée une vue en dernière position ; ou, avec `id` et `ordre`, remet à sa place une vue qui vient d'être supprimée
 * (annulation) : si cet ordre est déjà pris, elle va en dernière position (revue de code 18.5).
 */
export async function creerVue(env: EnvSite, nom: string, filtre: Filtre, retour?: { id: string; ordre: number }): Promise<Vue | null> {
  const maintenant = new Date().toISOString();
  const id = retour?.id ?? ulid();
  const r = await env.DB.prepare(
    `INSERT INTO vue (id, nom, ordre, filtre, created_at, maj_le)
     SELECT ?1, ?2, ${retour ? 'CASE WHEN EXISTS (SELECT 1 FROM vue WHERE ordre = ?5) THEN coalesce((SELECT max(ordre) FROM vue), 0) + 1 ELSE ?5 END' : 'coalesce((SELECT max(ordre) FROM vue), 0) + 1'}, ?3, ?4, ?4
     WHERE NOT EXISTS (SELECT 1 FROM vue WHERE id = ?1)`,
  ).bind(id, nom, JSON.stringify(filtre), maintenant, ...(retour ? [retour.ordre] : [])).run();
  if (!r.meta.changes) return null;
  const v = await env.DB.prepare('SELECT ordre FROM vue WHERE id = ?1').bind(id).first<{ ordre: number }>();
  return { id, nom, ordre: v?.ordre ?? 0, filtre };
}

export async function renommerVue(env: EnvSite, id: string, nom: string): Promise<Vue | null> {
  const v = await env.DB.prepare('UPDATE vue SET nom = ?2, maj_le = ?3 WHERE id = ?1 RETURNING id, nom, ordre, filtre')
    .bind(id, nom, new Date().toISOString()).first<LigneVue>();
  return v ? lire(v, await idsCategories(env)) : null;
}

/** Supprime une vue et la renvoie telle qu'elle était, pour que la page propose aussitôt de l'annuler. */
export async function supprimerVue(env: EnvSite, id: string): Promise<Vue | null> {
  const v = await env.DB.prepare('DELETE FROM vue WHERE id = ?1 RETURNING id, nom, ordre, filtre').bind(id).first<LigneVue>();
  return v ? lire(v, await idsCategories(env)) : null;
}
