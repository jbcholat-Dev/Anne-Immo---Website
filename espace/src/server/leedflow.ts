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
// Retour de JB du 2026-10-21 : pour un numéro inconnu, Anne voit aussi le nom du contact dans Leedflow (lu sur sa fiche),
// le résumé complet de chaque échange et les tâches détectées ; elles deviennent des propositions à la création du contact.
// Story 13.25 : la synthèse IA que Leedflow écrit de chaque contact (champ `details` de sa fiche) est recopiée sur le
// contact lié (`lireSyntheses`), à côté de celle qu'Anne a pu écrire, qui n'est jamais écrasée.
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
/** Fiches de contacts Leedflow lues au plus par passage : numéro d'une tâche, nom d'un numéro inconnu. */
const FICHES_PAR_PASSAGE = 30;
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

/**
 * La fiche d'un contact Leedflow (nom, e-mail, numéro, et depuis la story 13.25 sa synthèse IA, champ `details`, avec
 * la date de dernière modification de la fiche), ou null si elle ne se lit pas. L'enveloppe peut être `data` ou
 * `data.data` (essai de JB du 2026-10-24 sur la liste) : on descend jusqu'à l'objet qui porte l'identifiant.
 */
async function ficheLeedflow(env: EnvEspace, id: string): Promise<{ prenom: string; nom: string; email: string; telephone: string | null; synthese: string; modifie: number | null } | null> {
  let f = (await demander(env, `/contacts/${encodeURIComponent(id)}`).catch(() => null)) as Record<string, any> | null;
  for (let i = 0; i < 3 && f && typeof f === 'object' && !('id' in f) && f.data && typeof f.data === 'object' && !Array.isArray(f.data); i++) f = f.data;
  if (!f || typeof f !== 'object') return null;
  const t = (v: unknown, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  return {
    prenom: t(f.firstname), nom: t(f.lastname), email: t(f.email, 254).toLowerCase(), telephone: numero(f.phone),
    synthese: t(f.details, 8000), modifie: typeof f.updated === 'number' ? f.updated : null,
  };
}

/** Écrit (ou complète) un élément d'un numéro inconnu, sans perdre le nom déjà lu sur la fiche Leedflow. */
function inconnu(env: EnvEspace, sourceId: string, tel: string, a: string, texte: string, donnees: Record<string, unknown>) {
  return env.DB.prepare(
    `INSERT INTO leedflow_inconnu (source_id, telephone, a, texte, donnees) VALUES (?1, ?2, ?3, ?4, ?5)
     ON CONFLICT (source_id) DO UPDATE SET texte = excluded.texte, donnees = json_patch(excluded.donnees, json_object(
       'prenom_leedflow', json_extract(leedflow_inconnu.donnees, '$.prenom_leedflow'),
       'nom_leedflow', json_extract(leedflow_inconnu.donnees, '$.nom_leedflow'),
       'email_leedflow', json_extract(leedflow_inconnu.donnees, '$.email_leedflow')))`,
  ).bind(sourceId, tel, a, texte, JSON.stringify(donnees));
}

async function page(env: EnvEspace, genre: Genre, apres: number, n: number) {
  const j = await demander(env, CHEMINS[genre], { created_after: String(apres), per_page: String(PAR_PAGE), page: String(n) });
  return { elements: elements(j), pages: nombreDePages(j) };
}

/** Téléphone → contact suivi (étape renseignée), en une requête : son numéro principal ou un autre de ses numéros
 * (`contact_coordonnee`, story 18.2). Un contact du carnet hors suivi n'est jamais trouvé : ses appels restent des numéros
 * inconnus, pour ne pas ranger les appels privés d'Anne sur ses proches (AD-32, story 18.1). Le numéro principal l'emporte.
 * `suivi_le` : entrée seule dans le suivi d'un contact du carnet ; ce qui est plus ancien reste inconnu (`pourLeContact`). */
type Suivi = { id: string; suivi_le: string | null };
async function contactsParTelephone(env: EnvEspace, tels: string[]): Promise<Map<string, Suivi>> {
  if (!tels.length) return new Map();
  const { results } = await env.DB.prepare(
    `SELECT c.id, c.suivi_le, k.valeur AS telephone, 1 AS rang FROM contact_coordonnee k JOIN contact c ON c.id = k.contact_id
       WHERE k.type = 'telephone' AND c.etape IS NOT NULL AND k.valeur IN (SELECT value FROM json_each(?1))
     UNION ALL
     SELECT id, suivi_le, telephone, 2 FROM contact WHERE etape IS NOT NULL AND telephone IN (SELECT value FROM json_each(?1))
     ORDER BY rang`,
  ).bind(JSON.stringify([...new Set(tels)])).all<Suivi & { telephone: string }>();
  return new Map(results.map((r) => [r.telephone, { id: r.id, suivi_le: r.suivi_le }]));
}
/** Le contact qui reçoit un élément daté `a` (ISO) : aucun si l'élément précède son entrée seule dans le suivi (story 18.2). */
const pourLeContact = (c: Suivi | undefined, a: string): string | undefined => (c && (!c.suivi_le || a >= c.suivi_le) ? c.id : undefined);

async function lotParPaquets(env: EnvEspace, lot: D1PreparedStatement[]) {
  for (let i = 0; i < lot.length; i += 50) await env.DB.batch(lot.slice(i, i + 50));
}

/** Range une page d'appels, de messages vocaux ou de SMS : sur le contact connu, ou en proposition. */
async function rangerEchanges(env: EnvEspace, genre: Exclude<Genre, 'tache'>, els: Element[]): Promise<{ notes: number; inconnus: number }> {
  const avecTel = els.map((e) => ({ e, tel: numero(e.customer) })).filter((x): x is { e: Element; tel: string } => !!x.tel);
  const tels = avecTel.map((x) => x.tel);
  const connus = await contactsParTelephone(env, tels);
  // Privé et Démarchage : plus rien n'est gardé. Un numéro classé Pro garde ses échanges (story 13.19).
  const { results: ecartes } = await env.DB.prepare(`SELECT telephone FROM leedflow_ecarte WHERE categorie <> 'pro' AND telephone IN (SELECT value FROM json_each(?1))`)
    .bind(JSON.stringify(tels)).all<{ telephone: string }>();
  const ecarte = new Set(ecartes.map((r) => r.telephone));
  const limiteInconnus = Date.now() - INCONNUS_JOURS * JOUR_MS;
  const lot: D1PreparedStatement[] = [];
  let notes = 0, inconnus = 0;
  for (const { e, tel } of avecTel) {
    const sourceId = `${genre}:${e.id}`;
    const a = new Date(e.created).toISOString();
    const { texte, donnees } = decrire(genre, e);
    const contact = pourLeContact(connus.get(tel), a);
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
      lot.push(inconnu(env, sourceId, tel, a, texte, donnees));
    }
  }
  await lotParPaquets(env, lot);
  return { notes, inconnus };
}

