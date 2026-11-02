// Droits RGPD (story 10.7, AD-18) : accès (export lisible) et effacement, pour une adresse e-mail, et depuis la story 13.23
// pour un contact de l'espace d'Anne désigné par son identifiant (contact sans adresse : boîtage, téléphone).
// Toutes les demandes faites avec cette adresse sont concernées, quel que soit le formulaire. Depuis la story 13.4 (AD-20),
// aussi le contact de l'espace d'Anne qui porte cette adresse ou ces demandes, avec son historique et ses autres demandes
// (même personne, reconnue par son téléphone), et le prescripteur qui porterait cette adresse.
// Chaque exercice de droit est noté dans la table droit_exerce (date, type, empreinte de l'adresse, compte qui a agi).
// Depuis la story 18.3 (AD-31, AD-32) : l'adresse est aussi cherchée dans les autres coordonnées des contacts
// (`contact_coordonnee`) ; l'effacement couvre `contact_coordonnee`, `contact_source`, `nouveau` et les tables Leedflow
// de tous les numéros du contact, garde le classement Privé ou Démarchage d'un numéro (simple numéro, sans autre donnée,
// pour que ses appels ne reviennent pas à trier) et ajoute l'empreinte de chaque téléphone et e-mail à `opposition`.
// Rien n'est à effacer chez Resend : le site n'y crée aucun contact ni audience (AD-8), il n'envoie que des e-mails.
// La suppression de la réservation Cal.com et la réponse à la personne suivent la procédure du RUNBOOK (§ 4 quinquies).
import type { EnvSite } from './env';
import { empreinte, journal } from './journal';
import { ecrituresOpposition } from './opposition';

