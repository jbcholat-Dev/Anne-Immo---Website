---
story: 8.2
epic: 8 — Site : finitions
statut: in-progress
date: 2026-10-04
---

# Story 8.2 — Adaptation aux écrans page par page

## Objectif
Chaque page lisible et fidèle à la maquette, du téléphone (390 px) au grand écran (1 440 px), sans débordement ni élément coupé (contrainte mobile-first de la spec).

## Ce qui est fait (première passe, 2026-10-04)
- `site/scripts/ecrans.mjs` : contrôle automatique. Pour les 19 pages (et chaque fiche de vente) à plusieurs largeurs, il signale un défilement horizontal, un élément qui sort de l'écran à droite, et sur téléphone un bouton ou un champ de moins de 44 px de haut.
- Résultat avant correction : **téléphone (390 px) propre** ; quatre pages débordaient aux largeurs intermédiaires d'ordinateur (900 à 1 399 px, sans artboard dans la maquette), parce que leurs colonnes ont des largeurs fixes pensées pour 1 440 px :
  - Guide : formulaire coupé de 900 à 1 280 px (la page faisait jusqu'à 1 362 px de large) ;
  - À propos : texte de « Qui suis-je ? » sorti de 56 px à 900 px ;
  - Fiche de vente (Thonon) : titre et récit sortis de 58 px à 900 px ;
  - Landing du diagnostic : image sortie de 79 px à 900 px.
- Corrections, chacune limitée à une plage de largeur, sans toucher au rendu 1 440 px ni au téléphone :
  - À propos, fiche de vente, landing du diagnostic (900 à 1 199 px) : colonnes proportionnelles, écarts de 48 px, titres à 48 px.
  - Guide (900 à 1 399 px) : trois colonnes resserrées (couverture 280 px, formulaire 400 px), titre à 44 px ; de 900 à 1 099 px, la couverture (encore un bloc réservé A-10) est masquée, le texte et le formulaire restent côte à côte.

## Vérification
- `node scripts/ecrans.mjs` à 390, 900, 1 000, 1 100, 1 199, 1 200, 1 280, 1 360, 1 399 et 1 440 px : aucun signalement.
- Captures à 1 000 px (guide, À propos, diagnostic, fiche de vente) et 1 280 px (guide) relues : rien ne déborde, rien ne se chevauche.
- `npm run build` : 19 pages. `npm run check` : 0 erreur. `node scripts/liens.mjs` : 0 lien cassé.

## Journal des petits défauts visuels
Chaque défaut signalé (bouton « Un retour ? » de l'aperçu, capture envoyée dans le projet) est noté ici, avec sa correction. Un défaut qui demande un vrai choix de design devient une story à part.

| Date | Page, largeur | Défaut | Signalé par | Correction | Vérifié |
|---|---|---|---|---|---|
| 2026-10-08 | `/guide`, confirmation « Le guide est en route », ordinateur | Le lien « Je n'ai rien reçu » est collé au bouton « Ouvrir le guide maintenant ». | JB (capture) | Bouton et lien rangés dans une ligne souple : 24 px d'écart côte à côte, 12 px quand le lien passe dessous (`guide.astro`, `.g-actions`). | Captures du bloc à 1 440, 1 000 et 390 px ; build, check, liens, écrans. |

## Ce qui reste
- **JB** : la liste des défauts vus sur la v1 (page, taille d'écran, ce qui cloche, capture si possible). Le plus simple : le bouton « Un retour ? » de l'aperçu, un retour par défaut.
- **JB** : essai des pages principales sur son téléphone, une fois la PR fusionnée et l'aperçu mis à jour.
- Claude : comparaison page par page avec les artboards 1 440 et 390 de la maquette, puis captures finales (`npm run verif`) jointes ici.
