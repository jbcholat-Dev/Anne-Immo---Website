---
story: 13.1
epic: 13 — Espace de travail d'Anne
statut: review
date: 2026-10-09
---

# Story 13.1 — Spécification de l'espace de travail

## Objectif
Décrire dans la spec, avant toute construction, l'espace de travail quotidien d'Anne : un pipeline de ses contacts dans `/gestion`, qui lui dit chaque matin qui appeler et comment faire avancer chacun, avec Modelo réduit à la formalisation d'un mandat.

## Point de départ
Messages de JB du 2026-10-09 (fil Back-end, puis fil « Espace de travail d'Anne ») : Modelo est imposé par eXp et peu pratique ; Anne n'a pas de suivi structuré ; Leedflow enregistre et résume ses appels ; sa boîte pro est une Gmail reliée à son adresse eXp. Réponses de JB sur sa façon de travailler, notées dans `.memlog.md` de la spec.

## Ce qui est fait
- `SPEC.md` passe en **v6** : capacité **CAP-12 — Espace de travail d'Anne** (entrée de tout contact, parcours vendeur et acheteur avec étapes par défaut, prochaine action datée obligatoire, page « Aujourd'hui », vue pipeline, recopie Modelo au mandat, enrichissement Leedflow et Gmail en second temps, RGPD) ; paragraphe ajouté au « Why » ; seuil ajouté au Success signal ; contrainte Modelo (AD-14) amendée ; RGPD étendu ; un non-goal (pas de CRM complet) ; une hypothèse (étapes à valider par Anne) ; trois questions ouvertes (accès Leedflow, accès Gmail, consentement des contacts du jeu concours).
- `.memlog.md` : direction, contexte, capacité, décision, questions, validation.
- `epics.md` : epic 13 et stories 13.1 et 13.2. La capacité « Visibilité » prévue par la story 11.4 devient **CAP-13** (`epics.md`, `strategie-visibilite.md`).
- `sprint-status.yaml` : epic 13 ouvert.
- `RUNBOOK.md` § 6 : décision journalisée.
- E-mail au support Leedflow rédigé pour JB (10 questions : API, webhook, MCP, données par appel, historique, coût, hébergement, contrat de sous-traitance, conservation, information de la personne enregistrée).

## Ce qui est vérifié
- Relecture de cohérence : IDs CAP-1 à CAP-12 continus ; CAP-12 ne contredit ni la contrainte « Stockage de référence des leads » ni le non-goal « API Modelo » ; plus aucune mention de « CAP-12 Visibilité » hors du journal historique.
- Aucun code modifié : pas de build ni de captures nécessaires.

## Ce qui reste
- JB : valider CAP-12 dans la PR, et faire valider par Anne les étapes des deux parcours avec ses mots.
- JB : envoyer l'e-mail au support Leedflow ; vérifier sur le bulletin du jeu concours ce que les participants ont accepté.
- Story 13.2 : décision d'architecture Leedflow et Gmail (nouvelle AD, AD-14 amendée dans le spine), puis découpage des stories de construction.
- `spec-en-clair.html` (version lisible de la spec) à mettre à jour avec CAP-12 une fois la PR validée.
