# Story 18.14 : colonnes réordonnables et pointeur ordinaire (tickets 233 et 235)

Epic 18 (le carnet de contacts). Statut : review. Date : 2026-11-02.

## Objectif

- **Ticket 233** : dans le menu « Colonnes » de la page Contacts (accueil de l'espace), pouvoir aussi **changer l'ordre** des colonnes, pas seulement les masquer.
- **Ticket 235** : « enlever le logo quand on bouge la souris ».

## Ce qui est fait

- **233** : chaque colonne du menu a deux flèches (▲ monter, ▼ descendre), des boutons donc utilisables au clavier ; le tableau se redessine tout de suite. Le nom reste toujours en première colonne (il ne se masque pas non plus) ; la première flèche « monter » du menu est grisée. L'ordre est gardé exactement comme la visibilité : dans ce navigateur (`localStorage`, clé `espace.contacts.colonnes-ordre`), pas dans les vues enregistrées. Ces vues (table `vue`, `vues-base.ts`) ne gardent que des filtres, jamais de colonnes : rien à changer côté serveur ni base. Une clé inconnue est ignorée, une colonne ajoutée plus tard va en fin de liste. Pas de glisser-déposer (non trivial avec un menu en `<details>`).
- **235** : cause trouvée. Ce n'est ni un filigrane ni une animation : le CSS commun du site (`site/src/styles/global.css`, ticket 105) remplace la main par le rond du logo (`/curseur.svg`) sur tout ce qui se clique, et l'espace charge ce CSS. Retiré pour l'espace seulement : `espace/src/layouts/Espace.astro` remet `cursor: pointer`. Le site public garde son pointeur. Aucun gestionnaire `mousemove` / `pointermove` / `mouseover` n'existe dans `espace/src`.

## Ce qui est vérifié

- `cd espace && npm run build` : réussi. `npm run check` : 0 erreur, 0 avertissement (5 indications).
- Deux constats ajoutés à `espace/scripts/e2e-espace.mjs` (près des essais 18.4) : monter Téléphone le place avant Ville tout de suite, l'ordre survit au rechargement, la première flèche est grisée ; descendre rend l'ordre d'origine. Syntaxe du script vérifiée (`node --check`) ; l'essai complet n'a pas été lancé (consigne).

## Ce qui reste

- JB : constater sur l'aperçu (1920 × 911) puis fermer les tickets 233 et 235.
- Revue de code (story 9.8) dans une session neuve avant fusion : la PR touche `espace/src/`.
- L'ordre est propre à chaque navigateur ; l'enregistrer dans les vues serait une autre décision.
