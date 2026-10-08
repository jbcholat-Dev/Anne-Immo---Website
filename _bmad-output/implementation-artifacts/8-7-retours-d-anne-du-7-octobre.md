---
story: 8.7
epic: 8 — Site : finitions
statut: done
date: 2026-10-08
origine: tickets GitHub n° 39, 40, 41 et 42 (retour-apercu, Anne, 2026-10-07)
---

# Story 8.7 — Retours d'Anne du 7 octobre

## Objectif
Traiter les quatre retours laissés par Anne sur l'aperçu le 2026-10-07 avec le bouton « Un retour ? ».

| Ticket | Page | Retour d'Anne | Suite |
|---|---|---|---|
| n° 39 | accueil | « Attention réalisations avec un S » | fait (D-29) |
| n° 42 | /realisation | « mettre comme titre "Quelques réalisations". Sinon on va croire que j'ai vendu que qqs biens » | fait (D-29) |
| n° 40 | accueil | « Rajouter un bouton : Estimation offerte (et renvoie à mon formulaire pour prendre rdv) » | fait (D-30) |
| n° 41 | /realisation | « Rajouter story Sciez, Bernex » | confié au fil Contenu du site : aucun texte d'Anne pour ces deux ventes (constat story 7.12) |

## Ce qui est fait
- Entrée de navigation « Réalisations » au pluriel (barre, menu mobile, pied de page, via `site/src/content/ui/fr.json`), bouton de la page 404 et titre d'onglet des fiches story. L'anglais garde « Track record ».
- Page `/realisation` : titre « Quelques réalisations » (h1 et titre d'onglet). L'adresse ne change pas.
- Accueil, ouverture (`site/src/components/accueil/Hero.astro`) : second bouton « Estimation offerte » (« Free valuation » en anglais), en contour clair (`btn-contour-ecru`) à côté du bouton du diagnostic, qui reste le bouton principal ; il mène à l'agenda de prise de rendez-vous, `/contact#reserver`. Sur téléphone, les deux boutons s'empilent.
- Documents : `DECISIONS.md` (D-29, D-30), `structure-site.md` (§ 0, § 1.1, § 2), `epics.md` (story 8.7), `site/README.md` (navigation, accueil), `RUNBOOK.md` (journal).

## Vérification
- `npm run build` sans erreur, 24 pages ; `npm run check` : 0 erreur ; `node scripts/liens.mjs` : 1467 liens, 0 cassé.
- `node scripts/ecrans.mjs` : aucun débordement ni bouton trop petit (la barre à 900 px tient avec « Réalisations »).
- `npm run verif` : aucune erreur console ; captures accueil (1440 et 390 px) et `/realisation` relues : deux boutons côte à côte sur ordinateur, empilés sur téléphone ; titre « Quelques réalisations ».

## Ce qui reste
- Ticket n° 41 (Sciez, Bernex) : Anne doit écrire quelques lignes sur chaque vente ; le fil Contenu du site les met au format du site.
- Tickets n° 39, 40 et 42 fermés le 2026-10-08 en citant le commit a876386 (PR #48, fusionnée par JB).
