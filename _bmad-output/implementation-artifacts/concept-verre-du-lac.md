---
type: essai de concept (branche claude/concept-liquid-glass, ne pas fusionner tel quel)
epic: 8 — Site : finitions
date: 2026-10-10
demande: JB, fil Structure et visuel (« démarre une branche en essayant d'intégrer le Liquid Glass »)
---

# Concept « Verre du lac » (Liquid Glass)

## Objectif
Tester l'effet « verre » d'Apple sur le site actuel, sans toucher au contenu ni à la structure.
C'est une première réponse à la note de créativité de l'accueil (5,5/10, notation du 2026-10-08 : `/mnt/project-files/notation/accueil-2026-10-08/`).

## Ce qui est fait
Tout le concept tient dans `site/src/styles/verre.css`. `Base.astro` le charge, pose `data-concept="verre"` et ajoute un filtre SVG de réfraction. Un concept se retire donc en trois lignes.
- **Fond** : trois nappes de couleur très douces et fixes, bleu du lac et terracotta, sous l'écru, pour qu'il y ait quelque chose à voir à travers le verre.
- **Navigation** : une gélule de verre qui flotte, fumée sur la vidéo et claire ensuite. Le menu « À propos » est en verre aussi.
- **Ouverture** : le nom, la phrase et les deux boutons posés directement sur la vidéo, sans plaque (retour de JB du 2026-10-10 : la plaque de verre « c'est trop ») ; un voile plus sombre en bas à gauche et une ombre douce sous le texte gardent la lecture. Le bandeau des avis devient une barre de verre bleu qui chevauche le bas de la vidéo.
- **Ventes** : cartes de verre empilées ; la carte du dessous se voit floutée à travers celle du dessus. Cela corrige aussi le défaut noté le 2026-10-08, où deux cartes semblaient n'en faire qu'une.
- **Méthode, avis, diagnostic** : piliers, cartes d'avis et tuiles en verre, sur des taches de couleur.
- **Réfraction**, c'est-à-dire le bord du verre qui déforme légèrement ce qui passe derrière : seulement dans Chrome et Edge, les seuls navigateurs qui savent faire. Safari et Firefox montrent un verre dépoli simple.
- **Repli** : avec le réglage « réduire la transparence » (iPhone, Mac), ou dans un navigateur sans flou d'arrière-plan, les surfaces redeviennent opaques.

## Vérification
- Build : 26 pages. `npm run check` : 0 erreur. `scripts/liens.mjs` : 1 661 liens, 0 cassé. `scripts/ecrans.mjs` : aucun signalement.
- Captures de l'accueil défilé écran par écran, à 1 440 et 390 px.

## Ce qui reste, si le concept est retenu
- Contraste de la barre de navigation quand elle passe sur le bandeau bleu « Parler à Anne ».
- Appliquer le verre aux autres pages : seuls la navigation et les boutons y sont touchés aujourd'hui.
- En faire une décision de design (D-n), puis une story, avant toute fusion.
