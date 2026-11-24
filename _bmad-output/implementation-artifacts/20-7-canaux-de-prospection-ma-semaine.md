# Story 20.7 : canaux de prospection, page « Ma semaine »

Epic 20 (la semaine et le bilan). Statut : done. Date : 2026-11-24. Origine : demande de JB du 2026-11-24 (fil « [Stratégie] Agent chief of staff à partir de Leedflow ») : « implémenter cette semaine les canaux de prospection pour qu'elle puisse dedans les renseigner, qu'on commence à avoir accès à des métriques concrètes », pour pousser Anne à l'adoption quotidienne de l'espace.

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

- **Modèles comptés au jour d'écriture** : un « Envoyé » noté avec une date passée compte au jour où il est noté ; annuler la note ne le retire pas du compte (revue de code 20.7, constat 12).
- **Chiffres passés modifiés par un effacement RGPD ou la purge** : effacer un contact retire ses demandes et ses envois, donc les leads et messages des semaines passées baissent. Voulu : l'effacement prime (constat 13).
- **Une personne par période** : deux demandes d'une même personne dans deux semaines d'un même mois font 2 leads en vue Semaine et 1 en vue Mois (constat 15).
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
- Après la revue de code (2026-11-24) : `npm run build` et `npm run check` de l'espace : 0 erreur ; `E2E_2007_SEUL=1` : 17 constats sur 17 (13 refus, dont `constructor` et `toString` ; campagne à un acheteur non comptée ; demande écartée et inscription ambassadeur non comptées ; demande du diagnostic en lead « diagnostic » ; en-tête hors bonus ; `?p=toString` et date lointaine ramenées à la semaine en cours ; saisie des objectifs gardée après un refus).
- Captures : `espace/.verif/espace-semaine-ordinateur.png`, `espace-semaine-telephone.png`.

## Revue de code

Revue du 2026-11-24, skill `bmad-code-review` en session neuve, commit relu 018d202 (PR n° 269). Rien de bloquant. Corrections dans le commit qui suit 018d202 (« revue de code 20.7 »).

1. Leads et rendez-vous du bonus comptés dans l'objectif : corrigé. L'en-tête compte les canaux suivis seulement ; bonus à part (`leadsBonus`, `rdvBonus`).
2. Chaque e-mail de campagne compté en message ambassadeur : corrigé. Seuls les modèles envoyés aux ambassadeurs comptent (même règle que le tableau des ambassadeurs). Choix par défaut, à confirmer par JB.
3. Leads du site mal classés et mal filtrés : corrigé. Demandes écartées et e-mails de portail illisibles exclus ; diagnostic et guide = lead « diagnostic », le reste « direct » ; une inscription ambassadeur n'est pas un lead (choix par défaut, à confirmer par JB).
4. `in` accepte `toString`, `constructor` : corrigé (`dansListe`, avec `Object.hasOwn`), deux refus de plus dans l'essai.
5. Messages notés deux fois : corrigé, phrase sous le champ avec le nombre déjà compté.
6. AD-33 pas amendée : corrigé, AD-33 réécrite sur place (un seul écrivain, colonnes à venir par `ALTER TABLE`).
7. Objectifs tapés perdus après un refus : corrigé.
8. « + Noter » ne se referme pas : corrigé, le bouton devient « Fermer ».
9. Titre dans un `summary` : corrigé, texte directement dans le `summary`.
10. Pas de date maximale : corrigé, borne à la fin de l'année prochaine.
11. Lecture complète de l'historique : corrigé en partie (pré-filtre `LIKE '%envoi_modele%'`, jointure contact) ; pas d'index ajouté : volume faible aujourd'hui.
12. Modèles comptés au jour d'écriture : écarté : le jour d'envoi réel est le jour d'écriture dans presque tous les cas ; noté dans les écarts.
13. Chiffres passés modifiés par un effacement RGPD ou une purge : écarté : voulu (le droit à l'effacement prime) ; noté dans les écarts.
14. Nom de personne dans le champ libre : corrigé, aide « Un lieu, pas le nom d'une personne ».
15. Dédoublonnage par période : écarté : voulu et documenté (« une personne par période ») ; dit à JB.
16. L'essai efface des données entières : corrigé, il ne retire que ce qu'il a écrit et remet les objectifs en place.

## Ce qui reste

- ~~Accord de JB, fusion~~ : PR n° 269 fusionnée par JB le 2026-11-24. Choix 2 et 3 de la revue à confirmer par JB (la migration 0026 part sur la base d'aperçu dès la poussée ; ajout de tables seulement).
- Anne essaie sur l'aperçu, retours.
- Suite : mandats et honoraires (vues Mois et Année), recalcul du lundi, brief (fil chief of staff).
