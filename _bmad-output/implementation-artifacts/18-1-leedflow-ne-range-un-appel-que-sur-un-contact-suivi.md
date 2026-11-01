---
story: 18.1
epic: 18 — Espace d'Anne : le carnet de contacts
statut: done
date: 2026-11-01
maj: 2026-11-01
---

# Story 18.1 — Leedflow ne range un appel que sur un contact suivi

## Objectif
Avant le premier import des 882 contacts du téléphone d'Anne, empêcher que la relève Leedflow (qui lit les appels de sa ligne toutes les 10 minutes) range un appel privé sur la fiche d'un proche, et qu'elle supprime le numéro de la liste des inconnus sans qu'Anne l'ait décidé. Trouvé par la relecture technique du 01/11 ; condition bloquante d'AD-32 (architecture `architecture-espace-anne-2026-11-01`).

## Ce qui est fait (2026-11-01)
- `espace/src/server/leedflow.ts` :
  - `contactsParTelephone` ne trouve que les contacts dont `etape` n'est pas NULL (contacts suivis) ;
  - `rattacherInconnus` : les trois rattachements (historique, tâches, liens Leedflow) et la suppression de `leedflow_inconnu` ne portent que sur les contacts suivis.
- Aujourd'hui tous les contacts ont une étape (colonne obligatoire) : le changement est sans effet tant que la migration 0018 (story 18.2) n'a pas rendu l'étape facultative. Il doit être en ligne avant elle.

## Ce qui est vérifié (2026-11-01)
- `espace` : `npm run build` et `npm run check` sans erreur (0 erreur, 4 indications déjà présentes).
- `site` : `npm run build` (clé Turnstile d'essai) et `npm run base:local` (0001 à 0017).
- `node scripts/e2e-espace.mjs` : **tout est bon (299 constats)**, dont les rattachements Leedflow existants (appel d'un contact connu, numéro inconnu proposé, tâche rattachée au contact créé ensuite).
- Le cas « contact hors suivi » ne peut pas encore être essayé (étape obligatoire avant 0018) : son essai est ajouté par la story 18.2.

## Revue de code
2026-11-01, `bmad-code-review` par une session neuve, PR #225, commit e6905c8. Aucun constat bloquant pour cette story.
- Reprise de l'historique quand un contact du carnet entre seul dans le suivi (appels privés versés) : reporté en 18.2 (colonne `suivi_le`, AD-32 complété).
- Bouton « Ajouter » d'un numéro inconnu sur un contact du carnet sans effet : reporté en 18.2 (`saisirContact` le fait entrer dans le suivi).
- `rangerTaches` et `lireSyntheses` passent par `leedflow_lien` sans filtre d'étape : reporté en 18.2 (sans effet tant qu'aucun lien ne vise un contact du carnet).
- Numéros secondaires (`contact_coordonnee`) non cherchés : reporté en 18.2, la table arrive avec 0018.
- L'effacement retire le classement « Privé » d'un numéro : reporté en 18.3.

## Ce qui reste
- Essai du cas « contact du carnet hors suivi qui appelle » dans la story 18.2.
