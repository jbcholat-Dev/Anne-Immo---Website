---
story: 8.20
epic: 8 — Structure et visuel
statut: review
date: 2026-10-13
---

# Story 8.20 — Ligne signature sous le nom de famille (ticket n° 143)

## Objectif
Retour d'Anne du 2026-10-13 sur l'accueil (bouton « Un retour ? », ticket n° 143) : « le surlignement est sur Anne et pas sur VIAL-TISSOT ». Dans le logo, le trait terracotta souligne le nom de famille ; sur le site, il partait sous le prénom.

## Ce qui est fait
- Accueil : la ligne signature est rangée dans le nom « VIAL‑TISSOT » et en prend la largeur, sur ordinateur comme sur téléphone (où le nom est seul sur sa ligne).
- À propos : même règle sous « Anne Vial‑Tissot ».
- Le symbole du trait (`Sprite.astro`) s'étire à la largeur voulue sans s'épaissir (tracé à épaisseur constante).
- Décision D-45 notée dans `maquettes/lot-3-complet/DECISIONS.md`.

## Ce qui est vérifié (2026-10-13)
- Défaut reproduit sur le site en ligne à 1440 × 731, l'écran d'Anne (`/mnt/project-files/tickets/logo-143/avant-accueil.png`).
- `npm run build` OK ; `npm run check` : 0 erreur ; liens : 27 pages, 1 863 liens, 0 cassé ; `scripts/ecrans.mjs` : aucun signalement.
- Captures après correction, accueil et À propos, ordinateur et téléphone : `/mnt/project-files/tickets/logo-143/`.

## Ce qui reste
Fusion par JB, puis fermeture du ticket n° 143 en citant le commit.
