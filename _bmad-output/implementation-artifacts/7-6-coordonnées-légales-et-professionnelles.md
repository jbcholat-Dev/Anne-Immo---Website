---
story: 7.6
epic: 7 — Contenu d'Anne
statut: in-progress
date: 2026-10-04
---

# Story 7.6 — Coordonnées légales et professionnelles

## Objectif
Que les mentions légales, le pied de page et plus tard la fiche Google portent exactement les mêmes coordonnées d'Anne (AD-13 : une seule source).

## Ce qui est fait
- `contenu-anne/legal/identite.md` créé et pré-rempli avec ce que le site affiche déjà (nom, statut, zone, langues, fiche Immodvisor) ; lignes « À REMPLIR » pour Anne.
- Rangement tranché : `identite.md` vit dans `contenu-anne/legal/` ; `_gabarits/README.md` corrigé (il disait « racine de contenu-anne »), `legal/README.md` pointe vers le fichier.
- Hébergeur renseigné dans `site/src/config/site.ts` (`identite.hebergeur`) : Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, États-Unis, +1 650 319 8930. Dans `mentions-legales.astro`, la pastille « à compléter » ne s'affiche plus quand la valeur existe.

## Vérification
`npm run build` : 19 pages, aucune erreur · `npm run check` : 0 erreur · `node scripts/liens.mjs` : 1 128 liens, 0 cassé · `npm run verif` : captures 1440 et 390 dans `site/.verif/`.

## Ce qui reste
- JB : relire la ligne de l'hébergeur (c'était sa part de la story).
- Anne : RSAC et ville du greffe, carte pro eXp, adresse pro, téléphone, e-mail dans `legal/identite.md`.
- Claude : reporter ses valeurs dans `site.ts`, retirer les pastilles A-13 du pied de page (`copyright` de `fr.json` et `en.json`), puis les données structurées `RealEstateAgent`.
