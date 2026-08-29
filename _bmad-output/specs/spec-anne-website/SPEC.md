---
id: SPEC-anne-website
version: 3
date: 2026-08-29
companions:
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
---

# Site web Anne Vial-Tissot — vitrine de crédibilité et génération de leads

> **Contrat canonique.** Ce SPEC et les fichiers listés dans `companions:` forment le contrat complet — quoi construire, tester, valider. Les autres documents du projet (CLAUDE.md, Notion) restent des références narratives, pas des sources de contrat.
>
> ✅ Le contenu du diagnostic (questions, options, barème, seuils, feedbacks) est retrouvé et versionné dans `quiz-conception-notion.md` — CAP-4 est implémentable.
> ⚠️ `quiz-contenu.md` (capture du ScoreApp en ligne) est en cours de production et sert à **vérifier** trois écarts connus entre la conception et le déployé : branchements conditionnels, nombre d'options de Q14, nombre total de questions.

## Why

Anne Vial-Tissot est mandataire indépendante chez eXp France, un modèle que les agences traditionnelles attaquent sur le terrain de la légitimité. Le site doit installer sa crédibilité professionnelle (preuve sociale, visuels premium) et ouvrir un canal d'acquisition de leads qualifiés, indépendant de son faible volume de biens en portefeuille (2-3 actifs ; 5-6 ventes/an suffisent à son modèle économique).

## Success signal

Le site est en ligne, les 3 axes (visuels, preuve sociale, diagnostic) et les 2 parcours (diagnostic, contact direct) sont opérationnels, et Anne peut opposer aux agences traditionnelles une preuve concrète de professionnalisme — avis, stories, visuels — plutôt qu'un volume de biens.

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
  - **intent:** Le visiteur voit une validation tierce crédible — avis Immodvisor et témoignages d'acheteurs non convertis.
  - **success:** Les avis Immodvisor sont affichés dans le site (note globale + extraits) avec lien vers la fiche source vérifiable ; au minimum 3 témoignages d'acheteurs non-clients sont collectés et publiés, chacun attribué (prénom, contexte).
- **CAP-3 — Stories de biens vendus**
  - **intent:** Le visiteur voit une preuve concrète de ventes réussies sans galerie de biens en ligne.
  - **success:** Au minimum 3 stories sont publiées au lancement, chacune combinant photo du bien, récit par Anne et témoignage de l'acheteur. Remplace la vitrine de biens.
- **CAP-4 — Diagnostic 360°**
  - **intent:** Un prospect s'auto-évalue via un questionnaire d'environ 15 questions et reçoit un diagnostic personnalisé.
  - **success:** Le quiz reproduit fidèlement le contenu de `quiz-conception-notion.md` : 16 questions dont **10 scorées** sur 100 points, réparties en 3 catégories — 📋 Préparation à la Vente (40 pts : Q2, Q3, Q8, Q9), 🎯 Visibilité & Attractivité (40 pts : Q1, Q4, Q5, Q6), 💼 Efficacité Commerciale (20 pts : Q7, Q10) — et 6 questions de qualification non scorées (Q11a, Q11b, Q12, Q13, Q14, Q15, dont une ouverte). **Aucun branchement conditionnel** : le parcours est strictement linéaire, 17 écrans pour 15 numéros logiques (Q10 et Q11 sont chacune scindées en deux écrans successifs, posés à tous). Q14 propose **3 options** (premium complet / forfait estimation + conseils / vente 100 % autonome). Un retour arrière est possible à partir du 2ᵉ écran. Le profil global suit les bandes 0-40 / 41-70 / 71-100 ; chaque catégorie suit les seuils 0-40 % / 41-70 % / 71-100 % de son maximum. Les scores par catégorie sont affichés en brut **et** en pourcentage, pour rester comparables entre elles malgré des maximums différents. La page de résultats affiche le score global, les 3 scores par dimension, et pour chacune l'insight et l'« Impact chiffré » de sa bande — 9 blocs de texte statiques, intégralement documentés dans le companion.
- **CAP-5 — Capture du lead**
  - **intent:** Un bouton dédié mène le prospect vers le diagnostic, et ses résultats complets sont échangés contre ses coordonnées.
  - **success:** Le CTA diagnostic est visible en homepage et mène au quiz. Les résultats complets sont délivrés après saisie de prénom, nom, email, téléphone (format international) et opt-in explicite. La page de résultats est liée à un jeton de soumission — elle n'est pas atteignable par URL directe. Le formulaire est protégé contre les soumissions automatisées sans friction visible. En cas d'échec de soumission, les réponses sont conservées côté client et un renvoi est possible.
