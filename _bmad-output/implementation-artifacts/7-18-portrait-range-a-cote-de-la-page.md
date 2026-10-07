---
story: 7.18
epic: 7 — Contenu d'Anne
statut: review
date: 2026-10-07
---

# Story 7.18 — Portrait rangé à côté de la page

## Objectif
Retour de JB du 2026-10-07 au soir : « J'ai ajouté la photo de profil dans À propos. J'ai accepté la PR, mais visiblement, ça ne se met pas à jour. »

## Cause
Deux causes indépendantes :
1. Le même soir, les commandes de mise en ligne Cloudflare avaient été changées pour des scripts qui n'existent que sur la branche du back-end : les constructions de `main` échouaient (traité par le fil Back-end, JB a remis les commandes d'origine).
2. Story 7.16 : l'espace d'édition a rangé la photo à côté de la page (`contenu-anne/pages/a-propos/jyhell-2023-104.webp`, champ `portrait: jyhell-2023-104.webp`, PR n° 27), alors que le site ne la cherchait que dans `contenu-anne/photos/`. Mon essai de la 7.16 avait été fait à la main avec un chemin `photos/…`, pas avec un vrai envoi depuis l'outil. Même avec la construction réparée, le bloc réservé serait resté.

## Ce qui est fait
- `site/scripts/images.mjs` : dérive aussi les photos posées dans `contenu-anne/pages/<page>/` (clé `pages/<page>/<nom>`).
- `portraitAnne()` (`site/src/lib/contenu.ts`) : un nom seul vise le dossier de la page, puis `contenu-anne/photos/` ; un chemin `photos/…` vise `contenu-anne/photos/`.
- Formats web du portrait (2133×3200 à l'origine) : `site/public/img/pages/a-propos/` et `src/data/images.json`.
- Documents : `site/README.md`, `contenu-anne/portrait/README.md`, story 7.16 (correctif), epics, statut de sprint ; 7.17 passée en « done » (PR n° 23 fusionnée).

## Vérification
- `npm run build` : `a-propos.html`, `index.html` et `diagnostic.html` référencent `img/pages/a-propos/jyhell-2023-104-*`.
- `npm run check` : 0 erreur ; `scripts/liens.mjs` : 25 pages, 1478 liens, 0 cassé ; `npm run verif` : aucune erreur console.
- Capture ordinateur prise après chargement : le portrait occupe le cadre (la capture pleine page de `verif` le montre vide sur ordinateur parce que l'image se charge à l'approche, pas un défaut) ; capture téléphone : portrait affiché.

## Ce qui reste
- JB : fusionner, vérifier que la construction de `main` passe, puis regarder À propos, l'accueil et le diagnostic.
