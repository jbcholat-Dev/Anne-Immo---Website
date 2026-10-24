---
story: 13.27
epic: 13 — Espace de travail d'Anne
statut: review
date: 2026-10-24
maj: 2026-10-24
---

# Story 13.27 — Écrire et envoyer une campagne e-mail

## Objectif
Anne envoie elle-même une campagne e-mail à une partie de ses contacts, depuis l'espace, sans exporter de liste (décision de JB du 2026-10-24, AD-21). Modelo est écarté (limitations), comme un outil externe (Brevo) ou les campagnes de Resend (liste stockée chez Resend). Dépend de 13.26.

## Ce qu'il faut
- Nouvel onglet **Campagnes** : liste des campagnes (brouillon, en cours d'envoi, envoyée) et bouton « Nouvelle campagne ».
- **Écrire** : objet, texte (paragraphes et liens simples), une photo facultative, un bouton (libellé + lien vers une page du site, diagnostic par exemple). Gabarit à la charte, celui des e-mails du site (`site/src/server/email-html.ts`), version texte jointe. Chaque lien vers le site reçoit des paramètres de campagne (UTM, AD-11) au nom de la campagne.
- **Choisir à qui** : filtres parcours (vendeur, acheteur), étape, commune, canal d'origine, prescripteurs. L'espace affiche le compte : « N recevront, M écartés », et le détail des écartés par raison (`peutRecevoirCampagne`, story 13.26). Un contact sans accord n'est jamais ajouté, même à la main.
- **Essai** : envoi à l'adresse de l'utilisateur connecté, objet préfixé [ESSAI].
- **Envoyer** : confirmation dans la page (nombre de destinataires). La liste est figée à l'envoi (table des destinataires de la campagne) ; un Cron de l'espace envoie par paquets (50 par heure au départ, réglable), dans la limite du quota Resend du jour, en laissant passer d'abord les e-mails du site. Clé d'idempotence par destinataire (AD-4) : jamais deux fois le même e-mail.
- **Expéditeur** : sous-domaine d'envoi dédié (proposé `nouvelles.annevialtissot.fr`, à poser dans Resend et Cloudflare par JB, notice dans le RUNBOOK), nom « Anne Vial-Tissot », réponses vers la Gmail d'Anne.
- **Désinscription** : lien signé dans chaque e-mail et en-têtes `List-Unsubscribe` / `List-Unsubscribe-Post` (même mécanisme que la séquence, `/desabonnement`) ; écrit `email_desinscrit_le` sur le contact. Mentions : nom d'Anne, adresse professionnelle, pourquoi la personne reçoit ce message.
- **Trace** : chaque fiche destinataire reçoit l'événement « Campagne … reçue le … » (type `email`, source `anne`) ; un e-mail refusé par la messagerie est noté.
- En mode test (aperçu), tous les envois vont à `BOITE_TEST` comme le reste du site.

## Vérification attendue
- `e2e-espace.mjs` : campagne d'essai sur des contacts d'essai ; écartés justifiés ; essai reçu ; envoi par paquets avec le service imité (`URL_SERVICES_ESSAI`) ; pas de double envoi si le Cron repasse ; désinscription par le lien et par l'en-tête ; trace sur les fiches.
- `node scripts/maquette-emails.mjs` étendu ou équivalent : rendu de l'e-mail de campagne capturé (ordinateur et téléphone).
- `npm run build`, `npm run check` dans `espace/` et `site/` ; captures de l'onglet.

## Ce qui est fait (2026-10-24)
- **Page `/campagnes`** de l'espace (menu « Campagnes » sur ordinateur, bouton « Campagnes » dans le Bilan sur téléphone) : liste des campagnes avec leur état ; une campagne = un brouillon (nom, objet, texte, bouton) et des filtres (parcours, étapes, commune, origine). La page montre combien la recevront, qui est écarté et pourquoi (pas d'adresse, pas d'accord, désinscrit), la liste nominative dépliable, l'aperçu de l'e-mail avec un prénom d'exemple, « M'envoyer un essai » (objet « [ESSAI] »), puis « Envoyer la campagne » avec case de confirmation. Une campagne partie ne se modifie plus et montre où en est l'envoi et ce qui n'est pas parti, avec la raison.
- **Moteur** `espace/src/server/campagnes.ts` : à l'envoi, la liste est figée dans `campagne_destinataire` (migration `0014-campagnes.sql`) ; la tâche planifiée de l'espace (toutes les 10 minutes, `worker.ts`) envoie 8 e-mails par passage, au plus 90 par jour site compris (réglages `CAMPAGNE_PAR_PASSAGE`, `CAMPAGNE_QUOTA_JOUR`), en repassant la règle d'accord de la 13.26 juste avant chaque e-mail (désinscrit ou adresse changée entre-temps : écarté, raison notée). Réservation de la ligne avant l'envoi et clé d'idempotence `campagne:<id>:<contact>` (AD-4) : jamais deux fois ; 5 essais au plus en cas d'échec de Resend.
- **E-mail** : gabarit des e-mails du site (`enHtml`, version texte jointe), `[Prénom]` remplacé, bouton vers une page du site avec `utm_source=espace&utm_medium=email&utm_campaign=<nom>` (AD-11, aucun traceur), pied « pourquoi vous recevez cet e-mail » et lien « Ne plus recevoir ces e-mails », en-têtes `List-Unsubscribe` et `List-Unsubscribe-Post` (un clic), réponses vers la Gmail d'Anne (`BOITE_ANNE`). Expéditeur `EXPEDITEUR_CAMPAGNES` (sous-domaine) ; vide, rien ne part en production et la page le dit.
- **Désinscription** côté site (`site/src/server/liens.ts`, `/desabonnement?c=…`, `POST /api/desabonnement?c=…`) : lien signé par contact, page qui demande confirmation (rien à l'ouverture), écrit `contact.email_desinscrit_le`, annule les envois en attente et le note dans l'historique.
- **Trace** : événement « Campagne « … » envoyée : objet » (type `email`, source `anne`) sur chaque fiche destinataire.
- **RGPD** : effacement d'un contact (fiche ou `/gestion`) et purge retirent ses lignes de campagne.
- **Notice pour JB** : RUNBOOK § 4 sexies, « Campagnes e-mail » (sous-domaine dans Resend, 3 lignes DNS, clé Resend propre à l'espace, secrets).

## Écarts assumés
- **Pas de photo dans la v1** : le gabarit des e-mails du site n'a pas d'image hors logo (une image hébergée serait chargée depuis un serveur, ce que la story 10.9 a écarté). Le bouton vers une page du site porte l'illustration. À ajouter si Anne le demande (image jointe comme le logo).
- **Pas de prescripteurs dans la v1** : les filtres portent sur les contacts ; les prescripteurs (notaires, conseillers) ont leur propre table et un message différent. Une campagne « prescripteurs » sera une option de la 13.28 ou d'une story à part si Anne en a l'usage.
- **Rebonds** : un e-mail refusé par Resend à l'envoi est noté (« échec » avec la raison) ; un rebond signalé plus tard par la messagerie du destinataire (webhook de Resend) n'est pas lu. Repris dans la 13.28 (bilan).
- **Aperçu de l'e-mail** dans la page avec les polices de secours (le cadre isolé ne charge pas les polices du site) ; l'e-mail réel garde les siennes.

## Vérification
2026-10-24 :
- `node espace/scripts/e2e-espace.mjs` : **288 constats bons, 0 échec** (« Tout est bon »), dont 22 pour les campagnes : brouillon, filtres (3 reçoivent, 3 écartés par raison ; filtre vendeurs), aperçu et paramètres de la campagne, lien de bouton refusé, essai à soi-même, confirmation exigée, liste figée, campagne partie non modifiable, paquet de 2 au plus par passage (réglage d'essai), désinscrit entre-temps écarté au dernier moment, e-mail (prénom, gras, UTM, réponses vers Anne, lien et en-têtes un clic), une fois par personne, rien de renvoyé au passage suivant, historique de la fiche, page de suivi, désinscription par la page (rien à l'ouverture) et en un clic (lien mal signé refusé), effacement RGPD ; et 8 sans débordement (liste, brouillon, campagne envoyée, e-mail reçu, ordinateur et téléphone).
- `node site/scripts/e2e-guide.mjs` : tous les constats bons (désabonnement de la séquence inchangé).
- `npm run check` : 0 erreur dans `espace/` et `site/` ; `npm run build` des deux sans erreur.
- Captures relues : `espace/.verif/espace-campagne-*.png`, `espace-campagnes-*.png`, `email-campagne-telephone.png` (e-mail de campagne à la charte, bouton, signature, pied de désinscription).
- Non essayé ici : la règle « rien ne part en production sans expéditeur » (l'essai local tourne en mode aperçu) ; lue dans le code (`expediteur`, `lancer`, `envoyerCampagnes`).

## Ce qui reste
- PR à fusionner par JB (elle change l'espace et le site).
- Action de JB : sous-domaine d'envoi dans Resend + lignes DNS dans Cloudflare + secrets de l'espace (≈ 15 min, RUNBOOK § 4 sexies) ; puis Claude pose `EXPEDITEUR_CAMPAGNES` par une PR et envoie un essai.
- Vérifier l'offre Resend avant une première campagne de plus de 100 destinataires (offre gratuite : 100 e-mails par jour, 3 000 par mois, partagés avec le site).
