# Story 18.15 : un clic pour éditer et retrait de toutes les catégories (tickets 238 et 240)

Epic 18 (le carnet de contacts). Statut : review. Date : 2026-11-03.

## Objectif

- **Ticket 238** : sur la page Contacts, éditer catégorie, projet ou température demandait deux clics (la pastille devient une liste, puis un second clic ouvre la liste). Un seul doit suffire.
- **Ticket 240** : Anne doit pouvoir retirer des catégories, y compris celles de départ, pour faire d'autres groupements. Jusqu'ici les six catégories de départ ne se retiraient pas, et une catégorie ne se retirait que vide.

## Ce qui est fait

- **238** (`espace/src/pages/index.astro`, `ouvrirListe`) : juste après `s.focus()`, `s.showPicker()` dans un `try/catch` ouvre la liste native tout de suite (le clic sur la pastille donne l'activation exigée). Sans support, la liste garde le focus comme avant. Relu : `surChoix` écrit au `change` quand ce n'est pas le clavier (clic dans la liste ouverte) ; son `blur` n'abandonne que si une touche du clavier a changé la valeur (`clavier`), donc l'ouverture de la liste ne la referme pas.
- **240, règles** : `CATEGORIES_GARDEES = ['demandes_recues']` / `estGardee` remplacent `CATEGORIES_FIXES` / `estFixe`; le champ `fixe` devient `gardee` (seule `demandes_recues` : le site et les portails y rangent les nouvelles demandes ; elle reste renommable).
- **240, serveur** (`server/categories.ts`, `retirerCategorie`) : avec `ranger_dans`, les contacts de la catégorie, écartés compris (tous ceux dont `categorie_id` = elle), sont rangés dans la destination par `classer` (`server/carnet.ts`, événements avec avant-image, AD-29), par paquets de `MAX_LOT`; puis suppression comme avant avec la condition « vide » (un contact rangé entre-temps donne `pas_vide`, la catégorie est gardée).
- **240, API** (`POST /api/categories { id, retirer: true, ranger_dans? }`) : `ranger_dans` n'est permis qu'avec `retirer` (400 sinon) ; refusé en 400 s'il est la catégorie elle-même, 404 s'il est inconnu ; 409 `gardee` pour `demandes_recues` ; 409 `pas_vide` si des contacts restent et qu'aucun `ranger_dans` n'est donné. Le compte « par » vient de l'en-tête `ENTETE_COMPTE`. Pas d'option « sans catégorie » : une fiche sans catégorie compterait comme envoi groupé permis (`campagnes.ts`, `coalesce(..., 1)`).
- **240, page** (`pages/categories.astro`) : dans la carte « Retirer », liste obligatoire « Ranger ses N contacts dans : » des autres catégories, bouton « Retirer la catégorie » avec `confirm()` qui dit le nom et où vont les contacts ; bouton grisé pour `demandes_recues` (avec la raison) et s'il n'y a qu'une catégorie.
- **Vues enregistrées (point 5)** : rien à changer, le chargement est déjà tolérant (`vues-base.ts` `lire`) : la valeur d'une catégorie retirée est ôtée de la liste du filtre ; si la liste se vide, la vue est marquée « à refaire » (filtre vide, aucun contact) et la page l'affiche, sans erreur ni disparition. Choix : ne pas réécrire les filtres au retrait (plus simple, et une vue vidée de sa seule catégorie serait un filtre vide qui montrerait tous les contacts, donc pire).
- **Import (point 6)** (`server/import.ts`) : `categorieDe` vérifie que la catégorie de départ existe encore (table `categorie`) ; sinon la fiche arrive sans catégorie (« à ranger »), jamais d'échec de clé étrangère. L'aperçu compte ces fiches sous `a_ranger`. Un complément ne propose pas une catégorie disparue. Formulaire d'ajout de `index.astro` : `proches` est présélectionnée seulement si elle existe, sinon la première catégorie.

## Ce qui est vérifié

- `cd espace && npm run build` : réussi. `npm run check` : 0 erreur, 0 avertissement (5 indications).
- `node --check espace/scripts/e2e-espace.mjs` : ok. Essais de 18.8 adaptés (`gardee`, refus sans destination, message de la page, bouton grisé sur `demandes_recues`) et un constat ajouté : retrait de `partenaires` avec contacts (dont un écarté) rangés ailleurs, refus de `ranger_dans` invalide, `demandes_recues` gardée ; la catégorie est remise en l'état ensuite.

- 2026-11-03, essai complet `node scripts/e2e-espace.mjs` sur la base locale : 576 constats réussis, dont les quatre de 18.8 et 18.15 sur les catégories ; un seul échec, l'intermittent connu « 18.11 : une demande du site arrive dans Nouveaux », sans lien avec ce changement.
- Le choix dans la liste ouverte d'un seul clic (238) n'est pas couvert par l'essai automatique (liste native du navigateur) : à constater à l'œil.

## Ce qui reste

- Constater à l'œil après fusion ; le fil des tickets ferme les tickets 238 et 240 avec le commit de fusion.
- Revue de code (story 9.8) dans une session neuve avant fusion : la PR touche `espace/src/`.
- Choisir une catégorie marque d'habitude le contact « vérifié » (FR-4). Un déplacement dû au retrait d'une catégorie n'est pas une vérification par Anne : `classer` reçoit l'option interne `sansVerifier` (jamais lue de l'API), et l'état « à vérifier » de chaque contact est gardé.

## Revue de code

2026-11-03, skill `bmad-code-review` dans une session neuve (quatre relecteurs : aveugle, cas limites, trous de vérification, conformité à la story), PR #241, commit relu `a4d46a2`. Corrections dans `d8b0099` ; vérifié : `cd espace && npm run build` réussi, `npm run check` 0 erreur, 0 avertissement (5 indications), `node --check scripts/e2e-espace.mjs` ok. L'essai de bout en bout n'a pas été relancé (le constat 18.15 modifié n'a donc pas encore tourné).

Points prioritaires relus sans défaut : `sansVerifier` ne vient jamais de l'API (`lireChangements` et `lireCorrection` refusent toute clé inconnue) ; une destination retirée pendant le retrait ne fait pas échouer `classer` (`ecrire` vérifie l'existence de la catégorie dans la même exécution D1) ; `showPicker` est appelé dans le clic, avec repli.

Aucun bloquant.

À corriger :
- Page restée sur un compte périmé : si la page croyait la catégorie vide et que des contacts y sont arrivés, le refus `pas_vide` disait « choisissez où les ranger » sans montrer de liste : corrigé (`d8b0099`), le refus apporte la liste à jour et la page la redessine.
- Message trompeur après un retrait avec destination resté incomplet (« choisissez où les ranger » alors qu'Anne venait de choisir) : corrigé (`d8b0099`), il dit que des contacts ont changé pendant le retrait et invite à recommencer.
- Le retrait ne s'annule pas (`annulerLot` ne remet jamais une catégorie supprimée) et la confirmation ne le disait pas : corrigé (`d8b0099`), « Ce retrait ne s'annule pas. ».
- Textes au singulier faux (« Ranger ses 1 contact », « Ses 1 contact seront rangés ») et écartés non signalés dans l'étiquette : corrigé (`d8b0099`).
- Liste de destination sans contour au clavier (`:focus-visible`) : corrigé (`d8b0099`).
- L'essai ne vérifiait pas que les contacts rangés gardent leur « à vérifier » (`sansVerifier`) : corrigé (`d8b0099`), C8B est mis « à vérifier » avant le retrait, vérifié `verifie_le` NULL après, puis remis en l'état.
- AD-25 (spine) et FR-12 (PRD) disaient encore « six catégories de départ non retirables » : corrigé (`d8b0099`), amendements datés.

Mineurs (notés, non corrigés) :
- Commentaires faux : `categories-regles.ts` cite le ticket 238 (c'est 240) et dit que `accord` cite les catégories de départ (il ne lit que l'étape) ; l'en-tête de `api/categories.ts` annonce 400 pour une destination inconnue (le code et l'essai : 404).
- La story range la ligne `sansVerifier` sous « Ce qui reste » alors qu'elle est faite.
- Import : si la catégorie de départ la plus haute a été retirée, la fiche arrive « à ranger » au lieu de la suivante encore présente (FR-9 affaibli, choix de la story) ; une fiche sans catégorie n'est pas restreinte par la case d'envoi groupé (`coalesce(…, 1)`), l'accord reste exigé.
- Import : une catégorie retirée entre la lecture de `existantes` et l'écriture ferait échouer le morceau sur la clé étrangère (très improbable) ; la clé `a_ranger` s'affiche telle quelle dans `scripts/claude-import.mjs` ; le rabat « à ranger » n'est couvert par aucun essai.
- `showPicker` sur une liste n'existe pas dans les Safari anciens : deux clics y restent, sans erreur (à constater à l'œil sur l'appareil d'Anne).
- Une coupure réseau pendant un retrait avec destination affiche « rien n'a été changé » alors que des contacts ont pu être rangés.
- Boucle de rangement sans plafond de passes (s'arrête quand un passage ne range rien ; carnet de quelques milliers de contacts, sans risque aujourd'hui).
- La confirmation ne dit pas la règle d'envoi groupé de la destination (l'accord reste exigé).
- Essai 18.15 : la remise en l'état n'est pas dans un `finally` ; cas non couverts (destination mal formée, une seule catégorie, course entre rangement et suppression).
- `required` sans effet sur la liste hors formulaire (le contrôle est dans le clic).
- `espace/README.md` § 18.6 (« choisir une catégorie marque vérifié ») et § 18.9 (catégorie de départ) ne citent pas les exceptions de 18.15.

Écartés :
- Destination supprimée pendant le retrait → erreur 500 de clé étrangère : écarté, `ecrire` vérifie la catégorie dans la même exécution D1 ; le résultat est `pas_vide`, catégorie gardée.
- Le `blur` refermerait la liste ouverte par `showPicker` : écarté, l'ouverture de la liste native ne retire pas le focus.
- `request.headers.get(ENTETE_COMPTE)!` : écarté, `worker.ts` pose toujours l'en-tête après le contrôle d'accès, comme pour les autres routes de l'espace.
- « Ancien client » défini par `categorie_id = 'anciens_clients'` (AD-25) : écarté pour le code, `accord.ts` ne lit que l'étape ; la règle est mise à jour dans l'amendement d'AD-25.
- Les vues enregistrées ne sont pas réécrites vers la destination : écarté, choix assumé et motivé dans la story (point 5).
