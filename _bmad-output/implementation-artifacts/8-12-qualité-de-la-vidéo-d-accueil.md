---
story: 8.12
epic: 8 — Structure et visuel
statut: review
date: 2026-10-10
---

# Story 8.12 — Qualité de la vidéo d'accueil

## Objectif
Retour de JB (2026-10-10) : « le grain n'est pas très bon » sur la vidéo d'accueil. Décision de JB le même jour : réencoder plus fin, avec une version allégée pour les téléphones.

## Constat
- Source (Drive « Contenu site Anne », hors Git) : 4K, 17,8 Mbit/s, 115 Mo. Elle est bonne.
- En ligne : 1440 px, crf 30, 1,27 Mbit/s (7,8 Mo), agrandie par le navigateur sur grand écran ; plus un WebM VP9 de 6,4 Mo, servi en premier à Chrome et Firefox.
- Note VMAF (outil de mesure de qualité vidéo, sur 100, comparaison à la source ramenée en 1920 × 1080) : MP4 77, WebM 60.

## Mesures (montage de 52 s)
| Réglage | Poids | VMAF |
|---|---|---|
| 1920 px, crf 23 | 30 Mo | 94 (au-dessus de la limite de 25 Mio par fichier de Cloudflare) |
| 1920 px, crf 26 | 21 Mo | 92 |
| **1920 px, crf 27 (retenu)** | **18 Mo** | **91** |
| 1440 px, crf 23 | 19 Mo | 90 |
| 1920 px, VP9 crf 34 | 23 Mo | 75 (écarté) |
| **1280 px, crf 26 (téléphone, retenu)** | **10,5 Mo** | 83 mesuré en 1920 × 1080, donc sévère pour un écran de téléphone |

Capture de comparaison d'un détail : `/mnt/project-files/captures/video-qualite/comparaison-detail.png` (dossier partagé du projet).

## Ce qui est fait
- `scripts/video.mjs` : sorties `ouverture.mp4` (1920 px, crf 27, preset slower) et `ouverture-telephone.mp4` (1280 px, crf 26) ; le WebM est abandonné. Lancé avec `--debut 0.1` comme en story 7.15.
- `Hero.astro` : deux sources MP4, la version téléphone pour les écrans de 900 px de large au plus.
- Poster refait depuis la nouvelle vidéo (`npm run images`, entrée `photos/ouverture-poster` seulement).
- `site/README.md` : section vidéo et écart « budget vidéo » mis à jour.

## Ce qui est vérifié
- `npm run build` : la page d'accueil contient les deux sources MP4 (téléphone avec `media="(max-width: 900px)"`, puis ordinateur).
- `npm run check` : 0 erreur, 0 avertissement. `node scripts/liens.mjs` : 26 pages, 1661 liens, 0 cassé.
- Navigateur de test (Chromium, site construit servi en local) : à 390 px de large la page demande `ouverture-telephone.mp4`, à 1440 px `ouverture.mp4`. Le Chromium de test ne lit pas le H.264 (codec absent de cette version libre, présent dans Chrome, Edge, Firefox et Safari) : la lecture se vérifie sur l'aperçu de la branche.

## Ce qui reste
- JB regarde le rendu sur l'aperçu de la branche avant la fusion.
