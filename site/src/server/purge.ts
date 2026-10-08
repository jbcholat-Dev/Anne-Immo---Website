// Purge des demandes anciennes (story 10.7, AD-16) : une demande sans activité depuis 3 ans est supprimée avec ses envois.
// « Activité » = last_activity_at : écriture de la demande, désabonnement de la séquence, action dans l'espace de gestion.
// La durée est la même constante que celle affichée dans la politique de confidentialité (src/pages/confidentialite.astro).
import type { EnvSite } from './env';
import { journal } from './journal';

export const CONSERVATION_ANS = 3;

/** Date limite : une demande dont la dernière activité est antérieure est purgée. */
export function limiteConservation(maintenant = new Date()): string {
  const d = new Date(maintenant);
  d.setUTCFullYear(d.getUTCFullYear() - CONSERVATION_ANS);
  return d.toISOString();
}

/** Supprime les demandes trop anciennes et leurs envois. Appelée par la tâche planifiée (worker.ts). */
export async function purger(env: EnvSite, maintenant = new Date()): Promise<number> {
  const limite = limiteConservation(maintenant);
  const [, leads] = await env.DB.batch([
    env.DB.prepare('DELETE FROM lead_delivery WHERE lead_id IN (SELECT id FROM lead WHERE last_activity_at < ?1)').bind(limite),
    env.DB.prepare('DELETE FROM lead WHERE last_activity_at < ?1').bind(limite),
  ]);
  const n = leads.meta.changes ?? 0;
  if (n) journal('purge', { leads: n, limite });
  return n;
}
