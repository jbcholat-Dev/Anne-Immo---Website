---
story: 13.30
epic: 13 — Espace de travail d'Anne
statut: ready-for-dev
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.30 — Fiche contact repensée (tickets #176 et #182)

## Objectif
Deux tickets d'Anne du 2026-10-24 sur `/contacts/fiche`, transmis par le fil [Tickets] :
- **#182** : « Rajouter 1/ Degré de maturité 2/ Visites 3/ Dernier contact 4/ Prochaine action, et rajouter en bas un pavé Synthèse avec toutes les informations collectées lors des échanges (à reprendre de synthèse IA dans Leedflow). Dans "Historique" mettre uniquement les dates avec objet (ex : appel ou visite) et obtenir le détail en cliquant dessus. »
- **#176** : « S'inspirer de Modelo pour remplir les critères de recherche des prospects. Très important : fiche synthèse finale avec les éléments renseignés seulement. »

## Ce qui est déjà couvert
- Le pavé Synthèse repris de Leedflow, modifiable par Anne, est la story 13.25 (PR n° 187). Reste à décider s'il va en tête (choix actuel, demande de JB) ou en bas (ticket #182).

## Ce qu'il faut
- **En-tête de la fiche** : degré de maturité (à définir avec Anne : par exemple « Découverte, Réfléchit, Prêt à signer »), nombre de visites (acheteur) ou de rendez-vous, date du dernier contact (dernier appel, SMS, visite ou note), prochaine action et sa date.
- **Historique replié** : une ligne par événement, date et objet seulement (« Appel », « Visite », « Note », « Étape »), le détail s'ouvre en touchant la ligne.
- **Critères de recherche acheteur** sur le modèle du formulaire de Modelo (aujourd'hui `RECHERCHE_ACHETEUR` n'a que budget et secteur, `espace/src/server/pipeline.ts`). La liste des critères attend une capture du formulaire acheteur de Modelo, demandée à JB par le fil [Tickets].
- **Fiche de synthèse finale** : n'afficher que les champs renseignés.

## Questions ouvertes
- Liste des critères Modelo (capture attendue de JB).
- Échelle du degré de maturité (à valider par Anne).
- Synthèse en tête ou en bas.

## Ce qui reste
- À construire (fil « [Site] Espace de travail d'Anne ») après la 13.24, une fois la liste des critères Modelo reçue.
