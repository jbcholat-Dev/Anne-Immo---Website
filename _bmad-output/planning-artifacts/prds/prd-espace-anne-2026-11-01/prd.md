---
title: "PRD : l'espace de travail d'Anne (semaine de prospection et contacts)"
status: draft
created: 2026-11-01
updated: 2026-11-01
---

# PRD : l'espace de travail d'Anne

_Brouillon en mode rapide, rédigé le 2026-11-01 d'après le brief validé (`../../briefs/brief-espace-anne-2026-11-01/brief.md`). Les points marqués **[HYPOTHÈSE]** sont déduits et attendent l'accord de JB ; ils sont repris au § 9._

## 0. À quoi sert ce document

Il détaille, fonction par fonction, ce que l'espace doit permettre dans sa nouvelle version. Il sert à JB pour valider, puis aux étapes suivantes de la méthode : l'expérience (écrans et parcours), l'architecture, le découpage en stories. Il dit **quoi**, jamais **comment** : les choix techniques iront dans l'architecture. Les mots du glossaire (§ 3) sont employés partout avec le même sens.

L'espace actuel (en ligne depuis le 15/10/2026, `espace/README.md`) reste la base : rien n'est supprimé, une partie est rangée (§ 4.5).

## 1. Vision

L'espace devient l'outil de la **prospection hebdomadaire** d'Anne. Le dimanche, Anne et JB placent quelques activités dans la semaine. Chaque jour, Anne ouvre l'espace sur sa semaine : elle voit ce qu'elle a fait la veille et, mis en avant, ce qu'elle a à faire aujourd'hui ; elle le fait, note combien, et la barre de la semaine avance. Le bilan, avec les rendez-vous et les mandats, se regarde à part, le dimanche.

Pour nourrir ces activités, l'espace rassemble tous les contacts d'Anne, les range dans cinq catégories, et dit pour chacune comment la contacter.

Le principe qui tranche chaque choix : **demain d'abord**. Anne a du mal à se concentrer et s'inquiète de ne pas signer ; l'outil la ramène toujours à la prochaine action simple.

## 2. Utilisateurs

### 2.1 Ce qu'ils attendent de l'outil

- **Anne** : savoir quoi faire aujourd'hui sans réfléchir ; sentir qu'elle avance ; ne plus chercher ses contacts dans quatre endroits ; savoir qui elle a déjà recontacté.
- **JB** : préparer la semaine avec Anne le dimanche en quelques minutes ; lire le bilan ; changer les catégories et les méthodes quand elles ne collent pas.

### 2.2 Parcours

- **P-1. Le dimanche soir, Anne et JB planifient la semaine.** Ils ouvrent le bilan de la semaine écoulée : deux barres pleines, une à moitié, un rendez-vous obtenu. Ils passent à la semaine suivante et placent quatre activités : mardi matin boîtage à Publier (200 flyers), mercredi 14 h WhatsApp du parrainage au cercle proche (10 personnes), jeudi e-mail aux rencontrés à l'EDB, vendredi deux appels à des prescripteurs. Dix minutes, et ils ferment.
- **P-2. Mardi matin, Anne ouvre l'espace.** Elle voit une seule carte : « Boîtage à Publier, 9 h à 12 h, 200 flyers ». Elle part. À midi, elle clique sur la carte, tape 180, valide. La barre « Boîtage » de la semaine passe à 90 %.
- **P-3. Mercredi, Anne fait ses deux heures de parrainage.** Dans sa semaine, une activité dit « 14 h-16 h : parrainage ». Elle clique sur « Préparer ma liste » : la page Contacts s'ouvre, déjà filtrée sur les catégories conseillées. Elle affine (une ville, « jamais recontactés »), corrige au passage la catégorie de deux personnes, et coche celles qu'elle veut contacter dans ces deux heures. Elle clique « Lancer » : sa liste apparaît, une personne par ligne, avec le message type. Pour chacune, elle choisit le canal (WhatsApp, SMS, appel, e-mail), copie le message, l'envoie depuis son téléphone, puis coche « contacté ». À la fin, l'activité affiche « 14 contactés » et la barre du parrainage a avancé. Chaque contact garde la date et le canal de ce contact (JB, 01/11 15 h 09).
- **P-4. JB importe les contacts.** Il dépose le fichier exporté du téléphone d'Anne, puis celui de LinkedIn, puis le fichier Excel des animations. L'espace pré-range chaque contact dans une catégorie selon sa source et écarte les doublons. Anne corrige ensuite quelques catégories au fil de la semaine, dix à la fois, et écarte d'un geste les contacts sans intérêt.

