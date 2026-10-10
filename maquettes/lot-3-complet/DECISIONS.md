# Maquette lot 3 — journal des décisions

> **C'est ici que vit la trace.** Chaque écart entre ce que les briefs demandaient et ce qu'Anne et JB décident en regardant la maquette est consigné ici d'abord, daté, avec son statut. Ensuite seulement, on répercute dans les documents de référence (colonne « À propager »). Une décision non consignée ici n'existe pas.
>
> Statuts : ✅ tranché · 🔄 ouvert, à trancher en séance · ❌ écarté.
> Prévu par `brief-maquette-complete.md` § 3 et § 9. Critère de sortie de la vague 2 : plus aucun 🔄 sur une page.

## Séance du 2026-09-13 (Anne + JB, sur la maquette lot 3 générée)

| # | Décision | Statut | À propager |
|---|---|---|---|
| D-1 | **Hero de l'accueil : les plans en parallaxe sont abandonnés.** À la place, une vidéo drone tournée sur les biens vendus, plein cadre, en fond du titre. | ✅ | `brief-scrollcraft-fora.md` (spec des plans § 2 → périmée pour le hero) · `brief-maquette-complete.md` § 1, § 3 (artboards « Hero — plans » supprimés) · `CLAUDE.md` journal 2026-09-04 · au build : AD-15 (budget perf → image d'ouverture, chargement différé, repli image sur mobile / connexion lente, jamais de son). **Rien à changer dans SPEC** : le SPEC parle de « visuels pro en homepage », pas de la mécanique. |
| D-2 | **Navigation : entrée « À propos »** tout à gauche, menu au survol avec trois sous-entrées : « Qui suis-je ? », « Ma méthode », « Cible ». | 🔄 | `structure-site.md` § nav. — **« Cible » incertaine** (profils de clients : primo-accédants, investisseurs, cadres, seniors). Question pour la séance : les profils ne sont-ils pas déjà portés par Vendre / Acheter (D-4, D-5) ? Si oui, « Cible » est redondante. |
| D-3 | **« Réalisation »** inchangé : mène aux stories de biens vendus avec photos. | ✅ | — |
| D-4 | **Nouvelle entrée « Vendre »** : une page qui propose deux portes — entrer dans le diagnostic, ou **faire estimer son bien**. L'estimation n'est pas faite sur le site : un formulaire capture les coordonnées, Anne rappelle et visite. | ✅ concept | `structure-site.md` (page 11) · **SPEC : nouvelle capacité « Demande d'estimation »** (source de lead distincte du contact) · architecture : AD-6 contrat de champs par source → ajouter la source `estimation` (téléphone obligatoire, adresse ou commune du bien, type de bien) · la landing Diagnostic reste une porte d'entrée autonome (décision 2026-08-29), Vendre ne la remplace pas. |
| D-5 | **Nouvelle entrée « Acheter »** : le parcours acheteur (primo-accédants, investisseurs), le service de recherche accompagnée (Anne repère, visite en premier, présélectionne), CTA « Parler de votre projet » → prise de contact, rappel. | ✅ concept | `structure-site.md` (page 12) · SPEC : parcours acheteur = nouvelle porte vers CAP-6 contact (pas de nouvelle source de lead si le formulaire est celui du contact, avec un champ « projet : vente / achat ») · **contenu à écrire par Anne** : `contenu-anne/pages/acheter/fr.md` (gabarit `page.md`). |
| D-6 | **Liens réseaux sociaux dans la barre de navigation**, à gauche du logo (demande d'Anne). JB réservé : risque de surcharge, préférence pour les laisser en pied de page. | ✅ variante A (JB, canvas 2026-09-13 ; confirmé 2026-09-22) | À montrer en deux variantes sur l'artboard « Décisions à trancher » ; trancher en séance. |
| D-7 | Bouton « Diagnostic » (pilule terracotta) et bascule FR / EN dans la nav : maintenus. | ❌ annulée par D-17 (bouton retiré) ; la bascule FR / EN reste | — |
| D-8 | **Section « Ils l'ont rencontrée » (accueil § 1.5) supprimée.** Les témoignages d'acheteurs non convertis n'ont pas pu être collectés en nombre suffisant ; on ne construit pas une section sur un contenu qu'on n'a pas. | ✅ | `structure-site.md` § 1.5 (supprimer, renuméroter 1.6-1.8) · **SPEC CAP-2** : retirer l'exigence « 3 témoignages d'acheteurs non-clients » (critère de succès et contrainte « production de contenu ») · spine AD-1 : objet `TemoignageNonClient` retiré de l'inventaire · `contenu-anne/_gabarits/temoignage-non-client.md` retiré · brief lot 3 § 3-4 : courbe de sentiment de l'accueil recalée (toujours 8 actes : « Ils ont travaillé avec Anne » prend la place, D-9) · actif A-06 abandonné (A-07, le témoignage par story, est conservé et élargi par D-9). |
| D-9 | **La preuve sociale se réarchitecture autour de deux sources réelles : les biens vendus et ce qu'en disent les gens qui ont travaillé avec Anne — vendeurs *et* acheteurs.** Précision JB : quand une vente va au bout, l'acheteur laisse souvent un avis (Immodvisor accueille les avis d'acheteurs), et Anne continue de l'accompagner après l'achat. Ce qui a manqué, ce sont uniquement les visiteurs non convertis (D-8). Proposition : (a) bande § 1.2 conservée ; (b) chaque story porte **jusqu'à deux témoignages, vendeur et acheteur** — l'idéal est les deux, un seul suffit pour publier ; (c) une section **« Ils ont travaillé avec Anne »** remplace § 1.5 : trois avis Immodvisor entiers, mêlant vendeurs et acheteurs, reliés à la story correspondante quand elle existe (photo + avis), citation seule sinon. Règle : toute preuve du site est soit une vente réelle, soit un avis vérifiable — rien d'autre. | ✅ concept | `structure-site.md` § 1.3, § 1.5 (nouveau contenu), § 2 fiche story · SPEC CAP-2 (avis Immodvisor, vendeurs et acheteurs ; exigence « non-clients » retirée) et CAP-3 (témoignage vendeur et/ou acheteur, au moins un) · gabarit `story.md` (`temoignages:` liste, chacun avec `role: vendeur | acheteur`) · `_suivi-stories.md` (checklist « publiable » : au moins un témoignage). |
| D-10 | **Hero : la liste de communes en bas à droite (Thonon · Évian · Sciez · Anthy · Bernex · Allinges) est retirée.** Elle correspond à des ventes réelles mais borne le territoire : Anne travaille sur tout le Chablais et le bassin lémanique, pas sur six communes. Le secteur reste dit une fois, dans le sous-titre du hero. | ✅ | `brief-maquette-complete.md` § 3-4 (hero) · `structure-site.md` § 1.1. |
| D-11 | **« À propos » est une seule page longue** : « Qui suis-je ? », « Ma méthode » (et « Cible » si retenue) sont des sections de cette page, les sous-entrées du menu en sont les ancres. Conséquence : les pages Méthode (§ 3) et Anne (§ 4) fusionnent. Le lien « La méthode en détail » de l'accueil (§ 1.4) mène à l'ancre Méthode de cette page. | ✅ | `structure-site.md` § 3 + § 4 → une seule § « À propos » avec ancres · § 1.4 (cible du lien) · inventaire des pages · SEO (AD-13) : une URL de moins, les ancres ne sont pas des pages indexables — acceptable, la méthode n'est pas une requête de recherche. |
| D-13 | **Co-branding eXp intégré à la charte (§ 2.4, 2026-09-22)** — hors séance, changement de brief : le lockup officiel Anne + eXp (négatif) apparaît en pied de page de toutes les pages et sur la page légale, jamais en en-tête ; logos eXp intouchables. À faire apparaître dans la prochaine régénération de maquette. | 🔄 à valider avec Anne | Déjà propagé : SPEC (contrainte charte), `structure-site.md` § 0 et § 10, brief lot 3 § logos + artboard 00, spine AD-17, design system (carte Brand + 6 SVG). |
| D-14 | **Logo sans sous-titre par défaut (charte § 2, 2026-09-22)** — hors séance, changement de brief : le sous-titre « CONSEIL IMMOBILIER — LÉMAN & CHABLAIS » quitte les logos (illisible dès qu'ils sont réduits) ; version avec descripteur réservée aux supports print ≥ seuil (recto carte, papeterie, couvertures). Sur le site : logo sans en en-tête, lockup eXp sans en pied de page, monogramme sans en favicon/avatar ; le secteur se dit dans le sous-titre du hero et la ligne de statut du footer. Comparatif : https://claude.ai/artifact/Qc6ZkE4ZUYUxtfAUFtuYaK | ✅ (JB, après comparatif ; à montrer à Anne) | Déjà propagé : SPEC, structure-site § 0/§ 10, brief lot 3, spine AD-17, charte § 2, design system, CLAUDE.md. À faire apparaître dans la prochaine régénération de maquette. |
| D-12 | **Vidéo d'Anne présentant sa méthode**, dans la section Méthode de la page À propos. Très probablement absente à la première publication : la maquette la prévoit (bloc « Actif attendu A-xx »), et la page doit être complète sans elle (le bloc n'apparaît pas tant que la vidéo n'existe pas — pas de trou, pas de placeholder en production). | ✅ | `structure-site.md` § À propos + table des actifs (nouvel actif vidéo méthode, facultatif) · brief lot 3 § 3 (artboard avec et sans vidéo) · contenu : champ `video_methode` facultatif sur la page (gabarit `page.md`) · **tâche Anne** : tourner la vidéo, après lancement. |

### Conséquence structurelle à acter

La nav passe de 4 entrées + bouton à **5 entrées (À propos ▾ · Réalisation · Vendre · Acheter · Contact) + FR/EN** (le bouton Diagnostic est retiré depuis, D-17). Le site passe de 10 pages à **11** : Méthode et Anne fusionnent en « À propos » (D-11), Vendre et Acheter s'ajoutent (D-4, D-5). « Cible » (D-2), si retenue, est une section d'À propos, pas une page. `structure-site.md` doit passer en v4 avant toute nouvelle génération de maquette — sinon Claude Design repart du brief à 10 pages.

## Revue du 2026-09-22 (JB, sur l'export du canvas du 22/09 — comparaison maquette ↔ cahier des charges, 15 points validés un par un)

| # | Décision | Statut | À propager |
|---|---|---|---|
| D-15 | **La méthode s'appelle « Ma méthode : bon sens, rigueur et pragmatisme »** (3 piliers, 4 traductions concrètes, 6 partenaires : expert-comptable, géomètre, diagnostiqueurs, notaire, urbanisme, gestion de projet). Le « Système 360™ » à trois axes disparaît. Source : `contenu-anne/pages/a-propos/fr.md` (2026-09-10). | ✅ | `structure-site.md` § 1.4, § 3.1, § 3.2 · SPEC (question différée close) · brief lot 3 § 4 · maquette (déjà conforme). |
| D-16 | **Ventes récentes (§ 1.3) : pile de six cartes collantes** (sticky, `top` = nav + 24 px, pas ≈ 70 vh, sans scale ni flou), gardée en mobile. Le carrousel de `structure-site` v4 est abandonné. Citation courte du témoignage sur les cartes dont la story en porte un. | ✅ | `structure-site.md` § 1.3 (desktop + mobile, états) · `brief-scrollcraft-fora.md` § 3.2 déjà conforme. |
| D-17 | **Bouton « Diagnostic » retiré des barres de navigation** (desktop, réduite, mobile). Annule D-7 pour le bouton ; la bascule FR / EN reste. L'accès au diagnostic passe par le hero, § 1.6, Vendre, le menu et le pied de page. | ✅ | `structure-site.md` § 0 (desktop et mobile) · SPEC CAP-5 (« visible en homepage » reste vrai : hero + § 1.6) · brief lot 3 § 7. |
| D-18 | **Geste signature : aucun.** La ligne-signature qui se trace (brief § 5) est écartée (JB, canvas 2026-09-10). | ✅ | brief lot 3 § 2 et § 5. |
| D-19 | **Hero : bloc nom + ligne de positionnement + CTA posé en bas de cadre** (84 px du bord), hauteur 900 px desktop, voile allégé en haut. | ✅ | brief lot 3 § 4 (1.1). |
| D-20 | **Bandeau preuve (§ 1.2) sur fond Klein**, lien Immodvisor souligné écru. | ✅ | — |
| D-21 | **Logo en en-tête = symbole seul** (cercle Klein + strate terracotta), le nom vit dans le hero et dans le lockup du pied de page ; **logo négatif sans cercle écru** (tweak canvas, arbitré). | ✅ | `structure-site.md` § 0 · charte § 2 / design system (`brand/logo.html`). |
| D-22 | **Fermeture de l'accueil (§ 1.8) : bande Klein, sans image du lac** — l'idée des plans qui reviennent, puis de l'image fixe du lac, est abandonnée. | ✅ | brief lot 3 § 4 (1.8). |
| D-23 | **Profils de score (§ 8.2) codés Klein / terra-deep / brun** (Bien préparé / Bases solides / Stratégie à risque) — la palette de la charte, ni rouge ni ambre. | ✅ | `structure-site.md` § 8.2 · maquette `07-resultats-etat-risque`, Composants. |
| D-24 | **Tokens sémantiques ajoutés au design system** : `--avt-text-muted` #5C5248, `--avt-text-on-dark-muted` #D9CFC0, `--avt-placeholder` #D9CFBD, `--avt-disabled` #B7AC9D (contrastes ≥ 4,5:1 vérifiés). Les 7 couleurs de la charte restent les seules couleurs d'identité. | ✅ | `design-system/tokens/tokens.css` · README. |
| D-25 | **Contraste des boutons : point ouvert.** Terra-deep #A34E30 (5,3:1) appliqué à titre provisoire dans la maquette ; terracotta #C4623E (charte) fait 3,6:1 sur écru à 15 px. À trancher avec Anne (point ouvert 5). | 🔄 | charte § boutons · `design-system/components/boutons.html`. |
| D-26 | **Table des pages = celle du brief lot 3 v2 § 3** (00 Navigation, 01 Accueil, 02 Diagnostic landing, 03 Parcours, 04 Résultats, 05 Réalisation, 06 Story, 07 À propos, 08 Vendre, 09 Acheter, 10 Contact, 11 Guide, Légal en annexe). L'index des ventes est titré **« Réalisation »** (EN : « Track record »), comme l'entrée de nav (D-3). | ✅ | `structure-site.md` inventaire · ce fichier (table de validation) · maquette (h1). |

## Décision du 2026-09-26 (JB, à l'intégration de la vidéo d'ouverture — story 8.3)

| # | Décision | Statut | À propager |
|---|---|---|---|
| D-27 | **Le hero, c'est le montage d'Anne, en entier (95 s), en boucle, sans son** (D-1 précisée). Le 2026-10-05, JB remplace le montage par une nouvelle version d'Anne (52 s, story 7.15) ; la règle reste la même. Le montage a été fait exprès pour le site : on ne le découpe pas, on ne le recadre pas (le logo eXp incrusté reste). **Le poster A-14 devient la première image de la vidéo** (Anne face caméra dans un pré du Chablais) : image d'attente pendant le chargement et repli si la lecture automatique est refusée (mouvement réduit, économie de données), sans saut visuel au démarrage. La photo d'Armoy quitte le hero. Poids : 1440 px, ≈ 15 Mo MP4 — écart assumé au budget « 12 s, < 6 Mo » (voir `site/README.md` § Écarts). | ✅ | `site/README.md` · `scripts/video.mjs` · story 8.3. |

## Décisions du 2026-10-08 (Anne, retours d'aperçu n° 39, 40 et 42 — story 8.7)

| # | Décision | Statut | À propager |
|---|---|---|---|
| D-29 | **« Réalisations » au pluriel, index titré « Quelques réalisations »** (remplace D-3 et le titre de D-26). Anne : sinon « on va croire que j'ai vendu que qqs biens ». L'adresse `/realisation` ne change pas ; l'anglais garde « Track record ». | ✅ | `structure-site.md` § 0 et § 2 · `site/src/content/ui/fr.json` · `site/src/pages/realisation/` · story 8.7. |
| D-30 | **Un second bouton « Estimation offerte » dans l'ouverture de l'accueil** (amende « un seul CTA » de `structure-site.md` § 1.1 et D-19), en contour clair à côté du bouton du diagnostic, qui reste le bouton principal (plein). Il mène à l'agenda de `/contact#reserver`. Ce qu'on perd : un appel à l'action unique et plus net ; gardé parce que « estimation offerte » est la porte d'entrée que les vendeurs cherchent, quand le diagnostic demande trois minutes. | ✅ | `structure-site.md` § 1.1 · `site/src/components/accueil/Hero.astro` · story 8.7. |

## Décision du 2026-10-04 (JB, retour d'aperçu n° 3 — story 8.5)

| # | Décision | Statut | À propager |
|---|---|---|---|
| D-28 | **Un lien « Accueil » en toutes lettres ouvre la navigation** (desktop, réduite, menu mobile ; « Home » en anglais), avant « À propos ▾ ». Le symbole seul (D-21) ramène toujours à l'accueil, mais JB a relevé sur l'aperçu que ce n'était « pas très intuitif ». Le lien est marqué « page en cours » sur l'accueil seulement (pas sur la 404). Ce qu'on perd : une entrée de plus dans une barre déjà dense ; vérifié à 900 px, la plus petite largeur desktop, sans débordement (entrées resserrées de 32 à 22 px entre 900 et 1 099 px). | ✅ | `structure-site.md` § 0 · `site/README.md` · `site/src/components/Nav.astro` · story 8.5. |

## Décisions du 2026-10-08 au soir (Anne et JB, retours d'aperçu n° 57 à 64 — story 8.9)

| # | Décision | Statut | À propager |
|---|---|---|---|
| D-32 | **Anne est « conseillère en immobilier »** (plus « consultante », EN « real-estate advisor »), et **la pile de l'accueil s'intitule « Chaque bien mérite une attention particulière et un service adapté »** (remplace « Des maisons vendues, pas des annonces »). Accroche choisie par JB le 2026-10-08 parmi les trois proposées par Anne (tickets n° 62 et 63). Ce qu'on perd : un titre court ; celui-ci tient sur deux lignes sur ordinateur et quatre sur téléphone. | ✅ | `structure-site.md` § 1.3 · `site/src/content/ui/*.json` · story 8.9. |
| D-33 | **Le bloc « Anne » suit immédiatement les ventes** sur l'accueil (avant « Ma méthode ») au lieu de clore la page avant la fermeture. Anne s'interrogeait sur « qui je suis en dernier » ; le visiteur qui vient de voir des ventes veut savoir qui les a menées. Ce qu'on perd : l'ordre de la maquette (preuve, méthode, avis, puis la personne). | ✅ | `structure-site.md` § 1 · `site/src/pages/index.astro` et `en/index.astro` · story 8.9. |
| D-34 | **À propos : quatre ancres (Qui suis-je ? · Ma méthode · Cible · Réseau eXp)**, Cible retenue (clôt le point ouvert 1, D-2) et écrite par Anne, Cible et Réseau eXp lues dans le texte de la page (espace d'édition) ; refrain « Pas de mauvaise surprise… » retiré de la page ; « Mon engagement » et « Parlons de votre projet » centrés, avec boutons de rendez-vous. | ✅ | `structure-site.md` § 0 et § 3 · `site/src/pages/a-propos.astro` · `site/src/lib/contenu.ts` · story 8.9. |
| D-36 | **Sur grand écran, le contenu s'arrête à 1312 px de large et se centre** (au-delà de 1440 px de fenêtre) ; les fonds de couleur et les photos pleine largeur continuent jusqu'aux bords. Réglé en un seul endroit, la marge latérale de `global.css`. Ticket n° 65 de JB : les cartes s'étiraient sur tout l'écran. Ce qu'on perd : rien sous 1440 px, la page est identique. | ✅ | `site/src/styles/global.css` · story 8.9. |
| D-37 | **Les avis clients s'affichent en cartes : une phrase de l'avis en grand, puis l'avis entier en taille de lecture, replié au-delà de quelques lignes (« Lire la suite »).** La phrase est choisie par Anne (champ « Phrase mise en avant » de l'avis dans l'espace d'édition) et recopiée mot pour mot ; le site ne l'affiche que si elle figure telle quelle dans l'avis. L'avis reste entier dans la page (D-9). Sans phrase : un guillemet bleu, puis l'avis. Ticket n° 68 de JB : un avis long faisait un pavé de 1 800 px en caractère de titre sur les pages de vente, et l'accueil avait trois colonnes de hauteurs très différentes. Ce qu'on perd : l'avis n'est plus lu d'un bloc sans clic au-delà de 6 à 8 lignes. Choisie par JB sur la carte de décision du 09/10 (option « Phrase forte + avis »). | ✅ | `site/src/components/AvisCarte.astro` (pages de vente, accueil, Acheter) · champ `phrase` des avis · story 8.10. |
| D-38 | **Landing du diagnostic : l'image de l'offre est un aperçu du rapport en feuille A4 (score sur 100, profil, trois axes notés, recommandations), plus une photo de maison** ; au-dessus du titre, le nom et le portrait d'Anne avec « conseillère en immobilier, Chablais et Léman ». Décision de JB du 2026-10-10 (« la photo d'une maison, c'est pas très parlant ») : la page sert de destination aux campagnes, le visiteur doit voir ce qu'il obtient. Valeurs d'exemple marquées « Exemple », aucun nom fictif. Ce qu'on perd : une photo réelle d'un bien vendu sur l'écran d'ouverture (elle reste dans le bloc preuve). | ✅ | `site/src/components/RapportApercu.astro` · `site/src/pages/diagnostic/index.astro` · `structure-site.md` § 6 (« une image sobre ») · story 5.4. |
| D-35 | **Visionneuse sur les fiches de vente** : clic sur une photo → plein écran, flèches, glissé, Échap. Fenêtre native du navigateur, sans bibliothèque (budget de vitesse AD-15). | ✅ | `site/src/pages/realisation/[slug].astro` · story 8.9. |

## Décision du 2026-10-08 (proposée par Anne, charte v3 ; validée par JB, PR #49 fusionnée le 2026-10-08 — story 8.8)

| # | Décision | Statut | À propager |
|---|---|---|---|
| D-31 | **Typographies de la charte v3 : Gilda Display remplace Italiana, Jost remplace DM Sans.** Gilda Display (une seule graisse) pour le logo, les titres et les grands chiffres, jamais sous 15 px (Italiana : jamais sous 22 px). Jost 400 / 500 pour le texte, l'interface et les étiquettes ; le gras, c'est Jost 500 (plus de 600 ni de 700). Raison d'Anne : un trait plus solide, « VIAL-TISSOT » lisible jusqu'à 15 px, et une meilleure lecture sur téléphone. Le nom dans les logos passe en Gilda Display, réduit de 52 à 46 px (44 px pour l'empilé) pour garder exactement la même largeur. Couleurs, boutons, co-branding : inchangés. Source : artefact d'Anne « Charte graphique v3 », https://claude.ai/artifact/L5WMPPVNZqneFUng7Loyie. | ✅ | `design-system/` (tokens, cartes, 14 SVG) · `site/` (polices, Lockup) · SPEC (contrainte charte) · story 8.8. |

Écarts maquette ↔ CDC corrigés dans le canvas le 2026-09-22 (export `maquettes/lot-3-complet/`) : section « Ils ont acheté avec Anne » sur Acheter (§ 5.4) · case « séquence d'e-mails » sur l'estimation (§ 4) · citations sur deux cartes de la pile (D-16) · fiche story mobile · sortie A mobile, sortie B desktop, profil « Stratégie à risque » · YouTube et ligne de statut dans le pied de page (§ 0) · téléphone obligatoire sur Contact (§ 9) · dates des avis (A-11) · hamburger mobile invisible sur 4 pages, `clipPath` cassé, libellé A-01 périmé, réglage « 4 cartes » retiré (CAP-1). Restent au build : menu « À propos » à deux sous-entrées, story sans photo secondaire, 404, footer complet sur toutes les pages, nav fixe dès le premier pixel.

### Points laissés ouverts (mis à jour le 2026-09-22)

1. « Cible » : section d'À propos, ou absorbée par Vendre / Acheter ? (D-2)
2. Formulaire d'estimation : quels champs au minimum ? (D-4)
3. Le formulaire « Parler de votre projet » de la page Acheter : le même que Contact, ou dédié ? (D-5)
4. Preuve sociale (D-9) : quels trois avis Immodvisor, et un ou deux avis d'acheteurs pour la page Acheter.
5. Contraste des boutons : terra-deep ou terracotta (D-25).
6. Co-branding eXp en pied de page et en tête des mentions légales, logo sans sous-titre, logo négatif sans cercle : à montrer à Anne (D-13, D-14, D-21).

### Points laissés ouverts pour la prochaine séance (séance du 2026-09-13, remplacés par la liste ci-dessus)

1. « Cible » : page à part, ou absorbée par Vendre / Acheter ? (D-2)
2. Réseaux sociaux : nav ou pied de page ? (D-6)
3. Formulaire d'estimation : quels champs au minimum ? Proposition : prénom, nom, téléphone, e-mail, commune du bien, type de bien, consentement. (D-4)
4. Le formulaire « Parler de votre projet » de la page Acheter : le même que Contact, ou dédié ? (D-5)
5. Preuve sociale (D-9) : quels trois avis Immodvisor pour la section « Ils ont travaillé avec Anne » — idéalement deux vendeurs + un acheteur, et au moins un relié à une story rédigée.

## Pages — état de validation

| Page | Desktop | Mobile | Commentaire |
|---|---|---|---|
| 01 Accueil | 🔄 | 🔄 | Hero revu (D-1, D-19), nav revue (D-2 → D-6, D-17, D-21), pile (D-16), fermeture (D-22) |
| 02 Diagnostic (landing) | 🔄 | 🔄 | non revue en séance |
| 03 Diagnostic (questions) | 🔄 | 🔄 | non revue |
| 04 Résultats | 🔄 | 🔄 | non revue |
| 05 Réalisation (index) | 🔄 | 🔄 | h1 « Quelques réalisations » (D-29, remplace D-26) |
| 06 Story | 🔄 | 🔄 | mobile ajouté le 22/09 |
| 07 + 08 → À propos | 🔄 | 🔄 | Méthode et Anne fusionnent en une page à ancres (D-11) ; vidéo méthode prévue, facultative (D-12) ; « Cible » à trancher (D-2) |
| 09 Contact | 🔄 | 🔄 | non revue |
| 10 Guide | 🔄 | 🔄 | non revue |
| 08 Vendre | 🔄 | 🔄 | maquettée (D-4), case e-mails ajoutée le 22/09 |
| 09 Acheter | 🔄 | 🔄 | maquettée (D-5), section avis d'acheteurs ajoutée le 22/09 |
