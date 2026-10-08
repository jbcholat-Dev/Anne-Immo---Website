// Espace de gestion des demandes (story 10.7, AD-4, AD-14, AD-16) : ce qu'Anne voit et fait sur ses leads.
// Lecture des demandes et de leurs envois, rejeu d'un e-mail en échec (exécuté par le module unique delivery.ts),
// et marque « recopié dans Modelo » (ligne de canal `modelo`, livrée à la main). Chaque action met à jour last_activity_at.
import { diffuser } from './delivery';
import type { EnvSite } from './env';
import { journal } from './journal';

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

/** Les demandes, les plus récentes d'abord. `q` : adresse e-mail exacte, ou morceau de nom, d'adresse ou de téléphone. */
export async function listerLeads(env: EnvSite, q = '', limite = 100): Promise<ResumeLead[]> {
  const recherche = q.trim().toLowerCase();
  const parEmail = recherche.includes('@') && !recherche.includes('%');
  const filtre = !recherche ? '' : parEmail
    ? 'WHERE lower(l.email) = ?2'
    : "WHERE lower(l.email) LIKE ?2 OR lower(coalesce(l.nom, '')) LIKE ?2 OR lower(coalesce(l.prenom, '')) LIKE ?2 OR coalesce(l.telephone, '') LIKE ?3";
  const valeur = parEmail ? recherche : `%${recherche.replace(/[%_]/g, '')}%`;
  // Les numéros sont rangés au format international (+33…) : « 06 01 02 03 04 » est cherché comme « +33601020304 ».
  const chiffres = recherche.replace(/[\s.\-()]/g, '');
  const telephone = /^0\d{9}$/.test(chiffres) ? `%+33${chiffres.slice(1)}%` : /^\+?\d{4,}$/.test(chiffres) ? `%${chiffres}%` : valeur;
  const requete = env.DB.prepare(
    `SELECT l.id, l.created_at, l.source, l.prenom, l.nom, l.email, l.telephone, l.is_test, l.orientation, l.rdv_start,
       (SELECT count(*) FROM lead_delivery d WHERE d.lead_id = l.id AND d.status = 'failed') AS echecs,
       (SELECT d.status FROM lead_delivery d WHERE d.lead_id = l.id AND d.channel = 'modelo') AS modelo
     FROM lead l ${filtre} ORDER BY l.created_at DESC LIMIT ?1`,
  );
  const { results } = await (!recherche ? requete.bind(limite) : parEmail ? requete.bind(limite, valeur) : requete.bind(limite, valeur, telephone)).all<ResumeLead>();
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

/** Relance un envoi en échec (ou bloqué après 5 essais) : compteur remis à zéro, puis envoi immédiat par delivery.ts. */
export async function rejouerEnvoi(env: EnvSite, id: string, canal: string, compte: string): Promise<boolean> {
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
  await diffuser(env, id);
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
