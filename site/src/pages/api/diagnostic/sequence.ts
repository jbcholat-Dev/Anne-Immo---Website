// Inscription à la séquence d'e-mails depuis la page de résultats (sortie B, CAP-7, AD-16), story 10.4.
// Réservée au navigateur qui a ouvert les résultats (cookie de la page de résultats) : pas besoin de ressaisir l'adresse.
// Écrit `newsletter_opt_in_at` et une ligne `sequence:<étape>` par e-mail (story 10.5) ; la tâche planifiée les envoie.
import type { APIRoute } from 'astro';
import { envSite } from '../../../server/env';
import { journal } from '../../../server/journal';
import { leadDuNavigateur } from '../../../server/resultats';
import { lignesSequence } from '../../../server/sequence';

export const prerender = false;

const ENTETES = { 'Cache-Control': 'no-store' };

export const POST: APIRoute = async ({ cookies }) => {
  const lead = await leadDuNavigateur(cookies);
  if (!lead) return Response.json({ ok: false, error: { code: 'LIEN_EXPIRE' } }, { status: 404, headers: ENTETES });
  try {
    const maintenant = new Date().toISOString();
    const inscription = await envSite.DB.prepare('UPDATE lead SET newsletter_opt_in_at = ?2, last_activity_at = ?2 WHERE id = ?1 AND newsletter_opt_in_at IS NULL')
      .bind(lead.id, maintenant).run();
    // Une seule fois : un second clic ne recrée pas la séquence.
    const lignes = inscription.meta.changes === 1 ? lignesSequence(envSite, lead.id, 'fr', maintenant) : [];
    if (lignes.length) await envSite.DB.batch(lignes);
  } catch (e) {
    journal('base_indisponible', { source: 'sequence', erreur: String(e).slice(0, 200) });
    return Response.json({ ok: false, error: { code: 'BASE_INDISPONIBLE' } }, { status: 503, headers: ENTETES });
  }
  journal('sequence_acceptee', { lead: lead.id });
  return Response.json({ ok: true }, { headers: ENTETES });
};
