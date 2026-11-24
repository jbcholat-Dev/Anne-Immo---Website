# Story 18.28 : retours de JB sur le brief du jour et la barre « Nouveaux »

- Epic : 18 (carnet de contacts). Statut : review.
- Demande : JB, 2026-11-24, après la fusion de la PR n° 274 : « Tout ça, c'est des gens qui se sont inscrits sur le listing des ambassadeurs […] il y a toujours un mur de contacts à 94 nouveaux. »

## Objectif

1. Le brief du jour ne propose plus de rappeler les inscrits au programme ambassadeurs : ce ne sont pas des demandes à traiter.
2. Les appels manqués où Leedflow écrit « Le correspondant n'a pas laissé de message » se rangent dans « Sans suite », comme un appel manqué sans résumé (règle de la story 18.24).

## Ce qui est fait

- `espace/src/server/brief.ts` : les demandes dont la source est `ambassadeur` sont exclues du brief.
- `espace/src/server/leedflow.ts` : `resumeVide` reconnaît le texte de Leedflow pour un appel sans message, même en gras, en capitales, avec ’ ou une ponctuation finale (et « pas de message », « aucun message », « message vocal ») ; il compte comme un résumé vide.
- `espace/src/server/nouveaux.ts` : la règle 18.24 s'en sert (appel manqué, appel trop court, message vocal) ; la carte affiche « Pas de résumé (appel sans message). ».
- `espace/src/server/tri-ia.ts` : un numéro qui n'a que ce texte n'est pas envoyé à l'API.

## Écarts assumés

- Les lignes du brief déjà préparées aujourd'hui restent jusqu'à demain ; « Écarter » les retire.
- Un numéro qui a appelé plusieurs fois sans laisser de message reste dans la barre (règle 18.24 : un numéro qui rappelle remonte).
- Les cartes qui demandent une lecture (résumé réel) attendent le tri par l'API Claude, éteint tant que la fiche légale n'est pas vérifiée.

## Ce qui est vérifié

- `espace` : `npm run build` et `npm run check` : 0 erreur (2026-11-24).
- `node scripts/e2e-tri-et-brief.mjs` (2026-11-24) : tous les constats bons (refait après la revue), dont le nouveau : « **Le correspondant n’a pas laissé de message.** » rangé dans « Sans suite », rien d'envoyé à l'API.

## Revue de code

2026-11-24, skill `bmad-code-review` en session neuve, commit f082f18 relu. Corrections dans le commit suivant.

- « Appel trop court » ne voyait pas le texte de Leedflow (42 caractères) : corrigé.
- Texte reconnu seulement à l'identique (pas en gras, pas avec deux espaces ni « … ») : corrigé, texte nettoyé avant le test ; variante en gras dans l'essai.
- Tri par l'API : un numéro aux seuls « pas laissé de message » aurait été envoyé : corrigé.
- La carte montrait le texte de Leedflow : corrigé, « Pas de résumé (appel sans message). ».
- Un vrai SMS « Pas de message » aurait été rangé : corrigé, un SMS n'est vide que sans texte.
- Le brief lit les cartes rangées si elles ont déjà une proposition du tri : écarté pour l'instant, cas improbable (un résumé vide n'est pas classé vendeur), le tri est éteint.
- Brief : filtre des ambassadeurs vérifié correct (lignes sans demande gardées).

## Ce qui reste

- Allumer le tri par l'API Claude (accord de JB, fiche légale).
