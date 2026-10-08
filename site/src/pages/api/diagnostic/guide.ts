// Guide demandé depuis la page de résultats du diagnostic (story 10.5, CAP-7, CAP-8).
// Réservé au navigateur qui a ouvert les résultats (cookie de la page de résultats) : pas d'adresse à ressaisir.
// Crée l'envoi `guide` (une seule fois par lead), le lance, et renvoie le lien signé pour l'ouvrir tout de suite.
import type { APIRoute } from 'astro';
import { diffuser } from '../../../server/delivery';
import { envSite } from '../../../server/env';
import { journal } from '../../../server/journal';
import { lienGuide } from '../../../server/liens';
import { leadDuNavigateur } from '../../../server/resultats';

export const prerender = false;

const ENTETES = { 'Cache-Control': 'no-store' };

export const POST: APIRoute = async ({ cookies, locals }) => {
  const lead = await leadDuNavigateur(cookies);
  if (!lead) return Response.json({ ok: false, error: { code: 'LIEN_EXPIRE' } }, { status: 404, headers: ENTETES });
  const url = await lienGuide(envSite, lead.id);
  if (!url) return Response.json({ ok: false, error: { code: 'CLE_ABSENTE' } }, { status: 503, headers: ENTETES });
  try {
    const maintenant = new Date().toISOString();
    await envSite.DB.batch([
      envSite.DB.prepare(`INSERT INTO lead_delivery (lead_id, channel, due_at) VALUES (?1, 'guide', ?2) ON CONFLICT (lead_id, channel) DO NOTHING`).bind(lead.id, maintenant),
      envSite.DB.prepare('UPDATE lead SET last_activity_at = ?2 WHERE id = ?1').bind(lead.id, maintenant),
    ]);
  } catch (e) {
    journal('base_indisponible', { source: 'guide_resultats', erreur: String(e).slice(0, 200) });
    return Response.json({ ok: false, error: { code: 'BASE_INDISPONIBLE' } }, { status: 503, headers: ENTETES });
  }
  journal('guide_demande', { lead: lead.id });
  const envoi = diffuser(envSite, lead.id).catch((e) => journal('diffusion_interrompue', { lead: lead.id, erreur: String(e).slice(0, 200) }));
  const cf = (locals as { cfContext?: ExecutionContext }).cfContext;
  if (cf) cf.waitUntil(envoi);
  else await envoi;
  return Response.json({ ok: true, url }, { headers: ENTETES });
};
