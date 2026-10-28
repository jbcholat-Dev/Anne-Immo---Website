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
| Cloudflare Worker `anne-espace` (story 13.3) | l'espace de travail privé d'Anne, `espace.annevialtissot.fr`, sur la même base que le site ; construit depuis le dossier `espace/` (§ 4 sexies) | JB, même compte Cloudflare | 0 € de plus (compris dans le plan Workers Paid du site) |
| Cloudflare Worker `sveltia-cms-auth` | le petit programme qui fait « Se connecter avec GitHub » pour l'espace d'édition ; il garde l'identifiant et le secret de l'autorisation GitHub (secrets Cloudflare, jamais dans le dépôt) | JB, même compte Cloudflare | 0 € |
| GitHub, autorisation OAuth « Site Anne — édition » | permet la connexion GitHub depuis l'espace d'édition ; adresse de retour = adresse du Worker + `/callback` | JB (GitHub → Settings → Developer settings → OAuth Apps) | 0 € |
| Infomaniak | noms de domaine `annevialtissot.fr` et `.com` | JB (son adresse e-mail) ; **propriétaire légal des deux domaines : Anne** (décision du 2026-10-05, amende AD-9), JB contact administrateur. Sans option Domain Plus. Expiration 2027-10-05. | 17,52 € TTC la 1re année, ≈ 21 €/an ensuite |
| Google Business Profile, fiche « Anne VIAL-TISSOT » (story 11.2) | la fiche gratuite d'Anne dans Google et Google Maps (zone desservie, adresse masquée) ; on la modifie en cherchant « Anne VIAL-TISSOT » sur Google, connecté au compte propriétaire | créée et validée par JB le 2026-10-24 ; propriété principale transférée au compte Google pro d'Anne le 2026-10-26, JB gestionnaire (AD-9) | 0 € |

Mots de passe : jamais dans ce dépôt, jamais manipulés par Claude. Coffre partagé à deux : à ouvrir (action J03).

## 2. L'aperçu (état actuel)

- **Depuis le lancement (2026-10-11, story 12.7)** : l'aperçu est la branche `apercu`, adresse **https://apercu-anne-vial-tissot-site.jbcholat.workers.dev** (base d'aperçu, e-mails vers `BOITE_TEST`, bouton « Un retour ? »). Elle recopie `main` à chaque fusion (`.github/workflows/apercu.yml`) ; ne jamais y commiter directement. L'ancienne adresse https://anne-vial-tissot-site.jbcholat.workers.dev sert désormais la **production** (vraie base, vrais e-mails), toujours derrière Access.
- Adresse avant le lancement : https://anne-vial-tissot-site.jbcholat.workers.dev
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
- **Qui fusionne** : le fil Claude qui a ouvert une PR légère la fusionne lui-même dès que la construction est au vert, sans attendre JB (précision de JB du 2026-10-10 : « tu les merges toi-même »). Le programme ci-dessous fait la même chose pour les enregistrements de l'espace d'édition, qui arrivent quand aucun fil n'est actif, et sert de filet si un fil oublie.
- **Restent à JB** : tout le reste (`site/` hors documents, `design-system/`, `.github/`, un fichier de `contenu-anne/` modifié par Claude), une PR en brouillon, une PR étiquetée `a-valider` (pour garder la main sur une PR précise : lui mettre cette étiquette), une construction en échec, une PR en conflit.
- **Revue de code avant de proposer à JB** (story 9.8, décision de JB du 2026-10-25) : une PR qui touche `site/src/`, `site/public/`, `site/prive/`, `espace/src/` ou `.github/` est relue par le skill `bmad-code-review` dans une session neuve avant d'être proposée ; le résultat est dans la story (section « Revue de code »). Une PR de code proposée sans cette section n'est pas prête.
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

## 4. Basculer en production (story 12.4, liste de contrôle : story 12.5)

