# Structure du site — brief de maquette

**Version 4** (2026-09-13) — alignée sur les décisions de la séance maquette du 2026-09-13 ([DECISIONS.md](../../maquettes/lot-3-complet/DECISIONS.md), D-1 à D-12) : hero vidéo plein cadre, nav à 5 entrées, fusion Méthode + Anne en « À propos », pages Vendre et Acheter, section « Ils l'ont rencontrée » supprimée au profit de « Ils ont travaillé avec Anne ». Version 3 (2026-09-07) : alignée sur l'architecture vague 1 ([ARCHITECTURE-SPINE.md](architecture/architecture-anne-website-2026-08-29/ARCHITECTURE-SPINE.md)) — les UTM n'imposent pas de consentement · formulaire et réservation avec acceptation de la politique · téléphone facultatif pour le guide · bandeau conditionnel, deux variantes à dessiner · langues v1 tranchées. Version 2 (2026-08-29) : corrigée après `bmad-review` (20 findings adversarial + 12 structure, rapport : [review-structure-site.md](review-structure-site.md)).

**Statut : input de l'étape ③ (maquette).** Ce document dit **quelles pages, quelles sections, dans quel ordre, avec quel contenu, quels états et quel appel à l'action**. Il prescrit la *composition et la hiérarchie*, pas le style — palette, typographie et composants viennent du design system (`Website/design-system/`, projet claude.ai/design « Anne VIAL-TISSOT — Design System »).

**Amont :** [SPEC.md](../specs/spec-anne-website/SPEC.md) v4 · [ARCHITECTURE-SPINE.md](architecture/architecture-anne-website-2026-08-29/ARCHITECTURE-SPINE.md) · [quiz-conception-notion.md](../specs/spec-anne-website/quiz-conception-notion.md) · [quiz-contenu.md](../specs/spec-anne-website/quiz-contenu.md)

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
| Longue section « Qui suis-je » narrative en pleine page d'accueil | Trois lignes et un lien vers la page À propos | Accueil uniquement |
| Emojis, drapeaux et coches vertes **comme éléments de mise en page** | La typographie et la palette de la charte | Partout |

**Trois exceptions explicites**, pour lever les contradictions relevées en revue :

- **Les 9 encarts « Impact chiffré » de la page de résultats sont conservés.** Ce sont des chiffres, mais ils ne sont pas une accroche : ils personnalisent un diagnostic que le visiteur vient de demander. La règle bannit la statistique d'accroche, pas le résultat chiffré. ⚠️ Ces chiffres ne sont pas sourcés (voir SPEC, Assumptions) — à revalider avant mise en ligne, indépendamment du dessin.
- **Les trois profils de score restent codés par couleur** (rouge / ambre / vert), mais **par la palette de la charte, pas par des émojis**. Le 🔴🟡🟢 du document source est une notation de travail, pas une prescription visuelle.
- **La page Diagnostic est une page dédiée, et c'est assumé.** L'anti-pattern vise le *tunnel de vente* — l'empilement persuasif — pas l'existence d'une page. Voir §6 pour ce qui la distingue de la landing ScoreApp.

### Trois secondes, trois questions

Chaque section de l'accueil répond à l'une de ces questions, et elle est étiquetée avec la sienne dans les sections ci-dessous : **[QUI]** à qui j'ai affaire · **[PREUVE]** qu'est-ce qu'elle a déjà fait · **[ACTION]** qu'est-ce que je fais maintenant.

### Le refrain de la marque

« Pas de mauvaise surprise · pas de dossier qui traîne · des ventes qui vont au bout » apparaît sur l'accueil et sur la page À propos, dans ses deux sections « Ma méthode » et « Qui suis-je ? ». **Répétition volontaire** — c'est le refrain de la marque, à ne pas dédupliquer, y compris quand les deux occurrences vivent désormais sur la même page.

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

**Onze pages** (D-11 fusionne Méthode et Anne, D-4 et D-5 ajoutent Vendre et Acheter : 10 − 1 + 2 = 11).

| # | Page | Rôle | Capacités |
|---|---|---|---|
| 0 | **Navigation** (transverse) | En-tête, pied de page, langue | CAP-6, CAP-10 |
| 1 | **Accueil** | Installer la crédibilité, orienter vers les parcours | CAP-1, 2, 3, 5, 6 |
| 2 | **Réalisation** (index des stories + fiche story) | La preuve détaillée, une story par bien vendu | CAP-3 |
| 3 | **À propos** (ancres : Qui suis-je ? · Ma méthode · Cible) | Le parcours, la méthode, les langues, la posture | CAP-2 |
| 4 | **Vendre** | Hub vendeur : diagnostic ou demande d'estimation | CAP-5, CAP-11 |
| 5 | **Acheter** | Parcours acheteur et recherche accompagnée | CAP-6 |
| 6 | **Diagnostic** (landing) | 2ᵉ porte d'entrée — destination des campagnes | CAP-5 |
| 7 | **Diagnostic** (parcours) | Les 17 écrans de questions | CAP-4 |
| 8 | **Résultats** | Score, feedbacks, orientation | CAP-4, 7, 8, 9 |
| 9 | **Contact / Rendez-vous** | Le chemin direct | CAP-6, CAP-9 |
| 10 | **Guide** | Téléchargement, sortie à faible engagement | CAP-8 |
| 11 | **Légal** | Mentions, confidentialité, cookies | Constraint RGPD |

