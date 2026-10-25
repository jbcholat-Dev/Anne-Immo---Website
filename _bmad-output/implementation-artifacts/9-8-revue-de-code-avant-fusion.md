---
story: 9.8
epic: 9 — Mise en ligne d'aperçu
statut: review
date: 2026-10-25
---

# Story 9.8 — Revue de code avant fusion

## Objectif
Décision de JB du 2026-10-25, à la suite de l'audit BMAD du même jour (https://claude.ai/artifact/KUMnTmrZ1AwQyvHL8ctVKu) : le code du site et de l'espace d'Anne est relu par une session neuve avant d'être proposé à JB, et chaque epic terminé donne lieu à une rétrospective.

L'audit constatait deux étapes de la méthode BMAD qui ne tournaient pas : la revue de code par story (0 story sur 99 ne cite `bmad-code-review` ; une seule revue globale, avant l'ouverture, story 12.6) et la rétrospective de fin d'epic (aucune, même pour les 5 epics terminés). Or le site est public, il recueille des contacts et envoie des e-mails : c'est là qu'un bug coûte le plus, en référencement comme en RGPD.

## La règle
- **Quelles PR** : toute PR qui touche `site/src/`, `site/public/`, `site/prive/`, `espace/src/` ou `.github/`.
- **Quoi** : le skill `bmad-code-review` (la relecture adverse de BMAD, déjà installée dans `.claude/skills/`) est lancé **dans une session neuve**, c'est-à-dire une session qui n'a pas écrit le code et ne connaît que la story et la différence de code. Une relecture par celui qui a écrit le code voit ce qu'il voulait faire, pas ce qu'il a fait.
- **Quand** : avant que la PR soit proposée à JB. Tant que la revue n'est pas faite et traitée, la PR reste en brouillon.
- **Ce qu'on fait des constats** : chacun est soit corrigé (dans la même PR), soit écarté avec sa raison en une ligne. Aucun constat ne reste sans réponse.
- **Trace** : le résultat est cité dans la story, section « Revue de code » : date, ce qui a été relu (PR et commit), nombre de constats, puis une ligne par constat avec « corrigé (commit) » ou « écarté : raison ».
- **Dispensées** : les PR de documents (celles qui fusionnent seules, story 9.7) et les enregistrements de contenu (espace d'édition, `contenu-anne/`).
- **À la clôture d'un epic** : rétrospective avec le skill `bmad-retrospective` ; la ligne `epic-N-retrospective` du statut de sprint passe à `done` et ses actions vont dans la liste `action_items` du même fichier.

## Ce qui est fait
- Règle ajoutée au `CLAUDE.md` § 2 (traçabilité), juste après la règle de fusion automatique, et rappelée au RUNBOOK § 2 bis (ce qui reste à JB).
- Story 9.8 ajoutée à `epics.md` (epic 9) et au statut de sprint.
- Tableau de bord mis à jour (epic 9).

## Vérification
- Relecture : les chemins concernés reprennent ceux que la fusion automatique laisse déjà à JB (`site/src/`, `site/public/`, `site/prive/`, `.github/`), plus `espace/src/`, le code de l'espace d'Anne. Une PR soumise à revue n'est donc jamais une PR qui fusionne seule : les deux règles ne se contredisent pas.
- Skills présents : `.claude/skills/bmad-code-review/` et `.claude/skills/bmad-retrospective/`.
- Pas de `npm run build` : aucun fichier lu par la construction n'est modifié.

## Ce qui reste
- JB : relire et fusionner cette PR (étiquette `a-valider`).
- Claude : appliquer la règle à la prochaine PR de code ; passer cette story en `done` quand la première section « Revue de code » existe dans une story.
- Suite demandée par JB, dans une PR à part : remise à jour du statut de sprint (date, stories figées « en cours », noms qui ne correspondent pas) et rétrospective des epics 1 à 5.

## Écart assumé
Les stories du projet gardent leur format maison (Objectif, Ce qui est fait, Vérification, Ce qui reste) plutôt que le format BMAD (critères d'acceptation et tâches à cocher) qu'attend `bmad-code-review`. La revue s'appuie alors sur la story telle quelle et sur les critères de `epics.md`. Ce qu'on perd : la vérification case par case de BMAD. À revoir si les premières revues montrent que le skill lit mal ce format.
