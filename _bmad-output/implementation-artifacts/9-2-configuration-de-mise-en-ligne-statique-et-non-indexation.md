---
story: 9.2
epic: 9 — Mise en ligne d'aperçu
statut: done
date: 2026-09-26
commit: (voir git log : « Story 9.2 »)
---

# Story 9.2 — Configuration de mise en ligne statique et non-indexation

## Objectif
Que Cloudflare (l'hébergeur) sache servir le site construit comme un site statique, et que l'aperçu ne soit jamais mémorisé par les moteurs de recherche tant que la vraie V1 n'est pas prête.

## Ce qui est fait
- `site/wrangler.jsonc` : fichier de configuration Cloudflare. Il dit « sers le dossier `dist` », page 404 du site pour les adresses inconnues, adresses sans barre finale (cohérent avec `trailingSlash: 'never'`). Aucun secret dedans.
- `site/src/pages/robots.txt.ts` : génère le `robots.txt` (le petit fichier qui dit aux moteurs ce qu'ils ont le droit d'indexer). Fermé (`Disallow: /`) par défaut ; ouvert quand le réglage de construction `PUBLIC_INDEXATION` vaut `oui`.
- `site/src/layouts/Base.astro` : la balise `<meta name="robots" content="noindex, nofollow">` est posée sur toutes les pages tant que `PUBLIC_INDEXATION` ≠ `oui`. La production (story 12.4) mettra ce réglage à `oui` dans les paramètres de construction du projet Cloudflare.
- `site/.env.example` : documente le réglage pour le travail en local.
- `wrangler` (l'outil en ligne de commande de Cloudflare) ajouté aux dépendances de développement, pour que la commande de mise en ligne `npx wrangler deploy` fonctionne chez Cloudflare comme en local.

## Vérification
- `npm run build` : 19 pages, `robots.txt` = `Disallow: /`, toutes les pages portent `noindex, nofollow`.
- `PUBLIC_INDEXATION=oui npm run build` : `robots.txt` = `Allow: /`, aucune balise noindex.
- `npm run check` : 0 erreur. `node scripts/liens.mjs` : 1 128 liens, 0 cassé.
- `npx wrangler deploy --dry-run` : configuration acceptée (simulation, rien mis en ligne).

## Ce qui reste (autres stories)
- 9.1 : JB connecte le dépôt à Cloudflare Workers Builds avec : dossier racine `site`, commande de construction `npm ci && npm run build`, commande de mise en ligne `npx wrangler deploy`.
- 9.3 : accès protégé. 9.4 : RUNBOOK. 9.5 : vérification de bout en bout sur l'adresse réelle.
- 11.3 : le plan du site (sitemap) sera annoncé dans `robots.txt` quand il existera.

## Décision journalisée
JB (2026-09-26) : le compte Cloudflare est le sien, connecté via GitHub, et non un compte au nom d'Anne. Amende AD-9 ; voir le journal du spine d'architecture.
