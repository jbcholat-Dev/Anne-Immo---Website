---
story: 13.24
epic: 13 — Espace de travail d'Anne
statut: review
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

## Ce qui est fait (2026-10-24)
- **Recherche** : nouveau `site/src/server/recherche.ts` (`lireRecherche`, `filtreRecherche`, `telLisible`), partagé par le site et l'espace. Un début de numéro tapé en 0, 00 ou + est cherché au format de la base (+33…) ; sinon chaque mot (jusqu'à 5) doit apparaître dans prénom + nom + commune + e-mail. `listerContacts` (espace) et `listerLeads` (`/gestion`, prénom + nom + e-mail + téléphone) l'utilisent ; une adresse complète reste cherchée à l'identique dans `/gestion`.
- **Contacts** (`espace/src/pages/contacts/index.astro`) : une carte par contact sous 900 px (nom et commune, origine, étape, prochaine action et date, retard en rouge), tableau au-delà ; filtres d'une touche « Tous, À qualifier, En retard, Vendeurs, Acheteurs, En sommeil » (`FILTRES_CONTACTS`, combinables avec la recherche).
- **Pipeline** (`espace/src/pages/pipeline.astro`) : pastilles d'étapes avec leur compteur ; sous 900 px seule l'étape choisie (`?etape=`, sinon la première non vide) est montrée, colonnes côte à côte au-delà ; après un déplacement, retour sur l'étape d'arrivée ; la phrase « glissez une carte » seulement sur ordinateur.
- **Numéros** affichés « 06 12 34 56 78 » sur Aujourd'hui, Contacts, fiche (et champ de modification), qualification, suite, acheteurs, fiche prescripteur ; gardés en +33 dans la base. Date d'ouverture d'« Aujourd'hui » en minuscules.

## Ce qui est vérifié (2026-10-24)
- `e2e-espace.mjs` sur base locale remise à zéro : **243 vérifications, 0 échec**, dont recherches « 0646… », « 06 46 xx », « prénom nom », « nom commune », e-mail partiel, « olga orphelin » dans `/gestion` ; filtres « En retard », « À qualifier », « Vendeurs » ; cartes et tableau ; pipeline une étape à la fois ; aucun débordement horizontal sur `/contacts` et `/pipeline` à 390 px et sur ordinateur ; captures `espace/.verif/espace-contacts-*.png`, `espace-pipeline-*.png`.
- `site/scripts/e2e-gestion.mjs` : 44 vérifications, toutes bonnes (recherche de `/gestion` réécrite).
- `npm run build` et `npm run check` dans `site/` et `espace/` : 0 erreur.

## Ce qui reste
- Fusion de la PR par JB (après la n° 187, story 13.25). Audit : https://claude.ai/artifact/87DydmbEHytFNxEk6FRkPy.
