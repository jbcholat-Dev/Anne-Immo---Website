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
- 2026-10-07 : JB crée les deux bases en juridiction UE (confirmé par JB) : `anne-leads` (`59b15fb0-…`), `anne-leads-apercu` (`06a92884-…`).
- 2026-10-07 : adaptateur `@astrojs/cloudflare` 14.3.3 (`imageService: 'passthrough'`, `prerenderEnvironment: 'node'`, `session: false` : ni KV ni Images créés) ; `worker.ts` = `main`, garde `/api/retour` et `/api/essai-cal`, confie le reste à Astro (`handle`), `scheduled` vide ; route `src/pages/api/sante.ts` ; migrations `0001-lead.sql` (AD-6, index unique partiel sur `token` pour `diagnostic`) et `0002-lead-delivery.sql` ; liaison `DB` sur la base d'aperçu ; migrations appliquées en fin de construction chez Cloudflare (`scripts/migrations-ci.mjs`) ; types Cloudflare générés (`wrangler types`) et code serveur vérifié à part (`tsconfig.worker.json`) ; scripts de vérification passés à `dist/client`.

## Ce qui est vérifié (2026-10-07, en local)
- `npm run build` : 24 pages prérendues, Worker construit (`dist/server/entry.mjs`) ; la configuration générée ne contient ni KV ni Images.
- `npm run check` : 0 erreur (site et code serveur).
- `node scripts/liens.mjs` : 25 pages, 1478 liens, 0 cassé. `npm run verif` : aucune erreur console. `scripts/e2e-diagnostic.mjs` : parcours complet, aucune erreur.
- `wrangler d1 migrations apply DB --local` : 2 migrations appliquées. `wrangler dev` : `/`, `/vendre`, `/contact`, `/diagnostic`, `/diagnostic/questions`, `/en`, `/guide`, `/realisation`, `/a-propos`, `/admin/`, `/robots.txt` → 200 ; adresse inconnue → 404 ; `/api/sante` → `{"ok":true,"migrations":2}` ; `/api/retour` et `/api/essai-cal` répondent comme avant (signature Cal.com vérifiée) ; tâche planifiée déclenchée → 200.

## Ce qui reste
1. Incident du 2026-10-07 : les commandes `npm run deploy` / `deploy:apercu` réglées dans Cloudflare n'existaient que sur cette branche ; ce réglage étant commun à toutes les branches, les mises en ligne de `main` ont échoué. JB remet les commandes d'origine ; les migrations passent dans `npm run build` (`scripts/migrations-ci.mjs`, actif seulement chez Cloudflare).
2. Vérifier en ligne sur l'aperçu de la branche : pages identiques, `/api/sante` → `migrations: 2`, bouton « Un retour ? » et webhook Cal.com toujours fonctionnels.
3. Après fusion : même contrôle sur l'aperçu principal.
