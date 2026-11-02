---
story: 7.10
epic: 7 — Contenu d'Anne
statut: done
date: 2026-10-04
---

# Story 7.10 — Séquence d'e-mails de la sortie B rédigée

## Objectif
Qu'Anne relise une base déjà rangée au bon format au lieu de partir de Notion.

## Ce qui est fait
- Base de 2025 (Notion, « [Marketing] – Lead Magnets et Séquence Email – 2025-10-23 ») rangée au gabarit : `contenu-anne/guide/sequence-emails/etape-0/fr.md` (J+0, e-mail de résultats) à `etape-6/fr.md` (J+15), tous en `statut: brouillon`.
- Retirés de l'e-mail du J+15 : trois témoignages (« Marc D., Sophie L., Laurent P. ») sans avis vérifiable (D-9) et le paragraphe d'honoraires (règle « pas de tarif »). L'original reste dans Notion.
- `sequence-emails/README.md` : règles et points à vérifier e-mail par e-mail. `guide/README.md` pointe vers ce dossier (il demandait un fichier unique).

## Vérification
`npm run build` : 19 pages, aucune erreur · `npm run check` : 0 erreur · `node scripts/liens.mjs` : 1 128 liens, 0 cassé · `npm run verif` : captures 1440 et 390 dans `site/.verif/`.

## Ce qui reste
- Anne : relire, décider du nombre et des jours, confirmer les cas réels.
- Claude : objets `SequenceEmail`, libellés « séquence de 7 e-mails » de `resultats.ts` et `feedbacks.json` au nombre réel (le site annonce aussi « le premier arrive demain matin », à aligner).

## Revue du suivi (2026-10-25)
Statut passé à `done` lors de la remise à jour du statut de sprint demandée par JB après l'audit BMAD du 2026-10-25. Les six e-mails de la séquence ont été relus et passés en `statut: publie` le 2026-10-10 (validation de JB, 20 h 52, story 12.5) ; le site n'annonce plus « 7 e-mails » (aucune occurrence dans `site/src`).
