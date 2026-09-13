# Maquette lot 3 — journal des décisions

> **C'est ici que vit la trace.** Chaque écart entre ce que les briefs demandaient et ce qu'Anne et JB décident en regardant la maquette est consigné ici d'abord, daté, avec son statut. Ensuite seulement, on répercute dans les documents de référence (colonne « À propager »). Une décision non consignée ici n'existe pas.
>
> Statuts : ✅ tranché · 🔄 ouvert, à trancher en séance · ❌ écarté.
> Prévu par `brief-maquette-complete.md` § 3 et § 9. Critère de sortie de la vague 2 : plus aucun 🔄 sur une page.

## Séance du 2026-09-13 (Anne + JB, sur la maquette lot 3 générée)

| # | Décision | Statut | À propager |
|---|---|---|---|
| D-1 | **Hero de l'accueil : les plans en parallaxe sont abandonnés.** À la place, une vidéo drone tournée sur les biens vendus, plein cadre, en fond du titre. | ✅ | `brief-scrollcraft-fora.md` (spec des plans § 2 → périmée pour le hero) · `brief-maquette-complete.md` § 1, § 3 (artboards « Hero — plans » supprimés) · `CLAUDE.md` journal 2026-09-04 · au build : AD-15 (budget perf → image d'ouverture, chargement différé, repli image sur mobile / connexion lente, jamais de son). **Rien à changer dans SPEC** : le SPEC parle de « visuels pro en homepage », pas de la mécanique. |
| D-2 | **Navigation : entrée « À propos »** tout à gauche, menu au survol avec trois sous-entrées : « Qui suis-je ? », « Ma méthode », « Cible ». | 🔄 | `structure-site.md` § nav. — **« Cible » incertaine** (profils de clients : primo-accédants, investisseurs, cadres, seniors). Question pour la séance : les profils ne sont-ils pas déjà portés par Vendre / Acheter (D-4, D-5) ? Si oui, « Cible » est redondante. |
| D-3 | **« Réalisation »** inchangé : mène aux stories de biens vendus avec photos. | ✅ | — |
| D-4 | **Nouvelle entrée « Vendre »** : une page qui propose deux portes — entrer dans le diagnostic, ou **faire estimer son bien**. L'estimation n'est pas faite sur le site : un formulaire capture les coordonnées, Anne rappelle et visite. | ✅ concept | `structure-site.md` (page 11) · **SPEC : nouvelle capacité « Demande d'estimation »** (source de lead distincte du contact) · architecture : AD-6 contrat de champs par source → ajouter la source `estimation` (téléphone obligatoire, adresse ou commune du bien, type de bien) · la landing Diagnostic reste une porte d'entrée autonome (décision 2026-08-29), Vendre ne la remplace pas. |
| D-5 | **Nouvelle entrée « Acheter »** : le parcours acheteur (primo-accédants, investisseurs), le service de recherche accompagnée (Anne repère, visite en premier, présélectionne), CTA « Parler de votre projet » → prise de contact, rappel. | ✅ concept | `structure-site.md` (page 12) · SPEC : parcours acheteur = nouvelle porte vers CAP-6 contact (pas de nouvelle source de lead si le formulaire est celui du contact, avec un champ « projet : vente / achat ») · **contenu à écrire par Anne** : `contenu-anne/pages/acheter/fr.md` (gabarit `page.md`). |
| D-6 | **Liens réseaux sociaux dans la barre de navigation**, à gauche du logo (demande d'Anne). JB réservé : risque de surcharge, préférence pour les laisser en pied de page. | 🔄 | À montrer en deux variantes sur l'artboard « Décisions à trancher » ; trancher en séance. |
| D-7 | Bouton « Diagnostic » (pilule terracotta) et bascule FR / EN dans la nav : maintenus. | ✅ | — |
| D-8 | **Section « Ils l'ont rencontrée » (accueil § 1.5) supprimée.** Les témoignages d'acheteurs non convertis n'ont pas pu être collectés en nombre suffisant ; on ne construit pas une section sur un contenu qu'on n'a pas. | ✅ | `structure-site.md` § 1.5 (supprimer, renuméroter 1.6-1.8) · **SPEC CAP-2** : retirer l'exigence « 3 témoignages d'acheteurs non-clients » (critère de succès et contrainte « production de contenu ») · spine AD-1 : objet `TemoignageNonClient` retiré de l'inventaire · `contenu-anne/_gabarits/temoignage-non-client.md` retiré · brief lot 3 § 3-4 : courbe de sentiment de l'accueil recalée (toujours 8 actes : « Ils ont travaillé avec Anne » prend la place, D-9) · actif A-06 abandonné (A-07, le témoignage par story, est conservé et élargi par D-9). |
| D-9 | **La preuve sociale se réarchitecture autour de deux sources réelles : les biens vendus et ce qu'en disent les gens qui ont travaillé avec Anne — vendeurs *et* acheteurs.** Précision JB : quand une vente va au bout, l'acheteur laisse souvent un avis (Immodvisor accueille les avis d'acheteurs), et Anne continue de l'accompagner après l'achat. Ce qui a manqué, ce sont uniquement les visiteurs non convertis (D-8). Proposition : (a) bande § 1.2 conservée ; (b) chaque story porte **jusqu'à deux témoignages, vendeur et acheteur** — l'idéal est les deux, un seul suffit pour publier ; (c) une section **« Ils ont travaillé avec Anne »** remplace § 1.5 : trois avis Immodvisor entiers, mêlant vendeurs et acheteurs, reliés à la story correspondante quand elle existe (photo + avis), citation seule sinon. Règle : toute preuve du site est soit une vente réelle, soit un avis vérifiable — rien d'autre. | ✅ concept | `structure-site.md` § 1.3, § 1.5 (nouveau contenu), § 2 fiche story · SPEC CAP-2 (avis Immodvisor, vendeurs et acheteurs ; exigence « non-clients » retirée) et CAP-3 (témoignage vendeur et/ou acheteur, au moins un) · gabarit `story.md` (`temoignages:` liste, chacun avec `role: vendeur | acheteur`) · `_suivi-stories.md` (checklist « publiable » : au moins un témoignage). |
| D-10 | **Hero : la liste de communes en bas à droite (Thonon · Évian · Sciez · Anthy · Bernex · Allinges) est retirée.** Elle correspond à des ventes réelles mais borne le territoire : Anne travaille sur tout le Chablais et le bassin lémanique, pas sur six communes. Le secteur reste dit une fois, dans le sous-titre du hero. | ✅ | `brief-maquette-complete.md` § 3-4 (hero) · `structure-site.md` § 1.1. |
| D-11 | **« À propos » est une seule page longue** : « Qui suis-je ? », « Ma méthode » (et « Cible » si retenue) sont des sections de cette page, les sous-entrées du menu en sont les ancres. Conséquence : les pages Méthode (§ 3) et Anne (§ 4) fusionnent. Le lien « La méthode en détail » de l'accueil (§ 1.4) mène à l'ancre Méthode de cette page. | ✅ | `structure-site.md` § 3 + § 4 → une seule § « À propos » avec ancres · § 1.4 (cible du lien) · inventaire des pages · SEO (AD-13) : une URL de moins, les ancres ne sont pas des pages indexables — acceptable, la méthode n'est pas une requête de recherche. |
| D-12 | **Vidéo d'Anne présentant sa méthode**, dans la section Méthode de la page À propos. Très probablement absente à la première publication : la maquette la prévoit (bloc « Actif attendu A-xx »), et la page doit être complète sans elle (le bloc n'apparaît pas tant que la vidéo n'existe pas — pas de trou, pas de placeholder en production). | ✅ | `structure-site.md` § À propos + table des actifs (nouvel actif vidéo méthode, facultatif) · brief lot 3 § 3 (artboard avec et sans vidéo) · contenu : champ `video_methode` facultatif sur la page (gabarit `page.md`) · **tâche Anne** : tourner la vidéo, après lancement. |

### Conséquence structurelle à acter

La nav passe de 4 entrées + bouton à **5 entrées (À propos ▾ · Réalisation · Vendre · Acheter · Contact) + FR/EN + bouton Diagnostic**. Le site passe de 10 pages à **11** : Méthode et Anne fusionnent en « À propos » (D-11), Vendre et Acheter s'ajoutent (D-4, D-5). « Cible » (D-2), si retenue, est une section d'À propos, pas une page. `structure-site.md` doit passer en v4 avant toute nouvelle génération de maquette — sinon Claude Design repart du brief à 10 pages.

### Points laissés ouverts pour la prochaine séance

1. « Cible » : page à part, ou absorbée par Vendre / Acheter ? (D-2)
2. Réseaux sociaux : nav ou pied de page ? (D-6)
3. Formulaire d'estimation : quels champs au minimum ? Proposition : prénom, nom, téléphone, e-mail, commune du bien, type de bien, consentement. (D-4)
4. Le formulaire « Parler de votre projet » de la page Acheter : le même que Contact, ou dédié ? (D-5)
5. Preuve sociale (D-9) : quels trois avis Immodvisor pour la section « Ils ont travaillé avec Anne » — idéalement deux vendeurs + un acheteur, et au moins un relié à une story rédigée.

## Pages — état de validation

| Page | Desktop | Mobile | Commentaire |
|---|---|---|---|
| 01 Accueil | 🔄 | 🔄 | Hero revu (D-1), nav à refaire (D-2 → D-7) |
| 02 Diagnostic (landing) | 🔄 | 🔄 | non revue en séance |
| 03 Diagnostic (questions) | 🔄 | 🔄 | non revue |
| 04 Résultats | 🔄 | 🔄 | non revue |
| 05 Réalisation / stories | 🔄 | 🔄 | non revue |
| 06 Story | 🔄 | 🔄 | non revue |
| 07 + 08 → À propos | 🔄 | 🔄 | Méthode et Anne fusionnent en une page à ancres (D-11) ; vidéo méthode prévue, facultative (D-12) ; « Cible » à trancher (D-2) |
| 09 Contact | 🔄 | 🔄 | non revue |
| 10 Guide | 🔄 | 🔄 | non revue |
| 11 Vendre | — | — | nouvelle page (D-4), à maquetter |
| 12 Acheter | — | — | nouvelle page (D-5), à maquetter |
