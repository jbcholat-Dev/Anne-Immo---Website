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
    autorisations: z.boolean().default(false),
  }).transform((d, ctx) => {
    // Règle 3 de contenu-anne/README.md (story 7.9) : rien ne part en ligne sans accord écrit.
    // Une fiche « publie » sans autorisations est ramenée à « a-relire » (donc absente du site public),
    // au lieu de bloquer toute la construction : un clic dans l'espace d'édition ne doit pas casser l'aperçu (story 7.13).
    if (d.statut === 'publie' && !d.autorisations) {
      console.warn(`⚠ story « ${d.commune} » en « publie » sans « autorisations: true » : traitée comme « a-relire », absente du site public`);
      return { ...d, statut: 'a-relire' as const };
    }
    return d;
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
    statut: z.string().optional(),
  }),
});

export const collections = { stories, avis, instantane, pages };
