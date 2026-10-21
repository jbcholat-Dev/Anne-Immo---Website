---
story: 13.7
epic: 13 — Espace de travail d'Anne
statut: review
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.7 — Saisie à la main, passage de boîtage et import d'une liste

## Objectif
Que chaque contact qu'Anne rencontre hors du site (boîtage, recommandation, événement, rencontre) entre dans l'espace en moins d'une minute, rattaché à ce qui l'a amené, sans jamais créer de doublon (maquette v2, écran 3 « Ajouter » ; CAP-12 v7 ; AD-20).

## Ce qui est fait (2026-10-21)
- **`/ajouter`** (bouton « + » au centre du menu du téléphone, « Ajouter » en haut sur ordinateur) :
  - **Un contact** : prénom, nom, téléphone, e-mail, commune ; « il ou elle veut » vendre, acheter, ou je ne sais pas ; **« D'où vient ce contact ? » obligatoire** (8 canaux en pastilles). Le canal appelle son complément : le passage de boîtage (liste des derniers passages), le prescripteur (existant, ou nouveau avec son rôle, créé d'un coup), ou une précision libre (nom de l'événement, annonce…). Note facultative.
  - Le contact arrive « À qualifier », rappel prévu aujourd'hui. **Un téléphone ou un e-mail déjà connu ouvre la fiche existante**, complétée de ce qui lui manquait, avec le message « Ce contact existait déjà… rien n'a été créé en double » ; son origine d'origine est gardée.
  - En cas d'erreur (boîtage sans passage, numéro invalide…), la saisie reste affichée avec l'explication.
  - **Un passage de boîtage** : secteur (les secteurs déjà faits sont proposés), date (aujourd'hui par défaut, pas dans le futur), mots déposés. Les cinq derniers passages s'affichent avec le nombre de contacts qu'ils ont amenés.
- **`/importer`** : un fichier .xlsx ou .csv (Excel français au point-virgule, accents en Windows-1252 compris), première ligne = titres (Prénom, Nom, Téléphone ou Portable, E-mail, Commune ou Ville, reconnus avec ou sans accents). Deux temps : **aperçu** (« 12 personnes : 9 nouvelles, 3 déjà connues », doublons du fichier écartés, rien d'enregistré), puis enregistrement. Les connues sont complétées et notées, jamais recréées. **Sans la case « Les participants ont accepté d'être recontactés », les nouveaux contacts sont marqués « Rappel individuel seulement »** (pas d'e-mail groupé, AD-20). Un numéro rangé comme un nombre par le tableur (« 601020304 ») retrouve son 0. 500 personnes au plus par fichier, écrites par lots.
- **`/contacts`** : tous les contacts, les plus récemment actifs d'abord, recherche par nom, téléphone (« 06 … » trouve « +33… »), e-mail ou commune.
- **`/contacts/fiche`** (première version, complétée par 13.6) : origine précise (« Boîtage Sciez-Chavannex, 2026-10-06 », « Recommandation de Maître Durand »), étape, prochaine action et bouton Appeler, coordonnées, demandes faites sur le site (liens vers leur fiche), historique avec le compte qui a agi, pastille « Rappel individuel seulement ».
- Code : `espace/src/server/pipeline.ts` (écrivain des contacts côté espace, comme le veut AD-20), `espace/src/server/tableur.ts` (lecture .csv et .xlsx sans bibliothèque), gabarit `espace/src/layouts/Espace.astro` (maquette v2 : menu en bas sur téléphone, en haut sur ordinateur).
- L'accueil de l'espace mène encore à `/gestion` ; il passera à « Aujourd'hui » avec la story 13.5.

## Ce qui est vérifié (2026-10-21)
- `espace` : `npm run build` et `npm run check` sans erreur (13 fichiers, 0 erreur).
- `node scripts/e2e-espace.mjs` : **tous les constats bons**, dont 26 nouveaux pour cette story : passage noté ; boîtage sans passage refusé ; contact créé rattaché au passage, rappel aujourd'hui, historique avec le compte ; numéro connu saisi au format international → fiche existante complétée, origine gardée, aucun doublon ; prescripteur créé et rattaché ; fiche et recherche par « 06 … » ; import .csv (aperçu 2 nouvelles / 1 connue / 1 doublon écarté, rien enregistré avant confirmation, 2 créés en « rappel individuel seulement », 0 rendu au numéro, personne connue complétée) ; import .xlsx fabriqué dans l'essai (textes partagés, numéro rangé comme un nombre, consentement coché) ; fichier sans titres refusé ; toucher « Boîtage » montre le choix du passage et cache le prescripteur, sur téléphone et ordinateur ; aucune des cinq pages ne déborde (captures `espace/.verif/espace-*-{ordinateur,telephone}.png`).

## Ce qui reste
- JB : fusionner la PR (la même que 13.4).
- Anne : essayer la saisie d'un contact et d'un passage depuis son téléphone.
- Suite : 13.6 Qualifier en deux minutes.
