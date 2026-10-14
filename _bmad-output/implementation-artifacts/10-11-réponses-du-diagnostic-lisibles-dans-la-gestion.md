---
story: 10.11
epic: 10 — Capture des leads et backend
statut: done
date: 2026-10-13
---

# Story 10.11 — Réponses du diagnostic lisibles dans l'espace de gestion

## Objectif
Ticket GitHub #144 d'Anne (2026-10-13) : « Je suis allée dans Gestion, on ne peut pas voir de manière lisible les réponses aux questions. » Sur la fiche d'un diagnostic (`/gestion/lead`), les réponses et les scores s'affichaient en JSON brut. Anne doit pouvoir préparer son appel en lisant chaque réponse sous sa question.

La seconde partie du ticket (« les données ne sont pas protégées, aucun code ») a été vérifiée par le fil « Traitement des tickets » : sans connexion, `/gestion` et `/api/gestion` renvoient vers la page de code Cloudflare Access ; Anne n'a pas eu de code à taper parce que sa session Access était encore ouverte. Rien à changer.

## Ce qui est fait
- Fiche d'un diagnostic : un cadre « Diagnostic » avec le score sur 100, le profil, la sortie, les trois sous-scores (brut et %), un bouton « Ouvrir le rapport PDF du vendeur » (le même lien signé de 7 jours que le vendeur, story 10.10), puis chaque question et sa réponse en clair, rangées par thème (préparation, visibilité, efficacité, situation, objectifs, obstacles, solution), avec les points des questions notées (q10 : points de l'ensemble visites et offres, affichés sur la ligne des offres). Les champs `answers`, `scores` et `band` ne sont plus affichés en JSON.
- `src/server/messages.ts` : `reponsesDiagnostic()` exportée, une seule source pour la notification à Anne et la fiche.
- `scripts/e2e-gestion.mjs` : un diagnostic d'essai, ses réponses en clair, ses points, le lien du rapport, l'absence de JSON, et la fiche capturée sur ordinateur et téléphone.

## Ce qui est vérifié
- `node scripts/e2e-gestion.mjs` : 43 constats bons (dont les 4 nouveaux), captures `.verif/gestion-diagnostic-ordinateur.png` et `-telephone.png` relues, sans défilement horizontal.
- `e2e-diagnostic` 31, `e2e-formulaires` 25 : bons. `npm run check` : 0 erreur. `npm run build` : sans erreur.

## Ce qui reste
- Rien. PR #146 fusionnée par JB le 2026-10-14 ; ticket #144 fermé à la fusion.
