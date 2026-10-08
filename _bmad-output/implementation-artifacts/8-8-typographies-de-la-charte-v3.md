---
story: 8.8
epic: 8 — Site : finitions
statut: done
date: 2026-10-08
origine: artefact d'Anne « Charte graphique v3 » (https://claude.ai/artifact/L5WMPPVNZqneFUng7Loyie), demande de JB du 2026-10-08
decision: D-31
---

# Story 8.8 — Typographies de la charte v3

## Objectif
Appliquer au design system puis au site la proposition typographique d'Anne : Gilda Display remplace Italiana (titres, logo, grands chiffres), Jost remplace DM Sans (texte, interface, étiquettes).

## Écart entre la charte v3 d'Anne et la charte en place
| Sujet | Avant (charte v1) | Charte v3 d'Anne |
|---|---|---|
| Titres, logo, grands chiffres | Italiana, jamais sous 22 px | Gilda Display (une seule graisse), jamais sous 15 px |
| Texte, interface | DM Sans 400 / 500 / 700 | Jost 400 / 500, corps ≥ 16 px, interligne 1,6 |
| Gras | DM Sans 600 / 700 | Jost 500 |
| Étiquettes | 500 capitales espacées 0,20–0,26 em | identique, en Jost |
| Couleurs, boutons, co-branding eXp | — | inchangés |

Dans l'artefact, hors typographie et non repris ici : le logo y garde le sous-titre « CONSEIL IMMOBILIER — LÉMAN & CHABLAIS » (le site l'a retiré, D-14) et les exemples parlent de « Méthode 360° » (abandonnée, D-15) et de « < 5 visites en moyenne » (chiffre non vérifié). Ce sont des exemples de la charte, ils ne changent rien au site.

## Ce qui est fait
- `design-system/` d'abord (AD-17, le design system est la source) : `tokens/tokens.css` (`--avt-font-display: 'Gilda Display'`, `--avt-font-text: 'Jost'`), carte `brand/typographie.html` réécrite selon la v3, les six autres cartes, `_ds_manifest.json`, `README.md`.
- Les 14 SVG de logos et de lockups : nom en Gilda Display. Gilda est plus large qu'Italiana (8,8 em contre 7,9 em pour « Anne VIAL-TISSOT ») : le nom passe de 52 à 46 px (empilé : 50 à 44 px) pour garder la même largeur, donc la même place à côté du logo eXp. Effet visible : le tiret de « VIAL-TISSOT » réapparaît dans les logos (celui d'Italiana était quasi invisible).
- `site/public/fonts/` : Gilda Display 400, Jost 400, 500, 400 italique (`woff2`, sous-ensemble latin, licences OFL jointes, paquets Fontsource 5.3.0). Les fichiers Italiana et DM Sans sont retirés.
- `site/src/styles/global.css` : `@font-face` des nouvelles polices ; `strong, b` en 500 ; `font-synthesis-weight: none` (le navigateur n'imite jamais le gras). Les deux règles en 600 passent en 500.
- `site/src/layouts/Base.astro` : téléchargement prioritaire de Gilda Display et Jost 400. `Lockup.astro` : nom en Gilda Display 46 px.
- Documents : `DECISIONS.md` (D-31), `SPEC.md` (contrainte charte) et `.memlog.md`, `site/README.md` § Polices, `epics.md`, statut de sprint.

## Vérification
- `npm run build` : 24 pages. `npm run check` : 0 erreur. `node scripts/liens.mjs` : 1 465 liens, 0 cassé. `node scripts/ecrans.mjs` (390, 900, 1 024, 1 280, 1 440 px) : aucun débordement.
- Captures avant / après (accueil ordinateur et téléphone, À propos, Vendre, fiche de vente, pied de page, diagnostic) : rien ne déborde ni ne se chevauche ; le titre du hero tient sur une ligne à 1 440 px et sur deux lignes à 390 px, comme avant.
- Rendu des 14 SVG avec les nouvelles polices : le nom tient dans son cadre, le lockup eXp garde ses cotes.

## Ce qui reste
- ~~JB : relire et fusionner la PR~~ : fait, PR #49 fusionnée le 2026-10-08 (décision D-31 adoptée).
- Anne : regarder le résultat sur l'aperçu une fois fusionné.
- Le tiret insécable de « VIAL‑TISSOT » dans les titres du site est dessiné par la police de secours (Gilda n'a pas ce caractère) ; acceptable à l'œil, à revoir si Anne le remarque.
