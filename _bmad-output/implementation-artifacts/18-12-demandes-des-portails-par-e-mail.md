---
story: 18.12
epic: 18 — Espace d'Anne : le carnet de contacts
statut: done
date: 2026-11-02
maj: 2026-11-02
---

# Story 18.12 — Les demandes des portails par e-mail (ex-13.8)

## Objectif
Que les demandes Leboncoin et SeLoger arrivées dans la boîte pro d'Anne apparaissent dans la barre « Nouveaux » avec leur contact créé, pour qu'elle y réponde vite ; qu'un e-mail que l'espace ne sait pas lire soit gardé et signalé, jamais perdu. PRD `prd-espace-anne-2026-11-01` FR-27 ; architecture AD-20 (entrée 3 : filtre Gmail → Cloudflare Email Routing → gestionnaire `email` du Worker de l'espace), AD-22, AD-31 (opposition), AD-34 (`nouveau` de source `portail`) ; décision d'architecture 13.2 (format Modelo constaté par JB le 2026-10-10 : « Netty - Contacts passerelles » `<inbound@nettymail.com>`, champs fixes).

Les deux réglages de JB (réception sur un sous-domaine dans Cloudflare Email Routing, filtre de transfert dans la Gmail d'Anne) **ne sont pas faits** : tout ce qui n'en dépend pas est construit et essayé en local ; la marche à suivre est dans `RUNBOOK.md` § 4 sexies, « Demandes des portails par e-mail ».

## Ce qui est fait (2026-11-02)
- **Gestionnaire `email`** du Worker `anne-espace` (`espace/worker.ts`) : lit le message brut (au plus 1 Mo lu, `TAILLE_MAX`), le passe à `recevoirCourriel` ; un expéditeur refusé est rejeté (`setReject`, « Adresse réservée aux demandes des portails immobiliers »).
- **Lecture d'un e-mail sans bibliothèque** (`espace/src/server/courriel.ts`) : en-têtes repliés, mots encodés (RFC 2047), parties MIME imbriquées, base64 et quoted-printable, UTF-8, ISO-8859-1 et Windows-1252 ; corps en texte, ou HTML remis en texte (une ligne de tableau « libellé : valeur ») ; pièces jointes jamais lues.
- **Demandes des portails** (`espace/src/server/portails.ts`) :
  - expéditeurs acceptés : `nettymail.com` (Modelo), `leboncoin.fr`, `seloger.com` et leurs sous-domaines, et le message de confirmation du transfert de Gmail (`forwarding-noreply@google.com`) ; tout autre est refusé, rien n'est gardé ;
  - champs lus ligne à ligne « Libellé : valeur » (libellés de Modelo et variantes courantes : prénom, nom, nom complet, e-mail, téléphone, ville, raison du contact, type de recherche, message sur plusieurs lignes, référence, titre de l'annonce, source) ; portail reconnu par l'expéditeur, le champ « source », le sujet ou le texte ;
  - **lisible** (téléphone ou e-mail valable) : contact créé ou complété par `pipeline.rattacherDemandePortail` — catégorie « Demandes reçues », projet et parcours acheteur, température « avec Anne », référence du bien (`bien_ref`), ville, canal `portail` avec le nom du portail, source `portail` (`contact_source`), événement `demande` (texte et champs utiles seulement), entrée dans le suivi (« à qualifier ») ; un contact existant (même téléphone ou e-mail, principal ou secondaire) n'est que complété (rien n'est remplacé) et entre dans le suivi avec `suivi_le` s'il était au carnet, revient « à qualifier » s'il était en sommeil ou perdu ;
  - **personne qui a demandé l'effacement** (liste `opposition`, AD-31) : aucun contact, aucune de ses données gardée ; seule la référence du bien reste, et une carte dit qu'une demande est arrivée, à lire dans la boîte pro ;
  - **illisible** (ni téléphone ni e-mail trouvés, e-mail trop gros, confirmation de Gmail, liste d'opposition invérifiable faute de `LIEN_SECRET`, erreur à l'enregistrement) : gardé avec son expéditeur, son sujet et son texte (20 000 caractères au plus), carte « à lire à la main » qui montre tout le texte et dit pourquoi ;
  - **jamais perdu** : la ligne `portail_courriel` (en « illisible », avec son texte) et sa carte sont écrites d'abord, en un lot ; la lecture réussie les passe ensuite en « lu » et sur le contact, en un lot ; une erreur entre-temps laisse l'e-mail à lire à la main ;
  - **un même e-mail reçu deux fois** ne fait rien de plus (`message_id` unique : en-tête Message-ID, ou empreinte SHA-256 du message) ;
  - **ménage** (tâche planifiée de l'espace, `menagePortails`) : le texte, le sujet et l'expéditeur d'un e-mail à lire à la main sont effacés une fois sa carte traitée et le délai d'annulation passé ; les lignes de plus de trois ans sont retirées.
- **Migration** `site/migrations/0019-portails.sql` (additive, 0018 non touchée) : table `portail_courriel` (portail, état `lu` / `illisible` / `opposition`, motif, contact, expéditeur, sujet et texte gardés seulement pour un e-mail illisible, contrainte `CHECK`), colonne `nouveau.portail_courriel_id`.
- **Barre « Nouveaux »** (`espace/src/server/nouveaux.ts`, îlot, page) : carte d'une demande lue (pastille Leboncoin / SeLoger, raison du contact, nom, coordonnées, message, annonce et référence ; Ranger, Vu, Écarter, annulables comme pour le site) ; carte d'un e-mail à lire à la main ou d'une personne en opposition (« Vu » seulement ; texte complet, lignes gardées, défilant).
- **Réglages de JB** : `RUNBOOK.md` § 4 sexies, pas à pas, avec la durée.
- **Documents** : `espace/README.md`, `site/README.md` (migration 0019), statut de sprint (18-12 en `review`).

## Ce qui est vérifié (2026-11-02)
- Migration 0019 répétée sur une base locale neuve (0001 à 0019 appliquées, colonne `nouveau.portail_courriel_id` présente, `CHECK` qui refuse un texte gardé sur un e-mail lu), puis appliquée sur la base locale des essais (`npm run base:local`). `node scripts/e2e-migration-0018.mjs` : tout est bon, 22 constats.
- `site` : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build`, `npm run check` (0 erreur, 0 avertissement), `npm run base:local` ; `node scripts/e2e-gestion.mjs` : 52 constats bons ; `node scripts/e2e-formulaires.mjs` : 25 constats bons.
- `espace` : `npm run build`, `npm run check` (0 erreur, 0 avertissement, les 5 indications déjà présentes).
- `node scripts/e2e-espace.mjs` : **tout est bon, 553 constats** (530 + 1 de la 18.11 avec l'essai « Aujourd'hui » rendu solide, qui passe, + 22 nouveaux de la 18.12), e-mails fictifs injectés dans le gestionnaire `email` par `/cdn-cgi/handler/email` de `wrangler dev` :
  - Leboncoin par Modelo (texte en quoted-printable, sujet encodé) : contact créé « Demandes reçues », acheteur, référence du bien, ville, canal et source `portail`, à qualifier, ligne `nouveau` portail rattachée à l'événement ; ligne `portail_courriel` « lu » sans expéditeur, sujet ni texte ; carte (Leboncoin, « Demande de visite », nom, coordonnées, message en texte, référence ; Ranger, Vu, Écarter) ; seuls les champs utiles dans l'historique ; doublon (même Message-ID) sans effet ; Ranger et son annulation ;
  - SeLoger (HTML en base64, tableau) : complète le contact du carnet qui a ce téléphone (e-mail et référence ajoutés, nom et catégorie gardés), qui entre dans le suivi ; carte avec l'annonce et sa référence ; Écarter et son annulation ;
  - illisible : gardé avec expéditeur, sujet et texte, aucun contact, carte « à lire à la main » ; Ranger refusé (400), Vu accepté, texte gardé le temps de l'annulation puis effacé par la tâche planifiée ;
  - confirmation du transfert Gmail : carte avec le code ;
  - opposition : ni contact ni donnée gardée, carte avec la référence seulement ;
  - expéditeur inconnu : rejeté (« Adresse réservée aux demandes des portails immobiliers »), rien gardé ; e-mail de plus de 1 Mo : non lu, gardé et signalé ;
  - page à 1440 et 1280 px : barre repliée qui cite Leboncoin, carte « à lire à la main » avec tout le texte, message en texte, pas de débordement.
- Lecture vérifiée aussi à la main contre le serveur local (`wrangler dev`) : champs, portail, ville, annonce et référence lus pour un e-mail Leboncoin et un e-mail SeLoger ; contacts d'essai supprimés ensuite.
- Captures regardées (`espace/.verif/espace-nouveaux-portails-1440.png`, `espace-nouveaux-portails-1280.png`) : pastilles terracotta « Leboncoin », « SeLoger », « Portail d'annonces » ; carte « Code de confirmation du transfert Gmail : à saisir dans Gmail » avec le texte de l'e-mail sur fond bleu clair et le code lisible ; carte « Demande d'une personne qui a demandé l'effacement · Nom non gardé · Réf. OPP-… » ; carte « E-mail trop gros pour être lu » avec son sujet et l'expéditeur ; cartes Leboncoin et SeLoger avec nom, téléphone, e-mail, annonce, message, Ranger, Vu, Écarter. Rien ne déborde à 1280 px. Une première capture a montré un sujet non encodé mal lu (« PiÃ¨ce jointe ») : les en-têtes sont maintenant lus en UTF-8 (« Pièce jointe »).

## Écarts assumés
- **Formats** : seul le format Modelo est attesté (capture de JB, 13.2) ; les e-mails directs de Leboncoin et SeLoger sont lus avec des modèles fictifs réalistes (libellés courants, HTML en tableau). Un format différent donne une carte « à lire à la main » : rien n'est perdu, et la lecture s'adapte d'après cette carte.
- **Expéditeur falsifiable** : l'en-tête From peut être imité ; une fausse demande ne crée qu'un contact « à qualifier » et une carte, qu'Anne écarte d'un clic (« Écarter »). L'adresse de réception n'est connue que du filtre Gmail.
- **Confirmation du transfert Gmail** : montrée sur une carte « à lire à la main » (le code s'y lit) plutôt que renvoyée ailleurs.
- **Ménage par l'espace, pas par la purge du site** (`site/src/server/purge.ts`) : le site n'est pas modifié par cette story hors de la migration.
- **Droits RGPD** : l'export et l'effacement d'une personne (`rights.ts`) ne fouillent pas le texte des e-mails illisibles ; ce texte ne reste que jusqu'au traitement de la carte (plus 10 minutes). Un contact effacé laisse ses lignes `portail_courriel` lues sans contact ni donnée.
- **Projet acheteur** pour toute demande de portail (critère d'acceptation) : une demande sur une annonce est une demande d'acheteur ; la raison et le type de recherche sont gardés dans l'événement.
- **Un contact existant n'est jamais modifié au-delà de ce qui manquait** (nom, téléphone, e-mail, ville, référence) ; sa catégorie reste la sienne.
- **Ranger, Vu, Écarter** sur une demande de portail : mêmes gestes que pour le site ; un e-mail à lire à la main n'a que « Vu » (aucun contact à ranger).

## Ce qui reste
- **Réglages de JB** (RUNBOOK § 4 sexies, ≈ 25 min) : sous-domaine `entrant` et adresse `demandes@entrant.annevialtissot.fr` vers le Worker `anne-espace` dans Cloudflare Email Routing ; adresse de transfert confirmée et filtre dans la Gmail d'Anne. Puis vérifier sur une vraie demande.
- ~~Revue de code (`bmad-code-review`, session neuve, relecture par lot)~~ : faite le 2026-11-02 (section « Revue de code »).

## Revue de code
Relecture adverse (`bmad-code-review`) en session neuve, **2026-11-02**, PR #227, lot `2ed4fb8..c5dd329` relu (stories 18.9, 18.11 et 18.12 ensemble). Règle de JB du 2026-11-02 : seuls les constats « à corriger » sont corrigés, les « mineurs » sont notés sans correction. Numérotation commune au lot (1 à 11).

- Revue externe du 2026-11-02 (c5dd329..767458e) — constat 2 : corrigé (commit 39fe78c). L'enveloppe se falsifiant, un e-mail n'est lu que si l'en-tête de contrôle le plus haut du message (`Received-SPF`, `Authentication-Results` ou `ARC-Authentication-Results`, ajouté par Cloudflare) donne SPF « pass » pour gmail.com ; sinon il est gardé « à lire à la main » (motif `spf`), sans contact ni carte de contact. À vérifier sur le premier vrai e-mail transféré (README de l'espace, RUNBOOK § 4 sexies). Essais e2e : SPF pass en tête lu, SPF absent, pass sous un fail, autre domaine : à la main. Constats 3 et 4 : mineurs, notés sans correction (règle de JB du 2026-11-02).
- 4 (à corriger) — seul l'en-tête From était contrôlé, et c'est la première adresse entre chevrons qui était lue : corrigé (commit e1eb560). L'adresse lue est désormais le **dernier** « <adresse> » du From (`courriel.ts`) ; l'expéditeur d'enveloppe (`message.from`, passé par la fonction `email()` de `worker.ts`) doit être la Gmail d'Anne, lue dans le réglage public **`PORTAILS_EXPEDITEUR_AUTORISE`** de `wrangler.jsonc` (`avialtissot@gmail.com`), ou sa forme de transfert Gmail `avialtissot+…@gmail.com` ; la confirmation du transfert n'est acceptée qu'avec une enveloppe en `@google.com` (elle reste « à lire à la main »). Réglage vide : tout est refusé (rejet SMTP). Un e-mail refusé ne crée ni ligne, ni carte, ni contact. Documenté : RUNBOOK § 4 sexies, `wrangler.jsonc`, `espace/README.md`.
- 4 bis (reste, mineur) — signature DKIM (`Authentication-Results` dkim=pass) non vérifiée : la présence et la forme de cet en-tête après le transfert de Gmail puis Email Routing ne sont pas connues sans un vrai e-mail ; l'exiger à l'aveugle risquait de refuser toutes les vraies demandes. Quelqu'un qui connaît l'adresse de réception et la Gmail d'Anne peut encore annoncer une fausse enveloppe ; la carte s'écarte d'un clic. À revoir sur le premier e-mail réel (lire ses en-têtes).
- 11 (mineur) — contact orphelin si le lot d'écriture d'un e-mail de portail échoue après la création du contact : mineur, noté sans correction (règle de JB du 2026-11-02) : l'e-mail reste « à lire à la main » (motif `echec`), le contact créé est visible dans le carnet.
- 1 à 3, 5 à 9 : story 18.9 ; 10 : story 18.11.

Vérifications après correction (2026-11-02, tête `e1eb560`) : `site` : `npm run build` (avec la clé d'essai Turnstile) OK, `npm run check` 0 erreur, `npm run base:local` OK ; `espace` : `npm run build` OK, `npm run check` 0 erreur ; `node scripts/e2e-espace.mjs` : 4 passages complets sur le même code (le dernier sur une base locale neuve, l'ancienne mise de côté) : 562 vérifications OK sur 563 au mieux (passages 2 et 4) ; les 10 nouveaux essais « revue » au vert à chaque passage. Échecs restants, chacun sur un essai différent à chaque passage et sans rapport avec le lot corrigé, chacun au vert dans un autre passage : « synthèse : relue dans l'heure » (Leedflow, minutage), « bilan : test A/B » (passage 3), « 18.11 : une demande du site arrive dans Nouveaux » (passage 4), « refuse (415) corps non JSON » (passage 1 : 500 renvoyé par le serveur local de Cloudflare avant le Worker). Nouveaux essais « revue 18.9 » (4) et « revue 18.12 » (6) tous au vert.
