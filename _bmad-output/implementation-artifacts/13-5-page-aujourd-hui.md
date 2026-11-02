---
story: 13.5
epic: 13 — Espace de travail d'Anne
statut: done
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.5 — Page « Aujourd'hui »

## Objectif
Qu'Anne ouvre sa journée sur qui rappeler, dans l'ordre : d'abord les nouveaux contacts, puis ses rappels du jour, puis sa prospection de la semaine (maquette v2, écran 1).

## Ce qui est fait (2026-10-21)
- **`/`, la page d'ouverture de l'espace** (elle renvoyait jusqu'ici vers `/gestion`). « Bonjour Anne », la date, puis trois blocs :
  - **À rappeler maintenant** : les contacts « À qualifier » dont le rappel est dû, **le plus ancien d'abord**, avec le temps écoulé (« il y a 2 h », « hier, 18 h », « il y a 3 jours »). Chaque carte montre l'origine précise (« Boîtage Sciez, … », « Site : guide »), le parcours et la dernière demande ou note. Elle porte deux boutons : **Appeler**, en un geste (ou Écrire s'il n'y a pas de téléphone), et **Qualifier**. La plus ancienne est encadrée en terracotta.
  - **Rappels prévus** : les contacts suivis dont la prochaine action tombe aujourd'hui ou avant, avec « En retard » quand elle est passée, et les contacts en sommeil dont la date de réveil est arrivée. Chaque carte montre la dernière note, comme raison d'appeler, et porte deux boutons : Appeler, et « Noter la suite » (la page de qualification).
  - **Trouver des vendeurs cette semaine** : les prescripteurs dont la relance est due, avec sa raison, et les **secteurs de boîtage à refaire**, dont le dernier passage date d'au moins 6 semaines (avec les mots déposés et le nombre de contacts amenés).
- Menu : « Aujourd'hui » ajouté en premier, en bas sur téléphone et en haut sur ordinateur. Les pages des demandes, encore celles du site, ont un lien « ← Retour à l'espace » (réglage `retour` du gabarit `Gestion.astro`, sans effet sur le `/gestion` du site).
- Requêtes : `journee` dans `espace/src/server/pipeline.ts`, en un seul aller-retour vers la base.

## Écarts assumés
- La maquette montre un résumé Leedflow de l'appel et une « raison d'appeler » tirée de l'actualité (une maison vendue dans la rue). La v1 affiche la dernière demande, note ou qualification. Le résumé Leedflow arrive avec la story 13.10 ; les raisons tirées de l'actualité ne sont pas prévues.
- La carte « Lettre "j'ai un acheteur" » viendra avec la story 13.15 (acheteurs actifs).
- 6 semaines avant de repasser dans un secteur : choix par défaut, à confirmer avec Anne (`BOITAGE_A_REFAIRE_JOURS`).
- Les demandes déjà reçues avant la mise en ligne de la story 13.4 arrivent « À qualifier » à leur date d'origine. Elles apparaissent donc en tête d'« Aujourd'hui » avec leur ancienneté, jusqu'à ce qu'Anne les qualifie ou les classe perdues.

## Ce qui est vérifié (2026-10-21)
- `espace` : `npm run build`, `npm run check` (0 erreur). `site` : `astro check` (0 erreur), `npm run build`, `node scripts/e2e-gestion.mjs` (tous les constats bons après l'ajout du lien de retour).
- `node scripts/e2e-espace.mjs` : **tous les constats bons**, dont :
  - l'accueil montre la demande du site à rappeler ;
  - nouveaux contacts en tête, le plus ancien d'abord, avec Appeler et Qualifier ;
  - un contact « pas joint » à rappeler demain n'y est pas ;
  - rappel en retard signalé, contact en sommeil à réveiller présent, rien de ce qui est prévu plus tard ;
  - le secteur passé il y a plus de 6 semaines est à refaire, pas celui du jour ;
  - le prescripteur à relancer apparaît avec sa raison ;
  - lien de retour depuis les demandes ;
  - pas de débordement sur téléphone ni sur ordinateur (captures `espace/.verif/espace-aujourdhui-*.png`).

## Ce qui reste
- ~~JB : fusionner la PR~~ PR #163 fusionnée le 2026-10-21.
- Anne : ouvrir l'espace sur son téléphone le matin et dire si l'ordre lui convient.
