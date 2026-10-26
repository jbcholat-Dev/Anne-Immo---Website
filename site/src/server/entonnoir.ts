// Entonnoir du diagnostic (story 10.12, AD-11) : chaque étape du parcours est comptée, sans cookie et sans donnée personnelle.
// Le navigateur envoie { parcours, etape, ecran?, utm, lang } ; on vérifie tout, on écrit une ligne `entonnoir`, on répond 204.
// Un passage déjà compté pour la même étape est ignoré (index unique). Les comptages se lisent dans le Bilan de l'espace d'Anne.
import contenu from '../content/diagnostic/questions.json';
// Types seulement : purge.ts importe ce fichier et la page Confidentialité (prérendue) importe purge.ts, hors Cloudflare.
import type { EnvSite } from './env';
import { journal } from './journal';
import { ULID } from './ulid';

export const ETAPES = ['arrivee', 'reprise', 'ecran', 'coordonnees', 'envoi', 'echec', 'resultat'] as const;
export type Etape = (typeof ETAPES)[number];
const ECRANS = new Set(contenu.ecrans.map((e) => e.id));
const UTM = { utm_source: 'source', utm_medium: 'support', utm_campaign: 'campagne', utm_content: 'contenu' } as const;
const MAX_UTM = 80;

/** Durée de conservation des comptages : 13 mois. */
export const CONSERVATION_MOIS = 13;

/** Une valeur utm lisible : texte court, sans caractères de contrôle, en minuscules (« Facebook » et « facebook » se regroupent). */
export function nettoyer(v: unknown): string {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001f\u007f]/g, '').trim().toLowerCase().slice(0, MAX_UTM);
}

export interface Passage {
  parcours: string;
  etape: Etape;
  ecran: string;
  source: string;
  support: string;
  campagne: string;
  contenu: string;
  lang: 'fr' | 'en';
}

/** Vérifie ce que le navigateur envoie. Renvoie null si quelque chose ne correspond pas au parcours. */
export function lirePassage(d: unknown): Passage | null {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const o = d as Record<string, unknown>;
  if (typeof o.parcours !== 'string' || !ULID.test(o.parcours)) return null;
  if (!ETAPES.includes(o.etape as Etape)) return null;
  const etape = o.etape as Etape;
  const ecran = etape === 'ecran' || etape === 'reprise' ? (typeof o.ecran === 'string' ? o.ecran : '') : '';
  if ((etape === 'ecran' || etape === 'reprise') && !ECRANS.has(ecran)) return null;
  const utm = o.utm && typeof o.utm === 'object' && !Array.isArray(o.utm) ? (o.utm as Record<string, unknown>) : {};
  const p: Passage = { parcours: o.parcours, etape, ecran, source: '', support: '', campagne: '', contenu: '', lang: o.lang === 'en' ? 'en' : 'fr' };
  for (const [cle, colonne] of Object.entries(UTM)) p[colonne] = nettoyer(utm[cle]);
  return p;
}

/** Écrit le passage. Un passage déjà compté est ignoré. Hors production, chaque ligne est marquée test (exclue des comptes). */
export async function compterPassage(env: EnvSite, p: Passage, maintenant = new Date()): Promise<void> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO entonnoir (parcours, etape, ecran, source, support, campagne, contenu, lang, is_test, at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
  ).bind(p.parcours, p.etape, p.ecran, p.source, p.support, p.campagne, p.contenu, p.lang, (env.ENVIRONNEMENT as string) === 'production' ? 0 : 1, maintenant.toISOString()).run();
}

/** Purge des comptages de plus de 13 mois (tâche planifiée, src/server/purge.ts). */
export async function purgerEntonnoir(env: EnvSite, maintenant = new Date()): Promise<void> {
  const d = new Date(maintenant);
  d.setUTCMonth(d.getUTCMonth() - CONSERVATION_MOIS);
  await env.DB.prepare('DELETE FROM entonnoir WHERE at < ?1').bind(d.toISOString()).run()
    .catch((e) => journal('purge_entonnoir_echec', { detail: String(e).slice(0, 200) }));
}
