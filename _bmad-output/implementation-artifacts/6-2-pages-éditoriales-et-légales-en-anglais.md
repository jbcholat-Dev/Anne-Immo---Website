---
story: 6.2
epic: 6 — Version anglaise
statut: in-progress
date: 2026-10-04
---

# Story 6.2 — Pages éditoriales et légales en anglais

## Objectif
Qu'aucun écran mi-traduit ne puisse partir en ligne.

## Ce qui est fait
- Garde-fou dans `site/src/i18n/index.ts` : la construction échoue si `en.json` n'a pas exactement les clés de `fr.json` ou laisse un texte vide, en nommant les clés (AD-2).
- Essai : clé `nav.reseaux` retirée de `en.json` → la construction s'arrête sur « clés absentes : nav.reseaux » ; fichier remis en l'état. Aujourd'hui les deux dictionnaires concordent.
- Traduction des pages non commencée, volontairement : les textes français ne sont pas stabilisés (voir `contenu-anne/A-FOURNIR.md` § 7).

## Vérification
`npm run build` : 19 pages, aucune erreur · `npm run check` : 0 erreur · `node scripts/liens.mjs` : 1 128 liens, 0 cassé · `npm run verif` : captures 1440 et 390 dans `site/.verif/`.

## Ce qui reste
- Anne : stabiliser les textes français, dire qui traduit en premier.
- Claude : fixer les adresses anglaises dans `routes` (proposition à valider : `/en/about`, `/en/sell`, `/en/buy`, `/en/contact`, `/en/guide`, `/en/legal-notice`, `/en/privacy`, `/en/cookies`), traduire, relier nav et bascule.