/** Range une page de tâches Leedflow : proposées sur le contact qui a ce contact Leedflow, s'il est connu ; sinon gardées
 * avec le numéro inconnu (montrées sur « Aujourd'hui », proposées dès que le contact est créé). */
async function rangerTaches(env: EnvEspace, els: Element[], fiches: { reste: number }): Promise<number> {
  const limite = Date.now() - TACHES_JOURS * JOUR_MS;
  const ids = [...new Set(els.map((e) => e.id_contact).filter((x): x is string => !!x))];
  // Seuls les liens vers un contact suivi comptent (AD-32) : un contact repassé au carnet ne reçoit plus de tâche.
  const { results } = await env.DB.prepare(
    `SELECT l.leedflow_contact, l.contact_id FROM leedflow_lien l JOIN contact c ON c.id = l.contact_id AND c.etape IS NOT NULL
     WHERE l.leedflow_contact IN (SELECT value FROM json_each(?1))`,
  ).bind(JSON.stringify(ids)).all<{ leedflow_contact: string; contact_id: string }>();
  const liens = new Map(results.map((r) => [r.leedflow_contact, r.contact_id]));
  // Numéros déjà vus pour ces contacts Leedflow, dans les appels de numéros inconnus.
  const { results: vus } = await env.DB.prepare(
    `SELECT json_extract(donnees, '$.leedflow_contact') AS lc, telephone FROM leedflow_inconnu
     WHERE json_extract(donnees, '$.leedflow_contact') IN (SELECT value FROM json_each(?1))`,
  ).bind(JSON.stringify(ids)).all<{ lc: string; telephone: string }>();
  const numeros = new Map(vus.map((r) => [r.lc, r.telephone]));
  const lot: D1PreparedStatement[] = [];
  let proposees = 0;
  for (const e of els) {
    const aFaire = (e.status ?? '').toLowerCase() === 'todo';
    if (!aFaire) {
      lot.push(env.DB.prepare(`DELETE FROM leedflow_tache WHERE id = ?1 AND statut = 'proposee'`).bind(e.id),
        env.DB.prepare('DELETE FROM leedflow_inconnu WHERE source_id = ?1').bind(`tache:${e.id}`));
      continue;
    }
    if (!e.task?.trim() || !e.id_contact || e.created < limite) continue;
    let contact = liens.get(e.id_contact);
    // Contact Leedflow pas encore vu dans un appel : sa fiche donne son numéro (quelques fiches par passage).
    let tel = numeros.get(e.id_contact) ?? null;
    if (!contact && !tel && fiches.reste > 0) {
      fiches.reste--;
      tel = (await ficheLeedflow(env, e.id_contact))?.telephone ?? null;
      if (tel) numeros.set(e.id_contact, tel);
    }
    if (!contact && tel) {
      contact = pourLeContact((await contactsParTelephone(env, [tel])).get(tel), new Date(e.created).toISOString());
      if (contact) {
        liens.set(e.id_contact, contact);
        lot.push(env.DB.prepare('INSERT OR IGNORE INTO leedflow_lien (leedflow_contact, contact_id) VALUES (?1, ?2)').bind(e.id_contact, contact));
      }
    }
    const quand = typeof e.timestamp === 'number' ? new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date(e.timestamp)) : null;
    if (!contact) {
      // Numéro inconnu de l'espace : la tâche est gardée avec lui (sauf numéro classé Privé ou Démarchage).
      if (tel && !(await env.DB.prepare(`SELECT 1 FROM leedflow_ecarte WHERE telephone = ?1 AND categorie <> 'pro'`).bind(tel).first())) {
        lot.push(inconnu(env, `tache:${e.id}`, tel, new Date(e.created).toISOString(), `Tâche détectée : ${e.task.trim().slice(0, 200)}`,
          { genre: 'tache', tache: e.task.trim().slice(0, 200), echeance: quand, leedflow_contact: e.id_contact }));
      }
      continue;
    }
    proposees++;
    lot.push(env.DB.prepare(
      `INSERT INTO leedflow_tache (id, contact_id, a, texte, echeance) VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT (id) DO UPDATE SET texte = excluded.texte, echeance = excluded.echeance WHERE leedflow_tache.statut = 'proposee'`,
    ).bind(e.id, contact, new Date(e.created).toISOString(), e.task.trim().slice(0, 200), quand));
  }
  await lotParPaquets(env, lot);
  return proposees;
}

