# Revue de l'architecture spine — grille de conformité

**Cible :** `ARCHITECTURE-SPINE.md` (v du 2026-09-07, 17 AD) · **Contrat :** `SPEC.md` v3 (CAP-1…CAP-10)
**Relecteur :** contexte vierge, lecture intégrale du spine, du SPEC, du brief d'architecture et du `.memlog.md`.
**Date :** 2026-09-07

---

## Verdict

Spine solide et inhabituellement discipliné pour un premier site : le paradigme « écrire d'abord » est le bon axe, AD-2/AD-4/AD-5/AD-6/AD-7/AD-9/AD-10/AD-12 sont des invariants réellement contraignants et vérifiables, et l'enveloppe opérationnelle est traitée à 80 % (déploiement, environnements, fournisseurs, exploitation, détection de panne). **Deux trous touchent directement les enjeux affichés** — « 0 lead perdu » n'est garanti par aucune règle quand le stockage primaire lui-même échoue, et la dimension *sauvegarde/restauration* est absente du contrat alors que le dépôt (AD-10) ne contient pas les leads. S'y ajoutent quatre divergences avec le contrat ou entre AD qui produiront des stories contradictoires, et un chapitre RGPD incomplet (droits des personnes).

**Note importante :** plusieurs éléments manquants existent dans `.memlog.md` (Time Travel D1 30 j, SPF/DKIM Resend, export CSV mensuel au coffre, Renovate/Dependabot). Le memlog n'est pas le contrat : ce que les epics/stories liront, c'est le spine. Un invariant qui n'y est pas n'existe pas.

---

## Grille, point par point

### 1. Fixe-t-il les vrais points de divergence, sans en manquer ?

**Bien couvert.** Les axes où deux unités auraient réellement divergé sont tenus : rangement du contenu (AD-1), complétude linguistique (AD-2), forme des URL et signaux SEO (AD-3), ordre d'écriture d'une capture (AD-4), lieu du calcul du score (AD-5), forme unique du lead (AD-6), ordre des contrôles anti-abus (AD-7), point d'entrée unique par fournisseur (AD-8), propriété des comptes (AD-9), reproductibilité (AD-10), politique de dépôt navigateur (AD-11), détection de panne (AD-12), source unique d'identité SEO (AD-13), place de Modelo (AD-14), budget de perf et discipline JS (AD-15), consentements et rétention (AD-16), source visuelle unique (AD-17). Le sens des dépendances est explicite et le tableau de couches est un vrai garde-fou.

**Manque.** Trois dimensions où deux unités *peuvent* diverger et où le spine est muet : (a) comportement en cas d'échec de l'écriture primaire D1 → C-2 ; (b) sauvegarde et restauration des leads → C-1 ; (c) protection de l'actif téléchargeable de CAP-8 → H-5. Puis, à moindre gravité : forme de la table d'entonnoir (M-3), stabilité des URL au renommage d'un slug (M-5), accessibilité (M-4), rollback (M-9).

### 2. Chaque AD a-t-il une Rule réellement applicable ?

Oui pour 13 AD sur 17 : AD-2 (« le build échoue »), AD-5, AD-6 (schéma littéral), AD-7 (ordre imposé), AD-8 (« un seul module »), AD-9 (liste de comptes), AD-10 (« exécuté depuis une machine vierge »), AD-12 (quatre couches nommées), AD-13, AD-14, AD-17 sont vérifiables par inspection ou par test.

Quatre exceptions :
- **AD-1** — la Rule ne prévient pas la divergence qu'elle annonce (« un CMS futur qui impose une refonte »), puisque ce qui rend un CMS branchable — les champs — est différé (H-1).
- **AD-4** — la Rule prévient la perte de lead en cas de panne *aval*, pas en cas de panne du stockage lui-même : le `Prevents` promet plus que la Rule ne tient (C-2).
- **AD-15** — « mesurés à chaque déploiement et bloquants au-delà » ne nomme ni l'outil, ni le mode (labo/terrain), ni le point de mesure ; les Conventions affirment même que « le build échoue » sur dépassement, ce qu'un build Astro ne peut pas faire (M-1).
- **AD-16** — se termine par « Le SPEC est à amender sur ce point », c'est-à-dire une contradiction ouverte avec le contrat laissée dans une Rule (H-3).

