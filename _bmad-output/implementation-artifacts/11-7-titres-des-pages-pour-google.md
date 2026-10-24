# Story 11.7 : Titres des pages pour Google

Epic 11, Visibilité. Points 1, 2 et 4 de l'audit OpenSEO du 2026-10-14 (fil « [Site] Audit SEO OpenSEO »), lancés par JB le 2026-10-24.

## Objectif

Que chaque page ait, dans les résultats Google, un titre unique et parlant et un résumé de bonne longueur, et un seul grand titre (h1).

## Ce qui est fait

- Ventes (`realisation/[slug].astro`) : titre « Vente · {type de bien} à {commune} — Anne VIAL-TISSOT », type raccourci (« Appartement (T3, rez-de-jardin) » → « Appartement T3 »). Les deux ventes d'Anthy ne portent plus le même titre.
- Ventes : le titre « # » du récit d'Anne devient un sous-titre `h2.titre-recit` (même rendu), la commune reste le seul h1. Fait sur le HTML du récit, comme la page À propos le fait pour ses sous-titres : le passage par un module Markdown (`markdown.rehypePlugins`) aurait demandé d'installer `@astrojs/markdown-remark` et de changer le moteur Markdown d'Astro.
- Ventes : résumé sous le lien = la particularité, coupée à un mot près sous 160 caractères.
- Guide : le titre du téléphone devient un paragraphe à l'allure de titre (`role="heading"`), le h1 de l'ordinateur reste seul.
- Titres raccourcis : accueil FR et EN, guide, diagnostic. Résumé du diagnostic raccourci (179 → 143 caractères), résumé de la page anglaise des ventes allongé (61 → 118).

## Vérifié

- Construction en mode production locale : un seul h1 sur toutes les pages relevées par l'audit ; titres des 9 ventes tous différents (46 à 78 caractères) ; résumés à 160 caractères au plus (un ou deux de plus à cause des apostrophes encodées).
- Captures avant (production) et après (local) d'une vente et du guide, ordinateur 1440 px et téléphone 390 px : pixels identiques.
- `npm run check` : 0 erreur. `node scripts/liens.mjs` : 0 lien cassé.
- PR n° 195 fusionnée dans main par Claude à la demande de JB le 2026-10-24 (commit ecfb02f), constructions Cloudflare au vert : en ligne.

## Ce qui reste

- Point 3 de l'audit (mots recherchés : « agent immobilier », Thonon, Évian) : à traiter avec le choix des mots-clés de la publicité Google.
- Relancer un audit OpenSEO après la mise en ligne pour constater.
