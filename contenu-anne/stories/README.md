# Stories de ventes

**Une story = un bien vendu**, raconté par toi, avec le mot de l'acheteur. C'est ce qui remplace la vitrine de biens : la preuve qu'une vente est allée au bout, et comment.

## Un sous-dossier par bien, un fichier par langue

```
stories/
  maison-thonon-2025/         ← nom du dossier : commune-type-annee, minuscules, tirets, sans accents
    fr.md                     ← copie de _gabarits/story.md : champs en tête, récit en dessous
    en.md                     ← plus tard, la version anglaise (facultatif)
    photo-principale.jpg      ← LA photo du bien, paysage, 2400 px de large minimum
    photo-2.jpg …             ← 4 à 6 photos secondaires, dont au moins une en portrait
    autorisations/            ← accord du vendeur (photos) et de l'acheteur (témoignage)
```

Le témoignage de l'acheteur est **dans l'en-tête de `fr.md`** (bloc `temoignage:`), pas dans un fichier à part.

## Ce que dit `statut`

- `brouillon` : tu y travailles. Personne ne le voit.
- `a-relire` : tu as fini, JB relit.
- `publie` : en ligne au prochain déploiement — **seulement si `autorisations: true`**.

**Objectif au lancement : 3 stories complètes.** Une story sans photo principale, sans récit ou sans témoignage n'est pas publiée : elle attend dans le dossier.

## Tes brouillons existants

Dépose-les tels quels dans `stories/_brouillons/` : ils seront rangés dans les gabarits sans être réécrits.
