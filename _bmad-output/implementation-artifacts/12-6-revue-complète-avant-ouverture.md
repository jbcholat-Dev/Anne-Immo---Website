# Story 12.6 : Revue complète du site avant l'ouverture au public

Epic 12, Lancement public. Ouverte le 2026-10-11 à 19 h 31 à la demande de JB (« avant de lancer la publication, une revue complète du site sur tous les axes : contenu, sécurité et autres, pour savoir si tout est cohérent »), fil « Revue complète avant ouverture ».

## Objectif

Savoir, avant de retirer le code d'accès général de `annevialtissot.fr`, s'il reste un point qui empêche l'ouverture, et classer tout le reste en « à corriger vite » et « plus tard », avec la preuve de chaque constat.

## Ce qui a été contrôlé (2026-10-11, en lecture seule sur la production)

- Code de `main` (`3a4ef4f`) : construction, types, liens, essais de bout en bout des formulaires, de `/gestion` et du guide sur le serveur local.
- Réglages Cloudflare lus par l'API (aucune écriture) : version en ligne `7924b4aa` branchée sur `anne-leads`, `ENVIRONNEMENT=production`, `URL_SITE=https://annevialtissot.fr` ; secrets présents (`LIEN_SECRET` compris) ; applications Access (« Lancement - site ferme en attendant Anne », « Gestion », contournement du webhook Cal.com, aperçu) ; règle `Anne et JB` limitée à deux adresses ; Turnstile (`annevialtissot.fr`, `www`, `jbcholat.workers.dev`) ; zone `annevialtissot.fr` (DNSSEC, TLS, HSTS, SPF, DMARC, DKIM).
- Adresses en ligne : `www` et `.com` redirigent en 301 vers `https://annevialtissot.fr/`, `http` aussi ; tout le reste demande le code d'accès.
- Texte de toutes les pages de la version publique (`PUBLIC_INDEXATION=oui`), guide PDF, séquence d'e-mails, avis, mentions légales.

Synthèse complète (constats, preuves, classement) : artefact « Revue avant ouverture » publié dans le fil.

## Ce qui est fait (PR de cette story)

- **Bloquant levé** : `/api/retour` (bouton « Un retour ? » de l'aperçu) n'exige plus seulement Cloudflare Access devant le site ; il vérifie lui-même le jeton Access (`compteAcces`), sinon 403. Sans cela, une fois le code d'accès retiré, n'importe qui pouvait créer des tickets `retour-apercu` dans le dépôt public, que les fils Claude traitent comme des demandes.
- E-mails aux prospects : prénom, commune et message saisis par le visiteur sont rendus inertes (crochets remplacés par des parenthèses), pour qu'aucun lien déguisé ne parte dans un e-mail signé `anne@annevialtissot.fr`.
- En-têtes de sécurité sur toutes les pages (`public/_headers` et `securiser()` dans `worker.ts`) : HSTS un an, interdiction d'affichage dans un cadre, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Adresse de référence des pages (balise `canonical` et `og:url`) sans « .html » : `https://annevialtissot.fr/a-propos` au lieu de `…/a-propos.html`, `/` au lieu de `/index.html`.
- Accueil, carte d'Allinges : la phrase « le prix a été repositionné. Non pas baissé » n'était plus dans le récit, qui dit que le prix était au-dessus du marché ; remplacée par une phrase extraite telle quelle du récit.

## Vérifié

- `npm run check` : 0 erreur. `PUBLIC_INDEXATION=oui npm run build` : réussi ; `node scripts/liens.mjs` : 25 pages, 1452 liens, 0 cassé.
- Balises `canonical` de la construction publique : `/`, `/a-propos`, `/realisation`, `/realisation/anthy-t3-2024`, `/en`, `/diagnostic/questions`.
- `node scripts/e2e-formulaires.mjs`, `e2e-gestion.mjs`, `e2e-guide.mjs` : « Tous les constats sont bons ».
- Serveur local (`wrangler dev`) : `POST /api/retour` avec un faux en-tête d'adresse et sans jeton → 403 `acces` ; `/a-propos` et `/gestion` portent `Strict-Transport-Security`, `X-Frame-Options: DENY`, `Referrer-Policy`.

## Ce qui reste

Voir la synthèse. À demander à Anne avant l'ouverture : le médiateur de la consommation et le lien du barème d'honoraires d'eXp, à ajouter aux mentions légales. Le reste (textes, séquence d'e-mails, téléphone cliquable, réglages Cloudflare, SEO) en stories après l'ouverture.
