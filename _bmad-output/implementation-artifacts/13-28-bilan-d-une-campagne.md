---
story: 13.28
epic: 13 — Espace de travail d'Anne
statut: ready-for-dev
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.28 — Bilan d'une campagne

## Objectif
Anne sait ce qu'une campagne lui a rapporté, avec les mêmes chiffres que ses autres actions (décision de JB du 2026-10-24, AD-21). Pas de taux d'ouverture : le suivi des ouvertures et des clics est désactivé chez Resend et le site n'a aucun traceur (AD-11). Dépend de 13.27.

## Ce qu'il faut
- Chaque campagne envoyée crée ou rejoint une **action marketing** (story 13.17), canal `autre` ou un canal `email` si la migration l'ajoute, avec sa date ; le coût est nul par défaut.
- Page de la campagne : envoyés, refusés par la messagerie (rebonds signalés par Resend, par son webhook ou par la réponse d'envoi), désinscrits venus de cette campagne, demandes du site arrivées avec les paramètres de la campagne (champ `utm` du lead), rendez-vous et mandats qui suivent chez ces contacts.
- Le **bilan du lundi** montre la ligne de la campagne avec ses voisines.
- Une adresse refusée définitivement (rebond dur) n'est plus proposée aux campagnes suivantes.

## Vérification attendue
- `e2e-espace.mjs` : une campagne d'essai, une demande du site arrivée par son lien, un désinscrit, un rebond imité ; chiffres justes sur la page de la campagne et dans le bilan.
- `npm run build`, `npm run check` ; captures.

## Ce qui reste
- À construire après 13.27.
