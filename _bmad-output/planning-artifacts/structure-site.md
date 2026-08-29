# Structure du site — brief de maquette

**Statut : input de l'étape ③ (maquette).** Ce document dit *quelles pages, quelles sections, dans quel ordre, avec quel contenu et quel appel à l'action*. Il ne dit pas à quoi ça ressemble — ça, c'est le design system (`Website/design-system/`, projet claude.ai/design « Anne VIAL-TISSOT — Design System »).

**Amont :** [SPEC.md](../specs/spec-anne-website/SPEC.md) v3 · [quiz-conception-notion.md](../specs/spec-anne-website/quiz-conception-notion.md) · [quiz-contenu.md](../specs/spec-anne-website/quiz-contenu.md)

---

## Direction

**Le visuel porte le site. Le texte le complète.** La matière première, ce sont les photos et les vidéos des ventes réelles d'Anne. Un visiteur doit comprendre en trois secondes, sans lire, qu'il a affaire à quelqu'un de sérieux qui a vendu de vrais biens. La crédibilité passe par ce qu'on montre, pas par ce qu'on affirme.

**Ce qu'on ne fait pas — explicitement.** La landing du ScoreApp actuel n'est pas un modèle. On n'en reprend **que le principe du bouton** qui lance le diagnostic. Concrètement, on écarte :

| Anti-pattern hérité du ScoreApp | Ce qu'on fait à la place |
|---|---|
| Tunnel de copywriting empilant accroche, agitation du problème, preuve, urgence | Des blocs courts, aérés, chacun portant une seule idée |
| Statistiques chocs invérifiables en ouverture (« 9 vendeurs sur 10 abandonnent ») | Les propres résultats d'Anne, montrés |
| Longue section « Qui suis-je » narrative en pleine page | Un portrait, trois lignes de parcours, un lien |
| Emojis, drapeaux, coches vertes comme éléments de mise en page | La typographie et la palette de la charte |
| Le diagnostic vendu comme un produit, avec sa propre page de vente | Le diagnostic = une invitation courte et un bouton |

**Ce n'est pas un site sans texte.** L'écart avec le ScoreApp porte sur le *placement* et la *densité*, pas sur la présence de copie persuasive. Le site doit déclencher des demandes : à certains endroits, il faut convaincre, et convaincre demande des mots. La règle est qu'un bloc de texte doit gagner sa place en produisant une action, jamais en remplissant une page.

**Où le texte travaille vraiment :**

| Emplacement | Rôle du texte | Volume |
|---|---|---|
| Accueil §1.5 — le diagnostic | Déclencher le clic | 3 lignes, tendues |
| Diagnostic — landing, haut de page | Donner une raison de commencer | Titre + 3 livrables |
| Diagnostic — landing, bas de page | Crédibiliser le trafic froid | 3 blocs courts |
| Fiche story — le récit d'Anne | **Prouver la méthode par le concret** | 10-15 lignes, première personne |
| Page Anne | Installer la confiance | Développé, c'est sa page |
| Page Méthode | Expliquer le Système 360™ | Développé, c'est son objet |
| Résultats — insights et impacts | Donner envie d'agir | Les 9 blocs rédigés |
| Accueil §1.1, §1.3 | Laisser l'image parler | Une phrase, pas plus |

Le corpus rédigé retrouvé dans Notion (headlines, bénéfices, section autorité, description du Système 360™) est une **réserve où puiser**. Il ne disparaît pas : il **change d'emplacement**. La section « Qui suis-je ? » — parcours Danone/Bel, le choc de l'immobilier, la naissance du Système 360™, les quatre langues, la promesse en trois points — est du bon contenu, écrit à la première personne, qui installe exactement la crédibilité recherchée. Elle devient la **matière première de la page Anne** (§4), avec un extrait resserré sur la page Méthode et deux lignes sur la landing Diagnostic. Ce qu'on refuse, c'est de l'empiler *en pleine homepage* au milieu du parcours de conversion. On y prend les phrases et le contenu, pas la structure du tunnel.

**Trois secondes, trois questions.** Chaque section de la homepage doit répondre à l'une d'elles : *À qui j'ai affaire ? Qu'est-ce qu'elle a déjà fait ? Qu'est-ce que je fais maintenant ?*

### Deux portes d'entrée, deux publics

