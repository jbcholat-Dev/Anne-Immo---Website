---
story: 10.13
epic: 10 — Capture des leads et backend
statut: done
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
- Après les corrections de la revue : `node scripts/e2e-diagnostic.mjs` « Tous les constats sont bons » (42 constats) ; `node scripts/e2e-espace.mjs` « Tout est bon » (296 constats, dont la ventilation 2,1,1,50 % et le bilan de Claude). Au premier passage, avant les corrections, une capture d'écran d'une fiche contact avait échoué (« frame was detached ») sans lien avec cette story ; non reproduit.

## Revue de code
2026-10-28, PR #213, commit e883e60 relu en session neuve (méthode `bmad-code-review` appliquée à la main : le skill n'était pas invocable par l'agent de relecture). `npm run check` : 0 erreur (site et espace).
1. « Autres campagnes » affichait la ventilation de toutes les campagnes : corrigé (une seule lecture groupée par campagne, filtrée ensuite ; le bilan de Claude passe d'une requête par campagne à une seule).
2. Temps d'affichage faussé après « Recommencer » ou un retour à la question 1 : corrigé (mesuré seulement si la question 1 est le premier écran montré après le chargement).
3. Un défilement ou un toucher sur l'en-tête comptait comme « écran touché » : corrigé (clic ou touche du clavier dans la question seulement, écoute retirée après le premier comptage ; texte du Bilan nuancé).
4. Page préparée d'avance par le navigateur : corrigé (« cachee » pendant la préparation, temps compté depuis l'activation).
5. Bilan de Claude indexé par libellé (collisions possibles) : corrigé (liste `campagnes` avec clé, libellé, ventilation).
6. En-tête de groupe sans `scope` : corrigé (`scope="rowgroup"`).
7. Les constructions de branche appliquent déjà la 0016 à la base d'aperçu : noté, toute retouche future passera par une 0017 (aucune retouche de la 0016 dans les corrections).
Correctifs : commit suivant e883e60 dans la même PR.

## Mise en ligne
2026-10-28 : PR #213 fusionnée par JB (commit 609b4b3). `https://annevialtissot.fr/api/sante` répond `{"ok":true,"migrations":16}` ; `/api/entonnoir` refuse un corps invalide (400).

## Ce qui reste
- Lundi 2 novembre : premier rituel de lecture (méthode d'analyse) avec cette ventilation.
