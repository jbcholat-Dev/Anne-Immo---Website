// Relève Leedflow (story 13.10, AD-20 entrée 4) : Leedflow, le logiciel qui résume par IA les appels d'Anne, n'a pas de
// webhook. La tâche planifiée de l'espace (worker.ts, toutes les 10 minutes) lit son API en lecture seule
// (https://api.leedflow.com/api/external/v1, clé `LEEDFLOW_API_KEY` posée par JB en secret de ce Worker, jamais lue
// par Claude, AD-9) : appels, messages vocaux, SMS et tâches créés depuis le dernier passage, avec 24 heures de
// recouvrement pour compléter un résumé produit après coup. Idempotent par l'identifiant Leedflow.
// - Numéro connu (téléphone E.164 d'un contact) : une ligne dans l'historique, avec le résumé, le sens et la durée.
//   La transcription complète et l'enregistrement restent dans Leedflow.
// - Numéro inconnu : proposé sur « Aujourd'hui » (créer le contact ou écarter le numéro), jamais créé d'office, car la
//   ligne reçoit aussi des appels personnels. Seuls les 30 derniers jours sont proposés.
// - Tâche détectée par Leedflow : proposée comme prochaine action, qu'Anne accepte ou ignore. Rien ne change d'étape.
// Premier passage : tout l'historique est repris, pour les numéros déjà connus seulement, par paquets de pages.
import type { EnvEspace } from './env';
import { journal } from '@site/server/journal';
import { e164 } from '@site/server/schema';
import { aujourdhui, echeance, plusTard } from './pipeline';

const API = 'https://api.leedflow.com/api/external/v1';
export type Genre = 'appel' | 'vocal' | 'sms' | 'tache';
const CHEMINS: Record<Genre, string> = { appel: '/calls', vocal: '/voicemails', sms: '/sms', tache: '/tasks' };
const GENRES: Genre[] = ['appel', 'vocal', 'sms', 'tache'];
const PAR_PAGE = 100;
const RECOUVREMENT_MS = 24 * 3_600_000;
/** Pages lues au plus par passage, tous genres confondus : la reprise d'un long historique se fait en plusieurs passages. */
const PAGES_PAR_PASSAGE = 30;
/** Fiches de contacts Leedflow lues au plus par passage, pour ranger les tâches. */
const FICHES_PAR_PASSAGE = 10;
export const INCONNUS_JOURS = 30;
const TACHES_JOURS = 30;
const JOUR_MS = 86_400_000;

interface Element {
  id: string;
  created: number;
  customer?: string;
  direction?: string;
  duration?: number;
  missed?: boolean;
  transcription?: string | null;
  message?: string;
  role?: string;
  status?: string;
  task?: string;
  timestamp?: number | null;
  id_contact?: string;
}

/** Un numéro tel que Leedflow le donne (« +33612… », « 06 12… », « 33612… ») au format E.164. */
export function numero(v: unknown): string | null {
  const s = typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '';
  if (!s) return null;
  const n = e164(s);
  if (n) return n;
  const chiffres = s.replace(/\D/g, '');
  return /^(33|41)\d{9}$/.test(chiffres) ? `+${chiffres}` : null;
}

const minutes = (s: number | undefined) => (!s ? '' : s < 60 ? `${s} s` : `${Math.round(s / 60)} min`);

/** Ce qu'on garde d'un appel, d'un message vocal ou d'un SMS : un titre, le résumé, et quelques données. */
export function decrire(genre: Exclude<Genre, 'tache'>, e: Element): { texte: string; donnees: Record<string, unknown> } {
  let titre: string, sens: 'entrant' | 'sortant', resume: string;
  if (genre === 'sms') {
    sens = e.role === 'assistant' ? 'sortant' : 'entrant';
    titre = sens === 'sortant' ? 'SMS envoyé' : 'SMS reçu';
    resume = (e.message ?? '').trim();
  } else if (genre === 'vocal') {
    sens = 'entrant';
    titre = ['Message vocal', minutes(e.duration)].filter(Boolean).join(' · ');
    resume = (e.transcription ?? '').trim();
  } else {
    sens = e.direction === 'outbound' ? 'sortant' : 'entrant';
    titre = e.missed ? (sens === 'sortant' ? 'Appel passé, sans réponse' : 'Appel manqué')
      : [sens === 'sortant' ? 'Appel passé' : 'Appel reçu', minutes(e.duration)].filter(Boolean).join(' · ');
    resume = (e.transcription ?? '').trim();
  }
  return {
    texte: resume ? `${titre}\n${resume.slice(0, 4000)}` : titre,
    donnees: { genre, sens, duree: e.duration ?? null, manque: !!e.missed, resume: !!resume, leedflow_contact: e.id_contact ?? null },
  };
}

