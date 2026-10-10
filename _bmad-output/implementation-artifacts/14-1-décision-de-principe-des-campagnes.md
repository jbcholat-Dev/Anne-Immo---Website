---
story: 14.1
epic: 14 — Campagnes promotionnelles temporaires
statut: done
date: 2026-10-10
origine: demande de JB du 2026-10-10 (fil « Campagnes promotionnelles »)
---

# Story 14.1 — Décision de principe des campagnes temporaires

## Objectif
Écrire comment le site portera des offres limitées dans le temps (exemple de JB : une séance photo professionnelle de sa maison), avant d'en construire une, pour que la première campagne parte après le lancement public sur une base décidée.

## Constat
La spec v6 n'en parlait pas. Deux briques voisines existaient déjà : l'origine des campagnes gardée jusqu'au contact (story 5.4, AD-11) et un test de publicité locale encore à cadrer (story 11.2). Aucune page d'offre.

## Ce qui est décidé
- **Approche** (proposée par Claude, suivie par JB) : une page par offre, `/offre/<adresse-courte>`, créée par Anne dans l'espace d'édition ; elle s'ouvre et se ferme seule à ses dates ; après la fin, la même adresse dit « cette offre est terminée » et propose le diagnostic. Les inscrits entrent dans la table `lead` (source `offre`, campagne et origine enregistrées), Anne reçoit l'alerte habituelle, le diagnostic est proposé après l'inscription sans être imposé, un bandeau d'accueil est optionnel. Aucun traceur ajouté.
- **Forme de l'offre** (carte de décision, choix de JB du 2026-10-10) : **tirage au sort parmi les inscrits**. Claude recommandait « offre réservée aux vendeurs qui signent un mandat », plus simple juridiquement. Conséquence du choix : participation gratuite, règlement écrit accessible depuis la page, case d'acceptation du règlement distincte de la lettre d'information, tirage tracé (date, participants, gagnant).

## Ce qui est fait
- Epic 14 et stories 14.2 à 14.7 ajoutées à `_bmad-output/planning-artifacts/epics.md` et au statut de sprint.
- Décision journalisée dans `.memlog.md` de la spec et dans le journal du RUNBOOK.

## Vérification
Documents seulement, aucun changement du site : pas de construction ni de captures à faire.

## Ce qui reste
- Story 14.2 : spec v7 et AD dans le spine.
- Règlement du jeu à rédiger (JB, Anne) ; règles du réseau eXp sur les jeux à vérifier par Anne ; durée de conservation des inscrits non gagnants à fixer.
- Démarrage après le lancement public (story 12.4).
