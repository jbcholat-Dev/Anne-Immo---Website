---
story: 18.6
epic: 18 — Espace d'Anne : le carnet de contacts
statut: review
date: 2026-11-02
maj: 2026-11-02
---

# Story 18.6 — Classer plusieurs contacts à la fois, et écarter

## Objectif
Qu'Anne fasse le classement de départ sans y passer des semaines : cocher des lignes (Maj + clic pour une plage, ou toutes les lignes affichées), changer d'un coup leur catégorie, leur projet ou leur température, les marquer vérifiées ou les écarter ; ou classer un seul contact directement dans sa ligne. L'espace annonce le nombre de contacts touchés, applique, met le tableau à jour sans recharger et propose d'annuler. Un contact écarté disparaît du tableau, se retrouve avec le filtre « Écartés » et peut en revenir. Toute écriture passe par un seul module, `carnet`, qui garde l'avant-image de chaque contact pour pouvoir l'annuler. PRD `prd-espace-anne-2026-11-01` FR-1, FR-4, FR-5 (glossaire : vérifié, écarté, projet, température) ; architecture AD-22, AD-24, AD-25, AD-28, AD-29, AD-31 ; maquette `ux-espace-anne-2026-11-01` (artefact FUmUuJZTnjf3pG7HJWXH7Z : barre sombre « N sélectionnés », boutons ▾ dans les cellules, message avec « Annuler »).

## Ce qui est fait (2026-11-02)
- **`espace/src/server/carnet.ts`**, seul écrivain des colonnes de classement de `contact` : `categorie_id`, `projet`, `temperature`, `verifie_le`, `ecarte_le` (plus `last_activity_at`, AD-22).
  - `lireIds` (1 à 2 000 ULID, doublons retirés), `lireChangements` (vocabulaire fermé : catégorie présente dans la table `categorie`, projet de la migration 0018, température parmi froid, tiède, chaud, déjà en vente, en recherche active, ou `null` pour l'effacer ; `verifie` et `ecarte` booléens ; toute autre clé refusée).
  - `appliquer` (règles, sans base) : choisir une catégorie marque vérifié (une date de vérification déjà posée est gardée) ; un projet sans température (à qualifier, ambassadeur) ou incompatible (« déjà en vente » chez un acheteur, « en recherche active » chez un vendeur) efface la température ; une température demandée qui ne s'applique pas (projet sans température ou incompatible, contact du suivi en cours) est ignorée et comptée ; un contact du suivi en cours dont le projet devient connu reçoit « avec Anne » (« terminé » s'il est vendu ou acté), comme `pipeline` (AD-24).
  - `classer` : lit l'état des contacts du lot, calcule les colonnes qui changent vraiment, puis **une seule exécution D1 (`batch`) de deux instructions, quel que soit le nombre de contacts** : `UPDATE contact … FROM json_each(?)` (plan vérifié : boucle sur le lot, chaque contact trouvé par sa clé) et `INSERT INTO contact_evenement … SELECT FROM json_each(?)`, un événement `classement` par contact touché, `donnees` = `{ avant, apres, lot }` (AD-29, seulement les colonnes changées), `source` = `anne`, `par` = le compte, `source_id` = « lot.contact » (l'index unique existant retrouve un lot sans parcourir la table). Renvoie `touches`, `ignores`, `inchanges`, `inconnus` et les lignes à jour.
  - `annulerLot` : rejoue l'avant-image des contacts encore tels que le lot les a laissés et dont le classement rendu reste permis avec le projet d'aujourd'hui ; les autres (modifiés depuis) sont gardés et comptés. L'annulation est elle-même un lot (`annule` = lot annulé) ; une seconde annulation ne rend plus rien.
  - Ne touche jamais `etape`, `parcours`, `prochaine_action*`, `dernier_contact_*` (AD-28), ni l'accord e-mail.
