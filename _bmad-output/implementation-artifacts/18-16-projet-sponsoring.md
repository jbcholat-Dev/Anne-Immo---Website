# Story 18.16 : le projet « Sponsoring » (ticket 243)

Epic 18 (le carnet de contacts). Statut : review. Date : 2026-11-04.

## Objectif

Anne recrute de futurs collaborateurs dans le réseau eXp (le « sponsoring »). Elle doit pouvoir classer ces personnes dans l'espace avec un projet à elles, comme elle classe des vendeurs ou des acheteurs. Décisions de JB : identifiant `sponsoring`, libellé « Sponsoring » ; une température froid, tiède ou chaud (comme un projet générique, donc ni « déjà en vente » ni « en recherche active ») ; pas de suivi des ventes pour lui.

## Ce qui est fait

- **Code** (`espace/src/server/tableau-colonnes.ts`) : `sponsoring` dans `PROJETS` et dans `PROJETS_AVEC_TEMPERATURE` ; nouvelle liste `PROJETS_DU_SUIVI` (vendeur, acheteur, vendeur et acheteur) ; `temperaturePermise` n'accepte pour `sponsoring` que froid, tiède, chaud (les autres valeurs restent refusées, `en_vente` et `recherche_active` comprises). `espace/src/server/carnet.ts` : la température « avec Anne » / « terminé » posée à un contact du suivi dont le projet change ne concerne que `PROJETS_DU_SUIVI` (sinon un contact du suivi passé en sponsoring aurait reçu « avec Anne »). Tout le reste (filtre, tableau, lot, fiche, création, vues, import) lit `PROJETS` ou `PROJETS_AVEC_TEMPERATURE` : rien d'autre à changer. Les projets existants se comportent comme avant.
- **Base** (`site/migrations/0020-projet-sponsoring.sql`) : SQLite ne sait pas élargir un CHECK, la table `contact` est reconstruite à l'identique (schéma lu sur une base locale à jour de 0001 à 0019), `sponsoring` en plus dans la liste de `projet`. Les CHECK de cohérence projet / température ne changent pas (`sponsoring` n'est pas dans la liste sans température ; `en_vente` et `recherche_active` lui restent refusés). Même méthode que 0018 : dix tables référencent `contact` (huit en cascade : `contact_evenement`, `leedflow_tache`, `leedflow_lien`, `campagne_destinataire`, `contact_coordonnee`, `contact_source`, `nouveau`, `leedflow_ecarte` ; deux en SET NULL : `lead` et `portail_courriel`) ; supprimer `contact` les viderait, même avec `PRAGMA defer_foreign_keys = true`, donc elles sont copiées dans des tables `_sauve_*`, restaurées avec leurs identifiants, puis les copies sont supprimées. Index (sept) et déclencheur `contact_action_auto` recréés ; relance possible après un arrêt à mi-chemin.
- **Répétition** (`site/scripts/e2e-migration-0020.mjs`) : voir ci-dessous.
- **Essai de l'espace** (`espace/scripts/e2e-espace.mjs`) : un constat 18.16 dans la partie /api/carnet (projet sponsoring + chaud accepté, « en vente » et « en recherche active » ignorés, annulation qui rend le contact à l'identique).
- **Documents** : `espace/README.md` (paragraphe 18.16), AD-24 du spine d'architecture et glossaire « Projet » du PRD (une ligne datée).

## Ce qui est vérifié

- `node site/scripts/e2e-migration-0020.mjs` : tout est bon. Base neuve 0001 à 0019, 14 contacts de tous les projets et 8 cartes « Nouveaux », données dans les dix tables liées ; après 0020, mêmes comptes et mêmes empreintes dans 21 tables (contact, événements, tâches et liens Leedflow, destinataires, coordonnées, sources, nouveaux, demandes, e-mails de portail, numéros classés…), compteurs automatiques inchangés, 60 objets de `sqlite_master` identiques (seule la table `contact` change, et seulement par `sponsoring`), huit index et déclencheur présents, `PRAGMA foreign_key_check` vide, dix références vers `contact` résolues, sponsoring + chaud, froid, tiède et sans température acceptés, + `en_vente` et + `recherche_active` refusés, projet inconnu refusé, règles des autres projets inchangées, déclencheur toujours actif, suppression d'un contact toujours en cascade.
- `cd espace && npm run build` : réussi. `npm run check` : 0 erreur, 0 avertissement (5 indications). `node --check espace/scripts/e2e-espace.mjs` : ok. L'essai complet de l'espace n'est pas relancé ici (JB le lance).
- `site/src` non touché : pas de construction du site.

## Ce qui reste

- Appliquer la migration 0020 sur la base distante au moment de la mise en ligne de l'espace (jamais fait depuis cette session) ; sans elle, choisir « Sponsoring » est refusé par la base.
- Lancer `node scripts/e2e-espace.mjs` (constat 18.16).
- Revue de code (story 9.8) dans une session neuve avant fusion : la PR touche `espace/src/`.
- Doute noté : un contact « Sponsoring » que l'on ajoute au suivi des ventes à la main perd sa température (comme un projet sans température), car « avec Anne » n'est posée que pour vendeur et acheteur ; à confirmer avec JB si le cas se présente.
