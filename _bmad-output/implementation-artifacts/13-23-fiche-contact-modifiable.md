---
story: 13.23
epic: 13 — Espace de travail d'Anne
statut: ready-for-dev
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.23 — Fiche contact modifiable, note libre, export et effacement

## Objectif
Deuxième point bloquant de l'audit 13.21 (décision de JB du 2026-10-24). La fiche d'un contact (`espace/src/pages/contacts/fiche.astro`) n'a aucun champ modifiable hormis l'action marketing : un prénom mal tapé, un numéro qui change, une commune oubliée, une note après un appel ne peuvent pas être corrigés ; il n'y a pas de suppression. Et l'export ou l'effacement RGPD ne passent que par « Demandes du site », par adresse e-mail : un contact de boîtage avec seulement un téléphone n'a aucun chemin (spec CAP-12, RGPD : « l'export et l'effacement couvrent les notes, l'historique et les contacts saisis à la main ou importés »). La fiche d'un prescripteur (`prescripteurs/fiche.astro`) a déjà tout cela : même modèle.

## Ce qu'il faut
- Bloc **Coordonnées** modifiable sur la fiche : prénom, nom, téléphone, e-mail, commune, parcours (vendeur / acheteur / je ne sais pas), canal et précision d'origine, passage de boîtage ou prescripteur. Téléphone normalisé en +33 comme à l'ajout ; si le nouveau numéro ou e-mail appartient déjà à un autre contact, refuser avec le lien vers cette fiche (jamais de doublon, jamais de fusion silencieuse).
- **Note libre** horodatée, ajoutée depuis la fiche en un geste, rangée dans l'historique (type `note`, source `anne`), reprise comme « dernier texte » sur « Aujourd'hui ».
- **Export** (fichier JSON de la personne : contact, historique, demandes du site liées) et **effacement** depuis la fiche, par identifiant du contact, avec le même journal des droits que `/gestion` (table des droits exercés, `rights.ts`) ; l'effacement anonymise ou supprime contact, historique, demandes liées et numéros Leedflow rattachés. Le lien actuel vers « Demandes du site » disparaît de la fiche.
- Chaque modification de coordonnées est notée dans l'historique (« Téléphone changé », sans l'ancienne valeur).
- Téléphone d'abord ; la fiche reste lisible sans ouvrir le bloc de modification (modification repliée par défaut).

## Vérification attendue
- `e2e-espace.mjs` : correction d'un prénom et d'un numéro ; refus d'un numéro déjà pris avec lien ; note libre visible sur la fiche et sur « Aujourd'hui » ; export d'un contact sans e-mail ; effacement d'un contact sans e-mail (plus rien dans `contact`, `contact_evenement`, droits journalisés) ; le site lit toujours ses demandes.
- Captures, `npm run build`, `npm run check` dans `espace/`.

## Ce qui reste
- À construire (fil « [Site] Espace de travail d'Anne »), après la 13.22. Audit : https://claude.ai/artifact/87DydmbEHytFNxEk6FRkPy.
