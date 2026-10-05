---
story: 7.11
epic: 7 — Contenu d'Anne
statut: in-progress
date: 2026-10-05
---

# Story 7.11 — Boîte de dépôt Google Drive pour Anne

## Objectif
Qu'Anne fournisse son contenu sans toucher à GitHub, et que son dossier et le dépôt ne se désynchronisent plus. Décision de JB du 2026-10-05 (carte de décision du fil « Contenu du site ») : Google Drive, plutôt qu'OneDrive ou des commits par Anne.

## Ce qui est fait
- (matin, PR n° 7) `contenu-anne/README.md` § « Comment envoyer » : le dossier Drive « Contenu site Anne » et 5 sous-dossiers (Photos des ventes, Portrait, Vidéos, Textes, Autorisations).
- (après-midi) **Structure revue à la demande de JB**, carte de décision « Je range » : le Drive est rangé exactement comme `contenu-anne/`. Une vente = `stories/<bien>/` avec son texte, `photos/` (HD) et `autorisations/`.
  - Le dossier de JB « 1. Project / Site web - Anne Immo », où JB avait copié tout le dossier local d'Anne, est renommé « Contenu site Anne » et remonté à la racine du Drive (partagé avec Anne en modification, vérifié).
  - Le « Contenu site Anne » du matin (5 sous-dossiers) est renommé « ARCHIVE - ancien Contenu site Anne (ne plus utiliser) ». Seul fichier qui n'existait que là : `stories/morzine-appartement-2026/fr-brouillon.md`, copié dans le nouveau dossier.
  - « Stories  photos » (HD classées par client) doublait `stories/<bien>/photos/` (≈ 0,9 Go en double) : les 11 photos qui n'existaient que là (Évian 2, Sciez 4, Thonon 5, dont les 4 HD des photos web de Thonon) sont copiées dans leur story ; le dossier est renommé « À SUPPRIMER - Stories photos (doublon) ».
  - Morzine : les 7 photos posées à la racine de la story sont copiées dans un sous-dossier `photos/` ; les originaux sont renommés « À SUPPRIMER - … ». Dossier vide « Vidéo intro » : idem.
  - `scripts/preparer-photos` lit maintenant `<copie locale du Drive>/stories/<id>/photos/` (réglage `PHOTOS_HD`) au lieu de `Stories  photos/<dossier_photos>/`, et ne supprime que ses propres `photo-*.jpg`. `.gitignore` refuse toute autre photo dans `stories/*/photos/`.
  - Mis à jour : `contenu-anne/README.md`, `_gabarits/story.md`, `photos/README.md`, `CLAUDE.md`, `RUNBOOK.md` § 1 et § 6, `.memlog.md`, `strategie-contenu.md`, `scripts/preparer-photos/README.md`.
- `contenu-anne/A-FOURNIR.md`, `contenu-anne/videos/README.md`, `CLAUDE.md` (carte du dépôt) : renvoient au dossier Drive.
- `RUNBOOK.md` § 1 (ligne Google Drive) et § 6 (journal) ; décision dans `.memlog.md` de la spec.

## Vérification
- Essai de lecture du Drive par le connecteur, matin du 2026-10-05 : **refusé**, « Insufficient scope ».
- Après reconnexion par JB : **lecture OK** (inventaire complet, 446 fichiers, téléchargement d'un fichier texte), déplacement de dossier et copie de fichiers OK. Limite constatée : Claude (compte de JB) ne peut ni déplacer ni supprimer un fichier dont Anne est propriétaire (« The caller does not have permission »), d'où les renommages « À SUPPRIMER - … ».
- `scripts/preparer-photos` essayé sur des photos factices dans `PHOTOS_HD/appartement-cascade-2024/photos/` : 4 photos produites, `photos.json` correct, les autres stories ignorées proprement ; fichiers réels restaurés ensuite.
- Site : `npm run build` 19 pages, `npm run check` 0 erreur, `node scripts/liens.mjs` 1 128 liens, 0 cassé (2026-10-05).

## Ce qui reste
- Anne : dans le Drive, chercher « À SUPPRIMER » et mettre à la corbeille ce qui sort (9 éléments) ; pointer Google Drive pour ordinateur et Obsidian sur « Contenu site Anne ».
- JB ou Anne : déposer la vidéo source dans `videos/` du Drive (le dossier « Vidéo intro » était vide).
- Claude : recopier dans le dépôt les 8 stories qui n'existent que sur Drive (story 7.12, à suivre).
