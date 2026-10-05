---
story: 8.5
epic: 8 — Site : finitions
statut: done
date: 2026-10-04
origine: ticket GitHub n° 3 (retour-apercu, JB, 2026-09-26)
---

# Story 8.5 — Lien « Accueil » dans la navigation

## Objectif
Que le visiteur revienne à l'accueil sans deviner que le symbole y mène. Retour de JB sur l'aperçu : « pour revenir à la page d'accueil, il faut cliquer sur le logo. C'est pas mal, mais c'est pas très intuitif. » Décision D-28.

## Ce qui est fait
- `site/src/components/Nav.astro` : « Accueil » (« Home » en anglais, libellés déjà présents dans `content/ui/*.json`) devient la première entrée de la barre d'ordinateur, de la barre réduite et du menu mobile, avant « À propos ▾ ». Le symbole ramène toujours à l'accueil.
- Le lien est marqué « page en cours » sur l'accueil FR et EN, pas sur la page 404 (qui passe `courante="accueil"` pour la bascule de langue).
- Entre 900 et 1 099 px de large (petits écrans d'ordinateur), l'espace entre les entrées passe de 32 à 22 px : sans cela, à 900 px, il ne restait que 4 px entre le symbole et « Accueil ».
- Documents : `DECISIONS.md` (D-28), `structure-site.md` § 0, `site/README.md` (ligne Navigation), `epics.md` (story 8.5).

## Vérification
- `npm run build` : 19 pages. `npm run check` : 0 erreur. `node scripts/liens.mjs` : 0 lien cassé.
- HTML construit : « Accueil » porte `aria-current="page"` sur `/` et `/en`, pas sur `/404` ni `/vendre`.
- Captures Playwright de la barre (900, 1 024, 1 440 px ; FR et EN) et du menu mobile ouvert (390 px) : aucun débordement (largeur de défilement = largeur visible), tous les liens sur une ligne, 55 px d'air entre symbole et « Accueil » à 900 px en FR, 123 px en EN (mesuré avec les vraies polices, story 8.1).

## Ce qui reste
Rien. Le ticket n° 3 est fermé en citant le commit.