- **CAP-6 — Contact direct**
  - **intent:** Un prospect déjà prêt à échanger peut laisser ses coordonnées sans passer par le diagnostic.
  - **success:** Un chemin de contact direct existe indépendamment du diagnostic, atteignable depuis toute page.
- **CAP-7 — Activation post-diagnostic**
  - **intent:** Après le diagnostic, le prospect est orienté vers l'action la plus engageante qu'il est prêt à faire.
  - **success:** La page de résultats route vers l'une des deux sorties définies dans `quiz-conception-notion.md`. **Sortie A (prospect qualifié)** — score 71-100 et Q14 orientée accompagnement : CTA « Réservez un rendez-vous stratégique de 30 minutes » (CAP-9), contact direct en second. **Sortie B (à nurturer)** — tous les autres : CTA de téléchargement du plan d'action (CAP-8), puis newsletter hebdomadaire. Règles d'arbitrage : **Q14 choisit l'offre présentée** ; **Q12 = « minimiser les frais d'agence » force la sortie B quel que soit le score** (un prospect qui refuse la valeur d'un accompagnement ne se convertit pas par un RDV). Le score seul ne décide jamais contre une intention déclarée.
- **CAP-8 — Téléchargement du guide**
  - **intent:** Le prospect repart avec un contenu utile, adapté à son profil de diagnostic.
  - **success:** Depuis la page de résultats, le prospect télécharge un guide correspondant à son profil. Le guide est également accessible hors diagnostic, contre les mêmes coordonnées que CAP-5.
- **CAP-9 — Prise de rendez-vous**
  - **intent:** Le prospect le plus chaud réserve un créneau avec Anne sans échange d'emails préalable.
  - **success:** Un calendrier de disponibilités réelles est proposé depuis la page de résultats et depuis le contact direct. Les créneaux sont affichés dans le fuseau horaire du visiteur. Une confirmation est envoyée au prospect et à Anne. Un créneau pris entre l'affichage et la confirmation est refusé proprement, sans double réservation.
- **CAP-10 — Multilingue**
  - **intent:** La clientèle internationale du Léman lit le site dans sa langue — c'est un axe de positionnement d'Anne, pas une commodité.
  - **success:** Le site est **multilingue par conception dès la v1** : aucun texte en dur dans le code, contenus et libellés externalisés, sélecteur de langue, URLs par langue. Le français est la langue de référence et le repli systématique. Le périmètre traduit couvre les pages, le quiz, les pages de résultats et les emails transactionnels — pas d'écran à moitié traduit. Les langues effectivement livrées en v1 sont fixées à l'étape architecture (voir Open Questions) ; l'architecture ne doit pas rendre l'ajout d'une langue coûteux.

## Constraints

- **Diagnostic recréé nativement.** Le diagnostic (CAP-4) est construit dans le site, sans dépendance à la plateforme SaaS ScoreApp (décision JB 2026-08-29 ; faisabilité confirmée — quiz à branchements, scoring par catégorie, gate de capture et résultats dynamiques sont standards). Le contenu du diagnostic est intégralement possédé et versionné (`quiz-conception-notion.md`) ; le ScoreApp en ligne n'est plus qu'une référence de vérification, pas un outil à conserver en production.
- **Réalisation interne poussée au maximum** (Claude Design + Framer) avant tout arbitrage prestataire — devis reçus : 7-10 k€.
- **Charte graphique v1 obligatoire** pour tout visuel — identité Rive Signature, palette, typographie Italiana, règles d'usage du logo (détail : `../../../design-system/README.md`).
- **Pas de vitrine de biens en ligne** — seulement 2-3 biens actifs, risque de décrédibilisation ; remplacée par CAP-3.
- **Conformité RGPD.** Toute capture de données personnelles (CAP-5, CAP-6, CAP-8, CAP-9) exige : base légale identifiée, mentions légales, politique de confidentialité, opt-in distinct pour la newsletter, lien de désabonnement dans chaque email, et une localisation des données documentée.
- **Stockage de référence des leads côté site.** Chaque lead capté est persisté côté site, indépendamment de toute synchronisation CRM. Une notification email à Anne ne constitue pas un stockage.
- **CRM Modelo** fourni voire imposé par eXp France — la solution doit pouvoir alimenter Modelo à terme (export ou intégration) sans redéveloppement du parcours de capture. Intégration non évaluée à ce stade (détail : `contexte-existant.md`).
- **Performance, mobile et SEO local.** Le site est conçu mobile-first ; la homepage se charge utilement en moins de 3 secondes sur connexion mobile malgré les visuels lourds (vidéo différée, images adaptatives) ; le référencement local cible le Chablais et le bassin lémanique.
- **Production de contenu par Anne.** CAP-1, CAP-2, CAP-3 et CAP-8 dépendent d'actifs qu'Anne doit produire ou collecter : séquences drone, photographies, témoignages d'acheteurs, récits de ventes, guide PDF rebrandé. Cette production est sur le chemin critique du lancement, au même titre que le développement.

