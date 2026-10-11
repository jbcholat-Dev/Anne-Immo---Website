# Story 12.7 : Aperçu permanent après le lancement

Epic 12, Lancement public. Ouverte le 2026-10-11 au soir à la demande de JB (« comment continue-t-on notre boucle de rétroaction ? »).

## Objectif

Garder, à côté du site public, un aperçu réservé à Anne et JB où le bouton « Un retour ? » crée toujours des tickets `retour-apercu`, sans écrire dans la vraie base ni envoyer de vrais e-mails.

## Constat

Depuis la bascule (story 12.4, `LANCEMENT=oui`), la branche `main` est construite en production : l'adresse `anne-vial-tissot-site.jbcholat.workers.dev` sert la même version que `annevialtissot.fr`, sans bouton de retour, et ses formulaires partent réellement chez Anne. Les autres branches restent des aperçus (`site/scripts/lancement.mjs`).

## Ce qui est fait

- Branche `apercu` créée le 2026-10-11 depuis `main` (commit `59b016f`). Cloudflare la construit en aperçu ; son adresse stable est `https://apercu-anne-vial-tissot-site.jbcholat.workers.dev`, derrière Cloudflare Access comme l'ancien aperçu.
- `.github/workflows/apercu.yml` : à chaque fusion dans `main`, GitHub recopie `main` dans `apercu`, qui est reconstruite par Cloudflare. L'aperçu suit donc le site public sans geste de personne.
- RUNBOOK § 2 et § 4 bis, `CLAUDE.md` (adresse d'aperçu) mis à jour.

## Vérifié

- Construction Cloudflare de la branche `apercu` (2026-10-11, build `a225dbf0`) : réussie, journal « lancement : aperçu (branche apercu), configuration inchangée », base `anne-leads-apercu`, alias `https://apercu-anne-vial-tissot-site.jbcholat.workers.dev`.
- Sans code, cette adresse renvoie vers l'écran de connexion Cloudflare Access (302), comme l'ancien aperçu.

- PR n° 131 fusionnée par JB le 2026-10-11 : le programme « Aperçu » a aussitôt recopié `main` dans `apercu` (les deux branches pointent sur `884f3ee`).

## Ce qui reste

Rien. Story close le 2026-10-11.
