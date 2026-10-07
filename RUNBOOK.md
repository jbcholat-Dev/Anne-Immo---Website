# RUNBOOK — site annevialtissot.fr

> La notice de secours du site : comment il est mis en ligne, où sont les comptes, comment refaire chaque opération sans dépendre de la mémoire de quelqu'un. Exigée par l'architecture (AD-10). Version 0 du 2026-09-26 : couvre l'aperçu. Les sections « production » se remplissent au lancement (story 12.4).

## 1. Carte des comptes

| Service | À quoi il sert | Compte | Prix |
|---|---|---|---|
| GitHub, dépôt `jbcholat-Dev/Anne-Immo---Website` | le code, le contenu, la documentation | JB (transfert vers une organisation à deux propriétaires prévu, story 12.3) | 0 € |
| Cloudflare, projet Workers `anne-vial-tissot-site` | héberge le site, le construit à chaque changement de `main` | JB, connexion via GitHub (décision du 2026-09-26, amende AD-9) | 0 € (plan gratuit) |
| Cloudflare Zero Trust, équipe `dry-truth-5a0d` | protège l'aperçu par un code envoyé par e-mail | même compte | 0 € (plan Free, 50 utilisateurs) |
| Google Drive, dossier partagé « Contenu site Anne » (à la racine du Drive de JB) | boîte de dépôt d'Anne, rangée exactement comme `contenu-anne/` : `stories/<bien>/` (texte, `photos/` HD, `autorisations/`), avis, guide, légal, portrait, vidéos ; Claude le lit par le connecteur Google Drive et range dans `contenu-anne/` par PR | JB (propriétaire), Anne (modification) | 0 € (espace gratuit de 15 Go) |
| Espace d'édition `annevialtissot.fr/admin` (Sveltia CMS) | Anne et JB y modifient ventes, pages, avis et coordonnées ; chaque enregistrement crée une demande de fusion que JB valide (story 7.13). Configuration : `site/public/admin/config.yml` | se connecte avec un compte GitHub **collaborateur du dépôt** (JB : son compte ; Anne : son propre compte, invitée) | 0 € |
| Cloudflare Worker `sveltia-cms-auth` | le petit programme qui fait « Se connecter avec GitHub » pour l'espace d'édition ; il garde l'identifiant et le secret de l'autorisation GitHub (secrets Cloudflare, jamais dans le dépôt) | JB, même compte Cloudflare | 0 € |
| GitHub, autorisation OAuth « Site Anne — édition » | permet la connexion GitHub depuis l'espace d'édition ; adresse de retour = adresse du Worker + `/callback` | JB (GitHub → Settings → Developer settings → OAuth Apps) | 0 € |
| Infomaniak | noms de domaine `annevialtissot.fr` et `.com` | JB (son adresse e-mail) ; **propriétaire légal des deux domaines : Anne** (décision du 2026-10-05, amende AD-9), JB contact administrateur. Sans option Domain Plus. Expiration 2027-10-05. | 17,52 € TTC la 1re année, ≈ 21 €/an ensuite |

Mots de passe : jamais dans ce dépôt, jamais manipulés par Claude. Coffre partagé à deux : à ouvrir (action J03).

## 2. L'aperçu (état actuel)

