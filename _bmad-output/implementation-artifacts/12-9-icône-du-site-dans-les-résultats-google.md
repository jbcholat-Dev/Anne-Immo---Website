# Story 12.9 : Icône du site dans les résultats Google

Epic 12, Lancement public. Ouverte le 2026-10-13 à la demande de JB (« je voudrais le logo »), avec une capture du résultat Google de `annevialtissot.fr › a-propos` montrant un globe gris à la place de l'icône du site.

## Objectif

Que Google affiche le symbole d'Anne (cercle-horizon bleu et terracotta) à côté de son site dans les résultats, au lieu du globe générique.

## Constat (2026-10-13)

- Le site déclarait déjà une icône : `favicon.svg`, le symbole de la charte, accessible (réponse 200, `robots.txt` autorise tout, pas d'interdiction d'indexation).
- Google accepte le SVG, mais `/favicon.ico` répondait « page introuvable » et aucune version en image classique n'existait. Google recommande un carré de 48 px ou d'un multiple de 48.
- Le site est en ligne depuis le 2026-10-11 : le globe est surtout le signe que Google n'a pas encore exploré l'icône. Il le fait à son rythme, séparément des pages (quelques jours à quelques semaines).

## Ce qui est fait

- `site/public/` : `favicon.ico` (16, 32 et 48 px), `favicon-96.png`, `favicon-192.png`, `apple-touch-icon.png` (180 px, symbole sur fond blanc), tous tirés de `favicon.svg`, sans changer le dessin.
- `site/src/layouts/Base.astro` et `Gestion.astro` : les cinq déclarations d'icône, le `.ico` en premier.
- `site/README.md` § Référencement : l'icône et ses fichiers.

Pour refaire les images après un changement de `favicon.svg`, depuis `site/` :

```bash
node -e 'const sharp=require("sharp"),fs=require("fs"),svg=fs.readFileSync("public/favicon.svg");(async()=>{for(const s of [96,192])await sharp(svg,{density:600}).resize(s,s).png().toFile(`public/favicon-${s}.png`);await sharp(svg,{density:600}).resize(152,152).extend({top:14,bottom:14,left:14,right:14,background:"#fff"}).flatten({background:"#fff"}).png().toFile("public/apple-touch-icon.png");for(const s of [16,32,48])await sharp(svg,{density:600}).resize(s,s).png().toFile(`/tmp/ico-${s}.png`)})()'
convert /tmp/ico-16.png /tmp/ico-32.png /tmp/ico-48.png public/favicon.ico
```

## Vérifié (2026-10-13)

- `npm run build` : réussi ; les cinq fichiers sont dans `dist/client/` et les cinq balises dans `dist/client/index.html`.
- `npm run check` : 0 erreur.
- `node scripts/liens.mjs` : 27 pages, 1863 liens, 0 cassé.
- Images relues à l'œil : même symbole que `favicon.svg`, net en 96 px.

## Ce qui reste

- Fusion par JB (la PR change le site).
- JB : dans Google Search Console, « Inspection de l'URL » sur `https://annevialtissot.fr/`, puis « Demander une indexation ». Ensuite attendre : Google met l'icône à jour à son rythme.
- Clore la story quand le symbole apparaît dans les résultats.
