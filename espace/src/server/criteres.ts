// Les critères de recherche d'un acheteur (story 18.30, ticket n° 284) : lecture stricte de ce qui est saisi, fusion dans
// la qualification du contact, et mise en phrase pour le panneau de la page Contacts, la fiche, la liste des acheteurs.
// Module sans accès à la base ni au serveur : l'îlot du panneau l'importe aussi. Les critères vivent dans le JSON
// `contact.qualification` (clés ci-dessous, valeurs en texte) ; les anciennes clés `surface` (minimale) et `budget` (texte
// libre, « 750 k€ à 850 k€ ») restent lues, les nouvelles clés numériques l'emportent quand elles existent.

export type Criteres = Record<string, string | undefined>;

export const TYPES_BIEN = ['Maison', 'Appartement', 'Terrain'] as const;
/** Les listes à cases : chaque critère garde les choix cochés, dans l'ordre de la liste, séparés par « , ». */
export const CHOIX_CRITERES = {
  types: TYPES_BIEN,
  pieces: ['Studio ou T1', 'T2', 'T3', 'T4', 'T5 et plus'],
  exterieur: ['Jardin', 'Terrasse', 'Balcon'],
  stationnement: ['Garage', 'Parking'],
} as const satisfies Record<string, readonly string[]>;
export const FINANCEMENTS_CRITERES = ['Vérifié', 'À vérifier', 'Après sa vente'] as const;

/** Les nombres entiers, avec leur borne haute (au-delà, c'est une faute de frappe) et leur titre. */
export const NOMBRES_CRITERES = [
  { id: 'surface_min', titre: 'Surface habitable minimale (m²)', max: 10_000 },
  { id: 'surface_max', titre: 'Surface habitable maximale (m²)', max: 10_000 },
  { id: 'chambres_min', titre: 'Chambres au moins', max: 30 },
  { id: 'terrain_min', titre: 'Terrain minimal (m²)', max: 1_000_000 },
  { id: 'terrain_max', titre: 'Terrain maximal (m²)', max: 1_000_000 },
  { id: 'budget_min', titre: 'Budget minimal (€)', max: 100_000_000 },
  { id: 'budget_max', titre: 'Budget maximal (€)', max: 100_000_000 },
] as const;
/** Les textes libres, avec leur longueur maximale. */
export const TEXTES_CRITERES = [
  { id: 'secteur', titre: 'Secteur (communes)', max: 120 },
  { id: 'indispensable', titre: 'Indispensable', max: 300 },
  { id: 'apprecie', titre: 'Apprécié', max: 300 },
  { id: 'redhibitoire', titre: 'Rédhibitoire', max: 300 },
  { id: 'autres', titre: 'Autres critères', max: 200 },
] as const;
export const REFUS_BORNES = 'le minimum ne peut pas dépasser le maximum.';
const PAIRES = [['surface_min', 'surface_max', 'La surface habitable'], ['terrain_min', 'terrain_max', 'Le terrain'], ['budget_min', 'budget_max', 'Le budget']] as const;

/** Toutes les clés que l'écriture des critères peut toucher (hors anciennes clés). */
export const CLES_CRITERES: readonly string[] = [
  ...Object.keys(CHOIX_CRITERES), ...NOMBRES_CRITERES.map((n) => n.id), ...TEXTES_CRITERES.map((t) => t.id), 'financement',
];
/** Les clés à renvoyer au panneau : les critères, les deux anciennes, et le type de bien noté à la qualification. */
export const CLES_LUES: readonly string[] = [...CLES_CRITERES, 'surface', 'budget', 'bien'];

/** Une saisie de critères validée : une clé à `null` se retire de la qualification. */
export type SaisieCriteres = Record<string, string | null>;

/**
 * Lit des critères saisis (vocabulaire fermé) ; ou le message d'erreur (400). Une clé absente ne change rien ; vide ou
 * `null` retire le critère. Les nombres sont des entiers positifs bornés (« 120 », « 120 m² » acceptés, « -5 » ou « 12,5 »
 * refusés), le minimum ne dépasse pas le maximum, les textes sont nettoyés et jamais coupés en silence (trop longs : refus).
 */
