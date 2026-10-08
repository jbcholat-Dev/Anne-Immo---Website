# Site d'Anne VIAL-TISSOT — v1 (build statique)

Astro 7, pages prérendues servies par un Worker Cloudflare (adaptateur `@astrojs/cloudflare`, story 10.2), CSS sur les seuls tokens de `design-system/tokens/tokens.css`, trois îlots JS (scroll-craft, formulaires, diagnostic). Le noyau serveur existe (base D1, route `/api/sante`). Depuis la story 10.3, les formulaires contact, estimation et guide écrivent **réellement** en base et préviennent Anne par e-mail ; depuis la story 10.4, le diagnostic aussi : le score est calculé par le serveur après le gate et la page de résultats est rendue par le serveur (seule page non prérendue, voir « Diagnostic réel »). La référence visuelle est la maquette lot 3 (`maquettes/lot-3-complet/`), les décisions D-1 → D-26 priment.

## Lancer

```bash
cd site
npm install            # Node ≥ 22.12 (le dépôt a été construit avec 22.22)
npm run dev            # http://localhost:4321
npm run build && npm run preview
```

Autres commandes :

| Commande | Rôle |
|---|---|
| `npm run images` | dérive les WebP/JPG de `contenu-anne/` vers `public/img/` + `src/data/images.json` (sharp). Déjà lancé et commité : à relancer quand Anne dépose des photos ou change une sélection dans `stories/<slug>/fr.md` (après `scripts/preparer-photos`). |
| `npm run verif` | captures Playwright (1440 et 390) de toutes les pages dans `.verif/` ; accueil à 5 positions de défilement + mouvement réduit. |
| `node scripts/e2e-diagnostic.mjs` | essai de bout en bout du diagnostic sur le serveur local (story 10.4) : gate côté serveur (réponses revérifiées, score, lead, renvoi), page de résultats (un navigateur, 24 heures, 404 sinon), séquence, e-mails, puis les 17 écrans dans un navigateur (sorties A et B, profil à risque, abandon / reprise, gate en erreur, coupure puis « Renvoyer », lien expiré). Même préalable que la ligne suivante. E-mails produits dans `.verif/e2e-diagnostic-emails.txt`. |
| `node scripts/e2e-formulaires.mjs` | essai de bout en bout des formulaires réels sur le serveur local (story 10.3) : barrières anti-robot, validation, base, idempotence, e-mails vers la boîte de test, échec puis rejeu, envoi depuis la page /contact. Préalable : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run base:local`. E-mails produits dans `.verif/e2e-formulaires-emails.txt`. |
| `node scripts/liens.mjs` | vérifie que chaque lien et chaque ancre du site construit mène quelque part. |
| `npm run check` | `astro check` (types). |

Les scripts Playwright utilisent `/opt/pw-browsers/chromium` s'il existe, sinon le Chromium de Playwright (`npx playwright install chromium` une fois). L'ancien mode `?simuler=echec` a disparu avec les formulaires réels (story 10.3) : l'échec se teste avec `scripts/e2e-formulaires.mjs`.

## Les 11 pages

| Route | Page | Source des textes |
|---|---|---|
| `/` | Accueil — hero vidéo/poster avec deux boutons (diagnostic ; « Estimation offerte » vers `/contact#reserver`, D-30), bande Klein, pile de 6 cartes collantes (D-16), méthode + refrain, « Ils ont travaillé avec Anne », diagnostic, Anne, fermeture Klein (D-22) | maquette `01-accueil-*`, `contenu-anne/` |
| `/realisation`, `/realisation/<slug>` | Réalisation (index + 3 fiches story) | `contenu-anne/stories/*/fr.md` (récits d'Anne, tels quels) |
| `/a-propos` `#qui-suis-je` `#methode` `#cible` | À propos, page longue à ancres, repère collant, **sans** bloc vidéo A-15 (D-12) | maquette `apropos-*` ; textes lus dans `contenu-anne/pages/a-propos/fr.md` (story 7.17) |
| `/vendre` (`#estimation`) | deux portes + formulaire d'estimation (8 champs, D-4) | maquette `04-vendre-*` |
| `/acheter` | profils, recherche accompagnée, avis d'acheteurs (§ 5.4), CTA → contact préréglé Achat | maquette `04b-acheter-*` |
| `/diagnostic` | landing autonome | maquette `05-diagnostic-*` |
| `/diagnostic/questions` | 17 écrans, 15 numéros, nav masquée, reprise, abandon, gate | `quiz-contenu.md` (libellés) |
| `/diagnostic/resultats` | score, profil D-23, 3 sous-scores brut + %, 9 feedbacks, sorties A/B, états guide / séquence / lien expiré | `quiz-conception-notion.md` (barème, feedbacks) |
| `/contact` (`#reserver`, `#ecrire`) | Agenda Cal.com chargé au clic (story 10.6) + « Écrire à Anne » (champ projet vente/achat) | maquette `08-contact-*` |
| `/guide` | guide « 10 erreurs », capture téléphone facultatif | maquette `09-guide-*` |
| `/mentions-legales`, `/confidentialite`, `/cookies` | légal, lockup positif en tête des mentions, valeurs A-13 à compléter | maquette `10-legal-*` |
| `/404` | page introuvable | — |
| `/en`, `/en/track-record` | accueil EN et index « Track record » (vide : aucune story traduite, AD-2). Les autres entrées EN renvoient aux pages FR pour cette v1, sans écran mi-traduit. | `src/content/ui/en.json` |

Navigation (D-2, D-6 A, D-17, D-21, D-28) : réseaux · symbole seul | Accueil · À propos ▾ (Qui suis-je ? · Ma méthode · Cible) · Réalisations · Vendre · Acheter · Contact · FR EN (« Réalisations » au pluriel, index titré « Quelques réalisations », D-29). Fixe dès le premier pixel, réduite à 56 px au défilement, jamais masquée ; menu mobile plein écran avec Accueil puis « À propos » en accordéon (lien + chevron). Pied de page `00-footer` partout.

## Réel vs placeholder

**Réel** : **la vidéo d'ouverture A-01** (montage d'Anne, 52 s depuis le 2026-10-05, en boucle, sans son ; son poster = sa première image, D-27 — voir § Vidéo d'ouverture) ; les 3 récits d'Anne (Thonon, Armoy, Allinges) et leurs 13 photos ; la note 5/5 et les 18 avis Immodvisor (`instantane.md`, avis cités tels quels, jamais corrigés) ; les textes d'À propos, de la méthode, du diagnostic (libellés live + barème + 9 feedbacks) ; les logos et lockups eXp du design system.

**Blocs réservés « Actif attendu »** (galet, dimensions réelles, jamais un trou) : A-02 photos des trois ventes « à venir » de la pile (Sciez, Essert-Romand, Anthy — ventes réelles du registre sans story rédigée) · A-04 portrait (accueil, À propos, landing ; remplacé par la photo dès qu'elle est mise dans l'espace d'édition, story 7.16) · A-05 Anne en situation · A-07 témoignages de story quand aucun avis n'est relié · A-10 couverture du guide · A-13 RSAC, carte pro, coordonnées (l'hébergeur, Cloudflare, est renseigné depuis le 2026-10-04) (`src/config/site.ts`, `identite`) · A-15 vidéo méthode (bloc absent, D-12).

**Textes marqués « Point ouvert » / « Contenu à écrire par Anne »** (pastille terra-deep, comme dans la maquette) : Acheter (D-5), section Cible (point ouvert 1), champs de l'estimation (point ouvert 2). À retirer avec le contenu définitif.

## Choix éditoriaux pris pour la v1 (à confirmer par Anne / JB)

Tous dans `src/config/site.ts` :

- **Les 3 avis de l'accueil** : Alexandra V. (vendeuse, reliée à la story de Thonon avec sa photo), JcbAnthy (vendeur), Rémi (acheteur). L'instantané proposait JcbAnthy + Sabine/François + Rémi ; Sabine/François (très long) est gardé en citation courte sur la carte Essert-Romand de la pile.
- **Liaisons avis → story assumées** tant que le champ `story` des fiches d'avis est vide (`liaisonsAssumees`) : Alexandra V. → `appartement-cascade-2024` (« projet vente et achat » = la vente en cascade), RHL acheteur → `auberge-decoupee-2024`. Anne confirme en remplissant `story:` dans la fiche ; ce tableau est alors ignoré.
- **Bande preuve** : une phrase d'Alexandra V. — Acheter : RHL + JamesW.
- **Cartes 4-6 de la pile** : Sciez villa 2025, Essert-Romand chalet 2026, Anthy T3 2024 (registre `_suivi-stories.md`), photo réservée, citation de l'avis rapproché quand la confiance est « forte ».
- **Phrase d'Anne par carte** (`phrasesStories`) : extraite telle quelle du récit.
- **Stories affichées malgré `statut: brouillon`** sur l'aperçu, pour que JB voie le site plein ; le site public filtre sur `statut === 'publie'` (`stories()` dans `src/lib/contenu.ts`). Reste à obtenir la version sans logo eXp des photos d'Essert-Romand.
- **Réseaux sociaux** : URLs des profils inconnues → liens vers les plateformes en attendant (`reseaux`).

## Diagnostic — règles appliquées

- Ordre et libellés du live (`quiz-contenu.md`), identifiants immuables `qNN` / `qNN.x`, barème de la conception (`src/content/diagnostic/bareme.json`, section `_ecarts`) :
  - **Q10 visites × offres : barème non tranché** (SPEC, Open Questions) — matrice reconstruite depuis les 5 combinaisons de la conception, **TODO à valider avec Anne**.
  - Q2 (3 options live) : « Certains diagnostics à refaire » = 5 pts ; Q5 « + vidéo » = 10 comme « + visite virtuelle » ; Q9 : 10 / 5 / 1.
  - Q14 option a : le live cite le « Système 360™ » (retiré, D-15) → descripteur de la conception (« prise en charge totale… »).
  - Q7 : le nombre de plateformes cochées fait le score ; « Autre (préciser) » compte si renseigné ; « Aucune diffusion » exclusive.
- Sortie A = score ≥ 71 **et** Q14 premium **et** Q12 ≠ « minimiser les frais » (CAP-7) ; sinon B.
- Reprise à l'écran atteint (localStorage `avt.diagnostic.v1`), effacée à la soumission du gate. Résultats dans `sessionStorage` (`avt.diagnostic.resultat`, 24 h) — sans session, la page affiche « Ce lien n'est plus valable ».

## TODO(backend) — ce que la v1 simule

Chaque endroit est marqué `TODO(backend)` dans le code (`grep -rn "TODO(backend" src`).

1. ~~Formulaires contact, estimation, guide~~ : **réels depuis la story 10.3** (voir « Formulaires réels »). `envoyerSimule()` a disparu avec la story 10.4.
2. ~~Gate du diagnostic côté client~~ : **côté serveur depuis la story 10.4** (voir « Diagnostic réel »).
3. `src/pages/diagnostic/resultats.astro` et `src/pages/api/diagnostic/sequence.ts` : le bouton guide des résultats mène à la page `/guide` (story 10.3) ; l'inscription à la séquence est enregistrée (`newsletter_opt_in_at`, AD-16) mais la séquence n'est pas encore envoyée. Story 10.5 : lien signé du guide, envoi de la séquence, et retour des textes de la maquette (« Le guide est parti… », « Séquence de 7 e-mails confirmée… »).
4. ~~Gabarit Cal.com statique de `/contact`~~ : **agenda Cal.com réel et webhook depuis la story 10.6** (voir « Rendez-vous Cal.com »).
5. `src/pages/guide.astro` et `src/server/leads.ts` : la demande du guide est enregistrée et Anne est prévenue, mais **Anne envoie le PDF à la main** ; le lien signé expirant envoyé automatiquement arrive à la story 10.5 (CAP-8), avec les textes de la maquette (« lien valable 48 heures »).
6. Adaptateur Cloudflare (`@astrojs/cloudflare`, `worker.ts` pour le cron), D1 `eu`, migrations, admin, mesure d'audience, `funnel_event` (AD-10 → AD-18). `astro.config.mjs` reste `output: 'static'` jusque-là.
7. Données structurées `RealEstateAgent` depuis `identite` (AD-13) une fois A-13 fourni.

## Mise en ligne (story 9.2)

Cloudflare Workers Builds : dossier racine `site`, construction `npm ci && npm run build`, mise en ligne `npx wrangler deploy` (branche `main`) et `npx wrangler versions upload` (autres branches). Depuis la story 10.2, `npm run build` se termine par `scripts/migrations-ci.mjs`, qui applique les migrations de la base quand la construction tourne chez Cloudflare (`WORKERS_CI=1`), et ne fait rien en local. Tant que le réglage de construction `PUBLIC_INDEXATION` ne vaut pas `oui`, toutes les pages portent `noindex, nofollow` et `robots.txt` interdit tout : c'est l'aperçu. La production passe ce réglage à `oui` (story 12.4). Voir `.env.example`.

## Noyau serveur et base des leads (story 10.2)

- **Construction** : `npm run build` produit `dist/client/` (les pages, servies telles quelles) et `dist/server/` (le Worker et sa configuration `wrangler.json`, générée depuis `wrangler.jsonc`). Les scripts de vérification lisent `dist/client/`.
- **Point d'entrée** : `worker.ts` (`main` de `wrangler.jsonc`). Il sert lui-même `/api/retour` et confie le reste à Astro (`handle`), donc les routes de `src/pages/api/` (`export const prerender = false`). `scheduled` (toutes les 15 minutes) réessaie les e-mails en échec depuis la story 10.3. Toutes les pages restent prérendues.
- **Base** : liaison `DB`, base D1 `anne-leads-apercu` (juridiction UE) pour toutes les mises en ligne tant que le site n'est pas lancé ; la base de production `anne-leads` sera branchée à la story 12.4. Schéma : `migrations/0001-lead.sql` (table `lead`, AD-6), `0002-lead-delivery.sql`, `0003-jeton-resultats.sql` (story 10.4) et `0004-rendez-vous.sql` (story 10.6). En local : `npm run base:local`, puis `npx wrangler dev` (après `npm run build`).
- **Santé** : `GET /api/sante` répond `{ "ok": true, "migrations": 4 }` (depuis la story 10.6) si la base répond, 503 sinon. Aucune donnée personnelle.
- **Réglages écartés** : pas de sessions Astro (`session: false`, donc pas de stockage KV créé automatiquement) ; images en `passthrough` (le site prépare ses images lui-même), donc pas de liaison Cloudflare Images.
- **Types** : `npm run check` génère d'abord les types Cloudflare (`wrangler types`, fichier `worker-configuration.d.ts` non versionné), vérifie le site avec `astro check`, puis le code serveur à part avec `tsconfig.worker.json` (les types du Worker et ceux du navigateur ne cohabitent pas).

## Formulaires réels (story 10.3)

- **Ce que voit le visiteur** : rien de neuf à l'écran (mêmes états : envoi en cours, confirmation, échec avec « Renvoyer », erreurs de champ). La différence : sa demande est enregistrée dans la base et Anne la reçoit par e-mail ; le prospect reçoit un accusé de réception (contact, estimation). Pour le guide, Anne envoie le PDF elle-même jusqu'à la story 10.5 : les textes de la page le disent.
- **Routes** : `POST /api/contact`, `/api/estimation`, `/api/guide` (`src/pages/api/`), toutes traitées par `src/server/capture.ts`. Ordre (AD-7) : jeton Turnstile vérifié auprès de Cloudflare (`src/server/verification.ts`) → champ piège `site_web` vide (`src/components/ChampPiege.astro`) → limite de 5 envois par minute et par adresse IP (liaison `LIMITE_FORMULAIRES` de `wrangler.jsonc`, l'adresse n'est ni écrite ni journalisée) → contrat de la source (`src/server/schema.ts` : formats d'AD-6, téléphone mis au format international, un numéro à dix chiffres sans indicatif est considéré comme français) → écriture (`src/server/leads.ts`). Réponses `{ ok: true }` ou `{ ok: false, error: { code, message } }`, codes `ANTI_ROBOT`, `ANTI_ROBOT_INDISPONIBLE`, `TROP_DE_DEMANDES`, `CHAMP_INVALIDE` (+ `champ`), `REQUETE_INVALIDE`, `BASE_INDISPONIBLE`.
- **Écrire d'abord** (AD-4) : une seule transaction écrit le lead et ses lignes `lead_delivery` (`notify_anne`, `confirm_prospect` ; guide : `notify_anne` seul). La page envoie une clé `submission_id` (ULID) gardée tant que l'envoi n'a pas réussi : « Renvoyer » ne crée jamais deux demandes.
- **E-mails** (`src/server/delivery.ts`, `src/server/messages.ts`, `src/server/adapters/email.ts`, seul fichier qui parle à Resend) : envoyés après la réponse au visiteur ; un échec n'est jamais une erreur pour lui, il est noté sur la ligne (`status`, `attempts`, `last_error`) et réessayé toutes les 15 minutes, 5 essais au plus. Chaque envoi est réservé en base avant de partir et porte une clé anti-doublon chez Resend : jamais deux fois le même e-mail. `notify_anne` est écrit pour être recopié dans la fiche Modelo (un bloc par champ ; « Répondre » écrit au prospect) ; `confirm_prospect` part de `anne@annevialtissot.fr`, « Répondre » écrit à Anne (`BOITE_ANNE`, `wrangler.jsonc`).
- **Aperçu = tests** (AD-12) : tant que `ENVIRONNEMENT` (`wrangler.jsonc`) ne vaut pas `production`, chaque lead est écrit avec `is_test = 1` et **tous** les e-mails partent vers la boîte de test (secret `BOITE_TEST`), objet préfixé `[TEST]`, jamais vers Anne ni vers le prospect.
- **Navigateur** : `src/islands/formulaires.ts` charge le script Turnstile seulement au premier envoi, jamais à l'ouverture de la page (AD-11), et obtient un jeton neuf à chaque essai. Clé publique du widget `site-anne` dans le code ; `PUBLIC_TURNSTILE_SITE_KEY` la remplace pour les essais en local (clé d'essai de Cloudflare `1x00000000000000000000AA`, qui passe partout).
- **Secrets** (Cloudflare, jamais dans le dépôt) : `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `BOITE_TEST`. Sans eux, l'envoi échoue proprement (`ANTI_ROBOT_INDISPONIBLE`) ou l'e-mail reste en attente (`RESEND_API_KEY absente`). En local, `URL_SERVICES_ESSAI` (fichier de réglages de `wrangler dev`, jamais dans Cloudflare) dirige Turnstile et Resend vers une imitation, car le serveur local ne peut pas les joindre.
- **Journaux** : JSON, sans donnée personnelle ; une adresse e-mail n'y figure que sous forme d'empreinte (`src/server/journal.ts`).

## Diagnostic réel (story 10.4)

- **Ce que voit le visiteur** : les 17 écrans ne changent pas. Le gate n'affiche plus le score avant les coordonnées (le navigateur ne le connaît pas, AD-5) ; après l'envoi, la page de résultats est la même qu'avant (score, profil, 3 sous-scores, 9 feedbacks, sortie A ou B). La case du téléphone n'est plus écrasée par l'indicatif.
- **Gate** : `POST /api/diagnostic` (`src/pages/api/diagnostic.ts`), traité par `src/server/capture.ts` comme les autres formulaires (Turnstile, champ piège, fréquence, contrat de la source avec indicatif FR +33 / CH +41), puis `src/server/diagnostic.ts` revérifie les réponses contre `questions.json` (une réponse par question à choix unique, « aucune » exclusive, « autre » seulement avec sa précision) et calcule score, profil et orientation A/B avec `src/server/scoring.ts` (ex-`src/lib/scoring.ts`). Le barème `bareme.json` n'est plus dans le JavaScript du navigateur. Le lead `diagnostic` est écrit avec `token`, `answers`, `scores`, `band`, `orientation` et ses deux envois (`notify_anne`, `confirm_prospect`). Réponse `{ ok: true, url }`.
- **Renvoi** : l'îlot `src/islands/diagnostic.ts` garde le `submission_id` avec les réponses sur l'appareil jusqu'au succès ; « Renvoyer » redonne la même adresse, sans second lead. La sauvegarde locale est effacée après succès.
- **Page de résultats** (`src/pages/diagnostic/resultats.astro`, `export const prerender = false`, logique dans `src/server/resultats.ts`) : `/diagnostic/resultats?t=<jeton>` vaut 24 heures. Le premier navigateur qui l'ouvre reçoit une clé (cookie `avt_resultats`, HttpOnly, Secure, SameSite=Lax), la base n'en garde que l'empreinte (`token_browser`, migration 0003), puis la page se recharge sans jeton dans l'adresse. Un autre navigateur, un jeton inconnu ou périmé : 404, « Ce lien n'est plus valable ». `wrangler.jsonc` fait passer cette adresse par le Worker (`run_worker_first`).
- **Séquence** : le bouton « Recevoir la séquence » (sortie B) appelle `POST /api/diagnostic/sequence`, réservé au navigateur qui a la clé ; il écrit `newsletter_opt_in_at`. Astro refuse un POST venu d'un autre site (403).
- **E-mails** (`src/server/messages.ts`) : la notification à Anne donne score, profil, sous-scores, sortie A ou B, le message libre et toutes les réponses en clair, au format Modelo ; le prospect reçoit le résumé de ses scores (sans lien vers la page, qui ne s'ouvre que dans son navigateur), avec l'invitation au rendez-vous (A) ou au guide (B).
- **Rendu côté serveur** : `Lockup.astro` inclut ses SVG à la construction (`?raw`) au lieu de les lire sur le disque, car le disque n'existe pas dans le Worker.

## Retours sur l'aperçu (story 9.6)

Sur l'aperçu (site non indexable), chaque page porte un bouton « Un retour ? » (`src/components/RetourApercu.astro`, inclus par `Base.astro`). La remarque part en POST vers `/api/retour`, servie par `worker.ts` (point d'entrée Cloudflare, `main` de `wrangler.jsonc`, `run_worker_first: ["/api/*"]`), qui crée un ticket GitHub étiqueté `retour-apercu` avec la page, l'auteur (en-tête `cf-access-authenticated-user-email` posé par Cloudflare Access), l'écran et la date. Secret `GITHUB_TOKEN` côté Cloudflare, jamais dans le dépôt (`.dev.vars` en local, ignoré ; modèle `.dev.vars.example`). En production le bouton n'est pas rendu. Le bouton est masqué quand `navigator.webdriver` est vrai (captures Playwright). `worker.ts` sera remplacé par le noyau serveur de l'epic 10.

## Rendez-vous Cal.com (story 10.6)

Sur `/contact`, le bouton « Voir les créneaux d'Anne » charge l'agenda de Cal.com (le service de prise de rendez-vous d'Anne) dans la page ; rien n'est chargé depuis Cal.com avant ce clic (ni avant l'arrivée par `/contact#reserver`). Le rendez-vous « Premier échange » se fait par téléphone (décision de JB du 2026-10-08). Après une réservation, Cal.com appelle `POST /api/webhook-cal` : la route vérifie la signature `X-Cal-Signature-256` (HMAC SHA-256 du corps avec le secret `CAL_WEBHOOK_SECRET` ; absente ou fausse : 401 ; secret non posé : 503), ignore les autres événements que `BOOKING_CREATED`, refuse une réservation sans case de confidentialité cochée (422), puis écrit un lead `rdv` (téléphone, date du rendez-vous dans `rdv_start`, note du prospect) et notifie Anne. Un même rendez-vous rejoué par Cal.com ne crée qu'un lead (identifiant `cal:<uid>`). Le prospect ne reçoit rien du site : Cal.com lui envoie déjà la confirmation et l'invitation d'agenda. L'essai provisoire `/api/essai-cal` de la story 10.1 est retiré.

## Vidéo d'ouverture (stories 7.4 et 8.3)

- **Source** : `contenu-anne/videos/ouverture-source.mp4` (hors Git, 115 Mo, 4K, 52 s, montage d'Anne du 2026-10-05, story 7.15 ; encodé avec `--debut 0.1` pour sauter deux images blanches). Inventaire : `contenu-anne/videos/liens.md`.
- **Encodage** : `npm run video` (`scripts/video.mjs`, binaire `ffmpeg-static`) → `public/video/ouverture.mp4` (H.264, 1440 px, 30 i/s, sans son, faststart) + `ouverture.webm` (VP9) + `contenu-anne/photos/ouverture-poster.jpg` (première image) ; puis `npm run images` dérive le poster (`photos/ouverture-poster`). Options : `--debut`, `--duree`, `--crf`, `--largeur`, `--recadrage`.
- **Dans la page** (`src/components/accueil/Hero.astro`) : `<video muted autoplay loop playsinline preload="metadata">` avec deux `<source>` (WebM puis MP4), écrites seulement si `public/video/ouverture.mp4` existe au build (sinon la balise est masquée par `.hero-video-absente` et le poster `<picture>` reste). Vidéo masquée sous `prefers-reduced-motion` ; non chargée si le navigateur annonce l'économie de données (`navigator.connection.saveData`).
- **Poids finaux** : voir la story 8.3 (`_bmad-output/implementation-artifacts/8-3-vidéo-d-ouverture-intégrée.md`).

## Polices (story 8.1)

Italiana (titres) et DM Sans (texte) sont servies par le site lui-même depuis `public/fonts/` (format `woff2`, sous-ensemble latin, licence OFL jointe). Google Fonts est retiré : aucune requête ne part chez Google (AD-11), et `npm run verif` signale toute requête vers `fonts.googleapis.com` ou `fonts.gstatic.com` comme une erreur. Graisses : Italiana 400 ; DM Sans 400, 500, 700 et 400 italique (les mêmes qu'avant ; la seule règle en 600 s'affiche en 700, comme avant). Les déclarations `@font-face` sont en tête de `src/styles/global.css` ; `Base.astro` télécharge en priorité Italiana et DM Sans 400. Les fichiers viennent des paquets npm Fontsource 5.3.0 (`@fontsource/italiana`, `@fontsource/dm-sans`), copiés une fois : aucun paquet ajouté au projet.

## Écarts assumés avec la maquette / les briefs

- **Gate du diagnostic sans score** (story 10.4) : la maquette affichait le score sur 100 au-dessus du formulaire ; AD-5 interdit que le résultat existe dans le navigateur avant les coordonnées (c'est le défaut reproché à ScoreApp). Le gate garde son chapeau « Votre diagnostic est prêt » et annonce le score sans le donner.
- **Résultats : guide et séquence en attente de la story 10.5** : les boutons guide mènent à la page `/guide` (bouton A renommé « Recevoir le guide ») et l'état « Le guide est parti » n'existe plus ; l'inscription à la séquence affiche « Inscription enregistrée » au lieu de « Séquence de 7 e-mails confirmée. Le premier arrive demain matin », puisqu'elle ne part pas encore. Page « lien plus valable » : texte exact (24 heures, dans le même navigateur, résumé envoyé par e-mail) au lieu de « disponibles 30 jours » ; boutons « Refaire le diagnostic » et « Écrire à Anne ».
- **Vidéo d'ouverture au-dessus du budget** « 8-12 s, < 6 Mo » : JB a décidé (D-27) de diffuser le montage d'Anne en entier (52 s depuis le 2026-10-05, 95 s avant). Compromis : 1440 px au lieu de 1920 (le hero fait 900 px de haut, différence invisible), crf 30, 7,8 Mo MP4 / 6,4 Mo WebM (≈ 15 / 10 Mo avec l'ancien montage). Le fichier est lu en flux (faststart + `preload="metadata"`) : la lecture démarre après les premières secondes reçues, le poster couvre l'attente, et le LCP (plus grand élément affiché) reste le poster, chargé en priorité. À remesurer sur l'aperçu (story 10.8).

- **Pas de Lenis** (défilement inertiel du brief scroll-craft) : JS minimal, défilement natif ; à ajouter en îlot si JB le souhaite (≈ 10 Ko).
- **Tiret des titres Italiana** : la police n'a pas de glyphe visible pour le tiret ASCII ; les titres (« VIAL‑TISSOT », communes) emploient le tiret insécable U+2011 (`src/lib/texte.ts`).
- **Nav réduite sur le hero** : transparente et écru au repos, écru 86 % + flou dès 40 px de défilement (la maquette ne réduisait qu'après le hero et laissait un trou sans nav — revue B1.1).
- **Section Cible** conservée avec ses textes de placement (point ouvert 1 non tranché) ; **menu « À propos » à trois sous-entrées**.
- **Accueil EN sans la pile** (aucune story traduite, AD-2) ; avis cités en français, signalés comme tels ; entrées de nav EN vers les pages FR.
- Les vignettes de la pile en mobile gardent le débord de 30 px de la photo au-dessus de la carte (maquette) ; le pas de la pile est la hauteur de carte + 30 px (desktop 630 px), les cartes sont en flux sous `prefers-reduced-motion`.
- Marqueurs « Point ouvert » / « Contenu à écrire par Anne » affichés (pastilles de la maquette) pour que JB les repère ; à supprimer en production.
- **Contrastes** vérifiés sur chaque paire de tokens employée (≥ 4,5:1) — deux écarts à la maquette : la pastille « Bases solides » passe du fond galet (4,35:1) à l'écru bordé ; les dates indisponibles de l'ancien gabarit Cal.com (remplacé à la story 10.6 par l'agenda de Cal.com, dont les couleurs sont réglées chez Cal.com).
- **Écarts d'architecture de la story 10.2** : `main` → `worker.ts` au lieu de l'option `workerEntryPoint` (absente de l'adaptateur 14) ; une seule base (aperçu) pour toutes les mises en ligne jusqu'au lancement, la base de production étant branchée en 12.4 ; plan Cloudflare gratuit tant qu'il n'y a pas de vrais leads (la restauration sur 30 jours du plan payant attendra, action J10).
- **Écarts de la story 10.3** : Anne envoie le PDF du guide à la main jusqu'à la story 10.5, donc la page Guide dit « Anne vous envoie le guide par e-mail sous un jour ouvré » et le bouton dit « Recevoir le guide » (maquette : « Télécharger le guide », « lien valable 48 heures ») ; la limite de fréquence compte par adresse IP (la story dit « par adresse » sans préciser) ; les textes des deux e-mails automatiques et l'ordre des blocs de la fiche Modelo sont des propositions à faire valider par Anne ; une tâche planifiée toutes les 15 minutes réessaie les e-mails en échec (l'architecture prévoyait le rejeu depuis l'admin, story 10.7, qui reste).
- Pages légales : textes de structure conformes à AD-16 (finalités, bases légales, 3 ans), **à faire valider par Anne** avant publication ; les valeurs A-13 sont des pastilles « à compléter ».

## Largeurs intermédiaires (story 8.2)

La maquette dessine 1 440 px (ordinateur) et 390 px (téléphone). Entre 900 et 1 399 px, quatre pages ont une plage de largeur dédiée (colonnes proportionnelles, titres réduits) : À propos, fiche de vente, landing du diagnostic (900 à 1 199 px), guide (900 à 1 399 px, couverture masquée sous 1 100 px). `node scripts/ecrans.mjs` contrôle l'absence de débordement à chaque largeur.

## Espace d'édition (story 7.13)

- `public/admin/` : Sveltia CMS (version figée dans `index.html`) et sa configuration `config.yml`. Collections : ventes (`contenu-anne/stories/<id>/fr.md`, photos dans `photos/` de la story), pages, avis Immodvisor (lecture seule sauf `story` et `retenu`), coordonnées (`legal/identite.md`). L'anglais ne s'édite pas dans le CMS (traduction par Claude, epic 6).
- Les photos envoyées sont réduites dans le navigateur en WebP 3 200 px ; `scripts/images.mjs` (lancé par `npm run build`) en tire les formats web. Il prend dans `stories/<id>/photos/` les `photo-*.jpg` (ancien circuit, `scripts/preparer-photos`) et les `*.webp` / `*.png`.
- `photo_principale` et `photos` portent un chemin relatif à la story (`photos/x.webp`) ; un ancien numéro (`"047"`) est encore lu via `photos.json`.
- Brouillons : l'aperçu montre toutes les stories ; le site public (`PUBLIC_INDEXATION=oui`) seulement les « publie ».
- Page À propos (story 7.17) : le sous-titre et le texte de la page « À propos » de l'espace d'édition sont ceux du site. `aPropos()` (`src/lib/contenu.ts`) découpe le texte selon ses titres (voir l'aide du champ « Texte ») ; le refrain, la ligne des langues, les profils « Cible » et les boutons restent dans le gabarit.
- Portrait d'Anne (story 7.16) : champ « Portrait d'Anne » de la page À propos. L'espace d'édition range la photo à côté de la page (`contenu-anne/pages/a-propos/`, story 7.18) ; un chemin `photos/x.webp` vise `contenu-anne/photos/` ; le site l'affiche dans les emplacements A-04 (À propos, accueil, diagnostic). Champ vide : le bloc réservé A-04 reste affiché.
- Écart assumé : les commentaires de l'en-tête YAML (« proposition Claude… ») disparaissent quand une fiche est enregistrée depuis l'espace d'édition ; les consignes sont dans les aides des champs.

## Garde-fous de contenu (stories 6.2 et 7.9)

- **Anglais complet ou rien** (AD-2) : `src/i18n/index.ts` fait échouer la construction si `en.json` n'a pas exactement les clés de `fr.json` ou laisse un texte vide, en nommant les clés en cause.
- **Plus de vérification d'autorisation dans le code** (décision de JB du 2026-10-05, story 7.14) : les clients des ventes actuelles ont donné leur accord ; « publie » suffit. Le champ `autorisations` des anciennes fiches est toléré mais ignoré.
- **Témoignage d'une vente = son avis Immodvisor** (story 7.14) : la fiche affiche les avis dont le champ `story` désigne la vente, vendeur d'abord, cités tels quels. La liste `temoignages` de l'en-tête n'est plus proposée dans l'espace d'édition ; si une citation y est écrite à la main, elle passe avant l'avis.
- Ce qu'Anne doit fournir est listé dans `contenu-anne/A-FOURNIR.md`.

## Vérification faite (voir `.verif/`)

Story 10.4 : `node scripts/e2e-diagnostic.mjs` : 31 constats bons (voir la story) · `node scripts/e2e-formulaires.mjs` : 25 constats bons · `npm run check` : 0 erreur · `node scripts/liens.mjs` : 24 pages, 0 lien cassé · `npm run verif` : aucune erreur console.

Story 10.3 : `node scripts/e2e-formulaires.mjs` : 25 constats bons sur 25 (voir la story) · `npm run build` sans erreur (19 pages) · `npm run check` : 0 erreur · `npm run dev` : les 17 routes répondent 200, une route inconnue 404 · `node scripts/liens.mjs` : 0 lien cassé · `node scripts/e2e-diagnostic.mjs` : sorties A, B et profil à risque, abandon/reprise, erreurs du gate, lien expiré, aucune erreur console · `npm run verif` : captures 1440 / 390 de chaque page, accueil à 5 positions (hero, pile 3 positions, fermeture) et en mouvement réduit.
