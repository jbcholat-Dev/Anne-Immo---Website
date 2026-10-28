---
story: 10.14
epic: 10 — Capture des leads et backend
statut: review
date: 2026-10-28
---

# Story 10.14 — Test A/B de la publicité : accueil ou question 1

## Objectif
Le 28 octobre 2026, JB et Anne se demandent si arriver directement sur la question 1 du diagnostic n'est pas trop brut pour un visiteur venu de la publicité. Ils envisagent de le faire arriver plutôt sur l'accueil, avec la vidéo, un visuel d'Anne et deux choix : le diagnostic ou l'estimation. JB a donné son accord (« ok », fil « Méthode d'analyse marketing ») pour un test A/B sur la publicité Meta B :
- la moitié du trafic garde le lien vers `/diagnostic/questions` ;
- l'autre moitié arrive sur l'accueil (`utm_content=video-1-accueil`).

Avant de lancer le test, le compteur de l'entonnoir (stories 10.12 et 10.13) doit suivre aussi l'accueil et la demande d'estimation. Il doit aussi garder la campagne d'une page à l'autre. Tout cela sans cookie ni donnée personnelle (AD-11). Lancement visé le jeudi 30 octobre.

## Ce qui est fait
- **Accueil** (`site/src/components/accueil/Hero.astro`) : l'arrivée est comptée (étape `accueil`), ainsi que le clic sur chacun des deux boutons (étape `clic`, précision `diagnostic` ou `estimation`).
- **Campagne gardée** (`garderCampagne`, `site/src/islands/entonnoir.ts`) : les paramètres utm de l'adresse sont recopiés sur les liens vers le diagnostic, ses questions, le guide et le contact, sur l'accueil comme sur la page du diagnostic (code de la story 10.12, mis en commun). Rien n'est déposé dans le navigateur : la campagne reste dans l'adresse. Effet de bord utile : une demande envoyée depuis le contact garde son origine.
- **Demande d'estimation** (`site/src/pages/contact.astro`) : étape `estimation`, avec quatre précisions :
  - `agenda` : le visiteur entre dans l'agenda Cal.com (la page perd le focus au profit du cadre de l'agenda ; on ne voit rien de ce qu'il y fait) ;
  - `formulaire` : premier caractère tapé dans le formulaire, pour un projet de vente seulement ;
  - `reservation` : rendez-vous réservé (événement `bookingSuccessfulV2` de Cal.com) ;
  - `demande` : formulaire de vente envoyé et accepté.
- **Serveur** (`site/src/server/entonnoir.ts`) : les nouvelles étapes et leurs précisions sont vérifiées ; toute autre valeur est refusée.
- **Base** : migration `0017-entonnoir-accueil-estimation.sql`. La table est refaite pour admettre les trois étapes, et toutes ses lignes et colonnes sont recopiées.
- **Lecture** (`espace/src/server/entonnoir.ts`, `espace/src/pages/bilan.astro`) : un tableau « Test A/B : accueil ou question 1 » campagne par campagne, avec ces colonnes :
  - entrées, soit le plus grand nombre entre arrivées sur l'accueil, sur la page du diagnostic et sur la question 1 ;
  - accueil, clic diagnostic, clic estimation, question 2 ;
  - estimation commencée, soit agenda touché ou formulaire de vente commencé, rendez-vous ou demande, une fois par passage ;
  - rendez-vous ou demande ;
  - objectif, soit question 2 + estimation commencée, la règle du fil Méthode ;
  - taux, soit objectif / entrées.

  Les mêmes chiffres sont dans `/api/claude/bilan`, champ `diagnostic.campagnes[].ab`.
- **Page Cookies** : dit ce qui est compté en plus.

## Limites assumées
- Des passages, pas des personnes. Un visiteur de la version « accueil » compte un passage sur l'accueil, puis un autre sur le diagnostic ou le contact. Quelqu'un qui atteint la question 2 puis commence une estimation compte deux fois dans l'objectif. Les deux versions sont mesurées de la même façon, la comparaison reste juste.
- Ce qui se passe dans l'agenda Cal.com n'est pas visible : seulement l'entrée dans le cadre et la réservation.
- Les visites sans campagne sur l'accueil sont aussi comptées, mais restent hors du tableau A/B.
- Entrées pas tout à fait symétriques : un départ avant le chargement du script n'est pas compté, et l'accueil (avec sa vidéo) est plus lourd que la question 1. À recouper avec les vues de la page de destination de Meta.
- Un visiteur qui passe par une autre page (Méthode, Vendre…) avant le diagnostic ou le contact perd sa campagne.

## Ce qui est vérifié (2026-10-28)
- `npm run check` (site et espace) : 0 erreur.
- Résultats des essais de bout en bout : voir « Revue de code » et la PR.

## Revue de code
2026-10-28, PR #216, commit fe29afc relu en session neuve (méthode `bmad-code-review` appliquée à la main). `npm run check` : 0 erreur.
1. Le formulaire de contact sert aussi aux acheteurs et aux simples messages : il gonflait « estimation commencée » de la version accueil. Corrigé : le formulaire ne compte que pour un projet de vente.
2. L'entrée dans l'agenda pouvait échapper au comptage sur Safari et Firefox. Corrigé : la vérification se fait juste après l'événement.
3. Un rendez-vous réservé ou une demande envoyée dont le premier geste avait échappé n'entraient pas dans l'objectif. Corrigé : les deux comptent comme estimation commencée, une fois par passage.
4. Entrées pas parfaitement symétriques entre les deux versions : l'accueil est plus lourd, et un rechargement compte une nouvelle arrivée. Noté dans la note du Bilan et ci-dessous ; à recouper avec les vues de la page de destination de Meta.
5. Un visiteur qui passe par une autre page (Méthode, Vendre…) avant le diagnostic perd sa campagne. Accepté et écrit (faible part attendue). La page du diagnostic recopie maintenant aussi la campagne sur les liens du menu.
6. Le tableau A/B s'affichait dès la moindre visite de l'accueil. Corrigé : seulement les campagnes venues par un lien suivi, et seulement si l'une est passée par l'accueil.
7. Plafond journalier partagé avec les visites de l'accueil. Écarté : quelques dizaines de visites par jour face à un plafond de 5 000.
8. Un visiteur qui reprend un ancien diagnostic garde sa première campagne (comportement de la story 10.12). Écarté : cas rare, choix déjà fait.
Correctifs : commit suivant fe29afc dans la même PR.

## Ce qui reste
- Revue de code, accord de JB, fusion. La migration 0017 s'applique à la construction.
- Après la mise en ligne : le fil de la campagne Instagram crée la version « accueil » de la publicité B.
