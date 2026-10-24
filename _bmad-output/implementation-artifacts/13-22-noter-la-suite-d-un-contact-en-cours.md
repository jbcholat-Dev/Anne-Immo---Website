---
story: 13.22
epic: 13 — Espace de travail d'Anne
statut: review
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

## Ce qui est fait (2026-10-24)
- Nouvelle page `/contacts/suite` (`espace/src/pages/contacts/suite.astro`) : « Ce qui s'est passé » (Fait · Pas joint · Note seule), note libre, prochaine action préremplie avec l'action habituelle de l'étape (`ACTIONS_HABITUELLES`), date par raccourcis (demain, 2 jours, une semaine, autre date) et heure facultative. L'étape se change en dépliant « Changer l'étape » (repliée par défaut pour tenir sur un écran de téléphone) ; En sommeil exige un réveil, Perdu un motif, comme « Déplacer » du pipeline.
- `noterSuite` (`espace/src/server/pipeline.ts`) écrit en un seul lot : étape, prochaine action, `last_activity_at`, une ligne d'historique (« Fait : … », « Pas joint, à rappeler le … », la note) et, si l'étape change, la ligne d'étape habituelle.
- « Pas joint » garde l'étape et l'action prévue, seule la date change. « Note seule » sans nouvelle date garde l'action et sa date.
- « Noter la suite » d'« Aujourd'hui » (rappels) et le bouton principal de la fiche d'un contact en cours mènent à ce formulaire ; « Requalifier » passe en second. Un contact « À qualifier » est renvoyé vers la qualification.
- `/contacts/qualifier` d'un contact en cours ne corrige plus que les réponses (`corrigerQualification`) et le dit : l'étape et la prochaine action ne bougent plus.
- Mandat signé : tous les changements d'étape (pipeline, qualification, suite) passent désormais par une seule fonction, `evenementEtape`, l'endroit où la 13.9 branchera Modelo. Rien d'autre n'est déclenché aujourd'hui, ni par le pipeline ni par ce formulaire.
- Écart : la règle « déjà qualifié » retenue est « étape autre que À qualifier ». Un contact remis « À qualifier » par une nouvelle demande du site se requalifie, ce qui est voulu.

## Ce qui est vérifié (2026-10-24)
- `node scripts/e2e-espace.mjs` : **206 vérifications, toutes bonnes**. Les nouvelles :
  - « Aujourd'hui » mène au formulaire de suite ;
  - un contact à qualifier est renvoyé vers la qualification ;
  - une suite sans résultat est refusée ;
  - « fait, second rendez-vous à J+3 » garde l'étape « Estimation en préparation » ;
  - « pas joint » garde l'étape et l'action ;
  - « Note seule » exige un texte, et sans date garde celle de l'action ;
  - Perdu sans motif est refusé ;
  - passage à « Second rendez-vous » à J+7, 10 h, avec la ligne d'étape ;
  - sur la fiche, « Noter la suite » vient en premier ;
  - « Requalifier » ne montre et ne change que les réponses ;
  - dans le navigateur, sur ordinateur et téléphone, « Pas joint » ne demande que la date.
- Un essai existant (« perdu : motif enregistré ») passe désormais par le formulaire de suite.
- Captures `espace/.verif/espace-suite-{ordinateur,telephone}.png` : pas de débordement.
- `npm run build` et `npm run check` dans `espace/` : 0 erreur.

## Ce qui reste
- Fusion par JB, puis essai sur l'espace en ligne. Audit : https://claude.ai/artifact/87DydmbEHytFNxEk6FRkPy.
