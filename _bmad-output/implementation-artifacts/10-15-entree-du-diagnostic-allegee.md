---
story: 10.15
epic: 10 — Capture des leads et backend
statut: review
date: 2026-10-30
---

# Story 10.15 — Entrée du diagnostic allégée : prénom et e-mail d'abord, téléphone facultatif

## Objectif
Le 30 octobre 2026, JB décide de refaire de la page /diagnostic la destination des publicités, sans attendre la lecture du test A/B le 9 novembre. Le fil Stratégie propose de retirer la friction annoncée sous le bouton (« Le résultat complet s'obtient contre vos coordonnées, téléphone compris »). JB valide le changement d'ordre (« ok pour modifier l'ordre dans les coordonnées ») puis le téléphone facultatif (« on va mettre le téléphone en facultatif. Et donc, OK pour les deux. »). Il autorise ensuite la fusion sans attendre son accord, une fois la revue faite.

Ce qui est demandé :
- prénom et e-mail avant la question 1, au lieu des quatre champs à la fin ;
- téléphone facultatif ;
- la phrase « Votre rapport arrive par e-mail. Le téléphone, seulement si vous souhaitez qu'Anne vous appelle. » sous le bouton de /diagnostic et sur le champ du téléphone ;
- l'étape « coordonnées » comptée à sa nouvelle place, pour que le Bilan reste lisible ;
- dans l'espace, un contact qui a donné son téléphone passe en tête, à rappeler en priorité ;
- RGPD inchangé (consentement, purge) et AD-11 (rien dans le navigateur).

Le nom de famille n'est plus demandé : recommandation de Claude (carte de décision du 30 octobre), puisque le rapport et les e-mails n'utilisent que le prénom. Facile à remettre si JB le souhaite.

## Ce qui est fait
- **Écran d'entrée** (`site/src/islands/diagnostic.ts`) : avant la question 1, « À qui envoyer votre rapport ? » avec prénom, e-mail, case d'accord et la mention de finalité. Prénom et e-mail restent en mémoire de la page, jamais dans le stockage local (AD-11). Un parcours repris après fermeture les redemande, puis reprend à la question où il s'était arrêté.
- **Écran final** : rappel « Prénom, votre rapport part à <e-mail> · Modifier » (retour à l'écran d'entrée, valeurs gardées), téléphone facultatif avec la phrase convenue, case de la séquence, bouton « Voir mon diagnostic ». Un numéro mal saisi est signalé ; vide, il est accepté. Si le serveur refuse le prénom ou l'e-mail, le message renvoie vers « Modifier ».
- **Page /diagnostic** : la ligne sous le bouton devient « Votre rapport arrive par e-mail. Le téléphone, seulement si vous souhaitez qu'Anne vous appelle. »
- **Serveur** (`site/src/server/schema.ts`) : pour la source `diagnostic`, nom et téléphone facultatifs ; les autres formulaires ne changent pas. `rapport.ts` compose le nom sans nom de famille.
- **Contacts** (`site/src/server/contacts.ts`) : un contact créé (ou réveillé) sans téléphone a pour prochaine action « Écrire pour qualifier (pas de téléphone) ». Dans l'espace, « À rappeler maintenant » met ceux qui ont un téléphone en tête, puis le plus ancien (`espace/src/server/pipeline.ts`) ; la carte d'un contact sans téléphone propose « Écrire » et affiche sa prochaine action.
- **Comptage** :
  - l'écran d'entrée est compté en étape `coordonnees`, précision `entree` (`site/src/server/entonnoir.ts`) ; l'ancienne forme, sans précision, reste acceptée pour les pages ouvertes avant le changement ;
  - le temps d'affichage et le premier toucher sont mesurés sur cet écran, devenu le premier écran.
- **Bilan** (`espace/src/server/entonnoir.ts`, `espace/src/pages/bilan.astro`) :
  - tableau par campagne : Arrivées, Prénom et e-mail, Commencé, Question 8, Envoyé, Résultat ;
  - étape par étape : l'écran d'entrée et le premier toucher avant la question 1 ; l'ancien écran final des coordonnées n'apparaît que si la période en contient ;
  - la ventilation « premier écran → suite » prend l'écran d'entrée → question 1 pour les nouveaux passages, question 1 → question 2 pour les anciens ;
  - test A/B : les entrées comptent aussi l'écran d'entrée.

  Mêmes chiffres dans `/api/claude/bilan`, clés inchangées.
- **Page Cookies** : dit que l'écran du prénom et de l'e-mail est compté et que ces coordonnées ne sont pas gardées sur l'appareil.
- **Documents** : `site/README.md` (diagnostic, entonnoir, écart assumé), spine d'architecture (écart à AD-6 pour le diagnostic), `.memlog.md` de la spec, epics, statut de sprint.

## Lecture des chiffres après le changement
- Depuis le 30 octobre, atteindre la question 1 suppose d'avoir donné son prénom et son e-mail. La question 2, objectif du test A/B, veut donc dire « coordonnées données et question 1 répondue ». Les passages d'avant et d'après ne se comparent pas directement sur ce point.
- La ligne « Prénom et e-mail » du Bilan compte les visiteurs qui ont vu l'écran d'entrée ; ceux qui l'ont rempli sont ceux qui atteignent la question 1.

## Vérifié (2026-10-30)
- `npm run check` (site et espace) : 0 erreur.
- `npm run build` (site, avec la clé Turnstile d'essai ; espace) : construit.
- `node scripts/e2e-diagnostic.mjs` : tous les constats sont bons, dont :
  - écran d'entrée vide refusé (prénom, e-mail, accord) ;
  - écran final sans score ni nom, e-mail rappelé ;
  - numéro incomplet signalé, téléphone laissé vide accepté (Alice) ;
  - lead sans nom, téléphone absent ou au format international ;
  - reprise : coordonnées redemandées, question reprise comptée une fois ;
  - écran d'entrée compté avec son temps d'affichage et son premier toucher ;
  - page préchargée « cachee » ;
  - arrivée par la publicité jusqu'à l'écran d'entrée, ligne du téléphone facultatif ;
  - API : diagnostic sans nom ni téléphone accepté, contact « Écrire pour qualifier », numéro mal saisi refusé.
- `node scripts/e2e-formulaires.mjs` : bons (le contact et l'estimation exigent toujours nom et téléphone).
- `node scripts/e2e-rapport.mjs` : bons.
- `node scripts/e2e-espace.mjs` : 299 constats bons, sur une base locale remise à neuf (l'ancienne dépassait 100 contacts à qualifier, limite de l'accueil). Constats nouveaux : ordre téléphone d'abord, écran d'entrée avant la question 1 dans le Bilan, ventilation du premier écran.
- `node scripts/liens.mjs` : 27 pages, 1863 liens, 0 cassé.
- Captures : `site/.verif/diag-*-entree*.png`, `diag-*-gate*.png`.

## Revue de code
2026-10-30, `bmad-code-review` dans une session neuve, PR #218, commit 68afbc2 relu. Rien de grave ; quatre constats et deux défauts plus anciens :
1. (moyen) Une reprise recomptait l'écran d'entrée et son premier toucher : chaque reprise passait pour un visiteur perdu avant la question 1 (Bilan, test A/B, ventilation). Corrigé (commit suivant) : un parcours repris ne compte ni l'un ni l'autre ; constat ajouté à `e2e-diagnostic.mjs` (parcours A).
2. (bas) Un contact à qualifier par e-mail qui laisse plus tard un téléphone gardait l'action « pas de téléphone ». Corrigé (commit suivant) : il redevient « Rappeler pour qualifier » ; constat ajouté.
3. (bas) La notification à Anne disait « rappeler » pour une sortie A sans téléphone. Corrigé (commit suivant) : « écrire à <e-mail> … (pas de téléphone laissé) ».
4. (bas) Sur une période qui commence avant le 30 octobre, « Partis avant » de l'écran d'entrée comptait les anciens passages comme perdus. Corrigé (commit suivant) : non calculé quand la question 1 a plus de passages que l'écran d'entrée.
- Hors périmètre, déjà présent : sur l'écran d'entrée, le logo ouvrait la fenêtre « Vos réponses sont gardées » sans réponse à garder. Corrigé au passage : le logo mène directement à l'accueil tant que rien n'est répondu. Écarté : un rechargement sur l'écran final ne propose pas la reprise (comportement d'avant la story, à traiter à part si besoin).

Après corrections : `npm run check` (site, espace) 0 erreur ; `e2e-diagnostic` tous bons ; `e2e-espace` 299 constats bons.

## Reste
- Revue de code, PR, fusion (autorisée par JB le 2026-10-30), vérification en production.
- Prévenir le fil de la campagne : la question 2 veut dire désormais « coordonnées données et question 1 répondue ».
