---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-espace-anne-2026-11-01/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-espace-anne-2026-11-01/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-espace-anne-2026-11-01/maquette.html
  - _bmad-output/planning-artifacts/briefs/brief-espace-anne-2026-11-01/brief.md
status: proposé à JB le 2026-11-01
---

# Espace d'Anne, nouvelle version : découpage en epics et stories

Ce document découpe la nouvelle version de l'espace d'Anne en trois epics, un par livraison du PRD (§ 6.1). Il fait suite à l'epic 13, dont il reprend deux stories jamais construites : la 13.8 (demandes des portails), qui devient la 18.12, et la 13.28 (bilan d'une campagne), qui devient la 19.4. Les autres stories ouvertes de l'epic 13 (13.9, 13.11, 13.18, 13.31, 13.35) restent dans l'epic 13, en attente.

Repères :
- **PRD** : ce que l'espace doit faire (FR-1 à FR-28).
- **Architecture** : comment il est construit (AD-22 à AD-34, suite des AD-1 à AD-21 du site).
- **Maquette** : l'apparence et les gestes, https://claude.ai/artifact/FUmUuJZTnjf3pG7HJWXH7Z (copie dans `ux-espace-anne-2026-11-01/`).

Règles communes à toutes les stories :
- Toute story qui touche `espace/src/`, `site/src/` ou `.github/` passe `bmad-code-review` dans une session neuve avant fusion. Claude fusionne seul pendant ce chantier, après une construction au vert et un essai sur la base d'essai (décision de JB du 01/11, 21 h 13).
- « Fait » veut dire : `npm run build` et `npm run check` passent sur le site et sur l'espace, `node scripts/e2e-espace.mjs` passe, et captures de l'espace pour tout changement visuel. Le résultat est cité dans la story.
- Aucun vrai contact sur la base d'essai : les essais utilisent des fichiers fictifs de même forme.
- Le bouton « Un retour ? » reste sur chaque nouvelle page (FR-14).

## Couverture des exigences

- FR-1, FR-3, FR-14 : 18.4
- FR-2 : 18.5
- FR-4, FR-5 : 18.6
- FR-26, FR-28 : 18.7
- FR-12, FR-13 : 18.8
- FR-7, FR-8, FR-9, FR-10 : 18.9 et 18.10
- FR-6, FR-11 : 18.10
- FR-27 : 18.11 (site et Leedflow) et 18.12 (portails)
- FR-15, FR-16 : 19.1 et 19.2
- FR-17 : 19.3 et 19.4
- FR-18 à FR-25 : 20.1 à 20.6
- AD-32 : 18.1. AD-22 à AD-25, AD-31, AD-34 (schéma) : 18.2 et 18.3. AD-26 : 18.9. AD-27 : 18.5. AD-28, AD-29 : 18.6 et 19.1. AD-30 : 20.2 à 20.4. AD-33 : 20.5.

## Liste des epics

- **Epic 18 : le carnet de contacts** (livraison 1). Tous les contacts d'Anne dans un seul tableau, classés, filtrés, avec leur fiche, et les nouvelles demandes au-dessus. À la fin, Anne et JB peuvent faire le classement de départ.
- **Epic 19 : les séances et les campagnes** (livraison 2). Anne choisit une liste dans le tableau et contacte les personnes une par une, ou par e-mail groupé pour celles qui ont donné leur accord.
- **Epic 20 : la semaine et le bilan** (livraison 3). Anne place ses activités de prospection sur sa semaine, note ce qu'elle a fait, et regarde le bilan le dimanche.

Chaque epic marche seul : l'epic 18 ne dépend d'aucun autre, l'epic 19 n'a besoin que du 18, et l'epic 20 utilise les séances du 19.

## Epic 18 : le carnet de contacts

Anne retrouve tous ses contacts dans un seul tableau, les classe par catégorie, projet et température, et voit arriver les nouvelles demandes. Contacts devient la page d'accueil de l'espace.

### Story 18.1 : Leedflow ne range un appel que sur un contact suivi

En tant qu'Anne, je veux que mes appels privés ne soient jamais rangés tout seuls sur la fiche d'un proche, pour que l'import de mon téléphone ne mélange pas vie privée et prospection.

