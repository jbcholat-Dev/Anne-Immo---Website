# Story 12.10 : Scan de sécurité du site après l'ouverture au public

Epic 12, Lancement public. Ouverte le 2026-10-14 à la demande de JB (fil « Scan de sécurité »). Le site est public depuis le 2026-10-11.

## Objectif

Vérifier que le site en ligne ne laisse ni données des prospects, ni espace de gestion, ni clé accessibles, corriger ce qui est sûr, et lister le reste par priorité.

Le module « Claude Security » n'était pas installé dans le projet : le scan est fait à la main (lecture de tout le code serveur, essais sur le site en ligne, recherche de clés, `npm audit`).

## Ce qui a été vérifié (2026-10-14)

- **Espace de gestion `/gestion`** : sur `annevialtissot.fr`, `/gestion`, `/api/gestion/export`, et les variantes d'adresse qui tentent de contourner la protection (`/%67estion`, `/Gestion`, `//gestion`, `/gestion/../gestion`, `/api/Gestion/export`) renvoient toutes vers la connexion Cloudflare Access (302) ; `/api/gestion%2Fexport` donne 404. Derrière Access, le serveur revérifie la signature du jeton (`src/server/acces.ts`) et chaque route refuse sans compte vérifié. Un envoi de formulaire depuis un autre site vers `/api/gestion/effacer` est arrêté (302 vers Access).
- **Formulaires** (`src/server/capture.ts`, `verification.ts`, `schema.ts`) : Turnstile validé côté serveur, champ piège, limite de 5 envois par minute et par adresse IP, taille de requête bornée, chaque champ revérifié côté serveur, requêtes SQL toutes paramétrées.
- **Liens envoyés par e-mail** (guide, rapport, désabonnement) : signés HMAC SHA-256, comparaison en temps constant, durée de 7 jours. Page de résultats du diagnostic : jeton de 24 h liée au premier navigateur par un cookie `httpOnly`, `secure`.
- **Webhook Cal.com** : signature vérifiée avant toute lecture. **Bouton « Un retour ? »** (`/api/retour`) : réservé aux comptes Access.
- **E-mails** : le texte saisi par le visiteur est échappé dans la version HTML, et ses crochets sont neutralisés, ce qui empêche d'y glisser un lien déguisé.
- **En-têtes de sécurité** en ligne : HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, sur les pages fixes comme sur les pages du serveur.
- **Clés** : aucune clé dans les fichiers suivis ni dans les 215 commits disponibles localement (copie partielle de l'historique) ; `.env` ignoré par Git, les fichiers d'exemple sont vides.
- **Dépendances** : `npm audit` signalait 6 failles « élevées », toutes dans les outils de construction (`wrangler`, `miniflare`, `sharp`, `source-map-js`, `http-cache-semantics`), aucune dans le code mis en ligne.

## Ce qui est fait

- `site/package-lock.json` : `npm audit fix` (mises à jour mineures, sans changement de version majeure) : `sharp` 0.35.5, `wrangler` 4.151.0, `source-map-js` 1.2.2, `http-cache-semantics` 4.3.0. `npm audit` : 0 faille.
- `site/public/admin/index.html` : empreinte `integrity` (SRI, sha384) sur le programme Sveltia CMS chargé depuis unpkg. Si unpkg servait un jour un fichier modifié, le navigateur refuserait de l'exécuter ; sans cela, un fichier piégé pourrait agir avec la connexion GitHub d'Anne. L'empreinte est identique sur unpkg et jsDelivr. Changer de version de Sveltia impose de recalculer l'empreinte (commande en commentaire dans le fichier).

## Vérification

- `npm run build` : réussi. `npm run check` : 0 erreur. `node scripts/liens.mjs` : réussi.
- Espace d'édition construit, ouvert dans Chromium avec l'empreinte : Sveltia se charge (écran « Sign In with GitHub » affiché).

## Ce qui reste (recommandations, non faites ici)

0. **Dépôt GitHub public** (le plus important) : constaté le 2026-10-14 (`"visibility": "public"`). Tout le monde peut lire le code, les fiches de ventes, le registre des avis et l'historique. Action J22 du tableau de bord, ouverte depuis le 2026-10-05 : passer le dépôt en privé (Settings → Danger zone → Change visibility). La mise en ligne Cloudflare et l'espace d'édition continuent de fonctionner ; seules les minutes gratuites des programmes GitHub (Actions) deviennent limitées (2 000 par mois), largement suffisantes ici.
1. **Formulaire utilisable pour écrire à n'importe qui** (moyen) : la confirmation recopie le message du visiteur et part de `anne@annevialtissot.fr` vers l'adresse saisie. Quelqu'un peut donc envoyer un texte de son choix, avec une adresse web que la messagerie rendra cliquable, à une tierce personne, au nom d'Anne. Turnstile et la limite de fréquence freinent les envois en masse. Décision de JB à prendre : ne plus recopier le message dans la confirmation (recommandé), ou neutraliser les adresses web qu'il contient.
2. **Politique de sécurité du contenu (CSP)** (faible) : aucun en-tête `Content-Security-Policy`. À poser d'abord en mode « rapport seul » après inventaire des scripts (Turnstile, Cal.com), puis en blocage.
3. **HSTS** (faible) : ajouter `includeSubDomains` une fois sûr qu'aucun sous-domaine ne sert en HTTP.
4. **Historique complet** : la recherche de clés n'a porté que sur la copie partielle ; activer « Secret scanning » dans les réglages GitHub du dépôt couvre tout l'historique.
5. **Claude Security** : à installer par JB dans les Paramètres du projet, puis relancer un scan pour comparaison.
