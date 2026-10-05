# Ce qu'Anne doit fournir pour le site

> Mis à jour le 2026-10-04. Coche au fur et à mesure (`[x]`). Dans l'ordre : ce qui bloque la mise en ligne publique d'abord. Chaque ligne renvoie à la story qui la suit dans `_bmad-output/planning-artifacts/epics.md`.

## 1. Les trois stories de vente (story 7.9) — bloque la mise en ligne

Sans ces éléments, le site public ne peut montrer aucune vente : une story ne s'affiche que si elle est en `statut: publie` avec `autorisations: true` (le site refuse désormais de se construire si une story est publiée sans autorisation).

Pour chacune des trois (`stories/appartement-cascade-2024` Thonon, `stories/auberge-decoupee-2024` Armoy, `stories/maison-premium-2025` Allinges), dans son `fr.md` :

- [ ] Thonon : au moins un témoignage (le vendeur d'abord : prénom, contexte en une ligne, citation ; son avis Immodvisor convient)
- [ ] Armoy : idem
- [ ] Allinges : idem, **plus l'année de vente** (vide aujourd'hui)
- [ ] Les photos choisies par Claude te conviennent (sinon, change les numéros dans `photos:`)
- [ ] Un accord écrit (un e-mail suffit) du vendeur pour les photos et son témoignage, et de chaque personne citée, déposé dans `stories/<dossier>/autorisations/`
- [ ] Dans `avis-immodvisor/`, le champ `story:` rempli sur chaque avis qui correspond à une de ces ventes, et `retenu: true` sur les trois avis à citer en entier sur l'accueil
- [ ] Puis `statut: a-relire` ; après relecture de JB, `statut: publie` et `autorisations: true`

## 2. Tes coordonnées légales (story 7.6)

- [ ] Compléter `legal/identite.md` (déjà pré-rempli) : numéro RSAC et ville du greffe, référence de la carte professionnelle eXp, adresse professionnelle, téléphone, e-mail. Exactement les mêmes valeurs que sur ta fiche Google Business.

## 3. Tes réseaux sociaux (story 7.7) — quelques minutes

- [ ] Dans `legal/identite.md` : l'adresse complète de tes profils Instagram, YouTube et LinkedIn, ou « pas de profil ».

## 4. Ton portrait (story 7.5)

- [ ] Un portrait (vertical ou carré, 1 600 px minimum, fond simple) dans `portrait/`, nommé par exemple `anne-portrait.jpg`
- [ ] Une ou deux photos de toi sur le terrain (visite, échange, extérieur), dans `portrait/`
- [ ] Originaux, ni recadrés ni compressés ; si un photographe les a faites, son accord pour le site
- [ ] Le texte à afficher pour les malvoyants (par défaut « Anne Vial-Tissot »)

## 5. Le guide « 10 erreurs » (story 7.8)

- [ ] Relire `guide/texte-actuel.md` et corriger directement dedans
- [ ] Répondre aux trois questions de `guide/corrections.md` : un guide ou un par profil ; les chiffres à garder ; les « cas réels » qui sont de vraies ventes

## 6. Les e-mails envoyés après le diagnostic (story 7.10) — après le guide

- [ ] Relire les sept e-mails rangés dans `guide/sequence-emails/` (base de 2025) et les points listés dans `guide/sequence-emails/README.md`
- [ ] Décider du nombre d'e-mails et de leurs jours d'envoi
- [ ] Confirmer que chaque « cas réel » est une de tes ventes, sinon le retirer

## 7. Avant la version anglaise (stories 6.2 à 6.4)

Traduire un texte encore provisoire, c'est le traduire deux fois. Ces points passent donc avant l'anglais :

- [ ] Valider la page À propos (`pages/a-propos/fr.md`, aujourd'hui `statut: brouillon`)
- [ ] Écrire le texte de la page Acheter
- [ ] Trancher la section « Cible » d'À propos (on la garde ou non) et les champs du formulaire d'estimation
- [ ] Valider les trois pages légales (mentions, confidentialité, cookies)
- [ ] Dire qui traduit en premier : toi, ou Claude puis toi en relecture
- [ ] Le barème de la question 10 du diagnostic (visites × offres), à valider avec JB

## Déjà fait

- Les trois récits de vente (7.1), les 18 avis Immodvisor (7.2), les photos web des trois ventes (7.3), la vidéo d'ouverture (7.4).
