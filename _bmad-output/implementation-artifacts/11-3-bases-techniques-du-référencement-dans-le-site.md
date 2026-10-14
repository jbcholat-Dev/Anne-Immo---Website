# Story 11.3 : Bases techniques du référencement dans le site

Epic 11, Visibilité. Ouverte le 2026-10-12 : JB constate qu'en cherchant « anne vial tissot » sur Google, le site n'apparaît pas (Instagram, Leboncoin et SeLoger sortent).

## Objectif

Que Google trouve toutes les pages du site, comprenne leur langue et sache qui est Anne (critères d'acceptation : `planning-artifacts/epics.md`, story 11.3).

## Constat du 2026-10-12 sur annevialtissot.fr

- Le site est indexable : `robots.txt` autorise tout, aucune page publique ne porte `noindex`, `www` et `.com` redirigent en 301 vers `annevialtissot.fr`.
- Il n'était public que depuis le 2026-10-11 au soir : Google ne l'a pas encore visité. C'est la cause principale de son absence.
- Il manquait le plan du site (`/sitemap.xml` répondait 404), les liens de langue et la fiche d'Anne en données structurées.

## Ce qui est fait

- `site/integrations/plan-du-site.mjs` : écrit `sitemap.xml` après la construction, depuis les pages construites sans `noindex` (canonique de chaque page, liens de langue recopiés), `/admin` exclu. Choix d'une génération propre au site plutôt que `@astrojs/sitemap`, comme AD-3 le prévoit : elle lit le `noindex` réel de chaque page et n'annonce jamais une traduction absente.
- `robots.txt` de production annonce `Sitemap: https://annevialtissot.fr/sitemap.xml`.
- `Base.astro` : liens `hreflang` (fr, en, x-default → fr) sur les seules pages qui existent dans les deux langues (accueil, réalisations) ; bloc JSON-LD `RealEstateAgent` sur l'accueil FR et EN, tiré de `identite` et `reseaux`.
- `site/README.md` : section « Référencement », point 7 du TODO(backend) clos.

## Vérifié

- Construction en mode production locale (`PUBLIC_INDEXATION=oui npm run build`) : « sitemap.xml : 23 page(s) indexable(s) » (12 pages FR, 2 EN, 9 réalisations), sans 404, questions du diagnostic ni `/admin` ; `robots.txt` annonce le plan ; accueil et réalisations portent leurs liens de langue ; le bloc JSON-LD est lisible.
- Construction en mode aperçu (`npm run build`) : plan vide, `robots.txt` « Disallow: / », aucun lien de langue.
- `npm run check` : 0 erreur. `node scripts/liens.mjs` : 26 pages, 1701 liens, 0 cassé.

- En production, après la fusion de la PR n° 137 par JB (2026-10-12) : `https://annevialtissot.fr/sitemap.xml` répond 200 avec 23 adresses, `robots.txt` l'annonce, l'accueil porte le bloc JSON-LD et ses liens de langue.

## Ce qui reste

Rien dans le code. Story close le 2026-10-12. Hors du code, JB inscrit le site dans Google Search Console, envoie le plan et demande l'indexation de l'accueil (action J39 du tableau de bord).
