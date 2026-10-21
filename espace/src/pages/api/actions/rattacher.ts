// Action marketing d'un contact (story 13.17), choisie ou corrigée sur sa fiche. « Aucune » retire le rattachement.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { rattacherAction } from '../../../server/actions';
import { pourSite as env } from '../../../server/env';
import { champ, ULID } from '../../../server/formulaires';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  if (!compte) return new Response('Accès refusé', { status: 403 });
  const f = await request.formData();
  const contact = champ(f, 'contact', 30), action = champ(f, 'action', 30);
  if (!ULID.test(contact) || (action && !ULID.test(action))) return new Response('Demande invalide', { status: 400 });
  if (!(await rattacherAction(env, contact, action || null, compte))) return new Response('Action inconnue', { status: 404 });
  return redirect(`/contacts/fiche?id=${contact}&m=action`, 303);
};
