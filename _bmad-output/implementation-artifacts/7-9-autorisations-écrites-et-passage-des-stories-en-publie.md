---
story: 7.9
epic: 7 — Contenu d'Anne
statut: in-progress
date: 2026-10-04
---

# Story 7.9 — Autorisations écrites et passage des stories en « publie »

## Objectif
Que rien ne parte en ligne sans accord écrit.

## Ce qui est fait
- Garde-fou dans `site/src/content.config.ts` (collection `stories`) : une story en `statut: publie` sans `autorisations: true` fait échouer la construction du site, avec un message qui dit quoi faire.
- Essai : `auberge-decoupee-2024` passée temporairement en `publie` → la construction s'arrête sur « story en « publie » sans « autorisations: true » » ; fichier remis en l'état.
- Liste de ce qu'Anne doit réunir : `contenu-anne/A-FOURNIR.md` § 1.

## Vérification
`npm run build` : 19 pages, aucune erreur · `npm run check` : 0 erreur · `node scripts/liens.mjs` : 1 128 liens, 0 cassé · `npm run verif` : captures 1440 et 390 dans `site/.verif/`.

## Ce qui reste
- Anne : témoignages, accords écrits, année de vente d'Allinges, `story:` et `retenu:` dans les avis, statuts.
- Claude, avant la mise en ligne publique : filtre `statut === 'publie' && autorisations` dans `stories()` (`site/src/lib/contenu.ts`). Pas posé maintenant : il viderait l'aperçu, qu'Anne et JB regardent plein.
