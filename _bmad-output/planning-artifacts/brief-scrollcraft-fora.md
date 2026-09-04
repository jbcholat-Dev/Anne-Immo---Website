# Brief « scroll-craft » — reproduire la sensation de fora.so sur le site d'Anne

> Rédigé le 2026-09-04 à partir de : (1) l'inspection technique de <https://fora.so/> (DOM, styles calculés, transforms mesurées au défilement, captures desktop + mobile) ; (2) le transcript de Nate Herk *« Fable 5.1 FINALLY Kills AI Website Slop »* (2026-09-02) et sa fiche dans le Vault ; (3) l'état du chantier Website (`structure-site.md`, design system, maquettes lot 2).
> **Destinataire : la session Claude Code qui implémente.** Tout ce qui est chiffré ci-dessous a été mesuré sur le site réel, pas estimé.

---

## 0. Ce qu'on refait, et pourquoi la tentative d'hier a échoué

Trois choses font la sensation « premium » de Fora, et aucune n'est une question de style graphique :

1. **De la profondeur qui répond au scroll** — le hero est composé de quatre plans (ciel en dégradé, collines lointaines, collines proches, ligne d'arbres devant) qui **ne défilent pas à la même vitesse**. L'œil lit un espace, pas une image.
2. **Des cartes qui s'empilent** — dans la section « What you get », chaque carte se colle en haut de l'écran et la suivante vient la recouvrir. Le visiteur *manipule* le contenu au lieu de le faire défiler.
3. **Un défilement inertiel et des entrées de texte** — Lenis lisse la molette, et chaque bloc apparaît (opacité + petit déplacement) quand il entre dans l'écran. Rien de spectaculaire : le site *répond*.

La tentative d'hier a produit un « copier-coller d'école maternelle » parce qu'elle a reproduit **la composition** (des formes empilées) sans reproduire **la matière** (des plans photographiques cohérents, découpés avec transparence, éclairés de la même façon, voilés vers le fond) ni **la mécanique** (des vitesses distinctes, mesurées). Ce brief sépare explicitement les trois : § 1 la mécanique de Fora, § 2 les actifs à produire, § 3 la transposition au site d'Anne, § 4 le protocole de vérification.

**Règle de Nate Herk qui gouverne ce brief** : *on ne demande pas « premium », on donne une référence décomposée et on dit pourquoi on l'aime.* Fora est cette référence. Les mesures ci-dessous sont la décomposition.

---

## 1. Comment fora.so est monté — analyse technique

### 1.1 Stack

| Élément | Constat |
|---|---|
| Générateur | **Framer** (`meta generator = Framer`), export statique, aucun framework applicatif (pas de Next/Nuxt/Webflow). |
| Défilement | **Lenis 1.3.19** (`html.lenis.lenis-autoToggle`, feuille `lenis.css` depuis unpkg). C'est lui qui donne l'inertie « beurre ». |
| Animation | Le runtime Framer (`animator`) : effets d'apparition déclarés en JSON, transforms liées au scroll. **Ni GSAP, ni ScrollTrigger, ni Three.js, ni Locomotive.** Tout est reproductible en CSS + un peu de JS. |
| Typographie | Inter / Inter Display, H1 56 px, graisse 400, interlettrage **−2,24 px (−4 %)**, interligne 1,3, couleur `#FFF3F0`. |
| Fond | `body` noir. Hero : `radial-gradient(200% 83% at 50% 0px, #1B2228 0%, #353F44 42%, #D39794 100%)` — sombre en haut, rose-brume à l'horizon. |
| Page | 10 230 px de haut en desktop (1280 × 720), 13 854 px en mobile. Ordre : Hero → Intro (texte révélé) → Features (galerie à onglets) → About (**3 cartes empilées**) → Pricing → FAQ → Blog → CTA (**les plans reviennent**) → Footer. |
| Tiers | PostHog (analytics + session replay), Crisp (chat). Sans intérêt pour nous. |

### 1.2 Le hero à quatre plans — mesures

Structure DOM (section `Hero`, 1265 × 1269 px, `overflow: clip`), dans l'ordre de peinture :

| # | Calque (`data-framer-name`) | Nature | Position dans le hero | Taille affichée | Source |
|---|---|---|---|---|---|
| 0 | `bg gradient` | dégradé CSS radial (le ciel) | plein cadre | 1265 × 1269 | CSS |
| 1 | `background far` | **PNG avec alpha** : collines lointaines + première ligne d'arbres | top 809 (64 % de la hauteur) | 1265 × 467 (37 %) | 2464 × 909 px |
| 2 | `background` | **PNG avec alpha** : collines proches + ligne d'arbres | top 837 (66 %) | 1265 × 435 (34 %) | 2464 × 848 px |
| 3 | `content` | titre, sous-titre, CTA, **et la maquette de produit** (canvas 722 × 664, top 594, `z-index:1`) | plein cadre | — | — |
| 4 | `foreground` | **PNG avec alpha** : uniquement la ligne d'arbres, rien derrière | top 1022 (80 %), **collée au bord bas** | 1265 × 251 (20 %) | 2464 × 488 px |

Points qui font la différence :
- Les trois PNG sont **photographiques**, découpés sur transparence, dans **la même lumière** (crépuscule rosé), avec **le plan lointain voilé** : il est rendu à `opacity: 0.91`, et sa matière est plus claire et désaturée que les plans proches (perspective atmosphérique). Le plan avant est sombre, contrasté, net.
- Chaque PNG est **plus large que le viewport** (2464 px de source, `width: 100%`) et son bord bas est **opaque jusqu'à la dernière ligne de pixels** : aucune fente ne s'ouvre quand il se déplace.
- La maquette de produit (l'« écran de laptop ») est **prise en sandwich** : derrière la ligne d'arbres avant, devant les collines. C'est ce sandwich qui vend la profondeur — un objet du contenu vit *dans* le paysage.
- Le dégradé ciel est **du CSS, pas une image** : il ne pèse rien et se redimensionne sans couture.

**Parallaxe mesurée** (transform `translateY` de chaque calque selon `scrollY`, desktop, sans intervention de la souris — l'effet est **uniquement scroll**, testé) :

| Calque | translateY à scrollY = 591 | Coefficient | Vitesse apparente |
|---|---|---|---|
| `background far` | +155 px | **0,26 × scrollY** | monte à 74 % de la vitesse du contenu |
| `background` | +85 px | **0,144 × scrollY** | monte à 86 % |
| `foreground` | 0 | **0** | monte avec le contenu (100 %) |
| `content` (titre + laptop) | 0 | 0 | 100 % |

Les valeurs sont linéaires sur toute la hauteur du hero (à la fin : +310 / +170 / 0). Les calques portent `will-change: transform`. Le plan **avant** et le contenu bougent ensemble ; c'est le **fond** qui traîne. Effet net : la ligne d'arbres « ferme » le paysage en remontant plus vite que les collines qu'elle masque progressivement.

### 1.3 Les cartes empilées (section « About / What you get »)

Structure : un conteneur `Cards` de **1980 px** de haut (= 3 × 660) contenant : (a) un calque `Triggers` absolu, `overflow: clip`, avec **3 espaceurs de 660 px** qui fournissent la longueur de défilement ; (b) **3 cartes `position: sticky; top: 120px`**, hauteur 628 px, `z-index: 1`, sœurs dans le DOM.

Mécanique, mesurée toutes les 400 px de scroll :
- Chaque carte remonte normalement, se **colle à 120 px du haut** (hauteur de nav + marge), et y reste.
- La carte suivante, sœur DOM postérieure au même z-index, **peint par-dessus** la précédente en arrivant. Aucune transformation sur la carte recouverte : **pas de scale, pas de fondu, pas de flou** (`scale = 1.000`, `opacity = 1` à chaque échantillon). C'est du sticky pur.
- Quand la troisième est collée, les trois quittent l'écran ensemble à la fin du conteneur.
- Carte : fond `rgba(15,15,15,.85)`, rayon **16 px**, pas de bordure ni d'ombre ; deux colonnes — texte à gauche (`Copy`), **image à droite (585 px de large) qui déborde de 22 px au-dessus** du bord de la carte (elle fait 673 px pour une carte de 628).
- **Mobile (< 810 px) : pas d'empilement.** Les cartes passent en `position: relative` et s'enchaînent (≈ 1080 px chacune). Nate Herk fait le même choix sur son site et note qu'on pourrait « l'engineerer en un prompt » — voir § 3.3 pour la décision côté Anne.

### 1.4 Les autres mécanismes (moins structurants, mais ils font la texture)

- **Effets d'apparition** (déclarés en JSON dans la page, déclenchés à l'entrée dans le viewport, une seule fois). Trois recettes seulement, réutilisées partout :
  - *Titre* : opacité 0 → 1 **et y −36 → 0**, tween **1 s**, ease `cubic-bezier(0.44, 0, 0.56, 1)` — le titre descend en place.
  - *Sections et cartes* : opacité 0 → 1 **et y +72 → 0**, spring 1 s sans rebond — le bloc monte en place.
  - *Petits éléments* : opacité 0 → 1, spring 0,5 s, sans déplacement.
- **Texte révélé au scroll** (section « Intro ») : deux paragraphes en grand corps ; le premier est blanc, le second gris sombre, et la lumière **descend dans le texte au rythme du scroll** (observé en mobile : révélation par ligne / paragraphe, pas par mot). Implémentation classique : progression du scroll de la section → opacité des lignes.
- **Galerie à onglets** (Features) : 4 calques absolus superposés, **crossfade par opacité** (1 / 0 / 0 / 0), déclenché par les onglets.
- **Navigation** : en desktop, la nav du hero défile avec lui, puis une **seconde nav fixe** (`desktop-scroll`, 48 px, `z-index: 7`) apparaît quand on quitte le hero. En mobile : barre fixe de 69 px, `rgba(0,0,0,.85)` + `backdrop-filter: blur(8px)`.
- **Le CTA final réutilise le hero** : la maquette produit revient, et une bande de collines (image « rolling landscape », 190 px) ferme la page au-dessus du footer. Le motif de profondeur ouvre *et* ferme le site — c'est ce que Nate appelle « the layering comes back ».

### 1.5 Ce qu'il ne faut PAS reproduire

- Le noir. La charte d'Anne est écru / brun ; on transpose la **mécanique**, pas la palette (§ 3).
- Le canvas de « laptop » : c'est un mock produit SaaS. Chez Anne, l'objet pris en sandwich est un **bien réel** (§ 3.1).
- Framer lui-même : la base actée est statique et versionnée (`architecture-brief.md`). Tout ci-dessus se fait en CSS + JS léger.

---

## 2. Les actifs à produire — la cause réelle de l'échec d'hier

Aucun des trois mécanismes ne tient sans des **plans photographiques cohérents**. C'est un travail de production d'image, à faire *avant* d'écrire une ligne de code. Spécification :

### 2.1 Quatre plans, pour le Léman

| Plan | Contenu (hypothèse JB : « la forêt devant devient le lac ») | Spécification technique |
|---|---|---|
| Ciel | **Dégradé CSS** — pas d'image. Palette charte : `--avt-brume #E7EDF9` en haut → écru `#F7F2EA` à l'horizon (variante : léger voile rosé au petit matin). | `radial-gradient` ou `linear-gradient`, plein cadre du hero |
| Arrière | **Les Alpes du Chablais, reconnaissables** (Dents du Midi / Grammont / rive suisse). Voilé, clair, désaturé. | PNG alpha, **≥ 2560 px de large**, hauteur ≈ 37 % du hero, ancré au bas du hero, rendu à `opacity ≈ 0.9` |
| Milieu | **La rive opposée et les collines proches** (ou, si on inverse : les collines du Chablais côté France). Plus contrastée que l'arrière. | PNG alpha, ≥ 2560 px, ≈ 34 % du hero, ancré bas |
| Avant | **La surface du lac** au premier plan, avec un bord de rive au bas (roseaux, galets, ponton) pour donner une ligne d'accroche — c'est l'équivalent de la ligne d'arbres de Fora. Net, contrasté. | PNG alpha, ≥ 2560 px, ≈ 20 % du hero, **collé au bord bas, opaque jusqu'à la dernière ligne** |

Exigences non négociables, toutes tirées de ce que Fora fait bien et de ce qu'hier a raté :
1. **Une seule lumière** pour les trois plans (même heure, même direction). Trois images de sources différentes se voient immédiatement, et c'est ça qui fait « collage ».
2. **Perspective atmosphérique** : le plan arrière est plus clair, moins saturé, moins contrasté que le plan milieu, lui-même moins que l'avant. Sans ça, les plans se lisent comme des découpes plates — l'effet « maternelle ».
3. **Matière photographique**, jamais vectorielle ni illustrée. Pas de formes lisses, pas d'aplats.
4. **Découpe sur transparence propre** (bords doux, pas de halo blanc), **débord latéral** (≥ 10 % de chaque côté du viewport le plus large ciblé) et **bord bas opaque** : le plan se déplace, il ne doit jamais découvrir le ciel par en dessous.
5. **Le territoire doit être reconnaissable** comme le Léman et le Chablais (`structure-site.md` § 1.1) — une montagne générique perd contre une vidéo où l'on reconnaît le lac.

### 2.2 Comment les produire (deux voies, à trancher par JB)

- **Voie A — décomposition d'une vraie photo** (recommandée pour la crédibilité) : une photo d'Anne ou une prise de vue drone (actif A-14 de l'inventaire), séparée en plans par masque de profondeur / détourage (skill `image-craft` pour le détourage ; reconstruction des zones masquées par inpainting). Avantage : lumière unique garantie, lieu réel. Coût : une bonne photo source, cadrée large, horizon au tiers inférieur.
- **Voie B — génération cohérente** (Gemini, clé disponible) : générer **une seule scène** puis la découper en plans, jamais trois images indépendantes. Prompt à structurer plan par plan avec la même description de lumière. Risque : montagnes plausibles mais pas *les* Dents du Midi — à valider avec Anne, qui les reconnaît.

Dans les deux cas, livrer en **WebP + PNG de secours**, trois tailles (2560 / 1600 / 900) via `srcset`, et un **JPEG plat de repli** (les quatre plans fusionnés) pour `prefers-reduced-motion` et pour l'image sociale.

### 2.3 L'objet pris en sandwich

À la place du laptop de Fora : **une carte de bien réel**, cadre arrondi (`--avt-radius-card` 12 px, ou 16 px comme Fora), placée entre le plan milieu et le plan avant, qui contient **la séquence vidéo drone** (CAP-1 impose au moins une vidéo sur l'accueil) avec sa première image en poster. Ça résout au passage l'arbitrage photo fixe / vidéo drone de `structure-site.md` § 1.1 : **les deux** — photo en plans pour le paysage, vidéo dans l'objet. Le bord bas de la carte passe **derrière** le plan avant (la rive) : c'est le geste qui installe la profondeur.

---

## 3. Transposition au site d'Anne — ce que Claude Code implémente

Contraintes héritées, non rediscutables : charte v1 (Italiana / DM Sans, écru dominant, Klein `#002FA7`, terracotta `#C4623E`), `structure-site.md` (ordre des sections, CTA unique du hero, nav qui ne disparaît jamais, mobile-first, < 3 s utile), SPEC v3 (CAP-1 : ≥ 1 vidéo + 6 photos de biens sur l'accueil ; `prefers-reduced-motion` respecté).

### 3.1 § 1.1 Ouverture — le hero à quatre plans

- Hauteur du hero : **100 vh minimum, ~ 1,3 × la hauteur du viewport en desktop** (Fora : 1269 px pour 720 de viewport — le paysage occupe le tiers bas, le titre le tiers haut, la carte-vidéo au milieu).
- Composition : ciel CSS → plan arrière → plan milieu → **contenu** (nom « Anne VIAL-TISSOT » en Italiana, ligne de positionnement, **un seul CTA** vers le diagnostic, et la carte-vidéo) → plan avant.
- Parallaxe : reprendre **exactement** les coefficients mesurés — arrière `translateY = 0.26 × scrollY`, milieu `0.144 × scrollY`, avant et contenu `0`. Linéaire, bornée à la hauteur du hero. Calques en `will-change: transform`. Implémentation : `requestAnimationFrame` sur l'événement scroll (ou `animation-timeline: scroll()` avec repli JS). Pas de réaction à la souris.
- Titre : entrée « descend en place » (opacité 0 → 1, y −36 → 0, 1 s, ease `[0.44, 0, 0.56, 1]`).
- Texte sur fond clair : la charte impose brun `#26201A` sur écru. Si la lisibilité du nom sur le ciel pose problème, un voile écru dégradé derrière le bloc de texte, jamais une ombre portée.
- **Mobile** : les plans restent (ils sont légers), recadrés en portrait ; la carte-vidéo passe sous le titre, le CTA reste au-dessus de la ligne de flottaison (`structure-site.md` § 1.1). Coefficients de parallaxe divisés par deux (les hauteurs de hero sont plus courtes).
- **`prefers-reduced-motion`** : parallaxe et vidéo coupées, JPEG fusionné en fond, aucune entrée animée.

### 3.2 § 1.3 Ventes récentes — les cartes empilées remplacent le carrousel

Décision de JB (2026-09-04) : **le carrousel horizontal de la maquette lot 2 est remplacé par l'empilement sticky**, une carte par bien vendu.

- Structure : conteneur de hauteur `N × pas` avec `N` cartes sœurs `position: sticky; top: <hauteur de nav + 24 px>`. Pas de spacer invisible nécessaire si chaque carte est enveloppée dans un bloc de hauteur `pas` (équivalent CSS pur des `Triggers` de Fora).
- Pas de défilement par carte : **~ 70 vh** (Fora : 660 px pour 720 de viewport). Avec **6 cartes** (CAP-1), la section consomme ≈ 4,2 viewports de scroll ; c'est plus que Fora (3 cartes) mais chaque écran montre une grande photo — c'est exactement l'objectif de § 1.3 (« photos grandes, pas des vignettes »). ⚠️ **Point de décision à valider avec Anne : 6 cartes sur l'accueil, ou 4 + « Toutes les ventes »**. Le brief `structure-site.md` demandait six vues ; l'empilement les rend praticables.
- Carte : fond `--avt-galet #E9E0D2` (ou écru sur fond galet, à tester), rayon 12–16 px, **sans ombre ni bordure** (Fora) — la superposition suffit à créer le relief. Deux colonnes desktop : à gauche la commune (Italiana), une phrase du récit d'Anne (DM Sans), le lien « Voir cette vente → » en Klein ; à droite **la photo du bien, grande, qui déborde légèrement du bord haut** (Fora : +22 px). Pas de prix, pas de surface (§ 1.3).
- La première carte de la pile peut contenir la vidéo si l'ouverture ne la porte pas (règle CAP-1 de `structure-site.md`).
- Aucune transformation sur les cartes recouvertes (Fora n'en met pas ; ne pas ajouter de scale/flou « pour faire joli » — c'est précisément le genre d'ajout qui fait *AI slop*).
- **Mobile** : **on garde l'empilement**, contrairement à Fora, parce que la photo doit rester grande et que le balayage horizontal cache le contenu (`structure-site.md`) ; carte pleine largeur, photo au-dessus du texte, pas ≈ 80 vh, `top` = hauteur de la barre mobile + 12 px. Repli en flux simple si `prefers-reduced-motion`. Vérifier sur 375 px que la carte entière tient sous la barre (sinon réduire la photo, jamais le texte).
- Accessibilité : chaque carte est un `article` avec titre ; la pile reste lisible sans CSS ; navigation clavier vers chaque « Voir cette vente ».

### 3.3 Le reste de l'accueil — la texture

- **Entrées de sections** : les trois recettes de Fora, et seulement celles-là, appliquées partout (`IntersectionObserver`, seuil 15–20 %, une fois). Sections : y +72 → 0 spring 1 s ; titres : y −36 → 0 tween 1 s ; petits éléments : fondu 0,5 s.
- **Texte révélé au scroll** : réservé au **refrain de la marque** (§ 1.4 : « Pas de mauvaise surprise · pas de dossier qui traîne · des ventes qui vont au bout ») — trois lignes en grand corps Italiana, révélées ligne par ligne au scroll, de galet `#E9E0D2`/brun clair vers brun `#26201A`. Un seul usage sur la page ; ailleurs ce serait du bruit.
- **Navigation** (`structure-site.md` § 0) : reprendre la double nav de Fora — nav de page dans le hero, puis **barre fixe réduite** avec `backdrop-filter: blur(8px)` et fond écru à 85 % dès que le hero est passé. Le CTA « Diagnostic » y reste. Mobile : barre fixe de ~64 px, logo + CTA + menu.
- **Défilement** : **Lenis** (≈ 10 Ko, `lenis.css`), désactivé si `prefers-reduced-motion`. C'est un composant de la « sensation » à part entière, pas un gadget.
- **Fermeture** (§ 1.8 « Parler à Anne ») : **les plans reviennent** en bande basse (plan avant seul, ~ 190 px, au-dessus du pied de page) — le motif ouvre et ferme la page.
- **Galerie à onglets** : pas de besoin identifié sur l'accueil d'Anne. Si § 1.4 (les trois axes du Système 360™) veut une image par axe, le crossfade par opacité de Fora est la bonne recette.

### 3.4 Contraintes de performance et de repli

- Le hero est le **LCP** : poster de la carte-vidéo et plan avant en `fetchpriority="high"`, les deux autres plans en `loading="eager"` mais dimensionnés (900 px en mobile). La vidéo se charge **après** le premier rendu.
- Budget images du hero en mobile : **< 350 Ko** au total (WebP). À mesurer, pas à estimer.
- Aucune dépendance à Framer Motion, GSAP ou React pour ces effets ; le HTML doit rester lisible sans JS (pile dépliée, plans statiques).

---

## 4. Protocole de vérification — obligatoire avant de dire « fait »

Repris de Nate Herk (*« if it's not taking screenshots and saying "this looks out of bounds, this color's off, let me fix that" — then what are you doing ? »*) et de la règle de JB « prouver le travail ».

1. **Défilement image par image**, desktop 1280 × 720 puis mobile 375 × 812 : une capture tous les 300 px sur le hero et sur la pile de cartes, tous les 600 px ailleurs. Regarder chaque capture, pas seulement la première et la dernière.
2. **Points de contrôle du hero** : aucune fente entre un plan et le bas du hero pendant tout le défilement ; aucun halo clair sur les bords des découpes ; la carte-vidéo passe bien *derrière* le plan avant ; le titre reste lisible sur le ciel à chaque position.
3. **Points de contrôle de la pile** : `top` de collage = hauteur réelle de la nav fixe + marge (mesurer la nav, ne pas coder 120 en dur) ; la carte N+1 recouvre N sans clignotement ; les six cartes quittent l'écran ensemble ; la dernière ne laisse pas de trou avant la section suivante.
4. **Le « hard cut » de Nate** : chercher explicitement les raccords brutaux (fin de parallaxe, fin de pile, changement de fond). Chaque transition de section doit être vue en capture.
5. **Mouvement réduit** : émuler `prefers-reduced-motion: reduce` et vérifier que tout est statique et complet (JPEG fusionné, pile dépliée, pas de Lenis).
6. **Mesures** : LCP mobile < 2,5 s sur réseau « Fast 3G » émulé ; poids du hero mobile < 350 Ko ; aucune erreur console.
7. **Preuve** : les captures sont déposées dans `maquettes/verification/<date>/` et listées dans le compte rendu, avec ce qui a été corrigé entre deux passes. Ce qui n'a pas été capturé est dit non vérifié.

---

## 5. Décisions ouvertes (à trancher par JB, ne bloquent pas le début du travail)

1. **Sens des plans** : « le lac devant » (hypothèse JB : plan avant = surface du lac + bord de rive, arrière = Alpes) ou « la rive devant » (plan avant = roseaux/pontons, milieu = lac, arrière = montagnes). La mécanique est la même ; seule la photo source change. Recommandation : **le lac devant**, parce qu'une surface d'eau nette au premier plan est la seule chose qui dise « Léman » sans légende.
2. **Voie de production des plans** : décomposition d'une vraie photo (A) ou génération cohérente (B) — § 2.2.
3. **Nombre de cartes empilées sur l'accueil** : 6 (CAP-1 littéral) ou 4 + index — § 3.2.
4. **Empilement en mobile** : gardé (recommandation) ou flux simple comme Fora.

---

## Annexe — références à ouvrir pendant l'implémentation

- Site de référence : <https://fora.so/> (Framer + Lenis). Sections à regarder : hero (0–1270 px), « What you get » (3450–5740 px), CTA final (8860 px).
- Les trois plans de Fora, pour *voir* ce qu'est un calque correct (ne pas réutiliser, ce sont leurs actifs) : `framerusercontent.com/images/h5VHoQg2qBhfygdenEQ0WUtEZU.png` (arrière, 2464 × 909), `T6hTfVKiQ81oLHCljxjb0WPLHY8.png` (milieu, 2464 × 848), `rNwNiQxFN2tkAEI5eUdmAxB9v4.png` (avant, 2464 × 488).
- Transcript de Nate Herk : `The Vault/wiki/sources/transcript-fable-51-website-slop.md` — ses sept intrants : charte · les trois P (douleur / personne / promesse) · réactivité au scroll · inspiration · composants · mobile · vérification. Sources de composants qu'il cite : 21st.dev, godly.design, Awwwards (par secteur), Motion Sites.
- Chantier : `structure-site.md` (§ 0 nav, § 1.1 ouverture, § 1.3 ventes), `design-system/tokens/tokens.css`, maquettes `maquettes/lot-2-canvas/` (HeroA/B/C, Main).
- ⚠️ Gotcha outillage : le panneau Browser de Claude Code rend **noir** toute capture sous le hero sur un site Lenis/Framer, et Chrome piloté gèle sur les captures en rafale — pour la vérification (§ 4), servir le site en local et capturer avec Playwright/CDP en `fullPage`, pas via les panneaux.
