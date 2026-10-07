// Route de santé (story 10.2) : prouve que le serveur répond et lit la base des leads.
// Ne renvoie aucune donnée personnelle : seulement le nombre de migrations appliquées.
// Servira à la surveillance automatique (story 10.8).
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const ligne = await env.DB.prepare('SELECT count(*) AS n FROM d1_migrations').first<{ n: number }>();
    return Response.json({ ok: true, migrations: ligne?.n ?? 0 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json(
      { ok: false, error: { code: 'BASE_INDISPONIBLE', message: 'La base des leads ne répond pas.' } },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
};
