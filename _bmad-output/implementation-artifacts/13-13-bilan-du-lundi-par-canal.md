---
story: 13.13
epic: 13 — Espace de travail d'Anne
statut: review
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.13 — Bilan du lundi par canal

## Objectif
Voir chaque semaine ce que chaque canal a rapporté, pour savoir où mettre ses heures (CAP-12 v7 « Origine précise et bilan par canal », maquette v2 écran 4).

## Ce qui est fait (2026-10-21)
- **`/bilan`** (menu « Bilan », en bas sur téléphone, en haut sur ordinateur), période au choix : 7 derniers jours, 4 dernières semaines, 3 derniers mois. Tout est recalculé depuis la base à chaque ouverture, sans saisie.
  - **Cinq chiffres** : nouveaux contacts, qualifiés, rendez-vous, mandats, délai moyen de rappel.
  - **Par canal** : contacts, qualifiés, rendez-vous, mandats. Les canaux sont triés par rendez-vous puis par contacts, et les canaux vides sont grisés.
  - **Ce que la période dit** : quelques phrases tirées des chiffres, sans rien inventer :
    - le canal qui donne le plus de rendez-vous ;
    - les canaux à 3 contacts ou plus sans rendez-vous ;
    - les contacts pas encore qualifiés ;
    - les secteurs à refaire ;
    - les pertes « exclusif ailleurs », à rapprocher du délai de rappel.
  - **Boîtage par secteur** : dernier passage, mots déposés, contacts amenés par ce passage, et la suite (« Repasser cette semaine » après 6 semaines, « Changer de secteur ? » après 3 semaines sans aucun contact, sinon « Repasser vers le … »).
  - **Perdus, et pourquoi** : les motifs des contacts classés perdus pendant la période.
- Règles de calcul (`bilan` dans `espace/src/server/pipeline.ts`) :
  - Les compteurs portent sur les contacts **arrivés** pendant la période.
  - « Qualifié » : une qualification enregistrée ; un « pas joint » ne compte pas.
  - « Rendez-vous » et « mandat » : le contact a atteint cette étape un jour, même s'il en est sorti depuis, d'après l'étape actuelle et l'historique des changements d'étape.
  - Délai de rappel : de l'arrivée du contact à la première tentative notée (qualification, y compris « pas joint », ou appel).
- Menu du téléphone conforme à la maquette : Aujourd'hui, Contacts, +, Bilan. Les demandes du site s'ouvrent depuis la page Contacts.

## Écarts assumés
- Pas de colonne « rendez-vous par contact » : elle se lit dans les deux colonnes voisines, et elle débordait sur téléphone.
- Les contacts d'essai (`is_test`) sont comptés comme les autres : sur l'aperçu, toutes les données sont des essais.

## Ce qui est vérifié (2026-10-21)
- `espace` : `npm run build`, `npm run check` (15 fichiers, 0 erreur).
- `node scripts/e2e-espace.mjs` : **tous les constats bons**. Les nouveaux constats de cette story :
  - un contact recommandé, qualifié en rendez-vous, ajoute exactement 1 contact, 1 qualifié et 1 rendez-vous à la ligne « Recommandation » ;
  - boîtage par secteur avec sa suite ;
  - motifs de perte ;
  - délai de rappel calculé ;
  - phrases « ce que la période dit » ;
  - période de 3 mois ;
  - pas de débordement sur téléphone ni sur ordinateur (captures `espace/.verif/espace-bilan-*.png`).

## Ce qui reste
- JB : fusionner la PR #163.
- Anne : regarder son premier bilan un lundi et dire s'il l'aide à choisir entre boîtage, prescripteurs et événements.
