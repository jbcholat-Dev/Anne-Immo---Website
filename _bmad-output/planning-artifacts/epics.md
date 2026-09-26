---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/specs/spec-anne-website/SPEC.md
  - _bmad-output/planning-artifacts/architecture/architecture-anne-website-2026-08-29/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/structure-site.md
  - maquettes/lot-3-complet/DECISIONS.md
  - site/README.md
  - site/PLAN.md
  - contenu-anne/README.md
mode: retroactif-et-prospectif
created: 2026-09-26
status: a-valider-par-JB
---

# Site Anne Vial-Tissot - Epics et stories

## Overview

Ce document découpe le projet en **epics** (grands lots qui apportent chacun quelque chose de visible à Anne, au visiteur ou à JB) et en **stories** (unités de travail d'une session : un objectif, des critères de réussite vérifiables, un commit).

Il a été écrit le 2026-09-26, **après** la construction du site v1 (22-23 septembre 2026), pour deux raisons :

1. **Régulariser** : le site v1 a été construit à partir d'un plan (`site/PLAN.md`) et documenté (`site/README.md`), mais sans stories suivies. Les epics 1 à 5 et une partie des epics 6 et 7 sont donc **rétroactifs** : chaque story dit ce qui a été fait, dans quel commit, et comment cela a été vérifié.
2. **Planifier la suite** : les epics 8 à 12 couvrent ce qui reste entre la v1 actuelle et le lancement public. Ils se déroulent désormais story par story, avec le suivi de sprint (`_bmad-output/implementation-artifacts/sprint-status.yaml`) et le tableau de bord de JB.

Sources : la spec v5 (contrat, capacités CAP-1 à CAP-11), le spine d'architecture (18 décisions AD-1 à AD-18), la maquette lot 3 et ses décisions D-1 à D-26, l'état réel du code.

## Requirements Inventory

### Functional Requirements

Les exigences fonctionnelles sont les **capacités** de la spec v5. Une capacité décrit ce que le site doit permettre, pas comment.

- FR1 (CAP-1) : Visuels professionnels. Le visiteur voit des vidéos et photos des biens réellement traités par Anne, dès l'accueil ; aucune image de banque.
- FR2 (CAP-2) : Preuve sociale tierce. Les avis Immodvisor (note, nombre, extraits, vendeurs et acheteurs) sont affichés avec lien vers la fiche source ; au moins 3 avis entiers sur l'accueil, attribués et reliés à leur story quand elle existe.
- FR3 (CAP-3) : Stories de biens vendus. Au moins 3 stories au lancement, chacune avec photo, récit d'Anne et au moins un témoignage (vendeur ou acheteur, rôle indiqué).
- FR4 (CAP-4) : Diagnostic 360°. Questionnaire de 17 écrans, 10 questions notées sur 100 en 3 catégories, résultats personnalisés, fidèle à `quiz-conception-notion.md`.
- FR5 (CAP-5) : Capture du lead. Bouton diagnostic visible en accueil ; les résultats complets sont donnés contre les coordonnées.
- FR6 (CAP-6) : Contact direct. Depuis toute page, pour vendeurs et acheteurs, avec la nature du projet ; chaque envoi est stocké côté site.
- FR7 (CAP-7) : Activation après diagnostic. Sortie A (prospect qualifié) : rendez-vous ; sortie B : guide et séquence d'e-mails envoyée par le site.
- FR8 (CAP-8) : Téléchargement du guide. Selon le profil ; aussi hors diagnostic contre prénom, nom, e-mail ; fichier jamais accessible par adresse directe.
- FR9 (CAP-9) : Prise de rendez-vous. Calendrier réel (Cal.com), fuseau du visiteur, confirmations, acceptation obligatoire, réservation stockée côté site.
- FR10 (CAP-10) : Multilingue. FR et EN en v1 ; une langue livrée est complète ou n'existe pas ; une adresse par langue.
- FR11 (CAP-11) : Demande d'estimation. Formulaire dédié (prénom, nom, téléphone, e-mail, commune, type de bien, consentement) ; Anne rappelle ; aucune valeur calculée par le site.

### NonFunctional Requirements

Les exigences non fonctionnelles sont les **contraintes** de la spec v5 et les objectifs de succès.

- NFR1 : Performance et mobile. Conçu pour le téléphone d'abord ; l'accueil est utilisable en moins de 3 secondes sur connexion mobile (vidéo différée, images adaptées).
- NFR2 : Référencement local. Le site vise le Chablais et le bassin lémanique (la stratégie détaillée reste à cadrer, epic 11).
- NFR3 : Conformité RGPD. Base légale par finalité, mentions légales, politique de confidentialité, consentement distinct pour la séquence d'e-mails, désabonnement dans chaque e-mail, données en Union européenne, purge à 3 ans.
- NFR4 : Aucun lead perdu. Chaque lead est écrit côté site avant toute diffusion ; un renvoi ne crée jamais un doublon ; champs obligatoires par source.
- NFR5 : Charte v1 obligatoire, co-branding eXp en pied de page uniquement.
- NFR6 : Pas de vitrine de biens en ligne.
- NFR7 : Diagnostic recréé nativement, sans dépendance à ScoreApp.
- NFR8 : Réalisation interne, Astro 7 sur Cloudflare Workers ; coût récurrent d'environ 80 € par an.
- NFR9 : Contenu produit par Anne (vidéos, photos, témoignages, récits, guide) sur le chemin critique ; la vidéo « méthode » est facultative et attendue après le lancement.
- NFR10 : Objectifs à 6 mois après mise en ligne (spec, « Success signal ») : leads qualifiés, taux de complétion du diagnostic supérieur ou égal à 40 %.

### Additional Requirements

Décisions d'architecture (spine, AD-1 à AD-18) qui pèsent sur les stories :

- AD-1 : le contenu est un objet typé hors du code (`src/content/`, schémas déclarés) ; jamais de texte éditorial dans les gabarits.
- AD-2 : une langue livrée est complète ou n'existe pas ; le build échoue s'il manque une clé.
- AD-3 : une adresse par langue, pas de détection automatique.
- AD-4 : écrire d'abord (base D1), diffuser ensuite, une seule fois (clé d'idempotence).
- AD-5 : le gate du diagnostic est côté serveur ; les résultats n'existent pas dans le navigateur avant soumission.
- AD-6 : une table de leads, un contrat de champs par source (diagnostic, contact, guide, rdv, estimation).
- AD-7 : rien n'entre en base sans vérification serveur (Turnstile, champ piège, limite de fréquence, schéma ; webhooks signés).
- AD-8 : un fournisseur par fonction derrière un adaptateur unique (Resend, Cal.com, Better Stack) ; e-mail depuis annevialtissot.fr ; guide par lien signé.
- AD-9 : Anne titulaire de chaque compte, JB administrateur, MFA partout ; transfert du dépôt GitHub avant le lancement public.
- AD-10 : tout est reconstructible depuis le dépôt ; RUNBOOK exécuté depuis une machine vierge avant le lancement ; D1 en juridiction eu.
- AD-11 : zéro traceur non essentiel ; rien n'est déposé avant une action du visiteur ; mesure sans cookie.
- AD-12 : la panne se détecte par une machine (test synthétique quotidien, surveillance externe).
- AD-13 : référencement généré depuis `identite`, cohérent avec la fiche Google.
- AD-14 : Modelo est un aval (e-mail prêt à copier, marquage depuis l'admin).
- AD-15 : budget de performance et JavaScript en îlots déclarés.
- AD-16 : RGPD (bases légales, consentements horodatés, purge à 3 ans, pages légales par langue).
- AD-17 : la charte v1 est la seule source visuelle.
- AD-18 : les droits des personnes s'exercent depuis l'admin, sans JB.
- Environnements (spine) : production = branche main, domaine annevialtissot.fr ; preview = chaque branche, adresse `*.workers.dev` ; local = `wrangler dev`.
- Décisions différées par le spine à la « vague 2 » ou « au build » : champs des objets de contenu, CMS de moyen terme, bandeau de consentement, outil d'audit de performance, barème Q10, transfert du dépôt. Traitées dans la story 10.1.

### UX Design Requirements

La référence visuelle est la maquette lot 3 (61 écrans) et ses décisions. Les décisions qui pèsent sur les stories :

- UX-DR1 (D-1, D-19) : hero de l'accueil en vidéo plein cadre, poster de repli, sans liste de communes (D-10).
- UX-DR2 (D-2, D-6, D-17, D-21) : navigation fixe dès le premier pixel, réduite au défilement ; « À propos » avec trois sous-entrées ; symbole seul en en-tête ; pas de bouton diagnostic dans la barre.
- UX-DR3 (D-4) : page Vendre avec deux portes et formulaire d'estimation.
- UX-DR4 (D-5) : page Acheter, formulaire de contact qualifié vente/achat, avis d'acheteurs.
- UX-DR5 (D-8, D-9) : preuve = ventes réelles ou avis vérifiables, rien d'autre ; chaque story porte au moins un témoignage.
- UX-DR6 (D-11, D-12) : À propos = Anne + méthode sur une page à ancres ; vidéo méthode facultative, bloc absent tant qu'elle n'existe pas.
- UX-DR7 (D-13) : lockup Anne + eXp en pied de page et page légale, jamais en en-tête.
- UX-DR8 (D-15) : « Ma méthode : bon sens, rigueur et pragmatisme » ; plus de « Système 360 ».
- UX-DR9 (D-16) : pile de six cartes collantes sur l'accueil.
- UX-DR10 (D-22) : fermeture Klein de l'accueil.
- UX-DR11 (D-23) : profils de score en Klein / terra-deep / brun.
- UX-DR12 (D-24) : tokens sémantiques (texte atténué, blocs réservés, désactivé).
- UX-DR13 (D-25, point ouvert) : contraste des boutons, terra-deep provisoire, à trancher avec Anne.
- UX-DR14 (D-26) : titre « Réalisation ».
- UX-DR15 : mobile 390 px et ordinateur 1440 px conformes à la maquette ; contrastes supérieurs ou égaux à 4,5:1 ; mouvement réduit respecté.
- UX-DR16 : blocs réservés « Actif attendu » (A-01 à A-15) aux dimensions réelles, jamais un trou.

### FR Coverage Map

- FR1 (visuels) : Epic 2 (accueil), Epic 7 (vidéo, photos, portrait), Epic 8 (vidéo intégrée)
- FR2 (preuve sociale) : Epic 2, Epic 3, Epic 7 (avis rapprochés)
- FR3 (stories) : Epic 3, Epic 7 (stories rédigées, autorisations)
- FR4 (diagnostic) : Epic 5, Epic 6 (EN), Epic 10 (gate serveur)
- FR5 (capture du lead) : Epic 5 (gate v1), Epic 10 (écriture serveur)
- FR6 (contact direct) : Epic 4 (formulaires), Epic 10 (écriture et notification)
- FR7 (activation) : Epic 5 (sorties A/B), Epic 7 (séquence rédigée), Epic 10 (séquence envoyée)
- FR8 (guide) : Epic 4 (page), Epic 7 (PDF), Epic 10 (lien signé)
- FR9 (rendez-vous) : Epic 4 (gabarit), Epic 10 (Cal.com intégré)
- FR10 (multilingue) : Epic 1 (dictionnaire), Epic 6
- FR11 (estimation) : Epic 4 (formulaire), Epic 10 (écriture et notification)
- NFR2 (référencement local) : Epic 11
- NFR3, NFR4 (RGPD, aucun lead perdu) : Epic 10, Epic 12
- NFR1, NFR5, NFR9 : Epic 1, Epic 7, Epic 8
- Mise en ligne et propriété (AD-9, AD-10) : Epic 9, Epic 12

## Liste des epics

- **Epic 1 : Socle du site et navigation**
Le visiteur ouvre un site à la charte d'Anne, navigue entre les pages sur ordinateur et téléphone, retrouve le pied de page partout. **FRs :** FR10 (base), NFR5. **État :** fait.

- **Epic 2 : Accueil**
Le visiteur comprend en un écran qui est Anne, voit des preuves réelles et trouve les deux portes (diagnostic, contact). **FRs :** FR1, FR2, FR5. **État :** fait.

- **Epic 3 : Réalisation et stories de vente**
Le visiteur lit des ventes réelles racontées par Anne, avec photos et témoignages attribués. **FRs :** FR2, FR3. **État :** fait.

- **Epic 4 : Pages éditoriales et légales**
Le visiteur trouve qui est Anne, comment vendre ou acheter avec elle, comment la joindre, et les mentions obligatoires. **FRs :** FR6, FR8, FR9, FR11 (côté visiteur). **État :** fait, formulaires simulés.

- **Epic 5 : Diagnostic**
Un prospect fait le diagnostic, laisse ses coordonnées, lit ses résultats et est orienté vers la sortie A ou B. **FRs :** FR4, FR5, FR7. **État :** fait côté navigateur ; passage serveur dans l'epic 10.

- **Epic 6 : Version anglaise**
La clientèle internationale lit le site complet en anglais. **FRs :** FR10. **État :** en cours (accueil et index Track record livrés).

- **Epic 7 : Contenu d'Anne**
Anne fournit ce que le site attend, pièce par pièce. **FRs :** FR1, FR2, FR3, FR7, FR8 ; NFR9. **État :** en cours.

- **Epic 8 : Finition visuelle**
Le site rend comme la maquette sur tous les écrans, avec des polices stables et la vidéo d'ouverture. **FRs :** FR1 ; NFR1, UX-DR15. **État :** à faire.

- **Epic 9 : Mise en ligne d'aperçu**
Anne et JB voient chaque changement sur une adresse en ligne protégée, depuis leur téléphone. **AD-9, AD-10, AD-11.** **État :** à faire, prochain lot.

- **Epic 10 : Capture des leads et backend**
Un prospect qui remplit un formulaire ou termine le diagnostic est enregistré côté site, Anne est prévenue, rien n'est perdu ni exposé. **FRs :** FR5, FR6, FR7, FR8, FR9, FR11 ; NFR3, NFR4 ; AD-4 à AD-8, AD-12, AD-14, AD-16, AD-18. **État :** à faire.

- **Epic 11 : Référencement et visibilité**
Le site est trouvé par les vendeurs et acheteurs du Chablais qui cherchent sur Google. **NFR2, AD-13.** **État :** à définir ; la story 11.1 est la session de cadrage.

- **Epic 12 : Lancement public**
Le site est en ligne sur annevialtissot.fr, trouvable, légal, avec des formulaires qui fonctionnent. **AD-9, AD-10, AD-16 ; NFR3.** **État :** à faire.

Ordre prévu : 9 (aperçu) → 8 et 7 en parallèle sur l'aperçu → 11.1 (cadrage visibilité) → 10 (backend) → 6 (anglais) → 11 (suite) → 12 (lancement).


## Epic 1: Socle du site et navigation

Le visiteur ouvre un site à la charte d'Anne, navigue entre les pages sur ordinateur et téléphone, retrouve le pied de page partout.
**Capacités couvertes :** CAP-1 (visuels réels dès la page d'accueil), CAP-10 (site multilingue par conception : bascule FR / EN, textes d'interface hors du code). **Décisions :** AD-1, AD-2, AD-3, AD-15, AD-17, D-2, D-6, D-13, D-14, D-17, D-21, D-24.

### Story 1.1: Squelette Astro et charte appliquée

En tant que JB,
je veux un site généré en pages statiques (des fichiers HTML produits une fois à la construction, sans serveur à faire tourner) qui n'emploie que les couleurs, polices et espacements de la charte d'Anne,
afin de repartir d'une base propre, rapide, et impossible à faire dériver de l'identité validée.

**Critères d'acceptation :**

**Étant donné** le dossier `site/` avec Astro 7 (générateur de site statique) installé
**Quand** on lance `npm run build`
**Alors** la construction produit toutes les pages en HTML statique, sans erreur, avec `output: 'static'` dans `site/astro.config.mjs`
**Et** `npm run check` (vérification des types TypeScript) ne remonte aucune erreur.

**Étant donné** la feuille de style globale du site
**Quand** on lit `site/src/styles/global.css`
**Alors** elle importe directement `design-system/tokens/tokens.css` (les « tokens » sont les valeurs nommées de la charte : `--avt-ecru`, `--avt-klein`, `--avt-terra`, etc.) et aucune couleur littérale de marque n'apparaît dans les composants (AD-17)
**Et** les titres sont en Italiana et le texte courant en DM Sans, chargées depuis Google Fonts dans `site/src/layouts/Base.astro`.

**Étant donné** les trois gabarits de page (un « layout » est le cadre commun réutilisé par plusieurs pages)
**Quand** une page est créée
**Alors** elle s'appuie sur `Base.astro` (en-tête HTML, favicon, balises de partage), `Page.astro` (navigation + contenu + pied de page complet) ou `Quiz.astro` (navigation masquée pour le parcours du diagnostic, pied de page réduit)
**Et** le tiret des titres en Italiana emploie le tiret insécable U+2011 via `site/src/lib/texte.ts`, la police n'ayant pas de glyphe visible pour le tiret ASCII.

**État :** fait — commit 7ca4478 (22/09/2026). Fichiers : `site/astro.config.mjs`, `site/package.json`, `site/src/layouts/Base.astro`, `site/src/layouts/Page.astro`, `site/src/styles/global.css` (le layout `Quiz.astro` arrive au commit 6fd7e00). Vérification : `npm run build` sans erreur (19 pages), `npm run check` 0 erreur, captures 1440 / 390 de chaque page dans `site/.verif/` (README « Vérification faite »). Écarts assumés : pas de Lenis (défilement inertiel du brief scroll-craft), défilement natif ; tiret U+2011 dans les titres Italiana ; `site/PLAN.md` annonçait une copie locale de `tokens.css`, le site importe en réalité le fichier du design system.

### Story 1.2: Navigation fixe et menu mobile

En tant que visiteur,
je veux une barre de navigation toujours visible, avec les cinq entrées décidées et la bascule de langue, qui se réduit quand je fais défiler et devient un menu plein écran sur téléphone,
afin de passer d'une page à l'autre sans jamais chercher le menu.

**Critères d'acceptation :**

**Étant donné** une page vue sur ordinateur (largeur ≥ 900 px)
**Quand** la page s'affiche
**Alors** la barre montre, de gauche à droite : les trois réseaux (Instagram, YouTube, LinkedIn), un filet, le symbole seul du logo (D-21 : cercle Klein + strate terracotta, sans le nom), puis « À propos ▾ » (sous-menu au survol : Qui suis-je ? · Ma méthode · Cible), Réalisation, Vendre, Acheter, Contact, et la bascule FR EN (D-2, D-6 variante A, D-17)
**Et** aucun bouton « Diagnostic » n'apparaît dans la barre (D-17).

**Étant donné** la barre affichée en haut de page
**Quand** le visiteur fait défiler de plus de 40 px
**Alors** la barre reste fixe (jamais masquée), passe à 56 px de haut sur fond écru à 86 % avec flou, et cache les réseaux
**Et** sa hauteur réelle est exposée en variable CSS `--nav-h` pour caler la pile de cartes de l'accueil (îlot `site/src/islands/nav.ts` ; un « îlot » est le seul petit morceau de JavaScript chargé sur une page statique).

**Étant donné** une page vue sur téléphone (largeur < 900 px)
**Quand** le visiteur touche le bouton « Menu »
**Alors** un menu plein écran s'ouvre avec les mêmes entrées, « À propos » en accordéon (le libellé est un lien, le chevron déplie les trois sous-entrées), les langues FR / EN et les réseaux en bas
**Et** la touche Échap ou le bouton « × » referme le menu et rend le focus au bouton d'ouverture.

**État :** fait — commit 7ca4478 (22/09/2026), retouche survol au commit 530985a (23/09/2026). Fichiers : `site/src/components/Nav.astro`, `site/src/islands/nav.ts`, `site/src/components/Logo.astro`, `site/src/i18n/index.ts`, `site/src/content/ui/fr.json`. Vérification : captures `site/.verif/nav-apropos-ouvert.jpg` (sous-menu ouvert) et `site/.verif/nav-menu-mobile.jpg` (menu plein écran) ; `node scripts/liens.mjs` : chaque lien de la nav mène à une page ou une ancre existante (0 lien cassé). Écarts assumés : sur le hero de l'accueil, la barre est transparente et en écru au repos puis réduite dès 40 px (la maquette ne réduisait qu'après le hero et laissait un trou) ; menu « À propos » à trois sous-entrées alors que la section « Cible » n'est pas tranchée (D-2) ; les liens des réseaux pointent vers les plateformes, pas vers les profils d'Anne (URL inconnues, `site/src/config/site.ts`).

### Story 1.3: Pied de page commun

En tant que visiteur,
je veux retrouver en bas de chaque page le plan du site, les liens légaux, les liens externes et l'identité co-brandée Anne + eXp,
afin de savoir toujours où je suis et qui édite le site.

**Critères d'acceptation :**

**Étant donné** n'importe quelle page utilisant le layout `Page.astro`
**Quand** le visiteur atteint le bas de page
**Alors** il voit le pied de page `00-footer` sur fond brun : colonne « Plan du site » (À propos, Réalisation, Vendre, Acheter, Diagnostic, Le guide, Contact), colonne « Légal » (Mentions légales, Confidentialité, Cookies), colonne « Ailleurs » (Immodvisor, Instagram, YouTube, LinkedIn)
**Et** la bascule FR / EN, la ligne de statut (« Consultante indépendante en immobilier, Léman & Chablais, réseau eXp France ») et le copyright.

**Étant donné** le lockup officiel Anne + eXp (D-13, AD-17)
**Quand** il est inclus dans le pied de page
**Alors** c'est la version négative du fichier `design-system/assets/lockup-exp-horizontal-negatif.svg`, lue telle quelle par `site/src/components/Lockup.astro`, sans le cercle écru (D-21) et sans sous-titre (D-14), le logo eXp jamais recoloré
**Et** le lockup n'apparaît jamais en en-tête (contrainte SPEC « Co-branding eXp »).

**Étant donné** le parcours et les résultats du diagnostic (layout `Quiz.astro`)
**Quand** la page s'affiche
**Alors** un pied de page réduit reprend le lockup négatif, le copyright et les trois liens légaux.

**État :** fait — commit 7ca4478 (22/09/2026). Fichiers : `site/src/components/Footer.astro`, `site/src/components/Lockup.astro`, `site/src/layouts/Page.astro`, `site/src/layouts/Quiz.astro`, `site/src/content/ui/fr.json` (textes du footer). Vérification : présent sur toutes les captures pleine page de `site/.verif/` (desktop et mobile) ; `node scripts/liens.mjs` sur les liens du footer (0 cassé). Écarts assumés : le copyright affiche « RSAC à compléter (A-13) » tant qu'Anne n'a pas fourni son numéro ; co-branding, logo sans sous-titre et sans cercle restent « à montrer à Anne » (D-13, point ouvert 6).

### Story 1.4: Contenu d'Anne branché sur le site

En tant que JB,
je veux que les pages lisent directement les fichiers déposés par Anne dans `contenu-anne/` (récits de vente, avis Immodvisor, instantané de la note, page À propos) et que les photos soient converties automatiquement en formats web,
afin qu'Anne mette à jour son contenu sans toucher au code et que les images restent légères.

**Critères d'acceptation :**

**Étant donné** le fichier `site/src/content.config.ts`
**Quand** le site se construit
**Alors** quatre « collections » Astro (ensembles de fichiers validés par un schéma, AD-1) sont lues hors du dossier `site/` : `stories` (`contenu-anne/stories/*/fr.md`), `avis` (`contenu-anne/avis-immodvisor/20*.md`), `instantane` (`instantane.md`) et `pages` (`contenu-anne/pages/*/fr.md`)
**Et** un champ non conforme (par exemple un `role` autre que `vendeur` / `acheteur`, une `note` non numérique) fait échouer la construction.

