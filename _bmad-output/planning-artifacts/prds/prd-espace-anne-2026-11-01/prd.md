---
title: "PRD : l'espace de travail d'Anne (contacts et prospection)"
status: final
created: 2026-11-01
updated: 2026-11-01
---

# PRD : l'espace de travail d'Anne

_Version 2 du 2026-11-01, rédigée d'après le brief validé (`../../briefs/brief-espace-anne-2026-11-01/brief.md`) et les décisions de JB du même jour (`.memlog.md`), qui priment sur le brief. Relue selon la grille BMAD (`review-rubric.md`). Les points marqués **[HYPOTHÈSE]** sont des choix par défaut qui attendent l'accord de JB ; ils sont repris au § 9._

## 0. À quoi sert ce document

Il détaille, fonction par fonction, ce que l'espace doit permettre dans sa nouvelle version. Il sert à JB pour valider, puis aux étapes suivantes de la méthode : l'expérience (écrans et parcours), l'architecture, le découpage en stories. Il dit **quoi**, jamais **comment** : les choix techniques iront dans l'architecture. Les mots du glossaire (§ 3) sont employés partout avec le même sens.

L'espace actuel (en ligne depuis le 15/10/2026, `espace/README.md`) reste la base : rien n'est supprimé, une partie est rangée dans un menu (FR-14). L'accès reste celui de l'espace actuel ; la nouvelle version n'ouvre rien de plus.

## 1. Vision

L'espace rassemble enfin **tous les contacts d'Anne en un seul endroit** : téléphone, LinkedIn, abonnés des réseaux, fichier des animations en magasin de bricolage (EDB), contacts déjà dans l'espace. On voit d'où vient chacun, on les classe vite, par filtres et par lots, dans cinq catégories qui disent chacune comment contacter la personne. Ensuite, Anne agit dessus par **séances de contacts** : elle choisit une liste dans le tableau, la déroule, coche chaque personne contactée.

**La page Contacts est la plus importante (JB, 01/11 15 h 13).** Rassembler et classer ces contacts est déjà un travail en soi, qui prendra du temps ; c'est ce qui apporte la valeur. La semaine de prospection (placer des activités, voir les barres se remplir, regarder le bilan le dimanche) vient après : en attendant, une feuille de papier fait l'affaire.

Deux principes tranchent les choix :
- **La prochaine action simple.** Anne a du mal à se concentrer et s'inquiète de ne pas signer. L'outil la ramène toujours à ce qu'elle peut faire maintenant : le prochain lot à classer, la prochaine personne à contacter, l'activité du jour. Un mandat avant quatre.
- **Classer vite, sans rien perdre.** Le classement se fait en masse, par filtres et actions groupées, et peut s'interrompre à tout moment. Le brief prévoyait de classer quelques contacts à la fois ; JB a préféré le tableau et les actions groupées (01/11).

## 2. Utilisateurs

### 2.1 Ce qu'ils attendent de l'outil

- **Anne** : ne plus chercher ses contacts dans quatre endroits ; savoir qui elle a déjà recontacté, quand et comment ; savoir quoi faire maintenant sans réfléchir ; sentir qu'elle avance.
- **JB** : importer et classer les contacts avec Anne ; changer les catégories et les méthodes quand elles ne collent pas ; plus tard, préparer la semaine avec elle le dimanche et lire le bilan.

### 2.2 Parcours

