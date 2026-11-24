# Story 18.30 : critères complets des acheteurs et résumé sur le contact

- Epic : 18 (carnet de contacts). Statut : review (revue de code en session neuve à faire).
- Demande : Anne, ticket GitHub n° 284 (étiquette `retour-apercu`), mot pour mot : « Pour les acheteurs besoin d'avoir l'exhaustivité de leurs critères : maison ou appart, surface min max, nbre de chambres, surface terrain min max, budget fourchette, secteur, critères rédhibitoires, les nice to habe, les must. […] Pour les critères de recherche, j'aimerais pouvoir avoir un résumé ergonomique quand on va sur le contact ». L'autre moitié du ticket (« Enlever la catégorie "prospect" et mettre à la place les acheteurs d'un côté et les vendeurs de l'autre ») n'est pas dans cette story : elle attend la réponse de JB.

## Objectif

1. Des critères complets pour un acheteur : type de bien (Maison, Appartement, Terrain, plusieurs possibles), surface habitable min et max, nombre de chambres au moins, terrain min et max, budget min et max, secteur, « Indispensable », « Apprécié », « Rédhibitoire ». Rangés dans la qualification existante (`contact.qualification`), sans migration. Les anciennes données (surface minimale, budget en texte libre) restent lues.
2. Sur le panneau du contact (page Contacts), un résumé lisible « Ce qu'il cherche » en haut, et un bouton « Modifier les critères » qui ouvre le formulaire dans le panneau.
3. La page « Qualifier » demande les mêmes critères : ce qui est noté à la qualification et dans le panneau est la même donnée.

## Ce qui est fait

