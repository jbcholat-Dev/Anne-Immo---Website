// Scoring du diagnostic (CAP-4, CAP-7) depuis bareme.json — partagé par l'îlot (v1, client) et, plus tard, le noyau serveur (AD-5).
// TODO(backend) : en production le barème n'est lu que par le serveur ; le client ne calcule rien avant le gate.
import bareme from '../content/diagnostic/bareme.json';

export type Reponses = Record<string, string[]>;
export type Categorie = 'preparation' | 'visibilite' | 'efficacite';
export type Bande = 'faible' | 'moyen' | 'eleve';
export type Resultat = {
  total: number;
  categories: Record<Categorie, { brut: number; max: number; pourcent: number; bande: Bande }>;
  profil: (typeof bareme.profils)[number];
  orientation: 'A' | 'B';
};

const MAX: Record<Categorie, number> = { preparation: 40, visibilite: 40, efficacite: 20 };
const points = bareme.points as Record<string, number>;

function pointsQuestion(q: string, r: Reponses): number {
  const rep = r[q] ?? [];
  if (q === 'q07') {
    const n = rep.filter((x) => x !== 'q07.i' && x !== '').length; // « Aucune diffusion » ne compte pas ; « autre » compte si renseigné
    const t = bareme.q07_par_nombre as Record<string, number>;
    return n >= 6 ? t['6+'] : (t[String(n)] ?? 0);
  }
  if (q === 'q10') {
    const a = r['q10a']?.[0], b = r['q10b']?.[0];
    const m = bareme.q10_matrice as Record<string, Record<string, number>>;
    return a && b ? (m[a]?.[b] ?? 0) : 0;
  }
  return rep.reduce((s, id) => s + (points[id] ?? 0), 0);
}

export function bandeDe(pourcent: number): Bande {
  return pourcent <= 40 ? 'faible' : pourcent <= 70 ? 'moyen' : 'eleve';
}

export function calculer(r: Reponses): Resultat {
  const categories = {} as Resultat['categories'];
  let total = 0;
  for (const [cat, qs] of Object.entries(bareme.categories) as [Categorie, string[]][]) {
    const brut = qs.reduce((s, q) => s + pointsQuestion(q, r), 0);
    const pourcent = Math.round((brut / MAX[cat]) * 100);
    categories[cat] = { brut, max: MAX[cat], pourcent, bande: bandeDe(pourcent) };
    total += brut;
  }
  const profil = bareme.profils.find((p) => total >= p.min && total <= p.max) ?? bareme.profils[0];
  const o = bareme.orientation;
  const premium = (r['q14'] ?? []).includes(o.premium);
  const forceB = (r['q12'] ?? []).includes(o.force_b);
  const orientation: 'A' | 'B' = total >= o.seuil_a && premium && !forceB ? 'A' : 'B';
  return { total, categories, profil, orientation };
}
