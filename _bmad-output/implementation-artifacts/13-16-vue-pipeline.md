---
story: 13.16
epic: 13 — Espace de travail d'Anne
statut: review
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.16 — Vue pipeline

## Objectif
Voir ses vendeurs et ses acheteurs par étape pour piloter l'ensemble, et faire avancer un contact d'une étape à l'autre sans jamais le laisser sans suite (CAP-12, AD-20).

## Ce qui est fait (2026-10-21)
- **`/pipeline`** (menu sur ordinateur, page Contacts sur téléphone), avec deux onglets, Vendeurs et Acheteurs. Une colonne par étape du parcours, plus « En sommeil » et « Perdu » (perdus des 90 derniers jours). Les colonnes défilent de côté sur téléphone. Chaque carte montre le nom, la commune et la prochaine action, en terracotta quand elle est en retard. Les contacts sans parcours sont rangés avec les vendeurs.
- **Déplacer une carte** : sur ordinateur, glisser-déposer vers une colonne ouvre la fiche de déplacement avec cette étape ; partout, le bouton « Déplacer » fait de même. La règle d'AD-20 est exigée :
  - une étape active demande une prochaine action et sa date (heure facultative, à l'heure de Paris) ;
  - En sommeil demande une date de réveil à venir ;
  - Perdu demande un motif ;
  - Vendu et Acte signé ne demandent rien.

  Le changement est noté dans l'historique (« Besoin défini → Visites (Visite à Anthy · …) ») avec le compte qui a agi.
- Code : `contactsDuPipeline` et `changerEtape` dans `espace/src/server/pipeline.ts`, page `espace/src/pages/pipeline.astro`.

## Écart assumé
- Le passage à « Mandat exclusif signé » ou « Mandat de recherche signé » ne déclenche pas encore la recopie dans Modelo : c'est la story 13.9.

## Ce qui est vérifié (2026-10-21)
- `espace` : `npm run build`, `npm run check` (19 fichiers, 0 erreur).
- `node scripts/e2e-espace.mjs` : **tous les constats bons**. Les nouveaux constats de cette story :
  - l'acheteur qualifié est dans « Besoin défini » ;
  - le déplacement vers une étape active sans action est refusé ;
  - le déplacement vers « Visites » avec une action à 14 h 30 (heure de Paris) est rangé en UTC et noté dans l'historique ;
  - « Perdu » prend son motif ;
  - « En sommeil » avec une date passée est refusé ;
  - pas de débordement sur téléphone ni sur ordinateur.

## Ce qui reste
- JB : fusionner la PR.
- Story 13.9 : recopie dans Modelo à la signature d'un mandat.
