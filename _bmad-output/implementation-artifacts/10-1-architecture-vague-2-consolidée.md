---
story: 10.1
epic: 10 — Capture des leads et backend
statut: in-progress
date: 2026-10-04
---

# Story 10.1 — Architecture vague 2 consolidée

## Objectif
Écrire le backend sur des faits : chaque décision différée du spine reçoit un verdict, et chaque hypothèse technique (Cloudflare, Cal.com, Resend, Turnstile) est vérifiée par un essai réel avant les stories 10.2 à 10.8.

## Ce qui est fait (2026-10-04)

### 1. Essai du noyau serveur Cloudflare, en local : réussi
Copie du site hors du dépôt (aucun fichier de `site/` ne change), avec `@astrojs/cloudflare` 14.3.3, Astro 7.3.4, wrangler 4.147.0. Fichiers de l'essai conservés dans `10-1-essai/` (non branchés au site).

- `npm run build` réussit ; les 19 pages restent prérendues (HTML générées à l'avance).
- `wrangler dev` (le Worker exécuté en local, base D1 locale) : `/`, `/vendre`, `/contact`, `/diagnostic`, `/diagnostic/questions`, `/en`, `/guide`, une page de réalisation répondent 200 ; une adresse inconnue répond 404 avec la page 404 du site.
- Route serveur `/api/essai-d1` : lit la base D1 (`{"ok":true,"executions_cron":[]}`).
- Tâche planifiée `scheduled` déclenchée deux fois (`{"outcome":"ok"}`), puis relue par la route : deux lignes écrites en base (`2026-10-04T19:49:14Z`, cron `0 6 * * *`).

**Écart avec le spine, à corriger :** l'option `workerEntryPoint` n'existe plus dans l'adaptateur 14. Le mécanisme qui marche : `main` de `wrangler.jsonc` pointe sur notre `worker.ts`, qui exporte `fetch: handle` (importé de `@astrojs/cloudflare/handler`) et notre propre `scheduled`. Même résultat que prévu, autre réglage.

**Conséquences pour 10.2 (constatées pendant l'essai) :**
- Le site construit passe de `dist/` à `dist/client/` (pages) + `dist/server/` (Worker) : `scripts/liens.mjs`, `scripts/verif.mjs` et la config Cloudflare suivent ; la commande de mise en ligne `npx wrangler deploy` reste la même.
- L'adaptateur ajoute de lui-même une liaison `SESSION` (stockage KV, créé automatiquement à la mise en ligne) et `IMAGES`. Inutiles pour nous : à neutraliser ou accepter en 10.2 (gratuit dans les deux cas).
- La route `/api/retour` (bouton « Un retour ? », story 9.6) doit être reprise dans le nouveau `worker.ts` ou devenir une route Astro.
- D1 refuse certaines fonctions SQLite internes (`sqlite_version()`) : sans effet sur le schéma prévu.
- L'essai prérend avec `prerenderEnvironment: 'node'` ; le mode par défaut (`workerd`) reste à essayer en 10.2.

**Pas encore fait :** la même chose mise en ligne sur une adresse `*.workers.dev` avec une vraie base D1. Ce conteneur n'a volontairement aucun accès au compte Cloudflare (AD-9) ; ce sera le premier geste de 10.2, sur la branche d'aperçu.

### 2. Vérifications documentaires (sources web, 2026-10-04)
- **Resend** : la région d'envoi UE (Irlande, `eu-west-1`) est ouverte au plan gratuit, choisie par domaine. **Mais** les données du compte (journaux, métadonnées des e-mails, appels) restent aux États-Unis quelle que soit la région. Verdict proposé : choisir l'Irlande, et documenter le transfert hors UE dans la politique de confidentialité (repli prévu par le spine). Sources : [Resend, régions](https://resend.com/docs/dashboard/domains/regions), [multi-région pour tous](https://resend.com/changelog/multi-region-for-everyone).
- **Cal.com** : les webhooks portent une signature `X-Cal-Signature-256` (HMAC SHA-256 calculée avec le secret saisi dans Cal.com). Disponibilité au plan gratuit, question case à cocher, fuseau, verrouillage du créneau et confirmations : seul l'essai réel le dira. Source : [Nango, webhooks Cal.com](https://nango.dev/docs/api-integrations/cal-com-oauth/webhook).
- **Turnstile** : Cloudflare le présente sans cookie de suivi, mais un cookie `cf.turnstile.u` est signalé par des utilisateurs. L'essai instrumenté tranchera. Source : [forum Webflow](https://discourse.webflow.com/t/cookie-consent-compliance-cf-turnstile-u-cookie-loading-before-consent/326947).
- **Resend, 2026-10-05** : compte créé par JB (son adresse), domaine `annevialtissot.fr` ajouté en région Irlande ; trois enregistrements DNS posés automatiquement dans Cloudflare (`resend._domainkey` TXT, `send` et `rsend` CNAME vers `*.forge.rmta.net`, « DNS only ») ; suivi des clics et des ouvertures désactivé (AD-11) ; réception désactivée ; vérification en attente. Pas de DMARC à ce stade.
- **Turnstile, essai instrumenté du 2026-10-05 (partiel)** : page locale avec la clé de test Cloudflare `1x00000000000000000000BB` (invisible), Chromium headless via le proxy. Le chargement du script `api.js` ne dépose **rien** sur l'origine du site (0 cookie, 0 clé `localStorage`/`sessionStorage`, 0 base IndexedDB). Le défi lui-même (iframe `challenges.cloudflare.com`) ne s'exécute pas en navigateur sans écran derrière le proxy (`ERR_TOO_MANY_RETRIES`) : le relevé de ce que dépose l'iframe reste à faire dans un vrai navigateur.
- **Réseau ouvert le 2026-10-05** (action J17) : `cal.com`, `*.cal.com`, `resend.com`, `*.resend.com`, `challenges.cloudflare.com`, `developers.cloudflare.com`.
- **Blocage levé le 2026-10-05, constat initial** : le réseau de ce conteneur refusait `cal.com`, `app.cal.com`, `resend.com`, `api.resend.com`, `challenges.cloudflare.com`, `developers.cloudflare.com`. Les essais instrumentés (relevé des cookies, réservation test) demandent que JB les autorise dans l'environnement cloud.

### 3. Verdicts proposés pour la table « Deferred » du spine
| Décision | Verdict proposé (2026-10-04) | Qui tranche |
|---|---|---|
| Champs des objets de contenu | **Fixés** par `site/src/content.config.ts` (stories, avis, instantané, pages). `SequenceEmail` et `Guide` déclarés en 10.5. | constaté |
| CMS de moyen terme | **Report au 2027-01** : Anne dépose dans `contenu-anne/`, Claude intègre ; Keystatic jugé immature en multilingue. Perte : Anne ne modifie pas elle-même ses textes avant cette date. | JB |
| Bandeau de consentement | **Provisoire : pas de bandeau**, car Turnstile et Cal.com ne se chargent qu'après une action du visiteur (AD-11) et relèvent de l'exemption CNIL « strictement nécessaire / service demandé ». À confirmer par le relevé réel. | JB, après l'essai |
| Outil d'audit de performance | **Lighthouse CI lancé en local sur le site construit** (contourne Cloudflare Access, gratuit), plus une mesure PageSpeed sur la production au lancement (12.5). Perte : pas de mesure du réseau réel avant le lancement. | JB |
| Barème Q10 | **Garder la matrice visites × offres** déjà codée (`bareme.json`, `q10_matrice`), à faire valider par Anne. Sans réponse, la spec impose la question unique combinée (refaire l'écran). | Anne (action A09) |
| Go/no-go prestataire | **Sans objet** : le build interne est fait. | constaté |

## Ce qui est vérifié
- Essai local ci-dessus (sorties citées). `npm run build` du dépôt inchangé : aucun fichier de `site/` modifié.

## Ce qui reste (story ouverte)
1. ~~JB : autoriser les domaines bloqués (J17)~~ fait le 2026-10-05.
2. JB : créer le compte Cal.com et le widget Turnstile (J12, J18) ; Resend (J11) en attente de vérification du domaine.
3. Claude : essai réel Cal.com (webhook signé, case à cocher, fuseau, créneau pris, confirmations), relevé des cookies Turnstile et Cal.com, verdict bandeau.
4. JB : trancher CMS, outil d'audit, bandeau ; Anne : Q10.
5. Claude : amendement final du spine (table Deferred close, « Hypothèses vérifiées »).