class ErreurLeedflow extends Error {}

/** Les éléments d'une réponse de l'API, quelle que soit l'enveloppe (`data` tableau, ou `data.items`). */
function elements(j: unknown): Element[] {
  const o = j as Record<string, any> | null;
  const liste = [o, o?.data, o?.data?.data, o?.data?.items, o?.items, o?.results].find(Array.isArray) as unknown[] | undefined;
  return (liste ?? []).filter((e): e is Element => !!e && typeof (e as Element).id === 'string' && typeof (e as Element).created === 'number');
}

function nombreDePages(j: unknown): number | null {
  const o = j as Record<string, any> | null;
  const p = o?.pagination ?? o?.data?.pagination ?? o?.meta?.pagination ?? o?.meta;
  return typeof p?.total_pages === 'number' ? p.total_pages : null;
}

async function demander(env: EnvEspace, chemin: string, params: Record<string, string> = {}): Promise<unknown> {
  const url = new URL(`${env.LEEDFLOW_URL || API}${chemin}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${env.LEEDFLOW_API_KEY}`, Accept: 'application/json' } });
  if (!r.ok) throw new ErreurLeedflow(`HTTP ${r.status}`);
  return r.json();
}

async function page(env: EnvEspace, genre: Genre, apres: number, n: number) {
  const j = await demander(env, CHEMINS[genre], { created_after: String(apres), per_page: String(PAR_PAGE), page: String(n) });
  return { elements: elements(j), pages: nombreDePages(j) };
}

/** Téléphone → contact, en une requête. */
async function contactsParTelephone(env: EnvEspace, tels: string[]): Promise<Map<string, string>> {
  if (!tels.length) return new Map();
  const { results } = await env.DB.prepare('SELECT id, telephone FROM contact WHERE telephone IN (SELECT value FROM json_each(?1))')
    .bind(JSON.stringify([...new Set(tels)])).all<{ id: string; telephone: string }>();
  return new Map(results.map((r) => [r.telephone, r.id]));
}

async function lotParPaquets(env: EnvEspace, lot: D1PreparedStatement[]) {
  for (let i = 0; i < lot.length; i += 50) await env.DB.batch(lot.slice(i, i + 50));
}

/** Range une page d'appels, de messages vocaux ou de SMS : sur le contact connu, ou en proposition. */
async function rangerEchanges(env: EnvEspace, genre: Exclude<Genre, 'tache'>, els: Element[]): Promise<{ notes: number; inconnus: number }> {
  const avecTel = els.map((e) => ({ e, tel: numero(e.customer) })).filter((x): x is { e: Element; tel: string } => !!x.tel);
  const tels = avecTel.map((x) => x.tel);
  const connus = await contactsParTelephone(env, tels);
  const { results: ecartes } = await env.DB.prepare('SELECT telephone FROM leedflow_ecarte WHERE telephone IN (SELECT value FROM json_each(?1))')
    .bind(JSON.stringify(tels)).all<{ telephone: string }>();
  const ecarte = new Set(ecartes.map((r) => r.telephone));
  const limiteInconnus = Date.now() - INCONNUS_JOURS * JOUR_MS;
  const lot: D1PreparedStatement[] = [];
  let notes = 0, inconnus = 0;
  for (const { e, tel } of avecTel) {
    const sourceId = `${genre}:${e.id}`;
    const a = new Date(e.created).toISOString();
    const { texte, donnees } = decrire(genre, e);
    const contact = connus.get(tel);
    if (contact) {
      notes++;
      // Une seule ligne par élément Leedflow ; le texte est remplacé s'il a changé (résumé arrivé après coup).
      lot.push(env.DB.prepare(
        `INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees) VALUES (?1, ?2, 'appel', 'leedflow', ?3, ?4, ?5)
         ON CONFLICT (source, source_id) WHERE source_id IS NOT NULL DO UPDATE SET texte = excluded.texte, donnees = excluded.donnees
         WHERE contact_evenement.texte IS NOT excluded.texte`,
      ).bind(contact, a, sourceId, texte, JSON.stringify(donnees)));
      lot.push(env.DB.prepare('UPDATE contact SET last_activity_at = max(last_activity_at, ?2) WHERE id = ?1').bind(contact, a));
      if (e.id_contact) lot.push(env.DB.prepare('INSERT OR IGNORE INTO leedflow_lien (leedflow_contact, contact_id) VALUES (?1, ?2)').bind(e.id_contact, contact));
    } else if (!ecarte.has(tel) && e.created >= limiteInconnus) {
      inconnus++;
      lot.push(env.DB.prepare(
        `INSERT INTO leedflow_inconnu (source_id, telephone, a, texte, donnees) VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT (source_id) DO UPDATE SET texte = excluded.texte, donnees = excluded.donnees`,
      ).bind(sourceId, tel, a, texte, JSON.stringify(donnees)));
    }
  }
  await lotParPaquets(env, lot);
  return { notes, inconnus };
}

