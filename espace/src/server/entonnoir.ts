// Entonnoir du diagnostic dans le Bilan (story 10.12) : combien de visiteurs arrivent sur /diagnostic, commencent, passent
// chaque question, voient l'écran des coordonnées, envoient et voient leur résultat, campagne par campagne (utm_source,
// utm_medium, utm_campaign, utm_content du lien suivi). Lu dans la table `entonnoir` (site/migrations/0015), comptée par le site sans
// donnée personnelle : des passages, pas des personnes. Hors production, les passages de test sont montrés aussi.
import contenu from '@site/content/diagnostic/questions.json';
import { enProduction, type EnvSite } from '@site/server/env';
import { journal } from '@site/server/journal';

type Ligne = { source: string; support: string; campagne: string; contenu: string; etape: string; q: string; n: number };

/** Une campagne = la source, le support, le nom et le contenu du lien suivi (« facebook · paid · diagnostic-2026 · carrousel-1 »). */
export interface Campagne {
  cle: string;
  libelle: string;
  arrivees: number;
  commences: number;
  milieu: number;
  coordonnees: number;
  envois: number;
  resultats: number;
  /** Nombre de passages par étape détaillée (voir ETAPES_DETAIL). */
  detail: Record<string, number>;
}

const NUMEROS = [...new Set(contenu.ecrans.map((e) => e.numero))];
/** Les étapes dans l'ordre du parcours. Les questions 10 et 11 ont deux variantes (a/b) : comptées ensemble. */
export const ETAPES_DETAIL: { cle: string; libelle: string }[] = [
  { cle: 'arrivee', libelle: 'Arrivée sur la page du diagnostic' },
  ...NUMEROS.map((n) => ({ cle: `q${String(n).padStart(2, '0')}`, libelle: `Question ${n}` })),
  { cle: 'coordonnees', libelle: 'Écran des coordonnées' },
  { cle: 'envoi', libelle: 'Coordonnées envoyées' },
  { cle: 'echec', libelle: 'Envoi refusé (champ à corriger, réseau)' },
  { cle: 'resultat', libelle: 'Envoi accepté, résultat ouvert' },
];
const MILIEU = `q${String(NUMEROS[Math.floor(NUMEROS.length / 2)]).padStart(2, '0')}`;

export const TOUTES = 'toutes';
const AUTRES = 'autres';

function resumer(c: Campagne) {
  c.arrivees = c.detail.arrivee ?? 0;
  c.commences = c.detail.q01 ?? 0;
  c.milieu = c.detail[MILIEU] ?? 0;
  c.coordonnees = c.detail.coordonnees ?? 0;
  c.envois = c.detail.envoi ?? 0;
  c.resultats = c.detail.resultat ?? 0;
}

/** Au-delà, les campagnes les moins vues sont regroupées en « Autres campagnes » (liens inventés, essais). */
const MAX_CAMPAGNES = 20;

/** Libellé lisible d'une campagne ; sans paramètre utm : venu par le site, un favori ou un lien sans étiquette. */
export function libelleCampagne(source: string, support: string, campagne: string, contenu: string): string {
  return [source, support, campagne, contenu].filter(Boolean).join(' · ') || 'Sans lien de campagne';
}

export async function entonnoir(env: EnvSite, debut: string): Promise<{ total: Campagne; campagnes: Campagne[] }> {
  // La table naît avec la migration 0015, appliquée par la construction du site : tant qu'elle manque, entonnoir vide
  // plutôt qu'un Bilan en erreur.
  const results = await env.DB.prepare(
    `SELECT source, support, campagne, contenu, etape, substr(ecran, 1, 3) AS q, count(DISTINCT parcours) AS n
     FROM entonnoir WHERE at >= ?1 AND (is_test = 0 OR ?2 = 0)
     GROUP BY source, support, campagne, contenu, etape, q`,
  ).bind(debut, enProduction(env) ? 1 : 0).all<Ligne>().then((r) => r.results).catch((e) => {
    journal('entonnoir_lecture_echec', { detail: String(e).slice(0, 200) });
    return [] as Ligne[];
  });
  const parCle = new Map<string, Campagne>();
  const vide = (cle: string, libelle: string): Campagne => ({ cle, libelle, arrivees: 0, commences: 0, milieu: 0, coordonnees: 0, envois: 0, resultats: 0, detail: {} });
  const total = vide(TOUTES, 'Toutes les campagnes');
  for (const l of results) {
    const cle = [l.source, l.support, l.campagne, l.contenu].join('|');
    const c = parCle.get(cle) ?? vide(cle, libelleCampagne(l.source, l.support, l.campagne, l.contenu));
    parCle.set(cle, c);
    const etape = l.etape === 'ecran' ? l.q : l.etape;
    if (etape === 'reprise') continue; // une reprise rouvre un parcours déjà commencé : elle ne compte pas comme passage
    for (const x of [c, total]) x.detail[etape] = (x.detail[etape] ?? 0) + l.n;
  }
  for (const c of [...parCle.values(), total]) resumer(c);
  const triees = [...parCle.values()].filter((c) => Object.keys(c.detail).length).sort((a, z) => z.arrivees + z.commences - (a.arrivees + a.commences));
  const campagnes = triees.slice(0, MAX_CAMPAGNES);
  if (triees.length > MAX_CAMPAGNES) {
    const autres = vide(AUTRES, `Autres campagnes (${triees.length - MAX_CAMPAGNES})`);
    for (const c of triees.slice(MAX_CAMPAGNES)) for (const [k, n] of Object.entries(c.detail)) autres.detail[k] = (autres.detail[k] ?? 0) + n;
    resumer(autres);
    campagnes.push(autres);
  }
  return { total, campagnes };
}

/** Numéro de la question du milieu du parcours, pour l'en-tête du tableau. */
export const NUMERO_MILIEU = Number(MILIEU.slice(1));

/** Part en pourcentage, arrondie ; « — » si la base est nulle. */
export function part(n: number, base: number): string {
  return base ? `${Math.round((n / base) * 100)}\u00a0%` : '—';
}
