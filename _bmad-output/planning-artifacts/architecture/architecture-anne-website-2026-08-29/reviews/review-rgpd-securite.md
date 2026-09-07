---
lens: rgpd-securite-continuite
target: ARCHITECTURE-SPINE.md (architecture-anne-website-2026-08-29)
context: SPEC.md v3, section Constraints
date: 2026-09-07
reviewer: sous-agent contexte vierge
---

# Revue RGPD, sécurité et continuité — Architecture Spine, Site Anne Vial-Tissot

## Verdict

Le paradigme (« écrire d'abord », un adaptateur par service, secrets hors dépôt, D1 en UE, deux consentements distincts) est sain et au-dessus de la moyenne d'un premier projet solo ; mais l'architecture décrit **comment les données entrent**, très peu **comment elles ressortent** (droits d'accès/effacement, registre, sauvegarde longue) et **laisse un point d'entrée non authentifié** (webhook Cal.com) — trois manques qui, combinés à « premier projet de JB, enjeu de reprise sans lui », sont le vrai risque du dossier, plus que la conformité déclarative (mentions légales, bandeau).

---

## Critical

### C1 — Aucun mécanisme d'exécution des droits d'accès/effacement (Art. 15/17 RGPD)

- **Point visé :** AD-4, AD-6, AD-14 (page admin) ; Constraints SPEC « Conformité RGPD ».
- **Risque :** L'architecture décrit une page admin qui **liste** les leads et coche `modelo_synced_at` — rien ne prévoit une action « exporter les données de cette personne » ou « effacer cette personne (D1 + déclencher la suppression côté Resend/Cal.com) ». Une demande d'un prospect (accès, effacement, portabilité) devrait aujourd'hui être traitée à la main via `wrangler d1 execute` en ligne de commande — c'est-à-dire par quelqu'un qui sait lire le schéma et écrire du SQL. C'est exactement le scénario que le brief signale comme risque central : *reprise sans JB*. Sans bouton, Anne ne peut pas répondre seule à une demande dans le délai légal d'un mois, et JB devient un point de défaillance RGPD permanent, pas seulement technique.
- **Correction proposée :** Ajouter à l'architecture une action admin explicite par lead — « Exporter (JSON/CSV) » et « Effacer » — qui (a) supprime/anonymise la ligne `lead` en D1 (garder un résidu statistique anonyme si besoin des compteurs d'entonnoir, jamais l'identité), (b) documente dans le RUNBOOK le geste correspondant côté Cal.com (annuler/supprimer la réservation liée) et rappelle que Resend purge ses logs à 30 jours de toute façon (donc pas d'action à faire côté Resend passé ce délai). Doit être opérable par Anne seule, sans terminal.

---

## High

### H1 — Le téléphone est exigé même pour un simple téléchargement de guide (AD-6) — minimisation contestable

- **Point visé :** AD-6 : « Identité (…) obligatoires **pour toutes les sources** — le guide hors diagnostic (CAP-8) coûte les mêmes coordonnées que le gate. »
- **Risque :** Le principe de minimisation (Art. 5.1.c RGPD) exige de ne collecter que ce qui est nécessaire à la finalité. Télécharger un PDF ne justifie pas, en soi, un numéro de téléphone — c'est une donnée sensible en pratique (elle ouvre un canal de démarchage direct) et son exigence pour un simple lead magnet est le genre de point qu'une CNIL ou qu'un visiteur pointilleux relève en premier. La règle est assumée dans l'architecture pour une raison d'ingénierie (« éviter quatre formulaires qui définissent quatre leads »), pas pour une raison métier ou légale — c'est un arbitrage simplicité-vs-minimisation non explicité comme tel.
- **Correction proposée :** Autoriser `telephone` nullable pour la source `guide` seule (les autres sources — diagnostic, contact, RDV — impliquent un contact humain direct et justifient le téléphone). Le schéma `lead` (AD-6) reste unique ; seule la validation par `source` (déjà prévue en AD-7 : « réponses conformes au contenu ») change. Alternative si JB tient à uniformiser : documenter explicitement dans la politique de confidentialité *pourquoi* le téléphone est demandé pour un téléchargement (ex. rappel personnalisé promis), sinon la minimisation n'est pas défendable en l'état.

### H2 — Aucune vérification de signature sur le webhook Cal.com (AD-8, AD-4)