/** Les numéros des contacts suivis (principal et autres numéros), avec leur date d'entrée dans le suivi : pour
 * `rattacherInconnus`. */
const NUMEROS_SUIVIS = `numeros AS (
  SELECT id, telephone, suivi_le FROM contact WHERE etape IS NOT NULL AND telephone IS NOT NULL
  UNION
  SELECT c.id, k.valeur, c.suivi_le FROM contact_coordonnee k JOIN contact c ON c.id = k.contact_id WHERE k.type = 'telephone' AND c.etape IS NOT NULL
)`;
/** Un élément gardé passe au contact s'il date de son entrée dans le suivi ou après (story 18.2) ; `suivi_le` NULL =
 * contact créé dans le suivi ou entré par décision d'Anne : tout l'historique du numéro est repris. */
const REPRIS = '(n.suivi_le IS NULL OR i.a >= n.suivi_le)';

/** Les éléments venus d'un numéro inconnu qui est désormais celui d'un contact suivi passent dans son historique.
 * Un contact hors suivi (étape NULL) ne les reçoit jamais tout seul (AD-32, story 18.1) ; un contact entré seul dans
 * le suivi (demande du site, `suivi_le` posé) ne reçoit pas ses échanges d'avant, qui peuvent être des appels privés. */
export async function rattacherInconnus(env: EnvEspace): Promise<void> {
  await env.DB.batch([
    env.DB.prepare(
      `WITH ${NUMEROS_SUIVIS}
       INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees)
       SELECT n.id, i.a, 'appel', 'leedflow', i.source_id, i.texte, i.donnees FROM leedflow_inconnu i JOIN numeros n ON n.telephone = i.telephone
       WHERE i.source_id NOT LIKE 'tache:%' AND ${REPRIS} ON CONFLICT (source, source_id) WHERE source_id IS NOT NULL DO NOTHING`,
    ),
    // Les tâches gardées avec le numéro deviennent des propositions sur le contact.
    env.DB.prepare(
      `WITH ${NUMEROS_SUIVIS}
       INSERT INTO leedflow_tache (id, contact_id, a, texte, echeance)
       SELECT substr(i.source_id, 7), n.id, i.a, json_extract(i.donnees, '$.tache'), json_extract(i.donnees, '$.echeance')
       FROM leedflow_inconnu i JOIN numeros n ON n.telephone = i.telephone
       WHERE i.source_id LIKE 'tache:%' AND json_extract(i.donnees, '$.tache') IS NOT NULL AND ${REPRIS} ON CONFLICT (id) DO NOTHING`,
    ),
    env.DB.prepare(
      `WITH ${NUMEROS_SUIVIS}
       INSERT OR IGNORE INTO leedflow_lien (leedflow_contact, contact_id)
       SELECT json_extract(i.donnees, '$.leedflow_contact'), n.id FROM leedflow_inconnu i JOIN numeros n ON n.telephone = i.telephone
       WHERE json_extract(i.donnees, '$.leedflow_contact') IS NOT NULL AND ${REPRIS}`,
    ),
    // Seul ce qui vient d'être rattaché quitte la liste des inconnus (le reste part avec la purge des 90 jours).
    env.DB.prepare(
      `WITH ${NUMEROS_SUIVIS}
       DELETE FROM leedflow_inconnu WHERE source_id IN (
         SELECT i.source_id FROM leedflow_inconnu i JOIN numeros n ON n.telephone = i.telephone WHERE ${REPRIS})`,
    ),
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
  const bilan = { notes: 0, inconnus: 0, taches: 0, pages: 0, noms: 0, syntheses: 0 };
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
  bilan.noms = await nommerInconnus(env, fiches);
  await rattacherInconnus(env);
  // Tant que la migration 0012 n'est pas appliquée (quelques minutes lors d'une mise en ligne), la relève continue sans synthèse.
  bilan.syntheses = await lireSyntheses(env, fiches).catch((e) => { journal('leedflow_erreur', { genre: 'synthese', detail: String(e).slice(0, 200) }); return 0; });
  journal('leedflow_releve', bilan);
}

/** Le nom et l'e-mail d'un numéro inconnu, lus sur la fiche de son contact Leedflow (quelques fiches par passage). */
async function nommerInconnus(env: EnvEspace, fiches: { reste: number }): Promise<number> {
  if (fiches.reste <= 0) return 0;
  const { results } = await env.DB.prepare(
    `SELECT DISTINCT json_extract(donnees, '$.leedflow_contact') AS lc FROM leedflow_inconnu
     WHERE json_extract(donnees, '$.leedflow_contact') IS NOT NULL AND json_extract(donnees, '$.nom_leedflow') IS NULL LIMIT ?1`,
  ).bind(fiches.reste).all<{ lc: string }>();
  let n = 0;
  for (const { lc } of results) {
    fiches.reste--;
    const f = await ficheLeedflow(env, lc);
    if (!f) continue; // fiche illisible : on réessaiera au prochain passage
    // Une fiche sans nom est notée '' pour ne pas la relire à chaque passage.
    await env.DB.prepare(
      `UPDATE leedflow_inconnu SET donnees = json_set(donnees, '$.prenom_leedflow', ?2, '$.nom_leedflow', ?3, '$.email_leedflow', ?4)
       WHERE json_extract(donnees, '$.leedflow_contact') = ?1`,
    ).bind(lc, f.prenom, f.nom, f.email).run();
    n++;
  }
  return n;
}

/** Relire une synthèse au plus une fois par jour, et à chaque passage pendant l'heure qui suit un nouvel échange. */
const SYNTHESE_RELUE_H = 24;

/**
 * La synthèse IA des contacts liés à Leedflow (story 13.25), lue sur leur fiche Leedflow : d'abord ceux qui ne l'ont
 * jamais été, puis ceux qui viennent d'avoir un échange (Leedflow réécrit sa synthèse après l'appel), puis le tour
 * quotidien. Dans la limite des fiches lisibles par passage. La version d'Anne n'est jamais touchée ici.
 */
async function lireSyntheses(env: EnvEspace, fiches: { reste: number }): Promise<number> {
  if (fiches.reste <= 0) return 0;
  const maintenant = new Date().toISOString();
  const veille = new Date(Date.now() - SYNTHESE_RELUE_H * 3_600_000).toISOString();
  const { results } = await env.DB.prepare(
    `SELECT c.id, min(l.leedflow_contact) AS lc FROM contact c JOIN leedflow_lien l ON l.contact_id = c.id AND c.etape IS NOT NULL
     WHERE c.synthese_lue_le IS NULL OR c.synthese_lue_le < ?1
        OR c.synthese_lue_le < strftime('%Y-%m-%dT%H:%M:%fZ', (SELECT max(e.a) FROM contact_evenement e WHERE e.contact_id = c.id AND e.source = 'leedflow'), '+1 hour')
     GROUP BY c.id ORDER BY c.synthese_lue_le IS NOT NULL, c.synthese_lue_le LIMIT ?2`,
  ).bind(veille, fiches.reste).all<{ id: string; lc: string }>();
  let n = 0;
  for (const { id, lc } of results) {
    fiches.reste--;
    const f = await ficheLeedflow(env, lc);
    if (!f) continue; // fiche illisible : on réessaiera au prochain passage
    const le = f.modifie ? new Date(f.modifie).toISOString() : maintenant;
    await env.DB.prepare(
      `UPDATE contact SET synthese_lue_le = ?2,
         synthese_leedflow_le = CASE WHEN synthese_leedflow IS NOT ?3 THEN ?4 ELSE synthese_leedflow_le END,
         synthese_leedflow = ?3 WHERE id = ?1`,
    ).bind(id, maintenant, f.synthese || null, le).run();
    n++;
  }
  return n;
}

// ——— Ce que l'espace affiche et ce qu'Anne décide ———

export interface EtatReleve { branche: boolean; passe_le: string | null; erreur: string | null }

export async function etatReleve(env: EnvEspace): Promise<EtatReleve> {
  const r = await env.DB.prepare('SELECT max(passe_le) AS passe_le, max(erreur) AS erreur FROM leedflow_releve').first<{ passe_le: string | null; erreur: string | null }>();
  return { branche: !!env.LEEDFLOW_API_KEY, passe_le: r?.passe_le ?? null, erreur: r?.erreur ?? null };
}

/** Catégories d'un numéro inconnu (story 13.19). Sans catégorie, le numéro est « à trier ». */
export const CATEGORIES = { prive: 'Privé', pro: 'Pro', demarchage: 'Démarchage' } as const;
export type Categorie = keyof typeof CATEGORIES;
export const estCategorie = (v: string): v is Categorie => v in CATEGORIES;
export const FILTRES = { a_trier: 'À trier', pro: 'Pros', prive: 'Privés', demarchage: 'Démarchage', tous: 'Tous' } as const;
export type Filtre = keyof typeof FILTRES;

export interface EchangeInconnu { a: string; titre: string; resume: string; tache: boolean; echeance: string | null; manque: boolean }
export interface NumeroInconnu {
  telephone: string; prenom: string; nom: string; email: string; dernier: string; echanges: EchangeInconnu[]; taches: EchangeInconnu[];
  categorie: Categorie | null;
  /** Seulement des appels manqués (ou passés sans réponse), sans message ni tâche : masqué par défaut sur « À trier ». */
  silencieux: boolean;
}
export interface TacheProposee { id: string; texte: string; echeance: string | null; a: string; contact_id: string; prenom: string | null; nom: string | null; telephone: string | null }

const champsTache = 't.id, t.texte, t.echeance, t.a, c.id AS contact_id, c.prenom, c.nom, c.telephone';
const tachesOuvertes = `FROM leedflow_tache t JOIN contact c ON c.id = t.contact_id WHERE t.statut = 'proposee' AND c.etape NOT IN ('perdu', 'vendu', 'acte_signe')`;

type LigneInconnu = { source_id: string; telephone: string; a: string; texte: string | null; donnees: string | null };

/** Regroupe les lignes gardées par numéro, le plus récent d'abord : nom lu sur la fiche Leedflow, échanges, tâches. */
function grouper(lignes: LigneInconnu[], categories: Map<string, Categorie> = new Map()): NumeroInconnu[] {
  const parNumero = new Map<string, NumeroInconnu>();
  for (const l of lignes) {
    let d: Record<string, any> = {};
    try { d = l.donnees ? JSON.parse(l.donnees) : {}; } catch {}
    let n = parNumero.get(l.telephone);
    if (!n) {
      n = { telephone: l.telephone, prenom: '', nom: '', email: '', dernier: l.a, echanges: [], taches: [], categorie: categories.get(l.telephone) ?? null, silencieux: false };
      parNumero.set(l.telephone, n);
    }
    n.prenom ||= d.prenom_leedflow ?? ''; n.nom ||= d.nom_leedflow ?? ''; n.email ||= d.email_leedflow ?? '';
    const tache = l.source_id.startsWith('tache:');
    const [titre, ...reste] = (l.texte ?? '').split('\n');
    (tache ? n.taches : n.echanges).push({ a: l.a, titre: tache ? (d.tache ?? titre) : titre, resume: reste.join('\n').trim(), tache, echeance: d.echeance ?? null, manque: d.manque === true });
  }
  for (const n of parNumero.values()) n.silencieux = n.taches.length === 0 && n.echanges.length > 0 && n.echanges.every((e) => e.manque);
  return [...parNumero.values()];
}

/** Un numéro classé dont on ne garde aucun échange (Privé, Démarchage, ou Pro silencieux depuis). */
const sansEchange = (r: { telephone: string; a: string; categorie: Categorie }): NumeroInconnu =>
  ({ telephone: r.telephone, prenom: '', nom: '', email: '', dernier: r.a, echanges: [], taches: [], categorie: r.categorie, silencieux: false });

/** Les numéros vus par Leedflow pour la page « À trier », selon le filtre choisi. */
export async function numerosLeedflow(env: EnvEspace, filtre: Filtre): Promise<NumeroInconnu[]> {
  const [lignes, classes] = await env.DB.batch([
    env.DB.prepare(`SELECT source_id, telephone, a, texte, donnees FROM leedflow_inconnu
      WHERE ${filtre === 'a_trier' ? 'telephone NOT IN (SELECT telephone FROM leedflow_ecarte)' : filtre === 'pro' ? `telephone IN (SELECT telephone FROM leedflow_ecarte WHERE categorie = 'pro')` : filtre === 'tous' ? '1' : '0'}
      ORDER BY a DESC LIMIT 600`),
    env.DB.prepare(`SELECT telephone, a, categorie FROM leedflow_ecarte WHERE ?1 = 'tous' OR categorie = ?1 ORDER BY a DESC LIMIT 300`).bind(filtre),
  ]);
  const categories = new Map((classes.results as { telephone: string; categorie: Categorie }[]).map((r) => [r.telephone, r.categorie]));
  const numeros = grouper(lignes.results as LigneInconnu[], categories);
  const vus = new Set(numeros.map((n) => n.telephone));
  for (const r of classes.results as { telephone: string; a: string; categorie: Categorie }[]) if (!vus.has(r.telephone)) numeros.push(sansEchange(r));
  return numeros.sort((a, b) => (a.dernier < b.dernier ? 1 : -1)).slice(0, 200);
}

/** Combien de numéros attendent d'être triés (et combien de ceux-là ne sont que des appels manqués sans message). */
export async function aTrier(env: EnvEspace): Promise<{ total: number; silencieux: number }> {
  const n = await numerosLeedflow(env, 'a_trier');
  return { total: n.length, silencieux: n.filter((x) => x.silencieux).length };
}

/** Le nombre de numéros derrière chaque filtre de « À trier ». */
export async function comptesLeedflow(env: EnvEspace, aTrierTotal: number): Promise<Record<Filtre, number>> {
  const { results } = await env.DB.prepare('SELECT categorie, count(*) AS n FROM leedflow_ecarte GROUP BY categorie').all<{ categorie: Categorie; n: number }>();
  const c: Record<Filtre, number> = { a_trier: aTrierTotal, pro: 0, prive: 0, demarchage: 0, tous: aTrierTotal };
  for (const r of results) { c[r.categorie] = r.n; c.tous += r.n; }
  return c;
}

/** Pour « Aujourd'hui » : les tâches proposées par Leedflow sur des contacts connus, et le compte des numéros à trier. */
export async function propositions(env: EnvEspace): Promise<{ taches: TacheProposee[]; aTrier: { total: number; silencieux: number } }> {
  const [taches, compte] = await Promise.all([
    env.DB.prepare(`SELECT ${champsTache} ${tachesOuvertes} ORDER BY t.a DESC LIMIT 20`).all<TacheProposee>(),
    aTrier(env),
  ]);
  return { taches: taches.results, aTrier: compte };
}

/** Un numéro vu par Leedflow en détail (page /inconnu) : sa catégorie, le nom lu dans Leedflow, chaque échange avec son
 * résumé complet, les tâches. null si l'espace n'en sait plus rien (contact créé, ou effacé). */
export async function numeroInconnu(env: EnvEspace, telephone: string): Promise<NumeroInconnu | null> {
  const tel = numero(telephone);
  if (!tel) return null;
  const [lignes, classe] = await env.DB.batch([
    env.DB.prepare('SELECT source_id, telephone, a, texte, donnees FROM leedflow_inconnu WHERE telephone = ?1 ORDER BY a DESC LIMIT 200').bind(tel),
    env.DB.prepare('SELECT telephone, a, categorie FROM leedflow_ecarte WHERE telephone = ?1').bind(tel),
  ]);
  const c = classe.results[0] as { telephone: string; a: string; categorie: Categorie } | undefined;
  const [n] = grouper(lignes.results as LigneInconnu[], new Map(c ? [[tel, c.categorie]] : []));
  return n ?? (c ? sansEchange(c) : null);
}

/** L'adresse de « Ajouter » préremplie avec ce que Leedflow sait d'un numéro inconnu. */
export function lienCreer(n: Pick<NumeroInconnu, 'telephone' | 'prenom' | 'nom' | 'email'>): string {
  const q = new URLSearchParams({ telephone: n.telephone });
  if (n.prenom) q.set('prenom', n.prenom);
  if (n.nom) q.set('nom', n.nom);
  if (n.email) q.set('email', n.email);
  return `/ajouter?${q}`;
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

/** Range un numéro dans une catégorie, ou le remet à trier (categorie null). Privé et Démarchage effacent ce que l'espace
 * gardait de ses échanges ; un Pro les garde. */
export async function classerNumero(env: EnvEspace, telephone: string, categorie: Categorie | null, par: string): Promise<boolean> {
  const tel = numero(telephone);
  if (!tel) return false;
  if (!categorie) {
    await env.DB.prepare('DELETE FROM leedflow_ecarte WHERE telephone = ?1').bind(tel).run();
    return true;
  }
  const lot = [env.DB.prepare(
    `INSERT INTO leedflow_ecarte (telephone, a, par, categorie) VALUES (?1, ?2, ?3, ?4)
     ON CONFLICT (telephone) DO UPDATE SET a = excluded.a, par = excluded.par, categorie = excluded.categorie`,
  ).bind(tel, new Date().toISOString(), par, categorie)];
  if (categorie !== 'pro') lot.push(env.DB.prepare('DELETE FROM leedflow_inconnu WHERE telephone = ?1').bind(tel));
  await env.DB.batch(lot);
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
