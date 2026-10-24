---
story: 13.30
epic: 13 — Espace de travail d'Anne
statut: review
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.30 — Critères de recherche d'un acheteur (ticket #176)

## Objectif
Ticket #176 d'Anne (2026-10-24) : « S'inspirer de Modelo pour remplir les critères de recherche des prospects. Très important : fiche synthèse finale avec les éléments renseignés seulement. » Précision de JB le 2026-10-24 : pas besoin de la capture de Modelo ; pour un acheteur, renseigner les paramètres classiques d'une recherche (maison ou appartement, T2/T3/T4, jardin, surface…), ou les reprendre de Leedflow.

## Leedflow
L'API de Leedflow ne donne aucun critère rangé : seulement la synthèse en texte libre (champ `details`, story 13.25), déjà affichée en tête de la fiche. Les critères se saisissent donc dans l'espace, en lisant cette synthèse. Les extraire automatiquement du texte demanderait une IA et serait peu fiable ; non retenu.

## Ce qui est fait (2026-10-24)
- `espace/src/server/pipeline.ts` : `CRITERES_ACHETEUR` (type de bien, pièces, extérieur, stationnement, plusieurs choix chacun) et `CRITERES_TAPES` (surface minimale, autres critères), gardés avec les autres réponses dans `contact.qualification` (JSON, aucune migration) ; `rechercheRenseignee` (seuls les critères remplis) et `rechercheCourte` (une ligne pour la liste des acheteurs).
- Qualification et correction (`/contacts/qualifier`) : les critères en pastilles à cocher, la surface (« 120 » ou « 120 m² »), budget, secteur, autres critères, financement. Un choix inconnu est ignoré.
- Fiche d'un acheteur : section « Ce qu'il ou elle cherche » avec seulement les critères renseignés, et un lien « Modifier ».
- Acheteurs actifs : la colonne « Cherche » montre « Maison · T4, T5 et plus · 120 m² et plus · Jardin ».
- L'historique de la qualification reprend les critères.

## Ce qui est vérifié (2026-10-24)
- `e2e-espace.mjs` sur base locale remise à zéro : 246 vérifications, 0 échec. Les nouvelles : plusieurs pièces gardées dans l'ordre et choix inconnu ignoré, surface sans « m² », critères repris à la correction, fiche limitée aux critères renseignés, ligne « Cherche » des acheteurs actifs. Capture téléphone `espace/.verif/espace-qualifier-acheteur-telephone.png` regardée, sans débordement.
- `npm run build` et `npm run check` dans `espace/` : 0 erreur.

## Ce qui reste
- Fusion par JB, puis fermeture du ticket #176.
- Le reste du ticket #182 (en-tête de fiche, historique résumé) est la story 13.31.
