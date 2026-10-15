---
story: 13.3
epic: 13 — Espace de travail d'Anne
statut: in-progress
date: 2026-10-15
maj: 2026-10-15
---

# Story 13.3 — Application séparée sur la base partagée

## Objectif
Donner à l'espace de travail d'Anne sa propre application (Worker `anne-espace`, adresse `espace.annevialtissot.fr`), liée à la même base que le site, et y déplacer la gestion des demandes (`/gestion`), pour qu'une mise en ligne de l'un ne touche jamais l'autre (AD-19).

## Découpage (2026-10-15)
- **Phase 1** (PR de code, à fusionner par JB) : l'application `espace/` existe et reprend `/gestion` à l'identique ; le `/gestion` du site reste ouvert, Anne ne perd rien pendant la mise en place.
- **Mise en place Cloudflare** par JB (RUNBOOK § 4 sexies) : projet `anne-espace`, domaine, application Access ; Claude pose l'AUD.
- **Phase 2** (après l'essai d'Anne) : le site renvoie `/gestion` vers l'espace, le code de gestion passe dans `espace/src/server`, l'application Access `Gestion` du site est retirée.

## Ce qui est fait (phase 1)
- Question de JB du 2026-10-15 (« même dépôt ? ») : oui, un seul dépôt pour le site, l'espace et le futur espace client ; décision journalisée dans le `.memlog.md` du spine, transition notée dans AD-19.
- `espace/` : Astro 7 en rendu serveur, adaptateur Cloudflare, `worker.ts` qui vérifie le jeton Access avant tout (même contrôle que le site, `@site/server/acces.ts`), réponses `no-store` et `noindex`, en-têtes de sécurité. Pages `/gestion`, `/gestion/lead`, `/api/gestion/{rejouer,modelo,export,effacer}` reprises du site ; `/` renvoie vers `/gestion`.
- Code partagé sans copie : alias `@site` vers `site/src`. `site/src/server/gestion.ts` scindé : `gestion-donnees.ts` (lectures, écritures, relance programmée, aucun envoi) partagé ; `gestion.ts` garde l'envoi immédiat du site. Comportement du site inchangé.
- Relance depuis l'espace : programmée seulement, envoyée par la tâche planifiée du site (15 min au plus) ; l'espace n'a pas de clé Resend. Message de la fiche adapté.
- `scripts/base.mjs` : base `anne-leads` pour les constructions de `main` chez Cloudflare, base d'aperçu sinon. `scripts/partage.mjs` : polices et icônes copiées de `site/public` ; lien `site/node_modules` → `espace/node_modules` quand le site n'est pas installé (cas de la construction Cloudflare de l'espace).
- Documents : `espace/README.md`, `site/README.md` (partage), `RUNBOOK.md` (compte, § 4 sexies, journal), `CLAUDE.md` (carte, commandes), `epics.md` (découpage), spine et `.memlog.md`, statut de sprint.

## Ce qui est vérifié (2026-10-15)
- `espace` : `npm run build` et `npm run check` sans erreur (7 fichiers Astro, Worker). Construction refaite sans `site/node_modules` (cas Cloudflare) : réussie grâce au lien.
- `node scripts/e2e-espace.mjs` : **21 vérifications sur 21**. Site et espace sur la même base locale : 403 partout sans jeton valable (absent, mal signé, autre application, périmé, en-tête interne forgé), y compris feuilles de style et polices ; demande du site visible aussitôt dans l'espace ; relance programmée par l'espace puis envoyée par la tâche planifiée du site ; marque Modelo, export et effacement faits dans l'espace et lus dans la base du site ; pas de débordement sur ordinateur ni téléphone (captures `espace/.verif/`).
- `site` : `npm run build`, types du Worker sans erreur ; `node scripts/e2e-gestion.mjs` : **49 vérifications sur 49** après la scission de `gestion.ts`.
- Non vérifié : la liaison d'une même base D1 à deux Workers chez Cloudflare (jeton Cloudflare de Claude expiré) ; constatée à la première construction du projet `anne-espace` (RUNBOOK § 4 sexies, étape 1).

## Mise en place Cloudflare (2026-10-15 au soir, JB guidé dans le fil)
- Projet `anne-espace` créé depuis le dépôt (racine `/espace`, `npm ci && npm run build`, `npx wrangler deploy`, clé de construction du site) : construction au vert en 53 s, base `anne-leads` liée au Worker (vue d'ensemble Cloudflare). **Hypothèse (1) vérifiée** : une même base D1 sert deux Workers.
- Adresse `espace.annevialtissot.fr` rattachée ; vérifié par Claude : `curl` répondait 403 (message de l'espace) avant Access.
- Application Access `espace` (Public DNS, règle `Anne et JB`) : vérifié par Claude, l'adresse renvoie vers la page de connexion d'Access (302) ; l'AUD `a01520f8…f5e6` est lu dans cette redirection et posé dans `espace/wrangler.jsonc` (PR de suivi). `anne-espace.jbcholat.workers.dev` répond 403.

## Ce qui reste
- ~~JB : fusionner la PR, puis mise en place Cloudflare~~ fait le 2026-10-15 ; JB fusionne la PR de l'AUD, puis vérifie qu'il entre avec son code.
- Anne : essayer l'espace (même usage que `/gestion`).
- Phase 2 : retrait de `/gestion` du site.
- Hypothèses (2) Email Routing et (3) code de confirmation Gmail : reportées à la story 13.8, seule concernée.
