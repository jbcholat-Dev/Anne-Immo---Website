---
story: 7.8
epic: 7 — Contenu d'Anne
statut: in-progress
date: 2026-10-04
---

# Story 7.8 — Guide « 10 erreurs » PDF à la charte

## Objectif
Qu'Anne puisse corriger le guide sans ouvrir Gamma, pour que JB et Claude refassent le PDF à la charte.

## Ce qui est fait
- `contenu-anne/guide/texte-actuel.md` : texte complet du guide relevé dans Gamma le 2026-10-04 (identique à la page Notion de 2025), en texte simple, avec un repère « ⚠️ à vérifier » sur chaque chiffre sans source et chaque « cas réel ».
- `contenu-anne/guide/corrections.md` : les trois questions à trancher (un guide ou un par profil, les chiffres, les cas réels).
- Constat : les « cas réels » du guide et des e-mails racontent les mêmes histoires avec des lieux et dates différents (véranda : Armoy 2023 dans le guide, Évian 2024 dans l'e-mail du J+9).

## Vérification
`npm run build` : 19 pages, aucune erreur · `npm run check` : 0 erreur · `node scripts/liens.mjs` : 1 128 liens, 0 cassé · `npm run verif` : captures 1440 et 390 dans `site/.verif/`.

## Ce qui reste
- Anne : corrections et réponses.
- JB : choisir l'outil de production du PDF.
- JB et Claude : produire le PDF, puis la couverture A-10 sur le site.