**Réalisation compte pour une page mais pour deux artboards** — l'index des stories et la fiche story se dessinent séparément, desktop et mobile.

Toutes traduites (CAP-10).

---

## §0 — Navigation

**Rôle :** rendre le contact atteignable depuis toute page (CAP-6) et porter le changement de langue (CAP-10).

**En-tête, desktop** — **cinq entrées, une bascule de langue, un bouton** (D-2 à D-7).
- Logo à gauche (déclinaison horizontale de la charte, **sans sous-titre** — charte § 2, 2026-09-22) — **logo Anne seul : pas de logo eXp en en-tête** (charte § 2.4, le co-branding vit en pied de page). Le secteur (Léman & Chablais) n'est pas redit ici : il vit dans le sous-titre du hero et la ligne de statut du pied de page.
- Entrées, dans cet ordre : **À propos ▾** · Réalisation · Vendre · Acheter · Contact.
- **« À propos » porte un menu déroulant** (au survol sur desktop, au tap sur les appareils tactiles) avec trois sous-entrées, qui sont les ancres de la page À propos (§3) : « Qui suis-je ? » (`#qui-suis-je`) · « Ma méthode » (`#methode`) · « Cible » (`#cible`). ⚠️ **« Cible » est à trancher** (D-2, point ouvert 1) : dessiner le menu **en deux variantes**, à trois et à deux sous-entrées. L'entrée « À propos » reste elle-même cliquable et mène en haut de la page.
- Sélecteur de langue à droite, discret (code de langue, **pas de drapeau** — un drapeau désigne un pays, pas une langue).
- Un CTA en en-tête : « Diagnostic », en pilule terracotta, visuellement distinct des entrées de menu (D-7).
- **Réseaux sociaux : position à trancher** (D-6, point ouvert 2). Anne les veut dans la barre de navigation, à gauche du logo ; JB les préfère en pied de page pour ne pas charger l'en-tête. **Dessiner les deux variantes** : A — icônes à gauche du logo, en-tête ; B — pied de page seul (état actuel).
- Au scroll : l'en-tête se réduit et reste accessible. Il ne disparaît jamais complètement — CAP-6 exige le contact atteignable partout.

**En-tête, mobile**
- Logo + bouton menu. Le CTA « Diagnostic » reste **visible hors du menu**, c'est le parcours principal.
- Menu déplié, en plein écran : les 5 entrées, le sélecteur de langue, le contact. **Pas de survol sur mobile** : « À propos » se déplie **en accordéon dans le menu**, ses sous-entrées apparaissent indentées dessous, et le libellé « À propos » reste actionnable pour aller en haut de la page. Un seul niveau d'accordéon, jamais de sous-menu superposé.

