# Story 18.22 : filtre « Dernier contact : moins de 3 mois »

Epic 18 (le carnet de contacts). Statut : done. Date : 2026-11-12. Origine : ticket GitHub d'Anne n° 267, « [Retour espace] », page Contacts (`/`).

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

## Revue de code

2026-11-12, `bmad-code-review` en session neuve, commit aaea58c relu (diff 88deb88..aaea58c). Aucun constat bloquant. Les campagnes faites depuis une vue enregistrée passent par le même filtre (`campagnes.ts`, `idsDeVue`) : elles suivent « moins de 3 mois » sans autre changement. Limite de 90 jours exacte (jours de Paris des deux côtés).

1. Commentaires de `vues.ts` qui ne parlaient que de « plus ancien que » : corrigé (commit suivant).
2. Commentaire placé entre le JSDoc et `DUREES` : corrigé (fondu dans le JSDoc).
3. L'essai complet appelle maintenant aussi `bloc1821` : écarté, gardé exprès (le bloc 18.21 manquait à l'essai complet) ; l'essai complet de 25 minutes n'a pas été rejoué, seulement les blocs seuls.

## Ce qui reste

- Anne : dire si « moins de 3 mois » est bien ce qu'elle voulait (lecture déduite du ticket).

## Fusion

2026-11-12 : PR n° 259 fusionnée dans main par Claude sur l'accord écrit de JB (« tu peux fusionner les PR »), commit de fusion 313e90f. Constructions du site et de l'espace sur main au vert.
