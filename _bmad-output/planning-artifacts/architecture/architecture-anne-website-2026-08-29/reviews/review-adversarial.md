---
name: 'Revue adversariale — ARCHITECTURE-SPINE vague 1'
type: review
lens: adversarial-divergence
target: ../ARCHITECTURE-SPINE.md
companions: ../../../../specs/spec-anne-website/SPEC.md
date: '2026-09-07'
method: 'Construction de paires d''unités « un niveau en dessous » qui respectent toutes les AD à la lettre et se construisent pourtant de façon incompatible'
findings: 16
severity: '4 critical · 6 high · 4 medium · 2 low'
---

# Revue adversariale — ARCHITECTURE-SPINE, vague 1

## Méthode et verdict

Le protocole est le suivant : pour chaque zone du spine, construire **deux unités de construction plausibles, un niveau en dessous des AD** (une route, un îlot, un cron, un générateur, une migration), donner à chacune une lecture littérale et défendable de **toutes** les AD applicables, puis vérifier si les deux artefacts obtenus peuvent coexister. Quand la réponse est non, le spine ne contraint pas assez : deux constructeurs de bonne foi, chacun conforme, produisent des pièces qui ne s'emboîtent pas. Chaque paire retenue est un trou à fermer par une AD nouvelle ou par une phrase ajoutée à une AD existante.

**Verdict.** Le spine est solide sur les axes qu'il a explicitement travaillés (couches, propriété des comptes, reconstructibilité, RGPD de principe, budget de performance). Sa faiblesse est systématique et concentrée en un seul endroit : **la forme des données partagées entre les quatre canaux de capture et les trois consommateurs aval (admin, crons, e-mails)**. AD-6 déclare une table unique mais ne dit pas ce qu'un canal met dans les colonnes des autres canaux ; AD-4 déclare « écrire d'abord » mais ne dit jamais ce qui empêche d'écrire deux fois ; AD-7 énumère les protections mais ne couvre pas la seule route de capture qui vient de l'extérieur ; AD-12 et AD-16 font tourner deux crons sur la même table sans dire qui possède quoi. Seize paires ont tenu à l'analyse, dont quatre qui produisent soit une perte de lead, soit une écriture non authentifiée en base, soit un score faux et silencieux — c'est-à-dire exactement les trois choses que le SPEC pose comme non négociables.

Les paires sont classées par gravité. Chaque entrée donne : les deux unités, la lecture conforme de chacune, le point de collision, la correction à apporter au spine.

---

## CRITICAL

### C-1 — L'îlot du parcours et le noyau de scoring : l'encodage des réponses n'a pas de propriétaire

**Unité A — `src/islands/parcours-diagnostic.ts`.** Un îlot rend les 17 écrans depuis `src/content/diagnostic/fr.json`, garde les réponses en mémoire (AD-5), et POSTe à `api/diagnostic` un objet `answers`. Le constructeur choisit la représentation la plus naturelle depuis son point de vue : la question par son numéro d'écran, l'option par son **indice dans le tableau rendu** — `{"q3": 2, "q10a": 0}`. Conforme : AD-1 (il ne lit que du contenu typé), AD-5 (réponses en mémoire, aucun calcul de score côté client), AD-11 (rien de déposé, UTM dans l'état de l'îlot), AD-15 (un îlot déclaré, aucune dépendance à D1).

**Unité B — `src/server/scoring.ts`.** Le noyau lit `src/content/diagnostic/bareme.json`, décrit par AD-1 comme **partagé entre les langues** (« questions, options, feedbacks par langue ; barème et seuils partagés »). Un barème partagé ne peut pas être indexé par des libellés traduits : le constructeur le clé donc par des identifiants stables — `{"q3": {"diagnostic-realise": 10, "aucun-diagnostic": 0}}` — et valide `answers` contre le `ContenuDiagnostic` (AD-7). Conforme : AD-1, AD-5 (le noyau calcule seul), AD-7 (validation serveur contre schéma).

**Collision.** A parle en indices positionnels dérivés du **fichier de langue rendu**, B attend des identifiants d'option stables et **indépendants de la langue**. Trois conséquences, toutes silencieuses :
1. La validation d'AD-7 passe (un entier dans les bornes est « conforme ») et le score est faux.
2. Le jour où le traducteur EN réordonne des options — geste éditorial parfaitement légitime sous AD-1 et AD-2 —, le même parcours produit deux scores différents selon la langue. Rien dans le spine ne l'interdit ni ne le détecte : les vérifications de build (Conventions) contrôlent la *présence* des clés, jamais l'*ordre* des options.
3. AD-6 conserve `answers` en « JSON brut » et AD-16 le garde **3 ans**. Un `answers` encodé en indices devient illisible dès la première édition du contenu : l'archive légale et l'analyse d'entonnoir portent sur des positions dont on ne sait plus ce qu'elles désignaient.

Ce n'est pas une négligence de constructeur : le spine dit que les options sont *par langue* et que le barème est *partagé*, sans jamais dire ce qui fait le pont entre les deux.

**Correction — AD-1, phrase à ajouter :** « Chaque question et chaque option du `ContenuDiagnostic` porte un identifiant stable, en `kebab-case`, indépendant de la langue et **immuable** au même titre que les identifiants d'objets. Les fichiers de langue traduisent les libellés d'un identifiant ; ils ne créent, ne suppriment ni ne renomment aucun identifiant. Le build échoue si l'ensemble des identifiants de questions et d'options diffère d'une langue à l'autre, ou si un identifiant présent dans `bareme.json` manque dans une langue livrée. »

