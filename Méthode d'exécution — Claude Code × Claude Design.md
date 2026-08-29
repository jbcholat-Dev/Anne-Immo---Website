# Méthode d'exécution — Site web Anne (Claude Code × Claude Design)

> Réponse à la question « comment avancer à partir de là » (blocage identifié dans le projet Notion). Basée sur la doc officielle Anthropic (août 2026), vérifiée de première main dans la session Claude Code du projet. Statut des outils : **Claude Design et le skill `/design` sont en bêta/research preview** — comportements susceptibles d'évoluer.
> Rédigé le 2026-08-29.
>
> **Addendum 2026-08-29** : BMAD (méthode agile, module `bmm`, installé en skills Claude Code dans `Website/_bmad`) prend le relais sur les étapes **① spec**, **④ architecture** et **⑤ build**. Claude Design reste la surface des étapes **② design system** et **③ maquette**. Le déroulé ci-dessous reste la référence pour le contenu de chaque étape ; seul l'outil qui la porte change (repéré par le tag à côté du titre).

## Les trois surfaces et leur rôle

| Surface | Rôle | Qui y travaille |
|---|---|---|
| **Notion** (projet `[Anne] — Stratégie digitale & site web`) | Le **cadre business** : pourquoi, état, journal, tâches, décisions. Ne change pas — tu continues comme aujourd'hui. | JB |
| **Claude Code** (sessions dans `Anne Immo/`) | Le **moteur d'exécution** : contexte complet du projet (CLAUDE.md, charte), rédaction de la spec, génération des maquettes, synchronisation de la charte vers Claude Design, décisions d'architecture, code, déploiement. | JB + Claude |
| **Claude Design** (claude.ai/design + canvases) | La **surface visuelle** : exploration et retouche des maquettes en WYSIWYG. C'est là qu'**Anne** interagit — clic sur un élément, édition directe, commentaires — sans rien de technique. | Anne + JB |

Le lien entre les deux dernières est officiel et **bidirectionnel** (« round-trip ») : un design commencé dans Claude Code se retouche dans Claude Design et revient, et inversement.

## La séquence recommandée

### Étape 1 — Spec fonctionnelle courte (BMAD) — ~1 session
La réponse à « spec d'abord ou prototype d'abord ? » : **spec d'abord, mais courte** — elle est déjà aux deux tiers dans ta note Notion du 29/08 (3 axes validés, 2 parcours de conversion, vitrine écartée). Portée par le skill BMAD `bmad-spec` (ou `bmad-agent-pm`/`bmad-create-prd` si un PRD plus complet s'avère nécessaire) : mode interview, Claude te pose les questions jusqu'à couvrir tout le périmètre, puis écrit `Website/SPEC.md`.

Ce qui doit sortir de l'interview (les trous actuels) :
- Arborescence et contenu page par page (home, méthode/Système 360, témoignages, diagnostic, contact, mentions légales).
- Le sort du **diagnostic** : les 3 scénarios à specifier pour pouvoir trancher en étape 4 (garder ScoreApp tel quel via lien/embed · garder ScoreApp mais landing rebrandée · recréer en natif).
- Où vont les leads (email ? Modelo ? tableur ?) et qui déclenche la newsletter.
- Langues (FR seul au lancement ou FR/EN ?), nom de domaine, mentions réglementaires (carte T/CCI, RGPD du formulaire).
- Critères d'acceptation (« le site est fini quand… »).

La spec vit dans le repo (`Website/SPEC.md`) — c'est elle que les outils consomment ; le projet Notion garde le résumé et le journal.

### Étape 2 — Pousser la charte dans Claude Design (une fois) — ~1 h
Deux voies, cumulables :
- **Voie fidèle (recommandée)** : depuis Claude Code, je construis le **design system « Anne VIAL-TISSOT »** à partir de la Charte v1 (tokens de couleurs, typos, cartes de composants : logo, boutons pilule, cartes galet, encarts brume, séparateur horizon) et je le pousse via l'outil **DesignSync** dans un projet *Design System* de ton compte claude.ai/design. Tu actives ensuite « **Published** » pour qu'il devienne le défaut.
- **Voie simple** : dans claude.ai/design, uploader la charte (le .md exporté en PDF + les 6 SVG) — Claude Design extrait couleurs/typos/composants automatiquement et génère un UI kit ; « Remix » pour affiner.

