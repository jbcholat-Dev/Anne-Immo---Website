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

## Ce que JB valide
- [ ] La base « intérêt légitime » et les règles 1 à 8.
- [ ] La phrase d'information au premier message (à ajuster avec Anne).
- [ ] La ligne du registre.
