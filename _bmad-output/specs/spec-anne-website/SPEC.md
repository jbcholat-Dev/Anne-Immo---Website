---
id: SPEC-anne-website
companions: [contexte-existant.md, ../../../design-system/README.md]
sources: []
---

> **Contrat canonique.** Ce SPEC et les fichiers listés dans `companions:` forment le contrat complet — quoi construire, tester, valider. Les autres documents du projet (CLAUDE.md, Notion) restent des références narratives, pas des sources de contrat.

# Site web Anne Vial-Tissot — vitrine de crédibilité et génération de leads

## Why

Anne Vial-Tissot est mandataire indépendante chez eXp France, un modèle que les agences traditionnelles attaquent sur le terrain de la légitimité. Le site doit installer sa crédibilité professionnelle (preuve sociale, visuels premium) et ouvrir un canal d'acquisition de leads qualifiés, indépendant de son faible volume de biens en portefeuille (2-3 actifs ; 5-6 ventes/an suffisent à son modèle économique).

## Capabilities

- **CAP-1**
  - **intent:** Le visiteur voit des visuels professionnels (vidéos drone, photos) d'Anne dès la homepage, pas de banque d'images.
  - **success:** La homepage intègre des visuels réels (drone/photo) reflétant le travail d'Anne.
- **CAP-2**
  - **intent:** Le visiteur voit une validation tierce crédible — avis Immodvisor et témoignages d'acheteurs non convertis.
  - **success:** Les avis Immodvisor sont affichés ou liés, et des témoignages d'acheteurs non-clients sont collectés et publiés.
- **CAP-3**
  - **intent:** Le visiteur voit une preuve concrète de ventes réussies sans galerie de biens en ligne.
  - **success:** Chaque story combine photo du bien, récit par Anne et témoignage de l'acheteur — remplace la vitrine de biens.
- **CAP-4**
  - **intent:** Un prospect s'auto-évalue via un questionnaire d'environ 15 questions et reçoit un diagnostic personnalisé.
  - **success:** Le quiz couvre les 3 catégories existantes (Préparation à la Vente, Visibilité & Attractivité, Efficacité Commerciale) et produit des résultats dynamiques par bande de score, comme le ScoreApp actuel (détail : `contexte-existant.md`).
- **CAP-5**
  - **intent:** Un bouton dédié mène le prospect vers le questionnaire de diagnostic.
  - **success:** Le CTA diagnostic est visible et mène au quiz, avec gate de capture (prénom, nom, email, téléphone + opt-in) avant les résultats complets.
- **CAP-6**
  - **intent:** Un prospect déjà prêt à échanger peut laisser ses coordonnées sans passer par le diagnostic.
  - **success:** Un chemin de contact direct existe indépendamment du scorecard.
- **CAP-7**
  - **intent:** Après le diagnostic, le prospect est orienté vers un contact direct ou une séquence de newsletters s'il n'est pas prêt.
  - **success:** La page de résultats présente clairement les deux options d'activation — contact direct privilégié, sinon newsletter hebdomadaire reprenant le contenu du guide PDF.

## Constraints

- CRM Modelo fourni voire imposé par eXp France — toute solution de capture de leads doit composer avec (ou alimenter) Modelo ; intégration non évaluée à ce stade (détail : `contexte-existant.md`).
- Pas de vitrine de biens en ligne — seulement 2-3 biens actifs, risque de décrédibilisation ; remplacée par CAP-3.
- Devis prestataires reçus (7-10 k€) — la réalisation interne (Claude Design + Framer) doit être poussée au maximum avant tout arbitrage prestataire.
- Clientèle internationale du Léman — Anne travaille en FR/EN/ES/PT ; le site doit pouvoir adresser cette audience (périmètre de traduction non tranché).
- Charte graphique v1 (identité Rive Signature, livrée et validée 2026-08-28) obligatoire pour tout visuel — palette, typographie Italiana, règles d'usage du logo (détail : `../../../design-system/README.md`).

## Non-goals

- Galerie ou vitrine de biens en ligne.
- Décision garder-vs-recréer l'outil ScoreApp (ce spec ne tranche pas — voir Open Questions).
- Implémentation de l'intégration CRM Modelo (faisabilité non évaluée).
- Choix final d'outil ou arbitrage interne-vs-prestataire (différé à l'étape ④ architecture).

## Success signal

Le site est en ligne, les 3 axes (visuels, preuve sociale, scorecard) et les 2 parcours (diagnostic, contact direct) sont opérationnels, il capte des leads qualifiés activables (contact direct ou newsletter), et Anne peut opposer aux agences traditionnelles une preuve concrète de professionnalisme — avis, stories, visuels — plutôt qu'un volume de biens.

## Assumptions

- Le quiz ScoreApp existant (15 questions, 3 catégories, segmentation 3 niveaux, testé live le 2026-08-28) est réutilisé comme base fonctionnelle de CAP-4 — la note Notion du 2026-08-29 le décrit comme déjà prêt.
- Les cibles marketing du projet (primo-accédants, investisseurs, cadres sup, seniors 60+) s'appliquent aux 3 axes, faute de segmentation alternative dans les sources du 2026-08-29.

## Open Questions

- Faisabilité de l'intégration ScoreApp × CRM Modelo (collecte des réponses, résultats dynamiques, écriture des leads) — risque identifié le 2026-08-17, non évalué.
- ScoreApp : garder l'outil existant (avec ses CTA/branding à corriger) ou recréer le diagnostic ailleurs ?
- Interne (Claude Design + Framer) vs prestataire (7-10 k€) — arbitrage définitif à l'étape ④, avec spec + maquette + architecture en main.
- Où et comment présenter le formulaire de contact direct dans le parcours ? (renvoyé à la phase design)
- Quel nom pour la méthode — « Système 360™ » (ScoreApp) ou « Méthode 360° » (Gamma) ?
- Quel positionnement marketing — Système/Méthode 360 ou « Expert Frontaliers » ?
- Le concept « stories de biens vendus » (remplacement de la vitrine) est-il validé par Anne elle-même ? (décision JB solo à ce stade)
