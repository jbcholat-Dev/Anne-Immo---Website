---
story: 10.5
epic: 10 — Capture des leads et backend
statut: done
date: 2026-10-08
---

# Story 10.5 — Guide par lien signé et séquence d'e-mails de la sortie B

## Objectif
Le prospect reçoit le guide par un lien personnel valable 7 jours et, s'il l'a demandé, la série d'e-mails d'Anne, avec un désabonnement en un clic ; le fichier n'a aucune adresse publique (critères : `_bmad-output/planning-artifacts/epics.md`, story 10.5 ; AD-1, AD-2, AD-6, AD-8, AD-12, AD-16, CAP-8).

## Décisions prises pendant la story (défauts annoncés à JB le 2026-10-08)
- **PDF provisoire** : Anne n'a pas encore livré le guide rebrandé (A-10). Claude le fabrique depuis `contenu-anne/guide/texte-actuel.md`, aux polices et au logo de la charte (`site/scripts/guide-pdf.mjs`), marqué « version provisoire » tant que `contenu-anne/guide/guide.md` est en `statut: brouillon`.
- **Séquence branchée telle quelle** : les brouillons d'Anne (`contenu-anne/guide/sequence-emails/etape-1` à `etape-6`, délais 2, 4, 6, 9, 12 et 15 jours) partent tels quels sur l'aperçu, donc vers la boîte de test.
- **Garde-fou de lancement** : la construction de production (`PUBLIC_INDEXATION=oui`) échoue tant qu'une étape ou le guide n'est pas en `statut: publie`.
- **Secret `LIEN_SECRET`** dans Cloudflare (action J31 de JB) : sans lui, aucun lien n'est produit et les e-mails partent sans lien.

## Écarts assumés avec les critères
- Un seul guide générique : la clé `band` du lead n'est pas utilisée (Anne n'a pas décidé d'en faire un par profil, `contenu-anne/guide/corrections.md`).
- Le PDF est embarqué dans le Worker à la construction (`?inline`) au lieu d'être rangé dans un stockage à part : aucune adresse publique, rien à configurer.
- Séquence lue dans `contenu-anne/guide/sequence-emails/` (`import.meta.glob`), sans type `SequenceEmail` dans `content.config.ts` : les fichiers d'Anne restent la seule source.
- Séquence en français seulement : un lead anglais n'est pas inscrit (au lieu de faire échouer la construction) tant que la traduction n'est pas livrée (epic 6).
- Envoi toutes les 15 minutes, par la tâche planifiée qui rejoue déjà les e-mails en échec, au lieu d'une fois par jour.
- Désabonnement en deux temps : l'ouverture du lien affiche un bouton, c'est le bouton qui désabonne (certaines messageries ouvrent les liens toutes seules). La désinscription en un clic depuis la messagerie (`List-Unsubscribe`) est servie à part.
- « Je n'ai rien reçu » mène à `/contact#ecrire` au lieu de renvoyer l'e-mail.
- Le résumé de la sortie B (`confirm_prospect` du diagnostic) porte aussi le lien du guide.