export function lireCriteres(brut: unknown): SaisieCriteres | string {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return 'Critères attendus.';
  const sortie: SaisieCriteres = {};
  for (const [cle, v] of Object.entries(brut as Record<string, unknown>)) {
    const nombre = NOMBRES_CRITERES.find((n) => n.id === cle);
    const texte = TEXTES_CRITERES.find((t) => t.id === cle);
    if (nombre) {
      if (v === null || v === undefined || v === '') { sortie[cle] = null; continue; }
      let n: number;
      if (typeof v === 'number') n = v;
      else if (typeof v === 'string') {
        const s = v.replace(/[\s  ]/g, '').replace(/(m²|m2|€|euros?)$/i, '');
        if (!/^\d{1,12}$/.test(s)) return `${nombre.titre} : un nombre entier positif attendu.`;
        n = Number(s);
      } else return `${nombre.titre} : un nombre entier positif attendu.`;
      if (!Number.isInteger(n) || n < 0) return `${nombre.titre} : un nombre entier positif attendu.`;
      if (n > nombre.max) return `${nombre.titre} : ${nombre.max.toLocaleString('fr-FR')} au plus.`;
      sortie[cle] = n === 0 ? null : String(n);
    } else if (texte) {
      if (v === null || v === undefined) { sortie[cle] = null; continue; }
      if (typeof v !== 'string') return `${texte.titre} : texte attendu.`;
      const t = v.replace(/\s+/g, ' ').trim();
      if (t.length > texte.max) return `${texte.titre} : ${texte.max} caractères au plus.`;
      sortie[cle] = t || null;
    } else if (cle in CHOIX_CRITERES) {
      const options = CHOIX_CRITERES[cle as keyof typeof CHOIX_CRITERES] as readonly string[];
      const liste = v === null || v === undefined ? [] : Array.isArray(v) ? v : typeof v === 'string' ? v.split(',').map((x) => x.trim()).filter(Boolean) : null;
      if (!liste || !liste.every((x) => typeof x === 'string' && options.includes(x))) return `${cle === 'types' ? 'Type de bien' : cle === 'pieces' ? 'Pièces' : cle === 'exterieur' ? 'Extérieur' : 'Stationnement'} : choix hors liste.`;
      const gardes = options.filter((o) => (liste as string[]).includes(o));
      sortie[cle] = gardes.length ? gardes.join(', ') : null;
    } else if (cle === 'financement') {
      if (v === null || v === undefined || v === '') { sortie[cle] = null; continue; }
      if (typeof v !== 'string' || !(FINANCEMENTS_CRITERES as readonly string[]).includes(v)) return 'Financement : choix hors liste.';
      sortie[cle] = v;
    } else return `Critère inconnu : ${cle.slice(0, 40)}`;
  }
  for (const [a, b, titre] of PAIRES) {
    if (sortie[a] && sortie[b] && Number(sortie[a]) > Number(sortie[b])) return `${titre} : ${REFUS_BORNES}`;
  }
  if (!Object.keys(sortie).length) return 'Aucun critère à changer.';
  return sortie;
}

/** Après fusion : un maximum envoyé seul ne passe pas sous un minimum déjà noté (et l'inverse) ; le message d'erreur, ou null. */
export function verifierBornes(r: Criteres): string | null {
  for (const [a, b, titre] of PAIRES) {
    const x = a === 'surface_min' ? vueCriteres(r).surfaceMin : chiffre(r[a]), y = chiffre(r[b]);
    if (x && y && x > y) return `${titre} : ${REFUS_BORNES}`;
  }
  return null;
}

