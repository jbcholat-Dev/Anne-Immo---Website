// Vues enregistrées de la page Contacts (story 18.5, AD-27) : seul module qui lit et écrit la table `vue` (migration 0018).
// Chaque filtre est revérifié contre le vocabulaire fermé de `vues.ts` avant d'être écrit, et aussi à la lecture (une vue
// devenue invalide, par exemple une catégorie supprimée, est montrée sans les valeurs refusées plutôt que de casser la page).
// « Tous les contacts » n'est pas en base : elle ne peut être ni renommée ni supprimée.
// Jamais lu par les routes /api/claude/… (AD-26 : Claude ne lit ni les contacts ni les vues).
import type { EnvSite } from '@site/server/env';
import { ulid } from '@site/server/ulid';
import { verifierFiltre, type Filtre, type Vue } from './vues';

interface LigneVue { id: string; nom: string; ordre: number; filtre: string }

/** Les identifiants de la table `categorie` (une vue ne cite qu'une catégorie qui existe, AD-25). */
export async function idsCategories(env: EnvSite): Promise<Set<string>> {
  return new Set((await env.DB.prepare('SELECT id FROM categorie').all<{ id: string }>()).results.map((c) => c.id));
}

function lire(v: LigneVue, categories: Set<string>): Vue {
  let brut: unknown = {};
  try { brut = JSON.parse(v.filtre); } catch {}
  let filtre = verifierFiltre(brut, categories);
  if (typeof filtre === 'string') {
    // Garder les clés valables une à une (une catégorie supprimée ne doit pas rendre la vue illisible).
    const garde: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(brut && typeof brut === 'object' && !Array.isArray(brut) ? brut : {})) {
      const une = verifierFiltre({ [k]: val }, categories);
      if (typeof une !== 'string') Object.assign(garde, une);
    }
    filtre = garde as Filtre;
  }
  return { id: v.id, nom: v.nom, ordre: v.ordre, filtre };
}

export async function listerVues(env: EnvSite): Promise<Vue[]> {
  const [vues, categories] = await Promise.all([
    env.DB.prepare('SELECT id, nom, ordre, filtre FROM vue ORDER BY ordre, created_at, id').all<LigneVue>(),
    idsCategories(env),
  ]);
  return vues.results.map((v) => lire(v, categories));
}

/** Crée une vue en dernière position ; ou, avec `id` et `ordre`, remet à sa place une vue qui vient d'être supprimée (annulation). */
export async function creerVue(env: EnvSite, nom: string, filtre: Filtre, retour?: { id: string; ordre: number }): Promise<Vue | null> {
  const maintenant = new Date().toISOString();
  const id = retour?.id ?? ulid();
  const r = await env.DB.prepare(
    `INSERT INTO vue (id, nom, ordre, filtre, created_at, maj_le)
     SELECT ?1, ?2, ${retour ? '?5' : 'coalesce((SELECT max(ordre) FROM vue), 0) + 1'}, ?3, ?4, ?4
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
