---
story: 17.1
epic: 17 — Programme ambassadeurs
statut: review
date: 2026-11-01
origine: idée de JB du 2026-11-01 (fil « [Site] Page ambassadeurs du QR code »)
---

# Story 17.1 — Maquette et cadrage de la page ambassadeurs

## Objectif

Anne recommande peu de monde à elle-même : son taux de recommandation est faible pour la qualité de son travail et le nombre de gens qu'elle connaît. JB propose de faire de toutes ses cartes de visite des « cartes ambassadeur » : au dos, un QR code mène à une page où la personne s'inscrit (prénom, nom, e-mail, téléphone) et entre dans le fichier des ambassadeurs. Si elle présente à Anne un proche qui vend, elle reçoit un remerciement, jusqu'à 1 500 €.

Le pitch d'Anne devient simple et pas insistant : « je suis agent immobilier, j'ai lancé un programme ambassadeurs, scannez la carte ; si vous connaissez quelqu'un, vous pouvez en profiter ».

Cette story fait la maquette de la page et écrit ce qu'il faudra construire (stories 17.2 à 17.4). **Pas de code avant l'accord de JB.**

## Partage du travail entre les fils

- **[Com] Campagne de parrainage** : la règle du remerciement, l'accord d'eXp France, le règlement, les cartes, le QR code et le pitch d'Anne.
- **Ce fil** : la page du site, son formulaire et l'arrivée de l'inscrit dans l'espace d'Anne.
- **[Site] Espace de travail d'Anne** : le fichier des ambassadeurs lui-même (projet « ambassadeur » du PRD de l'espace, vue enregistrée « Ambassadeurs », action de prospection « Parrainage »).

## Maquette

https://claude.ai/artifact/JRzaQnTFGuTM83oyuFdHby (charte d'Anne, téléphone d'abord, puisqu'on arrive par un QR code). Trois écrans :

1. **La page** : titre « Un proche pense à vendre ? Présentez-le à Anne. », le remerciement « jusqu'à 1 500 € », un mot d'Anne avec son portrait, les trois étapes (je m'inscris, je donne un nom, Anne me remercie), le formulaire, puis « Bon à savoir » (qui peut s'inscrire, quelles ventes comptent, rôle limité à présenter, déclaration aux impôts). Le formulaire marche dans la maquette (bouton Lecture).
2. **Après l'inscription** : « Bienvenue parmi les ambassadeurs, Claire », règlement envoyé par e-mail, puis « Vous pensez déjà à quelqu'un ? » avec deux boutons qui ouvrent WhatsApp ou un SMS vers Anne, et l'ajout du numéro d'Anne au téléphone.
3. **Dans l'espace d'Anne** : une carte « Nouvel ambassadeur » dans les demandes reçues (Ranger, Vu, Écarter), et le cas d'une personne déjà connue.

Le mot d'Anne (« Vous savez comment je travaille… ») est une proposition : Anne le relit et le réécrit à sa façon.

## Ce qui est décidé dans cette maquette (proposé par Claude, à valider par JB)

- **Adresse** : `annevialtissot.fr/ambassadeurs`. L'adresse `/ambassadeur` (déjà prévue pour les premiers QR codes, `?c=carte`) y renvoie, donc aucun code imprimé n'est perdu. Le paramètre `c` dit d'où vient l'inscrit (`carte`, `email`, `whatsapp`…) et suit la règle des origines de campagne (story 5.4, AD-11).
- **Vocabulaire** (fil parrainage) : « remerciement », jamais « commission » ; toujours « jusqu'à 1 500 € », jamais « jusqu'à 5 % » seul (on lirait 5 % du prix de vente) ; « offert », jamais « gratuit ».
- **Champs** : prénom, nom, téléphone, e-mail, tous obligatoires (demande de JB).
- **Deux cases séparées** :
  - « J'accepte le règlement du programme », **obligatoire**, avec lien vers le texte complet. La date d'acceptation et la version du règlement sont gardées : l'inscription vaut acceptation avant toute recommandation (exigence légale relevée par le fil parrainage).
  - « Recevoir des nouvelles d'Anne par e-mail », **facultative**. Elle seule donne l'accord pour les e-mails groupés (même règle que l'accord e-mail de l'espace, story 13.26).
- **La recommandation elle-même ne passe pas par le formulaire.** L'ambassadeur écrit à Anne (WhatsApp ou SMS, boutons de l'écran de remerciement). Raison : le site n'enregistre pas les coordonnées d'un tiers qui n'a rien accepté, et le message direct garde le côté personnel. Anne note ensuite « Recommandé par » sur la fiche du proche dans l'espace. Ce qu'on perd : pas de compteur automatique des recommandations ; on pourra ajouter un formulaire « Présenter un proche » plus tard si le volume le justifie.
- **Professionnels** (notaire, artisan, banquier) : hors programme, la page leur propose un échange de recommandations ; ils relèvent des prescripteurs de l'espace.

