---
story: 8.27
epic: 8 — Structure et visuel
statut: review
date: 2026-11-09
---

# Story 8.27 — Les pages s'adaptent aux écrans de portable

## Objectif
Retour de JB du 2026-11-09 (capture de /vendre sur son portable, zoom 100 %) : « tout est coupé », on ne voit pas les deux cartes. À 80 % de zoom, c'est mieux. Question : « comment on fait pour que l'utilisateur n'ait pas à dézoomer ? »

## Cause
Ce n'est pas un réglage du PC. Le portable de JB affiche à 150 % (réglage Windows courant) : le navigateur voit un écran de 1280 × 630. Le site est dessiné pour 1440 × 900 (maquette), avec des tailles fixes : titres de 72 à 84 px, espaces de 88 à 120 px. Sur 630 px de haut, le premier écran n'est presque que le titre.

## Ce qui est fait
- `site/src/styles/global.css` : nouveau réglage `--px-h`, un « pixel qui suit la hauteur de l'écran ». Il vaut 1px sur un écran de 800 px de haut ou plus, et sur téléphone. Sur ordinateur moins haut, il descend avec la hauteur, jusqu'à 0,7px (0,79px en 1280 × 630).
- 117 valeurs dans 31 fichiers (pages et composants, hors ouverture de l'accueil, story 8.26) passent de `84px` à `calc(84 * var(--px-h))` : les tailles de titres de 36 px et plus, et les espaces verticaux de 48 px et plus. Seules les règles de base (ordinateur) sont touchées ; les règles téléphone restent telles quelles.
- Le texte courant, les boutons et la barre de navigation ne changent pas : la lecture reste confortable.
- Écart avec la maquette noté dans `site/README.md`.

## Ce qui est vérifié (2026-11-09)
- Captures de 13 pages (accueil, vendre, acheter, à propos, contact, réalisations, diagnostic, guide, partenaires, actualités, ambassadeurs, honoraires, track-record) avant et après :
  - 1440 × 900 et 1920 × 1080 : 26 captures identiques au pixel près.
  - Téléphone 390 × 664 : 13 captures identiques au pixel près.
  - 1280 × 630 : titres et espaces réduits d'environ 20 %. Sur /vendre, les deux cartes et leurs boutons apparaissent dans le premier écran ; sur /contact, le bouton « Voir les créneaux d'Anne » aussi.
- `npm run build` : OK. `npm run check` : 0 erreur, 0 avertissement. `scripts/liens.mjs` : 32 pages, 0 lien cassé. `scripts/ecrans.mjs` : aucun débordement signalé.

## Revue de code
À faire dans une session neuve (story 9.8).

## Ce qui reste
- Revue de code, puis accord de JB pour fusionner (PR n° 260, avec la story 8.26).
- Règle pour la suite : tout nouveau grand titre ou grand espace s'écrit en `calc(N * var(--px-h))`.