Le site a **deux points d'atterrissage de premier niveau**, et ils ne s'adressent pas au même visiteur.

| | **Accueil** | **Diagnostic** |
|---|---|---|
| D'où il vient | Bouche-à-oreille, recommandation, recherche du nom d'Anne | Publicité sociale, campagne email, lien partagé |
| Ce qu'il cherche | Vérifier qu'Anne est sérieuse | Une raison de s'arrêter — il ne connaît pas Anne |
| Ce qu'on lui donne | La preuve sociale, d'abord | Le diagnostic, immédiatement, plus le minimum de crédibilité |
| Sa question | « Est-ce que je peux lui confier ma vente ? » | « Pourquoi je donnerais 3 minutes ? » |

Conséquence directe : **la page Diagnostic est une landing autonome**, pas une sous-page. Elle doit fonctionner pour quelqu'un qui n'a jamais vu la homepage et n'y ira peut-être jamais. Son URL est propre, partageable, et supporte les paramètres de campagne.

---

## Inventaire des pages

| # | Page | Rôle | Capacités |
|---|---|---|---|
| 1 | **Accueil** | Installer la crédibilité, orienter vers les deux parcours | CAP-1, 2, 3, 5, 6 |
| 2 | **Ventes** (index + fiche) | La preuve détaillée, une story par bien vendu | CAP-3 |
| 3 | **La méthode** | Le Système 360™ développé | — |
| 4 | **Anne** | Le parcours, les langues, la posture | CAP-2 |
| 5 | **Diagnostic** (landing) | 2ᵉ porte d'entrée du site — destination des campagnes | CAP-5 |
| 6 | **Diagnostic** (parcours) | Les 17 écrans de questions | CAP-4 |
| 7 | **Résultats** | Score, feedbacks, orientation | CAP-4, 7, 8, 9 |
| 8 | **Contact / Rendez-vous** | Le chemin direct | CAP-6, CAP-9 |
| 9 | **Guide** | Téléchargement hors diagnostic | CAP-8 |
| 10 | **Légal** | Mentions, confidentialité, cookies | Constraint RGPD |

Pages 1 à 5 et 8 à 10 : traduites (CAP-10). Pages 6 et 7 : traduites, c'est le parcours de conversion.

---

## 1. Accueil

Huit sections. L'ordre est délibéré : **la preuve arrive avant l'argumentaire**.

### 1.1 — Ouverture
**Rôle :** montrer, immédiatement.
**Contenu :** une séquence vidéo drone d'un bien réellement vendu, plein cadre, en boucle, sans son, sans texte par-dessus sauf le strict minimum. Le nom « Anne VIAL-TISSOT » et une ligne de positionnement (une phrase, pas un slogan à rallonge). Le lac et la montagne doivent être lisibles — c'est le territoire.
**CTA :** un seul, discret, vers le diagnostic. Le second (contact) vit dans la navigation.
**Actif requis :** 1 vidéo drone, format paysage, 10-20 s exploitables en boucle.
⚠️ La vidéo ne doit jamais bloquer l'affichage : image fixe d'abord, vidéo chargée ensuite.

### 1.2 — La preuve, tout de suite
**Rôle :** répondre à « pourquoi je vous ferais confiance » avant toute argumentation.
**Contenu :** la note Immodvisor, le nombre d'avis, deux ou trois extraits courts attribués (prénom + contexte), et un lien vers la fiche source vérifiable.
**Pourquoi ici :** c'est le contre-feu direct à l'attaque des agences traditionnelles sur la légitimité des mandataires. Placé en bas de page, il ne sert à rien.

### 1.3 — Ventes récentes
**Rôle :** le cœur visuel du site, et le remplacement de la vitrine de biens.
**Contenu :** trois stories en grand format. Chaque carte : photographie du bien (grande), commune, une phrase extraite du récit d'Anne. Pas de prix, pas de surface, pas de caractéristiques — ce n'est pas une annonce.
**CTA :** « Voir cette vente » → fiche story. Et un lien vers l'index complet.
**Actif requis :** 3 biens vendus minimum, 1 photo maîtresse chacun.

