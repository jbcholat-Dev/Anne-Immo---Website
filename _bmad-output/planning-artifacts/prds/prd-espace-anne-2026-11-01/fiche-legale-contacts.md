# Fiche légale : les contacts importés dans l'espace d'Anne

Une page, à valider par JB avant le premier import (question 5 du PRD). Préparée par Claude le 2026-11-01. Ce n'est pas un avis d'avocat : c'est la mise en forme des règles de la CNIL (l'autorité française des données personnelles) appliquées à ce cas.

## De quoi on parle
- Les contacts du téléphone d'Anne (export Samsung, 882 fiches) et son fichier « SUIVI PROSPECTION » (onglets EDB, Feuil1, CONTACTS, PARTENAIRES, PAP).
- Ils vont dans l'espace d'Anne (base Cloudflare, en Europe), visible seulement par Anne et JB.
- But : qu'Anne recontacte elle-même, une personne à la fois, les gens qu'elle connaît, pour prendre des nouvelles et parler de son métier.

## Sur quoi on s'appuie : l'intérêt légitime
Le RGPD permet de garder des coordonnées sans accord écrit quand on a un intérêt légitime et que cela ne surprend pas la personne. La pesée :
- **L'intérêt d'Anne** : développer son activité auprès de gens qu'elle connaît déjà.
- **Ce qu'attend la personne** : quelqu'un qui a donné son numéro à Anne, ou l'a rencontrée à une animation, s'attend à ce qu'elle le recontacte. Ce n'est pas le cas d'un inconnu : c'est pourquoi la PIGE (vendeurs d'annonces qu'Anne ne connaît pas) et la BAL Coudrée ne sont pas importées.
- **Les protections** : peu de champs, pas de revente ni de partage, effacement sur simple demande, purge automatique.

## Les règles qu'on applique
1. **Champs importés** : nom, prénom, téléphones, e-mails, ville, entreprise ; pour le fichier d'Anne, le projet et le commentaire. Jamais les adresses, dates de naissance, photos ni notes du téléphone.
2. **Information des personnes** : au premier message d'Anne, une phrase dit d'où vient le contact et comment ne plus être contacté (« Je vous écris parce que nous nous connaissons… dites-moi si vous préférez que je ne vous recontacte pas »). C'est l'information de l'article 14 du RGPD, faite au premier échange, comme la CNIL le permet.
3. **E-mails groupés** : seulement aux personnes qui ont coché la case (animations EDB), ou aux anciens clients, avec un lien de désinscription dans chaque e-mail.
4. **Appels** : permis d'office pour les proches, les anciens clients, les partenaires et les personnes qui ont fait une demande ; pas pour l'EDB ni les relations lointaines (décision de JB du 01/11). Une case « appel autorisé » permet de l'enlever pour quelqu'un.
5. **Opposition** : une personne qui demande à ne plus être contactée est écartée ; si elle demande l'effacement, elle est effacée et son numéro et son e-mail, chiffrés, sont gardés dans une liste d'opposition pour qu'un nouvel import ne la recrée pas.
6. **Durée** : un contact importé et jamais recontacté est effacé trois ans après l'import ; sinon trois ans après le dernier échange (règle déjà en place).
7. **Fichiers sources** : les copies de l'export du téléphone et du fichier Excel déposées dans le projet sont supprimées le jour de l'import.
8. **Registre** : une ligne est ajoutée au registre des traitements d'Anne (ou créée s'il n'existe pas) : « Carnet de contacts professionnels, base : intérêt légitime, durée : 3 ans, destinataires : Anne et JB, hébergement : Cloudflare (UE) ».

## Ce que Claude voit
Claude fait l'import depuis la conversation : il lit les fichiers pour préparer l'aperçu et les envoie à l'espace. Les fichiers passent donc par Anthropic, l'entreprise qui fait fonctionner Claude, comme toute pièce jointe d'une conversation. Une fois l'import fait, Claude n'a plus accès qu'à l'import, jamais à la lecture des contacts (règle de conduite inscrite dans l'architecture).

## Ajout du 2026-11-24 : Claude lit Leedflow, pour un temps (décision de JB)

JB a ouvert le 2026-11-24 l'API de Leedflow aux fils du projet Claude. Leedflow est le service qui résume les appels d'Anne. But : trier ce qui est arrivé depuis septembre et dire à Anne qui rappeler, tant que l'espace seul n'y suffit pas.

- **Ce que Claude lit** : les appels, les messages vocaux, les tâches et les contacts de Leedflow, avec leurs résumés et leurs transcriptions. Lecture seule : Claude ne change rien dans Leedflow.
- **Par où ça passe** : ces textes passent par Anthropic, comme toute pièce d'une conversation. Anthropic est donc destinataire, comme pour l'import des contacts.
- **Ce qui est gardé** : rien de durable. Les données relevées restent dans le dossier de travail du fil, effacé avec lui. Aucun nom, numéro ni e-mail n'est écrit dans la mémoire du projet, dans Notion, dans les tableaux de bord ni dans le dépôt.
- **Ce qui ne change pas** : la base de l'espace reste fermée à Claude.
- **Fin** : proposée au 2026-12-31, à confirmer par JB. Pour couper : JB supprime la clé de l'environnement cloud.

## Ajout proposé le 2026-11-24 : des textes traités par l'API Claude (à valider par JB)

JB a choisi le 2026-11-24 que l'espace trie lui-même les appels reçus par Leedflow, avec l'API Claude. L'API Claude est le service d'Anthropic qui permet à un programme d'interroger Claude. Cela ajoute un destinataire aux données : Anthropic, comme sous-traitant.

**Ce qui change**
- **Ce qui est envoyé** : le résumé d'un appel ou d'un message vocal, le sens de l'appel et sa durée. Plus tard, si JB le décide : la note d'une fiche, pour préparer un brouillon de message. Jamais le carnet entier, jamais la transcription complète ni l'enregistrement (AD-20).
- **Le moins possible** : le nom, le téléphone et l'e-mail du contact ne sont pas joints à l'envoi. Le résumé peut quand même citer un prénom ou une ville : c'est pour cela qu'Anthropic est noté comme destinataire.
- **Ce qui revient** : un classement et une proposition. Anne décide ; rien ne part et rien ne change d'étape sans elle.
- **Qui lit** : aucun fil du projet ne lit ces textes. L'envoi va de l'espace à l'API, avec une clé gardée en secret dans Cloudflare.
- **Chez Anthropic** : à vérifier par JB dans les conditions commerciales d'Anthropic avant la mise en service : pas d'entraînement des modèles sur les données de l'API, durée de conservation, lieu du traitement (États-Unis possible, donc clauses contractuelles types), accord de sous-traitance (DPA) accepté avec le compte.
- **Registre** : la ligne devient « destinataires : Anne et JB ; sous-traitants : Cloudflare (UE), Anthropic (tri et brouillons par IA) ».
- **Information des personnes** : la politique de confidentialité du site reçoit une phrase sur ce sous-traitant.

**Ce que JB valide**
- [ ] L'envoi des résumés d'appels à l'API Claude, dans les limites ci-dessus.
- [ ] Les points « Chez Anthropic » vérifiés.
- [ ] La nouvelle ligne du registre et la phrase de la politique de confidentialité.

## Ce que JB valide (validé par JB le 2026-11-02 à 10 h 26)
- [x] La base « intérêt légitime » et les règles 1 à 8.
- [x] La phrase d'information au premier message (à ajuster avec Anne).
- [x] La ligne du registre.