**Pendant les 17 écrans du diagnostic : navigation masquée.** Seuls subsistent le logo (non cliquable ou avec confirmation d'abandon), la barre de progression et le retour arrière. C'est une décision de taux de complétion, pas de style — le déployé fait ce choix et il a raison.

**Pied de page** — plan du site, mentions légales, politique de confidentialité, gestion des cookies, sélecteur de langue, une **ligne de statut** (« consultante indépendante — Léman & Chablais — eXp France ») qui porte le secteur en texte, **co-branding eXp** : le lockup officiel « Anne VIAL-TISSOT | eXp » (disposition horizontale avec ligne, version négative sur le fond brun — fichier `design-system/assets/lockup-exp-horizontal-negatif.svg`, logo Anne **sans sous-titre** — charte § 2, 2026-09-22) posé en bas, à côté des liens légaux, sur toutes les pages (charte § 2.4, 2026-09-22), lien vers le guide, réseaux sociaux (variante B de D-6 : ils y restent seuls si l'en-tête ne les prend pas).

---

## §1 — Accueil

Huit sections. L'ordre est délibéré : **la preuve arrive avant l'argumentaire**.

### 1.1 — Ouverture · [QUI] + [PREUVE]
**Rôle :** montrer, immédiatement.
**Contenu :** **une vidéo drone plein cadre, en fond du titre** (D-1) — tournée sur les biens qu'Anne a vendus, pas une banque d'images. Par-dessus : le nom « Anne VIAL-TISSOT » et une ligne de positionnement. Le lac et la montagne doivent être lisibles : c'est le territoire, et il doit être **reconnaissable comme le Chablais et le Léman**, pas comme une montagne générique. **Le secteur est dit une fois, dans le sous-titre** — et nulle part ailleurs dans le hero (D-10 : la liste de communes en bas à droite est retirée, elle bornait le territoire à six communes alors qu'Anne travaille sur tout le Chablais et le bassin lémanique).
**CTA :** un seul, vers le diagnostic — « Faire le point sur votre vente · 3 minutes ».
**Volume :** une phrase. Pas de paragraphe.
**Sur mobile :** visuel recadré en portrait ou carré, jamais une bande fine. Le nom et le CTA restent au-dessus de la ligne de flottaison.
**Actif requis :** A-01 (vidéo drone) et A-14 (image d'ouverture, qui sert de poster et de repli).

**Contraintes de production du hero vidéo** (D-1, à respecter dès la maquette parce qu'elles changent le dessin) :
- **Une image d'ouverture (poster) s'affiche d'abord.** Le visuel ne bloque jamais l'affichage : image, puis vidéo.
- **Chargement différé** — la vidéo n'entre pas dans le chemin critique du premier rendu (SPEC : < 3 s utile en mobile).
- **Repli image** sur mobile, sur connexion lente, et pour les visiteurs qui ont demandé la réduction des animations. La mise en page est identique avec et sans vidéo.
- **Jamais de son.** Ni piste audio, ni bouton de son.

⚠️ CAP-1 exige au minimum **1 séquence vidéo** sur l'accueil : le hero la porte. Les plans en parallaxe du premier prototype sont abandonnés (D-1) — la profondeur vient du mouvement de la vidéo, pas d'un empilement de calques.

### 1.2 — La preuve, tout de suite · [PREUVE]
**Rôle :** répondre à « pourquoi je vous ferais confiance » avant toute argumentation.
**Contenu :** **une bande compacte**, pas un bloc de texte — la note Immodvisor, le nombre d'avis, **un** extrait court attribué, et un lien vers la fiche source vérifiable.
**Pourquoi compacte :** après une vidéo plein cadre, un pavé de texte casse la promesse « le visuel porte le site ». La bande s'adosse visuellement à l'ouverture plutôt que de lui succéder comme une section pleine.
**Volume :** la note, un extrait, un lien.
**Sur mobile :** la note et le nombre d'avis restent ; l'extrait peut passer en défilement horizontal.

### 1.3 — Ventes récentes · [PREUVE]
**Rôle :** le cœur visuel du site, et le remplacement de la vitrine de biens.
**Contenu :** **six photographies de biens vendus, en carrousel.** Six photos empilées mangent une hauteur d'écran impraticable — constat du premier prototype. Le carrousel les fait tenir sans sacrifier la taille de chacune, qui reste le point important : ces photos sont le cœur visuel du site, pas des vignettes.

Chaque vue porte la photo en grand, la commune, et une phrase extraite du récit d'Anne. **Quand la story porte un témoignage, la vue peut aussi porter une citation courte** — vendeur ou acheteur, attribuée avec son rôle (D-9). C'est un complément, pas un remplacement : la phrase d'Anne reste. Une story sans témoignage s'affiche sans citation, la vue reste complète. Pas de prix, pas de surface, pas de caractéristiques : ce n'est pas une annonce.

**Pourquoi six :** CAP-1 exige au minimum 1 vidéo et 6 photographies de biens réellement traités sur l'accueil. La vidéo est portée par l'ouverture (§1.1, D-1) ; le carrousel porte les six photos.

**Règles du carrousel** — un carrousel mal fait cache le contenu au lieu de l'économiser :
- **Défilement manuel par défaut.** Si rotation automatique il y a, elle s'arrête au survol et au focus, et un contrôle de pause est visible.
- Indicateurs de position visibles : le visiteur doit voir qu'il y a six vues, sinon il n'en verra qu'une.
- La première vue est complète et autonome — elle doit tenir seule si personne ne fait défiler.
- Navigable au clavier, et arrêtée pour les visiteurs qui ont demandé la réduction des animations.
- **Sur mobile : balayage tactile**, une vue à la fois, photo toujours grande.

**CTA :** « Voir cette vente » par vue, plus un lien vers l'index complet.
**Volume :** une phrase par vue, plus une citation courte quand elle existe.
**Actif requis :** A-02, A-03, et A-07 pour les citations.

### 1.4 — Le Système 360™, en un coup d'œil · [QUI]
**Rôle :** nommer la méthode sans la dérouler.
**Contenu :** les trois axes (Vendeur 360° / Marché 360° / Partenaires 360°) en trois blocs courts appuyés visuellement, une phrase chacun. Puis le refrain de la marque.
**CTA :** « La méthode en détail » → **l'ancre Méthode de la page À propos** (`/a-propos#methode`, §3). Il n'y a plus de page Méthode autonome (D-11).
**Volume :** trois phrases plus le refrain. Le développement vit dans la section Méthode de la page À propos.

### 1.5 — Ils ont travaillé avec Anne · [PREUVE]
**Rôle :** porter la preuve sociale humaine de l'accueil — ce que disent les gens qui ont effectivement travaillé avec Anne, **vendeurs comme acheteurs** (D-9). Remplace la section « Ils l'ont rencontrée » de la v3, supprimée : les témoignages d'acheteurs non convertis n'ont pas pu être collectés en nombre suffisant, et on ne construit pas une section sur un contenu qu'on n'a pas (D-8).
**La règle qui gouverne toute la page :** **toute preuve du site est soit une vente réelle, soit un avis vérifiable.** Rien d'autre — pas de citation anonyme, pas de témoignage reconstitué, pas de portrait d'illustration.
**Contenu :** **trois avis Immodvisor entiers** — pas des extraits recoupés — mêlant vendeurs et acheteurs, chacun attribué (prénom, rôle, commune ou contexte en une ligne) et renvoyant à la fiche source vérifiable. Deux formes de vue, selon ce qui existe :
1. **Avis relié à sa story** — la photo du bien vendu à côté de l'avis, et un lien vers la story. C'est la forme forte : la preuve visuelle et la parole du client dans le même bloc.
2. **Avis seul** — la citation, attribuée, sans photo de bien, quand aucune story ne correspond. La vue reste complète, jamais un cadre photo vide.
**CTA :** lien vers la fiche Immodvisor, et « Voir cette vente » sur les avis reliés à une story.
**Volume :** trois avis, cités entiers. Aucun commentaire éditorial autour.
**Sur mobile :** empilés ou en défilement horizontal ; sur un avis relié à une story, la photo passe au-dessus de la citation.
**Actif requis :** A-11 (les trois avis Immodvisor sélectionnés) et A-02 (photos des biens des stories reliées). **Ni A-06 ni portrait de non-client** : ces actifs sont abandonnés (D-8).

### 1.6 — Le diagnostic · [ACTION]
**Rôle :** l'entrée du premier parcours de conversion. **Un bouton, pas une page de vente.**
**Contenu :** une phrase sur ce que le diagnostic donne, la durée (3 minutes), le bouton.
**Volume :** trois lignes maximum, tout compris.

### 1.7 — Anne · [QUI]
**Rôle :** la personne derrière la méthode.
**Contenu :** un portrait. Trois lignes : le parcours (finance d'entreprise, Danone Évian, Bel au Brésil), ce qui l'a amenée à l'immobilier, sa façon de travailler. Les quatre langues de travail, sobrement — c'est un argument fort sur le bassin lémanique et la justification visible du multilingue du site.
**CTA :** « En savoir plus » → l'ancre Qui suis-je ? de la page À propos (`/a-propos#qui-suis-je`, §3).
**Volume :** trois lignes.
**Actif requis :** A-04.

### 1.8 — Parler à Anne · [ACTION]
**Rôle :** le second parcours de conversion, pour qui n'a pas besoin du diagnostic.
**Contenu :** une invitation courte, le choix entre réserver un créneau et laisser un message.
**CTA :** « Réserver un créneau » (primaire) · « Écrire à Anne » (secondaire).
**Volume :** deux lignes.

---

## §2 — Réalisation (les ventes)

**Rôle :** la preuve détaillée. C'est le contenu qui prouve la méthode sans la réciter. L'entrée de navigation s'appelle **Réalisation** (D-3) ; elle mène à l'index des stories de biens vendus.
**Volume :** développé — c'est une page de fond.

### Index
Grille de toutes les stories : photo, commune, une phrase. Pas de filtre tant qu'il y a moins d'une dizaine de biens.
**Sur mobile :** une colonne.

### Fiche story
1. **Photo maîtresse** plein cadre.
2. **Le contexte** — commune, type de bien, et si Anne l'accepte, le délai de vente. Factuel, court.
3. **Le récit d'Anne** — à la première personne. Ce qui bloquait, ce qui a été fait, comment ça s'est terminé.
4. **Les témoignages** — **jusqu'à deux par story, un vendeur et un acheteur** (D-9). Chacun est cité, attribué, et **son rôle est affiché** : c'est ce qui distingue les deux paroles et ce qui fait la force du bloc quand les deux sont là. **Un seul témoignage suffit pour publier la story** — vendeur ou acheteur, indifféremment ; le bloc se dessine donc aussi à une seule voix, sans trou ni cadre vide.
5. **Galerie secondaire.**
6. **CTA** — diagnostic ou contact.

**Actif requis :** A-02, A-03, A-05, A-07, A-08.

---

## §3 — À propos

**Une seule page longue** (D-11). Les pages Méthode et Anne de la v3 fusionnent : leurs contenus deviennent des sections de cette page, et les sous-entrées du menu « À propos ▾ » en sont les ancres. Le visiteur qui vient du menu atterrit directement dans la bonne section ; celui qui vient de l'accueil lit la page en continu.

**Rôle :** installer la confiance par le parcours, puis développer le Système 360™ pour qui veut comprendre avant de s'engager.
**Volume :** développé — c'est la page de fond du site.
**Ancres :** `#qui-suis-je` · `#methode` · `#cible` (conditionnelle, voir ci-dessous).
**Repère de lecture :** sur desktop, un sommaire latéral ou collant signale où l'on est dans la page — sans lui, une page longue à trois sections se parcourt mal. Sur mobile, il se réduit à un fil de sections en haut de page.

### 3.1 — Qui suis-je ? (`#qui-suis-je`)

**Contenu — la section « Qui suis-je ? » de Notion est recyclée ici**, à peu près telle quelle : elle est bien écrite, à la première personne, et installe exactement la crédibilité recherchée.

1. **Portrait** en ouverture.
2. **Le parcours** — dix ans d'opérations internationales, Danone (Évian) et Bel au Brésil, la finance d'entreprise.
3. **Le choc de l'immobilier** — les ventes qui s'effondrent après le compromis : financement refusé au dernier moment, formalités découvertes trop tard, acquéreurs mal accompagnés, coordination inexistante. C'est le passage le plus fort du corpus : il explique *pourquoi* la méthode existe.
4. **La naissance du Système 360™** — un réseau d'experts, chaque vente traitée comme un projet d'entreprise. C'est la charnière : elle enchaîne sur la section Méthode.
5. **Le refrain de la marque.**
6. **Les quatre langues** et l'ancrage Chablais / Léman.

**Actif requis :** A-04, A-09.
⚠️ Ce texte n'a pas été relu par Anne depuis sa rédaction en 2025. Sa validation est un livrable (A-09).

### 3.2 — Ma méthode (`#methode`)

**Cible du lien « La méthode en détail » de l'accueil** (§1.4).

**Contenu :** les trois axes détaillés, ce que chacun couvre concrètement, le réseau de partenaires (courtier bancaire, courtier travaux, géomètre, notaire) et le rôle de chef d'orchestre. Puis le refrain de la marque.
**Source du texte :** le corpus rédigé existe dans Notion (`ea0787ebf88c46e9bf4dc2b71725b55d`). À **resserrer**, pas à coller.
**Sur mobile :** les trois axes en pile.

**Bloc vidéo — Anne présente sa méthode** (D-12). Anne face caméra, qui explique sa méthode en quelques minutes. **Prévu en maquette, facultatif en production** :
- L'artboard se dessine **en deux variantes** : avec le bloc vidéo, et sans.
- **Le bloc n'apparaît pas tant que la vidéo n'existe pas.** Pas de trou, pas de cadre gris, pas de « vidéo à venir » en production — la section Méthode est complète sans elle.
- Très probablement absente à la première publication : la vidéo se tourne après le lancement (actif A-15, facultatif).
- Mêmes règles de production que le hero : image d'ouverture, chargement différé, jamais de lecture automatique avec son.

### 3.3 — Cible (`#cible`) — 🔄 à trancher

**Statut : non tranché** (D-2, point ouvert 1). La section présenterait les profils de clients : primo-accédants, investisseurs, cadres supérieurs, seniors. **La question ouverte est sa redondance** : ces profils sont déjà portés par les pages Vendre (§4) et Acheter (§5), qui les adressent par le besoin plutôt que par l'étiquette.

**À dessiner en deux variantes** : la page À propos avec la section Cible et sa sous-entrée de menu, et sans. Si elle n'est pas retenue, rien ne se perd — le contenu vit dans Vendre et Acheter. Dans tous les cas, **« Cible » est une section, jamais une page**.

### Fin de page

**CTA :** diagnostic ou rendez-vous.

---

## §4 — Vendre

**Rôle :** le hub du vendeur (D-4). Une page, **deux portes**, et rien d'autre — pas un troisième argumentaire sur la méthode, qui vit en §3.

**Contenu :** une introduction de deux ou trois lignes, puis les deux portes, visuellement à parité :

1. **« Faire le point sur votre vente »** → la landing Diagnostic (§6). Une phrase sur ce qu'on obtient, la durée de 3 minutes, le bouton. ⚠️ **La landing Diagnostic reste une porte d'entrée autonome de premier niveau** (décision du 2026-08-29) : Vendre ne l'absorbe pas, ne la duplique pas et ne la remplace pas. Vendre est un chemin de plus vers elle, pas son nouveau parent.
2. **« Faire estimer mon bien »** → le formulaire de demande d'estimation, sur cette page. Pour le vendeur qui ne veut pas répondre à quinze questions et veut un chiffre.

**L'estimation n'est pas faite sur le site.** Aucun calcul, aucune fourchette affichée, aucune promesse de résultat immédiat. Le formulaire capture les coordonnées ; **Anne rappelle, puis visite**. Le texte le dit en une ligne, au-dessus du formulaire : c'est ce qui évite la déception et ce qui distingue cette demande d'un estimateur automatique.

**Le formulaire de demande d'estimation** — champs (proposition, point ouvert 3) :
- Prénom, nom.
- **Téléphone, obligatoire** — c'est le canal du rappel, sans lui la demande n'a pas d'objet.
- E-mail.
- **Commune du bien** et **type de bien**.
- Message, facultatif.
- **Case d'acceptation de la politique de confidentialité**, obligatoire, et séparée, la case d'inscription à la séquence d'e-mails, facultative. Mêmes règles qu'en §9.

**C'est une source de lead distincte** : `estimation` (CAP-11 du SPEC v5), à ne pas confondre avec le contact ni avec le diagnostic (AD-6, contrat de champs par source). Le dessin de la confirmation le reflète : elle annonce un rappel, pas un document.

**CTA :** « Faire le point sur votre vente » (vers §6) · « Demander une estimation » (soumission du formulaire).
**Volume :** une introduction courte, deux portes, un formulaire. Pas de tunnel.
**Sur mobile :** les deux portes empilées, à parité ; le formulaire en dessous, déplié ou atteint par ancre depuis la seconde porte.
**États :** confirmation de la demande envoyée, erreurs de champ, échec réseau — comme les autres formulaires du site (voir la table des états).

---

## §5 — Acheter

**Rôle :** la page du parcours acheteur (D-5). Elle existe parce qu'Anne accompagne réellement des acheteurs — et que les avis d'acheteurs sont une part de la preuve du site (§1.5, D-9).

**Contenu :**
1. **À qui elle s'adresse** — primo-accédants et investisseurs, dits par leur situation, pas par une étiquette marketing.
2. **La recherche accompagnée** — le service : Anne repère les biens, **les visite en premier**, présélectionne, et ne fait se déplacer l'acheteur que sur ce qui vaut le déplacement. C'est le cœur de la page.
3. **L'accompagnement après l'achat** — ce qui continue une fois la vente signée : le réseau de partenaires (travaux, notaire, courtier) reste disponible. C'est ce qui explique pourquoi des acheteurs laissent un avis.
4. **La preuve** — un ou deux avis d'acheteurs, repris de la même source vérifiable qu'en §1.5.

**CTA :** « Parler de votre projet » → le formulaire de contact (§9), avec un champ **« votre projet : vente / achat »** pré-réglé sur *achat*. 🔄 **Point ouvert 4** : formulaire de contact partagé avec ce champ, ou formulaire dédié à l'achat ? La maquette part du formulaire partagé — c'est l'hypothèse la moins coûteuse et elle n'ajoute pas de source de lead.
**Volume :** développé, mais moins que §3 — c'est une page de service, pas une page de fond.
**Sur mobile :** sections empilées, le CTA répété une fois en bas de page.
**Contenu à écrire par Anne** : `contenu-anne/pages/acheter/fr.md` (gabarit `page.md`). Aucun texte de cette page n'existe aujourd'hui — la maquette se dessine sur du texte de placement, clairement marqué comme tel.

---

## §6 — Diagnostic (landing autonome)

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
Sous les trois blocs, **un lien discret vers le guide** (§10) : « Pas envie de répondre à 17 questions ? Le guide des 10 erreurs, sans le diagnostic. » Un visiteur froid qui n'est pas prêt à donner trois minutes doit avoir autre chose à faire que partir. C'est un lien, pas un quatrième bloc — la règle des trois blocs tient.

**Sur mobile :** l'offre et le bouton tiennent au-dessus de la ligne de flottaison sur 375 px. Les trois blocs s'empilent.

### Contraintes techniques
- URL propre, stable, partageable — elle vivra dans des emails et des publications.
- Paramètres de campagne (UTM) acceptés et transmis jusqu'au lead capté. Ils voyagent dans l'adresse puis dans l'état de la page jusqu'à la soumission, **sans rien déposer dans le navigateur** : pas de cookie, donc pas de consentement à demander pour ça (AD-11).
- Aperçu de partage correct (titre, description, image).
- Traduite comme le reste.
- Le lien vers l'accueil reste accessible dans la navigation.

---

## §7 — Diagnostic, le parcours

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
- Une barre de progression **remplie sur les 17 écrans réels**, mais **libellée « Question n / 15 »** — le visiteur s'est vu promettre 15 questions sur la landing ; lui annoncer 17 écrans en cours de route casse la promesse au pire moment. Les deux écrans d'une même question portent le même numéro. Ni pourcentage (5,88 % par palier donne des nombres arbitraires), ni compte d'écrans.
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

## §8 — Résultats

### 8.1 — Le gate de capture
Un écran plein plutôt qu'une modale. Le score global en teaser, puis prénom, nom, email, téléphone (avec sélecteur de pays) et l'opt-in.

Quatre corrections obligatoires par rapport au déployé :
- **Tout en français** (le déployé affiche « You scored X% overall », « Show My Results »).
- **Mentions légales présentes** : lien vers la politique de confidentialité, finalité de la collecte.
- **Opt-in newsletter distinct** du consentement à être recontacté.
- **Les résultats ne doivent pas exister côté client avant soumission.** Le déployé se contente d'un flou CSS : le contenu est dans la page avant que le formulaire soit rempli. Le gate doit être serveur, adossé à un jeton.

### 8.2 — Le résultat
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

## §9 — Contact / Rendez-vous

**Rôle :** le chemin direct, sans diagnostic.
**Contenu :** deux chemins sur une page — le calendrier de créneaux réels (Cal.com intégré, affiché dans le fuseau du visiteur ; **son formulaire de réservation comporte une case obligatoire d'acceptation de la politique de confidentialité**, à dessiner dans le style du site), et un formulaire court : prénom, nom, email, téléphone (obligatoire), **« votre projet : vente / achat »** (D-5 — pré-réglé sur *achat* quand on arrive depuis §5, 🔄 point ouvert 4), message, **case d'acceptation de la politique de confidentialité** (obligatoire) et, séparée, la case d'inscription à la séquence d'e-mails (facultative). Rien d'autre (AD-6).
**CTA :** réserver, ou envoyer.
**Volume :** deux lignes d'introduction.
**Sur mobile :** le calendrier en priorité, le formulaire en dessous.
**États :** voir la table — confirmation, erreurs de champ, calendrier vide.

---

## §10 — Guide

**Rôle :** la sortie à faible engagement, pour qui ne veut pas du diagnostic.
**Points d'entrée :** lien discret en bas de la landing Diagnostic (§6), pied de page (§0), page de résultats (§8.2), et destination de campagne autonome.
**Contenu :** couverture du guide, ce qu'il contient en cinq lignes, le formulaire de capture : prénom, nom, email, acceptation de la politique (obligatoires), **téléphone facultatif** (AD-6, décision 2026-09-07), case d'inscription à la séquence d'e-mails séparée. Le lien de téléchargement est délivré après capture et expire ; le PDF n'a pas d'adresse publique.
**CTA :** télécharger.
**Volume :** cinq lignes.
**Actif requis :** A-10.

---

## §11 — Légal

**Rôle :** la conformité, et elle se dessine.

**Mentions légales** — identité d'Anne, statut de mandataire indépendante, **numéro RSAC**, réseau eXp France et référence de la carte professionnelle du réseau, coordonnées, hébergeur, directeur de publication. Le lockup co-brandé Anne + eXp y figure aussi (en plus du pied de page), avec la phrase de statut « consultante indépendante — eXp France » (charte § 2.4).
**Politique de confidentialité** — finalité de chaque collecte (diagnostic, contact, **demande d'estimation**, guide, séquence d'e-mails), base légale, durée de conservation, destinataires, droits et modalités d'exercice.
**Politique cookies** — explique qu'aucun traceur non essentiel n'est déposé : mesure d'audience sans cookie, paramètres de campagne sans dépôt, seule la sauvegarde des réponses du diagnostic (strictement nécessaire) est conservée localement (AD-11).

**Bandeau de consentement — conditionnel, deux variantes à dessiner.** L'architecture vise un site **sans traceur non essentiel** (AD-11) : si rien n'est déposé, il n'y a **pas de bandeau**, seulement la page cookies. Le bandeau ne devient nécessaire que si l'anti-robot (Turnstile) ou l'agenda intégré (Cal.com) déposent quelque chose — vérification au build. La maquette montre donc :
- **Variante A, sans bandeau** (cible) : le pied de page porte le lien « Cookies » vers la page explicative. Rien d'autre.
- **Variante B, avec bandeau** (repli, uniquement sur les pages concernées) : apparition au premier chargement, non bloquante visuellement mais explicite ; **refus possible en un clic**, au même niveau que l'acceptation ; conséquence du refus assumée (l'agenda se charge au clic) ; accès permanent depuis le pied de page pour revenir sur son choix.

**Volume :** réglementaire.

---

## États à dessiner

Une maquette qui ne montre que le cas nominal ment sur le travail restant. Trois familles.

### Ça a marché — les confirmations
| État | Où |
|---|---|
| Message de contact envoyé | §9 |
| **Demande d'estimation envoyée** — la confirmation annonce **un rappel d'Anne**, pas un document ni un chiffre | §4 |
| Créneau réservé, avec récapitulatif et ce qui se passe ensuite | §9, §8.2 |
| Guide téléchargé | §10, §8.2 |
| Inscription newsletter confirmée | §8.2 |
| Coordonnées soumises, résultats débloqués | §8.1 → §8.2 |

### Ça a raté
| État | Où |
|---|---|
| Email ou téléphone invalide, champ obligatoire vide, acceptation de la politique non cochée | §8.1, §9, §10, **§4 (estimation : téléphone, commune et type de bien manquants)** |
| Échec réseau à la soumission — réponses ou saisie conservées, renvoi possible | §8.1, **§4** |
| Créneau pris entre l'affichage et la confirmation | §9, §8.2 |
| Calendrier sans aucun créneau disponible | §9, §8.2 |
| Lien de résultats expiré ou jeton invalide | §8.2 |
| Page inexistante (404) | Transverse |

### C'est vide, partiel ou en cours
| État | Où |
|---|---|
| Aucune story publiée — la section disparaît, jamais un bloc vide | §1.3, §2 |
| Une ou deux stories seulement, alors que le gabarit en attend trois | §1.3 |
| Story à un seul témoignage (vendeur **ou** acheteur), ou sans galerie secondaire | §2, §1.3 |
| Avis Immodvisor indisponibles — repli sur les témoignages de stories et un lien sortant | §1.2, §1.5 |
| Moins de trois avis exploitables pour « Ils ont travaillé avec Anne » | §1.5 |
| Avis sans story correspondante — citation seule, jamais un cadre photo vide | §1.5 |
| **Section Méthode sans la vidéo d'Anne** — le bloc n'apparaît pas, la page reste complète (D-12) | §3.2 |
| Chargement : quiz, calendrier, images | §7, §9, §1.x |
| Vidéo du hero non chargée — image d'ouverture, mise en page inchangée | §1.1 |
| Langue non traduite — repli sur le français, jamais d'écran mi-traduit | Transverse |
| Quiz abandonné puis repris | §7 |

**Deux décisions produit à prendre avant de dessiner**, pas à laisser au concepteur :
- **Reprise d'un quiz abandonné** : reprise à l'écran atteint, ou redémarrage ? Et capture-t-on un abandon partiel ?
- **Consentement refusé** : le suivi de campagne est-il perdu, ou une mesure sans traceur est-elle acceptable ?

---

## États d'interaction et accessibilité

À dessiner une fois, appliquer partout.

**Les cinq états de tout élément interactif** — repos, survol, focus clavier, actif, désactivé. Le focus est le plus souvent oublié et c'est le plus important : les 17 écrans du diagnostic doivent être parcourables entièrement au clavier. **Le menu déroulant « À propos »** (§0) en fait partie : un menu qui ne s'ouvre qu'au survol est inutilisable au clavier — il s'ouvre aussi au focus et à l'activation, et ses sous-entrées sont atteignables sans souris.

**Contraste** — la palette de la charte doit être vérifiée aux ratios d'accessibilité, en particulier le terracotta sur écru. Si une combinaison ne passe pas, c'est la maquette qui s'adapte.

**Textes alternatifs** — chaque photo de bien et chaque portrait en a un.

**Mouvement réduit** — la vidéo drone en boucle est remplacée par une image fixe pour les visiteurs qui ont demandé la réduction des animations.

**Cibles tactiles** — sur mobile, les options du quiz sont atteignables au pouce.

---

## Table des actifs

**Table unique. En cas de doute, elle fait foi contre toute mention ailleurs dans ce document.**

| Réf | Actif | Quantité | Spécification |
|---|---|---|---|
| **A-01** | Vidéo drone, ouverture | 1, **requise** | Tournée sur des biens vendus par Anne (D-1). Paysage 16:9, 10-20 s exploitables en boucle, **sans son**, sans incrustation ni logo, 1920 px de large minimum. Un recadrage portrait ou carré pour le mobile. |
| **A-02** | Photo maîtresse de bien vendu | 1 par bien, **3 biens minimum** | Paysage, 2400 px de large minimum, JPEG ou PNG non recadré. Sera recadrée en 16:9, 4:5 et 1:1 — laisser de l'air autour du sujet. |
| **A-03** | Photos secondaires de bien | 4 à 6 par bien | Mêmes exigences. Au moins une exploitable en portrait. |
| **A-04** | Portrait d'Anne | 1 | Vertical ou carré, 1600 px minimum. |
| **A-05** | Photos d'Anne en situation | 1 à 2 | Visite, échange client, terrain. |
| ~~**A-06**~~ | ~~Témoignages d'acheteurs non convertis~~ | — | **Abandonné (D-8)** : collecte impossible en nombre suffisant, section « Ils l'ont rencontrée » supprimée. Les portraits de non-clients tombent avec. |
| **A-07** | Témoignages de story | **jusqu'à 2 par bien** (vendeur et acheteur), **au moins 1 pour publier** | Texte cité, prénom, **rôle explicite (vendeur / acheteur)**, contexte en une ligne (D-9). Sert aussi les citations courtes du carrousel §1.3. |
| **A-08** | Récit de vente, par story | 1 par bien | Écrit par Anne, première personne, 10-15 lignes. |
| **A-09** | Validation du texte « Qui suis-je ? » | 1 | Anne relit et valide le corpus 2025 repris en §3.1. |
| **A-10** | Guide PDF rebrandé | 1 | « Les 10 erreurs fatales », à la charte v1. Sur le chemin critique (CAP-8). |
| **A-11** | Avis Immodvisor | **3 sélectionnés** (vendeurs **et** acheteurs) + la note globale | Les trois avis de la section « Ils ont travaillé avec Anne » (§1.5) : texte entier, prénom, rôle, date, lien vers la fiche source. Conservés en **instantané local** (objet `AvisImmodvisor`), pas rechargés depuis la plateforme à l'affichage. 🔄 **Choix des trois avis à faire** (point ouvert 5) : idéalement deux vendeurs + un acheteur, dont au moins un relié à une story rédigée. |
| **A-12** | Autorisations de publication | 1 par bien + 1 par personne citée | Modèle à rédiger. Accord des vendeurs pour les photos, accord nominatif des acheteurs. |
| **A-13** | Contenu des mentions légales | 1 | Numéro RSAC, référence de carte professionnelle eXp, hébergeur. **Les logos eXp sont déjà fournis** (`Identité Visuelle/Charte/Logos eXp/`, lockups prêts dans `design-system/assets/`) — rien à demander à Anne sur ce point. |
| **A-14** | Image d'ouverture | 1, **requise** | **Poster de la vidéo du hero et repli** (mobile, connexion lente, mouvement réduit) — extraite de la vidéo ou cadrée à l'identique. Paysage, 2400 px minimum, **Chablais ou Léman reconnaissable** — pas une montagne générique. Recadrage portrait pour le mobile. |
| **A-15** | Vidéo « Anne présente sa méthode » | 1, **facultative** | Anne face caméra, quelques minutes, sur la section Méthode de §3 (D-12). **À tourner après le lancement** : la page est complète sans elle et le bloc n'apparaît pas tant qu'elle n'existe pas. Image d'ouverture fournie avec. |

**Livraison :** fichiers originaux, non compressés et non recadrés — le site produira ses propres formats. Canal de dépôt et échéance à convenir avec Anne.

**Ce qui n'est pas demandé :** aucune photo de bien actuellement en vente. Le site ne comporte pas de vitrine (2-3 actifs seulement, risque de décrédibilisation). Seules les ventes **déjà réalisées** sont racontées.

---

## Non tranché — n'empêche pas de maquetter

**Les cinq points ouverts de la séance du 2026-09-13** (DECISIONS.md) — chacun se dessine en variantes, aucun ne bloque la maquette :

1. **« Cible » : section d'À propos, ou absorbée par Vendre et Acheter ?** (D-2, §3.3). Deux variantes à dessiner, page et menu.
2. **Réseaux sociaux : en-tête à gauche du logo, ou pied de page seul ?** (D-6, §0). Deux variantes à dessiner.
3. **Formulaire d'estimation : quels champs au minimum ?** (D-4, §4). Proposition retenue pour la maquette : prénom, nom, téléphone, e-mail, commune du bien, type de bien, message facultatif, consentement.
4. **« Parler de votre projet » (Acheter) : formulaire de contact partagé avec un champ « vente / achat », ou formulaire dédié ?** (D-5, §5 et §9). La maquette part du partagé.
5. **Quels trois avis Immodvisor** pour « Ils ont travaillé avec Anne » ? (D-9, §1.5, A-11). Idéalement deux vendeurs + un acheteur, dont au moins un relié à une story rédigée.

**Le reste :**

- ~~Ouverture de l'accueil : photo fixe ou vidéo drone~~ — **tranché le 2026-09-13 (D-1) : vidéo drone plein cadre**, image d'ouverture en poster et en repli. Les plans en parallaxe sont abandonnés.
- Le nom de la méthode : « Système 360™ » ou « Méthode 360° ». La maquette utilise **Système 360™** ; un changement est un remplacement de chaîne.
- Le positionnement (Système 360 vs « Expert Frontaliers »).
- ~~Les langues effectivement livrées en v1~~ — **tranché le 2026-09-07 : FR + EN**. La maquette prévoit le sélecteur quel que soit le nombre ; une story non traduite n'apparaît pas dans l'index anglais (AD-2) — l'état « index anglais plus court que le français » est normal, pas un bug.
- Le barème de la question sur la performance commerciale (visites × offres) — sans effet sur la maquette.
- La réconciliation des deux sources du quiz — sans effet sur les gabarits.
- La validation du concept de stories par Anne elle-même.
