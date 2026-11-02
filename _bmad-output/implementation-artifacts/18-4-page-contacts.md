---
story: 18.4
epic: 18 — Espace d'Anne : le carnet de contacts
statut: done
date: 2026-11-02
maj: 2026-11-02
---

# Story 18.4 — La page Contacts

## Objectif
Qu'Anne voie tous ses contacts dans un grand tableau dès qu'elle ouvre l'espace, pour savoir qui elle connaît et les retrouver vite : une ligne par contact non effacé, du carnet comme du suivi des ventes, colonnes masquables et triables, compteur « N contacts sur M », recherche par nom, prénom, morceau de numéro, e-mail ou entreprise, le tout en moins d'une seconde avec 1 000 contacts. Barre de navigation réduite à « Contacts » et au menu « Autres outils », sans casser aucun lien. PRD `prd-espace-anne-2026-11-01` FR-1, FR-3, FR-14 ; architecture AD-22, AD-27 ; maquette `ux-espace-anne-2026-11-01/maquette.html`.

## Ce qui est fait (2026-11-02)
- **`espace/src/server/tableau.ts`** (lecture seule) : `lireTableau` lit tous les contacts (un effacement supprime la ligne : tous sont « non effacés »), écartés compris, avec leur catégorie, leurs autres numéros, e-mails et liens de profil (`contact_coordonnee`, profil gardé seulement s'il commence par http ou https), leurs sources (`contact_source`) et leur accord e-mail (règle unique `etatEmail` d'`accord.ts`), en un lot de trois lectures.
- **`espace/src/server/tableau-colonnes.ts`** (sans base, partagé par le serveur et le navigateur) : forme d'une ligne, les 13 colonnes de FR-1 (nom et prénom, entreprise, catégorie, projet, température, source, ville, téléphone, e-mail, profil, dernier contact date et canal, accord e-mail, état vérifié ou écarté), libellés des valeurs fermées (AD-24), recherche (`preparerRecherche`, reprise de `lireRecherche` de la story 13.24 : un morceau de numéro, début tapé en 0 converti en +33, est cherché dans **tous** les numéros du contact ; sinon chaque mot dans prénom, nom, ville, entreprise et tous les e-mails) et valeurs de tri. Les filtres de la story 18.5 se brancheront au même endroit.
- **`espace/src/pages/index.astro`** : la page Contacts, accueil de l'espace. Les lignes sont envoyées une fois dans la page (JSON) ; l'îlot de la page trie (clic sur un en-tête, une seconde fois à l'envers, vides en fin de liste dans les deux sens, `aria-sort`), cherche à chaque frappe, masque des colonnes par le menu « Colonnes » (choix gardé dans le navigateur, `localStorage`, lecture et écriture protégées), masque les écartés, et tient le compteur « N contacts sur M » (M = contacts non écartés). Le nom mène à la fiche actuelle (`/contacts/fiche`), le profil s'ouvre dans un autre onglet (`rel="noopener noreferrer"`), un autre numéro ou e-mail est signalé par « +1 » (détail au survol). Mise en page de la maquette : colonne de gauche (bloc « Vues » avec « Tous les contacts »), barre d'outils, tableau plein écran avec en-tête fixe.
- **Navigation (`espace/src/layouts/Espace.astro`, FR-14 livraison 1)** : la barre du haut ne montre plus que « Contacts » et le menu déroulant « Autres outils » (Aujourd'hui, Pipeline, Contacts suivis, À qualifier, Ajouter, Importer une liste, Prescripteurs, Acheteurs, Prospection, Campagnes, Bilan, Numéros à trier, Demandes du site), visible à toutes les largeurs, refermé d'un clic ailleurs ou par Échap ; page en cours marquée dans le menu. Le menu du bas du téléphone garde Aujourd'hui (`/aujourdhui`), Contacts (`/contacts`, la liste en cartes, revue de code), Ajouter, Bilan. Le bouton « Un retour ? » (story 13.20) reste sur toutes les pages au gabarit, dont la page Contacts.
- **Aucun lien cassé** : « Aujourd'hui » déplacée de `/` à `/aujourdhui` (`git mv`) ; les retours internes qui y menaient (`/api/leedflow/tache`, « Noter la suite » depuis Aujourd'hui, lien de « Numéros à trier ») vont directement à `/aujourdhui` ; une ancienne adresse `/?m=suite`, `/?m=tache-acceptee` ou `/?m=tache-ignoree` est renvoyée (302) vers `/aujourdhui?m=…`. L'ancienne liste `/contacts` reste, renommée « Contacts suivis » (lien « Tous les contacts » vers `/`).
- **Essais** : `espace/scripts/e2e-espace.mjs` (constats nouveaux ci-dessous ; essais qui supposaient « Aujourd'hui » sur `/` repointés vers `/aujourdhui`) ; `espace/scripts/maquette-espace.mjs` recopie aussi la page Contacts.
- **Documents** : `espace/README.md`, statut de sprint.

## Ce qui est vérifié (2026-11-02)
- `site` : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run check` (0 erreur, 0 avertissement), `npm run base:local` (rien à appliquer) ; la story ne change pas le site.
- `espace` : `npm run build`, `npm run check` (0 erreur, 0 avertissement, les 5 indications déjà présentes).
- `node scripts/e2e-espace.mjs` : **tout est bon, 351 constats**, dont 18 nouveaux de la 18.4 :
  - la page Contacts est l'accueil et charge tout le carnet (contact hors suivi, contact suivi, autres numéros, profil, sources, catégorie, écarté marqué) ; une ligne par contact non effacé ;
  - « Aujourd'hui » joignable à `/aujourdhui`, `/?m=suite` renvoyé (302) vers `/aujourdhui?m=suite` ;
  - les 13 entrées du menu « Autres outils » répondent toutes (200) ; le nom d'un contact du carnet ouvre sa fiche ;
  - dans le navigateur (1440 px) : compteur « 151 contacts sur 151 » ; contact du carnet et contact suivi affichés, écarté masqué ; les 13 colonnes de FR-1 remplies (dont « 28/10/2026 · WhatsApp », « Sans accord », « ✓ vérifié », lien LinkedIn en `noopener`) ; recherche par un morceau du milieu de l'autre numéro, par un début tapé « 06 33 … », par l'entreprise, compteur « 1 contact sur 151 » ; tri par ville puis à l'envers, vides en fin de liste ; colonne E-mail masquée qui le reste après rechargement ; menu « Autres outils » qui s'ouvre ; bouton « Un retour ? » présent ;
  - pas de débordement horizontal à 1440 px, 1280 px (et sur téléphone, 390 px, dans la boucle des captures) ;
  - **1 000 contacts fictifs** ajoutés (1 189 lignes en tout) : tri par nom 58 ms, par ville 34 ms, par dernier contact 30 ms, recherche par mot 25 ms, par numéro 4 ms, recherche effacée 59 ms (seuil : 1 000 ms) ; contacts fictifs retirés ensuite.
  Deux passages précédents avaient échoué sur l'essai lui-même (adresse e-mail d'essai déjà prise, contact du carnet entré dans le suivi par un essai antérieur), corrigés dans l'essai.
- Captures regardées (`espace/.verif/espace-contacts-1440.png`, `-1280.png`, `-menu-1440.png`, `-sans-email-1440.png`, `espace-accueil-contacts-ordinateur.png`, `-telephone.png`) : mise en page de la maquette (barre du haut en pastilles, colonne « Vues », recherche arrondie, tableau blanc à en-têtes en petites capitales, pastilles de catégorie, de projet en pointillés « À qualifier » et de température, « Avec Anne » en bleu Klein).

## Écarts assumés (avec la maquette)
- **Une colonne par information de FR-1**, là où la maquette regroupe (entreprise sous le nom, téléphone et e-mail dans « Coordonnées », accord sous l'état) : FR-1 demande de masquer et trier chacune. Le libellé « État » de la maquette est gardé pour vérifié ou écarté.
- **Menu « Colonnes »** ajouté à la barre d'outils (absent de la maquette) : c'est le moyen de masquer une colonne.
- **Ce qui viendra dans les stories suivantes n'est pas construit**, et sa place est gardée dans la mise en page : bloc « Reste à vérifier » (18.10), vues enregistrées et catégories de la colonne de gauche, filtres de la barre d'outils et pastilles des filtres actifs (18.5), cases à cocher, barre des actions groupées et changement de catégorie d'un clic dans la ligne (18.6), « + Nouveau contact » et nouvelle fiche (18.7), barre « Nouveaux » au-dessus de la recherche (18.11). La colonne de gauche ne montre donc que « Tous les contacts ». Les écartés sont chargés mais ne peuvent pas encore être affichés (filtre « écartés » en 18.6).
- **Menu « Autres outils »** : plus d'entrées que la maquette (Contacts suivis, À qualifier, Ajouter, Importer, Bilan), la liste du PRD (FR-14). « Qualifier » mène à la liste des contacts à qualifier (`/contacts?f=a_qualifier`) : la page de qualification demande un contact précis. Menu fait d'un `<details>` (fonctionne sans JavaScript). Ni Séances ni Semaine (livraisons 2 et 3).
- **Bouton « Un retour ? »** en bas à droite, celui de la story 13.20 (la maquette le place en bas à gauche).
- **Tableau dans une boîte qui défile seule**, en-tête fixe, hauteur de l'écran : avec des centaines de lignes, l'en-tête reste lisible. À 1440 comme à 1280 px, les 13 colonnes ne tiennent pas toutes (les dernières, profil, dernier contact, accord, état, sont à droite) : la boîte défile horizontalement, la page non ; masquer des colonnes règle cela. À revoir avec Anne (ordre ou colonnes masquées par défaut).
- **Pas de mode sombre** (la maquette en a un) : l'espace suit la charte claire du site.
- **Téléphone** : la page est faite pour l'ordinateur (story « sur ordinateur d'abord ») ; sur téléphone, le tableau défile dans sa boîte. Sous 900 px, « Contacts » du menu du bas mène à `/contacts`, la liste en cartes de la story 13.24 avec l'appel en un geste (revue de code 18.4) : le tableau reste l'accueil sur ordinateur, et la page d'accueil `/` sur téléphone.
- **Recherche** : la ville est aussi cherchée (logique reprise de la story 13.24, qui cherchait déjà la commune), en plus des champs de FR-3.
- Après l'effacement d'un contact depuis sa fiche, l'espace revient toujours à `/contacts` (« Contacts suivis »), comme avant.

## Revue de code
2026-11-02, session neuve, skill `bmad-code-review`, PR #226, commits relus ae0ee42 (correction de la revue 18.3) et 0dae72d (story 18.4). Rien de bloquant. Toutes les corrections sont dans le commit « correction de la revue 18.4 ».
1. `rights.ts`, `effacer` par e-mail : les téléphones des demandes de cette adresse restées sans contact vont dans l'opposition et servent à trouver les autres demandes sans contact : corrigé (commit « correction de la revue 18.4 »), essai ajouté dans `e2e-espace.mjs`.
2. `rights.ts`, `effacerContact` : les e-mails des demandes liées au contact servent aussi à trouver les demandes sans contact : corrigé (commit « correction de la revue 18.4 »).
3. `orphelinsDe` : une demande sans contact trouvée seulement par le téléphone (couple, ligne fixe) est effacée, mais seul son téléphone va dans l'opposition ; trouvée par l'e-mail de la personne, téléphone et e-mail y vont : corrigé (commit « correction de la revue 18.4 »), essais ajusté et ajouté.
4. Sous 900 px, « Contacts » du menu du bas mène à `/contacts` (liste en cartes, appel en un geste) ; le tableau reste l'accueil sur ordinateur : corrigé (commit « correction de la revue 18.4 »), écart noté ci-dessus, essai ajouté.
5. Renvoi des anciennes adresses `/?m=…` en 302 et non 301 (un 301 est gardé par le navigateur) : corrigé (commit « correction de la revue 18.4 »).
6. Recherche recalculée 120 ms après la dernière frappe : corrigé (commit « correction de la revue 18.4 ») ; l'essai de vitesse mesure désormais de la frappe au tableau redessiné, attente comprise.
7. Accents ignorés des deux côtés (`sansAccents`), et une recherche faite de chiffres cherche aussi dans le texte (entreprise, ville, nom) en plus des numéros : corrigé (commit « correction de la revue 18.4 »), essai « helene » qui trouve « Hélène ».
8. Commentaire de `tableau.ts` : trois requêtes, pas quatre : corrigé (commit « correction de la revue 18.4 »).

Vérifications : 2026-11-02 : `site` build (clé Turnstile d'essai) et `npm run check` (0 erreur, 0 avertissement), `base:local` (rien à appliquer) ; `espace` build et `npm run check` (0 erreur, 0 avertissement, 5 indications déjà présentes) ; `e2e-espace` **354 constats, tous bons** (3 nouveaux, 1 ajusté) ; `e2e-gestion` **52, tous bons**. Avec 1 228 contacts : tris en 37 à 61 ms ; recherches mesurées désormais de la frappe au tableau redessiné, attente de 120 ms comprise, 155 à 722 ms (sous le seuil d'une seconde, mais la recherche par numéro, à 722 ms, est la plus lente : à surveiller sur l'ordinateur d'Anne).

## Ce qui reste
- Story 18.5 : filtres et vues enregistrées, branchés sur `tableau-colonnes.ts` (même vocabulaire que `vues`, AD-27).
- Story 18.6 : cases à cocher, actions groupées, filtre « écartés ».
- Story 18.7 : nouvelle fiche et « + Nouveau contact ».
- Version téléphone de la page Contacts, si Anne la demande (bouton « Un retour ? »).
