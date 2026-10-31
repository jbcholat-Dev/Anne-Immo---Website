---
story: 10.16
epic: 10 — Capture des leads et backend
statut: review
date: 2026-10-31
---

# Story 10.16 — Téléphone de nouveau obligatoire dans le diagnostic

## Objectif
Le 31 octobre 2026, JB demande de repasser le téléphone en obligatoire à la fin du diagnostic : « capter les emails ne permettra pas d'activer le Gmail ». Un e-mail seul ne permet pas à Anne de qualifier le contact. La story 10.15 l'avait rendu facultatif la veille. Le reste de la story 10.15 ne change pas : prénom et e-mail avant la question 1, pas de nom de famille. JB a autorisé la fusion de ce qui touche à cette page, une fois la revue faite et la construction au vert.

## Ce qui est fait
- **Écran final** (`site/src/islands/diagnostic.ts`) :
  - le champ « Téléphone » est obligatoire ;
  - vide, il affiche « Indiquez votre téléphone. » ; mal saisi, « Dix chiffres attendus. » ;
  - son aide devient « Votre rapport arrive par e-mail. Votre téléphone permet à Anne de vous rappeler pour en parler. »
- **Page /diagnostic** : même phrase sous le bouton, à la place de « Le téléphone, seulement si vous souhaitez qu'Anne vous appelle. »
- **Serveur** (`site/src/server/schema.ts`) : un diagnostic sans téléphone est refusé (`telephone`) ; le nom reste facultatif.
- **Gardé de la story 10.15** :
  - l'action « Écrire pour qualifier (pas de téléphone) » et le classement des contacts sans téléphone après les autres, qui servent encore aux contacts du guide et à ceux arrivés le 30 octobre ;
  - le passage à « Rappeler pour qualifier » dès qu'un tel contact laisse un numéro ;
  - le comptage et le Bilan.
- **Documents** :
  - `site/README.md` ;
  - le spine d'architecture, où l'écart à AD-6 se réduit au nom facultatif ;
  - `.memlog.md` ;
  - epics et statut de sprint.

## Lecture des chiffres
- Du 30 octobre (vers 14 h) au 31 octobre, le téléphone était facultatif.
- La question 1 et la question 2 gardent leur sens de la story 10.15 : coordonnées données à l'écran d'entrée (prénom, e-mail), puis questions.
- Ce qui peut changer, c'est la part des visiteurs qui envoient à la fin. Elle ne se compare pas d'une période à l'autre.

## Vérifié (2026-10-31)
- `npm run check` (site) : 0 erreur ; `npm run build` : construit.
- `node scripts/e2e-diagnostic.mjs` : tous les constats sont bons, dont :
  - téléphone vide refusé dans la page (parcours A, B, R) ;
  - diagnostic sans téléphone refusé par le serveur ;
  - sans nom accepté ;
  - contact « à qualifier par e-mail » qui laisse un numéro : de nouveau « à rappeler » ;
  - ligne sous le bouton.

## Revue de code
2026-10-31, `bmad-code-review` dans une session neuve, PR #220, commit 5c2ef40 relu. Page et serveur d'accord, test de bout en bout correct, rien de bloquant :
1. (mineur) Libellé « Envoi (téléphone facultatif depuis le 30 octobre) » du Bilan périmé : corrigé (commit suivant), « du 30 au 31 octobre ».
2. (mineur) Commentaire de `contacts.ts` disant que le diagnostic n'exige plus le téléphone : corrigé (commit suivant).
3. (très mineur) Critère de la story 10.9 dans epics.md muet sur le nom du diagnostic : écarté, la story 10.15 le dit déjà et le README le liste dans les écarts assumés.

## Reste
- Revue, PR, fusion, vérification en ligne.
- Prévenir les fils Campagne et Stratégie.
