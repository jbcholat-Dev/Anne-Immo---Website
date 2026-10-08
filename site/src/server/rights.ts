// Droits RGPD (story 10.7, AD-18) : accès (export lisible) et effacement, pour une adresse e-mail.
// Toutes les demandes faites avec cette adresse sont concernées, quel que soit le formulaire.
// Chaque exercice de droit est noté dans la table droit_exerce (date, type, empreinte de l'adresse, compte qui a agi).
// Rien n'est à effacer chez Resend : le site n'y crée aucun contact ni audience (AD-8), il n'envoie que des e-mails.
// La suppression de la réservation Cal.com et la réponse à la personne suivent la procédure du RUNBOOK (§ 4 quinquies).
import type { EnvSite } from './env';
import { empreinte, journal } from './journal';

const PARSER = ['answers', 'scores', 'utm'];
const TECHNIQUES = ['token', 'token_browser', 'token_expires_at', 'submission_id'];

async function noter(env: EnvSite, type: 'acces' | 'effacement', email: string, leads: number, compte: string) {
  const e = await empreinte(email);
  await env.DB.prepare('INSERT INTO droit_exerce (a, type, email_empreinte, leads, par) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(new Date().toISOString(), type, e, leads, compte).run();
  journal(`droit_${type}`, { email: e, leads, par: compte });
}

/** Tout ce que le site garde sur une adresse, sous une forme lisible (droit d'accès). */
export async function exporter(env: EnvSite, email: string, compte: string) {
  const adresse = email.trim().toLowerCase();
  const { results: leads } = await env.DB.prepare('SELECT * FROM lead WHERE lower(email) = ?1 ORDER BY created_at').bind(adresse).all<Record<string, unknown>>();
  const demandes = [];
  for (const l of leads) {
    const { results: envois } = await env.DB.prepare('SELECT channel, status, delivered_at FROM lead_delivery WHERE lead_id = ?1 ORDER BY channel').bind(l.id).all();
    const lisible: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(l)) {
      if (TECHNIQUES.includes(k) || v === null) continue;
      lisible[k] = PARSER.includes(k) && typeof v === 'string' ? JSON.parse(v) : v;
    }
    demandes.push({ ...lisible, envois });
  }
  const maintenant = new Date().toISOString();
  if (leads.length) await env.DB.prepare('UPDATE lead SET last_activity_at = ?2 WHERE lower(email) = ?1').bind(adresse, maintenant).run();
  await noter(env, 'acces', adresse, leads.length, compte);
  return { responsable: 'Anne VIAL-TISSOT, annevialtissot.fr', exporte_le: maintenant, email: adresse, demandes };
}

/** Efface toutes les demandes d'une adresse et leurs envois (droit à l'effacement). Renvoie le nombre de demandes effacées. */
export async function effacer(env: EnvSite, email: string, compte: string): Promise<number> {
  const adresse = email.trim().toLowerCase();
  const [, leads] = await env.DB.batch([
    env.DB.prepare('DELETE FROM lead_delivery WHERE lead_id IN (SELECT id FROM lead WHERE lower(email) = ?1)').bind(adresse),
    env.DB.prepare('DELETE FROM lead WHERE lower(email) = ?1').bind(adresse),
  ]);
  const n = leads.meta.changes ?? 0;
  await noter(env, 'effacement', adresse, n, compte);
  return n;
}

/** Les derniers droits exercés (affichés dans l'espace de gestion). */
export interface DroitExerce { a: string; type: string; email_empreinte: string; leads: number; par: string }
export async function droitsExerces(env: EnvSite, limite = 20): Promise<DroitExerce[]> {
  const { results } = await env.DB.prepare('SELECT a, type, email_empreinte, leads, par FROM droit_exerce ORDER BY id DESC LIMIT ?1').bind(limite)
    .all<DroitExerce>();
  return results;
}