- **`espace/src/server/tableau-colonnes.ts`** : `TEMPERATURES_CHOIX`, `PROJETS_AVEC_TEMPERATURE`, `temperaturePermise`, `suiviEnCours`, partagés par le serveur et la page ; champ `en_cours` d'une ligne (suivi ni perdu ni en sommeil). `tableau.ts` le remplit.
- **`espace/src/pages/api/carnet.ts`** : `POST { ids, changements }` (classer) ou `POST { annuler: lot }`. Corps JSON seulement, 200 000 caractères au plus (413 au-delà, d'après `Content-Length` avant lecture). Mêmes contrôles d'accès que `/api/vues` (en-tête du compte posé après Cloudflare Access), jeton de Claude refusé (403). 400 pour toute valeur hors vocabulaire, 404 pour un lot inconnu. Réponses `{ ok, … }` ou `{ ok: false, error: { code, message } }` (convention du spine).
- **`espace/src/pages/index.astro`** :
  - une case par ligne et une case d'en-tête « toutes les lignes affichées » (filtre et recherche, y compris les lignes pas encore écrites par paquets), cochée ou à moitié selon le cas ;
  - Maj + clic coche ou décoche toute la plage entre la case cliquée juste avant et celle-ci, dans l'ordre affiché (FR-4) ;
  - les cases cochées sont gardées dans un ensemble d'identifiants : elles survivent au tri, aux filtres, à la recherche et à l'écriture par paquets (le HTML gardé d'une ligne est refait quand son état change) ; la barre dit « N sélectionnés (dont M hors de l'affichage) » ;
  - barre d'actions groupées, sombre et collée en haut comme dans la maquette : catégorie, projet, température (ou « Effacer la température »), « Marquer vérifié », « Écarter » (« Faire revenir » sous le filtre « Écartés »), « Désélectionner » ; boutons désactivés pendant l'écriture ;
  - après l'écriture : message « N contacts touchés : … » (avec le nombre d'ignorés pour une température), « Annuler » pendant 10 secondes ; tableau, compteur, vues et catégories mis à jour sans recharger ; cases vidées ;
  - une seule ligne : catégorie, projet et température sont des boutons ▾ qui deviennent une petite liste (Échap ou sortie de la liste referme) ; la température n'est proposée que si le projet en a une, avec les seules valeurs permises, et pas pour un contact du suivi en cours ;
  - données affichées par `esc()` (noms dans les libellés des cases, options des listes) ou `textContent`.
- **Essais** : `espace/scripts/e2e-espace.mjs`, constats nouveaux ci-dessous ; le contrôle des routes `/api/claude/…` vérifie aussi qu'aucune n'importe `carnet`.
- **Documents** : `espace/README.md`, statut de sprint (18-6 en `review`).

