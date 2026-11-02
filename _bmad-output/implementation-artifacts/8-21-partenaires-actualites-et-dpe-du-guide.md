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
- PDF du guide relu page 5 (capture `guide-page-5-erreur-2.png`). Correction du 2026-11-02 : l'erreur n° 2 ne tient pas sur sa page ; les items 4 à 8 de la liste des diagnostics passent page 6 (le PDF de cette branche faisait déjà 17 pages, contre 16 sur main). Voir « Ce qui reste ».

## Fusion de main dans la branche (2026-11-02)
La branche datait du 2026-10-15 ; `origin/main` y a été fusionné (commit de fusion, sans réécriture d'historique), 214 commits de main repris.
- Conflits résolus en gardant les deux côtés : statut de sprint (8.21 en `review`, puis 8.22 à 8.25 de main), `DECISIONS.md` (D-46 de cette story, puis D-47 terracotta #C4623E, D-48 « offert », D-49 infographies ; main avait réservé 8.21 et D-46 pour cette PR), `site/README.md` (écart « Partenaires et Actualités » et écart « Entonnoir du diagnostic » de main).
- Fusion automatique sans conflit : barre de navigation et pied de page (main n'y avait changé que le terracotta), textes de l'interface, texte du guide (erreur n° 2 réécrite + sources 8 et 9 ajoutées après les 7 sources de main ; aucun « gratuit »).
- PDF du guide : conflit sur le fichier binaire, refait depuis le texte fusionné avec le script de main (`node scripts/guide-pdf.mjs`) : terracotta #C4623E, 17 pages, erreur n° 2 et sources 8 et 9 présentes.

## Ce qui est vérifié (2026-11-02, après fusion de main)
- `npm ci` puis `npm run build` (aperçu) : OK. `npm run check` : 0 erreur, 0 avertissement (76 remarques, 93 fichiers).
- `node scripts/liens.mjs` : 29 pages, 2 161 liens vérifiés, 0 cassé.
- `node scripts/ecrans.mjs` (390, 900, 1 024, 1 280, 1 440 px) : aucun signalement ; en plus, à 960, 1 100 et 1 180 px, et avec `/partenaires` et `/actualites` ajoutées à la liste des pages : aucun signalement.
- Règle D-46 sur le site public (`PUBLIC_INDEXATION=oui npm run build`, sans fiche) : aucune page ne pointe vers `/partenaires` ni `/actualites`, les deux pages portent `noindex, nofollow`, plan du site à 23 pages indexables. Sur l'aperçu, les deux onglets sont dans la barre et le pied de page.

## Ce qui reste
- PDF du guide : l'erreur n° 2 déborde sur une page presque vide (items 4 à 8 des diagnostics). Recommandation : demander à Anne de raccourcir son paragraphe, ou retirer le paragraphe « Bon à savoir » de cette erreur, plutôt que de réduire la mise en page de tout le guide. Texte d'Anne non modifié dans cette fusion.
- JB : valider la demande de fusion (elle change le site) et confirmer la carte de décision.
- Anne : remplir ses premiers partenaires et articles dans l'espace d'édition.
- À voir avec Anne : le rapport PDF du diagnostic (`contenu-anne/guide/rapport-diagnostic.md`, q02) et l'e-mail J+9 (`sequence-emails/etape-4`) parlent encore du seul DPE de juillet 2021 ; à aligner si elle le souhaite (fil Back-end pour le rapport).