/** Range une page de tâches Leedflow : proposées sur le contact qui a ce contact Leedflow, s'il est connu. */
async function rangerTaches(env: EnvEspace, els: Element[], fiches: { reste: number }): Promise<number> {
  const limite = Date.now() - TACHES_JOURS * JOUR_MS;
  const ids = [...new Set(els.map((e) => e.id_contact).filter((x): x is string => !!x))];
  const { results } = await env.DB.prepare('SELECT leedflow_contact, contact_id FROM leedflow_lien WHERE leedflow_contact IN (SELECT value FROM json_each(?1))')
    .bind(JSON.stringify(ids)).all<{ leedflow_contact: string; contact_id: string }>();
  const liens = new Map(results.map((r) => [r.leedflow_contact, r.contact_id]));
  const lot: D1PreparedStatement[] = [];
  let proposees = 0;
  for (const e of els) {
    const aFaire = (e.status ?? '').toLowerCase() === 'todo';
    if (!aFaire) { lot.push(env.DB.prepare(`DELETE FROM leedflow_tache WHERE id = ?1 AND statut = 'proposee'`).bind(e.id)); continue; }
    if (!e.task?.trim() || !e.id_contact || e.created < limite) continue;
    let contact = liens.get(e.id_contact);
    // Contact Leedflow pas encore vu dans un appel : sa fiche donne son numéro (quelques fiches par passage).
    if (!contact && fiches.reste > 0) {
      fiches.reste--;
      const j = (await demander(env, `/contacts/${encodeURIComponent(e.id_contact)}`).catch(() => null)) as Record<string, any> | null;
      const tel = numero(j?.data?.phone ?? j?.phone);
      contact = tel ? (await contactsParTelephone(env, [tel])).get(tel) : undefined;
      if (contact) {
        liens.set(e.id_contact, contact);
        lot.push(env.DB.prepare('INSERT OR IGNORE INTO leedflow_lien (leedflow_contact, contact_id) VALUES (?1, ?2)').bind(e.id_contact, contact));
      }
    }
    if (!contact) continue;
    proposees++;
    const quand = typeof e.timestamp === 'number' ? new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date(e.timestamp)) : null;
    lot.push(env.DB.prepare(
      `INSERT INTO leedflow_tache (id, contact_id, a, texte, echeance) VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT (id) DO UPDATE SET texte = excluded.texte, echeance = excluded.echeance WHERE leedflow_tache.statut = 'proposee'`,
    ).bind(e.id, contact, new Date(e.created).toISOString(), e.task.trim().slice(0, 200), quand));
  }
  await lotParPaquets(env, lot);
  return proposees;
}

