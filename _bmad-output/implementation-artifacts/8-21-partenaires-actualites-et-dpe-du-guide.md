---
story: 8.21
epic: 8 — Structure et visuel
statut: done
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
- **Règle d'affichage (D-46)** : toujours visibles sur l'aperçu ; sur le site public, un onglet n'apparaît qu'à la première fiche « Publiée » de sa rubrique, et sa page reste non indexée tant qu'elle est vide. Confirmée par JB le 2026-11-02 (carte de décision).
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
- Fusion : accord de JB le 2026-11-02 à 16 h 24, PR n° 155 fusionnée (commit fed381e) ; tickets n° 153 et 154 fermés.
- Anne : remplir ses premiers partenaires et articles dans l'espace d'édition.
- À voir avec Anne : le rapport PDF du diagnostic (`contenu-anne/guide/rapport-diagnostic.md`, q02) et l'e-mail J+9 (`sequence-emails/etape-4`) parlent encore du seul DPE de juillet 2021 ; à aligner si elle le souhaite (fil Back-end pour le rapport).

## Revue de code (2026-11-02)
Relecture adverse `bmad-code-review` (story 9.8), dans une session neuve qui n'a pas écrit le code : PR n° 155, branche `claude/project-thread-ont2f9`, commit relu `e66ef95` (diff `origin/main...e66ef95`). Quatre relectures en parallèle (aveugle, cas limites, trous de vérification, conformité à la story et à D-46), puis essais refaits à la main sur une copie de la branche, sans rien y écrire d'autre que cette section.

**Ce qui tient (essayé)**
- D-46, site public sans fiche (`PUBLIC_INDEXATION=oui npm run build`) : aucune page ne pointe vers `/partenaires` ni `/actualites` (seul le lien de langue de chaque page vers elle-même), les deux pages portent `noindex, nofollow`, plan du site à 23 adresses sans elles.
- D-46, site public avec une fiche « publie » et une fiche en brouillon ou « a-relire » dans chaque rubrique (fiches d'essai retirées ensuite) : les onglets apparaissent, le brouillon n'est ni dans `/partenaires` ni construit en page d'article, les pages perdent leur `noindex` et entrent au plan du site (`/partenaires`, `/actualites`, l'article).
- Barre sur l'aperçu, de 899 à 1 440 px, barre normale et réduite : toutes les entrées sur une ligne (hauteur 22 px chacune), aucun débordement ; réseaux masqués de 900 à 1 179 px, revenus à 1 180 px sans chevauchement (125 px de marge).
- Fusion automatique : une fiche de partenaire ou d'article et sa photo restent dans `contenu-anne/`, donc une branche `cms/…` reste de la famille « contenu » de `.github/scripts/fusion-auto.mjs`.