### 3. Le Deferred peut-il laisser deux unités diverger ?

Une entrée sur quinze est dangereuse : **« Liste des champs de chaque objet de contenu »** (H-1). Le brief d'architecture avait explicitement identifié ce piège (« CMS-ready sans CMS en v1 » ne tient que si les objets sont fixés) ; l'écart est assumé et daté, mais la mitigation (« vague 2, avant le build ») n'est qu'une note dans un tableau, pas une règle opposable.

Deux entrées mineures : le **bandeau de consentement** est présenté comme ouvert alors qu'AD-11 le rend déterministe (L-4) ; le **placement du contact direct** est différé sans poser l'invariant que CAP-6 exige pourtant (« atteignable depuis toute page ») (L-5). Le reste du Deferred est correctement gouverné par un AD existant.

### 4. La technologie nommée est-elle marquée comme vérifiée à jour ?

**Oui, sauf une ligne.** Le tableau Stack porte une colonne `Vérifié` renseignée (`npm` / `web`, 2026-09-07) pour chaque entrée — pratique exemplaire. Exception : **Node.js « LTS courant », vérifié `—` », donc non épinglé**, ce qui entre en tension avec AD-10 (M-2). Deuxième réserve : `@astrojs/sitemap (remplacé si AD-3 l'exige)` fait passer une décision non prise pour une ligne de version (M-8).

### 5. Couvre-t-il toutes les capacités du SPEC (CAP-1 → CAP-10) ?

La carte `Capability → Architecture Map` couvre les dix, et chacune est effectivement rattachée à des AD pertinents. Trois couvertures sont défectueuses au fond, pas en surface : **CAP-7** (sortie B amputée de la newsletter, contrat non amendé — H-3), **CAP-9** (identité + consentement exigés pour la source `rdv` alors que le formulaire appartient à Cal.com — H-2), **CAP-8** (le guide est un fichier ; rien ne le protège du contournement — H-5). **CAP-10** est couvert mais en contradiction textuelle avec le SPEC sur le repli français (H-4). **CAP-2** est couvert par un instantané local dont la fraîcheur n'est pas réglée (M-6).

### 6. Chaque dimension de l'altitude est-elle décidée, différée, ou question ouverte ?

| Dimension | État |
|---|---|
| Déploiement & environnements | ✅ Décidé (`production` / `preview` / `local`, Workers Builds, porte de qualité) |
| Fournisseurs | ✅ Décidé (AD-8, AD-9, Stack chiffré et daté) |
| Exploitation courante | ✅ Décidé (AD-12 couche 4, routine mensuelle 1-3 h) |
| Détection d'incident | ✅ Décidé (AD-12, quatre couches) |
| **Sauvegardes / restauration** | ❌ **Silencieux** → C-1 |
| **Réponse à incident & rollback** | ⚠️ Partiel : détection oui, reprise (rollback Workers, migration fautive, restauration) non → M-9 |
| Sécurité d'accès admin | ⚠️ Décidé mais enterré dans une ligne de tableau de conventions, sans règle de portée → M-7 |
| Délivrabilité e-mail | ❌ Silencieux dans le spine (existe au memlog) → H-6 |
| RGPD — droits des personnes | ❌ Silencieux (consentements, localisation et purge traités ; accès/rectification/effacement non) → H-7 |
| Accessibilité | ❌ Silencieux → M-4 |
| Coût | ✅ Décidé et consolidé |

### 7. Le spine est-il terse ?

Globalement oui : décisions à l'impératif, deux diagrammes qui portent la forme, un tableau de couches qui remplace des paragraphes, un seed structurel lisible. **Mermaid : les deux diagrammes sont syntaxiquement valides** (sous-graphes, formes cylindre, arêtes pointillées étiquetées, lien vers un identifiant de sous-graphe). Réserves : l'arête `R x--x D1` rend une *liaison* là où l'invariant dit « jamais » (L-1) ; quelques Rules embarquent de la justification ou de la provenance qui appartient au memlog (L-2) ; une formulation ambiguë dans AD-11 (L-3).

