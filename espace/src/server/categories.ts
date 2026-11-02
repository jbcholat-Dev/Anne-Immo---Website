// Catégories et méthodes (story 18.8, FR-12, FR-13, AD-25) : seul module qui écrit les tables `categorie` et
// `message_type` (migration 0018). Le vocabulaire et les règles sans base sont dans `categories-regles.ts`.
// - Les contacts et les vues citent une catégorie par son identifiant (AD-25, AD-27) : un renommage ne change que `nom`,
//   jamais `id` ; aucun contact, aucune vue, aucun événement n'est touché.
// - Une catégorie ne se retire que vide (aucun contact, écartés compris) : la condition est dans la suppression même,
//   en une exécution D1, pour qu'un contact rangé entre la lecture et l'écriture l'empêche. Les six catégories de départ
//   ne se retirent pas : le site (demandes reçues), `accord` (anciens clients) et l'import (pré-rangement, 18.9) les
//   citent par leur identifiant. Une vue qui citait une catégorie retirée est marquée invalide à sa lecture (`vues-base`,
//   story 18.5) et ne montre plus aucun contact.
// - Les messages types gardent leur identifiant quand ils sont modifiés (une séance, epic 19, citera `message_type.id`).
// Jamais appelé par les routes /api/claude/… (Claude ne lit ni n'écrit les catégories, AD-26).
import type { EnvSite } from '@site/server/env';
import { ulid } from '@site/server/ulid';
import { cleNom, estFixe, MAX_CATEGORIES, type Categorie, type EnvoiGroupe, type Methode } from './categories-regles';

interface LigneCategorie {
  id: string; nom: string; ordre: number; canal_conseille: string | null; demande: string | null;
  appel_permis: number; envoi_groupe_permis: number; contacts: number; ecartes: number;
}
interface LigneMessage { id: string; categorie_id: string; nom: string; texte: string; ordre: number }

/** Toutes les catégories, dans leur ordre, avec leur nombre de contacts et leurs messages types. */
export async function listerCategories(env: EnvSite): Promise<Categorie[]> {
  const [cats, messages] = await env.DB.batch([
    env.DB.prepare(`SELECT k.id, k.nom, k.ordre, k.canal_conseille, k.demande, k.appel_permis, k.envoi_groupe_permis,
        count(c.id) AS contacts, count(c.ecarte_le) AS ecartes
      FROM categorie k LEFT JOIN contact c ON c.categorie_id = k.id
      GROUP BY k.id ORDER BY k.ordre, k.nom, k.id`),
    env.DB.prepare('SELECT id, categorie_id, nom, texte, ordre FROM message_type ORDER BY ordre, id'),
  ]) as [D1Result<LigneCategorie>, D1Result<LigneMessage>];
  const parCategorie = new Map<string, LigneMessage[]>();
  for (const m of messages.results) parCategorie.set(m.categorie_id, [...(parCategorie.get(m.categorie_id) ?? []), m]);
  return cats.results.map((k) => ({
    id: k.id, nom: k.nom, ordre: k.ordre, canal_conseille: k.canal_conseille, demande: k.demande,
    appel_permis: !!k.appel_permis, envoi_groupe: (k.envoi_groupe_permis ? 'accord_ou_client' : 'non') as EnvoiGroupe,
    fixe: estFixe(k.id), contacts: k.contacts, ecartes: k.ecartes,
    messages: (parCategorie.get(k.id) ?? []).map((m) => ({ id: m.id, nom: m.nom, texte: m.texte, ordre: m.ordre })),
  }));
}

const lireNoms = async (env: EnvSite) => (await env.DB.prepare('SELECT id, nom FROM categorie').all<{ id: string; nom: string }>()).results;

/**
 * Ajoute une catégorie en dernière position, sans méthode (appel et envoi groupé non permis, à régler ensuite).
 * `existe` : une catégorie porte déjà ce nom (à la casse et aux accents près) ; `plein` : 30 catégories déjà.
 */
export async function ajouterCategorie(env: EnvSite, nom: string): Promise<string | 'existe' | 'plein'> {
  const noms = await lireNoms(env);
  if (noms.some((k) => cleNom(k.nom) === cleNom(nom))) return 'existe';
  const id = ulid();
  // Plafond vérifié dans l'insertion même : deux ajouts simultanés ne le dépassent pas.
  const r = await env.DB.prepare(
    `INSERT INTO categorie (id, nom, ordre) SELECT ?1, ?2, coalesce((SELECT max(ordre) FROM categorie), 0) + 1
     WHERE (SELECT count(*) FROM categorie) < ${MAX_CATEGORIES}`,
  ).bind(id, nom).run();
  return r.meta.changes ? id : 'plein';
}

/** Renomme une catégorie : seul `nom` change. `inconnue`, ou `existe` (une autre porte déjà ce nom). */
export async function renommerCategorie(env: EnvSite, id: string, nom: string): Promise<'ok' | 'inconnue' | 'existe'> {
  const noms = await lireNoms(env);
  if (!noms.some((k) => k.id === id)) return 'inconnue';
  if (noms.some((k) => k.id !== id && cleNom(k.nom) === cleNom(nom))) return 'existe';
  const r = await env.DB.prepare('UPDATE categorie SET nom = ?2 WHERE id = ?1').bind(id, nom).run();
  return r.meta.changes ? 'ok' : 'inconnue';
}

