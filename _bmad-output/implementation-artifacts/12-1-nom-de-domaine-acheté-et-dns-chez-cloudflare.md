---
story: 12.1
epic: 12 — Lancement public
statut: in-progress
date: 2026-10-05
---

# Story 12.1 — Nom de domaine acheté et DNS chez Cloudflare

## Objectif
Réserver l'adresse définitive du site (`annevialtissot.fr`, plus `annevialtissot.com` en redirection) au nom d'Anne, et confier son annuaire (DNS, le service qui dit à Internet où trouver le site et porte les réglages d'e-mail) à Cloudflare, sans encore brancher le site dessus.

## Ce qui est fait (2026-10-05, par JB)
- Achat chez Infomaniak des deux domaines, depuis le compte Infomaniak de JB. 17,52 € TTC la première année pour les deux ; expiration le 2027-10-05. Option « Domain Plus » (DNS Fast Anycast, Domain Privacy) non prise.
- Fiche du registre (Whois) : **propriétaire Anne VIAL-TISSOT**, son adresse e-mail vérifiée (Anne a validé le changement de fiche) ; contact administrateur JB ; contact technique Infomaniak (masqué).
- Les deux domaines ajoutés dans le compte Cloudflare (plan gratuit) ; serveurs de noms `camilo.ns.cloudflare.com` et `elly.ns.cloudflare.com` posés chez Infomaniak ; Cloudflare les donne actifs.
- Décision journalisée : AD-9 amendé le 2026-10-05 (spine d'architecture et `.memlog.md`), RUNBOOK § 1 et § 4 ter.

## Ce qui est vérifié
- Statut « actif » des deux domaines dans Cloudflare, constaté par JB (rapporté le 2026-10-05).
- Non vérifié ici : résolution DNS publique depuis un poste extérieur (à constater au moment de brancher le site, story 12.4).

## Ce qui reste
- Activer DNSSEC (signature de l'annuaire contre la falsification) dans Cloudflare, puis poser l'enregistrement DS qu'il fournit chez Infomaniak, pour chaque domaine.
- Activer la validation en deux étapes sur le compte Infomaniak de JB.
- Renouvellement automatique à vérifier chez Infomaniak (échéance 2027-10-05).
- Les enregistrements d'e-mail (SPF, DKIM, DMARC pour Resend) viennent avec la story 10.3 ; le branchement du site avec la story 12.4.

## Écart assumé
Compte Infomaniak de JB au lieu d'un compte au nom d'Anne (AD-9 amendé) : Anne reste propriétaire légale des domaines ; la reprise de la gestion est décrite au RUNBOOK § 4 ter.
