---
story: 8.12
epic: 8 — Structure et visuel
statut: review
date: 2026-10-10
tickets: 90, 94, 95
---

# Story 8.12 — À propos : piliers et étapes en colonnes

## Objectif
Tickets d'Anne du 2026-10-10 sur `/a-propos` (écran 1440 px) :
- n° 90 : « J'aime pas la mise en page des 3 piliers. Est-ce que je peux les avoir en ligne les 1 après les autres ? »
- n° 94 : « enlever la photos à côté de ma méthode. Mettre les 3 piliers (bon sens etc) les uns à côté des autres »
- n° 95 : « Idem mettre 01 Audit 02 Coordination et 03, les uns à côté des autres »

Le n° 94 précise le n° 90 : « en ligne » veut dire côte à côte.

## Ce qui est fait
- L'emplacement photo A-05 « Anne en situation » à côté du titre « Ma méthode » est retiré. Le titre, le sous-titre et l'introduction occupent seuls l'en-tête.
- Les trois piliers sont sur une rangée de trois colonnes, sous un filet. Chaque colonne a son titre au-dessus de son texte.
- Les étapes 01, 02 et 03 de « Concrètement » sont aussi sur trois colonnes, chacune sous un filet fin. Les partenaires de l'étape 02 passent sur deux colonnes de cartes (une seule entre 900 et 1 199 px).
- Les cartes partenaires sont maintenant alignées. Avant, la première ligne était décalée par un espacement hérité.
- Sur téléphone, piliers et étapes restent l'un sous l'autre. « Mon engagement » et « Parlons de votre projet » ne changent pas.
- Regroupement fait dans `site/src/pages/a-propos.astro` : les rangs consécutifs de même sorte forment une rangée. Le texte d'Anne et son découpage (`site/src/lib/contenu.ts`) ne changent pas, et l'espace d'édition fonctionne comme avant.
- Décision D-39 dans `maquettes/lot-3-complet/DECISIONS.md` ; écart noté dans `site/README.md`.

## Vérification
- Captures de la section « Ma méthode » avant et après, à 1440 et 390 px : `/mnt/project-files/tickets/90-94-95/`.
- `npm run build` : OK.
- `npm run check` : 0 erreur.
- `scripts/liens.mjs` : 26 pages, 1 661 liens, 0 cassé.
- `scripts/ecrans.mjs` : aucun signalement (débordement ou bouton trop petit), à toutes les largeurs.

## Ce qui reste
- Accord de JB sur la PR, fusion.
- Fermer les tickets n° 90, 94 et 95 en citant le commit.