/**
 * Enregistre la méthode complète d'une catégorie : canal conseillé, demande, appel permis, envoi groupé (FR-13 : `non` ou
 * `accord_ou_client`, rien d'autre), et ses messages types dans l'ordre reçu. Un message reçu avec son `id` est modifié
 * (il doit appartenir à cette catégorie), un message sans `id` est créé, un message absent de la liste est retiré.
 * Une seule exécution D1. `inconnue`, ou `message` (identifiant d'un message qui n'est pas de cette catégorie).
 */
export async function enregistrerMethode(env: EnvSite, id: string, m: Methode): Promise<'ok' | 'inconnue' | 'message'> {
  const [cat, existants] = await env.DB.batch([
    env.DB.prepare('SELECT id FROM categorie WHERE id = ?1').bind(id),
    env.DB.prepare('SELECT id FROM message_type WHERE categorie_id = ?1').bind(id),
  ]) as [D1Result<{ id: string }>, D1Result<{ id: string }>];
  if (!cat.results.length) return 'inconnue';
  const ids = new Set(existants.results.map((x) => x.id));
  if (m.messages.some((x) => x.id && !ids.has(x.id))) return 'message';
  const messages = m.messages.map((x, i) => ({ id: x.id ?? ulid(), nom: x.nom, texte: x.texte, ordre: i + 1 }));
  const charge = JSON.stringify(messages);
  await env.DB.batch([
    env.DB.prepare('UPDATE categorie SET canal_conseille = ?2, demande = ?3, appel_permis = ?4, envoi_groupe_permis = ?5 WHERE id = ?1')
      .bind(id, m.canal_conseille, m.demande, m.appel_permis ? 1 : 0, m.envoi_groupe === 'accord_ou_client' ? 1 : 0),
    env.DB.prepare(`DELETE FROM message_type WHERE categorie_id = ?1 AND id NOT IN (SELECT json_extract(value, '$.id') FROM json_each(?2))`).bind(id, charge),
    // Insertion ou mise à jour ; une mise à jour ne vaut que pour un message de cette catégorie (vérifié plus haut, et ici).
    env.DB.prepare(`INSERT INTO message_type (id, categorie_id, nom, texte, ordre)
        SELECT json_extract(value, '$.id'), ?1, json_extract(value, '$.nom'), json_extract(value, '$.texte'), json_extract(value, '$.ordre')
        FROM json_each(?2) WHERE EXISTS (SELECT 1 FROM categorie WHERE id = ?1)
        ON CONFLICT (id) DO UPDATE SET nom = excluded.nom, texte = excluded.texte, ordre = excluded.ordre
        WHERE message_type.categorie_id = excluded.categorie_id`).bind(id, charge),
  ]);
  return 'ok';
}

/** Change l'ordre des catégories : `ids` doit citer chaque catégorie une fois. `liste` : ce n'est pas le cas. */
export async function rangerCategories(env: EnvSite, ids: string[]): Promise<'ok' | 'liste'> {
  const toutes = (await lireNoms(env)).map((k) => k.id);
  if (ids.length !== toutes.length || new Set(ids).size !== ids.length || !ids.every((i) => toutes.includes(i))) return 'liste';
  await env.DB.prepare(`UPDATE categorie SET ordre = j.key + 1 FROM json_each(?1) AS j WHERE categorie.id = j.value`).bind(JSON.stringify(ids)).run();
  return 'ok';
}

/**
 * Retire une catégorie vide, avec ses messages types. La condition « vide » est dans les deux suppressions, exécutées
 * ensemble : un contact rangé entre-temps empêche tout. `fixe` (catégorie de départ), `inconnue`, ou le nombre de
 * contacts qui l'empêchent.
 */
export async function retirerCategorie(env: EnvSite, id: string): Promise<'ok' | 'fixe' | 'inconnue' | { contacts: number }> {
  if (estFixe(id)) return 'fixe';
  const vide = 'NOT EXISTS (SELECT 1 FROM contact WHERE categorie_id = ?1)';
  const [, supprimee] = await env.DB.batch([
    env.DB.prepare(`DELETE FROM message_type WHERE categorie_id = ?1 AND ${vide}`).bind(id),
    env.DB.prepare(`DELETE FROM categorie WHERE id = ?1 AND ${vide} RETURNING id`).bind(id),
  ]) as [D1Result, D1Result<{ id: string }>];
  if (supprimee.results.length) return 'ok';
  const n = await env.DB.prepare('SELECT (SELECT count(*) FROM categorie WHERE id = ?1) AS existe, (SELECT count(*) FROM contact WHERE categorie_id = ?1) AS contacts')
    .bind(id).first<{ existe: number; contacts: number }>();
  return !n?.existe ? 'inconnue' : { contacts: n.contacts };
}
