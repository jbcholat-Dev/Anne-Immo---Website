# Story 18.20 : R1 et R2, des rendez-vous (boîtage et contacts)

Epic 18 (le carnet de contacts). Statut : done. Date : 2026-11-09. Origine : trois tickets GitHub d'Anne, « [Retour espace] » : n° 256 (page /ajouter, formulaire « Un passage de boîtage »), n° 257 (page /actions, onglet Boîtage), n° 258 (page Contacts).

## Objectif

Anne a précisé ce que sont R1 et R2 : le **premier** et le **second rendez-vous**, pas des dates de relance. La story 18.19 avait fait l'hypothèse inverse (« Hypothèse à confirmer par Anne ») : elle était fausse, et cette story la corrige.

- Ticket n° 256 (/ajouter) : « Mettre VILLE plutôt que secteur et rajouter : QUARTIER, Nombre de flyers, R1, R2, Commentaires ».
- Ticket n° 257 (/actions, boîtage) : « Pour R1 et R2 il s'agit de renseigner le nombre. La date du R1 et R2 sera indiquée dans les fiches contact ».
- Ticket n° 258 (Contacts) : « J'aimerais avoir la possibilité d'avoir par contact les R1/R2 (dates) ».

Donc : dans le boîtage, R1 et R2 sont des **nombres** (combien de premiers et de seconds rendez-vous un passage a amenés) ; sur chaque contact, ce sont des **dates**.

## Décisions (à relire par JB et Anne)

