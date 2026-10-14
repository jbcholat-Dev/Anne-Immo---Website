---
story: 8.19
epic: 8 — Site : finitions
statut: done
date: 2026-10-12
origine: retour de JB du 2026-10-12 (capture sur iPhone, site en production) — « Il faut qu'on déplace les boutons vers le bas de l'écran pour éviter cet effet » (les boutons couvraient le visage d'Anne dans la vidéo)
---

# Story 8.19 — Boutons de l'ouverture en bas sur téléphone

## Objectif
Sur téléphone, les boutons « Faire le point sur votre vente » et « Estimation offerte » tombaient sur le visage d'Anne dans la vidéo d'ouverture. Les poser en bas de l'écran.

## Ce qui est fait
- `site/src/components/accueil/Hero.astro`, sous 900 px seulement :
  - l'ouverture prend la hauteur de l'écran visible (`100svh`, entre 560 et 860 px ; 780 px si le navigateur ne connaît pas `svh`) ;
  - le nom, la signature et la ligne restent en haut ;
  - les deux boutons sont posés en bas (28 px du bord), l'un sous l'autre, sur toute la largeur.
- Ordinateur : inchangé.

## Vérification (2026-10-12)
- `npm run build` : sans erreur. `npm run check` : 0 erreur.
- `node scripts/liens.mjs` : 27 pages, 1 759 liens, 0 cassé.
- `node scripts/ecrans.mjs` : aucun débordement ni bouton trop petit.
- Captures à 375 × 667 (taille de l'iPhone de JB), 390 × 844 et 360 × 740, à 1,5 s et 5 s de vidéo : visage dégagé, boutons au-dessus du bas de l'écran ; 1 440 × 900 inchangé.

## Ce qui reste
- Rien. À revoir sur le téléphone de JB une fois en ligne.
