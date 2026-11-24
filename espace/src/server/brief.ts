// Brief du jour (story 18.26, fiche de poste du chief of staff § 4 et § 6, AD-37) : 3 à 5 décisions, 7 au plus, en tête de
// la page Contacts, chacune avec Accepter, Plus tard, Écarter. La part acceptée est comptée.
// Le brief est calculé par des règles, à partir de ce que l'espace sait déjà ; il n'envoie rien à l'API Claude. Il lit :
// - les cartes « Nouveaux » des demandes du site et des portails, pas encore vues ;
// - les cartes des numéros inconnus que le tri par l'API (story 18.25) classe vendeur, acheteur ou partenaire ;
// - les contacts suivis dont la prochaine action est due aujourd'hui ou en retard.
// Il ne lit jamais les proches (contacts du carnet hors suivi) ni les numéros classés.
// Rien ne change sur une fiche : « Accepter » note la décision et ouvre la fiche ou la carte ; le geste reste à faire par
// Anne (AD-20). « Plus tard » : la ligne revient au brief du lendemain si elle est toujours due. « Écarter » : plus proposée
// pendant 7 jours. Une décision s'annule tant que le jour n'est pas fini.
// Phase 1 : visible seulement des comptes listés dans le réglage BRIEF_LECTEURS (JB). L'e-mail du matin (phase 2) n'existe
// pas encore. Préparé chaque jour à 7 h 30 (heure de Paris) par la tâche planifiée, ou à la demande.
import type { EnvSite } from '@site/server/env';
import { ulid } from '@site/server/ulid';
import { telLisible } from '@site/server/recherche';
import type { EnvEspace } from './env';
import { aujourdhui, echeance } from './pipeline';
import { CLASSEMENTS, propositionsDe, type Classement } from './tri-ia';

export const BRIEF_CIBLE = 5;
export const BRIEF_MAX = 7;
const ECARTE_JOURS = 7;
const GARDE_JOURS = 90;
export const DECISIONS = { accepte: 'Acceptée', plus_tard: 'Plus tard', ecarte: 'Écartée' } as const;
export type Decision = keyof typeof DECISIONS;
export const estDecision = (v: unknown): v is Decision => typeof v === 'string' && v in DECISIONS;

export interface LigneBrief {
  id: string; rang: number; genre: 'demande' | 'appel' | 'relance'; qui: string; raison: string; action: string; lien: string;
  decision: Decision | null; decide_le: string | null;
}
export interface Brief { jour: string; lignes: LigneBrief[]; prepare: boolean; part: { acceptees: number; decidees: number; proposees: number } }

/**
 * Le brief n'est montré qu'aux comptes dont l'empreinte SHA-256 de l'adresse (en minuscules, en hexadécimal) figure dans
 * BRIEF_LECTEURS (séparées par des virgules). Une empreinte plutôt que l'adresse : le dépôt est public.
 */
export async function peutVoir(env: EnvEspace, compte: string | null): Promise<boolean> {
  if (!compte) return false;
  const lecteurs = String(env.BRIEF_LECTEURS ?? '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (!lecteurs.length) return false;
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(compte.trim().toLowerCase()));
  return lecteurs.includes([...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join(''));
}

/** « Martine D. » : le prénom et l'initiale du nom ; sinon le nom seul, sinon le numéro. */
export function quiDe(prenom: string | null | undefined, nom: string | null | undefined, tel?: string | null): string {
  const p = (prenom ?? '').trim(), n = (nom ?? '').trim();
  if (p) return n ? `${p} ${n[0].toUpperCase()}.` : p;
  return n || (tel ? telLisible(tel) : 'Sans nom');
}

/** L'heure de Paris, « HH:MM ». */
const heureParis = (d = new Date()) => new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);

interface Candidat { cle: string; genre: LigneBrief['genre']; qui: string; raison: string; action: string; lien: string; urgence: number; date: string }

const ORDRE: Record<Classement, number> = { vendeur: 0, acheteur: 1, partenaire: 3, prive: 9, demarchage: 9, sans_suite: 9 };