## Ce qui est fait
- `site/scripts/guide-pdf.mjs` → `site/prive/guide.pdf` (11 pages, 125 Ko), hors de `public/`.
- Migration `0005-envoi-du-guide.sql` : canal `guide` dans `lead_delivery`.
- `src/server/liens.ts` : liens signés HMAC SHA-256 (guide 7 jours, désabonnement), comparaison en temps constant, `desabonner()` (horodate `newsletter_unsubscribed_at`, annule les étapes restantes).
- `src/server/sequence.ts` : étapes, délais, lignes `sequence:<n>` à l'inscription, texte des e-mails, garde-fou de lancement.
- Routes : `GET /api/guide/telecharger` (PDF ou 404), `POST /api/diagnostic/guide` (bouton des résultats), `POST /api/diagnostic/sequence` (crée la séquence une seule fois), page `/desabonnement` (rendue par le serveur), `POST /api/desabonnement` (un clic, `worker.ts`).
- `src/server/delivery.ts` : lien du guide dans `confirm_prospect`, canal `guide`, étapes de séquence avec en-têtes `List-Unsubscribe` ; une étape d'un lead désabonné ou retirée est annulée ; la tâche planifiée envoie les lignes arrivées à échéance.
- Pages : `/guide` (case « Recevoir aussi 6 e-mails… », confirmation avec « Ouvrir le guide maintenant », « valable 7 jours ») ; résultats du diagnostic (« Le guide est parti… », « Séquence de 6 e-mails confirmée. Le premier arrive dans 2 jours », nombre lu dans les textes d'Anne). TODO(backend) 3 et 5 levés.
- Documents : `site/README.md` (§ « Guide et séquence », TODO, santé à 5 migrations, écarts), `RUNBOOK.md` (secret `LIEN_SECRET`, journal), `CLAUDE.md` (commandes `e2e-guide` et `guide-pdf`).

## Ce qui est vérifié (2026-10-08, en local)
- `node scripts/e2e-guide.mjs` (serveur local, base locale, imitation de Resend) : **38 constats sur 38**. Il couvre :
  - la demande du guide et son lien ;
  - les liens faux ou périmés, qui répondent 404 ;
  - l'envoi planifié des étapes ;
  - le désabonnement, par la page et en un clic ;
  - l'inscription sans case cochée ;
  - le navigateur : `/guide`, résultats B, bouton du guide, séquence et page de désabonnement.
- `e2e-formulaires` 25/25, `e2e-diagnostic` et `e2e-rendez-vous` : tous les constats bons.
- `PUBLIC_INDEXATION=oui npm run build` échoue avec « Lancement refusé : … (etape-1 … etape-6, guide.md) ».
- `npm run build` sans erreur ; `npm run check` : 0 erreur ; `node scripts/liens.mjs` : 24 pages, 1466 liens, 0 cassé ; `npm run verif` : aucune erreur console ; `node scripts/ecrans.mjs` : rien à signaler. Captures `.verif/guide-confirmation.png`, `.verif/resultats-guide-envoye.png` et `.verif/desabonnement.png` regardées.

## Vérifié en ligne (2026-10-08, après la fusion de la PR n° 51, par JB)
- Secret `LIEN_SECRET` posé dans Cloudflare.
- Demande du guide sur `/guide` : e-mail « [TEST] Votre guide « Les 10 erreurs fatales des vendeurs particuliers » » reçu avec son lien ; le lien ouvre le PDF ; « Ouvrir le guide maintenant » aussi (captures de JB).
- Séquence : les 6 lignes `sequence:1` à `sequence:6` créées en base ; échéance avancée par JB dans la console D1 pour l'essai ; les 6 passées en `delivered` à 12:30 UTC, e-mails reçus (« Pourquoi votre bien est invisible… », « Comment arrêter de perdre votre temps en visites inutiles »…). Retour de JB : la mise en page des e-mails (texte brut) est à reprendre, d'où la story 10.9.

- Désabonnement : bouton « Arrêter les e-mails » d'un e-mail de la séquence → page « C'est fait : vous ne recevrez plus la série de conseils d'Anne » (capture de JB).

## Correction après l'essai (2026-10-08)
- Le PDF suivait encore l'ancienne charte et collait deux éléments du texte : la checklist numérotée (un seul paragraphe) et le tableau de suivi (barres verticales affichées). `scripts/guide-pdf.mjs` gère désormais les listes numérotées et les tableaux (intertitre gardé sur la même page) et prend les polices de la charte v3 (Gilda Display, Jost, story 8.8). PDF refait (10 pages). `npm run build` sans erreur, `e2e-guide` : tous les constats bons.

- Objet du 6e e-mail : « [Prénom], on fait le point ? » partait tel quel. `sujetEtape()` (`src/server/sequence.ts`) remplace le prénom dans l'objet comme dans le texte (sans prénom, l'objet commence par « On fait… »). Nouveau constat dans `e2e-guide` : « objet du dernier e-mail avec le prénom : [TEST] Bruno, on fait le point ? ». `npm run check` : 0 erreur, `e2e-guide` : tous les constats bons.

## Ce qui reste
- Mise en page des e-mails : story 10.9.
- Anne : relire le guide et les 6 e-mails, puis passer leur `statut` à `publie` (Claude refait alors le PDF). Sans cela, le lancement est refusé.
