---
story: 13.19
epic: 13 — Espace de travail d'Anne
statut: done
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.19 — Trier les numéros inconnus : catégories et filtres

## Objectif
Retour de JB du 2026-10-21 (capture d'« Aujourd'hui » couverte de cartes de numéros inconnus) : « Il faut qu'on implémente des outils de filtrage, et des catégories (inconnus, privés, …) ». Les numéros vus par Leedflow (story 13.10) qui ne sont pas des contacts encombraient la page d'ouverture, et le seul geste possible, « Écarter », ne distinguait pas un proche, un professionnel et un démarcheur. Proposition faite à JB le même jour, acceptée (« Ok »).

## Ce qui est fait (2026-10-21)
- **Migration `0011-leedflow-categories.sql`** : `leedflow_ecarte` devient la liste des numéros classés, avec une colonne `categorie` (`prive`, `pro`, `demarchage`). Les numéros déjà écartés deviennent Privé. Un numéro absent de la table est « à trier ».
- **`espace/src/server/leedflow.ts`** : `CATEGORIES`, `FILTRES`, `numerosLeedflow(filtre)`, `aTrier`, `comptesLeedflow`, `classerNumero` (catégorie ou remise à trier). Privé et Démarchage effacent les échanges gardés ; un Pro les garde et la relève continue d'en ranger les nouveaux (elle ne saute plus que les numéros classés autrement que Pro). Un numéro qui n'a que des appels manqués (sans message, sans tâche) est marqué « silencieux ».
- **Page `/a-trier`** (« Numéros à trier ») : filtres À trier / Pros / Privés / Démarchage / Tous, chacun avec son compte ; appels manqués sans message masqués par défaut, avec un lien pour les afficher ; par numéro : nom lu dans Leedflow, catégorie, nombre d'échanges et de tâches, dernière ligne ; gestes Prospect (crée le contact, prérempli), Privé, Pro, Démarchage, Remettre à trier, et pour un Pro « En faire un prescripteur ».
- **« Aujourd'hui »** : les cartes des numéros inconnus sont remplacées par une seule ligne « N numéro(s) à trier », qui dit combien ont un message et combien ne sont que des appels manqués, et mène à la page.
- **Page du numéro (`/inconnu`)** : sa catégorie et les gestes pour le classer ; retour vers « Numéros à trier ».
- **Prescripteurs** : formulaire d'ajout prérempli (nom, téléphone) depuis un numéro Pro.
- **Contacts** : lien « Numéros à trier ».
- `/api/leedflow/ecarter` est remplacé par `/api/leedflow/classer` (catégorie, ou `a_trier`), qui ne renvoie que vers « Numéros à trier » ou la page du numéro.

## Écarts assumés
- La catégorie « Prospect » n'est pas rangée dans la table : choisir Prospect, c'est créer le contact (qui quitte alors la liste), comme avant.
- Un numéro remis à trier après avoir été classé Privé ou Démarchage ne revient qu'à son prochain échange (ses échanges avaient été effacés, par minimisation des données).
- Un Pro reste soumis à la purge des numéros inconnus (échanges effacés à 90 jours) ; sa catégorie est gardée 3 ans comme les numéros écartés.

## Ce qui est vérifié (2026-10-21)
- `site` : `npm run build`, `npm run base:local` (0011 appliquée).
- `espace` : `npm run build`, `npm run check` (0 erreur).
- `node scripts/e2e-espace.mjs` : **tous les constats bons (179)**. Nouveaux ou revus :
  - « Aujourd'hui » : tâche proposée, numéros inconnus réduits à une ligne vers « À trier », aucun numéro affiché ;
  - « À trier » : carte avec nom Leedflow, catégorie, une seule ligne ; appel manqué sans message masqué par défaut puis affiché et signalé ;
  - Privé et Démarchage : plus proposés, échanges effacés même après une nouvelle relève ; retour jamais vers une autre adresse ;
  - Pro : échanges gardés après une nouvelle relève, sans doublon ; catégorie inconnue refusée ;
  - numéros classés absents de « À trier », compte par filtre ; filtres Pros et Démarchage ; prescripteur prérempli ; page du numéro avec sa catégorie ; remise à trier ;
  - captures `espace/.verif/espace-a-trier-*.png`, `espace-aujourdhui-*.png`, `espace-inconnu-*.png` relues, aucun débordement signalé.

## Ce qui reste
- Fusionnée dans main le 2026-10-21 (PR #170, accord de JB).
- Anne : trier ses numéros, dire si d'autres catégories lui manquent.
