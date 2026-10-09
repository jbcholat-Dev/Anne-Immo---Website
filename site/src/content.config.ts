import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Les collections lisent directement contenu-anne/ (la boîte de dépôt d'Anne), hors de site/.
const CONTENU = '../contenu-anne';

const vide = z.union([z.string(), z.number(), z.null()]).optional().transform((v) => (v == null || v === '' ? null : String(v)));

const temoignage = z.object({
  role: z.enum(['vendeur', 'acheteur']),
  prenom: vide,
  contexte: vide,
  citation: vide,
  portrait: vide,
});

const stories = defineCollection({
  loader: glob({ pattern: '*/fr.md', base: `${CONTENU}/stories`, generateId: ({ entry }) => entry.split('/')[0] }),
  schema: z.object({
    commune: z.string(),
    type_bien: z.string(),
    annee_vente: vide,
    delai_vente: vide,
    particularite: vide,
    // Chemin relatif au dossier de la story (« photos/x.webp », espace d'édition) ou ancien numéro de photo HD (« 6965 »).
    photo_principale: vide,
    dossier_photos: z.string().optional(),
    photos: z.array(z.union([z.string(), z.number()]).transform(String)).nullish().transform((v) => v ?? []),
    temoignages: z.array(temoignage).nullish().transform((v) => v ?? []),
    statut: z.enum(['brouillon', 'a-relire', 'publie']).default('brouillon'),
    // Plus lu par le site depuis le 2026-10-05 (story 7.14) : les accords des clients sont obtenus avant de passer en « publie ».
    autorisations: z.boolean().default(false),
  }),
});

const avis = defineCollection({
  loader: glob({ pattern: '20*.md', base: `${CONTENU}/avis-immodvisor` }),
  schema: z.object({
    id: z.string(),
    auteur: z.string(),
    date: z.coerce.date(),
    note: z.number(),
    role: z.enum(['vendeur', 'acheteur']),
    titre: z.string(),
    vente_candidate: vide,
    confiance: z.enum(['forte', 'moyenne', 'faible', 'aucun']).default('aucun'),
    story: vide,
    // Phrase mise en avant en tête de la carte d'avis (story 8.10), recopiée mot pour mot du texte de l'avis.
    phrase: vide,
    retenu: z.boolean().default(false),
  }),
});

const instantane = defineCollection({
  loader: glob({ pattern: 'instantane.md', base: `${CONTENU}/avis-immodvisor` }),
  schema: z.object({
    url_fiche: z.url(),
    note: z.number(),
    nombre_avis: z.number(),
    date_releve: z.coerce.date(),
    mention_source: z.string(),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*/fr.md', base: `${CONTENU}/pages`, generateId: ({ entry }) => entry.split('/')[0] }),
  schema: z.object({
    titre: z.string(),
    sous_titre: z.string().optional(),
    video: vide,
    // Portrait d'Anne (A-04), envoyé depuis l'espace d'édition dans contenu-anne/photos/ (story 7.16) : « photos/portrait.webp ».
    portrait: vide,
    statut: z.string().optional(),
  }),
});

// Textes des pages Accueil, Vendre, Acheter, Contact (story 7.20), modifiables par Anne dans l'espace d'édition (« Textes des pages »).
// Un fichier YAML par page dans contenu-anne/textes/. Un champ « … (téléphone) » vide reprend le texte complet.
// Un texte obligatoire vide fait échouer la construction : l'aperçu de la demande de fusion le montre avant la mise en ligne.
const texte = z.string().trim().min(1);
const fichierTextes = (page: string) => glob({ pattern: `${page}.yml`, base: `${CONTENU}/textes` });
const page = { titre: texte, description: texte, intro: texte, intro_court: vide };

const textesAccueil = defineCollection({ loader: fichierTextes('accueil'), schema: z.object({
  description: texte,
  ouverture: z.object({ ligne: texte, bouton_diagnostic: texte, bouton_diagnostic_court: vide, bouton_estimation: texte }),
  ventes: z.object({ titre: texte, lien: texte }),
  methode: z.object({
    titre: texte, lien: texte,
    piliers: z.array(z.object({ titre: texte, texte })).min(1),
    refrain: z.array(texte).min(1),
  }),
  avis: z.object({ titre: texte }),
  diagnostic: z.object({ titre: texte, texte, texte_court: vide, bouton: texte, score: texte, axes: texte, plan: texte }),
  anne: z.object({ texte, texte_court: vide, langues: texte, langues_court: vide, lien: texte }),
  parler: z.object({ titre: texte, texte, bouton_rendez_vous: texte, bouton_ecrire: texte }),
}) });
const textesVendre = defineCollection({ loader: fichierTextes('vendre'), schema: z.object({
  ...page,
  diagnostic: z.object({ titre: texte, titre_court: vide, texte, texte_court: vide, bouton: texte }),
  estimation: z.object({ titre: texte, texte, texte_court: vide, bouton: texte }),
  formulaire: z.object({ titre: texte, intro: texte }),
}) });
const bloc = z.object({ chapeau: texte, titre: texte, texte, texte_court: vide });
const textesAcheter = defineCollection({ loader: fichierTextes('acheter'), schema: z.object({
  ...page,
  bouton: texte,
  primo: bloc,
  investisseurs: bloc,
  recherche: z.object({ titre: texte, intro: texte, intro_court: vide, temps: z.array(z.object({ titre: texte, texte, texte_court: vide })).min(1) }),
  avis: z.object({ titre: texte, intro: texte, intro_court: vide }),
}) });
const textesContact = defineCollection({ loader: fichierTextes('contact'), schema: z.object({
  ...page,
  rendez_vous: z.object({ titre: texte, texte, bouton: texte }),
}) });

export const collections = { stories, avis, instantane, pages, textesAccueil, textesVendre, textesAcheter, textesContact };
