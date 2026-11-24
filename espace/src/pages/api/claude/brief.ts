// Dépôt du brief de la semaine par le chief of staff (story 18.27). worker.ts n'ouvre /api/claude/… qu'au jeton de service
// de Claude (compte COMPTE_CLAUDE). Texte de pilotage seulement : aucun nom de contact, ni e-mail ni téléphone (refusés).
//   GET  /api/claude/brief?s=AAAA-MM-JJ  → { brief: { lundi, bloque, decision, signe, depose_le } | null } (semaine en cours sans s)
//   POST /api/claude/brief               → corps JSON : semaine (facultatif, ramenée au lundi), bloque, decision.
//                                          Réponse { lundi, remplace } ; un nouveau dépôt pour la même semaine remplace l'ancien.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { deposerBriefSemaine, lireBriefSemaine, lundiDemande, verifierDepot } from '../../../server/brief-semaine';
import { COMPTE_CLAUDE, pourSite as env } from '../../../server/env';

export const prerender = false;
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const pourClaude = (request: Request) => request.headers.get(ENTETE_COMPTE) === COMPTE_CLAUDE;

export const GET: APIRoute = async ({ request, url }) => {
  if (!pourClaude(request)) return json({ erreur: 'Accès refusé' }, 403);
  const lundi = lundiDemande(url.searchParams.get('s'));
  if (!lundi) return json({ erreur: 'Semaine invalide (AAAA-MM-JJ attendu)' }, 400);
  return json({ brief: await lireBriefSemaine(env, lundi) });
};

export const POST: APIRoute = async ({ request }) => {
  if (!pourClaude(request)) return json({ erreur: 'Accès refusé' }, 403);
  let d: Record<string, unknown>;
  try { d = (await request.json()) as Record<string, unknown>; } catch { return json({ erreur: 'Corps JSON attendu' }, 400); }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return json({ erreur: 'Corps JSON attendu' }, 400);
  const b = verifierDepot(d);
  if (typeof b === 'string') return json({ erreur: b }, 400);
  const remplace = await deposerBriefSemaine(env, b, COMPTE_CLAUDE);
  return json({ lundi: b.lundi, remplace }, remplace ? 200 : 201);
};
