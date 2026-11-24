# Story 18.26 : brief du jour

- Epic : 18 (carnet de contacts). Statut : review.
- Demande : JB, 2026-11-24, même demande que la story 18.25 (« une première passe pour que je me rende compte à quoi ça pourrait ressembler »). Fiche de poste du chief of staff (https://claude.ai/artifact/RMp2hF6EJvmt6z45MoQS9f, sections 4, 5, 6 et 8 étape 5). Maquette : https://claude.ai/artifact/GqtZLm44EFHJDVWmJiYd2e, section 1.
- Décision : AD-37 (spine d'architecture de l'espace).

## Objectif

Anne commence sa journée par 3 à 5 décisions, 7 au plus, en tête de l'espace. Chaque ligne dit qui, pourquoi en une phrase, et l'action proposée, avec Accepter, Plus tard, Écarter. La part acceptée est comptée. Phase 1 : un brouillon que JB est seul à voir.

## Ce qui est fait

- Migration `0028-brief-du-jour.sql` : table `brief_ligne` (jour, rang, source, qui, raison, action, lien, décision).
- `espace/src/server/brief.ts` :
  - trois sources, sans appel à l'API : les demandes du site et des portails pas encore vues ; les cartes classées vendeur, acheteur ou partenaire par le tri 18.25 ; les contacts suivis dont la prochaine action est due ou en retard. Jamais un proche ni un numéro classé ;
  - ordre : demandes, puis appels triés dus aujourd'hui, puis relances en retard, puis le reste par date ; 5 lignes, jusqu'à 7 si les suivantes sont dues ;
  - « qui » = prénom et initiale du nom (« Sam R. »), ou le numéro et le classement pour un appel trié ;
  - préparé une fois par jour, à 7 h 30 (heure de Paris) par la tâche planifiée, ou par le bouton « Préparer maintenant » ;
  - Accepter note la décision et ouvre la fiche (ou la barre « Nouveaux ») : rien n'est écrit sur la fiche. Plus tard : la ligne revient demain si elle est toujours due. Écarter : plus proposée pendant 7 jours. Annuler, le jour même ;
  - part acceptée sur 4 semaines, affichée dans l'en-tête ;
  - ménage : lignes de plus de 90 jours effacées.
- `espace/src/pages/api/brief.ts` et `espace/src/islands/brief.ts` : les boutons, sans recharger la page.
- `espace/src/pages/index.astro` : le bloc, au-dessus de la barre « Nouveaux », avec la pastille « Brouillon · visible par JB seul ».
- Réglage `BRIEF_LECTEURS` (public, `espace/wrangler.jsonc`) : l'empreinte SHA-256 de l'adresse de JB, pas l'adresse (le dépôt est public). Anne ne voit rien, et l'API lui répond 403.
- Documents : AD-37 (spine), `espace/README.md`, RUNBOOK § 4 sexies.

## Écarts assumés

- `TODO(backend)` phase 2 : l'e-mail du matin à Anne (7 h 30, lundi au samedi, prénom et action seulement) n'est pas construit. Il viendra après validation du brouillon par JB (fiche § 6).
- Le brief ne propose pas encore les rendez-vous du jour ni les réveils : seulement les trois sources ci-dessus.
- Un brief préparé tôt n'est pas recalculé dans la journée : une demande arrivée à 10 h attend le lendemain (elle est dans « Nouveaux »).
- Pas d'e-mail ni de rédaction par l'API dans le brief : les raisons viennent du tri (18.25) ou de la fiche.

## Ce qui est vérifié

- `espace` : `npm run build` et `npm run check` : 0 erreur (2026-11-24).
- `node scripts/e2e-tri-et-brief.mjs` (2026-11-24, refait après les corrections), partie 18.26 : 18 constats bons sur 18 (sources, ordre, accès réservé, décisions, annulation, lendemain).
- Captures : `espace/.verif/tri-ia/brief-ordinateur.png`, `brief-telephone.png`.

## Revue de code

2026-11-24, skill `bmad-code-review` en session neuve, PR n° 274, commit 252ebcf relu (18.25 et 18.26 ensemble).

- Un numéro rangé comme autre numéro d'un proche restait dans le brief : corrigé (7960005), `contact_coordonnee` exclu comme pour le tri et les cartes.
- `qui` gardait le numéro ou l'e-mail en clair : corrigé (7960005), masqué (« 06 •• •• •• 78 »).
- Relance due comparée au jour UTC : corrigé (7960005), jour de Paris.
- Carte choisie au hasard pour un numéro à plusieurs cartes : corrigé (7960005), la plus récente.
- Lien de redirection `//…` accepté par l'îlot : corrigé (7960005).
- Heure « 24:xx » possible : corrigé (7960005), `hourCycle: 'h23'`.
- Empreinte d'adresse devinable : écarté, elle ne donne aucun accès (Cloudflare Access garde l'espace).
- Deux préparations en même temps : écarté, les contraintes d'unicité bornent à 7 lignes sans doublon.

Allègement (JB, 2026-11-24, « l'espace est déjà surchargé ») : le bandeau d'aide sous le brief est retiré ; il ne sert plus qu'aux messages après un geste.

## Ce qui reste

- JB : regarder le brouillon pendant 2 semaines (phase 1), corriger les règles.
- Phase 2 : e-mail du matin, validé par JB d'un clic avant 8 h 30 (fiche § 6).