## Ce qui est vérifié (2026-11-02)
- `site` : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build`, `npm run check` (0 erreur, 0 avertissement), `npm run base:local`. La story ne change pas `site/` : `e2e-gestion` non relancé.
- `espace` : `npm run build`, `npm run check` (0 erreur, 0 avertissement, les 5 indications déjà présentes).
- `node scripts/e2e-espace.mjs` : **tout est bon, 397 constats** (373 après la 18.5), dont 24 nouveaux de la 18.6 :
  - route : lot de trois contacts avec avant-image et lot commun dans `contact_evenement` (source `anne`, compte noté) ; catégorie qui marque vérifié, date déjà posée gardée ; annulation qui rend l'état exact, seconde annulation sans effet ; projet ambassadeur qui efface la température, « déjà en vente » effacé au passage en acheteur, contact déjà dans l'état demandé non touché ; température groupée posée sur 1 contact, 2 ignorés (à qualifier, suivi en cours) ; contact du suivi classé (catégorie, projet) sans que `etape`, `parcours`, `prochaine_action*`, `dernier_contact_*` bougent, « avec Anne » gardée ; écarter puis faire revenir ; annulation qui garde un contact modifié depuis ;
  - 400 sans rien écrire pour : catégorie inconnue, projet inconnu, « avec Anne », « terminé », température inconnue, vérifié non booléen, changement inconnu (`etape`, `dernier_contact_le`), aucun changement, aucun identifiant, identifiant mal formé, 2 001 identifiants, lot mal formé, corps qui n'est pas du JSON ; lot inconnu 404 ; 403 sans jeton, avec le jeton de Claude (classer et annuler) ; aucune route `/api/claude/…` n'importe `carnet` ;
  - page (1440 px) : Maj + clic coche la plage de trois lignes, puis Maj + clic la décoche ; « 3 sélectionnés » ; cases gardées après un tri et une recherche qui les cache (« dont 3 hors de l'affichage ») ; nom `Gina <i>x</i>` montré en texte (case et cellules) ; catégorie changée par la barre (« 3 contacts touchés : rangé dans « Anciens clients », vérifié »), tableau à jour sans recharger, cases vidées, puis « Annuler » qui rend l'état exact en base et dans le tableau ; projet puis température d'une seule ligne dans leurs cellules (choix proposés pour un vendeur : à préciser, froid, tiède, chaud, déjà en vente) ; pas de liste de température pour le contact du suivi en cours ; contact écarté qui disparaît, réapparaît sous « Écartés » et revient par « Faire revenir » ; case d'en-tête qui coche les 4 lignes affichées, « Désélectionner » ; pas de débordement horizontal à 1440 et 1280 px ;
  - **vitesse** : un lot de **1 000 contacts** par `/api/carnet` : **62 ms** (1 000 contacts changés et 1 000 événements écrits), annulation **54 ms**, état rendu à l'identique (passage précédent : 52 et 54 ms) ; dans la page, 1 150 contacts cochés d'un clic, catégorie changée et tableau entièrement redessiné en **795 ms**, annulé en **769 ms** (passage précédent : 920 et 760 ms) ; l'essai de vitesse de la 18.5 reste sous 300 ms (pire 232 ms avec 1 242 contacts).
  Passages précédents ratés, corrigés : l'essai 18.4 du tri lisait la ville dans la 7e cellule, devenue la 8e avec la case (essai corrigé) ; un passage interrompu par une limite de durée de ma commande a laissé les colonnes d'essai de l'epic 17 dans la base locale, d'où un échec sans rapport au passage suivant ; une fois, la suppression d'une vue avec le jeton de Claude (essai 18.5) a reçu 500 du serveur local de wrangler sans atteindre l'espace (rien dans son journal), pas reproduit au passage suivant.
- Base locale : mise de côté après le passage interrompu (`site/.wrangler/state-avant-18-6`, ignoré par Git, rien d'effacé) et recréée par `npm run base:local` ; les constats ci-dessus sont sur cette base neuve.
- Captures regardées (`espace/.verif/espace-contacts-lot-1440.png`, `-lot-1280.png`, `-lot-fait-1440.png`) : barre sombre « N sélectionnés » collée au-dessus du tableau avec ses listes et boutons sur une ligne à 1440 et 1280 px, lignes cochées surlignées en bleu clair, case d'en-tête à moitié cochée à 1280 px (2 sur 4), boutons ▾ au survol d'une ligne, message « 1 contact touché : revenus dans le tableau · Annuler » en bas.

## Écarts assumés
- **« Avec Anne » et « terminé » ne se choisissent jamais par `/api/carnet`** (400), même pour un contact du suivi : AD-24 les réserve au suivi des ventes. Pour un contact du suivi en cours, la température ne se change pas dans le tableau (elle suit l'étape) ; une température groupée l'ignore et le message le compte.
- **Choisir une catégorie, même identique, marque vérifié** (glossaire : vérifié = catégorie confirmée ou corrigée) ; une date de vérification déjà posée est gardée.
- **« Marquer vérifié » n'a pas d'inverse dans la page** ; la route accepte `verifie: false` (remettre « à vérifier »), utile à l'annulation et à la fiche (18.7).
- **L'annonce avant d'appliquer** (FR-4) est le compteur de la barre (« N sélectionnés ») ; pas de fenêtre de confirmation, comme dans la maquette, puisque tout s'annule. Le message après écriture donne le nombre réellement touché.
- **Les cases restent cochées quand un filtre les cache** ; une action groupée porte sur tous les cochés, et la barre dit combien sont hors de l'affichage. Les cases se vident après une action réussie (maquette).
- **Annulation** : possible tant que le message est là (10 s) ; côté serveur, elle vaut pour tout lot dont les contacts n'ont pas changé depuis (comparaison des colonnes écrites par le lot), ce qui couvre la règle d'AD-29. Les contacts modifiés depuis sont gardés et comptés.
- **Dernière écriture gagnante** (hypothèse de FR-6) : l'état d'avant est lu juste avant le lot ; deux classements simultanés des mêmes contacts ne sont pas départagés.
- **Lot identifié dans `source_id`** (« lot.contact ») en plus de `donnees.lot`, pour retrouver un lot par l'index existant ; pas de table `classement_lot`.
- **Réponses `{ ok, … }`** sur `/api/carnet` (convention du spine), alors que `/api/vues` (18.5) répond `{ vue }` ou `{ erreur }`.
- **Pas de bouton « Lancer une séance »** dans la barre (maquette) : epic 19.

## Ce qui reste
- Revue de code en session neuve (`bmad-code-review`), puis passage à `done`.
- `pipeline.ts` écrit encore lui-même `projet` et `temperature` à l'entrée dans le suivi (déjà le cas avant cette story) ; AD-22 veut que ce passe par `carnet`. À reprendre quand `pipeline` sera touché (19.1 ou une story dédiée), sans changer le comportement.
- Fiche contact et création à la main (18.7) : réutiliser `classer` pour la catégorie, le projet et la température.

## Revue de code