## 3. Glossaire

- **Semaine** — du lundi au dimanche ; l'unité de planification et de bilan.
- **Activité** — un moment de prospection placé dans la semaine : un jour, un créneau (facultatif), un type d'activité, une cible, un nombre visé, puis une quantité réalisée. Une activité est soit à faire, soit faite.
- **Type d'activité** — la façon de prospecter : boîtage, SMS ou WhatsApp, e-mail, appel, rencontre. **[HYPOTHÈSE]** Cette liste de départ est modifiable.
- **Cible** — ce que vise une activité : une zone (pour le boîtage) ou une catégorie de contacts.
- **Nombre visé / quantité réalisée** — ce qu'Anne compte faire et ce qu'elle a fait, dans l'unité du type (flyers, messages, appels, rencontres).
- **Barre d'effort** — pour un type d'activité et une semaine : la quantité réalisée rapportée au nombre visé.
- **Contact** — une personne connue d'Anne, avec au moins un nom et un téléphone ou un e-mail. Un contact a une seule catégorie et une source.
- **Source** — d'où vient le contact : téléphone, LinkedIn, réseaux sociaux, animations EDB, saisie à la main, ou l'espace actuel.
- **Catégorie** — le groupe de contacts qui reçoit une même méthode. Cinq au départ : anciens clients, cercle proche, rencontrés à l'EDB, prescripteurs, à réchauffer.
- **Méthode** — ce qui est associé à une catégorie : canal conseillé, ce qu'on demande (recommander, proposer le diagnostic offert, prendre des nouvelles), un message type, et si l'envoi groupé est permis.
- **Accord** — la trace qu'un contact a accepté de recevoir des e-mails groupés (déjà géré par l'espace actuel, story 13.26).
- **Résultat** — ce que la prospection rapporte : rendez-vous obtenu, recommandation reçue, mandat signé.
- **Bilan** — la vue à part qui montre les barres d'effort et les résultats, à la semaine, au mois et à l'année.

## 4. Fonctions

### 4.1 La page de la semaine

**Description :** la page d'accueil de l'espace. En plein écran sur ordinateur, elle montre la semaine en cours, du lundi au dimanche, une colonne par jour, avec ses activités. La colonne d'aujourd'hui est mise en avant ; les jours passés sont grisés mais lisibles, pour voir ce qui a été fait la veille ; les jours à venir sont visibles normalement. Réalise P-1, P-2.

#### FR-1 : Ouvrir sur la semaine, aujourd'hui en avant
En ouvrant l'espace, Anne voit sa semaine entière, avec la journée d'aujourd'hui mise en avant (JB, 01/11 14 h 49).
- La page d'accueil de l'espace est la page de la semaine : sept colonnes, du lundi au dimanche, sur un écran d'ordinateur sans défilement horizontal.
- La colonne d'aujourd'hui se distingue nettement (fond, bordure ou largeur).
- Les jours déjà passés sont grisés ; leurs activités restent lisibles, avec leur quantité réalisée, pour qu'Anne voie ce qu'elle a fait la veille.
- S'il n'y a aucune activité aujourd'hui, la colonne du jour l'indique simplement et montre la prochaine activité prévue.
- Aucun compteur de résultats (rendez-vous, mandats) n'apparaît sur cette page.

