---
story: 10.12
epic: 10 — Capture des leads et backend
statut: review
date: 2026-10-26
---

# Story 10.12 — Entonnoir du diagnostic, compté sans cookie et lu par campagne

## Objectif
La publicité Meta du diagnostic tourne depuis le 2026-10-25 au soir (8 clics, puis 22 visites venues de Facebook sur /diagnostic en 24 h d'après Cloudflare Web Analytics, aucune sur /diagnostic/questions, aucun diagnostic envoyé). JB veut savoir où les visiteurs s'arrêtent, campagne par campagne, pour décider s'il faut raccourcir le diagnostic ou demander les coordonnées plus tôt ou plus tard (message de JB du 2026-10-26).

Cette story reprend la partie « mesure » de la story 10.8 (critère `funnel_event`, AD-11). La surveillance des pannes et le test synthétique quotidien restent dans la 10.8, reportés (décision de JB du 2026-10-26 : « la mesure seule »). Cloudflare Web Analytics, l'autre moitié de la mesure prévue par AD-11, est déjà actif : Cloudflare l'injecte de lui-même depuis début octobre (constaté le 2026-10-26 par le fil de la campagne Instagram).

## Ce qui est fait
- **Comptage** (`site/src/islands/entonnoir.ts`) : chaque page tire un numéro de passage au hasard, gardé en mémoire de la page seulement, et envoie l'étape atteinte avec les paramètres `utm_*` de l'adresse (sendBeacon, qui part même pendant la redirection vers les résultats). Étapes : `arrivee` (page /diagnostic), `ecran` (chacun des 17 écrans, `q01`…`q15`), `reprise` (reprise d'un parcours interrompu), `coordonnees` (écran des coordonnées), `envoi`, `echec` (envoi refusé ou coupé), `resultat`. Branché dans `site/src/islands/diagnostic.ts` et `site/src/pages/diagnostic/index.astro`.
- **Réception** (`site/src/pages/api/entonnoir.ts`, `site/src/server/entonnoir.ts`) : `POST /api/entonnoir` vérifie tout (numéro au format ULID, étape connue, écran existant dans `questions.json`, utm nettoyés, en minuscules, 80 caractères au plus), limite à 60 passages par minute et par adresse IP (`LIMITE_ENTONNOIR`, `wrangler.jsonc`, l'adresse n'est pas gardée), écrit une ligne `entonnoir` et répond 204. Un passage déjà compté pour la même étape est ignoré (index unique). Hors production, chaque ligne est marquée test.
- **Base** : migration `0015-entonnoir.sql` (table `entonnoir` : parcours, étape, écran, source, support, campagne, contenu, langue, test, date). Aucune donnée personnelle, aucun lien vers `lead`. Purge des lignes de plus de 13 mois par la tâche planifiée (`site/src/server/purge.ts`).
- **Lecture** (`espace/src/server/entonnoir.ts`, `espace/src/pages/bilan.astro`) : carte « Diagnostic : où les visiteurs s'arrêtent » dans le Bilan de l'espace d'Anne, sur la période choisie. Une ligne par campagne (source · contenu, ou support) avec arrivées, commencés, question 8, coordonnées, envoyés, résultats ; puis l'étape par étape de la campagne choisie (`d=`), avec la part de chaque étape et le nombre de visiteurs partis avant. Les questions 10 et 11 (deux écrans chacune) comptent une fois. En production, les passages de test sont exclus.
- **Accès de Claude** : `/api/claude/bilan` rend aussi l'entonnoir par campagne (`node scripts/claude-espace.mjs bilan semaine`), sans aucune donnée personnelle.
- **Page Cookies** : dit ce qui est compté, ce qui ne l'est pas, la durée de 13 mois, et que Cloudflare Web Analytics mesure les visites sans cookie (corrige aussi le point C3 de la rétrospective des epics 1 à 5 sur la mesure d'audience annoncée).
- **Décision journalisée** : `.memlog.md` du spine d'architecture (2026-10-26) et renvoi dans la règle d'AD-11.

## Écarts avec la story 10.8 et AD-11 (écrits dans `site/README.md` § Écarts assumés)
- Table `entonnoir` et migration 0015, et non `funnel_event` et 0003 (numéro déjà pris).
- Numéro de passage tiré à chaque ouverture de page, et non le `journey_id` de l'îlot : ce dernier est sauvegardé sur l'appareil avec les réponses pour la reprise, le réutiliser aurait déposé un identifiant de mesure dans le navigateur. Effet : la page /diagnostic et la page des questions ont chacune leur numéro, et un visiteur qui revient compte deux fois. On compte des passages, pas des personnes.
- Lecture dans le Bilan de l'espace (là où Anne regarde ses canaux), pas dans /gestion.
- Les réservations de rendez-vous ne sont pas comptées : elles sont déjà des demandes en base (source `rdv`).

## Ce qui est vérifié (2026-10-26)
- `npm run build` et `npm run check` (site : 0 erreur ; espace : 0 erreur).
- `node scripts/liens.mjs` : 27 pages, 1863 liens, 0 cassé.
- `node scripts/e2e-diagnostic.mjs` : tous les constats bons, dont 6 nouveaux : les 17 écrans, coordonnées, envoi, résultat comptés pour chacun des trois parcours, échec compté après une coupure, reprise comptée après interruption ; arrivée par un lien de publicité (`utm_source=Facebook`) comptée en `facebook` et campagne gardée jusqu'à la question 1 ; passages non conformes refusés (400) ; la table n'a que les colonnes prévues.
- `node scripts/e2e-espace.mjs` : voir ci-dessous (résultat cité à la fin de l'essai).

## Revue de code
À faire en session neuve (story 9.8) avant de proposer la PR à JB.

## Ce qui reste
- Revue de code, PR, accord de JB, fusion. La migration 0015 s'applique seule à la construction.
- Après la mise en ligne : lire l'entonnoir de la publicité au bout d'une semaine et en faire le point à JB.
