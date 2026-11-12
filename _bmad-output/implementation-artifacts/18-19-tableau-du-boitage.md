# Story 18.19 : le tableau du boîtage

Epic 18 (le carnet de contacts). Statut : done (PR #250 fusionnée le 2026-11-05, commit 016c4ed ; migration 0023 appliquée par la construction). Date : 2026-11-05. Origine : ticket GitHub n° 249 « [Retour espace] », envoyé par Anne depuis la page /actions de l'espace.

> Correction du 2026-11-09 (story 18.20, tickets n° 256 à 258) : l'hypothèse sur R1 et R2 ci-dessous était fausse. R1 et R2 sont le premier et le second rendez-vous : un nombre dans le tableau du boîtage, une date sur chaque fiche contact. Voir `18-20-r1-r2-boitage-et-contacts.md`.

## Objectif

Anne dépose des flyers et tient son suivi dans un classeur. Sa demande : « Pour le boîtage je souhaiterais avoir un tableau avec les colonnes suivantes : date, ville, quartier, type de bien (maison ou appartement), nombre de flyers déposés, message (je renseigne un n° en fonction de mon classeur), R1, R2, commentaires ».

Elle veut donc, dans l'espace, une page où chaque passage est une ligne de ce tableau, qu'elle ajoute vite et corrige sur place, sans casser le bilan par secteur ni le coût du boîtage qui existent déjà.

## Décisions (à relire par JB et Anne)

- **Même table, colonnes ajoutées** : `passage_boitage` (migrations 0007 et 0010). « Date » = `fait_le`, « nombre de flyers » = `mots` : aucune colonne renommée, donc rien ne bouge pour le bilan, « boîtage à refaire », « Aujourd'hui », la saisie de /ajouter ni le rattachement des contacts à un passage.
- **`secteur` reste obligatoire** et sert encore de clé de regroupement au bilan. Le tableau le remplit : « ville · quartier », ou la ville seule. Un passage noté avant (sur /ajouter, secteur seul) s'affiche dans le tableau avec son secteur en guise de ville ; le corriger n'écrit que les champs changés, il ne lui invente pas de ville et ne touche ni son secteur ni son coût.
- **Hypothèse à confirmer par Anne : R1 et R2 sont des dates de relance** (le jour où elle repasse ou relance une zone), pas des résultats ni des compteurs. Si elle voulait autre chose (nombre de retours, réponse), c'est une migration 0024 : une colonne de plus ou un autre type, sans perte.
- **Message** : texte court (40 caractères au plus) pour que le numéro du classeur reste libre (« 12 », « 12B »).
- **Où** : un onglet « Boîtage » dans /actions (`/actions?onglet=boitage`, menu « Prospection »), à côté de « Actions ». La page est servie pleine largeur pour tenir les neuf colonnes sans défilement horizontal à 1280 px.
- **Ligne d'ajout rapide** : première ligne du tableau. Après un ajout, date, ville, quartier et type de bien restent pour le suivant (on dépose souvent plusieurs fois dans le même quartier), le reste est vidé et le curseur va sur « Flyers ». Choix par défaut, retirable en une ligne.
- **Modification en place** : « Modifier » transforme la ligne en champs ; Entrée enregistre, Échap annule. Une seule ligne ouverte à la fois.
- **Pas de suppression** de ligne dans le tableau (non demandée ; une ligne se corrige, et un passage peut être référencé par des contacts). À ajouter si Anne le demande.
- **La date du passage ne peut pas être dans le futur** (comme sur /ajouter) ; R1 et R2 peuvent l'être (relances prévues). Une relance avant le passage, ou R2 avant R1, est refusée.
- **/ajouter** : champs inchangés (secteur, date, mots, coût) pour ne rien alourdir ; une phrase renvoie au tableau pour le détail.

## Ce qui est fait

- Migration `site/migrations/0023-boitage-tableau.sql`, purement additive : sept colonnes (`ville`, `quartier`, `type_bien` avec CHECK, `message`, `r1` et `r2` avec CHECK de format, `commentaire`) et un index `passage_boitage_date (fait_le DESC, created_at DESC)`. Le numéro 0022 est réservé par un autre fil.
- `espace/src/server/boitage.ts` : validation stricte (champ inconnu, type, longueurs, dates réelles, ordre des relances), liste triée, ajout, correction partielle ; seul écrivain du tableau.
- `espace/src/pages/api/boitage.ts` : `GET` (liste) et `POST` (`ajouter` ou `{ id, corriger }`), JSON seulement, 20 000 caractères au plus, 400 / 404 / 413, 403 sans jeton et au jeton de service de Claude (comme /api/categories). Chaque réponse renvoie la liste à jour.
- `espace/src/pages/actions.astro` : onglets Actions / Boîtage, tableau (colonnes Date, Ville, Quartier, Type de bien, Flyers, Message, R1, R2, Commentaires, plus une colonne de boutons sans titre visible), suggestions de villes et de quartiers déjà notés. Les textes saisis ne passent jamais par `innerHTML`. Mêmes styles que le tableau des contacts (bordures galet, survol écru, titres en capitales).
- `espace/src/pages/ajouter.astro` : une phrase et un lien vers le tableau.
- Essai `espace/scripts/e2e-espace.mjs` : bloc `bloc1819`, joué dans l'essai complet et seul avec `E2E_1819_SEUL=1`.
- Documents : `espace/README.md`, `sprint-status.yaml` (18-19 en review, epic-18 repassé en cours), `.memlog.md` de l'architecture du site (ligne datée du 2026-11-05).

## Ce qui est vérifié

- `cd espace && npm run build && npm run check` : build ok, 0 erreur, 0 avertissement (5 indications, déjà là avant).
- `cd site && npm run build && npm run check` : build ok, 0 erreur, 0 avertissement.
- Migration 0023 appliquée sur la base locale existante, et sur une base locale neuve à part (`wrangler d1 migrations apply DB --local --persist-to …`) : les migrations 0001 à 0021 et la 0023 passent ; les colonnes sont là. Jamais de `--remote`.
- Essai ciblé `E2E_1819_SEUL=1 node scripts/e2e-espace.mjs` (serveurs locaux, base locale, `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA`) : tous les constats 18.19 verts : ancien passage lisible, ligne ajoutée (colonnes neuves, secteur « ville · quartier »), ligne minimale, zéro flyer accepté, tri par date décroissante, modification partielle, secteur mis à jour avec le quartier, ancien passage corrigé sans toucher son coût ni son secteur, bilan ouvert et coût du boîtage resté, 28 saisies invalides refusées en 400 sans rien écrire (type de bien inconnu ou en majuscule, date mal formée, impossible ou future, relance avant le passage, R2 avant R1, flyers négatif, décimal, texte ou énorme, champ inconnu, deux gestes…), 404, 400 sur corps illisible ou pas en JSON, 403 sans jeton et au jeton de Claude, 413, page à 1280 px (colonnes dans l'ordre, ajout par Entrée, texte HTML saisi affiché tel quel, erreur affichée sans rien perdre, modification en place, Échap, pas de défilement horizontal, aucune erreur JavaScript).
- Capture à 1280 px : `espace/.verif/espace-boitage-1280.png` (hors Git).
- Essai complet de 25 minutes non rejoué (consigne) : le bloc 18.19 y est appelé après le 18.18 et nettoie ses lignes (préfixe `E1819`).

## Ce qui reste

- Anne : confirmer que R1 et R2 sont bien des dates de relance (sinon migration 0024).
- Revue de code (`bmad-code-review`, session neuve, CLAUDE.md § 2, story 9.8) : faite le 2026-11-05, voir ci-dessous ; la PR peut sortir du brouillon.
- Mise en ligne : la migration 0023 part sur la base de production à la construction de `main` ; elle est additive, sans risque pour les données existantes.
- Pistes, non demandées : voir les relances R1 et R2 dues dans « Aujourd'hui », supprimer une ligne, filtrer ou trier le tableau, bilan par ville et par type de bien.
- Note d'essai : une demande trop grosse refusée en 413 laisse parfois la connexion suivante en échec côté essai (500 de l'outil d'essai, pas du serveur) ; le constat 413 est donc joué après les autres.

## Revue de code

2026-11-05, session neuve (relecture adverse, `bmad-code-review`), commits relus 8d1297d, 6750518, f6f69d1 (`git diff origin/main..HEAD`). Aucun constat bloquant.

- Migration 0023, ADD COLUMN avec CHECK : écarté, sûr. Les sept colonnes sont ajoutées vides (NULL) et chaque CHECK commence par `IS NULL OR …` : aucune ligne existante ne peut le violer, même si SQLite/D1 teste le CHECK sur les lignes présentes. SQLite et D1 acceptent ADD COLUMN avec CHECK ; l'index est neuf (pas de collision), la table n'est pas reconstruite (clés étrangères de `contact` intactes). Le trou de numérotation (pas de 0022) est sans effet : wrangler applique les migrations non appliquées par nom.
- Le CHECK de format de date (`GLOB`) laisse passer « 2026-19-39 » : écarté, le contrôle réel est fait par l'application (`estDate`) ; le CHECK ne sert que de filet.
- À corriger, corrigé (commit « Boîtage : refuse toString… ») : `type_bien: "toString"` (ou `constructor`, `valueOf`) passait la validation (`in` voit les propriétés héritées de l'objet), puis le CHECK de la base refusait l'écriture : erreur 500 au lieu de 400. Remplacé par `Object.hasOwn` ; un cas ajouté à l'essai (29 saisies refusées au lieu de 28).
- À corriger, corrigé (même commit) : Entrée tenue ou double Entrée rapide dans la ligne d'ajout envoyait plusieurs requêtes avant la réponse (le bouton désactivé ne gardait pas le chemin clavier) : passages en double. Ajout d'un verrou d'envoi, et Entrée ignorée pendant une composition de saisie (`isComposing`) ou en répétition.
- Injection sur /actions : écarté, rien à corriger. Aucun `innerHTML` ; tout passe par `textContent` / `value` / `setAttribute` ; les données de la page sont dans un `<script type="application/json">` avec `<` échappé en `\u003c`.
- Droits, jeton de Claude, taille, JSON seulement, champs inconnus, deux gestes, dates réelles, ordre des relances : écarté, conformes (403 sans compte et au compte de Claude, 413 au-delà de 20 000, 400 sinon ; une requête inter-sites ne peut pas envoyer `application/json` sans demande préalable).
- Régressions sur `passage_boitage` : écarté. Le bilan par secteur, « boîtage à refaire », le coût, « Aujourd'hui », la fiche et /ajouter n'utilisent que des colonnes existantes, listées par nom (aucun `SELECT *`, aucun `INSERT` sans noms de colonnes). Les longueurs de /ajouter (secteur 80, mots 6 chiffres) tiennent dans les limites du tableau (ville 80, flyers 999 999), donc un ancien passage reste modifiable.
- Modifier un ancien passage écrit sa ville (= son secteur) et le même secteur : écarté, sans effet visible ; le coût n'est jamais touché.
- Corriger la ville ou le quartier d'une ligne change son secteur, donc son regroupement dans le bilan : écarté, voulu (« ville · quartier » est la clé) ; deux écritures différentes d'un même lieu font deux secteurs, comme sur /ajouter.
- Cliquer « Modifier » sur une ligne efface ce qui était tapé, mais pas encore ajouté, dans la ligne du haut : écarté, mineur (date, ville, quartier et type de bien sont gardés).
- Le tableau s'arrête à 500 lignes (les plus récentes) sans le dire : écarté pour l'instant, plusieurs années de boîtage ; à revoir si Anne s'en approche.
- Dates extrêmes (« 0001-01-01 ») acceptées : écarté, sans conséquence.
