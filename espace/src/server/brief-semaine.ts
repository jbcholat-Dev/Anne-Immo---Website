// Brief de la semaine (story 18.27, demande de JB du 2026-11-24) : après un point avec JB, le chief of staff (Claude)
// dépose lui-même, par son jeton de service (/api/claude/brief), deux textes courts pour la semaine : « le point qui
// bloque » et « la décision à prendre ». Ils s'affichent en 2 lignes sous le titre de « Ma semaine », pour Anne
// et pour JB. Un nouveau dépôt pour la même semaine remplace l'ancien. Rien d'autre n'est écrit.
// Texte de pilotage seulement : aucun nom de contact. Le code refuse un e-mail ou un numéro de téléphone.
import type { EnvSite } from '@site/server/env';
import { jourParis, lundiDe } from './prospection';
import { contientTelephone } from './telephones';

export const SIGNATURE = 'chief of staff';
export const TEXTE_MAX = 400;
const JOUR = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;

export interface BriefSemaine { lundi: string; bloque: string; decision: string; signe: string; depose_le: string }

const jourValide = (v: string) => JOUR.test(v) && !Number.isNaN(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;

/** Le lundi de la semaine demandée (`AAAA-MM-JJ`, ramené au lundi), la semaine en cours si rien n'est donné ; null si la date est fausse. */
export function lundiDemande(s: unknown): string | null {
  if (s === undefined || s === null || s === '') return lundiDe(jourParis());
  if (typeof s !== 'string' || !jourValide(s) || s < '2025-01-01' || s > `${Number(jourParis().slice(0, 4)) + 1}-12-31`) return null;
  return lundiDe(s);
}

/** Vérifie un dépôt ; renvoie le message d'erreur, ou les deux textes nettoyés. */
export function verifierDepot(d: Record<string, unknown>): string | { lundi: string; bloque: string; decision: string } {
  const lundi = lundiDemande(d.semaine);
  if (!lundi) return 'Semaine invalide (AAAA-MM-JJ attendu)';
  const textes: Record<string, string> = {};
  for (const [cle, libelle] of [['bloque', 'le point qui bloque'], ['decision', 'la décision à prendre']] as const) {
    const v = typeof d[cle] === 'string' ? (d[cle] as string).replace(/\s+/g, ' ').trim() : '';
    if (!v) return `Texte manquant : ${libelle} (« ${cle} »)`;
    if (v.length > TEXTE_MAX) return `Texte trop long : ${libelle} (${TEXTE_MAX} caractères au plus)`;
    if (EMAIL.test(v) || contientTelephone(v)) return `Texte refusé : ${libelle} contient un e-mail ou un téléphone (texte de pilotage seulement)`;
    textes[cle] = v;
  }
  return { lundi, bloque: textes.bloque, decision: textes.decision };
}

/** Dépose (ou remplace) le brief de la semaine. Renvoie true si un brief existait déjà pour cette semaine. */
export async function deposerBriefSemaine(env: EnvSite, b: { lundi: string; bloque: string; decision: string }, par: string): Promise<boolean> {
  const avant = await env.DB.prepare('SELECT 1 FROM brief_semaine WHERE lundi = ?1').bind(b.lundi).first();
  await env.DB.prepare(`INSERT INTO brief_semaine (lundi, bloque, decision, signe, depose_par, depose_le) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
    ON CONFLICT (lundi) DO UPDATE SET bloque = excluded.bloque, decision = excluded.decision, signe = excluded.signe,
      depose_par = excluded.depose_par, depose_le = excluded.depose_le`)
    .bind(b.lundi, b.bloque, b.decision, SIGNATURE, par, new Date().toISOString()).run();
  return !!avant;
}

/** Le brief de la semaine qui commence ce lundi, ou null. */
export async function lireBriefSemaine(env: EnvSite, lundi = lundiDe(jourParis())): Promise<BriefSemaine | null> {
  return (await env.DB.prepare('SELECT lundi, bloque, decision, signe, depose_le FROM brief_semaine WHERE lundi = ?1').bind(lundi).first<BriefSemaine>()) ?? null;
}
