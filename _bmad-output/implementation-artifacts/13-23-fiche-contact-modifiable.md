---
story: 13.23
epic: 13 — Espace de travail d'Anne
statut: done
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

## Ce qui est fait (2026-10-24)
- Fiche (`espace/src/pages/contacts/fiche.astro`), bloc Coordonnées : « Modifier les coordonnées et l'origine », replié par défaut. On peut y corriger :
  - prénom, nom, téléphone, e-mail, commune ;
  - le parcours (vendre, acheter, je ne sais pas encore) ;
  - l'origine et sa précision, avec le passage de boîtage ou le prescripteur, demandés selon l'origine.
- Le téléphone est rangé en +33 comme à l'ajout.
- `modifierCoordonnees` (`espace/src/server/pipeline.ts`) refuse un téléphone ou un e-mail déjà porté par un autre contact et donne le lien « Ouvrir sa fiche » ; rien n'est changé. L'historique note les champs changés (« Coordonnées modifiées : prénom, téléphone »), sans les anciennes valeurs. Un nouveau numéro récupère aussitôt les appels déjà relevés par Leedflow (`rattacherInconnus`).
- Note libre en un geste sous la prochaine action (`ajouterNote`, type `note`, source `anne`). Elle devient le « dernier texte » sur « Aujourd'hui » ; une correction de coordonnées ne le devient pas.
- « Données de cette personne » sur la fiche :
  - « Télécharger ses données » (`/api/contacts/export`, `exporterContact`) : contact, historique, tâches Leedflow, demandes du site et leurs envois ;
  - « Effacer ce contact » (taper EFFACER, `effacerContact`) : contact, historique, demandes liées et envois, tâches et liens Leedflow, numéro relevé ou classé par Leedflow ;
  - les deux sont notés dans `droit_exerce` comme depuis `/gestion`. L'empreinte est celle de l'e-mail, à défaut du téléphone, à défaut de l'identifiant.
- `site/src/server/rights.ts` : les deux nouvelles fonctions partagent avec l'export par adresse la mise en forme des demandes et des fiches (`demandeLisible`, `fichesLisibles`).
- Le renvoi « Export et effacement : depuis les demandes, par son adresse e-mail » a disparu de la fiche.
- Écart : pas de suppression simple distincte de l'effacement. Effacer un contact est la suppression, et elle est journalisée comme un droit exercé ; un doublon se corrige en effaçant l'un des deux.

## Ce qui est vérifié (2026-10-24)
- `node scripts/e2e-espace.mjs` : **220 vérifications, toutes bonnes**. Les nouvelles :
  - modification repliée par défaut, note, export et effacement présents, plus de renvoi vers les demandes ;
  - prénom, numéro (rangé en +33) et commune corrigés, historique sans l'ancien numéro ;
  - numéro d'un autre contact refusé, avec le lien vers sa fiche ;
  - Boîtage sans passage refusé ;
  - note libre visible sur « Aujourd'hui » ;
  - export d'un contact sans e-mail, noté au journal ;
  - effacement sans « EFFACER » refusé ;
  - effacement d'un contact sans e-mail : fiche, historique et numéro classé effacés, noté au journal ;
  - `/gestion` toujours lisible ;
  - dans le navigateur, « Modifier » ouvre le formulaire et l'origine Boîtage montre le choix du passage.
- `node scripts/e2e-gestion.mjs` (site) : 44 vérifications, toutes bonnes (export et effacement par adresse inchangés).
- `npm run build` et `npm run check` dans `espace/` et `site/` : 0 erreur. Captures `espace/.verif/espace-fiche-modifier-{ordinateur,telephone}.png`.

## Ce qui reste
- Fusion par JB, puis essai sur l'espace en ligne.
