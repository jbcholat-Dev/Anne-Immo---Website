// Téléchargement du guide par lien signé (story 10.5, AD-8, CAP-8) : GET /api/guide/telecharger?l=<lead>&e=<fin>&s=<empreinte>.
// Le PDF n'a pas d'adresse publique : il est embarqué dans le serveur (site/prive/guide.pdf) et servi seulement ici,
// pour un lien signé, pas expiré (7 jours), dont le lead existe. Sinon 404, sans dire pourquoi.
// Un seul guide pour tous les profils tant qu'Anne n'en a pas décidé autrement (contenu-anne/guide/corrections.md).
import type { APIRoute } from 'astro';
import guide from '../../../../prive/guide.pdf?inline';
import { envSite } from '../../../server/env';
import { journal } from '../../../server/journal';
import { verifierGuide } from '../../../server/liens';

export const prerender = false;

const octets = Uint8Array.from(atob(guide.slice(guide.indexOf(',') + 1)), (c) => c.charCodeAt(0));

const introuvable = () =>
  new Response(
    `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Lien expiré — Anne VIAL-TISSOT</title><body style="font-family:system-ui,sans-serif;max-width:34rem;margin:4rem auto;padding:0 1rem;color:#26201A;background:#F7F2EA;line-height:1.5">
<h1 style="font-weight:400">Ce lien n'est plus valable</h1><p>Le lien du guide reste valable 7 jours. Pour le recevoir à nouveau, redemandez-le : c'est immédiat.</p>
<p><a href="/guide" style="color:#002FA7">Recevoir le guide</a></p></body></html>`,
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  );

export const GET: APIRoute = async ({ url }) => {
  const leadId = await verifierGuide(envSite, url);
  if (!leadId) return introuvable();
  const lead = await envSite.DB.prepare('SELECT id FROM lead WHERE id = ?1').bind(leadId).first<{ id: string }>().catch(() => null);
  if (!lead) return introuvable();
  journal('guide_telecharge', { lead: leadId });
  return new Response(octets, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="Les-10-erreurs-fatales-Anne-VIAL-TISSOT.pdf"',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
      'Referrer-Policy': 'no-referrer',
    },
  });
};
