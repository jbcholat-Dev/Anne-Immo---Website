---
story: 8.6
epic: 8 — Site : finitions
statut: review
date: 2026-10-05
origine: demande de JB dans le fil « bonnes pratiques de design » (2026-10-05) — « il manque un truc sur la version actuelle »
branche: claude/project-thread-lnd0sf (expérience, ne pas fusionner sans décision de JB)
---

# Story 8.6 — Audit de design et expérience « Éditorial du lac »

## Objectif
1. Faire l'audit du site actuel à partir des bonnes pratiques de design tirées du wiki de JB (12 fiches lues, rien modifié dans le wiki).
2. Proposer, sur une branche à part, une version qui sort de la charte. Consigne de JB : **garder le logo et les deux couleurs fortes (bleu Klein `#002FA7`, terracotta `#C4623E`)**, tout le reste est libre (police, structure des pages). **C'est une expérience, pas une décision** : aucune entrée D-n dans `DECISIONS.md`, la charte et `design-system/` ne sont pas modifiés.

## Sources (wiki de JB, dossier `wiki/`)
- `sources/transcript-fable-51-website-slop.md` (Nate Herk) : on ne demande pas « premium », on donne des références décortiquées ; sept ingrédients (charte, douleur/personne/promesse, réponse au défilement, inspiration, composants, mobile, vérification image par image).
- `sources/tweet-frontend-references-opus.md` (@Voxyz_ai) : une seule référence de style épinglée, toutes les autres refusées ; sites d'inspiration (Refero Styles, awesome-design-md, 21st.dev, Component Gallery, Kinetics, Impeccable).
- `sources/transcript-25-tricks-claude-design.md` (Jay E) : changer la police par défaut ; les règles d'interface d'Apple (Human Interface Guidelines) comme grille de relecture ; audit hiérarchie / espacement / typo / accessibilité (Impeccable) ; un seul jeu d'icônes.
- `concepts/ai-slop.md`, `concepts/design-system-as-code.md`, `sources/transcript-wds-ux-backwards.md` (savoir à qui on parle avant l'esthétique ; la peur pèse plus que l'envie).

## Audit du site actuel (`main` du 2026-10-05, captures 1 440 et 390 px)
Grille : règles d'Apple (clarté, hiérarchie, retenue, place laissée au contenu) et grille d'Impeccable (hiérarchie, espacements, typographie, accessibilité, états vides).

| # | Constat | Gravité | Où |
|---|---|---|---|
| 1 | Les titres en Italiana ont un trait très fin et une seule graisse : peu de présence, surtout en blanc sur la vidéo et en petit (communes des cartes). Le regard ne trouve pas de point d'appui. | forte | partout |
| 2 | Tout est dans la même famille de beiges (écru, galet, brume pâle) : les sections ne se détachent pas, la page se lit comme un seul bloc. Les deux couleurs fortes n'apparaissent qu'en petits liens bleus et un bouton. | forte | accueil, pages intérieures |
| 3 | Appels à l'action faibles : « Voir cette vente », « Toutes les ventes », « En savoir plus » sont de petits liens bleus de 14-15 px. La barre de navigation n'a aucun bouton d'action. | forte | accueil, Réalisation |
| 4 | Six cartes identiques (même fond, même gabarit, 600 px chacune), soit environ 3 600 px de répétition : on ne distingue plus la sixième vente de la première. | moyenne | accueil, ventes |
| 5 | Les avis forment trois colonnes de texte long et petit, sans hiérarchie : un mur de texte. | moyenne | accueil, avis |
| 6 | Le bloc diagnostic montre « /100, 3, 1 » dans trois petits encarts : abstrait, peu d'envie de cliquer. | moyenne | accueil |
| 7 | Les petits textes sont nombreux : navigation 14 px, pied de page 14 px, sur-titres 12-13 px en majuscules espacées. Fatigant sur un grand écran. | moyenne | partout |
| 8 | La place la plus visible de la barre (en haut à gauche) va à trois icônes de réseaux sociaux avant le nom d'Anne. | faible | navigation |
| 9 | Le portrait d'Anne manque (A-04) : la section « Anne » n'a pas d'Anne. Ce n'est pas un défaut de design mais c'est le manque le plus visible du site. | forte (contenu) | accueil, À propos |
| 10 | Points solides à garder : la vidéo d'ouverture plein cadre, les photos des ventes, les contrastes (tous ≥ 4,5:1), les cibles tactiles, la lecture des fiches de vente. | — | — |

