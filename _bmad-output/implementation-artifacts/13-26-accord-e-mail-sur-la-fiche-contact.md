---
story: 13.26
epic: 13 — Espace de travail d'Anne
statut: ready-for-dev
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.26 — Accord e-mail sur la fiche contact

## Objectif
Première des trois stories des campagnes e-mail (décision de JB du 2026-10-24, AD-21 ; cadrage : https://claude.ai/artifact/GtrnG79KrLqAy1i3xGMjWs). Avant d'envoyer une campagne, l'espace doit savoir, pour chaque contact, s'il peut la recevoir. La CNIL exige l'accord préalable d'un particulier pour la prospection par e-mail, sauf pour un ancien client (offres analogues) ; un professionnel peut recevoir un message lié à son métier. Aujourd'hui l'accord vit sur la demande du site (`lead.newsletter_opt_in_at`) ou, en creux, dans `contact.rappel_individuel_seul` : il n'existe pas au niveau du contact, et un contact saisi à la main n'a aucun moyen de le porter.

## Ce qu'il faut
- Migration (0013 ou suivante libre : la 0012 est prise par la 13.25, synthèse du contact) : sur `contact`, `email_accord_le` (date), `email_accord_source` ∈ {`site`, `import`, `anne`, `client`} et `email_desinscrit_le` (date). Même chose sur `prescripteur` (`email_desinscrit_le` seulement : la base légale est professionnelle).
- Reprise de l'existant dans la migration : contact rattaché à une demande avec `newsletter_opt_in_at` → accord `site` à cette date ; demande avec `newsletter_unsubscribed_at` → désinscrit ; contact importé sans `rappel_individuel_seul` → accord `import` à sa date de création ; contact `vendu` ou `acte_signe` → `client`.
- Fiche contact : une case « D'accord pour recevoir mes e-mails », avec la date et l'origine de l'accord affichées ; cocher la note dans l'historique (« Accord e-mail donné à Anne ») ; décocher retire l'accord. Un contact désinscrit montre « Désinscrit le … » et la case est verrouillée : seul un nouvel accord de la personne sur le site la rouvre.
- Une désinscription (lien de la séquence ou futur lien de campagne) écrit `email_desinscrit_le` sur le contact, en plus de la demande. Elle vaut pour tous les envois groupés.
- Fonction unique `peutRecevoirCampagne(contact)` dans `espace/src/server/` : e-mail présent, non désinscrit, non test, et accord (`site`, `import`, `anne`) ou ancien client. Elle rend aussi la raison d'un refus, pour la story 13.27.
- Export et effacement (story 13.23) emportent ces champs.

## Vérification attendue
- `e2e-espace.mjs` : reprise de l'existant sur des contacts d'essai de chaque origine ; case cochée puis décochée avec trace ; désinscription par le lien de la séquence visible sur la fiche ; `peutRecevoirCampagne` pour chaque cas du tableau du cadrage.
- `npm run build`, `npm run check` dans `site/` et `espace/` ; captures de la fiche (téléphone et ordinateur).

## Ce qui reste
- À construire dans le fil « [Site] Espace de travail d'Anne » ou dans le fil « [Site] Campagnes d'e-mailing depuis l'espace », après 13.22 à 13.25 (mêmes fichiers) ; partir de main une fois la PR de la 13.23 fusionnée, car la fiche contact y change beaucoup. PR de code : JB fusionne.
