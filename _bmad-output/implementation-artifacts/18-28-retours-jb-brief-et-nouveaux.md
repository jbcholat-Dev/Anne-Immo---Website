# Story 18.28 : retours de JB sur le brief du jour et la barre « Nouveaux »

- Epic : 18 (carnet de contacts). Statut : review.
- Demande : JB, 2026-11-24, après la fusion de la PR n° 274 : « Tout ça, c'est des gens qui se sont inscrits sur le listing des ambassadeurs […] il y a toujours un mur de contacts à 94 nouveaux. »

## Objectif

1. Le brief du jour ne propose plus de rappeler les inscrits au programme ambassadeurs : ce ne sont pas des demandes à traiter.
2. Les appels manqués où Leedflow écrit « Le correspondant n'a pas laissé de message » se rangent dans « Sans suite », comme un appel manqué sans résumé (règle de la story 18.24).

## Ce qui est fait

- `espace/src/server/brief.ts` : les demandes dont la source est `ambassadeur` sont exclues du brief.
- `espace/src/server/nouveaux.ts` : `resumeVide` reconnaît le texte de Leedflow pour un appel sans message (et « pas de message », « aucun message ») ; il compte comme un résumé vide.

## Écarts assumés

- Les lignes du brief déjà préparées aujourd'hui restent jusqu'à demain ; « Écarter » les retire.
- Un numéro qui a appelé plusieurs fois sans laisser de message reste dans la barre (règle 18.24 : un numéro qui rappelle remonte).
- Les cartes qui demandent une lecture (résumé réel) attendent le tri par l'API Claude, éteint tant que la fiche légale n'est pas vérifiée.

## Ce qui est vérifié

- `espace` : `npm run build` et `npm run check` : 0 erreur (2026-11-24).
- `node scripts/e2e-tri-et-brief.mjs` (2026-11-24) : tous les constats bons, dont le nouveau : « Le correspondant n'a pas laissé de message » rangé dans « Sans suite », rien d'envoyé à l'API.

## Revue de code

À faire : skill `bmad-code-review` en session neuve.

## Ce qui reste

- Allumer le tri par l'API Claude (accord de JB, fiche légale).
