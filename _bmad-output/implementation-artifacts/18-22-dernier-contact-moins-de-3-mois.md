# Story 18.22 : filtre « Dernier contact : moins de 3 mois »

Epic 18 (le carnet de contacts). Statut : review. Date : 2026-11-12. Origine : ticket GitHub d'Anne n° 267, « [Retour espace] », page Contacts (`/`).

## Objectif

- **Ticket n° 267** : « Dans la colonne "Dernier contact" rajouter moins de 3 mois. »
- Lecture retenue (déduite, le ticket ne le précise pas) : un choix « Moins de 3 mois » dans le filtre « Dernier contact » de la page Contacts, qui garde les contacts recontactés dans les 90 derniers jours. Les choix existants (« Jamais recontacté », « Plus d'un mois », « Plus de 3 mois »…) restent.

## Ce qui est fait

- `espace/src/server/vues.ts` : `DUREES` gagne `{ jours: -90, libelle: 'moins de 3 mois' }`, en premier. Un nombre négatif se lit « moins de N jours ». Le vocabulaire des vues accepte 1 à 3 650 jours, positif ou négatif (0 refusé). Le filtre garde, pour un nombre négatif, les contacts dont le jour de Paris du dernier contact est au plus N jours avant aujourd'hui ; un contact jamais recontacté est exclu. La pastille dit « Dernier contact : moins de 3 mois ».
- La page (`index.astro`) n'a pas changé : la liste du filtre lit `DUREES`.
- Aucune migration, aucun changement de la base.
- `espace/scripts/e2e-espace.mjs` : bloc `bloc1822` (lancé seul avec `E2E_1822_SEUL=1`) ; l'essai complet lance maintenant aussi `bloc1821` et `bloc1822` (le bloc 18.21 n'y était pas appelé).

## Ce qui est vérifié

- `espace` : `npm run build` et `npm run check` : 0 erreur.
- `E2E_1822_SEUL=1 node scripts/e2e-espace.mjs` : 4 constats sur 4 (vue « -90 » acceptée, 0 et -4000 refusés ; liste du filtre ; « moins de 3 mois » ne garde que le contact d'il y a 10 jours, pas celui d'il y a 200 jours ni le jamais contacté ; « plus de 3 mois » inchangé, sans erreur JavaScript). La dernière ligne « 1 échec(s) » est l'arrêt voulu du mode bloc seul.

## Ce qui reste

- Revue de code (`bmad-code-review`, session neuve).
- Anne : dire si « moins de 3 mois » est bien ce qu'elle voulait (lecture déduite du ticket).
