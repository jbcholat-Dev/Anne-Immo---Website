---
story: 13.15
epic: 13 — Espace de travail d'Anne
statut: done
date: 2026-10-21
maj: 2026-10-21
---

# Story 13.15 — Acheteurs actifs

## Objectif
Avoir sous la main les acheteurs qualifiés qui cherchent en ce moment, pour dire « j'ai un acheteur » aux propriétaires du même secteur : les acheteurs servent à trouver des vendeurs (maquette v2 écran 6, CAP-12 v7, recommandation « acheteurs = audience, vendeurs = client »).

## Ce qui est fait (2026-10-21)
- **Qualifier un acheteur** (page de la story 13.6) : quand le contact est un acheteur, ou n'a pas encore de parcours, un cadre « Ce qu'il ou elle cherche » ajoute le **budget**, le **secteur recherché** (communes) et le **financement** (vérifié, à vérifier, après sa vente). Ces champs sont gardés avec les réponses et affichés sur la fiche. Ils ne sont pas gardés pour un vendeur.
- **`/acheteurs`** (menu sur ordinateur, page Contacts sur téléphone) : les acheteurs qualifiés et actifs (ni perdus, ni en sommeil, ni passés à l'acte). Pour chacun : qui et depuis quand, ce qu'il cherche, son budget, son secteur, son financement. Ceux qui doivent d'abord vendre (réponse « un bien à vendre d'abord : oui », ou financement « après sa vente ») sont signalés **« Aussi vendeur »**.
- **« J'ai un acheteur »** : les communes cherchées, avec le nombre d'acheteurs. Un clic montre les **vendeurs en sommeil de cette commune**, avec Appeler.
- **Sur « Aujourd'hui »**, dès que deux acheteurs actifs cherchent la même commune, une carte « Lettre "j'ai un acheteur" à … » apparaît dans « Trouver des vendeurs cette semaine ».

## Écarts assumés
- Le secteur est une liste de communes écrite par Anne (« Anthy, Sciez ») ; la correspondance avec les vendeurs en sommeil se fait par le nom exact de la commune. Une carte des secteurs serait plus juste, mais elle n'est pas nécessaire tant qu'Anne travaille par commune.
- Le bouton « Préparer la lettre » de la maquette n'est pas construit : le modèle de lettre est à écrire avec Anne.
- L'offre « mandat de recherche » reste à décider à part (décision commerciale en attente) ; la page le rappelle.

## Ce qui est vérifié (2026-10-21)
- `espace` : `npm run build`, `npm run check` (18 fichiers, 0 erreur).
- `node scripts/e2e-espace.mjs` : **tous les constats bons**. Les nouveaux constats de cette story :
  - la qualification d'un acheteur demande budget, secteur et financement ;
  - rendez-vous → « Besoin défini », budget gardé ;
  - liste avec les critères et « aussi vendeur » pour celui qui doit vendre ;
  - commune cherchée par 2 acheteurs ;
  - vendeur en sommeil de la commune retrouvé ;
  - lettre proposée sur « Aujourd'hui » ;
  - pas de débordement sur téléphone ni sur ordinateur.

## Ce qui reste
- ~~JB : fusionner la PR #163~~ fusionnée le 2026-10-21.
- Anne et JB : décider de l'offre « mandat de recherche » et du modèle de lettre « j'ai un acheteur ».
