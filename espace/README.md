# Espace de travail d'Anne (`espace/`)

L'outil de travail privé d'Anne (capacité CAP-12 de la spec, décisions d'architecture AD-19 et AD-20), séparé du site public :
une mise en ligne du site ne peut pas le casser, et ses futures clés (Leedflow, story 13.10) ne sont jamais dans le programme qui répond au public.
Il lit et écrit **la même base des leads** que le site : une demande faite sur le site y apparaît aussitôt, sans copie.

## État (story 13.3, phase 1, 2026-10-15)

- **Ce qui existe** : la gestion des demandes, reprise à l'identique du `/gestion` du site (liste, recherche, fiche, relance d'un e-mail en échec, marque « recopiée dans Modelo », export et effacement RGPD). L'accueil `/` renvoie vers `/gestion` en attendant la page « Aujourd'hui » (story 13.5).
- **Ce qui change par rapport au site** : une relance d'e-mail est seulement programmée ; c'est la tâche planifiée du site qui l'envoie, dans les 15 minutes (l'espace n'a pas de clé d'envoi d'e-mails). Tout passe par `worker.ts`, même les feuilles de style et les polices : sans jeton Cloudflare Access valable, rien n'est servi (403).
- **Code partagé** : les pages importent le code serveur du site par l'alias `@site` (= `site/src`, réglé dans `astro.config.mjs` et les `tsconfig`), notamment `gestion-donnees.ts`, `rights.ts`, `acces.ts`, et le gabarit `Gestion.astro`. Rien n'est recopié. Polices et icônes sont copiées de `site/public` à chaque construction (`scripts/partage.mjs`, copies ignorées par Git).
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
