---
story: 10.4
epic: 10 — Capture des leads et backend
statut: review
date: 2026-10-08
---

# Story 10.4 — Gate du diagnostic côté serveur

## Objectif
Le score du diagnostic est calculé par le serveur et affiché seulement après la saisie des coordonnées ; chaque diagnostic terminé devient un lead (critères : `_bmad-output/planning-artifacts/epics.md`, story 10.4 ; AD-5, CAP-4, CAP-5, CAP-7).

## Décisions prises pendant la story
- 2026-10-08, Claude (rectification) : la grille de la question 10 (action A09 d'Anne) ne bloque pas la story. Le serveur lit `bareme.json` tel qu'il est ; si Anne change une note, on modifie un chiffre, sans rien reconstruire. JB en est informé dans le fil Back-end.
- 2026-10-08, Claude (défaut, réversible) : le gate n'affiche plus le score avant les coordonnées. AD-5 interdit qu'il existe dans le navigateur avant soumission, ce qui prime sur la maquette (écart écrit dans `site/README.md`).
- 2026-10-08, Claude (défaut) : « à usage unique par navigateur » = le premier navigateur qui ouvre le lien reçoit une clé (cookie HttpOnly) dont la base garde l'empreinte ; l'adresse est ensuite rechargée sans jeton. Un autre navigateur obtient 404.
- 2026-10-08, Claude (défaut) : l'accusé de réception au prospect contient le résumé de ses scores, sans lien vers la page (qui ne s'ouvre que dans son navigateur).

## Écarts assumés avec les critères
- **Guide et séquence** : comme prévu par les critères, le bouton guide mène à `/guide` jusqu'à la story 10.5. L'inscription à la séquence depuis les résultats est réelle (`POST /api/diagnostic/sequence`, `newsletter_opt_in_at`), mais la séquence elle-même part avec la 10.5 : la page dit « Inscription enregistrée » au lieu du texte de la maquette.
- **Page anglaise** : il n'existe pas encore de diagnostic en anglais (epic 11) ; rien à rendre en `/en/…`.

## Ce qui est fait
- `POST /api/diagnostic` (`src/pages/api/diagnostic.ts`) passe par `src/server/capture.ts` (Turnstile, champ piège, fréquence, contrat de la source dans `src/server/schema.ts`, avec l'indicatif FR +33 / CH +41), puis `src/server/diagnostic.ts` revérifie les réponses contre `questions.json` et calcule le diagnostic avec `src/server/scoring.ts` (déplacé de `src/lib/`). `bareme.json` n'est plus dans le JavaScript du navigateur (vérifié dans `dist/client`).
- Écriture (`src/server/leads.ts`) : lead `diagnostic` avec `token` (32 octets aléatoires), `answers`, `scores`, `band`, `orientation`, `message` (question 15), `newsletter_opt_in_at` si cochée au gate, et les envois `notify_anne` et `confirm_prospect`. Un renvoi renvoie le jeton du premier envoi.
- Page de résultats rendue par le serveur (`src/pages/diagnostic/resultats.astro`, `src/server/resultats.ts`), migration `0003-jeton-resultats.sql` (colonne `token_browser`), `run_worker_first` dans `wrangler.jsonc`. L'îlot `resultats.ts` et le stockage de session ont disparu.
- Îlot `src/islands/diagnostic.ts` : vrai envoi (Turnstile chargé au premier envoi), `submission_id` gardé avec les réponses jusqu'au succès, erreurs du serveur affichées sur le bon champ, sauvegarde locale effacée après succès. `envoyerSimule()` supprimé.
- E-mails (`src/server/messages.ts`) : notification à Anne au format Modelo avec score, profil, sous-scores, sortie, message libre et réponses en clair ; résumé des scores au prospect.
- Case du téléphone du gate : l'indicatif prenait toute la largeur (`.champ select { width: 100% }` de `global.css` l'emportait) ; règle rendue plus précise dans `questions.astro`.
- `Lockup.astro` inclut ses SVG à la construction (le disque n'existe pas dans le Worker, la page de résultats ne s'affichait pas).
- Essais : `scripts/serveur-essai.mjs` (serveur local et imitations, partagé), `scripts/e2e-diagnostic.mjs` réécrit, `scripts/e2e-formulaires.mjs` branché dessus.
- Documentation : `site/README.md` (§ Diagnostic réel, TODO(backend), écarts, commandes, santé), `CLAUDE.md` (commande).

## Ce qui est vérifié (2026-10-08, en local)
- `node scripts/e2e-diagnostic.mjs` (serveur local, base locale, imitation de Turnstile et de Resend) : **31 constats sur 31** :
  - gate valide : adresse des résultats liée à un jeton ; lead écrit (score 100, profil « Bien préparé », sortie A, sous-scores, message libre, marque de test) ; renvoi : même adresse, aucun second lead ; « minimiser les frais » force la sortie B ; numéro suisse saisi avec CH +41 écrit `+41791234567` ;
  - refus sans rien écrire : option inconnue, question manquante, « aucune » avec une autre réponse, question inventée, « autre » sans précision (400), jeton anti-robot refusé (403) ;
  - page de résultats : première ouverture = clé posée et rechargement sans jeton ; résultats rendus par le serveur ; même lien dans un autre navigateur, sans clé, jeton inconnu, après 24 heures : 404 « Ce lien n'est plus valable » ;
  - séquence : refusée sans la clé (404) ou depuis un autre site (403), horodatée avec la clé ;
  - e-mails : tous vers la boîte de test ; notification avec score, sortie et réponses ; résumé au prospect sans lien ;
  - navigateur, 17 écrans : sortie A (mobile, avec abandon et reprise), sortie B (ordinateur, avec une coupure puis « Renvoyer »), « Stratégie à risque » (mobile, séquence cochée au gate) : gate sans score, case du téléphone de 232 px (mobile) et 482 px (ordinateur), Turnstile chargé seulement à l'envoi, un lead par parcours avec sa campagne, sauvegarde locale effacée, barème jamais téléchargé, aucune erreur dans le navigateur. Captures `.verif/diag-*.png`, e-mails `.verif/e2e-diagnostic-emails.txt`.
- `node scripts/e2e-formulaires.mjs` : 25 constats sur 25 (les formulaires de la 10.3 n'ont pas bougé).
- `npm run build` sans erreur ; `npm run check` : 0 erreur (site et code serveur) ; `node scripts/liens.mjs` : 24 pages, 1466 liens, 0 cassé ; `npm run verif` : aucune erreur console.

## Ce qui reste
- Essai sur l'aperçu par JB (vrai widget Turnstile, vraie base, vrais e-mails de test) : faire le diagnostic jusqu'au bout, vérifier la page de résultats, rouvrir le lien dans un autre navigateur (page « lien plus valable »), et les deux e-mails reçus.
- Anne : valider la grille de la question 10 (A09) ; relire les deux e-mails du diagnostic (A17).
- Story 10.5 : lien signé du guide, envoi de la séquence, textes de la maquette.
