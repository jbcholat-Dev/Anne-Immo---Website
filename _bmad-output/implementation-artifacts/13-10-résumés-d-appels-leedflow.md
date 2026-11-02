---
story: 13.10
epic: 13 — Espace de travail d'Anne
statut: done
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.10 — Résumés d'appels Leedflow

## Objectif
Que le résumé de chaque appel d'Anne se range seul sur la fiche du bon contact, pour qu'elle ne note plus rien à la main après un appel (CAP-12, AD-20 entrée 4). Leedflow est le logiciel qui résume ses appels par IA.

## Ce qui est fait (2026-10-21)
- **Relève toutes les 10 minutes** (`espace/src/server/leedflow.ts`, tâche planifiée de `espace/worker.ts`, `triggers.crons` dans `espace/wrangler.jsonc`) :
  - elle lit l'API de Leedflow en lecture seule : appels, messages vocaux, SMS et tâches créés depuis le dernier passage ;
  - elle reprend chaque fois 24 heures plus tôt, pour compléter un résumé produit après coup ;
  - chaque élément n'est noté qu'une fois (identifiant Leedflow) ;
  - au premier passage, tout l'historique est repris pour les numéros déjà connus, par paquets de 30 pages au plus par passage, de la page la plus ancienne à la plus récente.
- **Numéro connu** : une ligne dans l'historique du contact, avec un titre (« Appel reçu · 4 min », « Appel manqué », « Appel passé, sans réponse », « Message vocal », « SMS reçu ») et le résumé. Le numéro est reconnu quel que soit son format (« +33… », « 06 … », « 0033… »). La transcription complète et l'enregistrement restent dans Leedflow.
- **Numéro inconnu** : rien n'est créé d'office, car la ligne reçoit aussi des appels personnels. Le numéro est proposé sur « Aujourd'hui » (cadre « Vu par Leedflow ») avec deux boutons :
  - **Créer le contact** ouvre « Ajouter » avec le numéro prérempli ; dès l'enregistrement, ses appels passent dans l'historique ;
  - **Écarter** le retire pour de bon et efface ce qui en était gardé.
  Seuls les 30 derniers jours sont proposés ; ce qui n'est pas traité est effacé au bout de 90 jours.
- **Tâches détectées par Leedflow** : proposées comme prochaine action, sur « Aujourd'hui » et sur la fiche, avec Accepter ou Ignorer. Accepter fixe la prochaine action à la date de Leedflow (ou demain), le note dans l'historique avec le compte qui a agi, et ne change pas l'étape (AD-20 : rien ne change d'étape sans Anne). Une tâche marquée faite dans Leedflow disparaît des propositions.
- **Qualifier** : le résumé du dernier appel ou message vocal est affiché en tête de la page, pour répondre aux cinq questions en le lisant.
- **Aujourd'hui** : le dernier appel peut servir de « raison d'appeler » sur une carte. En bas de page, l'état de la relève : pas encore branché, relevé il y a N min, ou échec (par exemple clé révoquée).
- **Bilan** : le délai de rappel compte désormais un appel passé par Anne et relevé par Leedflow comme première tentative. Un appel ou un SMS reçu ne compte pas.
- **Base** (`site/migrations/0008-leedflow.sql`) : `leedflow_releve` (curseur et dernière erreur par genre), `leedflow_inconnu`, `leedflow_ecarte`, `leedflow_tache`, `leedflow_lien` (contact Leedflow → contact de l'espace, appris par le numéro, pour ranger les tâches). Les échanges des contacts connus vont dans `contact_evenement` (type `appel`, source `leedflow`), déjà prévu par la migration 0007.
- **RGPD** (`site/src/server/rights.ts`, `purge.ts`) :
  - l'export d'une adresse comprend les tâches proposées par Leedflow ;
  - l'effacement supprime tâches et liens Leedflow avec le contact ;
  - la purge efface les numéros inconnus après 90 jours et les numéros écartés après 3 ans.
- **Clé** : `LEEDFLOW_API_KEY`, secret du Worker `anne-espace` seulement, posé par JB le 2026-10-21 ; Claude ne l'a jamais vue (AD-9). Sans elle, la relève ne fait rien.

## Écarts assumés
- J'avais annoncé à JB que la relève **préremplirait les réponses** de « Qualifier » depuis le résumé. Ce n'est pas fait : il faudrait interpréter un texte libre, donc une IA de plus dans la chaîne. La v1 affiche le résumé en tête de la page de qualification. À revoir si Anne le demande.
- La forme exacte des réponses de l'API (enveloppe de la pagination, format des numéros dans `customer`) n'est pas certaine : la description publique se contredit sur l'enveloppe. Le code accepte les variantes plausibles. La première relève réelle le confirmera, et l'état en bas d'« Aujourd'hui » dira si elle échoue.
- On suppose que `customer` est le numéro du correspondant et `sender` la ligne d'Anne (lecture de la description de l'API, non vérifiée sur une vraie réponse).
- Les tâches de plus de 30 jours ne sont pas proposées (probablement périmées) ; un appel d'un numéro inconnu de plus de 30 jours n'est pas gardé.
- `leedflow.ts` écrit la prochaine action d'un contact quand Anne accepte une tâche. AD-20 nomme `pipeline.ts` comme écrivain des contacts ; `leedflow.ts` est l'adaptateur AD-8 du même Worker de l'espace, appelé seulement sur un geste d'Anne.

