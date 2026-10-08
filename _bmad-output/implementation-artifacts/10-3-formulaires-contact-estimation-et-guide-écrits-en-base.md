---
story: 10.3
epic: 10 — Capture des leads et backend
statut: done
date: 2026-10-07
---

# Story 10.3 — Formulaires contact, estimation et guide écrits en base et notifiés à Anne

## Objectif
Un message, une demande d'estimation ou une demande de guide envoyés depuis le site sont réellement enregistrés dans la base des leads et transmis à Anne ; le prospect reçoit un accusé de réception (critères : `_bmad-output/planning-artifacts/epics.md`, story 10.3).

## Décisions prises pendant la story
- 2026-10-07, JB : les demandes arrivent à Anne sur `avialtissot@gmail.com` (boîte qu'elle lit déjà ; `BOITE_ANNE` dans `wrangler.jsonc`). Elle sert aussi d'adresse de réponse des accusés de réception, car `anne@annevialtissot.fr` n'a pas de boîte de réception (action J08).
- 2026-10-07, Claude (défaut, réversible) : tant que le site n'est pas lancé (`ENVIRONNEMENT = apercu`), chaque lead est un test (`is_test = 1`) et **tous** les e-mails partent vers la boîte de JB (`BOITE_TEST`). Ni Anne ni un vrai prospect ne reçoivent rien depuis l'aperçu.
- 2026-10-07, Claude (défaut) : limite de fréquence = 5 envois par minute et par adresse IP (liaison de limitation Cloudflare ; l'adresse IP n'est ni écrite ni journalisée).

## Écarts assumés avec les critères
- **Guide** : Anne envoie le PDF à la main jusqu'à la story 10.5 (transitoire prévu par l'epic) ; la page le dit (« Anne vous envoie le guide par e-mail sous un jour ouvré », bouton « Recevoir le guide ») au lieu des textes de la maquette (« lien valable 48 heures »), qui reviendront en 10.5.
- **Rejeu automatique** : une tâche planifiée toutes les 15 minutes réessaie les e-mails en échec (5 essais au plus). L'architecture prévoyait le rejeu depuis l'admin (10.7), qui reste à faire ; sans ce rejeu automatique, un e-mail en échec attendrait l'admin.
- **Textes des e-mails et ordre des blocs Modelo** : propositions de Claude (ordre supposé de la fiche contact : Nom, Prénom, Téléphone, E-mail, Type de contact, Commune du bien, Type de bien, Notes), à faire valider par Anne.
- **Test local** : un réglage `URL_SERVICES_ESSAI` (jamais posé dans Cloudflare) dirige Turnstile et Resend vers une imitation, car le serveur local ne peut pas les joindre depuis l'environnement de Claude.

