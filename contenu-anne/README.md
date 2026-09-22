# Dépôt de contenu — Anne

Ce dossier est **ta boîte de dépôt**. Tu y poses tout ce que le site a besoin de toi : stories de ventes, photos, vidéos, témoignages, textes. JB et Claude transforment ensuite ce que tu déposes en pages du site — tu n'as rien à mettre en forme.

**Commence par `_gabarits/`** : un modèle par type de contenu, à copier et remplir. Stratégie complète : `_bmad-output/planning-artifacts/strategie-contenu.md`.

## Où poser quoi

| Dossier | Ce qu'on y met | Détail |
|---|---|---|
| `stories/` | Une story par bien vendu | un sous-dossier par bien, `fr.md` depuis `_gabarits/story.md` ; tes brouillons dans `stories/_brouillons/` |
| `Stories  photos/` | **Les photos HD de chaque vente**, un dossier par vente (`COMMUNE_NOM_type`) | hors Git (trop lourd) — tu les ranges, tu choisis dans ta story, le site fabrique le reste |
| `photos/` | Photos de toi en situation, et celles qui ne se rattachent à aucune vente | originaux, non recadrés, non compressés |
| `videos/` | Vidéo drone d'ouverture, autres séquences | ⚠️ **pas dans Git** — voir `videos/README.md` |
| `avis-immodvisor/` | Tes avis Immodvisor, **un fichier par avis** (relevé du 2026-09-22 : 18 avis) — confirme à quelle vente chacun correspond (champ `story`) | |
| `guide/` | Le guide « 10 erreurs » : corrections souhaitées, et la séquence d'e-mails | JB/Claude produisent le PDF à la charte |
| `legal/` | Numéro RSAC, référence de carte pro eXp, adresse professionnelle | pour les mentions légales |
| `portrait/` | Ton portrait (vertical ou carré, 1600 px minimum) + 1-2 photos en situation | |

## Trois règles

1. **Originaux seulement.** Le fichier tel qu'il sort de l'appareil photo ou du drone (ou du photographe). Pour une vente : dans `Stories  photos/`, puis tu **choisis** tes photos dans la story par leur numéro (`photo_principale: "047"`). Le site fabrique lui-même ses formats.
2. **Nomme simplement.** `maison-thonon-2026.jpg`, pas `IMG_4521.jpg`. Minuscules, tirets, sans accents.
3. **Une autorisation par personne citée et par bien photographié.** Un mot écrit (un e-mail suffit) du vendeur pour les photos et son témoignage, de l'acheteur pour le sien. Dépose-les dans le dossier de la story concernée.

Les témoignages vivent **dans la story** du bien concerné (vendeur et/ou acheteur), pas dans un dossier à part. Les témoignages de personnes accompagnées sans vente ne sont plus demandés (décision du 2026-09-13).

## Comment envoyer

Tu as le dépôt sur ton ordinateur : dépose les fichiers dans ces dossiers, puis **commit + push**. JB est prévenu. Pour les vidéos (trop lourdes pour Git), voir `videos/README.md`.
