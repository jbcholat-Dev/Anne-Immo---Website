---
id: SPEC-anne-website
version: 5
date: 2026-09-13
companions:
  - ../../planning-artifacts/architecture/architecture-anne-website-2026-08-29/ARCHITECTURE-SPINE.md
  - contexte-existant.md
  - quiz-conception-notion.md
  - quiz-contenu.md
  - ../../../design-system/README.md
sources:
  - ../../../../CLAUDE.md — Anne Immo, contexte projet (2026-08-29)
  - Notion ea0787ebf88c46e9bf4dc2b71725b55d — « [Marketing] Quiz de Génération de Leads Immobilier » (2025-10-23)
  - Notion df8f1a77d8354c9cb858da333fd3d7a8 — « Système de Scoring et Feedbacks – Documentation Complète » (2025-11-10)
  - Notion e08be7f586dd4c3881b2c8bcb5d070d7 — « [Anne] Stratégie digitale & site web »
  - Notion 3cb6cc4216e280d18425e4444a6e6198 — Note specs site, JB vocal (2026-08-29)
  - Notion 3bf6cc4216e280c29de3f4fa2554286f — Réunion de cadrage, JB vocal (2026-08-17)
  - review-findings.json — bmad-review, 31 findings (2026-08-29)
  - ../../../../CLAUDE.md § journal 2026-09-07 — décisions d'architecture vague 1 (JB)
  - ../../../maquettes/lot-3-complet/DECISIONS.md — journal des décisions de la séance maquette lot 3, Anne + JB (2026-09-13)
---

# Site web Anne Vial-Tissot — vitrine de crédibilité et génération de leads

> **Contrat canonique.** Ce SPEC et les fichiers listés dans `companions:` forment le contrat complet — quoi construire, tester, valider. Depuis la v4, le **spine d'architecture** (`ARCHITECTURE-SPINE.md`, AD-1 à AD-18) en fait partie : les `AD-n` cités ci-dessous y renvoient. Les autres documents du projet (CLAUDE.md, Notion) restent des références narratives, pas des sources de contrat.
>
> ✅ Le contenu du diagnostic (questions, options, barème, seuils, feedbacks) est retrouvé et versionné dans `quiz-conception-notion.md` — CAP-4 est implémentable.
> ⚠️ `quiz-contenu.md` (capture du ScoreApp en ligne) est en cours de production et sert à **vérifier** trois écarts connus entre la conception et le déployé : branchements conditionnels, nombre d'options de Q14, nombre total de questions.

## Why

Anne Vial-Tissot est mandataire indépendante chez eXp France, un modèle que les agences traditionnelles attaquent sur le terrain de la légitimité. Le site doit installer sa crédibilité professionnelle (preuve sociale, visuels premium) et ouvrir un canal d'acquisition de leads qualifiés, indépendant de son faible volume de biens en portefeuille (2-3 actifs ; 5-6 ventes/an suffisent à son modèle économique).

## Success signal