**Critères d'acceptation :**

**Étant donné** un numéro présent dans le carnet sur un contact hors suivi (`etape` NULL)
**Quand** la relève Leedflow trouve un appel de ce numéro
**Alors** l'appel n'est pas rattaché au contact et reste un numéro inconnu
**Et** `contactsParTelephone` et `rattacherInconnus` (`espace/src/server/leedflow.ts`) filtrent sur `etape IS NOT NULL`, sans supprimer de ligne `leedflow_inconnu` pour un contact hors suivi.

**Étant donné** un contact suivi (étape renseignée)
**Quand** il appelle
**Alors** le rattachement se fait comme aujourd'hui.

Note : à mettre en ligne avant le premier import (condition bloquante d'AD-32). Sans effet tant que tous les contacts ont une étape.

### Story 18.2 : La nouvelle base du carnet (migration 0018)

En tant que JB, je veux que la table des contacts accueille le carnet entier sans rien perdre de l'existant, pour que l'import et la page Contacts aient leur base.

**Critères d'acceptation :**

**Étant donné** la base actuelle
**Quand** la migration 0018 s'applique
**Alors** `contact` est reconstruite dans l'ordre d'AD-23 (sauvegarde dans des tables `_sauve_*`, recréation, restauration des tables filles et de `lead.contact_id`) avec `etape` et `canal` facultatifs, `projet`, `temperature` (contraintes d'AD-24), `categorie_id`, `verifie_le`, `ecarte_le`, `dernier_contact_*`, `appel_autorise`, `a_rappeler_le`, `ambassadeur_inscrit_le`, `ambassadeur_reglement`
**Et** les tables `categorie` (six catégories fixes d'AD-25 avec leur méthode), `message_type`, `contact_coordonnee`, `contact_source`, `import_lot`, `vue`, `opposition`, `nouveau` sont créées, et le `CHECK` de `leedflow_ecarte` accepte `prospect`.

**Étant donné** une copie locale de la base d'essai (`wrangler d1 export`, puis `--local`)
**Quand** la migration y est répétée avant toute poussée
**Alors** le nombre de lignes de chaque table avant et après est cité dans la story, sans écart inexpliqué.

**Étant donné** une migration non appliquée
**Quand** l'espace est construit
**Alors** la construction échoue.

**Et** avant que 0018 atteigne `main`, JB a fait l'export de la base de production et noté le point de retour arrière (action listée au tableau de bord). Une erreur se corrige par 0019, jamais en modifiant 0018.

### Story 18.3 : Demandes du site et droits sur le nouveau carnet

En tant qu'Anne, je veux qu'une demande du site retrouve le bon contact et que les droits d'accès et d'effacement couvrent tout le carnet, pour ne pas avoir de doublon ni d'oubli.

**Critères d'acceptation :**

**Étant donné** une demande du site (formulaire, diagnostic, guide, rendez-vous)
**Quand** son téléphone ou son e-mail est connu sur `contact` ou `contact_coordonnee`
**Alors** `site/src/server/contacts.ts` la rattache à ce contact, le fait entrer dans le suivi s'il n'y était pas (`a_qualifier`, température NULL si le projet est inconnu) et écrit une ligne `nouveau` de source `site`
**Et** une demande d'une personne inconnue crée le contact en catégorie « Demandes reçues ».
**Et** une inscription sur /ambassadeurs (lead de source `ambassadeur`, epic 17) pose la marque « inscrit ambassadeur » (date, version du règlement) sans changer le projet ni la catégorie d'un contact existant.

**Étant donné** une demande d'effacement
**Quand** elle est exécutée
**Alors** elle couvre `contact_coordonnee`, `contact_source`, `seance_personne`, `nouveau`, `resultat` (note vidée) et les tables Leedflow, et ajoute l'empreinte du téléphone et de l'e-mail à `opposition`
**Et** l'effacement garde le classement « Privé » ou « Démarchage » du numéro dans `leedflow_ecarte`, pour que ses appels ne reviennent pas à trier (revue de code 18.1) ; une demande du site qui fait entrer un contact du carnet dans le suivi pose `suivi_le`
**Et** la recherche par adresse de `rights.ts` cherche aussi dans `contact_coordonnee`, et la purge compte trois ans depuis l'import pour un contact importé jamais contacté.

### Story 18.4 : La page Contacts

En tant qu'Anne, je veux voir tous mes contacts dans un grand tableau dès que j'ouvre l'espace, pour savoir qui je connais et les retrouver vite.

**Critères d'acceptation :**

**Étant donné** l'espace ouvert
**Quand** Anne arrive
**Alors** la page Contacts s'affiche (page d'accueil), avec les colonnes de FR-1, masquables et triables, et le compteur « N contacts sur M »
**Et** la recherche par nom, morceau de numéro, e-mail ou entreprise se combine avec les filtres
**Et** avec 1 000 contacts, tri, filtre et recherche répondent en moins d'une seconde.

**Étant donné** la barre de navigation
**Quand** elle s'affiche
**Alors** elle montre Contacts et le menu « Autres outils », qui mène à toutes les pages actuelles ; aucun lien existant ne casse
**Et** le bouton « Un retour ? » est présent.

### Story 18.5 : Filtres et vues enregistrées

En tant qu'Anne, je veux combiner des filtres et les enregistrer sous un nom, pour retrouver d'un clic « Vendeurs chauds » ou « EDB jamais recontactés ».

**Critères d'acceptation :**

**Étant donné** le tableau
**Quand** Anne choisit des filtres (liste de FR-2, plus « à rappeler »)
**Alors** ils s'affichent au-dessus du tableau et se retirent d'un clic chacun
**Et** « Nouvelle vue avec ces filtres » les enregistre sous un nom, dans le vocabulaire fermé d'AD-27 (une clé inconnue est refusée par le serveur).

**Étant donné** une vue enregistrée
**Quand** Anne la renomme ou la supprime
**Alors** c'est fait, la suppression s'annule tout de suite, et « Tous les contacts » ne peut pas être supprimée.

### Story 18.6 : Classer plusieurs contacts à la fois, et écarter

En tant qu'Anne, je veux classer plusieurs contacts d'un coup, ou un seul directement dans sa ligne, pour faire le classement de départ sans y passer des semaines.

**Critères d'acceptation :**

**Étant donné** des lignes cochées (Maj + clic coche toute la plage)
**Quand** Anne change la catégorie, le projet ou la température, marque vérifié, ou écarte
**Alors** l'espace annonce le nombre de contacts touchés, applique, et propose d'annuler
**Et** chaque écriture passe par `carnet` et garde son avant-image (AD-29) ; changer la catégorie marque vérifié ; un projet sans température efface la température.

**Étant donné** un contact écarté
**Quand** le tableau s'affiche sans filtre « écartés »
**Alors** il n'apparaît pas, et peut revenir depuis ce filtre.

### Story 18.7 : La fiche contact et la création à la main

En tant qu'Anne, je veux ouvrir la fiche d'un contact pour corriger ses informations, relire son histoire et noter un échange, et pouvoir créer un contact moi-même.

**Critères d'acceptation :**

**Étant donné** un nom dans le tableau
**Quand** Anne clique dessus
**Alors** la fiche montre et laisse corriger tous les champs de FR-28 (dont « appel autorisé » et « à rappeler le »), et montre sources, séances, dernier contact, notes et message d'une demande reçue
**Et** Anne peut ajouter une note ou noter un contact fait hors séance (date, canal), ce qui met à jour le dernier contact.

**Étant donné** le bouton « + Nouveau contact »
**Quand** Anne saisit au moins un nom ou un téléphone
**Alors** le contact est créé vérifié, source « saisie à la main »
**Et** un téléphone ou un e-mail déjà connu propose d'ouvrir le contact existant au lieu d'en créer un second.

### Story 18.8 : Catégories et méthodes

En tant que JB, je veux décrire pour chaque catégorie comment contacter ses personnes, pour que les séances proposent le bon canal et le bon message.

**Critères d'acceptation :**

**Étant donné** la page des catégories
**Quand** JB renomme, ajoute ou retire une catégorie
**Alors** c'est fait, un retrait n'est possible que si elle est vide, et un renommage ne change rien aux contacts ni aux vues.

**Étant donné** une catégorie
**Quand** JB écrit sa méthode (canal conseillé, demande, messages types avec `{prénom}`, appel permis, envoi groupé permis)
**Alors** elle est enregistrée ; l'envoi groupé reste limité aux contacts avec accord ou anciens clients (FR-13)
**Et** les six méthodes de départ sont celles du PRD : appel permis pour proches, anciens clients, partenaires et demandes reçues ; non permis pour l'EDB et les relations lointaines (décision de JB du 01/11, 21 h 47).

### Story 18.9 : L'import par Claude

En tant que JB, je veux que Claude importe les fichiers de contacts avec un aperçu avant écriture, pour garder la main sur ce qui entre dans la base.

**Critères d'acceptation :**

**Étant donné** un fichier vCard, CSV ou Excel envoyé à `/api/claude/import` avec le jeton de service de Claude
**Quand** Claude demande l'aperçu
**Alors** l'espace renvoie, sans rien écrire, les compteurs nouveaux, compléments, doublons probables, rejetés, et seulement les lignes du fichier (plus nom et source du contact existant pour un doublon probable)
**Et** l'import réel exige l'empreinte du fichier de l'aperçu.

**Étant donné** l'import réel
**Quand** il s'exécute
**Alors** il crée un `import_lot`, numéros en E.164, doublons sûrs complétés, pré-rangement de FR-9, sources et avant-images enregistrées, `canal` NULL
**Et** il ne fait jamais revenir un écarté, ne modifie pas un contact vérifié (ajout de source ou de coordonnée seulement), rejette toute personne de `opposition`, et n'importe que les champs permis (AD-26).

**Étant donné** un lot
**Quand** Claude l'annule
**Alors** les avant-images sont rejouées et les contacts créés supprimés, sauf ceux modifiés depuis, qui sont listés.

**Et** le jeton de Claude n'a accès qu'à `/api/claude/import` ; l'essai se fait avec des fichiers fictifs de même forme ; l'ancien import de `pipeline` est retiré.

### Story 18.10 : Le premier import et le classement de départ

En tant qu'Anne, je veux retrouver mes contacts du téléphone et de mon fichier de suivi dans le tableau, pré-rangés, pour commencer le classement.

**Critères d'acceptation :**

**Étant donné** la fiche légale d'une page validée par JB (question 5 du PRD) et l'export de la production fait par JB
**Quand** Claude présente l'aperçu des 882 contacts du téléphone et du fichier « SUIVI PROSPECTION » (onglets retenus par FR-9)
**Alors** JB confirme les doublons probables dans le fil, puis Claude importe
**Et** les copies des fichiers sources dans le projet sont supprimées le jour même, et `.notes/inputs.md` le dit.

**Étant donné** le tableau après l'import
**Quand** Anne ouvre la vue « à vérifier »
**Alors** elle voit les contacts dont la catégorie a été proposée mais pas confirmée, avec le compteur « reste à vérifier » qui baisse à mesure.

### Story 18.11 : La barre « Nouveaux » (site et Leedflow)

En tant qu'Anne, je veux voir au-dessus du tableau les demandes reçues que je n'ai pas encore regardées, pour n'en perdre aucune.

**Critères d'acceptation :**

**Étant donné** des lignes `nouveau` non vues
**Quand** Anne ouvre la page Contacts
**Alors** la barre « Nouveaux » montre leur nombre et se déroule d'un clic, chaque carte avec source, date, nom, coordonnées, message ou résumé d'appel
**Et** une demande du site propose Ranger, Vu ou Écarter ; un numéro inconnu de Leedflow propose Ajouter aux contacts, Ajouter à sa fiche (si le numéro est connu dans le carnet) ou Ignorer.

**Étant donné** un geste sur une carte
**Quand** Anne le fait
**Alors** la carte sort de la liste, le geste s'annule tout de suite, et un numéro « ajouté à sa fiche » ne revient plus (classé `prospect`).

### Story 18.12 : Les demandes des portails par e-mail (ex-13.8)

En tant qu'Anne, je veux que les demandes Leboncoin et SeLoger arrivées dans ma boîte pro apparaissent dans « Nouveaux » avec leur contact créé, pour y répondre vite.

**Critères d'acceptation :**

**Étant donné** les deux réglages de JB faits (réception sur un sous-domaine dans Cloudflare, filtre de transfert dans la boîte Gmail d'Anne)
**Quand** un e-mail de portail arrive
**Alors** le Worker de l'espace le lit, crée ou complète le contact (catégorie « Demandes reçues », projet acheteur, référence du bien) et écrit une ligne `nouveau` de source `portail`
**Et** un e-mail qu'il ne sait pas lire est gardé et signalé, jamais perdu.

Note : en attendant les réglages de JB, la barre montre le site et Leedflow (18.11).

## Epic 19 : les séances et les campagnes

Anne passe à l'action sur ses contacts classés : une séance pour les contacter un par un, ou une campagne d'e-mails pour ceux qui ont donné leur accord.

### Story 19.1 : Lancer et dérouler une séance

En tant qu'Anne, je veux lancer une séance depuis une liste du tableau et contacter les personnes une par une, pour faire mes relances sans me perdre.

**Critères d'acceptation :**

**Étant donné** des contacts cochés dans le tableau
**Quand** Anne clique « Lancer une séance », donne un nom et éventuellement un commentaire
**Alors** la séance s'ouvre, jamais recontactés en premier, avec pour chaque personne le message type de sa catégorie (modifiable personne par personne), prénom inséré
**Et** une personne pour qui le canal choisi n'est pas permis est signalée.

**Étant donné** une personne de la séance
**Quand** Anne choisit WhatsApp ou e-mail
**Alors** un bouton ouvre l'application avec le message et le destinataire ; pour un SMS, le message se copie en un clic ; pour un appel, le numéro est cliquable.

**Étant donné** la coche « contacté »
**Quand** Anne coche
**Alors** date et canal vont sur le contact par `seance` puis `carnet` (AD-28), et la séance affiche « N contactés sur M »
**Et** décocher remet le dernier contact d'avant ; une note et une date « à rappeler le » peuvent s'ajouter ; le projet et la température se changent sans quitter la séance.

### Story 19.2 : La page Séances

En tant qu'Anne, je veux retrouver mes séances, en avoir plusieurs ouvertes et en rouvrir une, pour reprendre où j'en étais.

**Critères d'acceptation :**

**Étant donné** la page Séances (ajoutée à la barre de navigation)
**Quand** Anne l'ouvre
**Alors** elle voit les séances ouvertes et terminées, avec date et nombre de personnes contactées
**Et** elle peut rouvrir une séance terminée, et ajouter ou retirer des personnes tant qu'elle est ouverte.

### Story 19.3 : Les campagnes branchées sur le carnet

En tant qu'Anne, je veux choisir les destinataires d'une campagne par une vue ou une catégorie du tableau, pour écrire aux bonnes personnes sans refaire de liste.

**Critères d'acceptation :**

**Étant donné** l'onglet Campagnes existant (13.26, 13.27)
**Quand** Anne choisit les destinataires
**Alors** elle peut prendre une vue enregistrée ou une catégorie, en plus des choix actuels
**Et** seuls partent les contacts avec un accord enregistré ou anciens clients, désinscriptions vérifiées juste avant chaque envoi.

**Étant donné** une séance
**Quand** Anne lance une campagne depuis elle
**Alors** la campagne reprend ses personnes qui peuvent la recevoir, et liste les autres.

Note : rien ne part tant que JB n'a pas créé l'adresse d'envoi `nouvelles.annevialtissot.fr` (RUNBOOK § 4 sexies).

### Story 19.4 : Le bilan d'une campagne (ex-13.28)

En tant qu'Anne, je veux voir ce qu'a donné une campagne, pour savoir si elle a bien été reçue.

**Critères d'acceptation :**

**Étant donné** une campagne envoyée
**Quand** Anne ouvre son bilan
**Alors** elle voit le nombre d'envoyés, d'erreurs (y compris celles qui reviennent plus tard par Resend) et de désinscriptions, sans aucun suivi d'ouverture.

## Epic 20 : la semaine et le bilan

Anne prépare sa semaine de prospection le dimanche, note ce qu'elle fait, et voit ce que ça rapporte. La semaine devient la page d'accueil.

### Story 20.1 : La page de la semaine

En tant qu'Anne, je veux ouvrir l'espace sur ma semaine avec aujourd'hui en avant, pour savoir tout de suite ce que j'ai prévu.

**Critères d'acceptation :**

**Étant donné** l'espace ouvert
**Quand** Anne arrive
**Alors** la semaine s'affiche (nouvelle page d'accueil) : sept colonnes du lundi au dimanche, créneaux d'une heure de 8 h à 19 h, sans défilement en largeur, aujourd'hui distingué, jours passés grisés mais lisibles
**Et** aucun compteur de résultats n'y figure, et la barre de navigation devient Semaine, Contacts, Séances, Bilan, Autres outils.

### Story 20.2 : Les actions de prospection

En tant que JB ou Anne, je veux une liste d'actions de prospection à gauche de la semaine, pour placer mes activités sans tout réécrire.

**Critères d'acceptation :**

**Étant donné** la colonne de gauche
**Quand** on ajoute, modifie ou supprime une action (nom, type, durée 1 à 3 h, filtre copié d'une vue, message type ou script)
**Alors** c'est enregistré par `semaine` (AD-30), et supprimer ou modifier une action ne touche aucune activité déjà posée
**Et** la liste de départ est celle de FR-19.

### Story 20.3 : Placer, déplacer et retirer une activité

En tant qu'Anne, je veux glisser une action sur un créneau, la déplacer ou la retirer, pour organiser ma semaine en quelques gestes.

**Critères d'acceptation :**

**Étant donné** une action de la colonne
**Quand** Anne la glisse sur un créneau de cette semaine ou de la suivante
**Alors** une activité est créée avec le nom, le type et la durée de l'action ; on la rallonge ou la raccourcit par heure entière (1 à 3 h, fin à 19 h au plus)
**Et** pour un boîtage, l'espace demande le secteur (texte libre) et les flyers prévus.

**Étant donné** une activité
**Quand** Anne clique dessus
**Alors** elle peut l'ouvrir (une activité de séance ouvre le tableau sur la vue de son action, et la séance lancée lui est rattachée), noter la quantité ou la retirer de la semaine, avec annulation
**Et** une activité non faite se déplace par glisser-déposer ; un jour passé n'accepte pas de nouvelle activité.

### Story 20.4 : Noter une activité faite et voir l'effort de la semaine

En tant qu'Anne, je veux noter ce que j'ai fait en deux gestes et voir mes barres se remplir, pour mesurer mon effort sans compter les résultats.

**Critères d'acceptation :**

**Étant donné** un boîtage, une rencontre ou une autre activité
**Quand** Anne clique, saisit la quantité et valide
**Alors** la quantité est enregistrée (elle peut dépasser le nombre visé), et le secteur d'un boîtage se corrige au même endroit
**Et** pour une activité de séance, la quantité est le nombre de personnes cochées, sans saisie.

**Étant donné** la semaine
**Quand** une activité est notée ou une personne cochée
**Alors** la barre de son type se met à jour (« 120 flyers sur 200 », « 14 contactés »)
**Et** une activité non faite reste visible à son jour, sans couleur alarmante.

### Story 20.5 : Noter un résultat

En tant qu'Anne, je veux noter un rendez-vous, une recommandation ou un mandat, avec d'où il vient si je le sais, pour que le bilan compte ce qui compte.

**Critères d'acceptation :**

**Étant donné** le bouton « Noter un résultat » (bilan, fiche, séance)
**Quand** Anne saisit le type, la date, et éventuellement le contact, la séance ou l'activité
**Alors** le résultat est enregistré par `resultats` (AD-33) et apparaît tout de suite dans le bilan.

### Story 20.6 : Le bilan

En tant qu'Anne, je veux regarder le dimanche ce que j'ai fait et ce que ça a rapporté, pour préparer la semaine suivante.

**Critères d'acceptation :**

**Étant donné** la page Bilan
**Quand** Anne choisit une semaine (ou le mois, l'année)
**Alors** elle voit par type d'activité le nombre d'activités, la quantité réalisée et la barre d'effort, puis le nombre de rendez-vous, recommandations et mandats
**Et** un résultat rattaché à une séance compte sous « séance de contacts », et on passe d'une semaine à l'autre d'un clic.
