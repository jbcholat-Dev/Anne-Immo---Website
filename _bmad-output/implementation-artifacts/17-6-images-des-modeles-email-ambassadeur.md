---
story: 17.6
epic: 17 — Programme ambassadeurs
statut: review
date: 2026-11-09
origine: demande de JB du 2026-11-09 (fil « [Com] Parrainage · modèles e-mail Outlook »), test d'envoi vers Gmail
---

# Story 17.6 — Images des modèles d'e-mail ambassadeur mises en ligne

## Objectif

Anne invite ses contacts au programme ambassadeur avec 3 modèles d'e-mail : « Bonjour Prénom » (vous), « Salut Prénom » (tu), « Bonjour Madame / Monsieur Nom » (vous). Dans Outlook classique, ce sont des papiers à lettres, images jointes. Le nouvel Outlook n'a pas de papier à lettres : Anne copie le modèle depuis une page et le colle. Au premier essai, les images étaient incluses dans la page (`data:`) : le nouvel Outlook les envoie telles quelles et Gmail ne les affiche pas (capture de JB du 2026-11-09). Les images doivent donc avoir une adresse publique.

## Ce qui est fait

- `site/public/emails/ambassadeur/` : `bandeau.jpg` (bandeau d'Anne, 1200 × 300), `programme-vous.png` et `programme-tu.png` (bloc bleu « Devenir ambassadeur », 1136 × 906, vouvoiement et tutoiement). Fichiers fixes, aucune page ni code changé.
- Adresses : `https://annevialtissot.fr/emails/ambassadeur/<fichier>`. La page à copier (bibliothèque du projet, `parrainage/outlook-nouveau/modeles-email-ambassadeur.html`) les appelle. Le bloc bleu mène à `/ambassadeurs?c=email`.
- Écart assumé (`site/README.md`) : les messageries comme Outlook peuvent masquer ces images jusqu'au clic « Télécharger les images » ; le texte de remplacement décrit le bloc, et le lien texte vers la page reste dans l'e-mail.

## Ce qui est vérifié

2026-11-09, en local : `npm run build` au vert, les 3 fichiers sont dans `dist/client/emails/ambassadeur/` ; `npm run check` : 0 erreur ; `node scripts/liens.mjs` : 32 pages, 2 331 liens, 0 cassé. `npm run verif` et `ecrans.mjs` non concernés (aucune page changée).

Page à copier (bibliothèque du projet, hors dépôt) : les 3 boutons « Copier ce modèle » testés dans Chromium, le contenu copié garde les 2 images et le lien `/ambassadeurs?c=email`.

Après fusion : les 3 adresses répondent 200, puis envoi d'essai vers Gmail par JB.

## Revue de code

2026-11-09, PR #255, commit c14a9cb, relu en session neuve (`bmad-code-review`). Vérifié sans défaut : `/emails/*` est servi comme fichier fixe (hors `run_worker_first`), hors Access, aucun en-tête de `_headers` ne gêne le relais d'images de Gmail, poids raisonnables, scripts de vérification non touchés.

1. Fichiers sans utilisateur dans le site, donc à risque d'être supprimés au ménage : corrigé, règle « ne jamais renommer ni supprimer » et emplacement de la page à copier notés dans `site/README.md`.
2. Story sans vérifications ni section « Revue de code » : corrigé (cette section et la précédente).
3. Gmail garde les images en cache : écarté, l'ordre est déjà prévu (adresses en 200, puis essai) et un changement d'image prendra un nouveau nom (constat 1).
4. Texte du bouton dans l'image seulement : écarté pour l'instant, écart déjà noté ; un bouton HTML est possible plus tard.
5. PNG allégeables : écarté, 80 Ko suffisent.

## Ce qui reste

- Fusion par JB, puis essai d'envoi vers Gmail depuis le nouvel Outlook d'Anne.