- **P-1. Le grand classement de départ (le parcours le plus important).** JB dépose le fichier exporté du téléphone d'Anne, puis celui de LinkedIn, puis le fichier Excel des animations. L'aperçu annonce 612 contacts, dont 9 doublons probables à confirmer. L'espace propose une catégorie à chacun selon sa source : « 612 à vérifier ». Le soir, Anne et JB s'installent devant le tableau. Ils filtrent « source LinkedIn, à vérifier » : 340 lignes. Ils filtrent « entreprise contient Danone », cochent les 38 anciens collègues, les rangent dans « proches », marquent vérifié. Ils cochent ensuite 120 inconnus d'un coup et les écartent. En une heure, le compteur « reste à vérifier » est à 210 ; ils reprendront dimanche.
- **P-2. Mardi, Anne fait une séance de parrainage depuis le tableau (livraison 2).** Elle a noté sur sa feuille « mardi 14 h-16 h : parrainage ». Elle ouvre Contacts, choisit la vue enregistrée « Proches jamais recontactés », retire trois personnes, garde 15 lignes et clique « Lancer une séance ». Elle nomme la séance « Parrainage » et choisit le message type « Parrainage » de la catégorie. La séance s'affiche, une personne par ligne, le prénom déjà inséré dans le message. Pour chacune, elle choisit le canal (WhatsApp, SMS, appel, e-mail), copie le message, l'envoie depuis son téléphone, puis coche « contacté ». À 16 h, la séance affiche « 14 contactés sur 15 ». Dans le tableau, ces 14 personnes ont un dernier contact daté du jour, avec son canal.
- **P-3. Le dimanche soir, Anne et JB planifient la semaine (livraison 3).** Ils ouvrent le bilan de la semaine écoulée : une barre pleine, une à moitié, un rendez-vous obtenu. Ils passent à la semaine suivante. Dans la colonne de gauche, la liste de leurs actions de prospection. Ils glissent « Boîtage » sur mardi 9 h et l'étirent jusqu'à 12 h ; « Parrainage » sur mercredi 14 h, étiré à 16 h ; « Diagnostic offert aux vendeurs tièdes » sur jeudi 10 h ; « Café partenaire » deux fois sur vendredi. La liste de gauche n'a pas bougé. Dix minutes, et ils ferment.
- **P-4. Mardi midi, Anne note son boîtage (livraison 3).** Elle ouvre l'espace sur sa semaine : la colonne de mardi ressort, lundi est grisé avec ce qu'elle y a fait. Elle clique sur « Boîtage à Publier, 9 h-12 h, 200 flyers », tape 180, valide. La barre « Boîtage » passe à 90 %. Mercredi, elle glisse à la souris l'activité de jeudi, qu'elle ne pourra pas faire, sur vendredi 15 h. Mercredi à 14 h, elle clique sur « Parrainage » : le tableau des contacts s'ouvre sur la vue « Ambassadeurs » ; elle garde 15 personnes et lance la séance, déjà réglée sur le message « Parrainage ».

## 3. Glossaire

