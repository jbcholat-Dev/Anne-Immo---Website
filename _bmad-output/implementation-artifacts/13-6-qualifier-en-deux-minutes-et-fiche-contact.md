---
story: 13.6
epic: 13 — Espace de travail d'Anne
statut: done
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.6 — Qualifier en deux minutes et fiche contact

## Objectif
Décider en un appel si un nouveau contact vaut un rendez-vous : cinq réponses d'une touche, puis une issue obligatoire, et retrouver tout son historique sur sa fiche (maquette v2, écran 2 ; CAP-12 v7 « Qualifier en deux minutes »).

## Ce qui est fait (2026-10-21)
- **`/contacts/qualifier?id=`** (bouton « Qualifier » de la fiche, en terracotta tant que le contact est à qualifier) :
  - en tête, le nom, la commune, l'origine précise et le bouton Appeler ;
  - « Il ou elle veut » vendre ou acheter, seulement si on ne le sait pas encore ;
  - les cinq questions de la maquette, une touche chacune : projet et délai, déjà avec une agence, le bien, pourquoi ce projet, acheteur avec un bien à vendre d'abord ; réponses déjà données préremplies ;
  - **« Et maintenant ? »**, une suite obligatoire :
    - **Rendez-vous** : date et heure exigées. L'étape devient « Premier rendez-vous » pour un vendeur, ou « Besoin défini » pour un acheteur (action « Rendez-vous : définir la recherche »). Le parcours est exigé.
    - **En sommeil** : date de réveil exigée (dans 1, 3 ou 6 mois, ou une autre date à venir).
    - **Perdu** : motif exigé (exclusif ailleurs, pas de projet, hors secteur, veut vendre seul, injoignable, autre avec précision).
    - **Pas joint** (ajout à la maquette) : le contact reste à qualifier, rappel demain, dans 2 jours, dans une semaine ou à une autre date.
  - en cas d'erreur, les réponses restent affichées avec l'explication.
- Enregistrement (`qualifier` dans `espace/src/server/pipeline.ts`) :
  - l'étape et la prochaine action sont fixées ;
  - les cinq réponses sont gardées en JSON sur le contact, avec la date de qualification ;
  - l'historique reçoit la qualification (résumé et réponses) et, quand l'étape change, une ligne « ancienne étape → nouvelle étape », chacune avec le compte qui a agi ;
  - une heure saisie à l'heure de Paris est rangée en UTC, changement d'heure compris.
- **Fiche** : bouton Qualifier ou Requalifier, cadre « Qualification » avec les réponses et leur date, message « Qualification enregistrée ».
  - Origine, étape, prochaine action, coordonnées, demandes du site et historique y étaient depuis la story 13.7.
  - L'export et l'effacement (story 10.7) restent sur la page des demandes, par l'adresse e-mail, et couvrent le contact (story 13.4).

## Écart assumé
- La maquette propose trois créneaux de rendez-vous tout faits ; la v1 demande une date et une heure, faute d'agenda d'Anne branché (Cal.com ne donne pas ses créneaux libres à l'espace). À revoir si Anne le demande.

## Ce qui est vérifié (2026-10-21)
- `espace` : `npm run build`, `npm run check` (14 fichiers, 0 erreur).
- `node scripts/e2e-espace.mjs` : **tous les constats bons**. Les nouveaux constats de cette story :
  - la page montre les cinq questions et les suites ;
  - refus sans suite, sans motif, sans date de rendez-vous ;
  - en sommeil dans 3 mois : étape, réveil et réponses enregistrés, historique avec qualification et changement d'étape ;
  - la fiche montre les réponses ;
  - perdu : motif enregistré, plus de rappel ;
  - rendez-vous d'un contact sans parcours refusé, puis accepté avec « vendre » : « Premier rendez-vous » le 15 janvier à 10 h, rangé 9 h UTC ;
  - pas joint : reste à qualifier, rappel demain ;
  - la page ne déborde ni sur téléphone ni sur ordinateur (captures `espace/.verif/espace-qualifier-*.png`).

## Ce qui reste
- ~~JB : fusionner la PR~~ PR #163 fusionnée le 2026-10-21.
- Anne : qualifier un vrai contact au téléphone et dire si les cinq questions sont les bonnes (guide d'entretien de la story 13.12).
- Préremplissage par le résumé Leedflow : story 13.10.
