---
story: 13.22
epic: 13 — Espace de travail d'Anne
statut: ready-for-dev
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.22 — Noter la suite d'un contact en cours

## Objectif
Premier point bloquant de l'audit 13.21 (décision de JB du 2026-10-24 : « Oui, les trois stories »). Pour un contact déjà qualifié, le seul geste depuis « Aujourd'hui » et la fiche est « Noter la suite » / « Requalifier », qui ouvre les cinq questions de qualification. Ses issues (rendez-vous, sommeil, perdu, pas joint) sont pensées pour un nouveau contact : « Rendez-vous » ramène un contact en « Estimation en préparation » à « Premier rendez-vous » (`qualifier()` dans `espace/src/server/pipeline.ts` fixe toujours `premier_rdv` ou `besoin_defini`), « Pas joint » renomme l'action « Rappeler pour qualifier (pas joint) » quelle que soit l'étape. Avancer un contact exige d'aller dans Pipeline. La spec CAP-12 demande : « Depuis chaque ligne, Anne appelle ou écrit en un geste, note le résultat et fixe la prochaine action sans quitter la page. »

## Ce qu'il faut
- Sur un contact déjà qualifié (`qualifie_le` renseigné, ou étape autre que « À qualifier »), « Noter la suite » (sur « Aujourd'hui ») et le bouton principal de la fiche ouvrent un **formulaire de suite**, pas la qualification :
  - ce qui s'est passé : fait (l'action prévue est faite) · pas joint · note libre ;
  - la **prochaine action** (texte, prérempli avec l'action habituelle de l'étape) et sa **date** (raccourcis : demain, dans 2 jours, dans une semaine, autre date ; heure facultative) ;
  - la **nouvelle étape**, facultative, parmi celles du parcours du contact (vendeur ou acheteur), plus En sommeil (date de réveil exigée) et Perdu (motif exigé), avec les mêmes règles que « Déplacer » du pipeline (`changerEtape`) ;
  - en un seul enregistrement : étape, prochaine action, événement dans l'historique (« Fait : … », « Pas joint, à rappeler le … », note), `last_activity_at`.
- « Pas joint » sur un contact en cours garde son étape et son action prévue, et ne la renomme plus « Rappeler pour qualifier ».
- « Requalifier » reste disponible, en second, pour corriger les cinq réponses ; il ne change plus l'étape d'un contact déjà au-delà de « À qualifier » (ou le dit clairement avant de le faire).
- Téléphone d'abord : formulaire tenant sur un écran, pastilles d'une touche comme la qualification.
- Le passage à « Mandat exclusif signé » ou « Mandat de recherche signé » par ce formulaire déclenche la même chose que par le pipeline (marque Modelo quand la 13.9 existera).

## Vérification attendue
- `espace/scripts/e2e-espace.mjs` : un contact en « Estimation en préparation » noté « fait, prochaine action : second rendez-vous le J+3 » garde son étape puis passe à « Second rendez-vous » si l'étape est choisie ; « pas joint » garde l'étape et l'action ; l'historique porte chaque suite ; « Aujourd'hui » montre le rappel à la nouvelle date.
- Captures téléphone et ordinateur de « Aujourd'hui » et du formulaire ; pas de débordement.
- `npm run build`, `npm run check` dans `espace/`.

## Ce qui reste
- À construire (fil « [Site] Espace de travail d'Anne »). Audit : https://claude.ai/artifact/87DydmbEHytFNxEk6FRkPy.
