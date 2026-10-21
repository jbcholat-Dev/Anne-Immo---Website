// Numéro inconnu vu par Leedflow (story 13.10) : Anne l'écarte (appel personnel). Il ne sera plus proposé sur
// « Aujourd'hui », et ce que l'espace en gardait est effacé.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { envEspace } from '../../../server/env';
import { ecarterNumero } from '../../../server/leedflow';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  if (!compte) return new Response('Accès refusé', { status: 403 });
  const f = await request.formData();
  if (!(await ecarterNumero(envEspace, String(f.get('telephone') ?? ''), compte))) return new Response('Numéro invalide', { status: 400 });
  return redirect('/?m=ecarte', 303);
};
