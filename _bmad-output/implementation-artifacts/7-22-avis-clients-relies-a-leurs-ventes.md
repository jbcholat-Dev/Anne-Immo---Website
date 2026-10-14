---
story: 7.22
epic: 7 — Contenu d'Anne
statut: done
date: 2026-10-11
---

# Story 7.22 — Avis clients reliés à leurs ventes (correspondance de JB)

## Objectif
JB a envoyé le 2026-10-11 la correspondance entre les clients des avis Immodvisor et les ventes d'Anne, pour que chaque vente racontée affiche les avis de ses clients, sur la page d'accueil (pile des ventes) et sur la page de la vente (« Ce qu'ils en disent »).

## Ce qui est fait
Champ `story` (« Vente concernée » dans l'espace d'édition) rempli dans 13 fiches d'avis (`contenu-anne/avis-immodvisor/`), champ `indice` mis à jour avec la source (noms de famille seulement, jamais publiés) :

| Vente (story) | Avis reliés |
|---|---|
| Anthy T3 (`anthy-t3-2024`) | JcbAnthy (vendeur, déjà relié), Laetitia (acheteuse) |
| Anthy T4 (`anthy-t4-2025`) | fleursd'eau (vendeur), confirmé par JB |
| Thonon (`appartement-cascade-2024`) | Alexandra V. (vendeuse, déjà reliée), Rémi (acheteur) |
| Armoy (`auberge-decoupee-2024`) | RHL achat (déjà relié), Erwan B, Vérojo (acheteurs) |
| Bernex (`bernex-chalet-2024`) | Albert (vendeur) |
| Essert-Romand (`essert-romand-chalet-2026`) | Sabine/François (déjà reliée) |
| Morzine (`morzine-appartement-2026`) | Sergio (vendeur), JamesW (acheteur) |
| Sciez (`sciez-villa-2025`, brouillon) | IsalineP (acheteuse) — visible quand la vente sera publiée |

- Pseudonymes absents de la capture : fleursd'eau = LOIEZ et Bonjour = PEILLEX, confirmés par JB le 2026-10-11. À sa demande, l'avis Bonjour n'est pas relié à la vente d'Armoy (champ `story` vide).
- Aucun code modifié : le site lit déjà le champ `story` (`avisDeStory`, story 7.14).
- Documents : `contenu-anne/stories/_suivi-stories.md` (registre), `site/README.md`.

## Vérification
- `npm run build` : terminé sans erreur (aperçu et construction publique `PUBLIC_INDEXATION=oui`).
- `npm run check` : 0 erreur, 0 avertissement.
- `node scripts/liens.mjs` : 27 pages, 1759 liens, 0 cassé.
- Pages de vente construites : avis cités sur Anthy T3 (2), Anthy T4 (1), Thonon (2), Armoy (3), Bernex (1), Essert-Romand (1), Morzine (2), Sciez (1, aperçu seulement) ; Évian et Allinges : aucun.
- Accueil, construction publique : citation courte sur Essert-Romand, Morzine, Anthy T4, Anthy T3 ; Évian et Allinges sans citation (aucun avis).
- Captures `npm run verif` des pages Armoy et Morzine (ordinateur et téléphone) : aucune erreur console, avis empilés vendeur d'abord.

## Ce qui reste
- Évian et Allinges : aucun avis Immodvisor connu.
- Avis sans vente : Bonjour (choix de JB), RHL vendeur, Cat D, EC Cremer, RaphaelD.

Fusionnée dans main le 2026-10-11 avec l'accord de JB (PR n° 130).

## Complément du 2026-10-11 au soir (seconde liste de JB, pseudonyme par pseudonyme)
JB a envoyé la liste par pseudonyme : RaphaelD, Cat D, Bonjour (PEILLEX) et RHL (les deux avis) = Armoy. Ces 4 avis sont reliés à `auberge-decoupee-2024`, qui en compte désormais 7. Le reste de la liste confirme les liaisons déjà fusionnées. Seul EC Cremer n'est relié à aucune vente.
Vérification : `npm run build`, `npm run check` (0 erreur), `scripts/liens.mjs` (0 lien cassé), page Armoy : 7 avis cités.
