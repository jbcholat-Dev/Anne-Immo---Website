---
commune:
type_bien:            # Maison, Appartement, Chalet, Terrain…
annee_vente:
delai_vente:          # de la mise en vente à l'offre acceptée, ex. « 3 mois »
particularite:        # ce qui rendait cette vente difficile ou intéressante, une ligne
photo_principale:     # choisie dans l'espace d'édition (/admin) : chemin dans le dossier de la story, ex. "photos/sejour.webp" ; ancien circuit : numéro de la photo HD, ex. "047"
photos: []            # 4 à 6 autres, même règle — une verticale si tu en as, sinon le site recadre
temoignages:          # jusqu'à deux : le vendeur (ton client) et l'acheteur. Un seul suffit pour publier ; les deux, c'est l'idéal. Supprime le bloc que tu n'as pas.
  - role: vendeur
    prenom:
    contexte:         # ex. « couple, maison familiale, départ à la retraite »
    citation: >
      (ses mots, 2 à 5 lignes — son avis Immodvisor convient très bien)
    portrait:         # facultatif, nom du fichier
  - role: acheteur
    prenom:
    contexte:         # ex. « couple, premier achat, frontaliers »
    citation: >
      (ses mots, 2 à 5 lignes)
    portrait:
statut: brouillon     # brouillon | a-relire | publie
autorisations: false  # true quand le vendeur (photos) ET chaque personne citée ont donné leur accord écrit
---

(Ton récit, à la première personne, 10 à 15 lignes : ce qu'il y avait à résoudre, ce que tu as fait, ce qui s'est passé. Comme tu le raconterais à une amie. Pas de prix.)
