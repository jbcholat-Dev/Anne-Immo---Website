# Contexte existant — actifs à réutiliser ou composer avec

## ScoreApp — référence fonctionnelle à répliquer (décision 2026-08-29 : recréation native, pas de conservation en production)

<https://jean-baptiste-rd287tdl.scoreapp.com/> — « Diagnostic 360° », fonctionnel jusqu'aux résultats. Sert désormais de spécification vivante pour CAP-4 : chaque mécanique ci-dessous doit être reproduite nativement dans le site.

- 15 questions / 3 catégories : Préparation à la Vente · Visibilité & Attractivité · Efficacité Commerciale. Branchements conditionnels (10a/b, 11a/b), question ouverte finale. Q14 segmente en 3 niveaux d'offre (Système 360™ premium / forfait estimation+conseils / vente autonome).
- Gate de capture : score en teaser, résultats complets contre prénom + nom + email + téléphone + opt-in, hCaptcha invisible. Résultats : donut + scores par dimension + feedbacks dynamiques par bande + « Impact chiffré ».
- Points forts : scoring dynamique et capture fonctionnels.
- ⚠️ « Impact chiffré » (valeur affichée dans les résultats) : formule boîte noire, jamais vue que côté sortie. Avant de coder CAP-4, soit la déduire en testant plusieurs profils de réponses sur le ScoreApp actuel, soit assumer une formule équivalente propre (plus simple, on possède déjà le contenu).
- Points faibles à corriger si conservé : CTA finaux en placeholders anglais non configurés, boutons Télécharger/Réserver inertes (aucun booking branché), chaînes EN non localisées, couleurs par défaut (identité antérieure à la charte v1), lock-in template.
- Entrée test « Test Claude-Test » (0600000000, marquée TEST) à supprimer du dashboard avant mise en production.

## Contenus Gamma disponibles (nov. 2025, style à rebrander)

1. « Les 10 Erreurs Fatales des Vendeurs Particuliers » — lead magnet complet (10 erreurs, cas réels Chablais, conclusion DIY vs accompagnement). Gamma `g_vxacdzdmmhogj96`.
2. « Méthode 360° : L'Excellence Immobilière… » — la méthode en 6 étapes. Deux doublons Gamma `g_9x5vj6sfh2oqhsj` (modifié 2025-11-14) et `g_n0fjhar7qgtbbxy` — identifier lequel alimente le site publié avant toute retouche.
- Limite MCP Gamma : lecture + génération de nouveaux gammas seulement, pas de modification d'un existant — refonte = régénération + rebranchement manuel du domaine (analytics perdus).

## CRM Modelo

Fourni voire imposé par eXp France. Aucune intégration ScoreApp × Modelo connue ou testée à ce jour — risque identifié le 2026-08-17, non évalué (cf. Open Questions dans SPEC.md).
