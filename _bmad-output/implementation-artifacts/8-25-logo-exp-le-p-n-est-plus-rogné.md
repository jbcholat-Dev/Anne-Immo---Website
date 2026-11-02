---
story: 8.25
epic: 8 — Structure et visuel
statut: review
date: 2026-11-02
---

# Story 8.25 — Logo eXp : le « p » n'est plus rogné

## Objectif
Retour de JB du 2026-11-02 (commentaire sur la page de la campagne de parrainage) : « Le P de EXP est coupé. Je croyais qu'on avait déjà résolu ce problème, donc va voir s'il y a un problème dans le design system. » Corriger à la source, partout où le logo eXp est utilisé.

## Cause
Dans tous les fichiers du logo eXp du design system, le dessin touche exactement le bord de son cadre (mesuré au navigateur avec `getBBox`) : le bas du jambage du « p » est sur la dernière ligne du cadre. Quand la hauteur affichée est arrondie (par exemple 488 × 144 / 1206 = 58,3 px, arrondi à 58 px), le navigateur coupe ce qui dépasse et le pied du « p » disparaît.

## Ce qui est fait
- 3 unités de marge en haut et en bas du cadre (`viewBox`) de chaque fichier eXp :
  - `eXp_Logo_Black.svg`, `eXp_Logo_White.svg` : `0 0 277.4 144` → `0 -3 277.4 150` ;
  - `lockup-exp-horizontal.svg`, `lockup-exp-horizontal-negatif.svg` : `0 0 1206 144` → `0 -3 1206 150` ;
  - `lockup-exp-horizontal-sans-ligne.svg` : `0 0 998 144` → `0 -3 998 150` ;
  - `lockup-exp-centre.svg` : `0 0 652 413` → `0 -3 652 419`.
- `brand/co-branding-exp.html` : mêmes cadres pour le symbole eXp et les trois logos combinés.
- Site : `site/src/components/Lockup.astro` reconnaît le nouveau cadre et calcule la hauteur sur 150 (arrondie au pixel supérieur). Pied de page 61 px, mentions légales 53 px, diagnostic 44 px de haut.
- `design-system/README.md` : la règle est écrite (ne jamais remettre le cadre au ras du dessin).
- La page de la campagne de parrainage avait déjà été corrigée par son fil le même jour.
- Rien d'autre à corriger : l'espace d'Anne, les e-mails et `site/public/` n'ont pas de copie du logo eXp. Les maquettes restent telles quelles (référence figée).

## Ce qui est vérifié (2026-11-02)
- `npm run build` : OK. `npm run check` : 0 erreur, 0 avertissement.
- Captures du logo combiné dans le pied de page, les mentions légales et le diagnostic, sur ordinateur et téléphone : le « p » est entier.

## Revue de code
2026-11-02, PR n° 228, commit 7d87a4a, `bmad-code-review` dans une session neuve : aucun constat bloquant (regex, trois appels, arrondi, positions du co-branding, autres copies du logo vérifiés).
- Mineur : si le cadre d'un SVG change encore, la réécriture de `Lockup.astro` échoue sans rien dire → corrigé (commit suivant) : la construction s'arrête avec une erreur si le logo n'a pas été reconnu.

## Ce qui reste
- Accord de JB pour fusionner (la PR change le site).
- Recopier les mêmes cadres dans l'artefact Design System.
