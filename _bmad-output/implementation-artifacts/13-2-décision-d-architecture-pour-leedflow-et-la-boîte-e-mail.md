---
story: 13.2
epic: 13 — Espace de travail d'Anne
statut: done
date: 2026-10-10
maj: 2026-10-15
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

## Complément du 2026-10-15 : réponse de Leedflow
- Réponse du support à Anne (relayée par JB) : API REST documentée, lecture seule, clé générée par l'utilisateur ; pas de webhook ; OAuth réservé aux assistants IA (MCP) ; tout l'historique récupérable ; gratuit, sans limite hors anti-abus.
- Vérifié le 2026-10-15 sur la description publique de l'API (`https://api.leedflow.com/api/external/v1/openapi.json`) : lecture des contacts, appels (`transcription` = résumé en Markdown, `transcription_srt` = transcription complète, `recording_url`), SMS, messages vocaux et tâches ; filtre par date de création (`created_after`, en millisecondes), pages de 100 au plus ; authentification `Bearer` par clé. Sans clé, l'API répond 401 (essai fait).
- Décision écrite dans AD-20, entrée 4 : relève toutes les 10 minutes, clé en secret du Worker de l'espace, résumé gardé sans transcription complète ni enregistrement, numéro inconnu proposé jamais créé, tâches Leedflow = propositions. Story 13.10 débloquée et réécrite dans `epics.md`. Question ouverte de la spec barrée.
- Essai réel le 2026-10-15 au soir : JB a interrogé l'API depuis son ordinateur avec la clé générée par Anne (script PowerShell qui n'affiche que des nombres ; ni Claude ni le site n'ont vu la clé). Résultat : clé acceptée, 10 derniers appels lus, 9 avec résumé. La clé est gardée par JB dans son gestionnaire de mots de passe jusqu'à la story 13.10 ; elle n'a pas été posée sur le Worker du site.
- Appris dans la documentation Leedflow : quand une agence l'a branché sur Modelo, Leedflow synchronise les contacts dans les deux sens et recopie le résumé dans Modelo. Confirmé par JB le 2026-10-15 : branchement en cours pour Anne ; story 13.9 allégée en conséquence.

## Ce qui reste
- Validation des étapes par Anne (action A19) avant 13.4.
- Story 13.3 : vérifier les trois hypothèses, puis construire.