- **Point visé :** AD-8 (« Cal.com … `CAL -. webhook .-> W` »), AD-7 (anti-abus ne couvre que les routes de capture visiteur, pas explicitement le webhook).
- **Risque :** Le webhook `BOOKING_CREATED` est un point d'écriture dans D1 (AD-4 : écrire d'abord). Cal.com signe ses webhooks (HMAC avec un secret partagé, header `X-Cal-Signature-256`) — l'architecture ne mentionne nulle part que le noyau **vérifie** cette signature avant d'écrire le lead. Sans vérification, n'importe qui connaissant (ou devinant) l'URL du endpoint peut poster un faux booking : lead fantôme en base, e-mail de notification à Anne pour un rendez-vous qui n'existe pas, voire injection de données arbitraires dans les colonnes `answers`/`utm` si la validation de schéma (AD-7) n'est pas appliquée symétriquement à cette route.
- **Correction proposée :** Ajouter au webhook Cal.com la même discipline qu'AD-7 : vérification de signature HMAC avec le secret Cal.com (stocké comme secret Workers, AD-8), rejet neutre si invalide, **avant** toute écriture D1. À formuler comme un ajout explicite à AD-7 (« … et pour le webhook Cal.com, vérification de signature avant AD-4 ») plutôt que comme un non-dit.

### H3 — Registre des traitements non mentionné ; la dérogation <250 salariés ne s'applique probablement pas ici

- **Point visé :** Constraints SPEC (« Conformité RGPD » ne cite que mentions légales, politique de confidentialité, opt-in, désabonnement) ; absent de l'architecture et du RUNBOOK.
- **Risque :** Vérifié (CNIL, 2026-09) : les organismes de moins de 250 salariés bénéficient d'une dérogation de tenue de registre, **mais elle exclut explicitement les traitements non occasionnels tels que la « gestion des clients »**. La capture et le suivi de leads d'Anne (diagnostic, contact, RDV) constitue précisément une gestion de clientèle/prospects non occasionnelle — donc, selon la doctrine CNIL, le registre reste obligatoire malgré la petite taille de la structure. Ce n'est décrit nulle part comme une action à faire.
- **Correction proposée :** Action hors architecture (pas un AD) : ajouter au RUNBOOK ou à une checklist de lancement un registre des traitements minimal (modèle CNIL simplifié PME) couvrant les 4 sources de leads + la newsletter + les sous-traitants (Resend, Cal.com, Cloudflare). Une heure de travail, zéro impact code.

### H4 — Base légale par traitement non nommée dans le contrat d'architecture

- **Point visé :** AD-16 (consentements distincts) ; Constraints SPEC exige une « base légale identifiée » mais l'architecture ne la fixe pas comme donnée de contenu.
- **Risque :** AD-16 traite le consentement newsletter, mais pas la base légale du traitement principal (diagnostic/contact/guide/RDV). En droit français, la prospection commerciale par voie électronique auprès de particuliers requiert en principe un consentement préalable (art. L.34-5 CPCE), sauf démarche **à l'initiative de la personne** (ce qui est le cas ici : le prospect remplit lui-même un formulaire) — assimilable à des « mesures précontractuelles prises à la demande de la personne concernée » (Art. 6.1.b RGPD). C'est une analyse défendable, mais elle n'est écrite nulle part, alors que la politique de confidentialité doit l'afficher explicitement pour chaque finalité, et qu'une base légale mal choisie invaliderait le traitement entier.
- **Correction proposée :** Ajouter à `Identite`/`PageEditoriale` (légal, AD-1) un champ explicite « base légale » par finalité (diagnostic, contact, guide, RDV, newsletter), et trancher maintenant l'analyse ci-dessus plutôt que de la laisser émerger au moment de rédiger la politique de confidentialité.

---

## Medium

### M1 — La purge à 3 ans (AD-16) référence un événement (« sans contact ») qu'aucun champ du schéma ne capture

