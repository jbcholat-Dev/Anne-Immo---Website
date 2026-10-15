---
story: 8.21
epic: 8 — Structure et visuel
statut: review
date: 2026-10-15
---

# Story 8.21 — Onglets Partenaires et Actualités, erreur n° 2 du guide (tickets n° 153 et 154)

## Objectif
Deux retours d'Anne du 2026-10-15 sur l'aperçu (bouton « Un retour ? ») :
- **n° 153** (accueil) : « Rajouter un onglet Partenaires et un onglet Actualités. Je viendrai remplir ensuite le contenu. »
- **n° 154** (/vendre, guide) : réécrire l'erreur n° 2, titrée « Ne pas se tenir informé des nouvelles règles de calcul du DPE », avec les trois réformes : janvier 2025 (DPE d'avant juillet 2021 à refaire), janvier 2026 et janvier 2027 (nouvelles règles pour les logements chauffés à l'électricité).

## Ce qui est fait
- **Guide (n° 154)** : l'erreur n° 2 de `contenu-anne/guide/texte-actuel.md` prend le titre d'Anne et liste les trois dates ; ce qui suit (coût, valeur de l'étiquette, audit, solution, liste des diagnostics) est gardé. Deux sources ajoutées (8 : ministère de l'Économie, arrêté du 13 août 2025, coefficient de l'électricité de 2,3 à 1,9 au 1er janvier 2026 ; 9 : Que Choisir, août 2026, de 1,9 à 1,7 au 1er janvier 2027). Les dates d'Anne ont été vérifiées. PDF refait (`node scripts/guide-pdf.mjs`, `site/prive/guide.pdf`).
- **Onglets (n° 153)** : deux collections de contenu (`contenu-anne/partenaires/`, `contenu-anne/actualites/`), deux rubriques dans l'espace d'édition (`site/public/admin/config.yml`), les pages `/partenaires`, `/actualites` et `/actualites/<article>`, les entrées dans la barre (entre Acheter et Contact) et le pied de page. Anglais : « Partners », « News ».
- **Règle d'affichage (D-46)** : toujours visibles sur l'aperçu ; sur le site public, un onglet n'apparaît qu'à la première fiche « Publiée » de sa rubrique, et sa page reste non indexée tant qu'elle est vide. Option recommandée sur la carte de décision posée à JB le 2026-10-15 (à confirmer).
- **Barre** : entre 900 et 1 179 px, quand ces onglets sont là, les icônes des réseaux quittent la barre (elles restent dans le pied de page et le menu du téléphone) ; les libellés ne se coupent plus.
- Documents : `site/README.md` (pages, navigation, écart assumé), `maquettes/lot-3-complet/DECISIONS.md` (D-46), `contenu-anne/README.md` (les deux dossiers).

## Ce qui est vérifié (2026-10-15)
- `npm run build` OK (aperçu et site public) ; `npm run check` : 0 erreur ; liens : 29 pages, 2 161 liens, 0 cassé ; `scripts/ecrans.mjs` : aucun signalement ; `npm run verif` sur `/`, `/partenaires`, `/actualites` et un article : aucune erreur console.
- Avec une fiche d'essai de chaque sorte (retirées avant le commit) : barre sans débordement à 900, 960, 1 100, 1 180 et 1 440 px ; pages lisibles sur ordinateur et téléphone. Captures : `/mnt/project-files/tickets/153-154/`.
- Construction du site public sans fiche : aucun lien vers `/partenaires` ni `/actualites`, pages marquées non indexées, absentes du plan du site (23 pages indexables).
- PDF du guide relu page 5 : l'erreur n° 2 tient sur sa page (capture `guide-page-5-erreur-2.png`).

## Ce qui reste
- JB : valider la demande de fusion (elle change le site) et confirmer la carte de décision.
- Anne : remplir ses premiers partenaires et articles dans l'espace d'édition.
- À voir avec Anne : le rapport PDF du diagnostic (`contenu-anne/guide/rapport-diagnostic.md`, q02) et l'e-mail J+9 (`sequence-emails/etape-4`) parlent encore du seul DPE de juillet 2021 ; à aligner si elle le souhaite (fil Back-end pour le rapport).
