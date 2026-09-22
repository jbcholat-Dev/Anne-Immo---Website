# 📋 Suivi des Stories - Anne Immo

> Ce tableau est **le** point de vue d'ensemble sur les 22 stories prévues — les fichiers individuels (`<slug>/fr.md`) ne montrent que l'état d'une story à la fois. Deux statuts, à ne pas confondre : **rédigée** (Anne a écrit le texte) et **publiable** (commune, photo, au moins un témoignage — vendeur ou acheteur, les deux idéalement — et autorisation écrite réunis — champ `statut`/`autorisations` du fichier).

## État du projet

- **Total stories prévues** : 22
- **Rédigées** : 3/22
- **Publiables côté site** : 0/22 (il manque au moins la commune, un témoignage et la photo sur chacune)
- **À rédiger** : 19

---

## ✅ STORIES RÉDIGÉES (3)

### 1. PEILLEX RHL (2024)
- **Fichier** : `auberge-decoupee-2024/fr.md`
- **Titre** : « De l'impasse à l'opportunité : transformer un bien invendable en projet stratégique »
- **Format** : Mix Narrative + Professionnelle · ~550 mots
- **Écrite** : ✅ — **Publiable** : ❌ (commune, photo, témoignage de l'acheteur, autorisation écrite à ajouter)
- **Notes** : Bien invendable → projet stratégique via découpage géométrique

### 2. VALCIC BLIEZ (2024)
- **Fichier** : `appartement-cascade-2024/fr.md`
- **Titre** : « Vente en cascade : l'expertise qui synchronise deux projets de vie »
- **Format** : Narrative & Progressive · ~450 mots
- **Écrite** : ✅ — **Publiable** : ❌ (mêmes manques ; le nom de la cliente a été retiré du texte le 2026-09-10)
- **Notes** : Audit commercial + stratégie de mise en valeur + orchestration vente en cascade

### 3. MORAND MUFFAT (2025 ?)
- **Fichier** : `maison-premium-2025/fr.md`
- **Titre** : « Maison premium en stagnation »
- **Format** : Narrative + tableaux/emoji (ton plus marketing que les deux précédentes — à harmoniser à la relecture)
- **Écrite** : ✅ (confirmé par JB le 2026-09-10, malgré cette liste qui la donnait encore « à rédiger ») — **Publiable** : ❌ (mêmes manques + **année de vente à confirmer**, non écrite dans le texte)
- **Notes** : Objection silencieuse (pas de piscine) + présentation insuffisante → repositionnement complet

---

## 📅 STORIES À RÉDIGER (19 restantes)

### 2024 (8 restantes)
- [ ] BOEGLI BRAIZE
- [ ] HIGOUNENC CHERON
- [ ] PEILLEX DALY
- [ ] RABIER VALCIC
- [ ] RHL BRUN
- [ ] RHL DORLOT
- [ ] RHL FILLEULE
- [ ] RHL TOTY

### 2025 (8 restantes)
- [ ] BALISTRERI RHL
- [ ] BURNET PINET HOUSSARD
- [ ] LOIEZ BRAIZE
- [ ] RHL AIT DRAOUCH
- [ ] RHL DE FANTI BORDET
- [ ] RHL KORKUT
- [ ] RHL REGADAS
- [ ] SPOLAOR RHL

### 2026 (3)
- [ ] BAUD HOFMANNER CLEDAT DE LA VIGERIE MORAND
- [ ] LEBORGNE JOHNSON BAILLY
- [ ] VIVIAND WAKELIN

---

## 📊 Notes de processus

**Principes respectés** :
- ✅ Pas de critique d'autres agences - focus sur la stratégie
- ✅ Format : Narratif + Professionnel (équilibré) — sauf Morand Muffat, plus emoji/marketing, à harmoniser
- ✅ Longueur : 400-600 mots (web-friendly)
- ✅ Titres impactants et informatifs
- ✅ Relationnel : socle de la réussite, pas exagéré

**Convention de nommage (ajoutée le 2026-09-10)** : le nom du fichier/dossier d'une story ne porte jamais de nom de client — c'est une adresse publique du site. On utilise `commune-type-annee` (ex. `maison-thonon-2025`) ; sans commune connue, un identifiant descriptif provisoire (`type-descriptif-annee`), renommé dès que la commune est précisée. Ce tableau, lui, reste interne : les noms de clients ici servent à ta mémoire, ils ne sont jamais publiés tels quels.

**Pour rendre une story publiable** (les 3 rédigées en ont besoin) :
1. Commune du bien (case `commune` du fichier — permet aussi de renommer le dossier correctement).
2. Photo principale + 4 à 6 photos secondaires, choisies dans le dossier de la vente de `Stories  photos/` (champ `dossier_photos`) — voir § Ventes photographiées.
3. Au moins un témoignage, **le vendeur d'abord** (c'est ton client, son avis Immodvisor fait l'affaire) ; celui de l'acheteur en plus quand tu l'as : prénom, contexte en une ligne, citation, rôle.
4. Autorisation écrite du vendeur (photos + témoignage) et de chaque personne citée — un e-mail suffit.
5. Repasser `statut` à `a-relire` puis `publie` une fois tout réuni et relu par JB.

**Prochaine étape** : réunir les 4 manques ci-dessus sur les 3 stories rédigées avant d'attaquer la suivante — plus rentable que d'accumuler des brouillons non publiables.

---

## 🔗 Ventes photographiées — photos ↔ story ↔ avis (2026-09-22)

Anne a classé les photos HD par vente dans `contenu-anne/Stories  photos/` (9 dossiers, 135 photos, 1,4 Go, **hors Git**). Ce tableau est le registre qui relie chaque dossier à sa story et aux avis Immodvisor (`../avis-immodvisor/`). Les **identifiants de story** (colonne 2) suivent la convention `commune-type-annee` ; ceux marqués *proposé* n'ont pas encore de dossier dans `stories/`.

| Dossier photos | Story | Vente au suivi | Photos (dates) | Avis rapprochés | Photo principale suggérée |
|---|---|---|---|---|---|
| `THONON_VALCIC_T3` | `appartement-cascade-2024` ✍️ | VALCIC BLIEZ + RABIER VALCIC (2024) | 11 (mai 2024) ⚠️ basse qualité (boîtier ~6 Mpx) | Alexandra V. (moyenne) | 009 (cuisine + vue) |
| `ARMOY_PEILLEX_projet marchands` | `auberge-decoupee-2024` ✍️ | PEILLEX RHL (2024) | 12 (mars 2024) | RHL acheteur (moyenne) | 003 (vue lac) · 031 (aérien, les bâtiments) |
| `ALLINGES_MORAND_villa` | `maison-premium-2025` ✍️ | MORAND MUFFAT | 18 (nov. 2024) | — | 047 |
| `ANTHY_BOGLI_T3 RDJ` | `anthy-t3-2024` *proposé* | BOEGLI BRAIZE (2024) | 11 (nov.-déc. 2023) | JcbAnthy (forte) | 002 (jardin) |
| `ANTHY_LOIEZ_T4` | `anthy-t4-2025` *proposé* | LOIEZ BRAIZE (2025) | 13 (nov. 2024), 1 portrait | — | 025 (drone lac) |
| `BERNEX_HIGOUNENC_chalet` | `bernex-chalet-2024` *proposé* | HIGOUNENC CHERON (2024) | 12 (juin 2024) | — | 013 (façade) |
| `SCIEZ_BURNET_Villa` | `sciez-villa-2025` *proposé* | BURNET PINET HOUSSARD (2025) | 18 (mars 2025) | IsalineP (forte) | 002 (aérien port) |
| `ESSERT_BAUD_chalet` | `essert-romand-chalet-2026` *proposé* | BAUD HOFMANNER… (2026) | 17 (nov. 2025) | Sabine/François (forte) | 013 (façade sous neige) |
| `EVIAN_LEBORGNE_T4` | `evian-t4-2026` *proposé* | LEBORGNE JOHNSON BAILLY (2026) | 23 (avr. 2026), 1 portrait | — | 019 (façade) |

✍️ = story rédigée. Avis sans vente photographiée : JamesW → VIVIAND WAKELIN (2026, moyenne) ; RHL vendeur → une vente RHL 2024 ; les 9 autres sans piste sûre (détail et indices dans chaque fiche d'avis). **Anne confirme** en remplissant le champ `story` de la fiche d'avis ; tant qu'il est vide, le site ne relie rien.

**À savoir sur le stock photo** (inventaire du 2026-09-22) : aucune photo sans date ni sous 2 400 px ; pas de doublon ; **7 dossiers sur 9 n'ont aucune photo en portrait** — la règle « dont une en portrait » du gabarit n'est pas tenable, le site recadrera en 4:5 depuis le paysage. Aucune piscine à Allinges ni à Sciez (cohérent avec la story « maison premium »).
