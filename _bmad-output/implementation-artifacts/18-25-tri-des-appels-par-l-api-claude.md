# Story 18.25 : tri des appels par l'API Claude

- Epic : 18 (carnet de contacts). Statut : review.
- Demande : JB, 2026-11-24, « C'est validé. Là, j'aimerais que tu fasses une première passe pour que je me rende compte à quoi ça pourrait ressembler. » Fiche de poste du chief of staff (https://claude.ai/artifact/RMp2hF6EJvmt6z45MoQS9f, sections 4, 5, 7, 8 étape 4), choix « tri dans l'espace, avec l'API Claude ». Maquette : https://claude.ai/artifact/GqtZLm44EFHJDVWmJiYd2e. Part de la story 18.24 (tri par règles).
- Décision : AD-37 (spine d'architecture de l'espace).

## Objectif

Anne a 95 cartes dans « Nouveaux ». Les règles de 18.24 rangent le bruit. Pour chaque carte restante d'un numéro inconnu, l'API Claude propose un classement, une action datée et une raison en une phrase. Les réponses de « Qualifier » que les résumés donnent déjà sont cochées d'avance. Anne décide toujours d'un geste.

## Ce qui est fait

- Migration `0027-tri-ia.sql` : table `tri_ia`, une ligne par numéro (classement, action, échéance, raison, parcours, réponses de « Qualifier », empreinte du texte envoyé, essais, erreur).
- `espace/src/server/tri-ia.ts` : `trierNouveaux`, lancé après chaque relève Leedflow (`worker.ts`, toutes les 10 minutes), 10 numéros au plus par passage.
  - Envoyé : le genre, la date, le titre et le résumé de chaque échange (6 au plus, 1 500 caractères chacun). Le nom, le prénom et l'e-mail connus de Leedflow sont retirés du texte, puis tout ce qui ressemble à un téléphone ou à un e-mail. Jamais le numéro, la transcription complète ni l'enregistrement.
  - Exclus par le code : numéros classés (privé, pro, démarchage), numéros d'un contact du carnet (les proches), cartes rangées par 18.24, numéros sans résumé.
  - Modèle `claude-opus-5-5`, effort bas, réponse au format JSON imposé (schéma), puis contrôlée par le code : un classement ou une réponse hors liste rejette toute la proposition. Repli côté serveur si le modèle décline (`fallbacks: "default"`).
  - Un même texte n'est pas renvoyé. Une panne (réseau, surcharge, limite, erreur du service) ne compte pas comme un essai et arrête le passage. Un refus ou une réponse hors format compte : 3 essais au plus par texte.
  - Journal : des nombres seulement (`tri_ia`, `tri_ia_panne`).
  - Ménage : une proposition de plus de 30 jours sans carte ouverte est effacée.
- `espace/src/server/tri-ia-consignes.ts` : les consignes envoyées à l'API, en français, **à relire par JB**.
- `espace/src/server/nouveaux.ts`, `espace/src/islands/nouveaux.ts`, `espace/src/pages/index.astro` : la carte montre « Proposition · Vendeur », l'action, l'échéance et la raison. Rien n'est appliqué.
- `espace/src/pages/contacts/qualifier.astro` : pour un contact pas encore qualifié, les réponses proposées sont cochées d'avance, avec la ligne « N réponses cochées d'avance d'après les résumés des appels : vérifiez-les pendant l'appel ». Rien n'est enregistré avant la validation d'Anne.
- Dépendance : `@anthropic-ai/sdk` (le kit officiel d'Anthropic pour appeler l'API).
- Réglages : `TRI_IA` (public, `espace/wrangler.jsonc`) vaut `""` : **le tri est éteint**. Secret `ANTHROPIC_API_KEY` déjà posé par JB. `ANTHROPIC_URL` sert seulement à l'essai.
- Documents : AD-37 (spine), `espace/README.md`, RUNBOOK § 4 sexies et journal.

## Écarts assumés

- Les noms cités dans un résumé sans être connus de Leedflow (« sa voisine Paulette ») ne sont pas retirés : seuls les noms de la fiche Leedflow le sont. Le classement des risques est dans la fiche légale (section « textes traités par l'API Claude »).
- Une carte trop vieille pour être relue (au-delà de 300 cartes ouvertes) n'est pas triée.
- Le tri ne tourne que pour les numéros inconnus. Les demandes du site et des portails sont déjà classées par leur nature.
- Le vrai modèle n'a pas été appelé : l'essai passe par une imitation de l'API. Le premier appel réel se fera à l'allumage (`TRI_IA = "oui"`), avec l'accord de JB.

## Ce qui est vérifié

- `espace` : `npm run build` et `npm run check` : 0 erreur (2026-11-24).
- `node scripts/e2e-tri-et-brief.mjs` (2026-11-24), partie 18.25 : 21 constats bons sur 21 (fuites, exclusions, essais, pannes, affichage, Qualifier prérempli).
- Captures : `espace/.verif/tri-ia/carte-vendeur.png`, `nouveaux-ordinateur.png`, `qualifier-prerempli.png`.

## Revue de code

2026-11-24, skill `bmad-code-review` en session neuve, PR n° 274, commit 252ebcf relu (18.25 et 18.26 ensemble).

- Crédit coupé ou clé refusée comptés comme essais, tri bloqué pour de bon : corrigé (7960005), toute erreur de l'API est une panne.
- Proposition et brief gardés après l'effacement d'un contact ou le classement Privé/Démarchage : corrigé (7960005), `rights.ts` et `nettoyerIgnores` effacent `tri_ia` et `brief_ligne` ; ajoutés au droit d'accès.
- Dates et prix masqués comme des téléphones : corrigé (7960005), 9 chiffres au moins, ni date ni montant.
- Ancienne proposition montrée après un nouvel échec sur un texte nouveau : corrigé (7960005), effacée.
- Échéance impossible (30 février) acceptée : corrigé (7960005).
- Modèle noté au lieu de celui qui a répondu : corrigé (7960005).
- Noms cités dans un résumé non masqués : écarté, écart déjà assumé dans cette story.
- Passages qui se chevauchent : écarté, 10 appels au plus, délai de 60 s, arrêt à la première panne.
- Import circulaire `nouveaux.ts` / `tri-ia.ts` : écarté, symboles lus seulement dans les fonctions.

## Ce qui reste

- JB : relire les consignes de tri (`tri-ia-consignes.ts`) et la fiche légale.
- Le fil « [Stratégie] Espace d'Anne · fonctions IA avec l'API Claude » vérifie les points « Chez Anthropic » de la fiche légale.
- Puis allumage par une PR (`TRI_IA = "oui"`), accord de JB, premier essai réel suivi sur une journée.