/** Les décisions possibles ce jour, de la plus urgente à la moins urgente. */
async function candidats(envE: EnvEspace, jour: string): Promise<Candidat[]> {
  const env = envE as unknown as EnvSite;
  const [demandes, inconnus, relances] = await env.DB.batch([
    // Demandes du site et des portails non vues, avec un contact (celles « à lire à la main » restent dans « Nouveaux »).
    env.DB.prepare(`SELECT n.id, n.source, n.recu_le, c.prenom, c.nom, c.telephone, c.email, c.id AS contact_id, l.source AS genre_site
      FROM nouveau n JOIN contact c ON c.id = n.contact_id
        LEFT JOIN contact_evenement e ON e.id = n.evenement_id LEFT JOIN lead l ON e.source = 'site' AND l.id = e.source_id
      WHERE n.vu_le IS NULL AND n.source IN ('site', 'portail') AND c.ecarte_le IS NULL ORDER BY n.recu_le LIMIT 20`),
    // Cartes des numéros inconnus encore ouvertes (le tri dit lesquelles comptent).
    env.DB.prepare(`SELECT n.id, n.recu_le, i.telephone FROM nouveau n JOIN leedflow_inconnu i ON i.source_id = n.leedflow_inconnu_id
      WHERE n.vu_le IS NULL AND n.source = 'leedflow' AND i.telephone NOT IN (SELECT telephone FROM leedflow_ecarte)
        AND i.telephone NOT IN (SELECT telephone FROM contact WHERE telephone IS NOT NULL)
      GROUP BY i.telephone ORDER BY n.recu_le DESC LIMIT 200`),
    // Contacts suivis dont la prochaine action est due (aujourd'hui ou en retard), la plus ancienne d'abord.
    env.DB.prepare(`SELECT id, prenom, nom, telephone, email, prochaine_action, substr(prochaine_action_le, 1, 10) AS le FROM contact
      WHERE etape IS NOT NULL AND etape NOT IN ('perdu', 'vendu', 'acte_signe', 'en_sommeil') AND ecarte_le IS NULL
        AND prochaine_action_le IS NOT NULL AND substr(prochaine_action_le, 1, 10) <= ?1
      ORDER BY prochaine_action_le LIMIT 20`).bind(jour),
  ]);
  const liste: Candidat[] = [];
  for (const d of demandes.results as { id: string; source: string; recu_le: string; prenom: string | null; nom: string | null; telephone: string | null; email: string | null; contact_id: string; genre_site: string | null }[]) {
    const quoi = d.genre_site === 'estimation' ? 'une estimation' : d.genre_site === 'diagnostic' ? 'le diagnostic' : d.genre_site === 'rdv' ? 'un rendez-vous' : d.source === 'portail' ? 'une annonce' : 'un contact';
    liste.push({
      cle: `nouveau:${d.id}`, genre: 'demande', qui: quiDe(d.prenom, d.nom, d.telephone ?? d.email), date: d.recu_le.slice(0, 10), urgence: 0,
      raison: `Demande ${d.source === 'portail' ? 'reçue d\'un portail' : 'faite sur le site'} pour ${quoi}, le ${echeance(d.recu_le)}.`,
      action: d.telephone ? 'Rappeler aujourd\'hui, puis qualifier' : 'Répondre aujourd\'hui, puis qualifier', lien: `/contacts/fiche?id=${d.contact_id}`,
    });
  }
  const tels = (inconnus.results as { telephone: string }[]).map((r) => r.telephone);
  const tris = await propositionsDe(envE, tels);
  for (const r of inconnus.results as { id: string; recu_le: string; telephone: string }[]) {
    const p = tris.get(r.telephone);
    if (!p || ORDRE[p.classement] > 3) continue;
    const date = p.echeance ?? r.recu_le.slice(0, 10);
    liste.push({
      cle: `nouveau:${r.id}`, genre: 'appel', qui: `${telLisible(r.telephone)} · ${CLASSEMENTS[p.classement]}`, date,
      urgence: (date <= jour ? 0 : 2) + ORDRE[p.classement] / 10, raison: p.raison,
      action: p.echeance && p.echeance > jour ? `${p.action} avant le ${echeance(p.echeance)}` : p.action, lien: '/?nouveaux=1',
    });
  }
  for (const c of relances.results as { id: string; prenom: string | null; nom: string | null; telephone: string | null; email: string | null; prochaine_action: string | null; le: string }[]) {
    const retard = c.le < jour;
    liste.push({
      cle: `contact:${c.id}`, genre: 'relance', qui: quiDe(c.prenom, c.nom, c.telephone ?? c.email), date: c.le, urgence: retard ? 1 : 1.5,
      raison: retard ? `Action prévue le ${echeance(c.le)}, pas encore faite.` : 'Action prévue aujourd\'hui.',
      action: c.prochaine_action || 'Le rappeler', lien: `/contacts/fiche?id=${c.id}`,
    });
  }
  return liste.sort((a, b) => a.urgence - b.urgence || (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Prépare le brief du jour s'il n'existe pas encore : 5 lignes, et jusqu'à 7 si les suivantes sont dues aujourd'hui ou en
 * retard. Ni une source écartée depuis moins de 7 jours, ni une déjà acceptée hier et toujours due n'est reprise à
 * l'identique : une ligne acceptée la veille revient si l'action n'a pas été faite (elle est toujours due). Idempotent.
 */
export async function preparerBrief(envE: EnvEspace, jour = aujourdhui()): Promise<number> {
  const env = envE as unknown as EnvSite;
  const deja = await env.DB.prepare('SELECT count(*) AS n FROM brief_ligne WHERE jour = ?1').bind(jour).first<{ n: number }>();
  if (deja?.n) return 0;
  const limite = new Date(Date.parse(`${jour}T12:00:00Z`) - ECARTE_JOURS * 86_400_000).toISOString().slice(0, 10);
  const { results: ecartees } = await env.DB.prepare(`SELECT DISTINCT cle FROM brief_ligne WHERE decision = 'ecarte' AND jour > ?1`).bind(limite).all<{ cle: string }>();
  const exclues = new Set(ecartees.map((e) => e.cle));
  const choisis: Candidat[] = [];
  for (const c of await candidats(envE, jour)) {
    if (exclues.has(c.cle) || choisis.some((x) => x.cle === c.cle)) continue;
    if (choisis.length >= BRIEF_MAX || (choisis.length >= BRIEF_CIBLE && c.date > jour)) break;
    choisis.push(c);
  }
  if (!choisis.length) return 0;
  const maintenant = new Date().toISOString();
  const r = await env.DB.batch(choisis.map((c, i) => env.DB.prepare(
    `INSERT INTO brief_ligne (id, jour, rang, cle, genre, qui, raison, action, lien, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
     ON CONFLICT DO NOTHING`,
  ).bind(ulid(), jour, i + 1, c.cle, c.genre, c.qui.slice(0, 80), c.raison.slice(0, 240), c.action.slice(0, 160), c.lien, maintenant)));
  return r.reduce((n, x) => n + (x.meta.changes ?? 0), 0);
}

/** Tâche planifiée : prépare le brief du jour une fois 7 h 30 passées (heure de Paris), et fait le ménage. */
export async function briefDuMatin(envE: EnvEspace): Promise<void> {
  const env = envE as unknown as EnvSite;
  if (heureParis() >= '07:30') await preparerBrief(envE);
  const limite = new Date(Date.now() - GARDE_JOURS * 86_400_000).toISOString().slice(0, 10);
  await env.DB.prepare('DELETE FROM brief_ligne WHERE jour < ?1').bind(limite).run();
}

/** Le brief du jour et la part acceptée sur les 28 derniers jours. */
export async function lireBrief(envE: EnvEspace, jour = aujourdhui()): Promise<Brief> {
  const env = envE as unknown as EnvSite;
  const depuis = new Date(Date.parse(`${jour}T12:00:00Z`) - 27 * 86_400_000).toISOString().slice(0, 10);
  const [lignes, part] = await env.DB.batch([
    env.DB.prepare('SELECT id, rang, genre, qui, raison, action, lien, decision, decide_le FROM brief_ligne WHERE jour = ?1 ORDER BY rang').bind(jour),
    env.DB.prepare(`SELECT count(*) AS proposees, sum(decision IS NOT NULL) AS decidees, sum(decision = 'accepte') AS acceptees FROM brief_ligne WHERE jour >= ?1`).bind(depuis),
  ]);
  const p = (part.results[0] ?? {}) as { proposees: number; decidees: number | null; acceptees: number | null };
  return {
    jour, lignes: lignes.results as unknown as LigneBrief[], prepare: lignes.results.length > 0,
    part: { proposees: p.proposees ?? 0, decidees: p.decidees ?? 0, acceptees: p.acceptees ?? 0 },
  };
}

export type ResultatBrief = { ok: true; message: string; lien?: string } | { ok: false; status: number; code: string; message: string };

/** Note une décision sur une ligne du brief du jour (ou l'annule avec `null`). Seules les lignes du jour se décident. */
export async function decider(envE: EnvEspace, id: string, decision: Decision | null, par: string): Promise<ResultatBrief> {
  const env = envE as unknown as EnvSite;
  const l = await env.DB.prepare('SELECT jour, decision, lien FROM brief_ligne WHERE id = ?1').bind(id).first<{ jour: string; decision: Decision | null; lien: string }>();
  if (!l) return { ok: false, status: 404, code: 'ligne', message: 'Ligne inconnue.' };
  if (l.jour !== aujourdhui()) return { ok: false, status: 409, code: 'passee', message: 'Ce brief est celui d\'un autre jour : il ne se décide plus.' };
  if (decision && l.decision) return { ok: false, status: 409, code: 'decidee', message: 'Cette ligne est déjà décidée : annulez d\'abord.' };
  if (!decision && !l.decision) return { ok: false, status: 409, code: 'ouverte', message: 'Rien à annuler.' };
  const r = await env.DB.prepare(
    `UPDATE brief_ligne SET decision = ?2, decide_le = ?3, decide_par = ?4 WHERE id = ?1 AND decision IS ?5`,
  ).bind(id, decision, decision ? new Date().toISOString() : null, decision ? par : null, l.decision).run();
  if (!r.meta.changes) return { ok: false, status: 409, code: 'modifie', message: 'Cette ligne vient d\'être décidée ailleurs : rechargez.' };
  if (!decision) return { ok: true, message: 'Décision annulée.' };
  const message = decision === 'accepte' ? 'Acceptée : faites le geste sur la fiche.' : decision === 'plus_tard' ? 'Remise à demain.' : 'Écartée pour 7 jours.';
  return { ok: true, message, ...(decision === 'accepte' ? { lien: l.lien } : {}) };
}
