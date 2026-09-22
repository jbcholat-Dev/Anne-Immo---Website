# preparer-photos

Tire les **versions web** des photos choisies par Anne. Règle complète : `_bmad-output/planning-artifacts/strategie-contenu.md` § Photos.

- **Entrée** : `contenu-anne/Stories  photos/<VENTE>/` (HD, hors Git) + l'en-tête de `contenu-anne/stories/<id>/fr.md` : `dossier_photos`, `photo_principale`, `photos` (numéro de la photo, ex. `"047"`, ou nom exact).
- **Sortie** : `contenu-anne/stories/<id>/photos/` — `photo-<numéro>.jpg` (3 200 px max, JPEG 85, sRGB, sans métadonnées) + `photos.json` (objets `Media`). Le dossier appartient au script : une photo désélectionnée y est supprimée. Ne rien y déposer à la main.

```bash
cd scripts/preparer-photos
npm install          # une fois
npm run photos                            # toutes les stories
npm run photos -- maison-premium-2025     # une seule
```

Relançable sans risque : une photo déjà produite n'est refaite que si sa source HD a changé. Sort en erreur (code 1) si un numéro désigne zéro ou plusieurs photos.
