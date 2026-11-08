---
story: 17.2
epic: 17 — Programme ambassadeurs
statut: in-progress
date: 2026-11-05
origine: JB, 2026-11-05 (« il faut qu'on implémente ça le plus rapidement possible »)
---

# Story 17.2 — Page `/ambassadeurs` et formulaire

## Objectif

JB va envoyer des e-mails avec le lien de la page ambassadeurs : la page doit exister, enregistrer les inscriptions et les faire arriver dans l'espace d'Anne. Maquette validée le 2026-11-05 (story 17.1) : https://claude.ai/artifact/JRzaQnTFGuTM83oyuFdHby.

## Analyse (2026-11-05)

- **Où sont stockés les ambassadeurs** : comme toute demande du site, dans `lead` (AD-6), source `ambassadeur`, avec la version et la date du règlement accepté. On garde ainsi l'anti-robot, les e-mails, /gestion (droits RGPD) et la purge sans rien recoder.
- **Recouvrement avec l'espace** : déjà réglé par le fil de l'espace (story 18.3). `rattacherLead` rattache l'inscription au contact de même téléphone ou de même e-mail (principal ou secondaire), pose `contact.ambassadeur_inscrit_le` et `ambassadeur_reglement`, et ne change ni projet, ni catégorie, ni étape. Un contact neuf entre au carnet hors suivi. La vue « Ambassadeurs » existe (migration 0018). Question posée au fil de l'espace le 2026-11-05 (doublons après le réimport EDB, vue et carte « Nouveaux »).
- **Point délicat** : `lead.source` a un CHECK figé depuis 0001 (cinq valeurs). Il faut reconstruire `lead` : migration 0022, sur le modèle de 0020 (copie de `lead_delivery`, effacée en cascade sinon). Décision demandée à JB (carte du 2026-11-05) : reconstruire après relecture (recommandé) ou table à part.
- **Trois états d'ambassadeur** (demande de JB du 2026-11-05) : à contacter (projet ambassadeur, pas d'envoi), contacté non inscrit (envoi de campagne, pas de marque), inscrit (marque posée par cette story). L'affichage en couleur, le tri et le filtre dans la vue « Ambassadeurs » sont demandés au fil de l'espace, qui construit l'envoi groupé et le suivi des envois.

## Ce qui est fait

