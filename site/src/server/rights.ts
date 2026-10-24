// Droits RGPD (story 10.7, AD-18) : accès (export lisible) et effacement, pour une adresse e-mail, et depuis la story 13.23
// pour un contact de l'espace d'Anne désigné par son identifiant (contact sans adresse : boîtage, téléphone).
// Toutes les demandes faites avec cette adresse sont concernées, quel que soit le formulaire. Depuis la story 13.4 (AD-20),
// aussi le contact de l'espace d'Anne qui porte cette adresse ou ces demandes, avec son historique et ses autres demandes
// (même personne, reconnue par son téléphone), et le prescripteur qui porterait cette adresse.
// Chaque exercice de droit est noté dans la table droit_exerce (date, type, empreinte de l'adresse, compte qui a agi).
// Rien n'est à effacer chez Resend : le site n'y crée aucun contact ni audience (AD-8), il n'envoie que des e-mails.
// La suppression de la réservation Cal.com et la réponse à la personne suivent la procédure du RUNBOOK (§ 4 quinquies).
import type { EnvSite } from './env';
import { empreinte, journal } from './journal';

const PARSER = ['answers', 'scores', 'utm'];
/** Les contacts de l'espace d'Anne liés à une adresse : celui qui la porte, et ceux des demandes faites avec elle. */
const CONTACTS_DE_L_ADRESSE = 'email = ?1 OR id IN (SELECT contact_id FROM lead WHERE lower(email) = ?1 AND contact_id IS NOT NULL)';
const TECHNIQUES = ['token', 'token_browser', 'token_expires_at', 'submission_id'];

/** `cle` : l'adresse e-mail, ou pour un contact de l'espace sans adresse, son téléphone ou son identifiant (story 13.23). */
async function noter(env: EnvSite, type: 'acces' | 'effacement', cle: string, leads: number, compte: string) {
  const e = await empreinte(cle);
  await env.DB.prepare('INSERT INTO droit_exerce (a, type, email_empreinte, leads, par) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(new Date().toISOString(), type, e, leads, compte).run();
  journal(`droit_${type}`, { email: e, leads, par: compte });
}

/** Tout ce que le site garde sur une adresse, sous une forme lisible (droit d'accès). */
export async function exporter(env: EnvSite, email: string, compte: string) {
  const adresse = email.trim().toLowerCase();
  const { results: leads } = await env.DB.prepare('SELECT * FROM lead WHERE lower(email) = ?1 ORDER BY created_at').bind(adresse).all<Record<string, unknown>>();
  const demandes = [];
  for (const l of leads) demandes.push(await demandeLisible(env, l));
  const { results: contacts } = await env.DB.prepare(`SELECT * FROM contact WHERE ${CONTACTS_DE_L_ADRESSE} ORDER BY created_at`)
    .bind(adresse).all<Record<string, unknown>>();
  const fiches = await fichesLisibles(env, contacts);
  const { results: prescripteurs } = await env.DB.prepare('SELECT * FROM prescripteur WHERE email = ?1').bind(adresse).all<Record<string, unknown>>();
  const maintenant = new Date().toISOString();
  if (leads.length) await env.DB.prepare('UPDATE lead SET last_activity_at = ?2 WHERE lower(email) = ?1').bind(adresse, maintenant).run();
  await noter(env, 'acces', adresse, leads.length, compte);
  return {
    responsable: RESPONSABLE, exporte_le: maintenant, email: adresse, demandes,
    ...(fiches.length ? { contacts: fiches } : {}),
    ...(prescripteurs.length ? { prescripteur: prescripteurs.map((p) => Object.fromEntries(Object.entries(p).filter(([k, v]) => v !== null && k !== 'is_test'))) } : {}),
  };
}

const RESPONSABLE = 'Anne VIAL-TISSOT, www.annevialtissot.fr';

/** Une demande du site sous forme lisible, avec ses envois, sans les jetons techniques. */
async function demandeLisible(env: EnvSite, l: Record<string, unknown>) {
  const { results: envois } = await env.DB.prepare('SELECT channel, status, delivered_at FROM lead_delivery WHERE lead_id = ?1 ORDER BY channel').bind(l.id).all();
  const lisible: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(l)) {
    if (TECHNIQUES.includes(k) || v === null) continue;
    lisible[k] = PARSER.includes(k) && typeof v === 'string' ? JSON.parse(v) : v;
  }
  return { ...lisible, envois };
}

/** Les contacts de l'espace sous forme lisible, avec leur historique et les tâches proposées par Leedflow. */
async function fichesLisibles(env: EnvSite, contacts: Record<string, unknown>[]) {
  const fiches = [];
  for (const c of contacts) {
    const { results: historique } = await env.DB.prepare(
      'SELECT a, type, source, texte, donnees FROM contact_evenement WHERE contact_id = ?1 ORDER BY a, id',
    ).bind(c.id).all<Record<string, unknown>>();
    const { results: taches } = await env.DB.prepare('SELECT a, texte, echeance, statut FROM leedflow_tache WHERE contact_id = ?1 ORDER BY a').bind(c.id).all<Record<string, unknown>>();
    const lisible: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(c)) {
      if (v === null || k === 'is_test') continue;
      lisible[k] = k === 'qualification' && typeof v === 'string' ? JSON.parse(v) : v;
    }
    fiches.push({
      ...lisible,
      historique: historique.map((h) => ({ ...h, donnees: typeof h.donnees === 'string' ? JSON.parse(h.donnees) : undefined })),
      ...(taches.length ? { taches_proposees_par_leedflow: taches } : {}),
    });
  }
  return fiches;
}

