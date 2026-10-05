---
story: 7.15
epic: 7 — Contenu d'Anne
statut: review
date: 2026-10-05
autorisations: sans objet (montage d'Anne)
---

# Story 7.15 — Nouvelle vidéo d'ouverture

## Objectif
Demande de JB du 2026-10-05 : « On a déposé une vidéo dans le dossier Google Drive. J'aimerais qu'on l'utilise en remplacement de la vidéo actuelle dans la Hero Section. » La règle D-27 (montage d'Anne en entier, en boucle, sans son ; image d'attente = sa première image) ne change pas.

## Ce qui est fait
- Source : « VIDEO SITE INTERNET VDEF.mp4 » (Drive « Contenu site Anne », déposée par Anne le 2026-10-05), 115 Mo, 3840×2160, 30 i/s, 52 s, piste audio. Copiée hors Git dans `contenu-anne/videos/ouverture-source.mp4`.
- Téléchargement : le connecteur Drive ne lit pas les gros fichiers et le domaine de téléchargement de Google était bloqué. JB a partagé le fichier par lien et ouvert `drive.usercontent.google.com` dans l'environnement cloud. Ce chemin sert pour les prochaines vidéos (`contenu-anne/videos/README.md`).
- Encodage : `npm run video -- --debut 0.1` (les deux premières images sont un fondu blanc ; sans ce décalage, l'image d'attente était un écran blanc), puis `npm run images`. Sorties : `ouverture.mp4` 7,79 Mo, `ouverture.webm` 6,35 Mo, poster 1440×810 (Anne face caméra dans le pré).
- Code inchangé : `Hero.astro` lit les mêmes fichiers (seul son commentaire change).
- Documents : `site/README.md` (§ Vidéo d'ouverture, écart de poids), `contenu-anne/videos/README.md` et `liens.md`, `DECISIONS.md` (D-27 précisée), `scripts/video.mjs` (commentaire), epics, statut de sprint.

## Vérification
- Planche de 18 images extraites toutes les 3 s : montage complet, aucun écran vide ; luminosité image par image : seules les 2 premières images étaient blanches, sautées.
- Image d'attente : Anne face caméra (1440×810), vérifiée à l'œil.
- `npm run build` : 25 pages, l'accueil référence `video/ouverture.webm` puis `.mp4`.
- `npm run check` : 0 erreur ; `scripts/liens.mjs` : 1479 liens, 0 cassé.
- `npm run verif` : aucune erreur console ; capture « mouvement réduit » de l'accueil : l'image d'attente s'affiche.

## Ce qui reste
- JB : regarder l'accueil sur l'aperçu après fusion.
