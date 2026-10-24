---
story: 13.24
epic: 13 — Espace de travail d'Anne
statut: ready-for-dev
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.24 — Listes et recherche pensées pour le téléphone

## Objectif
Troisième et quatrième points bloquants de l'audit 13.21 (décision de JB du 2026-10-24). Anne travaille à moitié sur téléphone (spec CAP-12 : « téléphone et ordinateur à égalité »). Sur 390 px, le tableau de `/contacts` ne montre que « Qui » et « Origine » : l'étape et la prochaine action sont hors écran, sans indice qu'il faut faire glisser ; `/pipeline` montre une colonne et demie, les autres étapes et leurs compteurs sont invisibles. Et la recherche (`listerContacts` dans `espace/src/server/pipeline.ts`) ne trouve ni un début de numéro tapé en 06 (« 0612 » : les numéros sont gardés en +33) ni « prénom nom » (les deux cherchés séparément).

## Ce qu'il faut
- **Contacts sur téléphone** : une carte par contact (nom et commune, origine, étape, prochaine action et sa date, en retard en rouge) ; le tableau reste sur ordinateur. Filtres d'une touche utiles au quotidien : à qualifier, en retard, vendeurs, acheteurs, en sommeil.
- **Pipeline sur téléphone** : une étape à la fois, choisie par des pastilles en haut avec le nombre de contacts de chaque étape ; « Déplacer » tient dans l'écran. Les colonnes côte à côte restent sur ordinateur. La phrase « Sur ordinateur, glissez une carte… » ne s'affiche que sur ordinateur.
- **Recherche** : un début de numéro tapé en 0 (« 0612 », « 06 12 34 ») est converti en « +3361… » avant de chercher ; plusieurs mots cherchent chacun dans prénom + nom + commune (« marie dupont », « dupont thonon ») ; un e-mail partiel marche toujours. Même règle dans la recherche de `/gestion`.
- Numéros affichés « 06 12 34 56 78 » partout (fiche, listes, « Aujourd'hui », qualification), gardés en +33 dans la base ; date d'ouverture « samedi 24 octobre » en minuscules (finitions relevées par l'audit, même sujet).

## Vérification attendue
- `e2e-espace.mjs` : recherches « 0612 », « 06 12 34 », « marie dupont », « dupont thonon », e-mail partiel ; `scripts/ecrans.mjs` ou équivalent : aucun débordement horizontal sur `/contacts` et `/pipeline` à 390 px ; captures téléphone et ordinateur.
- `npm run build`, `npm run check` dans `espace/`.

## Ce qui reste
- À construire (fil « [Site] Espace de travail d'Anne »), après la 13.23. Audit : https://claude.ai/artifact/87DydmbEHytFNxEk6FRkPy.
