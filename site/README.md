# Site d'Anne VIAL-TISSOT — v1 (build statique)

Astro 7, sortie statique, CSS sur les seuls tokens de `design-system/tokens/tokens.css`, trois îlots JS (scroll-craft, formulaires, diagnostic). Aucun backend : tout ce qui écrit un lead est **simulé** (voir « TODO(backend) »). La référence visuelle est la maquette lot 3 (`maquettes/lot-3-complet/`), les décisions D-1 → D-26 priment.

## Lancer

```bash
cd site
npm install            # Node ≥ 22.12 (le dépôt a été construit avec 22.22)
npm run dev            # http://localhost:4321
npm run build && npm run preview
```

Autres commandes :

| Commande | Rôle |
|---|---|
| `npm run images` | dérive les WebP/JPG de `contenu-anne/` vers `public/img/` + `src/data/images.json` (sharp). Déjà lancé et commité : à relancer quand Anne dépose des photos ou change une sélection dans `stories/<slug>/fr.md` (après `scripts/preparer-photos`). |
| `npm run verif` | captures Playwright (1440 et 390) de toutes les pages dans `.verif/` ; accueil à 5 positions de défilement + mouvement réduit. |
| `node scripts/e2e-diagnostic.mjs` | parcours complet du diagnostic (sortie A, sortie B, profil à risque, abandon / reprise, gate en erreur, lien expiré). |
| `node scripts/liens.mjs` | vérifie que chaque lien et chaque ancre du site construit mène quelque part. |
| `npm run check` | `astro check` (types). |

Les scripts Playwright utilisent `/opt/pw-browsers/chromium` s'il existe, sinon le Chromium de Playwright (`npx playwright install chromium` une fois). Pour tester l'**échec d'envoi** d'un formulaire : ajouter `?simuler=echec` à l'URL de la page.

## Les 11 pages

