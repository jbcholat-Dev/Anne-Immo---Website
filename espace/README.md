# Espace de travail d'Anne (`espace/`)

L'outil de travail privé d'Anne (capacité CAP-12 de la spec, décisions d'architecture AD-19 et AD-20), séparé du site public :
une mise en ligne du site ne peut pas le casser, et ses futures clés (Leedflow, story 13.10) ne sont jamais dans le programme qui répond au public.
Il lit et écrit **la même base des leads** que le site : une demande faite sur le site y apparaît aussitôt, sans copie.

## État (story 13.3, phase 1, 2026-10-15)

- **Ce qui existe** : la gestion des demandes, reprise à l'identique du `/gestion` du site (liste, recherche, fiche, relance d'un e-mail en échec, marque « recopiée dans Modelo », export et effacement RGPD). L'accueil `/` est la page « Aujourd'hui » depuis la story 13.5.
- **Ce qui change par rapport au site** : une relance d'e-mail est seulement programmée ; c'est la tâche planifiée du site qui l'envoie, dans les 15 minutes (l'espace n'a pas de clé d'envoi d'e-mails). Tout passe par `worker.ts`, même les feuilles de style et les polices : sans jeton Cloudflare Access valable, rien n'est servi (403).
- **Code partagé** : les pages importent le code serveur du site par l'alias `@site` (= `site/src`, réglé dans `astro.config.mjs` et les `tsconfig`), notamment `gestion-donnees.ts`, `rights.ts`, `acces.ts`, et le gabarit `Gestion.astro`. Rien n'est recopié. Polices et icônes sont copiées de `site/public` à chaque construction (`scripts/partage.mjs`, copies ignorées par Git).
- **Contacts (story 13.4, 2026-10-21)** : la base contient désormais une ligne par personne (`contact`), son historique et ses origines (boîtage, prescripteur) ; chaque demande du site y est rattachée par le site. Les listes d'étapes et de canaux sont dans `site/src/server/contacts.ts`, à réutiliser.
- **Ajouter, importer, contacts (story 13.7, 2026-10-21)** : `/ajouter` (un contact avec son origine obligatoire, un passage de boîtage), `/importer` (.xlsx ou .csv, aperçu puis enregistrement), `/contacts` et `/contacts/fiche`. Les écritures passent par `src/server/pipeline.ts`, la lecture des tableurs par `src/server/tableur.ts` (sans bibliothèque) ; gabarit `src/layouts/Espace.astro` (maquette v2). Un téléphone ou un e-mail déjà connu complète la fiche existante, jamais de doublon.
- **Qualifier (story 13.6, 2026-10-21)** : `/contacts/qualifier` : cinq réponses d'une touche et une suite obligatoire (rendez-vous daté, en sommeil avec réveil, perdu avec motif, pas joint avec rappel) ; étape, prochaine action et historique mis à jour par `qualifier` (`src/server/pipeline.ts`).
- **Aujourd'hui (story 13.5, 2026-10-21)** : `/` est la page d'ouverture : nouveaux contacts à qualifier (le plus ancien d'abord), rappels dus et en retard, réveils, prescripteurs à relancer, secteurs de boîtage à refaire (`journee`, `src/server/pipeline.ts`).
- **Bilan (story 13.13, 2026-10-21)** : `/bilan` : par canal, contacts, qualifiés, rendez-vous et mandats sur 7 jours, 4 semaines ou 3 mois, délai moyen de rappel, boîtage par secteur, motifs de perte ; recalculé depuis la base (`bilan`, `src/server/pipeline.ts`).
- **Prescripteurs (story 13.14, 2026-10-21)** : `/prescripteurs` et leur fiche : recommandés sur 12 mois, mandats issus, dernier contact, prochaine relance et sa raison, échange noté en un geste ; les relances dues remontent sur « Aujourd'hui ». Lecture des formulaires : `src/server/formulaires.ts`.
- **Acheteurs actifs (story 13.15, 2026-10-21)** : `/acheteurs` : acheteurs qualifiés avec budget, secteur et financement (demandés à la qualification), « aussi vendeur », communes cherchées et vendeurs en sommeil de la commune ; carte « j'ai un acheteur » sur « Aujourd'hui » dès deux acheteurs pour une commune.
- **Pipeline (story 13.16, 2026-10-21)** : `/pipeline` : vendeurs ou acheteurs en colonnes par étape ; déplacer une carte (glisser-déposer ou bouton) exige la prochaine action datée, la date de réveil ou le motif (`changerEtape`, `src/server/pipeline.ts`).
- **Leedflow (story 13.10, 2026-10-21)** : toutes les 10 minutes, la tâche planifiée de `worker.ts` relève les appels, messages vocaux, SMS et tâches de Leedflow (`src/server/leedflow.ts`, clé `LEEDFLOW_API_KEY`). Numéro connu = ligne dans l'historique avec le résumé. Numéro inconnu = proposé sur « Aujourd'hui » (créer ou écarter). Tâche = proposée comme prochaine action (accepter ou ignorer, `/api/leedflow/…`). L'état de la relève est en bas d'« Aujourd'hui ». Toucher un numéro inconnu ouvre `/inconnu` : nom lu dans Leedflow, résumés complets, tâches détectées (gardées puis proposées dès que le contact est créé). En local, `LEEDFLOW_URL` pointe vers une imitation de l'API (essai de bout en bout).
- **Phase 2 (à venir)** : quand l'espace sera en ligne et essayé par Anne, le site renverra `/gestion` vers l'espace et ce code passera dans `espace/src/server`.

## Lancer

```bash
cd espace
npm install            # une fois
npm run build          # construit l'espace dans espace/dist (base d'aperçu, sauf construction de main chez Cloudflare)
npm run check          # vérification des types (pages et Worker)
node scripts/e2e-espace.mjs   # essai de bout en bout, site et espace sur la même base locale (préalable en tête du fichier)
```

`npm run dev` sert l'espace en local, mais sans jeton Access tout répond 403 : pour regarder les pages, passer par l'essai de bout en bout, qui imite Access.

## Base et réglages

- `wrangler.jsonc` : Worker `anne-espace`, base `DB` (la base d'aperçu du site par défaut). `scripts/base.mjs` branche la base de production `anne-leads` pour les constructions de `main` chez Cloudflare, et seulement elles.
- Les **migrations** restent dans `site/migrations/` (un seul endroit, AD-10) et sont appliquées par la construction du site ; l'espace n'en applique jamais.
- `ACCESS_AUD` : identifiant de l'application Access « Espace d'Anne ». Vide = espace fermé à tous. Réglage : RUNBOOK § 4 sexies.
- Secret facultatif `LIEN_SECRET` : le même que celui du site ; sans lui, la fiche d'un diagnostic n'affiche pas le lien du rapport PDF.
