// ESSAI story 10.1 : route serveur qui lit le binding D1.
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
export const prerender = false;
export const GET: APIRoute = async () => {
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS essai_cron (at TEXT, cron TEXT)').run();
  const { results } = await env.DB.prepare('SELECT at, cron FROM essai_cron ORDER BY at DESC').all();
  return Response.json({ ok: true, executions_cron: results });
};
