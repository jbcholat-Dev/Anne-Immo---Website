---
story: 8.12
epic: 8 — Structure et visuel
statut: review
date: 2026-10-10
tickets: 90, 94, 95, 99, 101, 102, 104, 105, 106
---

# Story 8.12 — À propos : piliers et étapes en colonnes, et retours d'Anne du 10/10 au soir

## Objectif
Tickets d'Anne du 2026-10-10 sur `/a-propos` (écran 1440 px) :
- n° 90 : « J'aime pas la mise en page des 3 piliers. Est-ce que je peux les avoir en ligne les 1 après les autres ? »
- n° 94 : « enlever la photos à côté de ma méthode. Mettre les 3 piliers (bon sens etc) les uns à côté des autres »
- n° 95 : « Idem mettre 01 Audit 02 Coordination et 03, les uns à côté des autres »

Le n° 94 précise le n° 90 : « en ligne » veut dire côte à côte.

Ajoutés le même soir au même lot :
- n° 99 (À propos) : « J'ai l'impression que la charte graphique V3 Gilda n'est pas appliquée. » JB transmet ensuite la charte à jour (PDF « CHARTE GRAPHIQUE VDEF MODIFIE ») : un des deux terracotta est retiré.
- n° 101 (accueil) : « La ligne sous Anne VIAL-TISSOT s'est enlevée ».
- n° 102 (À propos) : « mettre le bouton Reserver un créneau en bleu ».
- n° 104 (À propos) : « Tout en bas mettre que Conseillère en immobilier (enlever indépendante) ».
- n° 105 (À propos) : « Mettre le curseur rond de mon logo au lieu du doigt ».
- n° 106 (accueil) : « Bouton estimation offerte en intro en noir ».
- n° 103 (RSAC) : traité par la PR n° 80 du fil « Audit avant le lancement » (message de JB du 2026-10-10, 20 h 33), pas ici.

## Ce qui est fait
- L'emplacement photo A-05 « Anne en situation » à côté du titre « Ma méthode » est retiré. Le titre, le sous-titre et l'introduction occupent seuls l'en-tête.
- Les trois piliers sont sur une rangée de trois colonnes, sous un filet. Chaque colonne a son titre au-dessus de son texte.
- Les étapes 01, 02 et 03 de « Concrètement » sont aussi sur trois colonnes, chacune sous un filet fin. Les partenaires de l'étape 02 passent sur deux colonnes de cartes (une seule entre 900 et 1 199 px). Remplacé le même soir par le parcours vertical de la story 8.15 (choix de JB, D-43).
- Les cartes partenaires sont maintenant alignées. Avant, la première ligne était décalée par un espacement hérité.
- Sur téléphone, piliers et étapes restent l'un sous l'autre. « Mon engagement » et « Parlons de votre projet » ne changent pas.
- Regroupement fait dans `site/src/pages/a-propos.astro` : les rangs consécutifs de même sorte forment une rangée. Le texte d'Anne et son découpage (`site/src/lib/contenu.ts`) ne changent pas, et l'espace d'édition fonctionne comme avant.
- Décision D-39 dans `maquettes/lot-3-complet/DECISIONS.md` ; écart noté dans `site/README.md`.
- n° 99 : Gilda Display s'applique bien à tous les titres de la page (vérifié sur la construction). Ce qui changeait vraiment, c'est la charte : un seul terracotta, #A34E30. Il remplace #C4623E partout (jetons du design system, symbole du logo, favicon, SVG et cartes du design system). Décision D-40, qui tranche le point ouvert D-25.
- n° 101 : la ligne signature s'affichait presque noire. Le style visait le tracé à travers `<use>`, qu'un sélecteur CSS n'atteint pas. Le trait se règle maintenant sur le `<svg>` (`global.css`), et la ligne redevient terracotta partout (accueil, À propos, bloc Anne).
- n° 102 : « Réserver un créneau » de « Parlons de votre projet » en bleu Klein (`btn-klein`). Les deux boutons de ce bloc sont aussi alignés.
- n° 104 : pied de page « Conseillère en immobilier — Léman & Chablais — réseau eXp France. » (anglais : « Real-estate advisor »). « agent commercial indépendant » reste dans la ligne légale du bas, car c'est le statut juridique.
- n° 105 : pointeur rond du logo (`public/curseur.svg`, 24 px, bord écru) sur les liens et les boutons.
- n° 106 : « Estimation offerte » en bouton noir, nouvelle classe `btn-noir` (brun encre, survol noir).
- Décisions D-40 et D-41 ; écarts notés dans `site/README.md`.

## Vérification
- Captures de la section « Ma méthode » avant et après, à 1440 et 390 px : `/mnt/project-files/tickets/90-94-95/`.
- `npm run build` : OK.
- `npm run check` : 0 erreur.
- `scripts/liens.mjs` : 26 pages, 1 661 liens, 0 cassé.
- `scripts/ecrans.mjs` : aucun signalement (débordement ou bouton trop petit), à toutes les largeurs.
- Second passage, après les tickets du soir : construction OK, `npm run check` 0 erreur, liens 1 661 / 0 cassé, `scripts/ecrans.mjs` sans signalement, `npm run verif` « Aucune erreur console ».
- Captures dans le même dossier : ouverture avant et après (ligne et boutons), pied de page, « Parlons de votre projet ».

## Ce qui reste
- Accord de JB sur la PR, fusion.
- Fermer les tickets n° 90, 94, 95, 99, 101, 102, 104, 105 et 106 en citant le commit.
- Couleur de la couverture du PDF du guide (`site/scripts/guide-pdf.mjs`, #C4623E) : à passer en #A34E30 après la fusion de la PR n° 80, qui modifie ce même fichier.
- Le bouton noir sur la vidéo sombre de l'ouverture contraste peu : à montrer à Anne.
