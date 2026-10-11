---
story: 8.16
epic: 8 — Structure et visuel
statut: in-progress
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
- (en cours)

## Ce qui reste
- Tout ce qui précède.
