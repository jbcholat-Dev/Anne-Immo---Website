// Diffusion des leads (AD-4) : le seul module qui exécute les lignes `lead_delivery` et met à jour leur état.
// Appelé juste après l'écriture d'un lead (sans faire attendre le visiteur), puis toutes les 15 minutes par la
// tâche planifiée de worker.ts pour réessayer ce qui a échoué. Un échec d'envoi n'est jamais une erreur pour
// le visiteur : il est noté sur la ligne (status, attempts, last_error) et réessayé, au plus 5 fois.
import { envoyerEmail, type Email } from './adapters/email';
import { enProduction, type EnvSite } from './env';
import { journal } from './journal';
import { confirmerProspect, notifierAnne, type LigneLead } from './messages';

export const ESSAIS_MAX = 5;
const CANAUX_EMAIL = ['notify_anne', 'confirm_prospect'];

function construire(env: EnvSite, canal: string, l: LigneLead): Email | null {
  // Tant que le site n'est pas lancé, tout lead est un test : les e-mails vont à la boîte de test (AD-12).
  const test = l.is_test === 1 || !enProduction(env);
  const idempotence = `${l.id}:${canal}`;
  if (canal === 'notify_anne') {
    const m = notifierAnne(l);
    return { a: env.BOITE_ANNE ?? '', objet: m.objet, texte: m.texte, repondreA: l.email, test, idempotence };
  }
  if (canal === 'confirm_prospect') {
    const m = confirmerProspect(l);
    return { a: l.email, objet: m.objet, texte: m.texte, repondreA: env.BOITE_ANNE, test, idempotence };
  }
  return null;
}

/** Exécute ce qui reste à envoyer pour un lead. */
export async function diffuser(env: EnvSite, leadId: string): Promise<void> {
  const lead = await env.DB.prepare('SELECT * FROM lead WHERE id = ?1').bind(leadId).first<LigneLead>();
  if (!lead) return;
  const { results } = await env.DB.prepare(
    `SELECT channel, attempts FROM lead_delivery
     WHERE lead_id = ?1 AND status IN ('pending', 'failed') AND attempts < ?2 AND due_at <= ?3`,
  ).bind(leadId, ESSAIS_MAX, new Date().toISOString()).all<{ channel: string; attempts: number }>();

  for (const { channel, attempts } of results) {
    if (!CANAUX_EMAIL.includes(channel)) continue;
    const email = construire(env, channel, lead);
    if (!email) continue;
    // Réservation de l'envoi : le compteur d'essais avance et l'échéance est repoussée de 2 minutes, seulement si personne
    // ne l'a fait entre-temps. Deux exécutions simultanées (renvoi du formulaire, tâche planifiée) n'envoient donc jamais
    // deux fois le même e-mail ; après un échec, l'échéance revient à maintenant pour le prochain passage.
    const maintenant = new Date();
    const reserve = await env.DB.prepare(
      `UPDATE lead_delivery SET attempts = attempts + 1, due_at = ?4
       WHERE lead_id = ?1 AND channel = ?2 AND attempts = ?3 AND status IN ('pending', 'failed') AND due_at <= ?5`,
    ).bind(leadId, channel, attempts, new Date(maintenant.getTime() + 120_000).toISOString(), maintenant.toISOString()).run();
    if (reserve.meta.changes !== 1) continue;
    const r = await envoyerEmail(env, email);
    const fin = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE lead_delivery SET status = ?3, delivered_at = ?4, last_error = ?5, due_at = ?6
       WHERE lead_id = ?1 AND channel = ?2`,
    ).bind(leadId, channel, r.ok ? 'delivered' : 'failed', r.ok ? fin : null, r.ok ? null : r.erreur, fin).run();
    journal(r.ok ? 'envoi_reussi' : 'envoi_echoue', { lead: leadId, canal: channel, test: email.test, ...(r.ok ? {} : { erreur: r.erreur }) });
  }
}

/** Réessaie les envois en attente ou en échec (tâche planifiée). */
export async function rejouer(env: EnvSite): Promise<void> {
  const { results } = await env.DB.prepare(
    `SELECT DISTINCT lead_id FROM lead_delivery
     WHERE status IN ('pending', 'failed') AND attempts < ?1 AND due_at <= ?2
       AND channel IN ('notify_anne', 'confirm_prospect')
     LIMIT 20`,
  ).bind(ESSAIS_MAX, new Date().toISOString()).all<{ lead_id: string }>();
  for (const { lead_id } of results) await diffuser(env, lead_id);
  if (results.length) journal('rejeu', { leads: results.length });
}
