---
story: 7.20
epic: 7 — Contenu d'Anne
statut: review
date: 2026-10-09
---

# Story 7.20 — Textes des pages dans l'espace d'édition

## Objectif
Question de JB du 2026-10-09 : dans l'espace d'édition (Sveltia CMS, `/admin`), la rubrique « Pages » ne contient que « À propos » ; les textes des autres pages ne sont pas modifiables par Anne. Carte de décision du même jour : JB a choisi « Les 4 pages » (Accueil, Vendre, Acheter, Contact).

## Ce qui est fait
- Nouvelle rubrique **« Textes des pages »** dans `site/public/admin/config.yml`, avec une fiche par page, découpée par bloc (ex. Accueil › Ouverture, Ma méthode, Diagnostic, Anne, Parler à Anne). Chaque champ correspond à un endroit précis de la page. Les champs « (téléphone) » sont la version courte affichée sur téléphone ; vides, le téléphone affiche le texte complet.
- Les textes actuels sont rangés tels quels dans `contenu-anne/textes/{accueil,vendre,acheter,contact}.yml`.
- Le site les lit : quatre collections dans `site/src/content.config.ts` (un texte obligatoire vide fait échouer la construction, visible sur l'aperçu de la demande de fusion avant la mise en ligne), aide `site/src/lib/textes.ts`, pages `vendre`, `acheter`, `contact`, et composants de l'accueil (`dicoAccueil`).
- Hors périmètre, assumé : la mise en page (Anne change les mots, pas la structure), les libellés des formulaires, la navigation, les marqueurs de maquette, les avis, et l'anglais (resté dans `en.json`, epic 6). La rubrique « Pages » (À propos) n'est pas modifiée.
- Constaté en passant, non traité ici : la rubrique « Coordonnées » (`contenu-anne/legal/identite.md`) n'est pas encore lue par le site, qui garde ses valeurs dans `site/src/config/site.ts` (story 7.6, en cours).

## Vérification
- Construction de `main` avant le changement comparée à celle de la branche : texte des pages Accueil (FR et EN), Vendre, Acheter, Contact identique (seuls diffèrent les identifiants tirés au hasard des champs de formulaire et l'écriture `&#39;` de l'apostrophe).
- Essai de modification dans les fichiers : titre d'Acheter changé → visible dans le titre de la page et l'onglet ; version téléphone vidée → le texte complet s'affiche ; titre du diagnostic changé → visible sur l'accueil français, pas sur l'anglais ; description vidée → la construction échoue avec un message clair.
- Espace d'édition chargé localement (Sveltia 0.229.0, mode « dépôt local » simulé) : la rubrique et ses quatre fiches s'ouvrent avec les textes actuels ; un enregistrement (titre changé, version téléphone vidée) produit un fichier que le site construit sans erreur.
- `npm run build` : OK ; `npm run check` : 0 erreur ; `scripts/liens.mjs` : 26 pages, 1661 liens, 0 cassé ; `scripts/ecrans.mjs` : aucun signalement ; `npm run verif` : aucune erreur console.

## Ce qui reste
- JB : fusionner la demande de fusion.
- Anne ou JB : ouvrir `/admin` › « Textes des pages », changer un mot, enregistrer, et vérifier sur l'aperçu de la demande de fusion (premier essai réel avec la connexion GitHub).
