# RUNBOOK — site annevialtissot.fr

> La notice de secours du site : comment il est mis en ligne, où sont les comptes, comment refaire chaque opération sans dépendre de la mémoire de quelqu'un. Exigée par l'architecture (AD-10). Version 0 du 2026-09-26 : couvre l'aperçu. Les sections « production » se remplissent au lancement (story 12.4).

## 1. Carte des comptes

| Service | À quoi il sert | Compte | Prix |
|---|---|---|---|
| GitHub, dépôt `jbcholat-Dev/Anne-Immo---Website` | le code, le contenu, la documentation | JB (transfert vers une organisation à deux propriétaires prévu, story 12.3) | 0 € |
| Cloudflare, projet Workers `anne-vial-tissot-site` | héberge le site, le construit à chaque changement de `main` | JB, connexion via GitHub (décision du 2026-09-26, amende AD-9) | 0 € (plan gratuit) |
| Cloudflare Zero Trust, équipe `dry-truth-5a0d` | protège l'aperçu par un code envoyé par e-mail | même compte | 0 € (plan Free, 50 utilisateurs) |
| Infomaniak | nom de domaine `annevialtissot.fr` et `.com` | à créer (action J06) | ≈ 21 €/an |

Mots de passe : jamais dans ce dépôt, jamais manipulés par Claude. Coffre partagé à deux : à ouvrir (action J03).

## 2. L'aperçu (état actuel)

- Adresse : https://anne-vial-tissot-site.jbcholat.workers.dev
- Qui peut l'ouvrir : les adresses listées dans la règle Zero Trust `Anne et JB` (Access controls → Policies). Pour inviter quelqu'un : ajouter son adresse à cette règle. Session : 24 h.
- Non indexé : toutes les pages portent `noindex, nofollow` et `/robots.txt` interdit tout, tant que la variable de construction `PUBLIC_INDEXATION` n'est pas à `oui`.
- Mise à jour : automatique à chaque fusion dans `main` (Cloudflare Workers Builds). Réglages du projet : dossier racine `site`, construction `npm ci && npm run build`, mise en ligne `npx wrangler deploy`.
- Voir un build : Cloudflare → Workers & Pages → anne-vial-tissot-site → Deployments.

## 3. Refaire une mise en ligne

- Normalement : rien à faire, pousser sur `main` suffit.
- Si un build échoue : Deployments → le build en rouge → lire le journal ; corriger dans le dépôt ; pousser à nouveau. « Retry build » rejoue le même code.
- Revenir à la version précédente : Deployments → version précédente → Rollback.
- Depuis une machine vierge : `git clone`, `cd site`, `npm ci`, `npm run build`, puis `npx wrangler deploy` (demande une connexion Cloudflare, `npx wrangler login`).

## 4. Basculer en production (à faire au lancement, story 12.4)

1. Domaine acheté chez Infomaniak, serveurs de noms pointés vers Cloudflare (story 12.1).
2. Cloudflare → projet → Domains → Add Domain : `annevialtissot.fr` ; `.com` en redirection permanente vers `.fr`.
3. Settings → Build → Variables : ajouter `PUBLIC_INDEXATION` = `oui`, puis relancer un build. Vérifier `/robots.txt` = `Allow: /` et l'absence de `noindex`.
4. Access : retirer la protection sur `annevialtissot.fr` (la garder sur l'adresse `workers.dev`, ou éteindre cette adresse).
5. Critères de lancement de la story 12.5 tous cochés avant l'étape 3.

## 5. Pièges irréversibles

- Ne jamais mettre `PUBLIC_INDEXATION=oui` sur une adresse d'aperçu : Google mémoriserait une version incomplète.
- Ne jamais éteindre Access tant que des photos sans autorisation écrite sont sur le site.
- Base de données (backend, epic 10) : elle se crée avec une juridiction UE irréversible ; la commande sera écrite ici avant d'être exécutée (AD-10).

## 6. Journal des changements de ce document

- 2026-09-26 : version 0, aperçu en ligne et protégé (stories 9.1 à 9.4).