- `site/migrations/0022-lead-ambassadeur.sql` (dans `migrations-a-relire/` jusqu'à l'accord de JB du 2026-11-07) : reconstruction de `lead`, `ambassadeur` dans la liste de `source`, colonnes `reglement_version` et `reglement_accepte_le`, deux CHECK de cohérence (règlement obligatoire pour un ambassadeur, interdit ailleurs). Hors de `migrations/` tant qu'elle n'est pas relue.
- Serveur : source `ambassadeur` (`schema.ts`, une seule case obligatoire règlement + confidentialité, origine `?c=` gardée en `utm_source`), écriture (`leads.ts` : colonnes du règlement, pas de séquence de conseils, `ambassadeurInscrit` pour la seconde inscription), `capture.ts` (« déjà ambassadeur » sans rien écrire ni envoyer), route `/api/ambassadeurs`, e-mails (`messages.ts` : bienvenue à l'inscrit, « Nouvel ambassadeur » à Anne).
- Pages : `/ambassadeurs` (téléphone et ordinateur, formulaire, confirmation avec WhatsApp et SMS vers Anne, « déjà ambassadeur »), `/ambassadeurs/reglement` (v1), `/ambassadeur` qui renvoie avec `?c=`. Non indexées.
- `formulaires.ts` : événement `avt:reponse` (la page lit `deja`). `liens.mjs` ignore les liens `sms:`. `ecrans.mjs` et `verif.mjs` couvrent les deux pages.
- Essais : `scripts/e2e-migration-0022.mjs`, `scripts/e2e-ambassadeurs.mjs`. README § « Programme ambassadeurs » et écart assumé.

## Ce qui est vérifié (2026-11-05, en local)

- `node scripts/e2e-migration-0022.mjs` : 19 vérifications au vert (25 demandes, 50 envois et 4 contacts identiques avant et après, 5 index, clés étrangères, CHECK, cascade, relance après arrêt).
- `node scripts/e2e-ambassadeurs.mjs` : 34 vérifications au vert (inscription, règlement v1 et date, origine carte et flyer, deux envois sans séquence, e-mails, contact hors suivi marqué, carte « Nouveaux », case obligatoire, renvoi, seconde inscription par e-mail et par téléphone, vendeuse existante marquée sans changer projet ni étape, page sur 390 et 1440 px sans défilement horizontal, confirmation, WhatsApp et SMS, renvoi de /ambassadeur, règlement à 11 articles, noindex).
- `npm run build` et `npm run check` : 0 erreur. `node scripts/liens.mjs` : 32 pages, 2 330 liens, 0 cassé. `node scripts/ecrans.mjs` : aucun signalement.

## Revue de code

2026-11-05, PR #246, commit 4a757b2 relu par une session neuve (`bmad-code-review`). Verdict sur la migration 0022 : sûre à appliquer (27 colonnes copiées dans l'ordre, 5 index, seule `lead_delivery` référence `lead`, compatible avec le code actuel de `main`).

1. Les autres formulaires écrivaient les colonnes du règlement, donc tombaient tous si le code partait avant 0022 : corrigé (commit suivant), les colonnes ne sont nommées que pour un ambassadeur ; README corrigé.
2. « Déjà ambassadeur » révèle qu'une adresse est inscrite, et la seconde inscription repoussait la purge : en partie corrigé, `last_activity_at` n'est plus touché. Le message reste : JB l'a demandé (story 17.1), Turnstile et la limite de fréquence passent avant.
3. Un téléphone partagé (couple) fait dire « déjà inscrit » à la seconde personne : écarté pour l'instant, la règle « une inscription par e-mail ou téléphone » vient de JB (story 17.1) ; à revoir s'il y a des cas.
4. La case « nouvelles » cochée à la seconde inscription était perdue : corrigé, l'accord est ajouté s'il manquait (essai 4 bis).
5. Deux envois simultanés de deux onglets peuvent créer deux inscriptions : écarté, cas rare et sans perte (le contact reste unique côté espace).
6. Relance de 0022 après un arrêt à mi-chemin : écarté, D1 passe un fichier d'un bloc ; note ajoutée en tête de la migration.
7. Sans JavaScript, `/ambassadeur` perd `?c=` : écarté, un téléphone qui lit un QR code a JavaScript.
8. Lien du règlement sans `www` : écarté, comme les autres liens des e-mails (l'adresse sans `www` renvoie).
9. `?c=` ne remplace pas un vrai `utm_source` : écarté, c'est la règle voulue (story 5.4).

Après corrections : `npm run check` 0 erreur, `npm run build` au vert, `e2e-migration-0022` réussi, `e2e-ambassadeurs` réussi (35 vérifications).

## Ce qui reste

- ~~Décision de JB sur la reconstruction de `lead`~~ : accord le 2026-11-07 (« accord reçu »), 0022 passée dans `migrations/`, appliquée à la base d'aperçu par la construction de la branche (journal Cloudflare du 2026-11-07 : « 0022-lead-ambassadeur.sql », 17 commandes, succès). L'aperçu de la branche est derrière Cloudflare Access : l'essai en ligne se fait sur l'aperçu de test après la fusion. Reste : fusion par JB (la vraie base reçoit 0022 à la construction de `main`), puis essai d'une inscription sur l'aperçu de test.
- Anne : confirmer « Mes plus belles ventes ont commencé par « Appelle Anne de ma part » », et l'adresse de l'organisateur dans le règlement (Sciez dans les mentions légales, Thonon dans le document).
- Choix proposé à JB : un contact « à qualifier » qui s'inscrit passe-t-il en projet « ambassadeur » ?
- Story 17.4 : ouverture (indexation, page Confidentialité, durée de conservation de 3 ans) après l'accord d'eXp France.