- Adresse : https://anne-vial-tissot-site.jbcholat.workers.dev
- Qui peut l'ouvrir : les adresses listées dans la règle Zero Trust `Anne et JB` (Access controls → Policies). Pour inviter quelqu'un : ajouter son adresse à cette règle. Session : 24 h.
- Non indexé : toutes les pages portent `noindex, nofollow` et `/robots.txt` interdit tout, tant que la variable de construction `PUBLIC_INDEXATION` n'est pas à `oui`.
- Mise à jour : automatique à chaque fusion dans `main` (Cloudflare Workers Builds). Réglages du projet : dossier racine `site`, construction `npm ci && npm run build`, mise en ligne `npx wrangler deploy`.
- Voir un build : Cloudflare → Workers & Pages → anne-vial-tissot-site → Deployments.
- **Ouverture provisoire (2026-10-07, story 10.1)** : l'application Zero Trust `essai-cal` laisse passer tout le monde (règle `Cal.com`, Bypass) sur le seul chemin `/api/essai-cal` de l'aperçu de la branche `claude/project-thread-axo12t`, pour recevoir les webhooks Cal.com. Le reste de l'aperçu reste protégé (vérifié en fenêtre privée). À supprimer quand la vraie route de la story 10.6 existe, en même temps que le webhook Cal.com d'essai.
- Secret `CAL_WEBHOOK_SECRET` (posé par JB le 2026-10-07) : même texte que le champ « Secret » du webhook Cal.com. Cal.com est au nom d'Anne (compte Google avialtissot@gmail.com) ; Resend au nom de JB.

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

## 4 bis. Retours sur l'aperçu (story 9.6)

- Le bouton « Un retour ? » de l'aperçu crée des tickets GitHub étiquetés `retour-apercu` : https://github.com/jbcholat-Dev/Anne-Immo---Website/issues?q=is%3Aissue+is%3Aopen+label%3Aretour-apercu
- Il a besoin d'une clé GitHub, secret `GITHUB_TOKEN` du projet Cloudflare. **Clé créée le 2026-09-26, à renouveler avant le 2026-09-26 + 1 an** (action à prévoir dans le tableau de bord un mois avant). Pour la créer : GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token ; nom `cloudflare-retours-apercu` ; expiration 1 an ; Repository access : Only select repositories → `Anne-Immo---Website` ; Permissions → Repository permissions → Issues : Read and write (rien d'autre). Copier la clé une seule fois.
- Pour la poser : Cloudflare → Workers & Pages → anne-vial-tissot-site → Settings → Variables and Secrets → Add → type Secret, nom `GITHUB_TOKEN`, valeur = la clé → Deploy. Aucun redéploiement du code n'est nécessaire.
- Pour la retirer ou la remplacer : même écran (supprimer, ou Edit) ; côté GitHub, révoquer l'ancienne clé.
- Sans clé, le bouton répond « L'envoi n'est pas encore branché » ; rien n'est perdu côté site, la remarque est à envoyer à JB.
- Fin de vie : le bouton n'existe pas en production ; `worker.ts` est remplacé par le noyau serveur de l'epic 10.

## 4 ter. Si JB quitte le projet : reprendre les domaines

Anne est déjà propriétaire légale des domaines ; seule la gestion est sur le compte Infomaniak de JB. Pour la lui rendre : Anne crée un compte Infomaniak (gratuit) ; JB, dans son Manager Infomaniak, ouvre le domaine et utilise le transfert vers une autre organisation Infomaniak (libellé exact à vérifier le jour venu ; le titulaire ne change pas) vers le compte d'Anne ; Anne accepte. Les serveurs de noms Cloudflare ne changent pas, le site reste en ligne pendant l'opération. Vérifier ensuite le renouvellement automatique et la carte bancaire sur le compte d'Anne.

