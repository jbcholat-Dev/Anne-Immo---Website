---
story: 7.4
epic: 7 — Contenu d'Anne
statut: done
date: 2026-09-26
commit: (voir git log : « Stories 7.4 et 8.3 »)
---

# Story 7.4 — Vidéo d'ouverture du hero (contenu)

## Objectif
Qu'Anne choisisse la vidéo qui ouvre le site, et qu'elle soit rangée, inventoriée et encodée pour le web de façon reproductible (A-01 : l'actif « vidéo d'ouverture » de la maquette).

## Ce qui est fait
- **Source rangée** : le montage d'Anne (« VIDEO SITE INTERNET (2).mp4 », remis par JB) est déplacé en `contenu-anne/videos/ouverture-source.mp4`, hors Git (dossier ignoré, vérifié par `git status`). 1920×1080, 30 i/s, 95 s, piste audio, 88 Mo.
- **Inventaire** : ligne ajoutée dans `contenu-anne/videos/liens.md` avec la description du contenu (Anne face caméra dans un pré du Chablais, village de montagne vu du ciel, chalet et intérieurs, rives du Léman et Évian vus du ciel, chalet sous la neige). Colonne « lien de partage » à remplir par JB si une autre machine doit récupérer la source.
- **Passage retenu** : **toute la vidéo** (JB, 2026-09-26 : « c'est le montage qu'elle a fait exprès »). Pas de découpe, pas de recadrage ; le logo eXp incrusté par le montage est conservé. Journalisé comme **D-27** dans `maquettes/lot-3-complet/DECISIONS.md`.
- **Encodage reproductible** : `site/scripts/video.mjs`, commande `npm run video` (binaire `ffmpeg-static`, ajouté aux dépendances de développement avec `ffprobe-static`). Produit MP4 (H.264, 1440 px, 30 i/s, sans son, faststart), WebM (VP9) et le poster JPG (première image). Mode d'emploi dans `contenu-anne/videos/README.md` § Pour l'ouverture du site.

## Vérification
- `git status` après le déplacement : la source n'apparaît pas (règle `contenu-anne/videos/*` du `.gitignore`).
- Sondage `ffprobe` de la source : h264 1920×1080 30/1, 95,23 s, aac.
- Planches-contact (1 image / 5 s puis 1 image / s) regardées pour décrire le contenu et écrire l'`alt` du poster.
- Poids des sorties : voir story 8.3.

## Ce qui reste
- Rushes drone bruts (sans incrustation) si Anne veut un jour un hero « paysage pur » : hors périmètre, la décision D-27 est de garder son montage.
- JB : coller le lien de partage OneDrive de la source dans `liens.md` (2 min), pour qu'une autre machine puisse relancer `npm run video`.
