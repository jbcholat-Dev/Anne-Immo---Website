/** Identité (AD-13 : source unique du pied de page, des mentions légales, des données structurées). */
export const identite = {
  nom: 'Anne VIAL-TISSOT',
  nomCourt: 'Anne Vial-Tissot',
  statut: 'agent commercial indépendant en immobilier, mandataire du réseau eXp France',
  zone: 'Chablais et bassin lémanique',
  langues: ['Français', 'English', 'Español', 'Português'],
  rsac: null as string | null,          // A-13 attendu
  cartePro: null as string | null,      // A-13 attendu
  hebergeur: null as string | null,     // A-13 attendu
  telephone: null as string | null,     // A-13 attendu
  email: null as string | null,         // A-13 attendu
  immodvisor: 'https://www.immodvisor.com/professionnels/mandataire-immobilier/pro/exp-france-anne-vial-tissot-70511',
};

/** Réseaux sociaux — TODO(contenu) : URLs des profils d'Anne (pas encore fournies). Liens vers les plateformes en attendant. */
export const reseaux = [
  { id: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/' },
  { id: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/' },
  { id: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/' },
] as const;

/** Choix éditoriaux de la v1 (point ouvert 4, D-9) — à confirmer par Anne (voir README). */
export const accueil = {
  /** Les 3 avis Immodvisor entiers de « Ils ont travaillé avec Anne » : 2 vendeurs + 1 acheteur, le premier relié à une story. */
  avis: ['2025-01-14-alexandra-v', '2024-07-20-jcbanthy', '2025-01-13-remi'],
  /** L'extrait court de la bande preuve (§ 1.2) : une phrase d'un avis, attribuée. */
  extrait: { avis: '2025-01-14-alexandra-v', phrase: "Elle est une professionnelle de qualité, qui traite l'entier du dossier avec sérieux et rigueur durant toutes les étapes du projet." },
  /** Cartes 4 à 6 de la pile : ventes réelles du registre (_suivi-stories.md) sans story rédigée. Photo = bloc réservé A-02. */
  aVenir: [
    { slug: 'sciez-villa-2025', commune: 'Sciez-sur-Léman', type: 'Villa', annee: 2025, avis: '2026-09-10-isalinep' },
    { slug: 'essert-romand-chalet-2026', commune: 'Essert-Romand', type: 'Chalet', annee: 2026, avis: '2026-08-30-sabine-francois' },
    { slug: 'anthy-t3-2024', commune: 'Anthy-sur-Léman', type: 'Appartement', annee: 2024, avis: '2024-07-20-jcbanthy' },
  ],
};

/**
 * Liaisons avis → story assumées pour la v1 quand le champ `story` de la fiche d'avis est vide
 * (rapprochement de confiance moyenne ou forte dans la fiche). Anne confirme en remplissant `story` ; ce tableau est alors ignoré.
 */
export const liaisonsAssumees: Record<string, string> = {
  '2025-01-14-alexandra-v': 'appartement-cascade-2024',   // « projet vente et achat » = la vente en cascade de Thonon
  '2024-09-09-rhl-achat': 'auberge-decoupee-2024',        // acheteur de l'auberge divisée (Armoy)
};

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
