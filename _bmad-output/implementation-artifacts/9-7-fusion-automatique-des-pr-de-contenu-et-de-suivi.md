---
story: 9.7
epic: 9 — Mise en ligne d'aperçu
statut: review
date: 2026-10-10
---

# Story 9.7 — Fusion automatique des PR de contenu et de suivi

## Objectif
Décision de JB du 2026-10-10 : il ne garde la validation que des demandes de fusion (PR) qui ont un impact sur le site (code, mise en page, back-end, réglages). Les enregistrements de l'espace d'édition d'Anne et les PR « légères » (suivi, notes, RUNBOOK, documents) fusionnent seuls dans `main`.

## Ce qui est fait
- Précision de JB du 2026-10-10 (« tu les merges toi-même ») : le fil Claude qui ouvre une PR légère la fusionne lui-même dès la construction au vert ; le programme ci-dessous fusionne les enregistrements de l'espace d'édition (aucun fil n'est actif quand Anne enregistre) et rattrape une PR légère oubliée.
- Au 2026-10-10, aucune PR CMS ni PR légère ouverte n'attendait (PR n° 74 et 72 : code ; n° 20 : essai de design en brouillon) : rien à fusionner.
- `.github/workflows/fusion-auto.yml` : programme GitHub Actions lancé à chaque ouverture, nouveau commit, sortie du brouillon ou changement d'étiquette d'une PR vers `main`, et à chaque fin de construction Cloudflare. Lancement à la main possible (Actions → Run workflow) : repasse toutes les PR ouvertes.
- `.github/scripts/fusion-auto.mjs` : la règle de tri.
  - **contenu** : branche `cms/…` (espace d'édition Sveltia) qui ne touche que `contenu-anne/` ;
  - **suivi** : uniquement `_bmad-output/`, `_bmad/`, `.claude/`, `maquettes/`, ou des `.md` hors de `contenu-anne/`, `site/src/`, `site/public/`, `site/prive/`, `design-system/`, `.github/` ;
  - tout le reste reste à JB, de même qu'une PR en brouillon, étiquetée `a-valider`, venue d'une copie du dépôt ou visant une autre branche que `main`.
  - Une PR classée ne fusionne que lorsque la vérification `Workers Builds: anne-vial-tissot-site` (la construction Cloudflare) est au vert sur son dernier commit ; la fusion est demandée pour ce commit précis (un commit arrivé entre-temps attend sa propre construction).
  - Fusion par commit de fusion, comme les fusions de JB jusqu'ici. Les branches ne sont pas supprimées (même comportement qu'aujourd'hui ; les fils Claude réutilisent leur branche).
- Sécurité : déclenchement `pull_request_target`, donc le programme et la règle viennent toujours de `main`, jamais de la PR examinée ; le code de la PR n'est ni récupéré ni exécuté. Une PR qui modifie `.github/` reste à JB.
- Espace d'édition : dans Sveltia, un enregistrement crée une PR **en brouillon** (statut « Brouillon ») ; le passage en « En relecture » ou « Prêt » la sort du brouillon (vérifié dans le code de Sveltia 0.229.0 : `createPullRequest` crée en brouillon, `updateDraftState` bascule). Anne peut donc enregistrer plusieurs fois sans rien mettre en ligne, puis envoyer d'un geste.
- Documents : RUNBOOK § 1 et § 2 bis, `CLAUDE.md` (§ 2 et carte du dépôt), commentaires de `site/public/admin/config.yml`, spine (ligne « Choix du CMS ») et son `.memlog.md`, epics (critère de la story 7.13, story 9.7), statut de sprint.

## Vérification
- `node .github/scripts/fusion-auto.mjs --essai` : 13 cas de tri, tous corrects (enregistrement CMS, CMS qui touche du code, suivi seul, suivi + code, contenu modifié hors CMS, réglage, `.github/`, PR vide).
- Parcours complet simulé (GitHub imité) : PR CMS prête et construite → fusion demandée avec le sha vérifié ; PR CMS en brouillon → attente ; fin de construction sur une PR de suivi → fusion ; PR de code → laissée à JB ; construction en cours → attente ; autre vérification → ignorée.
- Pas de `npm run build` : aucun fichier lu par la construction n'est modifié (seulement des commentaires dans `config.yml`, servi tel quel).
- **Reste à vérifier en réel** après la fusion de cette PR : la première PR de suivi ou le premier enregistrement d'Anne qui fusionne seul (onglet Actions, « Fusion automatique »).

## Ce qui reste
- JB : fusionner cette PR (elle touche `.github/`, donc elle ne fusionne pas seule) ; vérifier que GitHub Actions est autorisé sur le dépôt et qu'aucune règle de `main` n'exige une approbation (RUNBOOK § 2 bis).
- Claude : constater la première fusion automatique, passer la story en `done`.
- Anne : savoir que « En relecture » ou « Prêt » met sa fiche en ligne (à dire dans le guide de l'espace d'édition).

## Écart assumé
La story 7.13 prévoyait que JB fusionne chaque enregistrement. Décision de JB du 2026-10-10 : fusion automatique. Ce qu'on perd : la relecture humaine du contenu avant la mise en ligne. Garde-fous gardés : le statut « Brouillon », la construction (un texte obligatoire vide la fait échouer, donc rien ne fusionne), l'étiquette `a-valider`, et le retour arrière par Cloudflare (RUNBOOK § 3).