/**
 * Droit d'accès depuis la fiche d'un contact de l'espace (story 13.23) : utile pour un contact sans adresse e-mail
 * (boîtage, téléphone). Le contact, son historique, ses demandes du site et ce que Leedflow a relevé pour son numéro.
 */
export async function exporterContact(env: EnvSite, id: string, compte: string) {
  const contact = await env.DB.prepare('SELECT * FROM contact WHERE id = ?1').bind(id).first<Record<string, unknown>>();
  if (!contact) return null;
  const { results: leads } = await env.DB.prepare('SELECT * FROM lead WHERE contact_id = ?1 ORDER BY created_at').bind(id).all<Record<string, unknown>>();
  const demandes = [];
  for (const l of leads) demandes.push(await demandeLisible(env, l));
  const [fiche] = await fichesLisibles(env, [contact]);
  const maintenant = new Date().toISOString();
  await noter(env, 'acces', String(contact.email ?? contact.telephone ?? id), leads.length, compte);
  return { responsable: RESPONSABLE, exporte_le: maintenant, contact: fiche, demandes };
}

/**
 * Droit à l'effacement depuis la fiche d'un contact (story 13.23) : le contact, son historique, ses demandes du site
 * et leurs envois, ses tâches et liens Leedflow, et ce que Leedflow a relevé ou classé pour son numéro.
 * Renvoie le nombre de demandes du site effacées, ou null si le contact n'existe pas.
 */
export async function effacerContact(env: EnvSite, id: string, compte: string): Promise<number | null> {
  const c = await env.DB.prepare('SELECT email, telephone FROM contact WHERE id = ?1').bind(id).first<{ email: string | null; telephone: string | null }>();
  if (!c) return null;
  const [, leads] = await env.DB.batch([
    env.DB.prepare('DELETE FROM lead_delivery WHERE lead_id IN (SELECT id FROM lead WHERE contact_id = ?1)').bind(id),
    env.DB.prepare('DELETE FROM lead WHERE contact_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM contact_evenement WHERE contact_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM leedflow_tache WHERE contact_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM leedflow_lien WHERE contact_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM leedflow_inconnu WHERE telephone = ?1').bind(c.telephone),
    env.DB.prepare('DELETE FROM leedflow_ecarte WHERE telephone = ?1').bind(c.telephone),
    env.DB.prepare('DELETE FROM contact WHERE id = ?1').bind(id),
  ]);
  const n = leads.meta.changes ?? 0;
  await noter(env, 'effacement', c.email ?? c.telephone ?? id, n, compte);
  return n;
}

/** Efface toutes les demandes d'une adresse et leurs envois (droit à l'effacement). Renvoie le nombre de demandes effacées. */
export async function effacer(env: EnvSite, email: string, compte: string): Promise<number> {
  const adresse = email.trim().toLowerCase();
  // Les contacts concernés sont relevés d'abord : ils sont retrouvés par les demandes, qu'on efface ensuite.
  const { results: contacts } = await env.DB.prepare(`SELECT id FROM contact WHERE ${CONTACTS_DE_L_ADRESSE}`).bind(adresse).all<{ id: string }>();
  const ids = JSON.stringify(contacts.map((c) => c.id));
  const DE_CES_CONTACTS = 'IN (SELECT value FROM json_each(?2))';
  const [, leads] = await env.DB.batch([
    env.DB.prepare(`DELETE FROM lead_delivery WHERE lead_id IN (SELECT id FROM lead WHERE lower(email) = ?1 OR contact_id ${DE_CES_CONTACTS})`).bind(adresse, ids),
    env.DB.prepare(`DELETE FROM lead WHERE lower(email) = ?1 OR contact_id ${DE_CES_CONTACTS}`).bind(adresse, ids),
    env.DB.prepare(`DELETE FROM contact_evenement WHERE contact_id ${DE_CES_CONTACTS.replace('?2', '?1')}`).bind(ids),
    // Tâches et liens Leedflow de ces contacts (story 13.10, migration 0008).
    env.DB.prepare(`DELETE FROM leedflow_tache WHERE contact_id ${DE_CES_CONTACTS.replace('?2', '?1')}`).bind(ids),
    env.DB.prepare(`DELETE FROM leedflow_lien WHERE contact_id ${DE_CES_CONTACTS.replace('?2', '?1')}`).bind(ids),
    env.DB.prepare(`DELETE FROM contact WHERE id ${DE_CES_CONTACTS.replace('?2', '?1')}`).bind(ids),
    env.DB.prepare('DELETE FROM prescripteur WHERE email = ?1').bind(adresse),
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