---

## Findings

### CRITICAL

**C-1 — Aucune décision de sauvegarde et de restauration des leads.**
*Visé :* AD-10, AD-12, AD-16, section Structural Seed.
*Problème :* AD-10 promet « tout est reconstructible depuis le dépôt », mais les leads — la seule donnée non reconstructible du système, celle sur laquelle porte l'objectif « 0 lead perdu » et une rétention de 3 ans — vivent dans D1, hors dépôt. Le spine ne dit nulle part comment on sauvegarde, où va la copie, à quelle fréquence, ni comment on restaure et qui peut le faire sans JB. Le memlog mentionne « D1 Time Travel 30 j » et un « export CSV dans le coffre partagé », mais aucun des deux n'est dans le spine, et Time Travel (30 jours) ne couvre pas un jeu de données conservé 3 ans ; l'« export » cité dans AD-12 couche 4 est ambigu avec l'export Modelo d'AD-14. Une suppression accidentelle, une migration fautive ou la fermeture du compte perd tout.
*Correction :* Ajouter un AD « Les leads survivent à la base » — export chiffré automatisé de `lead` (cron, hors Cloudflare, rétention alignée sur les 3 ans), Time Travel 30 j comme filet de premier niveau seulement, et une restauration testée au moins une fois, documentée dans le RUNBOOK au même titre que le redéploiement.

**C-2 — AD-4 ne prévient pas la perte de lead qu'il annonce : l'échec de l'écriture primaire n'est pas traité.**
*Visé :* AD-4 (et son `Prevents`), AD-6, AD-7, CAP-5.
*Problème :* La Rule impose l'écriture D1 « en première opération » et traite finement les échecs *aval* (marqueurs, rejeu depuis l'admin). Mais si D1 est indisponible ou refuse l'écriture, rien n'est décidé : renvoie-t-on une erreur au visiteur, notifie-t-on Anne quand même, met-on la soumission en file d'attente ? Deux stories construites indépendamment (`api/diagnostic` et `api/contact`) choisiront des comportements incompatibles, et le cas où le lead est réellement perdu est précisément celui-là. Le `Prevents` (« un lead perdu quand un service aval tombe ») masque le fait que le point unique de défaillance est le service *amont*.
*Correction :* Étendre la Rule d'AD-4 avec le chemin dégradé unique — nombre de tentatives, secours (par exemple notification e-mail portant la charge utile brute + code d'erreur, ou file d'attente), message visiteur, alerte immédiate à JB — identique pour les quatre sources.

### HIGH

