---
story: 13.14
epic: 13 — Espace de travail d'Anne
statut: done
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.14 — Prescripteurs

## Objectif
Suivre ceux qui envoient des vendeurs à Anne (notaires, conseillers en patrimoine, anciens clients) et savoir quand les relancer, pour faire grandir son meilleur canal (maquette v2 écran 5, CAP-12 v7).

## Ce qui est fait (2026-10-21)
- **`/prescripteurs`**, depuis le menu sur ordinateur et depuis la page Contacts sur téléphone. Pour chacun :
  - le nom, le rôle et la commune ;
  - les **recommandés sur 12 mois** ;
  - les **mandats** qui en sont issus (un contact recommandé qui a atteint une étape de mandat) ;
  - le dernier contact (« Jamais » s'il n'y en a pas) ;
  - la **prochaine relance** (« En retard », « Cette semaine » ou sa date) avec sa raison.

  Les relances dues viennent en tête. Un formulaire ajoute un nouveau prescripteur, avec sa première relance (aujourd'hui, « Premier rendez-vous de présentation », par défaut).
- **`/prescripteurs/fiche`** :
  - **« Je l'ai vu ou appelé aujourd'hui »** : le dernier contact passe à aujourd'hui ; la prochaine relance est fixée dans 1, 3 ou 6 mois ou à une autre date, avec sa raison ; une note facultative est ajoutée, datée, aux notes ;
  - les contacts qu'il a recommandés et leur étape ;
  - ses coordonnées, modifiables, et le bouton Appeler.
- **Sur « Aujourd'hui »**, une relance due apparaît dans « Trouver des vendeurs cette semaine », avec un lien vers la fiche. Elle en sort dès que l'échange est noté.
- Un prescripteur saisi avec un contact recommandé (story 13.7) arrive ici avec son dernier contact à la date de saisie.

## Écart assumé
- L'encart « À démarcher : les 7 offices notariaux de Thonon » de la maquette n'est pas construit : c'est une liste à fournir par Anne, pas un calcul. On peut l'ajouter quand elle aura choisi sa cible.

## Ce qui est vérifié (2026-10-21)
- `espace` : `npm run build`, `npm run check` (17 fichiers, 0 erreur).
- `node scripts/e2e-espace.mjs` : **tous les constats bons**. Les nouveaux constats de cette story :
  - 2 recommandés sur 12 mois et 0 mandat, relance « cette semaine » avec sa raison ;
  - un recommandé passé en mandat compte 1 mandat ;
  - échange noté : dernier contact aujourd'hui, relance dans 3 mois, raison et note ;
  - le prescripteur sort de « Aujourd'hui » ;
  - ajout depuis la liste, téléphone rangé au format international ;
  - refus d'un prescripteur sans nom ;
  - la fiche liste ses recommandés ;
  - pas de débordement des deux pages sur téléphone ni sur ordinateur.

## Ce qui reste
- ~~JB : fusionner la PR #163~~ fusionnée le 2026-10-21.
- Anne : saisir ses prescripteurs actuels.
