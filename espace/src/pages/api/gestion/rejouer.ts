// Relance d'un envoi en échec depuis la fiche d'une demande (story 10.7) : POST /api/gestion/rejouer.
// Espace d'Anne (story 13.3) : reprise de site/src/pages/api/gestion/rejouer.ts, qui disparaîtra du site en phase 2.
// La relance est seulement programmée : l'espace n'a pas de clé d'envoi d'e-mails, la tâche planifiée du site s'en charge.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { pourSite as envSite } from '../../../server/env';
import { rejouable, programmerRejeu } from '@site/server/gestion-donnees';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  if (!compte) return new Response('Accès refusé', { status: 403 });
  const f = await request.formData();
  const id = String(f.get('id') ?? '');
  const canal = String(f.get('canal') ?? '');
  if (!/^[0-9A-Z]{26}$/.test(id)) return new Response('Demande inconnue', { status: 404 });
  const ok = rejouable(canal) && (await programmerRejeu(envSite, id, canal, compte));
  return redirect(`/gestion/lead?id=${id}&m=${ok ? 'rejoue' : 'rejeu-impossible'}`, 303);
};
