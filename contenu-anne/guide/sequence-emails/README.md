# Séquence d'e-mails de la sortie B — brouillon à relire

> **Ce que c'est.** Les e-mails que le site enverra tout seul, à quelques jours d'intervalle, aux vendeurs qui ont fait le diagnostic sans demander de rendez-vous (la « sortie B »). Chaque dossier `etape-N/` contient un e-mail, dans `fr.md`.
>
> **D'où vient le texte.** C'est la base écrite fin 2025 dans Notion (« [Marketing] – Lead Magnets et Séquence Email – 2025-10-23 »), recopiée le 2026-10-04 sans réécriture, sauf les retraits listés plus bas. Tous les fichiers sont en `statut: brouillon`.
>
> **Ce qu'on attend de toi** : relire chaque e-mail, corriger directement dans son `fr.md`, répondre aux points ci-dessous, puis passer `statut: a-relire`. Tu décides du nombre d'e-mails et des jours d'envoi (champ `delai_jours`) : tu peux supprimer un dossier ou en ajouter un.

## Règles (story 7.10)

- Une idée par e-mail, un exemple réel du Chablais, une chose à faire.
- **Pas de tarif.**
- Chaque « cas réel » doit être une de tes ventes, présente dans le registre `stories/_suivi-stories.md`. S'il existe une story publiée sur cette vente, l'e-mail y renverra.
- Aucun chiffre ni aucune offre de 2025 périmés.
- Ne rien promettre que le site ne fait pas (par exemple pas d'estimation en ligne).

## Retiré du brouillon de 2025

- **E-mail du 15e jour (`etape-6`)** : les trois témoignages « Marc D., Évian », « Sophie L., Thonon », « Laurent P., Armoy » ne correspondent à aucun de tes 18 avis Immodvisor. Une règle du projet (D-9) n'admet comme preuve qu'une vente réelle ou un avis vérifiable. Si ce sont de vrais clients, il faut leur accord écrit, et on les remet.
- **Même e-mail** : le paragraphe « Investissement » (honoraires de 5 %, forfait au-delà de 600 K€) et la « valeur : 200 € » de l'audit, à cause de la règle « pas de tarif ».

Le texte original reste intact dans Notion.

## Passe du 2026-10-10 : chiffres et cas inventés retirés (demande de JB)

JB a constaté que la séquence contenait des chiffres sans source et des « cas réels » inventés. Claude a repris les e-mails 1 à 6 (ceux que le site envoie) et les a passés en `a-relire` :

- **Cas inventés remplacés par de vraies ventes publiées sur le site**, racontées comme dans leur story, avec le lien : Anthy-sur-Léman T3 (photos, e-mail 1), Essert-Romand (prix, e-mail 2), Morzine (dossier administratif, e-mail 4). L'e-mail 3 (visites) n'a pas de vente réelle qui l'illustre : il n'a plus de cas.
- **Chiffres sans source retirés** : 250 à 300 annonces par jour, 3 secondes par annonce, 80 % des vendeurs, 70 % de visiteurs non qualifiés, 30 % de promesses qui échouent, « top 10 % », 30 à 40 heures gagnées, budgets de photographe et de diagnostics, objet « l'erreur à 50 000 € ».
- **Promesses retirées** : « vous signez dans 60-90 jours », « diffusion sur 10+ plateformes », « Pack Mise en Marché Premium » (nom d'offre non confirmé), offre limitée à 7 jours, checklist 25 points et PDF du script (inexistants).
- **Liens** : les `[lien]` (qui seraient partis tels quels, le site ne les remplace pas) sont devenus de vraies adresses : `/contact` pour le rendez-vous, `/realisation/…` pour les ventes.
- **Faits vérifiés** : DPE antérieurs au 1er juillet 2021 plus valables depuis le 1er janvier 2025 ; électricité et gaz valables 3 ans à la vente ; PV des AG des 3 dernières années demandés en copropriété ; données DVF publiques sur 5 ans.
- `etape-0` (e-mail des résultats) n'est pas envoyé par la séquence (`src/server/sequence.ts` l'ignore) : non repris.

**Reste à Anne** : relire, corriger si besoin, puis passer chaque e-mail en `publie`. Si une autre de ses ventes illustre mieux l'e-mail 3 (visites filtrées), l'ajouter.

## Et ensuite

Quand tu as fini, Claude branche ces fichiers sur le site (les libellés « séquence de 7 e-mails » de la page de résultats suivront le nombre réel ; le site annonce aussi « le premier arrive demain matin », alors que le premier e-mail de la suite part à J+2). L'envoi automatique lui-même arrive avec le serveur du site (epic 10). La version anglaise viendra après.
