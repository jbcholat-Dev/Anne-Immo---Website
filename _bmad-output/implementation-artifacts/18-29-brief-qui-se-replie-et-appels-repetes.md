# Story 18.29 : brief qui se replie, appels manqués répétés rangés

- Epic : 18 (carnet de contacts). Statut : review.
- Demande : JB, 2026-11-24 au soir, après la PR n° 278 : « On est passé à 54. Par contre, une fois que tu cliques sur le brief, je me retrouve avec ce truc-là au milieu de la page, ça ne part pas. […] L'ergonomie de l'outil, ce n'est pas ça. » Et une capture de la barre « Nouveaux » : beaucoup de numéros inconnus avec 2 ou 3 appels manqués sans message.

## Objectif

1. Une ligne décidée du brief disparaît. « Annuler » reste sous le brief juste après le geste. Quand tout est décidé, le brief tient en une ligne : « Brief du jour : tout est décidé ».
2. Un numéro qui n'a laissé que des appels manqués sans message, même plusieurs, se range dans « Sans suite » (« 3 appels manqués sans message »). Il remonte dès qu'il laisse un message ou qu'Anne lui parle.

## Ce qui est fait

- `espace/src/pages/index.astro` : titre « N décisions à prendre », lignes décidées cachées, en-tête allégé (plus de « à décider » en double).
- `espace/src/islands/brief.ts` : la ligne disparaît au geste ; message « Prénom N. : écartée pour 7 jours. [Annuler] » sous le brief ; titre recompté.
- `espace/src/server/nouveaux.ts` : `raisonDeRanger` range un numéro dont tous les échanges sont des appels reçus manqués sans message.

## Écarts assumés

- Une ligne décidée un autre jour, ou avant de recharger la page, ne s'annule plus depuis la page (le geste se refait sur la fiche).

## Ce qui est vérifié

- `espace` : `npm run build` et `npm run check` : 0 erreur (2026-11-24).
- `node scripts/e2e-tri-et-brief.mjs` : tous les constats bons, dont « la ligne décidée disparaît, Annuler la fait revenir ».
- `E2E_1824_SEUL=1 node scripts/e2e-espace.mjs` (partie 18.24 mise à jour) : 4 constats 18.24 bons ; deux appels manqués sans message rangés ; un numéro qui rappelle et parle remonte (2026-11-24).
- `raisonDeRanger` essayé seul sur 7 cas (2, 3 appels manqués vides ; un des deux avec message ; manqué puis répondu ; manqué puis appel d'Anne ; un seul manqué ; numéro connu) : tous bons.
- `e2e-espace.mjs` en entier : le bloc « inscription ambassadeur » ajoutait des colonnes que la migration 0022 crée déjà, et l'essai s'arrêtait là ; ces deux ajouts et leur retrait sont enlevés (corrigé ici). L'essai va ensuite jusqu'à 316 constats bons, puis s'arrête sur un défaut ancien sans lien avec cette story (constat 18.4 « la page Contacts est l'accueil », ligne 3052 : l'accueil est devenu « Aujourd'hui »). Ce défaut reste à reprendre dans une story à part.

## Revue de code

À faire : skill `bmad-code-review` en session neuve.
