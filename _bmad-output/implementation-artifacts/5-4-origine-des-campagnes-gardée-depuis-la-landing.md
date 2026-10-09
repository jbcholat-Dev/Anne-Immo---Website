---
story: 5.4
epic: 5 — Diagnostic
statut: review
date: 2026-10-09
origine: demande de JB du 2026-10-09 (fil « Page diagnostic en page d'atterrissage ») — la landing doit servir de destination aux campagnes réseaux sociaux et e-mail
---

# Story 5.4 — L'origine des campagnes n'est plus perdue au premier clic

## Objectif
Qu'un contact venu d'une campagne (publication Facebook, e-mail…) arrive chez Anne avec le nom de la campagne qui l'a amené, comme le prévoit `structure-site.md` § 6 (« paramètres de campagne acceptés et transmis jusqu'au lead capté ») et AD-11 (décision d'architecture n° 11 : aucun traceur, les paramètres voyagent dans l'adresse).

## Constat
Les paramètres de campagne (`utm_source`, `utm_campaign`…, les étiquettes qu'on ajoute à la fin d'un lien de campagne) étaient bien lus par le parcours `/diagnostic/questions` et par les formulaires, et bien enregistrés avec le contact. Mais la landing `/diagnostic` ne les recopiait pas sur son bouton « Démarrer le diagnostic » : au premier clic ils disparaissaient. Vérifié le 2026-10-09 : arrivée sur `/diagnostic?utm_source=facebook&utm_campaign=test`, clic, adresse obtenue `/diagnostic/questions` sans rien.

## Ce qui est fait
- `site/src/pages/diagnostic/index.astro` : au-dessus du titre, une ligne « Anne Vial-Tissot · conseillère en immobilier, Chablais et Léman » avec son portrait en petit (44 px), sur ordinateur et téléphone. Retouche légère recommandée à JB le 2026-10-09 (carte de décision dans le fil), écart avec la maquette noté dans `site/README.md`.
- `site/src/pages/diagnostic/index.astro` : un petit script recopie les paramètres `utm_*` de l'adresse sur les liens de la page qui mènent au parcours, au guide et au contact. Les autres paramètres (par exemple `fbclid`, ajouté par Facebook) ne sont pas recopiés. Rien n'est déposé dans le navigateur.

## Vérification
- `npm run build` : réussi. `npm run check` : 0 erreur. `node scripts/liens.mjs` : 26 pages, 1 661 liens, 0 cassé.
- Navigateur (Playwright, sur le site construit) : arrivée sur `/diagnostic?utm_source=facebook&utm_campaign=vendeurs-oct&fbclid=x` → les deux boutons mènent à `/diagnostic/questions?utm_source=facebook&utm_campaign=vendeurs-oct`, la sortie basse à `/guide?utm_source=…`, les liens vers la confidentialité et la story restent inchangés ; après clic, l'adresse du parcours porte bien les deux paramètres. Sans paramètre, les liens restent `/diagnostic/questions`.
- Captures avant / après (téléphone 375 px, ordinateur 1 440 px) : `/mnt/project-files/captures/diagnostic/`. Sur téléphone, le bouton « Démarrer » reste visible sans défiler. `node scripts/ecrans.mjs` : aucun débordement ni bouton trop petit signalé.
- La suite (parcours → contact enregistré avec sa campagne → e-mail d'Anne qui affiche la campagne) existait déjà et est couverte par `scripts/e2e-diagnostic.mjs`.

## Ce qui reste
- Compter les visites et le taux de complétion par campagne : story 10.8 (mesure d'audience Cloudflare Web Analytics et événements du parcours), à faire avant la première campagne payante.
- Confirmation de JB sur la retouche du haut de page (sinon, retirer la ligne) ; revue de la page avec Anne (jamais revue en séance) ; version anglaise de la landing (epic 6) si des campagnes visent la clientèle anglophone.
