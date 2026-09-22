# Design system « Anne VIAL-TISSOT » — bundle DesignSync

Bundle prêt à pousser vers un projet **Design System** du compte claude.ai/design (étape ② de la méthode Website). Source de vérité : `Identité Visuelle/Charte/Charte v1 — Anne Vial-Tissot.md`.

## Contenu

| Chemin | Rôle | Carte (`@dsCard`) |
|---|---|---|
| `tokens/tokens.css` | Tokens CSS (couleurs, fontes, radius) + règles clés en commentaire | — |
| `brand/logo.html` | Logos (horizontal + monogramme rendus, pointeurs vers les 6 SVG) | Brand |
| `brand/palette.html` | 7 couleurs + règles d'usage | Colors |
| `brand/typographie.html` | Italiana / DM Sans, hiérarchie, étiquettes | Type |
| `components/boutons.html` | Bouton pilule primaire/hover, secondaire, lien | Components |
| `components/cartes-encarts.html` | Carte galet, encart brume, séparateur horizon | Components |
| `components/hero.html` | Pattern hero du site (titre + signature + CTA + bandeau Klein) | Patterns |
| `assets/*.svg` | Les 6 logos officiels (copies de `Identité Visuelle/Charte/Logos/`) | — |

## Procédure de push (une fois l'autorisation faite)

1. **Prérequis (une fois)** : dans un terminal Claude Code **interactif** sur cette machine, lancer `/design-login` et suivre l'autorisation « design system ». Les sessions suivantes (y compris non-interactives) réutilisent cette autorisation.
2. Demander à Claude : « pousse le design system » → DesignSync `list_projects` → `create_project "Anne VIAL-TISSOT — Design System"` (si absent) → `finalize_plan` (writes = ce dossier) → `write_files`.
3. Dans claude.ai/design : ouvrir le projet, vérifier les cartes, activer **« Published »** pour qu'il devienne le design system par défaut.

⚠️ Si les logos doivent être importés dans un outil sans accès Google Fonts (Canva, Illustrator), utiliser la future version texte-vectorisé (backlog charte § 9).
