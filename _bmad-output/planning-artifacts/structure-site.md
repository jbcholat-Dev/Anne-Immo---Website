# Structure du site — brief de maquette

**Version 2** (2026-08-29) — corrigée après `bmad-review` (20 findings adversarial + 12 structure, rapport : [review-structure-site.md](review-structure-site.md)).

**Statut : input de l'étape ③ (maquette).** Ce document dit **quelles pages, quelles sections, dans quel ordre, avec quel contenu, quels états et quel appel à l'action**. Il prescrit la *composition et la hiérarchie*, pas le style — palette, typographie et composants viennent du design system (`Website/design-system/`, projet claude.ai/design « Anne VIAL-TISSOT — Design System »).

**Amont :** [SPEC.md](../specs/spec-anne-website/SPEC.md) v3 · [quiz-conception-notion.md](../specs/spec-anne-website/quiz-conception-notion.md) · [quiz-contenu.md](../specs/spec-anne-website/quiz-contenu.md)

**Livrables attendus de la maquette :** un artboard **desktop** et un artboard **mobile** par page. Le mobile n'est pas une réduction du desktop.

---

## Direction

**Le visuel porte le site. Le texte le complète.** La matière première, ce sont les photos et les vidéos des ventes réelles d'Anne. Un visiteur doit comprendre en trois secondes, sans lire, qu'il a affaire à quelqu'un de sérieux qui a vendu de vrais biens. La crédibilité passe par ce qu'on montre, pas par ce qu'on affirme.

**Ce n'est pas un site sans texte.** Le site doit déclencher des demandes : à certains endroits il faut convaincre, et convaincre demande des mots. La règle tient en quatre principes :

1. Un bloc de texte gagne sa place en produisant une action, jamais en remplissant une page.
2. Sur l'accueil, le texte s'efface : l'image parle, une phrase suffit.
3. Sur les pages de fond (Anne, Méthode, fiches de ventes), le texte est le contenu : il se développe.
4. Dans le parcours de conversion (diagnostic, résultats), le texte est fonctionnel et tendu.

Chaque section ci-dessous porte une ligne **Volume** qui applique ces principes à son cas.

### Ce qu'on ne fait pas — et ce qui n'est pas visé par cette règle

Il existe une landing ScoreApp actuelle qui sert de repoussoir. Les anti-patterns portent sur **la page d'accueil et la landing Diagnostic**, c'est-à-dire les surfaces d'acquisition. Ils ne s'appliquent pas aux pages de fond ni à la page de résultats, qui obéissent à d'autres règles — la précision compte, sans elle les consignes se contredisent.

| Anti-pattern | Ce qu'on fait à la place | Où la règle s'applique |
|---|---|---|
| Tunnel de copywriting empilant accroche, agitation du problème, preuve, urgence | Des blocs courts, aérés, une idée par bloc | Accueil, landing Diagnostic |
| Statistiques chocs invérifiables **en ouverture d'acquisition** | Les propres résultats d'Anne, montrés | Accueil, landing Diagnostic |
| Longue section « Qui suis-je » narrative en pleine page d'accueil | Trois lignes et un lien vers la page Anne | Accueil uniquement |
| Emojis, drapeaux et coches vertes **comme éléments de mise en page** | La typographie et la palette de la charte | Partout |

**Trois exceptions explicites**, pour lever les contradictions relevées en revue :

- **Les 9 encarts « Impact chiffré » de la page de résultats sont conservés.** Ce sont des chiffres, mais ils ne sont pas une accroche : ils personnalisent un diagnostic que le visiteur vient de demander. La règle bannit la statistique d'accroche, pas le résultat chiffré. ⚠️ Ces chiffres ne sont pas sourcés (voir SPEC, Assumptions) — à revalider avant mise en ligne, indépendamment du dessin.
- **Les trois profils de score restent codés par couleur** (rouge / ambre / vert), mais **par la palette de la charte, pas par des émojis**. Le 🔴🟡🟢 du document source est une notation de travail, pas une prescription visuelle.
- **La page Diagnostic est une page dédiée, et c'est assumé.** L'anti-pattern vise le *tunnel de vente* — l'empilement persuasif — pas l'existence d'une page. Voir §5 pour ce qui la distingue de la landing ScoreApp.

### Trois secondes, trois questions

