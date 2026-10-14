---
story: 16.2
epic: 16 — Espace des acheteurs
statut: review
date: 2026-10-14
origine: demande de JB du 2026-10-14 (fil « Vidéo de l'espace vendeur ») : garder la vidéo vendeurs et en faire une pour les acheteurs
---

# Story 16.2 — Vidéo « l'espace acheteur » sur la page Acheter

## Objectif
Montrer concrètement à un acheteur ce qu'il suivra pendant sa recherche avec Anne : les étapes, puis l'espace en ligne, en maquettes. Pendant de la story 15.2 (vendeurs).

## Scénario (52 s, sans son)
1. 0-5,5 s · « Acheter avec Anne » — « Votre recherche, sous vos yeux. » — « Un espace en ligne rien qu'à vous, de votre projet à la remise des clés. »
2. 5,5-16 s · « Huit étapes, toujours dans cet ordre. » : Votre projet, Financement validé, Mandat de recherche, Anne repère, Elle visite en premier, Vos visites, Offre et compromis, Les clés. Les étapes 3 à 8 s'allument : « Votre espace s'ouvre à la signature du mandat de recherche ». Les étapes 4 et 5 reprennent les « quatre temps » de la page Acheter.
3. 16-23,5 s · Onglet Ma recherche : « Où en est votre recherche, à tout moment. » Critères (dont « Financement validé »), étape en cours, prochaine visite ensemble.
4. 23,5-31 s · Onglet Sélection : « Les biens retenus pour vous, avec le pour et le contre. » Trois maisons dessinées, prix, un plus et un moins chacune, l'une « Pas encore en ligne » ; un clic sur « Ça m'intéresse ».
5. 31-38 s · Onglet Visites : « Anne visite en premier. » Compteurs (14 étudiés, 6 visités par Anne) et trois comptes rendus (à voir ensemble, écartée, en réserve).
6. 38-45,5 s · Onglet Le point : « Chaque semaine, le point d'Anne. » Message qui s'écrit mot à mot.
7. 45,5-52 s · « Anne travaille pour vous, pas pour le bien. » (la phrase de la page Acheter, dite à l'acheteur), puis le logo.

## Ce qui est fait
- `site/scripts/video-portail/scene-acheteur.html`, rendu par `node scripts/video-portail.mjs --film acheteur` → `public/video/portail-acheteur.mp4` (1,3 Mo), version téléphone (0,8 Mo), poster.
- Composant commun `src/components/EspaceVideo.astro` (texte + vidéo, lecture quand la vidéo est à l'écran), utilisé par Vendre et Acheter.
- Bloc « Pendant la recherche » sur `/acheter`, entre la recherche accompagnée et les avis ; textes dans `contenu-anne/textes/acheter.yml` (`espace`) et dans l'espace d'édition.
- Affiché sur l'aperçu seulement, comme la vidéo vendeurs.
- La vidéo vendeurs garde sa fin d'origine (refrain de l'accueil) : la remarque de JB du 14/10 sur la fin visait les acheteurs.

## Choix faits par défaut
- **Maisons dessinées**, pas de photos de vrais biens : une sélection montre des biens à vendre, et ceux d'anciens clients n'ont pas été prêtés pour cela.
- **Huit étapes** posées à partir du parcours acheteur de CAP-12 et des quatre temps de la page Acheter ; à valider par Anne.
- « Pas encore en ligne » illustre « les ventes qui ne sont pas encore en ligne » de la page Acheter.

## Vérification (2026-10-14)
- `npm run build` : réussi. `npm run check` : 0 erreur. `node scripts/liens.mjs` : 27 pages, 1 863 liens, 0 cassé.
- Images fixes relues (`--film acheteur --images …`) : position du clic sur « Ça m'intéresse » et hauteur des cartes corrigées.
- Captures : `/mnt/project-files/captures/video-portail/acheter-ordinateur.png`, `acheter-telephone.png` (et `vendre-*`) ; largeur de page = largeur d'écran à 1440 et 390 px.

## Ce qui reste
- Validation des textes et des étapes par Anne, puis décision de JB sur l'ouverture au public (recommandation : quand l'espace client existe).
- Version verticale pour le téléphone, comme pour la vidéo vendeurs.
