# Brief de maquette complète — Claude Design

**Version 1** (2026-09-08). Remplace le cadrage des lots 1 et 2 (`maquettes/`) comme **commande de maquette**. Ne remplace pas `structure-site.md` v3 (le *quoi* : pages, sections, états) ni `brief-scrollcraft-fora.md` (la mécanique mesurée de la référence) : il les assemble en une commande unique.

**Objectif :** une maquette **complète** du site — les 10 pages, en desktop et en mobile, avec leurs états — **validée par Anne avant la vague 2 de l'architecture et avant tout code.** La maquette du lot 2 était une bonne première passe ; elle ne couvrait que l'accueil, le diagnostic et les résultats.

**Destinataire :** la session qui produit la maquette (skill `/design` de Claude Code, ou claude.ai/design). Le prompt prêt à coller est en § 8.

---

## 1. La direction, en une phrase

**La sensation de [fora.so](https://fora.so/#about) — de la profondeur qui répond au défilement, des cartes qui s'empilent, une page qui répond — dans le monde d'Anne : écru, Klein, terracotta, Italiana, le Léman.** Pas un clone de Fora : sa mécanique, avec nos matières.

Ce qui fait Fora et qu'on reprend, mesuré dans `brief-scrollcraft-fora.md` § 1 :
1. **Un hero à quatre plans** qui ne défilent pas à la même vitesse (arrière 0,26 × scroll, milieu 0,144 ×, avant et contenu 0).
2. **Des cartes qui s'empilent** en sticky, chacune recouvrant la précédente — pour les ventes récentes, à la place du carrousel.
3. **Un défilement inertiel et des entrées de section** (opacité + petit déplacement, une fois).

Ce qu'on ne reprend pas : ses actifs, ses couleurs, sa typographie, ses textes.

## 2. Le standard de conception — scroll-craft

Le skill [scroll-craft](https://github.com/nateherkai/scroll-craft) (Nate Herk) a été développé dans cette direction exacte : heros à plans indépendants, scroll comme ligne de temps, vérification image par image. **C'est le skill qui servira au build.** La maquette doit donc être *constructible avec son moteur*, et elle reprend dès maintenant ses règles de conception qui s'appliquent à une maquette :

| Règle scroll-craft | Ce que ça impose à la maquette |
|---|---|
| **La courbe de sentiment avant les sections** — une émotion par section, deux sections adjacentes ne portent jamais la même | § 4 ci-dessous, à respecter et à faire sentir dans les artboards |
| **Un seul sommet** — le moment que le visiteur raconte ; il reçoit le meilleur actif, le silence avant lui et le plus d'espace | Le sommet de l'accueil est **la pile des ventes** (§ 1.3). Le hero est l'ouverture, pas le sommet |
| **Un geste signature** — une interaction qui n'existe que sur ce site, pas un réglage d'un effet connu | Proposition § 5, à trancher par JB |
| **Le hero en plans** — arrière, sujet, avant, atmosphère, planifiés avant les actifs ; profondeur par occlusion et vitesses différentes, titre lisible | Les quatre plans sont dessinés **séparément** dans la maquette (un artboard « Hero — plans ») |
| **Mobile art-directé à part** — pas une réduction du desktop | Chaque page a son artboard mobile *composé*, pas redimensionné |
| **Plancher typographique** — deux familles, mesure 45-75 caractères, interlignage inverse de la mesure | Italiana + DM Sans (charte), rien d'autre ; le corps de texte tient dans 65 caractères |
| **Liste de refus** | § 7 |

Ce qu'on ne prend pas de scroll-craft à ce stade : le choix d'une « grammaire » unique de landing page (le site a 10 pages, pas un seul film) et la génération d'actifs (les actifs sont ceux d'Anne — § 6).

## 3. Ce qu'il faut livrer

**Un canvas Claude Design** avec, pour chacune des 10 pages de `structure-site.md` v3, **un artboard desktop (1440 × hauteur réelle) et un artboard mobile (390 × hauteur réelle)**, plus les états. Nommage des artboards : `NN-page-desktop`, `NN-page-mobile`, `NN-page-etat-<nom>`.

| # | Page | Artboards en plus des deux vues | Source |
|---|---|---|---|
| 00 | Navigation | en-tête au repos / réduit au scroll ; menu mobile déplié ; pied de page ; sélecteur de langue ouvert | § 0 |
| 01 | Accueil | **Hero — plans** (les 4 plans séparés + le composite) ; **Pile des ventes** (3 positions de scroll : carte 1 seule, carte 3 recouvrant, sortie de pile) ; refrain révélé (2 états) ; fermeture avec les plans | § 1.1-1.8 |
| 02 | Ventes | index ; fiche story ; index anglais plus court (story non traduite absente) ; état « aucune story » | § 2 |
| 03 | La méthode | — | § 3 |
| 04 | Anne | — | § 4 |
| 05 | Diagnostic (landing) | aperçu de partage (1200 × 630) | § 5 |
| 06 | Diagnostic (parcours) | les 3 gabarits d'écran (choix unique, choix multiple, texte libre) ; barre « Question n / 15 » ; retour arrière ; confirmation d'abandon | § 6 |
| 07 | Résultats | gate de capture ; erreurs de champ ; échec d'envoi avec renvoi ; résultats sortie A ; résultats sortie B ; confirmation guide téléchargé | § 7 |
| 08 | Contact / RDV | calendrier Cal.com intégré **avec sa case d'acceptation** ; formulaire ; confirmation envoyée ; créneau réservé ; calendrier vide | § 8 |
| 09 | Guide | formulaire (téléphone facultatif) ; confirmation | § 9 |
| 10 | Légal | mentions ; confidentialité ; cookies ; **bandeau variante A (aucun) et variante B (repli)** | § 10 |

Plus **un artboard « Décisions à trancher »** qui montre côte à côte les options encore ouvertes (§ 9) pour qu'Anne choisisse en séance, et **un artboard « Composants »** : boutons (pilule terracotta), champs, cartes, la ligne-signature, les états focus/erreur.

**Format d'approbation :** le canvas est le support ; un export PDF de tous les artboards est déposé dans `maquettes/lot-3-complet/` avec un `DECISIONS.md` (ce qui a été choisi, ce qui reste ouvert).

## 4. La courbe de sentiment de l'accueil

Une émotion par section, dans l'ordre de `structure-site.md` § 1. La maquette doit la faire sentir en statique ; le build la fera sentir au scroll.

| § | Section | Émotion | Ce qui la cause à l'écran |
|---|---|---|---|
| 1.1 | Ouverture | **Reconnaissance** | Le Léman en plans, le nom en Italiana, un seul bouton. « C'est chez nous. » |
| 1.2 | La preuve, tout de suite | **Confiance** | La note Immodvisor, des chiffres réels, pas de superlatif |
| 1.3 | Ventes récentes | **Projection** — *le sommet* | Les maisons vendues qui s'empilent sous la main, grandes photos, une phrase d'Anne par bien |
| 1.4 | Le Système 360™ | **Clarté** | Le refrain révélé ligne par ligne, seul texte animé de la page |
| 1.5 | Ils l'ont rencontrée | **Intimité** | Des prénoms, des mots simples, des gens qui n'ont pas acheté avec elle |
| 1.6 | Le diagnostic | **Curiosité** | Trois livrables, une durée, le bouton |
| 1.7 | Anne | **Proximité** | Un portrait, quatre langues, deux lignes |
| 1.8 | Parler à Anne | **Résolution** | Les plans reviennent en bande basse ; la page se ferme, elle ne s'éteint pas |

**La phrase à faire dire au visiteur** (test « c'est le site où… ») : *« C'est le site où les maisons vendues s'empilent sous tes doigts pendant que le lac reste derrière. »*

## 5. Le geste signature — proposition

**La ligne-signature qui se trace.** La ligne d'horizon terracotta du logo (charte : « ligne-signature ») devient un trait fin fixé en bas de l'écran, présent sur toute la page d'accueil. Le défilement la dessine ; à chaque section passée, un point s'y pose (le cercle-horizon du symbole, en miniature). Au pied de page, la ligne est complète et sert de navigation : cliquer un point ramène à la section. C'est le motif de la marque devenu instrument, pas une décoration. **À trancher par JB** ; la maquette le montre sur trois positions de scroll. Alternative si refusé : rien — un site sobre sans geste vaut mieux qu'un gadget.

## 6. Les actifs disponibles aujourd'hui — et la règle des placeholders

**Jamais d'image de banque, même en maquette** (CAP-1, AD-17). Ce qui existe :

- **11 vidéos de biens d'Anne**, locales, inventoriées dans `contenu-anne/videos/liens.md` (Bernex, Anthy, Thonon, Sciez, Évian, Allinges, La Roche-sur-Foron ; 4K et 1080p). **Extraire des images fixes de ces vidéos** pour toutes les photos de la maquette : ce sont de vrais biens vendus par Anne. Choisir des images sans incrustation ni logo.
- **1 photo** : `contenu-anne/photos/essert-romand-013-hd.jpg`.
- **Logos** : `design-system/assets/` (6 SVG : horizontal, empilé, monogramme, symbole, négatif, mono-brun).
- **Tokens** : `design-system/tokens/tokens.css` — les seules couleurs et polices autorisées.

Ce qui manque et se dessine comme un **bloc réservé** (fond galet `#E9E0D2`, libellé « Actif attendu A-xx » en DM Sans, dimensions réelles) : les plans photographiques du Léman pour le hero (A-14 / spec § 2 du brief scroll-craft), le portrait d'Anne (A-04), les témoignages (A-06/07), les récits (A-08). Pour les textes : les libellés de `quiz-contenu.md` pour le diagnostic, les 9 feedbacks de `quiz-conception-notion.md` pour les résultats, le corpus « Qui suis-je ? » pour la page Anne ; ailleurs, des textes plausibles en français, courts, sans superlatif.

## 7. Contraintes non négociables

- **Charte v1** : Italiana pour les titres (jamais < 22 px), DM Sans pour le reste ; écru dominant, brun pour le texte, Klein pour les liens et titres-clés, terracotta pour les CTA et accents, **jamais en texte courant** ; boutons pilule ; pas de dégradé Klein → terracotta ; texte sur fond sombre = écru, jamais blanc pur.
- **`structure-site.md` v3** fait foi pour l'ordre des sections, les CTA, les états, et la table des actifs.
- **Architecture** : le sélecteur de langue existe partout (`fr` / `en`, codes, pas de drapeaux) ; les UTM n'imposent pas de bandeau ; le bandeau est conditionnel (variantes A et B) ; téléphone obligatoire diagnostic + contact, facultatif guide ; deux cases séparées (politique / séquence d'e-mails) ; l'index anglais peut être plus court que le français.
- **Mobile d'abord** : 390 px, le CTA du hero au-dessus de la ligne de flottaison, la pile gardée en mobile (carte pleine largeur, photo au-dessus), la nav qui ne disparaît jamais.
- **Accessibilité** : contraste ≥ 4,5:1 sur le texte, focus visible, cibles tactiles ≥ 44 px, `prefers-reduced-motion` = tout statique et complet (un artboard « accueil, mouvement réduit »).
- **Refus** (scroll-craft, repris parce qu'ils décrivent exactement l'*AI slop* qu'on veut éviter) : compteurs `01 / 06` ; « scroll ↓ » ; un chapeau au-dessus de chaque titre ; tout centré partout ; grilles de cartes identiques ; texte en dégradé, halos ; zigzag image-texte plus de deux fois ; statistiques inventées ; tirets cadratins visibles ; faux tableaux de bord ; verbes creux. Et ceux du brief Fora : aucune transformation sur les cartes recouvertes (pas de scale, pas de flou), pas de réaction à la souris dans le hero.

## 8. Prompt prêt à coller

```
Tu produis la maquette complète du site d'Anne VIAL-TISSOT, consultante en immobilier (Chablais / Léman), en canvas Claude Design.

Lis d'abord, dans cet ordre :
1. _bmad-output/planning-artifacts/brief-maquette-complete.md (ce brief : livrables, courbe de sentiment, actifs, refus)
2. _bmad-output/planning-artifacts/structure-site.md v3 (les 10 pages, sections, états, actifs)
3. _bmad-output/planning-artifacts/brief-scrollcraft-fora.md (la mécanique mesurée : plans, coefficients, pile, entrées)
4. design-system/tokens/tokens.css et design-system/README.md (les seules couleurs et polices)
5. contenu-anne/videos/liens.md (les vraies vidéos : extrais-en des images fixes pour toutes les photos)

Direction : la sensation de fora.so (hero à quatre plans en parallaxe, cartes de ventes empilées en sticky, entrées de sections) dans le monde de la charte v1 — écru, Klein, terracotta, Italiana. Standard de conception : scroll-craft (courbe de sentiment, un seul sommet = la pile des ventes, mobile art-directé à part, liste de refus).

Livre : les artboards listés au § 3 du brief (10 pages × desktop 1440 + mobile 390, plus les états), un artboard « Hero — plans » avec les quatre plans séparés, un artboard « Décisions à trancher » (photo ou vidéo en ouverture ; 6 cartes ou 4 + index ; sens des plans ; geste signature oui/non ; bandeau A/B), un artboard « Composants ». Aucune image de banque : images fixes des vidéos d'Anne, ou blocs réservés « Actif attendu A-xx ». Aucun texte en dur inventé pour le diagnostic : libellés de quiz-contenu.md, feedbacks de quiz-conception-notion.md.

Avant de rendre : passe la liste de refus du § 7 sur chaque artboard, vérifie le contraste, vérifie que le CTA du hero tient au-dessus de la ligne de flottaison en 390 px, et que deux sections adjacentes de l'accueil ne portent pas la même émotion (§ 4).
```

## 9. Protocole de validation avec Anne

1. **Séance de 45 minutes**, canvas ouvert, page « Le contrat du site, en clair » à côté. Ordre : l'accueil desktop en entier, puis mobile, puis les 9 autres pages, puis l'artboard « Décisions à trancher ».
2. Anne commente **dans le canvas** (clic sur l'élément, commentaire) — jamais par e-mail : les commentaires sont la trace.
3. **Décisions à prendre en séance**, consignées dans `maquettes/lot-3-complet/DECISIONS.md` : ouverture photo ou vidéo · 6 cartes ou 4 + index · sens des plans (le lac devant, recommandé) · geste signature · le concept « stories » lui-même · le nom de la méthode (Système 360™ tenu par défaut) · quelles ventes deviennent les 3 premières stories.
4. **Critère de sortie** : chaque page marquée ✅ par Anne dans `DECISIONS.md` ; les 🔄 corrigés et re-validés dans une seconde passe courte. Tant qu'une page est 🔄, la vague 2 n'ouvre pas.
5. La maquette validée devient l'entrée de `bmad-architecture` (vague 2 : champs des objets, composants) puis du build avec scroll-craft.

---

## Annexe — ce qui change par rapport aux lots 1 et 2

| Lot 1-2 | Lot 3 (ce brief) |
|---|---|
| Accueil, diagnostic, résultats, 3 variantes de hero | Les 10 pages, tous les états, composants, décisions |
| Carrousel des ventes | Pile sticky (décision du 2026-09-04) |
| Hero photo/vidéo simple | Hero à quatre plans, dessinés séparément |
| Placeholders neutres | Images fixes des vraies vidéos d'Anne, blocs « Actif attendu » |
| Bandeau de consentement acquis | Variantes A (aucun) / B (repli) |
| Validation informelle | Séance, commentaires dans le canvas, `DECISIONS.md`, critère de sortie |