**Correction — AD-5, phrase à ajouter :** « Le contrat de soumission est un dictionnaire `{ identifiant de question : identifiant(s) d'option }` ; ni indices, ni libellés, ni positions d'écran ne circulent entre l'îlot et le noyau. `answers` (AD-6) stocke ces identifiants et rien d'autre : il doit rester interprétable pendant toute la durée de conservation (AD-16) sans le contenu de l'époque. »

---

### C-2 — Le webhook Cal.com et la route contact : AD-7 ne borne pas la seule route qui vient de l'extérieur

**Unité A — `src/pages/api/contact.ts`.** Le constructeur applique AD-7 dans l'ordre : Turnstile validé côté serveur, champ piège, limite de fréquence par adresse, schéma serveur, puis AD-4. Conforme intégralement.

**Unité B — `src/pages/api/webhook-cal.ts`.** AD-4 nomme la réservation « via webhook Cal.com » comme une capture soumise à l'écriture-d'abord. Mais **AD-7 se lie à CAP-5, CAP-6, CAP-8 — pas à CAP-9**, et sa règle est écrite pour un visiteur (« jeton Turnstile », « champ piège », « limite de fréquence par adresse ») : aucune de ces trois protections n'a de sens pour un appel serveur-à-serveur, et un webhook qui présenterait un jeton Turnstile est une absurdité. Le constructeur de B en conclut, sans faute de lecture, qu'AD-7 ne le concerne pas, applique AD-4 et AD-6, et expose une route publique qui **écrit un lead sur simple POST**. La carte Capability → Architecture confirme sa lecture : la ligne CAP-9 est gouvernée par AD-4, AD-8, AD-11 — **AD-7 n'y figure pas**.

**Collision.** Le site se retrouve avec une asymétrie que personne n'a décidée : trois routes durcies et une quatrième ouverte à tous les vents, et c'est précisément celle qui n'a pas d'interface humaine pour signaler l'anomalie. Le spine ne mentionne **nulle part** la vérification de signature du webhook (secret partagé Cal.com / HMAC), ni le rejeu (replay) d'une notification légitime capturée. Conséquences en cascade sur des AD adoptées : la table `lead` est empoisonnable à volonté (AD-6), la purge et les compteurs d'entonnoir deviennent inexploitables (AD-11, AD-16), et chaque écriture déclenche une notification à Anne (AD-4) — le canal d'alerte devient le vecteur.

**Correction — AD-7, réécriture de l'amorce et ajout :** remplacer « Chaque route de capture vérifie, dans cet ordre et avant AD-4 : jeton Turnstile… » par « Toute route qui écrit dans `lead` authentifie son appelant **avant** AD-4, selon son origine. **Origine visiteur** (diagnostic, contact, guide) : jeton Turnstile validé côté serveur, champ piège vide, limite de fréquence par adresse, puis validation du contenu contre un schéma serveur. **Origine service** (webhook Cal.com, et tout webhook futur) : vérification de la signature avec un secret Cloudflare (AD-8), fenêtre d'horodatage courte, rejet d'un identifiant d'événement déjà traité, puis la même validation de schéma. Aucune route n'écrit dans `lead` sans appartenir à l'une de ces deux origines. » Ajouter AD-7 à la ligne CAP-9 de la carte Capability → Architecture.

---

### C-3 — La route de capture du diagnostic et celle du contact : `token` et les colonnes de scoring n'ont pas de contrat par source

**Unité A — `api/diagnostic`.** AD-5 impose un jeton de soumission opaque qui adresse la page de résultats. Le constructeur en fait l'identité de la page servie : colonne `token` **NOT NULL, UNIQUE**, indexée — c'est la seule façon de garantir qu'un jeton adresse un et un seul résultat. Il remplit `answers`, `scores`, `band`, `orientation`. Conforme : AD-4, AD-5, AD-6, AD-7.

**Unité B — `api/contact`.** AD-6 énumère une table unique et une ligne par capture, et déclare obligatoires, pour **toutes les sources**, l'identité et `privacy_accepted_at` — donc, par lecture *a contrario*, les autres colonnes ne le sont pas. Le constructeur écrit une ligne `source = 'contact'` sans réponses ni score. Reste la question que le spine ne tranche pas : que met-il dans `token` ? Trois lectures toutes défendables : (i) `NULL`, (ii) chaîne vide, parce que la colonne a été déclarée NOT NULL par l'unité A et qu'il ne veut pas casser sa migration, (iii) un jeton généré pour tous, par uniformité — AD-6 range `token` dans les colonnes de la ligne, sans le réserver à une source.

