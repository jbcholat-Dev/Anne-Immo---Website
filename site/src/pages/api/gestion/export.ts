// Droit d'accès (RGPD art. 15, story 10.7) : toutes les demandes d'une adresse e-mail, en un fichier JSON lisible
// qu'Anne joint à sa réponse. GET /api/gestion/export?email=…
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '../../../server/acces';
import { envSite } from '../../../server/env';
import { exporter } from '../../../server/rights';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  if (!compte) return new Response('Accès refusé', { status: 403 });
  const email = (url.searchParams.get('email') ?? '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response('Adresse e-mail invalide', { status: 400 });
  const donnees = await exporter(envSite, email, compte);
  const nom = `donnees-${email.toLowerCase().replace(/[^a-z0-9.@-]/g, '_')}.json`;
  return new Response(JSON.stringify(donnees, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="${nom}"`, 'Cache-Control': 'no-store' },
  });
};
