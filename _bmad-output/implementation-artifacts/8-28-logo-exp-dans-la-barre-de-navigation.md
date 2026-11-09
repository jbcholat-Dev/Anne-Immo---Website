---
story: 8.28
epic: 8 — Structure et visuel
statut: review
date: 2026-11-09
---

# Story 8.28 — Logo eXp à côté du symbole dans la barre de navigation

## Objectif
Demande de JB du 2026-11-09 (capture de la barre) : « Dans la barre de navigation, il faut qu'on rajoute le logo EXP juste à côté du logo, comme c'est défini dans le design system. »

## Décision
Le design system interdisait « eXp accolé au symbole seul ». Trois options proposées à JB (carte de décision) : logo combiné complet (recommandé), symbole + eXp, eXp au bout de la barre. Choix de JB : **symbole + eXp**. Décision D-50 (`maquettes/lot-3-complet/DECISIONS.md`) ; exception écrite dans `design-system/README.md` et `design-system/brand/co-branding-exp.html`.

## Ce qui est fait
- `site/src/components/Nav.astro` : après le symbole, un trait de 1 px puis le logo eXp officiel du design system (fichiers `eXp_Logo_Black.svg` et `eXp_Logo_White.svg`, inclus tels quels, AD-17).
  - Barre claire : eXp Black. Barre sombre de l'accueil : eXp White.
  - Hauteur : 30 px ; 25 px dans la barre réduite et sur téléphone.
  - En-tête du menu plein écran du téléphone : symbole + eXp aussi.
  - Les deux fichiers eXp nomment leur couleur `cls-1` : renommée par version, sinon la seconde repeignait la première (eXp noir sur fond sombre).
- Le logo eXp n'est pas un lien ; il est annoncé « eXp France » aux lecteurs d'écran.

## Ce qui est vérifié (2026-11-09)
- Mesure au navigateur (Playwright) à 360, 390, 900, 1000, 1100, 1180, 1280 et 1440 px de large, barre normale et réduite, accueil et /vendre : aucun débordement ; au moins 47 px d'air entre le logo et les liens (1180 px, réseaux affichés).
- Couleur : eXp White sur la barre sombre de l'accueil (ordinateur et téléphone), eXp Black ailleurs.
- `npm run build` : OK. `npm run check` : 0 erreur, 0 avertissement. `scripts/liens.mjs` : 32 pages, 0 lien cassé. `scripts/ecrans.mjs` : aucun débordement signalé.

## Revue de code
À faire dans une session neuve (story 9.8).

## Ce qui reste
- Revue de code, puis accord de JB pour fusionner.
- Artefact Design System (claude.ai) : reporter l'exception D-50.
