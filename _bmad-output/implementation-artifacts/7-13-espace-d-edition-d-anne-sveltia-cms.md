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
- `site/public/admin/config.yml` : dépôt GitHub `main`, connexion par le Worker `sveltia-cms-auth` (`https://sveltia-cms-auth.jbcholat.workers.dev`, en ligne depuis le 2026-10-05, dépôt `jbcholat-Dev/sveltia-cms-auth`), mode brouillons (`editorial_workflow` : une branche et une demande de fusion par enregistrement), photos réduites dans le navigateur (WebP, qualité 85, 3 200 px max, 50 Mo max avant réduction). Collections : ventes (formulaire complet, photos dans `photos/` de la story), pages, avis Immodvisor (lecture seule sauf « vente concernée » et « cité sur l'accueil »), coordonnées (`legal/identite.md`). Configuration validée contre le schéma JSON du paquet 0.229.0 (0 erreur).
- Site : `photo_principale` / `photos` acceptent un chemin (`photos/x.webp`) ou un ancien numéro (lu via `photos.json`) ; `scripts/images.mjs` dérive tous les `photo-*.jpg`, `*.webp`, `*.png` du dossier `photos/` de chaque story et tourne avant chaque construction (`npm run build`).
- Brouillons : le site public (`PUBLIC_INDEXATION=oui`) ne montre que les stories « publie » ; aucun lien ni photo d'une story non publiée n'y apparaît (`storyVisible`, accueil, Acheter, Diagnostic). L'aperçu montre tout.
- Les 4 stories avec photos web ont leurs champs photo convertis en chemins ; les 4 sans photos web ont un champ vide (la photo HD proposée est notée en commentaire, à envoyer depuis l'espace d'édition).
- Documents : RUNBOOK § 1 et § 6, `site/README.md` (§ Espace d'édition), `contenu-anne/README.md`, gabarit story, `scripts/preparer-photos/README.md`, `CLAUDE.md`, spine, stratégie de contenu, `.memlog.md`, epics, statut de sprint. Guide pas à pas pour JB et Anne : document Google « Mise en place de l'espace d'édition du site » à la racine du Drive « Contenu site Anne » (https://docs.google.com/document/d/10RtCluMzvjWi--rheyTH34FaGj_EjfKRwHilRBJ4UK4/edit).
- Bouton « Publier » masqué dans l'espace d'édition (`publish: false` sur chaque collection) : la mise en ligne passe toujours par la fusion de la demande sur GitHub par JB, y compris pour ses propres modifications.

## Vérification
- `npm run build` : 24 pages (aperçu) ; avec `PUBLIC_INDEXATION=oui` : 16 pages, aucune story en brouillon.
- `npm run check` : 0 erreur, 0 avertissement.
- `scripts/liens.mjs` : aperçu 1477 liens, 0 cassé ; production 940 liens, 0 cassé (un lien vers une story non publiée sur la page Acheter a été trouvé et corrigé).
- Essai de chaîne photo : une WebP posée dans `stories/anthy-t3-2024/photos/` et référencée par chemin est dérivée (640/1280/1920) et affichée sur la fiche ; essai retiré.
- `/admin/index.html` ouvert dans Chromium sans réseau externe (script servi en local) : la configuration est lue, l'écran de connexion s'affiche (« Sign In with GitHub »). La traduction française se charge depuis Internet, non testable ici.
- `npm run verif` : aucune erreur console.

## Mise en place (2026-10-05, JB)
- Worker `sveltia-cms-auth` en ligne ; autorisation OAuth « Site Anne, édition » créée. Le formulaire GitHub a changé depuis le guide : le champ de retour s'appelle « Redirect URIs » (y mettre l'adresse du Worker + `/callback`, sans « wildcard » ni « Device Flow ») ; « Expire user access tokens » décoché (renouvellement automatique non vérifié). Le Google Doc du guide n'est pas modifiable par Claude : cette story fait foi.
- Les trois réglages du Worker (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS`) sont tous de type **Secret** : le Worker est remis en ligne depuis son dépôt, ce qui efface les réglages de type « Variable » ajoutés à la main.
- Le dépôt appartient à l'organisation `jbcholat-Dev`, qui restreint les applications tierces : sans approbation, l'enregistrement échoue (« OAuth App access restrictions »). Approuvé par JB avec le bouton « Grant » de l'écran d'autorisation GitHub (après avoir retiré sa première autorisation) ; l'approbation vaut pour toute l'organisation.
- Premiers enregistrements de JB : une page, puis la vente Anthy T3 avec 11 photos (PR #12, fusionnée). Photos vérifiées : 3 200 × 2 133 px, WebP, aucune donnée EXIF ni XMP (donc pas de position GPS).

## Incident du 2026-10-05 : construction en échec après la PR #12
- Cause : la vente Anthy T3 a été enregistrée en « Publiée » sans « Autorisations écrites reçues ». La règle « rien ne part en ligne sans accord écrit » faisait alors échouer toute la construction, et l'aperçu ne se mettait plus à jour.
- Correction : `src/content.config.ts` ramène désormais une telle fiche à « à relire », avec un avertissement dans le journal de construction, au lieu de bloquer. La règle tient toujours : le site public n'affiche que les fiches « publie » avec autorisations. Aide du champ dans l'espace d'édition mise à jour. Fiche Anthy T3 remise en « a-relire ».
- La photo principale avait été envoyée dans la médiathèque globale (`contenu-anne/photos/`, chemin `/photos/…`) au lieu du dossier de la vente ; le même fichier existait déjà dans la vente. Doublon supprimé, chemin corrigé en `photos/…`. À retenir pour Anne : choisir les photos dans l'onglet de la fiche, pas dans la médiathèque globale.
- Vérifié : `npm run build` 25 pages ; avec `PUBLIC_INDEXATION=oui` et Anthy forcée en « publie » sans autorisations, la construction passe, avertit, et la fiche est absente ; `npm run check` 0 erreur ; `scripts/liens.mjs` 1477 liens, 0 cassé ; la fiche Anthy de l'aperçu affiche ses 11 photos.

## Ce qui reste
- JB : inviter Anne comme collaboratrice (guide, étape 6).
- Anne : créer son compte GitHub avec la validation en deux étapes.
- Séance d'essai (Anne et JB) : créer une vente avec photos, vérifier la demande de fusion, l'aperçu, la fusion ; vérifier qu'un avis enregistré garde son texte à l'identique et qu'une photo envoyée ne garde pas de coordonnées GPS.
- Après l'essai : passer la story en `done`, mettre à jour le tableau de bord.
