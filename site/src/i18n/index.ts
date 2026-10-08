import fr from '../content/ui/fr.json';
import en from '../content/ui/en.json';

export type Lang = 'fr' | 'en';
export const dictionnaires = { fr, en } as const;
export type Dico = typeof fr;
export const t = (lang: Lang): Dico => dictionnaires[lang] as Dico;

/** AD-2 : jamais d'écran mi-traduit. Le build échoue si `en.json` n'a pas exactement les clés de `fr.json` ou laisse un texte vide (story 6.2). */
function cles(o: object, prefixe = ''): string[] {
  return Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? cles(v, `${prefixe}${k}.`) : [`${prefixe}${k}`]);
}
function valeur(o: any, cle: string) { return cle.split('.').reduce((x, k) => x?.[k], o); }
{
  const cFr = cles(fr), cEn = new Set(cles(en));
  const manquantes = cFr.filter((k) => !cEn.has(k));
  const enTrop = [...cEn].filter((k) => !cFr.includes(k));
  const vides = cFr.filter((k) => cEn.has(k) && valeur(en, k) === '');
  if (manquantes.length || enTrop.length || vides.length) {
    throw new Error(`Dictionnaire anglais incomplet (src/content/ui/en.json, AD-2) :`
      + (manquantes.length ? `\n  clés absentes : ${manquantes.join(', ')}` : '')
      + (enTrop.length ? `\n  clés inconnues en français : ${enTrop.join(', ')}` : '')
      + (vides.length ? `\n  textes vides : ${vides.join(', ')}` : ''));
  }
}

/** Routes par langue (AD-3 : FR sans préfixe, EN préfixé). Une page EN absente renvoie vers l'accueil EN ou la page FR (v1). */
export const routes = {
  accueil: { fr: '/', en: '/en' },
  realisation: { fr: '/realisation', en: '/en/track-record' },
  apropos: { fr: '/a-propos', en: '/a-propos' },
  qui: { fr: '/a-propos#qui-suis-je', en: '/a-propos#qui-suis-je' },
  methode: { fr: '/a-propos#methode', en: '/a-propos#methode' },
  cible: { fr: '/a-propos#cible', en: '/a-propos#cible' },
  reseau: { fr: '/a-propos#reseau-exp', en: '/a-propos#reseau-exp' },
  vendre: { fr: '/vendre', en: '/vendre' },
  acheter: { fr: '/acheter', en: '/acheter' },
  diagnostic: { fr: '/diagnostic', en: '/diagnostic' },
  questions: { fr: '/diagnostic/questions', en: '/diagnostic/questions' },
  resultats: { fr: '/diagnostic/resultats', en: '/diagnostic/resultats' },
  contact: { fr: '/contact', en: '/contact' },
  guide: { fr: '/guide', en: '/guide' },
  mentions: { fr: '/mentions-legales', en: '/mentions-legales' },
  confidentialite: { fr: '/confidentialite', en: '/confidentialite' },
  cookies: { fr: '/cookies', en: '/cookies' },
} as const;
export type RouteKey = keyof typeof routes;
export const r = (key: RouteKey, lang: Lang = 'fr') => routes[key][lang];

/** Cible de la bascule de langue : l'équivalent s'il existe, sinon l'accueil de l'autre langue. */
export function bascule(key: RouteKey | null, vers: Lang): string {
  if (!key) return routes.accueil[vers];
  const cible = routes[key][vers];
  const autre = routes[key][vers === 'fr' ? 'en' : 'fr'];
  return cible === autre && vers === 'en' && !cible.startsWith('/en') ? routes.accueil.en : cible;
}
