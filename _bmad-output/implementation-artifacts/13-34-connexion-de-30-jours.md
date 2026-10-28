---
story: 13.34
epic: 13 — Espace de travail d'Anne
statut: done
date: 2026-10-28
maj: 2026-10-28
---

# Story 13.34 — Connexion à l'espace valable 30 jours

## Objectif
JB, le 2026-10-28 : « C'est un peu chiant à chaque fois de devoir récupérer le code sur la boîte mail. » Cloudflare Access (le portier de l'espace) demandait un code par e-mail toutes les 24 h, sur chaque appareil. Trouver l'entrée la plus simple sans affaiblir la protection des contacts.

## Décision (JB, 2026-10-28, carte de décision du fil « [Site] Simplifier la connexion à l'espace »)
Garder le code par e-mail, mais faire durer la connexion **30 jours** (au lieu de 24 h) sur l'espace et sur `/gestion`. Options écartées : bouton « Se connecter avec Google » (≈ 20 min de réglage pour JB dans la console Google et un droit de plus sur le jeton d'API ; à reprendre si un code par mois reste pénible) ; ne rien changer.
Ce qu'on accepte : un appareil volé et déverrouillé ouvre l'espace jusqu'à 30 jours. Parade : couper toutes les connexions (RUNBOOK § 4 sexies).

## Ce qui est fait (2026-10-28, par Claude avec le jeton d'API et l'accord de JB)
- Application Access `espace` (`espace.annevialtissot.fr`) : durée de session 24 h → 720 h. Règles inchangées : « Anne et JB » (priorité 1) et « Claude espace (badge) » (priorité 2).
- Application Access `Gestion` (`annevialtissot.fr/gestion`, `/api/gestion`) : 24 h → 720 h, règle « Anne et JB » inchangée.
- Non modifiées : l'application de l'adresse `workers.dev` du site (24 h) et celle du webhook Cal.com.
- Aucun changement de code.

## Ce qui est vérifié (2026-10-28)
- L'API renvoie `session_duration: 720h` et les mêmes règles pour les deux applications.
- Sans connexion, `espace.annevialtissot.fr` et `annevialtissot.fr/gestion` renvoient toujours vers la page de code (302 vers `dry-truth-5a0d.cloudflareaccess.com`).
- Le badge de Claude marche toujours : `node espace/scripts/claude-espace.mjs actions` répond.

## Ce qui reste
- Constat par JB et Anne : après le prochain code, plus de code demandé pendant 30 jours sur le même navigateur. Les connexions ouvertes avant le changement gardent leur fin à 24 h.
