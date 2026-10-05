---
story: 8.1
epic: 8 — Site : finitions
statut: done
date: 2026-10-04
---

# Story 8.1 — Polices hébergées sur le site

## Objectif
Que les titres en Italiana et le texte en DM Sans s'affichent tout de suite et toujours de la même façon, sans qu'un serveur de Google soit appelé à l'insu du visiteur (AD-11, politique de dépôt navigateur).

## Ce qui est fait
- `site/public/fonts/` : Italiana 400 et DM Sans 400, 500, 700, 400 italique, en `woff2`, sous-ensemble latin (tout le français, Œ, guillemets, tiret insécable U+2011). 72 Ko au total. Licences OFL jointes (`LICENSE-*.txt`). Fichiers tirés une fois des paquets Fontsource 5.3.0 ; aucun paquet ajouté au projet.
- `site/src/styles/global.css` : cinq règles `@font-face` avec `font-display: swap`. Tokens `--avt-font-display` / `--avt-font-text` inchangés (AD-17).
- `site/src/layouts/Base.astro` : Google Fonts retiré (deux `preconnect` et la feuille de style) ; `preload` d'Italiana et de DM Sans 400.
- `site/scripts/verif.mjs` : la boucle d'attente « Google Fonts peut être lent ou bloqué » est remplacée par une attente simple des polices, et toute requête vers `fonts.googleapis.com` / `fonts.gstatic.com` est comptée comme une erreur ; type `font/woff2` ajouté au petit serveur local.
- `site/README.md` § Polices.

## Vérification
- `npm run build` : 19 pages. `npm run check` : 0 erreur. `node scripts/liens.mjs` : 0 lien cassé.
- `npm run verif` : jeu complet de captures, « Aucune erreur console », aucune requête Google relevée.
- Comparaison avant / après (accueil téléphone, haut de page) : titres et textes identiques. Le menu mobile, qui s'affichait dans une police de secours quand Google Fonts était bloqué, est maintenant en Italiana.
- La seule règle en graisse 600 s'affiche en 700, comme avec Google Fonts (mêmes graisses chargées).

## Ce qui reste
Rien pour cette story. Les décalages d'écran relevés par JB se traitent page par page en 8.2, maintenant que les polices sont stables.
