---
story: 13.21
epic: 13 — Espace de travail d'Anne
statut: done
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.21 — Audit de l'espace en jouant Anne

## Objectif
Demande de JB du 2026-10-24 : « mets-toi à la place d'Anne en tant qu'utilisateur, parcours tous les onglets et fais-moi un audit ». Avant de faire essayer l'espace à Anne, vérifier à la main, et non par les seuls essais automatiques, que chaque onglet sert son défi n° 1 (trouver et qualifier des contacts) et son quotidien (faire avancer chaque contact).

## Ce qui est fait (2026-10-24)
- Espace lancé en local sur la base d'essai remplie par `espace/scripts/e2e-espace.mjs` (18 contacts, 2 prescripteurs, 3 actions marketing, 4 numéros inconnus), imitation de Cloudflare Access et de Leedflow ; navigateur réglé en téléphone (390 px) et ordinateur (1 280 px).
- 11 pages parcourues, 16 gestes faits pour de vrai : ajout d'un contact (boîtage puis rencontre, même numéro tapé de deux façons), qualification avec erreurs volontaires puis rendez-vous, requalification d'un contact en cours, déplacement dans le pipeline, échange noté sur un prescripteur, recherches (nom, numéro, commune, e-mail), Prospect depuis « Numéros à trier », import CSV avec un doublon, fiche d'action, qualification d'un acheteur, demande du site, identifiant inexistant.
- Audit publié (page visuelle, charte du site) : https://claude.ai/artifact/87DydmbEHytFNxEk6FRkPy ; copie dans la bibliothèque du projet (`audits/audit-espace-anne-2026-10-24.html`).

## Constats
Quatre points bloquent l'usage quotidien (P1) :
1. **Noter la suite d'un contact déjà qualifié** passe par la page de qualification, dont les issues (rendez-vous, sommeil, perdu, pas joint) sont pensées pour un nouveau contact : « Rendez-vous » ramène un contact en « Estimation en préparation » à « Premier rendez-vous » (`qualifier()` dans `espace/src/server/pipeline.ts` fixe toujours `premier_rdv`), « Pas joint » renomme l'action « Rappeler pour qualifier (pas joint) » quelle que soit l'étape. Avancer un contact exige le pipeline.
2. **La fiche contact ne se modifie pas** (ni coordonnées, ni commune, ni parcours, ni note libre, ni effacement) ; seule l'action marketing se change. La fiche prescripteur, elle, est modifiable.
3. **Recherche** : un début de numéro en 06 (« 0612 ») et « prénom nom » ensemble ne trouvent rien (`listerContacts` : numéros en +33, prénom et nom cherchés séparément).
4. **Téléphone** : le tableau des contacts cache l'étape et la prochaine action (défilement latéral sans indice) ; le pipeline montre une colonne et demie.

Gênant sans bloquer (P2) : mêmes cinq questions pour un acheteur ; un contact de boîtage refusé sans passage déjà noté ; export et effacement RGPD seulement par e-mail depuis « Demandes du site » (un contact téléphone seul n'a aucun chemin) ; « Demandes du site » garde l'ancien habillage (phase 2 de la 13.3) ; pas de « rendez-vous du jour » ni de lien agenda ; rien côté Modelo au mandat signé (13.9 en attente).

Finitions (P3) : date « Samedi 24 Octobre » en majuscules ; numéros affichés « +33612345678 » ; « Contact inconnu » en texte nu ; phrase « sur ordinateur, glissez… » affichée sur téléphone ; Pipeline, Prescripteurs, Acheteurs, Actions à deux touches sur téléphone (choix de la maquette v2, à confirmer avec Anne).

Ce qui marche : ajout en moins d'une minute, aucun doublon (téléphone ou e-mail, à la main ou par import), erreurs claires qui gardent la saisie, « Aujourd'hui » dans le bon ordre, historique complet, bilan lisible, prescripteurs, numéros à trier.

## Ce qui est vérifié (2026-10-24)
- `espace` : `node scripts/e2e-espace.mjs` → « Tout est bon », 179 constats ✓ (les constats ci-dessus sont des manques, pas des régressions).
- Captures et journal des gestes gardés hors du dépôt (session Claude) ; trois captures dans la page d'audit.

## Ce qui reste
- Décision de JB (carte posée le 2026-10-24) : lancer les trois stories proposées, dans l'ordre : 13.22 « Noter la suite d'un contact en cours » (fait / pas joint, prochaine action datée, étape optionnelle, depuis « Aujourd'hui » et la fiche) ; 13.23 « Fiche contact modifiable » (coordonnées, commune, parcours, note libre, export et effacement depuis la fiche) ; 13.24 « Listes et recherche pensées téléphone » (contacts en cartes, pipeline une étape à la fois, recherche par bout de numéro et « prénom nom »).
- Les P2 attendent l'entretien avec Anne (action J43) ; l'audit lui sert de base.
