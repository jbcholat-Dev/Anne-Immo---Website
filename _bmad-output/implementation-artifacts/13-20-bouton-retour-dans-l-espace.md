---
story: 13.20
epic: 13 — Espace de travail d'Anne
statut: review
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.20 — Bouton « Un retour ? » dans l'espace

## Objectif
Demande de JB du 2026-10-24 : « réintroduire un bouton dans la page de l'espace qui puisse permettre à Anne de faire des retours, et que ces retours deviennent des tickets sur GitHub, de la même manière qu'on fonctionnait avec le site web ». Anne signale ce qui cloche au moment où elle le voit, et le fil « Traitement des tickets » le traite comme les retours de l'aperçu.

## Ce qui est fait (2026-10-24)
- **Code partagé `site/src/server/retours.ts`** : la création du ticket (lecture de la remarque, titre, corps, étiquette `retour-apercu`, nouvel essai sans étiquette si GitHub la refuse) sort de `site/worker.ts`. Le site et l'espace l'appellent après avoir vérifié qui écrit. Ajout : la page est envoyée sans ses paramètres (le dépôt est public, et `/inconnu?tel=…` contient un numéro de téléphone).
- **Espace** : bouton « Un retour ? » sur toutes les pages au gabarit de l'espace (composant du site `RetourApercu.astro`, variante `espace`), posé au-dessus du menu du bas sur téléphone ; le formulaire rappelle que le ticket est public et qu'il ne faut citer ni nom ni numéro de client. Adresse `/api/retour` de l'espace : auteur = adresse vérifiée par Cloudflare Access ; le jeton de Claude y est refusé. Titre des tickets : « [Retour espace] page : première ligne ».
- **Réglage** : secret `GITHUB_TOKEN` du Worker `anne-espace` (`espace/src/server/env.ts`), à poser par JB (RUNBOOK § 4 sexies).
- Documents : RUNBOOK § 4 bis et § 4 sexies, `espace/README.md`, `site/README.md`, `CLAUDE.md` (retours), epics, statut de sprint.

## Écarts assumés
- Les pages de l'espace reprises de `/gestion` (gabarit Gestion du site, jusqu'à la phase 2 de la story 13.3) n'ont pas le bouton : ce gabarit utilise déjà l'attribut `data-retour` pour son lien « Retour à l'espace ».
- Même étiquette `retour-apercu` que l'aperçu, pour que la routine du fil « Traitement des tickets » les voie sans changement ; le titre « [Retour espace] » les distingue.

## Ce qui est vérifié (2026-10-24)
- `site` et `espace` : `npm run build`, `npm run check` (0 erreur).
- `node scripts/e2e-espace.mjs` : **tous les constats bons (187)**. Les 8 nouveaux, avec une imitation de l'API GitHub :
  - ticket créé avec l'étiquette `retour-apercu`, l'auteur vérifié, le titre « [Retour espace] /inconnu : … », la page sans paramètres (aucun numéro de téléphone envoyé) ;
  - remarque vide refusée ; jeton de Claude refusé (403) ;
  - bouton et rappel « public » présents sur les pages ;
  - sur téléphone et sur ordinateur : bouton visible, au-dessus du menu du bas, il ouvre le formulaire (capture `espace/.verif/espace-retour-telephone.png` relue).

## Ce qui reste
- JB : fusionner la PR.
- JB : créer la clé GitHub de l'espace et la poser sur le Worker `anne-espace` (RUNBOOK § 4 sexies, ≈ 7 min), puis envoyer un retour d'essai.
