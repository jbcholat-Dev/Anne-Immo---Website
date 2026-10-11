---
story: 15.1
epic: 15 — Portail des vendeurs sous mandat
statut: in-progress
date: 2026-10-11
origine: idée de JB du 2026-10-11 (fil « Portail vendeurs et espace acheteurs »)
---

# Story 15.1 — Session de cadrage du portail vendeurs

## Objectif
Décider ce qu'un vendeur sous mandat voit de sa vente, comment il entre, et ce que Claude y écrit, avant toute construction.

## L'idée de JB (2026-10-11)
Une fois le mandat signé, le client a un portail dédié : avancement, personnes venues en visite, où on en est, peut-être des informations de marché. Un espace où l'API Claude peut servir.

## Ce qui est proposé (Claude, à valider par JB)
- **Le portail ne crée pas de données** : il montre ce qu'Anne note déjà dans son espace de travail (epic 13) : étape du parcours vendeur, événements, prochaine action. Une visite devient un événement de la fiche, avec un retour.
- **Une seule application « espace client »** pour les vendeurs (epic 15) et les acheteurs (epic 16), séparée du site et de l'espace d'Anne, sur la même base (même raisonnement qu'AD-19 : une mise en ligne de l'un ne touche pas les autres, et l'espace d'Anne reste fermé au public).
- **Connexion par code reçu par e-mail**, ouverte seulement aux contacts au stade « Mandat exclusif signé » ou après. Option à vérifier : Cloudflare Access sait déjà le faire pour une liste d'adresses (gratuit jusqu'à 50 personnes, non vérifié pour notre compte).
- **Claude écrit, Anne valide** : un point hebdomadaire rédigé à partir des notes de visite et de l'avancement, envoyé seulement après l'accord d'Anne (règle d'AD-20 : rien ne part sans elle). Informations de marché : ventes réelles de la commune tirées des données publiques DVF (les prix de vente déclarés aux impôts, en libre accès), résumées par Claude. Proposé, non vérifié.
- **Visiteurs montrés sans leur nom** (profil et retour, pas d'identité), parce que les acheteurs n'ont pas accepté d'être nommés auprès du vendeur (RGPD).

## Questions posées à JB (2026-10-11)
1. Nom des visiteurs visible par le vendeur ? Recommandation : non.
2. Textes de Claude relus par Anne avant envoi ? Recommandation : oui.
3. Une seule application pour vendeurs et acheteurs ? Recommandation : oui.
4. Pour Anne : comment tient-elle ses vendeurs au courant aujourd'hui, et le réseau eXp a-t-il des règles sur un tel portail ?

## Réponses de JB (2026-10-11, 09:29)
1. Nom des visiteurs : **non**, le vendeur voit un profil et un retour.
2. Textes de Claude : **relus par Anne** avant envoi (« on ne veut pas envoyer n'importe quoi »).
3. **Une seule application** « espace client » pour vendeurs et acheteurs.
4. Pas de règle eXp particulière. Aujourd'hui, Anne tient ses vendeurs au courant surtout par téléphone et lors des visites : le portail ne remplace rien, il s'ajoute.

## Ce qui est fait
- Epic 15 et story 15.1 ajoutées à `_bmad-output/planning-artifacts/epics.md` et au statut de sprint ; idée et questions journalisées dans `.memlog.md` de la spec.

## Vérification
Documents seulement, aucun changement du site : pas de construction ni de captures à faire.

## Ce qui reste
- Capacité dans la spec, AD dans le spine, découpage des stories.
- Démarrage de la construction après le lancement (12.4) et les stories 13.4 à 13.6.
