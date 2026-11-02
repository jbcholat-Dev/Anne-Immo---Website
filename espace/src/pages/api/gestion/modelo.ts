// Marque « recopiée dans Modelo » (le logiciel de suivi d'Anne) sur une demande, ou son retrait (story 10.7).
// Espace d'Anne (story 13.3) : reprise de site/src/pages/api/gestion/modelo.ts, qui disparaîtra du site en phase 2.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { pourSite as envSite } from '../../../server/env';
import { marquerModelo } from '@site/server/gestion-donnees';

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
