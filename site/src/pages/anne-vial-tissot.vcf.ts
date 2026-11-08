import type { APIRoute } from 'astro';
import { identite } from '../config/site';

// Fiche contact d'Anne (story 17.2, retour de JB du 2026-11-08) : le lien « Enregistrer mon numéro dans votre téléphone »
// de la confirmation des ambassadeurs ouvre ce fichier, que le téléphone propose d'ajouter aux contacts. Construit depuis
// la configuration du site : nom, téléphone et e-mail ne sont pas recopiés à la main. En sortie statique, Cloudflare sert
// le fichier selon son extension : le type UTF-8 est posé dans public/_headers (revue de code 17.5), pas ici.
export const GET: APIRoute = () => {
  const tel = (identite.telephone ?? '').replace(/\s/g, '');
  const lignes = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'N:VIAL-TISSOT;Anne;;;',
    `FN:${identite.nom}`,
    'TITLE:Conseillère en immobilier',
    'ORG:eXp France',
    tel ? `TEL;TYPE=CELL:${tel}` : '',
    identite.email ? `EMAIL:${identite.email}` : '',
    `URL:${import.meta.env.SITE ?? 'https://annevialtissot.fr'}`,
    'END:VCARD',
  ].filter(Boolean);
  return new Response(lignes.join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/vcard; charset=utf-8' },
  });
};
