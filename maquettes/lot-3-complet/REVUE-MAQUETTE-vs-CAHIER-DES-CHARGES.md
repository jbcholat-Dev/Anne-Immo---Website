# Revue — maquette Lot 3 (canvas exporté) vs cahier des charges

_Établie le 2026-09-19, avant toute implémentation. Rien n'a été modifié dans la maquette ni dans le dépôt de spec._

**Ce qui a été comparé**

| Côté maquette | Côté cahier des charges (dépôt `jbcholat-Dev/Anne-Immo---Website`, `main` @ `480e1bf`) |
|---|---|
| `project/Maquettes - Lot 3 - Complet.dc.html` (61 artboards, lu en entier) + `support.js` + `_ds/…/tokens.css` + les 6 transcripts `chats/` | `structure-site.md` **v4** · `maquettes/lot-3-complet/DECISIONS.md` (D-1 → D-12) · `brief-maquette-complete.md` **v2** · `SPEC.md` **v5** (CAP-1 → CAP-11) · `brief-scrollcraft-fora.md` · `design-system/` (tokens, boutons, hero) · `contenu-anne/` (a-propos, stories, gabarits, vidéos) · `quiz-contenu.md`, `quiz-conception-notion.md` |

**Verdict en une phrase :** la maquette couvre les 11 pages, les états et les 12 décisions du 13/09 — rien de structurellement bloquant — mais **(A) le cahier des charges se contredit sur trois points qu'il faut trancher avant de coder, (B) une dizaine d'écarts maquette ↔ spec restent à corriger ou à absorber au build, (C) quelques défauts de prototype, et (D) les actifs d'Anne bloquent la mise en ligne, pas la maquette.**

---

## A. Le cahier des charges se contredit — à trancher avant d'implémenter

### A1 · Ventes récentes (§ 1.3) : carrousel ou pile collante ?
- `structure-site.md` v4 § 1.3 dit **carrousel** (« six photographies en carrousel… six photos empilées mangent une hauteur d'écran impraticable »), avec ses règles (défilement manuel, indicateurs, balayage mobile).
- `brief-maquette-complete.md` v2 § 1 et `brief-scrollcraft-fora.md` § 3.2 disent **pile sticky à la place du carrousel** (décision JB du 2026-09-04) ; `DECISIONS.md` est muet.
- La maquette est en **pile** (6 cartes, `top: 96 px`, pas 630 px, sans scale ni flou, pile gardée en mobile), et c'est ce que tu as validé en séance (« la superposition des cartes… c'est pas mal »).
- **Recommandation : acter la pile** et réécrire § 1.3 de `structure-site.md` (desktop + mobile) — sinon la règle « structure-site fait foi pour les sections » renverra le build vers un carrousel.

### A2 · Nom et contenu de la méthode
- `structure-site.md` v4 § 1.4 / § 3.1 / § 3.2 et `SPEC.md` parlent encore du **« Système 360™ »** avec trois axes (Vendeur 360° / Marché 360° / Partenaires 360°) et un réseau « courtier bancaire, courtier travaux, géomètre, notaire ».
- Le 2026-09-10 tu as changé le nom et le contenu (chat 5) : **« Ma méthode : bon sens, rigueur et pragmatisme »**, 3 piliers + 4 traductions concrètes + 6 partenaires (expert-comptable, géomètre, diagnostiqueurs, notaire, urbanisme, gestion de projet). C'est ce que porte `contenu-anne/pages/a-propos/fr.md` **et** la maquette (accueil § 1.4, page À propos).
- **Recommandation : acter le renommage** dans `structure-site.md` (§ 1.4, § 3.1 « naissance du Système 360™ », § 3.2), dans `SPEC.md` (question différée « Système 360™ ou Méthode 360° » devient sans objet) et dans `DECISIONS.md`.

### A3 · Décisions prises dans le canvas (chats 5–6) mais absentes de `DECISIONS.md`
À consigner, sinon elles « n'existent pas » (règle du journal) :