**Étant donné** les photos originales des stories (manifeste `photos.json` produit par `scripts/preparer-photos`) et `contenu-anne/photos/`
**Quand** on lance `npm run images` (script `site/scripts/images.mjs`, basé sur sharp, un outil de traitement d'images)
**Alors** chaque photo est dérivée en WebP à 640 / 1280 / 1920 px plus un repli JPEG 1280 px dans `site/public/img/`, et leurs dimensions sont inscrites dans `site/src/data/images.json`
**Et** le composant `site/src/components/Picture.astro` sert ces formats en `<picture>` avec `srcset` (liste de tailles pour que le navigateur choisisse la bonne), chargement différé par défaut, et refuse de construire si une image dérivée manque.

**Étant donné** un avis Immodvisor dont le champ `story:` est vide
**Quand** le site cherche la vente correspondante
**Alors** il utilise la table `liaisonsAssumees` de `site/src/config/site.ts` (Alexandra V. → `appartement-cascade-2024`, RHL acheteur → `auberge-decoupee-2024`), ignorée dès qu'Anne remplit `story:` dans la fiche d'avis
**Et** les textes d'avis sont affichés tels quels, jamais corrigés (`paragraphes()` dans `site/src/lib/contenu.ts`).

**État :** fait — commit 7ca4478 (22/09/2026), ajustement de schéma au commit d478769. Fichiers : `site/src/content.config.ts`, `site/scripts/images.mjs`, `site/src/lib/contenu.ts`, `site/src/lib/images.ts`, `site/src/config/site.ts`. Vérification : `npm run images` déjà lancé et commité (13 photos de stories + photos hors story dans `site/src/data/images.json`), build sans erreur, `npm run check` 0 erreur. Écarts assumés : les trois stories sont affichées malgré `statut: brouillon` et `autorisations: false` pour que JB voie le site plein ; à filtrer sur `statut === 'publie' && autorisations` dans `stories()` avant mise en ligne ; la version sans logo eXp des photos d'Essert-Romand reste à obtenir.

## Epic 2: Accueil

Le visiteur comprend en un écran qui est Anne, voit des preuves réelles et trouve les deux portes (diagnostic, contact).
**Capacités couvertes :** CAP-1, CAP-2, CAP-3 (aperçu), CAP-5 (CTA diagnostic visible en homepage). **Décisions :** AD-1, AD-15, D-1, D-8, D-9, D-10, D-15, D-16, D-19, D-20, D-22.

### Story 2.1: Hero vidéo/poster et bande preuve

En tant que visiteur,
je veux voir dès l'ouverture le nom d'Anne, son positionnement et un bouton vers le diagnostic sur une image réelle d'un bien vendu, puis la note Immodvisor juste en dessous,
afin de comprendre en un écran qui elle est et d'avoir une preuve tierce immédiate.

**Critères d'acceptation :**

**Étant donné** la page `/` sur ordinateur
**Quand** elle s'affiche
**Alors** le hero fait 900 px de haut avec le bloc « Anne VIAL-TISSOT » + ligne de positionnement (« Consultante en immobilier. Chablais et bassin lémanique. ») + bouton « Faire le point sur votre vente · 3 minutes » posé à 84 px du bas de cadre (D-19), sans liste de communes (D-10)
**Et** le bouton mène à `/diagnostic` (CAP-5 : CTA au-dessus de la ligne de flottaison).

**Étant donné** l'actif A-01 (vidéo drone) pas encore fourni
**Quand** le hero se charge
**Alors** une balise `<video>` est en place sans source (masquée par CSS tant qu'elle n'a pas de `src`) et l'image de fond est le poster réel : la vue du Léman depuis Armoy (`stories/auberge-decoupee-2024/photo-003`, `hero.poster` dans `site/src/config/site.ts`), chargée en priorité haute
**Et** sous « mouvement réduit » (réglage d'accessibilité du système), la vidéo est masquée et seul le poster reste (AD-15).

**Étant donné** l'instantané Immodvisor du 22/09/2026 (`contenu-anne/avis-immodvisor/instantane.md`)
**Quand** la bande preuve s'affiche sous le hero
**Alors** elle est sur fond Klein (D-20) et montre « 5 / 5 · 18 avis · Immodvisor », une phrase d'Alexandra V. attribuée (« vendeuse »), et un lien souligné écru vers la fiche Immodvisor
**Et** les chiffres viennent de la collection `instantane`, pas d'un texte en dur.

**État :** fait — commit 7ca4478 (22/09/2026). Fichiers : `site/src/components/accueil/Hero.astro`, `site/src/components/accueil/BandePreuve.astro`, `site/src/config/site.ts`, `site/src/pages/index.astro`. Vérification : captures `site/.verif/accueil-desktop-y0.jpg` et `accueil-mobile-y0.jpg` (hero), `accueil-desktop-mouvement-reduit.jpg`. Écarts assumés : la vidéo A-01 est attendue (commentaire `TODO(contenu A-01)` dans `Hero.astro`) ; le poster est une photo de story faute de vue drone.

### Story 2.2: Pile de six cartes collantes

En tant que visiteur,
je veux faire défiler six ventes réelles qui se superposent comme des cartes, avec une phrase d'Anne et, quand il existe, un extrait d'avis,
afin de voir des maisons vendues plutôt que des annonces.

**Critères d'acceptation :**

**Étant donné** les trois stories rédigées (Thonon-les-Bains, Armoy, Allinges) et les trois ventes du registre `_suivi-stories.md` sans story (Sciez-sur-Léman villa 2025, Essert-Romand chalet 2026, Anthy-sur-Léman T3 2024)
**Quand** la section « Des maisons vendues, pas des annonces » s'affiche
**Alors** six cartes se suivent, chacune collante (`position: sticky`) avec `top` = hauteur de la nav + 24 px, sans effet d'échelle ni de flou (D-16)
**Et** les trois premières ont la photo maîtresse réelle et le lien « Voir cette vente » vers `/realisation/<slug>` ; les trois suivantes portent l'étiquette « Story à venir » et un bloc réservé « Actif attendu A-02 » aux dimensions de la photo (jamais un trou).

**Étant donné** une carte dont la vente est reliée à un avis Immodvisor
**Quand** la carte s'affiche
**Alors** la première phrase de l'avis apparaît en citation courte, attribuée (auteur · rôle), pour les stories reliées et pour les ventes « à venir » dont la fiche d'avis a une `confiance: forte` (Isaline P. pour Sciez, Sabine / François pour Essert-Romand)
**Et** la phrase d'Anne sur chaque story est extraite telle quelle du récit (`phrasesStories` dans `site/src/config/site.ts`).

**Étant donné** un téléphone ou le réglage « mouvement réduit »
**Quand** la pile s'affiche
**Alors** sur téléphone les cartes restent collantes (photo au-dessus, débord de 30 px) ; sous mouvement réduit elles sont en flux normal, sans superposition.

**État :** fait — commit 7ca4478 (22/09/2026), ajustement au commit 6fd7e00. Fichiers : `site/src/components/accueil/Pile.astro`, `site/src/config/site.ts` (`accueil.aVenir`, `phrasesStories`), `site/src/lib/contenu.ts`, `site/src/components/Reserve.astro`. Vérification : captures de l'accueil à trois positions de défilement sur la pile (`site/.verif/accueil-desktop-y1300.jpg`, `y1900`, `y2600` ; mobile `y900`, `y1500`, `y2200`). Écarts assumés : photos A-02 des trois ventes « à venir » attendues ; débord mobile de 30 px conservé de la maquette ; pas de 630 px (hauteur de carte + 30 px) en desktop.

### Story 2.3: Méthode, avis entiers, teaser diagnostic, bloc Anne, fermeture Klein

En tant que visiteur,
je veux, après les ventes, lire la méthode en un coup d'œil, trois avis entiers de gens qui ont travaillé avec Anne, une invitation au diagnostic, un mot sur Anne, puis une fermeture qui m'invite à la contacter,
afin d'avoir toutes les raisons de la croire et deux façons de passer à l'action.

**Critères d'acceptation :**

**Étant donné** la section « Ma méthode, en un coup d'œil »
**Quand** elle s'affiche
**Alors** elle présente les trois piliers « Bon sens », « Rigueur », « Pragmatisme » (D-15 : plus aucun « Système 360™ »), le refrain en trois lignes révélées au défilement (« Pas de mauvaise surprise. / Pas de dossier qui traîne. / Des ventes qui vont au bout. », seul texte animé de la page, îlot `scroll-craft.ts`)
**Et** le lien « La méthode en détail » mène à `/a-propos#methode` (D-11).

**Étant donné** la section « Ils ont travaillé avec Anne » (D-8, D-9, CAP-2)
**Quand** elle s'affiche
**Alors** trois avis Immodvisor sont cités en entier, mêlant vendeurs et acheteurs : Alexandra V. (vendeuse, reliée à la story de Thonon avec la photo du bien et le lien « Voir cette vente »), JcbAnthy (vendeur), Rémi (acheteur), chacun avec auteur, rôle, commune si reliée et date
**Et** un lien « Voir les 18 avis sur Immodvisor » pointe vers la fiche source.

**Étant donné** les sections « Où en est votre vente ? », « Anne » et « Parler à Anne »
**Quand** le visiteur descend jusqu'au bas de page
**Alors** il trouve le bouton « Démarrer le diagnostic » (CAP-5, second CTA § 1.6) avec les trois livrables (/100, 3 axes, 1 plan d'action), un bloc Anne avec portrait réservé A-04, trois lignes et les quatre langues, lien « En savoir plus » vers `/a-propos#qui-suis-je`
**Et** une fermeture sur bande Klein sans image du lac (D-22) avec deux boutons : « Réserver un créneau » (`/contact#reserver`) et « Écrire à Anne » (`/contact#ecrire`).

**État :** fait — commit 7ca4478 (22/09/2026). Fichiers : `site/src/components/accueil/Methode.astro`, `site/src/components/accueil/Avis.astro`, `site/src/components/accueil/Diagnostic.astro`, `site/src/components/accueil/Anne.astro`, `site/src/components/accueil/Fermeture.astro` (plus `site/src/islands/scroll-craft.ts`). Vérification : captures `site/.verif/accueil-desktop-y3900.jpg` (fermeture), `accueil-desktop-pleine.jpg`, `accueil-mobile-pleine.jpg`, `accueil-desktop-mouvement-reduit.jpg` ; `node scripts/liens.mjs` sur les ancres `#methode`, `#qui-suis-je`, `#reserver`, `#ecrire` (0 cassé). Écarts assumés : le choix des trois avis (Alexandra V., JcbAnthy, Rémi) et la liaison Alexandra V. → Thonon (confiance moyenne) sont des choix v1 à confirmer par Anne (point ouvert 4) ; portrait A-04 attendu ; les trois livrables du teaser sont masqués sur téléphone.

## Epic 3: Réalisation et stories de vente

Le visiteur lit des ventes réelles racontées par Anne, avec photos et témoignages attribués (CAP-3).
**Capacités couvertes :** CAP-3, CAP-2 (témoignages reliés). **Décisions :** AD-1, AD-2, AD-3, D-3, D-9, D-26.

### Story 3.1: Index Réalisation

En tant que visiteur,
je veux une page « Réalisation » qui liste chaque bien vendu avec sa photo, sa commune et une phrase,
afin de choisir la vente qui ressemble à ma situation et lire son récit.

**Critères d'acceptation :**

**Étant donné** les stories lues par la collection `stories`
**Quand** le visiteur ouvre `/realisation`
**Alors** le titre h1 est « Réalisation » (D-26, entrée de nav D-3) avec le sous-titre « Chaque bien vendu raconté par Anne … Pas de prix, pas de surface. » (pas de vitrine de biens, non-goal du SPEC)
**Et** une grille de trois cartes (Thonon-les-Bains, Armoy, Allinges) triées par année de vente décroissante montre la photo maîtresse, la commune, la particularité du récit et « Lire la story » vers `/realisation/<slug>`.

**Étant donné** aucune story disponible
**Quand** la page se construit
**Alors** un état vide « Les premières stories arrivent » renvoie vers la méthode et le diagnostic, sans grille cassée.

**Étant donné** la version anglaise (AD-2 : une langue livrée est complète ou n'existe pas)
**Quand** le visiteur ouvre `/en/track-record`
**Alors** aucune story n'étant traduite, la page affiche l'état vide en anglais avec un lien vers les stories en français, et aucune fiche EN n'est générée.

**État :** fait — commit 6fd7e00 (22/09/2026), version EN au commit d478769. Fichiers : `site/src/pages/realisation/index.astro`, `site/src/pages/en/track-record.astro`, `site/src/lib/contenu.ts` (`stories()`, `photoPrincipale()`), `site/src/components/Picture.astro`. Vérification : captures `site/.verif/realisation-desktop.jpg`, `realisation-mobile.jpg`, `en_track-record-desktop.jpg`, `en_track-record-mobile.jpg` ; `node scripts/liens.mjs` (0 cassé). Écarts assumés : stories affichées en statut brouillon (voir Story 1.4) ; l'état vide FR n'a pas été capturé puisque trois stories existent.

### Story 3.2: Fiche story

En tant que visiteur,
je veux lire le récit d'une vente écrit par Anne, voir les photos du bien, et lire ce qu'en disent le vendeur et / ou l'acheteur avec leur rôle indiqué,
afin d'avoir une preuve concrète et vérifiable qu'elle mène des ventes au bout.

**Critères d'acceptation :**

**Étant donné** une story (`contenu-anne/stories/<slug>/fr.md`)
**Quand** le visiteur ouvre `/realisation/<slug>`
**Alors** il voit la photo maîtresse plein cadre (640 px de haut sur ordinateur), le contexte (commune, type de bien, délai et année de vente s'ils sont renseignés), le titre en commune, le récit d'Anne rendu tel quel depuis le Markdown, la galerie des photos secondaires, puis l'encart « Et votre vente ? » (diagnostic + Parler à Anne)
**Et** la route est générée pour chaque story par `getStaticPaths()` ; une story absente donne un 404.

**Étant donné** les témoignages d'une story (CAP-3, D-9 : 0 à 2, rôle vendeur ou acheteur)
**Quand** la section « Ce qu'il / elle en dit » ou « Ce qu'ils en disent » s'affiche
**Alors** les témoignages du front matter (`temoignages:` avec `citation`) sont affichés en priorité ; sinon les avis Immodvisor reliés à la story (champ `story:` ou liaison assumée), attribués « auteur · rôle · Avis Immodvisor »
**Et** le rôle affiché est accordé (vendeur / vendeuse / acheteur / acheteuse).

**Étant donné** une story sans aucun témoignage ni avis relié (cas d'Allinges, `maison-premium-2025`)
**Quand** la fiche s'affiche
**Alors** un bloc réservé « Actif attendu A-07 · témoignage, cité et attribué (vendeur ou acheteur) » de 160 px occupe la place, jamais un trou.

**État :** fait — commit 6fd7e00 (22/09/2026). Fichiers : `site/src/pages/realisation/[slug].astro`, `site/src/lib/contenu.ts` (`avisDeStory()`, `photosDeStory()`), `site/src/components/CtaFin.astro`, `site/src/components/Reserve.astro`. Vérification : captures `site/.verif/realisation_appartement-cascade-2024-desktop.jpg` et `-mobile.jpg` (story de Thonon avec l'avis d'Alexandra V.) ; les 17 routes répondent 200 en `npm run dev`, une route inconnue 404. Écarts assumés : seule la story de Thonon a été capturée (Armoy avec l'avis RHL et Allinges avec le bloc A-07 n'ont pas de capture) ; les deux liaisons avis → story sont assumées (confiance moyenne), Anne confirme via `story:` ; les champs `temoignages` du front matter sont vides dans les trois stories, les témoignages viennent donc des avis Immodvisor.

## Epic 4: Pages éditoriales et légales

Le visiteur trouve qui est Anne, comment vendre ou acheter avec elle, comment la joindre, et les mentions obligatoires.
**Capacités couvertes :** CAP-6, CAP-8, CAP-9, CAP-11 (formulaires en place, envoi simulé en v1). **Décisions :** AD-6, AD-11, AD-16, D-2, D-4, D-5, D-11, D-12, D-13, D-15.

### Story 4.1: À propos, page longue à ancres

En tant que visiteur,
je veux une seule page qui raconte le parcours d'Anne, détaille sa méthode et décrit les profils qu'elle accompagne, avec un repère qui suit ma lecture,
afin de la connaître sans naviguer entre trois pages.

**Critères d'acceptation :**

**Étant donné** la décision D-11 (Méthode et Anne fusionnent)
**Quand** le visiteur ouvre `/a-propos`, `/a-propos#qui-suis-je`, `/a-propos#methode` ou `/a-propos#cible`
**Alors** une seule page longue s'affiche avec trois sections ancrées (Qui suis-je ? · Ma méthode · Cible), un repère collant (`data-repere`) dont l'entrée courante suit le défilement
**Et** le texte du parcours et de la méthode reprend `contenu-anne/pages/a-propos/fr.md` (D-15 : trois piliers, quatre traductions concrètes, six partenaires : expert-comptable, géomètre, diagnostiqueurs, notaire, urbanisme, gestion de projet).

**Étant donné** la vidéo méthode A-15 absente (D-12)
**Quand** la section « Ma méthode » se construit
**Alors** le bloc vidéo n'est rendu que si le champ `video` de la page existe (`page.data.video`), et la page est complète sans lui : ni trou, ni bloc réservé
**Et** le portrait A-04 et « Anne en situation » A-05 sont des blocs réservés aux dimensions réelles.

**Étant donné** la section « Cible » (point ouvert 1, D-2)
**Quand** elle s'affiche
**Alors** quatre profils (primo-accédants, investisseurs, cadres en mobilité, seniors) sont présentés avec la pastille « Point ouvert 1 · contenu à écrire par Anne ».

**État :** fait — commit 6fd7e00 (22/09/2026). Fichiers : `site/src/pages/a-propos.astro`, `site/src/content.config.ts` (collection `pages`), `site/src/components/CtaFin.astro`, `site/src/components/Signature.astro`. Vérification : captures `site/.verif/a-propos-desktop.jpg` et `a-propos-mobile.jpg` ; `node scripts/liens.mjs` valide les trois ancres depuis la nav, le footer et l'accueil. Écarts assumés : section « Cible » conservée avec ses textes de placement (non tranché) ; les textes de la page sont un condensé de `contenu-anne/pages/a-propos/fr.md` écrit dans `a-propos.astro`, pas un rendu direct du Markdown (écart à AD-1 « aucune chaîne éditoriale dans les gabarits »).

### Story 4.2: Vendre et Acheter

En tant que vendeur ou acheteur,
je veux une page « Vendre » qui me propose le diagnostic ou une demande d'estimation, et une page « Acheter » qui explique la recherche accompagnée avec des avis d'acheteurs,
afin d'entrer par la porte qui correspond à mon projet.

**Critères d'acceptation :**

**Étant donné** la page `/vendre` (D-4)
**Quand** elle s'affiche
**Alors** deux portes sont proposées : « Faire le point sur votre vente » (bouton vers `/diagnostic`) et « Faire estimer mon bien » (ancre `#estimation`)
**Et** le formulaire d'estimation (CAP-11) comporte 8 champs : prénom, nom, téléphone (obligatoire, 10 chiffres ou format international +…), e-mail, commune du bien, type de bien (Maison / Appartement / Chalet / Terrain / Autre), message facultatif, case d'acceptation de la politique de confidentialité obligatoire, plus la case séparée « séquence d'e-mails » facultative (AD-16 : deux consentements distincts).

**Étant donné** un envoi du formulaire d'estimation
**Quand** un champ obligatoire manque ou est mal formé
**Alors** le message d'erreur s'affiche sous le champ, un résumé « N champs à corriger » apparaît et le focus va au premier champ en erreur ; en cas de réussite (simulée, 700 ms), la confirmation « Anne vous rappelle … au <téléphone> » remplace le formulaire ; avec `?simuler=echec`, l'alerte d'échec s'affiche et les valeurs saisies sont conservées (CAP-5 / CAP-11 : renvoi possible).

**Étant donné** la page `/acheter` (D-5)
**Quand** elle s'affiche
**Alors** elle présente les deux profils (primo-accédants, investisseurs), la recherche accompagnée en quatre temps (elle repère, visite en premier, présélectionne, reste après l'achat), la section « Ils ont acheté avec Anne » avec deux avis Immodvisor d'acheteurs entiers (RHL, JamesW) et le lien vers la fiche
**Et** le bouton « Parler de votre projet » mène à `/contact?projet=achat#ecrire` (formulaire de contact préréglé sur « Achat », pas de source de lead supplémentaire, CAP-6).

**État :** fait — commit 6fd7e00 (22/09/2026), types au commit d478769. Fichiers : `site/src/pages/vendre.astro`, `site/src/components/FormulaireEstimation.astro`, `site/src/pages/acheter.astro`, `site/src/islands/formulaires.ts`, `site/src/components/Champ.astro`. Vérification : captures `site/.verif/vendre-desktop.jpg`, `vendre-mobile.jpg`, `acheter-desktop.jpg`, `acheter-mobile.jpg` ; `node scripts/liens.mjs` (ancre `#estimation`, lien préréglé). Écarts assumés : envoi simulé, aucun lead écrit (TODO(backend) n° 1 : POST `/api/estimation` avec Turnstile, champ piège, identifiant ULID, écriture D1 avant diffusion) ; pastilles « Point ouvert 2 · champs du formulaire » sur Vendre et « Contenu à écrire par Anne » sur Acheter ; les états erreur / succès / échec des formulaires ne figurent pas dans `.verif/` (vérifiés à la main, non capturés).

### Story 4.3: Contact et Guide

En tant que prospect,
je veux réserver un créneau de trente minutes ou écrire à Anne en précisant si je vends ou j'achète, et recevoir le guide des 10 erreurs contre mes coordonnées,
afin de la joindre sans passer par le diagnostic.

**Critères d'acceptation :**

**Étant donné** la page `/contact` (CAP-9)
**Quand** le visiteur ouvre `#reserver`
**Alors** il voit un gabarit Cal.com statique à la charte (calendrier de septembre 2026, quatre heures, jour et heure sélectionnables, libellé du bouton mis à jour), suivi du mini-formulaire nom / e-mail / téléphone obligatoire / case d'acceptation obligatoire, puis la confirmation « <jour>, <heure> » après envoi simulé
**Et** le commentaire `TODO(backend / CAP-9)` indique que l'embed Cal.com réel sera chargé après action du visiteur (AD-11).

**Étant donné** la section « Écrire à Anne » (`#ecrire`, CAP-6)
**Quand** le formulaire s'affiche
**Alors** il recueille prénom, nom, e-mail, téléphone (obligatoire), « Votre projet » Vente / Achat en boutons radio, message, case de confidentialité obligatoire et case séquence d'e-mails facultative
**Et** l'arrivée par `/contact?projet=achat` coche « Achat » automatiquement.

**Étant donné** la page `/guide` (CAP-8)
**Quand** le visiteur remplit « Recevoir le guide »
**Alors** prénom, nom, e-mail et acceptation sont obligatoires, le téléphone est facultatif (AD-6, décision du 07/09/2026), la couverture A-10 est un bloc réservé et la confirmation annonce un lien par e-mail valable 48 heures
**Et** le PDF n'a aucune adresse publique sur le site (`TODO(backend)` n° 5 : lien signé expirant).

**État :** fait — commit 6fd7e00 (22/09/2026). Fichiers : `site/src/pages/contact.astro`, `site/src/components/FormulaireContact.astro`, `site/src/pages/guide.astro`, `site/src/components/Case.astro`, `site/src/islands/formulaires.ts`. Vérification : captures `site/.verif/contact-desktop.jpg`, `contact-mobile.jpg`, `guide-desktop.jpg`, `guide-mobile.jpg` ; ancres `#reserver` / `#ecrire` validées par `node scripts/liens.mjs`. Écarts assumés : Cal.com en gabarit statique (aucune disponibilité réelle, aucune confirmation envoyée) ; les dates indisponibles gardent le token `--avt-disabled` de la maquette (contraste 1,7:1, information non essentielle, remplacé par l'embed) ; envoi des formulaires simulé.

### Story 4.4: Mentions légales, confidentialité, cookies et page 404

En tant que visiteur,
je veux lire qui édite le site, ce qui est fait de mes données et ce qui est déposé dans mon navigateur, et tomber sur une page utile si l'adresse est fausse,
afin que le site respecte le RGPD et ne me laisse jamais dans une impasse.

**Critères d'acceptation :**

**Étant donné** le layout `Legal.astro` (sommaire collant à gauche, corps à droite)
**Quand** le visiteur ouvre `/mentions-legales`
**Alors** le lockup positif Anne + eXp est en tête (D-13), et les champs éditeur (RSAC, greffe, carte pro), coordonnées et hébergeur sont lus depuis `identite` dans `site/src/config/site.ts` ; les valeurs absentes s'affichent en pastille « à compléter · A-13 ».

**Étant donné** la page `/confidentialite` (AD-16)
**Quand** elle s'affiche
**Alors** elle liste cinq traitements avec finalité, base légale et durée : estimation, diagnostic, contact / rendez-vous, guide (mesures précontractuelles, 3 ans) et séquence d'e-mails (consentement séparé, désinscription à chaque envoi), nomme les sous-traitants prévus (Cloudflare en UE, Resend, Cal.com) et décrit les droits (accès, rectification, effacement, opposition, CNIL).

**Étant donné** la page `/cookies` (AD-11)
**Quand** elle s'affiche
**Alors** elle indique qu'aucun traceur non essentiel n'est déposé, que seule la sauvegarde locale du diagnostic est conservée sur l'appareil, et que l'agenda Cal.com n'est chargé qu'après action du visiteur.

**Étant donné** une adresse inconnue
**Quand** le serveur répond 404
**Alors** la page `/404` (balise `noindex`) affiche « Cette page n'existe pas » et trois boutons : Retour à l'accueil, Réalisation, Démarrer le diagnostic, avec nav et pied de page complets.

**État :** fait — commit 6fd7e00 (22/09/2026). Fichiers : `site/src/layouts/Legal.astro`, `site/src/pages/mentions-legales.astro`, `site/src/pages/confidentialite.astro`, `site/src/pages/cookies.astro`, `site/src/pages/404.astro`. Vérification : captures `site/.verif/mentions-legales-*.jpg`, `confidentialite-*.jpg`, `cookies-*.jpg`, `404-*.jpg` ; une route inconnue renvoie 404 en `npm run dev`. Écarts assumés : textes légaux de structure conformes à AD-16 mais à faire valider par Anne avant publication ; valeurs A-13 (RSAC, carte pro, hébergeur, téléphone, e-mail) à compléter ; liste des sous-traitants « à confirmer au branchement du backend ».

## Epic 5: Diagnostic

Un prospect fait le diagnostic de 17 écrans, laisse ses coordonnées, lit ses résultats et est orienté vers la sortie A ou B (CAP-4, CAP-5, CAP-7).
**Capacités couvertes :** CAP-4, CAP-5, CAP-7, CAP-8 (depuis les résultats). **Décisions :** AD-1, AD-5 (cible, non atteinte en v1), AD-6, AD-15, AD-16, D-15, D-17, D-23.

### Story 5.1: Landing du diagnostic

En tant que prospect,
je veux une page d'entrée autonome qui me dit ce que je vais obtenir en trois minutes, qui pose les questions et pourquoi la croire,
afin de décider de commencer sans avoir lu le reste du site.

**Critères d'acceptation :**

**Étant donné** la page `/diagnostic` (landing autonome, décision du 29/08/2026 conservée par D-4)
**Quand** elle s'affiche
**Alors** au-dessus de la ligne de flottaison : le titre « Découvrez en 3 minutes si votre stratégie de vente va réellement fonctionner », les trois livrables numérotés (score sur 100, diagnostic sur trois axes, recommandations), le bouton « Démarrer le diagnostic » vers `/diagnostic/questions`
**Et** une photo réelle d'un bien vendu (Allinges) illustre la page, sans banque d'images.

**Étant donné** les trois blocs de crédibilité
**Quand** le visiteur descend
**Alors** il voit « Qui pose ces questions » (portrait A-04 réservé, dix ans de finance, FR · EN · ES · PT), la note « 5 / 5 · 18 avis Immodvisor » avec la phrase d'Alexandra V. et la vignette de la story de Thonon, puis un bloc Klein « Trois minutes, un score, un plan d'action. » avec un second bouton de départ
**Et** une sortie basse « Pas envie de répondre à 15 questions ? Le guide des 10 erreurs, sans le diagnostic. » mène à `/guide`.

**État :** fait — commit 6fd7e00 (22/09/2026). Fichiers : `site/src/pages/diagnostic/index.astro`, `site/src/lib/contenu.ts`, `site/src/config/site.ts`, `site/src/components/Reserve.astro`. Vérification : captures `site/.verif/diagnostic-desktop.jpg` et `diagnostic-mobile.jpg` ; liens validés par `node scripts/liens.mjs`. Écarts assumés : portrait A-04 attendu ; la page n'a pas été revue en séance avec Anne (DECISIONS, « 02 Diagnostic (landing) : non revue »).

### Story 5.2: Parcours de 17 écrans avec reprise et abandon

En tant que prospect,
je veux répondre aux 15 questions écran par écran, revenir en arrière, quitter et reprendre plus tard là où j'en étais,
afin de finir le diagnostic sans repartir de zéro.

**Critères d'acceptation :**

**Étant donné** le contenu `site/src/content/diagnostic/questions.json` (libellés du live `quiz-contenu.md`, identifiants immuables `q01`…`q15` et options `q01.a`…, AD-1)
**Quand** le prospect ouvre `/diagnostic/questions`
**Alors** le parcours est strictement linéaire (aucun branchement, CAP-4) sur 17 écrans pour 15 numéros (Q10 et Q11 scindées en deux écrans chacune), avec la barre de progression, le repère « Question n / 15 » dans l'en-tête du layout `Quiz.astro`, et la nav principale masquée
**Et** trois gabarits d'écran existent : choix unique (choisir passe à l'écran suivant), choix multiple avec bouton « Suivant » et champ « Autre (préciser) », texte libre Q15 avec compteur et bouton « Passer ».

**Étant donné** un écran à partir du deuxième
**Quand** le prospect clique « ← Retour »
**Alors** l'écran précédent se réaffiche avec sa réponse cochée (CAP-4 : retour arrière possible dès le 2ᵉ écran)
**Et** sur Q7 « Aucune diffusion » est exclusive des autres plateformes, et « Autre » ne compte que si le champ texte est renseigné.

**Étant donné** l'état sauvegardé dans `localStorage` (mémoire locale du navigateur) sous la clé `avt.diagnostic.v1` à chaque écran (réponses par identifiants, `journey_id`, paramètres `utm_`)
**Quand** le prospect revient sur `/diagnostic/questions` après avoir quitté
**Alors** un écran « Vous étiez à la question n » propose « Reprendre » ou « Recommencer »
**Et** un clic sur le logo pendant le parcours ouvre la boîte « Quitter le diagnostic ? » qui rappelle que les réponses sont gardées sur l'appareil.

**Étant donné** JavaScript désactivé
**Quand** la page s'affiche
**Alors** un message `<noscript>` renvoie vers « écrire à Anne » ou « recevoir le guide » plutôt qu'un écran vide.

**État :** fait — commit 6fd7e00 (22/09/2026), corrections retour / focus au commit 1da5d99 (22/09/2026). Fichiers : `site/src/pages/diagnostic/questions.astro`, `site/src/islands/diagnostic.ts`, `site/src/content/diagnostic/questions.json`, `site/src/layouts/Quiz.astro`. Vérification : `node scripts/e2e-diagnostic.mjs` (Playwright, un outil qui pilote un navigateur) parcourt les 17 écrans trois fois (parcours A à 390 px, B à 1440 px, R à 390 px), teste abandon puis reprise à l'écran 8, sans erreur console ; captures `site/.verif/diag-A-ecran-1.jpg`, `-7`, `-15`, `diag-A-abandon.jpg`, `diag-A-reprise.jpg`, `diagnostic_questions-*.jpg`. Écarts assumés : Q14 option a cite le descripteur de la conception à la place du « Système 360™ » du live (D-15) ; les libellés ne sont disponibles qu'en français (AD-2 : le diagnostic EN n'existe pas encore).

### Story 5.3: Gate de capture, calcul du score, page de résultats

En tant que prospect,
je veux voir mon score après avoir laissé mes coordonnées, lire le détail par axe avec ses recommandations, et être orienté vers un rendez-vous ou vers le guide,
afin de savoir où en est ma vente et quoi faire ensuite.

**Critères d'acceptation :**

**Étant donné** le 17ᵉ écran validé
**Quand** le « gate » (écran de capture) s'affiche
**Alors** il annonce « Votre diagnostic est prêt » avec le score global seul, et demande prénom, nom, e-mail, téléphone (indicatif FR +33 / CH +41, 10 chiffres), la case d'acceptation obligatoire et la case séquence d'e-mails facultative (CAP-5, AD-6) avec la mention finalité / conservation 3 ans / responsable
**Et** en cas d'erreur les messages s'affichent sous les champs avec focus sur le premier ; en cas d'échec d'envoi (`?simuler=echec`) réponses et coordonnées sont conservées et le bouton devient « Renvoyer ».

**Étant donné** le barème `site/src/content/diagnostic/bareme.json` (source `quiz-conception-notion.md`)
**Quand** `calculer()` de `site/src/lib/scoring.ts` s'exécute à la soumission
**Alors** le total sur 100 se répartit en Préparation 40 (q01…q04), Visibilité 40 (q05…q08, q07 par nombre de plateformes), Efficacité 20 (q09, q10 en matrice visites × offres), chaque axe avec brut, pourcentage et bande 0-40 / 41-70 / 71-100 % (CAP-4)
**Et** l'orientation est A si score ≥ 71 ET Q14 = premium (`q14.a`) ET Q12 ≠ « minimiser les frais » (`q12.d`), sinon B (CAP-7).

**Étant donné** la page `/diagnostic/resultats` lue depuis `sessionStorage` (mémoire de l'onglet) sous la clé `avt.diagnostic.resultat`
**Quand** elle s'affiche dans les 24 h
**Alors** elle montre le score, la pastille de profil colorée Klein / terra-deep / brun (Bien préparé / Bases solides / Stratégie à risque, D-23), les trois sous-scores brut + %, les 9 feedbacks (insight + « Impact chiffré » par axe et par bande, `feedbacks.json`), puis la sortie A (boutons « Réserver un rendez-vous » vers `/contact#reserver` et contact direct, guide en second) ou la sortie B (bouton guide, puis proposition de la séquence d'e-mails, masquée si déjà cochée au gate)
**Et** les états « Le guide est parti » (lien 48 h) et « Séquence de 7 e-mails confirmée » s'affichent après clic.

**Étant donné** aucun résultat en session (URL directe ou plus de 24 h)
**Quand** le visiteur ouvre `/diagnostic/resultats`
**Alors** l'état « Ce lien n'est plus valable » propose « Recevoir un nouveau lien » et « Refaire le diagnostic », sans afficher de score.

**État :** fait — commit 6fd7e00 (22/09/2026), gate mobile corrigé au commit 1da5d99 (22/09/2026), contraste de la pastille « Bases solides » au commit 530985a (23/09/2026). Fichiers : `site/src/islands/diagnostic.ts` (gate), `site/src/lib/scoring.ts`, `site/src/content/diagnostic/bareme.json`, `site/src/content/diagnostic/feedbacks.json`, `site/src/pages/diagnostic/resultats.astro` + `site/src/islands/resultats.ts`. Vérification : `node scripts/e2e-diagnostic.mjs` : sortie A (profil Bien préparé), sortie B (Q12 minimiser), profil « Stratégie à risque », erreurs du gate, lien expiré, aucune erreur JS ; captures `site/.verif/diag-A-gate.jpg`, `diag-A-gate-erreurs.jpg`, `diag-A-resultats.jpg`, `diag-B-resultats.jpg`, `diag-R-resultats.jpg`, `diag-resultats-expire.jpg`. Écarts assumés : le gate et le score sont côté navigateur, le résultat est atteignable dans l'onglet sans jeton serveur (écart à AD-5, `TODO(backend)` n° 2 : POST `/api/diagnostic`, jeton à usage unique, page rendue par le noyau, barème lu par le serveur seulement ; prévu à l'epic 10) ; envoi du guide et opt-in séquence simulés (n° 3) ; barème Q10 (matrice visites × offres) non tranché, à valider avec Anne ; Q2 « Certains diagnostics à refaire » = 5 pts et Q5 « + vidéo » = 10 pts sont des choix v1 ; pastille « Bases solides » sur écru bordé au lieu du galet de la maquette (contraste ≥ 4,5:1) ; chiffres des feedbacks non sourcés, à revalider avant mise en ligne (SPEC, Assumptions).


# Version anglaise, contenu d'Anne, finition visuelle (epics 6 à 8)

Rédigé le 2026-09-26 à partir de `site/README.md`, `site/PLAN.md`, `contenu-anne/` (README, suivi des stories, vidéos, guide, légal, portrait), `strategie-contenu.md`, `DECISIONS.md` (D-1 à D-26), la spec v5 (CAP-1, 2, 3, 7, 8, 10 et la contrainte « Production de contenu par Anne ») et le spine d'architecture (AD-1, 2, 3, 5, 11, 15, 16, 17). Le code cité est celui de `main` au 2026-09-26 (dernier commit `a1987fe`).

Repères de vocabulaire, utilisés dans tout le document :

- **CAP-n** : une capacité de la spec (ce que le site doit faire). **AD-n** : une décision d'architecture du spine (comment il est construit). **D-n** : une décision de maquette (à quoi il ressemble). **A-nn** : un actif attendu d'Anne (vidéo, photo, texte) de la table des actifs de `structure-site.md`.
- **Build** : la construction du site, la commande `npm run build` qui transforme le code et le contenu en pages prêtes à mettre en ligne. **Commit** : un enregistrement daté dans l'historique Git, identifié par un code court (hash).
- **Story** a deux sens ici : une story BMAD (une unité de travail, ce document) et une story de vente (le récit d'un bien vendu, `contenu-anne/stories/`). Le contexte lève l'ambiguïté.

## Epic 6: Version anglaise

Le visiteur anglophone lit le site en anglais, page par page, sans jamais tomber sur un écran mi-traduit : ce qui est traduit est livré en entier, ce qui ne l'est pas n'existe pas en anglais.
**Capacités couvertes :** CAP-10 (multilingue), et par ricochet CAP-2, CAP-3, CAP-4 pour leurs textes. **Décisions :** AD-2 (une langue livrée est complète ou n'existe pas), AD-3 (une URL par langue, jamais de détection automatique), AD-5 (état du diagnostic indépendant de la langue), AD-1 (identifiants immuables `qNN`), D-26 (l'index EN s'appelle « Track record »).

### Story 6.1: Accueil EN et index Track record

En tant que visiteur anglophone,
je veux ouvrir `/en` et `/en/track-record` et y lire l'accueil et l'index des ventes en anglais,
afin de comprendre qui est Anne et ce qu'elle fait sans passer par le français.

**Critères d'acceptation :**

**Étant donné** un visiteur sur `/en`
**Quand** la page s'affiche
**Alors** il voit la même composition que l'accueil français (hero, bande de preuve, méthode, « They worked with Anne », diagnostic, Anne, fermeture), avec les libellés du dictionnaire `site/src/content/ui/en.json` (le fichier qui contient tous les textes d'interface en anglais)
**Et** la pile des six cartes de ventes (§ 1.3, D-16) n'apparaît pas, parce qu'aucune story n'est traduite (AD-2 : un objet non traduit n'est pas publié dans cette langue).

**Étant donné** un visiteur sur `/en/track-record`
**Quand** la page s'affiche
**Alors** il voit le titre « Track record » (D-26) et un état vide (« The first stories are on their way ») avec un lien vers les stories en français, marqué `hreflang="fr"` (l'attribut qui dit au navigateur et à Google dans quelle langue est la page visée), et un bouton vers le diagnostic.

**Étant donné** la bascule FR / EN de la barre de navigation, sur une page française qui n'a pas d'équivalent anglais (À propos, Vendre, Contact…)
**Quand** le visiteur clique sur « EN »
**Alors** il arrive sur `/en` (accueil anglais), jamais sur un écran mi-traduit (fonction `bascule` de `site/src/i18n/index.ts`)
**Et** les avis Immodvisor cités sur `/en` restent en français et sont signalés comme tels (règle : un avis vérifié n'est jamais modifié).

**État :** fait. Commit `d478769` (2026-09-22) ; fichiers `site/src/pages/en/index.astro`, `site/src/pages/en/track-record.astro`, `site/src/content/ui/en.json`, `site/src/i18n/index.ts` ; vérification : `npm run build` (19 pages), captures `npm run verif` de `/en` et `/en/track-record` en 1440 et 390 px dans `site/.verif/`, `node scripts/liens.mjs` sans lien cassé. Écart assumé et documenté dans `site/README.md` : les autres entrées de la navigation EN renvoient pour l'instant aux pages françaises.

### Story 6.2: Pages éditoriales et légales en anglais

En tant que visiteur anglophone,
je veux lire À propos, Vendre, Acheter, Contact, Guide et les trois pages légales en anglais, à leur propre adresse `/en/…`,
afin de pouvoir me renseigner, écrire à Anne ou demander une estimation sans changer de langue.

**Critères d'acceptation :**

**Étant donné** les huit pages éditoriales et légales (À propos, Vendre, Acheter, Contact, Guide, Mentions légales, Confidentialité, Cookies)
**Quand** le site est construit
**Alors** chacune existe sous un préfixe `/en/` avec son propre slug anglais (le slug est la partie de l'adresse qui nomme la page, par exemple `/en/sell` pour `/vendre` ; les slugs exacts sont à fixer dans `routes` de `site/src/i18n/index.ts` et ne changent plus une fois publiés, AD-3)
**Et** les entrées de la navigation EN, le menu mobile et le pied de page mènent à ces pages, plus jamais aux pages françaises ; la bascule FR / EN relie chaque page à son équivalent.

**Étant donné** un formulaire (contact, estimation, guide) affiché sur une page anglaise
**Quand** le visiteur le remplit, se trompe, ou l'envoie
**Alors** libellés des champs, messages d'erreur, confirmation et message d'échec sont en anglais, tirés de `en.json`
**Et** l'envoi porte `lang = en` pour que le futur lead (la fiche de prospect enregistrée côté site) sache dans quelle langue répondre (AD-6 : « un lead sans langue » est interdit).

**Étant donné** les trois pages légales en anglais
**Quand** elles sont rédigées
**Alors** elles reprennent exactement les finalités, bases légales, sous-traitants et durée de conservation de trois ans des pages françaises (AD-16), avec les valeurs A-13 (RSAC, carte professionnelle, hébergeur) de la story 7.6
**Et** Anne les valide avant publication, comme les pages françaises (`site/README.md`, « à faire valider par Anne »).

**Étant donné** une clé manquante dans `en.json` ou une page obligatoire sans version anglaise
**Quand** `npm run build` tourne
**Alors** le build échoue et nomme ce qui manque (AD-2), au lieu de publier un écran mi-traduit.

**État :** à faire. Responsable : Claude (traduction, routes, build), Anne (relecture des traductions : elle travaille en quatre langues ; qui traduit en premier, Claude ou Anne, à préciser avec Anne), JB (validation) ; prérequis : textes français stabilisés (À propos validé par Anne, A-09 ; texte d'Acheter écrit par Anne, D-5 ; points ouverts 1 « Cible » et 2 « champs de l'estimation » tranchés, sinon on traduit des textes provisoires), story 7.6 pour les valeurs légales. Le contenu d'À propos vit dans `contenu-anne/pages/a-propos/fr.md` : sa version anglaise est un fichier `en.md` à côté, même en-tête de champs, texte traduit (règle des gabarits).

### Story 6.3: Diagnostic en anglais

En tant que prospect anglophone,
je veux faire le diagnostic en anglais, du premier écran à la page de résultats,
afin d'obtenir mon score et mes recommandations dans ma langue.

**Critères d'acceptation :**

**Étant donné** un prospect qui démarre le diagnostic depuis une page `/en/…`
**Quand** il parcourt les 17 écrans, le formulaire de capture (le « gate », l'écran de coordonnées qui précède les résultats) et la page de résultats
**Alors** questions, options, boutons, erreurs, score, profil (D-23), trois sous-scores et les neuf feedbacks (textes d'analyse par axe et par bande) sont en anglais, ainsi que les sorties A (rendez-vous) et B (guide + séquence d'e-mails)
**Et** le barème `site/src/content/diagnostic/bareme.json` reste unique, indexé par les identifiants immuables `q01…q17` et `q01.a…` partagés par toutes les langues (AD-1) : les libellés anglais vivent dans des fichiers par langue (par exemple `questions.en.json`, `feedbacks.en.json`), jamais dans une copie du barème.

**Étant donné** un parcours commencé en français et arrêté à l'écran 7
**Quand** le visiteur bascule en anglais
**Alors** il reprend à l'écran 7 avec ses réponses conservées, parce que l'état de l'îlot (le petit programme qui tourne dans le navigateur) est stocké par identifiants `qNN`, indépendants de la langue (AD-5 ; sauvegarde locale `avt.diagnostic.v1`).

**Étant donné** les libellés anglais
**Quand** on les compare à `quiz-contenu.md` (libellés du diagnostic en ligne, source des écrans FR)
**Alors** l'ordre des 17 écrans, le nombre d'options et la règle de Q7 (nombre de plateformes cochées) sont identiques ; l'option a de Q14 reprend le descripteur retenu en français (le « Système 360™ » est retiré, D-15)
**Et** les mêmes réponses donnent le même score, le même profil et la même sortie A ou B qu'en français.

**Étant donné** `node scripts/e2e-diagnostic.mjs` (le script qui rejoue le diagnostic de bout en bout dans un navigateur automatisé)
**Quand** il est lancé sur les routes anglaises
**Alors** sortie A, sortie B, profil « à risque », abandon et reprise, erreurs du gate et lien expiré passent sans erreur console, comme en français.

**État :** à faire. Responsable : Claude (traduction, séparation libellés / barème, routes `/en/…` du diagnostic à fixer), Anne (relecture des libellés et des feedbacks en anglais) ; prérequis : story 6.2 (interface EN complète), barème de Q10 tranché avec Anne (point ouvert de la spec, matrice provisoire dans `bareme.json`), chiffres non sourcés des feedbacks revalidés avant mise en ligne (spec, Assumptions). Note : la version serveur du gate (AD-5, TODO backend 2) n'est pas un prérequis ; la traduction se fait sur l'îlot actuel et survit au passage au serveur.

### Story 6.4: Stories et avis en anglais

En tant que visiteur anglophone,
je veux lire les stories de vente traduites et voir quels avis Immodvisor s'y rattachent,
afin de juger sur des ventes réelles, comme un visiteur français.

**Critères d'acceptation :**

**Étant donné** une story dont le dossier `contenu-anne/stories/<slug>/` contient `fr.md` et `en.md` (même en-tête de champs, récit et témoignages traduits, titre et slug anglais propres, AD-2), avec `statut: publie` et `autorisations: true`
**Quand** le site est construit
**Alors** sa fiche existe sous `/en/track-record/<slug-en>`, elle est listée dans l'index « Track record » et sa carte apparaît dans la pile de l'accueil anglais
**Et** la fiche française et la fiche anglaise se déclarent mutuellement en `hreflang`, et la bascule FR / EN passe de l'une à l'autre.

**Étant donné** une story sans `en.md`
**Quand** le site est construit
**Alors** elle est absente de l'index anglais, du plan du site (sitemap, la liste des pages fournie à Google) et des balises `hreflang` (AD-2 : ni index, ni sitemap, ni balise de langue) ; depuis sa fiche française, « EN » mène à `/en/track-record`, pas à une page vide.

**Étant donné** un avis Immodvisor affiché sur une page anglaise (accueil, fiche story, page Acheter)
**Quand** il est rendu
**Alors** il est cité mot pour mot dans sa langue d'origine, avec la mention qu'il est en français, jamais traduit ni corrigé (règle des avis vérifiés, `contenu-anne/avis-immodvisor/README.md`) ; afficher ou non une traduction à côté de l'original : à préciser avec Anne.

**Étant donné** le témoignage porté par l'en-tête d'une story (`temoignages:`) 
**Quand** la story est traduite
**Alors** la citation en anglais provient de `en.md` et la traduction d'un témoignage a l'accord de la personne citée (autorisation écrite, story 7.9) ; la forme de cet accord est à préciser avec Anne.

**État :** à faire. Responsable : Anne (traduction ou validation des récits anglais, accord des personnes citées), Claude (collection `stories` étendue aux `en.md` dans `site/src/content.config.ts`, pages `/en/track-record/[slug]`, pile EN) ; prérequis : story 7.9 (contenu français complet et publiable) puis story 6.2 (interface EN). Rien à traduire avant que les trois stories françaises soient publiables : traduire un brouillon, c'est le traduire deux fois.

## Epic 7: Contenu d'Anne

Anne fournit ce que le site attend, pièce par pièce : chaque story dit exactement quoi déposer, où, et ce qui se passe ensuite ; le site remplace alors ses blocs « Actif attendu » par du réel.
**Capacités couvertes :** CAP-1 (visuels), CAP-2 (preuve sociale), CAP-3 (stories), CAP-7 (séquence d'e-mails), CAP-8 (guide) ; contrainte « Production de contenu par Anne » de la spec (cette production est sur le chemin critique du lancement). **Décisions :** AD-1 (le contenu est un objet typé hors du code : un dossier par objet, un fichier par langue), AD-13 (identité = source unique), AD-16 (RGPD), AD-17 (charte v1 seule source visuelle), D-1 (vidéo drone en hero), D-6 (réseaux dans la navigation), D-9 (preuve = vente réelle ou avis vérifiable), D-12 (vidéo méthode facultative, après lancement).

### Story 7.1: Trois stories de vente rédigées

En tant qu'Anne,
je veux que mes trois récits de vente (Thonon, Armoy, Allinges) soient rangés au format du site,
afin qu'ils apparaissent tels quels dans les fiches Réalisation et dans la pile de l'accueil.

**Critères d'acceptation :**

**Étant donné** les trois récits écrits par Anne
**Quand** ils sont rangés dans `contenu-anne/stories/`
**Alors** chaque vente a son dossier nommé `commune-type-annee` sans nom de client (`appartement-cascade-2024` Thonon-les-Bains, `auberge-decoupee-2024` Armoy, `maison-premium-2025` Allinges) et un `fr.md` au gabarit `_gabarits/story.md` : en-tête de champs (commune, type de bien, année, particularité, photos, témoignages, `statut`, `autorisations`) puis le récit
**Et** le récit est à la première personne, 400 à 600 mots, sans prix, sans critique d'autres agences (principes de `_suivi-stories.md`).

**Étant donné** le site construit
**Quand** on ouvre `/realisation` et `/realisation/<slug>`
**Alors** les trois fiches affichent le récit d'Anne tel quel et la pile de l'accueil porte une phrase extraite de chaque récit (`phrasesStories` dans `site/src/config/site.ts`).

**Étant donné** le registre `contenu-anne/stories/_suivi-stories.md`
**Quand** on le lit
**Alors** il distingue « rédigée » (3 sur 22) de « publiable » (0 sur 22) et liste, pour chaque story, ce qui manque encore (témoignage, autorisation ; année de vente d'Allinges à confirmer ; ton de la story d'Allinges à harmoniser).

**État :** fait. Commits `b2c09f0` (rangement au format gabarit), `f60815a` (suivi), `78b0fc5` (2026-09-22, sélection des photos) ; fichiers `contenu-anne/stories/{appartement-cascade-2024,auberge-decoupee-2024,maison-premium-2025}/fr.md`, `_suivi-stories.md` ; vérification : les trois stories sont lues par la collection `stories` de `site/src/content.config.ts`, fiches et index rendus (`npm run build`, captures `.verif/realisation-*`). Ce qui reste (témoignages, autorisations, `statut: publie`) est la story 7.9.

### Story 7.2: Avis Immodvisor relevés et rapprochés des ventes

En tant qu'Anne,
je veux que mes 18 avis Immodvisor soient relevés un par un et rapprochés de mes ventes,
afin que le site affiche une preuve vérifiable (note, nombre, avis entiers) reliée aux stories.

**Critères d'acceptation :**

**Étant donné** la fiche Immodvisor d'Anne relevée le 2026-09-22
**Quand** on lit `contenu-anne/avis-immodvisor/`
**Alors** `instantane.md` porte la note (5), le nombre d'avis (18), l'adresse de la fiche et la date du relevé, et il existe 18 fichiers `AAAA-MM-JJ-pseudonyme.md`, un par avis, texte cité tel quel, avec le rôle (vendeur ou acheteur).

**Étant donné** chaque fiche d'avis
**Quand** on lit son en-tête
**Alors** elle porte une proposition de rapprochement (`vente_candidate`, `confiance` forte / moyenne / faible / aucun, `indice`) et deux champs réservés à Anne : `story` (la vente confirmée, seul champ lu par le site) et `retenu` (les trois avis cités en entier sur l'accueil)
**Et** le registre « Ventes photographiées » de `_suivi-stories.md` relie dossiers photos, stories et avis.

**Étant donné** le site construit
**Quand** on ouvre l'accueil
**Alors** la bande de preuve affiche 5/5, 18 avis et le lien vers la fiche (CAP-2) ; la section « Ils ont travaillé avec Anne » cite trois avis entiers (choix v1 dans `site/src/config/site.ts` : Alexandra V., JcbAnthy, Rémi ; point ouvert 4 de la maquette)
**Et** tant qu'Anne n'a pas rempli `story`, le site applique les liaisons assumées `liaisonsAssumees` (Alexandra V. → Thonon, RHL acheteur → Armoy) ; dès qu'elle le remplit, ce tableau est ignoré.

**État :** fait. Commits `c86aa43` (instantané) et `8358611` (2026-09-22, une fiche par avis, registre) ; fichiers `contenu-anne/avis-immodvisor/*.md`, `_suivi-stories.md` § Ventes photographiées, `site/src/config/site.ts`, `site/src/lib/contenu.ts` (`storyDeAvis`) ; vérification : collection `avis` chargée (18 entrées) au build, captures de l'accueil et d'Acheter. Suite pour Anne, dans la story 7.9 : confirmer `story:` fiche par fiche et poser `retenu: true` sur les trois avis choisis.

### Story 7.3: Photos web des trois stories

En tant qu'Anne,
je veux choisir mes photos par leur numéro dans mes dossiers HD et laisser le site fabriquer les versions web,
afin de ne jamais recadrer ni compresser moi-même.

**Critères d'acceptation :**

**Étant donné** les photos HD classées par Anne dans `contenu-anne/Stories  photos/<VENTE>/` (9 dossiers, 135 photos, 1,4 Go, hors Git)
**Quand** Anne renseigne `dossier_photos`, `photo_principale` et `photos` dans le `fr.md` d'une story, puis que JB ou Claude lance `scripts/preparer-photos` (à la racine du dépôt)
**Alors** le dossier `contenu-anne/stories/<slug>/photos/` reçoit les versions web (3 200 px au plus grand côté, JPEG qualité 85, sRGB, toutes métadonnées retirées, nommées `photo-NNN.jpg` d'après le numéro d'origine) et un `photos.json` qui décrit chaque photo (rôle principale ou secondaire, dimensions).

**Étant donné** ces versions web
**Quand** `npm run images` tourne dans `site/`
**Alors** les formats dérivés (WebP et JPG, plusieurs largeurs) arrivent dans `site/public/img/` et `site/src/data/images.json`, et les fiches, l'index Réalisation, la pile et le poster du hero (vue du Léman depuis Armoy, `photo-003`) les utilisent.

**Étant donné** les règles du dépôt
**Quand** on regarde Git
**Alors** aucune photo HD ni vidéo n'y entre (`.gitignore`), seules les versions web y sont ; 13 photos web pour les trois stories au 2026-09-22
**Et** la sélection actuelle est une proposition de Claude : Anne peut changer les numéros dans `fr.md`, on relance les deux scripts.

**État :** fait. Commit `78b0fc5` (2026-09-22) et `7ca4478` (script `images.mjs` du site) ; fichiers `scripts/preparer-photos`, `contenu-anne/stories/*/photos/`, `site/scripts/images.mjs`, `site/public/img/`, `site/src/data/images.json` ; vérification : 13 fichiers `photo-NNN.jpg`, `npm run build` sans image manquante, captures des fiches. Point de vigilance pour plus tard : les 17 photos d'Essert-Romand portent le logo eXp incrusté, à redemander sans logo au photographe avant toute story sur cette vente.

### Story 7.4: Vidéo d'ouverture du hero

En tant qu'Anne,
je veux choisir, parmi mes vidéos drone, le passage qui ouvre le site,
afin que la première image du site soit un bien que j'ai vendu, avec le Léman reconnaissable (D-1, CAP-1).

**Critères d'acceptation :**

**Étant donné** les 11 vidéos inventoriées dans `contenu-anne/videos/liens.md` (locales, hors Git ; Thonon, Anthy, Sciez, Évian en priorité pour le Léman)
**Quand** Anne choisit
**Alors** elle indique dans `liens.md` le fichier source et le passage retenu (minute:seconde de début et de fin, 10 à 20 s exploitables en boucle), paysage 16:9, 1920 px de large minimum, sans incrustation ni logo, sans son (A-01)
**Et** si une autre machine doit récupérer le fichier, elle colle le lien de partage OneDrive dans la dernière colonne (règle de `videos/README.md`).

**Étant donné** le passage choisi
**Quand** JB ou Claude l'encode
**Alors** deux fichiers sortent : `ouverture.mp4` (1080p, 8 à 12 s, sans piste audio, moins de 6 Mo) et `ouverture.webm` (même contenu, format plus léger pour les navigateurs qui le lisent), déposés dans `site/public/video/` (le chemin `/video/ouverture.mp4` attendu par le commentaire `TODO(contenu A-01)` de `site/src/components/accueil/Hero.astro`)
**Et** l'original reste hors Git ; seuls les extraits encodés entrent dans le dépôt (`strategie-contenu.md`, « Vidéos »).

**Étant donné** l'image d'ouverture A-14 (le « poster », l'image fixe affichée avant la vidéo et à sa place sur mobile, connexion lente ou mouvement réduit)
**Quand** la vidéo est choisie
**Alors** le poster est soit une image extraite de la vidéo (paysage, 2 400 px minimum), soit la photo actuelle du Léman depuis Armoy : à préciser avec Anne ; un recadrage portrait ou carré pour le mobile est bienvenu si Anne en a un (A-01, « si possible »).

**État :** à faire. Responsable : Anne (choix du passage), JB ou Claude (encodage, dépôt) ; prérequis : aucun. L'intégration dans le hero (chargement différé, replis, budget de vitesse) est la story 8.3. Note : `videos/README.md` demande 10 à 20 s de source ; la spécification A-01 du hero demande 8 à 12 s encodées : la source est plus longue que l'extrait final, ce n'est pas une contradiction.

### Story 7.5: Portrait et photos en situation

En tant qu'Anne,
je veux déposer mon portrait et une ou deux photos de moi sur le terrain,
afin que l'accueil, la page À propos et la landing du diagnostic montrent qui je suis au lieu d'un bloc « Actif attendu A-04 ».

**Critères d'acceptation :**

**Étant donné** Anne
**Quand** elle dépose ses photos
**Alors** `contenu-anne/portrait/` contient un portrait (vertical ou carré, 1 600 px minimum, fond simple, A-04) et une à deux photos en situation (visite, échange client, terrain, A-05), originaux non recadrés ni compressés, noms en minuscules avec tirets et sans accents (par exemple `anne-portrait.jpg`, `anne-visite-thonon.jpg`)
**Et** les photos en situation peuvent aussi aller dans `contenu-anne/photos/` (les deux README l'admettent) ; un seul dossier suffit, `portrait/` de préférence.

**Étant donné** les fichiers déposés
**Quand** Claude lance `npm run images` (à étendre au dossier `portrait/` si le script ne le lit pas encore)
**Alors** les formats dérivés arrivent dans `site/public/img/` et `images.json`, et les blocs réservés sont remplacés : A-04 sur l'accueil § 1.7 (`site/src/components/accueil/Anne.astro`), sur À propos (`site/src/pages/a-propos.astro`, blocs desktop et mobile) et sur la landing du diagnostic (`site/src/pages/diagnostic/index.astro`) ; A-05 sur À propos (bloc « Anne en situation »)
**Et** les libellés « Actif attendu A-04 » de `fr.json` et `en.json` (`anne_portrait`, `anne_portrait_m`) deviennent un texte alternatif réel (par exemple « Anne Vial-Tissot », à préciser avec Anne).

**Étant donné** l'affichage mobile
**Quand** on ouvre l'accueil et À propos en 390 px
**Alors** le portrait est recadré en 4:5 (le format vertical prévu par la maquette et les libellés mobiles), sans déformation, sujet centré
**Et** `npm run verif` montre les photos sur les captures 1440 et 390 et `site/README.md` « Réel vs placeholder » retire A-04 et A-05 de la liste des blocs réservés.

**État :** à faire. Responsable : Anne (dépôt), Claude (dérivation, intégration, README) ; prérequis : aucun. Si le portrait vient d'un photographe professionnel, son accord pour l'usage web est à confirmer avec Anne (même règle qu'une photo de bien).

### Story 7.6: Coordonnées légales et professionnelles

En tant qu'Anne,
je veux donner une seule fois mon numéro RSAC, ma carte professionnelle et mes coordonnées,
afin que les mentions légales, le pied de page et, plus tard, la fiche Google et les données structurées soient exactement les mêmes partout (AD-13).

**Critères d'acceptation :**

**Étant donné** Anne
**Quand** elle remplit `contenu-anne/legal/identite.md` (copie du gabarit `_gabarits/identite.md`)
**Alors** les lignes sont toutes renseignées : nom complet, statut (agent commercial indépendant, mandataire eXp France), numéro RSAC et ville du greffe, référence de la carte professionnelle du réseau eXp France, adresse professionnelle, téléphone au format international (`+33 6 …`), adresse e-mail, lien de la fiche Immodvisor
**Et** ces valeurs sont identiques à celles de sa fiche Google Business (règle de `legal/README.md`).

**Étant donné** `identite.md` rempli
**Quand** Claude reporte les valeurs dans `identite` de `site/src/config/site.ts` (`rsac`, `cartePro`, `telephone`, `email`) et que JB renseigne `hebergeur` (l'hébergeur est Cloudflare, choisi par l'architecture ; ce n'est pas à Anne de le fournir)
**Alors** `/mentions-legales` n'affiche plus aucune pastille « à compléter · A-13 » (classe `a-completer`), le pied de page affiche le RSAC à la place de « RSAC à compléter (A-13) » (`fr.json` et `en.json`, clé `copyright`), et les pages Confidentialité et Cookies nomment le bon responsable de traitement.

**Étant donné** l'adresse professionnelle
**Quand** elle est publiée
**Alors** elle n'apparaît que dans les mentions légales (obligation légale), pas sur Google ni dans le pied de page ; à confirmer avec Anne
**Et** une fois les valeurs en place, les données structurées `RealEstateAgent` (le bloc que Google lit pour la fiche locale, AD-13, TODO backend 7) sont générées depuis `identite`, dans cette story ou la suivante.

**État :** à faire. Responsable : Anne (`identite.md`), JB (hébergeur, relecture), Claude (report dans `site.ts`, pages légales, données structurées) ; prérequis : aucun. Point de rangement : le README des gabarits place `identite.md` à la racine de `contenu-anne/`, celui de `legal/` dans `legal/` ; retenir `contenu-anne/legal/identite.md` et corriger l'autre README. À terme le site lira `identite.md` directement (AD-1) ; en v1 la recopie dans `site.ts` est acceptée.

### Story 7.7: Adresses des réseaux sociaux

En tant que visiteur,
je veux que les icônes de réseaux de la navigation et du pied de page mènent aux profils d'Anne,
afin de la retrouver sur Instagram, YouTube ou LinkedIn au lieu d'atterrir sur la page d'accueil de la plateforme.

**Critères d'acceptation :**

**Étant donné** Anne
**Quand** elle communique ses adresses
**Alors** `contenu-anne/legal/identite.md` porte trois lignes de plus, `url_instagram`, `url_youtube`, `url_linkedin` (à ajouter au gabarit `_gabarits/identite.md`), avec l'adresse complète de chaque profil, ou la mention « pas de profil » pour ceux qu'elle n'a pas.

**Étant donné** ces adresses
**Quand** Claude les reporte dans `reseaux` de `site/src/config/site.ts`
**Alors** les icônes à gauche du logo dans la navigation (D-6, variante A confirmée le 2026-09-22) et les liens « Ailleurs » du pied de page mènent aux profils, en français comme en anglais
**Et** un réseau sans profil disparaît de la navigation et du pied de page : plus aucun lien vers `instagram.com/`, `youtube.com/` ou `linkedin.com/` nus (le provisoire de la v1).

**Étant donné** le site construit
**Quand** JB ouvre chaque lien
**Alors** chaque lien s'ouvre dans un nouvel onglet sur le profil d'Anne (`node scripts/liens.mjs` ne vérifie que les liens internes ; les trois liens externes se vérifient à la main)
**Et** `site/README.md` retire la ligne « Réseaux sociaux : URLs inconnues » des choix éditoriaux à confirmer.

**État :** à faire. Responsable : Anne (adresses), Claude (report, README) ; prérequis : aucun. Durée : quelques minutes de chaque côté.

### Story 7.8: Guide « 10 erreurs » PDF à la charte

En tant que prospect,
je veux télécharger un guide « Les 10 erreurs fatales des vendeurs particuliers » qui ressemble au site,
afin de repartir avec un contenu utile et crédible (CAP-8, sortie B du diagnostic).

**Critères d'acceptation :**

**Étant donné** le guide actuel (site Gamma, texte de 2025)
**Quand** Anne le relit
**Alors** `contenu-anne/guide/corrections.md` contient ses corrections et ajouts au texte, et sa réponse à la question du README : un seul guide, ou une version par profil de vendeur (les bandes 0-40, 41-70, 71-100 du diagnostic ; l'objet `Guide` de l'architecture prévoit les deux)
**Et** les chiffres et offres cités sont ceux de 2026, pas les tarifs de 2025.

**Étant donné** `corrections.md`
**Quand** JB et Claude produisent le PDF
**Alors** il est en A4, à la charte v1 (titres en Italiana, texte en DM Sans, palette des sept couleurs, aucune couleur ni police hors `design-system/`, AD-17), avec le logo d'Anne (la version avec descripteur est admise sur une couverture, D-14) et le lockup eXp aux endroits que la charte prévoit pour le print
**Et** le fichier n'est pas déposé dans `site/public/` : il ne doit jamais être atteignable par une adresse directe (AD-8, TODO backend 5, lien signé expirant à 7 jours) ; en v1 il est rangé dans `contenu-anne/guide/` en attendant le noyau serveur.

**Étant donné** le PDF terminé
**Quand** sa première page est exportée en image
**Alors** elle remplace les blocs réservés A-10 : la couverture de `/guide` (`site/src/pages/guide.astro`, desktop et mobile) et la vignette de la sortie B sur la page de résultats (`site/src/islands/resultats.ts`, bloc `rs-guide`)
**Et** `site/README.md` retire A-10 de la liste des blocs réservés.

**État :** à faire. Responsable : Anne (corrections, choix un ou plusieurs guides), JB et Claude (production du PDF, tâche Notion « Rebrander le guide PDF »), Claude (couverture sur le site) ; prérequis : aucun pour les corrections ; la livraison réelle du PDF au prospect dépend du backend (epic hors périmètre de ce document). Outil de production du PDF : à préciser avec JB.

### Story 7.9: Autorisations écrites et passage des stories en « publie »

En tant qu'Anne,
je veux réunir, pour chacune des trois stories, le témoignage et l'accord écrit des personnes concernées, puis passer la story en « publie »,
afin que rien ne parte en ligne sans autorisation et que le site public n'affiche que des stories complètes (CAP-3, règle 3 de `contenu-anne/README.md`).

**Critères d'acceptation :**

**Étant donné** chacune des trois stories (Thonon, Armoy, Allinges)
**Quand** Anne la complète dans `contenu-anne/stories/<slug>/fr.md`
**Alors** l'en-tête porte au moins un témoignage (`temoignages:` avec `role` vendeur ou acheteur, `prenom`, `contexte` en une ligne, `citation` ; le vendeur d'abord, son avis Immodvisor convient), la commune et l'année de vente (celle d'Allinges est vide aujourd'hui, à confirmer), et une sélection de photos validée par elle
**Et** le dossier `contenu-anne/stories/<slug>/autorisations/` contient l'accord écrit (un e-mail suffit) du vendeur pour les photos et son témoignage, et de chaque autre personne citée (A-12).

**Étant donné** une story complète
**Quand** Anne passe `statut: a-relire`, que JB relit, puis qu'Anne passe `statut: publie` et `autorisations: true`
**Alors** les fiches d'avis reliées portent `story: <slug>` (confirmation d'Anne, story 7.2) et les trois avis cités sur l'accueil portent `retenu: true`
**Et** le tableau `liaisonsAssumees` de `site/src/config/site.ts` devient sans effet et peut être vidé.

**Étant donné** la fonction `stories()` de `site/src/lib/contenu.ts`, qui aujourd'hui affiche toutes les stories rédigées pour que JB voie le site plein
**Quand** Claude y ajoute le filtre `statut === 'publie' && autorisations` avant la mise en ligne publique
**Alors** seules les stories publiées et autorisées apparaissent dans l'index, les fiches, la pile et le plan du site ; une story `publie` sans `autorisations: true` fait échouer le build en nommant le fichier (garantie prévue par `strategie-contenu.md`, porte 1)
**Et** `site/README.md` retire le choix éditorial « stories affichées malgré brouillon » et la liste « publiable » de `_suivi-stories.md` passe à 3 sur 22.

**État :** à faire. Responsable : Anne (témoignages, autorisations, statuts), JB (relecture), Claude (filtre, build, README) ; prérequis : stories 7.1, 7.2, 7.3 faites. C'est la story qui conditionne la mise en ligne publique et la traduction (6.4) : sans elle, le site en ligne n'a aucune story. Le registre recommande de finir ces trois stories avant d'en écrire une quatrième.

### Story 7.10: Séquence d'e-mails de la sortie B rédigée

En tant que prospect en sortie B du diagnostic (à nurturer),
je veux recevoir, à quelques jours d'intervalle, des e-mails courts qui reprennent le guide avec des cas réels du Chablais,
afin d'avancer sur ma vente et, le moment venu, de contacter Anne (CAP-7).

**Critères d'acceptation :**

**Étant donné** la base écrite fin 2025 dans Notion (« [Marketing] Lead Magnets et Séquence Email » : 7 e-mails de J+0 à J+15, résumés dans `contenu-anne/guide/README.md`)
**Quand** Anne la revoit
**Alors** chaque e-mail retenu est un fichier `contenu-anne/guide/sequence-emails/etape-N/fr.md` au gabarit `_gabarits/email-sequence.md` (`etape`, `delai_jours` après l'inscription, `sujet`, `angle`, `statut`) suivi du corps : une idée, un exemple réel du Chablais, une chose à faire, pas de tarif
**Et** le J+0 (e-mail de résultats, envoyé immédiatement) est distinct de la séquence ; nombre d'étapes et intervalles sont décidés par Anne (à préciser : la base propose 6 e-mails de J+2 à J+15).

**Étant donné** les cas cités (photos pro et Évian, prix et Armoy, visites et Thonon, dossier administratif)
**Quand** Anne les relit
**Alors** chaque cas correspond à une vente réelle du registre et, s'il existe une story publiée, l'e-mail y renvoie ; aucun chiffre ni offre de 2025 périmé
**Et** aucun e-mail ne promet ce que le site ne fait pas (pas d'estimation en ligne, non-goal de la spec).

**Étant donné** les fichiers déposés
**Quand** Claude les branche
**Alors** ils deviennent les objets `SequenceEmail` de l'architecture (AD-1 : étape, délai, sujet et corps par langue), et les libellés du site qui annoncent « Séquence de 7 e-mails » (`site/src/islands/resultats.ts`, case d'opt-in du formulaire d'estimation) reflètent le nombre réel
**Et** l'envoi lui-même (Resend, cron quotidien, lien de désabonnement dans chaque e-mail, AD-16) reste TODO backend 3 ; la version anglaise des e-mails (`en.md`, requise par AD-2 pour livrer l'anglais) est hors de cette story.

**État :** à faire. Responsable : Anne (rédaction et revalidation), JB (relecture, offres citées), Claude (objets, libellés) ; prérequis : story 7.8 (le guide, dont la séquence distille le contenu) ; les stories publiées (7.9) pour les liens. Note : `guide/README.md` demande un seul fichier `sequence-emails.md` alors que le gabarit prévoit un dossier par étape ; Anne peut déposer dans l'une ou l'autre forme, Claude range dans la seconde (c'est celle que le site lit).

## Epic 8: Finition visuelle

Le site rend comme la maquette sur tous les écrans, avec des polices stables, une vidéo d'ouverture réelle et plus aucune pastille de chantier.
**Capacités couvertes :** CAP-1 (visuels dès la homepage), contrainte « Performance, mobile et SEO local » de la spec (mobile-first, page utile en moins de 3 s). **Décisions :** AD-11 (aucun script ni appel tiers non essentiel), AD-15 (budget de performance, vidéo différée avec repli image), AD-17 (charte v1 seule source visuelle), D-1 et D-19 (hero vidéo, bloc posé en bas), D-16 (pile collante gardée en mobile), D-24 (tokens sémantiques), D-25 (contraste des boutons, ouvert).

### Story 8.1: Polices hébergées sur le site

En tant que visiteur,
je veux que les titres en Italiana et le texte en DM Sans s'affichent tout de suite, sans saut ni changement de police,
afin de lire une page stable, et sans qu'un serveur de Google soit appelé à mon insu (AD-11).

**Critères d'acceptation :**

**Étant donné** une page du site
**Quand** elle se charge
**Alors** aucune requête ne part vers `fonts.googleapis.com` ni `fonts.gstatic.com` (vérifié dans l'onglet Réseau du navigateur et par le script de captures) ; les deux lignes `preconnect` et la feuille de style Google Fonts de `site/src/layouts/Base.astro` sont retirées
**Et** les polices viennent de `site/public/fonts/` : Italiana (regular) et DM Sans (400, 500, 700 et italique 400, les seules graisses chargées aujourd'hui ; ou la version « variable » de DM Sans, un seul fichier pour toutes les graisses), au format `woff2` (le format de police le plus compact pour le web). Les deux polices sont sous licence libre OFL, qui autorise cet hébergement.

**Étant donné** `site/src/styles/global.css`
**Quand** les polices sont déclarées
**Alors** chaque fichier a sa règle `@font-face` (la déclaration CSS qui relie un nom de police à un fichier) avec `font-display: swap` (le texte s'affiche tout de suite, la police remplace la police de secours dès qu'elle est prête), et les tokens `--avt-font-display` / `--avt-font-text` de `tokens.css` restent inchangés (AD-17 : le design system reste la source ; s'il doit connaître les fichiers, la modification se fait d'abord dans `design-system/` puis est recopiée).

**Étant donné** `Base.astro`
**Quand** la page est servie
**Alors** les deux fichiers utilisés au-dessus de la ligne de flottaison (Italiana, DM Sans 400) sont annoncés par `<link rel="preload">` (une instruction qui fait télécharger la police en priorité, avant que le CSS ne la demande), avec `crossorigin`
**Et** `site/scripts/verif.mjs` perd sa boucle d'attente « Google Fonts peut être lent ou bloqué ».

**Étant donné** `npm run build` puis `npm run verif`
**Quand** on compare les captures à celles d'avant
**Alors** titres et textes sont identiques (Italiana partout où la maquette la prévoit, tiret insécable U+2011 des titres conservé), aucune erreur console, et `site/README.md` note le changement (polices hébergées, Google Fonts retiré).

**État :** à faire. Responsable : Claude ; prérequis : aucun. À faire en premier dans l'epic : les décalages de rendu que JB a vus peuvent venir du chargement tardif des polices, il faut les stabiliser avant de corriger les écrans.

### Story 8.2: Adaptation aux écrans page par page

En tant que visiteur sur téléphone ou sur grand écran,
je veux chaque page lisible et fidèle à la maquette, sans débordement ni élément coupé,
afin de naviguer et de remplir les formulaires sans gêne (contrainte mobile-first de la spec).

**Critères d'acceptation :**

**Étant donné** la liste des défauts vus par JB sur la v1 (page, taille d'écran, ce qui cloche, capture si possible ; liste à fournir par JB, elle n'est pas dans le dépôt)
**Quand** Claude reprend chaque page
**Alors** chaque défaut de la liste est corrigé ou classé « écart assumé » avec sa raison dans `site/README.md`.

**Étant donné** chacune des 19 pages construites, en 390 px de large (le téléphone de la maquette)
**Quand** on la parcourt de haut en bas
**Alors** aucun défilement horizontal, aucun texte coupé ou chevauché, images dans leur cadre, boutons d'au moins 48 px de haut, menu mobile plein écran avec « À propos » en accordéon, pile de l'accueil en cartes collantes avec le débord de 30 px de la photo (D-16, écart assumé conservé), formulaires utilisables au pouce.

**Étant donné** chaque page en 1 440 px (l'ordinateur de la maquette)
**Quand** on la compare à son artboard de `maquettes/lot-3-complet/`
**Alors** marges, tailles de titres, hauteur du hero (900 px, D-19), position de la pile (`top` = navigation + 24 px, D-16) et pied de page correspondent, aux écarts assumés près
**Et** entre 900 et 1 440 px (tablette, largeur intermédiaire sans artboard) rien ne déborde ni ne se chevauche : le seuil de bascule du site est 899 px.

**Étant donné** `npm run verif` après corrections
**Quand** les captures 1440 et 390 de chaque page (accueil à cinq positions de défilement et en mouvement réduit) sont regénérées dans `site/.verif/`
**Alors** elles sont comparées aux artboards et jointes à la story, et JB vérifie les pages principales sur un vrai téléphone (modèle à préciser avec JB) avant de clore.

**État :** à faire. Responsable : Claude (corrections, captures), JB (liste des défauts, vérification sur téléphone) ; prérequis : story 8.1 (polices stables) ; la story 7.5 (portrait) et 8.3 (vidéo) changent l'accueil, donc une dernière passe de captures est à prévoir après elles.

### Story 8.3: Vidéo d'ouverture intégrée

En tant que visiteur,
je veux que l'accueil s'ouvre sur la vidéo drone d'un bien vendu, en boucle, sans son,
afin de sentir le lieu dès la première seconde, sans que la page devienne lente (D-1, AD-15).

**Critères d'acceptation :**

**Étant donné** `ouverture.mp4` et `ouverture.webm` dans `site/public/video/` (story 7.4)
**Quand** un visiteur ouvre `/` ou `/en` sur ordinateur
**Alors** la vidéo démarre seule, en boucle, sans son (`muted`, sans piste audio), par-dessus le poster, via deux balises `<source>` dans `site/src/components/accueil/Hero.astro`
**Et** la règle CSS actuelle `.hero-video:not([src]) { display: none }` est adaptée : avec des `<source>`, la balise `<video>` n'a pas d'attribut `src`, la règle telle quelle cacherait la vidéo.

**Étant donné** le budget de vitesse (AD-15 : LCP mobile inférieur à 2,5 s, page utile en moins de 3 s ; le LCP est le moment où le plus grand élément visible est affiché)
**Quand** la page se charge
**Alors** le poster reste l'élément affiché en premier (chargement prioritaire déjà en place) et la vidéo n'est demandée qu'après le premier rendu (chargement différé, par exemple `preload="none"` puis lancement par un îlot existant, `scroll-craft`) ; elle ne bloque jamais l'affichage
**Et** un audit Lighthouse mobile (l'outil de mesure de vitesse de Google) de `/` est joint à la story avec ces deux valeurs ; poids de la vidéo inférieur à 6 Mo.

**Étant donné** un visiteur en mouvement réduit (`prefers-reduced-motion`, le réglage du système qui demande moins d'animations), sur mobile (moins de 900 px) ou sur connexion lente (`Save-Data` ou réseau 2G/3G signalé par le navigateur)
**Quand** il ouvre l'accueil
**Alors** seul le poster A-14 s'affiche et la vidéo n'est pas téléchargée (D-1 et AD-15 : repli image sur mobile, connexion lente, mouvement réduit) ; si Anne fournit un recadrage portrait de la vidéo, l'usage mobile est décidé avec JB (à préciser).

**Étant donné** `npm run verif`
**Quand** les captures sont regénérées
**Alors** la capture desktop à la position 0 montre une image de la vidéo, la capture « mouvement réduit » montre le poster, aucune erreur console
**Et** `site/README.md` passe A-01 de « bloc réservé » à « réel » et retire le commentaire `TODO(contenu A-01)` du code.

**État :** à faire. Responsable : Claude ; prérequis : story 7.4 (fichiers encodés), story 8.1 (polices, pour que la mesure de vitesse soit celle du site final). Le bandeau Klein de fermeture reste sans image (D-22) : la vidéo n'apparaît qu'en hero.

### Story 8.4: Retouches contre la maquette et points ouverts de design

En tant que JB,
je veux que les derniers points de design ouverts soient tranchés avec Anne, journalisés, et répercutés dans le site,
afin qu'aucune pastille de chantier ni écart non décidé ne parte en ligne.

**Critères d'acceptation :**

**Étant donné** D-25 (contraste des boutons : terra-deep `#A34E30` provisoire, 5,3:1 sur écru ; terracotta `#C4623E` de la charte, 3,6:1 à 15 px, sous le seuil de 4,5:1 recommandé pour du texte courant)
**Quand** Anne tranche
**Alors** la décision est datée dans `maquettes/lot-3-complet/DECISIONS.md` (D-25 passe de « ouvert » à « tranché ») et `.btn-primaire` de `site/src/styles/global.css` utilise le token retenu, modifié d'abord dans `design-system/components/boutons.html` et `tokens.css` puis recopié (AD-17)
**Et** si terracotta est retenu, le moyen de tenir le contraste (taille ou graisse du texte, ou écart assumé écrit) est à préciser avec Anne et JB.

**Étant donné** les trois pastilles de chantier (classe `marqueur`) : « Point ouvert 1 · contenu à écrire par Anne » sur la section Cible (`site/src/pages/a-propos.astro`), « Point ouvert 2 · champs du formulaire » sur l'estimation (`site/src/pages/vendre.astro`), « Contenu à écrire par Anne » sur Acheter (`site/src/pages/acheter.astro`)
**Quand** les points ouverts 1 (Cible : section d'À propos ou absorbée par Vendre / Acheter, D-2), 2 (champs minimaux de l'estimation, D-4) et le texte d'Acheter (`contenu-anne/pages/acheter/fr.md`, gabarit `page.md`, D-5) sont tranchés ou écrits
**Alors** les trois pastilles sont retirées, le menu « À propos » compte deux ou trois sous-entrées selon la décision sur Cible, et le formulaire d'estimation porte les champs retenus (aujourd'hui 8 champs, proposition par défaut de la spec CAP-11 : prénom, nom, téléphone, e-mail, commune, type de bien, consentement, plus la case séquence d'e-mails).

**Étant donné** la liste « Écarts assumés avec la maquette » de `site/README.md` (pas de défilement inertiel Lenis ; navigation réduite dès 40 px de défilement ; tiret insécable des titres ; pile mobile avec débord de 30 px ; pastille « Bases solides » sur écru bordé au lieu du fond galet ; dates indisponibles du gabarit Cal.com en `--avt-disabled`)
**Quand** JB et Anne la passent en revue
**Alors** chaque écart est soit confirmé (il reste, avec sa raison), soit corrigé (par exemple ajouter Lenis en îlot d'environ 10 Ko si JB le souhaite), et chaque décision est datée dans `DECISIONS.md` (règle de traçabilité de `CLAUDE.md`).

**Étant donné** le point ouvert 6 (co-branding eXp en pied de page et en tête des mentions légales, logo sans sous-titre, logo négatif sans cercle : D-13, D-14, D-21)
**Quand** ces choix sont montrés à Anne sur le site construit
**Alors** elle les valide ou demande une modification, `DECISIONS.md` passe D-13 en « tranché », et `npm run verif` fournit les captures finales des pages touchées.

**État :** à faire. Responsable : Anne (D-25, points ouverts 1, 2, 6, texte d'Acheter), JB (revue des écarts, arbitrage Lenis), Claude (retouches, journal, captures) ; prérequis : story 8.2 (les écrans d'abord, les retouches ensuite) ; le retrait de la pastille d'Acheter dépend du texte d'Anne (D-5). Les pastilles « à compléter · A-13 » des pages légales relèvent de la story 7.6.


# Mise en ligne d'aperçu, référencement et lancement public (epics 9, 11 et 12)

Rédigé le 2026-09-26 à partir du spine d'architecture (AD-1 à AD-18, les 18 décisions techniques du projet), de la spec v5 (CAP-1 à CAP-11, les 11 capacités que le site doit offrir), de `site/README.md` (état réel du code), de `site/astro.config.mjs`, de `site/src/layouts/Base.astro` et de `CLAUDE.md`. Décisions de JB du 2026-09-26 intégrées : aperçu en ligne maintenant, protégé et non indexé ; domaine acheté maintenant mais branché au lancement ; référencement cadré dans une session dédiée, après la structuration et avant le lancement.

État du code au 2026-09-26, vérifié dans le dépôt : le site est statique (`output: 'static'`, aucun backend) ; `Base.astro` pose déjà titre, description, canonique et balises Open Graph, et accepte un réglage `noindex` page par page (utilisé par le diagnostic et la page 404) ; il n'existe ni `robots.txt`, ni sitemap, ni données structurées, ni fichier de configuration Cloudflare (`wrangler.jsonc`), ni `.nvmrc`, ni `RUNBOOK.md` ; `identite` vit dans `site/src/config/site.ts` avec RSAC, carte pro, hébergeur, téléphone et e-mail à `null` (actif A-13 attendu) ; `npm run build` produit 19 pages dans `site/dist`.

Tout est à faire. Chaque story, une fois lancée, prend un fichier dans `_bmad-output/implementation-artifacts/` (règle de traçabilité de `CLAUDE.md` § 2 ; le dossier n'existe pas encore).

## Epic 9: Mise en ligne d'aperçu

Anne et JB voient chaque changement du site sur une adresse en ligne protégée, depuis leur téléphone, sans rien installer.
**Capacités couvertes :** aucune capacité de la spec en propre ; l'aperçu sert à faire valider par Anne toutes les capacités déjà construites (CAP-1 à CAP-11 en version simulée) et la contrainte « maintenable et transférable ». **Décisions :** AD-9 (comptes au nom d'Anne, JB administrateur, MFA), AD-10 (tout est reconstructible depuis le dépôt, RUNBOOK), AD-11 (aucun traceur), AD-12 (alertes de build Cloudflare), AD-15 (l'audit de vitesse se mesure sur l'adresse d'aperçu), environnements « production / preview / local » du spine.

### Story 9.1: Comptes et connexion du dépôt

En tant que JB,
je veux un compte Cloudflare au nom d'Anne, où je suis administrateur, relié au dépôt GitHub du site,
afin que la chaîne de mise en ligne appartienne à Anne dès le premier jour (AD-9) et que chaque push soit construit sans intervention manuelle.

**Critères d'acceptation :**

**Étant donné** qu'Anne n'a pas encore de compte Cloudflare (Cloudflare : l'hébergeur retenu par l'architecture, qui sert le site depuis son réseau mondial et fournira plus tard la base de données et les formulaires)
**Quand** JB crée le compte avec l'adresse e-mail d'Anne comme titulaire (super-administrateur et facturation), s'y invite avec les droits d'administration, et active la MFA (authentification à plusieurs facteurs : un code en plus du mot de passe) sur les deux identités
**Alors** les deux personnes peuvent se connecter, chacune avec sa MFA, et les codes de récupération sont rangés dans le coffre de mots de passe partagé à deux (AD-9), jamais dans le dépôt ni dans une conversation avec Claude
**Et** le plan Cloudflare reste gratuit à ce stade (le plan Workers Paid à 5 $/mois du spine n'est nécessaire qu'avec le backend, epic 10).

**Étant donné** que le dépôt GitHub (GitHub : le service qui héberge le code et son historique) reste temporairement sur le compte `jbcholat-Dev` (exception temporaire actée dans AD-9, transfert prévu à la story 12.3)
**Quand** JB connecte ce dépôt à Workers Builds (Workers : le service de Cloudflare qui exécute et sert le site ; Workers Builds : sa fonction qui reconstruit le site automatiquement à chaque push sur GitHub) avec le dossier racine `site`, la commande de construction `npm run build` et le dossier de sortie `dist`
**Alors** un push sur la branche `main` déclenche une construction visible dans l'interface Cloudflare, et les alertes de build (échec de construction) sont activées pour Anne et JB (AD-12)
**Et** l'application GitHub de Cloudflare n'a accès qu'à ce dépôt, pas à tous les dépôts de JB.

**Étant donné** que le spine fixe Node.js (le moteur qui exécute la construction du site) dans un fichier `.nvmrc` mais que ce fichier n'existe pas dans `site/`, et que `package.json` exige seulement « ≥ 22.12 » alors que le spine cite 24.12
**Quand** la première construction Workers Builds est lancée
**Alors** la version de Node utilisée par Cloudflare est écrite noir sur blanc (`.nvmrc` ou réglage `NODE_VERSION`) et identique à celle du poste de JB (à trancher : 22.x d'après le README, 24.12 d'après le spine ; recommandation : celle qui a servi à construire le site, puis mettre le spine à jour).

**État :** à faire — responsable : JB (comptes, MFA, connexion du dépôt), Claude (guide pas à pas et fichier `.nvmrc`), prérequis : adresse e-mail d'Anne disponible, coffre de mots de passe partagé choisi, durée estimée : 1 h pour JB (compte 20 min, MFA 10 min, connexion du dépôt 20 min, première construction 10 min).

### Story 9.2: Configuration de mise en ligne statique et non-indexation

En tant que JB,
je veux que le site se publie tel quel (statique, sans backend) et qu'il soit invisible des moteurs de recherche tant qu'il est en aperçu,
afin qu'Anne voie un site complet sans qu'un visiteur ou Google ne tombe dessus avant le lancement.

**Critères d'acceptation :**

**Étant donné** que le site est construit en fichiers statiques dans `site/dist` (astro.config.mjs : `output: 'static'`, une page = un fichier `.html`, pas de barre finale dans les adresses)
**Quand** Claude ajoute dans `site/` le fichier de configuration Cloudflare `wrangler.jsonc` (le fichier qui dit à Cloudflare quoi servir : nom du Worker, dossier `dist` en ressources statiques, date de compatibilité) sans aucun secret dedans (AD-8 : ce fichier ne contient que des identifiants publics)
**Alors** Workers Builds publie `dist` sur une adresse `*.workers.dev` (le sous-domaine temporaire que Cloudflare donne à chaque Worker), les 19 pages y répondent avec leurs images, et une adresse inconnue affiche la page 404 du site (réglage de gestion des pages introuvables à vérifier lors de la mise en place)
**Et** `astro.config.mjs` garde `output: 'static'` : aucun adaptateur Cloudflare, aucun `worker.ts` tant que le backend n'existe pas (README, TODO(backend) n° 6).

**Étant donné** qu'un seul réglage d'environnement (une valeur définie dans l'interface Cloudflare, différente pour l'aperçu et pour la production, lue au moment de la construction ; nom à trancher, par exemple `PUBLIC_INDEXATION`) pilote l'indexation
**Quand** ce réglage est absent ou à « non » (cas de l'aperçu)
**Alors** chaque page construite porte la balise `<meta name="robots" content="noindex">` (noindex : l'instruction qui demande aux moteurs de ne pas référencer la page), en plus du `noindex` déjà posé page par page dans `Base.astro`
**Et** le site sert un `robots.txt` (le petit fichier à la racine qui dit aux moteurs de recherche ce qu'ils ont le droit d'indexer) contenant `Disallow: /` pour tous les robots, généré à la construction et non écrit à la main dans `public/`.

**Étant donné** que le même réglage est à « oui » (cas de la production, story 12.4)
**Quand** le site est construit
**Alors** aucune balise `noindex` globale n'est posée (seules les pages du diagnostic et la 404 gardent la leur, comme aujourd'hui), et `robots.txt` autorise l'indexation et pointe vers le sitemap (créé à la story 11.3 ; tant qu'il n'existe pas, la ligne `Sitemap:` est omise)
**Et** la bascule ne demande aucun changement de code : seulement la valeur du réglage, ce qui est écrit dans le RUNBOOK (story 9.4).

**Étant donné** que `Base.astro` construit l'adresse canonique (canonical : l'adresse « officielle » d'une page, que les moteurs retiennent) à partir de `site: 'https://annevialtissot.fr'`
**Quand** une page d'aperçu est ouverte sur `*.workers.dev`
**Alors** sa canonique pointe toujours vers `annevialtissot.fr` ; c'est acceptable en aperçu parce que la page est `noindex`, et c'est écrit dans `site/README.md` § « Écarts assumés » (à trancher : dériver la canonique du réglage d'environnement ou la laisser telle quelle).

**État :** à faire — responsable : Claude (code et configuration), JB (valeur du réglage dans Cloudflare), prérequis : story 9.1, durée estimée : 2 h de construction et vérification (`npm run build`, `npm run check`, `scripts/liens.mjs`).

### Story 9.3: Accès protégé de l'aperçu

En tant que JB,
je veux que l'adresse d'aperçu ne s'ouvre qu'après une connexion par e-mail pour Anne, moi et quelques invités,
afin que le site incomplet (photos sans autorisation écrite, pastilles « Point ouvert », mentions légales non validées) ne soit visible que des personnes choisies.

**Critères d'acceptation :**

**Étant donné** le compte Cloudflare d'Anne (story 9.1)
**Quand** JB active Cloudflare Access (Access : le portier de Cloudflare, gratuit jusqu'à 50 utilisateurs, qui demande une identification avant de laisser passer vers une adresse) sur l'adresse `*.workers.dev` du site, avec la méthode « code à usage unique par e-mail » (le visiteur saisit son adresse, reçoit un code, l'entre)
**Alors** une politique d'accès n'autorise que les adresses e-mail listées : Anne, JB, et les invités désignés par JB ; toute autre adresse est refusée après le code
**Et** la liste des invités est tenue dans le RUNBOOK (story 9.4), pas dans le dépôt.

**Étant donné** qu'Access est en place
**Quand** Anne ouvre l'adresse d'aperçu depuis son téléphone, sans rien installer
**Alors** elle saisit son e-mail, reçoit un code, l'entre une fois, puis navigue librement sur les 19 pages pendant la durée de session choisie (à trancher : 24 h par défaut ; plus long possible)
**Et** aucune ressource n'est chargée sans passer par Access (une image ouverte directement par son adresse est elle aussi protégée).

**Étant donné** que Workers Builds peut produire une adresse d'aperçu distincte par branche (environnement `preview` du spine : « chaque branche »)
**Quand** une branche autre que `main` est poussée
**Alors** son adresse d'aperçu est couverte par la même politique Access (à trancher lors de la mise en place : politique sur l'ensemble du sous-domaine `workers.dev` du compte, ou aperçus par branche désactivés en attendant).

**État :** à faire — responsable : JB (dans l'interface Cloudflare, guidé par Claude), prérequis : stories 9.1 et 9.2 (le Worker doit exister), durée estimée : 30 min.

### Story 9.4: RUNBOOK v0

En tant que JB,
je veux un RUNBOOK (la procédure écrite qui permet à quelqu'un d'autre que moi de remettre le site en ligne, de savoir qui possède quoi, et d'éviter les erreurs sans retour) dans le dépôt, et l'adresse d'aperçu enregistrée là où on la cherche,
afin que le site soit reconstructible sans JB (AD-10) dès la première mise en ligne, et que le tableau de bord dise toujours où voir le site.

**Critères d'acceptation :**

**Étant donné** l'aperçu en ligne (stories 9.1 à 9.3)
**Quand** Claude écrit `RUNBOOK.md` à la racine du dépôt (emplacement du spine, « Structural Seed »)
**Alors** il contient au minimum ces sections, vides si rien n'est encore à écrire : carte des comptes (Cloudflare, GitHub, et plus tard Infomaniak, Resend, Cal.com, Google Business Profile, Better Stack : pour chacun le titulaire, les administrateurs, l'adresse de connexion, où sont les codes de récupération, jamais les mots de passe eux-mêmes) ; comment remettre en ligne (`git clone` + les commandes exactes : `cd site && npm install && npm run build`, puis la commande de publication Cloudflare, et ce qui se passe automatiquement à chaque push) ; comment basculer d'aperçu en production (réglage d'indexation, retrait d'Access, branchement du domaine : story 12.4) ; pièges irréversibles (à ce stade : la base de données de production devra être créée avec `jurisdiction = eu`, choix irrévocable, à écrire ici avant la commande de création à l'epic 10 ; le transfert du dépôt GitHub, story 12.3 ; la suppression d'un Worker ou d'un domaine) ; liste des invités Access
**Et** les sections que le spine exige mais qui dépendent du backend (secrets et rotation, leads, restauration, droits RGPD, incident formulaire, récupération de compte, routine mensuelle) sont présentes avec la mention « à compléter à l'epic 10 », pour ne pas les oublier.

**Étant donné** le tableau de bord de JB (artefact claude.ai `4HmS8AdWcXACwVpgQSrMRB`, CLAUDE.md § 2)
**Quand** l'adresse d'aperçu est connue
**Alors** Claude met à jour, dans la même session, le document `etat/projet` (`apercu_url` = l'adresse, `derniere_mise_a_jour` = date du jour), ajoute une entrée dans `publications` de type `apercu`, et met à jour l'epic 9 dans `epics`
**Et** `CLAUDE.md` mentionne l'adresse d'aperçu et le fait qu'elle est protégée par Access, et sa phrase « `RUNBOOK.md` (comptes, mise en ligne, secours) une fois créé » est remplacée par le renvoi au fichier réel ; `site/README.md` gagne une section « Mise en ligne » qui renvoie au RUNBOOK.

**Étant donné** la règle de traçabilité (CLAUDE.md § 2 : les documents de référence sont mis à jour dans le même commit)
**Quand** le RUNBOOK est créé
**Alors** il part dans le même commit que `wrangler.jsonc` et le réglage d'indexation, avec un message en français qui dit quoi et pourquoi.

**État :** à faire — responsable : Claude (rédaction, tableau de bord, CLAUDE.md), JB (relecture et vérification que la carte des comptes est exacte), prérequis : stories 9.1 à 9.3, durée estimée : 2 h.

### Story 9.5: Vérification de bout en bout de l'aperçu

En tant que JB,
je veux la preuve que chaque push est construit et publié, que toutes les pages répondent, que rien n'est indexable et que rien n'est visible sans connexion,
afin de considérer l'aperçu comme « fait » au sens de CLAUDE.md (un travail est fait quand il est vérifié) et de laisser Anne l'utiliser en confiance.

**Critères d'acceptation :**

**Étant donné** un changement visible et anodin poussé sur `main` (par exemple une virgule dans une page)
**Quand** la construction Workers Builds se termine
**Alors** le changement apparaît sur l'adresse d'aperçu sans autre action, en moins de 10 minutes (durée indicative ; la valeur observée est notée dans la story), et la construction est visible dans l'historique Cloudflare
**Et** une construction volontairement cassée (branche de test) envoie l'alerte de build à Anne et JB (AD-12) et ne remplace pas la version en ligne.

**Étant donné** la liste des 19 fichiers HTML produits par `npm run build` (accueil ; réalisation et ses 3 fiches ; à propos ; vendre ; acheter ; diagnostic, questions, résultats ; contact ; guide ; mentions légales, confidentialité, cookies ; 404 ; accueil EN ; track record EN)
**Quand** chaque adresse est ouverte après connexion Access (à la main depuis un téléphone et un ordinateur, ou par un script avec un jeton de service Access, c'est-à-dire un identifiant réservé aux machines ; à trancher)
**Alors** chacune répond avec la bonne page (code 200), les images s'affichent, une adresse inconnue donne la page 404, et le parcours du diagnostic fonctionne comme en local (les scripts `scripts/liens.mjs` et `scripts/e2e-diagnostic.mjs` servent de référence de ce qui doit marcher)
**Et** Anne confirme, depuis son téléphone, qu'elle voit l'accueil avec la vidéo ou son image de remplacement, et la pile de cartes.

**Étant donné** l'aperçu protégé et non indexé
**Quand** on ouvre `/robots.txt` et le code source de trois pages (accueil, une story, la page contact)
**Alors** `robots.txt` contient `Disallow: /` et chaque page contient `<meta name="robots" content="noindex">`
**Et** une requête sans connexion (navigation privée, ou `curl` sans jeton) sur l'accueil et sur une image reçoit l'écran de connexion Access, jamais le contenu ; une adresse e-mail hors liste est refusée après le code.

**Étant donné** la règle « aucun script tiers dans les pages statiques » (AD-11)
**Quand** on inspecte les requêtes réseau d'une page d'aperçu
**Alors** aucun script ni cookie n'est déposé en dehors de ce que la page contenait déjà en local (polices Google déjà présentes dans `Base.astro`) et de la session Access elle-même (à noter dans le README comme spécifique à l'aperçu).

**État :** à faire — responsable : Claude (script de vérification et compte rendu dans la story), JB (test depuis son téléphone et celui d'Anne), prérequis : stories 9.1 à 9.4, durée estimée : 1 h.

## Epic 10: Capture des leads et backend

Un prospect qui remplit un formulaire ou termine le diagnostic est enregistré côté site, Anne est prévenue, et rien n'est perdu ni exposé (AD-4 « écrire d'abord, diffuser ensuite »). Aujourd'hui tout est simulé dans le navigateur (voir `site/README.md`, section « TODO(backend) ») ; cet epic remplace chaque simulation par le noyau serveur décrit dans le spine, une story à la fois, sans jamais casser le site en ligne.
**Capacités couvertes :** CAP-5, CAP-6, CAP-7, CAP-8, CAP-9, CAP-11. **Décisions :** AD-4, AD-5, AD-6, AD-7, AD-8, AD-9, AD-10, AD-11, AD-12, AD-14, AD-16, AD-18.

### Story 10.1: Architecture vague 2 consolidée

En tant que JB,
je veux que chaque décision différée du spine soit tranchée et chaque hypothèse vérifiée par un test réel, puis consignée dans le spine,
afin que le backend soit écrit sur des faits et non sur des suppositions.

**Critères d'acceptation :**

**Étant donné** la table « Deferred » du spine (`ARCHITECTURE-SPINE.md`)
**Quand** la story est livrée
**Alors** chacune des lignes suivantes porte un verdict daté et sa raison : liste des champs des objets de contenu (constatée comme fixée par `site/src/content.config.ts` : stories, avis, instantané, pages ; les objets `SequenceEmail` et `Guide` prévus par AD-1 restent à déclarer en 10.5) ; choix du CMS de moyen terme (candidat Keystatic évalué contre AD-1 et AD-2, ou report avec date et raison, décision de JB) ; bandeau de consentement (nécessaire ou non, sur quelles pages, d'après la vérification instrumentée ci-dessous, AD-11) ; outil d'audit de performance (Lighthouse CI ou équivalent, AD-15) ; barème Q10 (la matrice visites × offres reconstruite dans `site/src/content/diagnostic/bareme.json` est validée par Anne, ou remplacée par la question unique de la conception, SPEC Open Questions) ; go/no-go prestataire (marqué sans objet : le build interne est fait)
**Et** aucune ligne de la table ne reste sur « Vague 2 » ou « Au build » sans verdict.

**Étant donné** un compte Cal.com (service de prise de rendez-vous) au nom d'Anne (AD-9), plan gratuit
**Quand** un rendez-vous de test est réservé depuis un navigateur réglé sur un autre fuseau horaire, avec un webhook (appel automatique que Cal.com envoie à notre serveur quand un événement se produit) `BOOKING_CREATED` configuré avec un secret
**Alors** le test démontre, capture à l'appui : que le webhook arrive signé (empreinte calculée avec le secret, vérifiable par notre serveur), qu'une question de formulaire obligatoire de type case à cocher est possible, que les créneaux s'affichent dans le fuseau du visiteur, qu'un créneau pris entre-temps est refusé, et que les deux parties reçoivent une confirmation (Hypothèses à vérifier au build, CAP-9)
**Et** si un point manque, le repli du spine est retenu et consigné : le lead RDV est capté par notre propre formulaire avant redirection vers Cal.com.

**Étant donné** un compte Resend (service d'envoi d'e-mails) au nom d'Anne et une page de test chargeant Turnstile (vérification anti-robot de Cloudflare, mode invisible) et l'intégration Cal.com
**Quand** la région de données UE est demandée pour le compte Resend et que les dépôts (cookies et stockage navigateur) de Turnstile et de Cal.com sont relevés dans le navigateur
**Alors** le spine consigne : région UE disponible ou non (sinon transfert hors UE documenté dans la politique de confidentialité), volume de 100 e-mails par jour jugé suffisant ou passage au plan Pro, et la liste exacte de ce que déposent Turnstile et Cal.com, d'où découle le verdict « bandeau » (AD-11)
**Et** ces résultats sont ceux que 10.3 et 10.6 appliquent tels quels.

**Étant donné** une branche d'essai de `site/` avec `@astrojs/cloudflare` 14 et un fichier `worker.ts` (point d'entrée du Worker, le programme qui tourne chez Cloudflare) exposant `fetch` (réponse aux pages) et `scheduled` (tâche planifiée)
**Quand** cette branche est déployée sur une URL `*.workers.dev` avec un binding D1 (lien vers la base de données Cloudflare) et les fichiers statiques
**Alors** les pages du site répondent comme avant, le binding D1 est lisible depuis une route serveur et `scheduled` s'exécute (hypothèse `workerEntryPoint` vérifiée, Stack « Point non-défaut »)
**Et** la branche d'essai n'est pas fusionnée : aucun fichier de `site/` ne change dans cette story, `npm run build` passe comme avant.

**Étant donné** le spine avec ses verdicts et résultats de tests
**Quand** il est amendé
**Alors** il reçoit un paragraphe « Amendement du <date> » dans le journal (même forme que l'amendement du 2026-09-13), la section « Hypothèses à vérifier au build » devient « Hypothèses vérifiées » avec date et résultat, la table « Stack » est revérifiée contre `site/package.json` et `.nvmrc` (Astro ^7.3.4, Node), et le champ `updated` de l'en-tête est mis à jour
**Et** les décisions qui exigent Anne ou JB sont listées nommément dans l'amendement avec leur auteur.

**État :** à faire ; responsable : Claude (verdicts CMS, Q10 et bandeau portés par JB et Anne), prérequis : comptes Cloudflare, Resend et Cal.com créés au nom d'Anne avec JB invité administrateur (AD-9), fichiers concernés : `_bmad-output/planning-artifacts/architecture/architecture-anne-website-2026-08-29/ARCHITECTURE-SPINE.md`, `_bmad-output/specs/spec-anne-website/SPEC.md` (Open Questions Q10), lecture de `site/src/content.config.ts` et `site/src/content/diagnostic/bareme.json`, durée estimée : 1 session (une journée, tests réels compris).

### Story 10.2: Noyau serveur Cloudflare et base des leads

En tant que JB,
je veux que le site soit servi par un Worker Cloudflare avec une base de données D1 en juridiction européenne et un schéma versionné,
afin que le code serveur des stories suivantes ait un socle reconstructible depuis le dépôt.

**Critères d'acceptation :**

**Étant donné** le site tel que livré par l'epic 9 (sortie statique, `site/astro.config.mjs` sans adaptateur)
**Quand** l'adaptateur (module qui adapte la sortie d'Astro à un hébergeur) `@astrojs/cloudflare` est ajouté avec l'option `workerEntryPoint` pointant sur `site/worker.ts` (`fetch` délégué à Astro, `scheduled` présent mais vide pour l'instant) et que `npm run build` s'exécute
**Alors** le build réussit, toutes les pages existantes restent prérendues (générées à l'avance en HTML) et répondent 200 à l'identique sur l'URL de prévisualisation
**Et** aucune page existante ne devient une route serveur : seules les futures routes `/api/*` et `/admin/*` le seront (Design Paradigm, couche « Noyau serveur »).

**Étant donné** le compte Cloudflare d'Anne (AD-9) sur le plan Workers Paid (Stack)
**Quand** la base D1 de production est créée
**Alors** la commande porte `jurisdiction = eu` et le RUNBOOK (`RUNBOOK.md`, procédure écrite de reprise) contient cette commande avant qu'elle ne soit lancée, car le choix est irrévocable (AD-10)
**Et** une base de prévisualisation séparée et une base locale (`wrangler dev`) existent, chacune référencée par son identifiant public dans `site/wrangler.jsonc` (Environnements du Structural Seed).

**Étant donné** les migrations (fichiers SQL numérotés qui font évoluer le schéma de la base) `migrations/0001-lead.sql` et `migrations/0002-lead-delivery.sql`
**Quand** elles sont appliquées par la commande documentée sur la base locale, puis de prévisualisation, puis de production
**Alors** la table `lead` porte les colonnes communes d'AD-6 (`id` ULID, `submission_id` unique, `created_at`, `last_activity_at`, `lang`, `source`, `email`, `privacy_accepted_at`, `newsletter_opt_in_at`, `newsletter_unsubscribed_at`, `utm`, `is_test`) et les colonnes par source (`prenom`, `nom`, `telephone`, `token`, `answers`, `scores`, `band`, `orientation`, `message`, `projet`, `commune_bien`, `type_bien`), avec un index unique partiel sur `token` limité à `source = 'diagnostic'`
**Et** la table `lead_delivery` porte `lead_id`, `channel`, `due_at`, `status`, `attempts`, `delivered_at`, `last_error` (AD-6) ; aucune modification du schéma n'est faite à la main (AD-10).

**Étant donné** les deux environnements `production` (branche `main`) et `preview` (chaque branche, URL `*.workers.dev`)
**Quand** un secret (valeur confidentielle : clé d'API Resend, secret Turnstile, secret de webhook Cal.com) est nécessaire
**Alors** il est posé par `wrangler secret`, jamais dans le dépôt, et `site/wrangler.jsonc` ne contient que des identifiants publics (AD-8, Conventions)
**Et** le RUNBOOK liste les noms des secrets, l'endroit où ils vivent et leur procédure de rotation (AD-10).

**Étant donné** une machine vierge avec `git clone` du dépôt
**Quand** la commande documentée dans le RUNBOOK est exécutée
**Alors** le site est redéployé et les migrations sont appliquées (AD-10)
**Et** un retour arrière est possible par redéploiement de la version précédente (versions Workers) et, si une migration est en cause, par sa migration inverse dans `migrations/`.

**État :** à faire ; responsable : Claude, prérequis : 10.1 (hypothèse `workerEntryPoint` vérifiée), epic 9 (site déployé chez Cloudflare), compte Cloudflare d'Anne au plan Workers Paid, fichiers concernés : `site/astro.config.mjs`, `site/package.json`, `site/worker.ts`, `site/wrangler.jsonc`, `site/migrations/0001-lead.sql`, `site/migrations/0002-lead-delivery.sql`, `RUNBOOK.md`, durée estimée : 1 session (une demi-journée).

### Story 10.3: Formulaires contact, estimation et guide écrits en base et notifiés à Anne

En tant que prospect,
je veux que mon message, ma demande d'estimation ou ma demande de guide soient réellement enregistrés et transmis à Anne,
afin d'être recontacté sans que ma demande se perde.

**Critères d'acceptation :**

**Étant donné** les routes serveur `POST /api/contact`, `POST /api/estimation` et `POST /api/guide`
**Quand** une soumission arrive
**Alors** elle passe, dans cet ordre et avant toute écriture : le jeton Turnstile (preuve anti-robot obtenue en mode invisible) validé côté serveur, le champ piège (champ caché qu'un humain ne remplit jamais) vide, la limite de fréquence par adresse, puis la validation contre un schéma serveur reprenant le contrat AD-6 (contact : `prenom`, `nom`, `telephone` au format international E.164, `email`, `projet` ∈ {`vente`, `achat`}, `message` obligatoire ≤ 1 000 caractères, case de confidentialité cochée ; estimation : idem avec `commune_bien` et `type_bien` obligatoires et `message` facultatif ; guide : `telephone` facultatif) (AD-7)
**Et** tout échec renvoie une erreur neutre `{ ok: false, error: { code, message } }` avec un code stable en `SCREAMING_SNAKE_CASE` et rien n'est écrit (AD-7, Conventions).

**Étant donné** une soumission valide portant un `submission_id` (clé d'idempotence : identifiant unique généré par l'îlot, qui garantit qu'un renvoi ne crée pas de doublon) au format ULID
**Quand** le noyau la traite
**Alors** la première opération est l'écriture de la ligne `lead` (avec `lang` = langue de la page, `source`, `privacy_accepted_at` horodaté, `newsletter_opt_in_at` si la case distincte est cochée, `utm` venus de l'URL) et des lignes `lead_delivery` `notify_anne` et `confirm_prospect`, et le visiteur ne reçoit `{ ok: true }` qu'après (AD-4)
**Et** un renvoi avec le même `submission_id` retourne le résultat de la première écriture sans second lead ; si l'écriture D1 échoue, le visiteur reçoit une erreur neutre, l'îlot conserve les valeurs saisies et propose « Renvoyer » (AD-4, CAP-5).

**Étant donné** les lignes `lead_delivery` créées
**Quand** le module unique `src/server/delivery` les exécute via l'adaptateur `src/server/adapters/email.ts` (seul point de contact avec Resend, sans état, qui n'écrit jamais en base)
**Alors** `notify_anne` part vers la boîte d'Anne, formaté prêt à copier dans la fiche contact Modelo (un bloc par champ, dans l'ordre de Modelo, AD-14), et `confirm_prospect` part au prospect depuis `anne@annevialtissot.fr` avec `Reply-To` la boîte d'Anne, SPF, DKIM et DMARC (`p=quarantine`) posés dans le DNS Cloudflare (AD-8)
**Et** un échec d'envoi n'est jamais une erreur pour le visiteur : `status`, `attempts` et `last_error` sont mis à jour sur la ligne pour un rejeu ultérieur (AD-4) ; pour la source `guide`, tant que 10.5 n'est pas livrée, `notify_anne` indique à Anne d'envoyer le PDF à la main et `confirm_prospect` n'est pas créé.

**Étant donné** l'îlot `site/src/islands/formulaires.ts` et sa fonction simulée `envoyer()`
**Quand** elle est remplacée par un vrai `POST` vers `/api/<source>`
**Alors** le script Turnstile n'est chargé qu'à la soumission du formulaire, jamais au chargement de la page (AD-11), le bandeau de consentement n'est ajouté que si le verdict de 10.1 l'exige, et le mode `?simuler=echec` disparaît
**Et** les états visuels existants (envoi en cours, confirmation, échec avec « Renvoyer », erreurs de champ) restent identiques.

**Étant donné** l'environnement `preview` et le drapeau `is_test`
**Quand** un lead est écrit depuis une URL de prévisualisation ou avec `is_test = 1`
**Alors** l'adaptateur e-mail route les envois vers une boîte de test, jamais vers Anne (AD-12, Environnements)
**Et** les journaux du serveur sont en JSON structuré sans donnée personnelle (e-mails hachés, c'est-à-dire remplacés par une empreinte non réversible) (Conventions).

**État :** à faire ; responsable : Claude, prérequis : 10.2, compte Resend au nom d'Anne avec le domaine `annevialtissot.fr` vérifié et le DNS sur Cloudflare, clés Turnstile créées, verdict « bandeau » de 10.1, fichiers concernés : `site/src/pages/api/contact.ts`, `site/src/pages/api/estimation.ts`, `site/src/pages/api/guide.ts`, `site/src/server/leads.ts`, `site/src/server/delivery.ts`, `site/src/server/adapters/email.ts`, `site/src/islands/formulaires.ts`, `site/src/components/FormulaireContact.astro`, `site/src/components/FormulaireEstimation.astro`, `site/src/pages/guide.astro`, `site/src/pages/contact.astro`, durée estimée : 1 session (une journée).

### Story 10.4: Gate du diagnostic côté serveur

En tant qu'Anne,
je veux que le score du diagnostic soit calculé et affiché par le serveur seulement après la saisie des coordonnées,
afin qu'aucun prospect ne consulte ses résultats sans laisser ses coordonnées et que chaque diagnostic terminé devienne un lead.

**Critères d'acceptation :**

**Étant donné** la route serveur `POST /api/diagnostic`
**Quand** l'îlot du parcours envoie les réponses par identifiants (`{ q01: ["q01.a"], … }`), les coordonnées, `lang` (langue de la page de soumission), `journey_id`, `utm` et `submission_id`
**Alors** le noyau applique les contrôles AD-7 (Turnstile, champ piège, fréquence, schéma : `prenom`, `nom`, `telephone` E.164, `email`, case cochée, réponses conformes aux identifiants du `ContenuDiagnostic`, `message` ≤ 1 000 caractères), calcule scores (global et 3 catégories, brut et pourcentage), bande et orientation A/B depuis `bareme.json` (Q14 choisit l'offre ; Q12 « minimiser les frais » force B, CAP-7), écrit le lead `diagnostic` avec `token`, `answers`, `scores`, `band`, `orientation` et les lignes `lead_delivery` `notify_anne` et `confirm_prospect`, puis répond avec l'adresse de la page de résultats (AD-4, AD-5, AD-6)
**Et** le barème n'est plus lu que par le serveur : `site/src/lib/scoring.ts` passe dans `site/src/server/scoring.ts` et `bareme.json` est absent du JavaScript livré au navigateur (AD-5).

**Étant donné** la page de résultats `/diagnostic/resultats` (et son équivalent `/en/…`, AD-3)
**Quand** elle est demandée avec un jeton (chaîne opaque qui identifie la soumission sans rien révéler)
**Alors** elle est rendue par le serveur à partir du lead associé, à usage unique par navigateur, pendant 24 heures ; hors de cette fenêtre, sans jeton ou sans scores associés, la route répond 404 (AD-5, CAP-5)
**Et** l'îlot `site/src/islands/resultats.ts` est supprimé, ainsi que le stockage `sessionStorage` des résultats.

**Étant donné** un échec de l'écriture D1 ou une coupure pendant la soumission
**Quand** l'îlot reçoit l'erreur neutre
**Alors** les réponses et les coordonnées sont conservées dans le navigateur et le bouton « Renvoyer » renvoie avec le même `submission_id` (AD-4, CAP-5)
**Et** le renvoi mène au même jeton, sans second lead ; la sauvegarde locale des réponses est effacée seulement après succès (AD-11).

**Étant donné** la page de résultats rendue par le serveur
**Quand** l'orientation est A
**Alors** le CTA principal mène à la réservation de rendez-vous et le contact direct vient en second ; quand l'orientation est B, le CTA de téléchargement du guide et la proposition de séquence d'e-mails s'affichent (CAP-7)
**Et** tant que 10.5 n'est pas livrée, le bouton guide renvoie vers la page `/guide` déjà fonctionnelle (10.3) et l'opt-in coché au gate est déjà écrit dans `newsletter_opt_in_at` (AD-6) ; les 9 feedbacks, le score global et les 3 sous-scores s'affichent exactement comme dans la v1 (CAP-4).

**État :** à faire ; responsable : Claude, prérequis : 10.3 (module `delivery`, adaptateur e-mail), verdict Q10 de 10.1 (le noyau lit `bareme.json` tel qu'il est), fichiers concernés : `site/src/pages/api/diagnostic.ts`, `site/src/server/scoring.ts` (depuis `site/src/lib/scoring.ts`), `site/src/server/gate.ts`, `site/src/pages/diagnostic/resultats.astro`, `site/src/pages/en/…` (équivalent), `site/src/islands/diagnostic.ts`, suppression de `site/src/islands/resultats.ts`, durée estimée : 1 session (une journée).

### Story 10.5: Guide par lien signé et séquence d'e-mails de la sortie B

En tant que prospect,
je veux recevoir le guide par un lien personnel et, si je l'ai demandé, la série d'e-mails d'Anne,
afin de repartir avec un contenu utile sans que le fichier soit accessible à n'importe qui.

**Critères d'acceptation :**

**Étant donné** le PDF du guide rangé hors du dossier public du site
**Quand** un lead `guide` ou `diagnostic` est écrit
**Alors** le noyau produit un lien signé (adresse portant une empreinte calculée avec un secret, impossible à deviner ou à modifier) lié à ce lead et expirant à 7 jours, servi par une route du noyau ; après expiration ou pour un lead inconnu, la route répond 404 (AD-8, CAP-8)
**Et** l'ancienne adresse statique du PDF n'existe pas : une requête directe sur le fichier répond 404 ; le guide servi correspond à la clé `band` du lead (`0-40`, `41-70`, `71-100`) ou au guide générique `band = null` hors diagnostic (AD-1).

**Étant donné** la page de résultats (10.4) et la page `/guide`
**Quand** le prospect demande le guide
**Alors** le lien signé est affiché après capture et envoyé par e-mail dans `confirm_prospect` via l'adaptateur Resend (AD-8) ; sur la page de résultats, le bouton guide n'ouvre plus la page `/guide` mais déclenche l'envoi pour le lead du jeton
**Et** les libellés « valable 48 heures » de `guide.astro` et de la page de résultats deviennent « 7 jours » (AD-8).

**Étant donné** le type de contenu `SequenceEmail` déclaré dans `site/src/content.config.ts` (`step`, `delay_days`, sujet et corps par langue, AD-1) et les textes écrits par Anne
**Quand** un lead porte `newsletter_opt_in_at` (opt-in distinct de l'acceptation de la politique, AD-16), qu'il vienne du gate, du formulaire guide ou du bouton de la page de résultats
**Alors** une ligne `lead_delivery` `sequence:<step>` est créée par étape avec `due_at` = inscription + `delay_days` (AD-6)
**Et** le build échoue si une langue livrée n'a pas tous ses gabarits d'e-mail (AD-2) ; le nombre d'étapes annoncé sur la page de résultats est celui des objets `SequenceEmail`, pas un « 7 » en dur.

**Étant donné** le cron (tâche planifiée qui s'exécute à heure fixe) quotidien porté par `scheduled` dans `site/worker.ts`
**Quand** il s'exécute
**Alors** il envoie via l'adaptateur Resend, en envoi transactionnel depuis `anne@annevialtissot.fr`, chaque ligne `sequence:<step>` arrivée à échéance, dans la langue du lead, et met à jour `status`, `attempts`, `delivered_at`, `last_error` (AD-8)
**Et** aucune audience ni broadcast Resend n'est utilisé ; le contenu vit dans le dépôt uniquement (AD-8) ; les leads `is_test` sont routés vers la boîte de test (AD-12).

**Étant donné** le lien de désabonnement présent dans chaque e-mail de la séquence
**Quand** le prospect clique
**Alors** une route du noyau vérifie le jeton signé, écrit `newsletter_unsubscribed_at` et annule les lignes `sequence:<step>` restantes (AD-8, AD-16)
**Et** la page affichée confirme l'arrêt dans la langue du lead ; un second clic reste sans effet ni erreur.

**État :** à faire ; responsable : Claude (contenu de la séquence et PDF rebrandé : Anne), prérequis : 10.4, PDF du guide rebrandé fourni par Anne (A-10), textes de la séquence écrits par Anne (n étapes et délais), fichiers concernés : `site/src/content.config.ts` (`SequenceEmail`, `Guide`), `contenu-anne/` (objets), `site/src/pages/api/guide/…`, `site/src/pages/api/desabonnement.ts`, `site/src/server/delivery.ts`, `site/src/server/adapters/email.ts`, `site/worker.ts`, `site/src/pages/guide.astro`, `site/src/pages/diagnostic/resultats.astro`, durée estimée : 1 session (une journée).

### Story 10.6: Rendez-vous Cal.com intégré

En tant que prospect,
je veux réserver un vrai créneau dans l'agenda d'Anne depuis le site,
afin de fixer un rendez-vous sans échange d'e-mails préalable.

**Critères d'acceptation :**

**Étant donné** la page `/contact` et son gabarit de calendrier statique
**Quand** le visiteur clique sur « Réserver un créneau »
**Alors** l'embed Cal.com (composant de Cal.com inséré dans la page) se charge seulement à ce moment, jamais au chargement de la page (AD-11), et affiche les disponibilités réelles d'Anne dans le fuseau horaire du visiteur (CAP-9)
**Et** le gabarit statique, son script de démonstration et le formulaire `data-formulaire="rdv"` sont supprimés ; le bandeau de consentement n'est ajouté sur cette page que si le verdict de 10.1 l'exige.

**Étant donné** le formulaire de réservation Cal.com
**Quand** le prospect réserve
**Alors** une question obligatoire de type case à cocher exige l'acceptation de la politique de confidentialité, horodatée à la réservation (AD-6, CAP-9)
**Et** Cal.com verrouille le créneau (un créneau pris entre l'affichage et la confirmation est refusé proprement) et envoie lui-même les confirmations au prospect et à Anne ; le noyau n'envoie pas de seconde confirmation (AD-8, CAP-9).

**Étant donné** la route `POST /api/webhook-cal`
**Quand** Cal.com envoie l'événement `BOOKING_CREATED`
**Alors** la signature est vérifiée avec le secret partagé (rejet sinon), l'idempotence repose sur l'`uid` de la réservation utilisé comme `submission_id`, et le lead `rdv` est écrit en première opération (`nom` = nom complet Cal.com, `prenom` null, `telephone` si fourni, `email`, `lang`, `privacy_accepted_at` = horodatage de la réponse à la question) (AD-4, AD-6, AD-7)
**Et** une ligne `lead_delivery` `notify_anne` est créée au format prêt à copier dans Modelo (AD-14) ; un webhook rejoué ne crée pas de second lead.

**Étant donné** la page de résultats en sortie A (10.4)
**Quand** le prospect clique sur le CTA de rendez-vous
**Alors** il arrive sur la réservation Cal.com de la page `/contact` (CAP-7, CAP-9)
**Et** si le test réel de 10.1 a montré que le plan gratuit ne signe pas ses webhooks, le repli s'applique : notre propre formulaire capte le lead `rdv` avant la redirection vers Cal.com (Hypothèses vérifiées).

**État :** à faire ; responsable : Claude, prérequis : 10.3 (module `delivery`), résultat du test Cal.com de 10.1, compte Cal.com au nom d'Anne avec un type d'événement « 30 minutes » configuré et le secret de webhook posé par `wrangler secret`, fichiers concernés : `site/src/pages/contact.astro`, `site/src/pages/en/…` (contact), `site/src/pages/api/webhook-cal.ts`, `site/src/server/adapters/booking.ts`, `site/src/server/leads.ts`, `site/src/pages/diagnostic/resultats.astro`, durée estimée : 1 session (une demi-journée).

### Story 10.7: Administration et droits RGPD

En tant qu'Anne,
je veux consulter mes leads, rejouer un envoi manqué, marquer une recopie dans Modelo et répondre à une demande d'accès ou d'effacement sans JB,
afin de gérer mes prospects et mes obligations RGPD en autonomie.

**Critères d'acceptation :**

**Étant donné** les routes `/admin` et `/api/admin/*`
**Quand** elles sont appelées
**Alors** elles sont protégées par Cloudflare Access (portail d'identification de Cloudflare placé devant une adresse) avec les seuls comptes d'Anne et de JB, MFA (second facteur) activé (AD-9, AD-18, Conventions) ; sans session Access valide, aucune page ni donnée n'est servie
**Et** l'admin est rendu par le serveur, en français seulement (AD-3), et ne touche la base que par `src/server/` (Conventions).

**Étant donné** la liste des leads dans l'admin
**Quand** Anne ouvre un lead
**Alors** elle voit son détail (toutes sources, colonnes AD-6) et l'état de chaque ligne `lead_delivery` ; elle peut rejouer une diffusion en échec (exécutée par le module unique `delivery`) et marquer la ligne de canal `modelo` comme livrée à la main après recopie (AD-4, AD-14)
**Et** chaque action admin sur un lead met à jour `last_activity_at` (AD-16).

**Étant donné** une demande d'une personne (accès ou effacement)
**Quand** Anne recherche son adresse e-mail dans l'admin
**Alors** elle peut exporter le lead en JSON lisible et l'effacer avec ses `lead_delivery`, l'effacement étant propagé au contact Resend (AD-18)
**Et** chaque exercice de droit est journalisé (date, type, e-mail haché) ; la suppression de la réservation Cal.com et la réponse à la personne suivent la procédure écrite du RUNBOOK (AD-18).

**Étant donné** le cron quotidien de `site/worker.ts`
**Quand** il s'exécute
**Alors** il purge les leads dont `last_activity_at` dépasse 3 ans, avec leurs `lead_delivery` (AD-16)
**Et** la durée de 3 ans est celle écrite dans la page de politique de confidentialité, sans divergence.

**État :** à faire ; responsable : Claude (validation de la politique de confidentialité : Anne), prérequis : 10.3 (leads réels et module `delivery`), Cloudflare Access configuré sur le compte d'Anne avec JB invité, fichiers concernés : `site/src/pages/admin/…`, `site/src/pages/api/admin/…`, `site/src/server/rights.ts`, `site/src/server/purge.ts`, `site/src/server/delivery.ts`, `site/worker.ts`, `RUNBOOK.md` (droits RGPD), `site/src/pages/confidentialite.astro`, durée estimée : 1 session (une journée).

### Story 10.8: Surveillance, mesure et test synthétique

En tant que JB,
je veux qu'une panne du site ou d'un formulaire soit détectée par une machine et signalée à Anne et à moi,
afin qu'aucun lead ne se perde en silence et que la mesure d'audience se fasse sans traceur.

**Critères d'acceptation :**

**Étant donné** un compte Better Stack (service de surveillance externe) au nom d'Anne (AD-9), plan gratuit
**Quand** les moniteurs sont créés
**Alors** l'accueil FR et EN, la landing du diagnostic et la page contact sont sondés avec un mot-clé attendu dans la page, et les alertes vont à Anne et à JB (AD-12)
**Et** les alertes de build Cloudflare sont activées (AD-12).

**Étant donné** le cron quotidien de `site/worker.ts`
**Quand** il s'exécute
**Alors** il réalise une soumission de test réelle (test synthétique : un faux prospect joué par la machine) parcourant gate → D1 → diffusion avec `is_test = 1`, les adaptateurs routant les e-mails vers la boîte de test, jamais vers Anne ni vers la séquence (AD-12)
**Et** en fin d'exécution le cron supprime son propre lead de test et alerte s'il n'y parvient pas ; après chaque succès il envoie un battement (signal « je suis vivant ») à Better Stack, qui alerte si le battement manque (AD-12).

**Étant donné** la migration `migrations/0003-funnel-event.sql` et la route du noyau qui reçoit les événements de l'îlot du parcours
**Quand** un visiteur démarre le diagnostic, atteint un écran, soumet, ou réserve un rendez-vous
**Alors** une ligne `funnel_event` (`journey_id`, `event`, `screen`, `lang`, `is_test`, `at`) est écrite sous le `journey_id` aléatoire créé en mémoire de l'îlot, jamais déposé dans le navigateur, sans donnée personnelle et sans référence à `lead` (AD-6, AD-11)
**Et** les lignes `is_test` sont exclues des compteurs ; l'admin (10.7) affiche les compteurs d'entonnoir (taux de complétion) et l'état du dernier test synthétique (AD-18).

**Étant donné** la mesure d'audience
**Quand** elle est activée
**Alors** elle repose sur Cloudflare Web Analytics sans cookie ; aucun script tiers n'est ajouté aux pages statiques et rien n'est déposé avant une action du visiteur (AD-11)
**Et** le RUNBOOK décrit la routine mensuelle (admin, rapprochement, export mensuel chiffré des leads déposé dans le coffre partagé, dépendances, erreurs) (AD-10, AD-12).

**État :** à faire ; responsable : Claude, prérequis : 10.4 (gate serveur à tester), 10.7 (admin pour les compteurs), compte Better Stack au nom d'Anne avec JB invité, fichiers concernés : `site/worker.ts`, `site/src/server/adapters/monitoring.ts`, `site/src/server/funnel.ts`, `site/src/pages/api/funnel.ts`, `site/migrations/0003-funnel-event.sql`, `site/src/islands/diagnostic.ts`, `site/src/pages/admin/…`, `RUNBOOK.md`, durée estimée : 1 session (une journée).

## Epic 11: Référencement et visibilité

Le site d'Anne est trouvé par les vendeurs et acheteurs du Chablais qui cherchent sur Google, et pas seulement par ceux qui ont l'adresse.
**Capacités couvertes :** CAP-2 (preuve sociale, avis cohérents avec la fiche Google), CAP-10 (une adresse par langue), contrainte « Performance, mobile et SEO local » de la spec (cible : Chablais et bassin lémanique), et la future CAP-12 « Visibilité » (à créer à la story 11.4). **Décisions :** AD-13 (référencement généré, cohérent avec la fiche Google, contenu long sur le domaine), AD-3 (une adresse par langue, sitemap et hreflang générés depuis le contenu réel), AD-2 (une langue livrée est complète ou n'existe pas), AD-11 (aucun traceur, aucun script tiers), AD-1 (tout contenu est un objet typé).

### Story 11.1: Session de cadrage de la stratégie de visibilité

En tant que JB,
je veux une session dédiée, préparée par une recherche sur ce qui fait venir des clients à un mandataire immobilier local en 2026, avec un document de sortie qui dit ce que ça change pour le site,
afin de décider en connaissance de cause quelles pages et quels contenus ajouter avant le lancement, au lieu de découvrir après coup que la liste des pages était incomplète.

**Critères d'acceptation :**

**Étant donné** que le référencement n'est pas encore cadré (décision de JB du 2026-09-26 : session dédiée, pas maintenant, mais tracée)
**Quand** la session est planifiée
**Alors** elle se tient après l'étape de structuration et avant le lancement public (story 12.4), parce que son résultat peut changer la liste des pages (pages par commune, articles) et donc la structure du site
**Et** elle est inscrite comme prérequis de la story 12.5 pour ne pas être oubliée.

**Étant donné** la session
**Quand** Claude prépare la recherche (sources datées de 2025-2026, en citant chacune) et l'anime avec JB
**Alors** elle couvre au moins : la fiche Google Business Profile et les avis Google (levier n° 1 attendu par JB), les pages locales par commune, le contenu long (articles, guides déjà prévus par AD-13), les réseaux sociaux, la publicité locale (story 11.5), et l'inscription du site auprès de Google (outil de suivi de l'indexation ; mode d'inscription compatible avec AD-11, c'est-à-dire par enregistrement DNS et non par script, à trancher)
**Et** chaque levier est évalué pour le cas précis d'Anne : 5-6 ventes par an, 2-3 biens actifs, clientèle internationale du Léman (CAP-10), pas de vitrine de biens (non-goal de la spec).

**Étant donné** la session terminée
**Quand** Claude rédige `_bmad-output/planning-artifacts/strategie-visibilite.md`
**Alors** le document contient : les leviers retenus et écartés avec la raison, les impacts sur la liste des pages (nouvelles pages, nouveaux types de contenu pour l'inventaire AD-1, ce que ça change dans `structure-site.md`), sur le contenu à produire par Anne (charge, ordre), et sur l'architecture (par exemple : un nouveau type d'objet `PageLocale` exigerait un amendement d'AD-1 ; une page par commune multiplie les entrées de sitemap et de hreflang)
**Et** les décisions prises sont journalisées le jour même dans le document qui les porte (spine pour la technique, `.memlog.md` de la spec pour le contrat), conformément à CLAUDE.md § 2.

**État :** à faire — responsable : JB (décisions), Claude (recherche, animation, document), prérequis : étape de structuration terminée ; à tenir avant la story 12.4, durée estimée : 2 h de recherche préparatoire, 2 h de session, 1 h de rédaction.

### Story 11.2: Fiche Google Business Profile créée et cohérente avec le site

En tant qu'Anne,
je veux une fiche Google Business Profile (la fiche gratuite qui apparaît dans Google et Google Maps quand on cherche un professionnel local) à mon nom, avec exactement les mêmes informations que le site,
afin d'apparaître dès maintenant dans les recherches locales, avant même que le site soit public, et de collecter des avis Google.

**Critères d'acceptation :**

**Étant donné** qu'Anne n'a pas encore de fiche (action « hors architecture, pour Anne » du spine) et que la fiche peut exister sans site
**Quand** Anne crée la fiche depuis un compte Google à son nom, avec JB ajouté comme gestionnaire (AD-9 : Anne titulaire, JB administrateur)
**Alors** la fiche est de type « zone desservie, adresse masquée » (AD-13 : elle ne montre pas de domicile, elle indique les communes couvertes) et Anne suit la vérification demandée par Google (courrier, vidéo ou autre : c'est Google qui choisit, le délai peut être de plusieurs jours)
**Et** l'accès à la fiche est noté dans la carte des comptes du RUNBOOK (story 9.4), sans mot de passe.

**Étant donné** l'objet `identite` du site (`site/src/config/site.ts` aujourd'hui, `src/content/identite.json` dans le spine ; source unique du nom, du téléphone, de la zone, du RSAC et du réseau, AD-13)
**Quand** la fiche est remplie
**Alors** nom, téléphone, zone desservie (« Chablais et bassin lémanique »), statut (agent commercial indépendant, mandataire du réseau eXp France) et langues parlées (français, anglais, espagnol, portugais) reproduisent exactement les valeurs d'`identite` ; le téléphone étant encore `null` (A-13), Anne le fournit et il est écrit dans `identite` avant ou en même temps que dans la fiche
**Et** la catégorie principale de la fiche est choisie parmi celles de Google pour un agent immobilier (à trancher avec Anne, à noter dans `strategie-visibilite.md`).

**Étant donné** que le site n'est pas encore public
**Quand** la fiche est publiée
**Alors** le champ « site web » reste vide (jamais l'adresse d'aperçu protégée, jamais gamma.site, AD-13) et sera rempli avec `https://annevialtissot.fr` à la story 12.4
**Et** le lien vers la fiche Immodvisor déjà présent dans `identite` n'est pas remplacé : les avis Immodvisor restent la preuve sociale du site (CAP-2), les avis Google s'y ajoutent sur la fiche.

**État :** à faire — responsable : Anne (création, vérification, catégorie), JB (gestionnaire, cohérence avec `identite`), prérequis : compte Google d'Anne ; téléphone professionnel à fournir (A-13) ; aucune dépendance au site, durée estimée : 1 h pour Anne, plus le délai de vérification de Google.

### Story 11.3: Bases techniques du référencement dans le site

En tant que prospect,
je veux que Google comprenne quelles pages existent, dans quelle langue, et qui est Anne,
afin de trouver le site quand je cherche un mandataire immobilier dans le Chablais, dans ma langue.

**Critères d'acceptation :**

**Étant donné** que le site n'a ni sitemap (le fichier qui liste toutes les pages à indexer, avec leur langue) ni `robots.txt` en production
**Quand** Claude génère le sitemap à la construction depuis les pages réellement construites (AD-3 : « générés depuis le contenu réel »)
**Alors** il liste les pages FR indexables et les deux pages EN existantes (`/en`, `/en/track-record`), exclut le diagnostic (questions, résultats, déjà `noindex`), la 404 et toute page `noindex`, et n'annonce jamais une traduction qui n'existe pas (AD-2 : une story non traduite n'apparaît ni dans l'index EN, ni dans le sitemap EN)
**Et** si l'intégration standard `@astrojs/sitemap` (version 3.7.4 du spine) déclare une traduction manquante pour une page FR seule, elle est remplacée par une génération propre au site, comme AD-3 le prévoit ; `robots.txt` de production (story 9.2) pointe vers ce sitemap.

**Étant donné** la règle « une adresse par langue » (AD-3 : français sans préfixe, anglais sous `/en/`)
**Quand** une page existe dans les deux langues (aujourd'hui : accueil et index réalisation / track record)
**Alors** chacune porte les balises `hreflang` (l'indication, dans l'en-tête de la page, de l'adresse de la même page dans chaque autre langue, plus une valeur par défaut vers le français) qui se répondent, et une page FR seule n'en porte aucune vers l'anglais
**Et** la canonique de `Base.astro` reste celle de la page elle-même, une seule par page, et aucune redirection selon le pays ou le navigateur n'est ajoutée.

**Étant donné** l'objet `identite` (AD-13) et les valeurs A-13 encore `null` (RSAC, téléphone, e-mail)
**Quand** Claude ajoute au gabarit de base un bloc de données structurées (un petit texte au format JSON-LD, invisible pour le visiteur, qui décrit Anne à Google : type `RealEstateAgent`, nom, téléphone, adresse du site, zone desservie, langues, appartenance au réseau eXp France, lien vers la fiche Immodvisor)
**Alors** ce bloc est généré depuis `identite`, jamais écrit à la main dans une page, et un champ `null` est simplement omis jusqu'à ce qu'Anne fournisse la valeur (README, TODO(backend) n° 7)
**Et** les valeurs sont strictement les mêmes que celles du pied de page, des mentions légales et de la fiche Google (story 11.2).

**Étant donné** la vérification exigée par CLAUDE.md
**Quand** la story est livrée
**Alors** `npm run build`, `npm run check` et `scripts/liens.mjs` passent ; un outil de validation des données structurées et des `hreflang` (à trancher, hors dépôt) ne remonte aucune erreur ; le résultat est cité dans la story et `site/README.md` est mis à jour (le point 7 du TODO(backend) disparaît).

**État :** à faire — responsable : Claude, prérequis : story 9.2 (réglage d'indexation et `robots.txt`) ; peut se faire avant la story 11.1, dont le résultat s'y ajoutera (nouvelles pages dans le sitemap), durée estimée : 3 h.

### Story 11.4: Amendement de la spec et découpage des stories de contenu issues du cadrage

En tant que JB,
je veux que la stratégie de visibilité entre dans le contrat du projet (la spec) et se traduise en stories concrètes,
afin que le travail de visibilité soit suivi comme le reste (règle « tout travail passe par une story suivie ») et que quelqu'un d'autre puisse le reprendre.

**Critères d'acceptation :**

**Étant donné** `strategie-visibilite.md` validé (story 11.1)
**Quand** Claude amende la spec avec `bmad-spec` (l'outil de la méthode qui met la spec à jour sans en perdre le reste)
**Alors** la spec passe en version 6 avec une capacité **CAP-12 « Visibilité »** (intention, critère de succès mesurable, tiré du document de stratégie), les Open Questions et Assumptions touchées sont mises à jour, et l'entrée est journalisée dans `.memlog.md` de la spec le jour même
**Et** si le cadrage crée un nouveau type de contenu (page locale, article), le spine est amendé (inventaire AD-1, table de correspondance capacité / architecture) et `structure-site.md` reçoit la nouvelle liste des pages, par le même mécanisme que les amendements du 2026-09-07 et du 2026-09-13.

**Étant donné** la liste des pages et contenus décidés
**Quand** Claude découpe les stories
**Alors** chaque page locale ou article devient une story avec : la commune ou le sujet, ce qu'Anne doit écrire ou fournir, ce que Claude construit, et la vérification (build, liens, sitemap et `hreflang` mis à jour par la story 11.3, captures)
**Et** ces stories sont rattachées à un epic (à trancher : suite de l'epic 11, ou un epic de contenu dédié), reflétées dans le fichier de statut de sprint et dans le tableau de bord (`epics`, famille `visibilite`).

**Étant donné** la contrainte de production de contenu par Anne (spec : sur le chemin critique)
**Quand** les stories sont créées
**Alors** celles qui exigent un texte d'Anne le disent explicitement et sont classées « avant lancement » ou « après lancement » selon le document de stratégie, pour ne pas retarder la story 12.4 avec du contenu qui peut arriver ensuite.

**État :** à faire — responsable : Claude (amendements et découpage), JB (validation), prérequis : story 11.1 terminée, durée estimée : 2 h.

### Story 11.5: Publicité locale, test à petit budget après lancement

En tant qu'Anne,
je veux essayer une publicité locale à petit budget une fois le site public,
afin de savoir si elle amène des diagnostics et des rendez-vous, sans engager d'argent avant d'avoir la mesure.

**Critères d'acceptation :**

**Étant donné** que ce levier n'est pas cadré (placeholder ; canal, budget, durée et cible : à trancher à la story 11.1)
**Quand** la story 11.1 est faite
**Alors** cette story est réécrite avec le canal retenu, le budget mensuel plafonné (à trancher ; l'enveloppe globale actée du projet est de 20 à 50 € par mois, dont ≈ 6,50 € déjà consommés par l'hébergement et les domaines), la durée du test et l'objectif chiffré rattaché au Success signal de la spec (≥ 20 diagnostics complétés et ≥ 8 rendez-vous sur 6 mois)
**Et** elle ne démarre qu'après la story 12.4 (site public) et après que le backend des formulaires (epic 10) enregistre les leads.

**Étant donné** la règle « zéro traceur » (AD-11 : les paramètres de campagne voyagent dans l'adresse de la page, puis dans le formulaire, jamais dans un cookie)
**Quand** une campagne est lancée
**Alors** ses liens portent des paramètres de campagne (UTM : les petits marqueurs ajoutés à l'adresse pour savoir d'où vient le visiteur) qui finissent dans le champ `utm` du lead (AD-6), sans aucun script publicitaire ajouté au site ni bandeau de consentement imposé
**Et** la mesure du test se lit dans l'administration du site (compteurs d'entonnoir, AD-18) et dans la mesure d'audience sans cookie (AD-11), pas dans un outil tiers.

**État :** à faire — responsable : Anne (budget), JB (cadrage), Claude (mesure), prérequis : stories 11.1, 12.4, et epic 10 (backend) ; à cadrer, ne pas commencer avant, durée estimée : à trancher à la story 11.1.

## Epic 12: Lancement public

Le site est en ligne sur annevialtissot.fr, trouvable, légal, avec des formulaires qui fonctionnent.
**Capacités couvertes :** CAP-1 à CAP-11 (toutes doivent être opérationnelles au lancement : Success signal de la spec « le site est en ligne, les 3 axes et les parcours de conversion sont opérationnels »). **Décisions :** AD-3 (`.com` en redirection 301 vers `.fr`), AD-8 (e-mail délivrable : SPF, DKIM, DMARC), AD-9 (propriété des comptes, transfert du dépôt), AD-10 (RUNBOOK exécuté depuis une machine vierge), AD-12 (surveillance externe, test synthétique), AD-13 (fiche Google reliée au site), AD-16 (mentions légales et politique de confidentialité).

### Story 12.1: Nom de domaine acheté et DNS chez Cloudflare

En tant que JB,
je veux les domaines annevialtissot.fr et annevialtissot.com achetés au nom d'Anne, gérés depuis son compte Cloudflare, sans encore les brancher sur le site,
afin de sécuriser le nom dès maintenant (décision du 2026-09-26) et de préparer l'e-mail et la bascule du lancement sans rien précipiter.

**Critères d'acceptation :**

**Étant donné** le registrar retenu par le spine (Infomaniak : l'entreprise suisse chez qui on achète et renouvelle les noms de domaine ; ≈ 21 € par an pour les deux)
**Quand** JB achète `annevialtissot.fr` et `annevialtissot.com` depuis un compte Infomaniak dont Anne est titulaire (AD-9), JB invité administrateur
**Alors** les deux domaines sont au nom d'Anne (contact propriétaire), le renouvellement automatique est activé avec un moyen de paiement d'Anne, et le compte figure dans la carte des comptes du RUNBOOK
**Et** aucun mot de passe ne transite par Claude.

**Étant donné** que le DNS (l'annuaire qui traduit un nom de domaine en adresses de serveurs, et qui porte aussi les réglages d'e-mail) doit vivre chez Cloudflare (spine : « Infomaniak .fr .com → NS Cloudflare »)
**Quand** JB ajoute les deux domaines dans le compte Cloudflare d'Anne et remplace, chez Infomaniak, les serveurs de noms par ceux que Cloudflare indique
**Alors** Cloudflare confirme qu'il gère les deux zones (délai de propagation : jusqu'à 24 à 48 h), et aucune entrée ne pointe encore vers le Worker : le site reste uniquement sur l'adresse d'aperçu jusqu'à la story 12.4
**Et** le changement est irréversible seulement si l'on perd l'accès aux deux comptes ; la procédure est écrite dans le RUNBOOK (section « pièges irréversibles » et « récupération de compte »).

**Étant donné** la règle AD-8 (envoi depuis `annevialtissot.fr` avec SPF, DKIM et DMARC `p=quarantine` : trois enregistrements DNS qui prouvent aux messageries que les e-mails signés « anne@annevialtissot.fr » viennent bien du site, sinon ils partent en spam) et la boîte `contact@` routée vers la boîte d'Anne (Email Routing de Cloudflare, spine)
**Quand** la zone DNS est active
**Alors** la zone est préparée pour ces enregistrements (DMARC en surveillance seule tant qu'aucun envoi n'existe ; SPF et DKIM définitifs arrivent avec Resend à l'epic 10) et le routage `contact@` → boîte d'Anne est mis en place et testé par un e-mail réel
**Et** l'adresse `.com` est configurée pour rediriger en 301 (redirection permanente, celle que les moteurs suivent en transférant la notoriété) vers l'adresse `.fr` équivalente, règle activée seulement à la story 12.4.

**État :** à faire — responsable : JB (achat, comptes, serveurs de noms), Claude (liste exacte des enregistrements DNS à créer et vérification), prérequis : story 9.1 (compte Cloudflare d'Anne), moyen de paiement d'Anne, durée estimée : 1 h pour JB, plus 24 à 48 h de propagation.

### Story 12.2: Mentions légales et politique de confidentialité validées par Anne

En tant qu'Anne,
je veux des mentions légales, une politique de confidentialité et une page cookies exactes, complètes et que j'ai lues et validées,
afin d'être en règle le jour où le site collecte les coordonnées de vrais prospects, et de ne pas engager ma responsabilité sur un texte que je n'ai pas approuvé.

**Critères d'acceptation :**

**Étant donné** les trois pages légales déjà construites avec des pastilles « à compléter » (README : « valeurs A-13 à compléter », « textes à faire valider par Anne avant publication »)
**Quand** Anne fournit les valeurs A-13 (numéro RSAC, carte professionnelle, téléphone, e-mail) et que Claude les inscrit dans `identite` (source unique, AD-13, donc aussi dans le pied de page et les données structurées)
**Alors** les mentions légales affichent ces valeurs, l'hébergeur (Cloudflare, avec son adresse) et le lockup Anne + eXp en tête de page (spec, co-branding), et plus aucune pastille « à compléter » ne subsiste sur les trois pages
**Et** les valeurs sont identiques à celles de la fiche Google (story 11.2).

**Étant donné** la règle AD-16 (une base légale par finalité, consentements distincts, données en UE, purge à 3 ans)
**Quand** Claude finalise la politique de confidentialité
**Alors** elle nomme chaque traitement avec sa base légale telle que l'architecture la fixe (diagnostic, contact, guide, RDV, estimation = mesures précontractuelles ; séquence d'e-mails = consentement ; test synthétique et compteurs = intérêt légitime sans donnée personnelle), la durée de conservation de 3 ans, les sous-traitants nommés avec leur localisation (Cloudflare, Resend, Cal.com ; ceux effectivement retenus à l'epic 10), les droits des personnes et comment les exercer, et le désabonnement de la séquence
**Et** la page cookies dit ce qui est réellement déposé (AD-11 : rien avant une action du visiteur ; la sauvegarde des réponses du diagnostic est strictement nécessaire ; le bandeau reste conditionnel selon ce que déposent Turnstile et Cal.com, différé du spine, vérifié à l'epic 10).

**Étant donné** les textes complets, en français et en anglais (AD-2 : les pages légales existent dans chaque langue livrée ; à trancher : l'anglais est-il livré au lancement ou l'accueil EN seul, auquel cas les pages légales EN suivent la même règle)
**Quand** Anne les relit
**Alors** elle valide chaque page par écrit (e-mail ou message conservé), et la validation est citée dans la story avec sa date
**Et** Anne tient, hors site, son registre des traitements (obligation rappelée dans le spine : la gestion de prospects n'entre pas dans la dérogation des petites structures) ; Claude lui fournit une trame à partir de la politique.

**État :** à faire — responsable : Anne (valeurs A-13, relecture, validation, registre), Claude (rédaction finale), prérequis : story 11.3 (données structurées) souhaitable, epic 10 pour la liste définitive des sous-traitants, durée estimée : 2 h pour Anne (lecture et validation), 2 h pour Claude.

### Story 12.3: Propriété et transfert

En tant qu'Anne,
je veux que chaque compte de la chaîne de production soit à mon nom, que le dépôt du site ne dépende plus du compte personnel de JB, et que les accès soient dans un coffre partagé,
afin que le site reste le mien si JB n'est plus disponible (AD-9), et qu'un tiers puisse reprendre le projet.

**Critères d'acceptation :**

**Étant donné** l'exception temporaire d'AD-9 (dépôt sur `jbcholat-Dev`, transfert « condition du lancement public »)
**Quand** JB crée une organisation GitHub (un espace d'équipe, distinct d'un compte personnel) avec deux propriétaires, Anne et JB, et y transfère le dépôt (opération native de GitHub, historique conservé, anciennes adresses redirigées ; journal `.memlog.md` du 2026-09-07)
**Alors** Workers Builds est reconnecté au dépôt à sa nouvelle adresse et une construction réussit, le remote local de JB est mis à jour, et `CLAUDE.md` ainsi que le RUNBOOK citent la nouvelle adresse
**Et** la MFA est active sur le compte GitHub d'Anne comme sur celui de JB.

**Étant donné** la liste des comptes d'AD-9 (Infomaniak, Cloudflare, Resend, Cal.com, Google Business Profile, Better Stack)
**Quand** JB passe en revue la carte des comptes du RUNBOOK
**Alors** chaque compte existant a Anne comme titulaire (adresse e-mail, facturation, e-mail de récupération au nom d'Anne) et JB comme administrateur invité, la MFA est activée sur les deux identités Cloudflare avec codes de récupération dans le coffre ; les comptes non encore créés (Resend, Cal.com, Better Stack : epic 10) sont marqués « à créer selon la même règle »
**Et** aucune carte bancaire de JB ne reste attachée à un compte.

**Étant donné** le coffre de mots de passe partagé à deux (AD-9 ; outil à trancher par JB)
**Quand** il est en place
**Alors** il contient les accès de tous les comptes de la carte, les codes de récupération, et plus tard l'export mensuel chiffré des leads (AD-10), et Anne sait l'ouvrir seule (vérifié par un test avec elle)
**Et** aucun mot de passe n'apparaît dans le dépôt, le RUNBOOK, le tableau de bord ou une conversation avec Claude.

**État :** à faire — responsable : JB (organisation GitHub, transfert, comptes, coffre), Anne (validation qu'elle sait ouvrir le coffre), Claude (mise à jour de CLAUDE.md et du RUNBOOK), prérequis : story 9.1 ; à faire avant la story 12.4, durée estimée : 1 h 30 pour JB.

### Story 12.4: Bascule en production

En tant que JB,
je veux brancher le domaine sur le site, autoriser l'indexation, retirer la protection d'accès, et prouver que le RUNBOOK suffit à tout refaire,
afin que le site soit public à l'adresse annevialtissot.fr, trouvable, et reconstructible sans moi (AD-10).

**Critères d'acceptation :**

**Étant donné** le RUNBOOK v0 complété par les epics 10, 11 et 12
**Quand** JB (ou une personne désignée) l'exécute depuis une machine vierge (un ordinateur qui n'a jamais vu le projet) : `git clone`, installation, `npm run build`, publication, restauration comprise dès que la base existe (AD-10)
**Alors** le site en ligne est identique à celui produit par cette machine, sans étape non écrite ; chaque écart trouvé est corrigé dans le RUNBOOK avant de continuer (spine : « s'il ne suffit pas, il est faux »)
**Et** cette exécution est datée et citée dans la story.

**Étant donné** la liste de lancement validée (story 12.5)
**Quand** JB bascule
**Alors** dans l'ordre écrit au RUNBOOK : le domaine `annevialtissot.fr` est rattaché au Worker (domaine personnalisé ; `www` à trancher : redirection vers la version sans `www` recommandée), la règle 301 `.com` → `.fr` est activée, le réglage d'indexation (story 9.2) passe à « oui » sur la branche `main`, le site est reconstruit, et la politique Access est retirée du site public (elle reste sur `/admin` et `/api/admin/*`, epic 10)
**Et** vérifications immédiates : `https://annevialtissot.fr/robots.txt` autorise l'indexation et pointe vers le sitemap ; aucune page publique ne porte `noindex` sauf le diagnostic et la 404 ; `https://annevialtissot.com/vendre` redirige en 301 vers `https://annevialtissot.fr/vendre` ; l'accueil s'ouvre sans écran de connexion ; l'adresse `*.workers.dev` cesse d'être annoncée (à trancher : désactivée, ou laissée `noindex` pour les aperçus de branches).

**Étant donné** le lancement effectif
**Quand** le site répond sur le domaine
**Alors** Claude met à jour dans la même session le tableau de bord (`etat/projet.site_url`, `phase`, `derniere_mise_a_jour` ; entrée `publications` de type `production` ; epic 12) et `CLAUDE.md` (adresse publique, adresse d'aperçu reléguée aux branches) ; le champ « site web » de la fiche Google reçoit `https://annevialtissot.fr` (story 11.2) ; la mesure d'audience sans cookie de Cloudflare (AD-11) est activée sur le domaine (mode d'activation à trancher pour rester sans script ajouté au code)
**Et** un retour arrière est possible : redéploiement de la version précédente du Worker (versions Workers, spine) et retour du réglage d'indexation à « non », procédure écrite dans le RUNBOOK.

**État :** à faire — responsable : JB (bascule, exécution du RUNBOOK sur machine vierge), Claude (préparation, vérifications, tableau de bord, CLAUDE.md), prérequis : stories 12.1, 12.2, 12.3, 12.5 et l'epic 10, durée estimée : 1 h d'exécution du RUNBOOK, 1 h de bascule et vérifications.

### Story 12.5: Critères de lancement vérifiés

En tant que JB,
je veux une liste de contrôle, cochée point par point avec preuve, avant de brancher le domaine,
afin de ne pas mettre en ligne un site qui perd des leads, publie une photo sans autorisation ou affiche une pastille de travail.

**Critères d'acceptation :**

**Étant donné** la liste de contrôle tenue dans la story (et reprise dans le RUNBOOK)
**Quand** chaque point est vérifié
**Alors** il porte la preuve (capture, adresse, sortie de commande, message d'Anne) et la date, et aucun point n'est coché « en confiance »
**Et** les points sont ceux-ci, tous obligatoires : backend minimal des formulaires opérationnel (epic 10 : chaque envoi de contact, estimation, guide, diagnostic et rendez-vous est écrit côté site avant toute notification, un renvoi ne crée pas de doublon, AD-4 ; plus aucun `TODO(backend)` bloquant dans `site/README.md`) ; autorisations écrites obtenues pour chaque photo et témoignage publié (story 7.9 ; champ `autorisations:` de chaque story ; version sans logo eXp des photos d'Essert-Romand) ; stories filtrées sur `statut === 'publie' && autorisations` dans `src/lib/contenu.ts` (README, « Choix éditoriaux ») ; pastilles « Point ouvert » et « Contenu à écrire par Anne » retirées, points ouverts 1 et 2 tranchés ou textes définitifs en place ; chiffres publics revalidés ou retirés (spec, Assumptions : statistique PAP.fr « 9 vendeurs sur 10 », « +30 % ») ; mentions légales et politique validées (story 12.2) ; comptes et dépôt transférés (story 12.3) ; session de cadrage de la visibilité tenue (story 11.1) et bases techniques en place (story 11.3) ; fiche Google vérifiée (story 11.2).

**Étant donné** la règle AD-12 (une panne se détecte par une machine, jamais par Anne)
**Quand** la surveillance est mise en place avant la bascule
**Alors** Better Stack (le service gratuit qui interroge le site de l'extérieur et alerte) surveille l'accueil FR et EN, la landing du diagnostic et la page contact avec un mot-clé attendu dans la page, et alerte Anne **et** JB ; les alertes de build Cloudflare sont actives
**Et** le test synthétique quotidien (une soumission de formulaire réelle, marquée `is_test`, qui parcourt tout le circuit et s'efface elle-même, avec battement vers Better Stack) est en place et a réussi au moins une fois, sans e-mail reçu par Anne et sans lead de test restant (epic 10).

**Étant donné** le budget de vitesse d'AD-15 (accueil : LCP mobile < 2,5 s, page utile < 3 s ; contrainte « Performance, mobile et SEO local » de la spec)
**Quand** un audit Lighthouse (l'outil gratuit de Google qui mesure la vitesse d'une page) est lancé sur l'adresse d'aperçu de la branche de lancement, en mode mobile
**Alors** l'accueil respecte le budget, et le résultat est joint à la story ; l'automatisation de cet audit à chaque mise en ligne (différé du spine, « outil d'audit de performance ») est à trancher, une mesure manuelle documentée suffisant au lancement.

**Étant donné** le contenu minimal de la spec (CAP-1 : 1 vidéo et 6 photos réelles ; CAP-2 : 3 avis entiers attribués ; CAP-3 : 3 stories avec au moins un témoignage)
**Quand** JB fait le tour du site d'aperçu avec Anne
**Alors** ces seuils sont atteints ou explicitement revus par Anne (spec, Assumptions : « à confirmer par Anne »), et aucun bloc « Actif attendu » ne subsiste sur une page publique sauf ceux acceptés après lancement (vidéo méthode A-15, D-12)
**Et** Anne donne son accord de lancement par écrit, cité dans la story.

**État :** à faire — responsable : JB (liste, preuves), Anne (accord, contenu), Claude (vérifications techniques, audit, surveillance), prérequis : epic 10 terminé, stories 7.9, 11.1, 11.2, 11.3, 12.1, 12.2, 12.3, durée estimée : 2 h de vérification, hors travaux qu'elle révèle.


## Notes de rédaction pour JB

Constats faits pendant la rédaction rétroactive (2026-09-26), à lire avant de valider ce document.

### Notes pour JB (groupes 1-5)

- `site/.verif/verif.log` liste vingt erreurs `net::ERR_TOO_MANY_RETRIES` (ressource externe, très probablement Google Fonts derrière le proxy) alors que le README affirme « aucune erreur console » : les captures existent mais la vérification des polices n'est pas prouvée par le journal.
- Aucune capture ne couvre les stories d'Armoy (avis RHL) ni d'Allinges (bloc A-07), ni les états erreur / succès / échec des formulaires Vendre, Contact, Guide ; seuls le gate du diagnostic et les résultats ont leurs états capturés.
- La page À propos porte ses textes dans `a-propos.astro` (condensé du Markdown d'Anne), pas via la collection `pages` : à basculer avant tout CMS (AD-1) et avant la version EN (AD-2).
- Les trois stories sont publiées en `statut: brouillon` / `autorisations: false`, et les deux liaisons avis → story reposent sur une confiance « moyenne » : rien de tout cela n'a été confirmé par Anne.
- Je n'ai pas relancé `npm run build`, `npm run check` ni les scripts Playwright : l'état « fait » repose sur le README, `site/PLAN.md` (coché le 23/09) et le contenu de `.verif/` au commit 530985a.

### Notes pour JB (groupes 6-8)

1. Ordre conseillé : 8.1 (polices) puis 8.2 (écrans) tout de suite, sans attendre Anne ; en parallèle, les stories 7.4 à 7.8 ne demandent à Anne que des dépôts courts, 7.9 est la seule longue (témoignages, accords écrits) et c'est elle qui débloque la mise en ligne publique et l'anglais (6.4).
2. Trois petits écarts de consignes à corriger avant qu'Anne ne dépose : emplacement d'`identite.md` (racine ou `legal/`), forme de la séquence d'e-mails (un fichier ou un dossier par étape), et lignes réseaux sociaux absentes du gabarit `identite.md`.
3. Décisions à obtenir d'Anne en une séance : D-25 (boutons), Cible (point 1), champs de l'estimation (point 2), co-branding (point 6), les trois avis retenus, le passage vidéo et le poster ; tout se journalise dans `DECISIONS.md`.
4. L'anglais (6.2 à 6.4) reste prématuré tant que les textes français bougent : traduire un texte provisoire, c'est payer deux fois ; 6.2 peut démarrer dès que Cible, estimation et Acheter sont fixés.
5. L'envoi réel du guide et des e-mails, le gate serveur et le lien signé sont hors de ces trois epics (TODO backend 2, 3, 5 du README) : les stories 7.8 et 7.10 préparent le contenu, elles ne le livrent pas au prospect.

### Notes pour JB (groupes 9, 11, 12)

1. Ordre conseillé : 9.1 → 9.2 → 9.3 → 9.4 → 9.5 cette semaine (Anne voit le site) ; 11.2 (fiche Google) et 12.1 (domaines) en parallèle dès maintenant, sans dépendance au site ; 11.3 dès que 9.2 est faite ; 11.1 après la structuration ; 12.2, 12.3, 12.5 puis 12.4 avec l'epic 10.
2. Ce que JB fait lui-même, dans l'ordre : compte Cloudflare d'Anne + invitation + MFA (30 min), connexion du dépôt à Workers Builds (20 min), Access (30 min), compte Infomaniak d'Anne + achat des deux domaines + serveurs de noms Cloudflare (1 h), organisation GitHub et transfert (30 min), coffre partagé (30 min).
3. Points « à trancher » laissés volontairement, à décider quand ils se présentent : version de Node (`.nvmrc`), nom du réglage d'indexation, durée de session Access et couverture des aperçus par branche, canonique en aperçu, emplacement d'`identite`, catégorie Google de la fiche, pages légales EN au lancement, `www`, sort de l'adresse `workers.dev` après lancement, automatisation Lighthouse, outil de coffre.
4. Access bloque aussi les robots et scripts : la vérification automatisée de l'aperçu (9.5) et l'audit Lighthouse (12.5) exigent soit un jeton de service Access, soit une mesure manuelle ; l'audit automatique d'AD-15 reste différé jusqu'au lancement.
5. La ligne « État » de chaque story reprend le gabarit imposé tel quel, tiret compris ; partout ailleurs aucun tiret cadratin.

### Notes pour JB (groupe backend, 10)

- Comptes à créer au nom d'Anne, JB invité administrateur, MFA partout (AD-9) : Cloudflare au plan Workers Paid avec Turnstile et Access (10.1, 10.2), Resend avec le domaine `annevialtissot.fr` vérifié et le DNS sur Cloudflare (10.3), Cal.com (10.1, 10.6), Better Stack (10.8) ; sans eux, les tests réels de 10.1 ne peuvent pas avoir lieu.
- Décisions de JB en 10.1 : CMS de moyen terme (Keystatic ou report daté), outil d'audit de performance, bandeau de consentement selon ce que déposent réellement Turnstile et Cal.com.
- Actions d'Anne : valider le barème Q10 (matrice actuelle ou question unique) avant 10.4 ; fournir le PDF du guide rebrandé (A-10) et écrire la séquence d'e-mails (nombre d'étapes et délais) avant 10.5 ; valider la politique de confidentialité (finalités, sous-traitants, 3 ans) avant le lancement.
- Le minimum du lancement (epic 12) est 10.1, 10.2 et 10.3 ; sans 10.7, une demande d'effacement RGPD exige encore JB (AD-18) et sans 10.8, une panne se verrait par Anne (AD-12) : à arbitrer avant la date de lancement.
- Chaque story laisse le site utilisable seule ; deux transitoires sont explicites : en 10.3 Anne envoie le PDF du guide à la main jusqu'à 10.5, et en 10.4 le bouton guide de la page de résultats renvoie vers `/guide` jusqu'à 10.5.

