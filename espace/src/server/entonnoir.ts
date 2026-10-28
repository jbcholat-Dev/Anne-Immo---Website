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
  ...NUMEROS.flatMap((n) => [
    { cle: `q${String(n).padStart(2, '0')}`, libelle: `Question ${n}` },
    // Story 10.13 : premier toucher sur la question 1 (compté depuis le 28 octobre 2026).
    ...(n === NUMEROS[0] ? [{ cle: 'interaction', libelle: `Question ${n} : écran touché` }] : []),
  ]),
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

/** Une ligne de la ventilation de la question 1 (story 10.13). */
export interface LigneQuestion1 {
  libelle: string;
  question1: number;
  touches: number;
  question2: number;
}

type Brute = { integre: number | null; appareil: string; affichage: string; n: number; touches: number; suivants: number };

const NAVIGATEURS: [string, (b: Brute) => boolean][] = [
  ['Application Instagram ou Facebook', (b) => b.integre === 1],
  ['Navigateur habituel', (b) => b.integre === 0],
];
const APPAREILS: [string, (b: Brute) => boolean][] = [
  ['iPhone ou iPad', (b) => b.appareil === 'ios'],
  ['Android', (b) => b.appareil === 'android'],
  ['Ordinateur', (b) => b.appareil === 'ordinateur'],
];
const AFFICHAGES: [string, (b: Brute) => boolean][] = [
  ['Affichée en moins de 2 s', (b) => b.affichage === 'moins-2s'],
  ['Affichée en 2 à 5 s', (b) => b.affichage === '2-5s'],
  ['Affichée en plus de 5 s', (b) => b.affichage === 'plus-5s'],
  ['Pas à l\'écran à l\'affichage (préchargée ou en arrière-plan)', (b) => b.affichage === 'cachee'],
];

/** Passage de la question 1 à la question 2, ventilé par navigateur, appareil et temps d'affichage, pour une campagne
 * (clé de `entonnoir()`) ou toutes. Les passages d'avant le 28 octobre 2026 n'ont pas ces informations : « non mesuré ». */
export async function question1(env: EnvSite, debut: string, cle: string): Promise<{ titre: string; lignes: LigneQuestion1[] }[]> {
  const parts = cle === TOUTES || cle === AUTRES ? null : cle.split('|');
  const filtre = parts && parts.length === 4 ? ' AND e.source = ?3 AND e.support = ?4 AND e.campagne = ?5 AND e.contenu = ?6' : '';
  const brutes = await env.DB.prepare(
    `SELECT e.integre, e.appareil, e.affichage, count(*) AS n,
       sum(EXISTS (SELECT 1 FROM entonnoir i WHERE i.parcours = e.parcours AND i.etape = 'interaction' AND i.ecran = '')) AS touches,
       sum(EXISTS (SELECT 1 FROM entonnoir s WHERE s.parcours = e.parcours AND s.etape = 'ecran' AND s.ecran = 'q02')) AS suivants
     FROM entonnoir e WHERE e.etape = 'ecran' AND e.ecran = 'q01' AND e.at >= ?1 AND (e.is_test = 0 OR ?2 = 0)${filtre}
     GROUP BY e.integre, e.appareil, e.affichage`,
  ).bind(debut, enProduction(env) ? 1 : 0, ...(filtre ? parts! : [])).all<Brute>().then((r) => r.results).catch((e) => {
    // Avant la migration 0016 (appliquée par la construction du site), les colonnes manquent : ventilation vide.
    journal('entonnoir_question1_echec', { detail: String(e).slice(0, 200) });
    return [] as Brute[];
  });
  const ligne = (libelle: string, garder: (b: Brute) => boolean): LigneQuestion1 => brutes.filter(garder).reduce(
    (l, b) => ({ ...l, question1: l.question1 + b.n, touches: l.touches + b.touches, question2: l.question2 + b.suivants }),
    { libelle, question1: 0, touches: 0, question2: 0 });
  const groupe = (titre: string, defs: [string, (b: Brute) => boolean][], nonMesure: (b: Brute) => boolean) => ({
    titre,
    lignes: [...defs.map(([l, g]) => ligne(l, g)), ligne('Non mesuré (avant le 28 octobre)', nonMesure)].filter((l) => l.question1 > 0),
  });
  return [
    groupe('Navigateur', NAVIGATEURS, (b) => b.integre === null),
    groupe('Appareil', APPAREILS, (b) => b.appareil === ''),
    groupe('Affichage de la question 1', AFFICHAGES, (b) => b.affichage === ''),
  ].filter((g) => g.lignes.length);
}
