---
type: essai de concept (branche claude/concept-magazine-matiere, ne pas fusionner tel quel)
epic: 8 — Site : finitions
date: 2026-10-10
demande: JB, fil Structure et visuel (« OK, lance la branche magazine + matière »), après les propositions du 2026-10-10
---

# Concept « Magazine et matière »

## Objectif
Deuxième essai de concept après « Verre du lac » (PR #76), pour répondre au « fade » relevé par JB (créativité 5,5/10 le 2026-10-08).
Recommandation retenue par JB : l'accueil lu comme un magazine de maison (pistes « Magazine éditorial » et « Matière et chaleur » des propositions, `/mnt/project-files/notation/concept-verre-2026-10-10/propositions.md`), le verre gardé en accent sur la barre de navigation.
Repris de l'essai 8.6 « Éditorial du lac » (PR #20) : la vente à la une, les piliers numérotés, le diagnostic en aplat bleu, la fin de page à l'encre. Pas repris : son changement de polices, puisque Anne a choisi depuis Gilda Display et Jost (D-31).

## Ce qui est fait
- `site/src/styles/magazine.css` (nouveau) : grain de papier sur tout le site, notes à la main (police Caveat, OFL, 51 Ko, `public/fonts/caveat-500.woff2`), photos « tirées sur papier », liens fléchés, lettrine, barre de navigation en gélule de verre (plus couvrante que l'essai verre), replis transparence réduite et navigateurs sans flou.
- `site/src/layouts/Base.astro` : importe la feuille, `data-concept="magazine"` sur `<html>`.
- `site/src/components/accueil/Rubrique.astro` (nouveau) : en-tête de rubrique numéroté (01 Les ventes, 02 Portrait, 03 La méthode, 04 Ils racontent, 05 Votre vente). Noms proposés, à valider par Anne.
- Composants de l'accueil réécrits sur cette branche :
  - `Hero` : couverture, nom en très grand sur deux lignes, filet, boutons, note « trois minutes, gratuit » (mots d'Anne repris du diagnostic) ;
  - `BandePreuve` : 5/5 en très grand chiffre, extrait en grande citation ;
  - `Pile` : une vente à la une puis un sommaire numéroté (la pile collante D-16 est retirée) ;
  - `Anne` : portrait penché tiré sur papier, langues écrites à la main, lettrine ;
  - `Methode` : fond galet, 01-02-03 terracotta, refrain en très grand (mécanique de révélation inchangée) ;
  - `Avis` : premier avis en grand à côté de sa photo, deux autres en colonnes, avis toujours entiers (D-9) ;
  - `Diagnostic` : aplat Klein, « /100 » en très grand, livrables en liste (visibles aussi sur téléphone) ;
  - `Fermeture` : vague du bleu vers l'encre, « Parler à Anne » en très grand, phrase d'Anne à la main.
- Contenu inchangé : mêmes textes d'Anne, mêmes avis cités tels quels, mêmes liens et boutons.

## Vérification (2026-10-10)
- `npm run build` : sans erreur. `npm run check` : 0 erreur.
- `node scripts/liens.mjs` : 26 pages, 1 655 liens, 0 cassé.
- `node scripts/ecrans.mjs` : aucun débordement ni bouton trop petit.
- Captures de l'accueil (1 440 et 390 px) et de /vendre relues une à une ; notation sur la grille Awwwards : 7,2/10 (design 7,5, utilisabilité 7,0, créativité 7,0, contenu 7,0). Détail et captures : `/mnt/project-files/notation/concept-magazine-2026-10-10/`.

## Ce qui reste
- JB et Anne regardent l'aperçu de branche et comparent avec l'essai verre (PR #76).
- Si on garde : décision D-n dans `DECISIONS.md`, noms de rubrique validés par Anne, une story de mise au propre, pages intérieures à traiter, `design-system/` mis à jour.
- Piste pour aller plus loin : des notes manuscrites écrites par Anne elle-même (scannées) à la place de la police.
- Retiré par rapport à la maquette, à acter si le concept est retenu : la pile collante (D-16), la bande bleue de preuve (D-20).
