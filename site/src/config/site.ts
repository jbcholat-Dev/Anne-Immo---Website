/** Identité (AD-13 : source unique du pied de page, des mentions légales, des données structurées). */
export const identite = {
  nom: 'Anne VIAL-TISSOT',
  nomCourt: 'Anne Vial-Tissot',
  statut: 'agent commercial indépendant en immobilier, mandataire du réseau eXp France',
  zone: 'Chablais et bassin lémanique',
  langues: ['Français', 'English', 'Español', 'Português'],
  rsac: '977 986 264' as string | null, // = SIREN (immatriculation du 2023-09-01, annuaire des entreprises) ; à confirmer par Anne sur son attestation RSAC
  greffe: 'Thonon-les-Bains' as string | null, // greffe compétent pour Sciez (déduit) ; à confirmer par Anne
  cartePro: null as string | null,      // A-13 attendu
  hebergeur: 'Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, États-Unis · +1 650 319 8930 · www.cloudflare.com' as string | null, // choisi par l'architecture (story 7.6), à relire par JB
  telephone: null as string | null,     // A-13 attendu
  email: null as string | null,         // A-13 attendu
  adresse: '812 chemin de la Tatte, 74140 Sciez' as string | null, // siège de l'entreprise (SIRET 977 986 264 00017), mentions légales seulement
  immodvisor: 'https://www.immodvisor.com/professionnels/mandataire-immobilier/pro/exp-france-anne-vial-tissot-70511',
};

/** Réseaux sociaux (story 7.7) : un réseau sans adresse de profil n'est affiché nulle part (avant le 2026-10-10, un lien vers la plateforme le remplaçait). Adresses à reporter depuis `contenu-anne/legal/identite.md`. */
const tousReseaux: { id: 'instagram' | 'youtube' | 'linkedin'; label: string; url: string | null }[] = [
  { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/anne_vialtissot/' },
  { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@AnneImmo74' },
  { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/avialtissot/' },
];
export const reseaux = tousReseaux.filter((s): s is typeof s & { url: string } => !!s.url);

/** Site public (réglage PUBLIC_INDEXATION = « oui », story 9.2) : rien de ce qui sert à relire l'aperçu n'y apparaît. */
export const sitePublic = import.meta.env.PUBLIC_INDEXATION === 'oui';

// Garde-fou de lancement (story 12.5) : les mentions légales exigent les coordonnées A-13 ; le site public ne se construit pas sans elles.
if (sitePublic) {
  const manquent = (['rsac', 'greffe', 'cartePro', 'adresse', 'telephone', 'email'] as const).filter((k) => !identite[k]);
  if (manquent.length) throw new Error(`Lancement refusé : coordonnées légales manquantes (${manquent.join(', ')}), à reporter depuis contenu-anne/legal/identite.md dans src/config/site.ts.`);
}

/** Choix éditoriaux de la v1 (point ouvert 4, D-9) — à confirmer par Anne (voir README). */
export const accueil = {
  /** Les 3 avis Immodvisor entiers de « Ils ont travaillé avec Anne » : 2 vendeurs + 1 acheteur, le premier relié à une story. */
  avis: ['2025-01-14-alexandra-v', '2024-07-20-jcbanthy', '2025-01-13-remi'],
  /** L'extrait court de la bande preuve (§ 1.2) : une phrase d'un avis, attribuée. */
  extrait: { avis: '2025-01-14-alexandra-v', phrase: "Elle est une professionnelle de qualité, qui traite l'entier du dossier avec sérieux et rigueur durant toutes les étapes du projet." },
  /** Complément de la pile (six cartes, D-16) : ventes réelles du registre (_suivi-stories.md) sans story rédigée. Photo = bloc réservé A-02. Une vente dont la story existe est ignorée. */
  aVenir: [
    { slug: 'sciez-villa-2025', commune: 'Sciez-sur-Léman', type: 'Villa', annee: 2025, avis: '2026-09-10-isalinep' },
  ],
};

/**
 * Liaisons avis → story assumées quand le champ `story` de la fiche d'avis est vide.
 * Vide depuis le 2026-10-05 (story 7.14) : les liaisons vivent dans le champ `story` de chaque avis, modifiable dans l'espace d'édition.
 */
export const liaisonsAssumees: Record<string, string> = {};

/** Page Acheter, § 5.4 : un ou deux avis d'acheteurs. */
export const acheter = { avis: ['2024-09-09-rhl-achat', '2026-08-24-jamesw'] };

/** Phrase d'Anne par story pour la pile (§ 1.3 : « une phrase extraite du récit d'Anne ») — extraite telle quelle du récit. */
export const phrasesStories: Record<string, string> = {
  'appartement-cascade-2024': "De plusieurs mois sans offre à une vente en cascade réussie. C'est une question de stratégie commerciale, puis d'orchestration complexe.",
  'auberge-decoupee-2024': "Ne pas chercher l'acheteur, mais créer les conditions stratégiques pour qu'il existe.",
  'maison-premium-2025': "Avec tous ces services, le prix a été repositionné. Non pas baissé — justifié maintenant par une stratégie complète.",
};

/** Accroche courte par story pour l'index Réalisation (dérivée de la particularité du front matter). */
export const hero = {
  /** Poster du hero (A-14) = première image de la vidéo d'ouverture A-01 (D-27), produite par `npm run video` : pas de saut visuel au démarrage. */
  poster: 'photos/ouverture-poster',
  posterAlt: 'Anne, debout dans un pré du Chablais, les montagnes derrière elle, s’adresse au visiteur',
};