#### FR-2 : Placer une activité
Anne ou JB peuvent ajouter une activité à un jour de la semaine en cours ou de la suivante.
- Champs : jour, type d'activité, cible ; créneau horaire (par exemple 14 h-16 h), nombre visé et note facultatifs. Pour une activité de contacts, c'est souvent le temps qui sert de repère (« deux heures de parrainage ») plutôt qu'un nombre.
- L'ajout se fait sans quitter la page de la semaine.
- Une activité non faite se déplace à un autre jour en la faisant glisser à la souris d'une colonne à l'autre (glisser-déposer : on attrape l'activité, on la lâche sur le nouveau jour), par exemple de mardi à jeudi (JB, 01/11). Elle peut aussi être modifiée ou supprimée.
- Un jour passé n'accepte pas qu'on y dépose une activité ; une activité non faite d'un jour passé peut, elle, être glissée vers aujourd'hui ou un jour à venir.

#### FR-3 : Noter une activité comme faite
Anne indique la quantité réalisée d'une activité.
- Un clic sur l'activité, une quantité, valider : deux gestes au plus.
- La quantité peut dépasser le nombre visé.
- Une activité faite peut être corrigée (quantité) le jour même et les jours suivants de la même semaine.
- Une activité non faite reste visible à son jour, sans alerte ni couleur alarmante (le gris des jours passés suffit). Elle se reporte en la faisant glisser (FR-2).

#### FR-4 : Voir les barres d'effort de la semaine
Sur la page de la semaine, une barre par type d'activité planifié montre la quantité réalisée sur le nombre visé.
- Les barres se mettent à jour dès qu'une activité est notée.
- Seuls les types présents dans la semaine ont une barre.

**Notes :** préparer la semaine suivante se fait sur la même page, en passant à la semaine d'après (FR-2).

### 4.2 Le bilan

**Description :** une vue à part, ouverte depuis la barre de navigation, regardée le dimanche. Elle montre ce qui a été fait et ce que ça a rapporté. Réalise P-1.

#### FR-5 : Bilan de l'effort
Le bilan montre, pour une semaine choisie, chaque type d'activité avec son nombre d'activités, sa quantité réalisée et sa barre d'effort ; et les mêmes totaux au mois et à l'année.

#### FR-6 : Noter un résultat
Anne ou JB peuvent noter un résultat (rendez-vous obtenu, recommandation reçue, mandat signé), avec sa date, et **[HYPOTHÈSE]** l'activité ou la catégorie dont il vient, si on la connaît.
- **[HYPOTHÈSE]** Les rendez-vous et mandats déjà suivis dans le pipeline de l'espace actuel sont comptés automatiquement, pour ne pas saisir deux fois.

#### FR-7 : Bilan des résultats
Le bilan montre le nombre de rendez-vous, de recommandations et de mandats signés à la semaine, au mois et à l'année, ainsi que le nombre de mandats en cours.

### 4.3 Les contacts rassemblés

**Description :** une page Contacts qui réunit toutes les sources dans une seule liste, rangée par catégorie. Réalise P-4.

#### FR-8 : Importer un fichier de contacts
JB ou Anne peuvent importer un fichier de contacts.
- Formats acceptés : l'export des contacts du téléphone (vCard ou CSV), l'export LinkedIn (CSV), un tableur Excel ou CSV (animations EDB).
- Avant d'enregistrer, un aperçu montre combien de contacts sont nouveaux, combien complètent un contact existant, combien sont écartés (sans téléphone ni e-mail).
- Un contact dont le téléphone ou l'e-mail est déjà connu complète la fiche existante ; jamais de doublon (règle déjà en place dans l'espace actuel).
- La source de chaque contact est enregistrée.

#### FR-9 : Pré-ranger à l'import
Chaque contact importé reçoit une catégorie selon sa source :
- animations EDB → rencontrés à l'EDB ;
- LinkedIn et réseaux sociaux → à réchauffer ;
- téléphone → cercle proche ;
- contacts de l'espace actuel au statut vendu ou acte signé → anciens clients ;
- prescripteurs de l'espace actuel → prescripteurs.
- **[HYPOTHÈSE]** Ces règles sont fixes en v1 ; seul le résultat se corrige (FR-10).