## Non-goals

- Galerie ou vitrine de biens en ligne.
- Estimation de la valeur d'un bien sur le site — c'est le chantier Estimateur, séparé. Le « diagnostic » porte sur la préparation du vendeur, jamais sur un prix.
- Implémentation de l'intégration CRM Modelo (faisabilité non évaluée).
- Choix final d'outil et arbitrage interne-vs-prestataire (différé à l'étape ④ architecture).

## Assumptions

- Le **contenu** du quiz (questions, options, barème, seuils, feedbacks, textes d'orientation) est réutilisé via `quiz-conception-notion.md` ; l'**outil** ScoreApp ne l'est pas. Ce contenu est complet : aucune mécanique n'est à rétro-ingénierer.
- Les chiffres publics repris de la conception (statistique PAP.fr des 9 vendeurs sur 10, « taux de concrétisation supérieur de 30 % à la moyenne ») sont republiés tels quels ; ils ne sont pas sourcés dans le document d'origine et doivent être revalidés avant mise en ligne.
- Les seuils quantitatifs de CAP-1, CAP-2, CAP-3 (1 vidéo, 6 photos, 3 témoignages, 3 stories) et de la section Success signal sont **posés par défaut** pour rendre les critères testables. Ils sont à confirmer par Anne ; les revoir ne remet pas en cause les capacités.
- Les cibles marketing du projet (primo-accédants, investisseurs, cadres sup, seniors 60+) s'appliquent aux 3 axes, faute de segmentation alternative dans les sources.
- Les avis Immodvisor sont exploitables hors de leur plateforme (extraction ou widget) ; à défaut, CAP-2 se réduit à un lien sortant vers la fiche.

## Open Questions

- **Interne (Claude Design + Framer) vs prestataire (7-10 k€)** — arbitrage définitif à l'étape ④, avec spec + maquette + architecture en main ; informé par la faisabilité confirmée de la recréation native du diagnostic (le signal penche interne).
- **Langues livrées en v1** — FR seul, FR+EN, ou les quatre (FR/EN/ES/PT) ? La décision porte sur le volume de traduction, pas sur l'architecture : CAP-10 impose le multilingue par conception quoi qu'il arrive.
- **Barème de la Performance commerciale (Q10)** — la conception Notion note Q10 sur 10 points via 5 options combinées (« moins de 5 visites, plusieurs offres »…), alors que le déployé pose deux questions séparées : nombre de visites (4 options) puis nombre d'offres (3 options), soit 12 combinaisons. Le croisement n'est documenté nulle part. **À trancher avant le build** : reconstruire une matrice visites × offres, ou revenir à une question unique combinée. Sans décision, la question unique combinée de la conception s'applique.
- **Remontée des leads dans Modelo** — priorité basse (JB 2026-08-29) : une solution simple (notification email, export) suffit probablement en v1, à condition que la Constraint de stockage côté site soit respectée.

### Différés — non bloquants pour la maquette et l'architecture

- Où et comment présenter le formulaire de contact direct dans le parcours ? (renvoyé à la phase design)
- Quel nom pour la méthode — « Système 360™ » (ScoreApp) ou « Méthode 360° » (Gamma) ?
- Quel positionnement marketing — Système/Méthode 360 ou « Expert Frontaliers » ?
- Le concept « stories de biens vendus » est-il validé par Anne elle-même ? (décision JB solo à ce stade)
