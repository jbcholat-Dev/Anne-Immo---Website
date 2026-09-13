# Brief de maquette complète — Claude Design

**Version 2** (2026-09-13). Remplace le cadrage des lots 1 et 2 (`maquettes/`) comme **commande de maquette**. Ne remplace pas `structure-site.md` (le *quoi* : pages, sections, états) ni `brief-scrollcraft-fora.md` (la mécanique mesurée de la référence) : il les assemble en une commande unique.

> **Note de version — v2 (2026-09-13).** Cette version porte les décisions **D-1 à D-12** de [`maquettes/lot-3-complet/DECISIONS.md`](../../maquettes/lot-3-complet/DECISIONS.md) (séance Anne + JB du 2026-09-13, sur la maquette lot 3 générée). Les quatre écarts structurants avec la v1 (2026-09-08) : **hero vidéo drone plein cadre** au lieu du hero à quatre plans (D-1) · **nav à 5 entrées** dont « À propos ▾ », Vendre et Acheter (D-2, D-4, D-5) · **11 pages** au lieu de 10, Méthode et Anne fusionnées en une page « À propos » à ancres (D-11) · section **« Ils ont travaillé avec Anne »** à la place de « Ils l'ont rencontrée », supprimée faute de contenu (D-8, D-9). `DECISIONS.md` fait foi en cas de divergence ; ce brief en est la projection en commande de maquette.
>
> ⚠️ **Prérequis avant toute nouvelle génération** : `structure-site.md` doit passer en **v4** (mêmes décisions), sinon la session de maquette repart du brief à 10 pages.

**Objectif :** une maquette **complète** du site — les 11 pages, en desktop et en mobile, avec leurs états — **validée par Anne avant la vague 2 de l'architecture et avant tout code.** La maquette du lot 2 était une bonne première passe ; elle ne couvrait que l'accueil, le diagnostic et les résultats. Le lot 3 généré le 2026-09-13 a servi de support à la séance qui a produit `DECISIONS.md` ; cette v2 commande la passe suivante.

**Destinataire :** la session qui produit la maquette (skill `/design` de Claude Code, ou claude.ai/design). Le prompt prêt à coller est en § 8.

---

## 1. La direction, en une phrase

