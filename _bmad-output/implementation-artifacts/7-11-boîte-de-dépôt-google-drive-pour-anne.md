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
- `contenu-anne/README.md` § « Comment envoyer » : le dossier Drive « Contenu site Anne » et ses sous-dossiers (Photos des ventes, Portrait, Vidéos, Textes, Autorisations).
- `contenu-anne/A-FOURNIR.md`, `contenu-anne/videos/README.md`, `CLAUDE.md` (carte du dépôt) : renvoient au dossier Drive.
- `RUNBOOK.md` § 1 (ligne Google Drive) et § 6 (journal) ; décision dans `.memlog.md` de la spec.

## Vérification
- Essai de lecture du Drive par le connecteur le 2026-10-05 : **refusé**, « Insufficient scope » (le connecteur n'a pas le droit de lire les fichiers).
- Documents seuls modifiés, pas de code : `npm run build` et `node scripts/liens.mjs` non concernés.

## Ce qui reste
- JB : reconnecter le connecteur Google Drive en acceptant la lecture des fichiers, l'activer dans les réglages du projet ; créer le dossier « Contenu site Anne » et ses sous-dossiers, le partager avec Anne en modification.
- Claude : dans une nouvelle session, vérifier qu'il lit le dossier (lister, télécharger une photo), puis noter le résultat ici.
- JB ou Anne : copier sur Drive les photos HD des ventes et la vidéo source, aujourd'hui seulement sur un ordinateur.
