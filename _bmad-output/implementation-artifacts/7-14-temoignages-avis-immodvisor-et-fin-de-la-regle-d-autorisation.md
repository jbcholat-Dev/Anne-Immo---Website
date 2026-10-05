---
story: 7.14
epic: 7 — Contenu d'Anne
statut: done
date: 2026-10-05
autorisations: sans objet (décision de JB : accords des clients obtenus)
---

# Story 7.14 — Témoignage d'une vente = son avis Immodvisor ; fin de la règle d'autorisation

## Objectif
Décision de JB du 2026-10-05 (fil « Contenu du site ») :
- « On a fait valider par tous ces clients […] on enlève cette règle sur l'autorisation écrite reçue. »
- « Le seul témoignage qu'on a, c'est […] le commentaire Immodvisor. C'est ça qu'on va mettre ici s'il existe. »

## Ce qui est fait
- `site/src/content.config.ts` : plus aucune vérification liée à `autorisations` (champ toléré, ignoré). Une vente « publie » est visible sur le site public.
- Espace d'édition (`site/public/admin/config.yml`) : les champs « Témoignages » et « Autorisations écrites reçues » sont retirés du formulaire des ventes ; l'aide du statut explique que « Publiée » suppose l'accord des clients et que le témoignage vient de l'avis relié.
- Avis reliés à leur vente par le champ `story` de l'avis (modifiable dans l'espace d'édition, rubrique Avis, « Vente concernée ») :
  - JcbAnthy → Anthy T3 (rapprochement de confiance forte) ;
  - Sabine/François → Essert-Romand (confiance forte) ;
  - Alexandra V. → Thonon, vente en cascade, et RHL (achat) → l'auberge d'Armoy : déjà affichés comme liaisons « assumées » dans `site/src/config/site.ts`, désormais écrits dans l'avis ; le tableau des liaisons assumées est vide.
  - Isalinep → Sciez : la vente de Sciez n'a pas encore de fiche ; à relier quand elle existera.
  - Anthy T4, Évian, Morzine, maison premium : aucun avis rapproché, la fiche n'affiche pas de témoignage (bloc réservé sur l'aperçu).
- La fiche d'une vente affiche ses avis cités tels quels (vendeur d'abord), source « Avis Immodvisor » : mécanisme existant (`avisDeStory`), inchangé.
- Documents : `CLAUDE.md` § 5, `contenu-anne/README.md` (règle 3, témoignages), gabarits, `site/README.md`, `.memlog.md` de la spec, epics, statut de sprint.

## Vérification
- `npm run build` : 25 pages, aucun avertissement d'autorisation.
- `npm run check` : 0 erreur, 0 avertissement.
- `scripts/liens.mjs` : 1479 liens, 0 cassé.
- Fiches de l'aperçu : Anthy T3 cite JcbAnthy, Essert-Romand cite Sabine/François, Thonon cite Alexandra V., l'auberge cite RHL ; texte identique à l'avis (phrases vérifiées mot pour mot). Évian : aucun avis, aucun témoignage.
- Configuration de l'espace d'édition validée contre le schéma JSON de Sveltia 0.229.0 : 0 erreur.

## Ce qui reste
- Anne ou JB : confirmer ou corriger les quatre liaisons dans l'espace d'édition (rubrique Avis).

Fusionnée le 2026-10-05 (PR #14).
