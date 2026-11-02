# Story 11.2 : Fiche Google Business Profile créée et cohérente avec le site

Epic 11, Visibilité. Ouverte le 2026-10-12 : JB demande le process de création de la fiche et la liste des informations à réunir. Critères d'acceptation : `planning-artifacts/epics.md`, story 11.2. Action A01 du tableau de bord.

## Objectif

Qu'Anne apparaisse dans Google et Google Maps quand on cherche son nom ou « agent immobilier » autour de Sciez et Thonon, et qu'elle puisse recevoir des avis Google, avec exactement les informations du site (AD-13).

## Règles Google qui s'appliquent (vérifiées le 2026-10-12)

Sources : [règles de représentation](https://support.google.com/business/answer/3038177?hl=fr), [méthodes de validation](https://support.google.com/business/answer/7107242?hl=fr), [validation par vidéo](https://support.google.com/business/answer/14271705?hl=fr).

- Anne se déplace chez ses clients et ne les reçoit pas chez elle : fiche « établissement de zone desservie », **adresse masquée**. L'adresse de Sciez est saisie pour la validation mais n'est jamais affichée.
- Zone desservie : au plus deux heures de trajet depuis l'établissement ; une seule fiche.
- Un professionnel en contact avec les clients a droit à sa propre fiche, à condition d'être joignable aux horaires indiqués. Pas de deuxième fiche par spécialité.
- Nom : le nom réel, sans mot-clé, ville, slogan ni téléphone. Un professionnel seul qui représente une marque suit le format « [marque] : [nom] ».
- Validation : Google choisit la méthode (téléphone ou SMS, e-mail, appel vidéo, vidéo enregistrée, courrier). Examen jusqu'à 5 jours ouvrés. Vidéo : une seule prise, au moins 30 s, filmée en direct depuis le téléphone, sans visage d'autres personnes ni information sensible ; elle montre le quartier (panneaux de rue), l'activité (outils, cartes de visite, panneau « À vendre ») et la gestion (un document pro au nom de la fiche, par exemple la carte collaborateur ou une facture).

## Décisions proposées (à valider par JB)

- Nom affiché : « eXp France - Anne VIAL-TISSOT ». Raison : format de marque prévu par Google, co-branding eXp respecté, identique à la fiche Immodvisor. Autre choix possible : « Anne VIAL-TISSOT », plus court, mais sans la marque eXp.
- Titulaire : compte Google d'Anne (celui de Cal.com), JB ajouté comme gestionnaire (AD-9).
- Catégorie principale : « Agent immobilier ». Pas de catégorie secondaire au départ.
- Validation rapide possible : la propriété Search Console de annevialtissot.fr est validée par JB (action J39). Si Anne est ajoutée comme propriétaire de cette propriété, Google peut valider la fiche instantanément (non garanti).
- Règles eXp sur les fiches Google : rien de public trouvé. Anne le demande à son support eXp avant de publier.

## Informations : ce que le dépôt a déjà

| Champ | Valeur | Source |
|---|---|---|
| Téléphone | 06 71 99 17 54 | `site/src/config/site.ts` |
| Site | https://annevialtissot.fr | |
| Adresse (masquée) | 812 chemin de la Tatte, 74140 Sciez | `contenu-anne/legal/identite.md` |
| Langues | français, anglais, espagnol, portugais | idem |
| Réseaux | Instagram, YouTube, LinkedIn | idem |
| Portrait | `contenu-anne/pages/a-propos/jyhell-2023-104.webp` | |
| Photos de biens vendus | 10 ventes dans `contenu-anne/stories/` | |
| Zone | « Chablais et bassin lémanique » : communes à lister | |

## Ce qui manque

- Liste des communes desservies (proposition dans le fil, à valider par Anne).
- Horaires d'ouverture.
- Date de début d'activité (immatriculation 2023-09-01 selon `site.ts`, à confirmer).
- Logo et photo de couverture (le logo de la charte est dans `design-system/`).
- Accord eXp éventuel.

## Décisions de JB du 2026-10-24

- Nom de la fiche : « Anne VIAL-TISSOT », sans eXp. Raison : Anne n'est pas liée à eXp pour toujours, la fiche doit lui survivre. La description garde la mention « réseau eXp France ».
- Compte titulaire : le compte Google professionnel d'Anne.
- Horaires : du lundi au samedi, 9 h à 19 h. Début d'activité : 2023.
- Logo : le symbole de la charte ; couverture : le logo empilé avec le nom, la vague et le descripteur. Fichiers prêts dans le dossier du projet `google-business/` (logo 1440 × 1440, couverture 2048 × 1152, rendus depuis `design-system/assets/`).
- Validation : adresse de Sciez (décision de JB du 2026-10-24, après avoir envisagé les bureaux de Thonon). Raison : c'est l'adresse du Kbis et des mentions légales, elle reçoit le courrier, et la vidéo peut se faire sur place avec le Kbis comme justificatif. Les bureaux de Thonon n'ont pas de boîte aux lettres. L'adresse reste masquée.
- Avis Immodvisor : Google interdit d'importer ou de recopier des avis d'un autre site ([règles des contenus Google Maps](https://support.google.com/contributionpolicy/answer/7400114?hl=fr)). On demande plutôt aux anciens clients de déposer aussi un avis Google.

## Ce qui est fait

- 2026-10-12 : process et liste écrits dans le fil « Fiche Google Business », story ouverte.
- 2026-10-24 : choix de JB notés, logo et couverture préparés.
- 2026-10-24 : fiche créée par JB et validée d'emblée par Google (coche « Vous gérez cette fiche d'établissement »), zones desservies saisies (en cours de validation par Google), réseaux ajoutés sauf Facebook (Google refuse l'adresse `profile.php?id=…` et aucun nom d'utilisateur Facebook n'a pu être choisi). Fiche ajoutée à la carte des comptes du RUNBOOK.
- 2026-10-26 : fiche complète (logo, couverture, horaires lun.-sam. 9 h-19 h, 16 communes, « France » retiré des zones, ce qui recentre la carte sur le Chablais). Doublon non validé « Anne Vial-Tissot Immobilier » supprimé par JB (Google n'admet qu'une fiche par personne). Propriété principale transférée à Anne par JB. Nom, téléphone et site identiques à ceux du site.
- Constat de JB : sur la recherche « Anne VIAL-TISSOT », annevialtissot.fr arrive après SeLoger, expluxury.fr et Leboncoin ; transmis au fil « [Site] Référencement Google ».

## Statut

Close le 2026-10-26 (vérification : captures de JB dans le fil, fiche gérée, zones et horaires conformes).

## Suites, hors de cette story

- Demande d'avis Google aux anciens clients : reportée par JB le 2026-10-26 (« on s'occupe de ça un peu plus tard »). Récupérer le lien « Demander des avis » ; Claude rédige le message. Action A01b du tableau de bord.
- Lien de la fiche dans les données structurées du site : à voir avec le fil « [Site] Référencement Google ».
- Facebook absent de la fiche (adresse `profile.php` refusée par Google).
