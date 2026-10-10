---
story: 8.15
epic: 8 — Structure et visuel
statut: review
date: 2026-10-10
---

# Story 8.15 — À propos : étapes 01 à 03 en parcours

## Objectif
Demande de JB du 2026-10-10 (20 h 46), capture à l'appui : la partie « Concrètement » (01 Audit, 02 Coordination, 03 Accompagnement) est mal mise en page. Les cadres des partenaires ne sont pas de la même taille, et deux grands vides restent sur les côtés. JB veut les numéros à côté des titres, éventuellement des flèches ou un déroulé qui mène d'une étape à l'autre, et trois propositions.

## Ce qui est fait
- Trois versions construites et capturées (ordinateur et téléphone), dans `/mnt/project-files/tickets/etapes-propositions/` :
  - frise : trois colonnes reliées par une ligne fléchée ;
  - flèches : grands numéros et petite flèche entre les colonnes ;
  - parcours : étapes l'une sous l'autre, sur toute la largeur.
- Choix de JB sur la carte de décision : **Parcours** (décision D-43 dans `maquettes/lot-3-complet/DECISIONS.md`).
- `site/src/pages/a-propos.astro` :
  - chaque étape a un rond bleu Klein numéroté à côté de son titre ; le titre est à gauche, le texte à droite ;
  - une ligne terracotta fléchée relie les étapes ;
  - les six partenaires de l'étape 02 forment une liste simple à filets sur deux colonnes, sans cartes ;
  - sur téléphone, le texte passe sous le titre, la ligne reste à gauche et la liste tient sur une colonne ;
  - le numéro est masqué aux lecteurs d'écran et remplacé par « Étape 01 : » dans le titre ;
  - les deux versions non retenues et les anciens styles des cartes partenaires sont retirés.
- Le texte d'Anne et son découpage (`site/src/lib/contenu.ts`) ne changent pas.
- Écart noté dans `site/README.md` (entrée « À propos, Ma méthode »).

## Ce qui est vérifié (2026-10-10)
- `npm run build` : réussi. `npm run check` : 0 erreur, 0 avertissement.
- `node scripts/liens.mjs` : 26 pages, 1 661 liens, 0 cassé.
- `node scripts/ecrans.mjs` : aucun débordement ni bouton trop petit signalé.
- Captures de la partie à 1 440, 1 024 et 390 px : `/mnt/project-files/tickets/etapes-propositions/final-d.png`, `final-t.png`, `final-m.png`.

## Ce qui reste
- Accord de JB et fusion de la PR n° 96, qui porte aussi la story 8.12.
