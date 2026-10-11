---
story: 16.1
epic: 16 — Espace des acheteurs
statut: in-progress
date: 2026-10-11
origine: idée de JB du 2026-10-11 (fil « Portail vendeurs et espace acheteurs »)
---

# Story 16.1 — Session de cadrage de l'espace acheteurs

## Objectif
Choisir la forme d'un espace premium pour les acheteurs, et ce qu'on a le droit d'y montrer, avant toute construction.

## L'idée de JB (2026-10-11)
Les acheteurs sont un gros segment à développer. Une plateforme où on leur met les photos, les annonces, des liens, structurée pour que ça sente le premium.

## Le point qui bloque
La spec v6 exclut une « galerie ou vitrine de biens en ligne » (non-goals) et la gestion des annonces dans l'espace de travail (CAP-12). Anne n'a que 2 ou 3 biens à la fois : une vitrine publique paraîtrait vide.

## Ce qui est proposé (Claude, à valider par JB)
- **Un espace privé par acheteur**, pas une vitrine publique : Anne y range la sélection qu'elle a faite pour lui (biens de toutes agences, avec le lien vers l'annonce d'origine, ses notes et ses photos de visite en premier) ; l'acheteur marque ce qui l'intéresse et demande une visite. C'est la recherche accompagnée déjà promise par le site (CAP-6) et le parcours acheteur de CAP-12.
- **Accès réservé aux acheteurs sous mandat de recherche**, ce qui donne une raison de le signer.
- **Même application que le portail vendeurs** (story 15.1), avec un autre profil.
- **Photos** : celles qu'Anne prend elle-même, et pour les biens d'autres agences un lien plutôt qu'une copie de leurs photos (droits d'auteur de l'annonce, non vérifié juridiquement).
- Claude peut aider à rédiger la fiche d'un bien et à comparer la sélection au besoin défini ; Anne valide.

## Questions posées à JB (2026-10-11)
1. Espace privé par acheteur, ou vitrine publique des biens ? Recommandation : privé.
2. Réservé aux mandats de recherche signés ? Recommandation : oui.
3. Pour Anne : comment présente-t-elle une sélection aujourd'hui, et quelles règles eXp sur la diffusion des annonces ?

## Ce qui est fait
- Epic 16 et story 16.1 ajoutées à `_bmad-output/planning-artifacts/epics.md` et au statut de sprint ; idée et questions journalisées dans `.memlog.md` de la spec.

## Vérification
Documents seulement, aucun changement du site : pas de construction ni de captures à faire.

## Ce qui reste
- Réponses de JB et d'Anne, puis capacité dans la spec (et réécriture du non-goal si besoin), AD dans le spine, découpage des stories.
