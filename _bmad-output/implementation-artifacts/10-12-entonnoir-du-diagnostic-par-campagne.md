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
- **Comptage** (`site/src/islands/entonnoir.ts`) : chaque page tire un numéro de passage au hasard (26 caractères, sans horodatage), gardé en mémoire de la page seulement, et envoie l'étape atteinte avec les paramètres `utm_*` de l'adresse (sendBeacon, qui part même pendant la redirection vers les résultats). Étapes : `arrivee` (page /diagnostic), `ecran` (chacun des 17 écrans, `q01`…`q15`), `reprise` (clic sur « Reprendre » : la suite garde la campagne du premier passage, lue dans la sauvegarde déjà sur l'appareil, et l'écran repris n'est pas recompté), `coordonnees` (écran des coordonnées), `envoi`, `echec` (envoi refusé ou coupé), `resultat`. Branché dans `site/src/islands/diagnostic.ts` et `site/src/pages/diagnostic/index.astro`.
- **Réception** (`site/src/pages/api/entonnoir.ts`, `site/src/server/entonnoir.ts`) : `POST /api/entonnoir` vérifie tout (numéro au format ULID, étape connue, écran existant dans `questions.json`, utm en minuscules, seulement `a-z 0-9 . _ -` et 40 caractères au plus, sinon oubliés), limite à 120 passages par minute et par adresse IP ou bloc IPv6 /64 (`LIMITE_ENTONNOIR`, `wrangler.jsonc`, l'adresse n'est pas gardée), refuse d'écrire au-delà de 5 000 passages par jour (la base est aussi celle des demandes), écrit une ligne `entonnoir` datée à l'heure près (assez pour un bilan, trop grossier pour retrouver la demande envoyée à la même minute) et répond 204. Un passage déjà compté pour la même étape est ignoré (index unique). Hors production, chaque ligne est marquée test ; en production, les essais de JB ou d'Anne sur le site en ligne comptent comme des visites (dit sous la carte du Bilan).
- **Base** : migration `0015-entonnoir.sql` (table `entonnoir` : parcours, étape, écran, source, support, campagne, contenu, langue, test, date). Aucune donnée personnelle, aucun lien vers `lead`. Purge des lignes de plus de 13 mois par la tâche planifiée (`site/src/server/purge.ts`).
- **Lecture** (`espace/src/server/entonnoir.ts`, `espace/src/pages/bilan.astro`) : carte « Diagnostic : où les visiteurs s'arrêtent » dans le Bilan de l'espace d'Anne, sur la période choisie. Une ligne par campagne (source · support · nom · contenu ; au-delà de 20, les moins vues regroupées en « Autres campagnes ») avec arrivées, commencés, question 8, coordonnées, envoyés, résultats ; puis l'étape par étape de la campagne choisie (`d=`), avec la part de chaque étape et le nombre de visiteurs partis avant. Les questions 10 et 11 (deux écrans chacune) comptent une fois. En production, les passages de test sont exclus. Si la table n'existe pas encore (espace mis en ligne avant la construction du site qui applique la migration), la carte est vide au lieu d'une erreur.
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
- `node scripts/e2e-diagnostic.mjs` : 37 constats bons, dont 7 nouveaux : les 17 écrans, coordonnées, envoi, résultat comptés pour chacun des trois parcours, échec compté après une coupure, reprise comptée et écran repris compté une seule fois ; utm hors liste oubliée et heure arrondie à l'heure ; arrivée par un lien de publicité (`utm_source=Facebook`) comptée en `facebook` et campagne gardée jusqu'à la question 1 ; passages non conformes refusés (400) ; la table n'a que les colonnes prévues.
- `node scripts/e2e-espace.mjs` : 294 constats bons (« Tout est bon »), dont les 3 nouveaux du Bilan et de l'accès de Claude ; carte relue sur la capture téléphone (tableau qui défile dans son cadre, comme les autres tableaux du Bilan).

## Revue de code
2026-10-26, PR #205, commits 2d830d1 et 63de25a, relus dans une session neuve (sous-agent qui n'a pas écrit le code). L'outil n'a pas trouvé le skill `bmad-code-review` sous son nom : le relecteur a lu son `SKILL.md` et fait la relecture adverse lui-même, sans les relectures parallèles du skill. Rien de grave ; 9 constats :
1. Base remplissable par un script (seule barrière : la limite par IP) : corrigé (plafond de 5 000 par jour, utm en liste fermée, clé IPv6 /64, 20 campagnes au plus dans le Bilan).
2. Un passage pouvait être relié à la demande par l'heure à la milliseconde et l'horodatage du numéro : corrigé (numéro sans horodatage, heure arrondie à l'heure).
3. Une reprise recomptait l'écran repris (faux départ) et pouvait perdre la campagne : corrigé (écran repris non recompté, campagne lue dans la sauvegarde ; note du Bilan corrigée).
4. Bilan en erreur si l'espace est en ligne avant la création de la table : corrigé (entonnoir vide, erreur au journal).
5. Texte libre ou caractères invisibles dans les libellés : corrigé par la liste fermée du constat 1.
6. `utm_campaign` ignoré et libellés ambigus : corrigé (source, support, nom et contenu dans la clé et le libellé).
7. « Résultat affiché » inexact : corrigé (« Envoi accepté, résultat ouvert »).
8. Essais sur le site en ligne comptés : écarté (pas de marqueur d'essai à ajouter pour quelques passages), dit sous la carte du Bilan et ici.
9. Visiteurs derrière une même adresse au-delà de 60 par minute : corrigé (120 par minute ; trois diagnostics dans la même minute dépassaient 60 lors de l'essai).
Corrections dans le commit qui suit 63de25a.

## Ce qui reste
- Revue de code, PR, accord de JB, fusion. La migration 0015 s'applique seule à la construction.
- Après la mise en ligne : lire l'entonnoir de la publicité au bout d'une semaine et en faire le point à JB.