### 1.4 — Le Système 360™, en un coup d'œil
**Rôle :** nommer la méthode sans la dérouler.
**Contenu :** les trois axes (Vendeur 360° / Marché 360° / Partenaires 360°) en trois blocs courts, appuyés visuellement. Une phrase chacun. La promesse en trois points : pas de mauvaise surprise, pas de dossier qui traîne, des ventes qui vont au bout.
**CTA :** « La méthode en détail » → page Méthode.
⚠️ La description Notion fait plusieurs centaines de mots. Ici : trois phrases. Le reste vit sur la page dédiée.

### 1.5 — Le diagnostic
**Rôle :** l'entrée du premier parcours de conversion. **C'est ici que se joue la consigne : un bouton, pas une page de vente.**
**Contenu :** une phrase sur ce que le diagnostic donne, une indication de durée (3 minutes), le bouton. Trois lignes maximum au total.
**CTA :** « Démarrez votre diagnostic » → page Diagnostic.

### 1.6 — Anne
**Rôle :** la personne derrière la méthode.
**Contenu :** un portrait professionnel. Trois lignes : le parcours (finance d'entreprise, Danone Évian, Bel au Brésil), ce qui l'a amenée à l'immobilier, sa façon de travailler. Les quatre langues de travail, sobrement — c'est un argument fort sur le bassin lémanique et c'est aussi la justification visible du multilingue du site.
**CTA :** « En savoir plus » → page Anne.
**Actif requis :** 1 portrait, format vertical ou carré, en situation de préférence.

### 1.7 — Parler à Anne
**Rôle :** le second parcours de conversion, pour qui n'a pas besoin du diagnostic.
**Contenu :** une invitation courte, le choix entre réserver un créneau et laisser un message.
**CTA :** « Réserver un créneau » (primaire) · « Écrire à Anne » (secondaire).

### 1.8 — Pied de page
Navigation, mentions légales, politique de confidentialité, sélecteur de langue, mentions eXp France (co-branding selon les règles de la charte), réseaux sociaux.

---

## 2. Ventes

### Index
Grille de toutes les stories. Une carte = photo + commune + une phrase. Pas de filtre tant qu'il y a moins d'une dizaine de biens.

### Fiche story
1. **Photo maîtresse** plein cadre.
2. **Le contexte** — commune, type de bien, et si Anne l'accepte, le délai de vente. Factuel, court.
3. **Le récit d'Anne** — à la première personne. Ce qui bloquait, ce qui a été fait, comment ça s'est terminé. C'est le contenu qui prouve la méthode sans la réciter.
4. **Le témoignage de l'acheteur** — cité, attribué (prénom, éventuellement photo).
5. **Galerie secondaire** — 3 à 6 photos du bien.
6. **CTA** — vers le diagnostic ou le contact.

**Actif requis par story :** 4 à 7 photos, le récit écrit par Anne, le témoignage de l'acheteur recueilli.

---

## 3. La méthode

Le Système 360™ développé : les trois axes détaillés, ce que chacun couvre concrètement, le réseau de partenaires (courtier bancaire, courtier travaux, géomètre, notaire) et le rôle de chef d'orchestre. Le contenu rédigé existe dans Notion — à reprendre en le **resserrant**, pas en le collant.

Se termine sur le diagnostic ou le contact.

---

## 4. Anne

**C'est ici que la section « Qui suis-je ? » de Notion est recyclée**, à peu près telle quelle — elle est bien écrite, à la première personne, et elle installe la crédibilité sans esbroufe.

1. **Portrait** en ouverture.
2. **Le parcours** — dix ans d'opérations internationales, Danone (site d'Évian) et Bel au Brésil, la finance d'entreprise, « des projets où chaque détail compte ».
3. **Le choc de l'immobilier** — les ventes qui s'effondrent après le compromis : financement refusé au dernier moment, formalités découvertes trop tard, acquéreurs mal accompagnés, coordination inexistante. C'est le passage le plus fort du corpus : il explique *pourquoi* la méthode existe.
4. **La naissance du Système 360™** — appliquer ce qu'elle sait faire : un réseau d'experts, chaque vente traitée comme un projet d'entreprise. Le réseau nommé (courtier bancaire, courtier travaux, géomètre, notaire).
5. **La promesse en trois points** — pas de mauvaise surprise, pas de dossier qui traîne, des ventes qui vont au bout.
6. **Les quatre langues** et l'ancrage Chablais / Léman.
7. **CTA** — diagnostic ou prise de rendez-vous.

