# Infographies et images des réseaux — la règle

Section du design system ajoutée le 2026-10-27 (story 8.24, décision D-49). Elle dit comment fabriquer toute image ou vidéo « schéma » d'Anne : publications du fil Facebook et Instagram, carrousels, stories, capsules vidéo du diagnostic, posts LinkedIn.

**Ce que ça change** : une idée dense (les quatre façons de fixer un prix, les étapes d'une vente) se lit en un coup d'œil, et chaque image se reconnaît comme « une image d'Anne » sans signature criarde. N'importe quel fil Claude, ou un graphiste, peut en produire une nouvelle sans réinventer la mise en page.

Cartes de la section (dans le design system de claude.ai/design, groupe « Infographies ») :

| Fichier | Ce qu'il montre |
|---|---|
| `schema-flux.html` | **Référence** : le schéma « flux », d'où part le prix, puis ce que fait le marché (fil 1080 × 1350) |
| `schema-echelle.html` | **Référence** : le schéma « échelle », du plus solide au plus fragile (fil 1080 × 1350) |
| `exemple-couches.html` | Exemple tiré des images de Pierre Herubel : des couches empilées, chacune avec un trait pointillé, des pastilles d'icônes et « Nourri par » |
| `exemple-boucle.html` | Exemple tiré des images de Pierre Herubel : des anneaux autour du sujet, une boucle pointillée fléchée et quatre cartes |
| `capsule-bulle.html` | La dernière image d'une capsule vidéo (1080 × 1920) : schéma échelle, bulle d'Anne, zones à laisser libres |
| `pieces.html` | Les pièces détachées : cartes (trois tons), pilules, pastille « Le piège », traits, encart « Le conseil d'Anne », bulle |

## 1. D'où vient le style

Référence donnée par JB le 2026-10-26 : trois infographies de **Pierre Herubel** (LinkedIn) : « The 4 layers of a content brain », « Knowledge layer » et « Content loop ». Captures et note : `/mnt/project-files/publication-quotidienne/inspiration/` (dossier partagé du projet, hors du dépôt).

On reprend : un fond uni et clair ; un titre court et grand ; **un schéma qui porte l'idée** (flux, échelle, couches, boucle) ; des **cartes arrondies** à fond pâle et bord fin, repérées par une lettre ou un numéro, avec un titre, une ligne en italique et des **étiquettes « pilule »** ; des **traits fins, souvent pointillés**, qui relient les pièces ; des pastilles d'icônes rondes sur les traits ; une signature discrète. Beaucoup d'information, mais chaque élément tient en un ou deux mots.

On adapte : la palette (celle d'Anne, **jamais les pastels bleu, jaune, vert, rose d'Herubel**), les polices (Gilda Display et Jost), les formats des réseaux, et la signature (le conseil d'Anne avec sa photo, puis l'appel au diagnostic offert).

## 2. Anatomie d'une infographie

De haut en bas, toujours dans cet ordre :

1. **Sur-titre** (facultatif) : petites capitales Jost 500, espacées, terracotta profond. Ex. « Question 1 du diagnostic vendeur ».
2. **Titre** : Gilda Display, deux lignes au plus, centré. Les mots qui portent l'idée en bleu Klein (« ce que le marché en fait », « solide »), le mot du piège éventuellement en terracotta profond (« fragile »), le reste en brun.
3. **Sous-titre** (facultatif, format fil) : une ligne Jost italique, texte secondaire. Sert à citer la question d'origine ou à dire à qui l'on parle.
4. **Schéma** : un seul par image (voir § 5).
5. **Cartes** : de 2 à 4 (ou les barreaux de l'échelle, les bandes des couches). Chaque carte = une lettre ou un numéro + un titre court, une ligne en italique, une à trois pilules ou rangées.
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
| Carte neutre | fond `#FBF8F3` (ou `#EFE8DC`), bord et pilules `#D9CFBD` | galet éclairci |
| Carte « piège » ou troisième étape | fond `#FBEFE8`, bord et pilules `#E6B9A4` | terracotta éclairci |
| Anneaux (boucle) | `#F3F6FD`, `#E7EDF9`, `#D9E2F5` du large au petit | brume, du plus clair au plus soutenu |
| Traits et flèches neutres | gris chaud `#8A7F72` ou brun | jamais noir pur |
| Intérieur des pilules et des rangées, bord de la bulle | blanc `#FFFFFF` | seul usage du blanc pur |

Une suite d'étapes sans piège (les couches) peut utiliser les trois tons (brume, galet, terracotta éclairci) pour distinguer les étapes. Dès qu'il y a un piège, le ton terracotta lui est réservé.

Interdits : les pastels d'Herubel ; un dégradé Klein vers terracotta ; plus d'une carte « piège » ; du terracotta en texte de paragraphe.

## 4. Typographie et formats

| | Fil 4:5 · 1080 × 1350 | Vertical 9:16 · 1080 × 1920 (story, capsule) |
|---|---|---|
| Titre (Gilda) | 62-66 px | 62 px |
| Sur-titre (Jost 500, capitales, espacement 3-4 px) | 19-20 px | 28 px |
| Titre de carte (Jost 500, ou Gilda pour la boucle) | 27-36 px | 34-36 px |
| Ligne en italique (Jost) | 20-26 px | 28 px |
| Pilule ou rangée (Jost) | 19-22 px | 28 px |
| Phrase du conseil (Gilda) | 29-31 px | 38 px |
| Marges latérales | 40-64 px | 48 px |
| Rayon des cartes · des pilules | 22-24 px · 8-12 px | 26 px · 10 px |

En vertical, le texte est plus gros : la vidéo se regarde sur un téléphone tenu à bout de bras. Rien sous 19 px, Gilda jamais sous 15 px (règle de la charte).

**Zones à laisser libres en vertical** (constaté sur la capsule du 2026-10-27) : les 180 premiers pixels (nom du compte Instagram) et **tout ce qui est sous 1 680 px** (légende et boutons d'Instagram). Entre les deux, **toute la hauteur est occupée** : JB a demandé le 2026-10-27 de ne pas laisser le bas de l'écran vide. Répartition type : titre en haut (196-370), le schéma au milieu (440-1290), puis le conseil et la bulle (1 340-1 650).

Au format fil, l'image entière est visible : des marges de 30 à 64 px suffisent.

## 5. Les schémas

Un schéma par image, choisi selon la forme de l'idée. Le 2026-10-27, JB a retenu **le flux et l'échelle** parmi les quatre versions du canevas « Schémas capsule prix » (https://claude.ai/artifact/D9KLC5nfNWKgJtQ8pKPani) ; le cercle en quartiers et la matrice ne sont pas retenus.

| Schéma | Quand l'utiliser | Exemple |
|---|---|---|
| **Flux** (référence) | Des causes qui mènent à des conséquences, de gauche à droite | « D'où vient votre prix, et ce que le marché en fait » : quatre départs → votre prix → deux réactions du marché. Traits pleins à angles droits ; le piège arrive en pointillé terracotta |
| **Échelle** (référence) | Un classement, du meilleur au pire | « Les 4 points de départ d'un prix, du plus solide au plus fragile » : barreaux empilés, flèche « solide → fragile » sur le côté ; la case vide (pas encore de prix) a un bord pointillé |
| **Couches** (d'après Herubel) | Ce qui compose un tout, couche par couche | « Un prix juste se construit en trois couches » : une bande par couche, un trait pointillé de la source vers le sujet, des pastilles d'icônes sur le trait, une ligne « Nourri par » en pilules |
| **Boucle** (d'après Herubel) | Un cycle qu'on recommence | « Une vente qui ne s'enlise pas tourne en quatre temps » : anneaux autour du sujet, boucle pointillée avec quatre flèches, une carte par temps aux quatre coins |

Pour une nouvelle question, partir du flux ou de l'échelle ; les couches et la boucle sont des exemples à faire valider à JB avant d'en faire une série.

## 6. Le mouvement (capsules vidéo)

La capsule montre le schéma **en train de se construire**, au rythme de la voix d'Anne. Principes repris des essais du 2026-10-26 et 2026-10-27 (`capsule-test-bulle-echelle-v2.mp4`, `capsule-test-bulle-cercle-v3.mp4`) :

1. La bulle d'Anne apparaît (0,35 s), puis un trait terracotta fin en fait le tour une fois (1,1 s) et s'atténue.
2. Le sur-titre, puis le titre **mot par mot** (0,06 s d'écart entre les mots).
3. Le schéma se construit **dans le sens de la lecture** : pour l'échelle, la flèche « solide → fragile » descend pendant que les barreaux arrivent un à un ; pour le flux, les cartes de départ arrivent, les traits se dessinent vers « Votre prix », puis les deux branches vers le marché ; pour les couches, une bande après l'autre, le pointillé se dessinant de la source vers le sujet ; pour la boucle, les anneaux du centre vers l'extérieur, puis la boucle pointillée qui se dessine et **tourne lentement** pendant toute la scène.
4. Chaque carte : fondu et court glissement vers sa place, environ toutes les 1,4 s.
5. Le piège : la pastille « Le piège » surgit, le bord de la carte passe en terracotta et la carte tremble brièvement.
6. Le conseil **sort de la bulle** d'Anne (il grandit depuis le côté de la bulle), avec une petite queue de bulle de dialogue tournée vers elle.

Règles : des apparitions douces (fondu + court déplacement), un seul rebond par élément au plus, pas de rotation sauf la boucle, rien qui clignote. Un pointillé qui se dessine est le geste signature du style : jamais rapide.

## 7. La bulle d'Anne

Dans une capsule, Anne parle d'abord en plein écran, puis sa vidéo **se réduit en une bulle ronde** et le schéma se construit à côté d'elle. Retours de JB du 2026-10-27, à respecter :

- **bord blanc net** de 8 px et **ombre douce** sous la bulle ; **pas de pointillés** autour de la bulle (« ça fait cheap ») ;
- **la tête entière** est dans le cercle, cadrage tête et épaules, jamais le menton ou le crâne coupés ;
- rayon d'environ 150 px, en bas à droite, à côté de l'encart conseil, au-dessus de la limite des 1 680 px ;
- référence : la bulle de webcam des vidéos d'Ali Abdaal ou de Loom.

Dans une image fixe, la photo d'Anne est un médaillon rond (84 à 104 px, liseré terracotta de 4 px) à gauche de l'encart conseil.

## 8. Écrire pour une infographie

- Un ou deux mots par pilule, cinq à huit mots par ligne en italique, une phrase pour le conseil.
- Nommer le public : un vendeur du Chablais.
- **« Offert », jamais « gratuit »** (D-48).
- **Aucun chiffre sans source** : un pourcentage ou un prix n'apparaît que s'il vient d'une source citée (DVF, INSEE, ventes d'Anne).
- Les avis clients sont cités tels quels, jamais corrigés.

## 9. Fabriquer

- **Image fixe** : une page HTML à la taille exacte (1080 × 1350 ou 1080 × 1920), polices du site en local, transformée en PNG par Playwright (le navigateur automatique installé dans l'environnement). Les cartes de ce dossier en sont des exemples : le contenu de chacune est une image complète, affichée réduite.
- **Capsule vidéo** : HyperFrames (l'outil qui transforme des pages HTML animées en vidéo), avec le skill `montage-video-anne`. Gabarit des capsules : `/mnt/project-files/publication-quotidienne/capsules/` (générateur `_generateur/genere.py` ; scène schéma avec la bulle : `capsules/test-bulle/compositions/echelle.html`).
- **Avant de livrer** : regarder l'image à taille téléphone ; vérifier les deux zones libres en vertical ; une seule carte piège ; aucun « gratuit » ; aucun chiffre sans source ; le conseil relu par Anne.

Quand le fil des publications fait évoluer le style, il met cette page à jour.
