# Story 20.7 : canaux de prospection, page « Ma semaine »

Epic 20 (la semaine et le bilan). Statut : review. Date : 2026-11-24. Origine : demande de JB du 2026-11-24 (fil « [Stratégie] Agent chief of staff à partir de Leedflow ») : « implémenter cette semaine les canaux de prospection pour qu'elle puisse dedans les renseigner, qu'on commence à avoir accès à des métriques concrètes », pour pousser Anne à l'adoption quotidienne de l'espace.

## Objectif

Anne note, canal par canal, ce qu'elle fait (l'effort), les leads et les rendez-vous obtenus, et voit chaque jour où elle en est face à l'objectif. JB et le futur chief of staff lisent ces chiffres (totaux seulement).

Constat de départ (bilan de l'espace, 30 jours au 2026-11-24) : 1 contact arrivé, 0 rendez-vous noté.

Références suivies, sans réinventer :
- spec `/mnt/project-files/strategie/priestley/spec-objectifs-hebdo-par-canal.md` (canaux, objectifs de départ, types de lead, site et portails en bonus, arrondi au-dessus) ;
- mise en page : schéma 1 « accueil de l'espace » de la page Priestley (https://claude.ai/artifact/UxifDiuBNeQjvPMEHpFz2p) et écran Accueil du canevas de l'espace dans la charte d'Anne (https://claude.ai/artifact/FUmUuJZTnjf3pG7HJWXH7Z, 2026-11-09) : rendez-vous en haut, leads, canaux côte à côte reliés par des pointillés, « 3 sur 6 · 50 % » avec barre, choix Année · Mois · Semaine, ligne « Bonus, hors objectif ».

Cette story passe avant 20.1 à 20.6 (semaine en créneaux, glisser-déposer), qui restent à faire : elle donne les chiffres tout de suite, sans calendrier.

## Ce qui est fait

- **Base** : `site/migrations/0026-canaux-de-prospection.sql`, trois tables neuves, aucune table existante touchée : `prospection_effort` (canal, jour, quantité, précision), `resultat` (lead, rendez-vous ; canal, type de lead direct ou diagnostic, jour, quantité ; AD-33 amendée par AD-36), `prospection_objectif` (objectifs réglés). Canaux vérifiés par le code (AD-35). Aucune donnée personnelle (pas de colonne contact).
- **`espace/src/server/prospection.ts`** (seul écrivain de ces tables) : canaux Boîtage (flyers, 1 500), Cartes ambassadeur (10), Messages ambassadeur (20), Réseaux sociaux (publications, 7), Opérations en magasin (pas d'objectif de départ) ; hors canaux : Site et portails, Autre. Objectifs de départ : 3 rendez-vous et 3 leads par semaine. Mois = semaine × 46/12, année = semaine × 46, arrondis au-dessus (à la centaine au-dessus dès 1 000). Semaines et jours en heure de Paris.
- **Rien à saisir deux fois** : des flyers notés ici écrivent un passage du tableau du boîtage (`ajouterBoitage`, ville obligatoire) ; les modèles envoyés depuis l'espace (`envoi_modele`, story 18.18) comptent d'office dans les messages ; chaque demande reçue du site ou d'un portail (file « Nouveaux ») compte d'office comme un lead hors objectif, une fois par personne et par période.
- **Page `/semaine`** (« Ma semaine », premier lien de la barre du haut) : la pile du schéma 1, chaque canal avec « + Noter » (quoi : effort, lead ou rendez-vous ; combien ; quel jour ; ville pour le boîtage ; type de lead), sans JavaScript (formulaires, 303, message). Tableau « Hors canaux » (+ 1 lead, + 1 rendez-vous), liste repliée « Ce qui a été noté » avec « Retirer » (un passage de boîtage renvoie au tableau du boîtage), objectifs réglables (repliés). Périodes : `?p=semaine|mois|annee&s=AAAA-MM-JJ`, flèches précédente / suivante.
- **Accès de Claude** : `/api/claude/bilan` renvoie `prospection.semaine` et `prospection.precedente` (`?s=` choisit la semaine) : objectifs, effort, part automatique, leads, rendez-vous par canal ; ni compte, ni ville, ni précision. `claude-espace.mjs bilan semaine 2026-11-23`. La page elle-même reste fermée au badge de Claude (worker.ts).
- Essai : bloc `bloc2007` de `espace/scripts/e2e-espace.mjs` (`E2E_2007_SEUL=1`), aussi appelé par l'essai complet.

## Écarts assumés

- **5e canal « Opérations en magasin »** : cité par JB le 2026-11-24, absent du schéma 1 (4 canaux). Pas d'objectif de départ.
- **Vues Mois et Année sans mandats, ventes ni honoraires** (le canevas les montre) : l'espace ne compte pas encore les mandats ni les honoraires (13.35, 20.5). Story suivante.
- **Objectif de l'année = 3 × 46 = 138 rendez-vous**, pas 105 : les objectifs se règlent à la semaine, arrondis au-dessus (règle de JB, la marge absorbe les mandats perdus, spec Priestley).
- **Pas de recalcul du lundi avec les taux mesurés** (spec, « calcul du lundi ») : objectifs fixes réglables, en attendant 12 semaines de mesures.
- **Pas de colonne « À faire aujourd'hui » ni « En chiffres »** à droite (canevas) : sujet du brief du fil chief of staff.
- **Rendez-vous comptés seulement s'ils sont notés ici** : les dates R1 des fiches et les nombres R1 du tableau du boîtage (18.20) ne sont pas additionnés, pour ne pas compter deux fois.

## Ce qui est vérifié

- `site` : `npm run build` (clé Turnstile d'essai) et `npm run base:local` : migration 0026 appliquée sur la base locale.
- `espace` : `npm run build` et `npm run check` : 0 erreur.
- `E2E_2007_SEUL=1 node scripts/e2e-espace.mjs` (2026-11-24) : 16 constats sur 16 : efforts, boîtage écrit dans le tableau du boîtage, leads et rendez-vous par canal, 11 saisies invalides refusées sans écriture, modèle envoyé compté dans les messages (jour de Paris), deux demandes du site d'une même personne = un lead, formulaire sans JavaScript (ville pour les flyers, type pour un lead), « Retirer », objectifs réglés, vues Mois et Année (× 46/12, × 46), accès de Claude en nombres seulement, page fermée au badge de Claude, pas de débordement à 1440 px et 390 px, aucune erreur JavaScript. La dernière ligne « 1 échec(s) » est l'arrêt voulu du mode bloc seul. L'essai complet (≈ 25 min) n'a pas été rejoué.
- Captures : `espace/.verif/espace-semaine-ordinateur.png`, `espace-semaine-telephone.png`.

## Revue de code

(à faire en session neuve avant de proposer la PR à JB)

## Ce qui reste

- Revue de code, PR, accord de JB, fusion (la migration 0026 part sur la base d'aperçu dès la poussée ; ajout de tables seulement).
- Anne essaie sur l'aperçu, retours.
- Suite : mandats et honoraires (vues Mois et Année), recalcul du lundi, brief (fil chief of staff).