**H-1 — La promesse « CMS-ready » n'est tenue par aucune règle opposable.**
*Visé :* AD-1 + entrée Deferred « Liste des champs de chaque objet de contenu ».
*Problème :* AD-1 fixe la règle de rangement et l'inventaire des objets, mais diffère les champs — exactement ce que le brief d'architecture avait signalé comme le piège (« externaliser les textes ne suffit pas ; ce qui rend un CMS branchable, c'est que les objets soient déjà définis »). Le `Prevents` « un CMS futur qui impose une refonte » n'est donc pas garanti : rien n'empêche une story de build d'inventer les champs de `StoryDeVente` au fil de l'eau. La seule mitigation est une case « Vague 2, avant le build » dans un tableau, non contraignante.
*Correction :* Transformer la mitigation en règle dans AD-1 — aucun epic ou story touchant `src/content/` ni le rendu d'un objet ne peut démarrer avant que le schéma de chaque type de l'inventaire ne soit versionné et validé, le build échouant sur un objet sans schéma.

**H-2 — Contradiction AD-6 × AD-8 sur le lead de source `rdv`.**
*Visé :* AD-6, AD-8, CAP-9, AD-16.
*Problème :* AD-6 impose prénom, nom, e-mail, téléphone E.164 **et** `privacy_accepted_at` obligatoires « pour toutes les sources », `rdv` compris. AD-8 délègue simultanément à Cal.com la totalité du parcours de réservation (formulaire inclus), le noyau n'écrivant le lead qu'à réception du webhook. Or Cal.com en plan gratuit ne collecte pas nécessairement nom/prénom séparés ni téléphone, et surtout ne recueille pas le consentement à *notre* politique de confidentialité : le lead `rdv` naîtra soit incomplet, soit avec un consentement inventé côté serveur — un consentement non prouvable, ce qu'AD-6 prétend justement empêcher.
*Correction :* Trancher explicitement le point de collecte du RDV — soit un formulaire maison de pré-qualification (identité + consentement + AD-7) qui écrit le lead puis redirige vers Cal.com, soit des champs obligatoires et une case de consentement configurés dans Cal.com avec la preuve transportée par le webhook —, et faire dire à AD-6 laquelle des deux fait foi.

**H-3 — AD-16 amende le contrat sans que le contrat soit amendé.**
*Visé :* AD-16, CAP-7 (sortie B), CAP-10 des e-mails.
*Problème :* AD-16 décide que la v1 « n'envoie aucune newsletter » et que la sortie B « se limite au guide + opt-in », puis conclut « Le SPEC est à amender sur ce point ». Tant que le SPEC v3 dit « CTA de téléchargement du plan d'action, **puis newsletter hebdomadaire** », les stories dérivées du contrat et celles dérivées du spine se contrediront sur le critère de succès de CAP-7. Un spine ne devrait pas contenir de contradiction ouverte avec son propre contrat.
*Correction :* Amender le SPEC (CAP-7 sortie B = guide + stockage de l'opt-in, envoi de la newsletter hors v1) avant de figer les epics, et retirer la phrase de la Rule.

**H-4 — Contradiction non signalée avec CAP-10 sur le repli linguistique.**
*Visé :* AD-2, AD-3, CAP-10.
*Problème :* Le SPEC pose « le français est la langue de référence et **le repli systématique** ». AD-2 pose l'inverse : « Le repli vers le français n'existe nulle part ailleurs » — un objet absent dans une langue n'est simplement pas publié, et le sélecteur renvoie vers l'index. La position d'AD-2 est meilleure (elle évite les doublons SEO et les écrans mi-traduits), mais l'écart n'est pas déclaré, contrairement à celui d'AD-1 qui l'est. Une story issue de CAP-10 implémentera un repli que le spine interdit.
*Correction :* Déclarer l'écart dans AD-2 et corriger la formulation de CAP-10 dans le SPEC (« repli du *routage*, jamais du contenu »).

**H-5 — Rien ne protège le guide PDF : le gate de CAP-8 est contournable.**
*Visé :* CAP-8, AD-4, AD-5, AD-1 (objet `Guide`).
*Problème :* AD-5 protège rigoureusement la page de résultats (jeton opaque, à usage unique, expirant) mais aucun AD n'énonce l'invariant équivalent pour l'actif téléchargeable, alors que CAP-8 échange le guide contre les mêmes coordonnées que CAP-5. Deux stories peuvent légitimement diverger : déposer les PDF dans les actifs statiques (URL publique, devinable, partageable — le gate ne vaut plus rien et le lead n'est jamais créé) ou les servir par une route du noyau. Le problème est exactement celui reproché au ScoreApp actuel, déplacé du HTML vers le fichier.
*Correction :* Étendre AD-5 (ou ajouter une clause à AD-4) : tout actif remis contre coordonnées est servi par une route du noyau derrière un jeton lié au lead, jamais depuis un chemin statique public.

**H-6 — Délivrabilité et quotas des e-mails non décidés, alors que l'e-mail est le seul canal vers Anne en v1.**
*Visé :* AD-8, AD-12, AD-14, Stack (Resend plan gratuit).
*Problème :* En v1, un lead n'atteint Anne que par un e-mail Resend « prêt à copier » (AD-14). Le spine ne fixe ni le domaine et l'adresse d'envoi, ni la vérification de domaine, ni SPF/DKIM/DMARC, ni le comportement au dépassement du quota gratuit. Le test synthétique quotidien (AD-12 couche 2) détecte un échec d'*envoi*, pas une mise en dossier indésirable : un classement en spam est précisément une panne silencieuse qui coûte des leads, le scénario que le brief désigne comme le plus cher. Le memlog mentionne « SPF/DKIM sur le domaine » — absent du spine.
*Correction :* Ajouter à AD-8 une clause de délivrabilité — domaine d'envoi dédié vérifié, SPF/DKIM/DMARC posés avant le lancement, quota et volume attendus documentés, alerte sur rejet/dépassement — et faire vérifier la réception réelle par la couche 2 d'AD-12.

**H-7 — RGPD : les droits des personnes ne sont couverts par aucun AD.**
*Visé :* AD-16, AD-6, page admin (Conventions), contrainte RGPD du SPEC.
*Problème :* AD-16 traite les consentements, la localisation UE et la purge à 3 ans, mais rien n'est décidé pour l'accès, la rectification, l'effacement et l'opposition — obligations opposables dès la première capture, avec un délai d'un mois. Concrètement : la page admin permet-elle de retrouver un lead par e-mail et de le supprimer ? La suppression est-elle propagée aux copies (sauvegardes de C-1, Resend, Cal.com) ? Deux stories divergeront, ou aucune ne fera le travail et la politique de confidentialité promettra ce que le système ne sait pas faire.
*Correction :* Ajouter à AD-16 une clause « droits des personnes » — recherche par e-mail et suppression définitive depuis l'admin, propagation documentée aux sous-traitants et aux sauvegardes, adresse de contact unique, tracée dans le RUNBOOK.

### MEDIUM

**M-1 — Le budget de performance d'AD-15 n'est pas mesurable tel qu'il est écrit.**
*Visé :* AD-15, Conventions § Tests.
*Problème :* « LCP mobile < 2,5 s, page utile < 3 s, mesurés à chaque déploiement de production et bloquants au-delà » ne nomme ni outil, ni profil réseau, ni URLs mesurées ; et les Conventions affirment que « le build échoue » sur dépassement, ce qu'un build de site statique ne peut pas constater. La règle est donc un vœu.
*Correction :* Nommer le dispositif (par exemple Lighthouse CI sur trois URLs, profil mobile 4G émulé, exécuté en post-déploiement de `preview` et bloquant la promotion vers `production`).

**M-2 — Node.js non épinglé, en tension avec AD-10.**
*Visé :* Stack (ligne « Node.js (build uniquement) — LTS courant — Vérifié : — »), AD-10.
*Problème :* AD-10 promet un redéploiement à l'identique depuis un clone ; une version de Node flottante rend le build reproductible seulement par hasard, et c'est la ligne du tableau qui ne porte aucune vérification.
*Correction :* Épingler une version majeure (`.nvmrc` + `engines`, alignée sur celle de Workers Builds) et renseigner la colonne `Vérifié`.

**M-3 — La table des compteurs d'entonnoir est évoquée trois fois, définie nulle part.**
*Visé :* AD-6 (« vivent dans une table séparée »), AD-11, seed `D1 · lead · funnel`.
*Problème :* Le spine impose qu'elle existe et qu'elle ne contienne aucune donnée personnelle, mais ne fixe ni ses colonnes, ni la liste fermée des événements, ni sa rétention. AD-6 fixe la forme du lead au champ près ; l'asymétrie garantit que deux îlots enverront des événements de formes différentes. L'entrée ne figure pas non plus dans le Deferred.
*Correction :* Poser dans AD-11 la forme minimale (`id`, `event` dans une énumération fermée, `lang`, `created_at`, `page`, `utm`) et sa durée de conservation, ou l'inscrire explicitement au Deferred avec un jalon.

**M-4 — L'accessibilité est une dimension entièrement silencieuse.**
*Visé :* AD-15, AD-17, îlots, Conventions § Tests.
*Problème :* Le site vise explicitement les seniors 60+, comporte un parcours interactif de 17 écrans, un sélecteur de langue et des animations de scroll ; aucun AD ne fixe de plancher (contraste de la palette écru/terracotta, navigation clavier, libellés de formulaire, `prefers-reduced-motion` cité une seule fois pour la vidéo, ordre de focus). Deux îlots auront deux comportements clavier différents.
*Correction :* Ajouter une clause à AD-15 ou AD-17 : plancher d'accessibilité déclaré (contrastes des tokens vérifiés, tout îlot utilisable au clavier, `prefers-reduced-motion` respecté par toutes les animations), vérifié automatiquement au déploiement.

**M-5 — Rien ne protège la stabilité des URL quand un slug change.**
*Visé :* AD-3, AD-1, AD-13.
*Problème :* AD-1 garantit la stabilité des *identifiants* d'objets, pas celle des slugs, qui sont par langue et éditoriaux. Le jour où Anne corrige le titre d'une story, l'URL indexée renvoie une 404 et le bénéfice SEO se perd ; le spine ne dit pas si un renommage impose une redirection.
*Correction :* Ajouter à AD-3 : un slug publié est immuable, ou son remplacement crée une redirection 301 permanente déclarée dans le contenu.

**M-6 — La fraîcheur de l'instantané `AvisImmodvisor` n'est pas réglée.**
*Visé :* AD-13, CAP-2, AD-1.
*Problème :* Le refus des scripts tiers est bon, mais un instantané local est un contenu qui périme silencieusement (note affichée divergente de la fiche source, extraits non datés). Ni la fréquence de mise à jour, ni l'affichage d'une date de relevé ne sont décidés.
*Correction :* Imposer dans AD-13 une date de relevé affichée et un rafraîchissement inscrit à la routine mensuelle d'AD-12.

**M-7 — La sécurité de l'espace d'administration est enterrée dans une ligne de conventions, et sa portée n'est pas décidée.**
*Visé :* Consistency Conventions § État & transversal, AD-14, AD-4, AD-16.
*Problème :* « routes admin derrière Cloudflare Access » est un invariant de sécurité de premier ordre traité comme une convention de nommage ; par ailleurs ce que l'admin autorise (lire, rejouer une diffusion, exporter, supprimer, marquer `is_test`) n'est fixé nulle part, alors qu'AD-4, AD-14 et H-7 s'appuient tous dessus.
*Correction :* Promouvoir la protection de `/admin` en clause d'AD-9 ou d'un AD dédié, et y énumérer les opérations autorisées.

**M-8 — Une décision non prise se cache dans le tableau des versions.**
*Visé :* Stack, ligne `@astrojs/sitemap (remplacé si AD-3 l'exige)`, AD-3.
*Problème :* AD-3 exige déjà que sitemap et `hreflang` soient générés depuis le contenu réel et « remplacés dès qu'ils déclarent une traduction manquante » — condition qu'aucune intégration générique ne remplit. La dépendance est donc soit inutile, soit source de divergence entre deux stories.
*Correction :* Trancher dans AD-3 (générateur maison de `sitemap`/`hreflang` depuis les objets de contenu) et retirer la ligne conditionnelle du Stack.

**M-9 — Reprise après incident : détection sans rollback.**
*Visé :* AD-12, AD-10, RUNBOOK.
*Problème :* Les quatre couches disent comment on *sait*, jamais comment on *revient* : rien sur le retour à une version précédente du Worker, sur la marche à suivre après une migration fautive (les migrations sont en avant seulement), ni sur qui agit quand JB est indisponible trois semaines — le scénario qui motive tout le chantier « pérennité » du brief.
*Correction :* Ajouter à AD-10 ou AD-12 une clause de reprise : rollback de déploiement en une commande documentée, procédure de migration défaillante, et une manœuvre exécutable par Anne seule inscrite au RUNBOOK.

**M-10 — Rétention des données non-lead non décidée.**
*Visé :* AD-11, AD-12, AD-16.
*Problème :* La purge à 3 ans ne vise que `lead`. Les compteurs d'entonnoir, les journaux structurés et les leads de test (`is_test = 1`, produits quotidiennement) n'ont pas de durée de vie déclarée ; AD-12 dit la ligne de test « purgée » sans dire par quoi ni quand.
*Correction :* Étendre la clause de purge d'AD-16 aux trois jeux (test purgé par le cron du jour même, compteurs et journaux avec une durée déclarée dans la politique de confidentialité).

### LOW

**L-1 — `R x--x D1` dessine la liaison qu'il prétend interdire.**
*Visé :* diagramme « Invariants & Rules ».
*Problème :* La syntaxe est valide, mais Mermaid rend une *arête* entre Rendu et D1 : un lecteur pressé y lit une dépendance, l'inverse exact de l'invariant. Le texte sous le diagramme dit déjà la règle.
*Correction :* Supprimer l'arête et laisser la phrase de commentaire porter l'interdiction (ou la styliser explicitement en rouge barré avec `linkStyle`).

**L-2 — Justification et provenance dans les Rules.**
*Visé :* AD-1 (« Écart assumé au brief… décision de JB du 2026-09-07, option "règle + inventaire maintenant" »), AD-16 (« Le SPEC est à amender sur ce point »), parenthèses explicatives d'AD-14 et de CAP-7 dans AD-5.
*Problème :* Un spine énonce ; le pourquoi et l'historique appartiennent au `.memlog.md`, qui les porte déjà mot pour mot.
*Correction :* Déplacer ces phrases dans le memlog et ne garder dans les Rules que l'énoncé opposable.

**L-3 — Formulation ambiguë dans AD-11.**
*Visé :* AD-11, dernière phrase.
*Problème :* « chargé au plus tôt sur la page où il sert » se lit dans deux sens opposés (le plus tôt possible / pas avant). Une règle de dépôt navigateur ne peut pas être ambiguë.
*Correction :* Reformuler en « chargé uniquement sur la page où il sert, et seulement après l'action du visiteur s'il dépose quoi que ce soit ».

**L-4 — Le bandeau de consentement est présenté comme ouvert alors qu'AD-11 le rend déterministe.**
*Visé :* Deferred (« Bandeau de consentement : nécessaire ou non »), AD-11, note de correction au brief de maquette.
*Problème :* AD-11 impose que rien de non essentiel ne soit déposé avant une action ; il en découle qu'aucun bandeau n'est requis, la vérification instrumentée servant à confirmer, pas à décider. Laisser l'entrée en Deferred fait dessiner deux variantes de maquette pour une question déjà tranchée par un invariant.
*Correction :* Requalifier l'entrée en « vérification » (et non en décision) et lever la demande de double variante dans le brief de maquette.

**L-5 — L'invariant de navigation exigé par CAP-6 n'est pas posé.**
*Visé :* Deferred « Placement du contact direct », CAP-6.
*Problème :* CAP-6 exige un contact direct « atteignable depuis toute page ». Différer le placement est légitime ; ne pas poser l'invariant laisse une story livrer le contact sur trois pages seulement, sans rien violer d'écrit.
*Correction :* Écrire l'invariant (le contact direct vit dans un élément global présent sur toutes les pages, dans toutes les langues) et ne différer que sa forme.

---

## Ce qui mérite d'être conservé tel quel

- **AD-4 comme axe du système** : la discipline « écrire d'abord, diffuser ensuite » plus le marqueur horodaté rejouable par diffusion est la bonne réponse architecturale à « 0 lead perdu » — c'est son chemin dégradé qui manque, pas son principe.
- **AD-2** : faire échouer le build sur une clé manquante est le type de règle qui rend une divergence impossible plutôt qu'improbable.
- **AD-9 et AD-10** : rares et justes pour un site construit par un proche ; « le RUNBOOK est exécuté depuis une machine vierge, sinon il est faux » est le meilleur critère du document.
- **AD-12 couche 2** : la soumission de test réelle quotidienne est ce qui distingue une surveillance qui sert d'une surveillance décorative.
- **Le tableau Stack daté et sourcé**, et la section « Hypothèses à vérifier au build » : deux pratiques à garder dans les spines suivants.