/** Les éléments venus d'un numéro inconnu qui est désormais celui d'un contact passent dans son historique. */
export async function rattacherInconnus(env: EnvEspace): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees)
       SELECT c.id, i.a, 'appel', 'leedflow', i.source_id, i.texte, i.donnees FROM leedflow_inconnu i JOIN contact c ON c.telephone = i.telephone
       WHERE true ON CONFLICT (source, source_id) WHERE source_id IS NOT NULL DO NOTHING`,
    ),
    env.DB.prepare(
      `INSERT OR IGNORE INTO leedflow_lien (leedflow_contact, contact_id)
       SELECT json_extract(i.donnees, '$.leedflow_contact'), c.id FROM leedflow_inconnu i JOIN contact c ON c.telephone = i.telephone
       WHERE json_extract(i.donnees, '$.leedflow_contact') IS NOT NULL`,
    ),
    env.DB.prepare('DELETE FROM leedflow_inconnu WHERE telephone IN (SELECT telephone FROM contact WHERE telephone IS NOT NULL)'),
  ]);
}

/** Un passage de la relève. Sans clé, ne fait rien (Leedflow pas encore branché). */
export async function relever(env: EnvEspace): Promise<void> {
  if (!env.LEEDFLOW_API_KEY) { journal('leedflow_sans_cle'); return; }
  await rattacherInconnus(env);
  const { results } = await env.DB.prepare('SELECT genre, curseur FROM leedflow_releve').all<{ genre: Genre; curseur: number }>();
  const curseurs = new Map(results.map((r) => [r.genre, r.curseur]));
  let budget = PAGES_PAR_PASSAGE;
  const fiches = { reste: FICHES_PAR_PASSAGE };
  const bilan = { notes: 0, inconnus: 0, taches: 0, pages: 0 };
  for (const genre of GENRES) {
    const curseur = curseurs.get(genre) ?? 0;
    let nouveau = curseur, erreur: string | null = null;
    try {
      const apres = Math.max(0, curseur - RECOUVREMENT_MS);
      const ranger = async (els: Element[]) => {
        if (genre === 'tache') bilan.taches += await rangerTaches(env, els, fiches);
        else { const r = await rangerEchanges(env, genre, els); bilan.notes += r.notes; bilan.inconnus += r.inconnus; }
        for (const e of els) nouveau = Math.max(nouveau, e.created);
      };
      const premiere = await page(env, genre, apres, 1);
      budget--; bilan.pages++;
      const total = premiere.pages ?? (premiere.elements.length < PAR_PAGE ? 1 : null);
      if (total === null) {
        // Pagination inconnue : on avance page après page jusqu'à une page incomplète.
        await ranger(premiere.elements);
        for (let n = 2; budget > 0; n++) {
          const p = await page(env, genre, apres, n);
          budget--; bilan.pages++;
          await ranger(p.elements);
          if (p.elements.length < PAR_PAGE) break;
        }
      } else {
        // Les pages vont du plus récent au plus ancien : on les prend de la dernière à la première, pour que le curseur
        // n'avance que sur ce qui est fait, même si le passage s'arrête faute de budget.
        for (let n = total; n >= 1; n--) {
          if (n > 1 && budget <= 0) break;
          const els = n === 1 ? premiere.elements : (await page(env, genre, apres, n)).elements;
          if (n > 1) { budget--; bilan.pages++; }
          await ranger(els);
        }
      }
    } catch (e) {
      erreur = e instanceof ErreurLeedflow ? e.message : 'erreur inattendue';
      journal('leedflow_erreur', { genre, erreur, detail: e instanceof ErreurLeedflow ? undefined : String(e).slice(0, 200) });
    }
    await env.DB.prepare(
      `INSERT INTO leedflow_releve (genre, curseur, passe_le, erreur) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT (genre) DO UPDATE SET curseur = excluded.curseur, passe_le = excluded.passe_le, erreur = excluded.erreur`,
    ).bind(genre, nouveau, new Date().toISOString(), erreur).run();
    if (erreur?.startsWith('HTTP 401') || erreur?.startsWith('HTTP 403')) break;
  }
  await rattacherInconnus(env);
  journal('leedflow_releve', bilan);
}

// ——— Ce que l'espace affiche et ce qu'Anne décide ———

export interface EtatReleve { branche: boolean; passe_le: string | null; erreur: string | null }

export async function etatReleve(env: EnvEspace): Promise<EtatReleve> {
  const r = await env.DB.prepare('SELECT max(passe_le) AS passe_le, max(erreur) AS erreur FROM leedflow_releve').first<{ passe_le: string | null; erreur: string | null }>();
  return { branche: !!env.LEEDFLOW_API_KEY, passe_le: r?.passe_le ?? null, erreur: r?.erreur ?? null };
}

export interface NumeroInconnu { telephone: string; n: number; dernier: string; texte: string | null }
export interface TacheProposee { id: string; texte: string; echeance: string | null; a: string; contact_id: string; prenom: string | null; nom: string | null; telephone: string | null }

const champsTache = 't.id, t.texte, t.echeance, t.a, c.id AS contact_id, c.prenom, c.nom, c.telephone';
const tachesOuvertes = `FROM leedflow_tache t JOIN contact c ON c.id = t.contact_id WHERE t.statut = 'proposee' AND c.etape NOT IN ('perdu', 'vendu', 'acte_signe')`;

/** Pour « Aujourd'hui » : les numéros inconnus qui ont appelé ou écrit, et les tâches proposées par Leedflow. */
export async function propositions(env: EnvEspace): Promise<{ inconnus: NumeroInconnu[]; taches: TacheProposee[] }> {
  const [inconnus, taches] = await env.DB.batch([
    env.DB.prepare(`SELECT telephone, count(*) AS n, max(a) AS dernier,
        (SELECT j.texte FROM leedflow_inconnu j WHERE j.telephone = i.telephone ORDER BY j.a DESC LIMIT 1) AS texte
      FROM leedflow_inconnu i WHERE telephone NOT IN (SELECT telephone FROM leedflow_ecarte) GROUP BY telephone ORDER BY dernier DESC LIMIT 20`),
    env.DB.prepare(`SELECT ${champsTache} ${tachesOuvertes} ORDER BY t.a DESC LIMIT 20`),
  ]);
  return { inconnus: inconnus.results as NumeroInconnu[], taches: taches.results as TacheProposee[] };
}

export async function tachesDuContact(env: EnvEspace, contactId: string): Promise<TacheProposee[]> {
  const { results } = await env.DB.prepare(`SELECT ${champsTache} ${tachesOuvertes} AND t.contact_id = ?1 ORDER BY t.a DESC`).bind(contactId).all<TacheProposee>();
  return results;
}

/** Accepter une tâche : elle devient la prochaine action du contact (à sa date, ou demain), et c'est noté. L'étape ne change pas. */
export async function deciderTache(env: EnvEspace, id: string, accepter: boolean, par: string): Promise<string | null> {
  const t = await env.DB.prepare(`SELECT t.id, t.contact_id, t.texte, t.echeance ${tachesOuvertes} AND t.id = ?1`).bind(id)
    .first<{ id: string; contact_id: string; texte: string; echeance: string | null }>();
  if (!t) return null;
  const maintenant = new Date().toISOString();
  const lot = [env.DB.prepare('UPDATE leedflow_tache SET statut = ?2, decide_le = ?3, par = ?4 WHERE id = ?1').bind(id, accepter ? 'acceptee' : 'ignoree', maintenant, par)];
  if (accepter) {
    const le = t.echeance ? (t.echeance < aujourdhui() ? aujourdhui() : t.echeance) : plusTard(1);
    lot.push(
      env.DB.prepare('UPDATE contact SET prochaine_action = ?2, prochaine_action_le = ?3, last_activity_at = ?4 WHERE id = ?1').bind(t.contact_id, t.texte, le, maintenant),
      env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, texte, par) VALUES (?1, ?2, 'note', 'anne', ?3, ?4)`)
        .bind(t.contact_id, maintenant, `Prochaine action proposée par Leedflow, acceptée : ${t.texte} · ${echeance(le)}`, par),
    );
  }
  await env.DB.batch(lot);
  return t.contact_id;
}

