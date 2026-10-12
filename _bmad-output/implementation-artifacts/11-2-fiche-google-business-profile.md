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

## Ce qui est fait

- 2026-10-12 : process et liste écrits dans le fil « Fiche Google Business », story ouverte.

## Ce qui reste

- Anne crée et valide la fiche, ajoute JB comme gestionnaire.
- Claude ajoute la fiche à la carte des comptes du RUNBOOK (sans mot de passe) et le lien de la fiche dans les données structurées du site si utile.
- Vérifier que nom, téléphone et site sont identiques à ceux du site.