État au 2026-10-05 : les deux domaines sont dans le compte Cloudflare (plan gratuit), serveurs de noms `camilo.ns.cloudflare.com` et `elly.ns.cloudflare.com`, actifs. Reste : DNSSEC à activer (Cloudflare → domaine → DNS → Settings → DNSSEC, puis copier l'enregistrement DS chez Infomaniak), validation en deux étapes sur le compte Infomaniak.

## 4 quater. Base des leads (backend, story 10.2)

Deux bases Cloudflare D1 (base de données SQL hébergée par Cloudflare), **toutes deux en juridiction UE** : les données y restent dans l'Union européenne (AD-16). Le choix de la juridiction est **irréversible** : une base créée sans elle doit être supprimée et recréée.

| Base | Sert à | Nom |
|---|---|---|
| production | les vrais leads, branche `main` | `anne-leads` |
| aperçu | les essais des branches de travail | `anne-leads-apercu` |

Commandes (depuis `site/`, après `npx wrangler login`) :

```bash
npx wrangler d1 create anne-leads --jurisdiction eu
npx wrangler d1 create anne-leads-apercu --jurisdiction eu
```

Ou depuis le tableau de bord : Cloudflare → Storage & Databases → D1 SQL Database → Create → nom ci-dessus → Location : **Specify jurisdiction → European Union (EU)**.

Chaque base a un identifiant (`database_id`), public, recopié dans `site/wrangler.jsonc`. Le schéma n'est modifié que par les fichiers numérotés de `site/migrations/`, jamais à la main (AD-10).

## 5. Pièges irréversibles

- Ne jamais mettre `PUBLIC_INDEXATION=oui` sur une adresse d'aperçu : Google mémoriserait une version incomplète.
- Ne jamais éteindre Access tant que des photos sans autorisation écrite sont sur le site.
- Base de données (backend, epic 10) : elle se crée avec une juridiction UE irréversible ; commande et noms au § 4 quater, écrits avant la création (AD-10).

## 6. Journal des changements de ce document

- 2026-09-26 : version 0, aperçu en ligne et protégé (stories 9.1 à 9.5) ; § 4 bis retours (story 9.6). Vérifié par JB : page de connexion, accueil, `/robots.txt` = `Disallow: /`.
- 2026-10-04 : rien ne change dans les comptes. Pour mémoire, l'hébergeur déclaré dans les mentions légales est Cloudflare, Inc. (101 Townsend Street, San Francisco) ; il change si l'hébergement change. Deux garde-fous de contenu bloquent désormais la mise en ligne : une story publiée sans autorisation écrite, un texte anglais manquant (voir `site/README.md`).
- 2026-10-05 : domaines `.fr` et `.com` achetés chez Infomaniak depuis le compte de JB, Anne propriétaire légale (amende AD-9) ; § 4 ter ajouté (reprise des domaines, serveurs de noms Cloudflare actifs).
- 2026-10-05 : Anne dépose son contenu dans le dossier Google Drive « Contenu site Anne » et ne fait plus de commit (décision de JB). Les originaux lourds restent sur Drive ; Claude range les versions utiles dans `contenu-anne/` par PR. Si Claude ne peut plus lire le dossier : reconnecter le connecteur Google Drive dans claude.ai (Réglages → Connecteurs) puis l'activer dans les réglages du projet.
- 2026-10-05 (après-midi) : le dossier Drive est rangé comme `contenu-anne/` (mêmes noms, une vente = un dossier `stories/<bien>/` avec ses photos HD). L'ancien dossier « Site web - Anne Immo » est devenu « Contenu site Anne » ; le découpage en 5 sous-dossiers du matin est archivé sous « ARCHIVE - ancien Contenu site Anne (ne plus utiliser) ». Piège : sur Drive, seul le propriétaire d'un fichier peut le déplacer ou le supprimer ; les fichiers déposés par Anne ne peuvent être supprimés que par elle (Claude les renomme « À SUPPRIMER - … »).
- 2026-10-05 (fin d'après-midi) : espace d'édition Sveltia CMS à `/admin` (décision de JB, story 7.13). Trois éléments à créer par JB : le Worker `sveltia-cms-auth`, l'autorisation OAuth GitHub, l'invitation d'Anne comme collaboratrice. Le Drive reste l'archive des photos HD et des vidéos. Pièges : une autorisation OAuth GitHub voit tous les dépôts du compte qui s'y connecte (sans risque pour Anne, dont le compte n'a que ce dépôt) ; si le Worker est supprimé ou son secret changé, plus personne ne peut se connecter à l'espace d'édition (le site, lui, continue de fonctionner).
- 2026-10-07 : essai du webhook Cal.com (story 10.1) : ouverture provisoire du chemin `/api/essai-cal` dans Access et secret `CAL_WEBHOOK_SECRET` (§ 2). § 4 quater : création des bases D1 en juridiction UE (story 10.2), écrite avant d'être lancée.
