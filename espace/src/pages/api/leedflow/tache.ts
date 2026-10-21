// Tâche proposée par Leedflow (story 13.10) : Anne l'accepte (elle devient la prochaine action du contact) ou l'ignore.
// Retour sur « Aujourd'hui » ou sur la fiche du contact, selon d'où elle a décidé.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { envEspace } from '../../../server/env';
import { deciderTache } from '../../../server/leedflow';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  if (!compte) return new Response('Accès refusé', { status: 403 });
  const f = await request.formData();
  const id = String(f.get('id') ?? '');
  const choix = String(f.get('choix') ?? '');
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id) || (choix !== 'accepter' && choix !== 'ignorer')) return new Response('Demande invalide', { status: 400 });
  const contact = await deciderTache(envEspace, id, choix === 'accepter', compte);
  if (!contact) return new Response('Tâche inconnue ou déjà traitée', { status: 404 });
  const m = choix === 'accepter' ? 'tache-acceptee' : 'tache-ignoree';
  return redirect(f.get('retour') === 'fiche' ? `/contacts/fiche?id=${contact}&m=${m}` : `/?m=${m}`, 303);
};
