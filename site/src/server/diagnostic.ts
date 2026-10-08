// Gate du diagnostic côté serveur (story 10.4, AD-5) : les réponses arrivent par identifiants (`{ q01: ["q01.a"], … }`),
// sont revérifiées contre le contenu du questionnaire, puis le score, le profil et l'orientation A/B sont calculés
// ici, depuis bareme.json. Le navigateur ne voit le score qu'une fois les coordonnées enregistrées.
import contenu from '../content/diagnostic/questions.json';
import { calculer, type Reponses, type Resultat } from './scoring';

type Ecran = (typeof contenu.ecrans)[number] & { aucune?: string; autre?: string };
const ECRANS = contenu.ecrans as Ecran[];
const MAX_AUTRE = 200;

/** Ce qui est écrit sur le lead `diagnostic` (colonnes token, answers, scores, band, orientation, AD-6). */
export interface Diagnostic {
  token: string;
  answers: string;
  scores: string;
  band: string;
  orientation: 'A' | 'B';
}

/** Ce que garde la colonne `scores` : de quoi rendre la page de résultats sans relire le barème. */
export interface Scores {
  total: number;
  categories: Resultat['categories'];
  profil: string;
}

/** Jeton opaque de la page de résultats : 32 octets aléatoires, en base64url (revue RGPD L1). */
export function jeton(): string {
  const octets = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...octets)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Vérifie les réponses et calcule le diagnostic. Renvoie le nom du champ refusé si les réponses ne correspondent pas au questionnaire. */
export function evaluer(d: Record<string, unknown>): { ok: true; diagnostic: Diagnostic } | { ok: false; champ: string } {
  const brutes = d.reponses;
  if (!brutes || typeof brutes !== 'object' || Array.isArray(brutes)) return { ok: false, champ: 'reponses' };
  const recues = brutes as Record<string, unknown>;
  if (Object.keys(recues).some((q) => !ECRANS.some((e) => e.id === q))) return { ok: false, champ: 'reponses' };
  const autresRecus = d.autre && typeof d.autre === 'object' ? (d.autre as Record<string, unknown>) : {};

  const reponses: Reponses = {};
  const autre: Record<string, string> = {};
  for (const e of ECRANS) {
    const r = recues[e.id] ?? [];
    if (!Array.isArray(r) || r.some((x) => typeof x !== 'string') || new Set(r).size !== r.length) return { ok: false, champ: e.id };
    const ids = (e.options ?? []).map((o) => o.id);
    if (e.type === 'unique') {
      if (r.length !== 1 || !ids.includes(r[0])) return { ok: false, champ: e.id };
    } else if (e.type === 'multiple') {
      // « Aucune » est exclusive ; « autre » n'existe que si la question propose un champ libre.
      const valides = r.every((x) => ids.includes(x) || (x === 'autre' && !!e.autre));
      if (!r.length || !valides || (e.aucune && r.includes(e.aucune) && r.length > 1)) return { ok: false, champ: e.id };
      if (r.includes('autre')) {
        const texteAutre = typeof autresRecus[e.id] === 'string' ? (autresRecus[e.id] as string).trim() : '';
        if (!texteAutre || texteAutre.length > MAX_AUTRE) return { ok: false, champ: e.id };
        autre[e.id] = texteAutre;
      }
    } else if (r.length > 1 || (r.length === 1 && r[0] !== `${e.id}.texte`)) {
      return { ok: false, champ: e.id };
    }
    reponses[e.id] = r as string[];
  }

  const res = calculer(reponses);
  const scores: Scores = { total: res.total, categories: res.categories, profil: res.profil.id };
  return {
    ok: true,
    diagnostic: {
      token: jeton(),
      answers: JSON.stringify({ reponses, autre }),
      scores: JSON.stringify(scores),
      band: res.profil.id,
      orientation: res.orientation,
    },
  };
}