## Ce qui est fait (branche `claude/project-thread-lnd0sf`)
Direction retenue pour l'expérience : **« Éditorial du lac »**, un site qui se lit comme un magazine immobilier haut de gamme : grandes typographies, beaucoup d'air, des aplats francs de bleu Klein et d'encre, le terracotta réservé aux boutons et aux chiffres.

- **Polices** (`site/public/fonts/`, Fontsource 5.3.0, licence OFL) : Newsreader pour les titres (serif à taille optique, mots-clés en *italique Klein*) et Instrument Sans pour le texte. DM Sans est retirée ; Italiana reste chargée pour le seul logo du pied de page. Poids : Newsreader 132 Ko + italique 64 Ko, Instrument Sans 30 + 31 Ko.
- **Couleurs** (redéfinies dans `site/src/styles/global.css`, sans toucher `design-system/tokens/tokens.css`) : Klein et terracotta inchangés ; fond papier `#FBF9F5` plus lumineux ; encre `#16181D` au lieu du brun ; sable `#F1EDE5` pour les sections alternées. Texte secondaire `#585C64` (6,6:1 sur papier).
- **Navigation** : symbole + nom « Anne Vial‑Tissot », entrées en 15 px, bouton « Faire estimer » (terracotta) à droite ; les réseaux quittent la barre (ils restent dans le menu mobile et le pied de page). Le nom puis le bouton s'effacent sur les petits écrans d'ordinateur.
- **Accueil** :
  - ouverture plein écran, sur-titre « Conseil immobilier · Léman & Chablais », nom en très grand, deux portes (diagnostic, estimation) ;
  - preuve : la note 5/5 en grands chiffres Klein, l'extrait d'avis en grande citation ;
  - ventes : une vente à la une (grande photo), puis six vignettes numérotées ; la pile collante est retirée ;
  - méthode sur fond sable, piliers numérotés 01-02-03, refrain en très grand avec la dernière ligne en italique Klein ;
  - avis cités en entier (règle inchangée) en serif, l'avis relié à sa vente en tête ;
  - diagnostic en aplat Klein pleine largeur, « /100 » en très grand ;
  - fin de page sur l'encre, « Parler *à Anne* » en très grand, qui se prolonge dans le pied de page.
- **Pages intérieures** : héritent des polices, couleurs et boutons ; titres plus resserrés ; Réalisation en vignettes verticales avec lien fléché ; À propos : refrain et ligne-signature réajustés.
- Sur-titres numérotés et liens fléchés (`.surtitre`, `.lien-fleche`), helper `accent()` (`site/src/lib/texte.ts`) pour les mots en italique Klein ; libellés ajoutés en FR et EN (`content/ui/*.json`, garde-fou AD-2 respecté).
- Le contenu n'a pas changé : mêmes 11 pages, mêmes textes d'Anne, mêmes avis cités tels quels, mêmes formulaires et même diagnostic.

## Vérification
- `npm run build` : 24 pages, sans erreur. `npm run check` : 0 erreur (39 remarques, identiques à `main`).
- `node scripts/liens.mjs` : 25 pages, 1 366 liens, 0 cassé.
- `node scripts/ecrans.mjs` : aucun débordement ni bouton trop petit, à toutes les largeurs contrôlées.
- `node scripts/e2e-diagnostic.mjs` : sorties A, B et profil à risque, aucune erreur console.
- `npm run verif` : captures régénérées dans `site/.verif/` (1 440 et 390 px, accueil à 5 positions et en mouvement réduit), aucune erreur console, aucune requête Google Fonts.

## Ce qui reste
- JB et Anne regardent la branche (captures `site/.verif/` ou aperçu de branche si Cloudflare en publie un) et disent : on garde, on garde en partie, ou on jette.
- Si on garde : journaliser la décision (D-29 dans `DECISIONS.md`), répercuter les nouvelles couleurs et polices dans `design-system/` (charte, tokens, cartes) puis dans la maquette, retirer la mention « expérience » du code et du README.
- Le portrait d'Anne (A-04) reste le manque le plus visible, quel que soit le design.
