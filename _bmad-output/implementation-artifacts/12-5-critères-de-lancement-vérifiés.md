# Story 12.5 : Critères de lancement vérifiés (et préparation de la bascule 12.4)

Epic 12, Lancement public. Ouverte le 2026-10-10 à la demande de JB : lancement voulu le **2026-10-11 au soir**.

## Objectif

Une liste de contrôle cochée point par point, avec preuve, avant de brancher `annevialtissot.fr` sur le site (story 12.4).

## Audit du 2026-10-10 (fil « Audit avant le lancement »)

Constats, chacun vérifié dans le dépôt :

- **Construction publique refusée** : `PUBLIC_INDEXATION=oui npm run build` s'arrête sur le garde-fou de la story 10.5 : guide et étapes 1 à 6 de la séquence en `statut: brouillon`.
- **Aucune vente publique** : en levant ce verrou à titre d'essai, `/realisation` affiche « Les premières stories arrivent » ; les 10 fiches de `contenu-anne/stories/` sont en `brouillon` (Anthy T3 en `a-relire`).
- **Coordonnées légales absentes** (A-13) : `rsac`, `cartePro`, `telephone`, `email` à `null` dans `site/src/config/site.ts` ; `contenu-anne/legal/identite.md` porte encore ses lignes « À REMPLIR ». Le pied de page de chaque page affichait « RSAC à compléter (A-13) ».
- **Marques de travail visibles en public** : « Point ouvert 2 » (Vendre), « Contenu à écrire par Anne » (Acheter), « Point ouvert 1 » (À propos, Cible), bloc réservé A-02 sur la pile de l'accueil (vente « à venir » de Sciez), A-05 (À propos), A-10 (couverture du guide), A-07 (témoignage manquant d'une fiche).
- **Réseaux sociaux** : les icônes menaient aux pages d'accueil d'Instagram, YouTube et LinkedIn (adresses des profils jamais fournies, story 7.7).
- **Bascule** : `ENVIRONNEMENT`, `URL_SITE` et la base sont dans `wrangler.jsonc`, commun à toutes les branches. Les committer en production sur `main` ferait écrire les aperçus des branches (essais de design, travaux des fils) dans la vraie base et envoyer de vrais e-mails.
- Aucun ticket `retour-apercu` ouvert. PR ouvertes : #20, #76, #79 (essais de design, brouillons), #72 (e-mails à la charte et rapport PDF, brouillon).

## Périmètre proposé pour le 2026-10-11 (décision de JB attendue, carte du fil)

Recommandation : lancement **minimal**, design actuel. Décalés d'environ une semaine et notés comme écarts assumés : transfert du dépôt et coffre (12.3), surveillance Better Stack et test synthétique (10.8), fiche Google (11.2), cadrage visibilité (11.1), audit Lighthouse, e-mails à la charte (10.9) et rapport PDF (10.10), anglais complet (6.2 à 6.4), Sciez et Bernex (7.19), barème Q10.

## Ce qui est fait (2026-10-10)

- Site public (`PUBLIC_INDEXATION=oui`) : les marques « Point ouvert » / « Contenu à écrire par Anne », les blocs réservés A-05 et A-07 et les cartes « à venir » de la pile ne s'affichent plus ; ils restent sur l'aperçu pour la relecture.
- Page `/guide` : la vraie couverture du PDF remplace le bloc A-10 (`public/img/guide-couverture.jpg`, produite par `scripts/guide-pdf.mjs`).
- Réseaux sociaux : un réseau sans adresse de profil n'est plus affiché nulle part.
- Mentions légales et pied de page : lus dans `identite` (RSAC, greffe, carte pro, adresse, téléphone, e-mail) ; **nouveau garde-fou** : le site public ne se construit pas tant qu'une de ces valeurs manque.
- Bascule par la construction : `scripts/lancement.mjs` (lancé par `npm run build`) passe en production **seulement** si la construction porte sur `main` et si la variable de construction `LANCEMENT` vaut `oui` : base `anne-leads`, `ENVIRONNEMENT=production`, `URL_SITE=https://annevialtissot.fr`, `PUBLIC_INDEXATION=oui`. Les autres branches restent des aperçus. Retour arrière : retirer `LANCEMENT` et relancer la construction (RUNBOOK § 4).

