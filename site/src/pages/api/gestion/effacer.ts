// Droit à l'effacement (RGPD art. 17, story 10.7) : supprime toutes les demandes d'une adresse e-mail et leurs envois.
// Irréversible : la personne connectée doit retaper l'adresse pour confirmer. POST /api/gestion/effacer.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '../../../server/acces';
import { envSite } from '../../../server/env';
import { effacer } from '../../../server/rights';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  if (!compte) return new Response('Accès refusé', { status: 403 });
  const f = await request.formData();
  const email = String(f.get('email') ?? '').trim();
  const confirmation = String(f.get('confirmation') ?? '').trim();
  if (!email || confirmation.toLowerCase() !== email.toLowerCase()) {
    return redirect(`/gestion?q=${encodeURIComponent(email)}&m=confirmation`, 303);
  }
  const n = await effacer(envSite, email, compte);
  return redirect(`/gestion?m=efface-${n}`, 303);
};
