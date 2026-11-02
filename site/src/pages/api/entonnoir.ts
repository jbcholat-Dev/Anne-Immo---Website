// Comptage anonyme des étapes du diagnostic (story 10.12, AD-11) : POST /api/entonnoir, envoyé par l'îlot du parcours
// et par la page /diagnostic. Aucune donnée personnelle, aucun cookie ; réponse 204 dans tous les cas où rien n'est à
// corriger côté visiteur, pour que le comptage ne gêne jamais le parcours. Détail : src/server/entonnoir.ts.
import type { APIRoute } from 'astro';
import { cleLimite, compterPassage, lirePassage } from '../../server/entonnoir';
import { envSite as env } from '../../server/env';
import { journal } from '../../server/journal';

export const prerender = false;

const vide = (status = 204) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request }) => {
  if (Number(request.headers.get('content-length') ?? 0) > 2_000) return vide(400);
  const ip = request.headers.get('cf-connecting-ip');
  if (ip && !(await env.LIMITE_ENTONNOIR.limit({ key: cleLimite(ip) })).success) return vide(429);
  let passage;
  try {
    passage = lirePassage(JSON.parse((await request.text()).slice(0, 2_000)));
  } catch {
    return vide(400);
  }
  if (!passage) return vide(400);
  try {
    if (!(await compterPassage(env, passage, request.headers.get('user-agent')))) journal('entonnoir_plafond', {});
  } catch (e) {
    journal('entonnoir_echec', { detail: String(e).slice(0, 200) });
    return vide(503);
  }
  return vide();
};
