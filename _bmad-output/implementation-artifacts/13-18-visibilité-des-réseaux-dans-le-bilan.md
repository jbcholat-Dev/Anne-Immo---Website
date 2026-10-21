---
story: 13.18
epic: 13 — Espace de travail d'Anne
statut: backlog
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.18 — Visibilité des réseaux sociaux dans le bilan

## Objectif
Mettre l'audience des réseaux d'Anne (abonnés, vues de la semaine) à côté des contacts venus des réseaux, dans le bilan du lundi. Demande de JB du 2026-10-21 (« intégrer le dashboard visibilité réseaux sociaux »). Cadrage validé par JB le même jour.

## Ce qui est à faire
- Le relevé Instagram hebdomadaire existe déjà (routine du lundi, fil « [Pilotage] Tableau de bord visibilité », script `commercial/Réseaux sociaux/outils/releve-hebdo.py`, tableau https://claude.ai/artifact/Tc8zH5vk91s7jvGBT8hcz7). On ne refait pas un deuxième tableau : la routine envoie en plus les chiffres d'Anne à l'espace.
- L'envoi passe par l'accès Claude de la story 13.17 (`/api/claude/…`, jeton de service Cloudflare Access) : une semaine = abonnés, publications, vues, par réseau.
- Le bilan affiche la courbe des abonnés et les vues de la période à côté des contacts du canal « réseaux » et de leur coût (story 13.17).

## Dépend de
- Story 13.17 (accès Claude et coûts).

## Ce qui est vérifié
Rien encore.

## Ce qui reste
- Tout, après la story 13.17. Ajuster la routine du lundi avec le fil « [Pilotage] Tableau de bord visibilité ».
