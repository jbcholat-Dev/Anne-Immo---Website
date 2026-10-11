---
story: 8.16
epic: 8 — Structure et visuel
statut: review
date: 2026-10-11
---

# Story 8.16 — Couverture du guide PDF au terracotta unique

## Objectif
Suite de la story 8.12 (décision D-40, un seul terracotta, le « terracotta profond » #A34E30). La couverture du guide PDF envoyé aux visiteurs garde l'ancien terracotta #C4623E, codé en dur dans `site/scripts/guide-pdf.mjs`. Ce fichier était aussi modifié par la PR n° 80 (lancement) ; le changement attendait sa fusion, faite le 2026-10-11.

## À faire
- Passer #C4623E en #A34E30 dans `site/scripts/guide-pdf.mjs`, puis refaire `site/prive/guide.pdf` avec `node scripts/guide-pdf.mjs`.
- Vérifier le PDF (couverture) et la construction.
- Montrer à Anne le bouton noir « Estimation offerte » sur la vidéo sombre de l'ouverture, qui contraste peu (retour de la story 8.12) ; décider avec elle s'il faut un autre traitement.

## Ce qui est fait
- L'ancien terracotta #C4623E restait aussi dans le rapport PDF du diagnostic et dans les e-mails aux prospects : les trois passent au terracotta profond #A34E30 (`scripts/guide-pdf.mjs`, `scripts/rapport-gabarit.mjs`, `src/server/email-html.ts`). Plus aucune trace de #C4623E dans `site/`.
- Refaits avec les outils du dépôt : `prive/guide.pdf` et `public/img/guide-couverture.jpg` (`node scripts/guide-pdf.mjs`), `prive/rapport/gabarit.pdf` et `src/server/rapport-gabarit.json` (`node scripts/rapport-gabarit.mjs`), `src/server/email-logo.png` (`node scripts/email-logo.mjs`, le logo de la charte ayant été recoloré par la story 8.12).

## Ce qui est vérifié (2026-10-11)
- Première page du guide et du rapport relues en image : filet terracotta profond.
- `npm run build` OK ; `npm run check` : 0 erreur ; liens : 26 pages, 1 659 liens, 0 cassé.

## Ce qui reste
- Accord de JB et fusion de la PR.
- Montrer à Anne le bouton noir « Estimation offerte » sur la vidéo sombre de l'ouverture, qui contraste peu.
