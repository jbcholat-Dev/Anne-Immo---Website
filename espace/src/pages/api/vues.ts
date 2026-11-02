// Vues enregistrées de la page Contacts (story 18.5, FR-2, AD-27). Réservé à Anne et JB (en-tête du compte posé par
// worker.ts après le contrôle Cloudflare Access, comme les autres routes de l'espace) ; le jeton de service de Claude n'y
// passe jamais (worker.ts ne le reconnaît que sous /api/claude/, refusé ici aussi par précaution). Corps en JSON seulement :
// un formulaire d'un autre site ne peut pas l'envoyer sans l'accord du navigateur. Le filtre est vérifié contre le
// vocabulaire fermé (`verifierFiltre`) : une clé ou une valeur inconnue est refusée (400), un filtre vide aussi ; au plus
// 100 vues, vérifié dans l'insertion même (une remise en place après suppression n'y est pas soumise, revue de code 18.6) ; un corps annoncé de plus de 8 000 octets est refusé (413) avant d'être lu (revue de code 18.5).
//   POST   /api/vues  { nom, filtre }                 → 201 { vue } (nouvelle vue, en dernière position)
//   POST   /api/vues  { id, nom, ordre, filtre }      → 201 { vue } (annulation d'une suppression : remise à sa place)
//   PATCH  /api/vues  { id, nom }                     → 200 { vue } (renommer)
//   DELETE /api/vues?id=…                             → 200 { vue } (supprimée ; la vue renvoyée sert à l'annulation)
// « Tous les contacts » n'est pas en base : aucun identifiant ne la désigne, elle ne se renomme ni ne se supprime.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { COMPTE_CLAUDE, pourSite as env } from '../../server/env';
import { ULID } from '../../server/formulaires';
import { nomVue, verifierFiltre } from '../../server/vues';
import { creerVue, idsCategories, MAX_VUES, renommerVue, supprimerVue } from '../../server/vues-base';

export const prerender = false;
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const refuse = (request: Request) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  return !compte || compte === COMPTE_CLAUDE;
};

const MAX_CORPS = 8000;
/** Corps trop grand annoncé par `Content-Length` : 413 avant toute lecture (revue de code 18.5). */
const tropGrand = (request: Request) => Number(request.headers.get('content-length') ?? 0) > MAX_CORPS;

async function corps(request: Request): Promise<Record<string, unknown> | null> {
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return null;
  const texte = await request.text();
  if (texte.length > MAX_CORPS) return null;
  try {
    const d = JSON.parse(texte) as unknown;
    return d && typeof d === 'object' && !Array.isArray(d) ? d as Record<string, unknown> : null;
  } catch { return null; }
}

export const POST: APIRoute = async ({ request }) => {
  if (refuse(request)) return json({ erreur: 'Accès refusé' }, 403);
  if (tropGrand(request)) return json({ erreur: 'Demande trop grande' }, 413);
  const d = await corps(request);
  if (!d) return json({ erreur: 'Corps JSON attendu' }, 400);
  const nom = nomVue(d.nom);
  if (!nom) return json({ erreur: 'Donnez à la vue un nom de 1 à 60 caractères.' }, 400);
  const filtre = verifierFiltre(d.filtre, await idsCategories(env));
  if (typeof filtre === 'string') return json({ erreur: filtre }, 400);
  if (!Object.keys(filtre).length) return json({ erreur: 'Choisissez au moins un filtre.' }, 400);
  let retour: { id: string; ordre: number } | undefined;
  if (d.id !== undefined) {
    if (typeof d.id !== 'string' || !ULID.test(d.id) || !Number.isInteger(d.ordre) || (d.ordre as number) < 0 || (d.ordre as number) > 100_000) {
      return json({ erreur: 'Identifiant ou ordre invalide' }, 400);
    }
    retour = { id: d.id, ordre: d.ordre as number };
  }
  const vue = await creerVue(env, nom, filtre, retour);
  if (vue === 'plein') return json({ erreur: `Au plus ${MAX_VUES} vues : supprimez-en une d'abord.` }, 400);
  if (vue === 'existe') return json({ erreur: 'Cette vue existe déjà' }, 409);
  return json({ vue }, 201);
};

export const PATCH: APIRoute = async ({ request }) => {
  if (refuse(request)) return json({ erreur: 'Accès refusé' }, 403);
  if (tropGrand(request)) return json({ erreur: 'Demande trop grande' }, 413);
  const d = await corps(request);
  if (!d) return json({ erreur: 'Corps JSON attendu' }, 400);
  if (typeof d.id !== 'string' || !ULID.test(d.id)) return json({ erreur: 'Identifiant invalide' }, 400);
  const nom = nomVue(d.nom);
  if (!nom) return json({ erreur: 'Donnez à la vue un nom de 1 à 60 caractères.' }, 400);
  const vue = await renommerVue(env, d.id, nom);
  return vue ? json({ vue }) : json({ erreur: 'Vue inconnue' }, 404);
};

export const DELETE: APIRoute = async ({ request, url }) => {
  if (refuse(request)) return json({ erreur: 'Accès refusé' }, 403);
  const id = url.searchParams.get('id') ?? '';
  if (!ULID.test(id)) return json({ erreur: '« Tous les contacts » ne se supprime pas ; sinon, identifiant invalide' }, 400);
  const vue = await supprimerVue(env, id);
  return vue ? json({ vue }) : json({ erreur: 'Vue inconnue' }, 404);
};