Le site est en ligne, les 3 axes (visuels, preuve sociale, diagnostic) et les parcours de conversion (diagnostic, contact direct — vendeur ou acheteur —, demande d'estimation) sont opérationnels, et Anne peut opposer aux agences traditionnelles une preuve concrète de professionnalisme — avis, stories, visuels — plutôt qu'un volume de biens.

Mesuré sur les **6 premiers mois** suivant la mise en ligne :

- **≥ 20 diagnostics complétés** (gate de capture franchi, coordonnées valides)
- **≥ 40 % de taux de complétion** du quiz parmi les visiteurs qui le démarrent
- **≥ 8 rendez-vous pris** via le site
- **0 lead perdu** : chaque soumission est stockée côté site et notifiée à Anne

Ces seuils sont posés par déduction du modèle économique (5-6 ventes/an), pas par une cible fournie — voir Assumptions.

## Capabilities

- **CAP-1 — Visuels professionnels**
  - **intent:** Le visiteur voit des visuels professionnels (vidéos drone, photos) d'Anne dès la homepage, pas de banque d'images.
  - **success:** La homepage présente au minimum 1 séquence vidéo et 6 photographies issues de biens réellement traités par Anne. Aucune image de banque sur l'ensemble du site.
- **CAP-2 — Preuve sociale tierce**
  - **intent:** Le visiteur voit une validation tierce crédible — l'avis de gens qui ont réellement travaillé avec Anne, vendeurs comme acheteurs.
  - **success:** Les avis Immodvisor sont affichés dans le site (note globale, nombre d'avis, extraits, vendeurs et acheteurs mêlés) avec lien vers la fiche source vérifiable ; au minimum **3 avis entiers** sont publiés sur l'accueil, chacun attribué (prénom, rôle vendeur ou acheteur, contexte) et relié à la story correspondante quand elle existe. **Règle de preuve :** toute preuve affichée sur le site est soit une vente réelle, soit un avis vérifiable — rien d'autre (D-8 et D-9, 2026-09-13).
- **CAP-3 — Stories de biens vendus**
  - **intent:** Le visiteur voit une preuve concrète de ventes réussies sans galerie de biens en ligne.
  - **success:** Au minimum 3 stories sont publiées au lancement, chacune combinant photo du bien, récit par Anne et **au moins un témoignage — vendeur ou acheteur, le rôle étant indiqué** ; les deux sont l'idéal, un seul suffit à publier (D-9, 2026-09-13). Remplace la vitrine de biens.
- **CAP-4 — Diagnostic 360°**
  - **intent:** Un prospect s'auto-évalue via un questionnaire d'environ 15 questions et reçoit un diagnostic personnalisé.
  - **success:** Le quiz reproduit fidèlement le contenu de `quiz-conception-notion.md` : 16 questions dont **10 scorées** sur 100 points, réparties en 3 catégories — 📋 Préparation à la Vente (40 pts : Q2, Q3, Q8, Q9), 🎯 Visibilité & Attractivité (40 pts : Q1, Q4, Q5, Q6), 💼 Efficacité Commerciale (20 pts : Q7, Q10) — et 6 questions de qualification non scorées (Q11a, Q11b, Q12, Q13, Q14, Q15, dont une ouverte). **Aucun branchement conditionnel** : le parcours est strictement linéaire, 17 écrans pour 15 numéros logiques (Q10 et Q11 sont chacune scindées en deux écrans successifs, posés à tous). Q14 propose **3 options** (premium complet / forfait estimation + conseils / vente 100 % autonome). Un retour arrière est possible à partir du 2ᵉ écran. Le profil global suit les bandes 0-40 / 41-70 / 71-100 ; chaque catégorie suit les seuils 0-40 % / 41-70 % / 71-100 % de son maximum. Les scores par catégorie sont affichés en brut **et** en pourcentage, pour rester comparables entre elles malgré des maximums différents. La page de résultats affiche le score global, les 3 scores par dimension, et pour chacune l'insight et l'« Impact chiffré » de sa bande — 9 blocs de texte statiques, intégralement documentés dans le companion.
- **CAP-5 — Capture du lead**
  - **intent:** Un bouton dédié mène le prospect vers le diagnostic, et ses résultats complets sont échangés contre ses coordonnées.
  - **success:** Le CTA diagnostic est visible en homepage (hero, au-dessus de la ligne de flottaison, et § 1.6 — pas dans la barre de navigation, D-17) et mène au quiz. Les résultats complets sont délivrés après saisie de prénom, nom, email, téléphone (format international) et opt-in explicite. La page de résultats est liée à un jeton de soumission — elle n'est pas atteignable par URL directe. Le formulaire est protégé contre les soumissions automatisées sans friction visible. En cas d'échec de soumission, les réponses sont conservées côté client et un renvoi est possible.
- **CAP-6 — Contact direct**
  - **intent:** Un prospect déjà prêt à échanger peut laisser ses coordonnées sans passer par le diagnostic. **Le site s'adresse aussi aux acheteurs** (recherche accompagnée : Anne repère, visite en premier, présélectionne) : leur prise de contact passe par ce même chemin, pas par une source de lead supplémentaire (D-5, 2026-09-13).
  - **success:** Un chemin de contact direct existe indépendamment du diagnostic, atteignable depuis toute page. Il recueille prénom, nom, email, téléphone (format international), **la nature du projet (vente ou achat)** et l'acceptation de la politique de confidentialité ; chaque envoi est stocké côté site (AD-4, AD-6). La qualification vente/achat est portée par le lead, de sorte qu'Anne sache à quel parcours répondre.
- **CAP-7 — Activation post-diagnostic**
  - **intent:** Après le diagnostic, le prospect est orienté vers l'action la plus engageante qu'il est prêt à faire.
  - **success:** La page de résultats route vers l'une des deux sorties définies dans `quiz-conception-notion.md`. **Sortie A (prospect qualifié)** — score 71-100 et Q14 orientée accompagnement : CTA « Réservez un rendez-vous stratégique de 30 minutes » (CAP-9), contact direct en second. **Sortie B (à nurturer)** — tous les autres : CTA de téléchargement du plan d'action (CAP-8), puis une **séquence d'e-mails préparée à l'avance** — dans la v1 — qui distille le contenu du guide autrement, envoyée automatiquement à quelques jours d'intervalle à partir de l'inscription (rythme et nombre d'étapes définis par le contenu, pas hebdomadaires). L'opt-in est distinct et stocké côté site ; chaque e-mail porte un lien de désabonnement qui arrête la séquence (AD-1, AD-8, AD-16). Règles d'arbitrage : **Q14 choisit l'offre présentée** ; **Q12 = « minimiser les frais d'agence » force la sortie B quel que soit le score** (un prospect qui refuse la valeur d'un accompagnement ne se convertit pas par un RDV). Le score seul ne décide jamais contre une intention déclarée.
- **CAP-8 — Téléchargement du guide**
  - **intent:** Le prospect repart avec un contenu utile, adapté à son profil de diagnostic.
  - **success:** Depuis la page de résultats, le prospect télécharge un guide correspondant à son profil. Le guide est également accessible hors diagnostic, contre prénom, nom, email et acceptation de la politique de confidentialité ; **le téléphone est facultatif** (AD-6, décision 2026-09-07). Le fichier n'est pas atteignable par URL directe : il est délivré au lead, avec un lien expirant (AD-8).
- **CAP-9 — Prise de rendez-vous**
  - **intent:** Le prospect le plus chaud réserve un créneau avec Anne sans échange d'emails préalable.
  - **success:** Un calendrier de disponibilités réelles est proposé depuis la page de résultats et depuis le contact direct. Les créneaux sont affichés dans le fuseau horaire du visiteur. Une confirmation est envoyée au prospect et à Anne. Un créneau pris entre l'affichage et la confirmation est refusé proprement, sans double réservation. Le formulaire de réservation comporte une acceptation obligatoire de la politique de confidentialité, et chaque réservation est stockée côté site (AD-4, AD-7). Solution retenue : Cal.com, plan gratuit, qui couvre nativement fuseau, verrouillage de créneau et confirmations (AD-8).
- **CAP-10 — Multilingue**
  - **intent:** La clientèle internationale du Léman lit le site dans sa langue — c'est un axe de positionnement d'Anne, pas une commodité.
  - **success:** Le site est **multilingue par conception dès la v1** : aucun texte en dur dans le code, contenus et libellés externalisés, sélecteur de langue, URLs par langue. Le français est la langue de référence. **Une langue livrée est complète ou n'existe pas** : interface, pages éditoriales, diagnostic (17 écrans, 9 feedbacks), emails et pages légales à 100 %, vérifié au build ; un objet éditorial optionnel (story, témoignage) non traduit n'est pas publié dans cette langue — ni index, ni plan du site, ni balise de langue (AD-2). Il n'y a pas de repli automatique vers le français. **Langues livrées en v1 : FR + EN** (décision 2026-09-07) ; ES et PT s'ajoutent ensuite sans changement d'architecture.
- **CAP-11 — Demande d'estimation**
  - **intent:** Un vendeur peut demander à Anne une estimation de son bien. **L'estimation n'est pas produite par le site** : la demande ouvre un rappel puis une visite par Anne (D-4, 2026-09-13).
  - **success:** Un formulaire dédié recueille prénom, nom, téléphone (obligatoire, format international), email, commune du bien, type de bien et un consentement explicite. Le lead est écrit côté site avant toute diffusion, avec la même garantie d'idempotence que les autres sources (contrainte « Stockage de référence des leads », AD-4, AD-6) ; il porte la source `estimation`, distincte de la source `contact`, pour que l'origine reste lisible dans le suivi. Une confirmation est envoyée au prospect et une notification à Anne. Les obligations RGPD sont identiques à celles des autres formulaires.

## Constraints

- **Diagnostic recréé nativement.** Le diagnostic (CAP-4) est construit dans le site, sans dépendance à la plateforme SaaS ScoreApp (décision JB 2026-08-29 ; faisabilité confirmée — quiz à branchements, scoring par catégorie, gate de capture et résultats dynamiques sont standards). Le contenu du diagnostic est intégralement possédé et versionné (`quiz-conception-notion.md`) ; le ScoreApp en ligne n'est plus qu'une référence de vérification, pas un outil à conserver en production.
- **Réalisation interne poussée au maximum** avant tout arbitrage prestataire — devis reçus : 7-10 k€. Claude Design pour la maquette ; **Framer écarté** (2026-09-07) : le rendu est en Astro 7 sur Cloudflare Workers (spine, Stack).
- **Charte graphique v1 obligatoire** pour tout visuel — identité Rive Signature, palette, typographie Italiana, règles d'usage du logo (détail : `../../../design-system/README.md`). **Co-branding eXp obligatoire** (règle du réseau, charte § 2.4, 2026-09-22) : le lockup officiel Anne + eXp figure en pied de page de toutes les pages et sur la page légale, **jamais en en-tête** ; le logo eXp est utilisé dans ses versions officielles Black/White, jamais recoloré ni modifié ; aucune couleur ni typographie eXp n'entre dans l'interface — deux identités juxtaposées, jamais mixées.
- **Pas de vitrine de biens en ligne** — seulement 2-3 biens actifs, risque de décrédibilisation ; remplacée par CAP-3.
- **Conformité RGPD.** Toute capture de données personnelles (CAP-5, CAP-6, CAP-8, CAP-9, CAP-11) exige : base légale identifiée, mentions légales, politique de confidentialité, opt-in distinct pour la newsletter, lien de désabonnement dans chaque email, et une localisation des données documentée.
- **Stockage de référence des leads côté site.** Chaque lead capté est persisté côté site, indépendamment de toute synchronisation CRM. Une notification email à Anne ne constitue pas un stockage. Critères testables : base en juridiction UE (AD-10) ; chaque soumission porte une clé d'idempotence — un renvoi ne crée jamais un second lead (AD-4) ; les champs obligatoires par source suivent le contrat AD-6. La source **`estimation`** (CAP-11) s'ajoute au contrat AD-6, distincte de `contact` (D-4, 2026-09-13).
- **CRM Modelo** fourni voire imposé par eXp France — **tranché le 2026-09-07 (AD-14)** : en v1, l'email de notification à Anne est formaté « prêt à copier » dans la fiche contact Modelo, et une page d'administration protégée permet de marquer la recopie. L'export CSV est écarté (l'import de Modelo InTouch n'alimente pas la base contacts de Modelo Office, vérifié sur capture). L'API Modelo est hors horizon : clé réservée au super-administrateur eXp, 25 € HT/mois, adresse IP fixe requise. Le parcours de capture ne dépend en rien de Modelo.
- **Performance, mobile et SEO local.** Le site est conçu mobile-first ; la homepage se charge utilement en moins de 3 secondes sur connexion mobile malgré les visuels lourds (vidéo différée, images adaptatives) ; le référencement local cible le Chablais et le bassin lémanique.
- **Production de contenu par Anne.** CAP-1, CAP-2, CAP-3 et CAP-8 dépendent d'actifs qu'Anne doit produire ou collecter : séquences drone, photographies, **témoignages de vendeurs et d'acheteurs** (personnes ayant réellement travaillé avec elle), récits de ventes, guide PDF rebrandé. Cette production est sur le chemin critique du lancement, au même titre que le développement. **Hors chemin critique :** la vidéo d'Anne présentant sa méthode est un actif **facultatif, attendu après le lancement** — la page qui l'accueille doit être complète sans elle, et le bloc n'apparaît pas tant que la vidéo n'existe pas (D-12, 2026-09-13).

## Non-goals

- Galerie ou vitrine de biens en ligne.
- Estimation de la valeur d'un bien sur le site — c'est le chantier Estimateur, séparé. Le « diagnostic » porte sur la préparation du vendeur, jamais sur un prix. CAP-11 ne contredit pas ce non-goal : elle capte une **demande** d'estimation et déclenche un rappel humain ; aucune valeur n'est calculée ni affichée par le site.
- Intégration API avec le CRM Modelo — évaluée le 2026-08-30 et classée hors horizon (voir Constraints).
- Arbitrage interne-vs-prestataire (différé à la vague 2 de l'architecture, après validation de la maquette). La stack, elle, est choisie (spine).

## Assumptions

- Le **contenu** du quiz (questions, options, barème, seuils, feedbacks, textes d'orientation) est réutilisé via `quiz-conception-notion.md` ; l'**outil** ScoreApp ne l'est pas. Ce contenu est complet : aucune mécanique n'est à rétro-ingénierer.
- Les chiffres publics repris de la conception (statistique PAP.fr des 9 vendeurs sur 10, « taux de concrétisation supérieur de 30 % à la moyenne ») sont republiés tels quels ; ils ne sont pas sourcés dans le document d'origine et doivent être revalidés avant mise en ligne.
- Les seuils quantitatifs de CAP-1, CAP-2, CAP-3 (1 vidéo, 6 photos, **3 avis Immodvisor entiers**, 3 stories) et de la section Success signal sont **posés par défaut** pour rendre les critères testables. Ils sont à confirmer par Anne ; les revoir ne remet pas en cause les capacités.
- Les cibles marketing du projet (primo-accédants, investisseurs, cadres sup, seniors 60+) s'appliquent aux 3 axes, faute de segmentation alternative dans les sources.
- ~~Les avis Immodvisor sont exploitables hors de leur plateforme~~ — confirmé le 2026-09-07 (widget officiel existant) ; retenu : instantané local (note, nombre, extraits, lien vers la fiche), sans widget (AD-13).
- ~~Des témoignages d'acheteurs non convertis (non-clients) peuvent être collectés en nombre suffisant pour porter une section de l'accueil~~ — retiré le 2026-09-13 (D-8) : contenu non collectable ; la preuve sociale repose désormais sur les avis Immodvisor de vendeurs et d'acheteurs réels (CAP-2).

## Open Questions

- **Interne vs prestataire (7-10 k€)** — arbitrage définitif à la vague 2 de l'architecture, avec la maquette validée en main. L'infrastructure retenue coûte ≈ 80 €/an (spine) : l'arbitrage porte sur le temps de JB, pas sur l'argent ; le signal penche interne.
- **Barème de la Performance commerciale (Q10)** — la conception Notion note Q10 sur 10 points via 5 options combinées (« moins de 5 visites, plusieurs offres »…), alors que le déployé pose deux questions séparées : nombre de visites (4 options) puis nombre d'offres (3 options), soit 12 combinaisons. Le croisement n'est documenté nulle part. **À trancher avant le build** : reconstruire une matrice visites × offres, ou revenir à une question unique combinée. Sans décision, la question unique combinée de la conception s'applique.
- **Intégration Modelo — faisabilité établie le 2026-08-30, calendrier ouvert.** L'API Modelo Office (Netty) accepte la création de contacts depuis l'extérieur et documente explicitement « créer un contact vendeur suite à la soumission d'un formulaire ». Trois obstacles : la clé ne peut être créée que par un **super-administrateur**, donc par eXp France et non par Anne ; elle coûte **25 € HT/mois** ; et elle impose une **restriction par IP**, incompatible en l'état avec un hébergement statique sans IP de sortie fixe. Recommandation : hors v1, architecture prête à l'accueillir. Détail : `../../planning-artifacts/architecture-brief.md`.
- **Champs minimaux du formulaire d'estimation (CAP-11)** — proposition de la séance du 2026-09-13 (D-4, point ouvert 3) : prénom, nom, téléphone, e-mail, commune du bien, type de bien, consentement. Retenue par défaut dans CAP-11 ; à confirmer avec Anne avant le build (arbitrage friction vs qualification — adresse précise ou commune seule, surface, délai de vente).
- **Formulaire « Parler de votre projet » de la page Acheter (CAP-6)** — dédié ou identique au contact avec un champ de qualification vente/achat ? (D-5, point ouvert 4). Retenu par défaut : **le formulaire de contact qualifié**, donc pas de source de lead supplémentaire. Un formulaire dédié ouvrirait une source `achat` au contrat AD-6 — décision à prendre avant le build.

### Différés — non bloquants pour la maquette et l'architecture

- Où et comment présenter le formulaire de contact direct dans le parcours ? (renvoyé à la phase design)
- ~~Quel nom pour la méthode — « Système 360™ » (ScoreApp) ou « Méthode 360° » (Gamma) ?~~ — tranché le 2026-09-22 (D-15) : « Ma méthode : bon sens, rigueur et pragmatisme ».
- Quel positionnement marketing — Système/Méthode 360 ou « Expert Frontaliers » ?
- Le concept « stories de biens vendus » est-il validé par Anne elle-même ? (décision JB solo à ce stade)