| Décision prise en canvas | État dans le dépôt |
|---|---|
| **Réseaux sociaux : variante A** (à gauche du logo) appliquée aux 13 barres desktop (« On va implémenter cette barre… ») | D-6 encore 🔄 ; point ouvert 2 |
| **Geste signature : non** (« je ne suis pas très fan… version plus sobre ») | brief v2 § 5 le propose encore |
| **Hero : bloc nom + positionnement + CTA posé en bas** (84 px du bord), voile allégé en haut | — |
| **Bandeau preuve § 1.2 en Klein** (au lieu du brun) | — |
| **CTA en terra-deep `#A34E30`** (5,3:1) au lieu du terracotta `#C4623E` (3,6:1 sur écru), survol brun | Charte + `design-system/components/boutons.html` + commentaire de `tokens.css` disent encore « pilule terracotta, hover terra-deep » → **écart charte à acter et à propager au design system** |
| **Logo = symbole seul** partout (cercle Klein + strate terracotta), le nom vit dans le titre du hero et le pied de page | `structure-site.md` § 0 : « Logo à gauche (déclinaison horizontale de la charte) » |
| Points ouverts **renumérotés 1–4** dans la maquette (réseaux sorti) | `DECISIONS.md` / `structure-site` numérotent 1–5 |

