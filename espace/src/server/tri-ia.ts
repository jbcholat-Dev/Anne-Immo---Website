// Tri des appels par l'API Claude (story 18.25, fiche de poste du chief of staff § 4 et § 7, AD-37).
// À chaque relève Leedflow (worker.ts, toutes les 10 minutes), chaque carte « Nouveaux » d'un numéro inconnu reçoit une
// proposition : classement, action datée, raison en une phrase, et les réponses de « Qualifier » que les résumés donnent.
// Règles (non négociables, fiche légale des contacts et RUNBOOK § 4 sexies) :
// - Rien ne change sur une fiche ni sur une carte : la proposition est seulement affichée. Anne décide d'un geste (AD-20).
// - Envoyé à l'API : le genre, la date et le résumé de chaque échange. Jamais le numéro, ni le nom ou l'e-mail que Leedflow
//   connaît (retirés du texte), ni la transcription complète ou l'enregistrement (que l'espace ne garde pas).
// - Exclus par le code : les numéros classés (privé, pro, démarchage), les numéros d'un contact du carnet (les proches,
//   AD-32), les cartes rangées par les règles de la story 18.24 et les numéros sans aucun résumé.
// - Panne, crédit coupé, réponse refusée ou hors format : la carte reste non triée, rien n'est bloqué. Un même texte n'est
//   pas renvoyé plus de 3 fois.
// - Éteint tant que le réglage TRI_IA ne vaut pas « oui » (wrangler.jsonc) : il ne passe à « oui » qu'avec l'accord de JB,
//   une fois les points « Chez Anthropic » de la fiche légale vérifiés.
// Jamais appelé par les routes /api/claude/… : le programme de Claude ne lit pas ces propositions.
import Anthropic from '@anthropic-ai/sdk';
import { journal } from '@site/server/journal';
import type { EnvEspace } from './env';
import { resumesInconnus, type NumeroInconnu } from './leedflow';
import { raisonDeRanger } from './nouveaux';
import { aujourdhui, plusTard, QUESTIONS, type Reponses } from './pipeline';
import { CONSIGNES_TRI, QUESTIONS_TRI } from './tri-ia-consignes';

/** Le modèle : le meilleur adapté au tri, dans le crédit mensuel (décision de JB du 2026-11-24, AD-37). */
export const MODELE_TRI = 'claude-opus-5-5';
/** Numéros triés au plus par passage : la reprise des cartes déjà en attente se fait en quelques passages. */
const PAR_PASSAGE = 10;
const ESSAIS_MAX = 3;
/** Échanges envoyés au plus par numéro (les plus récents), et longueur gardée de chaque résumé. */
const ECHANGES_MAX = 6;
const RESUME_MAX = 1500;
/** Une proposition est gardée 30 jours, puis effacée (même durée que les numéros inconnus proposés). */
const GARDE_JOURS = 30;

export const CLASSEMENTS = {
  vendeur: 'Vendeur', acheteur: 'Acheteur', partenaire: 'Partenaire', prive: 'Privé', demarchage: 'Démarchage', sans_suite: 'Sans suite',
} as const;
export type Classement = keyof typeof CLASSEMENTS;
const estClassement = (v: unknown): v is Classement => typeof v === 'string' && v in CLASSEMENTS;

export interface Proposition {
  classement: Classement;
  action: string;
  echeance: string | null;
  raison: string;
  parcours: 'vendeur' | 'acheteur' | null;
  qualification: Reponses;
}

/** Le réglage public TRI_IA (wrangler.jsonc) : lu en texte, sa valeur par défaut étant vide. */
const allume = (env: EnvEspace) => String(env.TRI_IA ?? '') === 'oui';
export const actif = (env: EnvEspace) => allume(env) && !!env.ANTHROPIC_API_KEY;

