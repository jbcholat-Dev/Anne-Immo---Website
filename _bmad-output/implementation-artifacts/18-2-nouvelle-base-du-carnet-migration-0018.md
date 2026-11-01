---
story: 18.2
epic: 18 — Espace d'Anne : le carnet de contacts
statut: review
date: 2026-11-01
maj: 2026-11-01
---

# Story 18.2 — La nouvelle base du carnet (migration 0018)

## Objectif
Que la table des contacts accueille tout le carnet d'Anne (les 882 contacts de son téléphone, LinkedIn, l'EDB…) sans rien perdre de l'existant, pour que l'import (18.10) et la page Contacts (18.4) aient leur base. Un contact du carnet n'est pas forcément « suivi » (dans le pipeline) : son étape est vide. Architecture `architecture-espace-anne-2026-11-01`, AD-22 à AD-27, AD-31, AD-34.

Ajouts de la revue de code de la story 18.1 (demandés le 01/11 par le fil) : colonne `suivi_le`, filtre de `rattacherInconnus` sur cette date, entrée dans le suivi par « Ajouter », liens Leedflow limités aux contacts suivis, recherche du numéro dans `contact_coordonnee`.

## Ce qui est fait (2026-11-01)
- **`site/migrations/0018-carnet.sql`**, dans l'ordre d'AD-23 :
  1. tables `categorie` (six catégories de départ à identifiants fixes, avec canal conseillé, demande, appel permis et envoi groupé permis selon FR-12) et `message_type` (vide : JB écrira les messages, FR-13) ;
  2. copie de `contact_evenement`, `leedflow_tache`, `leedflow_lien`, `campagne_destinataire` et des couples `lead.id`/`contact_id` dans des tables ordinaires `_sauve_*` ;
  3. `contact_nouveau` avec toutes les colonnes de 0007, 0010, 0012, 0013, plus `projet` (défaut `a_qualifier`), `temperature`, `categorie_id`, `entreprise`, `verifie_le`, `ecarte_le`, `dernier_contact_le`, `dernier_contact_canal`, `appel_autorise` (NULL, 0, 1), `a_rappeler_le`, `ambassadeur_inscrit_le`, `ambassadeur_reglement`, `suivi_le` ; `etape` et `canal` facultatifs ; règle « prochaine action datée » seulement si `etape` n'est pas NULL ; « au moins téléphone, e-mail ou nom » gardé ; `CHECK` d'AD-24 (pas de température sur `a_qualifier` ni `ambassadeur`, `en_vente` seulement vendeur ou vendeur-acheteur, `recherche_active` seulement acheteur) ;
  4. reprise : projet = parcours sinon `a_qualifier` ; température `avec_anne` pour un contact de projet connu ni perdu ni en sommeil, `termine` pour vendu ou acte signé (projet connu seulement : sinon le `CHECK` d'AD-24 la refuse), sinon NULL ; catégorie `demandes_recues`, `verifie_le` = maintenant ; `suivi_le` NULL ;
  5. suppression de `contact`, renommage, les six index (dont l'unicité partielle téléphone et e-mail) plus `contact_categorie`, déclencheur `contact_action_auto` (sans effet quand `canal` est NULL) ;
  6. `contact_evenement` reconstruite avec les types `import`, `fusion`, `seance`, `classement` et la source `claude` en plus ; restauration des tables filles et de `lead.contact_id` ; suppression des `_sauve_*` ;
  7. `leedflow_ecarte` reconstruite : catégorie `prospect` en plus, colonne `contact_id` facultative (`ON DELETE CASCADE`) ;
  8. nouvelles tables `contact_coordonnee`, `import_lot` (`fichier` = nom seulement), `contact_source` (reprise : une ligne `espace` par contact existant), `vue` (cinq vues de départ : « À vérifier » `{"verifie":"non"}`, « Jamais recontactés » `{"dernier_contact":"jamais"}`, « Vendeurs chauds » `{"projet":["vendeur","vendeur_acheteur"],"temperature":["chaud"]}`, « Anciens clients » `{"categorie_id":["anciens_clients"]}`, « Ambassadeurs » `{"ambassadeur":"oui"}`), `opposition`, `nouveau`. Toute table qui référence `contact` le fait avec `ON DELETE CASCADE`. Pas encore `seance`, `seance_personne`, `action_prospection`, `activite`, `resultat` (epics 19 et 20).
- **Construction de l'espace** : `espace/scripts/migrations-a-jour.mjs`, appelé par `npm run build` après `scripts/base.mjs` : chez Cloudflare (`WORKERS_CI=1`), lit `npx wrangler d1 migrations list DB --remote` (dossier `../site/migrations`, champ `migrations_dir` de `wrangler.jsonc`) et arrête la construction s'il reste une migration à appliquer ; en local, ne fait rien et le dit ; `--essai <dossier>` fait la même vérification sur une base locale.
- **Code adapté**, sans changement visible pour les contacts suivis :
  - `espace/src/server/pipeline.ts` : liste des contacts, pipeline et bilan (comptes par canal, délai de rappel) ignorent les contacts `etape` NULL (Aujourd'hui, acheteurs, campagnes et tâches les ignoraient déjà par leurs conditions sur l'étape) ; un contact créé à la main ou par l'ancien import est rangé en `demandes_recues`, vérifié, projet tiré du parcours, `avec_anne` si le projet est connu ; `saisirContact` (page Ajouter, bouton « Ajouter » d'un numéro inconnu) fait entrer un contact du carnet dans le suivi (`a_qualifier`, prochaine action aujourd'hui, origine choisie notée s'il n'en avait pas, projet et température selon AD-24, événement « Carnet → À qualifier »), `suivi_le` laissé NULL (décision d'Anne : l'historique Leedflow du numéro est repris).
  - `espace/src/server/leedflow.ts` : `contactsParTelephone` cherche aussi dans `contact_coordonnee` (type `telephone`), contacts suivis seulement, numéro principal prioritaire ; un échange antérieur à `suivi_le` reste inconnu, à la relève comme dans `rattacherInconnus` (dont le `DELETE` ne retire que ce qui a été rattaché) ; `rangerTaches` et `lireSyntheses` ne suivent un lien Leedflow que vers un contact suivi.
  - `site/src/server/contacts.ts` : un contact nouveau venu d'une demande du site est rangé en `demandes_recues`, vérifié, projet tiré du parcours, `avec_anne` si connu. Une demande qui tombe sur un contact du carnet lui est rattachée sans le faire entrer dans le suivi : c'est la story 18.3.
- `espace/scripts/e2e-espace.mjs` : 13 constats nouveaux (voir plus bas).
- Documents : `site/README.md` (migration 0018), `espace/README.md` (vérification de construction, carnet), `RUNBOOK.md` § migrations (relancer l'espace après le site).

## Ce qui est vérifié (2026-11-01)
- **Répétition de la migration** sur une base locale remplie par l'essai de bout en bout complet de l'espace sur 0001-0017 (299 constats, tous bons), puis `npm run base:local` (0018 : 55 commandes, sans erreur). Comptes avant et après, et empreinte des lignes (identifiant, `contact_id`, type, statut) de chaque table fille, identiques :

  | Table | Avant 0018 | Après 0018 |
  | --- | --- | --- |
  | `contact` | 29 | 29 |
  | `contact_evenement` | 58 | 58 (mêmes id, dernier id 86, compteur repris à 86) |
  | `leedflow_tache` | 3 | 3 |
  | `leedflow_lien` | 3 | 3 |
  | `campagne_destinataire` | 2 | 2 |
  | `lead` (dont rattachées à un contact) | 3 (3) | 3 (3, mêmes `contact_id`) |
  | `leedflow_ecarte` | 2 | 2 |
  | `leedflow_inconnu` | 3 | 3 |
  | `campagne`, `action_marketing`, `prescripteur`, `passage_boitage` | 2, 3, 2, 3 | 2, 3, 2, 3 |
  | nouvelles : `categorie`, `vue`, `contact_source` | — | 6, 5, 29 (une ligne `espace` par contact) |

  Reprise des 29 contacts : 14 à qualifier sans température, 3 acheteurs avec Anne, 1 acheteur perdu sans température, 8 vendeurs avec Anne, 2 vendeurs sans température (perdu ou en sommeil), 1 vendeur terminé ; le contact « vendu » sans parcours reste à qualifier sans température. Tous en `demandes_recues`, vérifiés. `PRAGMA foreign_key_check` vide, aucune table `_sauve_*` restante, 7 index et le déclencheur recréés.
- **Preuve que la sauvegarde est nécessaire** : sur une copie de la même base, un simple `DROP TABLE contact` suivi d'un renommage, même avec `PRAGMA defer_foreign_keys = on`, laisse 0 événement, 0 tâche et 0 demande rattachée (au lieu de 58, 3, 3) : le local efface en cascade comme D1.
- **Vérification de construction** : `node scripts/migrations-a-jour.mjs` sans réglage → « construction locale, base distante non interrogée », code 0 ; `--essai` sur la base à jour → code 0 ; `--essai` sur la copie 0001-0017 → « 0018-carnet.sql pas encore appliquée », code 1.
- `site` : `npm run build` (clé Turnstile d'essai), `npm run check` (0 erreur, 0 avertissement), `npm run base:local` sur une base neuve (0001 à 0018).
- `espace` : `npm run build`, `npm run check` (0 erreur, 0 avertissement, 4 indications déjà présentes).
- `node scripts/e2e-espace.mjs` sur une base neuve 0001-0018 : **tout est bon (312 constats, dont 13 nouveaux)** :
  - 18.1/18.2 : un contact du carnet qui appelle ne reçoit pas l'appel ; le numéro reste inconnu, même après `rattacherInconnus` ;
  - un appel depuis l'autre numéro d'un contact suivi (`contact_coordonnee`) va sur sa fiche ;
  - les contacts du carnet n'apparaissent ni dans Contacts, ni dans le pipeline, ni sur « Aujourd'hui » ;
  - entrée seule dans le suivi (`suivi_le`) : l'appel d'après est rangé, l'appel privé d'avant reste inconnu ;
  - « Ajouter » sur un contact du carnet : entré dans le suivi (à qualifier aujourd'hui, origine et projet notés, avec Anne), `suivi_le` vide ; son historique Leedflow est repris, le numéro quitte les inconnus, l'entrée est notée ; il apparaît alors dans Contacts ;
  - la base refuse une température sur « à qualifier » ou « ambassadeur », « en vente » sur un acheteur, « recherche active » sur un vendeur, une valeur inconnue ; vendeur chaud et acheteur en recherche active acceptés ;
  - les six catégories existent avec leurs autorisations (appel / envoi groupé : anciens clients 1/1, proches 1/0, EDB 0/1, partenaires 1/1, lointains 0/0, demandes reçues 1/1) ;
  - une demande du site crée un contact « Demandes reçues », projet tiré du parcours, avec Anne ; un contact ajouté à la main aussi ;
  - vues de départ présentes (filtre JSON exigé) ; numéro classé « prospect » avec son contact accepté.

## Écarts assumés
- **Répétition sur une base locale remplie par l'essai**, pas sur une copie de la base d'essai (`wrangler d1 export`) comme le prévoit AD-23 : Claude n'a aucun droit D1 sur les bases distantes. La base locale contient des lignes dans chaque table fille (événements, tâches, liens, destinataires de campagne, demandes rattachées, numéros classés et inconnus).
- **Sauvegarde de la production avant fusion** : elle s'appuie sur le retour arrière automatique de D1 (« Time Travel », qui permet de remettre la base dans son état d'une minute donnée des 30 derniers jours) ; l'heure exacte sera notée au moment de la fusion, avec l'export fait par JB (action du tableau de bord).
- **`envoi_groupe_permis`** est un oui/non, comme le prévoit AD-25. « Demandes reçues : seulement avec accord » n'est pas une troisième valeur : tout envoi groupé passe par `accord.ts`, qui exige l'accord (sauf anciens clients) et vérifie les désinscriptions avant chaque envoi.
- **Contacts créés par le site et à la main marqués vérifiés** (`verifie_le` posé) : « Demandes reçues » est leur définition même, rien n'est proposé à confirmer ; cohérent avec la reprise de l'existant.
- **Reprise `contact_source`** : une ligne `espace` par contact existant, pour que le filtre « source » de la page Contacts les retrouve.
- **Format des filtres des vues de départ** : listes pour les clés à plusieurs valeurs (`projet`, `temperature`, `categorie_id`), texte pour oui/non et `jamais`. La story 18.5 fixe le vocabulaire dans `espace/src/server/vues` ; si elle choisit une autre forme, une migration 0019 réécrit ces cinq lignes.
- **La relève Leedflow applique aussi `suivi_le`** au rangement direct (pas seulement à `rattacherInconnus`) : sinon la relève, qui relit les 24 dernières heures, aurait versé les appels privés de la veille dès l'entrée dans le suivi.
- **Fiche, qualification et suite d'un contact du carnet** : non bloquées, mais aucun lien n'y mène tant que la page Contacts (18.4) et la fiche (18.7) n'existent pas.
- **Synchronisation projet / température avec le pipeline** (qualification, changement d'étape) : non faite ici ; AD-24 la confie à `carnet` (stories 18.6, 18.7).

## Revue de code
2026-11-01, session neuve (skill `bmad-code-review`), commit relu 3eec0dc (branche `claude/project-thread-cpjvnd`, pas encore poussée : 0018 pouvait encore être modifiée sur place). Corrections dans le commit « correction de la revue 18.2 », qui suit 3eec0dc.
1. Relance de 0018 après un arrêt à mi-chemin : les tables `_sauve_*` d'un essai interrompu feraient buter la création → corrigé (commit « correction de la revue 18.2 ») : `DROP TABLE IF EXISTS` de chaque `_sauve_*` en tête de 0018.
2. Répétition non reproductible, et pas sur une copie de la base d'aperçu → corrigé pour la reproductibilité (commit « correction de la revue 18.2 ») : `site/scripts/e2e-migration-0018.mjs` (base locale neuve à part, 0001-0017, 42 contacts fictifs de toutes les étapes avec et sans parcours, événements, tâches et liens Leedflow, destinataires de campagne, demandes rattachées, numéros classés et inconnus ; comptes et empreintes avant/après ; reprise ; relance ; garde de construction) : **22 constats, tous bons**. Copie de la base d'aperçu : écarté : Claude n'a aucun droit D1 sur les bases distantes (voir « Écarts assumés »).
3. Garde de construction trop raide (une erreur de lecture bloquait, une migration en cours d'application aussi) → corrigé (commit « correction de la revue 18.2 ») : erreur de lecture = avertissement et la construction continue ; migration manquante = nouvel essai toutes les 30 s pendant 10 min au plus, puis arrêt. Garde au moment où le Worker tourne : écarté pour l'instant (voir « Ce qui reste »).
4. Une demande du site sur un contact du carnet ne le fait pas entrer dans le suivi → reporté à la story 18.3 (son objet).
5. Types : `etape` et `canal` restaient non nuls dans `Contact`/`ResumeContact` ; `changerEtape` aurait écrit « undefined → … » pour un contact du carnet → corrigé (commit « correction de la revue 18.2 ») : `Etape | null`, `Canal | null`, libellés `libelleEtape` (« Carnet ») et `libelleCanal` (« Sans origine »), pages fiche, suite, qualifier, contacts, accueil, prescripteur corrigées ; un contact du carnet déplacé dans le pipeline reçoit projet et température selon AD-24, événement « Carnet → … ». `suivi_le` laissé vide dans ce cas : c'est un geste d'Anne (AD-32 : seule une entrée sans geste d'Anne pose `suivi_le`), comme « Ajouter ».
6. Tâches Leedflow trouvées par `leedflow_lien` : `suivi_le` ignoré → corrigé (commit « correction de la revue 18.2 »), essai e2e.
7. `NUMEROS_SUIVIS` : un numéro principal d'un contact et secondaire d'un autre donnait deux lignes → corrigé (commit « correction de la revue 18.2 ») : une ligne par numéro, le principal l'emporte ; essai e2e.
8. « À trier » montrait encore les échanges d'avant `suivi_le` d'un numéro devenu suivi → corrigé (commit « correction de la revue 18.2 »), essai e2e.
9. `saisirContact` : projet tiré du parcours choisi même quand le contact gardait le sien ; événement d'entrée écrit même si le contact était déjà suivi au moment de l'écriture → corrigé (commit « correction de la revue 18.2 ») : projet et température calculés sur le parcours retenu dans la même écriture ; événement écrit seulement si `etape IS NULL` au moment de l'écriture ; essai e2e.
10. Identifiants de `contact_evenement` réutilisables après reconstruction → écarté : le compteur est repris (vérifié : 84 → 84 dans l'essai de migration) et `nouveau.evenement_id` est en `ON DELETE SET NULL`.
11. Droits RGPD et `contact_coordonnee` → reporté à la story 18.3 (son objet).

Vérifications après corrections (base locale repartie de zéro, 0001-0018) : `site` `npm run build` (clé Turnstile d'essai), `npm run check` (0 erreur, 0 avertissement), `npm run base:local` ; `node scripts/e2e-migration-0018.mjs` : **22 constats, tous bons** ; `espace` `npm run build`, `npm run check` (0 erreur, 0 avertissement, 5 indications déjà présentes ou sans effet) ; `node scripts/e2e-espace.mjs` : **tout est bon (317 constats, dont 5 nouveaux de la revue)**.

## Ce qui reste
- Avant que 0018 atteigne `main` : JB fait l'export de la base de production et note l'heure du point de retour arrière (Time Travel). Action à ajouter au tableau de bord.
- Première poussée de la branche : la construction du site applique 0018 à la base d'aperçu, sans retour ; si l'espace est construit avant, sa construction échoue (voulu) et se relance. À surveiller : que le jeton de construction de l'espace a bien le droit de lire la liste des migrations D1.
- Story 18.3 : rattachement des demandes du site sur `contact_coordonnee`, entrée dans le suivi avec `suivi_le`, ligne `nouveau`, droits RGPD et purge sur les nouvelles tables, `opposition`.
- Une erreur dans 0018 se corrige par une migration 0019, jamais en modifiant 0018 une fois poussée.
- Revue de code 18.2, constat 3 : garde au moment où le Worker de l'espace tourne (refuser de servir si la base n'a pas la dernière migration), écartée pour l'instant ; la garde de construction suffit tant que le site est construit avant ou en même temps.
