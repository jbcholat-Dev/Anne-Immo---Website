import { getEntry, type CollectionEntry } from 'astro:content';
import { t, type Lang, type Dico } from '../i18n';

/**
 * Textes des pages Accueil, Vendre, Acheter, Contact (story 7.20), lus dans contenu-anne/textes/<page>.yml,
 * que l'espace d'édition modifie (collection « Textes des pages »). Seul le français est concerné : l'anglais reste dans en.json.
 */
type Pages = { accueil: 'textesAccueil'; vendre: 'textesVendre'; acheter: 'textesAcheter'; contact: 'textesContact' };
const collections: Pages = { accueil: 'textesAccueil', vendre: 'textesVendre', acheter: 'textesAcheter', contact: 'textesContact' };

export async function textes<P extends keyof Pages>(page: P): Promise<CollectionEntry<Pages[P]>['data']> {
  const e = await getEntry(collections[page], page);
  if (!e) throw new Error(`Textes introuvables : contenu-anne/textes/${page}.yml`);
  return e.data as CollectionEntry<Pages[P]>['data'];
}

/** Version téléphone d'un texte : la version courte d'Anne, sinon le texte complet. */
export const court = (courte: string | null | undefined, complet: string) => courte ?? complet;

export type Pilier = { titre: string; texte: string };

/**
 * Dictionnaire de l'accueil : en français, les textes d'Anne remplacent ceux de fr.json, qui ne sert plus que de liste de clés
 * pour l'anglais (AD-2) et pour les libellés techniques (« / 5 · », emplacements réservés).
 */
export async function dicoAccueil(lang: Lang): Promise<Dico & { piliers: Pilier[] | null; refrain: string[] | null }> {
  const d = t(lang);
  if (lang !== 'fr') return { ...d, piliers: null, refrain: null };
  const x = await textes('accueil');
  return {
    ...d,
    accueil: {
      ...d.accueil,
      description: x.description,
      hero_ligne: x.ouverture.ligne,
      hero_cta: x.ouverture.bouton_diagnostic,
      hero_cta_m: court(x.ouverture.bouton_diagnostic_court, x.ouverture.bouton_diagnostic),
      hero_estimation: x.ouverture.bouton_estimation,
      ventes_titre: x.ventes.titre,
      ventes_lien: x.ventes.lien,
      methode_titre: x.methode.titre,
      methode_lien: x.methode.lien,
      avis_titre: x.avis.titre,
      diag_titre: x.diagnostic.titre,
      diag_texte: x.diagnostic.texte,
      diag_texte_m: court(x.diagnostic.texte_court, x.diagnostic.texte),
      diag_cta: x.diagnostic.bouton,
      diag_score: x.diagnostic.score,
      diag_axes: x.diagnostic.axes,
      diag_plan: x.diagnostic.plan,
      anne_texte: x.anne.texte,
      anne_texte_m: court(x.anne.texte_court, x.anne.texte),
      anne_langues: x.anne.langues,
      anne_langues_m: court(x.anne.langues_court, x.anne.langues),
      anne_lien: x.anne.lien,
      parler_titre: x.parler.titre,
      parler_texte: x.parler.texte,
      parler_rdv: x.parler.bouton_rendez_vous,
      parler_ecrire: x.parler.bouton_ecrire,
    },
    piliers: x.methode.piliers,
    refrain: x.methode.refrain,
  };
}