**Principe** : rien ne change dans `wrangler.jsonc`. La bascule se fait pendant la construction, par `site/scripts/lancement.mjs`, et **seulement** pour la branche `main` quand la variable de construction `LANCEMENT` vaut `oui` : base `anne-leads`, `ENVIRONNEMENT=production` (e-mails envoyés à Anne et aux prospects, plus à `BOITE_TEST`), `URL_SITE=https://annevialtissot.fr`, `PUBLIC_INDEXATION=oui` (site indexable, ventes « publie » seulement, garde-fous). Les branches restent des aperçus sur la base d'aperçu, même après le lancement. Le journal de construction le dit en une ligne (« lancement : PRODUCTION… » ou « lancement : aperçu… »).

**Préalables** : liste de contrôle de la story 12.5 côté contenu (sinon la construction de `main` échoue avec « Lancement refusé : … » et l'ancienne version reste en ligne, rien ne casse).

**Dans l'ordre** (≈ 1 h 30) :
1. Cloudflare → Workers & Pages → `anne-vial-tissot-site` → Settings → Domains & Routes → Add → Custom domain : `annevialtissot.fr`, puis `www.annevialtissot.fr`. Cloudflare crée les enregistrements DNS.
2. Redirections 301 (permanentes) vers `https://annevialtissot.fr` en gardant le chemin : `www.annevialtissot.fr` et `annevialtissot.com` (domaine `.com` → Rules → Redirect Rules, ou Page Rules ; le `.com` a besoin d'un enregistrement DNS proxifié, par exemple `A @ 192.0.2.1` orange, pour que la règle s'applique).
3. Turnstile → widget `site-anne` → Settings → Hostnames : ajouter `annevialtissot.fr` (et `www.annevialtissot.fr`). Sans cela, tous les formulaires échouent sur le domaine.
4. Zero Trust → Access → Applications → Add → Self-hosted, nom `Gestion`, domaines `annevialtissot.fr/gestion` et `annevialtissot.fr/api/gestion`, règle `Anne et JB`. Copier son AUD (§ 4 quinquies) et le donner à Claude : il l'ajoute à `ACCESS_AUD` par une PR à fusionner **avant** l'étape 6.
5. Settings → Build → Variables and secrets : ajouter `LANCEMENT` = `oui` (texte). Puis Deployments → relancer la construction de `main` (ou fusionner la PR suivante). Vérifier dans le journal : « lancement : PRODUCTION ».
6. Access : retirer la protection de `annevialtissot.fr` (seule l'application `Gestion` y reste) ; la garder sur l'adresse `workers.dev`.
7. Cal.com (compte d'Anne) → Settings → Developer → Webhooks : adresse `https://annevialtissot.fr/api/webhook-cal`, même secret.
8. Vérifier en fenêtre privée : l'accueil s'ouvre sans code ; `https://annevialtissot.fr/robots.txt` = `Allow: /` ; `https://annevialtissot.com/vendre` arrive sur `https://annevialtissot.fr/vendre` ; `/gestion` demande le code ; `GET /api/sante` = `{"ok":true,…}`. Puis un essai réel de chaque formulaire (contact, estimation, guide, diagnostic, rendez-vous) : Anne reçoit les e-mails ; effacer ces essais depuis `/gestion` (droits RGPD).

**Retour arrière** : supprimer la variable `LANCEMENT` et relancer la construction de `main` (le site redevient l'aperçu sur la base d'aperçu), et remettre Access sur `annevialtissot.fr`. Plus rapide pour un code fautif : Deployments → version précédente → Rollback.

## 4 bis. Retours sur l'aperçu (story 9.6)

- Le bouton « Un retour ? » de l'aperçu (depuis le lancement : https://apercu-anne-vial-tissot-site.jbcholat.workers.dev, § 2) crée des tickets GitHub étiquetés `retour-apercu` : https://github.com/jbcholat-Dev/Anne-Immo---Website/issues?q=is%3Aissue+is%3Aopen+label%3Aretour-apercu
- Il a besoin d'une clé GitHub, secret `GITHUB_TOKEN` du projet Cloudflare. **Clé créée le 2026-09-26, à renouveler avant le 2026-09-26 + 1 an** (action à prévoir dans le tableau de bord un mois avant). Pour la créer : GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token ; nom `cloudflare-retours-apercu` ; expiration 1 an ; Repository access : Only select repositories → `Anne-Immo---Website` ; Permissions → Repository permissions → Issues : Read and write (rien d'autre). Copier la clé une seule fois.
- Pour la poser : Cloudflare → Workers & Pages → anne-vial-tissot-site → Settings → Variables and Secrets → Add → type Secret, nom `GITHUB_TOKEN`, valeur = la clé → Deploy. Aucun redéploiement du code n'est nécessaire.
- Pour la retirer ou la remplacer : même écran (supprimer, ou Edit) ; côté GitHub, révoquer l'ancienne clé.
- Sans clé, le bouton répond « L'envoi n'est pas encore branché » ; rien n'est perdu côté site, la remarque est à envoyer à JB.
- Le bouton n'existe pas en production. `/api/retour` vérifie lui-même le jeton Cloudflare Access (story 12.6) : seuls Anne et JB peuvent créer un ticket.
- **Espace d'Anne (story 13.20)** : le même bouton est sur chaque page de l'espace ; ses tickets portent aussi l'étiquette `retour-apercu`, avec un titre qui commence par « [Retour espace] ». Il a besoin de sa propre clé, secret `GITHUB_TOKEN` du Worker `anne-espace` (§ 4 sexies). Le dépôt est public : la page est envoyée sans ses paramètres et le formulaire rappelle de ne citer aucun client.

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

**Réglage de `ACCESS_AUD`** : Cloudflare → Zero Trust → Access → Applications → l'application → Overview (ou Basic information) → « Application Audience (AUD) Tag », une longue suite de lettres et chiffres. Sur l'aperçu : l'AUD de l'application qui protège tout `anne-vial-tissot-site.jbcholat.workers.dev` (destination « Workers », adresses de production et d'aperçu), posé le 2026-10-09 : `614e9c87…3280`. En production : l'application `Gestion` (`annevialtissot.fr/gestion` et `/api/gestion`, règle `Anne et JB`), créée le 2026-10-11 par l'API, AUD `916beab7…d5ae`. Plusieurs applications : les séparer par des virgules. Changer la valeur demande une PR (mise en ligne à la fusion).

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

## 4 sexies. Espace de travail d'Anne (story 13.3, AD-19)

**Quoi** : une seconde application, le Worker `anne-espace`, construite depuis le dossier `espace/` du même dépôt. Elle lit et écrit la base des leads du site (`anne-leads` pour `main`, `anne-leads-apercu` pour toute autre branche, choix fait par `espace/scripts/base.mjs`). Elle reprend aujourd'hui la gestion des demandes (§ 4 quinquies, mêmes boutons) ; le pipeline d'Anne s'y ajoutera (stories 13.4 et suivantes). Une relance d'e-mail faite dans l'espace part par la tâche planifiée du site, dans les 15 minutes.

**Protection** : la même que `/gestion`. Cloudflare Access demande le code (connexion valable **30 jours** par navigateur depuis le 2026-10-28, story 13.33, décision de JB ; avant : 24 h) ; le serveur vérifie le jeton contre `ACCESS_EQUIPE` et `ACCESS_AUD` de `espace/wrangler.jsonc`. `ACCESS_AUD` vide = tout répond 403, feuilles de style comprises. Une adresse qu'Access ne couvrirait pas par erreur reste donc fermée.

**Couper toutes les connexions** (appareil perdu ou volé) : Zero Trust → Access → Applications → `espace` (et `Gestion`) → ⋯ → *Revoke existing tokens* ; ou Zero Trust → Users → la personne → *Revoke session*. Le code sera redemandé à la prochaine visite. Raccourcir la durée : même application → Session duration.

**Mise en place, une fois** (≈ 20 min, par JB, après la fusion de la PR de la story 13.3) :
1. Cloudflare → Workers & Pages → Create → Import a repository → `Anne-Immo---Website`. Nom du projet : `anne-espace` (doit être exactement celui de `espace/wrangler.jsonc`). Dossier racine (*Root directory*) : `espace`. Construction : `npm ci && npm run build`. Mise en ligne : `npx wrangler deploy`. Branches autres que `main` : `npx wrangler versions upload`. La première construction lie la base `anne-leads` au nouveau Worker : si elle échoue sur la base, copier le journal dans le fil.
2. Projet `anne-espace` → Settings → Domains & Routes → Add → Custom domain → `espace.annevialtissot.fr`. Cloudflare crée l'enregistrement DNS.
3. Zero Trust → Access → Applications → Add an application → Self-hosted. Nom : `Espace d'Anne`. Adresses : `espace.annevialtissot.fr`, `anne-espace.jbcholat.workers.dev` et `*-anne-espace.jbcholat.workers.dev`. Règle : `Anne et JB`. Enregistrer, puis copier l'« Application Audience (AUD) Tag » dans le fil : Claude le pose dans `ACCESS_AUD` par une PR (sans lui, l'espace reste fermé).
4. Facultatif : projet `anne-espace` → Settings → Variables and Secrets → secret `LIEN_SECRET`, même texte que celui du site (sans lui, la fiche d'un diagnostic n'affiche pas le lien du rapport PDF).
5. Vérifier en fenêtre privée : `https://espace.annevialtissot.fr` demande le code, puis montre les demandes ; sans code, `curl -I https://espace.annevialtissot.fr/gestion` répond 403.

**Fait le 2026-10-15** (par JB) : projet `anne-espace` (construction au vert du premier coup, base `anne-leads` liée : une même base D1 sert bien deux Workers), adresse `espace.annevialtissot.fr`, application Access `espace` (onglet Public DNS, règle `Anne et JB`, AUD `a01520f8…f5e6`, lu sur la page de connexion d'Access). Les adresses `workers.dev` de l'espace sont coupées (Domains → Worker URL) : elles répondraient de toute façon 403, faute de jeton de la bonne application. Piège évité : ne pas choisir l'onglet « Workers » à la création de l'application Access (il couvre toutes les adresses du Worker, § 6, 2026-10-11) ; l'onglet « Domains » du projet propose aussi d'acheter un domaine : y chercher `annevialtissot.fr` seul, puis ajouter le sous-domaine.

**Phase 2** (après l'essai d'Anne) : le site renvoie `/gestion` vers l'espace ; l'application Access `Gestion` du site et son AUD pourront alors être retirés.

**Clé Leedflow** (story 13.10) : secret `LEEDFLOW_API_KEY` de ce Worker seulement (projet `anne-espace` → Settings → Variables and Secrets → type *Secret*), la clé qu'Anne génère dans Leedflow (Paramètres › API). **Posée par JB le 2026-10-21.** Pour la changer : Anne en génère une nouvelle, JB remplace la valeur du secret, puis Anne révoque l'ancienne. Le bas de la page « Aujourd'hui » dit si la dernière relève (toutes les 10 minutes) a réussi ; « HTTP 401 » = clé refusée ou révoquée.

**Accès de Claude** (story 13.17) : Claude crée et modifie les actions marketing décidées dans le projet et lit les totaux du bilan, par l'adresse `/api/claude/…` de l'espace. Il ne lit jamais un contact. L'accès passe par un *jeton de service* Cloudflare Access, un badge réservé à un programme. Le Worker n'accepte ce badge que sur `/api/claude/…` et seulement s'il porte l'identifiant posé en secret `ACCESS_CLAUDE_ID`. Une personne connectée est refusée sur ces adresses. Mise en place, une fois (≈ 10 min, par JB) :
1. Zero Trust → Access → Service credentials → Service Tokens → Create Service Token. Nom : `Claude espace`, durée : sans expiration (ou 1 an, à renouveler). Copier le *Client ID* et le *Client Secret* : le secret n'est montré qu'une fois.
2. Access → Applications → `espace` → Policies → Add a policy. Action : *Service Auth*. Include : *Service Token* = `Claude espace`. Enregistrer (la règle « Anne et JB » reste telle quelle).
3. Projet `anne-espace` → Settings → Variables and Secrets → secret `ACCESS_CLAUDE_ID` = le *Client ID*.
4. claude.ai → environnement cloud « Anne Immo » : réglages `ESPACE_CLAUDE_ID` (le *Client ID*) et `ESPACE_CLAUDE_SECRET` (le *Client Secret*) ; ajouter `espace.annevialtissot.fr` à la liste des adresses autorisées. Ces valeurs ne vont jamais dans le dépôt. Elles sont visibles seulement dans les sessions démarrées après.
5. Vérification par Claude : `node espace/scripts/claude-espace.mjs actions` répond la liste. Pour couper l'accès : supprimer le jeton de service (étape 1) ; l'espace refuse alors tout appel de Claude.

**Fait le 2026-10-28** : jeton de service `Claude espace` créé par JB (fin 2027-10-28) ; étapes 2 et 3 faites par Claude avec le jeton d'API ci-dessous et l'accord écrit de JB (politique « Claude espace (badge) », Service Auth, priorité 2, à côté de « Anne et JB » inchangée ; secret `ACCESS_CLAUDE_ID` sur `anne-espace`). Vérifié : `actions` et `bilan semaine` répondent, `espace.annevialtissot.fr` sans badge renvoie toujours vers la page de code. Le secret se relit seulement dans la fenêtre qui s'ouvre au « Refresh » du jeton (menu ⋯), jamais sur sa fiche.

**Jeton d'API Cloudflare de Claude** (2026-10-28) : réglage `CLOUDFLARE_API_TOKEN` de l'environnement cloud « Anne Immo », jeton « Claude projet Anne » du profil de JB (API Tokens), **fin 2027-10-28, à renouveler en octobre 2027**. Il permet à Claude de régler le site et l'espace sans que JB aille sur Cloudflare. Droits du compte : Account Analytics et Account Settings (lecture), Workers Scripts, Workers Builds Configuration, Access: Apps and Policies, Turnstile (modification), Access: Service Tokens (lecture). Droits sur les seuls domaines `annevialtissot.fr` et `.com` : Zone et Analytics (lecture), DNS, Zone Settings, Single Redirect, Workers Routes (modification), Cache Purge. **Pas de D1** : la base des contacts reste fermée à Claude. Les deux « build tokens » de la même liste servent aux constructions du site et de `sveltia-cms-auth` : ne pas les supprimer. Toute modification de la production ou des DNS reste soumise à l'accord écrit de JB dans le fil. Vérifier : `curl -sS https://api.cloudflare.com/client/v4/user/tokens/verify -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"` répond `active`. Couper : supprimer le jeton dans API Tokens. Les réglages de l'environnement ne sont lus que par les sessions qui démarrent après leur changement.

**Bouton « Un retour ? »** (story 13.20) : chaque remarque devient un ticket GitHub `retour-apercu` (§ 4 bis). Mise en place, une fois, par JB (≈ 7 min) :
1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token ; nom `cloudflare-retours-espace` ; expiration 1 an ; *Resource owner* : `jbcholat-Dev` (sinon le dépôt n'apparaît pas) ; Repository access : Only select repositories → `Anne-Immo---Website` ; Permissions → Repository permissions → Issues : Read and write (rien d'autre). Copier la clé une seule fois.
2. Projet `anne-espace` → Settings → Variables and Secrets → Add → type *Secret*, nom `GITHUB_TOKEN`, valeur = la clé → Deploy.
3. Vérifier : dans l'espace, « Un retour ? » → une remarque d'essai → « Retour n° … enregistré ». Sans clé, le bouton répond « L'envoi n'est pas encore branché ». Rotation : avant un an, même chemin, puis révoquer l'ancienne clé côté GitHub.

**Campagnes e-mail** (story 13.27, AD-21) : Anne écrit et envoie ses campagnes depuis l'onglet « Campagnes » de l'espace. Elles partent par Resend, mais d'une adresse à part, sur le sous-domaine `nouvelles.annevialtissot.fr` : si des destinataires signalent une campagne comme indésirable, la réputation des e-mails du site (guide, rapport, confirmations) n'est pas touchée. Les réponses vont dans la Gmail d'Anne. Tant que rien n'est posé, Anne peut écrire et préparer ses campagnes, mais rien ne part. Mise en place, une fois, par JB (≈ 15 min, plus l'attente de la vérification DNS) :
1. Resend → Domains → Add domain → `nouvelles.annevialtissot.fr`, région Irlande (comme le `.fr`). Dans ses réglages, laisser le suivi des ouvertures et des clics **désactivé** (AD-11 : aucun traceur).
2. Resend affiche 3 lignes DNS (un MX et un TXT sur `send.nouvelles`, un TXT `resend._domainkey.nouvelles`). Cloudflare → `annevialtissot.fr` → DNS → Records → ajouter chacune telle quelle, proxy **désactivé** (nuage gris). Revenir dans Resend → Verify ; « Verified » arrive en quelques minutes. La règle DMARC du domaine (`p=reject`) vaut aussi pour le sous-domaine : rien à ajouter.
3. Resend → API Keys → Create API Key : nom `anne-espace-campagnes`, permission *Sending access*, domaine `nouvelles.annevialtissot.fr` seulement. Copier la clé (montrée une fois).
4. Projet `anne-espace` → Settings → Variables and Secrets → type *Secret* : `RESEND_API_KEY` = la clé ; `BOITE_TEST` = la même boîte de test que celle du site ; et, s'il n'y est pas encore (étape 4 de la mise en place), `LIEN_SECRET` = le même texte que celui du site (il signe le lien de désinscription, que le site vérifie). → Deploy.
5. Dire « sous-domaine prêt » dans le fil : Claude pose l'expéditeur `Anne VIAL-TISSOT <anne@nouvelles.annevialtissot.fr>` dans `EXPEDITEUR_CAMPAGNES` de `espace/wrangler.jsonc` par une PR, puis envoie un essai depuis l'onglet.
Envoi étalé : 8 e-mails toutes les 10 minutes (≈ 48 par heure), au plus 90 par jour en comptant ceux du site, sous les 100 par jour de l'offre gratuite de Resend (3 000 par mois). Réglages facultatifs du Worker : `CAMPAGNE_PAR_PASSAGE` et `CAMPAGNE_QUOTA_JOUR` (à relever si l'offre Resend change). Sur l'aperçu, tout part vers `BOITE_TEST`. Clé à changer : en créer une nouvelle (étape 3), remplacer le secret, supprimer l'ancienne dans Resend.

## 5. Pièges irréversibles

- Ne jamais mettre `PUBLIC_INDEXATION=oui` en variable de construction : elle vaudrait pour toutes les branches et Google pourrait mémoriser une version incomplète. Le lancement passe par `LANCEMENT=oui`, que seule `main` écoute (§ 4).
- Ne jamais publier une vente sans l'accord de ses clients (photos et avis cité). Décision de JB du 2026-10-05 : les clients des ventes actuelles ont tous donné le leur ; « publie » suffit (story 7.14).
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
- 2026-10-25 : § 2 bis, revue de code `bmad-code-review` avant de proposer une PR de code à JB (story 9.8).
- 2026-10-10 : § 2 bis, fusion automatique des PR de contenu (espace d'édition) et de suivi (documents) ; JB ne valide plus que les PR qui changent le site (story 9.7).
- 2026-10-10 : architecture de l'espace de travail d'Anne (story 13.2, AD-19, AD-20) : future application séparée `espace/` sur la même base que le site, adresse proposée `espace.annevialtissot.fr` ; les demandes des portails (e-mails de Modelo) y arriveront par un filtre Gmail vers une adresse reçue par Cloudflare (proposée `entrant.annevialtissot.fr`). Rien ne change encore dans les comptes ni la mise en ligne ; les réglages seront décrits ici aux stories 13.3 et 13.8.
- 2026-10-10 : audit avant le lancement (story 12.5). § 4 réécrit : la bascule se fait par la variable de construction `LANCEMENT=oui`, écoutée par `main` seulement (`site/scripts/lancement.mjs`) ; les aperçus de branches gardent la base d'aperçu et la boîte de test après le lancement. Ajouts : Turnstile sur le domaine, application Access « Gestion », webhook Cal.com, retour arrière.
- 2026-10-10 (soir) : décision de JB, lancement minimal le 2026-10-11 avec le design actuel ; transfert du dépôt et coffre (12.3), surveillance (10.8) et fiche Google (11.2) après le lancement, écarts notés dans la story 12.5.
- 2026-10-10 : décision des campagnes promotionnelles temporaires (epic 14, après le lancement) : une page par offre, créée par Anne dans l'espace d'édition et datée ; chaque offre est un tirage au sort parmi les inscrits (choix de JB), donc un règlement écrit à publier avec l'offre. Rien ne change encore dans les comptes ni la mise en ligne.
- 2026-10-11 : **site ouvert au public sur https://annevialtissot.fr** (stories 12.4 et 12.5), tout par l'API Cloudflare avec un jeton limité de JB. Domaine personnalisé du Worker, redirections 301 de `www` et du `.com` (règles de redirection des zones, enregistrements `AAAA 100::` proxifiés), Turnstile étendu à `www`, application Access `Gestion` (AUD `916beab7…`, PR n° 124), `LANCEMENT=oui` sur le déclencheur de `main`. **Piège** : l'application Access de destination « Worker » protège aussi les domaines personnalisés du Worker ; elle est désormais limitée aux adresses `anne-vial-tissot-site.jbcholat.workers.dev` et `*-anne-vial-tissot-site.jbcholat.workers.dev`. Aperçu permanent : branche `apercu` (story 12.7, § 2). Retour arrière : § 4.
- 2026-10-15 : Leedflow a répondu (API en lecture seule, sans webhook). Pour la story 13.10, Anne générera une clé dans Leedflow (Paramètres › API) et JB la posera en secret du Worker de l'espace ; Claude ne la voit jamais. Rien ne change encore dans les comptes.
- 2026-10-24 : campagnes e-mail depuis l'espace (story 13.27, AD-21), § 4 sexies : sous-domaine d'envoi `nouvelles.annevialtissot.fr` à ajouter dans Resend et Cloudflare, clé Resend propre au Worker `anne-espace`, secrets `RESEND_API_KEY`, `BOITE_TEST` et `LIEN_SECRET` de l'espace. À faire par JB.
- 2026-10-24 : bouton « Un retour ? » dans l'espace (story 13.20) : § 4 bis et § 4 sexies, clé GitHub propre au Worker `anne-espace`, posée par JB le jour même (à renouveler avant le 2026-10-24 + 1 an), essai réussi (ticket n° 174).
- 2026-10-21 : clé Leedflow posée par JB sur le Worker `anne-espace` (story 13.10, § 4 sexies) ; relève des appels toutes les 10 minutes.
- 2026-10-15 : application de l'espace d'Anne (story 13.3, phase 1) : nouveau dossier `espace/`, futur Worker `anne-espace` sur `espace.annevialtissot.fr`, même base que le site. Mise en place par JB décrite au § 4 sexies ; le `/gestion` du site reste en service jusqu'à la phase 2.
- 2026-10-24 : fiche Google Business Profile d'Anne créée et validée (story 11.2), ajoutée à la carte des comptes (§ 1). Validation par l'adresse de Sciez, masquée ; reste à confirmer qu'Anne en est propriétaire.
- 2026-10-26 : propriété principale de la fiche Google transférée à Anne ; doublon non validé supprimé ; « France » retiré des zones desservies (story 11.2 close).
- 2026-10-28 : accès durable de Claude à Cloudflare (jeton d'API « Claude projet Anne », un an) et badge de l'espace en place (§ 4 sexies) ; Claude lit Web Analytics et le bilan de l'espace, et règle le site et l'espace depuis le projet.
- 2026-10-28 : connexion à l'espace et à `/gestion` valable 30 jours au lieu de 24 h (story 13.33, décision de JB) ; marche à suivre pour couper toutes les connexions (§ 4 sexies).
