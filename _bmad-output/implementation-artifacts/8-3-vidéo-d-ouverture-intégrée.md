---
story: 8.3
epic: 8 — Site : finitions
statut: done
date: 2026-09-26
commit: (voir git log : « Stories 7.4 et 8.3 »)
---

# Story 8.3 — Vidéo d'ouverture intégrée

## Objectif
Que l'accueil (FR et EN) s'ouvre sur la vidéo d'Anne, en boucle, sans son, sans ralentir la page (D-1 : hero = vidéo plein cadre ; AD-15 : budget de vitesse), avec un repli propre quand la vidéo ne peut pas jouer.

## Ce qui est fait
- `site/src/components/accueil/Hero.astro` : deux balises `<source>` (WebM puis MP4) écrites au build seulement si `public/video/ouverture.mp4` existe (`videoDispo`). La règle `.hero-video:not([src]) { display: none }` — qui aurait caché la vidéo puisqu'avec des `<source>` l'attribut `src` reste absent — est remplacée par la classe `.hero-video-absente`, posée quand les fichiers manquent. `preload` passe de `none` à `metadata` (sinon certains navigateurs n'amorcent pas la lecture automatique). `muted autoplay loop playsinline` conservés ; `poster` = JPG du poster ; `<picture>` de repli derrière ; vidéo masquée sous `prefers-reduced-motion`.
- Économie de données (AD-15) : petit script inline ; si `navigator.connection.saveData` est vrai, les `<source>` sont retirées et le poster reste.
- `site/src/config/site.ts` : `hero.poster` = `photos/ouverture-poster` (première image de la vidéo, D-27), `posterAlt` réécrit d'après l'image. Sert aussi d'image de partage (`ogImage`) de l'accueil.
- Fichiers commités : `site/public/video/ouverture.mp4`, `ouverture.webm`, `contenu-anne/photos/ouverture-poster.jpg` et ses dérivés `public/img/photos/ouverture-poster-*`.
- `site/README.md` : A-01 passe en « Réel », § « Vidéo d'ouverture » ajouté, écart de budget documenté.

## Poids finaux
| Fichier | Poids |
|---|---|
| `public/video/ouverture.mp4` (H.264, 1440×810, crf 30) | 15,5 Mo |
| `public/video/ouverture.webm` (VP9, crf 38) | 13,7 Mo (crf 46 ; à crf 38 il pesait 27 Mo) |
| `contenu-anne/photos/ouverture-poster.jpg` (1440 px) | 0,12 Mo (dérivés : webp 640/1280, jpg 66 Ko) |

**Écart assumé au budget « 8-12 s, < 6 Mo »** : JB a choisi le montage entier (95 s). 1440 px retenu (le hero fait 900 px de haut ; 1920 px aurait fait 27 Mo). Lecture en flux : faststart + `preload="metadata"`, le poster couvre l'attente. À remesurer sur l'aperçu (story 10.8).

## Vérification
- `npm run build` : 19 pages, sans erreur ; `dist/index.html` contient la balise `<video … preload="metadata">` avec ses deux `<source>` (WebM puis MP4) et le poster `ouverture-poster-1280.jpg`.
- `npm run check` : 0 erreur, 0 avertissement. `node scripts/liens.mjs` : 1 128 liens, 0 cassé.
- `npm run dev` + navigateur intégré, http://localhost:4321 : ordinateur — la vidéo joue seule (`paused: false`, `currentTime` qui avance, `muted: true`, `loop: true`, source retenue : WebM, 1440×810) ; largeur téléphone 390 px — même constat, la vidéo couvre le hero (780 px) ; **boucle** vérifiée en plaçant la lecture à 94,6 s : elle repart à 0 sans s'arrêter. Aucune erreur console.
- Mouvement réduit (Playwright, `reducedMotion: 'reduce'`) : `.hero-video` en `display: none`, lecture arrêtée, le poster `<picture>` (`ouverture-poster-1280.webp`) reste visible ; en préférence normale la vidéo joue.
- `npm run verif` (Chromium Playwright installé à cette occasion) : aucune erreur console ; `.verif/accueil-desktop-y0.jpg`, `accueil-mobile-y0.jpg` et `accueil-desktop-mouvement-reduit.jpg` mis à jour — le hero montre Anne dans le pré (vidéo ou poster), pas un trou.
- **Non vérifié** : le mode économie de données (`navigator.connection.saveData`), que les outils de la session n'émulent pas ; le rendu sur un vrai téléphone (JB, sur l'aperçu).

## Ce qui reste
- JB : vérifier la vidéo sur téléphone une fois l'aperçu reconstruit (https://anne-vial-tissot-site.jbcholat.workers.dev), 5 min.
- Story 10.8 : mesurer le LCP réel de l'accueil avec la vidéo.
