---
story: 7.12
epic: 7 — Contenu d'Anne
statut: in-progress
date: 2026-10-05
autorisations: aucune (toutes les stories restent en « brouillon »)
---

# Story 7.12 — Nouvelles ventes d'Anne au format du site

## Objectif
Ranger dans le dépôt les ventes qu'Anne a préparées dans le Drive, pour qu'elle les relise sur l'aperçu, au même format que les trois premières.

## Constat de départ (Drive, 2026-10-05)
- 8 dossiers de vente : `anthy-t3-2024`, `anthy-t4-2025`, `armoy-auberge-2024`, `bernex-chalet-2024`, `essert-romand-chalet-2026`, `evian-t4-2026`, `morzine-appartement-2026`, `sciez-villa-2025`.
- Les `fr.md` étaient encore le gabarit vide. Le texte d'Anne était dans `<id>.md`, un ancien texte « web » de 550 à 600 mots (emojis, rubriques, appel à l'action, prix pour Essert-Romand). Morzine avait un récit rédigé dans `fr-brouillon.md`.
- `armoy-auberge-2024` est la même vente que `auberge-decoupee-2024` (même titre, même terrain, même méthode) : pas de nouvelle story.
- Bernex et Sciez : aucun texte.

## Ce qui est fait
- 5 récits rédigés par Claude à partir des textes d'Anne, au format du site (première personne, sans prix, sans nom) : Anthy T3, Anthy T4, Essert-Romand, Évian, Morzine (repris de son brouillon). Tous en `statut: brouillon`, en-têtes marqués « proposition Claude ».
- Morzine : nom de la résidence retiré de `type_bien` (affiché publiquement) ; 5 photos web produites depuis les HD du Drive (principale 6965, séjour) ; la façade est écartée pour ne pas identifier le bâtiment.
- Les 3 stories existantes : champ `dossier_photos` (qui contenait des noms de clients) retiré des `fr.md` ; `source` des `photos.json` au nouveau format `<id>/photos/<fichier>`.
- Non recopiés, volontairement : les textes sources `<id>.md` (ils citent des prix) et la nouvelle version de `_suivi-stories.md` (elle ajoute des noms de clients et une adresse) ; ils restent sur le Drive. Le dépôt GitHub est public : action J22 pour JB (le passer en privé).

## Vérification
- `npm run images` : 20 images ; `npm run build` : 24 pages (5 fiches de plus) ; `npm run check` : 0 erreur ; `node scripts/liens.mjs` : 1 478 liens, 0 cassé ; `npm run verif` : aucune erreur console.
- Capture de la page Réalisation : les 4 stories sans photo affichent proprement le cadre réservé A-02.

## Ce qui reste
- Photos d'Anthy T3 (002), Anthy T4 (025), Évian (038) et Essert-Romand (036) : les HD font plus de 8 Mo, le connecteur Drive refuse de les transférer (limite 10 Mo, coupure au-delà de 8 Mo). Il faut lancer `scripts/preparer-photos` sur un ordinateur où le Drive est synchronisé (`PHOTOS_HD=".../Contenu site Anne/stories"`). Essert-Romand 036 et Évian 038 ne sont pas dans le dossier `photos/` de leur story sur le Drive. Les photos d'Essert-Romand portent le logo eXp.
- Anne : relire les 5 récits, confirmer commune, type de bien et délais ; écrire Bernex et Sciez ; témoignages et autorisations (story 7.9).
