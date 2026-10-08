// Diffusion des leads (AD-4) : le seul module qui exécute les lignes `lead_delivery` et met à jour leur état.
// Appelé juste après l'écriture d'un lead (sans faire attendre le visiteur), puis toutes les 15 minutes par la
// tâche planifiée de worker.ts pour réessayer ce qui a échoué et envoyer les e-mails de la séquence arrivés à échéance. Un échec d'envoi n'est jamais une erreur pour
// le visiteur : il est noté sur la ligne (status, attempts, last_error) et réessayé, au plus 5 fois.
import { envoyerEmail, type Email } from './adapters/email';
import { enProduction, type EnvSite } from './env';
import { journal } from './journal';
import { lienDesabonnement, lienGuide } from './liens';
import { confirmerProspect, envoyerGuide, etapeSequence, notifierAnne, type LigneLead } from './messages';
import { etapesDe } from './sequence';

export const ESSAIS_MAX = 5;
const EST_EMAIL = (canal: string) => ['notify_anne', 'confirm_prospect', 'guide'].includes(canal) || canal.startsWith('sequence:');

type Construction = { email: Email } | { annuler: string } | { erreur: string };

async function construire(env: EnvSite, canal: string, l: LigneLead & { newsletter_unsubscribed_at?: string | null }): Promise<Construction> {
  // Tant que le site n'est pas lancé, tout lead est un test : les e-mails vont à la boîte de test (AD-12).
  const test = l.is_test === 1 || !enProduction(env);
  const idempotence = `${l.id}:${canal}`;
  const base = { test, idempotence };
  if (canal === 'notify_anne') {
    const m = notifierAnne(l);
    return { email: { ...base, a: env.BOITE_ANNE ?? '', objet: m.objet, texte: m.texte, repondreA: l.email } };
  }
  if (canal === 'confirm_prospect') {
    // Le guide part avec la confirmation d'une demande de guide et avec les résultats en sortie B (story 10.5).
    const avecGuide = l.source === 'guide' || (l.source === 'diagnostic' && l.orientation === 'B');
    const m = confirmerProspect(l, avecGuide ? await lienGuide(env, l.id) : null, etapesDe(l.lang).length);
    return { email: { ...base, a: l.email, objet: m.objet, texte: m.texte, repondreA: env.BOITE_ANNE } };
  }
  if (canal === 'guide') {
    const lien = await lienGuide(env, l.id);
    if (!lien) return { erreur: 'LIEN_SECRET absent' };
    const m = envoyerGuide(l, lien);
    return { email: { ...base, a: l.email, objet: m.objet, texte: m.texte, repondreA: env.BOITE_ANNE } };
  }
  if (canal.startsWith('sequence:')) {
    if (l.newsletter_unsubscribed_at) return { annuler: 'désabonné' };
    const etape = etapesDe(l.lang).find((e) => `sequence:${e.etape}` === canal);
    if (!etape) return { annuler: 'étape retirée de la séquence' };
    const lien = await lienDesabonnement(env, l.id);
    if (!lien) return { erreur: 'LIEN_SECRET absent' };
    const m = etapeSequence(l, etape, lien);
    // Désabonnement en un clic depuis la messagerie (RFC 8058) : la messagerie poste sur /api/desabonnement.
    const unClic = lien.replace('/desabonnement?', '/api/desabonnement?');
    return { email: { ...base, a: l.email, objet: m.objet, texte: m.texte, repondreA: env.BOITE_ANNE,
      entetes: { 'List-Unsubscribe': `<${unClic}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } };
  }
  return { annuler: 'canal inconnu' };
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
    if (!EST_EMAIL(channel)) continue;
    const construction = await construire(env, channel, lead);
    if ('annuler' in construction) {
      await env.DB.prepare(`UPDATE lead_delivery SET status = 'cancelled', last_error = ?3 WHERE lead_id = ?1 AND channel = ?2`)
        .bind(leadId, channel, construction.annuler).run();
      continue;
    }
    // Réservation de l'envoi : le compteur d'essais avance et l'échéance est repoussée de 2 minutes, seulement si personne
    // ne l'a fait entre-temps. Deux exécutions simultanées (renvoi du formulaire, tâche planifiée) n'envoient donc jamais
    // deux fois le même e-mail ; après un échec, l'échéance revient à maintenant pour le prochain passage.
    const maintenant = new Date();
    const reserve = await env.DB.prepare(
      `UPDATE lead_delivery SET attempts = attempts + 1, due_at = ?4
       WHERE lead_id = ?1 AND channel = ?2 AND attempts = ?3 AND status IN ('pending', 'failed') AND due_at <= ?5`,
    ).bind(leadId, channel, attempts, new Date(maintenant.getTime() + 120_000).toISOString(), maintenant.toISOString()).run();
    if (reserve.meta.changes !== 1) continue;
    const email = 'email' in construction ? construction.email : null;
    const r = email ? await envoyerEmail(env, email) : { ok: false as const, erreur: (construction as { erreur: string }).erreur };
    const fin = new Date().toISOString();
    await env.DB.prepare(
      `UPDATE lead_delivery SET status = ?3, delivered_at = ?4, last_error = ?5, due_at = ?6
       WHERE lead_id = ?1 AND channel = ?2`,
    ).bind(leadId, channel, r.ok ? 'delivered' : 'failed', r.ok ? fin : null, r.ok ? null : r.erreur, fin).run();
    journal(r.ok ? 'envoi_reussi' : 'envoi_echoue', { lead: leadId, canal: channel, test: email?.test ?? true, ...(r.ok ? {} : { erreur: r.erreur }) });
  }
}

/** Envoie ce qui est arrivé à échéance : e-mails en échec à réessayer, e-mails de la séquence (tâche planifiée). */
export async function rejouer(env: EnvSite): Promise<void> {
  const { results } = await env.DB.prepare(
    `SELECT lead_id, MIN(due_at) AS echeance FROM lead_delivery
     WHERE status IN ('pending', 'failed') AND attempts < ?1 AND due_at <= ?2
       AND (channel IN ('notify_anne', 'confirm_prospect', 'guide') OR channel LIKE 'sequence:%')
     GROUP BY lead_id ORDER BY echeance
     LIMIT 20`,
  ).bind(ESSAIS_MAX, new Date().toISOString()).all<{ lead_id: string }>();
  for (const { lead_id } of results) await diffuser(env, lead_id);
  if (results.length) journal('rejeu', { leads: results.length });
}
