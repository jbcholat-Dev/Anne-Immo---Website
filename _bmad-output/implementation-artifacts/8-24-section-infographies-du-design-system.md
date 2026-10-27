---
story: 8.24
epic: 8 — Structure et visuel
statut: review
date: 2026-10-27
---

# Story 8.24 — Section « infographies et images » du design system

## Objectif
Demande de JB du 2026-10-27 (fil « [Com] Publication quotidienne Instagram et Facebook ») : intégrer au design system une section sur la génération d'infographies et d'images, inspirée des schémas de Pierre Herubel (« j'aime beaucoup cette manière de fonctionner ») et des essais de capsule vidéo avec la bulle d'Anne. But : que toute publication « schéma » d'Anne se reconnaisse et puisse être refaite par n'importe quel fil sans réinventer la mise en page.

## Ce qui est fait
- `design-system/infographies/README.md` : la règle. Origine du style et ce qu'on adapte ; anatomie d'une image (sur-titre, titre, schéma, cartes, piège, conseil, appel) ; couleurs par rôle avec les teintes pâles dérivées de la palette ; tailles de texte pour le fil 4:5 et le vertical 9:16 ; zones à laisser libres en vertical ; les quatre schémas (cercle, flux, échelle, matrice) et quand les utiliser ; le mouvement des capsules ; la bulle d'Anne (retours de JB du 2026-10-27) ; règles d'écriture (« offert », aucun chiffre sans source) ; fabrication (HTML + Playwright pour l'image, HyperFrames pour la vidéo).
- Trois cartes du design system (groupe « Infographies ») : `pieces.html` (pièces détachées), `schema-cercle.html` (gabarit fil de référence), `capsule-bulle.html` (fin de la scène schéma d'une capsule, avec bulle et zones libres). Cartes autonomes (SVG en ligne, pas de lien vers `assets/`), comme l'exige le design system de claude.ai/design.
- `_ds_manifest.json` : les trois cartes ajoutées à la main (le design system ne régénère pas son index, README du dossier).
- `design-system/README.md` : tableau du contenu complété.
- Décision D-49 dans `maquettes/lot-3-complet/DECISIONS.md`.

Sources : captures Herubel et note `/mnt/project-files/publication-quotidienne/inspiration/` ; premier essai `schemas/schema-q01.html` ; canevas « Schémas capsule prix » (https://claude.ai/artifact/D9KLC5nfNWKgJtQ8pKPani) ; capsule `capsule-test-bulle-cercle-v3.mp4` et sa scène `capsules/test-bulle/compositions/cercle.html` (coordonnées et minutage repris tels quels).

## Ce qui est vérifié (2026-10-27)
- Les trois cartes ouvertes dans Chromium (Playwright) et regardées en image : rien ne déborde, traits du schéma raccordés aux cartes, zones libres du format vertical visibles. Captures : `/mnt/project-files/captures/infographies/` (`pieces.png`, `cercle.png`, `bulle.png`).
- `_ds_manifest.json` reste un JSON valide.
- `npm run build` du site OK (la section ne touche pas le site).
- Aucun « gratuit » dans la section, hors des phrases qui l'interdisent.

## Écarts assumés
- Teintes pâles des cartes (`#F3F6FD`, `#FBF8F3`, `#FBEFE8`, bords `#BFCBEA`, `#D9CFBD`, `#E6B9A4`, quartier `#F7E2D8`, anneau `#9C9083`) : dérivées de la palette, réservées aux infographies, **pas ajoutées à `tokens/tokens.css`** pour ne rien changer au site, qui copie ce fichier.
- Le premier essai (`schema-q01`) avait un fond blanc ; la règle retient l'écru, comme la capsule du 2026-10-27 et la charte (« jamais de blanc pur en fond »).

## Ce qui reste
- Accord de JB sur la PR (elle touche `design-system/`, RUNBOOK § 2 bis), puis passer la story en `done`.
- Pousser les nouvelles cartes vers le projet Design System de claude.ai/design (procédure du `design-system/README.md`) quand JB le demande.
- Le fil des publications met la section à jour quand le style évolue (prochaine étape : déclinaison aux 16 capsules).
