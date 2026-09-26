---
story: 9.6
epic: 9 — Mise en ligne d'aperçu
statut: review
date: 2026-09-26
---

# Story 9.6 — Boucle de retours sur l'aperçu

## Objectif
Qu'Anne et JB puissent noter une remarque depuis n'importe quelle page de l'aperçu, sur téléphone, et que chaque remarque arrive là où Claude la lit et la trace : un ticket GitHub.

## Ce qui est fait
- `site/src/components/RetourApercu.astro` : bouton flottant « Un retour ? » en bas à droite, fenêtre avec la page en cours, un champ texte, envoi ; messages clairs selon le résultat (numéro du ticket, clé absente, GitHub indisponible, pas de réseau). Rendu par `Base.astro` seulement quand le site n'est pas indexable, donc jamais en production. Masqué pendant les captures Playwright (`navigator.webdriver`).
- `site/worker.ts` : point d'entrée Cloudflare. `/api/retour` (POST) vérifie la remarque (non vide, 2 000 caractères maximum), lit l'auteur dans l'en-tête posé par Cloudflare Access, crée le ticket GitHub (titre `[Retour aperçu] <page> : <début>`, étiquette `retour-apercu`, corps avec page, auteur, écran, date, navigateur, remarque). Si l'étiquette est refusée, le ticket est créé sans elle. Tout le reste du site est servi par Cloudflare directement.
- `site/wrangler.jsonc` : `main`, liaison `ASSETS`, `run_worker_first: ["/api/*"]`, variable publique `GITHUB_REPO`.
- Secret `GITHUB_TOKEN` : côté Cloudflare uniquement ; `.dev.vars` ignoré par Git, modèle `.dev.vars.example`.
- Documentation : `site/README.md` (§ Retours), `RUNBOOK.md` (§ 4 bis : créer, poser, retirer la clé), `CLAUDE.md` (règle : lire les tickets à chaque session, fermer en citant le commit).

## Vérification
- `npm run build` : 19 pages ; le bouton est présent dans chaque page de l'aperçu (`data-retour`) et absent quand `PUBLIC_INDEXATION=oui`.
- `npm run check` : 0 erreur.
- `npx wrangler dev` en local, routes exercées avec curl : `/robots.txt` et `/` servis (200), page inconnue 404, `GET /api/retour` 405, corps vide 400, corps non JSON 400, `/api/autre` 404, sans clé 503 `cle_absente`, avec une clé fausse : GitHub répond 401 et le site renvoie 502 `github` (donc l'appel GitHub part bien et l'erreur est propre).
- Non vérifié ici : la création réelle d'un ticket (exige la clé de JB) et le rendu du bouton sur téléphone. C'est l'essai de JB après l'action J15 : ouvrir l'aperçu, envoyer « test », voir le ticket dans GitHub.

## Ce qui reste
- JB : créer la clé GitHub et la poser dans Cloudflare (action J15, 10 min, RUNBOOK § 4 bis).
- Claude : à chaque session, lire les tickets ouverts et les traiter (règle CLAUDE.md).
- Epic 10 : `worker.ts` est remplacé par le noyau serveur ; la route `/api/retour` y migre ou disparaît au lancement.

## Écart assumé
Un point d'entrée serveur écrit à la main avant l'epic 10. Justification : outil de la phase d'aperçu, une seule route, aucune donnée personnelle stockée côté site (le ticket vit dans GitHub, accès JB), remplacé au lancement. Journalisé dans `site/README.md` § Retours.