- **Contact** : une personne connue d'Anne, avec un nom et au moins un moyen de la joindre ou de la retrouver : téléphone, e-mail, ou lien de profil (LinkedIn, Instagram, Facebook). Un contact a une seule catégorie et une ou plusieurs sources ; il peut avoir une entreprise et une ville.
- **Projet** : ce que la personne peut apporter à Anne (JB, 01/11 19 h 17) : à qualifier (valeur de départ), vendeur, acheteur, vendeur et acheteur (vend pour racheter), ambassadeur (pas de projet, peut recommander Anne). Indépendant de la catégorie.
- **Température** : pour un vendeur ou un acheteur seulement, où en est son projet : froid (plus d'un an, simple idée), tiède (dans l'année), chaud (dans les trois mois), déjà en vente (vendeur : bien sur le marché, en direct ou chez une autre agence) ou en recherche active (acheteur : visite déjà), avec Anne (mandat signé ou acheteur accompagné), terminé (vendu, acheté ou abandonné).
- **Source** : d'où vient le contact : téléphone, LinkedIn, réseaux sociaux, animations EDB, saisie à la main, ou l'espace actuel.
- **Catégorie** : la réponse à « comment Anne connaît-elle cette personne ? », qui donne la façon de la contacter (JB, 01/11 19 h 15). Cinq au départ : anciens clients, proches, rencontrés à l'EDB, partenaires pros, relations lointaines. Si une personne entre dans deux catégories, on choisit celle qui sert le plus pour la contacter.
- **Méthode** : ce qui est associé à une catégorie : canal conseillé, ce qu'on demande (recommander, proposer le diagnostic offert, prendre des nouvelles), un ou plusieurs messages types, et deux autorisations : l'envoi groupé par e-mail et l'appel.
- **Vérifié** : un contact dont Anne ou JB a confirmé (ou corrigé) la catégorie proposée à l'import.
- **Écarté** : un contact mis de côté par Anne ou JB, sans intérêt pour la prospection. Il n'est pas effacé et peut revenir.
- **Rejeté à l'import** : une ligne d'un fichier importé qui n'a ni nom, ni aucun moyen de joindre ou de retrouver la personne ; elle n'entre pas dans l'espace.
- **Accord** : la trace qu'un contact a accepté de recevoir des e-mails groupés (déjà géré par l'espace actuel, story 13.26).
- **Vue enregistrée** : une combinaison de filtres du tableau, enregistrée sous un nom.
- **Séance de contacts** : une liste de contacts choisie dans le tableau, avec un nom (« Parrainage ») et un message type, qu'Anne déroule en cochant chaque personne contactée.
- **Dernier contact** : la date et le canal de la dernière coche « contacté » d'une personne, toutes séances confondues. « Jamais recontacté » : aucune coche.
- **Canal** : le moyen utilisé pour une personne : WhatsApp, SMS, appel, e-mail.
- **Semaine** : du lundi au dimanche ; l'unité de planification et de bilan (livraison 3).
- **Action de prospection** : un modèle d'action réutilisable, rangé dans la colonne de gauche de la semaine (JB, 01/11 19 h 21) : un nom (« Parrainage »), un type d'activité, une durée par défaut, et pour une séance de contacts, la vue enregistrée qui choisit les contacts et le message type ou le script d'appel. Exemple : « Parrainage » = vue « Ambassadeurs » + message type « Parrainage ». Une action n'est jamais consommée : la placer dans la semaine en fait une copie.
- **Script d'appel** : pour une action faite par téléphone, le texte qu'Anne garde sous les yeux pendant ses appels (ce qu'elle dit, les questions à poser). **[HYPOTHÈSE]** Un simple texte, comme un message type, sans arbre de questions.
- **Activité** : une action de prospection placée dans la semaine, sur un jour et un créneau de 1 à 3 heures (JB, 01/11 19 h 21) ; un nombre visé et une note facultatifs ; puis une quantité réalisée. Une activité de type séance de contacts porte une séance. Une activité est soit à faire, soit faite.
- **Type d'activité** : boîtage, séance de contacts, rencontre (partenaire pro, voisin…), autre. Chaque action de prospection a un type. **[HYPOTHÈSE]** Liste de départ, modifiable par JB.
- **Cible** : ce que vise une activité : une zone (boîtage), une ou plusieurs catégories (séance de contacts), une personne ou un lieu (rencontre).
- **Quantité réalisée** : ce qui a été fait, dans l'unité du type : flyers pour un boîtage, personnes cochées « contacté » pour une séance, rencontres faites.
- **Barre d'effort** : pour un type d'activité et une semaine, la quantité réalisée ; rapportée au total des nombres visés quand il y en a, sinon affichée seule.
- **Résultat** : ce que la prospection rapporte : rendez-vous obtenu, recommandation reçue, mandat signé.
- **Bilan** : la vue à part qui montre les barres d'effort et les résultats, à la semaine, au mois et à l'année (livraison 3).
- **Livraison 1, 2, 3** : les trois étapes de construction du § 6.

## 4. Fonctions

Les fonctions sont rangées dans l'ordre de construction (§ 6). La largeur d'écran de référence est 1 366 pixels, celle d'un ordinateur portable courant ; aucune page n'y défile en largeur.

### 4.1 La page Contacts (livraison 1)

**Description :** la page la plus importante de l'espace, et sa page d'accueil jusqu'à la livraison 3. Un grand tableau qui réunit tous les contacts, toutes sources confondues, sur toute la largeur de l'écran. On y filtre et on y classe, souvent plusieurs contacts à la fois. Réalise P-1, P-2.

#### FR-1 : Voir tous les contacts dans un tableau
La page Contacts est un tableau, une ligne par contact.
- Colonnes : nom et prénom, entreprise, catégorie, projet, température, source(s), ville, téléphone, e-mail, lien de profil, dernier contact (date et canal), accord, vérifié ou non.
- On peut masquer ou afficher une colonne, et trier sur chacune.
- Le nombre de contacts affichés est toujours visible (« 214 contacts sur 612 »).
- Avec 1 000 contacts, un tri, un filtre ou une recherche s'applique en moins d'une seconde.
- Par défaut, les contacts écartés n'apparaissent pas.

#### FR-2 : Filtrer et enregistrer des vues
Anne combine des filtres sans écrire de formule.
- Filtres : catégorie, projet, température, source, entreprise, ville, vérifié ou non, écarté ou non, accord, jamais recontacté, dernier contact plus ancien qu'une durée choisie.
- Les filtres actifs sont affichés au-dessus du tableau et se retirent d'un clic chacun.
- Une combinaison de filtres s'enregistre sous un nom (« Vendeurs chauds », « Ambassadeurs », « EDB jamais recontactés », « Anciens de Danone ») et se retrouve d'un clic (JB, 01/11). Une vue enregistrée se renomme ou se supprime.

#### FR-3 : Retrouver un contact
Anne cherche un contact par nom, prénom, morceau de numéro, e-mail ou entreprise ; la recherche se combine avec les filtres.
- La recherche existante de l'espace (story 13.24) est reprise.

#### FR-4 : Classer et qualifier plusieurs contacts à la fois
Anne coche plusieurs lignes, ou « tout ce qui est filtré », et applique une action à toutes.
- Maj + clic sur une case coche (ou décoche) toutes les lignes entre la case cliquée juste avant et celle-ci, dans l'ordre affiché (JB, 01/11 20 h 53).
- Actions groupées : changer la catégorie, le projet ou la température, marquer vérifié, écarter.
- Changer la catégorie d'un contact le marque vérifié.
- La température n'est proposée que pour un vendeur, un acheteur, ou un vendeur et acheteur ; passer un contact en ambassadeur ou à qualifier efface sa température.
- Tout contact importé démarre « à qualifier » ; la qualification se fait au fil des échanges, sans obligation de tout remplir au classement de départ.
- Sur une seule ligne, la catégorie, le projet et la température se changent directement dans le tableau, sans ouvrir de fiche.
- Une action groupée annonce le nombre de contacts touchés avant de s'appliquer. **[HYPOTHÈSE]** Elle peut être annulée tant qu'aucune autre action n'a été faite.

#### FR-5 : Écarter un contact
Anne ou JB écartent un contact sans intérêt pour la prospection, seul ou en groupe (FR-4).
- Un contact écarté disparaît du tableau par défaut et des séances ; le filtre « écartés » le montre, et on peut le faire revenir.
- Les règles de l'espace actuel sur les données personnelles (droits d'accès et d'effacement, purge) s'appliquent à tous les contacts, écartés compris.

#### FR-6 : Le travail de classement du départ
Après un import, Anne voit d'un coup d'œil ce qui reste à classer.
- Une vue prête à l'emploi « à vérifier » montre les contacts dont la catégorie a été proposée par l'import mais pas encore confirmée.
- Le compteur « reste à vérifier » baisse à mesure qu'on avance ; on peut s'arrêter et reprendre quand on veut, rien n'est perdu.
- Anne et JB peuvent classer à tour de rôle, chacun sur son ordinateur. **[HYPOTHÈSE]** Ils ne travaillent pas en même temps sur les mêmes contacts ; si cela arrive, la dernière modification l'emporte.

### 4.2 L'import des contacts (livraison 1)

**Description :** faire entrer les contacts d'Anne, de toutes les sources, sans doublon et déjà pré-rangés. Réalise P-1.

#### FR-7 : Importer un fichier de contacts
JB ou Anne importent un fichier de contacts.
- Formats acceptés : l'export des contacts du téléphone (vCard ou CSV), l'export LinkedIn (CSV), un tableur Excel ou CSV (animations EDB, ou un fichier d'abonnés des réseaux).
- Avant d'enregistrer, un aperçu montre combien de contacts sont nouveaux, combien complètent un contact existant, combien sont des doublons probables à confirmer, combien sont rejetés à l'import.
- La source de chaque contact est enregistrée ; un contact trouvé dans deux fichiers garde ses deux sources.
- Avant la mise en ligne, l'import est essayé avec de vrais fichiers : l'export vCard du téléphone Samsung d'Anne et un tableur Excel (JB, 01/11 19 h 40).
- **[HYPOTHÈSE]** Chaque import est gardé comme un lot, qu'on peut annuler en entier tant que ses contacts n'ont pas été modifiés à la main (proposé à la table ronde du 01/11, pour qu'un mauvais fichier ne pollue pas tout le tableau).
- Les abonnés des réseaux sociaux se récupèrent depuis le navigateur d'Anne, connecté à ses comptes, et jamais depuis celui de JB (JB, 01/11 14 h 42). Claude prépare ce relevé avec l'accord de JB et en fait un fichier, importé comme les autres. Le moyen exact dépend de la question 2 (§ 8).

#### FR-8 : Éviter les doublons
Un même contact n'apparaît qu'une fois.
- Un contact dont le téléphone, l'e-mail ou le lien de profil est déjà connu complète la fiche existante (règle déjà en place dans l'espace actuel pour le téléphone et l'e-mail).
- Un contact qui n'a en commun qu'un nom et un prénom avec un contact existant est présenté dans l'aperçu comme doublon probable ; la personne qui importe confirme la fusion ou garde les deux.

#### FR-9 : Pré-ranger à l'import
Chaque contact importé reçoit une catégorie proposée, et reste « à vérifier ».
- Fichier des anciens clients (tableur fourni par Anne) → anciens clients ; fichier des partenaires (notaires, banquiers, artisans) → partenaires pros. Les contacts de l'espace actuel ne sont pas repris (FR-11).
- Animations EDB → rencontrés à l'EDB.
- Téléphone → proches.
- LinkedIn et réseaux sociaux → relations lointaines.
- Pour un contact à plusieurs sources, la règle la plus haute de cette liste l'emporte.
- Un contact saisi à la main reçoit la catégorie choisie au moment de la saisie, et il est vérifié.
- Un import ne change jamais la catégorie d'un contact déjà vérifié.
- **[HYPOTHÈSE]** Ces règles sont fixes en livraison 1 ; seul le résultat se corrige (FR-4).

#### FR-10 : Garder la trace de l'accord
À l'import du fichier des animations, l'accord pour les e-mails groupés est enregistré pour chaque contact (bulletin du jeu, JB 01/11). Les autres sources n'en donnent pas.
- La règle d'accord existante de l'espace (story 13.26) s'applique telle quelle.

#### FR-11 : Les contacts de l'espace actuel
L'espace actuel ne contient presque aucun contact (JB, 01/11 19 h 14) : ils ne sont pas repris dans le tableau. Ils restent dans leurs pages, rangées dans le menu « Autres outils ».

### 4.3 Les catégories et leur méthode (livraison 1)

**Description :** chaque catégorie dit comment contacter ses personnes. C'est ce qui guide les séances.

#### FR-12 : Gérer les catégories
JB peut renommer une catégorie, en ajouter une, ou en retirer une.
- Renommer une catégorie ne change rien pour ses contacts.
- Une catégorie ne peut être retirée que vide : ses contacts sont d'abord rangés ailleurs (FR-4).
- Les cinq catégories de départ sont créées avec leur méthode :
  - **Anciens clients** (des gens pour qui Anne a déjà vendu ou acheté un bien) : appel ou message personnel ; on demande un avis et une recommandation (parrainage, dès l'accord d'eXp). Envoi groupé permis ; appel permis.
  - **Proches** (amis, famille, anciens collègues qu'Anne connaît vraiment) : message personnel, un par un (SMS, WhatsApp, appel) ; on prend des nouvelles et on parle du parrainage. Envoi groupé non permis ; appel permis.
  - **Rencontrés à l'EDB** : e-mail « on s'était vus à l'animation », avec le diagnostic offert. Envoi groupé permis (accord du bulletin) ; **[HYPOTHÈSE]** appel non permis tant que la question 1 (§ 8) n'est pas tranchée.
  - **Partenaires pros** (notaires, banquiers, artisans…) : rencontre ou appel ; échange de recommandations. Envoi groupé permis ; appel permis.
  - **Relations lointaines** (contacts LinkedIn jamais revus, abonnés des réseaux) : pas de message groupé ; un message privé quand la personne réagit à une publication. Envoi groupé non permis ; appel non permis.

#### FR-13 : Décrire la méthode d'une catégorie
JB peut écrire pour chaque catégorie : le canal conseillé, ce qu'on demande, un ou plusieurs messages types nommés, et les deux autorisations (envoi groupé, appel).
- L'envoi groupé ne peut être permis que pour des contacts qui ont un accord (FR-10) ou sont anciens clients.
- Un message type peut contenir le prénom du contact, remplacé automatiquement à l'affichage.

### 4.4 Le rangement de l'existant (livraison 1)

**Description :** tout ce que l'espace sait déjà faire reste disponible, mais hors du champ visuel.

#### FR-14 : Barre de navigation réduite
La barre de navigation ne montre que les pages de la nouvelle version, et un menu déroulant **[HYPOTHÈSE]** « Autres outils ».
- Livraison 1 : Contacts (page d'accueil) et « Autres outils ». Livraison 2 : s'y ajoute Séances. Livraison 3 : Semaine (qui devient la page d'accueil), Contacts, Séances, Bilan et « Autres outils ».
- Le menu donne accès à toutes les pages actuelles : l'actuelle page d'accueil « Aujourd'hui », pipeline, qualifier, ajouter, importer, prescripteurs, acheteurs, Prospection (actions marketing), campagnes, à trier, gestion.
- Aucune page actuelle n'est supprimée ; les liens existants continuent de fonctionner.
- Les relèves automatiques (Leedflow, e-mails de relance) continuent de tourner sans changement.

### 4.5 La séance de contacts (livraison 2)

**Description :** agir sur les contacts classés. Anne choisit une liste dans le tableau et la déroule, une personne après l'autre. La séance existe seule en livraison 2 ; en livraison 3, une activité de la semaine peut en porter une (FR-20). Réalise P-2.

#### FR-15 : Lancer une séance depuis le tableau
Anne coche des contacts dans le tableau (souvent après avoir choisi une vue enregistrée) et clique « Lancer une séance » (JB, 01/11 15 h 09).
- Elle donne un nom à la séance (« Parrainage ») et choisit le message type parmi ceux de la catégorie ; par défaut, le premier.
- Elle peut ajouter un commentaire à la séance : son but, le contexte, ce qu'elle veut obtenir (JB, 01/11 19 h 40). **[HYPOTHÈSE]** Un simple texte libre en V1 ; JB veut retravailler ce point plus tard.
- Les contacts jamais recontactés apparaissent en premier.
- Pour une séance de parrainage, la vue proposée par défaut est celle des ambassadeurs (JB, 01/11).
- Pendant la séance, Anne peut changer le projet et la température d'une personne selon sa réponse (« vend dans l'année » : vendeur, tiède).
- Elle peut ajouter ou retirer des personnes tant que la séance est ouverte.
- La page Séances liste les séances, ouvertes ou terminées, avec leur date et leur nombre de personnes contactées.

#### FR-16 : Dérouler la séance et cocher les contacts
La séance affiche une personne par ligne, avec le message type, prénom inséré.
- Pour chaque personne, Anne choisit le canal (WhatsApp, SMS, e-mail, ou appel si la méthode de la catégorie le permet).
- Pour un message, elle le copie en un clic et l'envoie depuis son téléphone ou sa messagerie ; l'espace n'envoie ni SMS ni WhatsApp. Pour un appel, l'espace affiche le numéro, cliquable, et le message sert d'aide-mémoire.
- Elle coche « contacté » ; la coche enregistre sur le contact la date et le canal (le dernier contact du tableau). Elle peut ajouter une courte note (« rappeler en janvier », « rendez-vous jeudi »).
- La séance affiche « 14 contactés sur 15 ». Une personne non cochée reste disponible pour une prochaine séance.

#### FR-17 : E-mail groupé depuis une séance (plus tard)
**[HYPOTHÈSE]** Pour une catégorie où l'envoi groupé est permis, une séance par e-mail peut passer par la fonction Campagnes existante (stories 13.26 et 13.27). Elle ne fonctionnera réellement qu'une fois le sous-domaine d'envoi créé (action de JB déjà listée).

### 4.6 La page de la semaine (livraison 3)

**Description :** la semaine en cours, du lundi au dimanche, une colonne par jour, découpée en créneaux d'une heure de 8 h à 19 h, avec à gauche la colonne des actions de prospection. Elle devient la page d'accueil. La colonne d'aujourd'hui est mise en avant ; les jours passés sont grisés mais lisibles, pour voir ce qui a été fait la veille. Réalise P-3, P-4.

#### FR-18 : Ouvrir sur la semaine, aujourd'hui en avant
En ouvrant l'espace, Anne voit sa semaine entière, avec la journée d'aujourd'hui mise en avant (JB, 01/11 14 h 49).
- À gauche, la colonne des actions de prospection (FR-19) ; à droite, sept colonnes, du lundi au dimanche, sans défilement en largeur.
- Chaque jour est découpé en créneaux d'une heure, de 8 h à 19 h (JB, 01/11 19 h 21). Une activité occupe la hauteur de ses heures.
- La colonne d'aujourd'hui a un fond et une bordure qui la distinguent des autres.
- Les jours passés sont grisés ; leurs activités restent lisibles, avec leur quantité réalisée.
- S'il n'y a aucune activité aujourd'hui, la colonne du jour l'indique simplement et montre la prochaine activité prévue.
- Aucun compteur de résultats (rendez-vous, mandats) n'apparaît sur cette page.

#### FR-19 : La colonne des actions de prospection
À gauche de la semaine, la liste des actions de prospection, toujours visible (JB, 01/11 19 h 21).
- Chaque action affiche son nom, son type et sa durée par défaut.
- Cliquer sur une action d'un type séance de contacts ouvre le tableau des contacts sur sa vue enregistrée ; « Lancer une séance » y reprend son message type ou son script d'appel. Rien d'autre à créer.
- Anne ou JB ajoutent, modifient ou suppriment une action : nom, type, durée par défaut (1, 2 ou 3 heures), vue enregistrée, message type ou script d'appel. Supprimer une action ne touche pas les activités déjà placées.
- **[HYPOTHÈSE]** Liste de départ : « Parrainage » (vue Ambassadeurs), « Diagnostic offert aux vendeurs tièdes », « Nouvelles aux anciens clients », « Nouvelles aux proches », « Rencontrés à l'EDB jamais recontactés », « Boîtage », « Café partenaire ». À revoir avec Anne.

#### FR-20 : Placer et déplacer une activité
Anne ou JB placent une activité en faisant glisser une action de la colonne de gauche sur un créneau de la semaine en cours ou de la suivante (glisser-déposer : on attrape l'action à la souris et on la lâche sur l'heure voulue) (JB, 01/11 19 h 21).
- Glisser une action la copie : elle reste dans la colonne de gauche, et peut être placée autant de fois qu'on veut.
- L'activité prend la durée par défaut de l'action. On la rallonge ou la raccourcit en tirant son bord du bas, par heure entière, de 1 à 3 heures.
- Un nombre visé et une note s'ajoutent en cliquant sur l'activité. Pour une séance de contacts, c'est souvent le temps qui sert de repère (« deux heures de parrainage ») plutôt qu'un nombre.
- Cliquer sur une activité de type séance de contacts ouvre le tableau des contacts sur la vue de son action ; la séance lancée (FR-15) est rattachée à l'activité.
- Une activité non faite se déplace en la faisant glisser vers un autre créneau, du même jour ou d'un autre, par exemple de mardi 14 h à jeudi 10 h (JB, 01/11). Elle peut aussi être retirée de la semaine, quel que soit son type : un clic sur l'activité propose de l'ouvrir ou de la retirer, et le retrait s'annule tout de suite (JB, 01/11 20 h 56).
- **[HYPOTHÈSE]** Deux activités peuvent se chevaucher ; elles s'affichent alors côte à côte.
- **[HYPOTHÈSE]** Un jour passé n'accepte pas qu'on y dépose une activité ; une activité non faite d'un jour passé peut être glissée vers aujourd'hui ou un jour à venir.

#### FR-21 : Noter une activité comme faite
Anne indique la quantité réalisée.
- Pour un boîtage, une rencontre ou une autre activité : un clic sur l'activité, une quantité, valider ; deux gestes au plus.
- Pour une séance de contacts, la quantité est le nombre de personnes cochées dans la séance (FR-16) ; rien d'autre à saisir.
- La quantité peut dépasser le nombre visé.
- **[HYPOTHÈSE]** Une activité faite peut être corrigée jusqu'à la fin de sa semaine.
- Une activité non faite reste visible à son jour, sans alerte ni couleur alarmante (le gris des jours passés suffit).

#### FR-22 : Voir les barres d'effort de la semaine
Sur la page de la semaine, une barre par type d'activité présent dans la semaine.
- Elle montre la quantité réalisée sur le total des nombres visés quand il y en a, sinon la quantité seule (« 14 contactés »).
- Les barres se mettent à jour dès qu'une activité est notée ou qu'une personne est cochée.

### 4.7 Le bilan (livraison 3)

**Description :** une vue à part, ouverte depuis la barre de navigation, regardée le dimanche avant de planifier. Elle montre ce qui a été fait et ce que ça a rapporté. Réalise P-3.

#### FR-23 : Bilan de l'effort
Pour une semaine choisie, le bilan montre chaque type d'activité avec son nombre d'activités, sa quantité réalisée et sa barre d'effort.
- Les mêmes totaux existent au mois et à l'année.
- On passe d'une semaine à l'autre d'un clic.

#### FR-24 : Noter un résultat
Anne ou JB notent un résultat (rendez-vous obtenu, recommandation reçue, mandat signé) avec sa date, et, si on le connaît, le contact et la séance ou l'activité dont il vient.
- Les résultats se saisissent à la main : aujourd'hui, aucun rendez-vous ni mandat n'est suivi dans l'espace (JB, 01/11 15 h 13).

#### FR-25 : Bilan des résultats
Le bilan montre le nombre de rendez-vous, de recommandations et de mandats signés à la semaine, au mois et à l'année.
- Un résultat noté apparaît dans le bilan dès qu'il est enregistré.
- Un résultat rattaché à une séance est compté sous le type « séance de contacts ».

## 5. Ce que l'outil ne fait pas (explicitement)

- Il n'envoie pas de SMS ni de WhatsApp ; il prépare, Anne envoie.
- Il ne compte pas automatiquement les boîtes aux lettres, appels ou messages passés hors de l'espace.
- Il ne remplace pas Modelo, le logiciel imposé par eXp.
- Il ne va pas chercher de contacts sur des sites ou des réseaux tout seul, ni chez des inconnus : seulement les contacts d'Anne, à partir de fichiers exportés par elle ou relevés depuis son propre navigateur avec l'accord de JB (FR-7).

## 6. Première version

### 6.1 Ordre de construction
1. **Livraison 1 : la page Contacts.** Tableau, filtres et vues enregistrées, recherche, actions groupées, écarter, classement de départ (FR-1 à FR-6) ; import, doublons, pré-rangement, accord, reprise de l'existant (FR-7 à FR-11) ; catégories et méthodes (FR-12, FR-13) ; navigation réduite (FR-14). Contacts est la page d'accueil. Anne et JB commencent le classement dès sa mise en ligne.
2. **Livraison 2 : la séance de contacts** (FR-15, FR-16), lancée directement depuis le tableau, avec sa page Séances.
3. **Livraison 3 : la semaine et le bilan** (FR-18 à FR-25). La semaine devient la page d'accueil ; une activité peut porter une séance.

Ce que coûte cet ordre : pendant les livraisons 1 et 2, l'espace ne montre pas « quoi faire aujourd'hui ». Anne garde sa feuille du dimanche pour ses activités, et les séances lancées depuis le tableau couvrent la partie contacts.

### 6.2 Plus tard
- E-mail groupé depuis une séance (FR-17) : attend le sous-domaine d'envoi.
- Le traitement des leads entrants (Leedflow, boîte mail) dans la nouvelle version : revient depuis le menu quand la prospection tourne.
- Version téléphone.

## 7. Comment on saura que ça marche

**Principaux**
- **SM-1** : un mois après la mise en ligne de la livraison 1, tous les contacts importés sont vérifiés ou écartés. Valide FR-1 à FR-11.
- **SM-2** : après la livraison 2, au moins deux séances de contacts par semaine pendant quatre semaines d'affilée. **[HYPOTHÈSE]** Seuil à confirmer avec JB. Valide FR-15, FR-16.
- **SM-3** : un premier rendez-vous vendeur obtenu auprès d'une personne cochée « contacté » dans une séance (noté dans la séance, puis comme résultat en livraison 3). Valide FR-16, FR-24.
- **SM-4** : après la livraison 3, une semaine planifiée chaque dimanche, au moins trois activités, et au moins 70 % notées comme faites, pendant quatre semaines d'affilée. Valide FR-18 à FR-22.

**Secondaire**
- **SM-5** : à la fin du premier mois de chaque livraison, Anne dit qu'elle sait quoi faire en ouvrant l'espace (question posée par JB).

**À ne pas chercher à maximiser**
- **SM-C1** : le nombre de contacts importés. Mieux vaut 150 contacts bien rangés que 1 000 en vrac. Contrebalance SM-1.
- **SM-C2** : le nombre de personnes contactées ou de flyers posés. Une semaine chargée qui épuise Anne est un échec, même si les compteurs montent. Contrebalance SM-2 et SM-4.

## 8. Questions ouvertes

1. La règle du 11/08/2026 sur les appels aux particuliers, citée d'après la presse spécialisée : à vérifier sur le texte officiel. D'ici là, l'appel n'est permis que pour les catégories où la méthode l'autorise (FR-12, FR-13).
2. Comment récupérer les abonnés Instagram et Facebook d'Anne depuis son navigateur : export proposé par ces réseaux, ou relevé assisté des pages ? À étudier avant de le faire, avec l'accord de JB. Sinon, « relations lointaines » ne contiendra que LinkedIn au départ.
3. Le message type du parrainage dépend de l'accord d'eXp France, toujours attendu.
4. Où se fait l'import : dans l'espace (FR-7 à FR-9), ou directement avec Claude, qui lirait les fichiers, rangerait les contacts et les déposerait dans la base (JB, 01/11 19 h 40) ? À trancher à l'architecture. Si c'est Claude, FR-7 à FR-9 restent les règles à suivre, mais sans écran d'import.
5. Le cadre légal pour prospecter les contacts du téléphone d'Anne (données personnelles) : sur quoi s'appuie-t-on, et faut-il informer ces personnes ? À vérifier avant le premier import.

## 9. Hypothèses à confirmer

- § 3 : liste de départ des types d'activité (boîtage, séance de contacts, rencontre, autre).
- FR-4 : annulation d'une action groupée tant qu'aucune autre action n'a été faite.
- FR-6 : pas de travail simultané sur les mêmes contacts ; la dernière modification l'emporte.
- FR-9 : règles de pré-rangement fixes en livraison 1.
- FR-12 : appel non permis pour les rencontrés à l'EDB tant que la question 1 n'est pas tranchée.
- FR-14 : nom du menu « Autres outils ».
- § 3 : le script d'appel est un simple texte.
- FR-7 : chaque import peut être annulé en entier.
- FR-15 : le commentaire de séance est un simple texte.
- FR-17 : l'e-mail groupé passe par les Campagnes existantes.
- FR-19 : liste de départ des actions de prospection.
- FR-20 : deux activités peuvent se chevaucher.
- FR-20 : pas de dépôt sur un jour passé.
- FR-21 : correction d'une activité faite jusqu'à la fin de sa semaine.
- SM-2 : deux séances par semaine.
