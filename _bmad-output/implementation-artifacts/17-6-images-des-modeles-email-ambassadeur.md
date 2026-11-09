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

Voir la PR : `npm run build` (fichiers copiés dans `dist/emails/ambassadeur/`). Après fusion : les 3 adresses répondent 200, puis envoi d'essai vers Gmail par JB.

## Ce qui reste

- Fusion par JB, puis essai d'envoi vers Gmail depuis le nouvel Outlook d'Anne.
