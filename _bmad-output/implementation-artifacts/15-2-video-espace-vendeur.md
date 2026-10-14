---
story: 15.2
epic: 15 — Portail des vendeurs sous mandat
statut: review
date: 2026-10-11
origine: demande de JB du 2026-10-11 (fil « Vidéo de l'espace vendeur »)
---

# Story 15.2 — Vidéo « l'espace vendeur » sur la page Vendre

## Objectif
Montrer concrètement à un vendeur, avant qu'il signe, ce qu'il suivra de sa vente : les étapes, puis l'espace en ligne (avancement, visites, marché, point de la semaine), en maquettes.

## Scénario (52 s, sans son)
1. 0-5,5 s · « Vendre avec Anne » — « Votre vente, sous vos yeux. » — « Un espace en ligne rien qu'à vous, de la signature du mandat à celle de l'acte. »
2. 5,5-16 s · « Huit étapes, toujours dans cet ordre. » La ligne d'horizon de la charte trace la frise : Premier échange, Visite du bien, Stratégie et estimation, Mandat exclusif, Photos et annonce, Visites et offres, Compromis, Signature chez le notaire. Les étapes 4 à 8 passent en bleu : « Votre espace s'ouvre à la signature du mandat ».
3. 16-23,5 s · Le portail apparaît, onglet Avancement : « Où en est votre vente, à tout moment. » Étapes cochées avec dates, « Visites et offres » en cours, prochain rendez-vous.
4. 23,5-31 s · Onglet Visites : « Chaque visite, avec le retour des acheteurs. » Compteurs, trois visites avec profil (sans nom) et retour.
5. 31-38 s · Onglet Marché : « Le marché autour de chez vous, en chiffres réels. » Ventes comparables de la commune (DVF), médiane, place de la maison.
6. 38-45,5 s · Onglet Le point : « Chaque semaine, le point d'Anne. » Message qui s'écrit mot à mot.
7. 45,5-52 s · « Votre vente, suivie de bout en bout. Vous savez toujours où elle en est. », puis le logo. (Le refrain de l'accueil, prévu d'abord, est remplacé à la demande de JB du 2026-10-14 : il parle moins aux vendeurs.)

## Ce qui est fait
- Animation écrite en HTML (`site/scripts/video-portail/scene.html`), rendue image par image et encodée par `site/scripts/video-portail.mjs` (Playwright + ffmpeg, déjà dans le projet) : `public/video/portail-vendeur.mp4` 1,3 Mo, version téléphone 0,8 Mo, poster.
- Bloc « Après la signature » sur `/vendre`, entre les deux portes et le formulaire ; textes dans `contenu-anne/textes/vendre.yml` (`espace`) et dans l'espace d'édition (`public/admin/config.yml`), schéma dans `src/content.config.ts`.
- Affiché sur l'aperçu seulement. Sans pastille « À valider par Anne » depuis le 2026-10-14 : la story 8.17 a retiré toutes les pastilles du site.
- `site/README.md` § « Vidéo de l'espace vendeur ».

## Choix faits par défaut
- **Les huit étapes** sont celles de CAP-12 (parcours vendeur) complétées après le mandat (photos et annonce, compromis, notaire). À valider par Anne avec ses mots, comme les étapes de CAP-12.
- **Données inventées et signalées** : « Maquette · exemple fictif » à l'écran, maison à Thonon-les-Bains, chiffres d'exemple. Le « point de la semaine » est signé d'Anne : dans le portail réel, Claude le rédige et Anne le relit avant envoi (réponse de JB du 2026-10-11, story 15.1).
- **Pas sur le site public** tant que le portail n'existe pas : montrer un service pas encore construit à des vendeurs est une promesse ; JB décide quand l'ouvrir.

## Vérification (2026-10-11)
- `npm run build` : réussi. `npm run check` : 0 erreur. `node scripts/liens.mjs` : 26 pages, 1 516 liens, 0 cassé.
- Images fixes de la vidéo relues (`node scripts/video-portail.mjs --images …`) : un chevauchement des libellés « médiane » / « votre maison » corrigé.
- Captures du bloc : `/mnt/project-files/captures/video-portail/vendre-ordinateur.png` et `vendre-telephone.png` ; pas de débordement horizontal (largeur de page = largeur d'écran à 1440 et 390 px).

## Ce qui reste
- 2026-10-14 : JB valide le scénario, sauf la fin (refrain de l'accueil), remplacée par une phrase propre aux vendeurs.
- Validation des textes par Anne (vidéo et bloc), puis décision de JB sur l'ouverture au public.
- Sur téléphone, la vidéo 16:9 est petite (les maquettes se lisent mal à 390 px) : une version verticale dédiée est recommandée si JB valide le scénario.
