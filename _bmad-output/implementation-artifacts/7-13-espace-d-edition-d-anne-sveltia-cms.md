---
story: 7.13
epic: 7 — Contenu d'Anne
statut: in-progress
date: 2026-10-05
autorisations: sans objet (aucune photo ni témoignage nouveau)
---

# Story 7.13 — Espace d'édition d'Anne (Sveltia CMS)

## Objectif
Qu'Anne (et JB) modifient eux-mêmes les ventes, les pages, les coordonnées et le rapprochement des avis, photos comprises, sans passer par le Drive et par Claude. Décision de JB du 2026-10-05 (carte de décision du fil « Contenu du site ») après comparaison de Sveltia, Pages CMS, Decap, Keystatic, TinaCMS, CloudCannon : voir le spine d'architecture (« Choix du CMS ») et `.memlog.md`.

## Ce qui est fait
- `site/public/admin/index.html` : charge Sveltia CMS 0.229.0 (version figée), page non indexée.
- `site/public/admin/config.yml` : dépôt GitHub `main`, connexion par le Worker `sveltia-cms-auth` (adresse supposée `https://sveltia-cms-auth.jbcholat.workers.dev`, à corriger si JB le nomme autrement), mode brouillons (`editorial_workflow` : une branche et une demande de fusion par enregistrement), photos réduites dans le navigateur (WebP, qualité 85, 3 200 px max, 50 Mo max avant réduction). Collections : ventes (formulaire complet, photos dans `photos/` de la story), pages, avis Immodvisor (lecture seule sauf « vente concernée » et « cité sur l'accueil »), coordonnées (`legal/identite.md`). Configuration validée contre le schéma JSON du paquet 0.229.0 (0 erreur).
- Site : `photo_principale` / `photos` acceptent un chemin (`photos/x.webp`) ou un ancien numéro (lu via `photos.json`) ; `scripts/images.mjs` dérive tous les `photo-*.jpg`, `*.webp`, `*.png` du dossier `photos/` de chaque story et tourne avant chaque construction (`npm run build`).
- Brouillons : le site public (`PUBLIC_INDEXATION=oui`) ne montre que les stories « publie » ; aucun lien ni photo d'une story non publiée n'y apparaît (`storyVisible`, accueil, Acheter, Diagnostic). L'aperçu montre tout.
- Les 4 stories avec photos web ont leurs champs photo convertis en chemins ; les 4 sans photos web ont un champ vide (la photo HD proposée est notée en commentaire, à envoyer depuis l'espace d'édition).
- Documents : RUNBOOK § 1 et § 6, `site/README.md` (§ Espace d'édition), `contenu-anne/README.md`, gabarit story, `scripts/preparer-photos/README.md`, `CLAUDE.md`, spine, stratégie de contenu, `.memlog.md`, epics, statut de sprint. Guide pas à pas pour JB et Anne : document Google « Mise en place de l'espace d'édition » dans le Drive « Contenu site Anne ».

## Vérification
- `npm run build` : 24 pages (aperçu) ; avec `PUBLIC_INDEXATION=oui` : 16 pages, aucune story en brouillon.
- `npm run check` : 0 erreur, 0 avertissement.
- `scripts/liens.mjs` : aperçu 1477 liens, 0 cassé ; production 940 liens, 0 cassé (un lien vers une story non publiée sur la page Acheter a été trouvé et corrigé).
- Essai de chaîne photo : une WebP posée dans `stories/anthy-t3-2024/photos/` et référencée par chemin est dérivée (640/1280/1920) et affichée sur la fiche ; essai retiré.
- `/admin/index.html` ouvert dans Chromium sans réseau externe (script servi en local) : la configuration est lue, l'écran de connexion s'affiche (« Sign In with GitHub »). La traduction française se charge depuis Internet, non testable ici.
- `npm run verif` : aucune erreur console.

## Ce qui reste
- JB : mettre en ligne le Worker `sveltia-cms-auth`, créer l'autorisation OAuth GitHub, inviter Anne comme collaboratrice (guide du Drive, étapes 1 à 4).
- Anne : créer son compte GitHub avec la validation en deux étapes.
- Séance d'essai (Anne et JB) : créer une vente avec photos, vérifier la demande de fusion, l'aperçu, la fusion ; vérifier qu'un avis enregistré garde son texte à l'identique et qu'une photo envoyée ne garde pas de coordonnées GPS.
- Après l'essai : passer la story en `done`, mettre à jour le tableau de bord.
