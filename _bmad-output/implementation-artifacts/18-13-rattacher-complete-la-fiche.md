---
story: 18.13
epic: 18 — Espace d'Anne : le carnet de contacts
statut: review
date: 2026-11-02
ticket: 232
---

# Story 18.13 — « Ajouter à sa fiche » complète la fiche

## Objectif
Ticket n° 232 ([Retour espace]). Dans la barre « Nouveaux », « Ajouter à sa fiche » rattache un numéro Leedflow à un contact existant mais ne recopiait pas le prénom, le nom et l'e-mail que Leedflow connaît (« Ajouter aux contacts » le faisait). Le geste complète désormais ces trois champs **quand ils sont vides**, jamais autrement.

## Ce qui est fait
- `espace/src/server/nouveaux.ts` : `completerFiche` (appelée par le geste `rattacher` avant l'entrée dans le suivi) lit ce que Leedflow connaît du numéro (`prerempli`), ne retient que les champs vides de la fiche et écrit par `carnet.corrigerFiche` (avant-image, AD-29). Une valeur déjà remplie n'est jamais écrasée. L'e-mail complété ne porte aucun accord (`noterAccord` n'est pas appelé). Un e-mail refusé (déjà à un autre contact, opposition, invalide) est laissé de côté sans bloquer le geste. Le message de confirmation le dit.
- `annulerCompletion` : l'annulation du geste rend les champs complétés si rien d'autre n'est venu sur la fiche depuis (hors événements du geste) ; si Anne les a retouchés, ils sont gardés. `annulerSuiviParGeste` reste inchangé (le complément est écrit avant l'événement de suivi, donc il ne le gêne pas).
- `espace/src/server/carnet.ts` : `corrigerFiche` accepte un paramètre facultatif `extra` ajouté aux `donnees` de l'événement (ici `nouveau`, `complete`, `annule`).
- Synthèse Leedflow : rien à changer. Une fois le lien créé par `rattacherInconnus`, `lireSyntheses` (même relève, juste après) lit en priorité les contacts liés dont la synthèse n'a jamais été lue, sous réserve du budget de fiches lues par passage ; elle apparaît donc à la relève qui suit le rattachement.
- `espace/scripts/e2e-espace.mjs` : 3 constats 18.13 (fiche vide complétée sans accord, fiche remplie non écrasée, annulation qui remet les champs vides).

## Ce qui est vérifié
- `npm run build` et `npm run check` dans `espace` : 0 erreur, 0 avertissement (5 indications déjà présentes).
- Script e2e : syntaxe vérifiée (`node --check`) ; non lancé (25 minutes).

## Ce qui reste
- Lancer `node scripts/e2e-espace.mjs` en entier avant fusion.
- Revue de code (story 9.8) dans une session neuve, la PR touchant `espace/src/`.
