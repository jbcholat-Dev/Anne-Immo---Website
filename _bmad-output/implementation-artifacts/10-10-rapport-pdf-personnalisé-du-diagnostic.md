---
story: 10.10
epic: 10 — Capture des leads et backend
statut: in-progress
date: 2026-10-10
---

# Story 10.10 — Rapport PDF personnalisé du diagnostic

## Objectif
Le vendeur qui a fait le diagnostic télécharge un rapport PDF à son nom : ses scores, le constat de chaque axe et les recommandations tirées des 10 erreurs du guide, celles de ses points faibles en tête. C'est le « plan d'action personnalisé » qu'annonce déjà le bouton de la sortie B (`feedbacks.json`). Critères : `_bmad-output/planning-artifacts/epics.md`, story 10.10 ; amendement AD-5 / AD-8 du 2026-10-10 dans le spine d'architecture.

## Décisions prises (JB, 2026-10-10)
- Rapport PDF à la place de résultats limités à 24 heures dans le navigateur ; recommandations présentes pour chaque axe, quel que soit le score.
- Le diagnostic a 3 axes, pas 4 : « Visibilité & Attractivité » en est un seul.
- Chaque question du diagnostic correspond à une erreur du guide (q01 → erreur 9, q02 → 3, q03 → 8, q04 → 2, q05 → 1, q06 → 5, q07 → 4, q08 → 6, q09 → 7, q10 → 10) : la recommandation montre la réponse du vendeur et ses points, et porte « En priorité » (moins de la moitié des points), « À améliorer » ou « Point solide ». Page « Par où commencer » : les priorités, dans l'ordre.
- Fabrication proposée : pages préparées à la construction, complétées par le serveur au téléchargement (voir l'amendement d'architecture) ; lien signé valable 7 jours, sur la page de résultats et dans l'e-mail du résumé.

## Ce qui est fait (maquette, 2026-10-10)
- `contenu-anne/guide/rapport-diagnostic.md` : introduction, 10 recommandations (une par question, tirées du guide), conclusion. Statut brouillon, à relire par Anne.
- `site/scripts/maquette-rapport.mjs` : deux rapports d'exemple (profil fragile, sortie B ; profil solide, sortie A) en PDF, et une image par page, dans `site/.verif/rapport/`.
- Exemples partagés dans le projet : `/mnt/project-files/rapport-diagnostic/`.

## Ce qui est vérifié
- `node scripts/maquette-rapport.mjs` : deux PDF de 8 pages (128 et 119 Ko), lus page par page : couverture, « Par où commencer », une partie par axe, suite proposée.

## Ce qui reste
- Validation de la maquette par JB et Anne (contenu et mise en page) ; relecture des textes par Anne.
- Branchement : pages préparées à la construction, assemblage par le serveur, lien signé, bouton sur la page de résultats, lien dans l'e-mail du résumé (à la place de la phrase sur les 24 heures), essai de bout en bout.
