---
story: 10.6
epic: 10 — Capture des leads et backend
statut: review
date: 2026-10-08
---

# Story 10.6 — Rendez-vous Cal.com intégré

## Objectif
Le prospect réserve un vrai créneau dans l'agenda d'Anne depuis `/contact`, et Anne reçoit la réservation au format Modelo (critères : `_bmad-output/planning-artifacts/epics.md`, story 10.6 ; AD-4, AD-6, AD-7, AD-8, AD-11, AD-14, CAP-9).

## Décisions prises pendant la story
- **Rendez-vous par téléphone** (JB, 2026-10-08) : plus simple pour les clients qu'un lien Google Meet, et Anne enregistre et résume ses appels avec un service sur son téléphone. Journalisée dans `.memlog.md` de la spec et dans `RUNBOOK.md` § 2. Le lieu Cal.com « Premier échange » devient « numéro du participant » (action J28 de JB).
- Le plan gratuit de Cal.com signe ses webhooks (essai de la story 10.1, tickets #25 et #26) : le repli « notre propre formulaire avant Cal.com » n'est pas nécessaire.
- Une réservation sans case de confidentialité cochée est refusée (422) et n'est pas écrite : la case est obligatoire dans Cal.com, ce cas ne vient donc que d'un réglage cassé. Cal.com prévient quand même Anne par ses propres e-mails.
- Annulations et reports : acceptés et seulement journalisés. Cal.com prévient lui-même Anne et le prospect.

## Écarts assumés avec les critères
- Pas de bandeau de consentement : le verdict de la 10.1 ne l'exige pas, et rien n'est chargé depuis Cal.com avant le clic du visiteur.
- Pas de page `/en/contact` : elle n'existe pas encore sur le site, donc rien à brancher.

## Ce qui est fait
- `/contact` : le gabarit statique et le formulaire `rdv` sont supprimés. Le bouton « Voir les créneaux d'Anne » charge l'agenda de Cal.com (`cal.com/annevialtissot/premier-echange`, couleur de la charte) au clic, ou tout seul quand on arrive par `/contact#reserver` (bouton de la sortie A des résultats du diagnostic). Si le script de Cal.com ne se charge pas : message d'échec, renvoi vers le formulaire, et le bouton permet de réessayer.
- `POST /api/webhook-cal` (`src/pages/api/webhook-cal.ts`) et l'adaptateur `src/server/adapters/booking.ts` : signature `X-Cal-Signature-256` vérifiée en temps constant (401 sinon, 503 si le secret manque), `BOOKING_CREATED` traduit en lead `rdv` (nom complet, `prenom` null, téléphone en E.164 depuis le lieu ou le champ téléphone, date du rendez-vous, langue, note du prospect), `cal:<uid>` comme clé d'idempotence, un seul envoi `notify_anne`.
- Migration `0004-rendez-vous.sql` : colonne `rdv_start`.
- Notification à Anne : « À faire : appeler +33 … le vendredi 16 octobre à 11:00 », notes Modelo avec le rendez-vous, type de contact « À préciser pendant l'appel ».
- L'essai provisoire `/api/essai-cal` de la 10.1 est retiré de `worker.ts`.
- Portée aussi par la PR de cette story : la ligne vide de la notification du diagnostic (retour de JB, restée hors de la PR #44).
- Documents : `site/README.md` (§ « Rendez-vous Cal.com », TODO 4 barré, santé à 4 migrations), `RUNBOOK.md` (chemin ouvert dans Access, adresse du webhook, journal), `CLAUDE.md` (commande d'essai).

## Ce qui est vérifié (2026-10-08, en local)
- `node scripts/e2e-rendez-vous.mjs` (serveur local, base locale, imitation de Resend et du script de Cal.com) : **30 constats sur 30** :
  - signature absente, fausse ou faite avec un autre secret : 401, rien d'écrit ;
  - réservation valide puis rejouée : un seul lead `rdv`, téléphone `+33698765432`, date gardée, acceptation horodatée, une seule notification vers la boîte de test, avec l'objet, la consigne d'appel et l'heure de Paris attendus ;
  - case non cochée : 422, rien d'écrit ; annulation : ignorée ;
  - navigateur : aucun appel à Cal.com avant le clic ; agenda injoignable : message d'échec, puis chargement au clic suivant ; bouton masqué une fois l'agenda prêt ; arrivée par `#reserver` : agenda chargé sans clic ; aucune erreur console. Capture `.verif/e2e-rendez-vous-contact.png`, e-mail `.verif/e2e-rendez-vous-notification.txt`.
- `node scripts/e2e-formulaires.mjs` et `node scripts/e2e-diagnostic.mjs` : tous les constats bons.
- `npm run build` sans erreur ; `npm run check` : 0 erreur ; `node scripts/liens.mjs` : 24 pages, 1465 liens, 0 cassé ; `npm run verif` : aucune erreur console ; `node scripts/ecrans.mjs` : aucun débordement signalé.

## Ce qui reste
- JB (J28) : dans Cal.com, lieu du « Premier échange » = « numéro du participant » ; question obligatoire « confidentialite » (case à cocher) déjà en place depuis la 10.1, à garder.
- JB : dans Cloudflare Access, ouvrir le chemin `/api/webhook-cal` au lieu de `/api/essai-cal` (adresse de la branche le temps de l'essai, puis celle de `main`), et changer l'adresse du webhook dans Cal.com. Puis une vraie réservation sur l'aperçu : agenda réel affiché, e-mails de Cal.com reçus, notification du site reçue dans la boîte de test.
