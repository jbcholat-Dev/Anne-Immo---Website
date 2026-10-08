// Relance d'un envoi en échec depuis la fiche d'une demande (story 10.7) : POST /api/gestion/rejouer.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '../../../server/acces';
import { envSite } from '../../../server/env';
import { rejouable, rejouerEnvoi } from '../../../server/gestion';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  if (!compte) return new Response('Accès refusé', { status: 403 });
  const f = await request.formData();
  const id = String(f.get('id') ?? '');
  const canal = String(f.get('canal') ?? '');
  if (!/^[0-9A-Z]{26}$/.test(id)) return new Response('Demande inconnue', { status: 404 });
  const ok = rejouable(canal) && (await rejouerEnvoi(envSite, id, canal, compte));
  return redirect(`/gestion/lead?id=${id}&m=${ok ? 'rejoue' : 'rejeu-impossible'}`, 303);
};
