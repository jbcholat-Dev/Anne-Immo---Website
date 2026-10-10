---
story: 8.11
epic: 8 — Structure et visuel
statut: done
date: 2026-10-10
---

# Story 8.11 — Vidéo d'accueil réparée

## Objectif
Signalement de JB (2026-10-10) : la vidéo d'accueil ne tourne plus sur l'aperçu.

## Cause
`Hero.astro` vérifiait la présence de `public/video/ouverture.mp4` avec un chemin relatif à son propre fichier (`import.meta.url`).
Depuis le passage à l'adaptateur Cloudflare (story 10.2, 2026-10-07), le code est regroupé dans un autre dossier au moment de la construction :
le chemin ne menait plus à la vidéo, le site la croyait absente et masquait la balise `<video>`. Seule l'image fixe (poster) restait affichée.
Les fichiers vidéo, eux, étaient bien en ligne.

## Ce qui est fait
- Le chemin part désormais du dossier `site/` (`process.cwd()`), comme `src/lib/contenu.ts`.

## Ce qui est vérifié
- `npm run build` : la page d'accueil contient de nouveau les deux sources (`/video/ouverture.webm`, `/video/ouverture.mp4`) ; avant la correction, `<video class="hero-video hero-video-absente">` vide.
- Navigateur (Chromium, site construit servi en local) : vidéo visible, lecture en cours (3 s après chargement, `readyState` 4, non en pause).
- `npm run check` : 0 erreur. `node scripts/liens.mjs` : 26 pages, 1661 liens, 0 cassé.

## Ce qui reste
- Rien. PR #91 fusionnée le 2026-10-10 ; la mise en ligne de l'aperçu suit la fusion.
