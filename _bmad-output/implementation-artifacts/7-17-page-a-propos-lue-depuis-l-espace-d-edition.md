---
story: 7.17
epic: 7 — Contenu d'Anne
statut: review
date: 2026-10-07
---

# Story 7.17 — Page À propos lue depuis l'espace d'édition

## Objectif
Retour de JB du 2026-10-07 : « cette PR [n° 21] ne s'est pas diffusée, je ne la vois pas sur le site ». La PR n° 21 (modification de la page À propos depuis l'espace d'édition) était bien fusionnée, mais la page `a-propos.astro` affichait un condensé du texte écrit en dur au moment de la maquette ; `contenu-anne/pages/a-propos/fr.md` n'était lu que pour la vidéo. Toute modification du texte dans l'espace d'édition restait donc invisible. Dette de la story 7.13 (le champ était proposé à l'édition sans être branché).

## Ce qui est fait
- `aPropos()` (`site/src/lib/contenu.ts`) lit le texte rendu de `fr.md` et le découpe selon ses titres : avant « # Ma méthode… » la colonne Qui suis-je ? (un bloc par « ## ») ; « # Ma méthode : sous-titre » et son introduction ; « ## Les trois piliers » (un pilier par paragraphe « **Nom :** texte ») ; « ## Concrètement… » (un point par « ### 1. Titre », une liste « Nom (précision) » devient la grille des partenaires) ; tout autre « ## » devient un rang simple. Les commentaires et les tableaux vides laissés par l'éditeur ne s'affichent pas.
- `a-propos.astro` : textes figés retirés (parcours, constat, paragraphe méthode, piliers, points concrets, partenaires, engagement) ; le sous-titre de l'espace d'édition remplace la phrase d'en-tête quand il existe. Restent dans le gabarit : refrain, ligne des langues, profils « Cible » (point ouvert 1), boutons.
- `config.yml` : aide du champ « Texte » qui explique les titres à garder.
- Documents : `site/README.md`, epics, statut de sprint ; story 7.16 passée en « done » (PR n° 22 fusionnée le 2026-10-07).

## Vérification
- `npm run build` : la page contient le nouveau texte de JB (« Master 2 », « Le constat … », « Gestionnaire de patrimoine », trois points concrets) et plus l'ancien (« Anticipation des obstacles », « J'ai appliqué ce que je savais faire ») ; pas de tableau vide.
- `npm run check` : 0 erreur ; `scripts/liens.mjs` : 25 pages, 1478 liens, 0 cassé.
- `npm run verif` : aucune erreur console ; captures ordinateur et téléphone relues ; `scripts/ecrans.mjs` : aucun débordement.

## Ce qui reste
- JB : relire la page sur l'aperçu après fusion. Le texte du constat est plus long que la maquette : la colonne de gauche (portrait) reste collante, ce qui tient.
