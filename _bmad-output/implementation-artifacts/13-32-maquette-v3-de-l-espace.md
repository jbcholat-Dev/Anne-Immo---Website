---
story: 13.32
epic: 13 — Espace de travail d'Anne
statut: done
date: 2026-10-24
maj: 2026-10-26
---

# Story 13.32 — Maquette v3 de l'espace d'Anne

## Objectif
Demande de JB (2026-10-24) : « mettre à jour la maquette de l'espace, on va affiner le design et les fonctionnalités ici avant de repousser sur le site ». La maquette redevient le lieu où l'on décide, avant de coder.

## Ce qui est fait
- Maquette https://claude.ai/artifact/RKkZ5qPnxdkwaDz4drrZLs passée de la v2 (2026-10-21) à la v3 : elle reprend ce qui est en ligne depuis (13.22 à 13.30) et dessine ce qui vient (13.31 en-tête et historique, 13.26 à 13.28 e-mails groupés).
- Écrans ajoutés : fiche contact, noter la suite (cliquable), liste des contacts, pipeline par étape. Écrans mis à jour : Qualifier (critères d'un acheteur), Acheteurs (ligne « Cherche »), navigation ordinateur (Pipeline, Prospection).

## Ce qui est vérifié
- Données fictives seulement (noms entre crochets, numéro et e-mail factices).
- Les libellés, questions, critères, filtres, étapes et choix de « Noter la suite » sont repris du code en ligne (`espace/src/server/pipeline.ts`, `espace/src/pages/contacts/suite.astro`, `site/src/server/contacts.ts`) ; seul l'en-tête en quatre cases et l'historique replié de la fiche (13.31) sont nouveaux.
- Pas de vérification par rendu : la maquette se relit dans claude.ai.

## Hypothèses à valider
- Échelle de maturité en trois crans (Découverte, Réfléchit, Prêt).
- « Rendez-vous et visites » compte les R1, R2 et visites d'acheteurs.
- Menu du téléphone : Aujourd'hui, Contacts, Ajouter, Pipeline, Bilan (Prescripteurs, Acheteurs et Prospection restent sur ordinateur).

## Ce qui reste
- Retours de JB et d'Anne sur la maquette, puis une story par changement retenu.

## Clôture
- 2026-10-26 : JB demande une recopie à l'identique de l'espace en ligne, sur ordinateur seulement. La v3 est remplacée par la v4 (story 13.34) ; ses écrans restent dans l'historique des versions de la maquette.
