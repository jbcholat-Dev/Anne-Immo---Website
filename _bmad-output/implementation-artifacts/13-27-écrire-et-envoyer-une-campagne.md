---
story: 13.27
epic: 13 — Espace de travail d'Anne
statut: ready-for-dev
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.27 — Écrire et envoyer une campagne e-mail

## Objectif
Anne envoie elle-même une campagne e-mail à une partie de ses contacts, depuis l'espace, sans exporter de liste (décision de JB du 2026-10-24, AD-21). Modelo est écarté (limitations), comme un outil externe (Brevo) ou les campagnes de Resend (liste stockée chez Resend). Dépend de 13.26.

## Ce qu'il faut
- Nouvel onglet **Campagnes** : liste des campagnes (brouillon, en cours d'envoi, envoyée) et bouton « Nouvelle campagne ».
- **Écrire** : objet, texte (paragraphes et liens simples), une photo facultative, un bouton (libellé + lien vers une page du site, diagnostic par exemple). Gabarit à la charte, celui des e-mails du site (`site/src/server/email-html.ts`), version texte jointe. Chaque lien vers le site reçoit des paramètres de campagne (UTM, AD-11) au nom de la campagne.
- **Choisir à qui** : filtres parcours (vendeur, acheteur), étape, commune, canal d'origine, prescripteurs. L'espace affiche le compte : « N recevront, M écartés », et le détail des écartés par raison (`peutRecevoirCampagne`, story 13.26). Un contact sans accord n'est jamais ajouté, même à la main.
- **Essai** : envoi à l'adresse de l'utilisateur connecté, objet préfixé [ESSAI].
- **Envoyer** : confirmation dans la page (nombre de destinataires). La liste est figée à l'envoi (table des destinataires de la campagne) ; un Cron de l'espace envoie par paquets (50 par heure au départ, réglable), dans la limite du quota Resend du jour, en laissant passer d'abord les e-mails du site. Clé d'idempotence par destinataire (AD-4) : jamais deux fois le même e-mail.
- **Expéditeur** : sous-domaine d'envoi dédié (proposé `nouvelles.annevialtissot.fr`, à poser dans Resend et Cloudflare par JB, notice dans le RUNBOOK), nom « Anne Vial-Tissot », réponses vers la Gmail d'Anne.
- **Désinscription** : lien signé dans chaque e-mail et en-têtes `List-Unsubscribe` / `List-Unsubscribe-Post` (même mécanisme que la séquence, `/desabonnement`) ; écrit `email_desinscrit_le` sur le contact. Mentions : nom d'Anne, adresse professionnelle, pourquoi la personne reçoit ce message.
- **Trace** : chaque fiche destinataire reçoit l'événement « Campagne … reçue le … » (type `email`, source `anne`) ; un e-mail refusé par la messagerie est noté.
- En mode test (aperçu), tous les envois vont à `BOITE_TEST` comme le reste du site.

## Vérification attendue
- `e2e-espace.mjs` : campagne d'essai sur des contacts d'essai ; écartés justifiés ; essai reçu ; envoi par paquets avec le service imité (`URL_SERVICES_ESSAI`) ; pas de double envoi si le Cron repasse ; désinscription par le lien et par l'en-tête ; trace sur les fiches.
- `node scripts/maquette-emails.mjs` étendu ou équivalent : rendu de l'e-mail de campagne capturé (ordinateur et téléphone).
- `npm run build`, `npm run check` dans `espace/` et `site/` ; captures de l'onglet.

## Ce qui reste
- Action de JB : sous-domaine d'envoi dans Resend + lignes DNS dans Cloudflare (15 min), au début de la story.
- Vérifier l'offre Resend avant une première campagne de plus de 100 destinataires (offre gratuite : 100 e-mails par jour, 3 000 par mois, partagés avec le site).
