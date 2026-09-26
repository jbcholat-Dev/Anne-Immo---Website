# Vidéos

Les vidéos vivent **ici, mais hors Git** (dossier ignoré : elles ne partent jamais sur GitHub). L'inventaire est dans `liens.md`, avec une colonne pour le lien de partage (OneDrive) quand une autre machine doit les récupérer.

## Pour déposer une nouvelle vidéo
1. Copie le fichier original ici, nom en minuscules avec tirets : `commune-4k.mp4`.
2. Ajoute une ligne dans `liens.md` (taille, durée, ce qu'on y voit).
3. Si tu la partages par OneDrive, colle le lien dans la dernière colonne.

## Pour l'ouverture du site
La vidéo qui ouvre l'accueil est `ouverture-source.mp4` (ici, hors Git — c'est le montage d'Anne, 95 s, diffusé en entier et en boucle, sans son). Pour la remplacer :
1. Déposer le nouveau montage ici sous le même nom `ouverture-source.mp4` (paysage 16:9, 1920 px de large minimum).
2. `cd site && npm run video` : produit `site/public/video/ouverture.mp4` + `.webm` (versions web, 1440 px, sans son) et `contenu-anne/photos/ouverture-poster.jpg` (première image, affichée pendant le chargement).
3. `npm run images` : dérive le poster en formats web.
4. Commiter les dérivés (ils sont petits) — jamais la source.
