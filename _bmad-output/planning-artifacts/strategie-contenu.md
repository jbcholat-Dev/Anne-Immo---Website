# Stratégie de contenu — comment le contenu du site est écrit, rangé, édité et publié

**Version 1** (2026-09-09). Répond à la question de JB : « quelle est la stratégie la plus pertinente pour gérer le contenu, avec rapidement un outil ou une structure pour l'éditer facilement ». Cadre : AD-1 (contenu = objets typés hors du code), AD-2 (une langue complète ou absente), AD-9/AD-10 (tout au nom d'Anne, tout reconstructible depuis le dépôt).

## La décision en une phrase

**Le contenu vit dans Git, en Markdown avec un en-tête de champs (frontmatter), un dossier par objet, un fichier par langue. C'est le système de contenu — pas une étape provisoire.** Les outils d'édition (éditeur de texte, aperçu en ligne, interface d'administration) sont des *portes* sur ces fichiers, activées dans l'ordre où Anne en a besoin. Aucune porte ne change le format ni l'emplacement du contenu.

Pourquoi c'est la bonne stratégie ici :

| Ce qu'on veut | Ce que Git + Markdown donne |
|---|---|
| Pérenne, reconstructible sans JB (AD-10) | Le contenu est du texte dans le dépôt, lisible par n'importe qui, versionné, sauvegardé par nature |
| CMS-ready sans refonte (AD-1) | Astro lit ces fichiers directement (loader `glob`, dossier libre) ; un CMS git-based écrit exactement ce format |
| Multilingue strict (AD-2) | `fr.md` obligatoire, `en.md` optionnel dans le même dossier — une story non traduite n'a pas de `en.md`, donc n'est pas publiée en anglais, mécaniquement |
| Anne autonome à terme | Elle écrit déjà en Markdown. La marche suivante est un éditeur avec aperçu, puis une interface web — jamais une migration |
| Budget 20-50 €/mois | Tout ce qui suit est gratuit |

## Le format — un objet, un dossier, une langue par fichier

```
contenu-anne/
  stories/
    maison-thonon-2025/        ← l'identifiant stable de l'objet (slug français, jamais renommé)
      fr.md                    ← champs en tête + récit dans le corps
      en.md                    ← facultatif ; absent = non publié en anglais
      photo-principale.jpg
      photo-2.jpg …
      autorisations/
  avis-immodvisor/instantane.md
  guide/sequence-emails/etape-1/fr.md …
  pages/a-propos/fr.md · vendre/fr.md · acheter/fr.md · legal/…   ← témoignages : dans la story, pas de dossier à part (2026-09-13)
  identite.md                  ← nom, téléphone, RSAC… (source unique, AD-13)
```

Le fichier `fr.md` d'une story :

```markdown
---
commune: Thonon-les-Bains
type_bien: Maison
annee_vente: 2025
delai_vente: 3 mois
particularite: Succession, trois héritiers, deux pays
photo_principale: photo-principale.jpg
photos: [photo-2.jpg, photo-3.jpg]
temoignage:
  prenom: Claire
  contexte: couple, premier achat, frontaliers
  citation: >
    Anne a tout coordonné…
statut: brouillon          # brouillon | a-relire | publie
autorisations: false       # true quand vendeur + acheteur ont donné leur accord
---

Le récit d'Anne, à la première personne, 10 à 15 lignes…
```

Règles : les **champs** sont fixés par un schéma (celui d'Astro, en vague 2 — la liste ci-dessus est la v0, elle peut gagner ou perdre une case, jamais changer de forme) ; le **corps** est libre ; `statut` décide de la publication (`publie` seulement, et `autorisations: true` obligatoire pour une story) ; les photos vivent **à côté** du texte, jamais dans un dossier central. Une story qui ne passe pas le schéma ne casse rien : elle n'est pas publiée, et le build dit pourquoi.

## Les trois portes, dans l'ordre

### Porte 0 — maintenant : un éditeur et des gabarits (0 €, disponible aujourd'hui)

- **Des gabarits** dans `contenu-anne/_gabarits/` : Anne copie, renomme, remplit. Un gabarit par type d'objet.
- **Obsidian** comme éditeur (gratuit, Windows/Mac/iPhone) : ouvrir `contenu-anne/` comme un coffre. Elle voit ses stories comme des notes, l'aperçu Markdown est immédiat, les champs en tête s'affichent comme un formulaire (« Propriétés »). C'est l'outil le plus proche de « facile » sans rien construire. VS Code fait aussi l'affaire pour JB.
- **Publier = pousser** : GitHub Desktop pour Anne (deux boutons : *Commit*, *Push*), ou elle dépose et JB pousse — c'est le mode de départ.
- **Ce qu'Anne a déjà écrit** : JB pousse ses fichiers tels quels dans `contenu-anne/stories/_brouillons/` ; Claude les reverse dans les gabarits (mécanique) ; Anne continue dans les gabarits. Rien n'est réécrit, seulement rangé.

### Porte 1 — dès le squelette du site (epic « fondations ») : voir le résultat

- `contenu-anne/` devient **la source directe** des collections Astro (loader `glob` avec `base: './contenu-anne'` — vérifié : le dossier n'a pas à être dans `src/`). Pas d'étape de copie, pas de deuxième vérité.
- Chaque push sur une branche produit une **URL de prévisualisation** Cloudflare : Anne pousse, ouvre le lien, voit sa story dans le vrai site, corrige. C'est déjà un outil d'édition « avec aperçu », sans interface à construire.
- Le **schéma** valide chaque fichier au build : champ manquant, photo absente, `publie` sans autorisation → le build refuse et nomme le fichier. C'est la garantie d'AD-1 et d'AD-2.

### Porte 2 — quand Anne le demande : une interface web, sans Git

- **Decap CMS** (ex-Netlify CMS), git-based, gratuit, open source : une page d'administration à `annevialtissot.fr/admin-contenu`, formulaires générés depuis la configuration, aperçu, **et surtout une gestion des langues native** (`i18n: multiple_files` = exactement notre `fr.md` / `en.md` par dossier). Chaque enregistrement est un commit sur GitHub, au nom d'Anne. Il tourne en statique + un petit relais d'authentification GitHub sur un Worker Cloudflare (implémentations communautaires existantes, vérifiées).
- **Keystatic écarté** : plus joli et natif Astro, mais **pas de multilingue** (demande ouverte depuis des années) et des problèmes rapportés sur Cloudflare Workers (« too many subrequests », mode hybride requis). Il ne tient pas AD-2.
- Réserves honnêtes sur Decap : interface datée, développement communautaire lent. C'est un outil stable, pas un outil vivant. Comme il n'écrit que du Markdown dans Git, **l'abandonner un jour ne coûte rien** — les fichiers restent. C'est précisément pour ça qu'un CMS git-based est le bon pari et un CMS hébergé (Sanity, Contentful) le mauvais : avec eux, le contenu quitte le dépôt.
- Décision formelle en **vague 2** (le spine l'a différée) ; ce document en est la recommandation argumentée.

## Ce qui reste hors de ce format, et pourquoi

- **Vidéos** : hors Git (3,5 Go), inventaire `videos/liens.md`, partage OneDrive. Le site n'embarque que des extraits encodés, produits au build ou à la main.
- **Le diagnostic** (questions, barème, feedbacks) : données versionnées dans le dépôt mais **pas éditables par Anne** — un libellé se change par JB, le barème est un invariant (AD-1, identifiants immuables).
- **Les libellés d'interface** (boutons, menus) : dictionnaire `ui/fr.json` / `en.json`, édité par JB.
- **Les prospects** : jamais du contenu. Base D1, page admin (AD-18).

## Ce que ça coûte à JB

| Étape | Effort | Quand |
|---|---|---|
| Gabarits + Obsidian pour Anne | fait ce jour + 20 min avec elle | maintenant |
| Ranger les brouillons d'Anne dans les gabarits | 30 min (Claude) | dès qu'ils sont poussés |
| Schéma Astro + loader `glob` sur `contenu-anne/` | 2-3 h | epic fondations |
| Prévisualisation par branche | 0 (Cloudflare Workers Builds le fait) | idem |
| Decap CMS + relais OAuth | ½ journée | quand Anne le demande, après vague 2 |

## Ce qu'on demande à Anne, en pratique

1. Écrire dans les gabarits, une story = un dossier, `fr.md` d'abord.
2. Mettre `statut: publie` et `autorisations: true` seulement quand c'est vrai.
3. Pousser (GitHub Desktop) ou dire à JB que c'est prêt.
4. Plus tard : ouvrir le lien de prévisualisation, et un jour l'interface web — sans rien réapprendre.
