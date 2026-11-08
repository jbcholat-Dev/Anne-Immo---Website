import type { APIRoute } from 'astro';
import { identite } from '../config/site';

// Fiche contact d'Anne (story 17.2, retour de JB du 2026-11-08) : le lien « Enregistrer mon numéro dans votre téléphone »
// de la confirmation des ambassadeurs ouvre ce fichier, que le téléphone propose d'ajouter aux contacts. Construit depuis
// la configuration du site : aucun numéro recopié à la main.
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
    'URL:https://annevialtissot.fr',
    'END:VCARD',
  ].filter(Boolean);
  return new Response(lignes.join('\r\n') + '\r\n', {
    headers: { 'Content-Type': 'text/vcard; charset=utf-8', 'Content-Disposition': 'attachment; filename="anne-vial-tissot.vcf"' },
  });
};
