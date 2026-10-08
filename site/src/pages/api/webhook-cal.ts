// Webhook Cal.com (story 10.6, CAP-9, AD-4, AD-7) : Cal.com appelle cette adresse à chaque réservation du rendez-vous
// « Premier échange ». Signature vérifiée d'abord (rejet 401 sinon), puis la réservation est écrite comme lead `rdv`
// (idempotence : l'uid de la réservation sert de submission_id, un webhook rejoué n'écrit rien de plus), puis Anne est
// prévenue au format Modelo. Les autres événements (annulation, report) sont acceptés et seulement journalisés :
// Cal.com prévient lui-même Anne et le prospect.
import type { APIRoute } from 'astro';
import { reservation, signatureValide } from '../../server/adapters/booking';
import { diffuser } from '../../server/delivery';
import { enProduction, envSite } from '../../server/env';
import { empreinte, journal } from '../../server/journal';
import { ecrireLead } from '../../server/leads';

export const prerender = false;

const reponse = (status: number, corps: Record<string, unknown>) => Response.json(corps, { status, headers: { 'Cache-Control': 'no-store' } });

export const POST: APIRoute = async ({ request, locals }) => {
  const env = envSite;
  if (!env.CAL_WEBHOOK_SECRET) return reponse(503, { ok: false, error: { code: 'CLE_ABSENTE' } });
  if (Number(request.headers.get('content-length') ?? 0) > 100_000) return reponse(400, { ok: false, error: { code: 'REQUETE_INVALIDE' } });
  const brut = await request.text();
  if (!(await signatureValide(brut, request.headers.get('x-cal-signature-256'), env.CAL_WEBHOOK_SECRET))) {
    journal('webhook_cal_refuse', { raison: 'signature', longueur: brut.length });
    return reponse(401, { ok: false, error: { code: 'SIGNATURE' } });
  }
  let message: Record<string, unknown>;
  try {
    message = JSON.parse(brut) as Record<string, unknown>;
  } catch {
    return reponse(400, { ok: false, error: { code: 'REQUETE_INVALIDE' } });
  }
  const evenement = typeof message.triggerEvent === 'string' ? message.triggerEvent : '';
  if (evenement !== 'BOOKING_CREATED') {
    journal('webhook_cal_ignore', { evenement: evenement.slice(0, 40) });
    return reponse(200, { ok: true, ignore: true });
  }
  const r = reservation(message);
  if (!r.ok) {
    journal('webhook_cal_refuse', { raison: r.raison });
    return reponse(422, { ok: false, error: { code: 'CHAMP_INVALIDE', champ: r.raison } });
  }
  const isTest = !enProduction(env);
  let ecriture;
  try {
    ecriture = await ecrireLead(env, r.lead, `cal:${r.uid}`, isTest);
  } catch (e) {
    journal('base_indisponible', { source: 'rdv', erreur: String(e).slice(0, 200) });
    return reponse(503, { ok: false, error: { code: 'BASE_INDISPONIBLE' } }); // Cal.com réessaie un webhook en échec
  }
  journal('lead_ecrit', { source: 'rdv', lead: ecriture.leadId, nouveau: ecriture.nouveau, test: isTest, email: await empreinte(r.lead.email) });
  const envoi = diffuser(env, ecriture.leadId).catch((e) => journal('diffusion_interrompue', { lead: ecriture.leadId, erreur: String(e).slice(0, 200) }));
  const cf = (locals as { cfContext?: ExecutionContext }).cfContext;
  if (cf) cf.waitUntil(envoi);
  else await envoi;
  return reponse(200, { ok: true });
};
