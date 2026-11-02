// Purge des demandes anciennes (story 10.7, AD-16) : une demande sans activité depuis 3 ans est supprimée avec ses envois.
// Depuis la story 13.4 (AD-20), la même règle vaut pour les contacts de l'espace d'Anne (avec leur historique) et les prescripteurs.
// Depuis la story 13.10 : les tâches Leedflow et les liens Leedflow partent avec leur contact ; ce que la relève Leedflow
// garde d'un numéro inconnu est effacé au bout de 90 jours, un numéro écarté par Anne au bout de 3 ans.
// Depuis la story 18.3 (AD-31) : un contact importé dans le carnet (source d'import dans `contact_source`) qu'Anne n'a
// jamais contacté (`dernier_contact_le` vide), resté hors suivi et sans demande du site, est effacé trois ans après son
// premier import, même si on l'a classé depuis ; ses autres coordonnées, sources et lignes « Nouveaux » partent avec lui,
// comme pour tout contact purgé. Une ligne « Nouveaux » de plus de trois ans part aussi. Revue de code 18.3 : un signe de
// relation le garde dans la règle habituelle (trois ans sans activité) : accord e-mail, campagne reçue, demande, ou un
// geste d'Anne dans son historique (note, appel, e-mail, séance, étape, qualification) ; un classement seul n'en est pas un.
// « Activité » = last_activity_at : écriture de la demande, désabonnement de la séquence, action dans l'espace de gestion.
// La durée est la même constante que celle affichée dans la politique de confidentialité (src/pages/confidentialite.astro).
import { purgerEntonnoir } from './entonnoir';
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
  // Contacts importés jamais contactés : trois ans depuis l'import (avant la migration 0018, ces tables n'existent pas).
  const importes = await env.DB.prepare(
    `SELECT c.id FROM contact c
     WHERE c.dernier_contact_le IS NULL AND c.etape IS NULL AND c.last_activity_at >= ?1
       AND NOT EXISTS (SELECT 1 FROM lead l WHERE l.contact_id = c.id)
       AND c.email_accord_le IS NULL
       AND NOT EXISTS (SELECT 1 FROM campagne_destinataire d WHERE d.contact_id = c.id AND d.statut = 'envoye')
       AND NOT EXISTS (SELECT 1 FROM contact_evenement e WHERE e.contact_id = c.id
         AND e.type IN ('demande', 'note', 'etape', 'qualification', 'appel', 'email', 'seance'))
       AND (SELECT min(s.a) FROM contact_source s WHERE s.contact_id = c.id AND s.import_lot_id IS NOT NULL) < ?1`,
  ).bind(limite).all<{ id: string }>().then((r) => r.results.map((c) => c.id))
    .catch((e) => { journal('purge_carnet_echec', { detail: String(e).slice(0, 200) }); return [] as string[]; });
  const IMPORTES = 'IN (SELECT value FROM json_each(?2))';
  const ids = JSON.stringify(importes);
  const [, leads, , , contacts, prescripteurs] = await env.DB.batch([
    env.DB.prepare('DELETE FROM lead_delivery WHERE lead_id IN (SELECT id FROM lead WHERE last_activity_at < ?1)').bind(limite),
    env.DB.prepare('DELETE FROM lead WHERE last_activity_at < ?1').bind(limite),
    // L'historique part avec le contact ; une demande encore gardée perd seulement son lien. Écrit en clair plutôt que
    // confié aux clés étrangères (ON DELETE CASCADE / SET NULL), pour ne pas dépendre de leur application par la base.
    env.DB.prepare(`DELETE FROM contact_evenement WHERE contact_id IN (SELECT id FROM contact WHERE last_activity_at < ?1 OR id ${IMPORTES})`).bind(limite, ids),
    env.DB.prepare(`UPDATE lead SET contact_id = NULL WHERE contact_id IN (SELECT id FROM contact WHERE last_activity_at < ?1 OR id ${IMPORTES})`).bind(limite, ids),
    env.DB.prepare(`DELETE FROM contact WHERE last_activity_at < ?1 OR id ${IMPORTES}`).bind(limite, ids),
    env.DB.prepare('DELETE FROM prescripteur WHERE last_activity_at < ?1').bind(limite),
  ]);
  // Avant la migration 0008, ces tables n'existent pas : la purge des demandes et des contacts ne doit pas en dépendre.
  await env.DB.batch([
    env.DB.prepare('DELETE FROM leedflow_tache WHERE contact_id NOT IN (SELECT id FROM contact)'),
    env.DB.prepare('DELETE FROM leedflow_lien WHERE contact_id NOT IN (SELECT id FROM contact)'),
    env.DB.prepare('DELETE FROM leedflow_inconnu WHERE a < ?1').bind(new Date(maintenant.getTime() - 90 * 86_400_000).toISOString()),
    env.DB.prepare('DELETE FROM leedflow_ecarte WHERE a < ?1').bind(limite),
  ]).catch((e) => journal('purge_leedflow_echec', { detail: String(e).slice(0, 200) }));
  // Carnet (story 18.3, migration 0018) : autres coordonnées, sources et file « Nouveaux » partent avec leur contact (un
  // numéro classé « prospect » aussi, par sa clé étrangère).
  await env.DB.batch([
    env.DB.prepare('DELETE FROM contact_coordonnee WHERE contact_id NOT IN (SELECT id FROM contact)'),
    env.DB.prepare('DELETE FROM contact_source WHERE contact_id NOT IN (SELECT id FROM contact)'),
    env.DB.prepare('DELETE FROM nouveau WHERE (contact_id IS NOT NULL AND contact_id NOT IN (SELECT id FROM contact)) OR recu_le < ?1').bind(limite),
  ]).catch((e) => journal('purge_carnet_echec', { detail: String(e).slice(0, 200) }));
  // Destinataires des campagnes (story 13.27, migration 0014) : partent avec leur contact.
  await env.DB.prepare('DELETE FROM campagne_destinataire WHERE contact_id NOT IN (SELECT id FROM contact)').run()
    .catch((e) => journal('purge_campagnes_echec', { detail: String(e).slice(0, 200) }));
  // Comptages anonymes de l'entonnoir du diagnostic (story 10.12, migration 0015) : 13 mois.
  await purgerEntonnoir(env, maintenant);
  const n = leads.meta.changes ?? 0;
  const c = contacts.meta.changes ?? 0;
  const p = prescripteurs.meta.changes ?? 0;
  if (n || c || p) journal('purge', { leads: n, contacts: c, importes: importes.length, prescripteurs: p, limite });
  return n;
}