- **Point visé :** AD-16 (« purge automatique … des leads sans contact depuis 3 ans ») vs AD-6 (schéma `lead` : `created_at`, `notified_at`, `modelo_synced_at`, mais aucun champ « dernier contact humain »).
- **Risque :** La recommandation CNIL usuelle pour la prospection commerciale est bien 3 ans **à compter du dernier contact avec le prospect** — l'architecture reprend la bonne durée, mais son schéma ne peut techniquement calculer que depuis `created_at` (un événement figé à la capture), pas depuis un contact ultérieur (appel, RDV, e-mail échangé après notification). Le cron de purge (AD-12/AD-16) purgera donc soit trop tôt (un prospect qu'Anne a rappelé 2 ans après reste actif humainement mais « vieux » en base), soit la règle reste un vœu non implémentable tel quel.
- **Correction proposée :** Ajouter un champ `last_contact_at` (mis à jour manuellement depuis l'admin quand Anne interagit avec le lead, ou automatiquement à `modelo_synced_at`/RDV honoré) et baser la purge dessus ; à défaut, documenter explicitement que la purge se base sur `created_at` et assumer que c'est moins protecteur pour le prospect mais plus simple.

### M2 — Sous-traitants hors UE : transferts non documentés dans l'architecture (Resend, Cal.com)

- **Point visé :** AD-16 (« Resend, listé comme sous-traitant ») ; AD-8 (Cal.com).
- **Risque :** Vérifié (2026-09) : Resend certifie son DPA sous le Data Privacy Framework UE-US (mécanisme de transfert valide), mais **les métadonnées de compte et les logs restent aux États-Unis** même si l'envoi d'e-mail se fait depuis une région UE — un transfert hors UE existe donc réellement, encadré mais réel. Cal.com Inc. est une société américaine ; rien n'indique que le plan gratuit/embed offre une résidence de données UE (généralement une fonctionnalité entreprise). Aucun des deux points n'est mentionné dans l'architecture, alors que la politique de confidentialité doit nommer le mécanisme de transfert (DPF, clauses contractuelles types) pour chaque sous-traitant hors UE.
- **Correction proposée :** Vérifier le DPA Cal.com (mécanisme de transfert, sous-traitants ultérieurs) au même niveau que Resend ; consigner les deux dans le RUNBOOK/registre (H3) avec le mécanisme de transfert cité nommément dans la politique de confidentialité, pas juste « Resend est sous-traitant ».

### M3 — Sauvegarde D1 : Time Travel existe mais n'est ni référencé ni testé dans AD-10/RUNBOOK

- **Point visé :** AD-10 (« Tout est reconstructible depuis le dépôt » — ne couvre que schéma/migrations, pas les données).
- **Risque :** Vérifié : Cloudflare D1 Time Travel restaure automatiquement la base à n'importe quelle minute des **30 derniers jours** (plan Payant) sans configuration — un filet réel existe donc, mais (a) il n'est cité nulle part dans l'architecture ni le RUNBOOK, donc une reprise sans JB ne saurait pas qu'il existe ; (b) 30 jours ne couvre pas une suppression accidentelle découverte plus tard (ex. bug d'effacement en masse détecté au bout de 2 mois) ; (c) le test de reprise « depuis une machine vierge » (AD-10) ne mentionne pas explicitement un essai de restauration Time Travel.
- **Correction proposée :** Ajouter Time Travel comme mécanisme de sauvegarde nommé dans AD-10/RUNBOOK, avec un essai de restauration réel avant lancement ; envisager un export périodique (ex. mensuel, vers R2 ou hors Cloudflare) pour couvrir l'angle mort au-delà de 30 jours, en cohérence avec la durée de conservation de 3 ans.

### M4 — Page d'export (AD-14) : protection et sort du fichier après téléchargement non précisés

- **Point visé :** AD-14 (export CSV vers Modelo) ; Consistency Conventions (« routes admin derrière Cloudflare Access »).
- **Risque :** L'export CSV expose en clair l'ensemble des PII de tous les leads dans un seul fichier téléchargeable. Que la route soit sous `/admin` (donc a priori protégée par Access) n'est pas dit explicitement pour cette route précise ; et une fois le fichier sur la machine d'Anne ou de JB, il devient une copie non tracée, sans chiffrement, sans purge — un CSV de prospects qui traîne dans un dossier Téléchargements est un scénario de fuite classique.
- **Correction proposée :** Confirmer explicitement (AD-14) que l'export vit sous `/admin` (Access) ; ajouter au RUNBOOK une consigne « supprimer le fichier exporté après import dans Modelo » et, si le volume le justifie, envisager un export à la demande plutôt qu'un fichier persistant.

### M5 — Journaux d'infrastructure (hors `console.log` applicatif) : l'IP visiteur n'est pas couverte par la règle « jamais de PII dans les journaux »

- **Point visé :** Consistency Conventions (« journalisation en JSON structuré … jamais de donnée personnelle dans les journaux »).
- **Risque :** Cette règle vise les logs applicatifs écrits par le code. Mais Cloudflare capture par défaut ses propres journaux de requêtes HTTP (Workers Logs, logs d'accès) qui contiennent l'adresse IP du visiteur — une donnée personnelle au sens RGPD (CJUE, Breyer). L'architecture ne dit rien de la rétention de ces journaux d'infrastructure ni de leur mention dans la politique de confidentialité (traitement distinct des données de `lead`).
- **Correction proposée :** Documenter dans la politique de confidentialité que l'hébergeur (Cloudflare) journalise les adresses IP à des fins de sécurité/exploitation, avec sa durée de rétention par défaut ; envisager de réduire cette rétention si l'option existe sur le plan Cloudflare utilisé.

### M6 — Admin derrière Cloudflare Access sans exigence explicite de MFA pour une page qui expose tout le PII

- **Point visé :** Consistency Conventions (« routes admin derrière Cloudflare Access, courriels autorisés : Anne, JB »).
- **Risque :** Cloudflare Access, par défaut, peut authentifier par simple lien à usage unique envoyé par e-mail (un seul facteur : la possession de la boîte mail). Si la boîte mail d'Anne ou de JB est compromise, l'attaquant a accès à l'ensemble des leads (identité, téléphone, réponses au diagnostic) et à l'export CSV (M4). C'est le point d'accès le plus sensible de tout le système et le moins spécifié en détail.
- **Correction proposée :** Exiger explicitement dans l'architecture/RUNBOOK une politique Access avec un second facteur (TOTP/clé matérielle) pour les comptes admin, ou au minimum une durée de session courte et une restriction géographique si le plan Cloudflare le permet.

---

## Low

### L1 — Jeton de gate (AD-5) : génération et expiration non spécifiées

- **Point visé :** AD-5 (« jeton de soumission opaque, à usage unique par navigateur, expirant »).
- **Risque :** « Opaque » et « à usage unique » sont de bonnes propriétés, mais rien ne garantit qu'il s'agit d'un générateur cryptographiquement sûr (vs un identifiant séquentiel ou prévisible), ni la durée d'expiration retenue.
- **Correction proposée :** Préciser dans AD-5 ou les conventions : générateur aléatoire cryptographique (ex. `crypto.randomUUID()`/équivalent Workers), expiration courte (ex. quelques heures), invalidation immédiate après premier usage — probablement déjà l'intention, juste à écrire.

### L2 — Turnstile/Cal.com « sans bandeau » : le raisonnement CNIL existe mais reste à vérifier en configuration réelle

- **Point visé :** AD-11 ; déjà noté par l'architecture elle-même en Hypothèses/Deferred (« Turnstile invisible et l'intégration Cal.com ne déposent rien de non essentiel — à vérifier »).
- **Risque :** Vérifié (2026-09) : la position CNIL/CEPD reconnaît une exemption de consentement pour un CAPTCHA strictement nécessaire à la sécurité (ce que fait Turnstile), à condition qu'il n'y ait pas de réutilisation à des fins publicitaires ni de traçage cross-site — Turnstile en configuration standard remplit ces critères. Cloudflare Web Analytics est également confirmé sans cookie et donc hors du champ de l'ePrivacy. Le point réellement incertain reste l'intégration Cal.com (l'embed peut déposer des cookies avant toute action selon son mode d'intégration).
- **Correction proposée :** Rien à changer dans l'architecture (déjà anticipé comme hypothèse à vérifier au build) — juste confirmer que la vérification instrumentée porte spécifiquement sur le mode d'intégration Cal.com choisi (iframe direct vs lien externe), qui est le seul des trois composants où le résultat n'est pas déjà tranché par la doctrine.

### L3 — Récupération du compte Cloudflare d'Anne : le coffre partagé n'est pas explicitement testé

- **Point visé :** AD-9 (« Cloudflare … titulaire Anne, JB invité avec les droits d'administration … mots de passe dans un coffre partagé à deux »).
- **Risque :** Le cas « JB indisponible » est couvert (Anne reste titulaire). Le cas « Anne perd l'accès à son propre compte » (mot de passe oublié, 2FA perdu, boîte mail de récupération inaccessible) dépend de JB ayant effectivement des droits d'administration suffisants pour la dépanner — plausible vu AD-9, mais les codes de récupération 2FA et l'e-mail de secours du compte ne sont pas explicitement dans le coffre partagé.
- **Correction proposée :** Ajouter au RUNBOOK : codes de récupération 2FA du compte Cloudflare d'Anne stockés dans le coffre partagé, et un test de récupération (JB se connecte en tant qu'administrateur invité sans le mot de passe d'Anne) effectué une fois avant lancement.

---

## Sources vérifiées (recherches web, 2026-09-07)

- Position CNIL/EDPB sur les CAPTCHA et l'exemption de sécurité (Turnstile vs reCAPTCHA) : captcha.eu, flowconsent.com, friendlycaptcha.com.
- CNIL — registre des traitements, dérogation <250 salariés et son exclusion pour la « gestion des clients » : cnil.fr, leto.legal.
- Cloudflare Web Analytics sans cookie, hors champ ePrivacy : consentstack.io, wideangle.co.
- Resend — DPA, certification Data Privacy Framework, logs/métadonnées conservés aux États-Unis, rétention 30 jours : resend.com/security/gdpr, resend.com/legal/dpa.
- Cloudflare D1 Time Travel — restauration automatique sur 30 jours (plan Payant) / 7 jours (Free), sans configuration : developers.cloudflare.com/d1/reference/time-travel/.
