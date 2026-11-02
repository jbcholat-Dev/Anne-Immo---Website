---
story: 18.3
epic: 18 — Espace d'Anne : le carnet de contacts
statut: done
date: 2026-11-01
maj: 2026-11-02
---

# Story 18.3 — Demandes du site et droits sur le nouveau carnet

## Objectif
Qu'une demande du site (formulaire de contact, diagnostic, guide, estimation, rendez-vous, et demain inscription sur /ambassadeurs) retrouve le bon contact, même s'il n'est connu que par un autre numéro ou un autre e-mail, sans créer de doublon ; qu'elle fasse entrer un contact du carnet dans le suivi et apparaisse dans la future barre « Nouveaux » ; et que les droits d'accès et d'effacement et la purge couvrent tout le carnet (nouvelles tables de la migration 0018). Architecture `architecture-espace-anne-2026-11-01`, AD-22, AD-26, AD-31, AD-32, AD-34 ; PRD FR-27 et glossaire (« Inscrit ambassadeur »).

## Ce qui est fait (2026-11-01)
- **`site/src/server/contacts.ts`** (rattachement des demandes, appelé par `capture.ts`, la route `/api/webhook-cal` et la tâche planifiée) :
  - `trouver` cherche le téléphone puis l'e-mail sur `contact` et dans `contact_coordonnee` (rang : téléphone principal, téléphone secondaire, e-mail principal, e-mail secondaire) ; exporté et réutilisé par `contactConnu` de l'espace ;
  - un contact trouvé dont l'étape est vide (contact du carnet) entre dans le suivi : `a_qualifier`, « Rappeler pour qualifier » (ou « Écrire pour qualifier » sans téléphone) pour maintenant, `suivi_le` = maintenant, parcours pris du projet s'il est vendeur ou acheteur, sinon de la demande ; projet tiré de la demande s'il était à qualifier ; température « avec Anne » pour un projet vendeur, acheteur ou les deux, NULL sinon ; origine « site » s'il n'en avait pas ; catégorie gardée ; événement « Carnet → À qualifier : demande depuis le site » ;
  - un contact nouveau est créé comme en 18.2 (catégorie « Demandes reçues », vérifiée) ;
  - dans tous les cas : une ligne `nouveau` de source `site` (`contact_id`, `recu_le` = date de la demande, `evenement_id` = l'événement « demande », une seule par demande) et une source `site` dans `contact_source` (une fois par contact) ;
  - le complément d'un contact ne prend plus un téléphone ou un e-mail déjà présent dans `contact_coordonnee` ;
  - **inscription ambassadeur** (source `ambassadeur`, epic 17) : la demande est lue avec `SELECT *` ; `reglement_version` et `reglement_accepte_le` sont lus s'ils existent (absents sur `main` aujourd'hui : ni la source ni ces colonnes n'existent dans `lead`). Pose `ambassadeur_inscrit_le` (date d'acceptation, sinon date de la demande) et `ambassadeur_reglement` (version ou NULL) ; la plus récente inscription l'emporte ; ni projet, ni catégorie, ni étape ne changent (pas de réveil d'un contact en sommeil). Une personne inconnue devient un contact du carnet, hors suivi, en « Demandes reçues », projet à qualifier.
