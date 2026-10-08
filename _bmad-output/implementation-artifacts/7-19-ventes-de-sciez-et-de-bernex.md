---
story: 7.19
epic: 7 — Contenu d'Anne
statut: in-progress
date: 2026-10-08
---

# Story 7.19 — Ventes de Sciez et de Bernex

## Objectif
Retour d'Anne du 2026-10-08, transmis par le fil « Retours d'Anne » : ajouter les ventes de Sciez et de Bernex sur la page Réalisation. Les vidéos existent, aucun récit n'est écrit.

## Ce qui est fait
- Fiches créées en « brouillon » (visibles sur l'aperçu, absentes du site public) : `contenu-anne/stories/sciez-villa-2025/fr.md` (villa, Sciez-sur-Léman, 2025 ; photos de mars 2025) et `bernex-chalet-2024/fr.md` (chalet, Bernex, 2024 ; photos de juin 2024). Commune, type et année viennent du registre `_suivi-stories.md` § Ventes photographiées.
- Le récit n'est pas inventé : chaque fiche porte quatre questions qu'Anne remplace par son texte dans l'espace d'édition.
- Registre `_suivi-stories.md` mis à jour, epics, statut de sprint ; story 7.18 passée en « done » (PR n° 28 fusionnée le 2026-10-07).
- 2026-10-08 (fil « Retours d'Anne », demande de JB) : récit de Bernex écrit par Anne dans le Drive (`Contenu site Anne/stories/bernex-chalet-2024/fr.md`, 09:00) repris tel quel dans la fiche, avec le délai (2 semaines) et la particularité. Les anciens champs du gabarit (témoignages, autorisations) ne sont pas repris : depuis la story 7.14, le témoignage d'une vente est son avis Immodvisor relié. La fiche reste en « brouillon » et s'édite dans l'espace d'édition (Ventes → Bernex).
- Fichiers de la page Réalisation et de l'accueil non touchés (le fil « Retours d'Anne » les modifie).

## Vérification
- `npm run build` : pages `realisation/sciez-villa-2025` et `realisation/bernex-chalet-2024` produites ; les deux cartes figurent sur la page Réalisation, avec le bloc réservé photo.
- `npm run check` : 0 erreur ; `scripts/liens.mjs` : 26 pages, 1597 liens, 0 cassé.

## Ce qui reste
- Photos : les photos HD sont sur le Drive (`SCIEZ_BURNET_Villa`, 18 ; `BERNEX_HIGOUNENC_chalet`, 12), privées et de plus de 8 Mo, donc illisibles par Claude. Soit Anne les ajoute dans l'espace d'édition, soit JB partage les deux dossiers par lien et Claude fait la sélection.
- Récit de Sciez (4 questions dans la fiche). Bernex : fait.
- Bernex : la photo principale choisie par Anne est la n° 013 (« Bernex Chalet (EXP Immo) - 013 - HD.jpg », 20 Mo) ; trop lourde pour le connecteur Drive (limite 10 Mo, toutes les photos de Bernex font 9 à 20 Mo). Anne l'ajoute dans l'espace d'édition (champ « Photo principale »), le navigateur la réduit.
- Témoignage : l'avis « IsalineP » (« Achat maison Sciez ») est probablement celui de la vente de Sciez ; Anne confirme en remplissant « Vente concernée » dans la fiche de l'avis.
- Vidéos : la fiche d'une vente n'affiche pas de vidéo aujourd'hui ; à décider avec JB si on en veut une.
- Passage en « publie » quand tout est réuni.
