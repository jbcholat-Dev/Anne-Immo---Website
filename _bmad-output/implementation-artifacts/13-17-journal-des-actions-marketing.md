---
story: 13.17
epic: 13 — Espace de travail d'Anne
statut: review
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.17 — Journal des actions marketing et coût par contact

## Objectif
Savoir combien coûte un contact, un rendez-vous et un mandat, canal par canal, pour décider où mettre l'argent et le temps. Demande de JB du 2026-10-21 : « logger les actions marketing/prospection avec les canaux et les coûts associés, puis faire le lien avec les contacts générés ». JB veut aussi que les campagnes préparées dans le projet Claude soient créées directement dans l'espace par Claude, sans ressaisie par Anne. Cadrage validé par JB le même jour.

## Ce qui est à faire
- **Une action marketing** : nom (« Flyers Margencel », « Pub Facebook mars »), canal (les 8 canaux existants de CAP-12 v7 : boîtage, recommandation, événement, site, portail, réseaux, rencontre, autre), date de début, date de fin (facultative), budget prévu, coût réel (en euros), note, auteur (Anne ou Claude).
- **Les passages de boîtage** (`passage_boitage`, story 13.7) deviennent des actions du canal boîtage : un passage reçoit un coût, sans changer la saisie actuelle.
- **Rattachement des contacts** : à l'arrivée d'un contact, s'il y a exactement une action en cours de son canal à cette date, il y est rattaché d'office ; sinon Anne choisit l'action dans une liste à la qualification (ou « aucune »). Elle peut corriger le rattachement sur la fiche.
- **Écrans** : une page « Actions » dans l'espace (liste, ajout, modification, suppression), le rattachement sur la fiche du contact et dans « Qualifier ».
- **Bilan du lundi** (story 13.13) : coût par canal sur la période, puis coût par contact, par rendez-vous et par mandat ; un tableau par action (contacts, rendez-vous, mandats, coût par contact).
- **Accès Claude** : une adresse privée `/api/claude/…` de l'espace, ouverte seulement à un jeton de service Cloudflare Access (un badge réservé à un programme, distinct de la connexion d'Anne). Elle permet de créer et de modifier des actions et de lire les totaux du bilan par action, **sans jamais lire un contact ni ses coordonnées**. Une action créée par Claude porte « créée par Claude » ; Anne peut la modifier ou la supprimer. Le même accès servira au relevé de la story 13.18.
- Migration dans `site/migrations/` (table des actions, lien contact → action, coût du passage), droits RGPD et purge à revoir (une action n'est pas une donnée personnelle ; le lien suit le contact).

## Choix faits (recommandation acceptée par JB le 2026-10-21)
- Seuls les euros sont comptés en v1, pas le temps passé par Anne. Perte assumée : une action gratuite mais longue (un salon) paraît moins chère qu'elle n'est. Un champ « heures » pourra venir plus tard.
- Les offres temporaires de l'epic 14 seront des actions comme les autres le jour où elles existeront.

## Ce que JB devra faire (une fois la story construite)
1. Créer le jeton de service dans Cloudflare Zero Trust et l'autoriser sur l'application Access de l'espace pour `/api/claude/*` seulement (5 min, pas-à-pas fourni).
2. Coller ses deux valeurs (identifiant et secret) dans les réglages de l'environnement cloud « Anne Immo » (3 min). Jamais dans le dépôt.
3. Ajouter `espace.annevialtissot.fr` à la liste des adresses autorisées de cet environnement (2 min).

## Ce qui est fait (2026-10-21)
- **Migration `0010-actions-marketing.sql`** : table `action_marketing` (nom, canal, début, fin, budget et coût réel en centimes, note, auteur `anne` ou `claude`), `contact.action_id`, `passage_boitage.cout_centimes`, déclencheur `contact_action_auto` qui rattache d'office un contact à la seule action de son canal en cours le jour de son arrivée (site, saisie et import compris).
- **`espace/src/server/actions.ts`** : vérification des champs, création, modification, suppression (les contacts restent, sans action), liste avec contacts, qualifiés, rendez-vous et mandats par action, rattachement noté dans l'historique, coût par canal sur une période.
- **Page `/actions`** : liste (coût réel, sinon budget « prévus », coût par contact, « créée par Claude »), ajout, modification et suppression sur `/actions?id=…`. Menu « Actions » sur ordinateur ; bouton « Actions marketing » dans le Bilan (téléphone).
- **Fiche** : cadre « Action marketing » (choisir, changer, « Aucune »), `/api/actions/rattacher`. **Qualifier** : liste « Action marketing qui l'a amené », préchoisie si la base l'a rattaché.
- **Boîtage** : champ « Coût des mots (€) » au passage.
- **Bilan** : tuile « Dépensé » et cadre « Ce que ça coûte » (dépensé, par contact, par rendez-vous, par mandat, canal par canal).
- **Accès de Claude** : `worker.ts` n'ouvre `/api/claude/…` qu'au jeton de service dont l'identifiant (`common_name`) est le secret `ACCESS_CLAUDE_ID`, et refuse une personne connectée sur ces adresses ; `/api/claude/actions` (GET liste, POST créer ou modifier) et `/api/claude/bilan` (totaux par canal avec coûts). `site/src/server/acces.ts` : `identiteAcces` distingue personne et jeton de service. Script `espace/scripts/claude-espace.mjs`.
- Documents : RUNBOOK § 4 sexies (mise en place par JB), `espace/README.md`, `site/README.md` (migration et écarts), `CLAUDE.md` (commande), spine `.memlog.md`.

## Écarts assumés
Voir `site/README.md` § « Écarts de la story 13.17 » : passages de boîtage gardés à part avec un coût ; tableau par action sur la page Actions et non dans le Bilan ; coût d'une période = actions commencées et passages faits pendant la période ; jour d'arrivée lu en UTC par le déclencheur ; secret du jeton utilisé par Claude depuis les réglages de l'environnement.

## Ce qui est vérifié (2026-10-21)
- `site` : `npm run build`, `npm run check` (0 erreur), `node scripts/e2e-gestion.mjs` (tous les constats bons, contrôle Access du /gestion inchangé), `npm run base:local` (0010 appliquée ; base d'essai locale remise à neuf avant l'essai, car deux constats anciens dépendaient du nombre de secteurs accumulés par les essais précédents).
- `espace` : `npm run build`, `npm run check` (0 erreur).
- `node scripts/e2e-espace.mjs` : **tous les constats bons (167)**. Les 33 nouveaux :
  - action sans nom ou au budget illisible refusée ; action notée (centimes, auteur Anne) ; « 300,50 » lu 30 050 centimes ; action modifiée ;
  - contact arrivé pendant la seule action de son canal rattaché d'office ; deux actions en cours : pas de rattachement, choix à la qualification, noté dans l'historique ; « Aucune » puis action remise sur la fiche, action préchoisie ;
  - passage de boîtage avec coût ; Bilan : 120 € prévus + 300,50 € = 420,50 € pour Rencontre, Boîtage compté, tuile « Dépensé » ; page Actions : contacts et coût par contact ;
  - Claude : liste avec totaux et sans coordonnées, action créée « créée par Claude », coût corrigé, action incomplète refusée, action inconnue 404, bilan avec coûts sans coordonnées ;
  - refusé (403) : jeton de Claude sur Aujourd'hui, sur une fiche, sur l'export RGPD ; Anne connectée sur l'adresse de Claude ; autre jeton de service ; jeton d'une autre application ; en-tête interne forgé ;
  - pas de débordement sur téléphone ni sur ordinateur (captures `espace/.verif/espace-actions-*.png`, `espace-action-*.png`, `espace-bilan-*.png` relues).

## Ce qui reste
- JB : fusionner la PR.
- JB : mettre en place le jeton de service (RUNBOOK § 4 sexies, « Accès de Claude », ≈ 10 min), puis Claude vérifie avec `node espace/scripts/claude-espace.mjs actions`.
- Anne : noter ses premières actions (et le coût de ses passages de boîtage) ; dire si le rattachement d'office lui convient.