const nul = { type: 'null' };
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['classement', 'action', 'echeance', 'raison', 'parcours', 'qualification'],
  properties: {
    classement: { type: 'string', enum: Object.keys(CLASSEMENTS) },
    action: { type: 'string' },
    echeance: { anyOf: [{ type: 'string', format: 'date' }, nul] },
    raison: { type: 'string' },
    parcours: { anyOf: [{ type: 'string', enum: ['vendeur', 'acheteur'] }, nul] },
    qualification: {
      type: 'object', additionalProperties: false, required: QUESTIONS_TRI.map((q) => q.id),
      properties: Object.fromEntries(QUESTIONS_TRI.map((q) => [q.id, { anyOf: [{ type: 'string', enum: q.options }, nul] }])),
    },
  },
};

const texteCourt = (v: unknown, max: number) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '');

/** Contrôle la réponse de l'API : tout champ hors des valeurs permises rejette la proposition entière (renvoie null). */
export function valider(brut: unknown, jour = aujourdhui()): Proposition | null {
  const o = brut as Record<string, unknown> | null;
  if (!o || typeof o !== 'object' || !estClassement(o.classement)) return null;
  const action = texteCourt(o.action, 160), raison = texteCourt(o.raison, 240);
  if (!action || !raison) return null;
  let echeance: string | null = null;
  if (o.echeance !== null && o.echeance !== undefined) {
    if (typeof o.echeance !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.echeance)) return null;
    // Une date passée devient aujourd'hui ; au-delà de 60 jours, la proposition n'a pas de sens.
    echeance = o.echeance < jour ? jour : o.echeance;
    if (echeance > plusTard(60)) return null;
  }
  const parcours = o.parcours === 'vendeur' || o.parcours === 'acheteur' ? o.parcours : null;
  const qualification: Reponses = {};
  const q = (o.qualification ?? {}) as Record<string, unknown>;
  for (const question of QUESTIONS) {
    const v = q[question.id];
    if (typeof v === 'string' && (question.options as readonly string[]).includes(v)) qualification[question.id] = v;
  }
  return { classement: o.classement, action, echeance, raison, parcours, qualification };
}

