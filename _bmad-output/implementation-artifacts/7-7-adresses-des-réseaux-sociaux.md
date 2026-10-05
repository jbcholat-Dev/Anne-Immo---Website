---
story: 7.7
epic: 7 — Contenu d'Anne
statut: in-progress
date: 2026-10-04
---

# Story 7.7 — Adresses des réseaux sociaux

## Objectif
Que les icônes de réseaux mènent aux profils d'Anne et non à l'accueil des plateformes.

## Ce qui est fait
- Gabarit `_gabarits/identite.md` : trois lignes ajoutées, `url_instagram`, `url_youtube`, `url_linkedin` ; mêmes lignes dans `legal/identite.md`.

## Vérification
`npm run build` : 19 pages, aucune erreur · `npm run check` : 0 erreur · `node scripts/liens.mjs` : 1 128 liens, 0 cassé · `npm run verif` : captures 1440 et 390 dans `site/.verif/`.

## Ce qui reste
- Anne : les trois adresses, ou « pas de profil ».
- Claude : les reporter dans `reseaux` de `site/src/config/site.ts`, faire disparaître un réseau sans profil, retirer la ligne « Réseaux sociaux » de `site/README.md`.