## Vérifié

- `npm run build` (aperçu) : sans erreur ; `npm run check` : 0 erreur ; `node scripts/liens.mjs` : 26 pages, 1301 liens, 0 cassé.
- `node scripts/lancement.mjs` en local : « aperçu (construction locale), configuration inchangée » ; `--essai` : base `anne-leads`, `production`, `https://annevialtissot.fr`.
- Construction de production simulée sur une copie (`WORKERS_CI=1 WORKERS_CI_BRANCH=main LANCEMENT=oui`, guide et une vente passés en `publie`) : refusée tant que les coordonnées manquent (« Lancement refusé : coordonnées légales manquantes… ») ; avec des valeurs fictives, réussie ; `dist/server/wrangler.json` porte `anne-leads`, `production` et l'adresse publique ; `/robots.txt` = `Allow: /` ; aucune marque de travail, aucun `noindex`, aucun bouton « Un retour ? » sur l'accueil, Réalisations, À propos, Acheter, Vendre, Guide, Mentions légales ; captures 1440 et 390 de `/`, `/guide`, `/a-propos`, `/realisation` : aucune erreur console.

## Liste de contrôle du lancement

Chaque point porte sa preuve et sa date quand il est coché.

**Contenu (Anne)**
- [ ] Coordonnées A-13 reçues et reportées (RSAC et greffe, carte pro, adresse pro, téléphone, e-mail). Point de JB du 2026-10-10 : Anne exerce sous la carte T d'eXp France ; à demander à Anne : son numéro RSAC (inscription obligatoire d'un agent commercial au greffe) et le numéro de son attestation d'habilitation eXp, en plus du numéro de carte T d'eXp France.
- [x] Ventes passées en `publie` depuis l'espace d'édition le 2026-10-10 au soir (PR n° 83 à 89, fusionnées par Claude à la demande de JB) : Thonon, Armoy, Anthy T3, Anthy T4, Évian, Bernex, Essert-Romand. Restent en brouillon : Allinges, Sciez, Morzine.
- [ ] Mentions légales, confidentialité et cookies validées par écrit par Anne ; pastille « À valider par Anne » retirée de `/confidentialite`
- [ ] Guide relu, `statut: publie`, PDF refait (`node scripts/guide-pdf.mjs`)
- [ ] Six e-mails de la séquence relus, `statut: publie`
- [x] Adresses des réseaux sociaux données par JB le 2026-10-10 (Instagram, YouTube, LinkedIn), reportées dans `site/src/config/site.ts` et `contenu-anne/legal/identite.md`

**Bascule (JB, avec Claude)** : ordre du RUNBOOK § 4
- [ ] Domaine `annevialtissot.fr` rattaché au Worker ; `www` et `.com` redirigés en 301 vers `https://annevialtissot.fr`
- [ ] Turnstile : `annevialtissot.fr` ajouté aux domaines du widget `site-anne`
- [ ] Application Access « Gestion » créée sur `/gestion` et `/api/gestion`, son AUD ajouté à `ACCESS_AUD`
- [ ] Variable de construction `LANCEMENT=oui`, construction de `main` relancée et réussie
- [ ] Access retiré de `annevialtissot.fr` (gardé sur `workers.dev`)
- [ ] Webhook Cal.com pointé sur `https://annevialtissot.fr/api/webhook-cal`
- [ ] Essais en ligne : accueil sans écran de connexion, `/robots.txt` autorise, `.com` redirige, `/gestion` demande le code, un contact, un guide, un diagnostic et un rendez-vous reçus par Anne puis effacés depuis `/gestion`
- [ ] Accord écrit d'Anne pour le lancement

## Ce qui reste

Tout le contenu d'Anne ci-dessus ; la bascule ; le tableau de bord et `CLAUDE.md` à la mise en ligne (story 12.4).
