---
story: 8.14
epic: 8 — Site : finitions
statut: review
date: 2026-10-10
origine: choix de JB du 2026-10-10 dans le fil Structure et visuel, après les essais « Verre du lac » (PR #76) et « Magazine et matière » (PR #79) — « des deux propositions, le seul truc qu'on veut garder, c'est la navbar et la partie portrait dans l'accueil »
décision: D-42
---

# Story 8.14 — Barre en verre et portrait de magazine

## Objectif
Faire passer sur le site les deux seuls éléments que JB retient des essais de concept : la barre de navigation en verre (version de l'essai « Magazine et matière », plus couvrante que celle de l'essai « Verre du lac ») et le bloc « Anne » de l'accueil en portrait de magazine. Le reste des deux essais n'est pas repris.

## Ce qui est fait
- **Barre de navigation** (`site/src/components/Nav.astro`), sur toutes les pages :
  - gélule de verre dépoli clair qui flotte à 14 px du haut et 24 px des bords (10 et 12 px sur téléphone, 10 px du haut une fois réduite) ;
  - fumée sur la vidéo d'accueil ;
  - menu « À propos » plein, aux coins arrondis, avec un pont de survol entre la barre et le menu ;
  - replis pleins si « réduire la transparence » est demandé ou si le navigateur ne sait pas flouter.
- **Pages intérieures** : la marge du haut prend l'écart de la barre (`global.css`, `.page-int`). La barre des ancres d'À propos se cale sous la barre en verre, et les ancres d'À propos et de Vendre s'arrêtent sous la barre.
- **Portrait de l'accueil** (`site/src/components/accueil/Anne.astro`) :
  - sur-titre « Portrait » sur un filet ;
  - photo tirée sur papier, penchée de 1,5° ;
  - langues écrites à la main sous la photo ; la ligne imprimée reste lisible par les lecteurs d'écran ;
  - lettrine terracotta, lien fléché « En savoir plus ».
- **Police Caveat** (écriture à la main, OFL) : `public/fonts/caveat-500-majuscules.woff2`, réduite aux majuscules et à « · » (24 Ko au lieu de 51 Ko), déclarée dans `global.css` (`--avt-font-main`).
- Décision D-42 dans `DECISIONS.md`, story 8.14 dans `epics.md` et le statut de sprint, README (polices, écarts assumés).

## Vérification (2026-10-10)
- `npm run build` : sans erreur. `npm run check` : 0 erreur.
- `node scripts/liens.mjs` : 26 pages, 1 659 liens, 0 cassé.
- `node scripts/ecrans.mjs` : aucun débordement ni bouton trop petit.
- `npm run verif` : captures régénérées, aucune erreur console.
- Relues une à une à 1 440 et 390 px :
  - accueil : barre fumée sur la vidéo, portrait, barre sur le bandeau bleu de fin ;
  - À propos : barre des ancres, menu déroulant.

## Ce qui reste
- JB valide sur l'aperçu, puis fusionne.
- `design-system/` : ajouter la barre en verre aux composants de la charte (carte « navigation »), à faire avec la prochaine mise à jour de la charte.
- Les deux PR d'essai (#76, #79) restent en brouillon comme archive des concepts ; à fermer quand JB le souhaite.
