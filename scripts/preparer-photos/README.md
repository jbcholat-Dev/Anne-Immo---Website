# preparer-photos

Tire les **versions web** des photos choisies par Anne. Règle complète : `_bmad-output/planning-artifacts/strategie-contenu.md` § Photos.

- **Entrée** : les photos HD de la story, dans `stories/<id>/photos/` du dossier Google Drive « Contenu site Anne » (hors Git), recopié en local ; + l'en-tête de `contenu-anne/stories/<id>/fr.md` : `photo_principale`, `photos` (numéro de la photo, ex. `"047"`, ou nom exact).
  Le script lit la copie locale à l'endroit donné par le réglage `PHOTOS_HD` (le dossier `stories` de la copie), sinon dans `contenu-anne/.photos-hd/` (ignoré par Git).
- **Sortie** : `contenu-anne/stories/<id>/photos/` — `photo-<numéro>.jpg` (3 200 px max, JPEG 85, sRGB, sans métadonnées) + `photos.json` (objets `Media`). Le dossier appartient au script : une `photo-*.jpg` désélectionnée y est supprimée. Ne rien y déposer à la main.

```bash
cd scripts/preparer-photos
npm install          # une fois
PHOTOS_HD="…/Contenu site Anne/stories" npm run photos   # toutes les stories
npm run photos -- maison-premium-2025     # une seule
```

Relançable sans risque : une photo déjà produite n'est refaite que si sa source HD a changé. Sort en erreur (code 1) si un numéro désigne zéro ou plusieurs photos.