**Constats (9 à corriger, 2 à décider, 1 reporté, 12 écartés)**
- [Élevé] **à corriger** : un « Ordre » vide fait échouer la construction. `content.config.ts` : `ordre: z.number().optional()` refuse `ordre:` vide (`null`) ; essayé : `InvalidContentEntryDataError … ordre: Expected type "number", received "object"`. L'indice de l'espace d'édition invite pourtant à le laisser vide. La fiche d'Anne resterait bloquée (construction rouge, pas de fusion). Correction : même tolérance que `annee_vente` (`vide`, puis nombre dans le tri).
- [Moyen] **à corriger** : le « Site internet » d'un partenaire n'est pas contrôlé. Essayé : `www.notaire-essai.fr` donne `href="www.notaire-essai.fr"`, un lien relatif cassé (`/partenaires/www…`) ; une adresse `javascript:` passerait aussi. Correction : `pattern` `^https?://` dans `config.yml` et refus (ou ajout de `https://`) dans le schéma, comme `z.url()` d'`instantane`.
- [Moyen] **à corriger** : `delete: true` sur les deux rubriques, alors que ventes, pages et avis sont en `delete: false`. Avec `publish_mode: editorial_workflow`, la suppression d'une fiche déjà fusionnée part directement sur `main`, sans demande de fusion ni construction Cloudflare (story 9.7). Correction : `delete: false` (Anne passe la fiche en brouillon pour la retirer du site public), ou écart écrit dans `site/README.md` après essai sur l'aperçu.
- [Moyen] **à corriger** : la vérification de D-46 et des nouvelles pages ne se refait pas depuis le dépôt. `scripts/ecrans.mjs` (liste `pages`) et `npm run verif` ne contiennent ni `/partenaires`, ni `/actualites`, ni les articles ; aucun script ne vérifie qu'un brouillon reste hors du site public. Correction : ajouter les deux pages et la découverte de `dist/client/actualites/*.html` à `ecrans.mjs` et à `verif`, et un petit script de vérification sur le modèle des `e2e-*` (fiches d'essai, construction publique, contrôle des liens, du `noindex` et du plan du site, puis retrait).
- [Faible] **à corriger** : un logo en SVG disparaît sans prévenir. L'espace d'édition ne convertit que les images matricielles, et `scripts/images.mjs` ne dérive que `jpg`, `webp` et `png` : `clePhoto` renvoie `null`, la carte s'affiche sans logo. Correction : le dire dans l'indice du champ (ou limiter les formats acceptés), et un avertissement à la construction quand une photo choisie n'est pas trouvée.
- [Faible] **à corriger** : l'adresse d'un article prend la date de création de la fiche (`slug: "{{year}}-{{month}}-{{day}}-{{titre}}"`), pas le champ « Date ». Un article antidaté a une adresse qui contredit sa date affichée. Correction : `{{fields.date}}` ou le titre seul, à écrire dans l'indice.
- [Faible] **à corriger** : les dates d'article sont mises en forme sans fuseau (`toLocaleDateString('fr-FR', …)` sur une date lue à minuit UTC). Sans effet sur Cloudflare (UTC) ni en France ; une construction faite à l'ouest de Greenwich afficherait la veille. Correction : `timeZone: 'UTC'` dans `actualites/index.astro` et `actualites/[slug].astro`.
- [Faible] **à corriger** : sur les deux pages, l'en-tête parle à la première personne (« avec qui je travaille », « mon activité ») et l'état « Bientôt » à la troisième (« Anne présentera… », « Anne publiera… »). Visible sur l'aperçu seulement. Correction : tout à la première personne.
- [Faible] **à corriger** : la photo d'un article est affichée avec `alt=""` alors qu'elle porte du contenu. Correction : champ facultatif « Description de la photo » dans la rubrique Actualités, repris en `alt`.
- **à décider (JB)** : D-46 est encore 🔄 (« à confirmer » dans la story) alors que la règle est codée et décrite comme acquise dans `site/README.md`. À confirmer par JB avant la fusion ; sinon la PR reste en brouillon.
- **à décider (Anne, JB)** : PDF du guide, l'erreur n° 2 déborde sur une page 6 presque vide (17 pages contre 16). Déjà dans « Ce qui reste », avec une recommandation ; à trancher avant ou après la fusion.
- **reporté** : le rapport PDF du diagnostic (q02) et l'e-mail J+9 (`sequence-emails/etape-4`) ne parlent encore que du DPE de juillet 2021. Hors de ce diff, déjà noté dans « Ce qui reste ».
- écarté : pages anglaises « Partners » et « News » en français : écart déjà assumé pour la v1 (`site/README.md`, « Les autres entrées EN renvoient aux pages FR »).
- écarté : ordre différent entre la barre et le pied de page : le pied de page avait déjà son propre ordre (Diagnostic, Guide) ; Contact reste en dernier dans les deux.
- écarté : `data-rubriques` posé dès qu'un seul des deux onglets est là : conforme à D-46 et sans débordement à sept entrées.
- écarté : statuts `brouillon` / `a-relire` / `publie` contre « En relecture » / « Prêt » : ces derniers sont les états de la demande de fusion dans l'espace d'édition, pas le champ de la fiche ; `fusion-auto.mjs` trie par dossier, pas par statut.
- écarté : tri avec `ordre ?? 999` : un ordre au-delà de 999 n'a pas de sens pour une poignée de partenaires.
- écarté : `target="_blank"` sans `noreferrer` ni `nofollow` : `noopener` suffit pour la sécurité ; un lien vers un partenaire réel recommandé par Anne n'a pas à être caché aux moteurs.
- écarté : `sizes="160px"` pour un cadre de 120 px : l'écart couvre les écrans à forte densité.
- écarté : deux photos de même nom : l'espace d'édition convertit tout en WebP et renomme les doublons à l'envoi.
- écarté : styles `.index-tete` / `.index-vide` recopiés : même choix que les pages existantes (styles par page) ; un composant commun serait un rangement, pas une correction.
- écarté : pas d'appel à l'action en fin d'article, pas de données structurées `Article` ni d'image de partage : hors du périmètre de la story (ticket n° 153 : des onglets à remplir) ; à proposer à Anne une fois les premiers articles écrits.
- écarté : texte de l'erreur n° 2 (« trois fois en trois ans », source 9) : contenu demandé par Anne et vérifié dans la story ; ce n'est pas du code.
- écarté : tableau de bord et tickets n° 153 et 154 non mis à jour : relève de la clôture, pas de ce diff.