/** Retire du texte les noms et l'e-mail connus de Leedflow, puis tout ce qui ressemble à un téléphone ou à un e-mail. */
export function masquer(texte: string, n: Pick<NumeroInconnu, 'prenom' | 'nom' | 'email'>): string {
  const motif = (m: string) => new RegExp(`(?<![\\p{L}\\p{N}])${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'giu');
  let t = n.email ? texte.replace(motif(n.email), '[e-mail]') : texte;
  for (const mot of [n.prenom, n.nom].filter((m) => m && m.length >= 2)) t = t.replace(motif(mot), '[nom]');
  return t
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[e-mail]')
    .replace(/(\+|00)?\d[\d .-]{7,}\d/g, '[téléphone]');
}

const GENRES: Record<string, string> = { SMS: 'SMS', Message: 'Message vocal', Appel: 'Appel' };
const genreDe = (titre: string, tache: boolean) => (tache ? 'Tâche détectée' : GENRES[titre.split(' ')[0]] ?? 'Appel');

/** Le texte envoyé pour un numéro : rien qui l'identifie, seulement le genre, la date, le titre et le résumé masqué. */
export function texteEnvoye(n: NumeroInconnu, jour = aujourdhui()): string | null {
  const echanges = [...n.echanges, ...n.taches].sort((a, b) => (a.a < b.a ? 1 : -1)).slice(0, ECHANGES_MAX);
  if (!echanges.some((e) => e.resume.trim() || e.tache)) return null;
  const lignes = echanges.reverse().map((e) => {
    const resume = masquer((e.resume || '').slice(0, RESUME_MAX), n).trim();
    return `- ${e.a.slice(0, 10)} · ${genreDe(e.titre, e.tache)} · ${masquer(e.titre, n)}${e.echeance ? ` · échéance ${e.echeance.slice(0, 10)}` : ''}\n  ${resume || '(pas de résumé)'}`;
  });
  return `Aujourd'hui : ${jour}.\nÉchanges avec ce numéro, du plus ancien au plus récent :\n${lignes.join('\n')}`;
}

async function empreinteDe(texte: string): Promise<string> {
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${MODELE_TRI}\n${CONSIGNES_TRI}\n${texte}`));
  return [...new Uint8Array(h)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Demande la proposition à l'API. Renvoie null (avec la raison) si la réponse ne sert pas. */
async function demander(env: EnvEspace, texte: string): Promise<{ p: Proposition | null; erreur: string | null }> {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, baseURL: env.ANTHROPIC_URL || undefined, maxRetries: 1, timeout: 60_000 });
  const r = await client.beta.messages.create({
    model: MODELE_TRI,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    // Si le modèle décline, l'API reprend la même demande sur un autre modèle (choisi par l'API selon le motif).
    fallbacks: 'default',
    output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
    system: CONSIGNES_TRI,
    messages: [{ role: 'user', content: texte }],
  });
  if (r.stop_reason === 'refusal') return { p: null, erreur: 'refus' };
  if (r.stop_reason === 'max_tokens') return { p: null, erreur: 'trop_long' };
  const bloc = r.content.find((b) => b.type === 'text');
  if (!bloc || bloc.type !== 'text') return { p: null, erreur: 'vide' };
  let brut: unknown;
  try { brut = JSON.parse(bloc.text); } catch { return { p: null, erreur: 'json' }; }
  const p = valider(brut);
  return p ? { p, erreur: null } : { p: null, erreur: 'format' };
}

/** Les numéros des cartes ouvertes : ni classés, ni portés par un contact du carnet. Le texte de chacun dit ensuite s'il est à
 * (re)trier : une proposition déjà faite sur le même texte n'est pas redemandée. */
async function aTrier(env: EnvEspace): Promise<string[]> {
  const { results } = await env.DB.prepare(
    `SELECT DISTINCT i.telephone FROM nouveau n JOIN leedflow_inconnu i ON i.source_id = n.leedflow_inconnu_id
     WHERE n.source = 'leedflow' AND n.vu_le IS NULL
       AND i.telephone NOT IN (SELECT telephone FROM leedflow_ecarte)
       AND i.telephone NOT IN (SELECT telephone FROM contact WHERE telephone IS NOT NULL)
       AND i.telephone NOT IN (SELECT valeur FROM contact_coordonnee WHERE type = 'telephone')
     ORDER BY n.recu_le DESC LIMIT 300`,
  ).all<{ telephone: string }>();
  return results.map((r) => r.telephone);
}

/** Un passage du tri : appelé après chaque relève Leedflow. Ne lève jamais d'erreur vers la relève. */
export async function trierNouveaux(env: EnvEspace): Promise<void> {
  if (!actif(env)) return;
  const tels = await aTrier(env);
  if (!tels.length) return;
  const numeros = await resumesInconnus(env, tels);
  const { results: deja } = await env.DB.prepare(`SELECT telephone, empreinte, essais, erreur FROM tri_ia WHERE telephone IN (SELECT value FROM json_each(?1))`)
    .bind(JSON.stringify(tels)).all<{ telephone: string; empreinte: string; essais: number; erreur: string | null }>();
  const avant = new Map(deja.map((d) => [d.telephone, d]));
  const bilan = { tries: 0, echecs: 0, sans_resume: 0 };
  for (const tel of tels) {
    if (bilan.tries + bilan.echecs >= PAR_PASSAGE) break;
    const n = numeros.get(tel);
    // Une carte rangée par les règles de la story 18.24 (appel manqué sans message, trop court, vide) n'est pas envoyée.
    const texte = n && !raisonDeRanger(n, false) ? texteEnvoye(n) : null;
    if (!texte) { bilan.sans_resume++; continue; }
    const empreinte = await empreinteDe(texte.replace(/^Aujourd'hui : .*\n/, ''));
    const d = avant.get(tel);
    // Même texte déjà trié (rien de neuf depuis), ou déjà en échec trop de fois : on n'envoie pas.
    if (d && d.empreinte === empreinte && (!d.erreur || d.essais >= ESSAIS_MAX)) continue;
    const precedents = d && d.empreinte === empreinte ? d.essais : 0;
    let res: { p: Proposition | null; erreur: string | null };
    try { res = await demander(env, texte); }
    catch (e) {
      res = { p: null, erreur: e instanceof Anthropic.APIError ? `api_${e.status ?? 'reseau'}` : 'reseau' };
    }
    const maintenant = new Date().toISOString();
    const p = res.p;
    // Une panne (réseau, surcharge, limite de débit, erreur du service) ne compte pas comme un essai : le texte sera renvoyé
    // quand l'API répondra. Une réponse inutilisable (refus, hors format) ou une demande refusée (4xx) compte.
    const panne = res.erreur === 'reseau' || res.erreur === 'api_reseau' || res.erreur === 'api_429' || /^api_5\d\d$/.test(res.erreur ?? '');
    const essais = panne ? Math.max(precedents, 0) : precedents + 1;
    await env.DB.prepare(
      `INSERT INTO tri_ia (telephone, empreinte, classement, action, echeance, raison, parcours, qualification, modele, trie_le, essais, erreur)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
       ON CONFLICT (telephone) DO UPDATE SET empreinte = excluded.empreinte, essais = excluded.essais, erreur = excluded.erreur, trie_le = excluded.trie_le,
         classement = coalesce(excluded.classement, tri_ia.classement), action = coalesce(excluded.action, tri_ia.action),
         echeance = CASE WHEN excluded.classement IS NULL THEN tri_ia.echeance ELSE excluded.echeance END,
         raison = coalesce(excluded.raison, tri_ia.raison),
         parcours = CASE WHEN excluded.classement IS NULL THEN tri_ia.parcours ELSE excluded.parcours END,
         qualification = coalesce(excluded.qualification, tri_ia.qualification), modele = excluded.modele`,
    ).bind(tel, empreinte, p?.classement ?? null, p?.action ?? null, p?.echeance ?? null, p?.raison ?? null, p?.parcours ?? null,
      p ? JSON.stringify(p.qualification) : null, MODELE_TRI, maintenant, essais, res.erreur).run();
    if (p) bilan.tries++; else bilan.echecs++;
    // Une panne de l'API ou un crédit coupé : inutile d'insister pendant ce passage.
    if (panne) { journal('tri_ia_panne', { detail: res.erreur }); break; }
  }
  // Seulement des nombres dans le journal : jamais un texte ni un numéro.
  if (bilan.tries || bilan.echecs) journal('tri_ia', bilan);
}

/** Les propositions affichées sur les cartes, par numéro (sans les essais en échec). */
export async function propositionsDe(env: EnvEspace, tels: string[]): Promise<Map<string, Proposition & { trie_le: string }>> {
  if (!tels.length || !allume(env)) return new Map();
  const { results } = await env.DB.prepare(
    `SELECT telephone, classement, action, echeance, raison, parcours, qualification, trie_le FROM tri_ia
     WHERE classement IS NOT NULL AND telephone IN (SELECT value FROM json_each(?1))`,
  ).bind(JSON.stringify([...new Set(tels)])).all<{ telephone: string; classement: Classement; action: string; echeance: string | null; raison: string; parcours: 'vendeur' | 'acheteur' | null; qualification: string | null; trie_le: string }>();
  return new Map(results.map((r) => {
    let qualification: Reponses = {};
    try { qualification = r.qualification ? JSON.parse(r.qualification) : {}; } catch {}
    return [r.telephone, { classement: r.classement, action: r.action, echeance: r.echeance, raison: r.raison, parcours: r.parcours, qualification, trie_le: r.trie_le }];
  }));
}

/** Ménage : une proposition de plus de 30 jours dont le numéro n'a plus de carte ouverte est effacée. */
export async function menageTri(env: EnvEspace): Promise<void> {
  const limite = new Date(Date.now() - GARDE_JOURS * 86_400_000).toISOString();
  await env.DB.prepare(
    `DELETE FROM tri_ia WHERE trie_le < ?1 AND telephone NOT IN (
       SELECT i.telephone FROM nouveau n JOIN leedflow_inconnu i ON i.source_id = n.leedflow_inconnu_id WHERE n.vu_le IS NULL)`,
  ).bind(limite).run();
}