Chaque section de l'accueil répond à l'une de ces questions, et elle est étiquetée avec la sienne dans les sections ci-dessous : **[QUI]** à qui j'ai affaire · **[PREUVE]** qu'est-ce qu'elle a déjà fait · **[ACTION]** qu'est-ce que je fais maintenant.

### Le refrain de la marque

« Pas de mauvaise surprise · pas de dossier qui traîne · des ventes qui vont au bout » apparaît sur trois pages (accueil, Méthode, Anne). **Répétition volontaire** — c'est le refrain de la marque, à ne pas dédupliquer.

### Deux portes d'entrée, deux publics

Le site a **deux points d'atterrissage de premier niveau**, et ils ne s'adressent pas au même visiteur.

| | **Accueil** | **Diagnostic** |
|---|---|---|
| D'où il vient | Bouche-à-oreille, recommandation, recherche du nom d'Anne | Publicité sociale, campagne email, lien partagé |
| Ce qu'il cherche | Vérifier qu'Anne est sérieuse | Une raison de s'arrêter — il ne connaît pas Anne |
| Ce qu'on lui donne | La preuve sociale, d'abord | Le diagnostic, immédiatement, plus le minimum de crédibilité |
| Sa question | « Est-ce que je peux lui confier ma vente ? » | « Pourquoi je donnerais 3 minutes ? » |

Conséquence : **la page Diagnostic est une landing autonome**, pas une sous-page. Elle doit fonctionner pour quelqu'un qui n'a jamais vu l'accueil. Son URL est propre, partageable, et supporte les paramètres de campagne.

---

## Inventaire des pages

| # | Page | Rôle | Capacités |
|---|---|---|---|
| 0 | **Navigation** (transverse) | En-tête, pied de page, langue | CAP-6, CAP-10 |
| 1 | **Accueil** | Installer la crédibilité, orienter vers les deux parcours | CAP-1, 2, 3, 5, 6 |
| 2 | **Ventes** (index + fiche) | La preuve détaillée, une story par bien vendu | CAP-3 |
| 3 | **La méthode** | Le Système 360™ développé | — |
| 4 | **Anne** | Le parcours, les langues, la posture | CAP-2 |
| 5 | **Diagnostic** (landing) | 2ᵉ porte d'entrée — destination des campagnes | CAP-5 |
| 6 | **Diagnostic** (parcours) | Les 17 écrans de questions | CAP-4 |
| 7 | **Résultats** | Score, feedbacks, orientation | CAP-4, 7, 8, 9 |
| 8 | **Contact / Rendez-vous** | Le chemin direct | CAP-6, CAP-9 |
| 9 | **Guide** | Téléchargement, sortie à faible engagement | CAP-8 |
| 10 | **Légal** | Mentions, confidentialité, cookies | Constraint RGPD |

Toutes traduites (CAP-10).

---

## §0 — Navigation

**Rôle :** rendre le contact atteignable depuis toute page (CAP-6) et porter le changement de langue (CAP-10).

**En-tête, desktop**
- Logo à gauche (déclinaison horizontale de la charte).
- Entrées : Ventes · La méthode · Anne · Contact.
- Sélecteur de langue à droite, discret (code de langue, **pas de drapeau** — un drapeau désigne un pays, pas une langue).
- Un CTA en en-tête : « Diagnostic », visuellement distinct des entrées de menu.
- Au scroll : l'en-tête se réduit et reste accessible. Il ne disparaît jamais complètement — CAP-6 exige le contact atteignable partout.

**En-tête, mobile**
- Logo + bouton menu. Le CTA « Diagnostic » reste **visible hors du menu**, c'est le parcours principal.
- Menu déplié : les 4 entrées, le sélecteur de langue, le contact.

