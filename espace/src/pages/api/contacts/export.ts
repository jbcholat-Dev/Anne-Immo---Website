// Droit d'accès depuis la fiche d'un contact (story 13.23) : tout ce que l'espace garde sur cette personne, en un fichier
// JSON lisible qu'Anne joint à sa réponse. Marche aussi pour un contact sans adresse e-mail. GET /api/contacts/export?id=…
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { exporterContact } from '@site/server/rights';
import { pourSite as envSite } from '../../../server/env';
import { ULID } from '../../../server/formulaires';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  if (!compte) return new Response('Accès refusé', { status: 403 });
  const id = url.searchParams.get('id') ?? '';
  const donnees = ULID.test(id) ? await exporterContact(envSite, id, compte) : null;
  if (!donnees) return new Response('Contact inconnu', { status: 404 });
  return new Response(JSON.stringify(donnees, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': `attachment; filename="donnees-contact-${id}.json"`, 'Cache-Control': 'no-store' },
  });
};
