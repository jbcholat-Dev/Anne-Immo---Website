// Entonnoir du diagnostic (story 10.12, AD-11) : chaque étape du parcours est comptée, sans cookie et sans donnée personnelle.
// Le navigateur envoie { parcours, etape, ecran?, utm, lang } ; on vérifie tout, on écrit une ligne `entonnoir`, on répond 204.
// Un passage déjà compté pour la même étape est ignoré (index unique). Les comptages se lisent dans le Bilan de l'espace d'Anne.
import contenu from '../content/diagnostic/questions.json';
// Types seulement : purge.ts importe ce fichier et la page Confidentialité (prérendue) importe purge.ts, hors Cloudflare.
import type { EnvSite } from './env';
import { journal } from './journal';

export const ETAPES = ['arrivee', 'reprise', 'ecran', 'coordonnees', 'envoi', 'echec', 'resultat'] as const;
export type Etape = (typeof ETAPES)[number];
/** Numéro de passage : 26 caractères tirés au hasard (alphabet ULID), sans horodatage. */
export const PARCOURS = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const ECRANS = new Set(contenu.ecrans.map((e) => e.id));
const UTM = { utm_source: 'source', utm_medium: 'support', utm_campaign: 'campagne', utm_content: 'contenu' } as const;
const MAX_UTM = 40;
/** Plafond de passages écrits par jour, toutes adresses confondues : au-delà, rien n'est écrit (la base est aussi celle des
 * demandes, qu'un envoi en masse ne doit jamais remplir). Plusieurs centaines de fois le trafic attendu. */
export const PLAFOND_JOUR = 5_000;

/** Durée de conservation des comptages : 13 mois. */
export const CONSERVATION_MOIS = 13;

/** Une valeur utm : en minuscules (« Facebook » et « facebook » se regroupent), seulement lettres sans accent, chiffres,
 * point, tiret et souligné, 40 caractères au plus ; toute autre valeur est oubliée (vide). Aucune phrase ni caractère
 * invisible ne peut ainsi arriver dans le Bilan d'Anne ou dans ce que lit Claude. */
export function nettoyer(v: unknown): string {
  if (typeof v !== 'string') return '';
  const t = v.trim().toLowerCase();
  return t.length <= MAX_UTM && /^[a-z0-9._-]+$/.test(t) ? t : '';
}

/** Heure du passage arrondie à l'heure : assez pour une période de bilan, trop grossière pour retrouver la demande
 * envoyée à la même minute (la ligne « envoi » ne doit pas pouvoir être reliée au `lead`, AD-11). */
export function heureArrondie(maintenant = new Date()): string {
  const d = new Date(maintenant);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
}

/** Clé de la limite de fréquence : l'adresse IPv4, ou le bloc /64 d'une adresse IPv6 (un appareil en change à volonté dans son bloc). */
export function cleLimite(ip: string): string {
  if (!ip.includes(':')) return `entonnoir:${ip}`;
  const [tete] = ip.split('::');
  return `entonnoir:${tete.split(':').slice(0, 4).join(':')}`;
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
  if (typeof o.parcours !== 'string' || !PARCOURS.test(o.parcours)) return null;
  if (!ETAPES.includes(o.etape as Etape)) return null;
  const etape = o.etape as Etape;
  const ecran = etape === 'ecran' || etape === 'reprise' ? (typeof o.ecran === 'string' ? o.ecran : '') : '';
  if ((etape === 'ecran' || etape === 'reprise') && !ECRANS.has(ecran)) return null;
  const utm = o.utm && typeof o.utm === 'object' && !Array.isArray(o.utm) ? (o.utm as Record<string, unknown>) : {};
  const p: Passage = { parcours: o.parcours, etape, ecran, source: '', support: '', campagne: '', contenu: '', lang: o.lang === 'en' ? 'en' : 'fr' };
  for (const [cle, colonne] of Object.entries(UTM)) p[colonne] = nettoyer(utm[cle]);
  return p;
}

/** Écrit le passage. Un passage déjà compté est ignoré. Hors production, chaque ligne est marquée test (exclue des comptes).
 * Renvoie false si le plafond du jour est atteint (rien n'est écrit). */
export async function compterPassage(env: EnvSite, p: Passage, maintenant = new Date()): Promise<boolean> {
  const minuit = new Date(maintenant);
  minuit.setUTCHours(0, 0, 0, 0);
  const jour = await env.DB.prepare('SELECT count(*) AS n FROM entonnoir WHERE at >= ?1').bind(minuit.toISOString()).first<{ n: number }>();
  if ((jour?.n ?? 0) >= PLAFOND_JOUR) return false;
  await env.DB.prepare(
    `INSERT OR IGNORE INTO entonnoir (parcours, etape, ecran, source, support, campagne, contenu, lang, is_test, at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
  ).bind(p.parcours, p.etape, p.ecran, p.source, p.support, p.campagne, p.contenu, p.lang, (env.ENVIRONNEMENT as string) === 'production' ? 0 : 1, heureArrondie(maintenant)).run();
  return true;
}

/** Purge des comptages de plus de 13 mois (tâche planifiée, src/server/purge.ts). */
export async function purgerEntonnoir(env: EnvSite, maintenant = new Date()): Promise<void> {
  const d = new Date(maintenant);
  d.setUTCMonth(d.getUTCMonth() - CONSERVATION_MOIS);
  await env.DB.prepare('DELETE FROM entonnoir WHERE at < ?1').bind(d.toISOString()).run()
    .catch((e) => journal('purge_entonnoir_echec', { detail: String(e).slice(0, 200) }));
}
