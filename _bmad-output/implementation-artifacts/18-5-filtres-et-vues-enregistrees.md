---
story: 18.5
epic: 18 — Espace d'Anne : le carnet de contacts
statut: review
date: 2026-11-02
maj: 2026-11-02
---

# Story 18.5 — Filtres et vues enregistrées

## Objectif
Qu'Anne combine des filtres sans écrire de formule et les retrouve d'un clic sous un nom (« Vendeurs chauds », « EDB jamais recontactés »), sur la page Contacts : filtres de FR-2 plus « à rappeler » (FR-16), affichés en pastilles au-dessus du tableau et retirés d'un clic chacun, combinés avec la recherche ; vues enregistrées dans la colonne de gauche, créées depuis les filtres choisis, renommées, supprimées avec annulation immédiate, « Tous les contacts » indélébile. Toute écriture passe par une route de l'espace qui valide le filtre contre le vocabulaire fermé d'AD-27. Et que la recherche reste rapide : la revue de la 18.4 avait mesuré 722 ms pour une recherche par numéro avec 1 228 contacts ; cible, chaque recherche ou filtre sous 300 ms, attente de 120 ms comprise. PRD `prd-espace-anne-2026-11-01` FR-1, FR-2, FR-16 ; architecture AD-22, AD-27, AD-32 ; maquette `ux-espace-anne-2026-11-01` (artefact FUmUuJZTnjf3pG7HJWXH7Z).