Une ou deux photos supplémentaires en situation ponctuent le texte.

---

## 5. Diagnostic — landing autonome

**C'est une porte d'entrée du site, pas une sous-page.** Destination des campagnes sociales et email : le visiteur qui arrive ici ne connaît pas Anne et n'a aucune raison a priori de lui accorder trois minutes.

Le problème à résoudre : lui donner assez de crédibilité pour qu'il démarre, **sans reconstruire le tunnel de vente du ScoreApp**. La réponse est un empilement à deux niveaux — court en haut, preuve en dessous.

### Au-dessus de la ligne de flottaison — l'offre
Le titre, une phrase sur ce qu'on obtient, les trois livrables en une ligne chacun (score de maturité sur 100, diagnostic personnalisé, recommandations concrètes), la durée, la gratuité, **le bouton**. Une image sobre.

Le visiteur qui vient de la homepage a déjà décidé : il clique ici et ne descend jamais. Rien ne doit se mettre entre lui et le bouton.

### En dessous — la crédibilité, compressée
Pour le trafic froid qui a besoin d'une raison. **Trois blocs courts, pas un de plus :**

1. **Qui pose ces questions** — portrait d'Anne, deux lignes (finance d'entreprise, consultante immobilière sur le Chablais), les quatre langues.
2. **La preuve** — note Immodvisor et un extrait d'avis, plus une story de vente en vignette (photo + commune + une phrase).
3. **Le bouton, à nouveau** — celui qui a scrollé doit pouvoir démarrer sans remonter.

**Ce qu'on n'ajoute pas**, même sous la pression du trafic froid : statistiques invérifiables, agitation du problème, comparatif avec les agences, section « pourquoi ce diagnostic ». Si trois blocs de preuve ne suffisent pas à convaincre, c'est le ciblage de la campagne qu'il faut corriger, pas la page.

### Contraintes techniques
- URL propre et partageable, stable dans le temps (elle vivra dans des emails et des publications).
- Paramètres de campagne (UTM) acceptés et transmis jusqu'au lead capté, pour savoir quelle source produit quels prospects.
- Aperçu correct au partage (titre, description, image) — cette URL circulera sur les réseaux.
- Traduite comme le reste : une campagne peut cibler une audience anglophone ou hispanophone du Léman.
- Le lien vers la homepage reste accessible dans la navigation : le visiteur froid qui veut vérifier plus doit pouvoir aller voir.

---

## 6. Diagnostic — le parcours

**17 écrans, un par question, linéaires.** Aucun branchement conditionnel : tout le monde voit la même séquence (vérifié sur le déployé, 3 passages).

Sur chaque écran :
- La question, grande, lisible.
- Les options en boutons pleine largeur, cliquables du premier coup.
- Une barre de progression.
- Un retour arrière à partir du 2ᵉ écran.
- **La catégorie en cours** (Préparation à la Vente · Visibilité & Attractivité · Efficacité Commerciale) — *amélioration par rapport au déployé*, qui ne les révèle qu'à la fin. Les annoncer donne du sens au parcours et prépare la lecture des résultats.

