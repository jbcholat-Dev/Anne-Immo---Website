# Infographies et images des réseaux — la règle

Section du design system ajoutée le 2026-10-27 (story 8.24, décision D-49). Elle dit comment fabriquer toute image ou vidéo « schéma » d'Anne : publications du fil Facebook et Instagram, carrousels, stories, capsules vidéo du diagnostic, posts LinkedIn.

**Ce que ça change** : une idée dense (les quatre façons de fixer un prix, les étapes d'une vente) se lit en un coup d'œil, et chaque image se reconnaît comme « une image d'Anne » sans signature criarde. N'importe quel fil Claude, ou un graphiste, peut en produire une nouvelle sans réinventer la mise en page.

Cartes de la section (visibles dans le design system de claude.ai/design, groupe « Infographies ») :

| Fichier | Ce qu'il montre |
|---|---|
| `pieces.html` | Les pièces détachées : cartes (trois tons), pilules, pastille « Le piège », trait pointillé, anneau, cœur du schéma, encart « Le conseil d'Anne », bulle d'Anne |
| `schema-cercle.html` | Le gabarit de référence au format fil (1080 × 1350) : le schéma « cercle » de la question 1 du diagnostic |
| `capsule-bulle.html` | La dernière image d'une capsule vidéo (1080 × 1920) avec la bulle d'Anne et les zones à laisser libres |

## 1. D'où vient le style

Référence donnée par JB le 2026-10-26 : les infographies de **Pierre Herubel** (LinkedIn), par exemple « The 4 layers of a content brain ». Captures et note : `/mnt/project-files/publication-quotidienne/inspiration/` (dossier partagé du projet, hors du dépôt).

On reprend : un fond uni et clair ; un titre court et grand ; **un schéma central** (cercle en quartiers, anneau ou boucle en pointillés) ; autour, des **cartes arrondies** à fond pâle et bord fin, repérées par une lettre ou un numéro, avec un titre, une ligne en italique et des **étiquettes « pilule »** ; des traits fins qui relient chaque carte au schéma ; une signature discrète. Beaucoup d'information, mais chaque élément tient en un ou deux mots.

On adapte : la palette (celle d'Anne, **jamais les pastels bleu, jaune, vert, rose d'Herubel**), les polices (Gilda Display et Jost), les formats des réseaux, et la signature (le conseil d'Anne avec sa photo, puis l'appel au diagnostic offert).

## 2. Anatomie d'une infographie

De haut en bas, toujours dans cet ordre :

1. **Sur-titre** (facultatif) : petites capitales Jost 500, espacées, terracotta profond. Ex. « Question 1 du diagnostic vendeur ».
2. **Titre** : Gilda Display, deux lignes au plus, centré. Les mots qui portent l'idée en bleu Klein (« coûte le plus cher »), le reste en brun.
3. **Sous-titre** (facultatif, format fil) : une ligne Jost italique, texte secondaire. Sert à citer la question d'origine.
4. **Schéma central** : un seul par image (voir § 5). Son cœur est un rond brun qui porte le sujet en deux mots (« Votre prix »).
5. **Cartes** : de 2 à 4, autour du schéma. Chaque carte = une lettre ou un numéro + un titre court, une ligne en italique, une à trois pilules. Elle est reliée au schéma par un trait.
6. **Le piège** : au plus une carte par image, en ton terracotta, avec la pastille « Le piège » à cheval sur son bord.
7. **Le conseil d'Anne** : encart bleu Klein, sur-titre « Le conseil d'Anne », une phrase en Gilda écru. Toujours accompagné de la photo d'Anne (médaillon dans l'image fixe, bulle vidéo dans la capsule).
8. **Appel** (image fixe) : une ligne en bas, « Où en est votre vente ? **Diagnostic vendeur offert · 3 minutes · lien dans la bio** ». Dans la capsule, l'appel est la scène de fin.

## 3. Couleurs

Une seule palette, celle de `tokens/tokens.css`. Les teintes pâles ci-dessous en sont **dérivées** (même couleur, plus claire) ; ce ne sont pas des couleurs nouvelles de la marque. Elles ne servent qu'aux infographies.