**La sensation de [fora.so](https://fora.so/#about) — de la profondeur qui répond au défilement, des cartes qui s'empilent, une page qui répond — dans le monde d'Anne : écru, Klein, terracotta, Italiana, le Léman.** Pas un clone de Fora : sa mécanique, avec nos matières.

Ce qui fait la page d'accueil :

1. **Un hero vidéo plein cadre** — une vidéo drone tournée sur un bien réellement vendu par Anne occupe tout le cadre, le titre par-dessus (**D-1**). La profondeur du hero vient du mouvement réel de la caméra, pas d'une parallaxe fabriquée. **Les quatre plans superposés sont abandonnés** ; le lac n'est plus découpé en calques.
2. **Des cartes qui s'empilent** en sticky, chacune recouvrant la précédente — pour les ventes récentes, à la place du carrousel (`brief-scrollcraft-fora.md` § 1.3 et § 3.2).
3. **Un défilement inertiel et des entrées de section** (opacité + petit déplacement, une fois) (`brief-scrollcraft-fora.md` § 1.4 et § 3.3).

**La mécanique de layering / superposition de fora.so reste la référence pour tout le reste de la page** — la pile des ventes, les entrées de sections, la fermeture. Elle ne s'applique plus au hero, et à lui seul.

Ce qu'on ne reprend pas de Fora : ses actifs, ses couleurs, sa typographie, ses textes.

## 2. Le standard de conception — scroll-craft

Le skill [scroll-craft](https://github.com/nateherkai/scroll-craft) (Nate Herk) a été développé dans cette direction exacte : scroll comme ligne de temps, vérification image par image. **C'est le skill qui servira au build.** La maquette doit donc être *constructible avec son moteur*, et elle reprend dès maintenant ses règles de conception qui s'appliquent à une maquette :

| Règle scroll-craft | Ce que ça impose à la maquette |
|---|---|
| **La courbe de sentiment avant les sections** — une émotion par section, deux sections adjacentes ne portent jamais la même | § 4 ci-dessous, à respecter et à faire sentir dans les artboards |
| **Un seul sommet** — le moment que le visiteur raconte ; il reçoit le meilleur actif, le silence avant lui et le plus d'espace | Le sommet de l'accueil reste **la pile des ventes** (§ 1.3). Le hero vidéo est l'ouverture, pas le sommet : il ne doit pas lui voler la vedette (voir § 4) |
| **Un geste signature** — une interaction qui n'existe que sur ce site, pas un réglage d'un effet connu | Proposition § 5, à trancher par JB |
| **Le hero planifié avant les actifs** — profondeur, lisibilité du titre | Le hero est une **vidéo plein cadre** (D-1) : dessiner le voile qui garantit le contraste du titre, l'image de repli (poster, mobile, connexion lente, mouvement réduit), le cadrage mobile. **Pas d'artboard « Hero — plans »** |
| **Mobile art-directé à part** — pas une réduction du desktop | Chaque page a son artboard mobile *composé*, pas redimensionné |
| **Plancher typographique** — deux familles, mesure 45-75 caractères, interlignage inverse de la mesure | Italiana + DM Sans (charte), rien d'autre ; le corps de texte tient dans 65 caractères |
| **Liste de refus** | § 7 |

Ce qu'on ne prend pas de scroll-craft à ce stade : le choix d'une « grammaire » unique de landing page (le site a 11 pages, pas un seul film) et la génération d'actifs (les actifs sont ceux d'Anne — § 6).

## 3. Ce qu'il faut livrer

**Un canvas Claude Design** avec, pour chacune des **11 pages** (`structure-site.md` v4, décisions D-4, D-5, D-11), **un artboard desktop (1440 × hauteur réelle) et un artboard mobile (390 × hauteur réelle)**, plus les états. Nommage des artboards : `NN-page-desktop`, `NN-page-mobile`, `NN-page-etat-<nom>`.

| # | Page | Artboards en plus des deux vues | Source |
|---|---|---|---|
| 00 | Navigation *(pas une page)* | en-tête au repos / réduit au scroll ; **menu « À propos » ouvert au survol** (les trois ancres : Qui suis-je ? · Ma méthode · Cible) ; **menu mobile déplié avec « À propos » en accordéon** ; **variante réseaux sociaux A = dans la nav, à gauche du logo** et **variante B = en pied de page seulement** (D-6) ; pied de page ; sélecteur de langue ouvert | § 0 (v4) |
| 01 | Accueil | **Hero vidéo** (image d'ouverture au repos, voile de lisibilité, repli image) ; **Pile des ventes** (3 positions de scroll : carte 1 seule, carte 3 recouvrant, sortie de pile) ; refrain révélé (2 états) ; **« Ils ont travaillé avec Anne »** (3 avis Immodvisor, dont **au moins un relié à une story, avec sa photo**, les autres en citation seule) ; fermeture | § 1 (v4) |
| 02 | Diagnostic (landing) | aperçu de partage (1200 × 630) | § 6 (v4) |
| 03 | Diagnostic (parcours) | les 3 gabarits d'écran (choix unique, choix multiple, texte libre) ; barre « Question n / 15 » ; retour arrière ; confirmation d'abandon | § 7 (v4) |
| 04 | Résultats | gate de capture ; erreurs de champ ; échec d'envoi avec renvoi ; résultats sortie A ; résultats sortie B ; confirmation guide téléchargé | § 8 (v4) |
| 05 | Réalisation *(index des ventes)* | index ; index anglais plus court (story non traduite absente) ; état « aucune story » | § 2 (v4) |
| 06 | Story *(fiche d'une vente)* | **story avec deux témoignages (vendeur + acheteur)** et **story avec un seul témoignage** (D-9) ; story sans photo secondaire | § 2 (v4) |
| 07 | À propos *(une seule page longue, D-11)* | **ancres Qui suis-je ? / Ma méthode / Cible** avec leur repère de lecture ; **avec le bloc vidéo méthode** et **sans** (D-12 : la page doit être complète sans lui, pas de trou ni de placeholder en production) ; variante **sans la section « Cible »** (point ouvert 1) | § 3 (v4, ex-§ 3 + § 4 de la v3) |
| 08 | Vendre | les **deux portes** (entrer dans le diagnostic · faire estimer son bien) ; **formulaire d'estimation** au repos, rempli, erreurs de champ, envoi en cours, confirmation (« Anne vous rappelle »), échec d'envoi | § 4 (v4), D-4 |
| 09 | Acheter | parcours acheteur ; bloc « recherche accompagnée » ; CTA « Parler de votre projet » et l'écran qu'il ouvre | § 5 (v4), D-5 |
| 10 | Contact / RDV | calendrier Cal.com intégré **avec sa case d'acceptation** ; formulaire ; confirmation envoyée ; créneau réservé ; calendrier vide | § 9 (v4) |
| 11 | Guide | formulaire (téléphone facultatif) ; confirmation | § 10 (v4) |
| — | Légal *(annexe : `structure-site.md` la compte comme page 11 en fusionnant Réalisation et Story ; ici Story a son propre artboard et Légal sort du décompte — même contenu, même total)* | mentions ; confidentialité ; cookies ; **bandeau variante A (aucun) et variante B (repli)** | § 11 (v4) |

Plus **un artboard « Décisions à trancher »** qui montre côte à côte les options encore ouvertes (§ 9) pour qu'Anne et JB choisissent en séance, et **un artboard « Composants »** : boutons (pilule terracotta), champs, cartes, la ligne-signature, les états focus/erreur.

**Format d'approbation :** le canvas est le support ; un export PDF de tous les artboards est déposé dans `maquettes/lot-3-complet/` et **chaque écart décidé en séance est consigné dans `DECISIONS.md`** (décision, statut, à propager) avant d'être répercuté ici.

## 4. La courbe de sentiment de l'accueil

Une émotion par section, dans l'ordre de `structure-site.md` § 1 (v4). La maquette doit la faire sentir en statique ; le build la fera sentir au scroll. **Huit actes** : l'acte « Intimité » porté par « Ils l'ont rencontrée » disparaît (D-8), « Ils ont travaillé avec Anne » prend sa place avec sa propre émotion (D-9).

| § | Section | Émotion | Ce qui la cause à l'écran |
|---|---|---|---|
| 1.1 | Ouverture | **Reconnaissance** | La vidéo drone plein cadre — le lac, un vrai bien vendu —, le nom en Italiana par-dessus, un seul bouton. « C'est chez nous. » Le secteur est dit **une seule fois**, dans le sous-titre : **pas de liste de communes** (D-10) |
| 1.2 | La preuve, tout de suite | **Confiance** | La note Immodvisor, des chiffres réels, pas de superlatif |
| 1.3 | Ventes récentes | **Projection** — *le sommet* | Les maisons vendues qui s'empilent sous la main, grandes photos, une phrase d'Anne par bien |
| 1.4 | Le Système 360™ | **Clarté** | Le refrain révélé ligne par ligne, seul texte animé de la page. Le lien « La méthode en détail » mène à l'ancre Méthode de la page À propos (D-11) |
| 1.5 | Ils ont travaillé avec Anne | **Assurance** | Trois avis Immodvisor **entiers**, vendeurs *et* acheteurs, signés d'un prénom ; au moins un montré avec la photo du bien et le lien vers sa story. « Des gens réels, une vente réelle derrière chaque mot » (D-9) |
| 1.6 | Le diagnostic | **Curiosité** | Trois livrables, une durée, le bouton |
| 1.7 | Anne | **Proximité** | Un portrait, quatre langues, deux lignes |
| 1.8 | Parler à Anne | **Résolution** | Une bande basse reprend l'image du lac (fixe extraite de la vidéo d'ouverture) — la page se ferme, elle ne s'éteint pas |

**Vérification de la règle** « deux sections adjacentes ne portent jamais la même émotion » : Reconnaissance → Confiance → Projection → Clarté → **Assurance** → Curiosité → Proximité → Résolution. Aucune répétition adjacente. *Assurance* (1.5) est volontairement tenue à distance de *Confiance* (1.2), non adjacente : 1.2 est un chiffre qu'on croit, 1.5 est une personne qu'on écoute.

**Le sommet reste § 1.3, la pile des ventes** — il n'est pas recalculé. Conséquence du hero vidéo (D-1) à surveiller en maquette : une vidéo plein cadre est un actif spectaculaire qui peut voler le sommet. Règles de compensation à dessiner : ouverture **sans son, sans sur-cadrage, mouvement lent**, un seul CTA, et la pile des ventes reçoit plus d'espace vertical et les meilleures photos.

**La phrase à faire dire au visiteur** (test « c'est le site où… ») : *« C'est le site où les maisons vendues s'empilent sous tes doigts, après un survol du lac. »*

## 5. Le geste signature — proposition

**La ligne-signature qui se trace.** La ligne d'horizon terracotta du logo (charte : « ligne-signature ») devient un trait fin fixé en bas de l'écran, présent sur toute la page d'accueil. Le défilement la dessine ; à chaque section passée, un point s'y pose (le cercle-horizon du symbole, en miniature). Au pied de page, la ligne est complète et sert de navigation : cliquer un point ramène à la section. C'est le motif de la marque devenu instrument, pas une décoration. **À trancher par JB** ; la maquette le montre sur trois positions de scroll. Alternative si refusé : rien — un site sobre sans geste vaut mieux qu'un gadget.

⚠️ **Impact du hero vidéo (D-1), signalé** : le geste lui-même est inchangé, mais il démarrait sur un fond de plans clairs et démarre maintenant **sur une vidéo**, dont les valeurs changent image par image. Deux conséquences à dessiner : (a) sur le hero, la ligne a besoin d'un porteur propre — un filet écru à faible opacité sous elle, ou le voile de lisibilité du titre prolongé jusqu'au bas de l'écran ; (b) le contraste de la ligne doit être vérifié **sur l'image la plus claire de la boucle**, pas seulement sur le poster. **Huit points**, un par acte (§ 4).

## 6. Les actifs disponibles aujourd'hui — et la règle des placeholders

**Jamais d'image de banque, même en maquette** (CAP-1, AD-17). Ce qui existe :

- **11 vidéos de biens d'Anne**, locales, inventoriées dans `contenu-anne/videos/liens.md` (Bernex, Anthy, Thonon, Sciez, Évian, Allinges, La Roche-sur-Foron ; 4K et 1080p). **L'ouverture du site est l'une d'elles** (A-01, D-1) : 10-20 s en boucle, sans incrustation ni logo, Léman reconnaissable — à extraire de **Thonon, Anthy, Sciez ou Évian**. En maquette, le hero se dessine avec une **image fixe de cette vidéo** (elle sert aussi de poster, de repli mobile / connexion lente et de repli `prefers-reduced-motion`).
- **Toutes les autres photos de la maquette** : images fixes extraites de ces mêmes vidéos — ce sont de vrais biens vendus par Anne. Choisir des images sans incrustation ni logo.
- **1 photo** : `contenu-anne/photos/essert-romand-013-hd.jpg`.
- **Logos** : `design-system/assets/` (6 SVG : horizontal, empilé, monogramme, symbole, négatif, mono-brun).
- **Tokens** : `design-system/tokens/tokens.css` — les seules couleurs et polices autorisées.

**Plus aucun plan photographique du Léman n'est à produire** : A-14 (photo d'ouverture en plans) et la spec § 2 de `brief-scrollcraft-fora.md` tombent avec D-1.

Ce qui manque et se dessine comme un **bloc réservé** (fond galet `#E9E0D2`, libellé « Actif attendu A-xx » en DM Sans, dimensions réelles) :

| Actif | État | Où |
|---|---|---|
| **A-04** portrait d'Anne | attendu | Accueil § 1.7, page À propos |
| **A-07** témoignages par story — **vendeur et/ou acheteur** (D-9) | attendu | Story (deux témoignages, ou un seul) |
| **A-08** récits de vente | attendu, 3 écrits | Réalisation, Story |
| **A-15 vidéo « Anne présente sa méthode »** (nouveau, D-12) | attendu, **facultatif** | Page À propos, section Ma méthode. **La page doit être complète sans lui** : dessiner les deux artboards, et en production le bloc n'apparaît pas tant que la vidéo n'existe pas — pas de trou, pas de placeholder |

**A-06 (témoignages d'acheteurs non convertis) est abandonné** (D-8) : le contenu n'a pas pu être collecté, la section qu'il alimentait est supprimée. **A-07 survit et change de portée** : ce n'est plus « le témoignage de l'acheteur » mais « le ou les témoignages d'une story, vendeur et/ou acheteur, au moins un pour publier » (D-9). Le numéro A-15 est proposé ici pour la vidéo méthode ; la table des actifs de `structure-site.md` v4 fait foi sur la numérotation définitive.

Pour les textes : les libellés de `quiz-contenu.md` pour le diagnostic, les 9 feedbacks de `quiz-conception-notion.md` pour les résultats, le corpus « Qui suis-je ? » pour la page À propos ; pour Vendre et Acheter, `contenu-anne/pages/` quand les fichiers existent (gabarit `page.md`) ; ailleurs, des textes plausibles en français, courts, sans superlatif.

## 7. Contraintes non négociables

- **Charte v1** : Italiana pour les titres (jamais < 22 px), DM Sans pour le reste ; écru dominant, brun pour le texte, Klein pour les liens et titres-clés, terracotta pour les CTA et accents, **jamais en texte courant** ; boutons pilule ; pas de dégradé Klein → terracotta ; texte sur fond sombre = écru, jamais blanc pur.
- **`structure-site.md` v4** fait foi pour l'ordre des sections, les CTA, les états, et la table des actifs. En cas de divergence avec ce brief, c'est `DECISIONS.md` qui tranche.
- **Hero vidéo (D-1)** : **jamais de son**, pas de contrôle de lecture visible, boucle courte, chargement différé après le premier rendu, **repli image** sur mobile, connexion lente et `prefers-reduced-motion` ; le titre reste lisible sur **chaque** image de la boucle (voile, jamais d'ombre portée) ; le CTA unique reste au-dessus de la ligne de flottaison en 390 px.
- **Navigation (D-2, D-7)** : 5 entrées — **À propos ▾** (menu : Qui suis-je ? · Ma méthode · Cible) · Réalisation · Vendre · Acheter · Contact — plus la bascule **FR / EN** (codes, pas de drapeaux) et le **bouton « Diagnostic »** en pilule terracotta. La nav ne disparaît jamais. Réseaux sociaux : **deux variantes à dessiner** (nav / pied de page), non tranché (D-6).
- **Architecture** : le sélecteur de langue existe partout ; les UTM n'imposent pas de bandeau ; le bandeau est conditionnel (variantes A et B) ; téléphone obligatoire diagnostic, contact **et demande d'estimation**, facultatif guide ; deux cases séparées (politique / séquence d'e-mails) ; l'index anglais peut être plus court que le français.
- **Mobile d'abord** : 390 px, le CTA du hero au-dessus de la ligne de flottaison, la pile gardée en mobile (carte pleine largeur, photo au-dessus), la nav qui ne disparaît jamais, le menu « À propos » en accordéon.
- **Accessibilité** : contraste ≥ 4,5:1 sur le texte, focus visible, cibles tactiles ≥ 44 px, `prefers-reduced-motion` = tout statique et complet (un artboard « accueil, mouvement réduit », hero en image fixe).
- **Refus** (scroll-craft, repris parce qu'ils décrivent exactement l'*AI slop* qu'on veut éviter) : compteurs `01 / 06` ; « scroll ↓ » ; un chapeau au-dessus de chaque titre ; tout centré partout ; grilles de cartes identiques ; texte en dégradé, halos ; zigzag image-texte plus de deux fois ; statistiques inventées ; tirets cadratins visibles ; faux tableaux de bord ; verbes creux. Et ceux du brief Fora : aucune transformation sur les cartes recouvertes (pas de scale, pas de flou), pas de réaction à la souris dans le hero.

## 8. Prompt prêt à coller

```
Tu produis la maquette complète du site d'Anne VIAL-TISSOT, consultante en immobilier (Chablais / Léman), en canvas Claude Design.

Lis d'abord, dans cet ordre :
1. maquettes/lot-3-complet/DECISIONS.md (les décisions D-1 à D-12 de la séance du 2026-09-13 — elles priment sur tout le reste)
2. _bmad-output/planning-artifacts/brief-maquette-complete.md v2 (ce brief : livrables, courbe de sentiment, actifs, refus)
3. _bmad-output/planning-artifacts/structure-site.md v4 (les 11 pages, sections, états, actifs)
4. _bmad-output/planning-artifacts/brief-scrollcraft-fora.md (la mécanique mesurée — ATTENTION : sa spec du hero à quatre plans, § 2, est périmée ; seuls la pile sticky, les entrées de sections et Lenis restent valables)
5. design-system/tokens/tokens.css et design-system/README.md (les seules couleurs et polices)
6. contenu-anne/videos/liens.md (les vraies vidéos : l'ouverture en est une, et toutes les photos en sont des images fixes)

Direction : un hero vidéo drone plein cadre (une vente réelle, sans son, titre lisible par-dessus), puis la sensation de fora.so pour le reste de la page — cartes de ventes empilées en sticky, entrées de sections, défilement inertiel — dans le monde de la charte v1 : écru, Klein, terracotta, Italiana. Pas de hero à plans superposés, pas de parallaxe dans le hero. Standard de conception : scroll-craft (courbe de sentiment à 8 actes, un seul sommet = la pile des ventes, mobile art-directé à part, liste de refus).

Livre : les artboards listés au § 3 du brief (11 pages × desktop 1440 + mobile 390, plus les états, plus l'annexe Légal), l'artboard Navigation avec le menu « À propos » ouvert (desktop et accordéon mobile) et les deux variantes de réseaux sociaux (nav / pied de page), l'artboard « Décisions à trancher » (les cinq points ouverts du § 9), un artboard « Composants ». Aucune image de banque : images fixes des vidéos d'Anne, ou blocs réservés « Actif attendu A-xx ». Aucun texte en dur inventé pour le diagnostic : libellés de quiz-contenu.md, feedbacks de quiz-conception-notion.md.

Points de vigilance issus de la séance : pas de liste de communes dans le hero (le secteur est dit une fois, dans le sous-titre) ; la section « Ils l'ont rencontrée » n'existe plus — à sa place « Ils ont travaillé avec Anne », trois avis Immodvisor entiers mêlant vendeurs et acheteurs, dont au moins un relié à une story avec sa photo ; « À propos » est UNE page longue à ancres (Qui suis-je ? / Ma méthode / Cible), avec et sans le bloc vidéo méthode ; Vendre et Acheter sont deux nouvelles pages, Vendre porte le formulaire d'estimation et tous ses états.

Avant de rendre : passe la liste de refus du § 7 sur chaque artboard, vérifie le contraste (y compris celui du titre sur l'image la plus claire de la vidéo d'ouverture), vérifie que le CTA du hero tient au-dessus de la ligne de flottaison en 390 px, et que deux sections adjacentes de l'accueil ne portent pas la même émotion (§ 4).
```

## 9. Protocole de validation avec Anne

1. **Séance de 45 minutes**, canvas ouvert, page « Le contrat du site, en clair » à côté. Ordre : l'accueil desktop en entier, puis mobile, puis les 10 autres pages, puis l'artboard « Décisions à trancher ».
2. Anne commente **dans le canvas** (clic sur l'élément, commentaire) — jamais par e-mail : les commentaires sont la trace.
3. **Décisions à prendre en séance** — ce sont les **cinq points laissés ouverts** par la séance du 2026-09-13, et eux seuls (`DECISIONS.md` § « Points laissés ouverts ») :
   1. **« Cible »** : page à part, ou absorbée par Vendre / Acheter ? (D-2)
   2. **Réseaux sociaux** : dans la nav ou en pied de page ? (D-6)
   3. **Formulaire d'estimation** : quels champs au minimum ? Proposition : prénom, nom, téléphone, e-mail, commune du bien, type de bien, consentement. (D-4)
   4. **Formulaire « Parler de votre projet »** de la page Acheter : le même que Contact, ou dédié ? (D-5)
   5. **Preuve sociale** (D-9) : quels trois avis Immodvisor pour « Ils ont travaillé avec Anne » — idéalement deux vendeurs + un acheteur, et au moins un relié à une story rédigée.
   *(Tranchés le 2026-09-13, à ne plus rouvrir : ouverture vidéo et non photo (D-1), sens des plans — sans objet, plans abandonnés, « Réalisation » comme entrée de nav (D-3), bouton Diagnostic et bascule FR/EN maintenus (D-7).)*
4. **Critère de sortie** : chaque page marquée ✅ par Anne dans `DECISIONS.md` ; les 🔄 corrigés et re-validés dans une seconde passe courte. Tant qu'une page est 🔄, la vague 2 n'ouvre pas.
5. La maquette validée devient l'entrée de `bmad-architecture` (vague 2 : champs des objets, composants) puis du build avec scroll-craft.

---

## Annexe — ce qui change par rapport aux lots 1 et 2

| Lot 1-2 | Lot 3 (ce brief, v2) |
|---|---|
| Accueil, diagnostic, résultats, 3 variantes de hero | Les 11 pages, tous les états, composants, décisions |
| Carrousel des ventes | Pile sticky (décision du 2026-09-04) |
| Hero photo/vidéo simple | **Hero vidéo plein cadre (plans abandonnés le 2026-09-13)** |
| Placeholders neutres | Images fixes des vraies vidéos d'Anne, blocs « Actif attendu » |
| Bandeau de consentement acquis | Variantes A (aucun) / B (repli) |
| Validation informelle | Séance, commentaires dans le canvas, `DECISIONS.md`, critère de sortie |
