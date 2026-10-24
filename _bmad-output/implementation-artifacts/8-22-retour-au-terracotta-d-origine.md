---
story: 8.22
epic: 8 — Structure et visuel
statut: review
date: 2026-10-24
---

# Story 8.22 — Retour au terracotta d'origine

## Objectif
Retour d'Anne transmis par JB le 2026-10-24 : sur le site comme dans son espace, « le terracotta a viré au marron ». Retrouver quand et pourquoi, puis rétablir le terracotta d'origine.

## Cause
Le 2026-10-10 au soir (story 8.12, commit cc845b8, fusionné par la PR n° 96 le 2026-10-11), la décision D-40 a remplacé partout le terracotta #C4623E par le « terracotta profond » #A34E30, plus sombre, en lisant la charte « CHARTE GRAPHIQUE VDEF MODIFIE ». La story 8.16 (commit faeedb0) a fait de même pour le guide PDF, le rapport PDF et les e-mails. L'espace d'Anne prend ses couleurs dans la même feuille que le site, d'où le changement aux deux endroits.

## Ce qui est fait
- `design-system/tokens/tokens.css` : `--avt-terra` revient à #C4623E ; `--avt-terra-deep` garde #A34E30 pour les boutons, les erreurs et les petits libellés (même partage qu'avant le 10/10).
- Logo et symbole (`design-system/assets/*.svg`, `Sprite.astro`), favicon, pointeur, cartes du design system, palette : #C4623E.
- E-mails aux prospects (`email-html.ts`), guide PDF et rapport PDF (scripts relancés : `guide-pdf.mjs`, `rapport-gabarit.mjs`, `email-logo.mjs`) : #C4623E.
- Décision D-47 (annule D-40), `site/README.md` § écarts mis à jour.
- Non touché : scènes des vidéos du portail (`scripts/video-portail/`), qui demanderaient de refaire les vidéos.

## Ce qui est vérifié (2026-10-24)
- Site : `npm run build` OK ; `npm run check` 0 erreur ; liens : 27 pages, 1 863 liens, 0 cassé.
- Espace : `npm run build` OK ; `npm run check` 0 erreur.
- Guide PDF : même texte qu'avant (16 pages, texte identique), seule la couleur change.
- Captures avant (site en ligne, `--avt-terra` = #a34e30) et après (local, #C4623E) : `/mnt/project-files/captures/terracotta/`.

## Ce qui reste
Fusion par JB. Question ouverte : les boutons restent en #A34E30 comme avant le 10/10 ; les passer en #C4623E les rendrait moins lisibles (3,6:1).
