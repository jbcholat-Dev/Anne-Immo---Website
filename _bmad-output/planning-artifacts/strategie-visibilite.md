---
status: a-faire
created: 2026-09-26
owner: JB + Claude
story: 11.1 (epic 11, epics.md)
---

# Stratégie de visibilité — à cadrer

> **Ce document n'est pas encore écrit.** C'est une trace pour que la session de cadrage ne soit pas oubliée.
> Demande de JB du 2026-09-26 : « le référencement et ensuite la stratégie de pub, ça va être crucial ; pas maintenant, mais qu'on ne l'oublie pas ».

## Quand

Après l'étape de structuration (epics et stories, tableau de suivi) et **avant le lancement public** (epic 12), parce que le résultat peut changer la liste des pages du site, le contenu à demander à Anne et une partie de l'architecture. L'exécution des actions vient après le lancement ; le cadrage vient avant.

Position dans l'ordre prévu : 9 (aperçu en ligne) → 8 et 7 → **11.1 (cette session)** → 10 (backend) → 12 (lancement).

## Ce que la spec et l'architecture couvrent déjà

- Spec v5, contrainte « Performance, mobile et SEO local » : le référencement local cible le Chablais et le bassin lémanique. Une ligne, pas de stratégie.
- Architecture, AD-13 : les informations d'Anne (nom, téléphone, zone) sont générées depuis une source unique et reproduites à l'identique sur sa fiche Google Business Profile ; les guides vivent sur le domaine ; instantané Immodvisor local.
- Site v1 : titre et description par page, adresse canonique, balises de partage. Manque : plan du site (sitemap), robots.txt, données structurées, hreflang FR/EN (story 11.3).

## Ce que la session devra produire

1. **Recherche** : ce qui fonctionne en 2026 pour un mandataire immobilier local (fiche Google et avis Google, pages par commune, contenu qui répond aux questions des vendeurs, réseaux, publicité locale Google et Meta). Méthode : `bmad-deep-recon`, type « domain » ou « technical ».
2. **Choix** : quels leviers Anne peut tenir dans la durée, dans quel ordre, avec quel budget.
3. **Impacts** : nouvelles pages (par commune, par question), nouveau type de contenu dans l'architecture (AD-1 le permet), version anglaise comme atout pour les acheteurs suisses et étrangers, mesure (AD-11 : sans cookie).
4. **Sorties** : ce document rempli ; amendement de la spec (capacité CAP-12 « Visibilité », story 11.4) ; stories de contenu ajoutées à l'epic 11 ; actions d'Anne (fiche Google, story 11.2, faisable dès maintenant).

## Rappels

- Google met des mois à faire remonter un site : domaine acheté tôt et fiche Google créée tôt sont un avantage, indépendamment du site.
- Les 18 avis Immodvisor comptent pour la crédibilité, pas pour Google : seuls les avis Google pèsent sur la fiche.
- Tout ce qui est dit ici est à confirmer par la recherche de la session.
