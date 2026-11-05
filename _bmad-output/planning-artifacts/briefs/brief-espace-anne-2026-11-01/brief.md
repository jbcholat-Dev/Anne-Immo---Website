---
title: "Brief produit : l'espace de travail d'Anne"
status: final
created: 2026-11-01
updated: 2026-11-01
---

# Brief produit : l'espace de travail d'Anne

_Version 3, validée par JB le 2026-11-01 (méthode BMAD). Les points marqués **[HYPOTHÈSE]** restent à confirmer dans le PRD._

## En bref

L'espace de travail d'Anne devient un outil simple, pensé pour l'ordinateur, avec une seule raison d'être : **l'aider à prospecter chaque semaine, une activité après l'autre**.

Le dimanche, Anne (avec JB) place dans sa semaine quelques activités de prospection : une matinée de boîtage, une heure de messages aux proches, des appels à d'anciens collègues. Pendant la semaine, elle n'a qu'une chose à regarder : l'activité suivante. Quand elle l'a faite, elle note combien (flyers posés, messages envoyés) et une barre se remplit. Les résultats (rendez-vous, mandats) se regardent à part, le dimanche, pas en permanence.

À côté, l'espace rassemble enfin **tous les contacts d'Anne en un seul endroit**, les trie par catégorie, et associe à chaque catégorie une façon de les contacter. C'est ce qui donne de la matière aux activités de la semaine.

## Le problème

- Anne a du mal à se concentrer et s'inquiète en ce moment de ne pas signer assez. Un objectif lointain (« quatre mandats ») la paralyse plus qu'il ne la fait avancer.
- Ses contacts chauds sont éparpillés : téléphone, LinkedIn, abonnés des réseaux, fichier Excel des animations en magasin. Personne ne sait combien ils sont ni qui a déjà été recontacté.
- L'espace actuel (en ligne depuis le 15/10) fait beaucoup de choses : pipeline, bilan, campagnes, prescripteurs, acheteurs… JB et Anne s'y sont sentis submergés. Il ne dit pas à Anne quoi faire demain.
- Depuis le 01/11, les publicités vers des inconnus sont arrêtées : la priorité va aux contacts qu'Anne connaît déjà, avec le parrainage. Il faut donc un moyen de travailler ce cercle avec méthode.

## Ce qu'on construit

**1. La semaine** (le cœur)
- Une page plein écran sur ordinateur qui montre la semaine.
- On y place des activités de prospection, et seulement de la prospection : un créneau, une catégorie (boîtage, SMS ou WhatsApp, e-mail, appels…), une cible (une zone, une catégorie de contacts), un nombre visé.
- Une fois l'activité faite, Anne saisit la quantité réalisée en une seconde. La barre de la catégorie se remplit.
- En ouvrant l'espace, Anne voit d'abord **aujourd'hui ou demain** : deux ou trois activités, rien d'autre.

**2. Le bilan, à part**
- En fin de semaine : par catégorie, ce qui a été fait (sessions, boîtes aux lettres, messages, appels).
- Sous les barres d'effort, une ligne de résultats : rendez-vous obtenus, recommandations, mandats en cours. Vue au mois et à l'année.
- On la regarde ensemble le dimanche, avant de planifier la semaine suivante. Elle n'est pas affichée en permanence.

