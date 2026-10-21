// Journal des actions marketing (story 13.17) : ce qu'Anne dépense pour trouver des contacts (flyers, publicité, salon…),
// par canal, et ce que chaque action a rapporté. Les contacts y sont rattachés d'office par la base quand une seule action
// de leur canal est en cours à leur arrivée (déclencheur de la migration 0010), sinon par Anne à la qualification ou sur
// la fiche. Écrit par les pages de l'espace et par l'accès de Claude (/api/claude/…), qui ne lit jamais un contact :
// seulement des totaux. Montants en centimes d'euro.
import type { EnvSite } from '@site/server/env';
import { CANAUX_ORIGINE, type Canal } from '@site/server/contacts';
import { ulid } from '@site/server/ulid';
import { aujourdhui } from './pipeline';

export interface ActionMarketing {
  id: string;
  nom: string;
  canal: Canal;
  debut: string;
  fin: string | null;
  budget_centimes: number | null;
  cout_centimes: number | null;
  note: string | null;
  auteur: 'anne' | 'claude';
  created_at: string;
  maj_le: string;
}

export interface ResultatAction extends ActionMarketing { contacts: number; qualifies: number; rdv: number; mandats: number }

export type ChampsAction = Pick<ActionMarketing, 'nom' | 'canal' | 'debut' | 'fin' | 'budget_centimes' | 'cout_centimes' | 'note'>;

const ETAPES_RDV = ['premier_rdv', 'estimation', 'second_rdv', 'mandat_exclusif', 'en_vente', 'vendu', 'besoin_defini', 'mandat_recherche', 'visites', 'offre_acceptee', 'acte_signe'];
const ETAPES_MANDAT = ['mandat_exclusif', 'en_vente', 'vendu', 'mandat_recherche', 'visites', 'offre_acceptee', 'acte_signe'];
const liste = (v: string[]) => v.map((e) => `'${e}'`).join(', ');
const aAtteint = (etapes: string[]) => `(c.etape IN (${liste(etapes)}) OR EXISTS (SELECT 1 FROM contact_evenement e WHERE e.contact_id = c.id AND e.type = 'etape' AND json_extract(e.donnees, '$.vers') IN (${liste(etapes)})))`;

const CHAMPS = 'a.id, a.nom, a.canal, a.debut, a.fin, a.budget_centimes, a.cout_centimes, a.note, a.auteur, a.created_at, a.maj_le';
const TOTAUX = `(SELECT count(*) FROM contact c WHERE c.action_id = a.id) AS contacts,
  (SELECT count(*) FROM contact c WHERE c.action_id = a.id AND c.qualifie_le IS NOT NULL) AS qualifies,
  (SELECT count(*) FROM contact c WHERE c.action_id = a.id AND ${aAtteint(ETAPES_RDV)}) AS rdv,
  (SELECT count(*) FROM contact c WHERE c.action_id = a.id AND ${aAtteint(ETAPES_MANDAT)}) AS mandats`;

/** Ce que l'action a coûté : le coût réel s'il est connu, sinon le budget prévu. */
export const coutRetenu = (a: Pick<ActionMarketing, 'budget_centimes' | 'cout_centimes'>) => a.cout_centimes ?? a.budget_centimes;

/** « 1 250 € », « 12,50 € » */
export function euros(centimes: number | null | undefined): string {
  if (centimes === null || centimes === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: centimes % 100 ? 2 : 0 }).format(centimes / 100).replace(/ /g, ' ');
}

/** Un coût par contact, rendez-vous ou mandat : « — » quand il n'y en a aucun. */
export const parUnite = (centimes: number | null, n: number) => (centimes === null || n === 0 ? '—' : euros(Math.round(centimes / n)));

/** « 120 », « 120,5 », « 120.50 », « 1 200 € » → centimes ; '' → null ; illisible → undefined. */
export function lireEuros(v: string): number | null | undefined {
  const s = v.replace(/[\s €]/g, '').replace(',', '.');
  if (!s) return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return undefined;
  return Math.round(Number(s) * 100);
}