**Collision.** Les trois lectures cassent, chacune à sa manière :
- (ii) + UNIQUE : la **deuxième** soumission de contact viole la contrainte d'unicité. AD-4 impose l'écriture en première opération : l'écriture échoue, il n'y a pas de second lieu de stockage (AD-4 l'interdit explicitement), le lead est **perdu**. C'est la violation frontale du signal « 0 lead perdu » du SPEC, et elle se déclenche au deuxième visiteur.
- (iii) : `/resultats/<token>` devient atteignable pour un lead de contact — une page de résultats sans scores, servie par un noyau qui lit `band` à `NULL`. AD-5 promet que la page de résultats n'est pas atteignable hors soumission ; ici elle l'est, avec un contenu indéfini.
- (i) : correct, mais alors la migration de l'unité A (NOT NULL) et celle de l'unité B (nullable) sont deux migrations numérotées incompatibles au sens d'AD-10.

Le même trou vaut pour `scores`, `band`, `orientation` (que vaut `orientation` pour un lead `guide` ? `A`, `B`, ou NULL — alors que le CHECK de la colonne n'admet que `A` et `B`) et pour `utm` (voir M-14).

**Correction — AD-6, phrase à ajouter :** « Chaque colonne porte un **contrat par source**, écrit dans la migration et vérifié par une contrainte : `token`, `answers`, `scores`, `band`, `orientation` sont **non nuls si et seulement si** `source = 'diagnostic'`, et `NULL` pour toute autre source — jamais une chaîne vide ni une valeur de remplissage. `token` est UNIQUE sur les lignes non nulles (index unique partiel). Une valeur sentinelle destinée à contourner une contrainte est interdite : si un canal ne peut pas fournir une donnée, la donnée est nulle et la colonne l'admet. »

**Correction — AD-5, phrase à ajouter :** « La route de résultats n'existe que pour les leads `source = 'diagnostic'` ; tout jeton qui n'adresse pas un tel lead renvoie la même réponse que le jeton inconnu. »

---

### C-4 — Le webhook Cal.com et la route guide : deux définitions incompatibles de l'identité d'un lead

**Unité A — `api/guide`.** CAP-8 et AD-6 sont sans ambiguïté : le guide hors diagnostic « coûte les mêmes coordonnées que le gate ». Le constructeur pose un formulaire à quatre champs identité, valide le téléphone en E.164 (AD-6), horodate `privacy_accepted_at`, applique AD-7, écrit d'abord (AD-4). Conforme.

**Unité B — `api/webhook-cal`.** AD-8 délègue à Cal.com « ce qu'il fait nativement » et interdit au noyau d'envoyer une seconde confirmation : « il n'écrit que le lead (AD-4) ». Le constructeur reçoit donc la charge utile de Cal.com et doit la couler dans AD-6, qui exige **prénom, nom, e-mail, téléphone E.164 et `privacy_accepted_at` — obligatoires pour toutes les sources**. Or la charge utile d'une réservation Cal.com fournit nativement un **nom unique** (`attendee.name`, non scindé), un e-mail, un fuseau — et **pas de téléphone** tant qu'une question de réservation n'a pas été configurée pour l'exiger ; quant au consentement à la politique de confidentialité du **site d'Anne**, il n'a jamais été recueilli, puisque le formulaire est celui de Cal.com.

**Collision.** Le constructeur de B a trois issues, toutes mauvaises et toutes conformes à la lettre :
- scinder `attendee.name` sur le premier espace — corruption garantie sur les noms composés (« Anne Vial-Tissot », « Jean-Baptiste »), sur les noms uniques et sur les ordres nom-prénom des clientèles internationales visées par CAP-10 ;
- écrire un téléphone de remplissage (`+33000000000`) pour satisfaire la contrainte E.164 — une donnée fausse dans la fiche que l'e-mail d'AD-14 demande à Anne de recopier **telle quelle** dans Modelo ;
- refuser l'écriture faute de champs — le rendez-vous est pris chez Cal.com, le lead n'existe pas côté site, ce qui viole la Constraint « stockage de référence des leads côté site » du SPEC et le signal « 0 lead perdu », et rend l'écart invisible (Cal.com a confirmé au prospect, Anne voit l'invitation, personne ne voit le trou en base).

Il faut noter que ce trou est structurel, pas accidentel : AD-6 a été écrite en pensant à des formulaires possédés par le site, et AD-8 a ensuite délégué à un tiers la collecte d'un des quatre canaux, sans revenir sur AD-6. Les « Hypothèses à vérifier au build » interrogent le webhook et les capacités natives de Cal.com, **jamais les champs qu'il rapporte**.

**Correction — AD-6, phrase à ajouter :** « L'identité minimale exigée de toutes les sources est : e-mail, un nom d'affichage, et `privacy_accepted_at`. `prenom` / `nom` sont deux colonnes distinctes et ne sont **jamais dérivées par découpage** d'un nom unique : une source qui ne fournit qu'un nom d'affichage le range dans `nom` et laisse `prenom` nul. `telephone` est obligatoire pour les sources `diagnostic`, `contact` et `guide`, et nul-ou-fourni pour `rdv`. »

**Correction — AD-8, phrase à ajouter :** « Le formulaire de réservation Cal.com est configuré pour recueillir exactement les champs d'AD-6 (prénom et nom **séparés**, téléphone, acceptation de la politique de confidentialité horodatée) ; cette configuration fait partie du RUNBOOK et sa vérification est une condition de recette de CAP-9, au même titre que le webhook. »

---

## HIGH

### H-5 — L'îlot de renvoi et le noyau « écrire d'abord » : aucune règle d'idempotence

**Unité A — l'îlot du parcours.** AD-5 et CAP-5 imposent la conservation locale des réponses et une proposition de renvoi en cas d'échec réseau. Le constructeur implémente donc : POST, délai d'attente, sur échec ou expiration → bouton « réessayer », re-POST du même corps. Conforme AD-5, AD-11 (stockage strictement nécessaire).

**Unité B — `server/leads`.** AD-4 est catégorique : l'écriture est la **première** opération et la réponse au visiteur vient après. Le constructeur écrit la ligne, appelle l'adaptateur e-mail, puis répond. Conforme.

**Collision.** L'ordre imposé par AD-4 crée mécaniquement la fenêtre que l'unité A va exploiter : si la réponse se perd (réseau mobile, expiration côté îlot, onglet rafraîchi), le lead **est déjà écrit** et le renvoi en écrit un second. AD-6 dit « une ligne par capture », ce qui rend le doublon formellement conforme. Conséquences : Anne reçoit deux notifications pour un même prospect et les recopie deux fois dans Modelo (AD-14) ; le compteur « ≥ 20 diagnostics complétés » et le taux de complétion du SPEC sont faussés à la hausse ; deux jetons de résultats existent pour une même personne. Le spine parle de rejouabilité (AD-4) mais jamais de non-duplication, ni côté écriture, ni côté diffusion : un rejeu depuis l'admin peut aussi renvoyer un e-mail déjà envoyé.

**Correction — AD-4, phrase à ajouter :** « Chaque soumission porte une **clé d'idempotence** générée par le client au premier envoi et rejouée à l'identique lors d'un renvoi ; le noyau la stocke sur la ligne (contrainte d'unicité) et répond au renvoi par la ligne existante, sans créer de doublon ni redéclencher les diffusions déjà horodatées. Le rejeu depuis l'admin est explicite et par canal : il ne rejoue que les canaux dont l'horodatage de succès est nul. »

