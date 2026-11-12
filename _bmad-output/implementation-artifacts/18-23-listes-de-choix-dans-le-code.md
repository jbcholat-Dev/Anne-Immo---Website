# Story 18.23 : listes de choix des contacts vérifiées par le code

Epic 18 (le carnet de contacts). Statut : backlog. Date : 2026-11-12. Origine : décision de JB (AD-35), fil « Espace de travail d'Anne ».

## Objectif

Qu'un nouveau choix demandé par Anne (une source, un projet, une température) soit un changement de code, sans recopier la table des contacts. Aujourd'hui chaque nouveau choix demande une reconstruction de `contact` (0020, 0025).

## À faire

- Migration de reconstruction de `contact` (méthode de 0025, avec ses 10 tables liées et `contact_source.lieu`/`mois`) qui retire les CHECK de listes : `projet`, `temperature`, `canal`, cohérence projet / température. Garder les CHECK de forme (dates, nombres).
- Vérifier que chaque écrivain (`site/src/server/contacts.ts`, `espace/src/server/carnet.ts`, `pipeline.ts`, `import.ts`, `nouveaux.ts`) refuse une valeur hors liste.
- Répétition sur une base à part, revue de code en session neuve, accord écrit de JB avant la fusion, point de retour noté.
- Le mieux : la faire partir avec la prochaine demande d'Anne qui touche une liste.

## Ce qui reste

Tout.
