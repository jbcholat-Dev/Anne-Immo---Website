---
story: 13.2
epic: 13 — Espace de travail d'Anne
statut: review
date: 2026-10-10
---

# Story 13.2 — Décision d'architecture pour l'espace de travail

## Objectif
Décider comment l'espace de travail d'Anne (CAP-12) est hébergé et comment chaque source de contacts y arrive, puis découper la construction en stories.

## Ce qui est fait
- Spine d'architecture : **AD-19** (application séparée `espace/`, même base D1, migrations à un seul endroit, `/gestion` déplacé ; décision de JB du 2026-10-09), **AD-20** (table `contact` et historique, rattachement par téléphone ou e-mail, prochaine action obligatoire, entrées par source, rien ne change d'étape sans Anne, RGPD étendu), **AD-14 amendée** (Modelo amont par e-mail, aval à la signature). Carte des capacités : ligne CAP-12. Trois hypothèses à vérifier au début de 13.3.
- Fait établi le 2026-10-10 (capture de JB) : les demandes Leboncoin passées par Modelo arrivent dans la Gmail d'Anne, expéditeur `inbound@nettymail.com`, champs fixes. D'où le choix : filtre Gmail → Cloudflare Email Routing → handler `email` du Worker de l'espace, plutôt que la lecture de toute la boîte (accès Google sensible) ou l'API Modelo (clé eXp, 25 € HT/mois, IP fixe).
- Spec : CAP-12 couvre les demandes des portails ; question « portails » barrée ; accès Gmail limité aux e-mails des clients et différé.
- Journaux : `.memlog.md` de la spec et du spine ; `RUNBOOK.md` § 6.
- Découpage : stories 13.3 à 13.11 dans `epics.md` et `sprint-status.yaml`. Story 13.1 passée à « fait ».
- Schéma des sources ajouté à la maquette (https://claude.ai/artifact/8NqsmX6NrTpaTwbdXqxUy6, cadre « 0 · D'où viennent les contacts »).

## Ce qui est vérifié
- Documentation Cloudflare lue le 2026-10-10 : le handler `email` d'un Worker reçoit les messages (limite 25 Mio) ; la page D1 ne dit pas explicitement qu'une base se lie à deux Workers : hypothèse gardée à vérifier en premier en 13.3.
- Aucun code modifié : pas de construction ni de captures nécessaires.

## Ce qui reste
- Réponse du support Leedflow (action J33) pour la story 13.10.
- Validation des étapes par Anne (action A19) avant 13.4.
- Story 13.3 : vérifier les trois hypothèses, puis construire.