const PARSER = ['answers', 'scores', 'utm'];
/** Les contacts de l'espace d'Anne liés à une adresse : celui qui la porte, et ceux des demandes faites avec elle. */
const CONTACTS_DE_L_ADRESSE = `email = ?1 OR id IN (SELECT contact_id FROM lead WHERE lower(email) = ?1 AND contact_id IS NOT NULL)
  OR id IN (SELECT contact_id FROM contact_coordonnee WHERE type = 'email' AND valeur = ?1)`;
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
  const { results: contacts } = await env.DB.prepare(`SELECT * FROM contact WHERE ${CONTACTS_DE_L_ADRESSE} ORDER BY created_at`)
    .bind(adresse).all<Record<string, unknown>>();
  // Les demandes de l'adresse, et celles des contacts trouvés faites avec un autre e-mail ou un téléphone (revue de code 18.3).
  const { results: leads } = await env.DB.prepare(
    'SELECT * FROM lead WHERE lower(email) = ?1 OR contact_id IN (SELECT value FROM json_each(?2)) ORDER BY created_at',
  ).bind(adresse, JSON.stringify(contacts.map((c) => c.id))).all<Record<string, unknown>>();
  const demandes = [];
  for (const l of leads) demandes.push(await demandeLisible(env, l));
  const fiches = await fichesLisibles(env, contacts);
  const { results: prescripteurs } = await env.DB.prepare('SELECT * FROM prescripteur WHERE email = ?1').bind(adresse).all<Record<string, unknown>>();
  const maintenant = new Date().toISOString();
  if (leads.length) await env.DB.prepare('UPDATE lead SET last_activity_at = ?2 WHERE id IN (SELECT value FROM json_each(?1))').bind(JSON.stringify(leads.map((l) => l.id)), maintenant).run();
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
    // Carnet (story 18.3) : autres numéros, e-mails et profils, et d'où vient le contact.
    const { results: coordonnees } = await env.DB.prepare('SELECT type, reseau, valeur, ajoute_le FROM contact_coordonnee WHERE contact_id = ?1 ORDER BY id').bind(c.id).all<Record<string, unknown>>();
    const { results: sources } = await env.DB.prepare('SELECT source, a FROM contact_source WHERE contact_id = ?1 ORDER BY a').bind(c.id).all<Record<string, unknown>>();
    const lisible: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(c)) {
      if (v === null || k === 'is_test') continue;
      lisible[k] = k === 'qualification' && typeof v === 'string' ? JSON.parse(v) : v;
    }
    fiches.push({
      ...lisible,
      historique: historique.map((h) => ({ ...h, donnees: typeof h.donnees === 'string' ? JSON.parse(h.donnees) : undefined })),
      ...(taches.length ? { taches_proposees_par_leedflow: taches } : {}),
      ...(coordonnees.length ? { autres_coordonnees: coordonnees.map((k) => Object.fromEntries(Object.entries(k).filter(([, v]) => v !== null))) } : {}),
      ...(sources.length ? { sources } : {}),
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

/** Téléphones et e-mails de ces contacts, principaux et autres (story 18.3) : pour Leedflow et l'opposition. */
async function coordonneesDe(env: EnvSite, ids: string[]): Promise<{ telephones: string[]; emails: string[] }> {
  const { results } = await env.DB.prepare(
    `SELECT telephone AS v, 'telephone' AS t FROM contact WHERE id IN (SELECT value FROM json_each(?1)) AND telephone IS NOT NULL
     UNION SELECT email, 'email' FROM contact WHERE id IN (SELECT value FROM json_each(?1)) AND email IS NOT NULL
     UNION SELECT valeur, type FROM contact_coordonnee WHERE contact_id IN (SELECT value FROM json_each(?1)) AND type IN ('telephone', 'email')`,
  ).bind(JSON.stringify(ids)).all<{ v: string; t: 'telephone' | 'email' }>();
  return { telephones: results.filter((r) => r.t === 'telephone').map((r) => r.v), emails: results.filter((r) => r.t === 'email').map((r) => r.v) };
}

/**
 * Demandes du site restées sans contact (rattachement en échec, en attente du filet de la tâche planifiée) faites avec
 * l'un de ces téléphones ou e-mails : effacées avec la personne, sinon `rattacherOrphelins` recréerait le contact
 * effacé (revue de code 18.3). Renvoie leurs identifiants et leurs coordonnées, pour l'opposition.
 */
async function orphelinsDe(env: EnvSite, telephones: string[], emails: string[]): Promise<{ ids: string[]; valeurs: string[] }> {
  if (!telephones.length && !emails.length) return { ids: [], valeurs: [] };
  const { results } = await env.DB.prepare(
    `SELECT id, telephone, lower(email) AS email FROM lead WHERE contact_id IS NULL
       AND (telephone IN (SELECT value FROM json_each(?1)) OR lower(email) IN (SELECT value FROM json_each(?2)))`,
  ).bind(JSON.stringify(telephones), JSON.stringify(emails.map((e) => e.toLowerCase()))).all<{ id: string; telephone: string | null; email: string | null }>();
  return { ids: results.map((l) => l.id), valeurs: results.flatMap((l) => [l.telephone, l.email].filter((v): v is string => !!v)) };
}

/** Effacement des demandes désignées par leurs identifiants, avec leurs envois. */
const effacementDesDemandes = (env: EnvSite, ids: string[]): D1PreparedStatement[] => ids.length ? [
  env.DB.prepare('DELETE FROM lead_delivery WHERE lead_id IN (SELECT value FROM json_each(?1))').bind(JSON.stringify(ids)),
  env.DB.prepare('DELETE FROM lead WHERE id IN (SELECT value FROM json_each(?1))').bind(JSON.stringify(ids)),
] : [];

/** Résultat d'un effacement : demandes du site effacées, et si l'opposition a pu être notée (LIEN_SECRET posé). */
export interface Effacement { leads: number; opposition: boolean }

/**
 * Ce que l'effacement de ces contacts supprime, hors demandes du site : historique, file « Nouveaux », autres coordonnées,
 * sources, tâches et liens Leedflow, destinataires de campagne, ce que Leedflow a relevé pour leurs numéros, puis les
 * contacts. Un numéro classé Privé ou Démarchage reste classé (simple numéro, revue de code 18.1, AD-32), détaché du
 * contact ; un classement Pro ou Prospect part. Écrit en clair plutôt que confié aux ON DELETE CASCADE.
 */
function effacementDesContacts(env: EnvSite, ids: string[], telephones: string[]): D1PreparedStatement[] {
  const I = JSON.stringify(ids), T = JSON.stringify(telephones);
  const DE = 'IN (SELECT value FROM json_each(?1))';
  return [
    env.DB.prepare(`DELETE FROM nouveau WHERE contact_id ${DE}`).bind(I),
    env.DB.prepare(`DELETE FROM contact_evenement WHERE contact_id ${DE}`).bind(I),
    env.DB.prepare(`DELETE FROM contact_coordonnee WHERE contact_id ${DE}`).bind(I),
    env.DB.prepare(`DELETE FROM contact_source WHERE contact_id ${DE}`).bind(I),
    // Tâches et liens Leedflow (story 13.10, migration 0008), destinataires des campagnes (story 13.27, migration 0014).
    env.DB.prepare(`DELETE FROM leedflow_tache WHERE contact_id ${DE}`).bind(I),
    env.DB.prepare(`DELETE FROM leedflow_lien WHERE contact_id ${DE}`).bind(I),
    env.DB.prepare(`DELETE FROM campagne_destinataire WHERE contact_id ${DE}`).bind(I),
    env.DB.prepare(`DELETE FROM leedflow_inconnu WHERE telephone ${DE}`).bind(T),
    // Un numéro rangé sur un autre contact garde son classement (revue de code 18.3).
    env.DB.prepare(`DELETE FROM leedflow_ecarte WHERE categorie NOT IN ('prive', 'demarchage')
      AND (contact_id IN (SELECT value FROM json_each(?2)) OR (contact_id IS NULL AND telephone ${DE}))`).bind(T, I),
    env.DB.prepare(`UPDATE leedflow_ecarte SET contact_id = NULL WHERE contact_id ${DE}`).bind(I),
    env.DB.prepare(`DELETE FROM contact WHERE id ${DE}`).bind(I),
  ];
}

/**
 * Droit à l'effacement depuis la fiche d'un contact (story 13.23) : le contact, son historique, ses demandes du site
 * et leurs envois, et tout ce qu'en garde le carnet (voir effacementDesContacts). Renvoie le nombre de demandes du site
 * effacées, ou null si le contact n'existe pas.
 */
export async function effacerContact(env: EnvSite, id: string, compte: string): Promise<Effacement | null> {
  const c = await env.DB.prepare('SELECT email, telephone FROM contact WHERE id = ?1').bind(id).first<{ email: string | null; telephone: string | null }>();
  if (!c) return null;
  const { telephones, emails } = await coordonneesDe(env, [id]);
  const { results: adresses } = await env.DB.prepare('SELECT DISTINCT lower(email) AS e FROM lead WHERE contact_id = ?1').bind(id).all<{ e: string }>();
  const orphelins = await orphelinsDe(env, telephones, emails);
  const maintenant = new Date().toISOString();
  const opposition = await ecrituresOpposition(env, [...telephones, ...emails, ...adresses.map((a) => a.e), ...orphelins.valeurs], maintenant);
  const [, leads, ...suite] = await env.DB.batch([
    env.DB.prepare('DELETE FROM lead_delivery WHERE lead_id IN (SELECT id FROM lead WHERE contact_id = ?1)').bind(id),
    env.DB.prepare('DELETE FROM lead WHERE contact_id = ?1').bind(id),
    ...effacementDesDemandes(env, orphelins.ids),
    ...effacementDesContacts(env, [id], telephones),
    ...opposition.ecritures,
  ]);
  const n = (leads.meta.changes ?? 0) + (orphelins.ids.length ? suite[1].meta.changes ?? 0 : 0);
  await noter(env, 'effacement', c.email ?? c.telephone ?? id, n, compte);
  return { leads: n, opposition: opposition.notee };
}

/** Efface toutes les demandes d'une adresse et leurs envois (droit à l'effacement). Renvoie le nombre de demandes effacées. */
export async function effacer(env: EnvSite, email: string, compte: string): Promise<Effacement> {
  const adresse = email.trim().toLowerCase();
  // Les contacts concernés sont relevés d'abord : ils sont retrouvés par les demandes, qu'on efface ensuite.
  const { results: contacts } = await env.DB.prepare(`SELECT id FROM contact WHERE ${CONTACTS_DE_L_ADRESSE}`).bind(adresse).all<{ id: string }>();
  const liste = contacts.map((c) => c.id);
  const ids = JSON.stringify(liste);
  const { telephones, emails } = await coordonneesDe(env, liste);
  // Demandes sans contact de ces téléphones et e-mails ; celles de l'adresse elle-même partent par la requête suivante.
  const orphelins = await orphelinsDe(env, telephones, emails);
  const maintenant = new Date().toISOString();
  const opposition = await ecrituresOpposition(env, [adresse, ...telephones, ...emails, ...orphelins.valeurs], maintenant);
  const touchees = `lower(email) = ?1 OR contact_id IN (SELECT value FROM json_each(?2)) OR id IN (SELECT value FROM json_each(?3))`;
  const [, leads] = await env.DB.batch([
    env.DB.prepare(`DELETE FROM lead_delivery WHERE lead_id IN (SELECT id FROM lead WHERE ${touchees})`).bind(adresse, ids, JSON.stringify(orphelins.ids)),
    env.DB.prepare(`DELETE FROM lead WHERE ${touchees}`).bind(adresse, ids, JSON.stringify(orphelins.ids)),
    ...effacementDesContacts(env, liste, telephones),
    env.DB.prepare('DELETE FROM prescripteur WHERE email = ?1').bind(adresse),
    ...opposition.ecritures,
  ]);
  const n = leads.meta.changes ?? 0;
  await noter(env, 'effacement', adresse, n, compte);
  return { leads: n, opposition: opposition.notee };
}

/** Les derniers droits exercés (affichés dans l'espace de gestion). */
export interface DroitExerce { a: string; type: string; email_empreinte: string; leads: number; par: string }
export async function droitsExerces(env: EnvSite, limite = 20): Promise<DroitExerce[]> {
  const { results } = await env.DB.prepare('SELECT a, type, email_empreinte, leads, par FROM droit_exerce ORDER BY id DESC LIMIT ?1').bind(limite)
    .all<DroitExerce>();
  return results;
}