**Pendant les 17 écrans du diagnostic : navigation masquée.** Seuls subsistent le logo (non cliquable ou avec confirmation d'abandon), la barre de progression et le retour arrière. C'est une décision de taux de complétion, pas de style — le déployé fait ce choix et il a raison.

**Pied de page** — plan du site, mentions légales, politique de confidentialité, gestion des cookies, sélecteur de langue, co-branding eXp France selon les règles de la charte, lien vers le guide, réseaux sociaux.

---

## §1 — Accueil

Huit sections. L'ordre est délibéré : **la preuve arrive avant l'argumentaire**.

### 1.1 — Ouverture · [QUI] + [PREUVE]
**Rôle :** montrer, immédiatement.
**Contenu :** un visuel plein cadre — **photo fixe ou vidéo drone, à arbitrer par test** (voir ci-dessous). Le nom « Anne VIAL-TISSOT » et une ligne de positionnement. Le lac et la montagne doivent être lisibles : c'est le territoire, et il doit être **reconnaissable comme le Chablais et le Léman**, pas comme une montagne générique.
**CTA :** un seul, vers le diagnostic.
**Volume :** une phrase. Pas de paragraphe.
**Sur mobile :** visuel recadré en portrait ou carré, jamais une bande fine. Le nom et le CTA restent au-dessus de la ligne de flottaison.
**Actif requis :** A-01 (vidéo) et/ou A-14 (photo d'ouverture).

#### 🔀 Arbitrage ouvert — photo fixe contre vidéo drone

Le premier prototype ouvre sur une **photo fixe** de montagne, et le rendu convainc. L'hypothèse initiale (vidéo drone en fond) est donc remise en question. Les deux sont à maquetter et à départager sur des critères, pas à l'impression :

| | Photo fixe | Vidéo drone |
|---|---|---|
| Chargement (SPEC : < 3 s utile en mobile) | Immédiat | Coût réel, différable mais jamais nul |
| Force d'évocation | Dépend entièrement de la photo | Le mouvement crée l'échelle et le territoire |
| Risque | Une belle photo générique ne prouve rien — elle peut se lire comme une image de banque | Détourne l'attention du nom et du CTA si elle est trop chargée |
| Mouvement réduit | Sans objet | Repli statique obligatoire |
| Disponibilité | Immédiate | Dépend du dossier d'Anne |

**Critère de départage :** l'ouverture doit faire comprendre en trois secondes qu'il s'agit de **biens réels sur un territoire précis**. Celui des deux qui y arrive gagne. Une photo de montagne qui pourrait être n'importe où en Savoie perd contre une vidéo, même modeste, où l'on reconnaît le Léman.

⚠️ **Conséquence à ne pas rater :** CAP-1 exige au minimum **1 séquence vidéo** sur l'accueil. Si l'ouverture devient une photo fixe, **la vidéo doit trouver un autre emplacement** — le plus naturel étant §1.3, en tête du carrousel de ventes.

⚠️ Quel que soit l'arbitrage, le visuel ne bloque jamais l'affichage : image d'abord, vidéo ensuite, et alternative statique pour les visiteurs qui ont demandé la réduction des animations.

### 1.2 — La preuve, tout de suite · [PREUVE]
**Rôle :** répondre à « pourquoi je vous ferais confiance » avant toute argumentation.
**Contenu :** **une bande compacte**, pas un bloc de texte — la note Immodvisor, le nombre d'avis, **un** extrait court attribué, et un lien vers la fiche source vérifiable.
**Pourquoi compacte :** après une vidéo plein cadre, un pavé de texte casse la promesse « le visuel porte le site ». La bande s'adosse visuellement à l'ouverture plutôt que de lui succéder comme une section pleine.
**Volume :** la note, un extrait, un lien.
**Sur mobile :** la note et le nombre d'avis restent ; l'extrait peut passer en défilement horizontal.

### 1.3 — Ventes récentes · [PREUVE]
**Rôle :** le cœur visuel du site, et le remplacement de la vitrine de biens.
**Contenu :** **six photographies de biens vendus, en carrousel.** Six photos empilées mangent une hauteur d'écran impraticable — constat du premier prototype. Le carrousel les fait tenir sans sacrifier la taille de chacune, qui reste le point important : ces photos sont le cœur visuel du site, pas des vignettes.

Chaque vue porte la photo en grand, la commune, et une phrase extraite du récit d'Anne. Pas de prix, pas de surface, pas de caractéristiques : ce n'est pas une annonce.

**Pourquoi six :** CAP-1 exige au minimum 1 vidéo et 6 photographies de biens réellement traités sur l'accueil. Si l'ouverture (§1.1) passe en photo fixe, **la séquence vidéo prend la première position du carrousel**.

**Règles du carrousel** — un carrousel mal fait cache le contenu au lieu de l'économiser :
- **Défilement manuel par défaut.** Si rotation automatique il y a, elle s'arrête au survol et au focus, et un contrôle de pause est visible.
- Indicateurs de position visibles : le visiteur doit voir qu'il y a six vues, sinon il n'en verra qu'une.
- La première vue est complète et autonome — elle doit tenir seule si personne ne fait défiler.
- Navigable au clavier, et arrêtée pour les visiteurs qui ont demandé la réduction des animations.
- **Sur mobile : balayage tactile**, une vue à la fois, photo toujours grande.

**CTA :** « Voir cette vente » par vue, plus un lien vers l'index complet.
**Volume :** une phrase par vue.
**Actif requis :** A-02, A-03, éventuellement A-01.

### 1.4 — Le Système 360™, en un coup d'œil · [QUI]
**Rôle :** nommer la méthode sans la dérouler.
**Contenu :** les trois axes (Vendeur 360° / Marché 360° / Partenaires 360°) en trois blocs courts appuyés visuellement, une phrase chacun. Puis le refrain de la marque.
**CTA :** « La méthode en détail ».
**Volume :** trois phrases plus le refrain. Le développement vit sur la page dédiée.

### 1.5 — Ils l'ont rencontrée · [PREUVE]
**Rôle :** porter les trois témoignages d'acheteurs non convertis exigés par CAP-2 — des personnes qu'Anne a accompagnées sans que ça débouche sur une vente.
**Pourquoi une section à part :** ce sont les témoignages les plus crédibles du site, puisque leurs auteurs n'ont aucune raison de la complimenter. Sans section dédiée, ils n'existent nulle part (le contrat les exige, la v1 de ce brief les oubliait).
**Contenu :** trois citations attribuées (prénom, contexte), portrait facultatif.
**Volume :** trois citations courtes.
**Sur mobile :** empilées ou en défilement horizontal.
**Actif requis :** A-06, A-07.

### 1.6 — Le diagnostic · [ACTION]
**Rôle :** l'entrée du premier parcours de conversion. **Un bouton, pas une page de vente.**
**Contenu :** une phrase sur ce que le diagnostic donne, la durée (3 minutes), le bouton.
**Volume :** trois lignes maximum, tout compris.

### 1.7 — Anne · [QUI]
**Rôle :** la personne derrière la méthode.
**Contenu :** un portrait. Trois lignes : le parcours (finance d'entreprise, Danone Évian, Bel au Brésil), ce qui l'a amenée à l'immobilier, sa façon de travailler. Les quatre langues de travail, sobrement — c'est un argument fort sur le bassin lémanique et la justification visible du multilingue du site.
**CTA :** « En savoir plus ».
**Volume :** trois lignes.
**Actif requis :** A-04.

### 1.8 — Parler à Anne · [ACTION]
**Rôle :** le second parcours de conversion, pour qui n'a pas besoin du diagnostic.
**Contenu :** une invitation courte, le choix entre réserver un créneau et laisser un message.
**CTA :** « Réserver un créneau » (primaire) · « Écrire à Anne » (secondaire).
**Volume :** deux lignes.

---

## §2 — Ventes

**Rôle :** la preuve détaillée. C'est le contenu qui prouve la méthode sans la réciter.
**Volume :** développé — c'est une page de fond.

### Index
Grille de toutes les stories : photo, commune, une phrase. Pas de filtre tant qu'il y a moins d'une dizaine de biens.
**Sur mobile :** une colonne.

### Fiche story
1. **Photo maîtresse** plein cadre.
2. **Le contexte** — commune, type de bien, et si Anne l'accepte, le délai de vente. Factuel, court.
3. **Le récit d'Anne** — à la première personne. Ce qui bloquait, ce qui a été fait, comment ça s'est terminé.
4. **Le témoignage de l'acheteur** — cité, attribué.
5. **Galerie secondaire.**
6. **CTA** — diagnostic ou contact.

**Actif requis :** A-02, A-03, A-05, A-08.

---

## §3 — La méthode

**Rôle :** développer le Système 360™ pour qui veut comprendre avant de s'engager.
**Contenu :** les trois axes détaillés, ce que chacun couvre concrètement, le réseau de partenaires (courtier bancaire, courtier travaux, géomètre, notaire) et le rôle de chef d'orchestre. Puis le refrain de la marque.
**Source du texte :** le corpus rédigé existe dans Notion (`ea0787ebf88c46e9bf4dc2b71725b55d`). À **resserrer**, pas à coller.
**CTA :** diagnostic ou contact.
**Volume :** développé.
**Sur mobile :** les trois axes en pile.

---

## §4 — Anne

**Rôle :** installer la confiance par le parcours.
**Contenu — la section « Qui suis-je ? » de Notion est recyclée ici**, à peu près telle quelle : elle est bien écrite, à la première personne, et installe exactement la crédibilité recherchée.

1. **Portrait** en ouverture.
2. **Le parcours** — dix ans d'opérations internationales, Danone (Évian) et Bel au Brésil, la finance d'entreprise.
3. **Le choc de l'immobilier** — les ventes qui s'effondrent après le compromis : financement refusé au dernier moment, formalités découvertes trop tard, acquéreurs mal accompagnés, coordination inexistante. C'est le passage le plus fort du corpus : il explique *pourquoi* la méthode existe.
4. **La naissance du Système 360™** — un réseau d'experts, chaque vente traitée comme un projet d'entreprise.
5. **Le refrain de la marque.**
6. **Les quatre langues** et l'ancrage Chablais / Léman.
7. **CTA** — diagnostic ou rendez-vous.

**Volume :** développé — c'est sa page.
**Actif requis :** A-04, A-09.
⚠️ Ce texte n'a pas été relu par Anne depuis sa rédaction en 2025. Sa validation est un livrable (A-09).

---

## §5 — Diagnostic (landing autonome)

**Rôle :** porte d'entrée du site, destination des campagnes sociales et email. Le visiteur ne connaît pas Anne et n'a aucune raison a priori de lui accorder trois minutes.

**Ce qui la distingue de la landing ScoreApp :** elle donne l'information nécessaire à une décision, puis s'arrête. Pas d'agitation du problème, pas de comparatif avec les agences, pas de statistique d'accroche. Trois blocs de preuve, et une sortie pour qui n'est pas prêt.

### Au-dessus de la ligne de flottaison — l'offre
Le titre, une phrase sur ce qu'on obtient, les trois livrables en une ligne chacun (score de maturité sur 100, diagnostic personnalisé, recommandations concrètes), la durée, la gratuité, **le bouton**. Une image sobre.

**Annoncer le prix à payer, ici.** Une ligne dit que le résultat complet s'obtient contre ses coordonnées, téléphone compris, avec un lien vers la politique de confidentialité. Le visiteur qui découvre un formulaire à quatre champs après 17 écrans abandonne au moment où ça coûte le plus cher — une réponse complète, non captée. Le dire d'emblée coûte quelques départs et sauve des abandons tardifs.

**Volume :** titre + trois livrables + une ligne de transparence.

### En dessous — la crédibilité, compressée
Trois blocs courts, pas un de plus :

1. **Qui pose ces questions** — portrait d'Anne, deux lignes, les quatre langues.
2. **La preuve** — note Immodvisor et un extrait, plus une story en vignette.
3. **Le bouton, à nouveau.**

### La sortie basse
Sous les trois blocs, **un lien discret vers le guide** (§9) : « Pas envie de répondre à 17 questions ? Le guide des 10 erreurs, sans le diagnostic. » Un visiteur froid qui n'est pas prêt à donner trois minutes doit avoir autre chose à faire que partir. C'est un lien, pas un quatrième bloc — la règle des trois blocs tient.

**Sur mobile :** l'offre et le bouton tiennent au-dessus de la ligne de flottaison sur 375 px. Les trois blocs s'empilent.

### Contraintes techniques
- URL propre, stable, partageable — elle vivra dans des emails et des publications.
- Paramètres de campagne (UTM) acceptés et transmis jusqu'au lead capté. ⚠️ Implique un traceur, donc un consentement — voir §10.
- Aperçu de partage correct (titre, description, image).
- Traduite comme le reste.
- Le lien vers l'accueil reste accessible dans la navigation.

---

## §6 — Diagnostic, le parcours

### ⚠️ Deux corrections par rapport au déployé — à lire en premier
1. **La question sur les obstacles (Q13) doit être réellement multi-sélection.** Le déployé l'annonce « sélection multiple possible » mais avance automatiquement au premier clic. Incohérence à ne pas reproduire.
2. **La question ouverte finale (Q15) doit être un vrai champ multiligne**, limite 1000 caractères, avec un bouton « Passer » visible.

### Source du contenu — lire attentivement
- **Libellés et listes d'options : `quiz-contenu.md`** (capture du site en ligne). C'est la version courante.
- **Barème, catégories, seuils et textes de feedback : `quiz-conception-notion.md`.**

⚠️ **Les deux sources divergent** : l'ordre des questions et plusieurs libellés d'options ne se correspondent pas. Une réconciliation est en cours et **ne bloque pas la maquette** — le concepteur dessine des gabarits d'écran, pas un contenu figé. Il ne doit en revanche jamais prendre les options dans le fichier Notion.

### Le parcours
**17 écrans pour 15 questions**, strictement linéaires. Aucun branchement conditionnel : tout le monde voit la même séquence (vérifié sur le déployé, 3 passages). Deux questions sont scindées en deux écrans chacune — la performance commerciale (visites, puis offres) et la situation actuelle (durée de mise en vente, puis accompagnement).

Sur chaque écran :
- La question, grande, lisible.
- Les options en boutons pleine largeur.
- Une barre de progression indiquant **« écran n / 17 »** plutôt qu'un pourcentage — un pourcentage à 5,88 % par palier produit des nombres arbitraires.
- Un retour arrière à partir du 2ᵉ écran.
- **La catégorie en cours** (Préparation à la Vente · Visibilité & Attractivité · Efficacité Commerciale) — *amélioration par rapport au déployé*, qui ne les révèle qu'à la fin. Les annoncer donne du sens au parcours et prépare la lecture des résultats.
- Navigation masquée (voir §0).

### Trois gabarits d'écran à dessiner
| Gabarit | Comportement | Écrans concernés |
|---|---|---|
| **Choix unique** | Avance automatique au clic, pas de bouton | La majorité |
| **Choix multiple** | État sélectionné visible, bouton « Suivant », comportement défini si rien n'est coché | La question sur les plateformes de diffusion, et Q13 obstacles |
| **Texte libre** | Champ multiligne, compteur de caractères, « Suivant » + « Passer » | Q15 |

**L'écran le plus long du parcours** est celui des plateformes de diffusion : neuf à dix options plus un champ libre « Autre (préciser) ». En boutons pleine largeur, il déborde largement d'un écran mobile. À dessiner en priorité — c'est lui qui teste le gabarit.

**Sur mobile :** c'est le cas de référence, pas l'adaptation. Options atteignables au pouce, pas de défilement pour voir la première option.

---

## §7 — Résultats

### 7.1 — Le gate de capture
Un écran plein plutôt qu'une modale. Le score global en teaser, puis prénom, nom, email, téléphone (avec sélecteur de pays) et l'opt-in.

Quatre corrections obligatoires par rapport au déployé :
- **Tout en français** (le déployé affiche « You scored X% overall », « Show My Results »).
- **Mentions légales présentes** : lien vers la politique de confidentialité, finalité de la collecte.
- **Opt-in newsletter distinct** du consentement à être recontacté.
- **Les résultats ne doivent pas exister côté client avant soumission.** Le déployé se contente d'un flou CSS : le contenu est dans la page avant que le formulaire soit rempli. Le gate doit être serveur, adossé à un jeton.

### 7.2 — Le résultat
1. **Score global** sur 100, avec le profil (Stratégie à risque / Bases solides / Bien préparé) et son diagnostic. Profils codés par la palette de la charte.
2. **Trois scores par catégorie**, en brut et en pourcentage (les maximums diffèrent : 40/40/20).
3. **Pour chaque catégorie** : l'insight de sa bande, puis l'encart « Impact chiffré ». Neuf blocs possibles, tous rédigés dans le companion.
4. **L'orientation**, selon la sortie :
   - **Sortie A** — score 71-100 **et** Q14 = « Accompagnement premium complet ». CTA « Réservez un rendez-vous stratégique de 30 minutes », contact direct en second.
   - **Sortie B** — tous les autres cas, et systématiquement si l'objectif déclaré est « minimiser les frais d'agence ». Téléchargement du plan d'action, puis newsletter.
   - **Définition retenue :** « Q14 orientée accompagnement » = l'option premium **uniquement**. « Forfait estimation + conseils » et « Vente 100 % autonome » vont en sortie B. C'est une règle de routage commercial ; elle est ici pour que le concepteur sache combien de variantes dessiner — **deux**.
5. **Le guide** en téléchargement, dans les deux cas.

**Volume :** fonctionnel et tendu. Les textes sont fournis, ils ne se réécrivent pas.
**Sur mobile :** le score global et les trois sous-scores tiennent sur un écran ; les feedbacks se déroulent en dessous.

⚠️ Le déployé finit sur « Want to know more? Take a look at our latest showreel » et deux boutons inertes. Chaque bouton de la page de résultats mène quelque part.

---

## §8 — Contact / Rendez-vous

**Rôle :** le chemin direct, sans diagnostic.
**Contenu :** deux chemins sur une page — le calendrier de créneaux réels (affichés dans le fuseau du visiteur), et un formulaire court : nom, email, téléphone, message. Rien d'autre.
**CTA :** réserver, ou envoyer.
**Volume :** deux lignes d'introduction.
**Sur mobile :** le calendrier en priorité, le formulaire en dessous.
**États :** voir la table — confirmation, erreurs de champ, calendrier vide.

---

## §9 — Guide

**Rôle :** la sortie à faible engagement, pour qui ne veut pas du diagnostic.
**Points d'entrée :** lien discret en bas de la landing Diagnostic (§5), pied de page (§0), page de résultats (§7.2), et destination de campagne autonome.
**Contenu :** couverture du guide, ce qu'il contient en cinq lignes, le formulaire de capture. Mêmes règles RGPD que le gate.
**CTA :** télécharger.
**Volume :** cinq lignes.
**Actif requis :** A-10.

---

## §10 — Légal

**Rôle :** la conformité, et elle se dessine.

**Mentions légales** — identité d'Anne, statut de mandataire indépendante, **numéro RSAC**, réseau eXp France et référence de la carte professionnelle du réseau, coordonnées, hébergeur, directeur de publication.
**Politique de confidentialité** — finalité de chaque collecte (diagnostic, contact, guide, newsletter), base légale, durée de conservation, destinataires, droits et modalités d'exercice.
**Politique cookies** — la collecte d'UTM et toute mesure d'audience.

**Bandeau de consentement — à dessiner, ce n'est pas un détail technique :**
- Apparition au premier chargement, non bloquante visuellement mais explicite.
- **Refus possible en un clic**, au même niveau que l'acceptation.
- Conséquence du refus sur le suivi de campagne, assumée.
- Accès permanent depuis le pied de page pour revenir sur son choix.

**Volume :** réglementaire.

---

## États à dessiner

Une maquette qui ne montre que le cas nominal ment sur le travail restant. Trois familles.

### Ça a marché — les confirmations
| État | Où |
|---|---|
| Message de contact envoyé | §8 |
| Créneau réservé, avec récapitulatif et ce qui se passe ensuite | §8, §7.2 |
| Guide téléchargé | §9, §7.2 |
| Inscription newsletter confirmée | §7.2 |
| Coordonnées soumises, résultats débloqués | §7.1 → §7.2 |

### Ça a raté
| État | Où |
|---|---|
| Email ou téléphone invalide, champ obligatoire vide, opt-in requis non coché | §7.1, §8, §9 |
| Échec réseau à la soumission — réponses conservées, renvoi possible | §7.1 |
| Créneau pris entre l'affichage et la confirmation | §8, §7.2 |
| Calendrier sans aucun créneau disponible | §8, §7.2 |
| Lien de résultats expiré ou jeton invalide | §7.2 |
| Page inexistante (404) | Transverse |

### C'est vide, partiel ou en cours
| État | Où |
|---|---|
| Aucune story publiée — la section disparaît, jamais un bloc vide | §1.3, §2 |
| Une ou deux stories seulement, alors que le gabarit en attend trois | §1.3 |
| Story sans témoignage acheteur, ou sans galerie secondaire | §2 |
| Avis Immodvisor indisponibles — repli sur les témoignages et un lien sortant | §1.2 |
| Moins de trois témoignages d'acheteurs non convertis | §1.5 |
| Chargement : quiz, calendrier, images | §6, §8, §1.x |
| Vidéo non chargée — image fixe, mise en page inchangée | §1.1 |
| Langue non traduite — repli sur le français, jamais d'écran mi-traduit | Transverse |
| Quiz abandonné puis repris | §6 |

**Deux décisions produit à prendre avant de dessiner**, pas à laisser au concepteur :
- **Reprise d'un quiz abandonné** : reprise à l'écran atteint, ou redémarrage ? Et capture-t-on un abandon partiel ?
- **Consentement refusé** : le suivi de campagne est-il perdu, ou une mesure sans traceur est-elle acceptable ?

---

## États d'interaction et accessibilité

À dessiner une fois, appliquer partout.

**Les cinq états de tout élément interactif** — repos, survol, focus clavier, actif, désactivé. Le focus est le plus souvent oublié et c'est le plus important : les 17 écrans du diagnostic doivent être parcourables entièrement au clavier.

**Contraste** — la palette de la charte doit être vérifiée aux ratios d'accessibilité, en particulier le terracotta sur écru. Si une combinaison ne passe pas, c'est la maquette qui s'adapte.

**Textes alternatifs** — chaque photo de bien et chaque portrait en a un.

**Mouvement réduit** — la vidéo drone en boucle est remplacée par une image fixe pour les visiteurs qui ont demandé la réduction des animations.

**Cibles tactiles** — sur mobile, les options du quiz sont atteignables au pouce.

---

## Table des actifs

**Table unique. En cas de doute, elle fait foi contre toute mention ailleurs dans ce document.**

| Réf | Actif | Quantité | Spécification |
|---|---|---|---|
| **A-01** | Vidéo drone, ouverture | 1 | Paysage 16:9, 10-20 s exploitables en boucle, sans incrustation ni logo, 1920 px de large minimum. Un recadrage portrait ou carré pour le mobile. |
| **A-02** | Photo maîtresse de bien vendu | 1 par bien, **3 biens minimum** | Paysage, 2400 px de large minimum, JPEG ou PNG non recadré. Sera recadrée en 16:9, 4:5 et 1:1 — laisser de l'air autour du sujet. |
| **A-03** | Photos secondaires de bien | 4 à 6 par bien | Mêmes exigences. Au moins une exploitable en portrait. |
| **A-04** | Portrait d'Anne | 1 | Vertical ou carré, 1600 px minimum. |
| **A-05** | Photos d'Anne en situation | 1 à 2 | Visite, échange client, terrain. |
| **A-06** | Témoignages d'acheteurs non convertis | **3** | Texte cité, prénom, contexte en une ligne. Portrait facultatif. |
| **A-07** | Témoignage de l'acheteur, par story | 1 par bien | Idem. |
| **A-08** | Récit de vente, par story | 1 par bien | Écrit par Anne, première personne, 10-15 lignes. |
| **A-09** | Validation du texte « Qui suis-je ? » | 1 | Anne relit et valide le corpus 2025 repris en §4. |
| **A-10** | Guide PDF rebrandé | 1 | « Les 10 erreurs fatales », à la charte v1. Sur le chemin critique (CAP-8). |
| **A-11** | Avis Immodvisor | — | Trancher : extraction possible, ou lien sortant seul ? |
| **A-12** | Autorisations de publication | 1 par bien + 1 par personne citée | Modèle à rédiger. Accord des vendeurs pour les photos, accord nominatif des acheteurs. |
| **A-13** | Contenu des mentions légales | 1 | Numéro RSAC, référence de carte professionnelle eXp, hébergeur. |
| **A-14** | Photo d'ouverture | 1 | Uniquement si l'arbitrage §1.1 retient la photo fixe. Paysage, 2400 px minimum, **Chablais ou Léman reconnaissable** — pas une montagne générique. Recadrage portrait pour le mobile. |

**Livraison :** fichiers originaux, non compressés et non recadrés — le site produira ses propres formats. Canal de dépôt et échéance à convenir avec Anne.

**Ce qui n'est pas demandé :** aucune photo de bien actuellement en vente. Le site ne comporte pas de vitrine (2-3 actifs seulement, risque de décrédibilisation). Seules les ventes **déjà réalisées** sont racontées.

---

## Non tranché — n'empêche pas de maquetter

- **Ouverture de l'accueil : photo fixe ou vidéo drone** (§1.1). À départager sur maquette, critère écrit. Si la photo gagne, la vidéo passe en tête du carrousel §1.3 — CAP-1 l'exige quelque part sur la page.
- Le nom de la méthode : « Système 360™ » ou « Méthode 360° ». La maquette utilise **Système 360™** ; un changement est un remplacement de chaîne.
- Le positionnement (Système 360 vs « Expert Frontaliers »).
- Les langues effectivement livrées en v1 — la maquette prévoit le sélecteur quel que soit le nombre.
- Le barème de la question sur la performance commerciale (visites × offres) — sans effet sur la maquette.
- La réconciliation des deux sources du quiz — sans effet sur les gabarits.
- La validation du concept de stories par Anne elle-même.
