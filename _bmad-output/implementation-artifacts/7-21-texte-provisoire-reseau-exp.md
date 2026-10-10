---
story: 7.21
epic: 7 — Contenu d'Anne
statut: done
date: 2026-10-10
---

# Story 7.21 — Texte provisoire de la section « Réseau eXp »

## Objectif
Demande de JB du 2026-10-10 : en attendant le texte d'Anne, remplacer la consigne « À écrire par Anne… » de la section « Réseau eXp » (page À propos) par un texte provisoire qui décrit eXp.

## Ce qui est fait
- `contenu-anne/pages/a-propos/fr.md`, section « # Réseau eXp » : texte à la première personne (voix d'Anne), trois points : ouverture internationale (recommandations entre conseillers d'un pays à l'autre), outils et appui juridique, entraide. Un commentaire invisible signale que le texte est provisoire.
- Règle suivie : aucun chiffre ni promesse. Seuls des faits publics recoupés sont utilisés : eXp France, filiale française d'eXp Realty (réseau né aux États-Unis, présent dans plusieurs dizaines de pays), créée fin 2020 ; conseillers indépendants ; plateforme de recommandations internationales, réunions hebdomadaires, service juridique (entretien de Samuel Caux, président d'eXp France, MySweetImmo, avril 2023) ; Business Wire, décembre 2021.
- Anne peut remplacer ce texte elle-même dans l'espace d'édition (`/admin` › Pages › À propos).

## Mise à jour du 2026-10-10 au soir
Anne a entre-temps écrit son propre texte dans l'espace d'édition (fusionné dans `main`). Décision de JB : garder le texte d'Anne tel quel et ajouter dessous la partie « Ce que cela change pour vous » (les trois points). Le premier paragraphe provisoire est retiré. Les chiffres du réseau cités par Anne sont les siens, non vérifiés par Claude.

## Vérification
- `npm run build` : OK ; `npm run check` : 0 erreur ; `scripts/liens.mjs` : 26 pages, 1661 liens, 0 cassé.
- Page construite `a-propos.html` : la section affiche le texte, l'intertitre « Ce que cela change pour vous » et les trois paragraphes en gras d'attaque. Pas de capture : seul le texte change, la mise en page de la section est inchangée.

## Ce qui reste
- ~~JB : relire et fusionner la demande de fusion.~~ Fait : PR n° 97 fusionnée le 2026-10-10.
- Anne : relire les trois points ajoutés sous son texte (modifiables dans l'espace d'édition).
