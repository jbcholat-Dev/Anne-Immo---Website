---
story: 13.26
epic: 13 — Espace de travail d'Anne
statut: done
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

## Ce qui est fait (2026-10-24, fil « [Site] Campagnes d'e-mailing depuis l'espace »)
- Migration `site/migrations/0013-accord-email.sql` : `contact.email_accord_le`, `email_accord_source` (anne, import), `email_desinscrit_le` ; `prescripteur.email_desinscrit_le` ; reprise des contacts importés avec la case cochée.
- **Écart assumé avec le plan ci-dessus** : l'accord donné sur le site et le désabonnement de la séquence ne sont **pas recopiés** sur le contact. Ils restent sur les demandes (`lead`) et la règle les y lit (`SQL_ACCORD`). Raison : le site n'a pas à écrire dans les tables de l'espace (AD-20), une case cochée plus tard sur le diagnostic serait sinon perdue, et il n'y a rien à resynchroniser. Les anciens clients sont reconnus par leur étape, sans colonne.
- `espace/src/server/accord.ts` : `etatEmail` (règle pure : sans e-mail, désinscrit, accord, ancien client, sans accord), `peutRecevoirCampagne`, `RAISONS_ECART`, `SQL_ACCORD`, `lireAccord`, `noterAccord`, `noterRefus`. Un refus l'emporte sur tout accord, sauf une case cochée sur le site après lui.
- Import : une liste importée avec la case « accepte d'être recontacté » note l'accord « import » (nouveaux et complétés).
- Fiche contact : carte « E-mails groupés » sous les coordonnées (hors de l'en-tête, que la 13.31 refera) ; case « D'accord pour recevoir mes e-mails », « Retirer son accord » (accord noté par Anne ou import seulement), « Elle ou il ne veut plus d'e-mails » (vaut désinscription). Chaque geste est tracé dans l'historique. Export : les nouvelles colonnes y sont (`SELECT *`).
- Prescripteurs : seule la colonne existe ; le geste viendra avec la 13.27, quand ils pourront recevoir une campagne.
- Contacts d'essai : ils ne sont pas écartés par la règle (sur l'aperçu tout est d'essai, et tous les envois y vont déjà à la boîte de test).

## Vérification (2026-10-24)
- `node scripts/e2e-espace.mjs` : **259 vérifications, 0 échec**, dont 14 nouvelles : import avec et sans case, contact sans e-mail, accord noté puis retiré, refus puis accord refusé, accord du site non retirable, désabonnement de la séquence puis nouvelle case cochée, ancien client, reprise de la migration, export.
- `npm run check` : 0 erreur dans `espace/` et `site/` ; `npm run build` des deux ; `wrangler d1 migrations apply --local` jusqu'à 0013.
- Captures regardées : `espace/.verif/espace-fiche-sans-accord-telephone.png` et `espace-fiche-accord-site-telephone.png` (et ordinateur).

## Ce qui reste
- PR n° 196 fusionnée le 2026-10-24 (accord de JB). Conflit possible avec la PR n° 192 (13.30) sur `fiche.astro` et `e2e-espace.mjs`, à régler par celle des deux qui fusionne en second.
