# Story 18.27 : brief de la semaine déposé par le chief of staff

- Epic : 18 (carnet de contacts). Statut : review.
- Demande : JB, 2026-11-24 (fil chief of staff) : « que le Chief of Staff puisse mettre à jour l'espace d'Anne […] si on fait un brief ensemble, le répercute directement, qu'on n'est pas à la main à aller faire des choses ». Précisée par le fil chief of staff : deux textes courts, sur la page de prospection existante, en 2 lignes, sans nouvel écran (règle de la fiche de poste § 5 : « il enlève, il n'ajoute pas »).
- Décision : AD-37 (spine d'architecture de l'espace).

## Objectif

Après un point avec JB, le chief of staff (Claude) dépose lui-même, sans ressaisie, le brief de la semaine : « ce qui bloque » et « à décider ». Anne et JB le lisent en 2 lignes sous le titre de « Ma semaine ».

## Ce qui est fait

- Migration `0029-brief-de-la-semaine.sql` : table `brief_semaine` (lundi, deux textes, signature, dépôt).
- `espace/src/server/brief-semaine.ts` : date ramenée au lundi (semaine en cours par défaut), deux textes obligatoires de 400 caractères au plus, refus de tout e-mail ou numéro de téléphone (texte de pilotage seulement), un nouveau dépôt remplace celui de la même semaine.
- `espace/src/pages/api/claude/brief.ts` : GET et POST, ouverts au seul jeton de service de Claude (comme `/api/claude/actions`).
- `espace/scripts/claude-espace.mjs` : commandes `brief [AAAA-MM-JJ]` (relire) et `deposer-brief <json>` (déposer), avec le rappel « sans nom de contact » dans l'aide.
- `espace/src/pages/semaine.astro` : 2 lignes sous le titre, vue « Semaine » seulement. Aucun écran, onglet ni bouton de plus.

## Ce qui est vérifié

- `espace` : `npm run build` et `npm run check` : 0 erreur (2026-11-24).
- `node scripts/e2e-tri-et-brief.mjs` (2026-11-24), partie 18.27 : 8 constats bons sur 8 (dépôt refusé aux comptes d'Anne et de JB, lundi, remplacement, refus téléphone, e-mail, vide, trop long, date fausse, relecture, 2 lignes sur « Ma semaine » pour Anne et JB, absent ailleurs).
- Capture : `espace/.verif/tri-ia/brief-semaine.png`.

## Revue de code

À faire : skill `bmad-code-review` en session neuve, avec la PR n° 274.

## Ce qui reste

- Le fil chief of staff s'en sert après chaque point de la semaine avec JB.
