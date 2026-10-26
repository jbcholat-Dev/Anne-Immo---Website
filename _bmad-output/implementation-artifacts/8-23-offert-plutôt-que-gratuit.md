---
story: 8.23
epic: 8 — Structure et visuel
statut: done
date: 2026-10-25
---

# Story 8.23 — « Offert » plutôt que « gratuit »

## Objectif
Décision de JB du 2026-10-25 (fil « [Com] Campagne Instagram pour le diagnostic ») : on écrit toujours « offert », jamais « gratuit », dans tout ce qui parle des services d'Anne. « Offert » fait cadeau d'une professionnelle ; « gratuit » fait produit au rabais. Passer le site et ses contenus en revue.

## Ce qui est fait
- Accueil, encart diagnostic : « Trois minutes, offert. » (`contenu-anne/textes/accueil.yml`, `site/src/content/ui/fr.json`, versions longue et courte). Version anglaise : « Three minutes, complimentary. » et le bouton « Complimentary valuation » (`en.json`), l'équivalent anglais d'« offert ».
- Page du diagnostic : « 3 minutes · offert » sous le bouton, et la description lue par Google se termine par « Offert. » (`site/src/pages/diagnostic/index.astro`).
- E-mail de l'étape 6 de la séquence du guide et rapport PDF du diagnostic : « rendez-vous de 30 minutes, offert et sans engagement » (`contenu-anne/guide/sequence-emails/etape-6/fr.md`, `site/scripts/rapport-gabarit.mjs`, gabarit refait).
- Base publique DVF (le site de l'État qui publie les prix de vente) dans le guide PDF et l'e-mail de l'étape 2 : « en libre accès » au lieu de « gratuit(e) ». Ce n'est pas un service d'Anne, « offert » n'y aurait pas de sens ; le mot « gratuit » disparaît quand même. Guide PDF refait (`scripts/guide-pdf.mjs`).
- Plan de la séquence (`contenu-anne/guide/README.md`) : « audit offert ». Conseil d'outil des gabarits d'Anne : Obsidian « (sans frais) ».
- Charte (`design-system/components/boutons.html`, `hero.html`) : exemples de bouton « Faire le diagnostic offert ».
- Décision D-48 dans `maquettes/lot-3-complet/DECISIONS.md` ; écart avec la maquette noté dans `site/README.md`.

## Ce qui n'est pas changé, et pourquoi
- **Mentions légales** : « vous pouvez saisir gratuitement le médiateur de la consommation » reste. C'est la formule de la loi (Code de la consommation, article L612-1 : « Tout consommateur a le droit de recourir gratuitement à un médiateur de la consommation ») ; le médiateur n'est pas offert par Anne, et changer le mot affaiblirait la mention obligatoire.
- **Maquettes** (`maquettes/`) : archives de conception, laissées telles quelles ; l'écart est noté.
- **Documents internes** (RUNBOOK, `site/README.md`, commentaires du code de l'espace, méthode) : « gratuit » y désigne les offres sans frais de Cloudflare, Resend, Google ou Infomaniak, pas un service d'Anne. Personne d'extérieur ne les lit.

## Ce qui est vérifié (2026-10-25)
- `npm run build` OK ; `npm run check` 0 erreur ; liens : 27 pages, 1 863 liens, 0 cassé ; `npm run verif` : aucune erreur console.
- Recherche dans le site construit : « gratuit » n'apparaît plus que dans `mentions-legales.html`.
- Guide PDF refait : 0 « gratuit ». Rapport PDF refait : 0 « gratuit », 2 « offert ».
- Après la revue : `npm run build` OK, `npm run check` 0 erreur.
- Captures (accueil et page du diagnostic, ordinateur et téléphone) : `/mnt/project-files/captures/offert/`.

## Revue de code
2026-10-25, skill `bmad-code-review` dans une session neuve, PR n° 204, commit 80dbbe8 relu.
- Haute : 42 captures PNG (28 Mo) commitées par erreur dans `site/.verif/`, les JPEG suivis par Git non refaits : corrigé (commit suivant) : PNG retirés, JPEG refaits avec `scripts/verif-jpg.mjs`, `.verif/*.png` ajouté au `.gitignore` du site.
- Basse : « … des recommandations. Offert. » dans la description Google se lit comme un mauvais accord : corrigé, « Diagnostic offert. ».
- Basse : « Three minutes, complimentary. » un peu raide : écarté, « complimentary » est l'équivalent exact d'« offert » ; « at no cost » reviendrait à « gratuit ».
- Vérifié sans problème par la revue : plus aucun « gratuit » ni « free » côté visiteur ; `accueil.yml` (lu en premier) et `fr.json` (repli) identiques ; empreinte du gabarit du rapport à jour ; accords justes.

## Ce qui reste
Rien. Fusionnée sur l'accord de JB le 2026-10-26 (PR n° 204, commit de fusion 918ed67).
