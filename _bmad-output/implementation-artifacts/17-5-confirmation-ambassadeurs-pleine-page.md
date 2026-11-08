---
story: 17.5
epic: 17 — Programme ambassadeurs
statut: done
date: 2026-11-08
origine: retour de JB du 2026-11-08 sur l'aperçu de test (deux captures)
---

# Story 17.5 — Confirmation d'inscription en pleine page

## Objectif

Après l'inscription, le message « Bienvenue parmi les ambassadeurs » ne remplaçait que le formulaire, en bas à droite de la page : on pouvait le manquer. La maquette validée (écran 2, https://claude.ai/artifact/JRzaQnTFGuTM83oyuFdHby) montre un écran entier « C'est fait ». JB demande que la confirmation remplace la page.

## Ce qui est fait

- `site/src/pages/ambassadeurs.astro` : les sections de la page sont regroupées (`data-amb-page`) et masquées à la réponse du serveur ; la confirmation devient une section à part, en haut de page : « C'est fait », « Bienvenue parmi les ambassadeurs, Prénom. » (ou « Vous êtes déjà ambassadeur »), trait terracotta, rappel de l'e-mail, carte « Vous pensez déjà à quelqu'un ? » (WhatsApp, SMS), lien « Enregistrer mon numéro dans votre téléphone », numéro d'Anne. Anne parle à la première personne, comme sur le reste de la page. Un seul titre de niveau 1 sur la page.
- `site/src/pages/anne-vial-tissot.vcf.ts` : fiche contact d'Anne (vCard), construite depuis `config/site.ts`.
- Écart avec la maquette : « Pas de nom en tête pour l'instant ? Gardez la carte. » devient « … Je reste joignable au même numéro », car on arrive aussi par e-mail, sans carte.
- `scripts/e2e-ambassadeurs.mjs` : deux vérifications de plus par largeur (page masquée et retour en haut, lien et contenu de la fiche contact).

## Ce qui est vérifié (2026-11-08, en local)

- `node scripts/e2e-ambassadeurs.mjs` : essai réussi, 41 vérifications après la revue (captures `site/.verif/ambassadeurs/confirmation-telephone.png` et `-ordinateur.png`).
- `npm run check` : 0 erreur ; `npm run build` au vert ; `node scripts/liens.mjs` : 32 pages, 2 331 liens, 0 cassé ; `node scripts/ecrans.mjs` : aucun signalement.

## Revue de code

2026-11-08, PR #253, commit a496b80, relu en session neuve (`bmad-code-review`). Vérifié sans défaut : la page n'est masquée qu'après une réponse réussie, le cas « déjà inscrit », la fiche contact construite en fichier fixe, aucun effet sur les autres pages.

1. Les en-têtes posés dans `anne-vial-tissot.vcf.ts` sont perdus en sortie statique (servi en `text/x-vcard` sans jeu de caractères, accents abîmés) : corrigé, `Content-Type: text/vcard; charset=utf-8` dans `public/_headers`, vérifié par l'essai.
2. `aria-live` sur la section qui reçoit aussi le focus (double lecture possible) : corrigé, retiré.
3. Plus de titre de niveau 1 une fois la page masquée : corrigé, les titres de la confirmation sont des `h1` (un seul visible à la fois).
4. Attribut `download` : sur iPhone, le fichier irait dans Fichiers au lieu de « Ajouter aux contacts » : corrigé, `download` et `Content-Disposition` retirés. À confirmer sur un vrai iPhone.
5. Deux défilements doux à la suite, attente fixe dans l'essai : corrigé, remontée immédiate et attente de `scrollY < 5`.
6. URL écrite à la main dans la fiche : corrigé (adresse du site depuis la configuration). Nom, titre et organisation restent écrits dans le fichier : `identite` n'a pas ces champs séparés ; écarté.

## Mise en ligne (2026-11-08)

- PR #253 fusionnée par JB (commit e3c4b0f) ; constructions de main et de l'aperçu de test au vert.
- Contrôlé sur annevialtissot.fr : `/ambassadeurs` porte la confirmation en pleine page ; `/anne-vial-tissot.vcf` répond 200, `text/vcard; charset=utf-8`, ligne `TEL;TYPE=CELL:+33671991754`.

## Ce qui reste

- JB : une inscription d'essai sur l'aperçu de test ; essai du lien « Enregistrer mon numéro » sur un iPhone et un Android.