- `espace/src/server/criteres.ts` (nouveau) : vocabulaire des critères, lecture stricte (`lireCriteres` : entiers positifs bornés, min ≤ max, textes nettoyés et jamais coupés en silence), fusion dans la qualification (`fusionnerCriteres`, `verifierBornes` : un maximum envoyé seul ne passe pas sous un minimum déjà noté), mise en phrase (`resumeCriteres`, `ligneBien`, `budgetLisible`…), lecture de l'ancien format (`vueCriteres`, `budgetAncien`). Sans accès à la base : l'îlot du panneau l'importe aussi.
- `espace/src/server/carnet.ts` : `Correction.criteres`, lu par `lireCorrection` ; `corrigerFiche` fusionne dans `contact.qualification` (les autres réponses, délai, agence…, restent), avec la garde de version, l'événement « classement » et l'avant-image de la qualification (AD-29) ; sans changement réel, rien n'est écrit.
- `espace/src/server/fiche.ts` : la fiche renvoie `parcours` et `recherche` (seulement les critères, pas le délai ni l'agence). `espace/src/pages/api/fiche.ts` : en-tête à jour, refus de bornes en 400.
- `espace/src/islands/fiche-contact.ts` et `espace/src/pages/index.astro` : bloc « Ce qu'il cherche » en tête du panneau (acheteur, vendeur et acheteur, ou parcours acheteur), formulaire « Modifier les critères », seuls les critères changés sont envoyés, saisie gardée si l'enregistrement est refusé.
- `espace/src/pages/contacts/qualifier.astro` : mêmes champs, mêmes contrôles (message et saisie gardée si refus) ; les anciens champs `a_surface` et `a_budget` sont encore acceptés.
- `espace/src/server/pipeline.ts` : `rechercheRenseignee` et `rechercheCourte` lisent les nouveaux critères (fiche de suivi, historique de qualification) ; `espace/src/pages/acheteurs.astro` : colonne Budget lue par `budgetLisible`.
- `espace/scripts/e2e-espace.mjs` : bloc `bloc1830` (`E2E_1830_SEUL=1`, aussi appelé dans l'essai complet après le dernier bloc) ; le constat 13.15 « budget demandé » cherche maintenant `a_budget_min`.
- `espace/README.md` : paragraphe de la story.

## Écarts assumés

- L'annulation de lot (`annulerLot`) ne rend que le classement (colonnes de `Classement`), comme pour les autres corrections de fiche (nom, téléphone…) : l'avant-image des critères est dans l'événement, lisible, mais il n'y a pas de bouton qui la rejoue.
- Un nombre à 0 est rangé comme « vide » (pas de surface minimale de 0).
- Un ancien budget qui ne se lit pas en deux montants (par exemple « 700 k€ » seul) reste affiché tel quel, au-dessus du formulaire, tant qu'aucun montant n'est saisi.
- Les listes d'avant (pièces, extérieur, stationnement, autres critères, financement) sont aussi dans le formulaire du panneau, pour que la même donnée se corrige aux deux endroits.

## Ce qui est vérifié

- `espace` : `npm run build` et `npm run check` : 0 erreur (2026-11-24). `site` : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` : construit (aucun fichier du site changé).
- `E2E_1830_SEUL=1 node scripts/e2e-espace.mjs` : 29 constats « 18.30 » bons, aucun échec (la ligne finale « 1 échec(s) » est l'arrêt voulu du mode seul) : écriture et relecture par l'API, événement avec avant-image, saisie sans changement qui n'écrit rien, critère vidé, 20 saisies refusées en 400 sans rien écrire (min > max y compris contre une borne déjà notée, négatif, décimal, texte, hors borne, trop long, hors liste, critère inconnu), bornes exactes acceptées, jeton de Claude refusé (403), résumé du panneau (« Maison · 120 à 160 m² · 3 chambres et plus · terrain 800 m² et plus · 650 à 800 k€ · Anthy, Sciez » et les trois lignes), bloc en haut du panneau, absent pour un vendeur, phrase d'invite sans critère, ancien format affiché et repris par le formulaire, modification depuis le panneau, refus dans le panneau, pas de défilement horizontal à 1440 px, aucune erreur JavaScript, page « Qualifier » (mêmes champs, refus, mêmes clés écrites, lecture dans le panneau et sur la fiche de suivi).
- `E2E_1822_SEUL=1 node scripts/e2e-espace.mjs` (page Contacts, pas de régression) : 4 constats 18.22 bons.
- Captures à 1440 px (contacts fictifs) : `criteres-resume-1440.png` (résumé), `criteres-formulaire-1440.png` (formulaire), `criteres-panneau-acheteur-1440.png`.
- Essai complet `e2e-espace.mjs` non relancé en entier (environ 25 minutes, et un défaut ancien arrête déjà l'essai, voir la story 18.29).

## Revue de code

2026-11-24, `bmad-code-review` en session neuve, commit a00da01 relu (diff origin/main..a00da01). Aucun constat bloquant.

1. Une ancienne surface en texte libre (« 120 à 150 ») était cachée, puis effacée par la page de qualification : corrigé (commit suivant). Elle s'affiche telle quelle, une ligne « Surface notée avant » la montre au-dessus des deux formulaires, et elle n'est retirée que si une surface est saisie.
2. `budgetAncien` lisait n'importe quel texte à deux nombres (« T4, 800 k€ » donnait 4 000 à 800 000 €) : corrigé. Le texte entier doit être « montant, séparateur (à, -, et), montant » ; sinon il reste en texte.
3. Pas d'annulation par lot des critères : écarté, déjà noté dans « Écarts assumés » (l'avant-image est dans l'événement).
4. `maxlength="12"` sur les champs de nombres : corrigé, 20.
5. Le financement ne s'efface pas depuis la page de qualification : écarté, comportement d'avant ; le panneau a « Pas noté ».
6. `CRITERES_TAPES` garde `surface` : écarté, sert au type `CleAcheteur`.

Après corrections : `npm run build` et `npm run check` (espace) : 0 erreur ; `E2E_1830_SEUL=1` : 29 constats sur 29.

## Ce qui reste

- Partie « catégorie prospect » du ticket n° 284 (remplacer par acheteurs d'un côté, vendeurs de l'autre) : en attente de JB.
- Revue de code (`bmad-code-review`) en session neuve, avant de proposer la PR à JB ; le résultat sera cité ici, section « Revue de code ».
- Fermer le ticket n° 284 une fois les deux parties faites (ou répondre en une ligne pour la seconde).
