# Story 18.24 : tri par règles de la barre « Nouveaux »

- Epic : 18 (carnet de contacts). Statut : review.
- Demande : JB, 2026-11-24, fiche de poste du chief of staff (https://claude.ai/artifact/RMp2hF6EJvmt6z45MoQS9f, section 9) : « Tri par règles construit cette semaine avec les canaux de prospection (oui) ». Relayé par le fil chief of staff. Sans IA : le tri par l'API Claude viendra après, quand la clé sera posée.

## Objectif

Sur la capture de JB, 16 cartes sur 28 de la barre « Nouveaux » sont du bruit : appels manqués sans message, appels de quelques secondes, messages vides. Anne doit voir d'abord les vraies demandes. Le bruit est rangé dans une ligne repliée, en bas ; rien n'est effacé.

## Ce qui est fait

- `espace/src/server/nouveaux.ts` : `raisonDeRanger` et `APPEL_TROP_COURT_S` (20 s). Une carte de numéro inconnu est rangée si le numéro n'a laissé qu'**un seul échange**, sans tâche, sans nom ni e-mail connus de Leedflow, qu'il n'est pas déjà dans les contacts, et que cet échange est :
  - un appel manqué sans message ;
  - un appel décroché de moins de 20 secondes ;
  - un message vocal ou un SMS vide.
  Un numéro qui rappelle (deux échanges ou plus) remonte de lui-même. Les demandes du site et des portails ne sont jamais rangées. Nouveau champ `rangee` de la carte (la raison, ou null).
- `espace/src/server/leedflow.ts` : chaque échange d'un numéro inconnu garde son genre et sa durée (déjà en base dans `donnees`).
- `espace/src/islands/nouveaux.ts` et `espace/src/pages/index.astro` : les cartes rangées sont dans une ligne repliée « N sans suite, rangés ici… », sous les autres, avec leur raison en pastille et leurs gestes (Ajouter aux contacts, Ignorer). Le compteur de la barre ne compte que les autres ; la barre ajoute « N sans suite ».
- Aucune migration, aucune écriture : le tri se fait à la lecture.

## Écarts assumés

- Seuil « trop court » fixé à 20 secondes (choix par défaut, à confirmer par JB).
- Un numéro dont Leedflow connaît le nom ou l'e-mail n'est jamais rangé, même après un seul appel manqué : quelqu'un l'a identifié.
- Le compteur ne compte plus les cartes rangées : un « 9 » peut devenir « 3 · 6 sans suite ».

## Ce qui est vérifié

- `espace` : `npm run build` et `npm run check` : 0 erreur (2026-11-24).
- `E2E_1824_SEUL=1 node scripts/e2e-espace.mjs` (2026-11-24) : 4 constats sur 4 : appel manqué sans message, appel de 8 s et SMS vide rangés ; numéro qui rappelle, vrai appel de 3 min et numéro nommé par Leedflow non rangés ; compteur et « 3 sans suite » ; cartes rangées repliées en bas, bouton Ignorer présent une fois dépliées ; un numéro rangé qui rappelle remonte ; rien d'effacé ni de marqué vu. Aucune erreur JavaScript. L'essai complet n'a pas été rejoué (les lignes d'essai existantes n'ont ni genre ni durée, donc ne sont jamais rangées).
- Capture : `espace/.verif/espace-nouveaux-sans-suite.png`.

## Revue de code

(à faire en session neuve avant de proposer la PR à JB)

## Ce qui reste

- Revue de code, PR, accord de JB, fusion.
- Tri par l'API Claude (fil chief of staff), quand la clé sera posée.
