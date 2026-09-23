# Plan d'implémentation — site v1 (branche `site-v1`)

Écrit le 2026-09-22 avant de construire. Sources lues en entier : maquette lot 3 (61 artboards), README/DECISIONS/REVUE, structure-site v5, brief scroll-craft, spine d'architecture, SPEC v5, quiz-contenu + quiz-conception, design-system, contenu-anne.

## Périmètre v1
Build **statique** Astro 7 (pas d'adaptateur Cloudflare, pas de backend) : 11 pages FR + `/en/` (accueil, index Réalisation), 404, nav/footer conformes D-2/D-17/D-21, pile collante D-16, diagnostic complet en îlot client (scoring côté client, gate simulé), formulaires simulés, Cal.com en gabarit statique.

## Structure
```
site/
  package.json · astro.config.mjs · tsconfig.json
  scripts/images.mjs          # sharp : dérive WebP/JPG depuis contenu-anne (commité : public/img + src/data/images.json)
  scripts/verif.mjs           # Playwright : captures 1440 / 390 dans .verif/
  src/
    content.config.ts         # collections : stories, avis, pages (loaders glob → ../contenu-anne)
    content/ui/{fr,en}.json   # dictionnaire d'interface (nav, footer, accueil)
    content/diagnostic/       # questions.json (17 écrans, ids q01…), bareme.json, feedbacks.json
    config/site.ts            # identité, réseaux, choix des avis de l'accueil / d'Acheter, liaisons avis→story assumées
    styles/tokens.css (copie de design-system) · global.css · components CSS par composant
    layouts/Base.astro · Page.astro (nav + footer) · Quiz.astro (nav masquée)
    components/ Nav, Footer, Hero, BandePreuve, Pile, Methode, Avis, DiagnosticTeaser, Anne, Fermeture,
                StoryCard, Picture, Placeholder, Bouton, Champ, Lockup, Logo, Icones…
    islands/ scroll-craft.ts · diagnostic.ts · formulaires.ts · nav.ts
    pages/ index, realisation/index, realisation/[slug], a-propos, vendre, acheter, diagnostic/{index,questions,resultats},
           contact, guide, mentions-legales, confidentialite, cookies, 404, en/index, en/track-record
  .verif/                     # captures Playwright (preuve)
  README.md                   # lancer, réel vs placeholder, TODO(backend), écarts assumés
```

## Ordre de construction (commits) — tout est fait (2026-09-23), voir README.md « Vérification faite »
1. ✅ Scaffold Astro + tokens + fonts + layouts + Nav/Footer (fixe dès le 1er pixel, réduite au scroll, menu À propos, menu mobile accordéon).
2. ✅ Script images + collections + config (avis, stories) → Accueil complet (hero vidéo/poster, bande Klein, pile 6 cartes, méthode + refrain, avis, diagnostic, Anne, fermeture).
3. ✅ Réalisation index + fiche story (2 témoignages / 1 / 0 → A-07), 404, légal (3 pages).
4. ✅ À propos (ancres, repère collant, sans vidéo A-15), Vendre (2 portes + formulaire estimation), Acheter (+ avis acheteurs + formulaire contact préréglé), Contact (Cal.com gabarit + formulaire), Guide.
5. ✅ Diagnostic : landing, 17 écrans (3 gabarits, reprise localStorage, abandon), gate, résultats (profils D-23, 9 feedbacks, sorties A/B, états guide/expiré).
6. ✅ EN : accueil + index Track record (état vide, aucune story traduite), bascule FR/EN.
7. ✅ Vérification : `npm run build`, chaque page, chaque lien, diagnostic de bout en bout, captures Playwright 1440/390 → README final.

## Décisions prises ici (à lister dans le README)
- Avis de l'accueil : Alexandra V. (vendeuse, reliée à `appartement-cascade-2024`, confiance moyenne → **liaison assumée, à confirmer par Anne**), JcbAnthy (vendeur), Rémi (acheteur). Acheter : RHL (acheteur) + JamesW.
- Bande preuve : 5/5 · 18 avis (instantané du 22/09), extrait d'Alexandra V.
- Cartes 4-6 de la pile : ventes réelles du registre sans story rédigée (Sciez villa 2025, Essert-Romand chalet 2026, Anthy T3 2024), photo = bloc galet « Actif attendu A-02 », libellé « Story à venir », citation de l'avis rapproché quand la confiance est forte.
- Q10 : matrice visites × offres documentée dans `bareme.json` (barème non tranché, SPEC Open Questions).
- Q2 diagnostics (3 options live vs 4 conception) : « Certains diagnostics à refaire » = 5 pts ; Q5 « +vidéo » = 10 comme « +visite virtuelle ».
- Sortie A = score ≥ 71 ET Q14 premium ET Q12 ≠ « minimiser les frais » (CAP-7).
- Pas de Lenis en v1 (JS minimal, mouvement réduit natif) — écart assumé au brief scroll-craft.
- Gate côté client (TODO backend : AD-5, jeton serveur).