**3. Les contacts rassemblés et triés**
- Import des sources : contacts du téléphone (filtrés), LinkedIn (surtout les anciens collègues de Danone à Évian, et de Paris qui viendraient s'installer), abonnés des réseaux si on peut les récupérer, fichier Excel des animations en magasin de bricolage (EDB). Entre 100 et 1 000 contacts au total, avec beaucoup de déchet attendu côté LinkedIn.
- **Cinq catégories**, pré-classées à l'import selon la source ; Anne ne corrige que les exceptions, quelques-unes à la fois, jamais 600 d'un coup le dimanche (issu de la table ronde du 01/11, `table-ronde-categories.md`) :

  - **Anciens clients** : appel ou message personnel ; avis et parrainage. E-mail groupé possible.
  - **Cercle proche** (amis de la région, anciens collègues) : message personnel, un par un (SMS, WhatsApp, appel). Pas d'e-mail groupé.
  - **Rencontrés à l'EDB** : e-mail « on s'était vus à l'animation », avec le diagnostic offert ; ils ont accepté en remplissant le bulletin du jeu.
  - **Prescripteurs** (notaires, banquiers, artisans…) : rencontre ou appel, échange de recommandations.
  - **À réchauffer** (abonnés des réseaux, le reste) : pas de campagne ; contenus réguliers, message privé quand quelqu'un réagit.

- Ces catégories servent à démarrer : on les changera sans hésiter si elles ne collent pas à l'usage (JB, 01/11).
- Le parrainage est un message possible pour plusieurs catégories (dès l'accord d'eXp), pas une catégorie.
- Les voisins des biens vendus ne sont pas une liste : c'est une activité de boîtage de la semaine.
- **[HYPOTHÈSE]** Le lien avec la semaine : une activité peut viser une catégorie (« jeudi 14 h : WhatsApp du parrainage au cercle proche »).

## Principes

- **Demain d'abord.** L'outil ramène Anne à la prochaine activité. Un mandat avant quatre ; les résultats viennent d'actions simples répétées jour après jour.
- **Moins mais mieux.** Peu d'écrans, peu de champs. Ce qui n'aide pas à prospecter cette semaine attend.
- **Saisie à la main, minimale.** Anne note ce qu'elle a fait ; pas de comptage automatique dans la première version.
- **Ordinateur d'abord.** Le téléphone viendra plus tard.
- **Rien n'est perdu, mais rien ne gêne.** Tout ce que l'espace sait déjà faire (pipeline, bilan, campagnes, prescripteurs, acheteurs, Leedflow…) reste en ligne, rangé dans un menu déroulant de la barre de navigation, hors du champ visuel. L'écran principal ne montre que la semaine et les contacts. Les fonctions rangées reviendront une par une.

## Pour qui

- **Anne**, au quotidien : elle regarde l'activité suivante, la fait, note le chiffre.
- **JB**, le dimanche, aux côtés d'Anne : il aide à placer les activités et lit le bilan. Il reprendra peu à peu une partie de la prospection.

## Comment on saura que ça marche

**[HYPOTHÈSE]** À confirmer avec JB :
- Chaque dimanche, une semaine est planifiée (au moins 3 activités de prospection).
- En fin de semaine, la plupart des activités planifiées sont notées comme faites.
- Tous les contacts sont rassemblés et chacun a une catégorie.
- Le premier rendez-vous vendeur obtenu grâce à une activité de l'espace.
- Anne dit qu'elle sait quoi faire demain.

## Hors du périmètre (pour l'instant)

- Le site public, la stratégie, la communication.
- Les publicités et le suivi des campagnes.
- Le pipeline détaillé, la qualification, le suivi des acheteurs et des prescripteurs, la recopie dans Modelo : en stock dans l'espace actuel, à réévaluer plus tard.
- Le comptage automatique et la version téléphone.

## Points d'attention

- **Accord des personnes.** Les personnes rencontrées aux animations ont accepté d'être contactées en remplissant le bulletin du jeu (JB, 01/11) : garder la trace de cet accord à l'import. Connaître quelqu'un autorise un message personnel, pas un envoi groupé (sauf anciens clients). Le démarchage téléphonique des particuliers sans accord est interdit depuis le 11/08/2026 ; une règle plus précise sur les anciens clients, citée d'après la presse, reste à vérifier sur le texte officiel.
- **Parrainage.** Il attend encore la réponse d'eXp France.
- **Récupérer les contacts.** Le téléphone et LinkedIn s'exportent en fichier. Les abonnés des réseaux sociaux sont plus difficiles à récupérer.

## Et ensuite

Si ça marche, l'espace devient le rituel hebdomadaire d'Anne et de JB : planifier le dimanche, prospecter la semaine, constater les résultats.

Plus tard, une fois la machine à leads relancée, l'espace sera aussi l'endroit où l'on traite et classe les leads qui arrivent : liaison avec Leedflow (les appels d'Anne résumés), avec sa boîte mail et les autres sources. Ces liaisons restent d'actualité ; elles reviendront depuis le menu des fonctions rangées, quand la prospection de base tournera.
