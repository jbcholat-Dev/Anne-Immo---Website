---
story: 17.5
epic: 17 — Programme ambassadeurs
statut: review
date: 2026-11-08
origine: retour de JB du 2026-11-08 sur l'aperçu de test (deux captures)
---

# Story 17.5 — Confirmation d'inscription en pleine page

## Objectif

Après l'inscription, le message « Bienvenue parmi les ambassadeurs » ne remplaçait que le formulaire, en bas à droite de la page : on pouvait le manquer. La maquette validée (écran 2, https://claude.ai/artifact/JRzaQnTFGuTM83oyuFdHby) montre un écran entier « C'est fait ». JB demande que la confirmation remplace la page.

## Ce qui est fait

- `site/src/pages/ambassadeurs.astro` : les sections de la page sont regroupées (`data-amb-page`) et masquées à la réponse du serveur ; la confirmation devient une section à part, en haut de page : « C'est fait », « Bienvenue parmi les ambassadeurs, Prénom. » (ou « Vous êtes déjà ambassadeur »), trait terracotta, rappel de l'e-mail, carte « Vous pensez déjà à quelqu'un ? » (WhatsApp, SMS), lien « Enregistrer mon numéro dans votre téléphone », numéro d'Anne. Anne parle à la première personne, comme sur le reste de la page. Un seul titre de niveau 1 sur la page.
- `site/src/pages/anne-vial-tissot.vcf.ts` : fiche contact d'Anne (vCard), construite depuis `config/site.ts`.
- Écart avec la maquette : « Pas de nom en tête pour l'instant ? Gardez la carte. » devient « … Je reste joignable au même numéro », car on arrive aussi par e-mail, sans carte.
- `scripts/e2e-ambassadeurs.mjs` : deux vérifications de plus par largeur (page masquée et retour en haut, lien et contenu de la fiche contact).

## Ce qui est vérifié (2026-11-08, en local)

- `node scripts/e2e-ambassadeurs.mjs` : essai réussi, 39 vérifications (captures `site/.verif/ambassadeurs/confirmation-telephone.png` et `-ordinateur.png`).
- `npm run check` : 0 erreur ; `npm run build` au vert ; `node scripts/liens.mjs` : 32 pages, 2 331 liens, 0 cassé ; `node scripts/ecrans.mjs` : aucun signalement.

## Revue de code

À faire en session neuve (story 9.8).

## Ce qui reste

- Revue, fusion par JB, contrôle sur l'aperçu de test.