/** « 750 k€ à 850 k€ » ou « 900 k€ à 1,1 M€ » → { min, max } en euros ; null si le texte n'est pas de cette forme. */
export function budgetAncien(texte: string): { min: number; max: number } | null {
  const trouves = [...texte.matchAll(/(\d+(?:[.,]\d+)?)\s*(k|m)?\s*(?:€|euros?)?/gi)].filter((m) => m[1]);
  if (trouves.length !== 2) return null;
  const unite = (u: string | undefined) => (u?.toLowerCase() === 'k' ? 1000 : u?.toLowerCase() === 'm' ? 1_000_000 : 0);
  const [a, b] = trouves;
  const ub = unite(b[2]);
  const ua = unite(a[2]) || (Number(a[1].replace(',', '.')) < 1000 && ub ? ub : 1);
  const min = Math.round(Number(a[1].replace(',', '.')) * ua), max = Math.round(Number(b[1].replace(',', '.')) * (ub || 1));
  return min > 0 && max >= min ? { min, max } : null;
}

const chiffre = (v: string | undefined) => (v && /^\d+$/.test(v) && Number(v) > 0 ? Number(v) : null);
const espaces = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const virgule = (n: number) => String(n).replace('.', ',');
/** Un montant court : « 650 k€ », « 1,2 M€ », « 725 500 € ». */
function euros(n: number): { nombre: string; unite: string } {
  if (n >= 1_000_000 && n % 10_000 === 0) return { nombre: virgule(n / 1_000_000), unite: ' M€' };
  if (n >= 1000 && n % 1000 === 0 && n < 1_000_000) return { nombre: String(n / 1000), unite: ' k€' };
  return { nombre: espaces(n), unite: ' €' };
}
/** Une fourchette : « 650 à 800 k€ », « à partir de 650 k€ », « jusqu'à 800 k€ ». */
function fourchette(min: number | null, max: number | null, fmt: (n: number) => { nombre: string; unite: string }, sansUnite = false): string {
  if (min && max) {
    const a = fmt(min), b = fmt(max);
    if (sansUnite) return `${a.nombre} à ${b.nombre}${b.unite}`;
    return a.unite === b.unite ? `${a.nombre} à ${b.nombre}${b.unite}` : `${a.nombre}${a.unite} à ${b.nombre}${b.unite}`;
  }
  if (min) { const a = fmt(min); return `${sansUnite ? '' : 'à partir de '}${a.nombre}${a.unite}${sansUnite ? ' et plus' : ''}`; }
  if (max) { const b = fmt(max); return `jusqu'à ${b.nombre}${b.unite}`; }
  return '';
}
const mCarres = (n: number) => ({ nombre: espaces(n), unite: ' m²' });

/** Ce que la qualification dit des critères, ancien format compris (les clés numériques l'emportent). */
export interface VueCriteres { surfaceMin: number | null; surfaceMax: number | null; budgetMin: number | null; budgetMax: number | null; budgetTexte: string }
export function vueCriteres(r: Criteres): VueCriteres {
  const ancienneSurface = chiffre((r.surface ?? '').replace(/\s*m(²|2)\s*$/i, ''));
  const surfaceMin = chiffre(r.surface_min) ?? ancienneSurface;
  const budgetMin = chiffre(r.budget_min), budgetMax = chiffre(r.budget_max);
  return { surfaceMin, surfaceMax: chiffre(r.surface_max), budgetMin, budgetMax, budgetTexte: budgetMin || budgetMax ? '' : (r.budget ?? '').trim() };
}

export function surfaceLisible(r: Criteres): string {
  const v = vueCriteres(r);
  return fourchette(v.surfaceMin, v.surfaceMax, mCarres, true).replace(/^(\d[\d ]*) à ([\d ]+ m²)$/, '$1 à $2');
}
export function budgetLisible(r: Criteres): string {
  const v = vueCriteres(r);
  return v.budgetMin || v.budgetMax ? fourchette(v.budgetMin, v.budgetMax, euros) : v.budgetTexte;
}
export function terrainLisible(r: Criteres): string {
  const m = chiffre(r.terrain_min), x = chiffre(r.terrain_max);
  const t = fourchette(m, x, mCarres, true);
  return t ? `terrain ${t}` : '';
}
export function chambresLisible(r: Criteres): string {
  const n = chiffre(r.chambres_min);
  return n ? `${n} chambre${n > 1 ? 's' : ''} et plus` : '';
}

