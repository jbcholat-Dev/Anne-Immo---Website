---
type: passation
date: 2026-09-26
de: session Claude Code cloud (session_01ToMxzEvo8w3c5avD9sQhz6)
vers: session Claude Code locale de JB (Windows)
stories: 7.4 (Vidéo d'ouverture du hero, contenu) et 8.3 (Vidéo d'ouverture intégrée, site)
---

# Passation — intégrer la vidéo d'ouverture sur l'accueil

## Pourquoi une passation

Le fichier vidéo est sur le PC de JB (`C:\Users\JBCHOLAT\Anne Immo\Website\VIDEO SITE INTERNET (2).mp4`, à la racine du dépôt cloné, non suivi par Git). La session cloud ne peut pas le recevoir. La session locale le voit : c'est elle qui fait ce travail. Tout le reste (aperçu en ligne, suivi, tableau de bord) reste tel que décrit dans `CLAUDE.md`, qui s'applique ici aussi : vocabulaire expliqué, traçabilité, vérification avant de dire « fait ».

## État du dépôt au moment de la passation

- Branche de travail : `claude/dreamy-johnson-u1akex` (à jour sur GitHub). `main` a été fusionnée le 26/09 au soir ; la branche contient en plus le RUNBOOK, les stories 9.3 à 9.5 et cette passation.
- Aperçu en ligne : https://anne-vial-tissot-site.jbcholat.workers.dev (Cloudflare construit `main` à chaque push ; accès protégé par code e-mail ; non indexé).
- Le hero de l'accueil (`site/src/components/accueil/Hero.astro`) contient une balise `<video>` **sans source** et un poster (photo d'Armoy). La règle CSS `.hero-video:not([src]) { display: none; }` cache la vidéo tant qu'elle n'a pas d'attribut `src` : **avec des balises `<source>` enfants, l'attribut `src` reste absent et la vidéo resterait cachée**. Cette règle doit être remplacée (voir plus bas).
- Le budget prévu par le README pour la vidéo : 1080p, 8 à 12 s, sans audio, MP4 < 6 Mo (+ WebM).
- `ffmpeg` (l'outil d'encodage vidéo) n'est pas installé ; le paquet npm `ffmpeg-static` fournit un binaire prêt à l'emploi, y compris sous Windows. Vérifié côté cloud : `npm i -D ffmpeg-static` fonctionne.

## Conventions décidées (à respecter, elles sont la « gestion du contenu » demandée par JB)

