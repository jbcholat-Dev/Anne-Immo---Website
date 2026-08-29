# Entrée d'architecture — vague 1

**À lire en premier par `bmad-architecture`.** Ce fichier porte le cadrage et les questions que JB veut voir traitées. Il ne remplace pas le contrat : celui-ci est [SPEC.md](../specs/spec-anne-website/SPEC.md) v3.

**Date :** 2026-08-29 · **Demandeur :** JB (mari d'Anne, exécution interne) · **Première expérience de construction d'un site web.**

---

## Découpage en deux vagues

La méthode d'exécution posait « architecture après maquette validée ». Ce séquencement a été rediscuté le 2026-08-29 et **assoupli** : aucune des questions ci-dessous ne dépend de la maquette. Ce que la maquette contraint, c'est le choix de l'outil de rendu — si elle exige des mises en page très sur-mesure, elle écarte certains outils no-code. C'est la seule dépendance réelle.

**Vague 1 — maintenant, objet de ce brief.** Propriété et comptes · nom de domaine · hébergement et stack · destination et stockage des leads · connexion à Notion · fondations SEO · multilingue · coût récurrent · surveillance et reprise après incident.

**Vague 2 — après validation de la maquette.** Modèle de contenu (quels objets Anne manipule : story de vente, témoignage, avis) · composants · **go/no-go interne vs prestataire**, qui a besoin de la maquette pour être honnête.

---

## Les questions de JB, dans ses termes

Reformulées pour faire apparaître la décision réelle derrière chacune.

### 1. « Modifiable » — par qui ?
**La question la plus structurante, et elle précède le choix de la stack.** Anne qui change un texte et remplace une photo seule, sans JB, ce n'est pas le même site qu'un dépôt que JB modifie. Le premier impose une surface d'administration ; le second est plus simple et moins cher mais met JB dans la boucle à chaque virgule.

Signal : Anne ajoutera des stories de ventes au fil de l'eau, et le contrat fait de la production de contenu une dépendance du chemin critique. **À trancher explicitement, pas par défaut.**

### 2. « Pérenne » — le risque, c'est la dépendance à JB
Le site est construit par le conjoint. La question n'est pas la longévité technique mais : que se passe-t-il si JB est indisponible trois semaines et que le formulaire de capture tombe ?

À traiter par des décisions concrètes — tout reconstructible depuis le dépôt, comptes au nom d'Anne, procédure écrite. C'est le point que les sites « faits par un proche » ratent systématiquement.

### 3. Nom de domaine
Anne est prête à investir. Deux décisions durables : **lequel** (son nom ? un nom d'agence, vu son ambition d'en fonder une ?) et **à quel nom il est enregistré** — au sien, pas à celui de JB. Idem pour tous les comptes.

### 4. SEO
Deux sujets distincts. Le **référencement local** (Chablais, Léman) et la fiche Google Business, qui pèse souvent plus que le site lui-même pour un métier de proximité. Le **référencement de contenu**, où les deux guides Gamma existants sont une matière réelle.

⚠️ Le multilingue et le SEO interagissent : une implémentation bâclée fait perdre les deux.

### 5. Où vont les e-mails captés ?
Le contrat pose déjà une contrainte : un lead doit être **stocké**, pas seulement notifié par e-mail (« une notification e-mail ne constitue pas un stockage »). Restent trois destinations non exclusives — un stockage propre au site, Notion, Modelo. **Laquelle fait référence ?**

### 6. Connexion à Notion
Techniquement oui : Notion a une API, JB l'utilise déjà. Le vrai arbitrage est d'usage : Notion est-il l'endroit où Anne travaille ses prospects au quotidien, ou un miroir pour JB ? Si c'est son outil de travail réel, ça devient une pièce d'architecture. Sinon, c'est un export.

### 7. Coût
Ordre de grandeur attendu : domaine négligeable, hébergement de gratuit à quelques dizaines d'euros par mois, et le coût réel dans les briques annexes — outil de rendez-vous, envoi d'e-mails, éventuelle surface d'administration. Très loin des 7-10 k€ des devis, mais avec un récurrent non nul. **Le chiffrage sérieux fait partie de la livraison.**

### 8. Bug et maintenance
La question à trancher n'est pas « comment on répare » mais **« comment on sait »**. Un formulaire cassé silencieusement pendant deux semaines coûte plus cher que n'importe quel bug visible. Se traite en amont par de la surveillance simple.

---

## Ce que l'architecture doit respecter

Contraintes déjà actées, non rediscutables ici (détail dans SPEC.md v3) :

- **Diagnostic recréé nativement**, sans dépendance à la plateforme ScoreApp. Contenu possédé et versionné (`quiz-conception-notion.md`). Parcours linéaire, 17 écrans, 10 questions scorées sur 100 points.
- **Multilingue par conception dès la v1** — rien en dur, contenus externalisés, URLs par langue, français en repli. Le nombre de langues traduites reste ouvert ; l'architecture, non.
- **RGPD** — base légale, mentions légales, politique de confidentialité, opt-in distinct, désabonnement, localisation des données documentée.
- **Anti-abus** sur le gate de capture, sans friction visible.
- **Gate serveur** — les résultats ne doivent pas exister côté client avant soumission (le ScoreApp actuel se contente d'un flou CSS : le contenu est dans la page avant que le formulaire soit rempli).
- **Performance, mobile-first, SEO local** — homepage utile en moins de 3 s sur mobile malgré des visuels lourds.
- **CRM Modelo** imposé par eXp : la solution doit pouvoir l'alimenter à terme (export ou intégration) sans redéveloppement du parcours de capture. Faisabilité **jamais évaluée** — aucune intégration connue à ce jour.
- **Réalisation interne poussée au maximum** avant tout arbitrage prestataire.

---

## Questions auxquelles JB seul peut répondre

À poser en début de session ; elles conditionnent presque tout le reste.

1. **Quel degré d'autonomie pour Anne ?** Elle publie seule une story de vente, ou elle passe par JB ?
2. **Quel budget récurrent mensuel est acceptable ?** Un ordre de grandeur suffit.
3. **Notion est-il l'outil de travail d'Anne, ou celui de JB ?**
4. **Le nom de domaine : son nom, ou un nom d'agence ?**
5. **Quel temps JB peut-il consacrer à la maintenance**, par mois, une fois le site en ligne ?

---

## Documents à charger

| Document | Ce qu'il apporte |
|---|---|
| [SPEC.md](../specs/spec-anne-website/SPEC.md) v3 | Le contrat : 10 capacités, contraintes, non-goals, questions ouvertes |
| [quiz-conception-notion.md](../specs/spec-anne-website/quiz-conception-notion.md) | Contenu du diagnostic : questions, barème, seuils, 9 feedbacks |
| [quiz-contenu.md](../specs/spec-anne-website/quiz-contenu.md) | Capture du déployé : parcours linéaire, 17 écrans, gate |
| [structure-site.md](structure-site.md) v2 | Les 10 pages, sections, états limites, actifs |
| `Anne Immo/CLAUDE.md` | Contexte projet, décisions actées, journal |

---

## Questions ouvertes héritées du contrat

À trancher pendant l'architecture, pas avant :

- **Interne vs prestataire (7-10 k€)** — arbitrage définitif en vague 2.
- **Langues livrées en v1** — FR seul, FR+EN, ou les quatre.
- **Barème de la question sur la performance commerciale** — le déployé scinde visites et offres (12 combinaisons) là où la conception documente 5 options combinées. Le croisement n'existe nulle part.
- **Remontée des leads dans Modelo** — priorité basse, une solution simple suffit probablement en v1, à condition que la contrainte de stockage côté site soit respectée.
