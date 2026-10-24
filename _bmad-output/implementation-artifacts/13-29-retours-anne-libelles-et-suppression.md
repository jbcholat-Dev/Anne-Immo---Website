---
story: 13.29
epic: 13 — Espace de travail d'Anne
statut: done
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.29 — Retours d'Anne du 24/10 : libellés et suppression d'un contact

## Objectif
Trois tickets ouverts par Anne le 2026-10-24 depuis le bouton « Un retour ? » de l'espace, transmis par le fil [Tickets] :
- **#177** (`/actions`) : renommer l'onglet « Actions » en « Prospection ».
- **#185** (`/pipeline`) : « R1 et R2 » à la place de « Premier rendez-vous » et « Second rendez-vous ».
- **#178** (`/`) : pouvoir « Supprimer » un contact (par exemple un contact de test).

## Ce qui est fait (2026-10-24, dans la PR de la story 13.24)
- Menu de l'espace : « Actions » devient « Prospection » (`espace/src/layouts/Espace.astro`) ; titre de la page `/actions` et bouton du Bilan aussi. L'adresse `/actions` ne change pas.
- Étapes vendeur : `LIBELLES_ETAPES` (`site/src/server/contacts.ts`) affiche « R1 » et « R2 » partout (pipeline, fiches, listes, historique des nouveaux changements d'étape). Les valeurs rangées en base (`premier_rdv`, `second_rdv`) ne changent pas ; les changements d'étape déjà notés gardent leur ancien texte.
- Fiche contact : la section créée par la story 13.23 s'appelle « Supprimer ce contact », bouton « Supprimer définitivement », confirmation en tapant SUPPRIMER (EFFACER reste accepté). Message « Contact supprimé définitivement ». Même effet que l'effacement RGPD : fiche, historique, demandes du site et numéros relevés par Leedflow, noté au journal des droits.

## Ce qui est vérifié (2026-10-24)
- `e2e-espace.mjs` sur base locale remise à zéro : 243 vérifications, 0 échec (suppression refusée sans le mot, acceptée avec « supprimer » ; changement d'étape noté « Estimation en préparation → R2 »).
- `npm run build` et `npm run check` dans `site/` et `espace/` : 0 erreur.

## Ce qui reste
- Rien : PR n° 188 fusionnée par JB le 2026-10-24, tickets #177, #178 et #185 fermés en citant le commit e646d94.
