---
story: 10.10
epic: 10 — Capture des leads et backend
statut: review
date: 2026-10-10
---

# Story 10.10 — Rapport PDF personnalisé du diagnostic

## Objectif
Le vendeur qui a fait le diagnostic télécharge un rapport PDF à son nom : ses scores, le constat de chaque axe et les recommandations tirées des 10 erreurs du guide, celles de ses points faibles en tête. C'est le « plan d'action personnalisé » qu'annonce déjà le bouton de la sortie B (`feedbacks.json`). Critères : `_bmad-output/planning-artifacts/epics.md`, story 10.10 ; amendement AD-5 / AD-8 du 2026-10-10 dans le spine d'architecture.

## Décisions prises (JB, 2026-10-10)
- Rapport PDF à la place de résultats limités à 24 heures dans le navigateur ; recommandations présentes pour chaque axe, quel que soit le score.
- Le diagnostic a 3 axes, pas 4 : « Visibilité & Attractivité » en est un seul.
- Chaque question du diagnostic correspond à une erreur du guide (depuis le 2026-10-10 au soir, les erreurs du guide sont rangées dans l'ordre des questions, PR n° 80 : la question qN renvoie à l'erreur n° N ; auparavant q01 → 9, q02 → 3, q03 → 8, q04 → 2, q05 → 1, q06 → 5, q07 → 4, q08 → 6, q09 → 7, q10 → 10) : la recommandation montre la réponse du vendeur et ses points, et porte « En priorité » (moins de la moitié des points), « À améliorer » ou « Point solide ». Page « Par où commencer » : les priorités, dans l'ordre.
- Fabrication proposée : pages préparées à la construction, complétées par le serveur au téléchargement (voir l'amendement d'architecture) ; lien signé valable 7 jours, sur la page de résultats et dans l'e-mail du résumé.

## Retour de JB (2026-10-10, 19 h)
- Maquette validée : « Et pour les rapports PDF, c'est super. » Branchement réel lancé le jour même.

## Ce qui est fait
- `contenu-anne/guide/rapport-diagnostic.md` : introduction, 10 recommandations (une par question, tirées du guide), conclusion. Statut brouillon, à relire par Anne.
- `site/scripts/rapport-gabarit.mjs` : met en page à la charte toutes les pages possibles (3 couvertures, page des priorités, 3 niveaux par axe, 2 suites : 21 pages, 178 Ko) dans `site/prive/rapport/gabarit.pdf`, et note la position des emplacements à remplir dans `site/src/server/rapport-gabarit.json`, avec une empreinte de ses sources. S'arrête si un texte déborde d'une page.
- `site/src/server/rapport.ts` : assemble le rapport d'un vendeur avec pdf-lib (pages de son profil et de ses niveaux, nom, date, scores, barres, étiquettes « En priorité » / « À améliorer » / « Point solide », réponses en clair, liste des priorités, pied de page numéroté). Polices Gilda Display et Jost en TTF dans `site/prive/polices/`.
- `site/src/server/liens.ts` : `lienRapport` / `verifierRapport`, lien signé de 7 jours, préfixe distinct du guide.
- `site/src/pages/api/diagnostic/rapport.ts` : sert le PDF (nom de fichier sans accent, pas de cache, pas d'indexation) ; 404 sinon ; journal `rapport_telecharge`.
- Page de résultats : encart « Votre rapport personnalisé » et bouton « Télécharger mon rapport » ; texte de la page expirée qui renvoie à l'e-mail.
- E-mail du résumé : bouton « Télécharger mon rapport (PDF) » et « valable 7 jours » à la place de la phrase des 24 heures (ancienne phrase gardée sans secret).
- `site/scripts/e2e-rapport.mjs` : essai de bout en bout. La maquette `maquette-rapport.mjs` est retirée (remplacée par le vrai rapport).

## Ce qui est vérifié
- `node scripts/e2e-rapport.mjs` : 19 constats bons. Deux vendeurs (Claire, profil à risque, sortie B, 10 priorités ; Marc, profil préparé, sortie A, aucune priorité) : bouton et lien de 7 jours sur la page de résultats, e-mail du résumé avec le bouton du rapport, PDF de 8 pages lu par `pdftotext` (nom, date, score, pied « n / 8 », réponses), 404 pour un lien modifié, expiré, signé pour le guide, d'un lead inconnu ou vide. Images des pages relues (couverture, axe).
- Temps de fabrication sur le serveur local : 60 à 75 ms par rapport. Taille du Worker : 1,19 Mo compressé.
- Non-régression : `e2e-diagnostic` 31, `e2e-guide` 38, `e2e-formulaires` 25 constats bons ; `maquette-emails` tous bons ; `npm run check` 0 erreur ; `npm run build` sans erreur ; `node scripts/liens.mjs` 26 pages, 1661 liens, 0 cassé.

- Numéros d'erreur du guide alignés sur l'ordre des questions (demande de JB relayée par le fil « Audit avant le lancement ») ; gabarit refait, `e2e-rapport` relancé.

## Ce qui reste
- Plan Workers Paid (action J10 de JB) avant le lancement : le plan gratuit limite le calcul à 10 ms par requête, le rapport en demande environ 60.
- Relecture des textes du rapport par Anne ; refaire le gabarit après ses corrections (`node scripts/rapport-gabarit.mjs`).
- Après fusion : téléchargement réel sur l'aperçu, depuis la page de résultats et depuis l'e-mail.
- À trancher par JB : le bouton de la sortie B « Téléchargez votre plan d'action personnalisé » envoie encore le guide.