| Rôle | Couleur | Remarque |
|---|---|---|
| Fond de l'image | écru `#F7F2EA` | jamais de blanc pur en fond |
| Texte, cœur du schéma | brun `#26201A` | |
| Texte secondaire, lignes en italique | `#5C5248` (`--avt-text-muted`) | |
| Mots-clés du titre, encart conseil, ton « bonne réponse » | Klein `#002FA7` | une couleur maîtresse par image : le Klein |
| Piège : titre, pilules, pastille, trait | terracotta profond `#A34E30` | lisible en petit (D-47) |
| Piège : bord de carte mis en avant, trait de la bulle | terracotta `#C4623E` | jamais en texte courant |
| Carte « bonne réponse » | fond `#F3F6FD`, bord et pilules `#BFCBEA` | brume éclaircie |
| Carte neutre | fond `#FBF8F3`, bord et pilules `#D9CFBD` | galet éclairci |
| Carte « piège » | fond `#FBEFE8`, bord et pilules `#E6B9A4` | terracotta éclairci |
| Quartiers du cercle | brume `#E7EDF9` · galet `#E9E0D2` · rose terracotta `#F7E2D8` (piège : `#EFC1AC` quand il est désigné) | |
| Anneau pointillé | `#9C9083` | gris chaud, jamais noir |
| Intérieur des pilules, bord de la bulle | blanc `#FFFFFF` | seul usage du blanc pur |

Interdits : les pastels d'Herubel ; un dégradé Klein vers terracotta ; plus d'une carte terracotta ; du terracotta en texte de paragraphe.

## 4. Typographie et formats

| | Fil 4:5 · 1080 × 1350 | Vertical 9:16 · 1080 × 1920 (story, capsule) |
|---|---|---|
| Titre (Gilda) | 64-66 px | 62 px |
| Sur-titre (Jost 500, capitales, espacement 3-4 px) | 19-20 px | 28 px |
| Titre de carte (Jost 500) | 27 px | 34 px |
| Ligne en italique (Jost) | 20 px | 28 px |
| Pilule (Jost) | 19 px | 28 px |
| Lettres des quartiers (Gilda) | 44 px | 44 px |
| Phrase du conseil (Gilda) | 31 px | 38 px |
| Marges latérales | 40 px | 48 px |
| Rayon des cartes · des pilules | 22 px · 8 px | 26 px · 10 px |

En vertical, le texte est plus gros : la vidéo se regarde sur un téléphone tenu à bout de bras. Rien sous 19 px, Gilda jamais sous 15 px (règle de la charte).