Résultat dans les deux cas : **tout ce qui sera généré dans Claude Design respecte la charte automatiquement** — l'outil vérifie ses sorties contre le design system avant de te les montrer. C'est LA réponse à « comment j'utilise les éléments qu'on a définis ».

### Étape 3 — Maquette (Claude Design) — itératif, avec Anne
Deux points d'entrée équivalents, choisis selon le confort :
- **Depuis Claude Code** (`/design` avec la spec en brief) : je publie un **canvas d'artboards** (home + 1-2 pages clés, 3 variantes de home). Anne et toi éditez en direct dans la page (clic-sélection, panneau de propriétés, texte inline, undo/redo) ; **Save republie** et ma session est notifiée pour fusionner et itérer. Les commentaires servent pour tout ce qui n'est pas éditable à la main.
- **Dans claude.ai/design** : exploration plus large (demander 10 options puis « remix », prototypes interactifs, capture d'éléments de sites existants comme référence). Grâce à l'étape 2, tout reste dans la charte.

Bonnes pratiques officielles : partir **wireframe/basse fidélité** tant que la structure n'est pas validée · demander des **variantes multiples** puis remixer · faire le **dernier kilomètre à la main** (l'édition manuelle ne consomme pas de quota, contrairement aux prompts).

### Étape 4 — Décisions d'architecture (BMAD) — 1 session
C'est la maquette validée qui permet de trancher, pas l'inverse. Une fois le design approuvé par Anne — portée par le skill BMAD `bmad-architecture` :
- **Diagnostic** : ScoreApp gardé (rapide, mais placeholders EN et booking cassé à corriger dans leur éditeur) vs recréé en natif (contrôle total, mais scoring + capture + RGPD à construire). La maquette montre ce que le parcours doit être — on choisit ce qui sait le faire.
- **Stack & hébergement** — la règle documentée : un site **statique** (vitrine + liens) s'exporte de Claude Design et se déploie en quelques clics (Vercel Drop) ; dès qu'il y a **formulaires fonctionnels / scorecard / collecte de leads**, le chemin obligé est **handoff → Claude Code → GitHub → Vercel**. Ton site a 2 parcours de conversion → tu es dans le second cas.
- **Leads & newsletter** : outil d'emailing, lien éventuel Modelo, stockage des contacts.
- **Go/no-go interne vs prestataire** : à ce stade tu as spec + maquette validée + architecture — soit le dossier béton pour un prestataire (et les devis 7-10 k€ deviennent comparables), soit le point de départ direct du build interne. C'est l'arbitrage prévu depuis le cadrage du 17/08, mais pris avec toutes les cartes.

### Étape 5 — Build & déploiement (BMAD, si interne)
Implémentation depuis l'artboard validé (handoff bundle), avec vérification systématique (captures comparées à la maquette), repo GitHub, déploiement Vercel, branchement du diagnostic et de la capture de leads selon l'architecture choisie. Portée par le skill BMAD `bmad-build` (boucle `bmad-build-auto` pour l'exécution non-supervisée d'itérations).

## Points de vigilance

- **Bêta** : `/design` (research preview d'août 2026) et Claude Design évoluent vite — si un comportement décrit ici a changé, le constater en pratique prime sur ce document.
- **Quota partagé** : Claude Design consomme le même quota que Chat/Claude Code. Depuis juin 2026 la consommation par tour a été réduite et l'édition manuelle est gratuite — mais les sessions d'exploration générative se pilotent (variantes ciblées plutôt que régénérations en boucle).
- **Pas d'export Figma/PNG natif** depuis Claude Design (HTML/ZIP/PDF/PPTX + partenaires dont Vercel et Gamma). Pour ce projet : sans importance, le flux reste dans l'écosystème Claude.
- **Deux sources de vérité à ne pas confondre** : le canvas/maquette (visuel d'approbation, vit en artifact) et le code (vit dans le repo). Après le build, une retouche se fait dans le code, pas dans la vieille maquette.

## Prochaine action

**Étape 1 : l'interview de spec** — une session Claude Code (~30-45 min de questions-réponses), sortie `Website/SPEC.md`. Les étapes 2 et 3 peuvent s'enchaîner dans la foulée.