## Ce qui est fait (2026-11-02)
- **`espace/src/server/vues.ts`** (sans base, importé par le serveur et par l'îlot du navigateur, AD-27 « défini une fois ») : le vocabulaire fermé (`VOCABULAIRE`) : `categorie_id`, `projet`, `temperature`, `source`, `ville`, `accord` (listes de valeurs ; un contact passe s'il a l'une d'elles), `entreprise_contient`, `recherche` (textes bornés), `verifie`, `ecarte`, `pipeline`, `ambassadeur`, `a_rappeler` (choix fermés), `dernier_contact` (`jamais` ou 1 à 3 650 jours). `verifierFiltre` refuse une clé inconnue, une valeur hors liste (projet, température, source, accord, catégorie absente de la table `categorie`), une liste vide, en double ou de plus de 30 valeurs, un texte vide ou trop long, une durée hors bornes. `preparerFiltre` (prédicat préparé une fois, appliqué ligne par ligne), `pastilles` (libellés des filtres actifs), `retirer`, `ajouter`, `nomVue` (1 à 60 caractères, sans caractère de contrôle).
- **`espace/src/server/vues-base.ts`** : seul module qui lit et écrit la table `vue` (`listerVues`, `creerVue`, `renommerVue`, `supprimerVue`, `idsCategories`). Le filtre est revérifié à la lecture : une vue devenue invalide (catégorie supprimée) perd les seules valeurs refusées au lieu de casser la page.
- **`espace/src/pages/api/vues.ts`** : `POST` crée (ou, avec `id` et `ordre`, remet une vue qui vient d'être supprimée : c'est l'annulation), `PATCH` renomme, `DELETE ?id=` supprime et renvoie la vue telle qu'elle était. Corps JSON seulement (un formulaire d'un autre site ne peut pas l'envoyer), 8 000 caractères au plus. Contrôle d'accès des autres routes de l'espace (en-tête du compte posé par `worker.ts` après Cloudflare Access) ; le jeton de service de Claude est refusé (403) en plus de ce que fait déjà `worker.ts`. 400 pour toute clé ou valeur inconnue, 404 pour une vue inconnue, 400 pour un identifiant qui n'est pas un ULID (« Tous les contacts » n'a pas d'identifiant).
- **`espace/src/server/tableau.ts`** : lit aussi `a_rappeler_le` et `ambassadeur_inscrit_le` ; `lireCategories` (ordre de la table).
- **`espace/src/server/tableau-colonnes.ts`** : `indexer` calcule **une seule fois par ligne, au chargement**, le texte de recherche sans accents (prénom, nom, ville, entreprise, e-mails), les numéros réduits aux chiffres aux formats international et français (« 33612345678 0612345678 »), la ville et l'entreprise sans accents, la date du dernier contact en millisecondes. `preparerRecherche` ne lit plus que cet index (même logique que la 13.24 et la revue 18.4 : un morceau de numéro, avec ou sans espaces, en 0, en +33 ou en 0033, est cherché dans tous les numéros, et aussi tel quel dans le texte).
- **`espace/src/pages/index.astro`** :
  - barre de filtres sous la recherche, à la manière de la maquette : Catégorie, Projet, Température, Source et Ville (celles des contacts chargés), Entreprise contient, Dernier contact (jamais recontacté, plus d'un mois, 3 mois, 6 mois, un an), État (à vérifier, vérifiés, écartés), Autres filtres (accord e-mail, dans ou hors du suivi des ventes, ambassadeurs, à rappeler) ;
  - pastilles des filtres actifs au-dessus du tableau, une par valeur (« Projet : Vendeur ✕ »), retirée d'un clic ; « Tout retirer » dès deux pastilles ; compteur « N contacts sur M » ;
  - sans le filtre « Écartés », les écartés restent masqués ; « Écartés » ne montre qu'eux ; un seul état à la fois ;
  - filtres et recherche se combinent ;
  - colonne de gauche : « Tous les contacts », puis les vues de la table `vue` avec leur compteur ; au survol ou au clavier, ✎ (renommer) et × (supprimer) ; « + Nouvelle vue avec ces filtres » ouvre une fenêtre qui rappelle les filtres et demande le nom ; puis le bloc « Catégories » de la maquette (un clic = filtre sur cette catégorie) ;
  - suppression immédiate, message « Vue « … » supprimée » avec **Annuler** pendant 10 secondes, qui remet la vue avec le même identifiant, le même nom, le même ordre et les mêmes filtres ;
  - **sécurité** : tout texte venu des données (noms de vues, de catégories, villes, sources, contacts) passe par `esc()` avant d'entrer dans le HTML, ou par `textContent` / `value` (titre et aide de la fenêtre, champ du nom, message) ; données de la page dans des `<script type="application/json">` avec `<` échappé ;
  - **vitesse** : index calculé au chargement ; HTML de chaque ligne gardé tant que les colonnes affichées ne changent pas ; les 120 premières lignes écrites tout de suite, la suite par paquets de 400 aux images suivantes (attribut `data-complet` sur le corps du tableau quand tout est écrit, utilisé par les essais).
- **Essais** : `espace/scripts/e2e-espace.mjs`, constats nouveaux ci-dessous ; les essais 18.4 attendent désormais la fin de l'écriture par paquets (`data-complet`) ; l'essai de vitesse passe à 1 150 contacts fictifs (environ 1 230 en tout) et mesure chaque geste jusqu'au tableau peint.
- **Documents** : `espace/README.md`, statut de sprint (18-5 en `review`).

## Ce qui est vérifié (2026-11-02)
- `site` : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build`, `npm run check` (0 erreur, 0 avertissement), `npm run base:local`. La story ne change pas `site/` : `e2e-gestion` non relancé.
- `espace` : `npm run build`, `npm run check` (0 erreur, 0 avertissement, les 5 indications déjà présentes).
- `node scripts/e2e-espace.mjs` : **tout est bon, 373 constats** (354 avant la story), dont 19 nouveaux de la 18.5 (et l'essai de vitesse de la 18.4 refait) :
  - chaque filtre, 21 essais sur quatre contacts fictifs d'une ville propre à l'essai et un écarté : ville, catégorie, projet (une puis deux valeurs), pastille retirée (une valeur, puis toutes), température, source, entreprise contient (et case vidée quand la pastille part), vérifiés, à vérifier, écartés seuls, écarté masqué sans ce filtre, accord, jamais recontacté, dernier contact plus ancien que 3 mois (jamais recontacté compris, contact d'il y a 10 jours exclu), dans le suivi, hors suivi, ambassadeurs (inscrit), à rappeler (date d'hier gardée, de demain non) ;
  - combinaison : ville + catégorie + recherche par nom ; un nom hors de la catégorie ne sort pas ; compteur juste ; « Tout retirer » ;
  - vues : « Nouvelle vue avec ces filtres » enregistre `{"ville":[…],"projet":["vendeur"]}` ; nom `Essai vue <b>…</b>` montré tel quel, sans balise dans la page ; compteur de la vue ; « Tous les contacts » puis la vue retrouve ses filtres ; renommage (filtres inchangés) ; suppression puis « Annuler » (même identifiant, même nom, mêmes filtres) ; « Tous les contacts » sans bouton de suppression ni de renommage ; vue de départ « Vendeurs chauds » appliquée ;
  - `/api/vues` : 400 pour une clé inconnue, une valeur inconnue, une catégorie inconnue, une durée hors bornes, une valeur seule au lieu d'une liste, un nom vide, un corps qui n'est pas du JSON, sans rien écrire ; 201 pour un filtre du vocabulaire ; `DELETE ?id=tous` et `?id=Tous les contacts` : 400, vue inconnue : 404, aucune vue touchée ; sans jeton, avec le jeton de Claude (création et suppression) : 403 ;
  - les fichiers de `/api/claude/` n'importent ni le tableau ni les vues, et leurs réponses ne contiennent ni nom de vue ni contact ;
  - vitesse, avec **1 273 contacts** (1 150 fictifs ajoutés puis retirés), chaque geste mesuré depuis un tableau au repos jusqu'au tableau redessiné et peint, attente de 120 ms comprise pour la recherche (seuil 300 ms) ; entre parenthèses, jusqu'à la dernière ligne écrite par paquets :
    - recherche par numéro « 06 99 00 05 » : **171 ms** (171), contre 722 ms mesurés à la revue de la 18.4 ;
    - recherche par mot « perf » : 187 ms (571) ; recherche effacée : 166 et 169 ms (490, 492) ; recherche dans une catégorie filtrée : 177 ms (190) ;
    - filtre projet : 81 ms (467) ; filtre catégorie avec projet : 80 ms (250) ; pastille retirée : 42 et 47 ms (86, 90) ; vue « À vérifier » : 65 ms (358) ; « Tous les contacts » : 66 ms (403) ;
    - tris par nom, ville, dernier contact : 78, 80, 66 ms (471, 508, 376) ;
    - pire : **187 ms**. Un passage précédent, avec 1 081 contacts : pire 194 ms.
  Passages précédents ratés sur l'essai lui-même, corrigés : numéros fictifs déjà pris par d'autres essais (contrainte d'unicité), serveurs d'un passage interrompu restés sur les ports.
- Captures regardées (`espace/.verif/espace-contacts-1440.png`, `-1280.png`, `-filtres-1440.png`, `-pastilles-1440.png`, `-nouvelle-vue-1440.png`, `-vue-supprimee-1440.png`, `espace-accueil-contacts-ordinateur.png`) : barre de filtres en pastilles arrondies sur deux lignes à 1440 et 1280 px, pastilles des filtres actifs et compteur à droite, colonne de gauche avec vues et compteurs puis catégories, fenêtre du nom (nom avec balises montré tel quel), message noir « Vue « … » supprimée · Annuler » en bas ; pas de débordement horizontal à 1440 ni 1280 px.
- Base locale : la base d'essai gardée d'un essai à l'autre contenait 156 contacts « à qualifier » d'essais précédents, au-delà des 100 que montre « Aujourd'hui », d'où un constat raté sans rapport avec la story (« la demande du site est à rappeler »). Elle a été mise de côté (`site/.wrangler/state-avant-18-5`, ignoré par Git, rien d'effacé) et recréée par `npm run base:local` ; tous les constats ci-dessus sont sur cette base neuve.

## Écarts assumés
- **Deux clés de plus qu'AD-27** : `ambassadeur` (déjà dans la migration 0018 et la vue de départ « Ambassadeurs », AD-22) et `a_rappeler` (FR-16, demandé par la story : la date « à rappeler le » est arrivée, aujourd'hui ou avant, heure de Paris, AD-29). À journaliser dans le spine d'architecture au moment de la revue (amendement d'AD-27).
- **Forme des valeurs** (AD-27 ne la fixait pas) : listes pour catégorie, projet, température, source, ville et accord (comme les vues de départ de la migration 0018), un contact passe s'il a l'une des valeurs ; choix uniques pour les autres. `accord` prend les états de la colonne « Accord e-mail » (accord, ancien client, sans accord, désinscrit, sans e-mail). `ville` : égalité sans accents ni majuscules ; `entreprise_contient` : morceau du nom sans accents.
- **« Dernier contact plus ancien que N jours » compte aussi les jamais recontactés** : pour prospecter, une personne jamais recontactée l'est « depuis plus longtemps » que tout le monde ; « Jamais recontacté » reste un choix à part.
- **La recherche n'est pas enregistrée dans une vue** (comme dans la maquette) : la fenêtre le dit. La clé `recherche` reste acceptée par le serveur (vocabulaire d'AD-27) ; une vue qui en porte une la met dans la case de recherche.
- **Choisir une vue remplace les filtres mais garde la recherche en cours** ; « Tous les contacts » retire les filtres, pas la recherche.
- **Renommer** (✎ au survol, absent de la maquette, demandé par FR-2) ouvre la même fenêtre que la création. Les noms en double sont permis.
- **Annulation** : une suppression est réelle tout de suite (ligne effacée) et l'annulation la recrée avec le même identifiant ; pas de colonne « supprimée le » (pas de migration 0019 pour cela). Le message reste 10 secondes.
- **Bloc « Catégories »** de la maquette construit (un clic remplace les filtres par cette catégorie) ; le bloc « Reste à vérifier » reste pour la 18.10.
- **Filtres de la barre en listes déroulantes qui ajoutent une valeur** (une pastille par valeur), à la manière de la maquette, plus « Ville », « Autres filtres » (accord, suivi, ambassadeurs, à rappeler) et « Entreprise contient » en case de texte. Les choix de Source et de Ville sont ceux des contacts chargés.
- **Écriture du tableau par paquets** (120 lignes, puis 400 par image) : tant que la dernière n'est pas écrite (quelques dixièmes de seconde avec 1 200 lignes), la recherche du navigateur (Ctrl+F) ne voit pas les lignes du bas.
- **Filtres non gardés au rechargement** de la page (ni dans l'adresse) : une vue sert à cela.

## Ce qui reste
- Revue de code en session neuve (`bmad-code-review`), puis passage à `done`.
- Fait : amendement d'AD-27 journalisé dans le spine d'architecture (02/11).
- Story 18.6 : cases à cocher, actions groupées ; FR-17 : choix des destinataires d'une campagne par une vue (le filtre se relit avec `verifierFiltre` et `preparerFiltre`).
- Ordre des vues : pas de glisser-déposer (nouvelle vue en dernier) ; à proposer si Anne le demande.

## Revue de code