/** La recherche en une ligne, sans le budget ni le secteur (colonnes à part de la liste des acheteurs) : « Maison · T4 · 120 m² et plus · Jardin ». */
export function ligneBien(r: Criteres): string {
  return [r.types ?? r.bien, r.pieces, surfaceLisible(r), chambresLisible(r), terrainLisible(r), r.exterieur, r.stationnement].filter(Boolean).join(' · ');
}

/** Le résumé du panneau : la ligne principale, puis les lignes courtes (indispensable, apprécié, rédhibitoire, autres, financement). */
export function resumeCriteres(r: Criteres): { ligne: string; lignes: { cle: string; titre: string; valeur: string }[] } {
  const ligne = [ligneBien(r), budgetLisible(r), r.secteur].filter(Boolean).join(' · ');
  const lignes = ([['indispensable', 'Indispensable'], ['apprecie', 'Apprécié'], ['redhibitoire', 'Rédhibitoire'], ['autres', 'Autres critères'], ['financement', 'Financement']] as const)
    .filter(([cle]) => r[cle]).map(([cle, titre]) => ({ cle, titre, valeur: r[cle]! }));
  return { ligne, lignes };
}

/** Les valeurs d'un formulaire de critères, préremplies : les anciennes données (surface minimale, budget « 750 k€ à 850 k€ ») y entrent quand elles se lisent. */
export function valeursFormulaire(r: Criteres): Record<string, string> {
  const v = vueCriteres(r);
  const ancien = !v.budgetMin && !v.budgetMax && v.budgetTexte ? budgetAncien(v.budgetTexte) : null;
  const sortie: Record<string, string> = {};
  for (const cle of CLES_CRITERES) sortie[cle] = r[cle] ?? '';
  sortie.surface_min = v.surfaceMin ? String(v.surfaceMin) : '';
  sortie.budget_min = v.budgetMin ? String(v.budgetMin) : ancien ? String(ancien.min) : '';
  sortie.budget_max = v.budgetMax ? String(v.budgetMax) : ancien ? String(ancien.max) : '';
  return sortie;
}
/** Le budget ancien qui ne se lit pas en deux montants : montré tel quel au-dessus du formulaire, gardé tant qu'aucun montant n'est saisi. */
export function budgetAGarder(r: Criteres): string {
  const v = vueCriteres(r);
  return v.budgetTexte && !budgetAncien(v.budgetTexte) ? v.budgetTexte : '';
}

/**
 * Applique une saisie validée à une qualification existante (les autres réponses, délai, agence…, restent). Les anciennes
 * clés sont retirées quand les nouvelles prennent leur place : `surface` dès que la surface minimale est donnée, `budget`
 * dès qu'un montant l'est, ou quand le budget ancien se lisait en montants (et qu'on les a effacés).
 */
export function fusionnerCriteres(existant: Criteres, saisie: SaisieCriteres): Criteres {
  const r: Criteres = { ...existant };
  // Un ancien budget « 750 k€ à 850 k€ » dont on ne change qu'une borne : l'autre borne en est reprise, pas perdue.
  const lu = !existant.budget_min && !existant.budget_max && existant.budget ? budgetAncien(existant.budget) : null;
  if (lu && ('budget_min' in saisie || 'budget_max' in saisie)) {
    if (!('budget_min' in saisie)) r.budget_min = String(lu.min);
    if (!('budget_max' in saisie)) r.budget_max = String(lu.max);
  }
  for (const [cle, v] of Object.entries(saisie)) { if (v === null) delete r[cle]; else r[cle] = v; }
  if ('surface_min' in saisie) delete r.surface;
  if ('budget_min' in saisie || 'budget_max' in saisie) {
    if (r.budget_min || r.budget_max || !r.budget || budgetAncien(r.budget)) delete r.budget;
  }
  return r;
}
