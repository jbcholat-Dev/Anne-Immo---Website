---
story: 8.17
epic: 8 — Structure et visuel
statut: review
date: 2026-10-11
---

# Story 8.17 — Retours de JB du 11/10 au matin (tickets n° 114, 115, 117)

## Objectif
Trois retours de JB laissés le 2026-10-11 avec le bouton « Un retour ? » de l'aperçu :
- n° 114 (/acheter) : les cartes d'avis clients n'ont pas la même taille, ce qui n'est pas esthétique.
- n° 115 (/acheter) : la pastille « Contenu à écrire par Anne » est toujours là ; JB veut que le site soit débarrassé de tout ça.
- n° 117 (/diagnostic/resultats) : l'encart du guide « Les 10 erreurs fatales » n'a pas de visuel, et il reste une référence « 10 » (le code interne « A-10 » affiché sous le titre).

Le quatrième ticket du lot (n° 116, barre de navigation plus compacte sur grand écran) demande une branche d'essai : il part au fil Structure et visuel, qui mène les essais de design.

## Ce qui est fait
- n° 114 : sur Acheter, les deux cartes d'avis prennent la hauteur de la plus haute (`align-items: stretch`), la signature restant en bas de chaque carte. L'accueil garde des cartes de hauteur libre : la première porte une photo, et des cartes étirées y laisseraient de grands vides.
- n° 115 : les trois pastilles de la maquette sont retirées, même sur l'aperçu : « Contenu à écrire par Anne » (Acheter), « Point ouvert 1 » (À propos, Cible), « Point ouvert 2 » (Vendre, estimation). Le bloc réservé « Actif attendu A-07 · témoignage » des pages de vente sans avis relié est retiré aussi ; sur ces pages, la partie « Ce qu'ils en disent » n'apparaît plus quand il n'y a rien à montrer (avant, le site public affichait un titre sans contenu). Après construction, aucune page de l'aperçu ne contient plus « Actif attendu », « Point ouvert », « Contenu à écrire » ni « à compléter ».
- n° 117 : l'encart du guide sur la page de résultats montre la vraie couverture du PDF (`public/img/guide-couverture.jpg`) et le sous-titre « Le guide PDF d'Anne, offert et envoyé par e-mail. » remplace « Guide PDF, à la charte · A-10 ».
- `site/README.md` mis à jour (blocs réservés, pastilles, site public).

## Ce qui est vérifié (2026-10-11)
- `npm run build` OK (aperçu et `PUBLIC_INDEXATION=oui`) ; `npm run check` : 0 erreur ; liens : 26 pages, 1 659 liens, 0 cassé ; `scripts/ecrans.mjs` : aucun signalement.
- `scripts/e2e-diagnostic.mjs` : tous les constats bons ; captures de la page de résultats (sorties A et B).
- Captures : `/mnt/project-files/tickets/avis-114/` (Acheter ordinateur et téléphone) et `/mnt/project-files/tickets/resultats-117/`.

## Ce qui reste
- Accord de JB et fusion de la PR ; fermer les tickets n° 114, 115 et 117 en citant le commit.
- La sortie A du diagnostic dit « un expert qui optimise les derniers 10 % » : texte d'Anne, gardé ; question posée à JB.
