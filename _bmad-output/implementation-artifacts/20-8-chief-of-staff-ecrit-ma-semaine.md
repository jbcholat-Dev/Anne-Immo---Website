# Story 20.8 : le chief of staff met à jour « Ma semaine »

- Epic 20 (la semaine et le bilan). Statut : review. Date : 2026-11-24.
- Demande de JB du 2026-11-24 (fil chief of staff) : « que le Chief of Staff puisse notamment mettre à jour l'espace d'Anne […] les objectifs de la semaine, au niveau de ses canaux de prospection, ce qui a été fait […] si on fait un brief ensemble, le répercute directement, qu'on n'est pas à la main à aller faire des choses ».

## Objectif

Après un brief avec JB, le chief of staff (Claude, par son badge) écrit lui-même dans « Ma semaine » les objectifs et ce qui a été fait. Anne voit qui a écrit quoi, et peut tout reprendre.

## Ce qui est fait

- `espace/src/pages/api/claude/prospection.ts` (nouvelle adresse, badge de Claude seulement) :
  - GET : les objectifs (valeur, qui, quand, valeur d'avant) et les lignes de la semaine (id, canal, jour, quoi, nombre, qui). Pas de lieu, pas de précision, pas de compte : « espace » à la place du compte d'Anne ou de JB.
  - POST `objectifs` : seules les clés données et qui changent sont écrites. La valeur d'avant est gardée sous `avant:<clé>`, une seule fois : c'est la valeur d'Anne, même après plusieurs retouches.
  - POST `effort`, `lead`, `rdv` : mêmes règles que la page (`lireSaisie`). Chaque appel ajoute une ligne signée « chief of staff », sans rien écraser. Un boîtage devient un passage du tableau du boîtage, avec le commentaire « Noté par le chief of staff ». Le champ libre « note » est refusé, parce qu'il pourrait recevoir un nom.
  - POST `retirer` : seulement une ligne notée par le chief of staff. Une ligne d'Anne répond 404.
- `espace/src/server/prospection.ts` : `PAR_CHIEF`, `enregistrerObjectifs` partiel avec trace, `lireReglages`, `lireObjectifsJson`, `lireSaisieJson`, `retirerSaisieDe`.
- `espace/src/pages/semaine.astro` : sous chaque objectif retouché, « Réglé par le chief of staff le …, avant : N ». Le titre du bloc des objectifs signale « retouchés par le chief of staff ». Quand Anne réenregistre les objectifs, la trace part, puisqu'elle les a revus. Les lignes du chief of staff portent sa signature dans « Ce qui a été noté », et Anne peut les retirer.
- `espace/scripts/claude-espace.mjs` : commandes `semaine`, `objectifs`, `noter`, `retirer`.
- Aucune migration.

## Écarts assumés

- Objectifs : un seul jeu en vigueur, réglé pour les semaines à venir, et non un objectif par semaine datée. C'est le modèle de la page (20.7) ; le mois et l'année en découlent.
- Le texte du brief de la semaine (point 3 de la demande) n'est pas fait ici. Il revient au fil « tri IA des appels et brief du jour », qui construit le bloc du brief et sa migration 0027.
- Un passage de boîtage noté par le chief of staff se corrige dans le tableau du boîtage, par Anne : la table n'a pas de colonne « par ».

## Ce qui est vérifié

- `espace` : `npm run build` et `npm run check` : 0 erreur (2026-11-24).
- `E2E_2008_SEUL=1 node scripts/e2e-espace.mjs` (2026-11-24) : 8 constats sur 8 :
  - objectifs partiels, avec la valeur d'Anne gardée après deux retouches ;
  - 9 écritures invalides refusées, dont `toString`, `constructor`, le champ note et une date future ;
  - effort, lead, rendez-vous et boîtage signés ;
  - la ligne d'Anne n'est pas retirée, la sienne l'est ;
  - relecture sans lieu, précision ni compte ;
  - page : « Réglé par le chief of staff le mar. 24 nov. (avant : 12) », et la trace part quand Anne réenregistre ;
  - un objectif inchangé n'écrit rien ;
  - adresse fermée au compte d'Anne (403).
- `E2E_2007_SEUL=1` rejoué : 17 sur 17.

## Revue de code

(à faire en session neuve avant de proposer la PR à JB)

## Ce qui reste

- Revue de code, PR, accord de JB, fusion.