## Ce qui est fait
- Routes serveur `POST /api/contact`, `/api/estimation`, `/api/guide` (`src/pages/api/`), traitées par `src/server/capture.ts` dans l'ordre d'AD-7 : jeton Turnstile vérifié (`src/server/verification.ts`), champ piège `site_web` (`src/components/ChampPiege.astro`), limite de fréquence (`ratelimits` dans `wrangler.jsonc`), contrat de la source (`src/server/schema.ts`, téléphone en E.164), puis écriture.
- Écriture (`src/server/leads.ts`, AD-4) : une transaction écrit le lead et ses lignes `lead_delivery` (`notify_anne` et `confirm_prospect` ; guide : `notify_anne` seul) ; clé d'idempotence `submission_id` (ULID généré par la page, gardé jusqu'au succès).
- Diffusion (`src/server/delivery.ts`, seul module qui exécute `lead_delivery`) via l'adaptateur `src/server/adapters/email.ts` (seul contact avec Resend, sans état) ; textes dans `src/server/messages.ts`. Réservation de chaque envoi en base + clé anti-doublon Resend ; échec noté (`status`, `attempts`, `last_error`), rejoué par `scheduled` dans `worker.ts` (cron `*/15 * * * *`).
- Routage des tests (AD-12) et journaux JSON sans donnée personnelle (adresse e-mail en empreinte, `src/server/journal.ts`).
- Îlot `src/islands/formulaires.ts` : vrai POST ; script Turnstile chargé au premier envoi seulement (AD-11) ; jeton neuf à chaque essai ; `?simuler=echec` supprimé ; états visuels inchangés. `envoyerSimule()` reste pour le diagnostic (10.4).
- Politique de confidentialité : sous-traitants complétés (Cloudflare Turnstile avec lien vers le « Turnstile Privacy Addendum », exigé par le mode invisible ; Resend, société américaine, envois depuis l'Irlande), à valider par Anne.
- Secrets posés par JB le 2026-10-07 : `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `BOITE_TEST` (capture de l'écran Variables and Secrets). Domaine `annevialtissot.fr` « Verified » dans Resend (capture de JB).
- Documentation : `site/README.md` (§ Formulaires réels, TODO(backend), écarts, commandes), `RUNBOOK.md` (§ 4 quater : secrets, e-mails, requête de contrôle, DMARC ; § 4 : passage en production), `.dev.vars.example`, `wrangler.jsonc` commenté.

## Ce qui est vérifié (2026-10-07, en local)
- `node scripts/e2e-formulaires.mjs` (serveur local `wrangler dev`, base locale, imitation de Turnstile et de Resend) : **25 constats sur 25** à 6 passages sur 7 ; un passage s'est arrêté avant la fin sur une erreur du script d'essai (serveur local), non reproduite aux trois passages suivants :
  - contact valide accepté ; renvoi du même envoi accepté sans second lead ; téléphone `06 12 34 56 78` écrit `+33612345678` ; lead marqué test ; campagne (`utm_source`) gardée ;
  - refus sans rien écrire : jeton absent ou refusé (`ANTI_ROBOT` 403), champ piège rempli (403), message manquant, téléphone faux, case de confidentialité non cochée, commune manquante, clé d'idempotence invalide (`CHAMP_INVALIDE` 400) ;
  - limite de fréquence : 5 envois acceptés, le 6e refusé (429) ;
  - guide sans téléphone : accepté, seule la notification à Anne est créée, séquence horodatée ;
  - e-mails : tous vers la boîte de test, objet `[TEST]`, notification au format Modelo avec « Répondre » vers le prospect, accusé de réception au prospect, une clé anti-doublon par e-mail (aucun doublon même quand le renvoi et l'envoi se croisent) ;
  - Resend en panne : le visiteur a sa confirmation, les deux envois sont notés `failed` ; la tâche planifiée les rejoue (`delivered`, 2 essais) ;
  - navigateur sur `/contact?utm_source=navigateur` : Turnstile non chargé à l'ouverture, chargé à l'envoi, confirmation affichée, lead écrit avec sa campagne (capture `.verif/e2e-formulaires-contact.png`). Le widget Turnstile lui-même ne se charge pas depuis l'environnement de Claude : il est remplacé par une imitation dans cet essai et sera essayé pour de vrai sur l'aperçu.
- `npm run build` : sans erreur. `npm run check` : 0 erreur (site et code serveur). `node scripts/liens.mjs` : 25 pages, 1479 liens, 0 cassé. `node scripts/e2e-diagnostic.mjs` : parcours complet, aucune erreur (le diagnostic reste simulé). `npm run verif` : aucune erreur console ; page Guide avec ses nouveaux textes (capture `.verif/guide-desktop.png`), autres pages inchangées.

## Ce qui est vérifié en ligne (2026-10-08, aperçu de la branche, par JB)
- Contact, estimation et guide envoyés depuis le vrai site avec le vrai widget Turnstile : confirmation affichée à chaque fois (captures de JB).
- E-mails reçus dans la boîte de test (`BOITE_TEST`), en boîte de réception et non en indésirables, expéditeur `anne@annevialtissot.fr` : accusés de réception du contact et de l'estimation, notifications à Anne du contact et du guide (captures de JB), téléphone remis au format `+33 6 45 27 85 84`, blocs prêts pour Modelo. Pour le guide, aucun e-mail au prospect, comme prévu jusqu'à la story 10.5.

## Ce qui reste
- Ligne DMARC à poser dans le DNS (`_dmarc`, `v=DMARC1; p=quarantine; adkim=r; aspf=r`), exigée par AD-8 avant le lancement (action JB).
- Anne : relire les deux e-mails automatiques et l'ordre des blocs de la fiche Modelo (`.verif/e2e-formulaires-emails.txt` donne un exemple de chaque) ; valider la politique de confidentialité.
- Boîte de réception pour `anne@annevialtissot.fr` (action J08) : pas nécessaire tant que les réponses vont à `avialtissot@gmail.com`.
