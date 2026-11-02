// Accès de Claude aux actions marketing (story 13.17). worker.ts n'ouvre /api/claude/… qu'au jeton de service de Claude
// (compte COMPTE_CLAUDE) ; aucune personne connectée n'y passe. Claude peut lister les actions avec leurs totaux, en créer
// et en modifier, jamais lire un contact ni en supprimer une (Anne la supprime dans l'espace).
//   GET  /api/claude/actions          → { actions: [...] } avec contacts, qualifiés, rendez-vous, mandats par action
//   POST /api/claude/actions          → crée (sans id) ou modifie (avec id) ; corps JSON : nom, canal, debut, fin,
//                                       budget_centimes, cout_centimes, note. Réponse { id }.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { enregistrerAction, listerActions, verifierAction } from '../../../server/actions';
import { COMPTE_CLAUDE, pourSite as env } from '../../../server/env';
import { ULID } from '../../../server/formulaires';

export const prerender = false;
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const pourClaude = (request: Request) => request.headers.get(ENTETE_COMPTE) === COMPTE_CLAUDE;

export const GET: APIRoute = async ({ request }) => {
  if (!pourClaude(request)) return json({ erreur: 'Accès refusé' }, 403);
  return json({ actions: await listerActions(env) });
};

export const POST: APIRoute = async ({ request }) => {
  if (!pourClaude(request)) return json({ erreur: 'Accès refusé' }, 403);
  let d: Record<string, unknown>;
  try { d = (await request.json()) as Record<string, unknown>; } catch { return json({ erreur: 'Corps JSON attendu' }, 400); }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return json({ erreur: 'Corps JSON attendu' }, 400);
  const id = typeof d.id === 'string' ? d.id : null;
  if (id !== null && !ULID.test(id)) return json({ erreur: 'Identifiant invalide' }, 400);
  const a = verifierAction(d);
  if (typeof a === 'string') return json({ erreur: a }, 400);
  const enregistree = await enregistrerAction(env, id, a, 'claude', COMPTE_CLAUDE);
  if (!enregistree) return json({ erreur: 'Action inconnue' }, 404);
  return json({ id: enregistree }, id ? 200 : 201);
};
