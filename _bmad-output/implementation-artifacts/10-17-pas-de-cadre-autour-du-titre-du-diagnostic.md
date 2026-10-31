---
story: 10.17
epic: 10 — Capture des leads et backend
statut: done
date: 2026-10-31
---

# Story 10.17 — Pas de cadre autour du titre des écrans du diagnostic

## Objectif
Le 31 octobre 2026, JB envoie une capture : « quand on clique et qu'on arrive sur cette page, il y a un cadre autour de à qui envoyer le rapport ». À chaque nouvel écran, la page pose le focus sur le titre, pour que les lecteurs d'écran (logiciels qui lisent la page à voix haute aux malvoyants) annoncent l'écran. Ce focus déclenchait le cadre bleu prévu pour la navigation au clavier (`global.css`, `[tabindex]:focus-visible`). JB a autorisé la fusion une fois la revue faite et la construction au vert.

## Ce qui est fait
- `site/src/pages/diagnostic/questions.astro` : le titre d'un écran du diagnostic (`[data-ecran] h1[tabindex="-1"]`) n'a plus de cadre quand il reçoit le focus, y compris en `:focus-visible`. Ce titre n'est pas cliquable : le cadre ne servait à rien au visiteur. L'ancienne règle `.qz-question:focus` est remplacée.
- Les lecteurs d'écran annoncent toujours le nouvel écran (le focus est gardé). Les champs, boutons et liens gardent leur cadre au clavier.
- `site/scripts/e2e-diagnostic.mjs` : nouveau constat, le titre de l'écran d'entrée a le focus et aucun cadre (parcours A, B, R).

## Vérifié (2026-10-31)
- `npm run build` (avec la clé Turnstile d'essai) : construit.
- `node scripts/e2e-diagnostic.mjs` : tous les constats sont bons, dont « titre de l'écran d'entrée focalisé, sans cadre » pour A, B et R.
- Capture `site/.verif/diag-A-entree-erreurs.png` : titre sans cadre.

- Contre-épreuve : règle retirée, le même constat échoue (« contour : solid » pour A, B et R). Le test détecte donc bien le cadre.

## Revue de code
2026-10-31, `bmad-code-review` dans une session neuve, PR #222, commit 4f7c7b7 relu. La règle l'emporte sur celle de `global.css` (priorité plus forte), ne touche que des titres, aucun champ ni bouton ne perd son cadre ; conforme à l'accessibilité (WCAG 2.4.7 ne vise que ce qu'on atteint au clavier). Deux constats mineurs :
1. Commentaire CSS inexact : l'écran final et la reprise ne reçoivent pas le focus. Corrigé (commit suivant).
2. Le test pourrait passer même sans le correctif. Vérifié par contre-épreuve (ci-dessus) : il échoue sans la règle. Pas de constat ajouté sur les écrans de question : même règle, même sélecteur.

## En ligne (2026-10-31)
PR #222 fusionnée (autorisation de JB, une fois revue et construction au vert). La construction de production a réussi. Sur annevialtissot.fr, la feuille de style de /diagnostic/questions contient la règle sans cadre.
