# Story 13.12 : Parcours d'Anne pour trouver et qualifier des contacts

Epic 13 (espace de travail d'Anne, CAP-12). Statut : fait (2026-10-21).

## Objectif

Avant de construire les écrans de l'espace (13.4 à 13.7), repasser par les parcours réels d'Anne, centrés sur son défi n° 1 : générer des contacts vendeurs et les qualifier vite. Demande de JB du 2026-10-16 (« il faut faire les choses bien et repasser par une phase de user journey ») : la maquette sert surtout le suivi, pas la prospection.

## Ce qui est fait

- Document de travail « Espace d'Anne : parcours pour trouver et qualifier des contacts » (Claude Doc, modifiable par JB et Anne) : https://claude.ai/code/artifact/aa078d45-822d-41c6-856a-c5fd674bad61
  - les personnes : Anne et cinq types de contacts (vendeur du cœur de marché, vendeur « de vie », frontalier qui monte en gamme, acheteur des portails, prescripteur) ;
  - parcours 1 « trouver » : six canaux, où chacun perd des contacts, ce que l'espace pourrait faire ;
  - parcours 2 « qualifier » : schéma signal → rappel → cinq questions → rendez-vous, sommeil daté ou perdu ;
  - parcours 3 « entretenir » : sommeil daté, prétexte d'appel, liste d'acheteurs actifs ;
  - conséquences proposées : fiche de qualification de 2 minutes, origine précise et bilan du lundi par canal, suivi des prescripteurs, liste d'acheteurs actifs ; ne pas faire de score automatique ni d'envoi depuis l'espace ;
  - guide d'entretien de 45 minutes avec Anne (13 questions).
- 2026-10-21 : JB valide le parcours et demande une nouvelle maquette pour valider le concept. Maquette v2 « Espace d'Anne v2 : trouver et qualifier » : https://claude.ai/artifact/RKkZ5qPnxdkwaDz4drrZLs. Six écrans : Aujourd'hui (téléphone, nouveaux contacts à rappeler en tête avec le temps écoulé, rappels avec raison d'appeler, prospection de la semaine), Qualifier en 2 minutes (téléphone, cliquable : cinq questions préremplies par Leedflow, issue rendez-vous / sommeil daté / perdu avec motif), Ajouter un contact ou un passage de boîtage (origine précise obligatoire), Bilan du lundi (par canal : contacts, qualifiés, rendez-vous, mandats ; boîtage par secteur ; motifs de perte), Prescripteurs, Acheteurs actifs (« j'ai un acheteur »). Chiffres et noms fictifs. L'ancienne maquette (https://claude.ai/artifact/8NqsmX6NrTpaTwbdXqxUy6) reste en référence pour le pipeline et la fiche.
- Sources : SPEC CAP-12, mémoire de stratégie commerciale (études du 5 au 11 octobre), réponses de JB du 2026-10-09. Tout ce qu'Anne n'a pas dit est marqué comme hypothèse.

## Ce qui est vérifié

- Relecture du schéma du parcours 2 sur rendu (aucun texte coupé).
- Aucun code changé.

## Ce qui reste

2026-10-21 : JB valide la maquette v2 (« C'est parfait, let's go ») et lance la construction sans attendre l'entretien avec Anne. Spec v7 (CAP-12 amendée), stories 13.4 à 13.7 réécrites, stories 13.13 à 13.16 ajoutées. L'entretien avec Anne reste utile : ses retours ajusteront les stories suivantes (action J43).

Liste d'origine :

1. JB relit le document et corrige.
2. JB mène l'entretien avec Anne (guide dans le document) et transmet les notes.
3. Claude met à jour les parcours, la maquette v2 et les stories 13.4 à 13.7 ; nouvelles stories probables : bilan par canal, prescripteurs.
4. JB et Anne valident la maquette revue.

Recommandation (non encore décidée par JB) : pas de construction des écrans 13.4 à 13.7 avant l'entretien ; 13.8 (portails) et 13.10 (Leedflow) peuvent avancer, utiles quel que soit le résultat.