| Route | Page | Source des textes |
|---|---|---|
| `/` | Accueil — hero vidéo/poster, bande Klein, pile de 6 cartes collantes (D-16), méthode + refrain, « Ils ont travaillé avec Anne », diagnostic, Anne, fermeture Klein (D-22) | maquette `01-accueil-*`, `contenu-anne/` |
| `/realisation`, `/realisation/<slug>` | Réalisation (index + 3 fiches story) | `contenu-anne/stories/*/fr.md` (récits d'Anne, tels quels) |
| `/a-propos` `#qui-suis-je` `#methode` `#cible` | À propos, page longue à ancres, repère collant, **sans** bloc vidéo A-15 (D-12) | maquette `apropos-*` (condensé de `contenu-anne/pages/a-propos/fr.md`) |
| `/vendre` (`#estimation`) | deux portes + formulaire d'estimation (8 champs, D-4) | maquette `04-vendre-*` |
| `/acheter` | profils, recherche accompagnée, avis d'acheteurs (§ 5.4), CTA → contact préréglé Achat | maquette `04b-acheter-*` |
| `/diagnostic` | landing autonome | maquette `05-diagnostic-*` |
| `/diagnostic/questions` | 17 écrans, 15 numéros, nav masquée, reprise, abandon, gate | `quiz-contenu.md` (libellés) |
| `/diagnostic/resultats` | score, profil D-23, 3 sous-scores brut + %, 9 feedbacks, sorties A/B, états guide / séquence / lien expiré | `quiz-conception-notion.md` (barème, feedbacks) |
| `/contact` (`#reserver`, `#ecrire`) | Cal.com en gabarit statique + « Écrire à Anne » (champ projet vente/achat) | maquette `08-contact-*` |
| `/guide` | guide « 10 erreurs », capture téléphone facultatif | maquette `09-guide-*` |
| `/mentions-legales`, `/confidentialite`, `/cookies` | légal, lockup positif en tête des mentions, valeurs A-13 à compléter | maquette `10-legal-*` |
| `/404` | page introuvable | — |
| `/en`, `/en/track-record` | accueil EN et index « Track record » (vide : aucune story traduite, AD-2). Les autres entrées EN renvoient aux pages FR pour cette v1, sans écran mi-traduit. | `src/content/ui/en.json` |

Navigation (D-2, D-6 A, D-17, D-21) : réseaux · symbole seul | À propos ▾ (Qui suis-je ? · Ma méthode · Cible) · Réalisation · Vendre · Acheter · Contact · FR EN. Fixe dès le premier pixel, réduite à 56 px au défilement, jamais masquée ; menu mobile plein écran avec « À propos » en accordéon (lien + chevron). Pied de page `00-footer` partout.

## Réel vs placeholder

**Réel** : les 3 récits d'Anne (Thonon, Armoy, Allinges) et leurs 13 photos ; la vue du Léman depuis Armoy en poster du hero ; la note 5/5 et les 18 avis Immodvisor (`instantane.md`, avis cités tels quels, jamais corrigés) ; les textes d'À propos, de la méthode, du diagnostic (libellés live + barème + 9 feedbacks) ; les logos et lockups eXp du design system.

**Blocs réservés « Actif attendu »** (galet, dimensions réelles, jamais un trou) : A-01 vidéo d'ouverture (le `<video>` est en place avec son poster, source à ajouter dans `src/components/accueil/Hero.astro`) · A-02 photos des trois ventes « à venir » de la pile (Sciez, Essert-Romand, Anthy — ventes réelles du registre sans story rédigée) · A-04 portrait (accueil, À propos, landing) · A-05 Anne en situation · A-07 témoignages de story quand aucun avis n'est relié · A-10 couverture du guide · A-13 RSAC, carte pro, hébergeur, coordonnées (`src/config/site.ts`, `identite`) · A-15 vidéo méthode (bloc absent, D-12).

**Textes marqués « Point ouvert » / « Contenu à écrire par Anne »** (pastille terra-deep, comme dans la maquette) : Acheter (D-5), section Cible (point ouvert 1), champs de l'estimation (point ouvert 2). À retirer avec le contenu définitif.

## Choix éditoriaux pris pour la v1 (à confirmer par Anne / JB)

Tous dans `src/config/site.ts` :

- **Les 3 avis de l'accueil** : Alexandra V. (vendeuse, reliée à la story de Thonon avec sa photo), JcbAnthy (vendeur), Rémi (acheteur). L'instantané proposait JcbAnthy + Sabine/François + Rémi ; Sabine/François (très long) est gardé en citation courte sur la carte Essert-Romand de la pile.
- **Liaisons avis → story assumées** tant que le champ `story` des fiches d'avis est vide (`liaisonsAssumees`) : Alexandra V. → `appartement-cascade-2024` (« projet vente et achat » = la vente en cascade), RHL acheteur → `auberge-decoupee-2024`. Anne confirme en remplissant `story:` dans la fiche ; ce tableau est alors ignoré.
- **Bande preuve** : une phrase d'Alexandra V. — Acheter : RHL + JamesW.
- **Cartes 4-6 de la pile** : Sciez villa 2025, Essert-Romand chalet 2026, Anthy T3 2024 (registre `_suivi-stories.md`), photo réservée, citation de l'avis rapproché quand la confiance est « forte ».
- **Phrase d'Anne par carte** (`phrasesStories`) : extraite telle quelle du récit.
- **Stories affichées malgré `statut: brouillon` / `autorisations: false`** — pour que JB voie le site plein. Avant mise en ligne : filtrer sur `statut === 'publie' && autorisations` dans `src/lib/contenu.ts` (`stories()`), et obtenir la version sans logo eXp des photos d'Essert-Romand.
- **Réseaux sociaux** : URLs des profils inconnues → liens vers les plateformes en attendant (`reseaux`).

## Diagnostic — règles appliquées

- Ordre et libellés du live (`quiz-contenu.md`), identifiants immuables `qNN` / `qNN.x`, barème de la conception (`src/content/diagnostic/bareme.json`, section `_ecarts`) :
  - **Q10 visites × offres : barème non tranché** (SPEC, Open Questions) — matrice reconstruite depuis les 5 combinaisons de la conception, **TODO à valider avec Anne**.
  - Q2 (3 options live) : « Certains diagnostics à refaire » = 5 pts ; Q5 « + vidéo » = 10 comme « + visite virtuelle » ; Q9 : 10 / 5 / 1.
  - Q14 option a : le live cite le « Système 360™ » (retiré, D-15) → descripteur de la conception (« prise en charge totale… »).
  - Q7 : le nombre de plateformes cochées fait le score ; « Autre (préciser) » compte si renseigné ; « Aucune diffusion » exclusive.
- Sortie A = score ≥ 71 **et** Q14 premium **et** Q12 ≠ « minimiser les frais » (CAP-7) ; sinon B.
- Reprise à l'écran atteint (localStorage `avt.diagnostic.v1`), effacée à la soumission du gate. Résultats dans `sessionStorage` (`avt.diagnostic.resultat`, 24 h) — sans session, la page affiche « Ce lien n'est plus valable ».

## TODO(backend) — ce que la v1 simule

Chaque endroit est marqué `TODO(backend)` dans le code (`grep -rn "TODO(backend" src`).

1. `src/islands/formulaires.ts` `envoyer()` : POST vers `/api/<source>` (contact, estimation, guide, rdv) avec Turnstile, champ piège, `submission_id` ULID, écriture D1 avant diffusion (AD-4, AD-6, AD-7). Aujourd'hui : résolution après 700 ms, échec si `?simuler=echec`.
2. `src/islands/diagnostic.ts` + `src/lib/scoring.ts` : **le gate est côté client** ; le score est calculé dans le navigateur et le résultat stocké en session. Cible AD-5 : POST `/api/diagnostic`, jeton serveur à usage unique, page de résultats rendue par le noyau (404 sinon), barème lu par le serveur seulement — l'îlot `resultats.ts` disparaît.
3. `src/islands/resultats.ts` : envoi du guide (lien signé, e-mail Resend, AD-8) et opt-in séquence (`newsletter_opt_in_at`, AD-16).
4. `src/pages/contact.astro` : remplacer le gabarit Cal.com statique par l'embed (chargé après action du visiteur, AD-11), question obligatoire d'acceptation, webhook `BOOKING_CREATED` (CAP-9).
5. `src/pages/guide.astro` : le PDF n'a pas d'adresse publique — lien signé expirant (CAP-8).
6. Adaptateur Cloudflare (`@astrojs/cloudflare`, `worker.ts` pour le cron), D1 `eu`, migrations, admin, mesure d'audience, `funnel_event` (AD-10 → AD-18). `astro.config.mjs` reste `output: 'static'` jusque-là.
7. Données structurées `RealEstateAgent` depuis `identite` (AD-13) une fois A-13 fourni.

## Écarts assumés avec la maquette / les briefs

- **Pas de Lenis** (défilement inertiel du brief scroll-craft) : JS minimal, défilement natif ; à ajouter en îlot si JB le souhaite (≈ 10 Ko).
- **Tiret des titres Italiana** : la police n'a pas de glyphe visible pour le tiret ASCII ; les titres (« VIAL‑TISSOT », communes) emploient le tiret insécable U+2011 (`src/lib/texte.ts`).
- **Nav réduite sur le hero** : transparente et écru au repos, écru 86 % + flou dès 40 px de défilement (la maquette ne réduisait qu'après le hero et laissait un trou sans nav — revue B1.1).
- **Section Cible** conservée avec ses textes de placement (point ouvert 1 non tranché) ; **menu « À propos » à trois sous-entrées**.
- **Accueil EN sans la pile** (aucune story traduite, AD-2) ; avis cités en français, signalés comme tels ; entrées de nav EN vers les pages FR.
- Les vignettes de la pile en mobile gardent le débord de 30 px de la photo au-dessus de la carte (maquette) ; le pas de la pile est la hauteur de carte + 30 px (desktop 630 px), les cartes sont en flux sous `prefers-reduced-motion`.
- Marqueurs « Point ouvert » / « Contenu à écrire par Anne » affichés (pastilles de la maquette) pour que JB les repère ; à supprimer en production.
- Pages légales : textes de structure conformes à AD-16 (finalités, bases légales, 3 ans), **à faire valider par Anne** avant publication ; les valeurs A-13 sont des pastilles « à compléter ».

## Vérification faite (voir `.verif/`)

`npm run build` sans erreur (19 pages) · `node scripts/liens.mjs` : 0 lien cassé · `node scripts/e2e-diagnostic.mjs` : sorties A, B et profil à risque, abandon/reprise, erreurs du gate, lien expiré, aucune erreur console · `npm run verif` : captures 1440 / 390 de chaque page, accueil à 5 positions (hero, pile 3 positions, fermeture) et en mouvement réduit.
