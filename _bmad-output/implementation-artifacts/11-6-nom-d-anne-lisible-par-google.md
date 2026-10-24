# Story 11.6 : Nom d'Anne lisible par Google

Epic 11, Visibilité. Ouverte le 2026-10-24 : la fiche Google Business d'Anne est créée, mais en cherchant « Anne VIAL-TISSOT », le site passe derrière SeLoger, expluxury.fr et Leboncoin.

## Constat du 2026-10-24

- Recherche « anne vial tissot » sur ordinateur (relevé OpenSEO, Google France) : annevialtissot.fr est 12e, en haut de la deuxième page, derrière Leboncoin, SeLoger, Facebook, Logic-immo, LinkedIn, expluxury.fr, Instagram, Le Figaro Entreprises, YouTube, societe.com et Belles Demeures. Sur téléphone, Google traite la requête comme « Anne Vial » et le site n'est pas dans les 20 premiers.
- Liens vers le site : 4 domaines seulement (OpenSEO). Les pages qui passent devant sont sur des sites très anciens et très liés, et leur titre est exactement le nom d'Anne.
- Le grand titre de l'accueil écrivait « VIAL‑TISSOT » avec un tiret insécable (U+2011), un caractère que Google ne lit pas forcément comme le tiret tapé dans une recherche. Idem pour le titre « Qui suis-je » de la page À propos.

## Ce qui est fait

- `Hero.astro` et `a-propos.astro` : nom écrit avec le tiret ordinaire ; la coupure au tiret reste empêchée par `white-space: nowrap`. Les communes des réalisations gardent `tiret()` (pas de recherche par nom).
- `identite.profils` (`src/config/site.ts`) : pages Facebook, expluxury.fr et SeLoger d'Anne ajoutées à la fiche JSON-LD de l'accueil (`sameAs`), pour que Google relie ces profils au site. Elles ne sont affichées nulle part.

- Nom du site dans les résultats Google (demande de JB du 2026-10-24 : Google affiche « annevialtissot.fr » au-dessus du lien) : bloc JSON-LD `WebSite` sur l'accueil FR et EN (`name` « Anne VIAL-TISSOT », tiré de `identite.nom`) et balise `og:site_name` sur toutes les pages.

## Vérifié

- Construction en mode production locale : accueil et À propos sans U+2011 dans le nom ; `sameAs` liste 7 profils.
- Captures avant (production) et après (local) du grand titre, ordinateur 1440 px et téléphone 390 px : rendu identique.
- Accueil FR et EN : bloc `WebSite` et `og:site_name` « Anne VIAL-TISSOT » présents ; pages intérieures sans bloc `WebSite`.
- `npm run check` : 0 erreur. `node scripts/liens.mjs` : 26 pages, 1801 liens, 0 cassé.

## Ce qui reste

- Hors du code (JB et Anne) : ajouter le lien annevialtissot.fr sur chaque profil qui passe devant (Facebook, LinkedIn, Instagram, YouTube, linktr.ee, SeLoger/Logic-immo, expluxury.fr, Immodvisor). C'est le levier principal.
- Revoir la position dans un mois. Google met à jour le nom du site à son prochain passage sur l'accueil (quelques jours à quelques semaines) ; on peut l'accélérer en redemandant l'indexation de l'accueil dans Search Console après la fusion.