| Quoi | Où | Suivi par Git ? |
|---|---|---|
| Vidéo source (l'original de JB) | `contenu-anne/videos/ouverture-source.mp4` | non (dossier ignoré), inventoriée dans `contenu-anne/videos/liens.md` |
| Vidéo web MP4 | `site/public/video/ouverture.mp4` | oui (petit fichier) |
| Vidéo web WebM | `site/public/video/ouverture.webm` | oui |
| Image de poster (première image de la vidéo) | `contenu-anne/photos/ouverture-poster.jpg`, dérivée par `npm run images` en `public/img/photos/ouverture-poster-*.{webp,jpg}`, identifiant `photos/ouverture-poster` | source oui, dérivés oui (comme les autres photos) |
| Script d'encodage | `site/scripts/video.mjs`, commande `npm run video` | oui |

Décision à journaliser dans `maquettes/lot-3-complet/DECISIONS.md` comme **D-27 (JB, 2026-09-26)** : le poster du hero (A-14) devient la première image de la vidéo, pour qu'il n'y ait aucun saut visuel au démarrage ; la photo d'Armoy n'est plus utilisée dans le hero. Si JB préfère garder Armoy, il le dit et D-27 le note.

## Étapes

### 1. Ranger la source (story 7.4)
1. Déplacer `VIDEO SITE INTERNET (2).mp4` vers `contenu-anne/videos/ouverture-source.mp4`.
2. Vérifier avec `git status` que le fichier n'apparaît pas (dossier ignoré). S'il apparaît, ne pas l'ajouter : corriger `.gitignore`.
3. Ajouter une ligne dans `contenu-anne/videos/liens.md` : nom, taille, durée, dimensions, ce qu'on y voit, colonne lien vide. Les dimensions et la durée s'obtiennent avec `ffprobe` (fourni avec `ffmpeg-static` ? non : seulement `ffmpeg`. Utiliser `ffmpeg -i fichier` et lire l'en-tête, ou le paquet `ffprobe-static`).
4. Demander à JB quel passage garder : instant de début et durée (8 à 15 s, en boucle, sans incrustation). Par défaut : les 12 premières secondes.

### 2. Script d'encodage (`site/scripts/video.mjs`, `npm run video`)
- `cd site && npm i -D ffmpeg-static` (et `ffprobe-static` si utile).
- Le script lit `../contenu-anne/videos/ouverture-source.mp4`, accepte `--debut <secondes>` et `--duree <secondes>` (défaut 0 et 12), et produit :
  - `public/video/ouverture.mp4` : `-an` (sans son), `-vf scale=1920:-2` (largeur 1920, hauteur paire), `-r 30`, `-c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart`.
  - `public/video/ouverture.webm` : `-an`, même échelle, `-c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1`.
  - `../contenu-anne/photos/ouverture-poster.jpg` : première image du passage retenu (`-frames:v 1 -q:v 2`, largeur 1920).
- Le script affiche la taille de chaque sortie. **Cible : MP4 < 6 Mo.** Si dépassé : `crf` 30, puis largeur 1600. Documenter la valeur finale dans la story.
- Puis `npm run images` pour dériver le poster (il apparaît sous l'identifiant `photos/ouverture-poster` dans `src/data/images.json`).

### 3. Code (story 8.3), `site/src/components/accueil/Hero.astro`
- Dans le frontmatter : `const videoDispo = fs.existsSync(new URL('../../../public/video/ouverture.mp4', import.meta.url))` (adapter le chemin) ; n'écrire les balises `<source>` que si `videoDispo`, dans l'ordre WebM puis MP4 :
  `<source src="/video/ouverture.webm" type="video/webm" />` et `<source src="/video/ouverture.mp4" type="video/mp4" />`.
- Remplacer la règle `.hero-video:not([src]) { display: none; }` par une classe posée quand `videoDispo` est faux (par exemple `class:list={['hero-video', !videoDispo && 'hero-video-absente']}` et `.hero-video-absente { display: none; }`).
- Garder `muted autoplay loop playsinline`, passer `preload` à `metadata` (sinon certains navigateurs n'amorcent pas la lecture automatique). Conserver l'attribut `poster` (chemin JPG du poster) et le `<picture>` de repli derrière (mouvement réduit, échec de chargement).
- `src/config/site.ts` : `hero.poster` devient `'photos/ouverture-poster'`, `posterAlt` décrit l'image (à écrire d'après ce qu'on voit).
- Facultatif, si simple : ne pas charger la vidéo quand `navigator.connection?.saveData` est vrai (respect d'AD-15, le budget de performance).

### 4. Vérification (obligatoire avant « fait »)
- `npm run build`, `npm run check`, `node scripts/liens.mjs` : 0 erreur, 0 lien cassé.
- `npm run dev`, ouvrir http://localhost:4321 : la vidéo démarre seule, en boucle, sans son, sur ordinateur et en largeur téléphone (outils de développement du navigateur, 390 px). Avec « réduire les animations » activé dans le système : la vidéo est masquée, le poster reste.
- `npm run verif` : la capture `accueil-desktop-y0` montre la vidéo ou son poster, pas un trou.
- Noter les tailles finales (MP4, WebM, poster) dans la story.

### 5. Traces (même commit que le code)
- `site/README.md` : A-01 passe de « Actif attendu » à « Réel » ; documenter `npm run video`, les conventions ci-dessus, et l'écart éventuel au budget.
- `contenu-anne/videos/README.md` : ajouter le paragraphe « Pour l'ouverture du site : source ici, `npm run video`, dérivés commités ».
- `maquettes/lot-3-complet/DECISIONS.md` : D-27 (poster = première image de la vidéo, ou le choix de JB).
- Fichiers de story : `_bmad-output/implementation-artifacts/7-4-vidéo-d-ouverture-du-hero.md` et `8-3-vidéo-d-ouverture-intégrée.md` (modèle : `9-2-configuration-de-mise-en-ligne-statique-et-non-indexation.md` dans le même dossier).
- Suivi de sprint, depuis la racine du dépôt :
  ```
  uv run .claude/skills/bmad-sprint-planning/scripts/sprint_plan.py generate --epic-file _bmad-output/planning-artifacts/epics.md --status-file _bmad-output/implementation-artifacts/sprint-status.yaml --stories-dir _bmad-output/implementation-artifacts --project "Site Anne Vial-Tissot" --date "MM-DD-YYYY HH:MM" --set 7-4-vidéo-d-ouverture-du-hero=done --set 8-3-vidéo-d-ouverture-intégrée=done --set epic-8=in-progress
  ```
- Commits en français, quoi et pourquoi, sur une branche `story-8-3-video-ouverture` créée depuis `claude/dreamy-johnson-u1akex`. Une fois vérifié : fusionner dans `claude/dreamy-johnson-u1akex` puis dans `main` et pousser `main` : Cloudflare reconstruit l'aperçu, JB vérifie sur téléphone.

### 6. Tableau de bord (règle du CLAUDE.md)
Si l'outil `ArtifactData` est disponible dans la session locale, sur https://claude.ai/artifact/4HmS8AdWcXACwVpgQSrMRB :
- `epics/E07` : `stories_faites` 4 (au lieu de 3) ; `epics/E08` : `statut` `en-cours`, `stories_faites` 1 ; `actions/A04` : `statut` `fait` ;
- `publications/2026-09-XX-video-ouverture` : `{date, type: "apercu", titre: "Vidéo d'ouverture en ligne sur l'aperçu", detail, url: "https://anne-vial-tissot-site.jbcholat.workers.dev"}` ;
- `etat/projet` : `derniere_mise_a_jour` = date du jour.
Sinon : le dire à JB en fin de session, la session cloud fera la mise à jour à partir du fichier `sprint-status.yaml`.

## Ce que JB fait lui-même
1. Coller le prompt de démarrage dans Claude Code, ouvert dans `C:\Users\JBCHOLAT\Anne Immo\Website` (2 min).
2. Répondre à la question du passage à garder (début, durée) (2 min).
3. Vérifier la vidéo sur ordinateur puis sur téléphone une fois `main` poussée (5 min).
