---
story: 13.35
epic: 13 — Espace de travail d'Anne
statut: a-valider
date: 2026-10-31
maj: 2026-10-31
---

# Story 13.35 — Pilotage commercial dans l'espace (objectif de l'année et actions de la semaine)

## Objectif
Demande de JB (2026-10-31, fil « [Stratégie] Atelier 10x ») : rapprocher la page de pilotage commercial (https://claude.ai/artifact/CrHkrvdn4PRBmN4q3APBZT) de l'espace d'Anne, où elle devra être intégrée. Anne doit voir au même endroit ce qu'elle vise sur l'année, où elle en est, et si elle a fait ses actions de la semaine. Rien n'est construit sans l'accord de JB.

## Ce qui existe
- **Page de pilotage (artefact)** : l'objectif 2027 de 250 000 € d'honoraires est remonté en entonnoir. Avec 27 500 € par vente et des taux de 25 % (contact → rendez-vous, hypothèse), 50 % (rendez-vous → mandat) et 90 % (mandat → vente), cela donne 10 ventes, 12 mandats, 23 rendez-vous vendeurs et 92 contacts. Elle suit aussi six actions par semaine avec un bouton +1 : anciens clients 5/sem., créneau de 90 min 3/sem., boîtage ciblé 1/sem., vidéo 1/sem., animation en magasin 1/mois, dîner 1/trimestre. Données : document `plan/courant` et collection `journal`.
- **Espace** : le Bilan compte déjà, sans saisie, les contacts, qualifiés, rendez-vous et mandats par canal et par période (story 13.13), et ce que chaque canal a coûté (13.17). La page Prospection liste les actions marketing.
- **Stratégie** : `/mnt/project-files/strategie/carte-strategique-10x.md` (deux paris, bouche-à-oreille organisé et digital vers le diagnostic, jugés fin avril 2027 sur le coût d'un rendez-vous vendeur pour un bien de plus de 550 000 €).

## Proposition
1. **En tête du Bilan, l'objectif de l'année** : une bande « 2027 : 250 000 € » avec l'entonnoir visé et le réalisé à date (contacts vendeurs, rendez-vous, mandats exclusifs, ventes, honoraires), le réalisé compté depuis la base comme le reste du Bilan. Plus rien à saisir à la main côté résultats.
2. **Les actions de la semaine sur la page Prospection** : les six actions avec leur cible et un +1, et une seule ligne résumée sur « Aujourd'hui » (par exemple « Cette semaine : 3 anciens clients sur 5 »), pour respecter la règle « moins mais mieux ».
3. **Les honoraires d'une vente** : un montant facultatif demandé quand un contact passe en « Vendu », pour que le chiffre d'affaires réalisé se calcule seul.
4. **Les hypothèses** (objectif, honoraires moyens, taux) se règlent dans l'espace, sur la même page que l'objectif.
5. **Reprise** : le journal de la page de pilotage est recopié dans la base au moment de la bascule ; la page reste l'outil d'ici là.

Ordre de travail : dessiner d'abord dans la maquette v4 (story 13.34), avec la refonte « moins mais mieux », puis construire après validation.

## Ce que ça demande techniquement
- Deux tables dans la base partagée (une migration) : le plan de l'année (objectif, hypothèses, actions et cibles) et le journal des actions faites (action, quantité, date).
- Une colonne « honoraires » sur le contact, remplie au passage en « Vendu ».
- L'accès de Claude (`/api/claude/bilan`) peut renvoyer l'avancement de l'objectif, sans aucune coordonnée de contact.

## Questions ouvertes
- Les rendez-vous et mandats comptent-ils seulement pour les biens de plus de 550 000 € (le critère des paris) ? L'espace ne connaît pas encore la valeur du bien ; un champ « prix estimé » serait à ajouter.
- Qui coche les actions : Anne seule, ou JB aussi ?

## Ce qui reste
- Accord de JB sur la proposition, puis maquette, puis construction.
