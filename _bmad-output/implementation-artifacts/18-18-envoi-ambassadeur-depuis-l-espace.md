# Story 18.18 : envoyer le modèle ambassadeur depuis l'espace

Epic 18 (le carnet de contacts). Statut : review. Date : 2026-11-05. Origine : demande de JB dans le fil « [Com] Campagne de parrainage », transmise au fil « Retours espace » ; décision de JB du 2026-11-05 (carte « Oui, comme proposé »).

## Objectif

Anne marque des contacts comme ambassadeurs potentiels et veut leur envoyer le modèle d'e-mail du programme ambassadeurs, sans copier sa liste ailleurs.

Décision de JB (2026-11-05) :
- **Envoi groupé** depuis l'onglet Campagnes, réservé à la règle existante (FR-13, `accord.ts`) : contacts avec accord e-mail ou anciens clients. Les destinataires se choisissent à la main (cases à cocher dans le tableau des contacts, puis « Envoyer un modèle ») ou par une vue enregistrée (par exemple « Ambassadeurs »).
- **Formule d'appel tirée de la catégorie**, sans nouveau champ : prénom (« Bonjour Prénom ») pour un proche ou un ancien client, « Bonjour Madame/Monsieur Nom » pour une relation lointaine (civilité absente : « Bonjour Prénom Nom »).
- **Image** dans le corps de l'e-mail : le verso de la carte ambassadeur.
- Après chaque e-mail parti : **dernier contact** mis à jour (date du jour, canal e-mail) et **trace sur la fiche** (quel modèle, quel objet, quand). Amende AD-28 (le dernier contact n'était écrit que par la coche « contacté »).
- **Proches et relations lointaines sans accord** : pas d'envoi groupé. La fiche propose « Écrire » : le même modèle, rempli avec la bonne formule, s'ouvre dans la messagerie d'Anne (lien `mailto:`) ; un bouton « Envoyé » note le dernier contact et la trace sur la fiche.

Ajout de JB (2026-11-05, en cours de route) : **état d'ambassadeur à trois valeurs**, en vraie colonne « Ambassadeur » du tableau (pastille de couleur et libellé, triable À contacter, Contacté, Inscrit, filtrable, enregistrable dans une vue) et sur la fiche : Inscrit (vert), Contacté (ambre), À contacter (neutre).

Modèle d'e-mail (objet, texte, lien `?c=email`) : https://claude.ai/artifact/CaiL2XBUynE7ekUEcFVTzB (fil Parrainage).

## Ce qui est fait

Aucune migration : tout tient dans le JSON `filtres` de la campagne et dans des lectures calculées.

- **Destinataires** (`espace/src/server/campagnes.ts`, `Filtres.ids` / `vue`) : trois modes exclusifs, liste cochée, vue enregistrée (évaluée sur le serveur avec les mêmes `preparerFiltre` et `preparerRecherche` que le tableau ; vue invalide = aucun destinataire et message), anciens filtres. La règle d'accord reste unique (`accord.ts`) : `selectionner` puis `envoyerA` la repassent juste avant chaque e-mail. Écartés avec raison : sans accord, désinscrit, sans adresse, catégorie sans envoi groupé, contact écarté du tableau (nouveau, pour liste et vue seulement, aussi revérifié à l'envoi).
- **« Envoyer un modèle »** dans la barre des contacts cochés (`pages/index.astro`) : liste des modèles (campagnes cochées « modèle », case ajoutée à la page de la campagne), crée un brouillon par `POST /api/campagnes` (`creerDepuisModele`) et ouvre sa page ; la page de la campagne propose « À qui » : filtres, vue enregistrée ou contacts cochés. Rien ne part d'ici.
- **Formule** : jeton `[Formule]` (`formuleAppel`, `categories-regles.ts`). `lointains` : « Bonjour Prénom Nom » (aucune civilité en base) ; toute autre catégorie ou aucune : « Bonjour Prénom ». Calculée à chaque envoi d'après la catégorie du moment.
- **Verso de la carte** : `espace/src/server/carte-ambassadeur-verso.jpg` (600 x 388, 37 Ko, verso corrigé du fil Parrainage), jointe par content-id `verso-carte` (`Email.images` dans `site/src/server/adapters/email.ts`, `Habillage.image` dans `email-html.ts`), seulement si la case « joindre le verso » est cochée ; aperçu en image intégrée.
- **Après chaque e-mail parti** : dernier contact (maintenant, canal e-mail) et événement `email` « Campagne « nom » envoyée : objet » avec avant-image (AD-29) et la marque `envoi_modele` ; `last_activity_at` inchangé. AD-28 amendé dans le spine.
- **Fiche sans envoi groupé** (`Fiche.envoi_groupe` faux, adresse connue) : bloc « Écrire à la main » : modèle, « Écrire » (`mailto:` prêt, `GET /api/campagnes?modele&contact`), « Envoyé » (`contact` de `/api/fiche` avec `envoi_modele`, via `noterContact` : dernier contact + trace « envoyé à la main »).
- **État ambassadeur** : `etatAmbassadeur` (`tableau-colonnes.ts`) ; colonne `ambassadeur` (triable), clé de filtre `ambassadeur_etat` (`vues.ts`, liste), option « État ambassadeur » des filtres, pastille sur la fiche. Contacté = événement portant `envoi_modele` (choisi plutôt que `dernier_contact_le`, que n'importe quel appel remplit) ; calculé par `SQL_MODELE_ENVOYE`, sans colonne.
- Documents : `espace/README.md`, `sprint-status.yaml` (18-18 en review, epic-18 en cours), AD-28 amendée.

Choix à valider par JB : les proches ont `envoi_groupe_permis = 0` par défaut, donc même avec accord ils sont écartés d'un envoi groupé tant qu'Anne ne l'ouvre pas dans `/categories` (« Écrire » reste leur voie) ; idem pour les relations lointaines, dont la formule « Prénom Nom » ne sert alors qu'à « Écrire » ; couleurs vert et ambre hors charte (la charte n'en a pas).

## Ce qui est vérifié

- `cd espace && npm run build && npm run check` : build ok, 0 erreur (astro check et `tsc -p tsconfig.worker.json`). `cd site && npm run build && npm run check` : build ok, 0 erreur, 0 avertissement.
- `node scripts/e2e-espace.mjs` (essai complet, une fois, 603 constats verts) : 11 échecs, dont 6 connus et sans lien (« En retard », boîtage par secteur, test A/B de l'accueil et de Claude, synthèse dans l'heure, 18.11 Nouveaux), 4 constats de ce bloc 18.18 qui venaient d'un défaut de l'essai lui-même (identifiant de vue de 25 caractères au lieu de 26, apostrophe échappée dans le HTML) et 1 sans lien apparent : « 18.5 : /api/vues … jeton de Claude (suppression) 500 » (le journal montre un DELETE accepté juste après les deux POST refusés ; `/api/vues` n'est pas touché par cette story, à regarder à part).
- Essai corrigé relancé seul sur une base locale neuve (`E2E_1818_SEUL=1`, nouveau mode du script qui ne joue que le bloc 18.18) : **25 constats 18.18 verts** : modèle marqué, états ambassadeur, accès refusés sans jeton et à Claude, liste cochée (1 destinataire ; sans accord, catégorie sans envoi groupé, écarté du tableau écartés avec la raison), brouillon copié du modèle, liste figée, « Bonjour Camille », verso joint par content-id avec le logo, dernier contact et événement avec avant-image, fiche « Contacté », « Bonjour Léa Nom » (lointains), vue enregistrée (états inscrit et contacté combinés), vue invalide jamais élargie ni envoyable, fiche sans envoi groupé, « Écrire » (objet, texte, adresse) puis « Envoyé » (dernier contact + trace), et dans le navigateur : `mailto:` de la fiche, « Envoyé », colonne Ambassadeur triable (À contacter, Contacté, Inscrit) et filtre « État ambassadeur ». Capture : `espace/.verif/espace-colonne-ambassadeur-1280.png`.
- Pas rejoué en entier après la correction de l'essai : le bloc corrigé ne touche aucun autre constat.

## Ce qui reste

- JB : créer le sous-domaine d'envoi `nouvelles.annevialtissot.fr` dans Resend (RUNBOOK § 4 sexies) ; Claude pose ensuite `EXPEDITEUR_CAMPAGNES` par une PR. D'ici là, rien ne part en production.
- Revue de code (story 9.8) avant fusion.
- Verso de la carte remplacé le 2026-11-05 par la version corrigée du fil Parrainage (seulement « jusqu’à 1 500 € », règle de JB du 2026-11-05) : 600 x 388, 37 Ko.

## Revue de code

Relecture adverse (`bmad-code-review`), session neuve, 2026-11-05. Commits relus : 635faf8, 430635b, 5c49a09 (`git diff 9416615..HEAD`). Corrections dans le commit « Espace 18.18 (revue) » de la branche.

- À corriger : un contact écarté du tableau pouvait recevoir une campagne par les anciens filtres (la garde « écarté » ne valait que pour liste et vue) : corrigé (commit de revue, `selectionner` et `envoyerA` refusent un contact écarté dans tous les modes).
- À corriger : prénom et nom (formulaire public) entraient tels quels dans le Markdown de l'e-mail, donc un `[texte](adresse)` ou un saut de ligne y faisait un lien ou un paragraphe, et la formule « Prénom Nom » élargissait le défaut : corrigé (commit de revue, `nomPourEmail` retire les marques Markdown et les sauts ; `[Prénom]` remplacé par fonction, sans motifs `$`).
- À corriger : « Écrire » mettait l'adresse du contact, non encodée, dans le `mailto:` ; une adresse acceptée par le site comme `x@y.fr?bcc=…` ou avec une virgule ajoutait un destinataire à la main d'Anne : corrigé (commit de revue, le serveur refuse les adresses à caractères de contrôle de lien, le navigateur encode ce qui reste).
- Écarté : accord (`accord.ts`) : aucun chemin ne contourne la règle. Liste cochée, vue, modèle, `/api/campagnes` (ids validés par ULID, champs inconnus refusés, 100 000 caractères au plus, Claude refusé) ne font que choisir des contacts ; `selectionner` puis `envoyerA` repassent accord, désinscription, catégorie sans envoi groupé, adresse changée avant chaque e-mail. Une vue invalide ou disparue ne donne aucun destinataire.
- Écarté : images jointes (`email.ts`, `email-html.ts`) : sans `images` ni `image`, les pièces jointes et le HTML des e-mails du site sont identiques à avant.
- Écarté : avant-image (AD-29) de l'envoi : l'événement est écrit avant la mise à jour du contact dans le même lot, `apres` peut différer d'un dernier contact futur (impossible : les dates sont passées ou du jour).
- Écarté : performance de l'état ambassadeur : `SQL_MODELE_ENVOYE` passe par l'index `contact_evenement_contact (contact_id, a)`, ne lit que les événements `email` et `note` d'un contact (quelques lignes) ; ~1 400 contacts, pas de nouvel index nécessaire.
- Écarté : « Écrire » reste offert pour un contact désinscrit (message personnel de la main d'Anne, pas un envoi groupé) ; le texte de la fiche le dit.
- À signaler à JB (non corrigé, choix de produit) : « Contacté » compte tout e-mail de campagne parti (la marque `envoi_modele` est posée par toute campagne, pas seulement un modèle ambassadeur) ; un contact de projet « ambassadeur » qui reçoit une autre campagne passe donc « Contacté ». « Envoyé » cliqué deux fois note deux fois le contact. Plus de 2 000 contacts cochés : la liste est tronquée sans message.
- Vérifié après correction : `espace` et `site` : build et check à 0 erreur ; essai ciblé `E2E_1818_SEUL=1` sur base neuve : 25 constats 18.18 verts (le script se termine volontairement par « 1 échec(s) », signal de fin du mode seul).