- **`espace/src/server/pipeline.ts`** : pas de `rattacherOrphelins` côté espace (la tâche planifiée du site s'en charge) ; `contactConnu` (saisie à la main, « Ajouter ») et `connus` (ancien import) cherchent aussi dans `contact_coordonnee` ; `completer` ne prend pas une valeur de `contact_coordonnee`.
- **`site/src/server/opposition.ts`** (nouveau) : `empreinteOpposition` (HMAC SHA-256 hexadécimal de `opposition:<valeur>`, téléphone E.164 tel quel, e-mail en minuscules) et `ecrituresOpposition` (insertions `ON CONFLICT DO NOTHING`).
- **`site/src/server/rights.ts`** :
  - `CONTACTS_DE_L_ADRESSE` cherche aussi l'e-mail dans `contact_coordonnee` (export et effacement par adresse depuis `/gestion` du site et de l'espace) ; l'export d'un contact montre ses autres coordonnées et ses sources ;
  - `effacementDesContacts`, commun à `effacer` (par adresse) et `effacerContact` (fiche) : `nouveau`, `contact_evenement`, `contact_coordonnee`, `contact_source`, tâches et liens Leedflow, destinataires de campagne, `leedflow_inconnu` de **tous** les numéros du contact (principal et secondaires), classement Pro ou Prospect du numéro supprimé, classement Privé ou Démarchage **gardé** avec `contact_id` remis à NULL, puis le contact ;
  - empreintes de chaque téléphone et e-mail du contact (principaux et secondaires) et des adresses de ses demandes ajoutées à `opposition`, dans le même lot d'écritures.
- **`site/src/server/purge.ts`** : un contact dont la source a un lot d'import (`contact_source.import_lot_id`), jamais contacté (`dernier_contact_le` NULL), hors suivi et sans demande du site est effacé trois ans après son premier import, même classé depuis ; autres coordonnées, sources et lignes `nouveau` partent avec les contacts purgés ; une ligne `nouveau` de plus de trois ans part aussi. Règles existantes inchangées. Lecture tolérante : si les tables du carnet manquent, la purge des demandes continue (journal `purge_carnet_echec`). La table `resultat` (epic 20) n'existe pas : rien à faire.
- **Essais** : `espace/scripts/e2e-espace.mjs` (12 constats nouveaux, voir plus bas) et `site/scripts/e2e-gestion.mjs` (1 constat nouveau : purge des importés).
- **Documents** : `site/README.md` (story 18.3 et écarts), `espace/README.md`, `RUNBOOK.md` (`LIEN_SECRET` sert aussi à `opposition`), statut de sprint.
- Fait dans la même session, commit séparé « correction de la revue 18.2 » (33e674f) : voir la story 18.2, section « Revue de code ».

