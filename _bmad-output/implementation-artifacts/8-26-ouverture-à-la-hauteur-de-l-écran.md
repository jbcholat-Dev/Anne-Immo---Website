---
story: 8.26
epic: 8 — Structure et visuel
statut: done
date: 2026-11-09
---

# Story 8.26 — L'ouverture de l'accueil tient dans l'écran d'un portable

## Objectif
Retour de JB du 2026-11-09 (capture sur un portable, Chrome, Windows à 150 %) : à l'ouverture de annevialtissot.fr, le nom « Anne VIAL-TISSOT » est coupé en bas et les deux boutons sont invisibles. Le texte doit s'adapter pour ne pas finir au milieu de l'écran.

Décision de JB du même jour (14 h 51), après une première version où l'ouverture et la bande des avis Immodvisor remplissaient ensemble l'écran : « on garde que la vidéo, comme ça, c'est clair quand on arrive sur l'écran ». L'ouverture remplit donc seule l'écran ; la bande des avis vient juste en dessous.

## Cause
Sur ordinateur, l'ouverture avait une hauteur fixe de 900 px (maquette D-1), avec le texte posé à 84 px du bas. Un portable n'en montre que 520 à 750 px (par exemple 1280 × 630 pour un écran 1920 × 1080 à 150 %). Le texte, en bas des 900 px, sortait de l'écran.

## Ce qui est fait
- Ordinateur (900 px de large et plus) : l'ouverture fait la hauteur de l'écran visible (`100svh`, `100vh` en repli), 440 px au moins.
- Le texte suit la hauteur de l'écran (`--h-ouv`) : nom de 52 à 96 px, ligne de 16 à 19 px, écarts et marge du bas en proportion. Il reste posé en bas de l'image, jamais au milieu.
- Téléphone : inchangé (story 8.19, l'ouverture prend déjà la hauteur de l'écran).
- Fichier : `site/src/components/accueil/Hero.astro`. Écart avec la maquette noté dans `site/README.md`.

## Ce qui est vérifié (2026-11-09)
- Mesure au navigateur (Playwright) sur 12 tailles, avant et après. Critère : nom sous la barre de navigation, boutons dans l'écran, ouverture = hauteur de l'écran.
  - Avant : 7 tailles d'ordinateur sur 9 en échec (boutons à 816 px du haut sur un écran de 630 px).
  - Après : 12 sur 12 conformes. Exemples : 1280 × 630, nom 69 px, boutons à 570 px ; 1280 × 520, nom 57 px ; 1920 × 960 et plus, nom 96 px ; 900 × 600, nom 66 px.
  - Téléphones 390 × 664, 360 × 640, 375 × 553 : identiques à avant.
- `npm run build` : OK. `npm run check` : 0 erreur, 0 avertissement. `scripts/liens.mjs` : 32 pages, 0 lien cassé. `scripts/ecrans.mjs` : aucun débordement signalé.
- Note technique : les unités `cqh` (hauteur du bloc) valent 0 dans Chrome quand la hauteur vient de la mise en page flex ; écartées.

## Revue de code
2026-11-09, PR n° 260, commit 7152b64 (première version : ouverture + bande des avis), `bmad-code-review` dans une session neuve (mesures Playwright de 640 × 400 à 3840 × 2160, FR et EN) : rien de bloquant.
- Mineur : le repli en `vh` pour les navigateurs sans `svh` (Safari < 15.4, Chrome < 108) ne marchait pas, la variable en `svh` l'écrasait toujours → corrigé (commit suivant) : la valeur en `svh` n'est déclarée que sous `@supports (height: 100svh)`.
- Bande des avis de 124 px entre 900 et 1024 px de large (100 px supposés) : sans objet depuis la décision de JB (vidéo seule).
- Très grands écrans : l'ouverture grandit sans limite (1340 px en 2560 × 1440) : écarté, c'est la demande de JB (l'ouverture remplit l'écran) ; un plafond reste possible s'il le souhaite.
- Largeur entre 899 et 900 px (zoom) : écarté, découpage déjà présent dans tout le site.
- Écrans très bas : écarté, comportement voulu (ouverture de 440 px au moins, nom et boutons visibles).
- La version finale (vidéo seule) ne change que la hauteur de l'ouverture et retire l'enveloppe : mêmes règles de texte, remesurée sur 12 tailles.
- Limite : Safari non testé (moteur absent du conteneur).

## Ce qui reste
- Accord de JB pour fusionner : donné le 2026-11-09 à 16 h 04.

- Fusion : PR n° 260 fusionnée le 2026-11-09 (commit 8e7ce02) sur l'accord de JB.