## Ce qui est vérifié (2026-10-21)
- `site` : `npm run check` (0 erreur), `npm run build`, `npm run base:local` (migration 0008 appliquée), `node scripts/e2e-gestion.mjs` (44 constats bons, purge et droits RGPD compris).
- `espace` : `npm run build`, `npm run check` (0 erreur).
- `node scripts/e2e-espace.mjs` : **tous les constats bons (129)**, sur une imitation locale de l'API Leedflow. Les 17 nouveaux constats :
  - appels, message vocal et SMS du numéro connu rangés (5/5), numéro écrit « 06 … » reconnu ;
  - historique ancien repris sur la deuxième page ;
  - clé envoyée à chaque requête ;
  - ni transcription complète ni enregistrement gardés ;
  - inconnu récent proposé et jamais créé, inconnu de 60 jours ignoré ;
  - tâches à faire proposées (dont une rangée grâce à la fiche du contact Leedflow), tâche faite écartée ;
  - cadre « Vu par Leedflow » et état de la relève sur « Aujourd'hui » ;
  - résumé mis en forme et texte échappé sur la fiche ;
  - dernier résumé en tête de « Qualifier » ;
  - résumé arrivé après coup complété sans doublon, reprise au curseur ;
  - tâche acceptée (action et date fixées, étape inchangée, notée) ;
  - tâche ignorée ;
  - numéro écarté, même après une nouvelle relève ;
  - numéro prérempli à la création, puis appel rattaché ;
  - clé refusée signalée, puis erreur disparue ;
  - pas de débordement sur téléphone ni sur ordinateur (captures `espace/.verif/espace-*-leedflow-*.png`).

## Retour de JB du 2026-10-21 : le contenu Leedflow des numéros inconnus
JB : la relève marche, mais pour un numéro inconnu il ne voyait ni le nom du contact Leedflow, ni le résumé complet, ni les tâches. Il veut une page légère : le détail s'ouvre en touchant le numéro.
- **Nom** : quand un élément porte un contact Leedflow, la relève lit sa fiche (30 fiches par passage au plus) et garde prénom, nom et e-mail avec le numéro inconnu (`nommerInconnus`, `donnees` de `leedflow_inconnu`).
- **Carte d'« Aujourd'hui »** : le nom Leedflow (ou le numéro), le nombre d'échanges et de tâches, et une seule ligne du dernier résumé. Le nom mène à la nouvelle page `/inconnu?tel=…`.
- **Page `/inconnu`** : nom, numéro, e-mail, boutons Appeler / Créer le contact / Écarter, tâches détectées, tous les échanges avec leur résumé complet mis en forme.
- **Tâches d'un numéro inconnu** : gardées avec lui (`tache:id` dans `leedflow_inconnu`), puis transformées en tâches proposées dès que le contact est créé. Une tâche qui n'est plus « à faire » disparaît.
- **Création du contact** : prénom, nom et e-mail lus dans Leedflow préremplis.
- **Migration 0009** : remet à zéro le curseur des tâches, pour relire celles des numéros inconnus déjà relevées (la relève les ignorait jusque-là).

Vérifié le 2026-10-21 : `espace` `npm run build` et `npm run check` (0 erreur), `site` `npm run base:local` (0009 appliquée) ; `node scripts/e2e-espace.mjs` : **tous les constats bons (134)**, dont les 5 nouveaux (noms lus, tâche d'inconnu gardée, carte d'une ligne avec le nom, page `/inconnu` avec résumé mis en forme et tâche, préremplissage puis tâche proposée à la création). Captures `espace/.verif/espace-inconnu-*.png` et `espace-aujourdhui-*.png` relues : pas de débordement, une ligne par carte.

## Ce qui reste
- ~~JB : fusionner la PR~~ PR #165 fusionnée le 2026-10-21.
- Après la fusion : regarder le bas d'« Aujourd'hui » (« appels relevés il y a … min ») et une fiche d'un contact connu qui a appelé récemment.
- JB : fusionner la PR du retour (noms, page `/inconnu`, tâches des inconnus).
- Anne : dire si les numéros inconnus et les tâches proposées lui sont utiles, et si elle veut le préremplissage de la qualification.
