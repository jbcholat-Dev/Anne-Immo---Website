// Téléchargement du rapport PDF personnalisé du diagnostic (story 10.10, AD-5 et AD-8 amendées le 2026-10-10) :
// GET /api/diagnostic/rapport?l=<lead>&e=<fin>&s=<empreinte>. Le lien vient de la page de résultats ou de l'e-mail du
// résumé ; il vaut 7 jours. Le PDF est assemblé à la demande depuis le gabarit (src/server/rapport.ts) et n'est stocké
// nulle part. Lien faux, expiré, lead effacé ou sans diagnostic : 404, sans dire pourquoi.
import type { APIRoute } from 'astro';
import { envSite } from '../../../server/env';
import { journal } from '../../../server/journal';
import { verifierRapport } from '../../../server/liens';
import { fabriquerRapport } from '../../../server/rapport';
import type { Scores } from '../../../server/diagnostic';
import type { Reponses } from '../../../server/scoring';

export const prerender = false;

const introuvable = () =>
  new Response(
    `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<title>Lien expiré — Anne VIAL-TISSOT</title><body style="font-family:system-ui,sans-serif;max-width:34rem;margin:4rem auto;padding:0 1rem;color:#26201A;background:#F7F2EA;line-height:1.5">
<h1 style="font-weight:400">Ce lien n'est plus valable</h1><p>Le lien de votre rapport reste valable 7 jours. Pour un rapport à jour, refaites le diagnostic : il prend cinq minutes.</p>
<p><a href="/diagnostic/questions" style="color:#002FA7">Refaire le diagnostic</a> · <a href="/contact" style="color:#002FA7">Écrire à Anne</a></p></body></html>`,
    { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } },
  );

type Ligne = { prenom: string | null; nom: string | null; created_at: string; scores: string | null; answers: string | null; orientation: 'A' | 'B' | null };

/** Nom de fichier sans accent ni espace, pour tous les navigateurs. */
const fichier = (prenom: string, nom: string) =>
  `Rapport-diagnostic-${`${prenom}-${nom}`.normalize('NFD').replace(/\p{M}/gu, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'vendeur'}.pdf`;

export const GET: APIRoute = async ({ url }) => {
  const leadId = await verifierRapport(envSite, url);
  if (!leadId) return introuvable();
  const l = await envSite.DB.prepare(
    `SELECT prenom, nom, created_at, scores, answers, orientation FROM lead WHERE id = ?1 AND source = 'diagnostic'`,
  ).bind(leadId).first<Ligne>().catch(() => null);
  if (!l || !l.scores || !l.answers || !l.orientation) return introuvable();
  const pdf = await fabriquerRapport({
    prenom: l.prenom ?? '',
    nom: l.nom ?? '',
    date: new Date(l.created_at),
    scores: JSON.parse(l.scores) as Scores,
    orientation: l.orientation,
    reponses: (JSON.parse(l.answers) as { reponses: Reponses }).reponses,
  });
  journal('rapport_telecharge', { lead: leadId });
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fichier(l.prenom ?? '', l.nom ?? '')}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex',
      'Referrer-Policy': 'no-referrer',
    },
  });
};
