# Story 12.8 : Adresse du site affichée avec « www. »

Epic 12, Lancement public. Ouverte le 2026-10-13 à la demande d'Anne, relayée par JB (« Anne aimerait qu'on rajoute www. devant le nom de son site »), avec une capture de la signature de l'e-mail du guide.

## Objectif

Partout où le site écrit son adresse en toutes lettres pour le lecteur, afficher `www.annevialtissot.fr` au lieu de `annevialtissot.fr`.

## Choix

- **Seul le texte affiché change.** L'adresse principale du site reste `annevialtissot.fr` : `www.annevialtissot.fr` y renvoie déjà (redirection permanente, story 12.1), donc l'adresse écrite avec « www. » fonctionne. Inverser l'adresse principale changerait les redirections Cloudflare et l'adresse déclarée à Google ; ce n'est pas demandé et demanderait l'accord écrit de JB.
- **Les liens cliquables complets** (`https://annevialtissot.fr/contact` dans les e-mails de la séquence, liens des boutons) ne changent pas : ce sont des adresses techniques, pas le nom du site, et elles évitent un saut de redirection.

## Ce qui est fait

- Signature des e-mails aux prospects : version mise en forme (`site/src/server/email-html.ts`) et version texte (`site/src/server/messages.ts`) ; ligne « via … » de l'e-mail de notification à Anne.
- Rapport PDF du diagnostic : pied de page écrit par le serveur (`site/src/server/rapport.ts`) et gabarit (`site/scripts/rapport-gabarit.mjs`, couverture, encadré de rendez-vous, signature) ; gabarit refait (`prive/rapport/gabarit.pdf`, `src/server/rapport-gabarit.json`).
- Guide PDF : pied de page et couverture (`site/scripts/guide-pdf.mjs`), mentions dans le texte (`contenu-anne/guide/texte-actuel.md`) ; guide refait (`prive/guide.pdf`, `public/img/guide-couverture.jpg`).
- Export des données personnelles (`site/src/server/rights.ts`) : champ « responsable ».

Les pages du site n'écrivent pas l'adresse en toutes lettres : rien à changer.

## Vérifié (2026-10-13)

- `npm run build` : réussi. `npm run check` : 0 erreur.
- `node scripts/liens.mjs` : 27 pages, 1759 liens, 0 cassé.
- `node scripts/maquette-emails.mjs` : 12 e-mails, tous les constats bons ; signature « www.annevialtissot.fr » dans les 12 versions mises en forme.
- `node scripts/e2e-rapport.mjs` : tous les constats bons (gabarit à jour) ; pied de page du rapport lu sur les captures.

## Ce qui reste

Rien. PR n° 140 fusionnée par JB le 2026-10-13 ; story close.
