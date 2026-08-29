# Revue — `structure-site.md` (brief de maquette)

**Skill :** `bmad-review` · **Lentilles :** `adversarial`, `structure` (la lentille `verification-gap` n'est pas applicable : contenu documentaire, pas de code ni de tests).
**Cible :** `_bmad-output/planning-artifacts/structure-site.md` (3 309 mots, 31 sections).
**Contexte de revue lu (non revu) :** `SPEC.md` v3, `quiz-conception-notion.md`, `quiz-contenu.md`, `contexte-existant.md`.
**Date :** 2026-08-29.

> **Lecture du document.** Ce document existe pour permettre à un concepteur de maquette — qui ne connaît pas le projet — de dessiner les 10 pages du site d'Anne Vial-Tissot sans revenir poser de questions, puis de les travailler avec elle.

**Constat d'ensemble :** le document est bon là où il parle — la Direction est nette, les pages 1 à 7 sont argumentées, les anti-patterns sont nommés. Il échoue surtout par **omission** : ce qui n'est pas dit (navigation, mobile, états d'interaction, précision des actifs) est aussi structurant que ce qui l'est, et une partie de ces silences deviendra des décisions produit prises par défaut dans la maquette.

---

## Lentille `structure` — éditoriale, structurelle

**Modèle retenu :** **Reference/Database** pour le corps (inventaire de pages en accès aléatoire, schéma constant attendu par section), coiffé d'une ouverture **Strategic/Context (Pyramid)** (§Direction = la conclusion top-down). Le document ne colle proprement à aucun des deux, et **ce désaccord est lui-même une constatation** : l'ouverture pyramidale occupe ≈ 22 % du volume avant la première page, et le corps de référence abandonne son schéma à mi-parcours.

**Rappel de calibration :** lecteur = humain. Les tableaux, avertissements ⚠️ et rappels transverses sont conservés comme aides à la compréhension, pas coupés au nom de la brièveté.

| Pass | Original Text | Revised Text | Changes |
|---|---|---|---|
| structure | §Direction — paragraphe « Le corpus rédigé retrouvé dans Notion… on y prend les phrases et le contenu, pas la structure du tunnel » (≈ 165 mots) | **MERGE** → §3 La méthode + §4 Anne | Vraie redondance : §3 dit déjà « le contenu rédigé existe dans Notion — à reprendre en le resserrant » et §4 dit déjà « c'est ici que la section Qui suis-je ? est recyclée ». Le paragraphe de Direction ré-explique la même décision d'affectation 600 mots plus haut, avant que les sections concernées existent pour le lecteur (économie ≈ 120 mots) |
| structure | §Direction — tableau « Où le texte travaille vraiment » (8 lignes, ≈ 110 mots) | **CONDENSE** → 4 lignes de principe + une ligne « Volume de texte : … » dans chaque section concernée | Détail prématuré : le tableau référence §1.5, §1.1, §1.3, Fiche story, Résultats — des sections que le lecteur rencontrera 400 à 2 000 mots plus loin. La consigne de volume est actionnable **dans** la section, pas dans un index amont (économie ≈ 70 mots). ⚠️ Compromis : on perd la vue d'ensemble « où le texte a le droit d'exister » — la conserver en 4 lignes évite ça |
| structure | §1.1 à §1.7 — schéma constant **Rôle / Contenu / CTA / Actif requis / ⚠️** | **PRESERVE** | C'est la meilleure trouvaille structurelle du document : cinq champs, toujours les mêmes, immédiatement scannables. À ne pas alléger |
| structure | §2 Ventes, §3 La méthode, §4 Anne, §5 Diagnostic, §6 Parcours, §7 Résultats, §8 Contact, §9 Guide | **QUESTION** — appliquer le schéma de §1.x à toutes les pages | Le schéma est abandonné dès §2 : §3 (55 mots) est un paragraphe sans Rôle ni CTA explicite, §8 (35 mots) et §9 (28 mots) sont des paragraphes de trois lignes sans Actif requis ni états. Un document de référence dont le schéma s'arrête au tiers oblige le lecteur à relire pour trouver ce qui, ailleurs, était à sa place (coût ≈ +150 mots, gain de fiabilité) |
| structure | §Inventaire des pages — ligne 10 « **Légal** — Mentions, confidentialité, cookies » | **QUESTION** — ajouter une §10 | Neuf pages sur dix ont leur section ; la dixième n'existe qu'en ligne de tableau. La page Légal a pourtant un contenu contraint (mentions obligatoires du mandataire, RSAC, co-branding eXp, bandeau cookies) que personne d'autre ne spécifiera |
| structure | Chapeau — « Il ne dit pas à quoi ça ressemble — ça, c'est le design system » | **QUESTION** — reformuler la frontière | Le document se donne une frontière qu'il franchit ensuite systématiquement : « plein cadre, en boucle, sans son » (§1.1), « boutons pleine largeur » (§6), « une modale, ou mieux, un écran plein » (§7.1), « trois stories en grand format » (§1.3). Ce sont des prescriptions de forme, et elles sont utiles — c'est la promesse d'abstention qui est fausse. Écrire plutôt : « il dit la composition et la hiérarchie, pas le style » |
| structure | §Actifs à demander à Anne (147 mots) vs §1.3 « 3 biens vendus minimum, 1 photo maîtresse chacun » vs §Fiche story « 4 à 7 photos » + « galerie secondaire 3 à 6 photos » | **MERGE** → une table unique d'actifs, référencée depuis les sections | Trois chiffres différents pour le même actif dans le même document. Le lecteur qui fournit les fichiers (Anne) et celui qui dessine (le concepteur) tirent des conclusions divergentes. Une seule table, une seule valeur par item (économie ≈ 40 mots, suppression d'une contradiction) |
| structure | §Actifs à demander à Anne — la section entière | **PRESERVE** | Elle ressemble à une annexe mais elle a un **destinataire distinct** : Anne, qui ne lira pas les neuf sections de pages pour reconstituer sa liste de courses. Séparation d'audience légitime, à garder groupée |
| structure | §États à dessiner — la section entière | **PRESERVE** (contenu à compléter, cf. lentille adversarial) | Même logique : une table transverse d'états est plus utile au concepteur qu'une dispersion par page. Sa faiblesse est l'exhaustivité, pas l'emplacement |
| structure | §6 Diagnostic — le parcours (186 mots) — les deux corrections « Q13 multi-sélection » et « Q15 multiligne » enterrées après la liste des composants d'écran | **MOVE** — remonter les deux corrections en tête de section, sous un intertitre « À corriger par rapport au déployé » | Information critique enfouie : ce sont les deux seules divergences comportementales que le concepteur doit dessiner différemment de la référence en ligne, et elles arrivent après six puces de description générique |
| structure | §Direction, §1.4, §3, §4 — « la promesse en trois points : pas de mauvaise surprise, pas de dossier qui traîne, des ventes qui vont au bout » (3 occurrences) | **PRESERVE**, mais l'énoncer | Ce n'est **pas** une redondance documentaire : c'est un message de site délibérément répété sur trois pages. Sans le dire, un concepteur le lira comme un copier-coller à dédupliquer. Ajouter une ligne : « répétition volontaire — c'est le refrain de la marque » |
| structure | Absence — aucune section « Navigation » | **QUESTION** — ajouter une §0 avant §1 | Manque d'échafaudage : deux sections s'appuient sur une navigation (« le second CTA vit dans la navigation », §1.1 ; « le lien vers la homepage reste accessible dans la navigation », §5) qui n'est définie nulle part. Voir la lentille adversarial, finding `A-04` |

**Bilan structure**

- **12 recommandations** : 2 MERGE, 1 MOVE, 1 CONDENSE, 5 QUESTION, 4 PRESERVE (dont 1 avec ajout d'une ligne).
- **Réduction estimée si tout est accepté : ≈ 230 mots, soit ≈ 7 % des 3 309 mots** (MERGE Direction/Notion ≈ 120 · CONDENSE tableau « Où le texte travaille » ≈ 70 · MERGE actifs ≈ 40).
- **Effet net réel : légèrement positif en volume (≈ +150 à +250 mots).** Ce document ne souffre pas d'embonpoint : le §Direction est dense mais il travaille. Les cinq QUESTION ajoutent du contenu (navigation, page Légal, schéma étendu). **Aucune cible de longueur n'avait été fournie ; si l'objectif est la complétude du brief, l'accepter en connaissance de cause.**
- **Compromis de compréhension signalé :** condenser le tableau « Où le texte travaille vraiment » supprime une vue d'ensemble utile — la version courte (4 lignes de principe) est le minimum acceptable, pas la suppression.
- **Répartition actuelle du volume** (pour arbitrer) : ouverture Direction + Deux portes = 723 mots (≈ 22 %) · les 8 sections de l'accueil = 541 mots (≈ 16 %) · les pages 2 à 9 = 1 273 mots (≈ 38 %) · annexes États / Actifs / Non tranché = 374 mots (≈ 11 %).

---

## Lentille `adversarial`

20 findings. Chacun est rendu en JSON canonique dans le tableau de fin ; ci-dessous, le rendu lisible groupé par thème.

### Contenu du diagnostic — le concepteur ne peut pas dessiner les 17 écrans

- **`A-01` — La source pointée pour le contenu des écrans est la mauvaise.** §6 dit « le contenu exact de chaque écran est dans `quiz-conception-notion.md` ». Or ce companion est en désaccord avec la capture du déployé sur au moins quatre écrans : **Q1** (4 options en conception, **5** en ligne — l'option « + vidéo » manque), **Q10** (une question combinée à 5 options en conception, **deux écrans** 10a « visites » à 4 options et 10b « offres » à 3 options en ligne), **Q13** (8 options en conception, **7** en ligne, libellés différents), **Q14** (4 options en conception, **3** en ligne — pas d'« accompagnement intermédiaire »). Le brief demande par ailleurs de dessiner « Q10a » et « Q10b », dont les listes d'options **n'existent pas** dans le fichier qu'il désigne comme source.
- **`A-02` — Le modèle d'interaction de chaque écran n'est jamais spécifié, et il est incompatible avec ce que le brief demande.** Le déployé avance automatiquement au premier clic, sans bouton « Suivant ». Le brief exige que Q13 soit « réellement multi-sélection » — ce qui est impossible sans état sélectionné, bouton de validation et gestion du zéro-choix. Rien de tout ça n'est demandé.
- **`A-03` — Q4 est passée sous silence.** C'est la seconde question à sélection multiple (9 à 10 plateformes de diffusion, dont une option « Autre, préciser » à champ libre) et la plus longue liste d'options du quiz. Le brief ne la mentionne nulle part, alors que sa prescription « options en boutons pleine largeur » en fait l'écran le plus long du parcours, tout particulièrement sur mobile.
- **`A-19` — « Q14 orientée accompagnement » n'est pas défini.** §7.2 fait dépendre la Sortie A de ce critère. Q14 a trois options ; le brief ne dit pas si « forfait estimation + conseils » compte comme orientée accompagnement ou non. C'est une règle de routage commercial, pas un détail de dessin.

### Trous structurels — ce qui n'est décrit nulle part

- **`A-04` — Aucune spécification de navigation.** Deux sections s'y appuient explicitement ; aucune ne la définit. Manquent : les entrées du menu, la place du logo, le sélecteur de langue, le comportement au scroll, la présence ou non d'un CTA en en-tête, le motif mobile (burger ? barre d'action basse ?), et surtout **si la navigation est présente ou masquée pendant les 17 écrans du diagnostic** (le déployé la masque — un choix de taux de complétion, pas de style).
- **`A-05` — Le mobile n'est jamais évoqué.** Le SPEC impose « mobile-first » et un chargement utile sous 3 s. Le brief décrit des compositions de bureau : vidéo plein cadre, « trois stories en grand format », « trois blocs courts », grilles implicites. Rien ne dit ce que devient chaque section sur 375 px. Le trafic visé — publicité sociale vers §5 — est majoritairement mobile.
- **`A-06` — Aucune couche d'états d'interaction ni d'accessibilité.** Pas de survol, focus, actif, désactivé, chargement ; pas de contraste, pas de textes alternatifs, pas de navigation clavier du quiz, pas de `prefers-reduced-motion` pour la vidéo drone en boucle. Une maquette sans ces états laisse le concepteur les inventer un par un pendant le build.
- **`A-07` — La page Légal n'a aucun contenu spécifié**, et le bandeau de consentement n'existe pas. Le SPEC impose la conformité RGPD ; §5 impose la collecte de paramètres UTM, ce qui implique un traceur, donc un consentement. Manquent aussi les mentions obligatoires d'un mandataire (numéro RSAC, carte professionnelle du réseau, co-branding eXp).

### Cohérence interne — deux consignes qui se contredisent

- **`A-08` — « Pas de page de vente » contre §5, une landing de vente.** Le tableau des anti-patterns interdit « le diagnostic vendu comme un produit, avec sa propre page de vente » et prescrit « une invitation courte et un bouton ». §5 est exactement une page dédiée : titre, offre, trois livrables, gratuité, preuve, bouton répété. Le document tente de désamorcer (« sans reconstruire le tunnel de vente ») mais ne réconcilie jamais les deux passages. Un concepteur qui applique le tableau refuse de dessiner §5.
- **`A-09` — « Pas de statistiques invérifiables » contre les 9 blocs « Impact chiffré ».** Le tableau bannit « 9 vendeurs sur 10 » en ouverture ; §7.2 conserve les neuf encarts d'impact, qui sont exactement le même procédé (« dévalorisation de 15-25 % », « ratio 15:1 »), et que le SPEC signale comme non sourcés et à revalider avant publication. Le brief interdit le procédé à l'accueil et le maintient aux résultats sans le dire.
- **`A-10` — « Pas d'emojis en mise en page » contre les profils 🔴🟡🟢.** Le tableau bannit « emojis, drapeaux, coches vertes comme éléments de mise en page » ; §7.2 prescrit les trois profils codés par émoji, et §6 nomme les catégories par leurs libellés à émoji. Ce sont pourtant les éléments les plus visibles de la page de résultats.
- **`A-11` — L'ordre de l'accueil contredit la grille de lecture que le document pose lui-même.** « Trois secondes, trois questions » ouvre par « À qui j'ai affaire ? » ; la section qui y répond (§1.6 Anne) arrive **après** le CTA de conversion (§1.5). Aucune section n'est étiquetée avec la question qu'elle traite, alors que la règle dit que chacune doit en traiter une.
- **`A-12` — §1.2 avant §1.3 contredit « le visuel porte le site ».** Après une vidéo plein cadre, le visiteur reçoit un bloc de notes et d'extraits d'avis (texte), et le « cœur visuel du site » est repoussé en troisième position. Soit §1.2 devient une bande compacte (note + un extrait) adossée au visuel, soit les deux sections s'échangent.

### Contrat SPEC — capacités non couvertes par la structure

- **`A-13` — CAP-1 n'est pas atteignable avec la structure décrite.** Le SPEC exige au minimum 1 vidéo **et 6 photographies** de biens réellement traités sur la page d'accueil. Le brief y met 1 vidéo, 3 photos maîtresses de stories et 1 portrait, soit 4 images — dont une qui n'est pas un bien.
- **`A-14` — CAP-2 est orpheline pour moitié.** Le SPEC exige au moins 3 témoignages d'acheteurs non convertis publiés et attribués ; le brief les demande à Anne dans la liste d'actifs, mais **aucune page, aucune section du document ne les affiche**. §1.2 porte Immodvisor ; la fiche story porte l'acheteur de ce bien-là. Ces trois témoignages n'ont pas de domicile.
- **`A-15` — La page Guide (page 9) est une orpheline complète.** Elle a une ligne d'inventaire et une section, mais aucune page du site ne pointe vers elle : l'accueil n'a pas de CTA guide, §5 s'interdit un quatrième bloc, §7.2 ne le propose qu'après le diagnostic. Soit le document dit que sa seule entrée est externe (campagne + pied de page), soit il lui donne un point d'entrée.

### Page Diagnostic — le trafic froid

- **`A-16` — Le prix à payer est caché jusqu'à la fin.** La landing promet « 3 minutes » et « gratuit », mais ne dit pas que le résultat s'échange contre prénom, nom, e-mail **et téléphone**. Le visiteur froid découvre un formulaire à quatre champs dont un téléphone après 17 écrans — au moment exact où l'abandon coûte le plus cher (une réponse complète, non captée). Aucun lien de politique de confidentialité n'est prévu sur la landing.
- **`A-17` — « Trois blocs, pas un de plus » ne laisse aucune sortie basse.** La règle est posée en absolu, sans critère de révision et sans alternative : le visiteur froid qui n'est pas prêt à donner trois minutes n'a rien d'autre à faire que partir. Le guide (page 9) serait exactement cette sortie à faible engagement, et il est interdit d'entrée. À trancher explicitement plutôt que par omission.

### États et actifs

- **`A-18` — La table des états ignore toute la moitié « ça a marché » et toute la moitié « données partielles ».** Manquent, au minimum : les **confirmations** (message envoyé, créneau réservé, guide téléchargé, e-mail reçu par le visiteur) — chaque parcours de conversion du document s'arrête au clic ; les **erreurs de champ** (e-mail invalide, téléphone invalide, opt-in non coché, obligatoire vide) là où seul « échec de soumission » est prévu ; les **vides** (calendrier sans créneau disponible, ce qui n'est pas « créneau pris entre affichage et confirmation ») ; les **chargements** (quiz, calendrier, images) ; les **données partielles** (story sans témoignage acheteur, story sans galerie, grille à 1 ou 2 stories alors que le gabarit en attend 3) ; le **404** ; et le **lien de résultats expiré ou jeton invalide** — le SPEC interdit d'atteindre les résultats par URL directe, sans dire ce que voit celui qui essaie. Enfin, l'unique ligne marquée « décision à confirmer » (reprise de quiz abandonné) reste non tranchée alors qu'elle change le dessin.
- **`A-20` — La liste d'actifs n'est pas commandable en l'état.** Aucune spécification technique : « haute définition » n'est pas un nombre, aucun ratio (la maquette recadrera en 16:9, 4:5 et 1:1 sans que personne l'ait dit), aucun format de fichier, aucun poids maximal, aucune orientation pour les photos secondaires, aucun canal de dépôt, aucune échéance. Les comptes se contredisent (voir lentille structure). Et il manque des livrables entiers : le **guide PDF rebrandé** (CAP-8, pourtant sur le chemin critique selon le SPEC), l'**extraction ou capture des avis Immodvisor**, la **validation par Anne du texte Notion** que §4 recycle « à peu près telle quelle » sans qu'elle l'ait relu, un **modèle d'autorisation de publication** pour les acheteurs cités, et le **contenu des mentions légales**.

---

## Recoupements entre lentilles

Deux findings se recouvrent volontairement — le recoupement est un signal, pas un doublon :

- Absence de navigation : `structure` (manque d'échafaudage) et `adversarial` `A-04` (capacité CAP-6 non tenue).
- Comptes d'actifs contradictoires : `structure` (MERGE, vraie redondance) et `adversarial` `A-20` (l'actif n'est pas commandable).

---

## Findings — tableau JSON canonique (lentille `adversarial`)

```json
[
  {
    "lens": "adversarial",
    "location": "§6 Diagnostic — le parcours",
    "trigger_condition": "Le brief renvoie au seul quiz-conception-notion.md pour « le contenu exact de chaque écran », alors que ce companion diverge du déployé sur Q1 (4 vs 5 options), Q10 (question combinée vs écrans 10a/10b), Q13 (8 vs 7 options) et Q14 (4 vs 3 options) — et ne contient aucune liste d'options pour Q10a/Q10b, que le brief demande pourtant de dessiner.",
    "guard_snippet": "Désigner quiz-contenu.md (capture du live) comme source des libellés et listes d'options, quiz-conception-notion.md comme source du barème et des feedbacks ; ou mieux, intégrer au brief une table des 17 écrans (numéro, libellé, type, options). Corriger au passage « 17 écrans, un par question » : 17 écrans pour 15 questions.",
    "potential_consequence": "Le concepteur dessine des écrans avec le mauvais nombre d'options ; l'écart n'est découvert qu'au build, après validation de la maquette par Anne."
  },
  {
    "lens": "adversarial",
    "location": "§6 Diagnostic — le parcours",
    "trigger_condition": "Le modèle d'interaction des écrans n'est jamais spécifié (le déployé avance automatiquement au clic, sans bouton Suivant), alors que le brief exige que Q13 soit « réellement multi-sélection » — ce qui impose état sélectionné, bouton de validation et gestion du zéro-choix.",
    "guard_snippet": "Spécifier par type d'écran : choix unique = avance automatique au clic ; choix multiple (Q4, Q13) = état sélectionné + bouton « Suivant » + comportement si rien n'est coché ; question ouverte (Q15) = « Suivant » + « Passer ». Préciser aussi le format de la barre de progression (pourcentage ou « écran n / 17 »).",
    "potential_consequence": "La maquette ne montre pas l'état sélectionné ni le bouton de validation ; l'incohérence exacte qu'on reproche au déployé est reproduite."
  },
  {
    "lens": "adversarial",
    "location": "§6 Diagnostic — le parcours",
    "trigger_condition": "Q4 (diffusion de l'annonce), seconde question à sélection multiple et plus longue liste d'options du quiz (9 à 10 plateformes, dont une option « Autre, préciser » à champ libre), n'est mentionnée nulle part.",
    "guard_snippet": "Nommer Q4 comme multi-sélection au même titre que Q13, spécifier sa mise en page (les boutons pleine largeur en font l'écran le plus long du parcours, surtout sur mobile) et le traitement de l'option « Autre (préciser) ».",
    "potential_consequence": "L'écran le plus dense du parcours est dessiné par défaut avec un gabarit à choix unique, et le champ libre n'est pas prévu."
  },
  {
    "lens": "adversarial",
    "location": "Général — aucune section navigation",
    "trigger_condition": "Deux sections s'appuient sur une navigation (« le second CTA vit dans la navigation », §1.1 ; « le lien vers la homepage reste accessible dans la navigation », §5), et le SPEC exige via CAP-6 un contact atteignable depuis toute page — mais aucune section ne définit l'en-tête.",
    "guard_snippet": "Ajouter une §0 « Navigation » : entrées de menu, place du logo, sélecteur de langue, CTA en en-tête ou non, comportement au scroll, motif mobile, et surtout présence ou masquage de la navigation pendant les 17 écrans du diagnostic (le déployé la masque — c'est une décision de taux de complétion).",
    "potential_consequence": "Le concepteur invente la navigation ; elle diffère d'une maquette à l'autre et CAP-6 n'est vérifiable sur aucun écran."
  },
  {
    "lens": "adversarial",
    "location": "Général — aucune consigne mobile",
    "trigger_condition": "Le SPEC impose un site mobile-first se chargeant utilement en moins de 3 s, mais le brief ne décrit que des compositions de bureau (vidéo plein cadre, trois stories en grand format, trois blocs, grilles implicites) et ne dit jamais ce que devient une section sur petit écran.",
    "guard_snippet": "Ajouter à chaque section de l'accueil une ligne « sur mobile : … » (empilement, recadrage de la vidéo en portrait, carrousel ou pile pour les stories) et demander explicitement un artboard mobile par page dans la maquette.",
    "potential_consequence": "La maquette est validée en desktop puis se casse au portage mobile — sur le trafic publicitaire visé par §5, qui est majoritairement mobile."
  },
  {
    "lens": "adversarial",
    "location": "Général — états d'interaction et accessibilité",
    "trigger_condition": "Aucune mention de survol, focus, actif, désactivé, chargement ; aucune mention de contraste, de textes alternatifs, de navigation clavier du quiz, ni de prefers-reduced-motion pour la vidéo drone en boucle.",
    "guard_snippet": "Ajouter une section « États d'interaction et accessibilité » : les cinq états par composant interactif, la règle de contraste de la charte, l'alternative à la vidéo pour mouvement réduit, et le parcours clavier des 17 écrans.",
    "potential_consequence": "Toute la couche interactive est inventée au build, composant par composant, sans validation d'Anne ; les corrections d'accessibilité arrivent après coup et coûtent une refonte de composants."
  },
  {
    "lens": "adversarial",
    "location": "§Inventaire des pages (ligne 10, Légal)",
    "trigger_condition": "La page Légal n'a aucun contenu spécifié, et aucun bandeau de consentement n'est prévu alors que §5 impose la collecte de paramètres UTM et que le SPEC impose la conformité RGPD.",
    "guard_snippet": "Créer une §10 Légal : mentions obligatoires du mandataire (numéro RSAC, réseau et carte professionnelle eXp), politique de confidentialité, politique cookies, et spécifier le bandeau de consentement — apparence, moment d'apparition, refus possible en un clic, conséquence sur le suivi UTM.",
    "potential_consequence": "Le site est mis en ligne sans mentions réglementaires opposables, ou le bandeau est ajouté à la dernière minute par-dessus une maquette qui ne le prévoyait pas."
  },
  {
    "lens": "adversarial",
    "location": "§Direction (tableau des anti-patterns) vs §5 Diagnostic — landing autonome",
    "trigger_condition": "Le tableau interdit « le diagnostic vendu comme un produit, avec sa propre page de vente » et prescrit « une invitation courte et un bouton » ; §5 est une page dédiée avec titre, offre, trois livrables, gratuité, preuve et bouton répété. Les deux passages ne se réconcilient jamais.",
    "guard_snippet": "Limiter explicitement la ligne du tableau à l'accueil : « sur l'accueil, le diagnostic = un bouton ; en landing de campagne, c'est une page — voir §5, qui définit sa limite haute ». Et donner le critère qui distingue une landing acceptable d'un tunnel : nombre de blocs, absence d'agitation, aucune statistique non sourcée.",
    "potential_consequence": "Un concepteur qui applique le tableau sous-dimensionne §5, ou l'inverse : les deux lectures sont défendables, la maquette part sur la mauvaise."
  },
  {
    "lens": "adversarial",
    "location": "§Direction (tableau des anti-patterns) vs §7.2 Le résultat",
    "trigger_condition": "Le tableau bannit les « statistiques chocs invérifiables » ; §7.2 conserve les neuf encarts « Impact chiffré » (« dévalorisation de 15-25 % », « ratio 15:1 »), que le SPEC signale comme non sourcés et à revalider avant mise en ligne.",
    "guard_snippet": "Soit borner la règle (« hors page de résultats, où les impacts chiffrés sont assumés »), soit appliquer la même exigence aux neuf blocs et les marquer « à revalider avant publication » dans le brief, comme le fait le SPEC.",
    "potential_consequence": "Le site interdit à l'accueil ce qu'il pratique à l'endroit le plus engageant du parcours ; des chiffres non sourcés sont publiés sous la signature d'Anne."
  },
  {
    "lens": "adversarial",
    "location": "§Direction (tableau des anti-patterns) vs §7.2 et §6",
    "trigger_condition": "Le tableau bannit « emojis, drapeaux, coches vertes comme éléments de mise en page », mais §7.2 prescrit les trois profils 🔴 / 🟡 / 🟢 et §6 nomme les catégories par leurs libellés à émoji (📋 🎯 💼) — les éléments les plus visibles de la page de résultats.",
    "guard_snippet": "Remplacer le codage émoji par un codage de la charte (pastille de couleur, pictogramme dessiné, libellé typographique) et l'écrire dans §7.2 ; conserver les émojis uniquement dans les documents de travail, jamais dans l'interface.",
    "potential_consequence": "La page de résultats sort avec l'esthétique par défaut du ScoreApp que la charte devait précisément remplacer."
  },
  {
    "lens": "adversarial",
    "location": "§Direction (« Trois secondes, trois questions ») vs §1 ordre des sections",
    "trigger_condition": "La règle dit que chaque section de l'accueil répond à l'une de trois questions, dont la première est « À qui j'ai affaire ? » — mais la section qui y répond (§1.6 Anne) arrive après le CTA de conversion (§1.5), et aucune section n'est étiquetée avec la question qu'elle traite.",
    "guard_snippet": "Annoter chaque section de son étiquette (§1.1 À qui — §1.2 Qu'a-t-elle fait — …) et reconsidérer la position de §1.6 : un visiteur qui n'a pas encore vu le visage d'Anne clique moins sur le diagnostic.",
    "potential_consequence": "La règle de lecture reste décorative ; l'ordre de l'accueil n'est plus défendable devant Anne quand elle demandera pourquoi elle apparaît en sixième position."
  },
  {
    "lens": "adversarial",
    "location": "§1.2 La preuve, tout de suite / §1.3 Ventes récentes",
    "trigger_condition": "Le document pose que « le visuel porte le site » et que §1.1 doit « montrer, immédiatement », puis place juste après la vidéo un bloc de notes et d'extraits d'avis (du texte), repoussant en troisième position le « cœur visuel du site ».",
    "guard_snippet": "Soit échanger §1.2 et §1.3, soit réduire §1.2 à une bande compacte (note globale + un extrait + lien vérifiable) adossée au visuel plutôt qu'à une section pleine — la preuve reste haute sans casser la continuité visuelle.",
    "potential_consequence": "Les trois premières secondes s'achèvent sur un bloc de texte, exactement ce que la Direction voulait éviter ; le scroll s'arrête avant les stories."
  },
  {
    "lens": "adversarial",
    "location": "§1 Accueil (ensemble) vs SPEC CAP-1",
    "trigger_condition": "CAP-1 exige au minimum 1 séquence vidéo ET 6 photographies de biens réellement traités sur la page d'accueil ; la structure décrite n'y met que 3 photos de stories et 1 portrait, soit 4 images dont une qui n'est pas un bien.",
    "guard_snippet": "Porter §1.3 à 6 visuels de biens (2 par story, ou une bande de photos supplémentaire), ou faire amender CAP-1 dans le SPEC. Ne pas laisser l'écart implicite.",
    "potential_consequence": "Le critère de succès du SPEC est faux dès la maquette, et personne ne le remarque avant la recette."
  },
  {
    "lens": "adversarial",
    "location": "§Actifs à demander à Anne vs toutes les pages",
    "trigger_condition": "CAP-2 exige au minimum 3 témoignages d'acheteurs non convertis publiés et attribués ; le brief les demande à Anne, mais aucune page ni section du document ne les affiche (§1.2 porte Immodvisor, la fiche story porte l'acheteur de ce bien précis).",
    "guard_snippet": "Donner un domicile aux trois témoignages : une bande dédiée sur l'accueil, un bloc sur la page Anne, ou une intégration à §1.2 — et le dire dans la section qui les accueille, pas seulement dans la liste d'actifs.",
    "potential_consequence": "Anne collecte trois témoignages, avec les autorisations nominatives que cela suppose, pour un contenu qui n'apparaît nulle part."
  },
  {
    "lens": "adversarial",
    "location": "§9 Guide",
    "trigger_condition": "La page Guide n'a aucun point d'entrée dans le site : aucune section de l'accueil ne pointe vers elle, §5 s'interdit un quatrième bloc, et §7.2 ne propose le guide qu'après le diagnostic.",
    "guard_snippet": "Écrire explicitement que sa seule entrée est externe (campagne, pied de page, signature e-mail) — ou lui donner un point d'entrée : lien de pied de page nommé, ou lien secondaire sous le bouton de §5 pour la sortie basse du trafic froid.",
    "potential_consequence": "Une page est maquettée et développée sans qu'aucun visiteur ne puisse l'atteindre, et le lead magnet ne produit aucun lead hors campagne."
  },
  {
    "lens": "adversarial",
    "location": "§5 Diagnostic — landing autonome (au-dessus de la ligne de flottaison)",
    "trigger_condition": "La landing promet « 3 minutes » et la gratuité sans jamais dire que le résultat s'échange contre prénom, nom, e-mail et téléphone ; le visiteur froid découvre un formulaire à quatre champs, dont un numéro de téléphone, après 17 écrans de réponses. Aucun lien de politique de confidentialité n'est prévu sur la page.",
    "guard_snippet": "Ajouter au-dessus du bouton une ligne annonçant la contrepartie (« résultat complet envoyé par e-mail, coordonnées demandées à la fin ») et un lien discret vers la politique de confidentialité — sans compter comme un quatrième bloc.",
    "potential_consequence": "Abandon au gate, c'est-à-dire au moment le plus coûteux : le quiz est rempli, le lead est perdu, et le taux de complétion de 40 % visé par le SPEC est manqué."
  },
  {
    "lens": "adversarial",
    "location": "§5 Diagnostic — landing autonome (en dessous)",
    "trigger_condition": "« Trois blocs courts, pas un de plus » est posé en absolu, sans critère de révision, et le seul verdict prévu en cas d'échec est « c'est le ciblage de la campagne qu'il faut corriger ». Résultat : le visiteur froid non prêt à donner trois minutes n'a aucune action à faible engagement disponible.",
    "guard_snippet": "Trancher explicitement : soit autoriser un unique lien secondaire à faible engagement (le guide, §9) sous le bouton, soit écrire que l'absence de sortie basse est délibérée et pourquoi. Et donner le signal qui déclencherait la révision de la règle (taux de démarrage sous un seuil).",
    "potential_consequence": "Le budget publicitaire paie des visiteurs qui repartent sans laisser la moindre trace, alors qu'un lead magnet existe déjà et est prêt."
  },
  {
    "lens": "adversarial",
    "location": "§États à dessiner",
    "trigger_condition": "La table ne couvre ni les confirmations, ni les erreurs de champ, ni les vides, ni les chargements, ni les données partielles : chaque parcours de conversion du document s'arrête au clic.",
    "guard_snippet": "Ajouter au minimum : confirmations (message envoyé, créneau réservé, guide téléchargé, e-mail reçu par le visiteur) ; erreurs de champ (e-mail invalide, téléphone invalide, opt-in non coché, champ requis vide) ; vides (calendrier sans créneau disponible — distinct de « créneau pris entre affichage et confirmation ») ; chargements (quiz, calendrier, images) ; données partielles (story sans témoignage acheteur, sans galerie, grille à 1 ou 2 stories) ; 404 ; lien de résultats expiré ou jeton invalide, que le SPEC rend inévitable en interdisant l'accès direct par URL. Trancher aussi la ligne « reprise de quiz — décision à confirmer », qui change le dessin.",
    "potential_consequence": "La maquette ne montre que le cas nominal — le reproche que la section s'adresse à elle-même — et la moitié des écrans réels sont improvisés au build."
  },
  {
    "lens": "adversarial",
    "location": "§7.2 Le résultat (Sortie A)",
    "trigger_condition": "La Sortie A se déclenche sur « score 71-100 et Q14 orientée accompagnement », mais le brief ne dit pas laquelle des trois options de Q14 compte comme orientée accompagnement — « premium complet » seul, ou aussi « forfait estimation + conseils » ?",
    "guard_snippet": "Nommer les options exactes qui déclenchent la Sortie A, et dire ce qui est présenté dans chaque cas (Q14 choisit l'offre affichée d'après le SPEC). C'est une règle commerciale, à trancher côté produit avant la maquette, pas pendant.",
    "potential_consequence": "Le routage post-diagnostic est décidé par défaut dans le code ; les prospects du niveau intermédiaire reçoivent l'offre inadaptée, sur le point le plus monétisable du parcours."
  },
  {
    "lens": "adversarial",
    "location": "§Actifs à demander à Anne",
    "trigger_condition": "La liste n'est pas commandable : aucune résolution minimale chiffrée (« haute définition » n'est pas un nombre), aucun ratio d'image, aucun format de fichier, aucun poids maximal, aucune orientation pour les photos secondaires, aucun canal de dépôt, aucune échéance — et les comptes de photos par story se contredisent entre §1.3, la fiche story et cette liste. Plusieurs livrables manquent entièrement.",
    "guard_snippet": "Une ligne technique par item (ex. « JPEG, ≥ 3 000 px sur le côté long, paysage 3:2, < 5 Mo »), un compte unique par story, un lieu de dépôt et une date. Ajouter les livrables absents : guide PDF rebrandé (CAP-8, sur le chemin critique selon le SPEC), extraction ou capture des avis Immodvisor, validation par Anne du texte Notion que §4 recycle sans qu'elle l'ait relu, modèle d'autorisation de publication pour les acheteurs cités, contenu des mentions légales.",
    "potential_consequence": "Anne livre des fichiers inutilisables (photos verticales compressées, vidéo trop courte) et l'aller-retour se répète ; la production de contenu, que le SPEC place sur le chemin critique, glisse de plusieurs semaines."
  }
]
```
