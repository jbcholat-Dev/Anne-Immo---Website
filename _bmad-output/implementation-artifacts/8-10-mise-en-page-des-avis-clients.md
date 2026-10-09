---
story: 8.10
epic: 8 — Structure et visuel
statut: done
date: 2026-10-09
ticket: 68
---

# Story 8.10 — Mise en page des avis clients

## Objectif
Ticket n° 68 de JB (2026-10-09, page `/realisation/essert-romand-chalet-2026`) : « la mise en page des avis clients n'est vraiment pas très bonne […] un énorme bloc très resserré […] qui ne s'adapte pas du tout au reste de la mise en page. […] proposer différentes options. Sur les pages réalisations, mais je crois aussi sur la page principale. »

## Constat
- Page de vente : l'avis entier était écrit en caractère de titre (32 px). L'avis d'Essert-Romand faisait un pavé d'environ 1 800 px de haut.
- Accueil : trois colonnes de largeurs et de hauteurs très différentes (1,5 / 1 / 1).

## Options proposées (carte de décision du 2026-10-09)
- A : avis entier en carte, taille de lecture, replié sur l'accueil.
- **B (recommandée, construite)** : même carte, avec en tête une phrase de l'avis en grand, recopiée mot pour mot ; l'avis entier dessous, replié.
- C : extrait seul et lien vers Immodvisor (contraire à D-9, avis entiers).
Captures : `/mnt/project-files/tickets/68/` (dossier partagé du projet).

## Ce qui est fait
- Composant `site/src/components/AvisCarte.astro`, utilisé par les pages de vente, l'accueil (FR et EN) et Acheter. Accueil : trois cartes de même largeur.
- Champ `phrase` des avis (schéma `content.config.ts`, espace d'édition « Phrase mise en avant ») ; `phraseDeAvis()` ne l'affiche que s'il figure mot pour mot dans l'avis (espaces et apostrophes près).
- Phrases pré-remplies, recopiées telles quelles, pour les six avis affichés : Alexandra V., JcbAnthy, Rémi, RHL, JamesW, Sabine/François. Anne peut les changer.
- « Lire la suite » / « Réduire » : bouton accessible (`aria-expanded`), affiché seulement si l'avis dépasse ; sans JavaScript l'avis est entier.
- Décision D-37 dans `maquettes/lot-3-complet/DECISIONS.md` ; `site/README.md`.

## Vérification
- Captures avant / après à 1440, 1920 et 390 px (accueil, Essert-Romand, Acheter, version anglaise) ; ouverture et fermeture de « Lire la suite » essayées (`aria-expanded` passe à `true`, libellé « Réduire »).
- Phrase modifiée pour qu'elle ne soit plus mot pour mot : non affichée, avertissement à la construction.
- `npm run build` : OK ; `npm run check` : 0 erreur ; `scripts/liens.mjs` : 26 pages, 1661 liens, 0 cassé ; `scripts/ecrans.mjs` : aucun signalement ; `npm run verif` : aucune erreur console.

## Ce qui reste
- Fait : option B confirmée par JB (2026-10-09, 11 h 24), PR n° 69 fusionnée, ticket n° 68 fermé en citant le commit cc68370.
