---
story: 8.24
epic: 8 — Structure et visuel
statut: done
date: 2026-10-27
---

# Story 8.24 — Section « infographies et images » du design system

## Objectif
Demande de JB du 2026-10-27 (fil « [Com] Publication quotidienne Instagram et Facebook ») : intégrer au design system une section sur la génération d'infographies et d'images, inspirée des schémas de Pierre Herubel (« j'aime beaucoup cette manière de fonctionner ») et des essais de capsule vidéo avec la bulle d'Anne. But : que toute publication « schéma » d'Anne se reconnaisse et puisse être refaite par n'importe quel fil sans réinventer la mise en page.

## Ce qui est fait
- `design-system/infographies/README.md` : la règle. Origine du style et ce qu'on adapte ; anatomie d'une image (sur-titre, titre, schéma, cartes, piège, conseil, appel) ; couleurs par rôle avec les teintes pâles dérivées de la palette ; tailles de texte pour le fil 4:5 et le vertical 9:16 ; zones à laisser libres en vertical ; les schémas (flux et échelle en référence, couches et boucle en exemples) et quand les utiliser ; le mouvement des capsules ; la bulle d'Anne (retours de JB du 2026-10-27) ; règles d'écriture (« offert », aucun chiffre sans source) ; fabrication (HTML + Playwright pour l'image, HyperFrames pour la vidéo).
- Six cartes du design system (groupe « Infographies »), autonomes (SVG en ligne, photo d'Anne réduite intégrée, pas de lien vers `assets/`), comme l'exige le design system de claude.ai/design :
  - `schema-flux.html` et `schema-echelle.html` : les versions V2 et V3 du canevas « Schémas capsule prix », reprises telles quelles (le fond du flux passe du blanc à l'écru) ;
  - `exemple-couches.html` (d'après « Knowledge layer » et « The 4 layers of a content brain ») et `exemple-boucle.html` (d'après « Content loop ») : deux nouveaux exemples tirés des trois images de Pierre Herubel, sur le contenu du guide (prix, préparation, diffusion, suivi), sans aucun chiffre ;
  - `capsule-bulle.html` : la fin de la scène schéma d'une capsule en 9:16, avec l'échelle, la bulle d'Anne et les zones qu'Instagram recouvre ;
  - `pieces.html` : les pièces détachées.
- `_ds_manifest.json` : les six cartes ajoutées à la main (le design system ne régénère pas son index, README du dossier).
- `design-system/README.md` : tableau du contenu complété.
- Décision D-49 dans `maquettes/lot-3-complet/DECISIONS.md`.

**Correction du 2026-10-27, 13 h 16** : la première version prenait le schéma « cercle » comme référence, sur une mauvaise lecture du « diagramme B » de JB. JB : le cercle était la version qu'il aimait le moins ; ses choix sont la V2 (flux) et la V3 (échelle). Le cercle est retiré, et deux nouveaux exemples sont tirés des images de Pierre Herubel, à sa demande.

Sources : captures Herubel et note `/mnt/project-files/publication-quotidienne/inspiration/` ; canevas « Schémas capsule prix » (https://claude.ai/artifact/D9KLC5nfNWKgJtQ8pKPani, sources dans `schemas/canevas/project/`) ; capsules `capsule-test-bulle-echelle-v2.mp4` et `capsule-test-bulle-cercle-v3.mp4` (bulle, minutage, zones libres).

## Ce qui est vérifié (2026-10-27)
- Les six cartes ouvertes dans Chromium (Playwright) et regardées en image : rien ne déborde, flèche et libellé « fragile » dégagés de la bulle, zones libres du format vertical respectées. Captures : `/mnt/project-files/captures/infographies/`.
- `_ds_manifest.json` reste un JSON valide.
- `npm run build` du site OK (la section ne touche pas le site).
- Aucun « gratuit » dans la section, hors des phrases qui l'interdisent ; aucun chiffre dans les exemples.

## Écarts assumés
- Teintes pâles des cartes et des anneaux : dérivées de la palette, réservées aux infographies, **pas ajoutées à `tokens/tokens.css`** pour ne rien changer au site, qui copie ce fichier.
- Le canevas V2 (flux) avait un fond blanc ; la règle retient l'écru partout (charte : « jamais de blanc pur en fond »).

## Ce qui reste
- Fusion : accord de JB le 2026-10-27 à 13 h 23 (« c'est bien mieux… tu peux fusionner la PR toi-même ») ; il apprécie aussi la planche des pièces détachées. PR n° 210.
- Envoyer le dossier `design-system/` dans le projet « Anne VIAL-TISSOT — Design System » de claude.ai/design (dernier envoi le 2026-09-22) : fait juste après la fusion, résultat dans le fil.
- Exemples « couches » et « boucle » : JB veut partir sur cette base et itérer ; à décliner en séries avec le fil des publications.
- Le fil des publications met la section à jour quand le style évolue (prochaine étape : déclinaison aux 16 capsules).
