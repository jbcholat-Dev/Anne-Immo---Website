---
story: 10.2
epic: 10 — Capture des leads et backend
statut: in-progress
date: 2026-10-07
---

# Story 10.2 — Noyau serveur Cloudflare et base des leads

## Objectif
Le site est servi par le Worker Cloudflare avec l'adaptateur Astro, une base D1 en juridiction UE et un schéma versionné par migrations, reconstructible depuis le dépôt (critères : `_bmad-output/planning-artifacts/epics.md`, story 10.2).

## Écart assumé avec les critères
- `workerEntryPoint` n'existe pas dans l'adaptateur 14 : le mécanisme vérifié en 10.1 (`main` de `wrangler.jsonc` → `worker.ts`, `fetch: handle`) est utilisé.
- Plan Workers Paid : pas nécessaire pour cette story (D1, tâche planifiée et migrations marchent au plan gratuit). Recommandation : le prendre avant les premiers vrais leads, pour la restauration sur 30 jours (D1 Time Travel ; 7 jours au plan gratuit). Action J10 du tableau de bord.

## Ce qui est fait
- 2026-10-07 : RUNBOOK § 4 quater écrit **avant** la création des bases (noms, commande `--jurisdiction eu`, chemin dans le tableau de bord).

## Ce qui reste
1. JB : créer les deux bases (`anne-leads`, `anne-leads-apercu`) en juridiction UE et transmettre leurs identifiants (publics).
2. Claude : adaptateur, `worker.ts` (route `/api/retour` et route d'essai Cal.com reprises), migrations `0001-lead.sql` et `0002-lead-delivery.sql`, liaisons dans `wrangler.jsonc`, scripts de vérification adaptés à `dist/client`.
3. Vérifier : build, check, liens, captures ; mise en ligne de l'aperçu de la branche, pages identiques, base lue depuis une route ; procédure de redéploiement depuis une machine vierge.
