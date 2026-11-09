---
story: 8.26
epic: 8 — Structure et visuel
statut: review
date: 2026-11-09
---

# Story 8.26 — L'ouverture de l'accueil tient dans l'écran d'un portable

## Objectif
Retour de JB du 2026-11-09 (capture sur un portable, Chrome, Windows à 150 %) : à l'ouverture de annevialtissot.fr, le nom « Anne VIAL-TISSOT » est coupé en bas et les deux boutons sont invisibles. JB précise : l'ouverture doit descendre jusqu'au bas de la bande des avis Immodvisor, et la taille du texte doit s'adapter pour ne pas finir au milieu de l'écran.

## Cause
Sur ordinateur, l'ouverture avait une hauteur fixe de 900 px (maquette D-1), avec le texte posé à 84 px du bas. Un portable n'en montre que 520 à 750 px (par exemple 1280 × 630 pour un écran 1920 × 1080 à 150 %). Le texte, en bas des 900 px, sortait de l'écran.

## Ce qui est fait
- Ordinateur (900 px de large et plus) : l'ouverture et la bande des avis sont enveloppées dans `.ouverture-ecran` (pages d'accueil FR et EN). Cette enveloppe fait la hauteur de l'écran visible ; l'ouverture prend ce qui reste au-dessus de la bande (au moins 440 px). La bande des avis touche donc le bas de l'écran.
- Le texte suit la hauteur de l'ouverture : nom de 52 à 96 px, ligne de 16 à 19 px, écarts et marge du bas en proportion. Il reste posé en bas de l'image, jamais au milieu.
- Téléphone : inchangé (story 8.19, l'ouverture prend déjà la hauteur de l'écran).
- Fichiers : `site/src/components/accueil/Hero.astro`, `site/src/styles/global.css`, `site/src/pages/index.astro`, `site/src/pages/en/index.astro`. Écart avec la maquette noté dans `site/README.md`.

## Ce qui est vérifié (2026-11-09)
- Mesure au navigateur (Playwright) sur 12 tailles, avant et après. Critère : nom sous la barre de navigation, boutons dans l'écran, bande des avis entière dans l'écran.
  - Avant : 7 tailles d'ordinateur sur 9 en échec (boutons à 816 px du haut sur un écran de 630 px).
  - Après : 12 sur 12 conformes. Exemples : 1280 × 630, nom 58 px, boutons à 479 px, bande en bas à 630 px ; 1920 × 960, nom 95 px ; 2560 × 1300, nom 96 px ; 900 × 600, nom 55 px.
  - Seule exception voulue : 1280 × 520 (Windows à 175 %), l'ouverture garde 440 px au minimum et la bande des avis commence sous l'écran ; nom et boutons restent visibles.
  - Téléphones 390 × 664, 360 × 640, 375 × 553 : identiques à avant.
- `npm run build` : OK. `npm run check` : 0 erreur, 0 avertissement. `scripts/liens.mjs` : 32 pages, 0 lien cassé. `scripts/ecrans.mjs` : aucun débordement signalé.
- Note technique : les unités `cqh` (hauteur du bloc) valent 0 dans Chrome quand la hauteur vient de la mise en page flex ; la taille du texte se calcule donc sur la hauteur de l'écran moins 100 px (hauteur de la bande des avis).

## Revue de code
À faire dans une session neuve (story 9.8) avant de proposer la PR à JB.

## Ce qui reste
- Revue de code, puis accord de JB pour fusionner (PR qui change le site).