## Ce qui est vérifié (2026-11-01)
- `site` : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build`, `npm run check` (0 erreur, 0 avertissement), `npm run base:local` sur une base locale repartie de zéro (0001 à 0018).
- `espace` : `npm run build`, `npm run check` (0 erreur, 0 avertissement, 5 indications déjà présentes).
- `node scripts/e2e-espace.mjs` sur une base neuve : **tout est bon (329 constats, dont 12 nouveaux de la 18.3)** :
  - une demande du site faite avec l'autre numéro d'un contact du carnet (`contact_coordonnee`) lui est rattachée, sans doublon ;
  - il entre dans le suivi : à qualifier, à rappeler, `suivi_le` posé, projet tiré de la demande, avec Anne, catégorie gardée, origine site, e-mail complété ;
  - une ligne « Nouveaux » de source site, liée à l'événement de la demande ; entrée dans le suivi notée ; source « site » ajoutée ;
  - une deuxième demande : seconde ligne « Nouveaux », `suivi_le` et étape inchangés ;
  - la demande rattachée par la tâche planifiée a aussi sa ligne « Nouveaux » ;
  - inscription ambassadeur d'une personne connue : marque posée (date, version), projet, catégorie et étape inchangés, ligne « Nouveaux » ;
  - inscription ambassadeur d'une inconnue : contact du carnet hors suivi, « Demandes reçues », marque posée sans version ;
  - effacement depuis la fiche : empreinte HMAC des deux téléphones et de l'e-mail dans `opposition`, recalculée par l'essai avec le secret d'essai ;
  - effacement : autres coordonnées, sources, « Nouveaux » et échanges Leedflow de l'autre numéro vidés ;
  - effacement : numéro classé Privé gardé (sans lien), classement « prospect » parti ;
  - export par adresse : un e-mail secondaire retrouve le contact, ses autres coordonnées sont exportées ;
  - effacement par adresse : le contact de l'e-mail secondaire effacé, ses deux e-mails dans `opposition`.
  Un premier passage, entre minuit à Paris et minuit en temps universel, avait un seul constat en échec, ancien et sans lien avec cette story (« contact arrivé pendant la seule action de son canal », story 13.17 : l'essai date l'action au jour de Paris, la base compare au jour UTC de création) ; relancé après minuit UTC, tout est bon.
- Essais du site, base neuve : `e2e-gestion` **45 constats bons** (dont 1 nouveau : contact importé jamais contacté effacé trois ans après l'import même classé depuis, avec coordonnées et sources ; contacté, importé depuis moins de trois ans ou suivi : gardé), `e2e-formulaires` 25, `e2e-rendez-vous` 30 (webhook Cal.com, qui rattache aussi), `e2e-diagnostic` 59, `e2e-guide` 38 : tous bons.
- `node scripts/e2e-migration-0018.mjs` (revue 18.2) : 22 constats, tous bons.

## Écarts assumés
- **Secret de l'empreinte : `LIEN_SECRET`**, le seul secret que le site et l'espace partagent déjà (posé dans les deux Workers, RUNBOOK § 4 quater et § 4 sexies) : l'effacement est fait par le site et par l'espace, l'import (story 18.10, espace) relira `opposition`. Pas de nouveau secret à poser. Conséquence écrite au RUNBOOK : changer `LIEN_SECRET` rend les empreintes déjà notées méconnaissables. Sans secret (espace sans `LIEN_SECRET`), l'effacement se fait quand même et l'absence est notée au journal (`opposition_sans_secret`) ; la story 18.10 devra rendre ce secret obligatoire pour l'espace.
- **Inscription ambassadeur d'une inconnue : contact du carnet, hors suivi**, pas « à qualifier » : ce n'est pas un projet immobilier. AD-22 fait entrer dans le suivi toute demande du site arrivant sur un contact du carnet ; pour l'ambassadeur, la marque est à part (glossaire du PRD), et une inscription d'une personne déjà connue ne la fait pas non plus entrer dans le suivi ni ne réveille un contact en sommeil. La ligne « Nouveaux » la montre à Anne.
- **Colonnes de l'inscription ambassadeur supposées** `reglement_version` et `reglement_accepte_le` dans `lead` : le fil de l'epic 17 ne les a pas encore créées (rien sur `main` ni sur les branches poussées). Si leurs noms diffèrent, une ligne à changer dans `contacts.ts` ; sans elles, la date de la demande sert et la version reste vide. L'essai imite ces colonnes et la source sur la base locale (ajoutées puis retirées, contrôle suspendu pour l'insertion).
- **Classement gardé à l'effacement : Privé et Démarchage seulement** (comme le dit la story) ; un classement Pro ou Prospect du numéro part avec le contact, comme avant.
- **Purge des importés : trois ans depuis le premier import**, même si le contact a été classé depuis (`last_activity_at` récent) ; un contact contacté une fois, entré dans le suivi ou qui a fait une demande sur le site suit la règle habituelle (trois ans sans activité).
- **Une opposition n'empêche pas une nouvelle demande du site** : la personne revient d'elle-même ; seule l'importation la rejette (story 18.10).
- **Entrée dans le suivi par un geste d'Anne** (déplacement dans le pipeline, « Ajouter ») : `suivi_le` reste vide (AD-32) ; seule l'entrée par une demande du site le pose.

## Revue de code
2026-11-02, session neuve, skill `bmad-code-review`, commit relu be08584. Corrections dans le commit ae0ee42 (« correction de la revue 18.3 »).
1. Effacement : les demandes restées sans contact faites avec l'un des téléphones ou e-mails de la personne n'étaient pas effacées, et `rattacherOrphelins` aurait recréé le contact : corrigé. `orphelinsDe` (`rights.ts`) les trouve, `effacerContact` et `effacer` les effacent avec leurs envois et passent leurs coordonnées à l'opposition.
2. Export par adresse : les demandes des contacts trouvés faites avec un autre e-mail ou un téléphone manquaient : corrigé (commit « correction de la revue 18.3 »), `lead WHERE lower(email) = adresse OR contact_id IN (contacts trouvés)`.
3. Purge des importés : un signe de relation garde le contact dans la règle habituelle (accord e-mail, campagne envoyée, demande du site, événement note, appel, e-mail, séance, étape ou qualification ; un classement seul n'en est pas un) : corrigé (commit « correction de la revue 18.3 »), 7 constats dans `e2e-gestion.mjs`.
4. Sans `LIEN_SECRET`, l'effacement renvoie `opposition: false` (`Effacement`), affiché à l'écran (« effacé, mais l'opposition n'a pas pu être notée », `/gestion` du site et de l'espace, liste des contacts après un effacement depuis la fiche) : corrigé. Condition bloquante pour la 18.10 ajoutée dans « Ce qui reste ».
5. L'événement « Carnet → À qualifier » n'est écrit que si l'entrée dans le suivi vient d'avoir lieu (`INSERT … SELECT … WHERE EXISTS (… suivi_le = ?2)`) : corrigé.
6. Un contact au projet « ambassadeur » qui fait une demande de vente ou d'achat prend le parcours de la demande comme projet (AD-24) : corrigé.
7. Pas de ligne « Nouveaux » pour une demande d'essai (`is_test = 1`) : écarté : `capture.ts` pose `is_test = 1` sur **toute** demande hors production ; la base de production n'en reçoit donc jamais, et l'exclusion viderait la barre « Nouveaux » sur la base d'aperçu, où Anne l'essaie, et dans les essais de bout en bout. Commentaire ajouté dans `contacts.ts`.
8. Une ligne `leedflow_ecarte` Pro ou Prospect n'est supprimée que si elle est liée à un contact effacé, ou à aucun contact et à l'un de ses numéros : corrigé.
9. Téléphone normalisé en E.164 par `e164` (`schema.ts`) avant l'empreinte, repli sur les chiffres et le « + » : corrigé.
10. Partage de `LIEN_SECRET` entre le site et l'espace pour l'opposition : écarté : décision journalisée par le coordinateur dans l'architecture.
11. Essais `e2e-espace.mjs` : aucune valeur en clair dans `opposition` (et empreintes de 64 caractères hexadécimaux) ; effacement qui épargne une autre personne, sa demande et le classement « pro » d'un numéro rangé sur elle ; demande sans contact effacée avec la personne ; même demande traitée deux fois (une ligne « Nouveaux », un événement d'étape) ; une ligne « Nouveaux » par demande ; essai ambassadeur parti d'un projet différent du parcours (acheteur), et contact « ambassadeur » qui demande une vente : corrigé.

Vérifications (2026-11-02) : `site` build (clé Turnstile d'essai) et `npm run check` (0 erreur, 0 avertissement), `base:local` (rien à appliquer) ; `espace` build et `npm run check` (0 erreur, 0 avertissement) ; `e2e-espace` **333 constats, tous bons** (4 nouveaux, et 3 constats existants renforcés) ; `e2e-gestion` **52 constats, tous bons** (7 nouveaux) ; `e2e-formulaires` **25, tous bons**.

## Ce qui reste
- Epic 17 : le fil des ambassadeurs crée la source `ambassadeur` et ses colonnes dans `lead` ; vérifier les noms (`reglement_version`, `reglement_accepte_le`) ou ajuster `contacts.ts`.
- Story 18.10 (import) : lire `opposition` avec `empreinteOpposition`. **Condition bloquante** (revue de code 18.3) : avant le premier import, vérifier que `LIEN_SECRET` est posé sur le Worker de l'espace (sinon les effacements faits depuis l'espace n'ont pas noté d'opposition, et l'import ne peut pas reconnaître les personnes opposées) ; l'import refuse de tourner sans lui.
- Story 18.8 (barre « Nouveaux ») : lire `nouveau` (`vu_le` NULL).
- Epics 19 et 20 : `seance_personne` et `resultat` (note vidée) à ajouter à l'effacement et à la purge quand leurs tables existeront.
- Revue de code (session neuve) avant de proposer la PR à JB.
