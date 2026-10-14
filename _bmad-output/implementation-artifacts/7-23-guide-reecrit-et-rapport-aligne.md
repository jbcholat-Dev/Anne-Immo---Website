---
story: 7.23
epic: 7 — Contenu d'Anne
statut: review
date: 2026-10-14
---

# Story 7.23 — Guide réécrit dans une voix moins « IA » et rapport du diagnostic aligné sur le guide

## Objectif
Le 2026-10-13, Anne a trouvé que le guide « sonnait IA » et avait retravaillé, sur le Drive, une ancienne version du texte (celle de Gamma, corrigée le 2026-10-05). Comparaison faite (fil « Guide des 10 erreurs ») : sa version est plus ancienne que le guide en ligne du 2026-10-10 et réintroduit des chiffres sans source. Décision de JB du 2026-10-14 : garder le guide actuel mais le réécrire avec le skill Humanizer, et corriger les chiffres du rapport PDF du diagnostic, restés ceux de l'ancien guide.

## Ce qui est fait
- `contenu-anne/guide/texte-actuel.md` réécrit (skill Humanizer) : moins de formules toutes faites (« Mauvaise nouvelle », « Attention danger », « Pas X, mais Y », chaînes de « = », triades), moins d'intertitres en gras (« La réalité. », « La solution. »), phrases plus directes, conclusion sans slogan. Rien d'autre ne change : mêmes 10 erreurs dans le même ordre (erreur n° N = question qN du diagnostic), mêmes chiffres, mêmes sources (1 à 7), mêmes 5 ventes réelles et liens. Vérifié par comparaison automatique : aucun nombre du texte n'a disparu ni n'a été ajouté.
- `contenu-anne/guide/rapport-diagnostic.md` : les recommandations reprennent le guide. Retirés car sans source : « 4 mois de plus », « 5 % maximum au-dessus », « 15 à 20 % d'écart des estimateurs », « 300 à 600 € » de diagnostics, « DPE 10 ans » (faux pour un DPE d'avant juillet 2021), « 3 secondes », « 15 à 20 photos », « 300 à 500 € » de photographe, « 0 à 500 € » de home staging, « 4 à 5 sites », « 2 fois plus vite », « 2 à 3 heures », « page 3, 4, 5 », « mercredi ou jeudi soir », seuils chiffrés des indicateurs, « 20 à 30 heures ». Ajoutés, sourcés comme dans le guide : marge de 5,1 % (Laforêt), DPE caducs depuis 2025 et décote de 25 % d'une maison G (notaires), un compromis sur dix retombé fin 2022 (PAP), délai moyen de 101 jours (Laforêt). Logic-Immo et Instagram retirés de la liste des portails, comme dans le guide.
- PDF refaits : `site/prive/guide.pdf` (`node scripts/guide-pdf.mjs`, 16 pages comme avant) et gabarit du rapport (`node scripts/rapport-gabarit.mjs` : `prive/rapport/gabarit.pdf`, `src/server/rapport-gabarit.json`). Couverture du guide inchangée.

## Vérification
- `npm run build` (avec la clé Turnstile d'essai) : terminé sans erreur.
- `npm run check` : 0 erreur.
- `node scripts/e2e-rapport.mjs` : tous les constats bons (deux vendeurs, PDF de 8 pages lus, aucun texte superposé, médiane 51 ms).
- `node scripts/e2e-guide.mjs` : tous les constats bons.
- `node scripts/liens.mjs` : 27 pages, 1863 liens, 0 cassé.
- Pages du rapport regardées (`.verif/rapport/Claire-3.png`) : recommandations lisibles, pas de débordement.

## Ce qui reste
- Anne relit le guide réécrit.
- Les encarts « Impact chiffré » et les constats du diagnostic (`site/src/content/diagnostic/feedbacks.json`, affichés sur la page de résultats et dans le rapport) gardent des chiffres sans source (« 15-25 % », « délai multiplié par 3 », « 10-20 appels »…). Question posée à JB le 2026-10-14.
