---
story: 10.13
epic: 10 — Capture des leads et backend
statut: review
date: 2026-10-28
---

# Story 10.13 — Question 1 : écran touché, navigateur, appareil et temps d'affichage

## Objectif
Au 28 octobre 2026, environ 310 visiteurs venus de la publicité Meta ont vu la question 1 du diagnostic, et 3 à 6 sont passés à la question 2 (méthode d'analyse marketing, https://claude.ai/artifact/Ns3Zf4Nm1pFKAjggqqFc9z). Un écart de cette taille ressemble à une panne, une lenteur ou des clics involontaires plutôt qu'à du désintérêt. Le compteur de la story 10.12 dit où les visiteurs s'arrêtent, pas pourquoi. Cette story ajoute de quoi distinguer ces cas en une semaine, toujours sans cookie ni donnée personnelle. Proposition du fil « Méthode d'analyse marketing », accord de JB du 2026-10-28 (« ok »).

## Ce qui est fait
- **Premier toucher** (`site/src/islands/diagnostic.ts`) : nouvelle étape `interaction`, au premier toucher, clic ou touche du clavier pendant que la question 1 est à l'écran, comptée une fois par passage.
- **Navigateur et appareil** (`site/src/server/entonnoir.ts`, `lireNavigateur`) : le serveur lit l'en-tête User-Agent de la requête de comptage et n'en garde que deux informations : navigateur intégré d'Instagram ou de Facebook (`FBAN`, `FBAV`, `FB_IAB`, `Instagram`) ou navigateur habituel, et iPhone ou iPad, Android, ou ordinateur. L'en-tête n'est pas gardé.
- **Temps d'affichage** (`site/src/islands/entonnoir.ts`, `palierAffichage`) : sur la ligne de la question 1, le temps écoulé depuis le début du chargement de la page jusqu'à l'affichage de la question, en trois paliers (moins de 2 s, 2 à 5 s, plus de 5 s), ou « cachee » si la page n'était pas à l'écran à ce moment. Ce quatrième cas, ajouté à la demande, fait apparaître les pages préchargées par Facebook et Instagram avant le clic (ou ouvertes en arrière-plan), qui comptent une question 1 que personne n'a vue.
- **Base** : migration `0016-entonnoir-question-1.sql`. La table `entonnoir` est refaite (SQLite ne sait pas modifier une contrainte), ses lignes recopiées : étape `interaction` admise, colonnes `integre`, `appareil`, `affichage`. Les passages d'avant le 28 octobre restent « non mesurés ».
- **Lecture** (`espace/src/server/entonnoir.ts`, `question1`, `espace/src/pages/bilan.astro`) : dans la carte « Diagnostic : où les visiteurs s'arrêtent » du Bilan, une ligne « Question 1 : écran touché » dans l'étape par étape, et un tableau « Question 1 : qui passe à la question 2 ? » pour la campagne choisie : par navigateur, par appareil, par temps d'affichage, avec pour chacun les passages à la question 1, ceux qui ont touché l'écran, ceux qui sont passés à la question 2 et la part. Même ventilation dans `/api/claude/bilan` (champ `diagnostic.question1`), pour toutes les campagnes et chacune.
- **Page Cookies** : dit ce qui est noté en plus sur la première question.

## Comment lire le tableau
- Beaucoup de « pas à l'écran » : préchargements, la publicité compte des vues qui n'en sont pas.
- Question 1 jamais touchée, page affichée vite : le visiteur n'a pas regardé (clic involontaire, désintérêt).
- Question 1 touchée sans passage à la question 2, concentré sur un navigateur ou un appareil : panne de ce navigateur.
- Affichage en plus de 5 s concentré sur les départs : lenteur.

## Ce qui est vérifié (2026-10-28)
- `npm run build` et `npm run check` (site et espace) : 0 erreur.
- Migration 0016 appliquée sur une base locale qui contenait déjà des passages : lignes recopiées.
- `node scripts/e2e-diagnostic.mjs` : 42 constats bons, dont 5 nouveaux : question 1 touchée, navigateur habituel, ordinateur et palier d'affichage pour chacun des trois parcours ; navigateur intégré d'Instagram sur iPhone reconnu par l'en-tête, palier inventé oublié ; page préchargée (pas à l'écran) comptée « cachee », sans toucher ; la table n'a que les colonnes prévues.
- `node scripts/e2e-espace.mjs` : voir la section « Revue de code » (résultat cité avec la PR).

## Revue de code
À faire en session neuve (story 9.8) avant de proposer la PR à JB.

## Ce qui reste
- Revue de code, PR, accord de JB, fusion (la migration s'applique à la construction).
- Lundi 2 novembre : premier rituel de lecture (méthode d'analyse) avec cette ventilation.
