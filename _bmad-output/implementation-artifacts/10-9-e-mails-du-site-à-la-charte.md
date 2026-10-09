---
story: 10.9
epic: 10 — Capture des leads et backend
statut: in-progress
date: 2026-10-09
---

# Story 10.9 — E-mails du site à la charte

## Objectif
Les e-mails que le site envoie aux prospects au nom d'Anne (accusés de réception, guide, résumé du diagnostic, 6 e-mails de la séquence) ont l'allure du site, sur ordinateur comme sur téléphone, avec une version texte jointe ; la notification à Anne reste en texte brut pour Modelo (critères : `_bmad-output/planning-artifacts/epics.md`, story 10.9 ; AD-8).

## Décisions prises pendant la story
- **Un seul gabarit, des textes en petit Markdown** (`src/server/email-html.ts`) : chaque message est écrit une fois et rendu en deux versions, HTML et texte. Les textes d'Anne (`contenu-anne/guide/sequence-emails/`) sont mis en forme sans être réécrits.
- **Logo joint à l'e-mail** (`cid:logo`) plutôt qu'appelé depuis le site : l'aperçu est derrière Access (une image distante n'y serait pas visible), les messageries bloquent souvent les images distantes, et aucune image distante veut dire aucun pixel de suivi possible (AD-11).
- **Polices de secours** : Georgia pour les titres, Helvetica / Arial pour le texte. Gilda Display et Jost ne se chargent pas dans Gmail ni Outlook ; les appeler ferait aussi une requête vers un serveur. Le logo, lui, garde la vraie police (c'est une image).
- **Un lien seul sur sa ligne devient un bouton** terracotta (« Télécharger le guide », « Réserver un créneau », « Recevoir le guide »). Le message laissé par le prospect et le score du diagnostic passent dans un encadré bleu brume.
- **Désabonnement** : en petit sous la carte en HTML (« Ne plus recevoir ces e-mails »), phrase inchangée dans la version texte ; les en-têtes `List-Unsubscribe` restent.

## Ce qui est fait (en local, à fusionner après validation de la maquette)
- `src/server/email-html.ts` : `enTexte(md)` et `enHtml(md, habillage)`. Gabarit en tableaux, styles écrits sur chaque balise, fond écru, carte blanche de 600 px, titres en bleu Klein, signature d'Anne sous un filet terracotta, phrase d'aperçu cachée, adaptation au téléphone sous 620 px.
- `src/server/messages.ts` : accusés de réception (contact, estimation, FR et EN), guide, diagnostic (sorties A et B), envoi du guide et étapes de la séquence écrits en Markdown ; chaque `Message` porte `text` et `html`. `notifierAnne` inchangée. `sequence.ts` : `texteEtape` retirée (remplacée par le gabarit).
- `src/server/adapters/email.ts` : envoi à Resend de `html` et du logo en pièce jointe en ligne (`attachments`, `content_id: logo`) ; en test, bandeau gris « E-mail de test » en tête du HTML comme du texte. `delivery.ts` passe le HTML.
- `src/server/email-logo.png` (660 × 156, 6,5 Ko), refait par `node scripts/email-logo.mjs` depuis `design-system/assets/logo-horizontal.svg`.
- `scripts/maquette-emails.mjs` : fait partir les 12 e-mails sur le serveur local, vérifie leur forme et écrit `.verif/emails/` (HTML, texte, captures ordinateur et téléphone).
- Maquette publiée pour relecture : https://claude.ai/artifact/Qu5QB7bD9FijgoLgHBCEPW (les 12 e-mails, vue ordinateur, téléphone et version texte).

## Ce qui est vérifié (2026-10-09, en local)
- `node scripts/maquette-emails.mjs` : **tous les constats bons**, 12 e-mails sur 12 : HTML et texte présents, logo joint en `cid`, aucune image ni police chargée depuis un serveur, aucune marque Markdown ni « [Prénom] » restante, désabonnement dans le HTML, le texte et les en-têtes de la séquence, bouton « Télécharger le guide » avec son lien signé, aucun défilement horizontal sur téléphone (390 px).
- Captures dans `site/.verif/emails/` (non versionnées) : `contact`, `estimation`, `guide`, `diagnostic-a`, `diagnostic-b`, `guide-resultats`, `sequence-1` à `sequence-6`, chacune en `-ordinateur.png` et `-telephone.png`.
- `e2e-formulaires`, `e2e-diagnostic`, `e2e-guide`, `e2e-rendez-vous`, `e2e-gestion` : tous les constats bons après la refonte des messages.
- `npm run check` : 0 erreur.

## Ce qui reste
- **Validation de la maquette par JB et Anne** (critère de la story) ; retouches éventuelles.
- Après fusion : un vrai envoi sur l'aperçu vers une boîte de test, lu dans Gmail sur ordinateur et sur téléphone (Outlook et Apple Mail si un compte est disponible) ; captures citées ici.
