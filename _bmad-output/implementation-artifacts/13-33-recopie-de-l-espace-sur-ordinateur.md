---
story: 13.33
epic: 13 — Espace de travail d'Anne
statut: review
date: 2026-10-26
maj: 2026-10-26
---

# Story 13.33 — Recopie de l'espace en ligne dans la maquette, sur ordinateur

## Objectif
Demande de JB (2026-10-26) : « recrée une version à l'identique de ce qui est aujourd'hui publié » dans la maquette, et seulement en version ordinateur : l'espace servira principalement, voire uniquement, sur ordinateur. La refonte part de cette copie.

## Ce qui est fait
- Script `espace/scripts/maquette-espace.mjs` : démarre le site et l'espace sur la base locale (comme `e2e-espace.mjs`), y range des contacts fictifs (vendeurs à chaque étape, deux acheteurs, un en sommeil, un perdu, deux prescripteurs, deux passages de boîtage, deux actions marketing), ouvre chaque page à 1440 px de large et l'enregistre en écran de maquette (HTML rendu et feuilles de style de l'espace, sans les scripts ni le bouton « Un retour ? »). Les liens du menu mènent à l'écran correspondant.
- Maquette https://claude.ai/artifact/RKkZ5qPnxdkwaDz4drrZLs passée en v4 : 17 écrans rangés en cinq rangées (le quotidien, après un appel, le lundi, le réseau, les outils). Les écrans téléphone de la v3 sont retirés.

## Ce qui est vérifié
- Les 17 pages répondent 200 ; captures regardées (Aujourd'hui, Pipeline, fiche d'un vendeur) : rendu identique à l'espace, données fictives.
- Aucune vraie donnée : base locale d'essai, noms, numéros et adresses inventés.

## Règle de design pour la refonte (JB, 2026-10-26)
- Moins mais mieux : pour chaque écran, décider quelles informations et quels boutons comptent le plus, et retirer ou replier le reste.
- Sections rétractables, interrupteurs, champ qui s'ouvre avec un léger mouvement sous la date choisie, pour gagner de la place et ne pas saturer Anne.
- Pensé pour l'ordinateur d'abord ; le téléphone attendra.

## Ce qui reste
- Refonte écran par écran sur la maquette, avec JB, selon la règle ci-dessus ; une story par changement retenu.
