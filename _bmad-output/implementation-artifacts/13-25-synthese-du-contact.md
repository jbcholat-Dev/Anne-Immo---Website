---
story: 13.25
epic: 13 — Espace de travail d'Anne
statut: review
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.25 — Synthèse du contact (reprise de Leedflow, modifiable)

## Objectif
Demande de JB du 2026-10-24 (deux captures de la fiche Leedflow d'une acquéreuse) : retrouver en tête de la fiche contact de l'espace la « Synthèse IA » que Leedflow montre quand on ouvre un contact. Ses rubriques : qui est ce contact, notre relation, à retenir, situation actuelle, échanges récents. Elle doit être synchronisée depuis Leedflow, modifiable par Anne et saisissable à la main pour un contact passé hors Leedflow.

## Ce qui est établi
- Description publique de l'API (`openapi.json`) : la fiche `GET /contacts/{id}` porte `id, civility, firstname, lastname, email, phone, company, website, details, adresse, created, updated, history` ; `history` porte `id_source, timestamp, type, info`. Ni chaleur, ni typologie, ni statut, ni tags.
- Essai de JB le 2026-10-24, sur son ordinateur avec la clé d'Anne (seuls des noms de champs et des nombres ont été affichés) : la liste `GET /contacts` renvoie ses contacts sous `data.data`. Le champ `details` du contact lu contient la synthèse (464 caractères, 11 lignes, rubriques « Qui est… / relation / retenir / Situation » reconnues).

## Ce qu'il faut
- **Lire la synthèse** : la relève (`espace/src/server/leedflow.ts`) relit la fiche Leedflow d'un contact connu dès qu'un nouvel appel, SMS ou message vocal arrive pour lui. Elle repasse une fois par jour sur les contacts liés, en respectant le plafond de fiches par passage. Le lien contact Leedflow ↔ contact de l'espace passe par `leedflow_lien`, complété par le numéro de téléphone (liste des contacts Leedflow).
- **Garder** (migration 0012) : sur `contact`, la synthèse de Leedflow, sa date (`updated` de Leedflow), la version d'Anne si elle l'a modifiée, et la date de sa modification.
- **Afficher** en tête de la fiche, en Markdown rendu comme les résumés d'appels, avec « Mise à jour par Leedflow le … » ou « Modifiée par Anne le … ».
- **Modifier** : « Modifier la synthèse » ouvre un champ texte prérempli, rangé par rubriques. Une nouvelle version de Leedflow n'écrase jamais celle d'Anne : la fiche dit alors « Leedflow a une version plus récente », avec « La reprendre ».
- **Saisie à la main** pour un contact sans fiche Leedflow : les mêmes rubriques, vides.
- **RGPD** : la synthèse est comprise dans l'export et effacée avec le contact (13.23).
- Chaleur, typologie, statut et tags ne sont pas lisibles : rien n'est recopié ; la qualification et l'étape jouent ce rôle.

## Vérification attendue
- `e2e-espace.mjs`, sur l'imitation de l'API :
  - une synthèse lue après un appel ;
  - une nouvelle version reprise si Anne n'a rien modifié, signalée sans écraser sinon ;
  - saisie à la main pour un contact hors Leedflow ;
  - export et effacement ;
  - clé refusée sans casse.
- Captures téléphone et ordinateur de la fiche ; `npm run build`, `npm run check` dans `espace/`.

## Ce qui est fait (2026-10-24)
- Migration `site/migrations/0012-synthese-contact.sql`, cinq colonnes sur `contact` :
  - `synthese_leedflow` et `synthese_leedflow_le` : le texte de Leedflow et la date où il a changé chez Leedflow ;
  - `synthese_lue_le` : la dernière lecture de la fiche Leedflow ;
  - `synthese` et `synthese_le` : la version d'Anne et la date où elle l'a enregistrée.
- Relève (`espace/src/server/leedflow.ts`, `lireSyntheses`), dans la limite des 30 fiches Leedflow par passage, partagée avec les noms des numéros inconnus. L'ordre de lecture :
  - d'abord les contacts liés jamais lus ;
  - puis ceux dont le dernier échange date de moins d'une heure : Leedflow réécrit sa synthèse après l'appel, elle est relue à chaque passage pendant cette heure ;
  - puis le tour quotidien.
- Le lien vient de `leedflow_lien`, que les appels, SMS et tâches remplissent déjà. `ficheLeedflow` descend l'enveloppe `data` ou `data.data`. Si la migration manque, la relève continue sans synthèse.
- Fiche (`fiche.astro`), carte « Synthèse » en tête :
  - Markdown rendu comme les résumés d'appels, signé « Mise à jour par Leedflow le … » ou « Modifiée par Anne le … » ;
  - « Leedflow a une version plus récente » avec « La reprendre » quand Leedflow a changé la sienne après Anne ;
  - « Modifier » ou « Écrire la synthèse » (champ prérempli, ou le modèle aux cinq rubriques pour un contact hors Leedflow).
- `enregistrerSynthese` (`pipeline.ts`) : un champ vidé, ou identique à la version de Leedflow, rend la main à Leedflow. Une ligne d'historique sans le texte.
- RGPD : comprise dans l'export (colonnes du contact) et effacée avec lui (13.23).
- Écart : chaleur, typologie, statut et tags de Leedflow ne sont pas dans l'API et ne sont pas repris.

## Ce qui est vérifié (2026-10-24)
- `node scripts/e2e-espace.mjs` : **229 vérifications, toutes bonnes**. Les nouvelles :
  - synthèse lue sur la fiche Leedflow imitée (enveloppe `data.data`), avec sa date ;
  - en tête de la fiche, signée Leedflow ;
  - version d'Anne gardée à côté ;
  - nouvelle version de Leedflow signalée sans écraser ;
  - « La reprendre » ;
  - relue dans l'heure qui suit un échange ;
  - contact hors Leedflow : modèle proposé, saisie à la main affichée, export qui la comprend ;
  - la clé refusée reste signalée sans casse (essai existant).
- La base locale d'essai a été remise à zéro avant la dernière série : les secteurs de boîtage accumulés par les essais précédents faisaient sortir un secteur du bilan, plafonné à 30.
- `npm run build` et `npm run check` dans `espace/` : 0 erreur.

## Ce qui reste
- Fusion par JB (après les 13.22 et 13.23). Une fois en ligne : vérifier sur un vrai contact d'Anne que le texte lu est bien la synthèse affichée dans Leedflow.