- **Nombres du boîtage dans de nouvelles colonnes** `passage_boitage.r1_nb` et `r2_nb` (entiers de 0 à 9 999, vide = non noté, 0 = « aucun »), plutôt que de réutiliser `r1` et `r2` (type date, CHECK de format) : changer le type d'une colonne SQLite exige de reconstruire la table que `contact` référence, risqué sur la base de production. Les anciennes colonnes `r1` et `r2` restent, vides, ni lues ni écrites (dit en commentaire de la migration).
- **Dates sur le contact** : `contact.r1_le` et `r2_le` (AAAA-MM-JJ, même contrôle de format que la migration 0023). Elles peuvent être dans le futur (rendez-vous pris). Un R2 daté avant le R1 est refusé ; un R2 seul, sans R1, est permis (le premier rendez-vous a pu se faire hors de l'espace).
- **L'étape du suivi ne bouge jamais toute seule** quand une date R1 ou R2 est posée (demande de JB) : le suivi des ventes, sa température et son rappel restent ceux d'Anne.
- **/ajouter écrit par le même chemin que le tableau** (`ajouterBoitage` de `server/boitage.ts`, étendu au coût des flyers) : mêmes contrôles (`verifierBoitage`), secteur = « ville · quartier » ou la ville seule. Plus de logique d'écriture dupliquée dans la page ; `noterPassage` de `pipeline.ts` est retiré.
- **Libellés** : « Secteur » devient « Ville » (obligatoire), « Quartier » s'ajoute (facultatif), « Mots déposés » devient « Nombre de flyers », « Coût des mots (€) » est gardé, plus « R1 », « R2 » et « Commentaires ». Les listes de passages récents et le choix du passage dans le formulaire du contact continuent d'afficher le secteur (« ville · quartier »), avec « N flyers » à la place de « N mots ».
- **Pas de filtre R1/R2** dans la page Contacts : le seul filtre de date existant est « dernier contact plus ancien que N jours », qui n'a pas de sens pour un rendez-vous. À ajouter si Anne le demande (par exemple « R1 sans R2 »).
- **La fiche de suivi** (`/contacts/fiche`, ancienne page) ne montre pas ces dates ; le panneau de la page Contacts, où Anne corrige déjà « à rappeler le », les porte.

## Ce qui est fait

- Migration `site/migrations/0024-r1-r2.sql`, uniquement des `ALTER TABLE … ADD COLUMN` (aucun DROP, aucun UPDATE, aucune reconstruction) : `passage_boitage.r1_nb`, `r2_nb` avec CHECK 0 à 9 999 ; `contact.r1_le`, `r2_le` avec CHECK de format date. Appliquée à la base de production à la construction de `main`.
- `espace/src/server/boitage.ts` : R1 et R2 en nombres (lus de `r1_nb`/`r2_nb`, clés d'API `r1`/`r2` inchangées), contrôles d'ordre des dates retirés (`incoherence` supprimée), `ajouterBoitage` prend le coût en plus, `listerVilles` pour les suggestions de /ajouter. `espace/src/pages/api/boitage.ts` : en-tête et réponses mis à jour.
- `espace/src/pages/actions.astro` : colonnes R1 et R2 en nombres (champ numérique de 0 à 9 999, alignées à droite, titre au survol « Nombre de premiers rendez-vous » / « Nombre de seconds rendez-vous »), phrase d'aide.
- `espace/src/pages/ajouter.astro` : formulaire du passage refait (Date, Ville, Quartier, Nombre de flyers, Coût des mots, R1, R2, Commentaires), écriture par `ajouterBoitage`, saisie gardée en cas d'erreur, suggestions de villes.
- Contacts : `carnet.ts` (`Correction`, `lireCorrection`, `corrigerFiche` : colonnes lues, gardées par la garde de version, avant-image dans l'événement `classement`, refus `REFUS_ORDRE_RDV`), `fiche.ts` (lecture), `api/fiche.ts` (clés `r1_le`, `r2_le`, refus en 400 code `ordre`), `islands/fiche-contact.ts` (deux champs date, effaçables), `tableau.ts` et `tableau-colonnes.ts` (colonnes `r1` et `r2`, triables, vides en fin de liste, masquables par le menu Colonnes), `pages/index.astro` (date en français court).
- Import : `claude-import.mjs` et `import.ts` n'écrivent pas `r1_le` ni `r2_le` (vérifié par l'essai) ; la colonne « R1 »/« R2 » d'un fichier tableur reste ignorée comme avant.
- Essai `espace/scripts/e2e-espace.mjs` : bloc `bloc1820`, joué dans l'essai complet et seul avec `E2E_1820_SEUL=1` ; bloc 18.19 mis à jour (R1 et R2 en nombres).
- Documents : `espace/README.md`, `sprint-status.yaml` (18-20 en review, epic-18 repassé en cours), story 18.19 (renvoi vers celle-ci).

## Ce qui est vérifié

- `cd espace && npm run build && npm run check` : build ok, 0 erreur, 0 avertissement (5 indications, déjà là avant).
- `cd site && npm run build && npm run check` : build ok, 0 erreur.
- Migration 0024 appliquée sur la base locale (`npm run base:local`, jamais de `--remote`) après la 0023.
- `E2E_1820_SEUL=1 node scripts/e2e-espace.mjs` : tous les constats 18.20 verts. /ajouter complet et minimal ; 6 saisies invalides refusées avec message et saisie gardée ; formulaire (Ville, Quartier, Nombre de flyers, R1, R2, Commentaires, plus de Secteur) ; passage visible dans le tableau du boîtage ; /api/boitage : 0 et 9 999 acceptés, 10 refus en 400 (date, négatif, 10 000, décimal, texte, coût par l'API) sans rien écrire ; fiche : dates posées avec avant-image, étape et température intactes, GET, 6 refus (R2 avant R1, dates invalides) sans rien écrire, mêmes dates sans changement, effacement de R2 puis R1, R2 seul permis, jeton de Claude refusé (403) ; page Contacts : colonnes R1 et R2, dates en français court, tri croissant et décroissant, masquage, champs de la fiche, message d'erreur clair, ligne du tableau mise à jour sans recharger, pas de défilement horizontal à 1440 px, aucune erreur JavaScript ; outils d'import sans `r1_le` ni `r2_le`.
- `E2E_1819_SEUL=1 node scripts/e2e-espace.mjs` : tous les constats 18.19 verts (bloc adapté aux nombres).
- Capture : `espace/.verif/espace-contacts-r1-r2-1440.png` (hors Git).
- Essai complet de 25 minutes non rejoué (consigne) : le bloc 18.20 y est appelé après le 18.19 et nettoie ses lignes (préfixe `E1820`).

## Ce qui reste

- Revue de code (`bmad-code-review`, session neuve, CLAUDE.md § 2, story 9.8) : faite le 2026-11-09, voir ci-dessous ; la PR peut sortir du brouillon.
- Mise en ligne : la migration 0024 part sur la base de production à la construction de `main` ; elle est additive, sans risque pour les données existantes.
- Anne : vérifier que les libellés lui conviennent, et dire si elle veut un filtre sur R1/R2 dans Contacts ou ces dates sur l'ancienne fiche de suivi.
- Pistes, non demandées : rendez-vous par passage dans le bilan du boîtage, contacts « R1 sans R2 ».

## Revue de code

Le 2026-11-09, PR #259, commit relu 6d8e57f (`git diff 6d8e57f~1..6d8e57f`), session neuve qui n'a pas écrit le code. Aucun défaut réel trouvé : rien à corriger dans le code, le commit « Espace 18.20 (revue) » ne porte que cette section.

- SQL dynamique de `corrigerBoitage` : écarté : les noms de colonnes viennent d'une table fixe, `verifierBoitage` refuse toute clé hors liste avant (donc ni `__proto__` ni `constructor`), les valeurs sont liées.
- Validation de r1 et r2 du boîtage (entiers de 0 à 9 999, JSON et formulaire /ajouter) : écarté : un texte, un décimal, un négatif et 10 000 sont refusés des deux côtés ; la saisie /ajouter passe par le même `verifierBoitage`.
- Dates r1_le et r2_le de la fiche : écarté : `jourValide` refuse les dates impossibles, l'ordre R2 après R1 est contrôlé sur les valeurs finales (y compris une date seule contre celle déjà en base), refus 400 « ordre », rien d'écrit.
- Accès : écarté : `/api/boitage` et `/api/fiche` refusent toujours le jeton de Claude (403, vérifié par l'essai) ; r1_le et r2_le ne figurent ni dans les outils d'import ni dans les réponses de Claude.
- Migration 0024 : écarté : quatre `ADD COLUMN` facultatifs avec CHECK (NULL passe), aucune reconstruction de table ni donnée touchée, anciennes colonnes r1 et r2 conservées ; appliquée sans erreur sur une base locale.
- /ajouter (formulaire contact, choix du passage) : écarté : le choix du passage lit toujours `secteur` (tenu à jour), seul le libellé « mots » devient « flyers » ; le coût reste saisi uniquement ici.
- Tableau des contacts (tri, masquage, ordre gardé dans le navigateur) : écarté : dates ISO triées comme du texte, vides toujours en fin, nouvelles colonnes ajoutées à la fin d'un ordre déjà gardé.
- Avant-image AD-29 : écarté : r1_le et r2_le sont dans l'état lu, la garde de concurrence et le libellé de l'événement ; comme « à rappeler le », ils ne sont pas annulables par la pile d'annulation de classement, ce qui est voulu.
- Vérifications : `cd espace && npm run build && npm run check` : 0 erreur ; `E2E_1820_SEUL=1 node scripts/e2e-espace.mjs` : tous les constats verts (la seule « échec » est l'arrêt volontaire du mode seul).

## Fusion

2026-11-12 : PR n° 259 fusionnée dans main par Claude sur l'accord écrit de JB (« tu peux fusionner les PR »), commit de fusion 313e90f. Constructions du site et de l'espace sur main au vert.
