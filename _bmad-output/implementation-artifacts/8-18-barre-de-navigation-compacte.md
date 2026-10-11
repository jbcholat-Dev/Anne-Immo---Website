---
story: 8.18
epic: 8 — Site : finitions
statut: done
date: 2026-10-11
origine: ticket n° 116 de JB (« Un retour ? », écran de 1 920 px, 2026-10-11) — « on a des choses tout à droite, des choses tout à gauche et un grand vide au milieu » ; essai sur la branche claude/essai-barre-compacte, validé par JB le 2026-10-11
décision: D-44
---

# Story 8.18 — Barre de navigation compacte

## Objectif
Sur un grand écran, la barre en verre (D-42) traversait tout l'écran avec un grand vide au milieu. La ramasser au centre, à la largeur de son contenu.

## Ce qui est fait
- `site/src/components/Nav.astro`, sur ordinateur (900 px et plus) :
  - gélule centrée (`left: 50%`, `translateX(-50%)`, `width: max-content`), 640 px de large à 1 920 px, 592 px à 1 000 px ;
  - ordre : symbole · filet · Accueil · À propos ▾ · Réalisations · Vendre · Acheter · filet · FR EN · Contact ;
  - Contact en pastille bleue Klein (brun au survol), liseré clair quand on est sur la page Contact ;
  - icônes des réseaux retirées de la barre (restent dans le pied de page et le menu du téléphone) ;
  - même comportement réduit au défilement et même fumée sur la vidéo d'accueil.
- Téléphone : inchangé (symbole + bouton menu).
- D-44 dans `DECISIONS.md`, story 8.18 dans `epics.md` et le statut de sprint, `site/README.md` (navigation, écarts assumés).

## Vérification (2026-10-11)
- `npm run build` : sans erreur. `npm run check` : 0 erreur.
- `node scripts/liens.mjs` : 26 pages, 1 515 liens, 0 cassé.
- `node scripts/ecrans.mjs` : aucun débordement ni bouton trop petit.
- Captures à 1 920, 1 440, 1 000 et 390 px (haut de page, après défilement, menu « À propos ») : `/mnt/project-files/notation/barre-compacte-2026-10-11/`.
- Aperçu de la branche relu par JB (« c'est vraiment pas mal »).

## Ce qui reste
- `design-system/` : ajouter la barre compacte au composant « navigation », avec D-42.
- Ticket n° 116 à fermer en citant le commit de fusion.
