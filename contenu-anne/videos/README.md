# Vidéos

Les vidéos vivent **ici, mais hors Git** (dossier ignoré : elles ne partent jamais sur GitHub). L'inventaire est dans `liens.md`, avec une colonne pour le lien de partage. Depuis le 2026-10-05, les originaux se déposent dans le dossier Google Drive « Contenu site Anne », sous-dossier `Vidéos/` (voir `../README.md`).

## Pour déposer une nouvelle vidéo
1. Copie le fichier original ici, nom en minuscules avec tirets : `commune-4k.mp4`.
2. Ajoute une ligne dans `liens.md` (taille, durée, ce qu'on y voit).
3. Si elle est sur Google Drive, colle le lien de partage dans la dernière colonne.

## Pour l'ouverture du site
Chemin habituel depuis le 2026-10-05 (story 7.15) : Anne dépose le montage dans le Drive « Contenu site Anne », partage le fichier « Tous les utilisateurs disposant du lien », et JB dit à Claude lequel utiliser. Claude le télécharge (accès `drive.usercontent.google.com` ouvert dans l'environnement cloud), puis suit les étapes ci-dessous. L'espace d'édition (/admin) ne gère pas les vidéos : trop lourdes.

La vidéo qui ouvre l'accueil est `ouverture-source.mp4` (ici, hors Git — c'est le montage d'Anne, 52 s depuis le 2026-10-05, diffusé en entier et en boucle, sans son). Pour la remplacer :
1. Déposer le nouveau montage ici sous le même nom `ouverture-source.mp4` (paysage 16:9, 1920 px de large minimum).
2. `cd site && npm run video` (si le montage commence par des images blanches ou noires de transition, les sauter avec `--debut`, ex. `--debut 0.1`) : produit `site/public/video/ouverture.mp4` + `.webm` (versions web, 1440 px, sans son) et `contenu-anne/photos/ouverture-poster.jpg` (première image, affichée pendant le chargement).
3. `npm run images` : dérive le poster en formats web.
4. Commiter les dérivés (ils sont petits) — jamais la source.
