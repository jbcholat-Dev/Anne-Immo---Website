---
scope: Revue de fraîcheur — ARCHITECTURE-SPINE.md + .memlog.md (architecture-anne-website-2026-08-29)
lens: chaque décision engagée doit être vérifiée sur le web ou contre la réalité, pas affirmée de mémoire
date_revue: 2026-09-07
---

# Revue de fraîcheur — Architecture spine, vague 1

## Verdict

L'essentiel des affirmations « (version) vérifié web 2026-09-07 » du memlog résiste à une contre-vérification indépendante — versions, tarifs et comportements cités sont exacts au 2026-09-07 — mais un point technique structurant n'a pas été vérifié : le mécanisme même qui doit porter le cron quotidien (AD-12) et la purge (AD-16) n'est pas nativement exposé par `@astrojs/cloudflare` et exige une configuration non-défaut (`workerEntryPoint`) que ni le spine ni le memlog ne mentionnent.

## Findings

### HIGH

**H1 — Cron Triggers : le stack les dit « inclus », mais `@astrojs/cloudflare` ne les expose pas par défaut**
- **Élément visé** : tableau Stack (« Cloudflare Workers, D1, Access, Turnstile, Email Routing, Web Analytics, **Cron Triggers**… inclus »), AD-12 (cron de test quotidien) et AD-16 (purge automatique par cron) — les deux mécanismes reposent sur un handler `scheduled()` qui exécute de la logique applicative Astro (gate → D1 → e-mail ; purge D1).
- **Ce qui est affirmé** : Cron Triggers est listé comme une brique Cloudflare « incluse », au même titre que Turnstile ou Web Analytics — laissant entendre qu'un cron peut directement invoquer le code serveur Astro sans configuration particulière.
- **Ce que j'ai trouvé** : Cron Triggers est bien un mécanisme Cloudflare Workers natif et gratuit (le tarif n'est pas en cause), mais `@astrojs/cloudflare` (dans sa version par défaut, avec `entrypoint: "worker"` implicite) ne fournit pas de point d'entrée `scheduled()` prêt à l'emploi. Le fournir exige de configurer explicitement l'option `workerEntryPoint` de l'adaptateur (ou un Worker custom qui `import`e le handler Astro et ajoute son propre export `scheduled`), une pratique documentée mais non triviale et distincte du chemin par défaut — cf. issue officielle withastro/astro #13838 (« how can i set scheduled function when deploy Cloudflare Workers cron triggers and queues ») encore en discussion active début 2026, et la doc Cloudflare sur le handler `scheduled()`.
- **Correction** : ajouter aux « Hypothèses à vérifier au build » une ligne spécifique : *« `@astrojs/cloudflare` doit être configuré avec `workerEntryPoint` pour exposer un handler `scheduled()` appelant la logique de cron (AD-12, AD-16) — non automatique ; à valider par un cron de test réel avant de compter sur l'auto-surveillance en v1. »* Ce n'est pas bloquant (le mécanisme existe et est documenté) mais c'est une étape de configuration non triviale, absente du texte, qui conditionne directement deux Architecture Decisions.
- **Sources** : [Astro · Cloudflare adapter docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/) · [GitHub issue withastro/astro #13838](https://github.com/withastro/astro/issues/13838) · [Cloudflare Workers — Scheduled Handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)

### MEDIUM

**M1 — La mitigation « Astro MIT + adaptateur interchangeable » du risque de concentration fournisseur est affaiblie par un fait que le memlog cite lui-même sans en tirer la conséquence**
- **Élément visé** : memlog, point 28 (« Risque assumé : concentration fournisseur (hébergement, base, DNS, éditeur d'Astro) — mitigé par Astro MIT + adaptateur interchangeable, contenu dans Git, export de la base, procédure de reprise ») et memlog point 29 (« Astro racheté par Cloudflare le 2026-01-16, reste MIT »).
- **Ce qui est affirmé** : la licence MIT d'Astro et la portabilité de l'adaptateur sont présentées comme une mitigation *indépendante* du risque de dépendance à Cloudflare.
- **Ce que j'ai trouvé** : confirmé — Cloudflare a bien acquis The Astro Technology Company le 16 janvier 2026 (annonce officielle Cloudflare), Astro reste MIT et sous gouvernance ouverte. Mais cela signifie que l'éditeur du framework et l'hébergeur sont désormais la **même entreprise** : la licence MIT protège contre un verrouillage de code, pas contre un alignement de roadmap (ex. l'adaptateur `@astrojs/cloudflare` recevant plus d'attention/d'intégrations propriétaires que les autres adaptateurs). La mitigation reste réelle mais plus faible que ce que la formulation laisse penser — le fait est correctement daté, seule l'implication n'a pas été retirée.
- **Correction** : nuancer la ligne « risque assumé » — la portabilité MIT protège la sortie de code, pas l'indépendance de gouvernance produit ; documenter ce point dans le RUNBOOK (AD-10) comme un facteur de veille annuelle plutôt que comme un risque clos.
- **Sources** : [Cloudflare — annonce officielle du rachat](https://www.cloudflare.com/press/press-releases/2026/cloudflare-acquires-astro-to-accelerate-the-future-of-high-performance-web-development/) · [Roboin — couverture de l'annonce](https://roboin.io/article/en/2026/01/17/cloudflare-acquires-astro-web-framework/)

**M2 — « Pas de bannière de consentement » s'appuie sur une doctrine RGPD générale, pas sur une position CNIL identifiée**
- **Élément visé** : AD-11 et la conséquence visée au memlog point 55 (« pas de bandeau de consentement, seulement une page cookies explicative »), qui repose en partie sur le caractère « strictement nécessaire » de Turnstile.
- **Ce qui est affirmé** : implicitement, que Turnstile (mode invisible) et l'absence de dépôt non essentiel dispensent de bannière — cadre déjà posé comme hypothèse technique à vérifier au build (memlog point 56), mais sans base légale citée.
- **Ce que j'ai trouvé** : aucune prise de position **CNIL** publiée et spécifique à Cloudflare Turnstile n'a été localisée. Ce qui existe : la doctrine générale RGPD/ePrivacy sur les cookies « strictement nécessaires » (exemption de consentement, base d'intérêt légitime pour la sécurité) reprise par des cabinets privés et par Cloudflare lui-même, mais pas un avis ou une recommandation CNIL nommément dédiée à Turnstile. Le raisonnement juridique tient (l'exemption « strictement nécessaire » est un principe CNIL général et bien établi, pas propre à Turnstile), mais l'affirmation ne doit pas être présentée comme validée par la CNIL nommément — seulement comme conforme au cadre général qu'elle applique.
- **Correction** : dans la politique de confidentialité / le RUNBOOK, sourcer l'exemption sur le principe général CNIL des cookies exemptés de consentement, pas sur une validation spécifique de Turnstile ; garder l'instrumentation prévue (memlog 56) pour trancher au build ce que Turnstile dépose réellement.
- **Sources** : [CNIL — exemption de consentement (doctrine générale, via Adobe/CNIL)](https://experienceleague.adobe.com/en/docs/analytics/technotes/privacy/cnil-consent-exemption) · [captcha.eu — analyse GDPR de Turnstile](https://www.captcha.eu/is-cloudflare-turnstile-gdpr-compliant/) · [Cloudflare — politique de confidentialité Turnstile](https://www.cloudflare.com/turnstile-privacy-policy/)

### LOW

**L1 — L'hypothèse Cal.com webhooks (memlog point 36/56) peut être dégradée de « à vérifier » à « probable » sans être close**
- **Élément visé** : memlog, assumption ligne 36 (« Cal.com plan gratuit expose bien les webhooks (BOOKING_CREATED). À vérifier au build »).
- **Ce que j'ai trouvé** : confirmé par la documentation officielle Cal.com — les webhooks (dont l'événement `BOOKING_CREATED`) sont disponibles sur le plan gratuit, sans mention de restriction liée au plan.
- **Correction** : aucune action requise sur l'architecture ; la vérification par test réel avant le build de CAP-9 (déjà prévue) reste la bonne pratique, mais le niveau de risque de cette hypothèse peut être révisé à la baisse.
- **Sources** : [Cal.com — Webhooks (Help)](https://cal.com/help/webhooks) · [Cal.com — Webhooks (Docs)](https://cal.com/docs/developing/guides/automation/webhooks)

**L2 — Aucune vérification indépendante du comportement de `@astrojs/sitemap` 3.7.4 face aux traductions partielles**
- **Élément visé** : tableau Stack, ligne « `@astrojs/sitemap` (remplacé si AD-3 l'exige) » et AD-3 (« les générateurs standard sont remplacés dès qu'ils déclarent une traduction manquante »).
- **Ce que j'ai trouvé** : le spine anticipe déjà correctement le risque (le remplacement est conditionnel et assumé) ; je n'ai pas trouvé — et le temps imparti ne permettait pas de tester — de confirmation que la version 3.7.4 gère mal spécifiquement les traductions partielles. Ce n'est pas une affirmation périmée, c'est une hypothèse déjà bien qualifiée par le spine lui-même.
- **Correction** : aucune, si ce n'est ajouter cette vérification concrète (générer un sitemap avec une story non traduite en EN et constater le comportement réel) à la liste « Hypothèses à vérifier au build ».

## Confirmé sans réserve (contre-vérification indépendante, 2026-09-07)

| Élément | Affirmation du spine/memlog | Vérification indépendante |
| --- | --- | --- |
| Astro | 7.3.1, dernière version | Confirmé sur npm — 7.3.1 est bien la dernière version publiée (Astro 7.3, ~4 sept. 2026) |
| `@astrojs/cloudflare` | 14.3.0 | Confirmé — registry npm ; `peerDependencies.astro = "^7.2.0"`, `peerDependencies.wrangler = "^4.125.0"` : compatibilité Astro 7 explicitement déclarée par le package lui-même |
| wrangler | 4.129.1 | Confirmé — version publiée le 2026-09-07, la plus récente |
| Cloudflare Access | gratuit jusqu'à 50 utilisateurs | Confirmé — palier gratuit 50 utilisateurs authentifiés, au-delà 7 $/utilisateur/mois (annuel) |
| D1 Time Travel | 30 jours sur le plan Paid (7 j sur Free) | Confirmé — toujours actif, sans coût additionnel, restauration à la minute près |
| Cloudflare Web Analytics | sans cookie, exempté de consentement | Confirmé — aucun cookie, aucun fingerprinting, disponible sur tous les plans (y compris gratuit) |
| Cloudflare Workers Paid | 5 $/mois | Confirmé — inclut 10M requêtes + 30M ms CPU |
| D1 plan gratuit | limites 5M lectures/j, 100k écritures/j, 5 Go ; erreurs au-delà depuis le 2026-09-01 | Confirmé — changelog officiel Cloudflare daté du 2026-09-01 |
| Better Stack | plan gratuit : 10 moniteurs, 10 heartbeats, vérifications à 3 min | Confirmé, correspond exactement au chiffre du memlog |
| Cal.com | webhooks (dont `BOOKING_CREATED`) disponibles sur le plan gratuit | Confirmé (voir L1) |
| Astro i18n | routage intégré, `prefixDefaultLocale` configurable (false = pas de préfixe pour la langue par défaut), content collections à schéma | Confirmé — fonctionnalités natives d'Astro, utilisées comme prévu par AD-2/AD-3/AD-10 |
| Rachat d'Astro par Cloudflare | 2026-01-16, licence MIT conservée | Confirmé (voir M1 pour la nuance sur l'implication) |

## Méthode

Recherches web effectuées (WebSearch/WebFetch), 2026-09-07 : Astro i18n/content collections · `@astrojs/cloudflare` compatibilité Astro 7 et Cron/D1 (npm registry + changelog GitHub) · Cloudflare Access tarification · D1 Time Travel · Cloudflare Web Analytics · CNIL/Turnstile · Cal.com webhooks · Better Stack heartbeats · versions npm Astro et wrangler · rachat Cloudflare/Astro · Workers Paid + limites D1 free · mécanisme scheduled handler Astro/Cloudflare (recherche complémentaire déclenchée par un doute sur H1).
