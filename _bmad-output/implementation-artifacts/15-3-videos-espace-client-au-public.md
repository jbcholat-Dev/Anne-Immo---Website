---
story: 15.3
epic: 15 — Portail des vendeurs sous mandat (vaut aussi pour la vidéo acheteurs de l'epic 16)
statut: done
date: 2026-10-15
origine: JB, 2026-10-15 : « je veux qu'elles soient sur le main » (fil « Vidéo de l'espace vendeur »)
---

# Story 15.3 — Vidéos de l'espace client sur le site public

## Objectif
Montrer sur annevialtissot.fr les deux vidéos des stories 15.2 (Vendre) et 16.2 (Acheter), jusque-là limitées à l'aperçu.

## Ce qui est fait
- `src/pages/vendre.astro` et `acheter.astro` : la condition `!sitePublic` qui cachait les blocs au public est retirée.
- `site/README.md` mis à jour (tableau des pages, § « Vidéos de l'espace client »).

## Choix et risques assumés
- Recommandation de Claude (attendre que l'espace client existe) écartée par JB : le site montre un service en préparation. Garde-fous : « Maquette · exemple fictif » à l'écran pendant la vidéo, note « L'espace est en préparation » sous chaque bloc.
- Textes pas encore relus par Anne (action du tableau de bord) : une correction passera par l'espace d'édition (textes du bloc) ou par Claude (textes de la vidéo).

## Vérification (2026-10-15)
- `npm run build` (aussi en mode public : les deux vidéos sont dans `vendre.html` et `acheter.html`), `npm run check` (0 erreur), `node scripts/liens.mjs` (0 lien cassé).
- PR #151 fusionnée le 2026-10-15 (commit 823bc54) après construction Cloudflare au vert. Contrôle en ligne : https://annevialtissot.fr/vendre contient `portail-vendeur`, https://annevialtissot.fr/acheter contient `portail-acheteur`, `/video/portail-vendeur.mp4` et `/video/portail-acheteur-poster.jpg` répondent 200.

## Ce qui reste
- Relecture d'Anne.
