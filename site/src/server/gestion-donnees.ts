// Espace de gestion des demandes (story 10.7, AD-4, AD-14, AD-16) : ce qu'Anne voit et fait sur ses leads.
// Lecture des demandes et de leurs envois, rejeu programmé d'un e-mail en échec, et marque « recopié dans Modelo »
// (ligne de canal `modelo`, livrée à la main). Chaque action met à jour last_activity_at.
// Ce module n'envoie rien et n'importe pas delivery.ts : l'application espace/ (story 13.3, AD-19) le réutilise
// sans clé d'envoi d'e-mails. L'envoi immédiat d'un rejeu reste dans gestion.ts, propre au site.
import type { EnvSite } from './env';
import { journal } from './journal';
import { filtreRecherche } from './recherche';

export interface ResumeLead {
  id: string;
  created_at: string;
  source: string;
  prenom: string | null;
  nom: string | null;
  email: string;
  telephone: string | null;
  is_test: number;
  orientation: string | null;
  rdv_start: string | null;
  echecs: number;
  modelo: string | null;
}

export interface Envoi {
  channel: string;
  status: string;
  attempts: number;
  due_at: string;
  delivered_at: string | null;
  last_error: string | null;
}

/** Canaux qu'Anne peut rejouer : ceux que delivery.ts sait envoyer (pas `modelo`, recopié à la main). */
export const rejouable = (canal: string) => ['notify_anne', 'confirm_prospect', 'guide'].includes(canal) || canal.startsWith('sequence:');

/**
 * Les demandes, les plus récentes d'abord. `q` : adresse e-mail exacte, ou des mots (chacun cherché dans le prénom,
 * le nom et l'adresse), ou un morceau de numéro tapé en 0 (« 06 12 34 » cherché comme « +3361234 », story 13.24).
 */
export async function listerLeads(env: EnvSite, q = '', limite = 100): Promise<ResumeLead[]> {
  const recherche = q.trim().toLowerCase();
  const parEmail = recherche.includes('@') && !recherche.includes('%') && !/\s/.test(recherche);
  const f = parEmail ? { sql: 'lower(l.email) = ?2', valeurs: [recherche] } : filtreRecherche(recherche, ['l.prenom', 'l.nom', 'l.email'], 'l.telephone', 2);
  const requete = env.DB.prepare(
    `SELECT l.id, l.created_at, l.source, l.prenom, l.nom, l.email, l.telephone, l.is_test, l.orientation, l.rdv_start,
       (SELECT count(*) FROM lead_delivery d WHERE d.lead_id = l.id AND d.status = 'failed') AS echecs,
       (SELECT d.status FROM lead_delivery d WHERE d.lead_id = l.id AND d.channel = 'modelo') AS modelo
     FROM lead l ${f ? `WHERE ${f.sql}` : ''} ORDER BY l.created_at DESC LIMIT ?1`,
  );
  const { results } = await requete.bind(limite, ...(f?.valeurs ?? [])).all<ResumeLead>();
  return results;
}

/** Une demande avec tous ses champs et l'état de chacun de ses envois. */
export async function detailLead(env: EnvSite, id: string): Promise<{ lead: Record<string, unknown>; envois: Envoi[] } | null> {
  const [lead, envois] = await env.DB.batch([
    env.DB.prepare('SELECT * FROM lead WHERE id = ?1').bind(id),
    env.DB.prepare('SELECT channel, status, attempts, due_at, delivered_at, last_error FROM lead_delivery WHERE lead_id = ?1 ORDER BY channel').bind(id),
  ]);
  const ligne = lead.results?.[0] as Record<string, unknown> | undefined;
  return ligne ? { lead: ligne, envois: (envois.results ?? []) as Envoi[] } : null;
}

const toucher = (env: EnvSite, id: string, maintenant: string) =>
  env.DB.prepare('UPDATE lead SET last_activity_at = ?2 WHERE id = ?1').bind(id, maintenant);

/** Programme la relance d'un envoi en échec (ou bloqué après 5 essais) : compteur remis à zéro, échéance maintenant.
 * La tâche planifiée du site l'envoie au plus tard 15 minutes après ; le site, lui, l'envoie tout de suite (gestion.ts). */
export async function programmerRejeu(env: EnvSite, id: string, canal: string, compte: string): Promise<boolean> {
  if (!rejouable(canal)) return false;
  const maintenant = new Date().toISOString();
  const [remis] = await env.DB.batch([
    env.DB.prepare(
      `UPDATE lead_delivery SET status = 'pending', attempts = 0, due_at = ?3, last_error = NULL
       WHERE lead_id = ?1 AND channel = ?2 AND status IN ('failed', 'pending')`,
    ).bind(id, canal, maintenant),
    toucher(env, id, maintenant),
  ]);
  if ((remis.meta.changes ?? 0) !== 1) return false;
  journal('gestion_rejeu', { lead: id, canal, par: compte });
  return true;
}

/** Marque la demande comme recopiée dans Modelo (ligne `modelo` livrée à la main), ou annule cette marque. */
export async function marquerModelo(env: EnvSite, id: string, recopie: boolean, compte: string): Promise<boolean> {
  const maintenant = new Date().toISOString();
  const [ecrit, touche] = await env.DB.batch([
    recopie
      ? env.DB.prepare(
        `INSERT INTO lead_delivery (lead_id, channel, due_at, status, attempts, delivered_at)
         SELECT ?1, 'modelo', ?2, 'delivered', 0, ?2 WHERE EXISTS (SELECT 1 FROM lead WHERE id = ?1)
         ON CONFLICT (lead_id, channel) DO UPDATE SET status = 'delivered', delivered_at = excluded.delivered_at`,
      ).bind(id, maintenant)
      : env.DB.prepare("DELETE FROM lead_delivery WHERE lead_id = ?1 AND channel = 'modelo'").bind(id),
    toucher(env, id, maintenant),
  ]);
  journal('gestion_modelo', { lead: id, recopie, par: compte });
  // Retirer une marque absente n'est pas une erreur : seule compte l'existence de la demande.
  return ((recopie ? ecrit : touche).meta.changes ?? 0) === 1;
}

// Libellés de l'espace de gestion.
export const SOURCES: Record<string, string> = { diagnostic: 'Diagnostic', contact: 'Contact', estimation: 'Estimation', guide: 'Guide', rdv: 'Rendez-vous' };
export const ETATS: Record<string, string> = { pending: 'en attente', delivered: 'fait', failed: 'en échec', cancelled: 'annulé' };
export function canal(c: string): string {
  if (c.startsWith('sequence:')) return `Séquence, e-mail ${c.slice(9)}`;
  return ({ notify_anne: 'Notification à Anne', confirm_prospect: 'Confirmation au prospect', guide: 'Lien du guide', modelo: 'Recopie dans Modelo' } as Record<string, string>)[c] ?? c;
}
/** Date et heure de Paris, lisibles. */
export const quand = (iso: unknown) => typeof iso === 'string' && iso
  ? new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '';