### A4 · Trois numérotations de pages coexistent
`structure-site` v4 (0–11), `brief` v2 § 3 (00–11, Légal hors compte), `DECISIONS.md` (01–12, Vendre = 11, Acheter = 12), maquette (02 Ventes, 03 À propos sans numéro, 04 Vendre, **04b** Acheter, 05 Diagnostic…). Et la page d'index s'appelle **« Ventes »** (h1, IDs `02-ventes-*`) alors que l'entrée de nav est **« Réalisation »** (D-3).
**Recommandation :** une seule table — celle du brief v2 § 3 — et h1 = « Réalisation » (ou l'inverse, mais un seul mot).

---

## B. Écarts de la maquette par rapport au cahier des charges

Classés par page. **(canvas)** = à corriger dans la maquette avant validation Anne · **(build)** = peut être absorbé à l'implémentation sans redessiner.

### B1 · Navigation (§ 0, CAP-6)
1. **La nav « ne disparaît jamais » n'est pas tenue dans le prototype.** Dans la fenêtre défilante, l'en-tête est `position:absolute` dans le hero (il part avec lui) et la barre réduite n'apparaît qu'à `scrollTop > hauteur du hero − 72` (`support`-script, `componentDidMount`) : entre ~72 px et ~1 100 px de défilement, **aucune nav n'est visible**. Au build : en-tête fixe dès le premier pixel (transparent/écru sur la vidéo, puis réduit). **(build)**
2. **Menu « À propos » à deux sous-entrées** (variante sans Cible, demandée explicitement § 0 « dessiner le menu en deux variantes ») : absent, desktop et mobile. Seule la page `apropos-sans-cible` existe. **(canvas, mineur)**
3. **Menu mobile : « À propos » n'est pas actionnable vers la page.** § 0 : « le libellé reste actionnable pour aller en haut de la page ». Dans `00-nav-mobile-menu` c'est un `<button aria-expanded>` qui ne fait que déplier. Il faut lien + chevron. **(build)**
4. **Pied de page.** Le bloc « Ailleurs » liste Immodvisor · Instagram · LinkedIn — **YouTube manque** alors qu'il est dans la barre. Et tous les pieds de page des pages intérieures sont réduits à une ligne (© + légal + FR/EN) : ni plan du site, ni guide, ni réseaux, ni co-branding eXp exigés par § 0 — seul `00-footer` est complet. Au build : `00-footer` partout. **(build)**
5. La barre réduite au défilement ne reprend pas les réseaux — la spec ne dit rien, à confirmer. **(décision)**

### B2 · Accueil (§ 1)
1. **§ 1.3 — citation courte de témoignage sur les cartes** (« quand la story porte un témoignage, la vue peut aussi porter une citation courte — vendeur ou acheteur, attribuée avec son rôle », D-9, A-07) : **absente** des six cartes (desktop et mobile). **(canvas)**
2. Carte 1 de la pile : libellé « Actif attendu A-01 · vidéo Sciez (si l'ouverture est une photo) » — **périmé depuis D-1** (l'ouverture est la vidéo) → A-02. **(canvas, trivial)**
3. **§ 1.5 / A-11** : la **date** de chaque avis manque (A-11 : « texte entier, prénom, rôle, date, lien »). Les trois avis (Claire, Peter, Jean-Marc) et le « 4,9 / 5 · 27 avis » de § 1.2 sont **fictifs** — attendus d'Anne (point ouvert 5). **(canvas + contenu)**
4. **§ 1.8 (brief v2 § 4)** : « une bande basse reprend l'image du lac (fixe extraite de la vidéo) ». La note de marge le dit, la section ne le montre pas : bande Klein + vague SVG, sans image. À trancher : image A-14 en fond, ou Klein seul. **(décision)**
5. Brief v2 § 3 demande des artboards « image d'ouverture au repos » et « repli image » du hero : décrits en texte (`01-accueil-hero-video`, `01-accueil-mouvement-reduit`), pas dessinés. Acceptable si le poster est la première image de la boucle. **(décision)**
6. État « une ou deux stories seulement » (§ 1.3, table des états) : non dessiné. **(build)**
7. Le réglage **« 4 cartes »** du panneau de tweaks contredit CAP-1 (6 photos sur l'accueil) : à retirer, ou à n'autoriser qu'avec un lien index. **(canvas)**
8. Les six communes de la pile (Sciez, Anthy, Thonon, Évian, Bernex, Allinges) viennent de l'inventaire vidéo, pas des stories : les 3 stories rédigées n'ont **pas de commune** (`_suivi-stories.md`). Les phrases « d'Anne » sur les cartes sont des textes de placement, pas des extraits de ses récits. **(contenu)**

### B3 · Réalisation / Story (§ 2)
1. **Fiche story mobile absente.** § 2 : « l'index et la fiche story se dessinent séparément, **desktop et mobile** ». Il y a `02-ventes-story` (1440) et la variante un témoignage ; pas de 390. **(canvas)**
2. Variante **« story sans photo secondaire »** (brief v2 § 3, ligne 06) : absente. **(canvas, mineur)**
3. h1 « Ventes » vs nav « Réalisation » (voir A4).

### B4 · À propos (§ 3)
Conforme : page longue, trois ancres, repère collant desktop + fil mobile, refrain dans les deux sections, bloc vidéo A-15 **avec et sans**, Cible **avec et sans**, CTA de fin. Deux remarques :
1. Le texte « Qui suis-je ? » est repris de la capture ScoreApp (`quiz-contenu.md`) plutôt que de `contenu-anne/pages/a-propos/fr.md` — même fond, formulations légèrement différentes ; « Formation » et le tableau « Ce que je propose » du fr.md ne sont pas repris (cohérent avec « à resserrer, pas à coller », à confirmer). **(contenu, A-09)**
2. `apropos-sans-video` n'existe qu'en desktop (le mobile se déduit). OK.

### B5 · Vendre (§ 4, CAP-11)
1. **Case séparée « séquence d'e-mails » (facultative) manquante** dans le formulaire d'estimation — § 4 : « case d'acceptation… obligatoire, et **séparée**, la case d'inscription à la séquence d'e-mails, facultative. Mêmes règles qu'en § 9 ». Présente sur Contact et Guide, absente ici (desktop, mobile, états). **(canvas)**
2. Libellé : la spec nomme le CTA de la porte 1 « Faire le point sur votre vente » ; la maquette met ce texte en titre et « Démarrer le diagnostic » sur le bouton. Cohérent avec l'accueil, à valider. **(mineur)**
3. Mobile : le bouton « Aller au formulaire » pointe sur `#04-vendre-mobile` (pas d'ancre vers le formulaire). **(trivial)**

### B6 · Acheter (§ 5, D-5)
1. **Section 4 « La preuve — un ou deux avis d'acheteurs, même source vérifiable qu'en § 1.5 » : absente** (desktop et mobile). C'est la raison d'être de la page selon § 5 (« les avis d'acheteurs sont une part de la preuve du site »). **(canvas)**
2. Mobile : « le CTA répété une fois en bas de page » suppose un CTA en haut ; il n'y en a qu'un, en bas. **(canvas, mineur)**
3. Textes marqués « contenu à écrire par Anne » ✓ — `contenu-anne/pages/acheter/fr.md` n'existe pas encore. **(contenu)**

### B7 · Diagnostic — landing et parcours (§ 6, § 7)
Conformes : offre au-dessus de la ligne de flottaison, ligne de transparence (coordonnées + téléphone), trois blocs, sortie basse vers le guide, aperçu 1200 × 630 ; trois gabarits (unique / multiple / texte libre), barre remplie sur 17 écrans libellée « n / 15 », catégorie affichée, retour, nav masquée, abandon, reprise à l'écran atteint. Une seule remarque : Q13 (obstacles, multi-sélection) n'est pas dessinée, mais c'est le gabarit de Q7. **(rien à faire)**

### B8 · Résultats (§ 8)
1. **Sortie A en desktop seulement, Sortie B en mobile seulement** : chaque sortie manque une vue (brief : chaque page desktop + mobile). **(canvas ou build)**
2. Profil **« Stratégie à risque » (0–40)** non dessiné, et la règle « rouge / ambre / vert par la palette de la charte » n'est fixée que pour deux profils (A = Klein, B = terra-deep). Quelle couleur pour le troisième ? **(décision)**
3. Gate, erreurs, échec + renvoi, guide envoyé, newsletter confirmée, lien expiré : ✓.

### B9 · Contact / RDV (§ 9)
1. **Téléphone non marqué obligatoire** sur le formulaire (il l'est § 9 et sur Vendre). **(canvas, trivial)**
2. État **« erreurs de champ »** du contact non dessiné (réutilisable depuis Composants / Vendre). **(build)**
3. Cal.com avec case d'acceptation, fuseau, créneau pris, calendrier vide, message envoyé, créneau réservé : ✓.

### B10 · Guide (§ 10), Légal (§ 11)
Conformes (téléphone facultatif, lien expirant, confirmation ; mentions avec RSAC / carte eXp / hébergeur, confidentialité à 5 finalités dont l'estimation, cookies sans traceur, bandeau A et B). Légal est un gabarit unique à ancres pour trois pages — OK si le build sort trois URLs.

### B11 · Transverse
- **404** (table des états, « Transverse ») non dessinée. **(build)**
- États « langue non traduite » et « chargement » non dessinés. **(build)**
- Liste de refus (brief v2 § 7) : la maquette use abondamment du **chapeau en capitales Klein au-dessus des titres** (« Pilier 1 », « 01 », « Le parcours », « Engagement »…) — c'est le motif « un chapeau au-dessus de chaque titre » que la liste refuse. Pas bloquant, mais à assumer ou à alléger. **(décision)**

---

## C. Défauts du prototype, indépendants du cahier des charges

1. **Bouton menu invisible** : les deux barres du hamburger sont en écru `#F7F2EA` sur un en-tête écru dans `02-ventes-mobile` (l. 357), `08-contact-mobile` (l. 790), `09-guide-mobile` (l. 819), `10-legal-mobile` (l. 842). Seuls `01-accueil-mobile` (sur vidéo sombre) est juste ; `04-vendre-mobile`, `04b-acheter-mobile`, `apropos-mobile` sont en brun. **(canvas)**
2. `01-hero-bloc-bas` (l. 203) : le `clipPath` est déclaré `id="avtSymbas"` mais référencé `url(#avtSymV)` → référence cassée, le symbole ne se découpe pas. **(canvas)**
3. Le `clipPath id="avtSym"` est redéclaré ~30 fois (IDs dupliqués, `ve1`/`e1`/`q15`/`ab-t` aussi). Sans effet visible, mais au build : un seul `<symbol>`/sprite. **(build)**
4. **Vidéo du hero = iframe Canva** (`…/watch?embed`, `allow="autoplay"`) : contrôles et logo visibles, ni boucle ni lecture muette fiables, pas de poster, pas de repli. Documenté comme provisoire dans `01-accueil-hero-video` ; **inutilisable en production** — voir D.
5. **Couleurs hors tokens.** `tokens.css` (« les seules couleurs autorisées », brief § 7) définit 7 couleurs ; la maquette en ajoute six utilisées en texte/fonds : `#5C5248` (175 occurrences, texte secondaire), `#D9CFC0` (95, texte sur fond sombre), `#D9CFBD` (25, blocs réservés), `#4A4238` (19), `#B7AC9D` (16, dates indisponibles), `#3A2E24` (1). Les contrastes passent (`#5C5248` sur écru 6,8:1, sur galet 5,8:1 ; `#D9CFC0` sur brun 10,5:1, sur Klein 7:1), donc **la bonne réponse est d'ajouter des tokens sémantiques** (`--avt-text-muted`, `--avt-text-on-dark-muted`, `--avt-placeholder`, `--avt-disabled`) au design system plutôt que de les bannir. Les dégradés `gArrP`/`gMilP` (strates abandonnées) traînent encore dans les `<defs>`. **(design system + build)**
6. Le CTA primaire est en `#A34E30` avec survol brun, alors que `boutons.html` du design system dit terracotta `#C4623E` / survol `#A34E30` (voir A3).

---

## D. Ce qui bloque la mise en ligne (pas la maquette)

| Actif / décision | État | Impact |
|---|---|---|
| **A-01** vidéo d'ouverture — MP4 1080p, 8–12 s, sans audio, < 6 Mo (ou Vimeo non répertorié) + **A-14** poster | Seul un montage Canva existe ; 11 vidéos sources locales, hors Git | Hero non implémentable proprement sans elle |
| **A-02 / A-03** photos des biens | **0 image dans le dépôt** — tout est « Actif attendu » | Pile, index, stories, avis reliés |
| **A-11** 3 avis Immodvisor + note/nombre réels | `contenu-anne/avis-immodvisor/` vide (gabarit seul) | § 1.2, § 1.5, landing, Acheter |
| **A-08 / A-07** stories publiables | 3 récits rédigés, **0 publiable** (commune, photo, témoignage, autorisation A-12 manquants) | CAP-3 : 3 stories au lancement |
| **A-04** portrait, **A-13** mentions légales (RSAC, carte eXp, hébergeur), **A-10** guide rebrandé | attendus | § 1.7, À propos, Légal, Guide |
| **Points ouverts** 1 Cible · 3 champs estimation · 4 formulaire Acheter · 5 avis (2 = réseaux, tranché en canvas) | à trancher avec Anne | variantes déjà dessinées |
| **Barème Q10** (visites × offres, SPEC « Open Questions ») | non tranché | bloque le scoring au build, pas la maquette |

---

## E. Ce qui est conforme (pour ne pas le rouvrir)

D-1 vidéo plein cadre, secteur dit une fois, pas de liste de communes (D-10) · nav à 5 entrées + FR/EN en codes + pilule Diagnostic (D-2, D-7) · menu À propos au survol/focus + accordéon mobile · Réalisation (D-3) · Vendre à deux portes, estimation non faite en ligne, confirmation « Anne vous rappelle », 5 états (D-4) · Acheter : cibles, recherche accompagnée en 4 temps, CTA → contact préréglé Achat (D-5) · « Ils l'ont rencontrée » supprimée, « Ils ont travaillé avec Anne » à 3 avis entiers dont 1 relié à une story avec photo (D-8, D-9) · story à 2 témoignages avec rôle + variante 1 témoignage (D-9) · À propos fusionnée à ancres (D-11) · vidéo méthode avec/sans (D-12) · champ « votre projet » sur Contact · estimation dans les finalités RGPD · courbe à 8 actes sans répétition adjacente · CTA du hero au-dessus de 844 px en 390 · pile 3 positions, refrain 2 états, mouvement réduit · gate serveur, opt-in distinct, tout en français · index EN plus court, état vide · Composants (5 états, erreur, focus, cibles 44 px).

---

## F. Séquence proposée

1. **Trancher A1–A4** (15 min, JB) → `structure-site.md` v5 + `DECISIONS.md` mis à jour (D-6 ✅ A, D-13 geste non, D-14 CTA terra-deep, D-15 méthode renommée, D-16 pile actée, D-17 symbole seul).
2. **Corriger le canvas** sur les points « (canvas) » : citations sur les cartes, avis acheteurs sur Acheter, case e-mails sur l'estimation, story mobile, sortie A mobile / B desktop, menu à 2 entrées, hamburgers, libellé A-01, tweak 4 cartes, téléphone obligatoire Contact — une passe courte, puis séance Anne (protocole brief § 9).
3. **Collecte des actifs** (D) en parallèle — c'est le vrai chemin critique.
4. **Implémentation** ensuite, sur la stack du spine (Astro 7 / Cloudflare Workers, scroll-craft) avec `00-footer` et une nav fixe dès le départ, tokens sémantiques ajoutés au design system.

---

# Passe 2 — export du 2026-09-22

_Comparé : nouvel export (350 627 o, 974 lignes) vs export du 19/09 ; `support.js` identique ; CDC `main` @ `6b42bda` (D-13, D-14)._

## Ce qui a changé dans la maquette (diff complet, 169 lignes touchées)

| Changement | Conforme au CDC ? |
|---|---|
| **Hero desktop 1170 → 900 px**, vidéo 1600 × 900, bloc nom + CTA à 84 px du bas | ✓ (CTA visible sans défiler ; spec `01-accueil-hero-video` mise à jour à 1440 × 900) |
| **Lockup Anne + eXp** (`<symbol id="lkExpNeg">`, sans descripteur) dans les 22 pieds de page (488 × 58 / 350 × 42) + **en tête des mentions légales** (`lkExp` positif) | ✓ D-13, D-14 (logo sans sous-titre) — reste 🔄 à valider avec Anne |
| Tweak `cercleLogoNegatif` (cercle écru du logo négatif masqué par défaut) | Point de charte à arbitrer, à consigner |
| **Bouton « Diagnostic » retiré de toutes les barres** (desktop, réduite, mobile) | ✗ **contredit D-7 ✅** (« bouton Diagnostic et bascule FR/EN maintenus »), `structure-site` § 0 (« Un CTA en en-tête : Diagnostic, pilule terracotta ») et son mobile (« le CTA Diagnostic reste visible hors du menu, c'est le parcours principal ») — et l'artboard Décisions liste encore D-7 dans « Tranché le 13/09 ». **Décision à trancher et à consigner (D-15 ?)** ; conséquence : sur mobile il ne reste que logo + hamburger, plus aucun accès au parcours principal sans ouvrir le menu |
| Note de travail retirée de la section Avis | ✓ |
| Artboard Décisions : ligne « D-13 co-branding » ajoutée (lockup footer ✓ reco / logo eXp aussi en en-tête, non dessiné) | ✓ |

## Ce qui n'a PAS bougé — les points « (canvas) » de la passe 1 restent ouverts

Tous vérifiés absents du nouvel export :
- B2.1 citation de témoignage sur les cartes de la pile · B2.2 libellé « A-01 · vidéo Sciez (si l'ouverture est une photo) » périmé · B2.3 dates des avis · B2.7 tweak « 4 cartes »
- B3.1 fiche story mobile · B3.2 variante sans photo secondaire
- B5.1 case séparée « séquence d'e-mails » sur l'estimation
- B6.1 **section « preuve — avis d'acheteurs » sur Acheter**
- B8.1 Sortie A mobile / Sortie B desktop · B9.1 téléphone obligatoire sur Contact
- B1.2 menu « À propos » à deux sous-entrées · B1.4 YouTube absent du footer (toujours Immodvisor · Instagram · LinkedIn)
- C1 **hamburger écru sur écru** : toujours 4 mobiles (Ventes, Contact, Guide, Légal — l. 401, 834, 863, 886) · C2 `url(#avtSymV)` cassé sur `01-hero-bloc-bas`

## Nouveaux points liés à D-13 / D-14
1. **Ligne de statut absente.** `structure-site` § 0 (v4, 22/09) demande une « ligne de statut : consultante indépendante — Léman & Chablais — eXp France » dans le footer. `00-footer` porte « © 2026 Anne Vial-Tissot · agent commercial indépendant, réseau eXp France · RSAC à compléter » ; les 21 autres footers n'ont que « © 2026 Anne Vial-Tissot · eXp France » — sans le secteur. À aligner (une seule formulation, partout).
2. Le lockup embarque le nom en `<text>` Italiana (dépend de la police web), pas en tracé — OK pour la maquette, mais au build utiliser `design-system/assets/lockup-exp-horizontal-negatif.svg` (texte vectorisé si dispo) pour que le logo eXp reste « intouchable ».
3. Le `DECISIONS.md` livré dans l'export est **l'ancien journal du canvas** (hero à quatre plans, geste signature « dessiné », pages 03 Méthode / 04 Anne, D-13 inséré dans une table numérotée 1–7) — il n'est pas le `maquettes/lot-3-complet/DECISIONS.md` du dépôt (D-1 → D-14). À supprimer de l'export ou à remplacer par celui du dépôt : deux journaux, c'est zéro journal.

## État des contradictions A1–A4
Inchangées côté CDC (carrousel vs pile, nom de la méthode, décisions du canvas non consignées, numérotation). S'y ajoute **A5 : bouton Diagnostic retiré vs D-7**.
