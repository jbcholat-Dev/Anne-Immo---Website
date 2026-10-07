---
story: 7.16
epic: 7 — Contenu d'Anne
statut: done
date: 2026-10-07
---

# Story 7.16 — Portrait d'Anne dans l'espace d'édition

## Objectif
Demande de JB du 2026-10-07 : « je veux pouvoir insérer une photo et non une vidéo dans le portrait. Visiblement je ne peux pas au travers du CMS ». La page À propos de l'espace d'édition n'avait qu'un champ « Vidéo » (texte) ; l'emplacement A-04 « portrait · 1600 px vertical » restait un bloc réservé sans moyen de le remplir.

## Ce qui est fait
- Espace d'édition (`site/public/admin/config.yml`) : champ image « Portrait d'Anne » dans la collection Pages, après « Vidéo ». La photo est réduite en WebP 3 200 px et rangée dans `contenu-anne/photos/` (dossier médias global).
- Schéma (`site/src/content.config.ts`) : champ `portrait` facultatif sur les pages.
- `site/scripts/images.mjs` : le dossier `contenu-anne/photos/` accepte aussi `.webp` et `.png` (formats envoyés par l'espace d'édition).
- `site/src/lib/contenu.ts` : `portraitAnne()` lit le champ de la page À propos et rend la clé d'image dérivée, ou rien.
- Nouveau composant `site/src/components/Portrait.astro` : la photo (cadrée sur le haut, coins arrondis) si elle existe, sinon le bloc réservé A-04 comme avant.
- Branché aux trois emplacements A-04 : À propos (ordinateur et téléphone), accueil bloc « Anne » (ordinateur et téléphone), diagnostic (vignette).
- Documents : `site/README.md` (§ Espace d'édition, blocs réservés), `contenu-anne/portrait/README.md` (marche à suivre), epics, statut de sprint. Story 7.15 passée en « done » (PR #16 fusionnée le 2026-10-05).

## Vérification
Avec une photo d'essai (1200×1600, ajoutée puis retirée avant le commit) :
- `npm run build` : 24 pages ; `a-propos.html`, `index.html`, `diagnostic.html` contiennent la photo, plus de bloc A-04.
- `npm run check` : 0 erreur ; `scripts/liens.mjs` : 25 pages, 1478 liens, 0 cassé.
- `npm run verif` : aucune erreur console ; captures À propos ordinateur et téléphone : la photo occupe le cadre à la place du bloc.
- `scripts/ecrans.mjs` : aucun débordement signalé.
Sans photo (état livré) : le bloc réservé A-04 reste affiché, comme avant.

## Correctif
Le vrai envoi (PR n° 27) a montré que l'espace d'édition range la photo à côté de la page, pas dans `contenu-anne/photos/` : corrigé par la story 7.18.

## Ce qui reste
- JB ou Anne : mettre le vrai portrait par l'espace d'édition une fois cette demande fusionnée, puis fusionner la demande créée par l'enregistrement.