#### FR-10 : Corriger la catégorie et écarter
Anne peut changer la catégorie d'un contact, ou l'écarter (contact sans intérêt pour la prospection).
- La page Contacts propose les contacts à vérifier par petits paquets (**[HYPOTHÈSE]** dix à la fois), jamais toute la liste d'un coup.
- Un contact écarté n'apparaît plus dans les listes de prospection ; il n'est pas effacé et peut revenir.

#### FR-11 : Garder la trace de l'accord
À l'import du fichier des animations, l'accord pour les e-mails groupés est enregistré pour chaque contact (bulletin du jeu, JB 01/11). Les autres sources n'en donnent pas.
- La règle d'accord existante de l'espace (story 13.26) s'applique telle quelle.

#### FR-12 : Retrouver un contact
Anne peut chercher un contact par nom, prénom, morceau de numéro ou e-mail, et filtrer par catégorie.
- La recherche existante de l'espace (story 13.24) est reprise.

### 4.4 Les catégories et leur méthode

**Description :** chaque catégorie porte une méthode. Pour une activité de contacts, Anne prépare sa liste depuis la page Contacts, puis la déroule avec le message type. Réalise P-3.

#### FR-13 : Gérer les catégories
JB peut renommer une catégorie, en ajouter une, ou en retirer une vide.
- Les cinq catégories de départ sont créées avec leur méthode (voir le brief, § Les contacts rassemblés et triés).

#### FR-14 : Décrire la méthode d'une catégorie
JB peut écrire pour chaque catégorie : le canal conseillé, ce qu'on demande, un ou plusieurs messages types, et si l'envoi groupé par e-mail est permis.
- L'envoi groupé ne peut être permis que pour les contacts qui ont un accord (FR-11) ou sont anciens clients.

#### FR-15 : Préparer la liste d'une activité
Depuis une activité de contacts, Anne prépare elle-même la liste des personnes qu'elle va contacter pendant ce créneau (JB, 01/11 15 h 09).
- Le bouton « Préparer ma liste » ouvre la page Contacts, déjà filtrée sur la ou les catégories visées par l'activité.
- Anne peut affiner les filtres (catégorie, source, ville, jamais recontactés, dernier contact ancien) et corriger la catégorie d'un contact sans quitter la page (FR-10).
- Elle coche les personnes retenues ; la liste ainsi formée est rattachée à l'activité. Elle peut la compléter ou la réduire plus tard.
- Par défaut, les contacts jamais recontactés apparaissent en premier.

#### FR-16 : Dérouler la liste et cocher les contacts
Le bouton « Lancer » affiche la liste de l'activité, une personne par ligne, avec le message type de sa catégorie.
- Pour chaque personne, Anne choisit le canal (WhatsApp, SMS, appel, e-mail) et copie le message en un clic. L'espace n'envoie ni SMS ni WhatsApp : elle envoie depuis son téléphone ou sa messagerie.
- Elle coche « contacté » ; la coche enregistre sur le contact la date et le canal de ce contact.
- Le nombre de personnes cochées devient la quantité réalisée de l'activité et fait avancer la barre ; Anne n'a rien d'autre à saisir. Une quantité saisie à la main reste possible (FR-3), pour une activité sans liste.
- Une personne non cochée reste dans la liste ; elle peut repasser dans une prochaine activité.

#### FR-17 : E-mail groupé depuis une activité
**[HYPOTHÈSE]** Pour une catégorie où l'envoi groupé est permis, l'activité de type e-mail peut passer par la fonction Campagnes existante (stories 13.26 et 13.27). Elle ne fonctionnera réellement qu'une fois le sous-domaine d'envoi créé (action de JB déjà listée).

### 4.5 Le rangement de l'existant

**Description :** tout ce que l'espace sait déjà faire reste disponible, mais hors du champ visuel.

