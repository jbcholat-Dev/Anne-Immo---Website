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

- Mentions obligatoires (2026-10-11, 20 h 11, documents transmis par JB) : page `/honoraires` (barème résidentiel, commercial et terrains, recopié du barème d'équipe eXp sans aucune mention de son ancien titulaire), liée depuis le pied de page, le sommaire des pages légales et les mentions légales ; section « Médiation de la consommation » (MEDIMMOCONSO, 1 allée du Parc de Mesemena, 44505 La Baule, www.medimmoconso.fr) et phrase « ne peut recevoir ni détenir aucun fonds » dans les mentions légales. Médiateur reporté dans `contenu-anne/legal/identite.md` et dans le formulaire de l'espace d'édition. Coquille du barème d'origine corrigée (« et à la charge » → « est à la charge »).

- Commentaires de JB sur la synthèse (2026-10-11, 20 h 12 à 20 h 14, « à corriger tout de suite ») :
  - numéro d'Anne : affiché sur `/contact` en lien d'appel (« Par téléphone : 06 71 99 17 54 ») ; le lien « Ou appeler Anne directement » du formulaire d'estimation appelle le numéro au lieu de renvoyer vers `/contact` (`telephone` dans `src/config/site.ts`) ;
  - parcours d'Anne : « on enlève à propos » ; les précisions d'À propos qui contredisaient l'accueil sont retirées (« en France et à l'étranger (Brésil) — Groupe BEL puis Danone », « au Vietnam et au Brésil ») ; l'accueil garde « Danone à Évian puis Bel au Brésil » ;
  - un seul titre, « Conseillère en immobilier » : signature retirée du texte de l'étape 6 (le site ajoute la sienne, comme aux étapes 1 à 5), couverture et conclusion du guide corrigées, note « à vérifier » retirée, PDF refait (16 pages) ;
  - fautes des textes d'Anne (hors avis) : se projeter, être guidés dans tout le processus, composée, par où commencer, des agences, 5 000 m², entrepreneuriale, ses multiples facettes, systématiquement, Éclairer, proactivité, lémanique, « Pourquoi l'immobilier ? ».

## Vérifié

- `npm run check` : 0 erreur. `PUBLIC_INDEXATION=oui npm run build` : réussi ; `node scripts/liens.mjs` : 25 pages, 1452 liens, 0 cassé.
- Balises `canonical` de la construction publique : `/`, `/a-propos`, `/realisation`, `/realisation/anthy-t3-2024`, `/en`, `/diagnostic/questions`.
- `node scripts/e2e-formulaires.mjs`, `e2e-gestion.mjs`, `e2e-guide.mjs` : « Tous les constats sont bons ».
- Barème et médiateur : `PUBLIC_INDEXATION=oui npm run build` réussi, `npm run check` 0 erreur, `node scripts/liens.mjs` 26 pages, 1541 liens, 0 cassé ; aucune occurrence de l'ancien titulaire dans le site construit ni dans le dépôt ; captures 1440 et 390 de `/honoraires` et `/mentions-legales` : aucun débordement (largeur de page = largeur d'écran), montants insécables sur téléphone.
- Commentaires de JB : `npm run check` 0 erreur ; `PUBLIC_INDEXATION=oui npm run build` réussi ; `node scripts/liens.mjs` 26 pages, 1542 liens, 0 cassé ; lien `tel:+33671991754` présent sur `/contact` et dans le formulaire de `/vendre` ; `node scripts/guide-pdf.mjs` : 16 pages, « conseillère en immobilier » en couverture et en conclusion ; `e2e-guide` et `e2e-formulaires` : tous bons ; captures 1440 et 390 de `/contact` sans débordement.
- Serveur local (`wrangler dev`) : `POST /api/retour` avec un faux en-tête d'adresse et sans jeton → 403 `acces` ; `/a-propos` et `/gestion` portent `Strict-Transport-Security`, `X-Frame-Options: DENY`, `Referrer-Policy`.

## Ce qui reste

Voir la synthèse. Médiateur et barème : faits (ci-dessus). Le reste (textes, séquence d'e-mails, téléphone cliquable, réglages Cloudflare, SEO) en stories après l'ouverture.