const estDate = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`));
const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Vérifie les champs d'une action, venus d'un formulaire ou de l'accès de Claude. Renvoie le message d'erreur sinon. */
export function verifierAction(d: Record<string, unknown>): ChampsAction | string {
  const nom = texte(d.nom, 120);
  if (!nom) return "Donnez un nom à l'action.";
  const canal = texte(d.canal, 20);
  if (!(canal in CANAUX_ORIGINE)) return 'Choisissez le canal.';
  if (!estDate(d.debut)) return 'Indiquez la date de début.';
  const fin = d.fin === null || d.fin === undefined || d.fin === '' ? null : d.fin;
  if (fin !== null && !estDate(fin)) return 'La date de fin ne semble pas valable.';
  if (fin && fin < d.debut) return 'La date de fin est avant le début.';
  const montant = (v: unknown) => (typeof v === 'number' ? (Number.isInteger(v) && v >= 0 && v < 1e9 ? v : undefined) : v === null || v === undefined ? null : undefined);
  const budget = montant(d.budget_centimes), cout = montant(d.cout_centimes);
  if (budget === undefined) return 'Le budget ne semble pas valable.';
  if (cout === undefined) return 'Le coût ne semble pas valable.';
  return { nom, canal: canal as Canal, debut: d.debut, fin, budget_centimes: budget, cout_centimes: cout, note: texte(d.note, 1000) || null };
}

/** Champs d'une action depuis un formulaire de l'espace (montants saisis en euros). */
export function actionDuFormulaire(f: FormData): ChampsAction | string {
  const v = (k: string) => { const x = f.get(k); return typeof x === 'string' ? x.trim() : ''; };
  const budget = lireEuros(v('budget')), cout = lireEuros(v('cout'));
  if (budget === undefined) return 'Le budget ne semble pas valable (en euros, par exemple 150 ou 49,90).';
  if (cout === undefined) return 'Le coût ne semble pas valable (en euros, par exemple 150 ou 49,90).';
  return verifierAction({ nom: v('nom'), canal: v('canal'), debut: v('debut'), fin: v('fin') || null, budget_centimes: budget, cout_centimes: cout, note: v('note') });
}

/** Crée une action, ou modifie celle dont l'id est donné. Renvoie l'id, ou null si l'action à modifier n'existe pas. */
export async function enregistrerAction(env: EnvSite, id: string | null, a: ChampsAction, auteur: 'anne' | 'claude', par: string): Promise<string | null> {
  const maintenant = new Date().toISOString();
  if (id) {
    const r = await env.DB.prepare(
      `UPDATE action_marketing SET maj_le = ?2, nom = ?3, canal = ?4, debut = ?5, fin = ?6, budget_centimes = ?7, cout_centimes = ?8, note = ?9, par = ?10 WHERE id = ?1`,
    ).bind(id, maintenant, a.nom, a.canal, a.debut, a.fin, a.budget_centimes, a.cout_centimes, a.note, par).run();
    return r.meta.changes > 0 ? id : null;
  }
  const nouveau = ulid();
  await env.DB.prepare(
    `INSERT INTO action_marketing (id, created_at, maj_le, nom, canal, debut, fin, budget_centimes, cout_centimes, note, auteur, par)
     VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
  ).bind(nouveau, maintenant, a.nom, a.canal, a.debut, a.fin, a.budget_centimes, a.cout_centimes, a.note, auteur, par).run();
  return nouveau;
}

/** Supprime une action ; ses contacts restent, simplement sans action. */
export async function supprimerAction(env: EnvSite, id: string): Promise<boolean> {
  const [, r] = await env.DB.batch([
    env.DB.prepare('UPDATE contact SET action_id = NULL WHERE action_id = ?1').bind(id),
    env.DB.prepare('DELETE FROM action_marketing WHERE id = ?1').bind(id),
  ]);
  return r.meta.changes > 0;
}

/** Les actions avec ce qu'elles ont rapporté, les plus récentes d'abord. */
export async function listerActions(env: EnvSite, limite = 200): Promise<ResultatAction[]> {
  const { results } = await env.DB.prepare(`SELECT ${CHAMPS}, ${TOTAUX} FROM action_marketing a ORDER BY a.debut DESC, a.created_at DESC LIMIT ?1`)
    .bind(limite).all<ResultatAction>();
  return results;
}

export async function lireAction(env: EnvSite, id: string): Promise<ResultatAction | null> {
  return env.DB.prepare(`SELECT ${CHAMPS}, ${TOTAUX} FROM action_marketing a WHERE a.id = ?1`).bind(id).first<ResultatAction>();
}

/** Les actions qu'on peut choisir pour un contact : celles de son canal d'abord, en cours ou récentes, puis les autres. */
export async function actionsAuChoix(env: EnvSite, canal: Canal): Promise<Pick<ActionMarketing, 'id' | 'nom' | 'canal' | 'debut' | 'fin'>[]> {
  const { results } = await env.DB.prepare(
    `SELECT id, nom, canal, debut, fin FROM action_marketing WHERE fin IS NULL OR fin >= date(?2, '-365 days')
     ORDER BY canal = ?1 DESC, debut DESC LIMIT 100`,
  ).bind(canal, aujourdhui()).all<Pick<ActionMarketing, 'id' | 'nom' | 'canal' | 'debut' | 'fin'>>();
  return results;
}

/** Rattache un contact à une action (ou à aucune, id null), et le note dans son historique. */
export async function rattacherAction(env: EnvSite, contactId: string, actionId: string | null, par: string): Promise<boolean> {
  const action = actionId ? await env.DB.prepare('SELECT nom FROM action_marketing WHERE id = ?1').bind(actionId).first<{ nom: string }>() : null;
  if (actionId && !action) return false;
  const maintenant = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare('UPDATE contact SET action_id = ?2, last_activity_at = ?3 WHERE id = ?1 AND action_id IS NOT ?2').bind(contactId, actionId, maintenant),
    env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, texte, par)
      SELECT ?1, ?2, 'note', 'anne', ?3, ?4 WHERE changes() > 0`).bind(contactId, maintenant, action ? `Action marketing : ${action.nom}` : 'Action marketing retirée', par),
  ]);
  return true;
}

/** Ce que chaque canal a coûté sur une période : actions commencées depuis `debut` (coût réel, sinon budget) et passages
 * de boîtage faits depuis. Rapproché des contacts arrivés sur la même période dans le bilan. */
export async function coutsParCanal(env: EnvSite, debut: string): Promise<Map<Canal, number>> {
  const jour = debut.slice(0, 10);
  const [actions, passages] = await env.DB.batch([
    env.DB.prepare('SELECT canal, sum(coalesce(cout_centimes, budget_centimes, 0)) AS c FROM action_marketing WHERE debut >= ?1 GROUP BY canal').bind(jour),
    env.DB.prepare('SELECT sum(coalesce(cout_centimes, 0)) AS c FROM passage_boitage WHERE fait_le >= ?1').bind(jour),
  ]);
  const couts = new Map<Canal, number>();
  for (const l of actions.results as { canal: Canal; c: number }[]) if (l.c) couts.set(l.canal, l.c);
  const p = (passages.results[0] as { c: number | null } | undefined)?.c ?? 0;
  if (p) couts.set('boitage', (couts.get('boitage') ?? 0) + p);
  return couts;
}
