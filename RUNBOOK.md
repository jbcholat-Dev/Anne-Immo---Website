# RUNBOOK — site annevialtissot.fr

> La notice de secours du site : comment il est mis en ligne, où sont les comptes, comment refaire chaque opération sans dépendre de la mémoire de quelqu'un. Exigée par l'architecture (AD-10). Version 0 du 2026-09-26 : couvre l'aperçu. Les sections « production » se remplissent au lancement (story 12.4).

## 1. Carte des comptes

| Service | À quoi il sert | Compte | Prix |
|---|---|---|---|
| GitHub, dépôt `jbcholat-Dev/Anne-Immo---Website` | le code, le contenu, la documentation | JB (transfert vers une organisation à deux propriétaires prévu, story 12.3) | 0 € |
| Cloudflare, projet Workers `anne-vial-tissot-site` | héberge le site, le construit à chaque changement de `main` | JB, connexion via GitHub (décision du 2026-09-26, amende AD-9) | 0 € (plan gratuit) |
| Cloudflare Zero Trust, équipe `dry-truth-5a0d` | protège l'aperçu par un code envoyé par e-mail | même compte | 0 € (plan Free, 50 utilisateurs) |
| Google Drive, dossier partagé « Contenu site Anne » (à la racine du Drive de JB) | boîte de dépôt d'Anne, rangée exactement comme `contenu-anne/` : `stories/<bien>/` (texte, `photos/` HD, `autorisations/`), avis, guide, légal, portrait, vidéos ; Claude le lit par le connecteur Google Drive et range dans `contenu-anne/` par PR | JB (propriétaire), Anne (modification) | 0 € (espace gratuit de 15 Go) |
| Espace d'édition `annevialtissot.fr/admin` (Sveltia CMS) | Anne et JB y modifient ventes, pages, textes des pages (accueil, Vendre, Acheter, Contact, story 7.20), avis et coordonnées ; chaque enregistrement crée une demande de fusion, fusionnée seule quand l'auteur passe la fiche en « En relecture » ou « Prêt » et que la construction est au vert (§ 2 bis, story 9.7 ; story 7.13). Configuration : `site/public/admin/config.yml` | se connecte avec un compte GitHub **collaborateur du dépôt** (JB : son compte ; Anne : son propre compte, invitée) | 0 € |
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
- **Chemin ouvert au public : `/api/webhook-cal`** (story 10.6, remplace l'essai `/api/essai-cal` du 2026-10-07) : l'application Zero Trust du webhook (règle `Cal.com`, Bypass) laisse passer tout le monde sur ce seul chemin, pour que Cal.com puisse prévenir le site d'une réservation. La route refuse tout message sans la bonne signature (401). Le reste de l'aperçu reste protégé : à revérifier en fenêtre privée après chaque changement dans Access. Adresse du webhook dans Cal.com : `https://anne-vial-tissot-site.jbcholat.workers.dev/api/webhook-cal` (celle de la branche `claude-project-thread-axo12t-anne-vial-tissot-site…` le temps d'un essai).
- Secret `CAL_WEBHOOK_SECRET` (posé par JB le 2026-10-07) : même texte que le champ « Secret » du webhook Cal.com. Cal.com est au nom d'Anne (compte Google avialtissot@gmail.com) ; Resend au nom de JB.
- **Rendez-vous par téléphone** (décision de JB du 2026-10-08) : le rendez-vous Cal.com « Premier échange » a pour lieu le numéro du participant ; c'est Anne qui appelle (elle enregistre et résume ses appels avec un service sur son téléphone). Ne pas remettre Google Meet sans décision de JB.

## 2 bis. Fusion automatique des PR sans impact sur le code (story 9.7)

Décision de JB du 2026-10-10 : il ne valide lui-même que les demandes de fusion (PR) qui changent le site (code, mise en page, back-end, réglages). Les autres fusionnent seules dans `main`, donc partent en ligne seules.

- **Fusionnent seules**, une fois la construction Cloudflare (`Workers Builds: anne-vial-tissot-site`) au vert sur le dernier commit :
  - **contenu** : un enregistrement de l'espace d'édition (branche `cms/…`) qui ne touche que `contenu-anne/`. Une fiche au statut « Brouillon » reste en attente ; elle part quand Anne (ou JB) la passe en « En relecture » ou « Prêt ».
  - **suivi** : une PR qui ne touche que `_bmad-output/`, `_bmad/`, `.claude/`, `maquettes/` ou des fichiers `.md` hors des dossiers lus par le site (`RUNBOOK.md`, `CLAUDE.md`, `site/README.md`…).
- **Restent à JB** : tout le reste (`site/` hors documents, `design-system/`, `.github/`, un fichier de `contenu-anne/` modifié par Claude), une PR en brouillon, une PR étiquetée `a-valider` (pour garder la main sur une PR précise : lui mettre cette étiquette), une construction en échec, une PR en conflit.
- Comment : `.github/workflows/fusion-auto.yml` (GitHub Actions, les petits programmes que GitHub lance lui-même) et la règle de tri `.github/scripts/fusion-auto.mjs` (essai sans GitHub : `node .github/scripts/fusion-auto.mjs --essai`). Le programme utilisé est toujours celui de `main` : une PR ne peut pas changer la règle pour se fusionner elle-même.
- Voir ce qui s'est passé : GitHub → onglet Actions → « Fusion automatique » → le passage voulu ; chaque PR y a une ligne (« fusionnée automatiquement », « laissée à JB » et pourquoi, « on attend »).
- Rattraper : Actions → « Fusion automatique » → Run workflow repasse toutes les PR ouvertes.
- Couper la fusion automatique : Actions → « Fusion automatique » → ⋯ → Disable workflow (réversible).
- Réglages GitHub nécessaires : Settings → Actions → General → Actions autorisées (« Allow all actions » ou au moins celles de GitHub) ; aucune règle de protection de `main` qui exige une approbation (sinon GitHub refuse la fusion et la PR reste ouverte, rien ne casse).

## 3. Refaire une mise en ligne

- Normalement : rien à faire, pousser sur `main` suffit.
- Si un build échoue : Deployments → le build en rouge → lire le journal ; corriger dans le dépôt ; pousser à nouveau. « Retry build » rejoue le même code.
- Revenir à la version précédente : Deployments → version précédente → Rollback.
- Depuis une machine vierge : `git clone`, `cd site`, `npm ci`, `npm run build`, puis `npx wrangler deploy` (demande une connexion Cloudflare, `npx wrangler login`).

## 4. Basculer en production (à faire au lancement, story 12.4)

1. Domaine acheté chez Infomaniak, serveurs de noms pointés vers Cloudflare (story 12.1).
2. Cloudflare → projet → Domains → Add Domain : `annevialtissot.fr` ; `.com` en redirection permanente vers `.fr`.
3. Dans `site/wrangler.jsonc`, passer `ENVIRONNEMENT` à `production` (les e-mails partent alors vers Anne et les prospects, et non plus vers `BOITE_TEST`) et brancher la base `anne-leads` (story 12.4).
3 bis. Settings → Build → Variables : ajouter `PUBLIC_INDEXATION` = `oui`, puis relancer un build. Vérifier `/robots.txt` = `Allow: /` et l'absence de `noindex`.
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

Créées le 2026-10-07 par JB, juridiction UE confirmée : `anne-leads` = `59b15fb0-cb56-45a7-a61a-378548fd6fe4`, `anne-leads-apercu` = `06a92884-c6f1-4d02-afbe-976d11543385`. Jusqu'au lancement, **toutes** les mises en ligne (y compris `main`) utilisent `anne-leads-apercu` ; `anne-leads` sera branchée à la story 12.4.

Le schéma n'est modifié que par les fichiers numérotés de `site/migrations/`, jamais à la main (AD-10). Ils sont appliqués automatiquement à chaque construction chez Cloudflare, par `scripts/migrations-ci.mjs` à la fin de `npm run build` (seulement quand `WORKERS_CI=1`, posé par Cloudflare) ; les réglages de construction du projet ne changent pas (Deploy command `npx wrangler deploy`, Version command `npx wrangler versions upload`). **Piège** : ces réglages valent pour toutes les branches, `main` compris ; ne jamais y mettre une commande qui n'existe que sur une branche (incident du 2026-10-07 : `main` n'a plus été mis en ligne pendant quelques minutes). À la main, depuis `site/` après `npm run build` : `npx wrangler d1 migrations apply DB --remote`.

Contrôle : `GET /api/sante` répond `{"ok":true,"migrations":N}` (N = nombre de fichiers de `migrations/`), 503 si la base ne répond pas.

**Secrets du Worker** (Cloudflare → Workers & Pages → anne-vial-tissot-site → Settings → Variables and Secrets ; jamais dans le dépôt) :

| Nom | Sert à | Posé | Rotation |
|---|---|---|---|
| `GITHUB_TOKEN` | bouton « Un retour ? » de l'aperçu, tickets d'essai | 2026-09-26 | avant le 2026-09-26 + 1 an (§ 4 bis) |
| `CAL_WEBHOOK_SECRET` | vérifier que les messages viennent de Cal.com | 2026-10-07 | inventer un nouveau texte, le mettre dans Cloudflare puis dans le webhook Cal.com |
| `RESEND_API_KEY` | envoyer les e-mails du site (Resend → API Keys, nom `site-anne-cloudflare`, droit « Sending access », domaine `annevialtissot.fr`) | 2026-10-07 | en créer une nouvelle dans Resend, la poser ici, puis supprimer l'ancienne dans Resend |
| `TURNSTILE_SECRET_KEY` | vérifier le jeton anti-robot des formulaires (Turnstile → `site-anne` → Settings → Secret key) | 2026-10-07 | « Rotate » dans Turnstile, puis poser la nouvelle ici aussitôt (l'ancienne cesse de marcher) |
| `LIEN_SECRET` | signer les liens envoyés par e-mail : téléchargement du guide (7 jours) et désabonnement de la séquence (story 10.5). Un long texte aléatoire, inventé une fois | à poser par JB (action J31) | le changer rend **tous** les liens déjà envoyés invalides (guide et désabonnement) : ne le changer qu'en cas de fuite, puis répondre à la main aux prospects qui écrivent |
| `BOITE_TEST` | adresse qui reçoit **tous** les e-mails tant que le site n'est pas lancé, puis ceux du test quotidien (AD-12) | 2026-10-07 (adresse de JB) | changer la valeur si JB passe la main |

**Formulaires et e-mails (story 10.3)** : les demandes (contact, estimation, guide) sont dans la table `lead`, ce qui doit partir pour chacune dans `lead_delivery` (`status` : `pending`, `delivered`, `failed` ; `last_error` dit pourquoi). Un e-mail en échec est réessayé toutes les 15 minutes, 5 fois au plus. Tant que `ENVIRONNEMENT` vaut `apercu` dans `site/wrangler.jsonc`, chaque demande est marquée test et tous les e-mails vont à `BOITE_TEST`, objet préfixé `[TEST]`. Expéditeur `anne@annevialtissot.fr` (domaine vérifié dans Resend le 2026-10-07) ; les réponses des prospects vont à `BOITE_ANNE` (`avialtissot@gmail.com`, `wrangler.jsonc`). Pour voir ce qui n'est pas parti : Cloudflare → Storage & Databases → D1 → `anne-leads-apercu` → Console : `SELECT lead_id, channel, status, attempts, last_error FROM lead_delivery WHERE status != 'delivered';`. **DMARC (AD-8)** : déjà en place dans le DNS Cloudflare de `annevialtissot.fr` (constaté le 2026-10-08) : TXT `_dmarc` = `v=DMARC1; p=reject;`, plus strict que le `p=quarantine` prévu, gardé tel quel. Les e-mails du site passent (signature DKIM de Resend sur `annevialtissot.fr`, vérifié par la réception du 2026-10-08). **Piège** : la ligne SPF de la racine vaut `v=spf1 -all` (aucun autre expéditeur autorisé). Le jour où `anne@annevialtissot.fr` envoie depuis une messagerie (action J08), ajouter cette messagerie au SPF et à DKIM avant le premier envoi, sinon ses e-mails seront refusés.

**Guide et séquence (story 10.5)** : le guide part par un lien signé valable 7 jours (`/api/guide/telecharger`), la séquence d'e-mails d'Anne part par la même tâche planifiée (lignes `sequence:1` à `sequence:6` de `lead_delivery`, `due_at` = date d'envoi prévue). Sur l'aperçu, ces liens ne s'ouvrent qu'après le code d'Access, comme le reste ; la désinscription en un clic depuis la messagerie (`POST /api/desabonnement`) y est donc bloquée, le bouton de la page `/desabonnement` marche. En production, ces adresses sont publiques. Voir qui s'est désabonné : `SELECT id, newsletter_unsubscribed_at FROM lead WHERE newsletter_unsubscribed_at IS NOT NULL;`.

**Redéployer depuis une machine vierge** (AD-10) : `git clone` du dépôt, `cd site && npm ci && npm run build && npx wrangler login && npx wrangler d1 migrations apply DB --remote && npx wrangler deploy`.

## 4 quinquies. Gestion des demandes et droits RGPD (story 10.7)

**Où** : `/gestion` sur l'adresse du site (aperçu : https://anne-vial-tissot-site.jbcholat.workers.dev/gestion). Anne y voit les demandes, relance un e-mail en échec, marque une demande « recopiée dans Modelo », exporte ou efface les données d'une personne. Réservé à Anne et JB.

**Comment c'est protégé** : deux verrous. 1) Cloudflare Access demande un code envoyé par e-mail aux seules adresses de la règle `Anne et JB`. 2) Le serveur vérifie lui-même le jeton signé qu'Access joint à chaque requête ; il ne l'accepte que s'il vient de l'équipe `https://dry-truth-5a0d.cloudflareaccess.com` (`ACCESS_EQUIPE`) et d'une application dont l'identifiant figure dans `ACCESS_AUD` (`site/wrangler.jsonc`). Si `ACCESS_AUD` est vide, l'espace est fermé à tous (403). Ces deux valeurs sont publiques, elles vont dans le dépôt ; aucun secret à poser.

**Réglage de `ACCESS_AUD`** : Cloudflare → Zero Trust → Access → Applications → l'application → Overview (ou Basic information) → « Application Audience (AUD) Tag », une longue suite de lettres et chiffres. Sur l'aperçu : l'AUD de l'application qui protège tout `anne-vial-tissot-site.jbcholat.workers.dev` (destination « Workers », adresses de production et d'aperçu), posé le 2026-10-09 : `614e9c87…3280`. Plusieurs applications : les séparer par des virgules. Changer la valeur demande une PR (mise en ligne à la fusion).

**Au lancement (story 12.4)** : Access ne protège plus `annevialtissot.fr` en entier (§ 4, étape 4). Avant de retirer cette protection, créer une application Access « Gestion » sur `annevialtissot.fr/gestion` et `annevialtissot.fr/api/gestion` (Self-hosted, règle `Anne et JB`), et ajouter son AUD à `ACCESS_AUD`. Vérifier en fenêtre privée : `/gestion` demande le code ; sans code, `curl https://annevialtissot.fr/gestion` répond 403.

**Second facteur** : aujourd'hui le code envoyé par e-mail. Pour le renforcer : Zero Trust → Settings → Authentication → ajouter la connexion Google, puis dans la règle `Anne et JB` exiger cette méthode ; la validation en deux étapes du compte Google d'Anne devient alors le second facteur.

**Procédure quand une personne demande ses données ou leur effacement** (délai légal : un mois) :
1. Vérifier que la demande vient bien de la personne (elle écrit depuis l'adresse concernée, ou répond à un e-mail envoyé à cette adresse).
2. `/gestion` → chercher son adresse e-mail exacte → cadre « Droits de … ».
3. Accès : « Exporter ses données » donne un fichier JSON lisible ; le joindre à la réponse.
4. Effacement : retaper l'adresse, « Effacer définitivement ». Toutes ses demandes et leurs envois disparaissent, sans retour possible ; les e-mails déjà prévus (séquence) ne partent plus.
5. Si elle a pris rendez-vous : Cal.com → Bookings → retrouver la réservation → l'annuler ou la supprimer.
6. Effacer aussi la fiche dans Modelo si elle y a été recopiée, et les e-mails échangés dans la boîte d'Anne si elle le demande.
7. Répondre à la personne : ce qui a été fait, à quelle date.
Rien n'est à effacer chez Resend : le site n'y garde aucun contact. Chaque export ou effacement est noté (date, type, empreinte de l'adresse, qui a agi) dans la table `droit_exerce`, visible en bas de `/gestion`.

**Conservation** : les demandes sans activité depuis 3 ans sont supprimées automatiquement par la tâche planifiée ; durée écrite dans la politique de confidentialité et dans `site/src/server/purge.ts`, une seule source.

## 5. Pièges irréversibles

- Ne jamais mettre `PUBLIC_INDEXATION=oui` sur une adresse d'aperçu : Google mémoriserait une version incomplète.
- Ne jamais éteindre Access tant que des photos sans autorisation écrite sont sur le site.
- Effacement RGPD depuis `/gestion` (§ 4 quinquies) : définitif, aucune sauvegarde n'est restaurée pour une seule personne.
- Ne jamais retirer Access de `annevialtissot.fr` sans avoir d'abord protégé `/gestion` par sa propre application et ajouté son AUD à `ACCESS_AUD` (§ 4 quinquies) : le serveur refuserait tout, mais Anne n'aurait plus accès.
- Base de données (backend, epic 10) : elle se crée avec une juridiction UE irréversible ; commande et noms au § 4 quater, écrits avant la création (AD-10).

## 6. Journal des changements de ce document

- 2026-09-26 : version 0, aperçu en ligne et protégé (stories 9.1 à 9.5) ; § 4 bis retours (story 9.6). Vérifié par JB : page de connexion, accueil, `/robots.txt` = `Disallow: /`.
- 2026-10-04 : rien ne change dans les comptes. Pour mémoire, l'hébergeur déclaré dans les mentions légales est Cloudflare, Inc. (101 Townsend Street, San Francisco) ; il change si l'hébergement change. Deux garde-fous de contenu bloquent désormais la mise en ligne : une story publiée sans autorisation écrite, un texte anglais manquant (voir `site/README.md`).
- 2026-10-05 : domaines `.fr` et `.com` achetés chez Infomaniak depuis le compte de JB, Anne propriétaire légale (amende AD-9) ; § 4 ter ajouté (reprise des domaines, serveurs de noms Cloudflare actifs).
- 2026-10-05 : Anne dépose son contenu dans le dossier Google Drive « Contenu site Anne » et ne fait plus de commit (décision de JB). Les originaux lourds restent sur Drive ; Claude range les versions utiles dans `contenu-anne/` par PR. Si Claude ne peut plus lire le dossier : reconnecter le connecteur Google Drive dans claude.ai (Réglages → Connecteurs) puis l'activer dans les réglages du projet.
- 2026-10-05 (après-midi) : le dossier Drive est rangé comme `contenu-anne/` (mêmes noms, une vente = un dossier `stories/<bien>/` avec ses photos HD). L'ancien dossier « Site web - Anne Immo » est devenu « Contenu site Anne » ; le découpage en 5 sous-dossiers du matin est archivé sous « ARCHIVE - ancien Contenu site Anne (ne plus utiliser) ». Piège : sur Drive, seul le propriétaire d'un fichier peut le déplacer ou le supprimer ; les fichiers déposés par Anne ne peuvent être supprimés que par elle (Claude les renomme « À SUPPRIMER - … »).
- 2026-10-05 (fin d'après-midi) : espace d'édition Sveltia CMS à `/admin` (décision de JB, story 7.13). Trois éléments à créer par JB : le Worker `sveltia-cms-auth`, l'autorisation OAuth GitHub, l'invitation d'Anne comme collaboratrice. Le Drive reste l'archive des photos HD et des vidéos. Pièges : une autorisation OAuth GitHub voit tous les dépôts du compte qui s'y connecte (sans risque pour Anne, dont le compte n'a que ce dépôt) ; si le Worker est supprimé ou son secret changé, plus personne ne peut se connecter à l'espace d'édition (le site, lui, continue de fonctionner).
- 2026-10-07 : essai du webhook Cal.com (story 10.1) : ouverture provisoire du chemin `/api/essai-cal` dans Access et secret `CAL_WEBHOOK_SECRET` (§ 2). § 4 quater : création des bases D1 en juridiction UE (story 10.2), écrite avant d'être lancée.
- 2026-10-07 (soir) : formulaires réels (story 10.3) : secrets `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` et `BOITE_TEST` posés par JB ; boîte d'Anne `avialtissot@gmail.com` (décision de JB) ; tant que le site n'est pas lancé, tous les e-mails vont à `BOITE_TEST` (§ 4 quater).
- 2026-10-08 : DMARC constaté déjà présent (`p=reject`), gardé ; aucune ligne à ajouter.
- 2026-10-08 : retours d'Anne n° 39, 40 et 42 (story 8.7, « Réalisations », bouton « Estimation offerte ») : rien ne change dans les comptes ni la mise en ligne.
- 2026-10-08 : rendez-vous Cal.com par téléphone (décision de JB). Webhook réel `/api/webhook-cal` (story 10.6) : le chemin ouvert dans Access et l'adresse du webhook dans Cal.com passent de `/api/essai-cal` à `/api/webhook-cal` (§ 2).
- 2026-10-08 : guide par lien signé et séquence d'e-mails (story 10.5) : nouveau secret `LIEN_SECRET` à poser (§ 4 quater) ; changer ce secret casse les liens déjà envoyés.
- 2026-10-08 : espace de gestion des demandes et droits RGPD (story 10.7), § 4 quinquies : réglage `ACCESS_AUD`, procédure de demande d'accès ou d'effacement, application Access à créer au lancement.
- 2026-10-09 : rubrique « Textes des pages » de l'espace d'édition (story 7.20) : Anne modifie les textes de l'accueil, de Vendre, d'Acheter et de Contact (fichiers `contenu-anne/textes/<page>.yml`). Piège : un texte obligatoire vidé fait échouer la construction ; l'aperçu de la demande de fusion le montre, il suffit de remettre un texte avant de fusionner.
- 2026-10-09 : AUD de l'application Access de l'aperçu ajouté à `ACCESS_AUD` (§ 4 quinquies) : `/gestion` s'ouvre à Anne et JB.
- 2026-10-09 : décision de spécifier l'espace de travail d'Anne (spec v6, CAP-12, epic 13) : `/gestion` deviendra son pipeline de contacts, et la recopie dans Modelo ne sera demandée qu'à la signature d'un mandat. Rien ne change encore dans les comptes ni la mise en ligne ; un compte Leedflow (déjà souscrit par Anne) entrera dans la carte des comptes quand l'accès sera branché (story 13.2).
- 2026-10-10 : § 2 bis, fusion automatique des PR de contenu (espace d'édition) et de suivi (documents) ; JB ne valide plus que les PR qui changent le site (story 9.7).
