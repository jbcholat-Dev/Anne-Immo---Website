// Marque « recopiée dans Modelo » (le logiciel de suivi d'Anne) sur une demande, ou son retrait (story 10.7).
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '../../../server/acces';
import { envSite } from '../../../server/env';
import { marquerModelo } from '../../../server/gestion';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  if (!compte) return new Response('Accès refusé', { status: 403 });
  const f = await request.formData();
  const id = String(f.get('id') ?? '');
  const recopie = f.get('recopie') === '1';
  if (!/^[0-9A-Z]{26}$/.test(id) || !(await marquerModelo(envSite, id, recopie, compte))) return new Response('Demande inconnue', { status: 404 });
  return redirect(`/gestion/lead?id=${id}&m=${recopie ? 'modelo' : 'modelo-annule'}`, 303);
};