**Zones à laisser libres en vertical** (constaté sur la capsule du 2026-10-27) : les 180 premiers pixels (nom du compte Instagram) et **tout ce qui est sous 1 680 px** (légende et boutons d'Instagram). Entre les deux, **toute la hauteur est occupée** : JB a demandé le 2026-10-27 de ne pas laisser le bas de l'écran vide. Répartition type : titre en haut (184-370), deux cartes, le schéma au centre, deux cartes, puis le conseil et la bulle (1 320-1 640).

Au format fil, l'image entière est visible : marges de 30 à 64 px suffisent.

## 5. Les quatre schémas

Un schéma par image, choisi selon la forme de l'idée. Les quatre ont été dessinés pour la question 1 du diagnostic (canevas « Schémas capsule prix », https://claude.ai/artifact/D9KLC5nfNWKgJtQ8pKPani).

| Schéma | Quand l'utiliser | Exemple |
|---|---|---|
| **Cercle** (référence, choisi par JB) | Plusieurs options autour d'un même sujet, dont une est le piège | « Les 4 façons de fixer son prix » : 4 quartiers A-D, cœur « Votre prix », anneau pointillé |
| **Flux** | Une suite de causes et de conséquences, de gauche à droite ou de haut en bas | « D'où vient votre prix, et ce que le marché en fait » : départ → affiché → réaction du marché |
| **Échelle** | Un classement du meilleur au pire | « Du plus solide au plus fragile » : 4 barreaux et une flèche le long |
| **Matrice** | Deux critères croisés, quatre cases | « Tient compte du bien / regarde le marché d'aujourd'hui » |

Le cercle est le gabarit par défaut : c'est celui que JB a retenu pour les capsules (« le diagramme avec les pointillés », 2026-10-27).

## 6. Le mouvement (capsules vidéo)

La capsule montre le schéma **en train de se construire**, au rythme de la voix d'Anne. Ordre et durées de la capsule du 2026-10-27 (`capsule-test-bulle-cercle-v3.mp4`) :

1. La bulle d'Anne apparaît (0,35 s), puis un trait terracotta fin en fait le tour une fois (1,1 s) et s'atténue à 35 %.
2. Le sur-titre, puis le titre **mot par mot** (0,06 s d'écart entre les mots).
3. Le cœur du schéma surgit avec un léger rebond.
4. **L'anneau pointillé se dessine** (1,2 s), puis **tourne lentement** pendant toute la scène (un tiers de tour en 12 s). Ce mouvement continu est la signature du style : jamais rapide, jamais arrêté.
5. Pour chaque option, toutes les 1,4 s : le quartier se remplit depuis le centre, le trait pointillé se dessine vers la carte, le point d'accroche apparaît, la carte glisse vers sa place.
6. Le piège : la pastille « Le piège » surgit, le quartier se fonce, le bord de la carte passe en terracotta et la carte tremble brièvement.
7. Le conseil **sort de la bulle** d'Anne (il grandit depuis le côté de la bulle), avec une petite queue de bulle de dialogue tournée vers elle.

Règles : des apparitions douces (fondu + court déplacement), un seul rebond par élément au plus, pas de rotation sauf l'anneau, rien qui clignote. Les traits entre cartes et schéma sont **pointillés fins** en vidéo (points de 2 px tous les 11 px), pleins dans l'image fixe.

## 7. La bulle d'Anne

Dans une capsule, Anne parle d'abord en plein écran, puis sa vidéo **se réduit en une bulle ronde** et le schéma se construit autour d'elle. Retours de JB du 2026-10-27, à respecter :

- **bord blanc net** de 8 px et **ombre douce** sous la bulle ; **pas de pointillés** autour de la bulle (« ça fait cheap ») ;
- **la tête entière** est dans le cercle, cadrage tête et épaules, jamais le menton ou le crâne coupés ;
- rayon d'environ 150 px, en bas à droite, à côté de l'encart conseil, au-dessus de la limite des 1 680 px ;
- référence : la bulle de webcam des vidéos d'Ali Abdaal ou de Loom.

Dans une image fixe, la photo d'Anne est un médaillon rond (104 px, liseré terracotta de 4 px) à gauche de l'encart conseil.

## 8. Écrire pour une infographie

- Un ou deux mots par pilule, cinq à huit mots par ligne en italique, une phrase pour le conseil.
- Nommer le public : un vendeur du Chablais.
- **« Offert », jamais « gratuit »** (D-48).
- **Aucun chiffre sans source** : un pourcentage ou un prix n'apparaît que s'il vient d'une source citée (DVF, INSEE, ventes d'Anne).
- Les avis clients sont cités tels quels, jamais corrigés.

## 9. Fabriquer

- **Image fixe** : une page HTML à la taille exacte (1080 × 1350 ou 1080 × 1920), polices du site en local, transformée en PNG par Playwright (le navigateur automatique installé dans l'environnement). Premier exemple : `/mnt/project-files/publication-quotidienne/schemas/schema-q01.html`.
- **Capsule vidéo** : HyperFrames (l'outil qui transforme des pages HTML animées en vidéo), avec le skill `montage-video-anne`. Gabarit des capsules : `/mnt/project-files/publication-quotidienne/capsules/` (générateur `_generateur/genere.py`, scène du schéma cercle avec la bulle : `capsules/test-bulle/compositions/cercle.html`).
- **Avant de livrer** : regarder l'image à taille téléphone ; vérifier les deux zones libres en vertical ; une seule carte piège ; aucun « gratuit » ; aucun chiffre sans source ; le conseil relu par Anne.

Les cartes de cette section sont des exemples à taille réduite, pas des gabarits de production : les gabarits vivent avec les capsules, dans le dossier partagé du projet. Quand le fil des publications fait évoluer le style, il met cette page à jour.