---

### H-6 — Le cron de test synthétique et l'adaptateur e-mail : `is_test` ne se propage nulle part, et « purgée » n'a pas de propriétaire

**Unité A — `server/cron/test-synthetique.ts`.** AD-12 exige une soumission de test réelle quotidienne parcourant « gate → D1 → e-mail », marquée `is_test = 1`, « purgée », avec alerte en cas d'échec. Le constructeur appelle la vraie route de capture en production — c'est la seule lecture qui rende le test utile, et les Conventions le confirment : « le test synthétique est le test de bout en bout de référence ».

**Unité B — `server/adapters/email.ts`.** AD-8 exige un module unique exposant une interface propre au site ; AD-4 exige qu'une notification parte à chaque capture. Le constructeur écrit `notify(lead)` et envoie à Anne. Rien dans AD-4, AD-6 ou AD-8 ne lui demande de connaître `is_test`.

**Collision.** Trois clashs en un :
1. **Anne reçoit un faux lead tous les matins**, 365 par an, indiscernable d'un vrai en tête de boîte — le contraire exact de l'intention d'AD-12 (« une panne se détecte par une machine, jamais par Anne »). L'alternative — router l'e-mail de test ailleurs — n'est décrite que pour l'environnement `preview`, pas pour la production, et si on l'applique en production le test cesse de couvrir le seul chemin qu'AD-12 voulait couvrir.
2. **« Purgée » n'a ni auteur ni délai.** Deux lectures conformes : le cron de test supprime sa propre ligne en fin d'exécution (mais si l'exécution échoue à l'étape e-mail — le cas même que le test doit détecter — la ligne survit et devient un faux lead permanent en base et dans l'admin), ou bien le cron de purge d'AD-16 s'en charge (mais AD-16 ne parle que des leads « sans contact depuis 3 ans » : rien ne l'autorise à toucher `is_test = 1`, et trois ans de leads de test en base, c'est mille lignes).
3. **Les compteurs d'entonnoir sont empoisonnés.** AD-11 fait écrire les compteurs par le noyau à chaque soumission, dans une table dédiée qui, par construction (AD-6 : « les compteurs vivent dans une table séparée »), **n'a pas de colonne `is_test`**. Le test quotidien incrémente donc les compteurs de production, sans marqueur, de façon indétectable après coup.

**Correction — AD-12, phrase à ajouter :** « Une capture marquée `is_test = 1` est propagée à tous les consommateurs aval : la notification part vers la boîte de surveillance et jamais vers Anne, les compteurs d'entonnoir portent le même marqueur et l'admin les exclut par défaut. La ligne de test est supprimée par le **cron de purge** (AD-16) au-delà de 7 jours — jamais par le test lui-même, dont l'échec doit laisser une trace inspectable. »

**Correction — AD-6, phrase à ajouter :** « La table des compteurs d'entonnoir porte le même marqueur `is_test` que `lead`. »

---

### H-7 — Le cron de purge et la page admin : « sans contact depuis 3 ans » ne correspond à aucune colonne

**Unité A — `server/cron/purge.ts`.** AD-16 prescrit « purge automatique par cron des leads sans contact depuis 3 ans (durée reprise dans la politique de confidentialité) ». Le constructeur cherche la colonne qui matérialise « contact » dans AD-6 et n'en trouve aucune : la table contient `created_at`, `notified_at`, `modelo_synced_at` — trois dates qui décrivent ce que **le système** a fait, aucune qui décrive ce qu'**Anne** a fait. Il retient la seule disponible, `created_at`, et supprime tout ce qui a plus de trois ans.

**Unité B — la page admin et AD-14.** AD-14 confie la relation à Modelo : Anne coche `modelo_synced_at` et travaille le prospect dans le CRM. Le constructeur de l'admin considère donc, très raisonnablement, que D1 est le registre de référence de la capture (Constraint du SPEC : « stockage de référence des leads côté site ») et que la relation vit ailleurs.

**Collision.** Un prospect capté en 2027, recontacté en 2029, en cours de mandat en 2030, est **supprimé du registre de référence** parce que sa seule date lisible a trois ans — alors même que le traitement est actif et que la base légale tient toujours. Symétriquement, si le constructeur choisit une lecture prudente (« ne purger que si `modelo_synced_at IS NULL` »), les leads jamais recopiés dans Modelo — les moins qualifiés, donc les plus nombreux — restent, et la purge ne purge presque rien : la promesse faite dans la politique de confidentialité devient fausse, ce qui est le risque juridique réel.

S'ajoute une **concurrence non arbitrée** : le cron de purge et l'admin touchent les mêmes lignes. Un rejeu de diffusion (AD-4) lancé depuis l'admin sur une ligne que le cron vient de supprimer écrit dans le vide sans erreur visible ; un export lancé pendant la purge livre un instantané incohérent. Le spine ne dit ni qui verrouille, ni que la purge est un `DELETE` ou une anonymisation.

**Correction — AD-16, phrase à ajouter :** « La date qui fait courir la conservation est `last_activity_at`, une colonne de `lead` (AD-6) initialisée à `created_at` et mise à jour par toute action traçable côté site (nouvelle capture du même e-mail, rejeu, marquage manuel depuis l'admin). Purge = suppression définitive de la ligne, hors leads marqués « dossier actif » depuis l'admin, dont la conservation est justifiée par une relation contractuelle et dont la durée est décrite séparément dans la politique de confidentialité. La purge s'exécute sous transaction, hors des heures d'usage de l'admin, et journalise le nombre de lignes supprimées (AD-12). »

---

### H-8 — L'adaptateur e-mail et le module leads : deux propriétaires de `notified_at`, trois diffusions pour deux colonnes

**Unité A — `server/adapters/email.ts`.** AD-8 fait de l'adaptateur le point de passage unique vers Resend. Le constructeur, pour garantir qu'aucun envoi n'échappe au marquage d'AD-4 (« chaque diffusion aval est marquée dans la ligne du lead par son horodatage »), fait horodater l'adaptateur lui-même après l'accusé de Resend. Conforme, y compris aux Conventions (« mutations de D1 uniquement dans `src/server/` » — l'adaptateur y est).

**Unité B — `server/leads.ts`.** Le constructeur se considère seul propriétaire de la ligne `lead` (c'est la lecture naturelle d'AD-4 et d'AD-6), appelle l'adaptateur, et horodate lui-même au retour.

**Collision.** Deux écrivains pour la même colonne, avec deux sémantiques différentes — « accepté par Resend » pour A, « appel terminé sans exception » pour B — donc une double écriture et une valeur dont la signification dépend du chemin d'appel. Plus grave, le décompte ne tombe pas juste : **AD-4 nomme trois diffusions** (e-mail à Anne, e-mail au prospect, Modelo) et **AD-6 n'offre que deux colonnes** (`notified_at`, `modelo_synced_at`). Les deux e-mails partagent donc un horodatage : un rejeu qui renvoie l'e-mail au prospect marque `notified_at`, et la notification d'Anne — celle dont dépend « 0 lead perdu » — est réputée faite alors qu'elle ne l'est jamais. La rejouabilité promise par AD-4 est inopérante au niveau de granularité où elle sert. Rien non plus n'enregistre l'**échec** : une ligne dont `notified_at` est nul ne distingue pas « jamais tenté » de « tenté cinq fois, Resend en panne ».

**Correction — AD-4, phrase à ajouter :** « Chaque diffusion aval est une **ligne d'une table `lead_delivery`** (`lead_id`, `canal` ∈ {`notif_anne`, `email_prospect`, `modelo`}, `attempted_at`, `succeeded_at`, `error_code`), et non une colonne de `lead`. Le module `server/leads` est le **seul** écrivain de `lead` et de `lead_delivery` ; les adaptateurs (AD-8) sont sans état, ne touchent jamais D1 et se contentent de renvoyer un succès ou une erreur typée. `notified_at` et `modelo_synced_at` d'AD-6 sont des vues dérivées de cette table, jamais des sources. »

---

### H-9 — Les compteurs d'entonnoir et le taux de complétion : « sans identifiant personnel » rend la mesure impossible ou fausse

**Unité A — `server/funnel.ts`.** AD-11 impose des compteurs « écrits par le noyau (démarrage, écran atteint, soumission, RDV) dans une table dédiée **sans identifiant personnel** ». Lecture stricte, et c'est la lecture que la phrase appelle : des compteurs agrégés, un incrément par événement, aucune clé de visiteur. Conforme.

**Unité B — la mesure du SPEC.** Le signal de succès exige « ≥ 40 % de taux de complétion du quiz parmi les visiteurs qui le démarrent ». Ce ratio n'est pas calculable à partir de compteurs agrégés indépendants : il faut relier un démarrage à une soumission, donc **une clé de session par visiteur**. Le constructeur de la mesure crée donc un identifiant de session anonyme émis par le noyau au démarrage et transporté par l'îlot jusqu'à la soumission.

**Collision.** Cette clé est un **pseudonyme** : elle relie une suite d'événements à un même individu, ce qui la fait entrer dans le champ du RGPD que le reste d'AD-11 s'emploie précisément à éviter — et le spine s'appuie sur cette évitement pour espérer se passer de bandeau de consentement (Deferred : « Bandeau de consentement : nécessaire ou non »). Sans elle, la métrique phare du SPEC ne peut être ni mesurée ni prouvée, et le rapport « démarrages / soumissions » calculé sur des agrégats est faux dès que les deux événements tombent dans des fenêtres différentes. Question annexe non tranchée par AD-11 : où vit cette clé côté navigateur, alors qu'AD-11 n'autorise qu'un seul stockage sans action (les réponses du diagnostic) ? Et une définition manque toujours : « écran atteint » compte-t-il un retour arrière (CAP-4 autorise le retour dès le 2ᵉ écran) — le même écran vu deux fois est-il un ou deux événements ?

**Correction — AD-11, phrase à ajouter :** « Les événements d'entonnoir portent une **clé de parcours** éphémère : générée par le noyau au démarrage, jamais persistée côté navigateur au-delà de la session de l'îlot, jamais rapprochée d'un lead, et supprimée de la table au-delà de 90 jours, seuls les agrégats survivant. Un événement `ecran_atteint` est compté une fois par écran et par parcours (le retour arrière n'incrémente rien). C'est le seul pseudonyme du site ; il est nommé comme tel dans la politique de confidentialité. »

---

### H-10 — Le sélecteur de langue et la page de résultats : l'identité de langue d'un lead n'est pas définie

**Unité A — `src/islands/selecteur-langue.ts`.** AD-3 fait du sélecteur un chemin toujours disponible entre `/x` et `/en/x`, AD-2 lui impose de renvoyer vers l'index de l'autre langue quand la traduction manque. Le constructeur le place dans l'en-tête **de toutes les pages** — c'est la lecture littérale d'AD-3 et de CAP-10 (« sélecteur de langue »), et un axe de positionnement revendiqué.

**Unité B — `api/diagnostic` et la page de résultats.** AD-6 range `lang` sur la ligne du lead ; AD-5 fait rendre les résultats par le noyau à partir du jeton. Le constructeur écrit `lang` à la soumission et rend feedbacks, e-mails et guide dans cette langue (AD-2 interdit tout repli).

**Collision.** Trois hypothèses implicites divergent, sans qu'aucune AD ne les départage :
- **Que vaut `lang` ?** La langue de la page où le parcours a démarré, celle de la page où il a été soumis, ou la langue dans laquelle Anne doit **rappeler** ce prospect ? Les trois lectures sont défendables et produisent trois valeurs différentes pour le même visiteur. C'est pourtant la donnée opérationnelle la plus utile de la fiche : la clientèle internationale du Léman est l'axe même de CAP-10.
- **Le changement de langue en cours de parcours.** Le sélecteur de l'unité A est présent sur l'écran du quiz ; un clic recharge la page dans l'autre langue et détruit l'état mémoire de l'îlot (AD-5 : réponses en mémoire). Soit le visiteur perd 12 réponses au 13ᵉ écran, soit l'îlot les restaure — ce qui n'est possible que si les réponses sont encodées par identifiants stables et indépendants de la langue, c'est-à-dire seulement si C-1 est corrigé.
- **La page de résultats et l'admin n'ont pas d'alternative de langue.** Ce sont des surfaces du noyau, absentes du contenu : le sélecteur de l'unité A, générique, y calcule un lien vers une URL qui n'existe pas (`/en/resultats/<token>`), ou disparaît sans règle écrite. AD-2 et AD-3 ne parlent que des pages issues du contenu.

**Correction — AD-6, phrase à ajouter :** « `lang` est la langue **de l'interface au moment de la soumission** ; c'est elle qui détermine la langue des e-mails, du guide et de la page de résultats, et elle est reproduite en clair dans la notification à Anne comme langue de rappel. »

**Correction — AD-3, phrase à ajouter :** « Le sélecteur de langue n'existe que sur les pages issues du contenu. Les surfaces du noyau (résultats, admin) sont rendues dans la langue portée par leur contexte (`lead.lang`, préférence de l'administrateur) et sont exclues du sitemap, des `hreflang` et de la canonisation. Un changement de langue pendant le parcours du diagnostic conserve les réponses déjà saisies (identifiants stables, AD-1) ; à défaut, le sélecteur est masqué pendant le parcours. »

---

## MEDIUM

### M-11 — La page Ventes FR et la page Ventes EN : « complète » n'impose aucun plancher de contenu

**Unité A — l'index Ventes FR.** Rend les 5 `StoryDeVente` disponibles. Conforme AD-1, AD-2, AD-3.

**Unité B — l'index Ventes EN.** AD-2 définit une langue complète par le dictionnaire d'interface, les `PageEditoriale`, le `ContenuDiagnostic`, les gabarits d'e-mail et les pages légales — les objets **optionnels** (stories, témoignages) en sont explicitement exclus, et un objet absent dans une langue n'est simplement pas publié. Le constructeur rend donc l'index EN avec ce qui existe : zéro story, si Anne n'a rien fait traduire.

**Collision.** Le build passe, AD-2 est respectée, et le site publie une page « Sales » vide, indexée et atteignable depuis la navigation EN. CAP-2 et CAP-3 posent pourtant des planchers (≥ 3 témoignages, ≥ 3 stories) qui ne sont vérifiés dans aucune langue ; et une page de preuve sociale vide sur la version anglophone est exactement l'atteinte à la crédibilité que le SPEC identifie comme la raison d'être du site. Le mécanisme de garde du spine — « le build échoue s'il manque une clé » — ne surveille que les clés, jamais les collections.

**Correction — AD-2, phrase à ajouter :** « Une page qui présente une collection d'objets optionnels n'est publiée dans une langue que si la collection y atteint son plancher (CAP-2 et CAP-3 : 3 témoignages, 3 stories) ; en dessous, la page et son entrée de navigation n'existent pas dans cette langue, et le sélecteur renvoie vers l'équivalent français. Le build échoue si une page publiée référence une collection vide. »

---

### M-12 — La route guide hors diagnostic et la sélection du guide par profil

**Unité A — le guide depuis les résultats.** AD-1 pose `Guide` = « PDF, un par profil de diagnostic » ; AD-5 calcule `band` et `orientation`. Le constructeur choisit le guide par le profil du lead.

**Unité B — `api/guide` hors diagnostic (CAP-8).** Le visiteur n'a pas passé le diagnostic : `band` et `orientation` sont nuls (C-3). Le constructeur doit servir un guide sans profil — et l'inventaire d'AD-1 n'en prévoit aucun de ce type.

**Collision.** Soit un guide « par défaut » apparaît hors inventaire (violation d'AD-1 en pratique, sinon en lettre), soit la route sert arbitrairement le guide d'une bande, soit CAP-8 hors diagnostic n'est pas implémentable. Sous-jacent : le mot « profil » n'est jamais défini. Est-ce la bande (3), l'orientation (2), la réponse à Q14 (3) — ou leur croisement (18) ? De cette définition dépend le nombre de PDF qu'Anne doit produire, et cette production est sur le chemin critique du lancement (Constraint du SPEC). Le laisser flou en vague 1 revient à ne pas savoir si Anne doit produire un document ou dix-huit.

**Correction — AD-1, phrase à ajouter :** « Le « profil » qui indexe `Guide` est la **bande de score** (3 valeurs) ; l'inventaire comprend en outre un guide **générique**, servi à la route CAP-8 hors diagnostic et à tout lead sans bande. Le nombre de `Guide` à produire est donc fixé à 4 et n'augmente pas avec les règles d'orientation (AD-5). »

---

### M-13 — La page admin et la couche Rendu : une surface qui n'appartient à aucune couche

**Unité A — l'admin en page Astro.** Le constructeur écrit `src/pages/admin/leads.astro`, rendu à la demande, lisant D1 via `server/leads` — c'est de loin le chemin le plus court, protégé par Cloudflare Access (Conventions).

**Unité B — l'admin en îlot + API.** Le constructeur relit le tableau des couches : la couche Rendu « ne dépend jamais de services à l'exécution (D1, Resend, Cal.com) », et le diagramme d'invariants trace explicitement `R x--x D1`. Il en conclut que l'admin doit être un îlot appelant `api/admin` — mais AD-15 lui interdit tout framework client global, alors qu'il doit construire un tableau filtrable avec cases à cocher et boutons de rejeu.

**Collision.** Deux architectures d'admin incompatibles, chacune fondée sur une règle adoptée, l'une violant le tableau des couches, l'autre l'esprit d'AD-15. S'y ajoutent deux effets de bord non traités : les libellés de l'admin sont-ils dans le dictionnaire d'interface (AD-1 interdit toute chaîne éditoriale dans les gabarits) ? Si oui, AD-2 fera **échouer le build** faute de traduction anglaise d'un back-office à deux utilisateurs, et il faudra traduire l'admin en ES et PT le jour où ces langues arrivent. Et l'admin doit être exclue du sitemap, ce qu'aucune AD ne prescrit — AD-3 ne parle que de génération depuis le contenu.

**Correction — Design Paradigm (tableau des couches), phrase à ajouter :** « L'administration n'appartient pas à la couche Rendu : c'est une **surface du noyau**, rendue par le serveur sous `src/pages/admin/`, autorisée à lire et écrire D1 via `server/`, protégée par Cloudflare Access, exclue du sitemap, des `hreflang`, du budget de performance (AD-15) et de l'exigence de complétude linguistique (AD-2). Ses libellés sont en français, hors du dictionnaire d'interface — c'est la seule exception à AD-1, et elle est nommée ici. »

---

### M-14 — La route contact et la route diagnostic : `utm` n'a pas de mécanisme de propagation

**Unité A — `api/diagnostic`.** AD-11 est claire pour ce chemin : « les paramètres de campagne voyagent dans l'URL puis dans l'état de l'îlot jusqu'à la soumission ». La landing diagnostic est deep-linkable et porte les UTM ; l'îlot les garde en mémoire ; ils arrivent complets.

**Unité B — `api/contact`.** AD-6 prévoit `utm` pour toutes les sources. Mais le visiteur arrive sur `/` avec les UTM, navigue vers `/contact` (une page statique, une navigation classique) et les paramètres ont disparu : AD-11 interdit tout stockage navigateur autre que les réponses du diagnostic, et le rendu statique ne peut pas réécrire les liens du site en fonction de la requête entrante (Rendu ≠ exécution).

**Collision.** `utm` est renseigné de façon fiable pour une seule source sur quatre, et **vide sans que rien ne le signale** pour les trois autres — ce qui n'est pas une donnée manquante mais une donnée trompeuse : l'attribution conclura que le contact direct ne vient jamais des campagnes. Or l'arbitrage à 7-10 k€ prestataire vs interne se jugera en partie sur l'origine des leads.

**Correction — AD-11, phrase à ajouter :** « Les paramètres de campagne se propagent par l'URL uniquement : les liens internes vers une page de capture, rendus dans une page qui en portait, les recopient. `utm` distingue trois états sur la ligne du lead — présents, absents parce que le visiteur est venu sans campagne, absents parce que le canal ne peut pas les transporter — la troisième valeur étant écrite explicitement par la route concernée. »

---

## LOW

### L-15 — Le budget de performance bloquant et l'environnement où il se mesure

**Unité A — la vérification de build.** Les Conventions disent : « le build échoue sur : […] budget de performance dépassé ». Le constructeur mesure donc avant déploiement, sur l'URL de prévisualisation.

**Unité B — AD-15.** Dit autre chose : LCP mobile < 2,5 s « mesurés **à chaque déploiement de production** et bloquants au-delà ». Le constructeur mesure après mise en ligne.

**Collision.** Une mesure faite en prévisualisation porte sur une base et des médias différents et peut passer alors que la production échoue ; une mesure faite après déploiement ne peut pas « faire échouer le build » — elle ne peut que constater, sauf à décrire un retour arrière, ce que ni AD-10 ni le RUNBOOK ne font. Faible gravité (le pire cas est une garde qui ne garde rien), mais deux constructeurs produiront deux dispositifs différents et l'un des deux sera jeté.

**Correction — AD-15, phrase à ajouter :** « Le budget se mesure sur l'URL de prévisualisation de la branche, avec le jeu de médias de production, **avant** promotion en production ; l'échec bloque la promotion, non le build. Une mesure de contrôle post-déploiement alerte (AD-12) sans bloquer. »

### L-16 — Le générateur de sitemap et les surfaces du noyau

**Unité A — le générateur (AD-3).** Génère sitemap, `hreflang` et canoniques « depuis le contenu réel ». Il ne connaît que le contenu : les surfaces du noyau lui sont invisibles, donc absentes du sitemap — correct par omission.

**Unité B — le noyau.** Sert `/resultats/<token>`, `/api/*`, `/admin`. Aucune AD ne lui prescrit d'en-tête `noindex` ni de règle `robots.txt` ; AD-5 garantit seulement qu'un jeton est à usage unique et expirant.

**Collision.** Une page de résultats partagée par un prospect (lien collé dans un e-mail, un message) est indexable tant qu'elle vit ; `robots.txt` n'a pas de propriétaire déclaré ; et une sonde Better Stack (AD-12) attend un mot-clé sur des pages dont personne n'a fixé le statut d'indexation.

**Correction — AD-3, phrase à ajouter :** « Toute surface servie hors du contenu (`/resultats/*`, `/api/*`, `/admin/*`) porte `X-Robots-Tag: noindex, nofollow` et est exclue par `robots.txt`, lui-même généré au build par le même générateur que le sitemap. »

---

## Synthèse des corrections

| # | Gravité | Paire | AD à créer ou à resserrer |
| --- | --- | --- | --- |
| C-1 | critical | îlot parcours × noyau de scoring | AD-1 + AD-5 : identifiants stables de questions/options, contrat de soumission |
| C-2 | critical | webhook Cal.com × route contact | AD-7 : deux origines (visiteur / service), signature obligatoire ; AD-7 ajoutée à CAP-9 |
| C-3 | critical | route diagnostic × route contact | AD-6 + AD-5 : contrat de colonnes par source, unicité partielle, pas de sentinelle |
| C-4 | critical | webhook Cal.com × route guide | AD-6 + AD-8 : identité minimale, interdiction du découpage de nom, champs Cal.com au RUNBOOK |
| H-5 | high | îlot de renvoi × noyau écrire-d'abord | AD-4 : clé d'idempotence, rejeu par canal |
| H-6 | high | cron de test × adaptateur e-mail / compteurs | AD-12 + AD-6 : propagation de `is_test`, propriétaire et délai de la purge de test |
| H-7 | high | cron de purge × admin / AD-14 | AD-16 : colonne `last_activity_at`, dossiers actifs, transaction et journal |
| H-8 | high | adaptateur e-mail × module leads | AD-4 : table `lead_delivery`, adaptateurs sans état |
| H-9 | high | compteurs d'entonnoir × taux de complétion | AD-11 : clé de parcours éphémère nommée, définition d'« écran atteint » |
| H-10 | high | sélecteur de langue × page de résultats | AD-6 + AD-3 : définition de `lang`, surfaces du noyau hors i18n de contenu |
| M-11 | medium | Ventes FR × Ventes EN | AD-2 : plancher de collection par langue |
| M-12 | medium | route guide × sélection par profil | AD-1 : « profil » = bande + un guide générique (4 PDF) |
| M-13 | medium | page admin × couche Rendu | Paradigme : l'admin est une surface du noyau, exception nommée à AD-1/AD-2/AD-15 |
| M-14 | medium | route contact × route diagnostic | AD-11 : propagation des UTM par URL, trois états d'`utm` |
| L-15 | low | budget de perf × environnement de mesure | AD-15 : mesure en prévisualisation, bloque la promotion |
| L-16 | low | sitemap × surfaces du noyau | AD-3 : `noindex` et `robots.txt` générés |

**Motif commun.** Douze des seize paires viennent de la même cause : `lead` est une table unique servant **quatre canaux hétérogènes et trois consommateurs aval**, et AD-6 en décrit les colonnes sans décrire, pour chaque colonne, qui l'écrit, quand elle est nulle et ce qu'elle signifie selon la source. Une seule addition — un **contrat de champs par source, avec un propriétaire d'écriture unique par colonne** — ferme C-3, C-4, H-6, H-8, M-12 et M-14. Si une seule correction devait être portée avant la vague 2, c'est celle-là ; C-1 et C-2 sont indépendantes et doivent l'accompagner.

**Note de périmètre.** Les corrections proposées sont des **règles**, pas des champs : elles restent au niveau d'altitude de la vague 1 et ne préemptent pas la liste de champs différée (Deferred, « avant le build »). Elles la contraignent, ce qui est précisément l'objet d'un spine.
