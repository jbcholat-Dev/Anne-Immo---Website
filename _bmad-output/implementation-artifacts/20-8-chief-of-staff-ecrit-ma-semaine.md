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
- `espace/src/pages/semaine.astro` : sous chaque objectif retouché, « Réglé par le chief of staff le …, avant : N ». Cette mention reste dans le bloc replié des objectifs : rien de plus en vue, car JB juge l'espace déjà chargé (2026-11-24). Quand Anne change un objectif, sa trace part ; les objectifs qu'elle ne change pas la gardent. Les lignes du chief of staff portent sa signature dans « Ce qui a été noté », et Anne peut les retirer.
- `espace/scripts/claude-espace.mjs` : commandes `semaine`, `objectifs`, `noter`, `retirer`.
- Aucune migration.

## Écarts assumés

- Objectifs : un seul jeu en vigueur, réglé pour les semaines à venir, et non un objectif par semaine datée. C'est le modèle de la page (20.7) ; le mois et l'année en découlent.
- Le texte du brief de la semaine (point 3 de la demande) n'est pas fait ici. Il revient au fil « tri IA des appels et brief du jour », qui construit le bloc du brief et sa migration 0027.
- Un passage de boîtage noté par le chief of staff se corrige dans le tableau du boîtage, par Anne : la table n'a pas de colonne « par ».

## Ce qui est vérifié

- `espace` : `npm run build` et `npm run check` : 0 erreur (2026-11-24).
- `E2E_2008_SEUL=1 node scripts/e2e-espace.mjs` (2026-11-24) : 9 constats sur 9 (rejoué après la revue) :
  - objectifs partiels, avec la valeur d'Anne gardée après deux retouches ;
  - 12 écritures invalides refusées, dont `toString`, `constructor`, le champ note, un nom ou un numéro dans la ville, un champ inconnu et une date future ;
  - effort, lead, rendez-vous et boîtage signés ;
  - la ligne d'Anne n'est pas retirée, la sienne l'est ;
  - relecture sans lieu, précision ni compte ;
  - page : « Réglé par le chief of staff le mar. 24 nov. (avant : 12) », boîtage signé ; quand Anne change un objectif, sa trace part et les autres restent ;
  - remise à la valeur d'avant : la trace part ;
  - un objectif inchangé n'écrit rien ;
  - adresse fermée au compte d'Anne (403).
- `E2E_2007_SEUL=1` rejoué : 17 sur 17.

## Revue de code

Revue du 2026-11-24, skill `bmad-code-review` en session neuve, commit relu d10e61f. Rien de bloquant côté sécurité. Corrections dans le commit qui suit.

1. Boîtage du chief of staff non signé sur la page : corrigé, la signature est lue dans le commentaire du passage. Le chief of staff relit aussi ses boîtages comme les siens.
2. Ville en texte libre : corrigé, nom de commune seulement (lettres, 40 caractères, ni chiffre, ni « chez », ni civilité). Les champs inconnus sont refusés.
3. Écrasement si Anne et le chief of staff enregistrent à la même milliseconde : écarté, fenêtre de quelques millisecondes et deux écrivains seulement.
4. Trace trompeuse après un retour à la valeur d'avant : corrigé, la trace part et la valeur reprend sa signature d'avant.
5. Un enregistrement d'Anne effaçait toutes les traces : corrigé, seules les clés qu'elle change sont écrites.
6. Taille du corps contrôlée après lecture : corrigé, refus d'abord sur la longueur annoncée.
7. Pas de plafond d'écritures : écarté, le seul écrivain est le script de Claude, lancé à la main après un brief.
8. Essai : `finally` ajouté pour le nettoyage ; cas « valeur de départ » couvert.

## Ce qui reste

- PR, accord de JB, fusion.
