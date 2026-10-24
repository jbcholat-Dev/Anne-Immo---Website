// Bouton « Un retour ? » de l'espace (story 13.20, demande de JB du 2026-10-24) : la remarque d'Anne ou de JB devient un
// ticket GitHub étiqueté « retour-apercu », comme sur l'aperçu du site (code partagé @site/server/retours). L'auteur est
// l'adresse vérifiée par worker.ts (jeton Cloudflare Access) ; le programme de Claude n'atteint pas cette adresse.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { creerTicketRetour } from '@site/server/retours';
import { envEspace } from '../../server/env';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const auteur = request.headers.get(ENTETE_COMPTE);
  if (!auteur) return new Response(JSON.stringify({ ok: false, error: { code: 'acces' } }), { status: 403, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  return creerTicketRetour(request, envEspace, auteur, 'espace');
};
