// Numéro inconnu vu par Leedflow (stories 13.10 et 13.19) : Anne le range dans une catégorie (Privé, Pro, Démarchage) ou
// le remet à trier. Privé et Démarchage effacent ce que l'espace gardait de ses échanges ; un Pro les garde. Le retour se
// fait sur la page d'où vient le geste (« À trier » avec son filtre, ou la fiche du numéro), jamais vers une autre adresse.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { envEspace } from '../../../server/env';
import { classerNumero, estCategorie } from '../../../server/leedflow';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  if (!compte) return new Response('Accès refusé', { status: 403 });
  const f = await request.formData();
  const categorie = String(f.get('categorie') ?? '');
  if (categorie !== 'a_trier' && !estCategorie(categorie)) return new Response('Catégorie inconnue', { status: 400 });
  if (!(await classerNumero(envEspace, String(f.get('telephone') ?? ''), categorie === 'a_trier' ? null : categorie, compte))) {
    return new Response('Numéro invalide', { status: 400 });
  }
  const retour = String(f.get('retour') ?? '');
  const page = /^\/(a-trier|inconnu)(\?[\w%=&.+-]*)?$/.test(retour) ? retour : '/a-trier';
  return redirect(`${page}${page.includes('?') ? '&' : '?'}m=${categorie}`, 303);
};
