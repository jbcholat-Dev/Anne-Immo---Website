# Dépôt de contenu — Anne

Ce dossier est **ta boîte de dépôt**. Tu y poses tout ce que le site a besoin de toi : stories de ventes, photos, vidéos, témoignages, textes. JB et Claude transforment ensuite ce que tu déposes en pages du site — tu n'as rien à mettre en forme.

**Commence par `_gabarits/`** : un modèle par type de contenu, à copier et remplir. Stratégie complète : `_bmad-output/planning-artifacts/strategie-contenu.md`.

## Où poser quoi

| Dossier | Ce qu'on y met | Détail |
|---|---|---|
| `stories/<bien>/` | **Tout ce qui concerne une vente, au même endroit** : le récit (`fr.md`, depuis `_gabarits/story.md`), tes notes, les photos HD dans `photos/` | un sous-dossier par bien (`commune-type-annee`) ; tes brouillons dans `stories/_brouillons/` |
| `photos/` | Photos de toi en situation, et celles qui ne se rattachent à aucune vente | originaux, non recadrés, non compressés |
| `videos/` | Vidéo drone d'ouverture, autres séquences | ⚠️ **pas dans Git** — voir `videos/README.md` |
| `avis-immodvisor/` | Tes avis Immodvisor, **un fichier par avis** (relevé du 2026-09-22 : 18 avis) — confirme à quelle vente chacun correspond (champ `story`) | |
| `guide/` | Le guide « 10 erreurs » : corrections souhaitées, et la séquence d'e-mails | JB/Claude produisent le PDF à la charte |
| `legal/` | Numéro RSAC, référence de carte pro eXp, adresse professionnelle | pour les mentions légales |
| `portrait/` | Ton portrait (vertical ou carré, 1600 px minimum) + 1-2 photos en situation | |

## Trois règles

1. **Originaux seulement.** Le fichier tel qu'il sort de l'appareil photo ou du drone (ou du photographe). Dans l'espace d'édition, tu les envoies tels quels : ils sont réduits avant l'envoi, et l'en-tête de la story garde leur chemin (`photo_principale: "photos/sejour.webp"`). Le site fabrique lui-même ses formats.
2. **Nomme simplement.** `maison-thonon-2026.jpg`, pas `IMG_4521.jpg`. Minuscules, tirets, sans accents.
3. **L'accord des clients avant « Publiée ».** Les clients des ventes actuelles ont tous donné leur accord (2026-10-05). Pour une nouvelle vente, obtiens l'accord du vendeur avant de la passer en « Publiée ».

Le témoignage d'une vente est **son avis Immodvisor**, cité tel quel : dans l'espace d'édition, rubrique Avis, choisis la vente dans « Vente concernée » (décision du 2026-10-05, story 7.14). Les témoignages de personnes accompagnées sans vente ne sont plus demandés (décision du 2026-09-13).

## Comment envoyer

**Depuis le 2026-10-05 (story 7.13) : l'espace d'édition du site.** Tu ouvres `annevialtissot.fr/admin`, tu te connectes avec ton compte GitHub, et tu modifies tes ventes, tes pages, tes coordonnées ou le rapprochement de tes avis dans des formulaires. Tes photos y sont envoyées directement : elles sont réduites automatiquement avant l'envoi, tu peux donc déposer les originaux. Chaque enregistrement est un brouillon que tu vois sur l'aperçu ; JB le valide pour le mettre en ligne. Mode d'emploi : le document « Mise en place de l'espace d'édition » dans le Drive.

Le Drive reste l'archive de tes photos HD et de tes vidéos. Le paragraphe suivant décrit l'ancien circuit, encore valable pour les vidéos et pour un dépôt en masse.


**Tu ne touches pas à GitHub.** Ta boîte de dépôt est le dossier partagé Google Drive **« Contenu site Anne »** (décision du 2026-10-05). Il est rangé **exactement comme ce dossier-ci** : mêmes noms, mêmes sous-dossiers (`stories/<bien>/`, `avis-immodvisor/`, `guide/`, `legal/`, `portrait/`, `videos/`…). Tu y travailles directement, depuis ton ordinateur (Google Drive pour ordinateur) ou ton téléphone.

Ensuite, Claude lit le dossier et recopie ici, par une demande de fusion que JB valide, ce qui a changé : les textes tels quels, et pour les photos, une version allégée pour le web de celles que tu as choisies (`stories/<bien>/photos/photo-NNN.jpg`). Les originaux lourds (photos HD, vidéos) restent sur Drive : ils n'entrent jamais dans GitHub.

Seule différence entre les deux : sur Drive, `stories/<bien>/photos/` contient tes photos HD ; ici, il ne contient que les versions web des photos retenues.

> Historique : le 2026-10-05 au matin, un découpage en cinq sous-dossiers (Textes, Photos des ventes…) avait été proposé, puis abandonné le jour même parce qu'il éclatait une vente en trois endroits. Il reste sur Drive, renommé « ARCHIVE - ancien Contenu site Anne (ne plus utiliser) ».
