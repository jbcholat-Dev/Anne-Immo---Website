---
story: 13.17
epic: 13 — Espace de travail d'Anne
statut: backlog
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.17 — Journal des actions marketing et coût par contact

## Objectif
Savoir combien coûte un contact, un rendez-vous et un mandat, canal par canal, pour décider où mettre l'argent et le temps. Demande de JB du 2026-10-21 : « logger les actions marketing/prospection avec les canaux et les coûts associés, puis faire le lien avec les contacts générés ». JB veut aussi que les campagnes préparées dans le projet Claude soient créées directement dans l'espace par Claude, sans ressaisie par Anne. Cadrage validé par JB le même jour.

## Ce qui est à faire
- **Une action marketing** : nom (« Flyers Margencel », « Pub Facebook mars »), canal (les 8 canaux existants de CAP-12 v7 : boîtage, recommandation, événement, site, portail, réseaux, rencontre, autre), date de début, date de fin (facultative), budget prévu, coût réel (en euros), note, auteur (Anne ou Claude).
- **Les passages de boîtage** (`passage_boitage`, story 13.7) deviennent des actions du canal boîtage : un passage reçoit un coût, sans changer la saisie actuelle.
- **Rattachement des contacts** : à l'arrivée d'un contact, s'il y a exactement une action en cours de son canal à cette date, il y est rattaché d'office ; sinon Anne choisit l'action dans une liste à la qualification (ou « aucune »). Elle peut corriger le rattachement sur la fiche.
- **Écrans** : une page « Actions » dans l'espace (liste, ajout, modification, suppression), le rattachement sur la fiche du contact et dans « Qualifier ».
- **Bilan du lundi** (story 13.13) : coût par canal sur la période, puis coût par contact, par rendez-vous et par mandat ; un tableau par action (contacts, rendez-vous, mandats, coût par contact).
- **Accès Claude** : une adresse privée `/api/claude/…` de l'espace, ouverte seulement à un jeton de service Cloudflare Access (un badge réservé à un programme, distinct de la connexion d'Anne). Elle permet de créer et de modifier des actions et de lire les totaux du bilan par action, **sans jamais lire un contact ni ses coordonnées**. Une action créée par Claude porte « créée par Claude » ; Anne peut la modifier ou la supprimer. Le même accès servira au relevé de la story 13.18.
- Migration dans `site/migrations/` (table des actions, lien contact → action, coût du passage), droits RGPD et purge à revoir (une action n'est pas une donnée personnelle ; le lien suit le contact).

## Choix faits (recommandation acceptée par JB le 2026-10-21)
- Seuls les euros sont comptés en v1, pas le temps passé par Anne. Perte assumée : une action gratuite mais longue (un salon) paraît moins chère qu'elle n'est. Un champ « heures » pourra venir plus tard.
- Les offres temporaires de l'epic 14 seront des actions comme les autres le jour où elles existeront.

## Ce que JB devra faire (une fois la story construite)
1. Créer le jeton de service dans Cloudflare Zero Trust et l'autoriser sur l'application Access de l'espace pour `/api/claude/*` seulement (5 min, pas-à-pas fourni).
2. Coller ses deux valeurs (identifiant et secret) dans les réglages de l'environnement cloud « Anne Immo » (3 min). Jamais dans le dépôt.
3. Ajouter `espace.annevialtissot.fr` à la liste des adresses autorisées de cet environnement (2 min).

## Ce qui est vérifié
Rien encore (story à construire).

## Ce qui reste
- Tout : construction, essai de bout en bout, captures.
