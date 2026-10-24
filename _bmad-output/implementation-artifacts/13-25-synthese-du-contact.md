---
story: 13.25
epic: 13 — Espace de travail d'Anne
statut: ready-for-dev
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

## Ce qui reste
- À construire (fil « [Site] Espace de travail d'Anne »), après la 13.23 et avant la 13.24 (même page). Numéros 13.26 à 13.28 pris par le fil « Campagnes d'e-mailing depuis l'espace », qui prendra la migration suivante.
