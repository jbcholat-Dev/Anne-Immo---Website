# Revue adverse du spine « Espace d'Anne — contacts et prospection » (2026-11-01)

Spine relu : `ARCHITECTURE-SPINE.md` (AD-22 à AD-29). Contre-lectures : spine parent (AD-16, AD-18 à AD-21), PRD (FR-1 à FR-25), migrations `site/migrations/0007, 0010, 0012, 0013, 0014`, code `espace/src/server/*`, `site/src/server/{contacts,purge,rights}.ts`.

## Verdict

Le spine n'est pas prêt à servir de contrat de construction : trois de ses AD sont infaisables ou fausses contre le code réel (reconstruction de `contact`, « seul `carnet` écrit », purge et effacement), plusieurs formes de données sont laissées libres entre stories (vocabulaire de canal, état vérifié/écarté, « dernier contact », « modifié à la main »), et quatre exigences du PRD n'ont aucune gouvernance (annulation d'une action groupée, résultats FR-24/25, éléments de méthode FR-13, contacts existants FR-11).

Gravité : B = bloquant (la construction casse ou perd des données), M = majeur (deux stories divergent), m = mineur.

---

## 1. Faisabilité contre le schéma réel

### 1.1 (B) La reconstruction de `contact` efface ses enfants et perd son déclencheur

AD-22 impose de rebâtir `contact` (`etape` et `canal` deviennent NULL-ables ; les `CHECK` de 0007 énumèrent les valeurs et ne se modifient pas par `ALTER`). Le spine dit seulement « copie toutes les lignes et recrée index et clés étrangères ». Contre 0007 à 0014 :

- Cinq tables pointent vers `contact` : `contact_evenement` (CASCADE), `leedflow_tache` (CASCADE), `leedflow_lien` (CASCADE), `campagne_destinataire` (CASCADE), `lead.contact_id` (SET NULL). Un `DROP TABLE contact` avec clés étrangères actives fait un `DELETE` implicite qui **déclenche ces actions** : historique, tâches, liens Leedflow et destinataires de campagne seraient supprimés, `lead.contact_id` mis à NULL. Le commentaire de `purge.ts` confirme que le code ne veut pas dépendre de cette mécanique.
- L'ordre classique « renommer l'ancienne en `contact_old`, créer la nouvelle » est pire : SQLite réécrit alors les clés étrangères des enfants vers `contact_old`. Il faut créer `contact_nouveau`, copier, **sauvegarder les cinq tables enfants** (ou les vider en tables temporaires), supprimer, renommer, restaurer.
- Le déclencheur `contact_action_auto` (0010) meurt avec la table ; il doit être recréé, ainsi que les 5 index (`contact_telephone`, `contact_email`, `contact_etape`, `contact_reveil`, `contact_derniere_activite`) et `contact_action` (0010, index sur `action_id`).
- Les colonnes ajoutées par `ALTER` en 0010 (`action_id`), 0012 (5 colonnes `synthese*`) et 0013 (3 colonnes `email_*`) doivent figurer dans le `CREATE` de la nouvelle table, sinon elles disparaissent en silence.
- Le `CHECK` d'AD-20 écrit en 0007 (`etape IN (...) OR ... OR (etape NOT IN (...) AND prochaine_action_le IS NOT NULL)`) renvoie NULL quand `etape` est NULL : il passe, mais par accident. La nouvelle règle doit être écrite explicitement (`etape IS NULL OR ...`).
- La migration est appliquée « contre les deux applications » (AD-19) : D1 exécute chaque fichier dans une transaction ; les `PRAGMA` de clés étrangères y sont limités (`defer_foreign_keys` seulement). Le spine ne dit pas comment prouver, avant la production, que le nombre de lignes des cinq tables enfants est identique avant et après.

Correction : ajouter à AD-22 (ou aux conventions de migration) la procédure exacte (copie des enfants, ordre de création/suppression/renommage, recréation du déclencheur, des index et des colonnes 0010/0012/0013) et un contrôle de comptage avant/après sur la base d'aperçu ; ou, mieux, éviter la reconstruction en ajoutant la valeur d'étape « hors pipeline » (impossible : le `CHECK` énumère) — donc la procédure est obligatoire.

### 1.2 (B) La purge et l'effacement vivent dans le site et ignorent les nouvelles tables

AD-16, AD-18 et AD-29 disent que purge et effacement « couvrent » `contact_source`, `seance_personne`, `contact_evenement`. Réalité :

- `site/src/server/purge.ts` et `site/src/server/rights.ts` sont **dans le Worker du site**, pas dans l'espace, et listent les tables enfants **explicitement** (« écrit en clair plutôt que confié aux clés étrangères »). Aucune AD n'attribue la modification de ces deux fichiers à une story.
- La purge est **un seul `DB.batch`** (transaction) : `DELETE FROM lead…` puis `DELETE FROM contact…`. Si `contact_source` ou `seance_personne` référencent `contact` sans `ON DELETE CASCADE` (le spine ne donne aucune action de clé étrangère pour les nouvelles tables), le `DELETE FROM contact` échoue au premier contact vieux de 3 ans, le batch est annulé, et **plus aucun lead n'est purgé**. S'ils ont `CASCADE`, la purge marche mais l'effacement explicite reste incomplet vis-à-vis de la preuve d'effacement.
- `import_lot` porte un nom de fichier et `seance.commentaire`/`note` du texte libre sur des personnes : le spine ne dit pas si ces données sont purgées ni quand.
- `effacer(email)` (AD-18, « par adresse e-mail ») retrouve les contacts par e-mail. Les contacts de prospection n'ont souvent **ni e-mail** (téléphone seul, lien de profil seul). Le droit d'effacement ne peut pas être exercé pour eux par l'écran actuel.
- **Le critère de purge est faux pour le carnet.** AD-16 purge sur `last_activity_at`. La coche « contacté » (AD-27) écrit `dernier_contact_le` mais pas `last_activity_at` ; un import non plus. Une personne appelée la semaine dernière mais importée il y a 3 ans serait purgée.

Correction : (a) dire que `purge.ts` et `rights.ts` sont modifiés dans la story de la migration 0018, avec liste des tables et `ON DELETE CASCADE` exigé sur `contact_source`, `seance_personne` (et `ON DELETE SET NULL` ailleurs) ; (b) exiger que toute écriture d'AD-25/AD-27 mette `last_activity_at` à jour par `carnet` ; (c) ajouter la recherche d'effacement par téléphone, lien de profil et identifiant.

### 1.3 (M) Le schéma réel ne permet pas ce que le spine suppose sur `contact_evenement`

0007 contraint `contact_evenement.type` à `creation, demande, note, etape, qualification, appel, email` et `source` à `site, anne, import, portail, leedflow`. AD-25 (« une fusion ») et AD-27 (coche « contacté ») exigent de nouveaux types (`fusion`, `contact`/`seance`) et peut-être une source `seance`. Ce `CHECK` ne se change pas sans **reconstruire aussi `contact_evenement`** (clé `AUTOINCREMENT`, deux index, clé étrangère vers `contact`). Le spine ne le voit pas. L'idempotence `(source, source_id)` devra aussi être choisie pour les lignes d'import (rejouer un lot ne doit pas dupliquer les événements), et la coche/décoche de la même personne dans deux séances.

Correction : lister `contact_evenement` dans la migration de reconstruction et fixer les valeurs de `type` et `source` ajoutées.

### 1.4 (M) Colonnes déjà présentes et collisions de noms

- `contact.canal` existe déjà et signifie **canal d'origine** (`boitage`, `site`, `portail`…) ; le spine introduit `dernier_contact_canal`, `seance_personne.canal`, `activite.type` sans fixer de vocabulaire (FR-16 : WhatsApp, SMS, e-mail, appel). Deux stories écriront `sms`/`telephone`/`appel`/`whatsapp` différemment, et `canal` seul sera lu tantôt comme origine tantôt comme moyen. Idem `contact.canal` (origine, une valeur) contre `contact_source.source` (origines, plusieurs) : deux propriétaires de « d'où vient cette personne ».
- Le bilan existant (`bilan.astro`, `coutsParCanal`) et le déclencheur `contact_action_auto` groupent par `contact.canal` et par `created_at`. 600 contacts importés avec `canal` NULL ou une valeur arbitraire fausseraient « contacts arrivés par canal » et coût par contact. Rien n'impose que ces requêtes ignorent `etape IS NULL`.
- `commune` « sert de ville » : OK, mais `lead.commune_bien` (commune du bien) alimente `contact.commune` par `COALESCE` dans `rattacherLead` : une commune de bien peut se retrouver comme ville de résidence d'un contact du carnet. Ambiguïté de sens à trancher.

---

## 2. Deux unités qui respectent chaque AD et construisent de façon incompatible

### 2.1 (B) Deux « écrivains » de `contact` — l'AD dit un seul, le code en a une dizaine

La règle centrale (« seul `espace/src/server/carnet` écrit ces colonnes » ; « un module n'écrit que ses tables ») est fausse dès aujourd'hui pour `contact` : `pipeline.ts` (INSERT/UPDATE de `prenom, nom, telephone, email, commune, parcours, etape…`), `accord.ts`, `actions.ts`, `leedflow.ts`, et, **dans l'autre Worker**, `site/src/server/contacts.ts` (INSERT/UPDATE complet via `rattacherLead`), `liens.ts`, `purge.ts`, `rights.ts`.

- Le diagramme montre `SITE -. rattachement seul .-> CA` ; or le site est un Worker différent, il **ne peut pas appeler** `espace/src/server/carnet`. Il écrit en SQL, aujourd'hui avec la liste de colonnes 0007. Aucune AD ne dit comment le site doit se comporter face à un contact du carnet (`etape` NULL) : `rattacherLead` fait `COALESCE(prenom, …)`, ne renseigne pas `prochaine_action_le`, et ne sait pas « faire entrer dans le pipeline ». Un lead du site rattaché à un des 600 contacts importés le laisserait avec `etape` NULL : la demande de la prospecte n'apparaîtrait nulle part dans « Aujourd'hui » (qui lit `etape`).
- Scénario de divergence : story A (`carnet`, tableau) change le projet en `vendeur` ; story B (`pipeline`, qualification existante) fixe `parcours = 'acheteur'` via `COALESCE(?3, parcours)`. AD-24 écrit « entrer dans le pipeline fixe `parcours` à partir du projet », mais le chemin inverse (le pipeline change `parcours` après coup) n'a pas de règle : deux colonnes pour la même vérité, chacune écrite par un module.
- Même défaut pour `prenom/nom/telephone/email/commune` : `carnet` et `pipeline` les écrivent tous les deux avec des règles de fusion différentes (`COALESCE` côté site, écrasement côté `pipeline.ts` ligne ~836).

Correction : amender l'AD-22 pour décrire **l'état réel** : trois écrivains nommés (`carnet`, `pipeline` pour les colonnes du pipeline, le site pour le rattachement), la répartition des colonnes entre eux, la règle « entrer/sortir du pipeline » (qui fixe `etape`, `prochaine_action_le`, `parcours`) et la règle qui dit que `rattacherLead` fait entrer un contact `etape` NULL en `a_qualifier` ; ou abandonner la promesse « un seul module ».

### 2.2 (M) Température et étape du pipeline : deux états du même fait

AD-24 donne `temperature ∈ {…, en_vente, avec_anne, termine}` ; AD-20 donne `etape ∈ {mandat_exclusif, en_vente, vendu, acte_signe, …}`. « en vente » existe dans les deux ; « avec Anne » ≈ mandat signé ; « terminé » ≈ vendu/perdu. Une story du pipeline passe un contact à `vendu` ; une story du tableau le laisse à `chaud`. Rien ne dit lequel gagne, ni si l'un dérive de l'autre. De plus `a_qualifier` désigne à la fois `projet` et `etape`.

Aussi : à la migration, les contacts existants (tous avec `parcours`, et une `etape`) reçoivent `projet = a_qualifier` par défaut, donc perdent la valeur de leur `parcours` dans le tableau ; le spine ne prévoit pas la reprise (`UPDATE` `parcours` → `projet`).

Correction : une règle de correspondance (ou d'exclusion : la température n'existe que pour `etape` NULL), et l'`UPDATE` de reprise dans 0018.

### 2.3 (M) « Vérifié », « écarté » et « modifié à la main » : définitions libres

- AD-26 : `etat ∈ {a_verifier, verifie, ecarte}` mélange deux axes que le PRD (FR-2) traite séparément (« vérifié ou non » **et** « écarté ou non »). Un contact écarté non vérifié est-il `a_verifier` ou `ecarte` ? Le compteur « reste à vérifier » (FR-6) compte-t-il les écartés ?
- `verifie_le` : qui l'écrit ? FR-4 (« changer la catégorie le marque vérifié »), FR-9 (saisie à la main = vérifié) et AD-25 (« sans jamais changer une catégorie vérifiée ») supposent trois écrivains ; le spine ne dit pas que seul `carnet.classer()` le pose. Un contact sans catégorie (existants, FR-11) : `a_verifier` ou ni l'un ni l'autre ?
- AD-25 : « les contacts qu'il a créés et qui n'ont pas été modifiés depuis ». Il n'existe pas de colonne « modifié le » sur `contact` ; `last_activity_at` est aussi bougé par Leedflow, les accords, la séance. Story A : modifié = `last_activity_at > created_at` ; story B : = présence d'un événement non-import. Les deux sont conformes à l'AD, les deux annulent des lots différents.
- AD-25 promet de retirer « ses compléments des autres contacts » : cela exige l'**ancienne valeur** de chaque champ complété. `import_lot` n'a que des compteurs ; rien ne dit où elle est conservée (`contact_evenement.donnees` ? `contact_source` ?). L'annulation de fusion est donc **infaisable telle que spécifiée**.
- AD-27 : « décocher le même jour annule les trois ». Annuler `dernier_contact_le/canal` suppose de reprendre la valeur précédente (une autre séance le même jour ? la veille ?) : elle n'est stockée nulle part. « Le même jour » : en UTC (conventions) ou à Paris (une coche à 23 h 30 locale) ?

Correction : ajouter les colonnes ou la structure d'avant-image (`contact_evenement.donnees` normalisé, ou table `contact_avant`), définir `etat` en deux filtres indépendants, nommer le seul écrivain de `verifie_le`, et fixer le fuseau des jours (Europe/Paris) pour AD-27/AD-28 et la semaine du lundi.

### 2.4 (M) « Dernier contact » : une colonne qui ignore les contacts réels

AD-27 : « Aucun autre module n'écrit `dernier_contact_*` ». Or les appels Leedflow (`contact_evenement.type='appel'`), les e-mails et notes d'Anne dans le pipeline sont des contacts réels. Pour un contact du carnet appelé via Leedflow, `dernier_contact_le` resterait NULL : le filtre « jamais recontacté » (FR-2, ordre de séance FR-15) le rangerait en tête de séance alors qu'Anne l'a eu la veille. Soit la définition PRD (« dernière coche ») est gardée et alors les appels Leedflow n'y entrent pas (à écrire), soit une story calculera depuis `contact_evenement` et une autre lira la colonne. À trancher noir sur blanc.

Autres collisions du même type :
- `activite.fait` (colonne, AD-28) contre « quantité réalisée … calculée, jamais saisie » (AD-27) pour les séances : deux sources pour la même quantité ; la barre d'effort du bilan peut donner deux chiffres.
- `seance.activite_id` (écrit par `seance`) et `activite` (écrit par `semaine`) : le lien activité→séance appartient à une table du premier module et une table du second, alors que « seul `semaine` écrit ces tables ». Qui crée la séance quand on clique une activité (FR-20), et qui supprime `activite_id` quand l'activité est supprimée ? `ON DELETE` de `activite.action_id`, `action_prospection.vue_id`, `action_prospection.message_type_id` non fixés : supprimer une vue ou un message type doit-il être refusé, ou mettre NULL ?
- Un message type appartient à **une** catégorie (`message_type.categorie_id`), mais la séance (FR-15) et l'action « Parrainage = vue Ambassadeurs » portent des contacts de **plusieurs** catégories, et `appel_permis` est par catégorie : l'autorisation d'appeler (FR-16) se vérifie par contact, non par séance. Aucune AD n'attribue cette vérification à `seance` côté serveur ; une story la mettra dans l'îlot seulement.
- Placeholders : `{prénom}` (AD-23) contre `[Prénom]` des campagnes (0014) ; un seul module de remplacement n'est pas désigné.

### 2.5 (M) L'import : deux chemins existants et des cas d'identité non tranchés

- `pipeline.ts` contient déjà `importer()`/`apercu` (lots de 40, dédoublonnage téléphone/e-mail/nom, accord à l'import), servi par `importer.astro`, qui reste dans « Autres outils » (FR-14). AD-25 dit « tout import passe par `server/import` » mais ne retire pas l'ancien : deux chemins d'import avec deux règles de dédoublonnage coexisteraient, et l'ancien créerait des contacts avec `etape` et pas de catégorie.
- `contact.telephone` et `contact.email` ont chacun un index unique. Une ligne d'import dont le téléphone appartient au contact A et l'e-mail au contact B : fusion de A et B ? rejet ? Le spine ne le dit pas (c'est le cas « doublon probable » mais sur deux fiches). Une vCard Samsung porte **plusieurs** téléphones et e-mails ; il n'y a qu'une colonne de chaque : où va le second ? Perdu en silence, ou présent comme doublon à la prochaine importation.
- `profil_url` : une seule colonne unique, alors que le glossaire PRD admet LinkedIn, Instagram et Facebook pour la même personne, et que la fusion par lien de profil (FR-8) ne retrouve donc qu'un des trois. Aucune règle de normalisation (casse, `www.`, `/` final, paramètres) : les deux importeurs normaliseront à leur façon et l'index unique ne dédoublonnera rien.
- Le rangement par défaut (FR-9) cite des catégories par nom (« anciens clients ») alors qu'AD-23 impose de citer l'`id`. Les `id` sont des ULID (conventions) mais une migration SQL ne peut pas en générer : les cinq catégories ont besoin d'identifiants **fixes et connus du code** (ou d'une clé stable), sinon le pré-rangement ne sait pas où ranger.
- Le plafond `TAILLE_MAX` de 2 Mo du lecteur de tableur actuel et le temps d'un Worker pour 600 à 1 000 contacts (jusqu'à 3 000 écritures avec `contact_source` et événements) ne sont pas traités : « s'annule en entier » implique un lot atomique, ou des morceaux avec reprise (le code actuel écrit par 40 sans atomicité). À choisir.
- `vCard` : « parseur vCard 3.0 et 4.0 » dans `import (+ vcard)` : aucune bibliothèque, à écrire (cohérent avec « sans bibliothèque » de `tableur.ts`), mais les photos intégrées d'un export Samsung dépassent vite 2 Mo : le plafond doit s'appliquer au texte nettoyé ou être relevé.

### 2.6 (M) Les contacts existants (FR-11) contre « un seul carnet »

PRD FR-11 : les contacts de l'espace actuel **ne sont pas repris** dans le tableau. AD-22 les met dans la même table ; AD-26 dit que « le tableau charge tous les contacts non effacés » (le mot « effacés » est lui-même ambigu : RGPD, ou `ecarte_le` ?). Résultat : soit le tableau les montre (contre FR-11), soit une story invente un filtre (`etape IS NULL`, ou `categorie_id IS NOT NULL`, ou `is_test = 0`). De plus FR-8 impose qu'un import complète un contact existant de même téléphone/e-mail : un pipeline existant se retrouve **dans** le tableau après import, ce qui contredit FR-11 dans l'autre sens.

Effets de bord sur l'existant, non audités : « Aujourd'hui », « À trier », le bilan et l'éligibilité des campagnes lisent `etape` (`campagnes.ts` : `c.etape IN (…)`) ; `accord.ts` définit « ancien client » par `etape IN ('vendu','acte_signe')` alors que la catégorie « anciens clients » du carnet n'a pas d'`etape` : la règle FR-13 « envoi groupé permis pour les anciens clients » est donc fausse pour les 600 contacts importés (une story lira la catégorie, l'autre l'`etape`). L'import de numéros dans `contact` rend aussi ces numéros « connus » pour la relève Leedflow (appels attachés d'office, `prochaine_action` modifiée par `leedflow.ts` ~ligne 515 sur un contact sans `etape`), alors qu'AD-20 interdit de créer d'office un contact depuis un numéro inconnu pour protéger les appels personnels : un import « proches » transforme tous les appels de la famille en événements.

Correction : une AD (ou un amendement d'AD-22) : « le carnet = `etape` IS NULL ou `categorie_id` NOT NULL », la liste des écrans existants à filtrer, la définition unique d'« ancien client » pour `accord.ts`, et l'exclusion explicite des contacts hors pipeline de la relève Leedflow ou une décision assumée.

---

## 3. Cohérence avec les AD héritées

| AD héritée | Verdict | Détail |
| --- | --- | --- |
| AD-20 | Affaiblie | AD-22 retire à AD-20 son « écrivain unique `pipeline` » et sa règle « prochaine action datée » pour une partie des contacts. C'est annoncé (« amendé par AD-22 »), mais le parent n'est pas modifié : deux spines se contredisent, le parent dit toujours « Écrivain unique de ces tables : `pipeline` ». Il faut porter l'amendement dans le parent. |
| AD-16 | Non tenue | Voir 1.2 : la durée de 3 ans est mesurée sur `last_activity_at`, que ni l'import ni la coche n'alimentent ; la purge n'est pas étendue aux nouvelles tables. |
| AD-18 | Non tenue | Voir 1.2 : l'effacement est « par adresse e-mail » et réside dans le site. |
| AD-21 | Partiellement | « Sans nouvelle colonne » est vrai (`email_accord_source` accepte déjà `import`), mais `email_accord_source` ne distingue pas « animations EDB » des autres imports, et un import ne doit jamais effacer un `email_desinscrit_le` (règle de fusion absente). L'éligibilité `ancien client` : voir 2.6. |
| AD-9 / règle « Claude n'accède pas aux contacts » | Contradiction assumée à moitié | AD-25 ouvre `api/import` à Claude ; la mémoire dit « à trancher ». En attendant, le jeton de service existant (`api/claude`, `ACCESS_CLAUDE_ID`) ne doit pas permettre de lire les contacts : le spine ne fixe pas que `api/import` est **écriture seule** et que l'aperçu (qui révèle les doublons donc des contacts existants) n'est pas renvoyé à Claude. À écrire avant d'ouvrir la route. |
| AD-19 | Tenue | Migrations dans `site/migrations/`, `migrations_dir` du Worker de l'espace le confirme. |
| AD-4, AD-8 | Tenues | Aucune contradiction. |

---

## 4. Exigences du PRD sans gouvernance

1. **Annulation d'une action groupée (FR-4, hypothèse)** : les conventions la citent (« l'annulation de la dernière action groupée ») mais aucune AD ne dit où sont gardées les valeurs d'avant (même trou qu'en 2.3).
2. **Résultats (FR-24, FR-25)** : repoussés dans « Deferred » (« quand le PRD précisera les types »), alors que le PRD donne les trois types (rendez-vous, recommandation, mandat) et les liens (contact, séance, activité). La table, son écrivain et ses clés étrangères (effacement RGPD du contact !) sont sans AD ; le bilan doit les relire pour la semaine/mois/année.
3. **Méthode des catégories (FR-13)** : le PRD demande « canal conseillé », « ce qu'on demande », plusieurs messages types, deux autorisations. `categorie` n'a que `description` : pas de `canal_conseille`, pas de `demande`. Et la règle « envoi groupé permis seulement pour des contacts avec accord ou anciens clients » n'est portée par aucune AD (elle relève d'`accord.ts`, hors catégorie).
4. **Navigation (FR-14)** : « les liens existants continuent de fonctionner ». Le spine range l'existant dans `pages/autres-outils/`, ce qui **change leurs adresses**. Les chemins `pages/contacts/` (fiche, qualifier, suite), `pages/bilan.astro` (bilan des pubs, aussi `api/claude/bilan.ts`) et `pages/index.astro` (« Aujourd'hui ») existent déjà : le nouveau Contacts, le nouveau Bilan et la nouvelle page d'accueil entrent en collision de routes, et « Bilan » désignera deux choses.
5. **Quotas de volume (FR-1, < 1 s avec 1 000 contacts)** : AD-26 choisit de tout charger dans le navigateur, ce qui tient, mais le format de la réponse (colonnes, `contact_source` agrégées par contact, taille maximale) n'est pas fixé ; la route `api/contacts` existante (`export.ts`) n'est pas citée.
6. **Fuseau de la semaine (lundi–dimanche)** : conventions en UTC, jours `AAAA-MM-JJ` ; le « jour » d'une activité et d'une coche n'a pas de fuseau déclaré.
7. **Chevauchement d'activités (FR-20 hypothèse)** : AD-28 ne pose qu'une borne haute (`heure_debut + duree_h ≤ 19`) ; rien ne dit que les chevauchements sont permis, ni comment le serveur refuse un jour passé (FR-20), ni la correction « jusqu'à la fin de la semaine » (FR-21).
8. **Écarter (FR-5)** : « sortent des séances futures » est dit, mais pas des campagnes : `accord.ts`/`campagnes.ts` doivent exclure `ecarte_le` (un écarté ne reçoit pas de campagne), non gouverné.
9. **Question 5 du PRD (cadre légal)** : repoussée en « Deferred » avant le premier import réel ; l'information des personnes (art. 14 RGPD) n'a aucun support dans le spine (pas de colonne de base légale, ni d'écran).

---

## 5. Technologies et versions

`espace/package.json` : `astro ^7.3.4`, `@astrojs/cloudflare ^14.3.3`, `wrangler ^4.141.0`, `typescript ^6.0.3`. Installés dans `espace/node_modules` : Astro 7.4.0, @astrojs/cloudflare 14.4.0, Wrangler 4.151.0, TypeScript 6.0.3. Les versions du tableau « Stack » (7.3, 14.3, 4.141, 6.0) correspondent aux planchers des fourchettes, pas aux versions réellement installées : écrire « ≥ » ou les versions résolues. Le module `tableur` existe (`espace/src/server/tableur.ts`, `.csv` et `.xlsx` sans bibliothèque). Les bases `anne-leads` / `anne-leads-apercu` sont cohérentes avec `wrangler.jsonc`. **Absents du dépôt** : `server/carnet`, `categories`, `import`, `vues`, `seance`, `semaine`, `espace/src/islands/` et `pages/api/{import,vues,seances,semaine,categories}` (normal, à créer) ; `vcard` n'existe pas et n'est pas fourni par une bibliothèque. Conséquence : `islands/` introduit un répertoire que la configuration Astro de l'espace n'utilise pas encore ; le spine ne dit pas quel framework d'îlot (`astro` sans framework : script client natif ?) — le glisser-déposer « HTML natif » est cohérent, mais le tableau triable de 1 000 lignes avec colonnes masquables demande de décider « JavaScript natif, sans framework » explicitement.

---

## 6. Constats mineurs

- Identifiants : les tables existantes utilisent ULID `TEXT` ; `contact_evenement.id` est un entier `AUTOINCREMENT`. Les nouvelles tables doivent dire lesquelles suivent quoi (`seance_personne`, `contact_source` : clé composite ou `id` ?).
- `heure_debut` « 8 à 18 » : entier ou texte `HH:MM` ? `duree_h` et `vise`/`fait` : entiers ? Non fixé.
- `import_lot.par` / `seance.par` : le compte Access ; l'espace fait déjà `par` ailleurs, mais le jeton de service de Claude n'a pas d'adresse : valeur `claude` à prévoir (comme `action_marketing.auteur`).
- Le tableau « Capability → Architecture » ne gouverne pas FR-14 par une AD, seulement par le « Paradigme ».
- `contact` « a au moins un nom, un téléphone, un e-mail ou un lien de profil » : le `CHECK` d'origine acceptait déjà le nom seul ; le PRD (glossaire) exige « un nom **et** au moins un moyen » ; rejeté à l'import = ni nom ni moyen. Le `CHECK` actuel (nom seul accepté) est plus faible que le PRD ; décider lequel gagne.
- Suppression d'une vue référencée dans un filtre JSON ou une action : aucun garde-fou (le JSON ne peut pas porter de clé étrangère) ; `categorie_id` cité dans le JSON d'une vue n'est pas protégé par la règle « supprimer seulement si aucun contact ne la porte ».

---

## 7. Corrections proposées, par priorité

1. AD-22 : procédure de reconstruction complète (enfants sauvegardés/restaurés, déclencheur, index, colonnes 0010/0012/0013, `contact_evenement` aussi, comptage avant/après) ; clés étrangères de toutes les nouvelles tables avec leur action.
2. Amender AD-16/AD-18/AD-29 : modification de `site/src/server/purge.ts` et `rights.ts` dans la story de 0018 ; `last_activity_at` mis à jour par toute écriture du carnet, de la séance et de l'import ; recherche d'effacement par téléphone/profil/id.
3. Remplacer « seul `carnet` écrit » par la répartition réelle des écrivains de `contact` (`carnet`, `pipeline`, site) et la règle d'entrée/sortie du pipeline ; dire que `rattacherLead` fait entrer un contact de carnet en `a_qualifier`.
4. Fixer un vocabulaire fermé : canaux de contact, sources d'import, types/sources d'événement, `etat` en deux axes, unité des heures, fuseau (Europe/Paris).
5. Prévoir l'avant-image pour l'annulation de lot, de fusion, de coche et d'action groupée.
6. Décider le sort des contacts existants (FR-11) et auditer les requêtes existantes (`etape`, Leedflow, campagnes, bilan) ; dire comment « ancien client » est défini pour `accord.ts`.
7. Gouverner FR-13 (colonnes manquantes), FR-14 (adresses, collision de routes `contacts/` et `bilan`), FR-24/25 (table des résultats) et l'ancien chemin d'import.
8. Écrire que `api/import` est en écriture seule pour le jeton de Claude.