#### FR-18 : Barre de navigation réduite
La barre de navigation ne montre que : Semaine, Contacts, Bilan, et un menu déroulant **[HYPOTHÈSE]** « Autres outils ».
- Le menu donne accès à toutes les pages actuelles : Aujourd'hui (ancienne), pipeline, qualifier, ajouter, importer, prescripteurs, acheteurs, Prospection (actions marketing), campagnes, à trier, gestion.
- Aucune page actuelle n'est supprimée ; les liens existants continuent de fonctionner.
- Les relèves automatiques (Leedflow, e-mails de relance) continuent de tourner sans changement.

## 5. Ce que l'outil ne fait pas (explicitement)

- Il n'envoie pas de SMS ni de WhatsApp ; il prépare, Anne envoie.
- Il ne compte pas automatiquement les boîtes aux lettres, appels ou messages passés hors de l'espace.
- Il ne fixe pas d'objectif annuel affiché en permanence ; l'objectif reste dans le bilan.
- Il ne remplace pas Modelo, le logiciel imposé par eXp.
- Il ne récupère pas les contacts par aspiration de sites ou de réseaux ; seulement par fichiers exportés par Anne.

## 6. Première version

### 6.1 Dans la première version
La page de la semaine (FR-1 à FR-4), le bilan (FR-5 à FR-7), l'import et le rangement des contacts (FR-8 à FR-12), les catégories et la liste des contacts d'une activité (FR-13 à FR-16), le rangement de l'existant (FR-18).

### 6.2 Plus tard
- E-mail groupé depuis une activité (FR-17) : attend le sous-domaine d'envoi.
- Le traitement des leads entrants dans la semaine (Leedflow, boîte mail) : revient depuis le menu quand la prospection tourne.
- Version téléphone.
- Les abonnés des réseaux sociaux, si aucun export simple n'existe (voir § 8).

## 7. Comment on saura que ça marche

**Principaux**
- **SM-1** : une semaine planifiée chaque dimanche, au moins 3 activités, pendant 4 semaines d'affilée. Valide FR-2.
- **SM-2** : au moins 70 % des activités planifiées notées comme faites en fin de semaine. Valide FR-1, FR-3.
- **SM-3** : tous les contacts importés ont une catégorie ou sont écartés, un mois après l'import. Valide FR-8 à FR-10.
- **SM-4** : un premier rendez-vous vendeur noté comme venant d'une activité de l'espace. Valide FR-6, FR-15.

**Secondaire**
- **SM-5** : Anne dit, à la fin du premier mois, qu'elle sait quoi faire en ouvrant l'espace (question posée par JB).

**À ne pas chercher à maximiser**
- **SM-C1** : le nombre d'activités ou de flyers. Une semaine chargée qui épuise Anne est un échec, même si les barres sont pleines. Contrebalance SM-2.
- **SM-C2** : le nombre de contacts importés. Mieux vaut 150 contacts bien rangés que 1 000 en vrac. Contrebalance SM-3.

## 8. Questions ouvertes

1. La règle du 11/08/2026 sur les appels aux anciens clients, citée d'après la presse spécialisée : à vérifier sur le texte officiel avant de proposer l'appel comme méthode.
2. Les abonnés Instagram et Facebook d'Anne peuvent-ils être exportés simplement ? Sinon, la catégorie « à réchauffer » ne contiendra que LinkedIn au départ.
3. Le message type du parrainage dépend de l'accord d'eXp France, toujours attendu.
4. Les contacts déjà dans l'espace actuel (pipeline, prescripteurs, acheteurs) entrent-ils tous dans la nouvelle page Contacts, ou seulement ceux qui servent la prospection ?

## 9. Hypothèses à confirmer

- § 3 : liste de départ des types d'activité (boîtage, SMS ou WhatsApp, e-mail, appel, rencontre), modifiable.
- FR-6 : l'origine d'un résultat (activité ou catégorie) est notée si on la connaît ; rendez-vous et mandats du pipeline comptés automatiquement.
- FR-9 : règles de pré-rangement fixes en v1.
- FR-10 : vérification par paquets de dix.
- FR-17 : l'e-mail groupé passe par les Campagnes existantes.
- FR-18 : nom du menu « Autres outils ».