/** Écarter un numéro inconnu (appel personnel) : il n'est plus proposé, et ce qu'on en gardait est effacé. */
export async function ecarterNumero(env: EnvEspace, telephone: string, par: string): Promise<boolean> {
  const tel = numero(telephone);
  if (!tel) return false;
  await env.DB.batch([
    env.DB.prepare('INSERT OR IGNORE INTO leedflow_ecarte (telephone, a, par) VALUES (?1, ?2, ?3)').bind(tel, new Date().toISOString(), par),
    env.DB.prepare('DELETE FROM leedflow_inconnu WHERE telephone = ?1').bind(tel),
  ]);
  return true;
}

// ——— Affichage d'un résumé ———

const echapper = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const enLigne = (s: string) => echapper(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>');

/** Le résumé Markdown de Leedflow (titres, gras, listes) en HTML sûr : tout est échappé avant la mise en forme. */
export function resumeHtml(md: string): string {
  const sortie: string[] = [];
  let liste = false;
  for (const brute of md.split(/\r?\n/)) {
    const ligne = brute.trim();
    const puce = /^[-*•]\s+(.*)$/.exec(ligne);
    if (puce) { if (!liste) { sortie.push('<ul>'); liste = true; } sortie.push(`<li>${enLigne(puce[1])}</li>`); continue; }
    if (liste) { sortie.push('</ul>'); liste = false; }
    if (!ligne) continue;
    const titre = /^#{1,6}\s+(.*)$/.exec(ligne);
    sortie.push(titre ? `<p><strong>${enLigne(titre[1])}</strong></p>` : `<p>${enLigne(ligne)}</p>`);
  }
  if (liste) sortie.push('</ul>');
  return sortie.join('');
}

/** Un extrait en texte simple, sans les marques du Markdown, pour une carte. */
export function extrait(texte: string | null): string {
  return (texte ?? '').replace(/^#{1,6}\s+/gm, '').replace(/[*_`>]+/g, '').replace(/\s+/g, ' ').trim();
}
