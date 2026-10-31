# Design system « Anne VIAL-TISSOT » — bundle DesignSync

Bundle prêt à pousser vers un projet **Design System** du compte claude.ai/design (étape ② de la méthode Website).

**Copie de référence dans Claude (depuis le 2026-10-27)** : l'artefact « Design System » https://claude.ai/artifact/JtgYdfPuoiMoiH2BAPU1EV (titre « Anne VIAL-TISSOT »), recréé depuis ce dossier, section Infographies comprise, au nouveau format intégré à Claude. C'est lui que les fils Claude lisent. L'ancien projet claude.ai/design ferme le 14/12/2026 : la procédure de push ci-dessous ne sert plus que jusque-là. À chaque changement de ce dossier, réviser aussi l'artefact (même noms de couleurs `avt-*` que `tokens/tokens.css`). Écart assumé : ses aperçus Boutons, Cartes et Hero sont refaits d'après `site/src/styles/global.css` (boutons pleins en `#A34E30`, D-47), alors que les cartes `components/*.html` d'ici montrent encore l'ancien bouton `#C4623E`. Source de vérité : `Identité Visuelle/Charte/Charte v1 — Anne Vial-Tissot.md`.

## Contenu

| Chemin | Rôle | Carte (`@dsCard`) |
|---|---|---|
| `tokens/tokens.css` | Tokens CSS (couleurs, fontes, radius) + règles clés en commentaire | — |
| `brand/logo.html` | Logos : primaire **sans sous-titre**, version avec descripteur + seuil d'usage, monogramme sans texte (SVG inline) | Brand |
| `brand/co-branding-exp.html` | Lockups Anne + eXp aux cotes officielles (SVG inline) + règles | Brand |
| `brand/palette.html` | 7 couleurs + règles d'usage | Colors |
| `brand/typographie.html` | Gilda Display / Jost (charte v3, D-31), hiérarchie, étiquettes | Type |
| `components/boutons.html` | Bouton pilule primaire/hover, secondaire, lien | Components |
| `components/cartes-encarts.html` | Carte galet, encart brume, séparateur horizon | Components |
| `components/hero.html` | Pattern hero du site (titre + signature + CTA + bandeau Klein) | Patterns |
| `infographies/README.md` | **Règle des infographies et images des réseaux** (style « schéma » inspiré de Pierre Herubel, palette d'Anne, formats, schémas flux et échelle, mouvement des capsules, bulle d'Anne, fabrication) — story 8.24, D-49 | — |
| `infographies/schema-flux.html`, `schema-echelle.html` | Les deux schémas de référence au format fil 4:5 (choix de JB du 2026-10-27) | Infographies |
| `infographies/exemple-couches.html`, `exemple-boucle.html` | Deux exemples tirés des images de Pierre Herubel (couches, boucle) | Infographies |
| `infographies/capsule-bulle.html` | Capsule vidéo 9:16 : fin de la scène schéma, bulle d'Anne, zones à laisser libres | Infographies |
| `infographies/pieces.html` | Pièces des infographies : cartes trois tons, pilules, « Le piège », traits, conseil d'Anne, bulle | Infographies |
| `assets/*.svg` | 16 SVG : 6 logos primaires sans sous-titre + 4 `*-descripteur*` + 4 `lockup-exp-*` (copies de `Identité Visuelle/Charte/Logos/`) + 2 logos eXp officiels Black/White | — |

Règle logo (2026-09-22) : **sans sous-titre par défaut** ; la version avec descripteur seulement au-dessus du seuil de lisibilité (charte § 2.3), jamais sur le site.

## Procédure de push (une fois l'autorisation faite)

1. **Prérequis (une fois)** : dans un terminal Claude Code **interactif** sur cette machine, lancer `/design-login` et suivre l'autorisation « design system ». Les sessions suivantes (y compris non-interactives) réutilisent cette autorisation.
2. Demander à Claude : « pousse le design system » → DesignSync `list_projects` → `create_project "Anne VIAL-TISSOT — Design System"` (si absent) → `finalize_plan` (writes = ce dossier) → `write_files`.
3. Dans claude.ai/design : ouvrir le projet, vérifier les cartes, activer **« Published »** pour qu'il devienne le design system par défaut.

⚠️ **Push incrémental (constaté 2026-09-22)** : l'app ne régénère pas l'index des cartes après `write_files` — toute nouvelle carte doit être ajoutée à la main dans `_ds_manifest.json` (copie locale versionnée ici) et le fichier repoussé, sinon elle reste invisible dans le panneau Design System. Les cartes doivent aussi être autonomes (SVG inline, pas de liens relatifs vers `assets/`).

⚠️ Si les logos doivent être importés dans un outil sans accès Google Fonts (Canva, Illustrator), utiliser la future version texte-vectorisé (backlog charte § 9).
