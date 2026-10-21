---
story: 13.4
epic: 13 — Espace de travail d'Anne
statut: review
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.4 — Contacts, origine précise et étapes

## Objectif
Qu'une personne soit **un seul contact** dans la base, quel que soit le nombre de demandes qu'elle fait, avec son origine précise (canal, passage de boîtage, prescripteur), un parcours, une étape, une prochaine action datée et un historique (CAP-12 v7, AD-20, maquette v2 de la story 13.12). C'est le socle de toutes les pages de l'espace v2 : Aujourd'hui (13.5), Qualifier (13.6), Ajouter (13.7), Bilan (13.13), Prescripteurs (13.14), Acheteurs (13.15).

## Ce qui est fait (2026-10-21)
- **Migration `site/migrations/0007-contacts.sql`** (appliquée par la construction du site, AD-10) :
  - `contact` : une ligne par personne ; parcours vendeur ou acheteur (ou pas encore connu) ; 14 étapes (vendeur, acheteur, `en_sommeil`, `perdu`) ; prochaine action et sa date ; date de réveil ; motif de perte ; origine précise (`canal` parmi boîtage, recommandation, événement, site, portail, réseaux, rencontre, autre ; `origine_detail` ; `passage_id` ; `prescripteur_id`) ; réponses de qualification en JSON et date ; `rappel_individuel_seul`.
  - **La règle d'AD-20 est tenue par la base elle-même** : un contact actif ne peut pas être enregistré sans prochaine action datée, En sommeil exige une date de réveil, Perdu exige un motif. Un contact a au moins un téléphone, un e-mail ou un nom.
  - Unicité : un même téléphone E.164 ou un même e-mail ne peut appartenir qu'à un contact.
  - `contact_evenement` : l'historique (création, demande, note, étape, qualification, appel, e-mail), idempotent par `(source, source_id)`.
  - `passage_boitage` (secteur, date, nombre de mots) et `prescripteur` (nom, rôle, commune, relances), utilisés par les stories 13.7 et 13.14.
  - `lead.contact_id` : chaque demande du site pointe vers son contact.
- **Rattachement** (`site/src/server/contacts.ts`, seule écriture du site dans ces tables, comme le veut AD-20) : juste après l'écriture d'une demande (formulaires, diagnostic, guide, webhook Cal.com), en arrière-plan ; un échec ne fait jamais échouer l'envoi du visiteur (AD-4). Même téléphone ou même e-mail (casse ignorée) = même contact, le téléphone l'emportant ; sinon un contact « À qualifier » est créé, canal `site`, détail = le formulaire, action « Rappeler pour qualifier » datée de l'arrivée. Une demande d'un contact en sommeil ou perdu le remet « À qualifier » le jour même, avec une ligne d'historique.
- **Filet** : la tâche planifiée du site (toutes les 15 minutes) rattache les demandes restées sans contact, 50 par passage. **Les demandes existantes en production seront donc rangées sur leurs contacts dans l'heure qui suit la mise en ligne**, sans action de personne.
- **RGPD** (AD-16, AD-18) : l'export d'une adresse comprend ses contacts, leur historique et un éventuel prescripteur ; l'effacement supprime aussi le contact et son historique, et les demandes rattachées à ce contact même sous une autre adresse ; la purge à 3 ans supprime aussi les contacts et prescripteurs sans activité depuis 3 ans.
- Rien ne change encore à l'écran : les pages de l'espace qui lisent les contacts arrivent avec 13.7, 13.6 et 13.5.

## Ce qui est vérifié (2026-10-21)
- `site` : `npx tsc --noEmit` et `npm run check` sans erreur (0 erreur, 0 avertissement) ; `npm run build` réussi ; `npm run base:local` : migration 0007 appliquée sur la base locale ; `node scripts/liens.mjs` : 1863 liens, 0 cassé.
- `espace` : `npm run build` réussi ; `node scripts/e2e-espace.mjs` : **tous les constats bons**, dont les 7 nouveaux : contact créé « à qualifier » avec origine site · guide et prochaine action ; demande notée une fois dans l'historique ; deuxième demande de la même adresse (en majuscules) rangée sur le même contact ; la base refuse un contact actif sans prochaine action, un sommeil sans réveil, une perte sans motif ; un contact en sommeil revient « à qualifier » ; une demande sans contact est rattachée par la tâche planifiée ; export avec le contact et son historique ; effacement du contact et de son historique.
- Essais de bout en bout du site, tous les constats bons : `e2e-gestion` (avec un nouveau constat : purge d'un contact de plus de 3 ans, contact récent gardé), `e2e-guide`, `e2e-rendez-vous`, `e2e-diagnostic`.

## Ce qui reste
- JB : fusionner la PR de code. **La fusion modifie la base de production** : ajout de tables et d'une colonne, rien de supprimé ni de modifié dans les demandes existantes.
- Après la fusion : constater dans la base que les demandes existantes ont toutes un contact.
- Suite de l'epic, dans l'ordre : 13.7, 13.6, 13.5, 13.13, 13.14, 13.15, 13.16.
