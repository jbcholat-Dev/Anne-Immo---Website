# Story 18.29 : brief qui disparaît une fois décidé, appels manqués répétés rangés

- Epic : 18 (carnet de contacts). Statut : done (PR n° 282 fusionnée par JB le 2026-11-24).
- Demande : JB, 2026-11-24 au soir, après la PR n° 278 : « On est passé à 54. Par contre, une fois que tu cliques sur le brief, je me retrouve avec ce truc-là au milieu de la page, ça ne part pas. […] L'ergonomie de l'outil, ce n'est pas ça. » Et une capture de la barre « Nouveaux » : beaucoup de numéros inconnus avec 2 ou 3 appels manqués sans message.
- Puis, le même soir, sur une capture du brief aux 7 lignes écartées : « ce truc-là, c'est une énorme verrue au milieu. Est-ce que tu peux me l'enlever ? »

## Objectif

1. Une ligne décidée du brief disparaît. « Annuler » reste sous le brief juste après le geste. Quand tout est décidé, il ne reste que « Annuler » jusqu'au rechargement, puis le brief n'est plus affiché du tout (second retour de JB, qui remplace la ligne « tout est décidé » prévue d'abord).
2. Un numéro qui n'a laissé que des appels manqués sans message, même plusieurs, se range dans « Sans suite » (« 3 appels manqués sans message »). Il remonte dès qu'il laisse un message ou qu'Anne lui parle.

## Ce qui est fait

- `espace/src/pages/index.astro` : titre « N décisions à prendre », lignes décidées cachées, en-tête allégé (plus de « à décider » en double) ; brief non affiché quand tout est décidé.
- `espace/src/islands/brief.ts` : la ligne disparaît au geste ; message « Prénom N. : écartée pour 7 jours. [Annuler] » sous le brief ; titre recompté ; la dernière décidée, en-tête et liste cachés.
- `espace/src/islands/nouveaux.ts` : texte de « Sans suite » : « Un numéro qui laisse un message, ou à qui vous parlez, remonte. »
- `espace/src/server/nouveaux.ts` : `raisonDeRanger` range un numéro dont tous les échanges sont des appels reçus manqués sans message.

## Écarts assumés

- Seule la dernière décision s'annule depuis la page (le bouton « Annuler » sous le brief) ; une décision plus ancienne ou d'avant le rechargement se refait sur la fiche. Voulu : pas de liste de boutons qui revienne encombrer l'écran.

## Ce qui est vérifié

- `espace` : `npm run build` et `npm run check` : 0 erreur (2026-11-24).
- `node scripts/e2e-tri-et-brief.mjs` : tous les constats bons, dont « la ligne décidée disparaît, Annuler la fait revenir ; la dernière décidée, seul Annuler reste » et « tout décidé, le brief n'est plus sur la page au rechargement, la barre Nouveaux reste » (2026-11-24, après la revue). Un passage précédent a vu une fois le constat « dépôt refusé aux comptes d'Anne et de JB » en échec, non reproduit sur trois passages ; le constat affiche désormais les deux codes reçus pour le diagnostiquer s'il revient.
- `E2E_1824_SEUL=1 node scripts/e2e-espace.mjs` (partie 18.24 mise à jour) : 4 constats 18.24 bons ; deux appels manqués sans message rangés ; un numéro qui rappelle et parle remonte (2026-11-24).
- `raisonDeRanger` essayé seul sur 7 cas (2, 3 appels manqués vides ; un des deux avec message ; manqué puis répondu ; manqué puis appel d'Anne ; un seul manqué ; numéro connu) : tous bons.
- `e2e-espace.mjs` en entier : le bloc « inscription ambassadeur » ajoutait des colonnes que la migration 0022 crée déjà, et l'essai s'arrêtait là ; ces deux ajouts, leur retrait et la suspension du contrôle de la source sont enlevés (corrigé ici). L'essai va ensuite jusqu'à 316 constats bons, puis s'arrête sur un défaut ancien sans lien avec cette story (constat 18.4 « la page Contacts est l'accueil », ligne 3052 : l'accueil est devenu « Aujourd'hui »). Ce défaut reste à reprendre dans une story à part.

## Revue de code

Revue adverse BMAD (`bmad-code-review`) en session neuve, 2026-11-24, commit 702595c relu contre ff1a731 :

1. Une annulation qui échoue faisait disparaître le bouton « Annuler » : corrigé (le message d'erreur garde le bouton).
2. Seule la dernière décision s'annule depuis la page, contrairement à ce que disait la story : écarté, voulu (pas de liste de boutons) ; écart réécrit plus haut.
3. Le curseur clavier se perdait après un geste : corrigé (il va sur « Annuler », ou sur la ligne revenue).
4. Texte de « Sans suite » contraire à la nouvelle règle, commentaire de `raisonDeRanger` à jour : corrigé.
5. Brief tout décidé sur plusieurs lignes et un trait : corrigé, puis dépassé par le second retour de JB (le brief n'est plus affiché du tout).
6. `PRAGMA ignore_check_constraints` devenu inutile dans l'essai ambassadeur : corrigé (retiré, la contrainte de la vraie table est vérifiée).

Les corrections, et le second retour de JB, sont dans le commit qui suit 702595c.
