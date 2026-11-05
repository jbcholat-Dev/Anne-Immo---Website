# Story 18.10 : premier import et classement de départ

Epic 18 (le carnet de contacts). Statut : fait le 2026-11-02.

## Objectif
Verser dans le carnet de l'espace les contacts du téléphone d'Anne et de son fichier « SUIVI PROSPECTION », selon la fiche légale validée par JB le 2026-11-02 à 10 h 26 et les règles de pré-rangement FR-9.

## Ce qui est fait
- Le carnet (stories 18.5 à 18.12) a été mis en ligne par la PR #227, fusionnée le 2026-11-02 à 16 h 54 UTC. La migration 0019 tourne en production (`/api/sante` : `migrations: 19`). Point de retour Time Travel de `anne-leads` : 2026-11-02 16:36 UTC (RUNBOOK § 4 quater).
- Import du téléphone (vCard, genre `telephone`), lot `01M6EK1RNQT3J2R18JJ1AR171Y` :
  - 882 lignes lues, 9 fusionnées dans le fichier ;
  - 854 nouveaux contacts, pré-rangés « proches » ;
  - 3 compléments de contacts vérifiés ;
  - 16 lignes rejetées (vides), 6 téléphones illisibles ;
  - PHOTO, TITLE et X-ANDROID-CUSTOM ignorés.
- Import du fichier Excel, lot `01M6EK36765C1GGWWE4WVK9QMY` :
  - onglets EDB=edb, Feuil1=complement, CONTACTS=relations, PARTENAIRES=partenaires ;
  - 627 lignes lues, 87 fusionnées dans le fichier ;
  - 519 nouveaux contacts : 515 EDB, 2 relations lointaines, 2 partenaires ;
  - 16 compléments ;
  - 479 accords e-mail notés (case cochée aux animations EDB) ;
  - 5 doublons probables laissés de côté : même nom qu'un contact du téléphone, mais un autre numéro. Anne complète ces 5 fiches à la main si besoin.
- Non importés : PIGE et BAL Coudrée (fiche légale) ; PAP et PAP 2026, des portes frappées sans téléphone, dont la seule coordonnée est l'adresse, que la règle 1 de la fiche légale exclut ; les colonnes « ADRESSE ».
- Les fichiers sources (copies du projet, du conteneur et de la conversation) ont été supprimés le 2026-11-02 (règle 7 de la fiche légale). Les notes `/mnt/project-files/.notes/inputs.md` le disent.
- Seuls des nombres ont été affichés pendant l'import (AD-26). Les 5 doublons ont été écrits dans un fichier local, puis supprimé.

## Ce qui est vérifié
- L'aperçu, puis l'import avec l'empreinte de l'aperçu : 0 contact non écrit, 0 rejet inattendu.
- Le contrôle de LIEN_SECRET par un essai d'opposition n'a pas été fait (économie de crédits, décision JB du 2026-11-02). La présence du secret sur l'espace avait été vérifiée par l'API Cloudflare.

## Ce qui reste
- Anne trie les « proches » du téléphone (tout le téléphone est pré-rangé ainsi, FR-9) et vérifie les contacts.
- Anne ajoute la ligne du carnet à son registre des traitements (règle 8 de la fiche légale).
- Avec les réglages par défaut des catégories, les proches et les relations lointaines ne reçoivent aucune campagne, même avec un accord. Point à valider par JB.
- La rétrospective de l'epic 18 n'a pas été faite (décision JB « Finir économe » du 2026-11-02).
