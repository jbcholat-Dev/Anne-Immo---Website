# Site web d'Anne VIAL-TISSOT — instructions pour Claude

Projet : le site `annevialtissot.fr` d'Anne, consultante en immobilier (Chablais, Léman, réseau eXp France).
JB (jbcholat) pilote le projet en tant que chef de produit. Anne fournit le contenu et valide le rendu.

## 1. Comment parler à JB

JB est ingénieur, 20 ans d'expérience, chef de produit sur ce projet. Il utilise Claude Code depuis un an.
Il **n'est ni développeur ni web designer**. Il veut comprendre chaque décision pour pouvoir la porter.

Règles, valables dans toutes les réponses, en français :

- **Chaque terme technique est expliqué à sa première apparition**, en une phrase, dans la réponse elle-même.
  Exemple : « un `robots.txt`, le petit fichier qui dit aux moteurs de recherche ce qu'ils ont le droit d'indexer ».
  Cela vaut aussi pour les sigles du projet (AD-n, CAP-n, D-n : dire ce qu'ils désignent).
- **Dire l'effet avant le moyen.** D'abord ce que ça change pour Anne, JB ou le visiteur, ensuite comment c'est fait.
- **Pas de jargon quand un mot courant existe.** « mettre en ligne » plutôt que « déployer », « adresse du site » plutôt que « URL de prod », « réglage » plutôt que « variable d'environnement », sauf si le terme exact est nécessaire, et alors il est expliqué.
- **Une décision = une recommandation claire**, avec la raison et ce qu'on perd en choisissant autrement. Pas de liste d'options sans avis.
- **Ne jamais supposer qu'un nom d'outil parle de lui-même** (Cloudflare, Workers, D1, Resend, Cal.com, Astro, Playwright…). À la première mention dans une réponse : à quoi il sert, en une phrase.
- **Ce que JB doit faire lui-même** (créer un compte, acheter, valider) est listé à part, dans l'ordre, avec la durée estimée.
- Pas d'infantilisation : le niveau est celui d'un collègue ingénieur d'un autre domaine, pas d'un débutant.

## 2. Traçabilité : rien ne se fait sans trace

La spec (`_bmad-output/specs/spec-anne-website/SPEC.md`) exige que le site soit **maintenable et transférable** à quelqu'un d'autre. Cela impose une discipline, quel que soit l'outil :

- **Tout travail sur le site passe par une story suivie.** Une story = un fichier dans `_bmad-output/implementation-artifacts/`, rattaché à un epic, avec : objectif, ce qui est fait, ce qui est vérifié, ce qui reste. Le suivi d'ensemble vit dans le fichier de statut de sprint produit par `bmad-sprint-planning`. Un changement fait « en direct » sans story est une dette : le signaler et créer la story après coup.
- **Une décision se journalise le jour où elle est prise**, dans le document qui la porte : `DECISIONS.md` de la maquette pour le design, `.memlog.md` de la spec pour le contrat, spine d'architecture pour la technique. Une décision qui n'est écrite nulle part n'existe pas.
- **Les documents de référence sont mis à jour dans le même commit que le changement** : `site/README.md` (comment lancer, ce qui est réel ou simulé, écarts assumés), `RUNBOOK.md` (comptes, mise en ligne, secours) une fois créé, ce fichier.
- **Chaque commit dit quoi et pourquoi**, en français, en une ligne claire pour quelqu'un qui ne connaît pas le code.
- **Chaque écart avec la maquette, la spec ou l'architecture est écrit** dans `site/README.md` § « Écarts assumés », avec sa raison.
- **Tout ce que la v1 simule** (formulaires, gate du diagnostic, envoi du guide) est marqué `TODO(backend)` dans le code et listé dans `site/README.md`. Ne pas en ajouter sans mettre la liste à jour.
- **Un travail est « fait » quand il est vérifié** : `npm run build`, `npm run check`, liens (`scripts/liens.mjs`), captures (`npm run verif`) pour tout changement visuel. Le résultat de la vérification est cité dans la story.

### Tableau de bord de JB

Le suivi visuel du projet est un artefact claude.ai : **https://claude.ai/artifact/4HmS8AdWcXACwVpgQSrMRB** (tableau de bord « Site Anne »).
Il lit une petite base de données attachée à l'artefact, que Claude met à jour avec l'outil `ArtifactData` :

- collection `epics` : un document par epic (`numero`, `famille` ∈ site · contenu · mise-en-ligne · backend · visibilite, `titre`, `resume`, `statut` ∈ fait · en-cours · a-faire · a-definir, `stories_total`, `stories_faites`, `reste`) ;
- collection `publications` : un document par publication (`date`, `type` ∈ git · apercu · production, `titre`, `detail`, `url`) ;
- document `etat/projet` : `phase`, `prochaine_action`, `derniere_mise_a_jour`, `apercu_url`, `site_url`.

**Règle : à chaque changement d'état** (story terminée ou créée, epic ouvert ou clos, fusion dans `main`, mise en ligne), Claude met à jour les documents concernés **dans la même session**, et `etat/projet.derniere_mise_a_jour` prend la date du jour. Le fichier de statut de sprint dans `_bmad-output/implementation-artifacts/` reste la source ; le tableau de bord en est le reflet. S'ils divergent, corriger le tableau de bord.

Le repère de vérité en cas de contradiction : la **spec v5** pour ce que le site doit faire, le **spine d'architecture** pour comment il est construit, les **décisions D-1 à D-26** de la maquette pour l'apparence, `site/README.md` pour l'état réel du code.

## 3. Carte du dépôt

| Dossier | Rôle |
|---|---|
| `site/` | Le code du site (Astro 7, sortie statique). `site/README.md` décrit l'état réel, `site/PLAN.md` le plan de construction. |
| `contenu-anne/` | Boîte de dépôt d'Anne : stories, avis Immodvisor, photos, légal, guide. Les vidéos et photos HD sont hors Git (trop lourdes). |
| `design-system/` | Charte : couleurs, typographies, logos, composants. `tokens/tokens.css` est copié dans le site. |
| `maquettes/lot-3-complet/` | Maquette de référence (61 écrans) et `DECISIONS.md` (D-1 → D-26). |
| `_bmad-output/specs/spec-anne-website/` | La spec (contrat, 11 capacités CAP-1 → CAP-11) et son journal `.memlog.md`. |
| `_bmad-output/planning-artifacts/` | Architecture (spine, 18 décisions AD-1 → AD-18), structure du site, briefs, stratégie de contenu. |
| `_bmad-output/implementation-artifacts/` | Epics, stories, statut de sprint (suivi du build). |
| `_bmad/`, `.claude/skills/` | Outillage BMAD (méthode de travail). Config projet en français dans `_bmad/custom/config.toml`. |
| `Méthode d'exécution — Claude Code × Claude Design.md` | La méthode générale du projet (5 étapes) et le rôle de chaque outil. |

## 4. Commandes utiles

```bash
cd site
npm install          # une fois (Node ≥ 22.12)
npm run dev          # site en local sur http://localhost:4321
npm run build        # construit le site dans site/dist
npm run check        # vérification des types
npm run verif        # captures d'écran de chaque page (ordinateur + téléphone) dans site/.verif
node scripts/liens.mjs         # vérifie que chaque lien mène quelque part
node scripts/e2e-diagnostic.mjs # parcourt le diagnostic de bout en bout
```

## 5. Règles de contenu et de sécurité

- Les avis Immodvisor sont cités **tels quels**, jamais corrigés.
- Aucune photo ni témoignage ne part en ligne publique sans autorisation écrite (`autorisations:` dans la story).
- Aucun secret (clé, mot de passe) dans le dépôt. Les mots de passe ne sont jamais manipulés par Claude (AD-9).
- Les vidéos et photos HD restent hors Git ; ne pas les ajouter.