## Ce qu'il faudra construire

### Story 17.2 — Page `/ambassadeurs` et formulaire
- Page statique comme `/vendre`, en français, construite depuis la maquette, avec le règlement sur `/ambassadeurs/reglement` (texte fourni par le fil parrainage).
- Le formulaire passe par le traitement commun des formulaires (`site/src/server/capture.ts`) : anti-robot Turnstile, champ piège, limite de fréquence, numéro d'envoi unique. Nouvelle source `ambassadeur` dans `SourceFormulaire` et dans la table `lead` (AD-6 : une seule table, une source de plus).
- Deux colonnes de plus sur `lead` (migration) : `reglement_version` et `reglement_accepte_le`. L'accord e-mail réutilise la colonne de la story 13.26.
- E-mail à l'inscrit : bienvenue + règlement en PDF ou en lien. E-mail à Anne : « Nouvel ambassadeur : Prénom Nom ».
- Une inscription par e-mail ou téléphone : une seconde inscription ne crée pas de doublon, elle met à jour la date et dit « vous êtes déjà ambassadeur ».
- Redirection `/ambassadeur` → `/ambassadeurs`. Page non indexée tant que le programme n'est pas ouvert.
- Vérifications : `npm run build`, `npm run check`, `scripts/liens.mjs`, `npm run verif`, `scripts/ecrans.mjs`, essai de bout en bout sur la base d'essai. Revue de code en session neuve (story 9.8).

### Story 17.3 — Arrivée de l'ambassadeur dans l'espace d'Anne
À construire avec le chantier de l'espace (PRD du 2026-11-01, FR-27 « Demandes reçues »), dans sa livraison qui crée la page Contacts :
- Une inscription crée le contact avec le projet « ambassadeur », la source « page ambassadeurs » (et l'origine `c`), sans catégorie arrêtée : la carte des demandes reçues propose « Ranger » pour qu'Anne choisisse comment elle connaît la personne.
- Si la personne existe déjà (même téléphone ou même e-mail), on n'en crée pas une deuxième : la fiche gagne la source et la marque d'ambassadeur ; si elle est déjà vendeuse ou acheteuse, son projet ne change pas.
- La fiche montre « Règlement accepté le … (version …) ».
- La vue enregistrée « Ambassadeurs » les retrouve tous ; l'action « Parrainage » s'en sert.
- Réglé avec le fil de l'espace (2026-11-01) : la marque « ambassadeur » est indépendante du projet et de la catégorie (une vendeuse peut être ambassadrice). Colonnes `contact.ambassadeur_inscrit_le` et `contact.ambassadeur_reglement`, créées par la migration 0018 de l'espace (story 18.2) et écrites par `site/src/server/contacts.ts` au rattachement d'un lead `ambassadeur` (story 18.3). La story 17.2 n'écrit que dans `lead`, pour éviter deux migrations sur `contact`. La vue « Ambassadeurs » = inscrits ou projet ambassadeur.

### Story 17.4 — Ouverture du programme
- Préalables : accord écrit d'eXp France, montant validé par JB, avis du comptable, règlement rédigé (fil parrainage).
- Mise en ligne de la page (indexée), mise à jour de la page Confidentialité (finalité « programme ambassadeurs », base légale : le règlement accepté ; durée de conservation à fixer, proposition : 3 ans après le dernier échange), adresse du QR code transmise au fil parrainage pour les cartes.
- Les droits d'accès et d'effacement passent par `/gestion` comme pour les autres demandes (AD-18).

## Données personnelles (RGPD)

- Finalité : gérer le programme (contacter l'ambassadeur, verser le remerciement). Base légale : le règlement accepté (un contrat).
- E-mails de nouvelles : seulement avec la case facultative cochée ; lien de désinscription dans chaque e-mail.
- Pas de coordonnées de tiers saisies sur le site.
- Pour verser un remerciement, Anne aura besoin d'un RIB : il ne se demande qu'au moment du versement, jamais sur la page.

## Ce qui est vérifié

- Maquette publiée et ouverte (trois écrans, polices et couleurs de la charte, portrait d'Anne, logo eXp).
- Règles du fil « [Com] Campagne de parrainage » reprises (message du 2026-11-01 à 20 h 47).
- Documents seulement : aucun changement du site, pas de construction ni de captures à faire.

## Ce qui reste

- Accord de JB sur la maquette et sur les quatre choix ci-dessus (adresse, deux cases, recommandation hors formulaire, professionnels hors programme).
- Relecture du mot d'Anne par Anne.
- Accord d'eXp France (bloque l'ouverture, pas la construction sur l'aperçu).