**Avis** : la règle D-46 et la barre font ce qui est annoncé. À ne pas fusionner en l'état à cause du constat élevé (un « Ordre » vide casse la construction dès la première fiche d'Anne) et des trois constats moyens. Les corrections relèvent du fil qui a écrit le code ; la story repasse en `in-progress`.

## Corrections après la revue de code (2026-11-02)
- [Élevé] « Ordre » vide : corrigé, `ordre` toléré vide comme `annee_vente` (`content.config.ts`), tri par nombre dans `lib/contenu.ts`. Essayé par `scripts/e2e-rubriques.mjs` (fiche d'essai avec `ordre:` vide).
- [Moyen] « Site internet » : corrigé, `pattern` `^https?://` dans l'espace d'édition et refus à la construction pour toute autre forme.
- [Moyen] `delete: true` : corrigé, `delete: false` sur les deux rubriques comme les autres ; la description de la rubrique dit de repasser la fiche en « Brouillon » pour la retirer du site.
- [Moyen] Vérification : corrigé, `/partenaires`, `/actualites` et les articles dans `scripts/ecrans.mjs` et `npm run verif` ; nouveau `scripts/e2e-rubriques.mjs` (deux constructions publiques avec fiches d'essai, retirées ensuite) : 13 vérifications passent.
- [Faible] Logo SVG : corrigé, indice du champ (JPG, PNG ou WebP) et avertissement à la construction quand une photo choisie n'est pas trouvée.
- [Faible] Adresse d'un article : corrigé, `slug: "{{titre}}"` (plus de date de création dans l'adresse).
- [Faible] Fuseau : corrigé, `timeZone: 'UTC'` sur les deux pages ; vérifié par le script (« 15 janvier 2026 »).
- [Faible] « Bientôt » à la troisième personne : corrigé, tout à la première personne.
- [Faible] Photo d'article sans texte alternatif : corrigé, champ facultatif « Description de la photo » (`photo_alt`), repris en `alt`.
- D-46 : confirmée par JB le 2026-11-02, ✅ dans `DECISIONS.md`.
- PDF du guide (erreur n° 2 sur deux pages) : laissé tel quel, choix de JB du 2026-11-02.

Vérifié après corrections : `npm run build` OK ; `npm run check` 0 erreur, 0 avertissement ; `scripts/liens.mjs` 29 pages, 2 161 liens, 0 cassé ; `scripts/ecrans.mjs` (390, 1 024, 1 280 px) sans signalement ; `scripts/e2e-rubriques.mjs` 13/13.