Deux détails à corriger par rapport au déployé :
- **Q13 doit être réellement multi-sélection** (le déployé l'annonce « sélection multiple » mais se comporte en choix unique — incohérence à ne pas reproduire).
- **Q15 doit être un vrai champ multiligne** (limite 1000 caractères), avec un bouton « Passer » visible.

**Ordre :** Q1 → Q9 → Q10a (visites) → Q10b (offres) → Q11a (durée) → Q11b (accompagnement) → Q12 → Q13 → Q14 → Q15.

Le contenu exact de chaque écran est dans `quiz-conception-notion.md`.

---

## 7. Résultats

### 7.1 — Le gate de capture
Une modale, ou mieux, un écran plein. Le score global en teaser, puis les quatre champs (prénom, nom, email, téléphone avec sélecteur de pays) et l'opt-in.

Quatre corrections obligatoires par rapport au déployé :
- **Tout en français** (le déployé affiche « You scored X% overall », « Show My Results » — non traduit).
- **Mentions légales présentes** : lien vers la politique de confidentialité, finalité de la collecte. Le déployé n'en a aucune.
- **Opt-in newsletter distinct** du consentement à être recontacté.
- **Les résultats ne doivent pas exister côté client avant soumission.** Le déployé se contente d'un flou CSS : le contenu est dans la page avant même que le formulaire soit rempli. Le gate doit être serveur, adossé à un jeton de soumission.

### 7.2 — Le résultat
1. **Score global** sur 100, avec le profil (🔴 Stratégie à risque / 🟡 Bases solides / 🟢 Bien préparé) et son diagnostic.
2. **Trois scores par catégorie**, en brut et en pourcentage (les maximums diffèrent : 40/40/20, le pourcentage seul les rend comparables).
3. **Pour chaque catégorie** : l'insight de sa bande, puis l'encart « Impact chiffré ». Neuf blocs possibles, tous rédigés dans le companion.
4. **L'orientation**, selon la sortie :
   - **Sortie A** (score 71-100 et Q14 orientée accompagnement) : « Réservez un rendez-vous stratégique de 30 minutes » en action principale, contact direct en second.
   - **Sortie B** (tous les autres, et systématiquement si Q12 = « minimiser les frais d'agence ») : téléchargement du plan d'action personnalisé, puis proposition de la newsletter.
5. **Le guide** en téléchargement, dans les deux cas.

⚠️ Le déployé finit sur « Want to know more? Take a look at our latest showreel » et deux boutons inertes. À ne pas reproduire : chaque bouton de la page de résultats mène quelque part.

---

## 8. Contact / Rendez-vous

Deux chemins sur une page : le calendrier de créneaux réels (affichés dans le fuseau du visiteur), et un formulaire court. Le formulaire ne demande que ce qui sert : nom, email, téléphone, message.

---

## 9. Guide

Page d'atterrissage du lead magnet, accessible hors diagnostic. Couverture du guide, ce qu'il contient en cinq lignes, le formulaire de capture. Mêmes règles RGPD que le gate.

---

## États à dessiner

Une maquette qui ne montre que le cas nominal ment sur le travail restant.

| État | Où | Traitement |
|---|---|---|
| Aucune story publiée | Accueil §1.3, index Ventes | La section disparaît entièrement — jamais un bloc vide |
| Avis Immodvisor indisponibles | Accueil §1.2 | Repli sur les témoignages seuls + lien sortant |
| Échec de soumission du gate | Résultats | Message clair, réponses conservées, renvoi possible |
| Créneau pris entre affichage et confirmation | Contact, Résultats | Refus explicite et proposition d'un autre créneau |
| Langue non traduite | Toutes | Repli sur le français, jamais d'écran mi-traduit |
| Quiz abandonné puis repris | Parcours | Reprise à la question atteinte (décision à confirmer) |
| Vidéo non chargée | Accueil §1.1 | Image fixe, mise en page inchangée |

---

## Actifs à demander à Anne

À rapprocher du dossier photos/vidéos qu'elle transmet.

**Vidéo**
- 1 séquence drone exploitable en boucle (10-20 s), format paysage, sans incrustation — pour l'ouverture.
- Les autres séquences drone en réserve pour les fiches stories.

**Photo**
- 1 photo maîtresse par bien vendu, format paysage, haute définition.
- 4 à 6 photos secondaires par bien.
- 1 portrait d'Anne, professionnel, format vertical ou carré.
- 1 à 2 photos d'Anne en situation (visite, échange client) pour la page Anne.

**Texte, à écrire ou recueillir**
- Le récit de chaque vente, à la première personne (10-15 lignes).
- Le témoignage de l'acheteur pour chaque story, avec accord de publication.
- 3 témoignages d'acheteurs non convertis (CAP-2).

**À vérifier**
- Droits de diffusion des photos de biens (accord des vendeurs).
- Accord nominatif des acheteurs cités.
- Accès aux avis Immodvisor : extraction possible ou lien seul ?

---

## Non tranché — n'empêche pas de maquetter

- Le nom de la méthode : « Système 360™ » ou « Méthode 360° ». La maquette utilise **Système 360™** par défaut ; un changement est un remplacement de chaîne, pas une refonte.
- Le positionnement (Système 360 vs « Expert Frontaliers »).
- Les langues effectivement livrées en v1 — la maquette prévoit le sélecteur, quel que soit le nombre.
- Le barème de Q10 (visites × offres), sans effet sur la maquette.
- La validation du concept de stories par Anne elle-même.
