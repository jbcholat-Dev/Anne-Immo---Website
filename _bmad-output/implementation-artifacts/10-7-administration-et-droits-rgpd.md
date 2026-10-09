---
story: 10.7
epic: 10 — Capture des leads et backend
statut: review
date: 2026-10-08
---

# Story 10.7 — Administration et droits RGPD

## Objectif
Anne consulte ses demandes, relance un e-mail manqué, marque une recopie dans Modelo et répond seule à une demande d'accès ou d'effacement ; les demandes anciennes disparaissent d'elles-mêmes au bout de 3 ans (critères : `_bmad-output/planning-artifacts/epics.md`, story 10.7 ; AD-3, AD-4, AD-9, AD-14, AD-16, AD-18).

## Décisions prises pendant la story
- **Adresse `/gestion`** au lieu de `/admin` : `/admin` est l'espace d'édition Sveltia CMS (story 7.13).
- **Double verrou** : Access devant l'adresse, et vérification du jeton Access par le serveur (signature, application, équipe, expiration). Un réglage Access raté ne suffit donc pas à ouvrir l'espace. L'identifiant d'application (`ACCESS_AUD`) est public et vit dans `wrangler.jsonc` ; vide, l'espace est fermé.
- **Droits par adresse e-mail** : l'export et l'effacement portent sur toutes les demandes faites avec l'adresse (toutes sources, casse ignorée), car une personne exerce ses droits sur elle-même, pas sur un formulaire.
- **Confirmation de l'effacement** : retaper l'adresse, l'effacement étant définitif.
- **Recherche par téléphone** au format national (« 06 01 02 03 04 » trouve « +33601020304 »), les numéros étant rangés au format international.

## Écarts assumés avec les critères
- Pas de propagation de l'effacement « au contact Resend » : le site n'y crée aucun contact ni audience (AD-8), il n'y a donc rien à effacer.
- MFA : le second facteur est le code à usage unique envoyé par e-mail par Access ; le renforcement (connexion Google d'Anne avec sa validation en deux étapes) est décrit au RUNBOOK § 4 quinquies.
- Purge à chaque passage de la tâche planifiée (15 minutes) au lieu d'un « cron quotidien » : même tâche que le rejeu, aucun effet visible.

## Ce qui est fait
- `src/server/acces.ts` : vérification du jeton `Cf-Access-Jwt-Assertion` (RS256, clés publiques de l'équipe en cache 1 h et rechargées si la clé est inconnue, `aud`, `iss`, `exp`, `nbf`, adresse).
- `worker.ts` : `/gestion*` et `/api/gestion*` passent par ce contrôle (403 sinon, journal `gestion_refus`) ; l'adresse vérifiée passe aux pages par l'en-tête interne `x-gestion-compte`, retiré de toute autre requête ; réponses `no-store` et `noindex`. La tâche planifiée lance aussi la purge.
- `src/server/gestion.ts` : liste et recherche, fiche, relance d'un envoi (compteur remis à zéro, envoi par `delivery.ts`), marque Modelo ; chaque action met à jour `last_activity_at`.
- `src/server/rights.ts` : export JSON lisible (sans champs techniques) et effacement ; journal `droit_exerce` (date, type, empreinte de l'adresse, nombre de demandes, compte).
- `src/server/purge.ts` : `CONSERVATION_ANS = 3`, suppression des demandes sans activité depuis 3 ans et de leurs envois. `confidentialite.astro` lit la même constante.
- Pages `src/pages/gestion/index.astro` (liste, recherche, cadre des droits, derniers droits exercés) et `lead.astro` (fiche, envois, relance, Modelo), gabarit `src/layouts/Gestion.astro`, en français seulement. Actions `src/pages/api/gestion/` : `rejouer`, `modelo`, `export`, `effacer`.
- Migration `0006-droits-rgpd.sql` : table `droit_exerce`, index `lead_derniere_activite`.
- `wrangler.jsonc` : `ACCESS_EQUIPE`, `ACCESS_AUD` (vide en attendant JB), `/gestion` dans `run_worker_first`.
- Essai `scripts/e2e-gestion.mjs` ; `scripts/serveur-essai.mjs` imite les clés publiques d'Access et signe des jetons d'essai.
- Documents : `site/README.md` (§ « Gestion des demandes et droits RGPD », écarts, santé à 6 migrations), `RUNBOOK.md` § 4 quinquies (réglage, procédure RGPD, lancement, pièges), `CLAUDE.md` (commande d'essai).

## Ce qui est vérifié (2026-10-08, en local)
- `node scripts/e2e-gestion.mjs` : **39 constats sur 39** :
  - sans jeton, jeton mal signé, d'une autre application, périmé, d'une autre équipe, sans adresse, tronqué, ou en-tête interne forgé : 403 sur la liste, la fiche et l'export, aucune donnée sur les variantes d'adresse (`/GESTION`, `/gestion.html`) ; effacement sans jeton valable : 403, rien effacé ;
  - liste (compte affiché, `no-store`, `noindex`), recherche par adresse et par téléphone, fiche sans jeton technique, fiche inconnue 404 ;
  - relance d'un e-mail en échec (panne simulée de Resend) : parti et marqué fait ; relance d'un envoi déjà fait ou d'un canal non e-mail refusée ;
  - Modelo posé, retiré, refusé sur une demande inconnue ;
  - export : pièce jointe JSON, 2 demandes quelle que soit la casse, aucun champ technique, droit noté avec l'empreinte ;
  - effacement refusé avec une confirmation fausse, fait avec la bonne (2 demandes et leurs envois), noté ;
  - purge par la tâche planifiée : demande inactive depuis 3 ans et 1 jour supprimée, celle à 3 ans moins 1 jour gardée ;
  - navigateur, ordinateur et téléphone : pas de défilement horizontal, fiche affichée, bouton Modelo et effacement avec leur message, aucune erreur console. Captures `.verif/gestion-*.png`.
- `e2e-formulaires`, `e2e-diagnostic`, `e2e-rendez-vous`, `e2e-guide` : tous les constats bons.
- `npm run build` sans erreur ; `npm run check` : 0 erreur ; `node scripts/liens.mjs` : 26 pages, 1600 liens, 0 cassé ; `npm run verif` : aucune erreur console ; `node scripts/ecrans.mjs` : rien à signaler.

## Ce qui reste
- ~~JB : donner l'AUD de l'application Access de l'aperçu (action J32)~~ : donné le 2026-10-09, mis dans `ACCESS_AUD`.
- Essai en ligne après la fusion : ouvrir `/gestion`, relancer, exporter et effacer une demande de test.
- Anne : valider la politique de confidentialité (durée de 3 ans) avec les autres pages légales.
- Au lancement (story 12.4) : application Access sur `annevialtissot.fr/gestion`, son AUD ajouté (RUNBOOK § 4 quinquies).
