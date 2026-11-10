// Essai de bout en bout de l'espace d'Anne (story 13.3), sur deux serveurs locaux qui partagent la même base :
// le site (site/scripts/serveur-essai.mjs : wrangler dev, imitation de Turnstile, de Resend et de Cloudflare Access)
// et l'espace (wrangler dev, branché sur la base locale du site par --persist-to).
// Vérifie : rien n'est servi sans jeton Access valable (pages, export, feuille de style, en-tête interne forgé) ;
// une demande faite sur le site apparaît tout de suite dans l'espace (base partagée) ; relance d'un envoi en échec
// programmée par l'espace puis envoyée par la tâche planifiée du site ; marque Modelo, export et effacement faits dans
// l'espace et lus par le site ; pages ni gardées en cache ni indexées. Captures dans espace/.verif/.
// Story 13.4 : chaque demande est rattachée à un seul contact (même e-mail = même contact), historique noté, règle des
// prochaines actions tenue par la base, contact en sommeil réveillé par une nouvelle demande, demandes orphelines
// rattachées par la tâche planifiée, contacts compris dans l'export et l'effacement.
// Story 13.7 : passage de boîtage, saisie à la main (origine exigée, numéro connu = fiche complétée, prescripteur créé),
// fiche et liste des contacts, import .csv et .xlsx (aperçu, doublons, personnes connues complétées, consentement).
// Story 13.5 : page « Aujourd'hui » (nouveaux d'abord, rappels dus et en retard, réveils, boîtage à refaire, prescripteurs).
// Story 18.20 : R1 et R2 (premier et second rendez-vous) : nombres dans le boîtage (/ajouter et tableau), dates sur chaque fiche contact et colonnes de la page Contacts.
// Story 18.21 : projet « Aucun », colonne « Source » = canal (six choix, tableau et fiche), sources d'import sur la fiche, ambassadeur « Partant » (fiche et tableau, vert, tri, filtre), jeton de Claude refusé.
// Story 13.13 : bilan par canal recalculé depuis la base, boîtage par secteur, motifs de perte, délai de rappel.
// Story 13.14 : prescripteurs (recommandés, mandats, relance due sur Aujourd'hui, échange noté, ajout).
// Story 13.15 : acheteurs actifs (critères, « aussi vendeur », vendeurs en sommeil du secteur, lettre sur Aujourd'hui).
// Story 13.16 : vue pipeline (colonnes par étape, déplacement avec prochaine action, réveil ou motif exigés).
// Story 13.30 : critères de recherche d'un acheteur (type, pièces, surface, extérieur, stationnement, autres), seuls les renseignés affichés.
// Story 13.24 : contacts en cartes sur téléphone avec filtres, pipeline une étape à la fois, recherche par début de numéro et par mots.
// Story 13.25 : synthèse du contact (lue sur la fiche Leedflow, gardée à côté de celle d'Anne, version plus récente signalée, saisie à la main).
// Story 13.23 : fiche modifiable (coordonnées, doublon refusé avec lien), note libre, export et effacement d'un contact sans e-mail.
// Story 13.26 : accord e-mail (import avec case, case du site, accord noté puis retiré par Anne, refus, désinscription
// de la séquence, nouvelle inscription après un refus, ancien client), reprise de la migration 0013, carte de la fiche.
// Story 13.27 : campagnes (brouillon, filtres, écartés par raison, aperçu, lien refusé, essai, confirmation, liste figée,
// envoi par paquets, désinscrit écarté au dernier moment, e-mail et en-têtes, une fois par personne, historique, désinscription
// par la page et en un clic, effacement).
// Story 13.22 : noter la suite d'un contact en cours (fait, pas joint, note ; étape gardée sauf choix ; requalifier sans changer l'étape).
// Story 13.6 : qualifier (suite obligatoire, date, réveil ou motif exigés, étape et prochaine action fixées, heure de Paris).
// Story 13.10 : relève Leedflow sur une imitation locale de son API (clé exigée, pages lues de la plus ancienne à la plus
// récente, historique repris pour un numéro connu, résumé complété après coup sans doublon, numéro inconnu proposé puis
// rattaché à la création du contact, page « À trier » avec ses filtres et ses catégories (13.19), tâches proposées puis acceptées ou ignorées, clé refusée signalée).
// Story 13.20 : bouton « Un retour ? » (ticket GitHub créé par une imitation de l'API, page sans paramètres, retour vide ou jeton de Claude refusés).
// Story 13.17 : actions marketing (ajout, erreurs, rattachement d'office par la base, choix à la qualification et sur la
// fiche, coût des passages, coûts du bilan) et accès de Claude par jeton de service (actions et totaux seulement,
// rien d'autre ouvert, une personne refusée sur /api/claude/…, aucun contact dans les réponses).
// Story 10.13 : passage de la question 1 à la question 2 ventilé par navigateur, appareil et temps d'affichage.
// Story 10.12 : entonnoir du diagnostic dans le Bilan (par campagne, étape par étape, campagne choisie) et dans le bilan de Claude.
// Story 10.14 : tableau du test A/B (accueil ou question 1) dans le Bilan et dans le bilan de Claude.
// Story 18.2 : carnet (migration 0018) : contact hors suivi jamais rattaché par Leedflow ni montré dans les listes, autre numéro
// d'un contact suivi, appels d'avant l'entrée seule dans le suivi gardés à part, « Ajouter » qui fait entrer dans le suivi,
// projet et température tenus par la base, six catégories, demande du site rangée en « Demandes reçues ».
// Revue de code 18.2 : tâche Leedflow d'avant suivi_le, numéro principal contre secondaire, « À trier », contact du carnet
// déplacé dans le pipeline, projet suivant le parcours retenu.
// Story 18.3 : demande du site retrouvée par un numéro secondaire et entrée dans le suivi (suivi_le), ligne « Nouveaux »,
// inscription ambassadeur (marque sans changer projet ni catégorie), effacement (opposition, coordonnées vidées, classement
// Privé gardé), recherche par e-mail secondaire.
// Story 18.4 : page Contacts en accueil (tout le carnet, écartés masqués, compteur, colonnes de FR-1, recherche par morceau
// de numéro et par entreprise, tri, colonne masquée gardée, menu « Autres outils » dont chaque page répond, « Aujourd'hui »
// à /aujourdhui, pas de débordement à 1440 et 1280 px, 1 000 contacts fictifs triés et cherchés en moins d'une seconde).
// Story 18.5 : filtres (chacun de FR-2, plus « à rappeler », pastilles retirées d'un clic, écartés masqués sans le filtre
// « écartés »), combinaison avec la recherche, vues enregistrées (création avec un nom échappé, choix, renommage, suppression
// et annulation, « Tous les contacts » indélébile), /api/vues (vocabulaire fermé d'AD-27 : clé ou valeur inconnue refusée,
// accès réservé à Anne et JB, jamais à Claude), routes /api/claude/… sans contacts ni vues, vitesse sous 300 ms avec 1 200 contacts.
// Story 18.6 : /api/carnet (lot avec avant-image et lot commun, annulation exacte, catégorie qui marque vérifié, projet sans
// température, température seulement là où elle s'applique, contact du suivi classé sans que son étape bouge, écarter et
// faire revenir, 400 hors vocabulaire, 403 sans jeton ou avec celui de Claude) ; la page (Maj + clic, cases gardées au tri et
// au filtre, barre d'actions et annulation sans recharger, une seule ligne dans sa cellule, écarté puis revenu, tout cocher) ;
// un lot de 1 000 contacts.
// Revue de code 18.5 : vue invalide (catégorie disparue) vide et signalée, valeur disparue retirée d'une liste, jours de
// Paris, « à rappeler » daté, boutons ✎ et × sans clic hors survol, double clic sur × et sur « Enregistrer », une
// annulation par vue supprimée, /api/vues (ambassadeur « non », filtre vide, 413, plafond de 100 vues, ordre rétabli).
// Story 18.7 : /api/fiche (lecture, chaque champ corrigé avec son avant-image sans toucher la date d'activité, téléphones et
// e-mails multiples, conflit avec un autre contact, écarter, note, contact hors séance qui met à jour le dernier contact,
// contact du suivi, accord), création à la main (vérifiée, source « saisie », doublon proposé, opposition), 400 et 403 ;
// le panneau dans la page (correction, note, contact, conflit, « + Nouveau contact », lien direct ?fiche=).
// Revue de code 18.6 : classer n'avance pas last_activity_at, une note après un lot garde le contact à l'annulation, une
// catégorie supprimée ou un contact effacé ne font plus échouer une annulation, une flèche du clavier n'écrit rien (Entrée
// écrit), une vue invalide arrive avec un filtre vide, une remise en place de vue passe le plafond de 100.
// Story 18.8 : /api/categories (six méthodes de départ, ajout, nom déjà pris, renommage sans effet sur les contacts, la vue
// ni l'historique, méthode et messages types, identifiant d'un message gardé, envoi groupé hors règle refusé, retrait refusé
// tant qu'il reste un contact ou pour une catégorie de départ puis accepté, vue « à refaire », ordre, 400 et 403) ; la page
// (menu, liste, aperçu avec un prénom d'exemple, enregistrement, renommage, retrait refusé puis accepté, flèches).
// Revue de code 18.7 : premier e-mail changé (accord noté retiré, accord du site « à reconfirmer »), coordonnée d'une
// personne en opposition refusée à la correction, remise en place d'une vue plafonnée.
// Story 18.18 : envoi d'un modèle ambassadeur depuis l'espace (liste cochée, vue, formule selon la catégorie, verso joint,
// dernier contact et événement, « Écrire » puis « Envoyé », colonne et filtre Ambassadeur).
// Story 18.19 : tableau du boîtage (/api/boitage, onglet « Boîtage » de /actions : ajout, tri par date, modification en place, refus,
// coût et ancien passage gardés, 1280 px sans défilement horizontal).
// Story 18.11 : barre « Nouveaux » (/api/nouveaux : demande du site avec son message, Vu, Écarter, Ranger et leur annulation,
// second geste refusé, annulation trop tardive ; numéros inconnus de Leedflow, une ligne par numéro, Ignorer, Ajouter à sa
// fiche, Ajouter aux contacts, chacun annulé, numéro ajouté à une fiche qui ne revient plus, opposition, 400, 403, 413) ;
// la page (barre repliée, cartes, Vu puis Annuler, création préremplie) à 1440 et 1280 px.
// Story 18.12 : demandes des portails par e-mail, injectées dans le gestionnaire `email` par /cdn-cgi/handler/email
// (Leboncoin par Modelo, SeLoger en HTML qui complète un contact du carnet, doublon, illisible, confirmation de Gmail,
// opposition, expéditeur refusé, e-mail trop gros ; cartes et gestes, ménage du texte ; page à 1440 et 1280 px).
// Revue de code 18.9, 18.11, 18.12 (2026-11-02) : suite QUOTED-PRINTABLE d'une note vCard (serveur et script), CSV sans
// ligne de titres, accord e-mail lors d'une fusion CONTACTS + EDB ; From falsifié et expéditeur d'enveloppe non autorisé.
// Préalable, dans site/ : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run base:local` ;
// dans espace/ : `npm run build`.
// Lancer depuis espace/ : `node scripts/e2e-espace.mjs`.
import { spawn, spawnSync } from 'node:child_process';
import { createHmac, generateKeyPairSync } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { demarrer, ICI as SITE, pause, sid } from '../../site/scripts/serveur-essai.mjs';

const ICI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ICI, '.verif');
fs.mkdirSync(OUT, { recursive: true });
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };

const site = await demarrer({ nom: 'espace' });
const { U: S, recus, etat, appeler, sql, essai: ESSAI, jetonAcces } = site;

// L'espace : mêmes réglages Access que l'imitation du site, et la base locale du site.
const PORT = 8789;
const E = `http://localhost:${PORT}`;
const reglages = path.join(os.tmpdir(), `essai-${ESSAI}-espace.vars`);
const equipe = JSON.parse(Buffer.from(jetonAcces().split('.')[1], 'base64url').toString()).iss;
// Imitation de l'API Leedflow (story 13.10) : mêmes adresses, même pagination, triée du plus récent au plus ancien.
const LF = { cle: 'essai-cle-leedflow', refuse: false, requetes: [], appels: [], vocaux: [], sms: [], taches: [], contacts: {} };
const PORT_LF = 8791;
const GH = { cle: 'essai-cle-github', tickets: [] };
const imitationLeedflow = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  LF.requetes.push({ chemin: u.pathname, params: Object.fromEntries(u.searchParams), auth: req.headers.authorization });
  const json = (code, corps) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(corps)); };
  // Imitation de l'API GitHub pour le bouton « Un retour ? » (story 13.20) : création d'un ticket.
  if (u.pathname.startsWith('/github/')) {
    let corps = '';
    req.on('data', (c) => { corps += c; });
    req.on('end', () => { GH.tickets.push({ chemin: u.pathname, auth: req.headers.authorization, ...JSON.parse(corps || '{}') }); json(201, { number: 9000 + GH.tickets.length, html_url: 'https://exemple.invalid/ticket' }); });
    return;
  }
  if (LF.refuse || req.headers.authorization !== `Bearer ${LF.cle}`) return json(401, { success: false, statusCode: 401 });
  const fiche = /^\/contacts\/(.+)$/.exec(u.pathname);
  if (fiche) return LF.contacts[fiche[1]] ? json(200, { success: true, data: LF.contacts[fiche[1]] }) : json(404, { success: false });
  const liste = { '/calls': LF.appels, '/voicemails': LF.vocaux, '/sms': LF.sms, '/tasks': LF.taches }[u.pathname];
  if (!liste) return json(404, { success: false });
  const apres = Number(u.searchParams.get('created_after') ?? 0), parPage = Number(u.searchParams.get('per_page') ?? 20), n = Number(u.searchParams.get('page') ?? 1);
  const tri = liste.filter((e) => e.created >= apres).sort((a, b) => b.created - a.created);
  json(200, { success: true, statusCode: 200, data: tri.slice((n - 1) * parPage, n * parPage), pagination: { page: n, per_page: parPage, total: tri.length, total_pages: Math.max(1, Math.ceil(tri.length / parPage)) } });
});
await new Promise((ok) => imitationLeedflow.listen(PORT_LF, ok));
fs.writeFileSync(reglages, [`ACCESS_EQUIPE=${equipe}`, 'ACCESS_AUD=essai-aud', 'LIEN_SECRET=essai', `URL_SITE=${S}`,
  `LEEDFLOW_API_KEY=${LF.cle}`, `LEEDFLOW_URL=http://localhost:${PORT_LF}`, 'ACCESS_CLAUDE_ID=essai-claude.access',
  `GITHUB_TOKEN=${GH.cle}`, `GITHUB_API=http://localhost:${PORT_LF}/github`,
  // Campagnes (story 13.27) : l'imitation de Resend du site, 2 e-mails par passage, pas de plafond du jour (la base d'essai garde les envois des essais précédents).
  'RESEND_API_KEY=essai', 'BOITE_TEST=boite-test@example.com', 'URL_SERVICES_ESSAI=http://localhost:8790', 'CAMPAGNE_PAR_PASSAGE=2', 'CAMPAGNE_QUOTA_JOUR=100000',
  // Portails par e-mail (story 18.12, revue de code) : la Gmail d'Anne fictive qui fait suivre les demandes.
  'PORTAILS_EXPEDITEUR_AUTORISE=anne.essai@example.com'].join('\n'));
const journal = path.join(os.tmpdir(), `e2e-${ESSAI}-espace.log`);
const sansProxy = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(https?|all|no)_proxy$/i.test(k)));
const espace = spawn('npx', ['wrangler', 'dev', '--port', String(PORT), '--env-file', reglages, '--test-scheduled', '--persist-to', path.join(SITE, '.wrangler', 'state')],
  { cwd: ICI, detached: true, stdio: ['ignore', fs.openSync(journal, 'w'), fs.openSync(journal, 'a')], env: sansProxy });
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`${E}/gestion`)).status === 403) break; } catch {}
  await pause(1000);
}

const JETON = jetonAcces();
const avecJeton = (jeton = JETON, autres = {}) => ({ 'cf-access-jwt-assertion': jeton, ...autres });
const formulaire = (route, champs, jeton = JETON) => appeler(`${E}/api/gestion/${route}`, {
  method: 'POST', redirect: 'manual', headers: avecJeton(jeton, { 'Content-Type': 'application/x-www-form-urlencoded', Origin: E }),
  body: new URLSearchParams(champs).toString(),
});
let ip = 0;
const poster = (route, corps) =>
  appeler(`${S}/api/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': `203.0.113.${++ip}` }, body: JSON.stringify({ lang: 'fr', turnstile: 'jeton', privacy: 'on', ...corps }) });
const leadDe = (s) => sql(`SELECT id FROM lead WHERE submission_id = '${s}'`)[0]?.id;

// Les actions d'essais précédents (base locale gardée d'un essai à l'autre) : retirées, pour que le rattachement d'office
// de la story 13.17 ne voie que celles de cet essai.
sql(`UPDATE contact SET action_id = NULL WHERE action_id IN (SELECT id FROM action_marketing WHERE nom LIKE 'Essai %')`);
sql(`DELETE FROM action_marketing WHERE nom LIKE 'Essai %'`);

try {
  // 0. Une demande faite sur le site pendant une panne de l'envoi d'e-mails.
  const EMAIL = `paul+${ESSAI}@example.com`;
  const s1 = sid();
  etat.enPanne = true;
  await poster('guide', { submission_id: s1, prenom: 'Paul', nom: 'Espace', email: EMAIL });
  const lead = leadDe(s1);
  for (let i = 0; i < 24 && sql(`SELECT count(*) AS n FROM lead_delivery WHERE lead_id = '${lead}' AND status = 'failed'`)[0].n < 1; i++) await pause(250);
  etat.enPanne = false;
  constat(!!lead && sql(`SELECT count(*) AS n FROM lead_delivery WHERE lead_id = '${lead}' AND status = 'failed'`)[0].n >= 1, 'demande faite sur le site, avec un envoi en échec');

  // 0 bis. Contacts (story 13.4) : la demande est rattachée à un contact à qualifier, avec l'événement dans l'historique.
  const contactDe = (l) => sql(`SELECT contact_id FROM lead WHERE id = '${l}'`)[0]?.contact_id;
  for (let i = 0; i < 24 && !contactDe(lead); i++) await pause(250);
  const contact = contactDe(lead);
  const fiche = contact ? sql(`SELECT * FROM contact WHERE id = '${contact}'`)[0] : null;
  constat(!!fiche && fiche.etape === 'a_qualifier' && fiche.canal === 'site' && fiche.origine_detail === 'guide' && fiche.parcours === 'vendeur'
    && fiche.email === EMAIL && !!fiche.prochaine_action_le, 'demande rattachée à un nouveau contact « à qualifier », origine site · guide, à rappeler');
  constat(fiche?.categorie_id === 'demandes_recues' && fiche.projet === 'vendeur' && fiche.temperature === 'avec_anne' && !!fiche.verifie_le && fiche.suivi_le === null,
    '18.2 : une demande du site crée un contact « Demandes reçues », projet tiré du parcours (vendeur), avec Anne');
  constat(sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${contact}' AND type = 'demande' AND source_id = '${lead}'`)[0].n === 1,
    'historique du contact : la demande notée une fois');
  // Une deuxième demande avec la même adresse (casse différente) va sur le même contact.
  const s2 = sid();
  await poster('guide', { submission_id: s2, prenom: 'Paul', nom: 'Espace', email: EMAIL.toUpperCase() });
  const lead2 = leadDe(s2);
  for (let i = 0; i < 24 && !contactDe(lead2); i++) await pause(250);
  constat(contactDe(lead2) === contact && sql(`SELECT count(*) AS n FROM contact WHERE email = '${EMAIL}'`)[0].n === 1
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${contact}' AND type = 'demande'`)[0].n === 2,
    'deuxième demande, même adresse : même contact, deux demandes dans l\'historique');
  // La base refuse un contact actif sans prochaine action datée, un sommeil sans réveil, une perte sans motif.
  const refuse = (requete) => { try { sql(requete); return false; } catch { return true; } };
  constat(refuse(`INSERT INTO contact (id, created_at, last_activity_at, nom, etape, canal) VALUES ('X1', '2026-01-01', '2026-01-01', 'Essai', 'premier_rdv', 'autre')`)
    && refuse(`UPDATE contact SET etape = 'en_sommeil', reveil_le = NULL WHERE id = '${contact}'`)
    && refuse(`UPDATE contact SET etape = 'perdu', motif_perte = NULL WHERE id = '${contact}'`),
    'règle tenue par la base : pas de contact actif sans prochaine action, de sommeil sans réveil, de perte sans motif');
  // Un contact en sommeil qui refait une demande revient à qualifier.
  sql(`UPDATE contact SET etape = 'en_sommeil', reveil_le = '2027-03-01' WHERE id = '${contact}'`);
  const s3 = sid();
  await poster('guide', { submission_id: s3, prenom: 'Paul', nom: 'Espace', email: EMAIL });
  for (let i = 0; i < 24 && !contactDe(leadDe(s3)); i++) await pause(250);
  const reveille = sql(`SELECT etape, reveil_le FROM contact WHERE id = '${contact}'`)[0];
  constat(reveille.etape === 'a_qualifier' && reveille.reveil_le === null, 'contact en sommeil : une nouvelle demande le remet « à qualifier »');
  // Une demande sans contact (antérieure à 13.4) : la tâche planifiée la rattache (vérifié après son passage, étape 3).
  const ORPHELIN = `orphelin+${ESSAI}@example.com`;
  sql(`INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at, is_test, prenom, nom, telephone, projet)
       VALUES ('ORPH${ESSAI}', 'orph-${ESSAI}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'fr', 'contact', '${ORPHELIN}', '2026-10-01T08:00:00Z', 1, 'Olga', 'Orphelin', '+33600000${String(ESSAI).slice(-3).padStart(3, '0')}', 'achat')`);

  // 1. Accès : sans jeton Access valable, rien n'est servi, pas même une feuille de style.
  const { privateKey: autreCle } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const refus = [
    ['sans jeton', {}],
    ['jeton mal signé', avecJeton(jetonAcces({}, autreCle))],
    ['jeton d\'une autre application (le /gestion du site par exemple)', avecJeton(jetonAcces({ aud: ['autre-aud'] }))],
    ['jeton périmé', avecJeton(jetonAcces({ exp: Math.floor(Date.now() / 1000) - 10 }))],
    ['en-tête interne forgé', { 'x-gestion-compte': 'pirate@example.com' }],
  ];
  for (const [nom, entetes] of refus) {
    const pages = await Promise.all(['/', '/gestion', `/gestion/lead?id=${lead}`, `/api/gestion/export?email=${encodeURIComponent(EMAIL)}`, '/favicon.svg', '/fonts/']
      .map((c) => appeler(`${E}${c}`, { headers: entetes }).then(async (r) => ({ statut: r.status, corps: await r.text(), robots: r.headers.get('x-robots-tag') }))));
    constat(pages.every((p) => p.statut === 403 && !p.corps.includes(EMAIL) && /noindex/.test(p.robots ?? '')), `${nom} : 403 partout (accueil, liste, fiche, export, fichiers), aucune donnée`);
  }

  const surAujourdhui = async (gardes = { contacts: [], prescripteurs: [], passages: [] }) => {
    const liste = (ids) => (ids?.length ? ids.map((id) => `'${id}'`).join(', ') : "''");
    sql('DROP TABLE IF EXISTS _essai_aujourdhui');
    sql(`CREATE TABLE _essai_aujourdhui AS
      SELECT 'contact' AS t, id, prochaine_action_le AS v1, reveil_le AS v2 FROM contact WHERE etape IS NOT NULL AND id NOT IN (${liste(gardes.contacts)})
      UNION ALL SELECT 'prescripteur', id, prochaine_relance_le, NULL FROM prescripteur WHERE prochaine_relance_le IS NOT NULL AND id NOT IN (${liste(gardes.prescripteurs)})
      UNION ALL SELECT 'passage', id, fait_le, NULL FROM passage_boitage WHERE id NOT IN (${liste(gardes.passages)})`);
    sql(`UPDATE contact SET prochaine_action_le = '2099-12-31', reveil_le = CASE WHEN reveil_le IS NULL THEN NULL ELSE '2099-12-31' END WHERE id IN (SELECT id FROM _essai_aujourdhui WHERE t = 'contact')`);
    sql(`UPDATE prescripteur SET prochaine_relance_le = '2099-12-31' WHERE id IN (SELECT id FROM _essai_aujourdhui WHERE t = 'prescripteur')`);
    sql(`UPDATE passage_boitage SET fait_le = '${new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date())}' WHERE id IN (SELECT id FROM _essai_aujourdhui WHERE t = 'passage')`);
    try {
      return await (await appeler(`${E}/aujourdhui`, { headers: avecJeton() })).text();
    } finally {
      sql(`UPDATE contact SET prochaine_action_le = (SELECT s.v1 FROM _essai_aujourdhui s WHERE s.t = 'contact' AND s.id = contact.id),
        reveil_le = (SELECT s.v2 FROM _essai_aujourdhui s WHERE s.t = 'contact' AND s.id = contact.id) WHERE id IN (SELECT id FROM _essai_aujourdhui WHERE t = 'contact')`);
      sql(`UPDATE prescripteur SET prochaine_relance_le = (SELECT s.v1 FROM _essai_aujourdhui s WHERE s.t = 'prescripteur' AND s.id = prescripteur.id) WHERE id IN (SELECT id FROM _essai_aujourdhui WHERE t = 'prescripteur')`);
      sql(`UPDATE passage_boitage SET fait_le = (SELECT s.v1 FROM _essai_aujourdhui s WHERE s.t = 'passage' AND s.id = passage_boitage.id) WHERE id IN (SELECT id FROM _essai_aujourdhui WHERE t = 'passage')`);
      sql('DROP TABLE _essai_aujourdhui');
    }
  };

  // 2. Base partagée : la demande du site est dans l'espace, sans délai.
  // La page ne montre que les 100 premiers contacts à qualifier : les autres contacts de la base locale, laissés par les
  // passages précédents, sont mis de côté le temps de la lecture (surAujourdhui), pour ne dépendre que de celui-ci.
  let r = await appeler(`${E}/aujourdhui`, { headers: avecJeton(), redirect: 'manual' });
  let html = await surAujourdhui({ contacts: [contact] });
  constat(r.status === 200 && html.includes('Bonjour Anne') && html.includes(`data-contact="${contact}"`), 'accueil « Aujourd\'hui » : la demande du site est à rappeler');
  r = await appeler(`${E}/gestion`, { headers: avecJeton() });
  html = await r.text();
  constat(r.status === 200 && html.includes(`data-lead="${lead}"`) && html.includes('anne@example.com'), 'liste de l\'espace : la demande faite sur le site, le compte connecté affiché');
  constat(/no-store/.test(r.headers.get('cache-control') ?? '') && /noindex/.test(r.headers.get('x-robots-tag') ?? ''), 'liste ni gardée en cache ni indexée');
  const css = html.match(/href="(\/_astro\/[^"]+\.css)"/)?.[1];
  const feuille = css ? await appeler(`${E}${css}`, { headers: avecJeton() }) : null;
  constat(!!feuille && feuille.status === 200, 'feuille de style de l\'espace servie avec un jeton valable');
  r = await appeler(`${E}/gestion/lead?id=${lead}`, { headers: avecJeton() });
  html = await r.text();
  constat(r.status === 200 && html.includes(EMAIL) && html.includes('data-rejouer'), 'fiche : la demande et son envoi en échec, avec le bouton de relance');

  // 3. Relance : programmée par l'espace, envoyée par la tâche planifiée du site.
  const enEchec = sql(`SELECT channel FROM lead_delivery WHERE lead_id = '${lead}' AND status = 'failed' LIMIT 1`)[0].channel;
  const avant = recus.length;
  r = await formulaire('rejouer', { id: lead, canal: enEchec });
  const programme = sql(`SELECT status, attempts FROM lead_delivery WHERE lead_id = '${lead}' AND channel = '${enEchec}'`)[0];
  constat(r.status === 303 && r.headers.get('location') === `/gestion/lead?id=${lead}&m=rejoue` && programme.status === 'pending' && programme.attempts === 0 && recus.length === avant,
    `relance de « ${enEchec} » : programmée (en attente, compteur à zéro), rien envoyé par l'espace`);
  await appeler(`${S}/cdn-cgi/handler/scheduled`);
  for (let i = 0; i < 24 && sql(`SELECT status FROM lead_delivery WHERE lead_id = '${lead}' AND channel = '${enEchec}'`)[0].status !== 'delivered'; i++) await pause(250);
  constat(sql(`SELECT status FROM lead_delivery WHERE lead_id = '${lead}' AND channel = '${enEchec}'`)[0].status === 'delivered' && recus.some((e) => e.idempotence === `${lead}:${enEchec}`),
    'tâche planifiée du site : l\'e-mail relancé est parti, envoi marqué fait');
  const orphelin = sql(`SELECT l.contact_id, c.parcours, c.canal FROM lead l LEFT JOIN contact c ON c.id = l.contact_id WHERE l.id = 'ORPH${ESSAI}'`)[0];
  constat(!!orphelin?.contact_id && orphelin.parcours === 'acheteur' && orphelin.canal === 'site', 'tâche planifiée : la demande sans contact est rattachée (acheteur, origine site)');
  r = await appeler(`${E}/gestion/lead?id=${lead}&m=rejoue`, { headers: avecJeton() });
  constat((await r.text()).includes('La relance est programmée'), 'fiche : message de relance programmée');

  // 4. Marque Modelo posée dans l'espace, lue dans la base du site.
  r = await formulaire('modelo', { id: lead, recopie: '1' });
  constat(r.headers.get('location') === `/gestion/lead?id=${lead}&m=modelo` && sql(`SELECT status FROM lead_delivery WHERE lead_id = '${lead}' AND channel = 'modelo'`)[0]?.status === 'delivered', 'Modelo : marque posée depuis l\'espace');

  // 5. Droits RGPD depuis l'espace : export, puis effacement.
  r = await appeler(`${E}/api/gestion/export?email=${encodeURIComponent(EMAIL)}`, { headers: avecJeton() });
  const exp = r.status === 200 ? await r.json() : {};
  constat(exp.email === EMAIL && exp.demandes?.length === 3, 'export : les trois demandes de l\'adresse, en fichier JSON');
  constat(exp.contacts?.length === 1 && exp.contacts[0].historique?.length >= 3, 'export : le contact de l\'espace et son historique');
  r = await formulaire('effacer', { email: EMAIL, confirmation: 'autre@example.com' });
  constat(sql(`SELECT count(*) AS n FROM lead WHERE lower(email) = '${EMAIL}'`)[0].n === 3, 'effacement refusé sans confirmation exacte');
  r = await formulaire('effacer', { email: EMAIL, confirmation: EMAIL });
  constat(r.headers.get('location') === '/gestion?m=efface-3' && sql(`SELECT count(*) AS n FROM lead WHERE lower(email) = '${EMAIL}'`)[0].n === 0, 'effacement fait depuis l\'espace : plus rien dans la base du site');
  constat(sql(`SELECT count(*) AS n FROM contact WHERE id = '${contact}'`)[0].n === 0 && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${contact}'`)[0].n === 0,
    'effacement : le contact et son historique sont partis aussi');

  // 5 bis. Saisie à la main, passage de boîtage et import (story 13.7).
  const page = (chemin, champs) => appeler(`${E}${chemin}`, {
    method: 'POST', redirect: 'manual', headers: avecJeton(JETON, { 'Content-Type': 'application/x-www-form-urlencoded', Origin: E }),
    body: new URLSearchParams(champs).toString(),
  });
  const auj = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());
  const SECTEUR = `Sciez-${ESSAI}`;
  r = await page('/ajouter', { quoi: 'passage', ville: SECTEUR, fait_le: auj, flyers: '150' });
  const passage = sql(`SELECT id, mots FROM passage_boitage WHERE secteur = '${SECTEUR}'`)[0];
  constat(r.status === 303 && r.headers.get('location') === '/ajouter?m=passage#passage' && passage?.mots === 150, 'passage de boîtage noté (secteur, date, 150 mots)');
  const NUM = String(Date.now()).slice(-6); // chiffres propres à cet essai, pour des numéros qui ne se croisent pas d'un essai à l'autre
  const TEL = `06 12 ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4)}`;
  const TEL164 = `+33${TEL.replace(/\s/g, '').slice(1)}`;
  const { chromium } = await import('../../site/node_modules/playwright/index.mjs');
  const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const JETON_C = jetonAcces({ email: undefined, common_name: 'essai-claude.access' });
  // Story 18.18 : envoyer un modèle (ambassadeur) depuis l'espace. Liste cochée (un contact sans accord est écarté), formule
  // d'appel selon la catégorie, image jointe, dernier contact et événement écrits, état « Contacté » ; vue enregistrée ;
  // « Écrire » (mailto) puis « Envoyé » pour un contact sans envoi groupé ; colonne Ambassadeur et son filtre.
  // Lancé seul avec E2E_1818_SEUL=1 (après le démarrage des serveurs) pour répéter ce bloc sans les ~25 minutes du reste.
  async function bloc1818() {
    sql(`DELETE FROM campagne_destinataire WHERE campagne_id IN (SELECT id FROM campagne WHERE nom LIKE 'Essai 1818%')`);
    sql(`DELETE FROM campagne WHERE nom LIKE 'Essai 1818%'`);
    sql(`DELETE FROM vue WHERE nom LIKE 'Essai 1818%'`);
    const M = Object.fromEntries(['1', '2', '3', '4', '5', '6'].map((l) => [l, `01KF18${l}${NUM}${'0'.repeat(13)}`]));
    const q = (v) => (v === null ? 'NULL' : `'${v}'`);
    const ligneM = (l, prenom, nom, mail, cat, projet, { accord = false, inscrit = null, ecarte = null } = {}) =>
      `(${[M[l], '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', prenom, `${nom}${NUM}`, `${mail}1818+${ESSAI}@example.com`, cat, projet, accord ? '2026-10-02T08:00:00Z' : null, accord ? 'anne' : null, inscrit, ecarte].map(q).join(', ')})`;
    sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, email, categorie_id, projet, email_accord_le, email_accord_source, ambassadeur_inscrit_le, ecarte_le) VALUES
      ${[ligneM('1', 'Camille', 'Proche', 'camille', 'anciens_clients', 'ambassadeur', { accord: true }), ligneM('2', 'Léa', 'Durand', 'lea', 'lointains', 'ambassadeur', { accord: true }),
        ligneM('3', 'Paul', 'Sansaccord', 'paul', 'anciens_clients', 'ambassadeur'), ligneM('4', 'Inès', 'Proche', 'ines', 'proches', 'ambassadeur'),
        ligneM('5', 'Jade', 'Inscrite', 'jade', 'anciens_clients', 'a_qualifier', { inscrit: '2026-10-05T08:00:00Z' }),
        ligneM('6', 'Rémi', 'Ecarte', 'remi', 'anciens_clients', 'ambassadeur', { accord: true, ecarte: '2026-10-06T08:00:00Z' })].join(',\n      ')}`);
    const apiC = async (methode, chemin, corps) => {
      const x = await appeler(`${E}/api/campagnes${chemin}`, { method: methode, redirect: 'manual', headers: { 'cf-access-jwt-assertion': JETON, ...(methode === 'POST' ? { 'Content-Type': 'application/json' } : {}), Origin: E }, body: corps === undefined ? undefined : JSON.stringify(corps) });
      let d = null; try { d = await x.json(); } catch {}
      return { status: x.status, d };
    };
    const ficheJ = async (id) => (await (await appeler(`${E}/api/fiche?id=${id}`, { headers: avecJeton() })).json()).fiche;
    const ligneAccueil = async (id) => JSON.parse((await (await appeler(`${E}/`, { headers: avecJeton() })).text()).split('id="ct-donnees">')[1].split('</script>')[0]).find((l) => l.id === id);

    // Le modèle : une campagne marquée « modèle », avec [Formule] et le verso de la carte.
    let r1 = await page('/campagnes', { quoi: 'creer', nom: 'Essai 1818 modèle ambassadeur' });
    const modele = /id=([0-9A-Z]{26})/.exec(r1.headers.get('location') ?? '')?.[1];
    r1 = await page(`/campagnes?id=${modele}`, [['quoi', 'enregistrer'], ['nom', 'Essai 1818 modèle ambassadeur'], ['objet', 'Votre carte ambassadeur'],
      ['texte', '[Formule],\n\nAvec un mot de **recommandation**, vous aidez vos proches.'], ['bouton_libelle', 'Voir le programme'], ['bouton_lien', 'https://annevialtissot.fr/parrainage?c=email'],
      ['mode', 'filtres'], ['verso', 'on'], ['modele', 'on'], ['commune', ''], ['parcours', ''], ['canal', ''], ['etapes', 'a_qualifier']]);
    const pm = await apiC('GET', '?modeles=1');
    constat(r1.headers.get('location') === `/campagnes?id=${modele}&m=enregistree` && pm.d?.modeles?.some((m) => m.id === modele && m.verso === true),
      '18.18 : une campagne marquée « modèle » est proposée avec l\'option du verso de la carte');

    // Etat avant envoi : colonne Ambassadeur.
    constat((await ligneAccueil(M[1]))?.ambassadeur_etat === 'a_contacter' && (await ligneAccueil(M[5]))?.ambassadeur_etat === 'inscrit' && (await ligneAccueil(M[5]))?.projet === 'a_qualifier',
      '18.18 : état ambassadeur « À contacter » (projet ambassadeur) et « Inscrit » (inscription faite, quel que soit le projet)');

    // Cases cochées : 5 contacts, un seul peut recevoir (accord + catégorie qui le permet + non écarté).
    const sansAuth = await appeler(`${E}/api/campagnes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const claude = await appeler(`${E}/api/campagnes?modeles=1`, { headers: avecJeton(jetonAcces({ email: undefined, common_name: 'essai-claude.access' })) });
    constat(sansAuth.status === 403 && claude.status === 403, '18.18 : /api/campagnes refusé sans jeton et avec le jeton de Claude');
    const cree = await apiC('POST', '', { modele, ids: [M[1], M[2], M[3], M[4], M[6]] });
    const kA = cree.d?.id;
    const hA = (await (await appeler(`${E}/campagnes?id=${kA}`, { headers: avecJeton() })).text()).replaceAll('&#39;', "'");
    constat(cree.status === 201 && /id="?/.test(hA) && hA.includes('data-recoivent="1"') && hA.includes('data-ecartes="Catégorie sans envoi groupé"') && hA.includes(`data-ecartes="Pas d'accord pour recevoir vos e-mails"`)
      && hA.includes('data-ecartes="Contact écarté du tableau"') && hA.includes('Les 5 contacts cochés') && hA.includes('cid:verso-carte') === false,
      '18.18 : liste cochée : 1 destinataire ; sans accord, catégorie sans envoi groupé et contact écarté sont écartés avec la raison');
    constat((await apiC('POST', '', { ids: ['x'] })).status === 400 && (await apiC('POST', '', { modele: 'pas-un-modele' })).status === 400 && (await apiC('POST', '', {})).status === 400,
      '18.18 : /api/campagnes refuse une liste ou un modèle mal formés, et une demande sans destinataire');
    const copie = sql(`SELECT objet, texte, filtres FROM campagne WHERE id = '${kA}'`)[0];
    constat(copie.objet === 'Votre carte ambassadeur' && copie.texte.startsWith('[Formule],') && JSON.parse(copie.filtres).verso === true && JSON.parse(copie.filtres).modele === false && JSON.parse(copie.filtres).ids.length === 5,
      '18.18 : la campagne préparée reprend objet, texte et verso du modèle, sans devenir un modèle elle-même');
    const avantEnvoi = recus.length;
    const essai = await page(`/campagnes?id=${kA}`, [['quoi', 'lancer'], ['confirme', 'oui']]);
    const destA = () => Object.fromEntries(sql(`SELECT contact_id, statut FROM campagne_destinataire WHERE campagne_id = '${kA}'`).map((d) => [d.contact_id, d.statut]));
    constat(essai.headers.get('location') === `/campagnes?id=${kA}&m=lancee` && JSON.stringify(Object.keys(destA())) === JSON.stringify([M[1]]), '18.18 : l\'envoi fige la liste sur la seule personne qui peut la recevoir');
    for (let i = 0; i < 40 && destA()[M[1]] !== 'envoye'; i++) { await appeler(`${E}/cdn-cgi/handler/scheduled`); await pause(500); }
    const mA = recus.slice(avantEnvoi).find((m) => m.idempotence === `campagne:${kA}:${M[1]}`);
    constat(!!mA && mA.html.includes('Camille,') && !mA.html.includes('Camille Proche') && mA.html.includes('cid:verso-carte') && mA.attachments?.some((a) => a.content_id === 'verso-carte' && a.content_type === 'image/jpeg')
      && mA.attachments?.some((a) => a.content_id === 'logo') && mA.text.includes('Bonjour Camille,') && !mA.text.includes('[Formule]'),
      '18.18 : ancien client : « Bonjour Camille », verso de la carte joint par content-id avec le logo');
    const evA = sql(`SELECT texte, donnees, par FROM contact_evenement WHERE contact_id = '${M[1]}' AND source_id = 'campagne:${kA}:${M[1]}'`)[0];
    const cA = sql(`SELECT dernier_contact_le, dernier_contact_canal, last_activity_at FROM contact WHERE id = '${M[1]}'`)[0];
    const dA = JSON.parse(evA?.donnees ?? '{}');
    constat(cA.dernier_contact_canal === 'email' && Date.now() - Date.parse(cA.dernier_contact_le) < 120_000 && cA.last_activity_at === '2026-10-01T08:00:00Z'
      && evA?.texte.includes('Essai 1818 modèle ambassadeur') && evA.texte.includes('Votre carte ambassadeur') && dA.avant.dernier_contact_le === null && dA.apres.dernier_contact_canal === 'email',
      '18.18 : après l\'e-mail, dernier contact (aujourd\'hui, e-mail) et événement avec nom de la campagne et objet, avant-image gardée, activité inchangée');
    const fA = await ficheJ(M[1]);
    constat(fA.ambassadeur_etat === 'contacte' && fA.envoi_groupe === true && fA.historique.some((e) => e.type === 'email' && e.texte.includes('Votre carte ambassadeur')) && (await ligneAccueil(M[1])).ambassadeur_etat === 'contacte',
      '18.18 : l\'événement est lisible sur la fiche, état ambassadeur « Contacté » dans la fiche et le tableau');

    // Formule d'une relation lointaine : « Bonjour Prénom Nom » ; ouverte à l'envoi groupé le temps de l'essai.
    sql(`UPDATE categorie SET envoi_groupe_permis = 1 WHERE id = 'lointains'`);
    const kB = (await apiC('POST', '', { modele, ids: [M[2]] })).d?.id;
    const avantB = recus.length;
    await page(`/campagnes?id=${kB}`, [['quoi', 'lancer'], ['confirme', 'oui']]);
    for (let i = 0; i < 40 && !recus.slice(avantB).some((m) => m.idempotence === `campagne:${kB}:${M[2]}`); i++) { await appeler(`${E}/cdn-cgi/handler/scheduled`); await pause(500); }
    sql(`UPDATE categorie SET envoi_groupe_permis = 0 WHERE id = 'lointains'`);
    const mB = recus.slice(avantB).find((m) => m.idempotence === `campagne:${kB}:${M[2]}`);
    constat(!!mB && mB.text.includes(`Bonjour Léa Durand${NUM},`) && mB.html.includes(`Bonjour Léa Durand${NUM},`), '18.18 : relation lointaine : « Bonjour Prénom Nom » (pas de civilité en base)');

    // Vue enregistrée : états ambassadeur combinables, inscrite sans accord écartée.
    sql(`INSERT INTO vue (id, nom, ordre, filtre, created_at, maj_le) VALUES ('01KF18V${NUM}${'0'.repeat(13)}', 'Essai 1818 ambassadeurs', 99, '{"ambassadeur_etat":["inscrit","contacte"],"categorie_id":["anciens_clients"]}', '2026-11-05T08:00:00.000Z', '2026-11-05T08:00:00.000Z')`);
    const vueId = `01KF18V${NUM}${'0'.repeat(13)}`;
    const kV = (await apiC('POST', '', { modele, vue: vueId })).d?.id;
    const hV = (await (await appeler(`${E}/campagnes?id=${kV}`, { headers: avecJeton() })).text()).replaceAll('&#39;', "'");
    constat(hV.includes('data-recoivent="1"') && hV.includes(`value="${vueId}" selected`) && hV.includes(`data-ecartes="Pas d'accord pour recevoir vos e-mails"`) && !hV.includes('data-probleme'),
      '18.18 : vue enregistrée (états « inscrit » et « contacté ») : 1 destinataire, l\'inscrite sans accord est écartée');
    sql(`UPDATE vue SET filtre = '{"categorie_id":["disparue"]}' WHERE id = '${vueId}'`);
    const hV2 = await (await appeler(`${E}/campagnes?id=${kV}`, { headers: avecJeton() })).text();
    constat(hV2.includes('data-probleme') && hV2.includes('data-recoivent="0"'), '18.18 : vue devenue invalide : aucun destinataire, jamais élargie');
    constat((await page(`/campagnes?id=${kV}`, [['quoi', 'lancer'], ['confirme', 'oui']])).status === 200 && sql(`SELECT statut FROM campagne WHERE id = '${kV}'`)[0].statut === 'brouillon', '18.18 : une vue invalide ne peut pas être envoyée');

    // Sans droit à l'envoi groupé : « Écrire » (mailto) puis « Envoyé ».
    const fI = await ficheJ(M[4]);
    constat(fI.envoi_groupe === false && fI.ambassadeur_etat === 'a_contacter' && (await ficheJ(M[3])).envoi_groupe === false, '18.18 : la fiche dit si le contact peut recevoir un envoi groupé (proche sans accord : non)');
    const ec = await apiC('GET', `?modele=${modele}&contact=${M[4]}`);
    constat(ec.status === 200 && ec.d.a === `ines1818+${ESSAI}@example.com` && ec.d.objet === 'Votre carte ambassadeur' && ec.d.texte.startsWith('Bonjour Inès,') && ec.d.texte.includes('recommandation') && ec.d.texte.includes('https://annevialtissot.fr/parrainage?c=email') && !ec.d.texte.includes('[Formule]'),
      '18.18 : « Écrire » : objet et texte du modèle avec la formule remplie, adresse du contact');
    const ecL = await apiC('GET', `?modele=${modele}&contact=${M[2]}`);
    constat(ecL.d?.texte.startsWith(`Bonjour Léa Durand${NUM},`), '18.18 : « Écrire » à une relation lointaine : « Bonjour Prénom Nom »');
    const avantMain = sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${M[4]}'`)[0].n;
    constat(sql(`SELECT dernier_contact_le FROM contact WHERE id = '${M[4]}'`)[0].dernier_contact_le === null, '18.18 : « Écrire » seul n\'écrit rien');
    const env1 = await appeler(`${E}/api/fiche`, { method: 'POST', headers: { 'cf-access-jwt-assertion': JETON, 'Content-Type': 'application/json', Origin: E },
      body: JSON.stringify({ id: M[4], contact: { jour: auj, canal: 'email', note: `Modèle « ${ec.d.modele} » envoyé à la main : ${ec.d.objet}`, envoi_modele: ec.d.modele } }) });
    const fI2 = await ficheJ(M[4]);
    constat(env1.status === 200 && fI2.dernier_contact_canal === 'email' && !!fI2.dernier_contact_le && fI2.ambassadeur_etat === 'contacte' && fI2.historique.length === avantMain + 1
      && fI2.historique[0].texte.includes('envoyé à la main') && fI2.historique[0].texte.includes('Votre carte ambassadeur'),
      '18.18 : « Envoyé » : dernier contact (e-mail, aujourd\'hui), trace « envoyé à la main » sur la fiche, état « Contacté »');
    const mauvais = await appeler(`${E}/api/fiche`, { method: 'POST', headers: { 'cf-access-jwt-assertion': JETON, 'Content-Type': 'application/json', Origin: E }, body: JSON.stringify({ id: M[4], contact: { jour: auj, canal: 'email', envoi_modele: 3 } }) });
    constat(mauvais.status === 400, '18.18 : un nom de modèle qui n\'est pas un texte est refusé');

    // Fiche dans le navigateur : colonne et filtre, bloc « Écrire », puis « Envoyé ».
    const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const o = await ctx.newPage();
    await o.goto(`${E}/?fiche=${M[3]}`);
    await o.waitForSelector('[data-fiche-ecrire]');
    await o.waitForFunction(() => document.querySelector('[data-ecrire-lien]')?.getAttribute('aria-disabled') === null);
    const href = await o.getAttribute('[data-ecrire-lien]', 'href');
    constat(href?.startsWith(`mailto:paul1818+${ESSAI}@example.com?subject=`) && decodeURIComponent(href).includes('Bonjour Paul,') && !(await o.isDisabled('[data-ecrire-envoye]')),
      '18.18 : sur la fiche, « Écrire » ouvre un mailto: avec objet et texte (formule remplie)');
    await o.click('[data-ecrire-envoye]');
    await o.waitForSelector('[data-fiche-ambassadeur="contacte"]');
    constat(sql(`SELECT dernier_contact_canal FROM contact WHERE id = '${M[3]}'`)[0].dernier_contact_canal === 'email' && (await o.textContent('[data-fiche-historique]')).includes('envoyé à la main'),
      '18.18 : « Envoyé » depuis le navigateur : pastille « Ambassadeur : Contacté » et trace dans l\'historique');
    await o.goto(`${E}/?fiche=${M[1]}`);
    await o.waitForSelector('[data-fiche-ambassadeur]');
    constat(await o.locator('[data-fiche-ecrire]').count() === 0, '18.18 : un contact qui peut recevoir un envoi groupé n\'a pas le bloc « Écrire »');
    await o.goto(`${E}/`);
    await o.waitForSelector('[data-lignes] tr[data-contact]');
    await o.fill('[data-recherche]', `Proche${NUM}`); await o.waitForTimeout(300);
    const enteteAmb = await o.locator('th', { hasText: 'Ambassadeur' }).count();
    const pastilleAmb = await o.locator(`tr[data-contact="${M[1]}"] [data-ambassadeur="contacte"]`).count();
    // Tri : À contacter, Contacté, Inscrit.
    await o.fill('[data-recherche]', `1818`); await o.waitForTimeout(100);
    await o.fill('[data-recherche]', ''); await o.waitForTimeout(100);
    await o.click('th button:has-text("Ambassadeur")'); await o.waitForTimeout(300);
    const ordreEtats = await o.$$eval('[data-lignes] tr[data-contact] [data-ambassadeur]', (l) => l.map((e) => e.getAttribute('data-ambassadeur')));
    const rang = { a_contacter: 0, contacte: 1, inscrit: 2 };
    constat(enteteAmb === 1 && pastilleAmb === 1 && ordreEtats.length > 2 && ordreEtats.every((e, i) => i === 0 || rang[ordreEtats[i - 1]] <= rang[e]),
      `18.18 : colonne Ambassadeur (pastille et libellé) triable : À contacter, Contacté, Inscrit (${ordreEtats.join(',')})`);
    await o.screenshot({ path: path.join(OUT, 'espace-colonne-ambassadeur-1280.png') });
    await o.selectOption('[data-filtre=autres]', 'ambassadeur_etat:inscrit'); await o.waitForTimeout(300);
    const filtres = await o.$$eval('[data-lignes] tr[data-contact] [data-ambassadeur]', (l) => [...new Set(l.map((e) => e.getAttribute('data-ambassadeur')))]);
    constat(filtres.length === 1 && filtres[0] === 'inscrit', '18.18 : le filtre « État ambassadeur » ne garde que les inscrits');
    await ctx.close();
  }
  // Story 18.19 (ticket n° 249) : tableau du boîtage (onglet « Boîtage » de /actions, /api/boitage). Ligne ajoutée (colonnes
  // neuves, secteur rempli « ville · quartier »), triée par date décroissante, modifiée, R1 et R2 en nombres (18.20), coût et ancien passage gardés,
  // refus (type de bien inconnu, date mal formée ou future, R1 en date, champ inconnu, jeton absent ou de Claude),
  // puis la page à 1280 px (colonnes dans l'ordre, ajout et modification en place, pas de défilement horizontal).
  // Lancé seul avec E2E_1819_SEUL=1 (après le démarrage des serveurs).
  async function bloc1819() {
    const P = 'E1819';
    const nettoyer = () => sql(`DELETE FROM passage_boitage WHERE secteur LIKE '${P}%' OR ville LIKE '${P}%'`);
    nettoyer();
    const jourDe = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
    const J = { ancien: jourDe(-20), milieu: jourDe(-5), recent: jourDe(-1), futur: jourDe(3) };
    const bt = async (methode, jeton, corps, brut) => {
      const x = await appeler(`${E}/api/boitage`, { method: methode, redirect: 'manual', headers: { 'cf-access-jwt-assertion': jeton, ...(methode === 'POST' ? { 'Content-Type': 'application/json' } : {}), Origin: E }, body: methode === 'POST' ? (brut ?? JSON.stringify(corps)) : undefined });
      let d = null; try { d = await x.json(); } catch {}
      return { status: x.status, d };
    };
    const ligneSql = (id) => sql(`SELECT * FROM passage_boitage WHERE id = '${id}'`)[0];

    // Un passage d'avant la migration (noté sur /ajouter : secteur seul, avec son coût) : gardé tel quel et lisible dans le tableau.
    sql(`INSERT INTO passage_boitage (id, created_at, secteur, fait_le, mots, cout_centimes) VALUES ('01KF1900000000000000000001', '2026-01-01T00:00:00Z', '${P} Ancien secteur', '${J.ancien}', 80, 4500)`);
    let r = await bt('GET', JETON);
    const ancien = r.d?.lignes?.find((l) => l.id === '01KF1900000000000000000001');
    constat(r.status === 200 && ancien?.ville === `${P} Ancien secteur` && ancien.quartier === null && ancien.flyers === 80,
      '18.19 : un passage d\'avant (secteur seul) apparaît dans le tableau, son secteur en guise de ville');

    // Ajout complet puis ajout minimal.
    r = await bt('POST', JETON, { ajouter: { fait_le: J.milieu, ville: `${P} Thonon`, quartier: 'Rives', type_bien: 'maison', flyers: 300, message: '12', r1: 3, r2: 1, commentaire: 'Boîtes pleines <b>côté lac</b>' } });
    const complet = r.d?.id; const c1 = complet ? ligneSql(complet) : null;
    constat(r.status === 201 && c1?.secteur === `${P} Thonon · Rives` && c1.ville === `${P} Thonon` && c1.quartier === 'Rives' && c1.type_bien === 'maison' && c1.mots === 300 && c1.message === '12'
      && c1.r1_nb === 3 && c1.r2_nb === 1 && c1.r1 === null && c1.r2 === null && c1.commentaire === 'Boîtes pleines <b>côté lac</b>' && c1.fait_le === J.milieu && c1.cout_centimes === null && c1.is_test === 0,
      '18.19 : ligne ajoutée (colonnes neuves remplies, flyers dans mots, secteur « ville · quartier »)');
    r = await bt('POST', JETON, { ajouter: { fait_le: J.recent, ville: `${P} Annemasse`, quartier: '', type_bien: '', flyers: null } });
    const mini = r.d?.id; const c2 = mini ? ligneSql(mini) : null;
    constat(r.status === 201 && c2?.secteur === `${P} Annemasse` && c2.quartier === null && c2.type_bien === null && c2.mots === null && c2.r1_nb === null,
      '18.19 : ligne minimale (date et ville seulement) : secteur = la ville, le reste vide');
    r = await bt('POST', JETON, { ajouter: { fait_le: J.ancien, ville: `${P} Evian`, type_bien: 'appartement', flyers: 0 } });
    const evian = r.d?.id;
    constat(r.status === 201 && ligneSql(evian)?.mots === 0 && ligneSql(evian)?.type_bien === 'appartement', '18.19 : zéro flyer accepté (0 n\'est pas « vide »), appartement accepté');

    // Tri par date décroissante.
    r = await bt('GET', JETON);
    const miens = (r.d?.lignes ?? []).filter((l) => l.ville.startsWith(P));
    const dates = miens.map((l) => l.fait_le);
    constat(miens.length === 4 && dates.every((d, i) => i === 0 || dates[i - 1] >= d) && miens[0].id === mini,
      `18.19 : lignes triées par date décroissante (${dates.join(' > ')})`);

    // Modification : champs changés, le reste intact ; le secteur suit la ville et le quartier ; coût conservé.
    r = await bt('POST', JETON, { id: complet, corriger: { flyers: 450, type_bien: 'appartement', r2: '', commentaire: 'Refait' } });
    const c3 = ligneSql(complet);
    constat(r.status === 200 && r.d?.ligne?.flyers === 450 && c3.mots === 450 && c3.type_bien === 'appartement' && c3.r2_nb === null && c3.commentaire === 'Refait'
      && c3.r1_nb === 3 && c3.message === '12' && c3.secteur === `${P} Thonon · Rives`, '18.19 : modification partielle (flyers, type, R2 effacé, commentaire), le reste intact');
    r = await bt('POST', JETON, { id: complet, corriger: { quartier: 'Vallon' } });
    constat(r.status === 200 && ligneSql(complet).secteur === `${P} Thonon · Vallon`, '18.19 : changer le quartier remet le secteur à jour');
    r = await bt('POST', JETON, { id: complet, corriger: { quartier: null } });
    constat(r.status === 200 && ligneSql(complet).secteur === `${P} Thonon` && ligneSql(complet).quartier === null, '18.19 : quartier effacé : le secteur redevient la ville');
    r = await bt('POST', JETON, { id: '01KF1900000000000000000001', corriger: { commentaire: 'Vieux passage' } });
    const a2 = ligneSql('01KF1900000000000000000001');
    constat(r.status === 200 && a2.cout_centimes === 4500 && a2.secteur === `${P} Ancien secteur` && a2.ville === null && a2.commentaire === 'Vieux passage',
      '18.19 : corriger un ancien passage ne touche ni son coût ni son secteur (ville restée vide)');
    constat((await appeler(`${E}/bilan`, { headers: avecJeton() })).status === 200
      && sql(`SELECT sum(coalesce(cout_centimes, 0)) AS c FROM passage_boitage WHERE secteur = '${P} Ancien secteur'`)[0].c === 4500, '18.19 : le bilan s\'ouvre et le coût du boîtage est resté');

    // Refus : rien n'est écrit.
    const avant = sql(`SELECT count(*) AS n, group_concat(coalesce(mots, 'x') || coalesce(type_bien, '-') || coalesce(r1_nb, '-') || coalesce(r2_nb, '-') || fait_le) AS h FROM passage_boitage`)[0];
    const bon = { fait_le: J.milieu, ville: `${P} Refus` };
    const cas = [
      ['type de bien inconnu', { ajouter: { ...bon, type_bien: 'villa' } }], ['type de bien = propriété héritée d\'un objet (toString)', { ajouter: { ...bon, type_bien: 'toString' } }], ['type de bien en majuscule', { ajouter: { ...bon, type_bien: 'Maison' } }],
      ['date mal formée (jj/mm/aaaa)', { ajouter: { ...bon, fait_le: '05/11/2026' } }], ['date impossible', { ajouter: { ...bon, fait_le: '2026-02-31' } }],
      ['date dans le futur', { ajouter: { ...bon, fait_le: J.futur } }], ['date absente', { ajouter: { ville: `${P} Refus` } }], ['ville absente', { ajouter: { fait_le: J.milieu } }],
      ['ville vide', { ajouter: { ...bon, ville: '   ' } }], ['ville trop longue', { ajouter: { ...bon, ville: 'V'.repeat(81) } }],
      ['R1 en date (ancien format)', { ajouter: { ...bon, r1: jourDe(2) } }], ['R2 négatif', { ajouter: { ...bon, r2: -1 } }],
      ['flyers négatif', { ajouter: { ...bon, flyers: -1 } }], ['flyers décimal', { ajouter: { ...bon, flyers: 1.5 } }], ['flyers en texte', { ajouter: { ...bon, flyers: '300' } }], ['flyers énorme', { ajouter: { ...bon, flyers: 1e7 } }],
      ['message trop long', { ajouter: { ...bon, message: 'm'.repeat(41) } }], ['message qui n\'est pas un texte', { ajouter: { ...bon, message: 12 } }], ['champ inconnu', { ajouter: { ...bon, secteur: 'Autre' } }],
      ['corriger : type inconnu', { id: complet, corriger: { type_bien: 'chalet' } }], ['corriger : date mal formée', { id: complet, corriger: { fait_le: 'hier' } }], ['corriger : date future', { id: complet, corriger: { fait_le: J.futur } }],
      ['corriger : R2 en date', { id: complet, corriger: { r2: jourDe(-30) } }], ['corriger : ville vidée', { id: complet, corriger: { ville: '' } }], ['corriger : rien', { id: complet, corriger: {} }],
      ['corriger : champ inconnu', { id: complet, corriger: { cout_centimes: 1 } }], ['deux gestes', { ajouter: bon, id: complet, corriger: { message: '1' } }], ['identifiant invalide', { id: 'x', corriger: { message: '1' } }],
    ];
    const refus = [];
    for (const [nom, corps] of cas) { const x = await bt('POST', JETON, corps); if (x.status !== 400 || x.d?.ok !== false) refus.push(`${nom} ${x.status}`); }
    const apres = sql(`SELECT count(*) AS n, group_concat(coalesce(mots, 'x') || coalesce(type_bien, '-') || coalesce(r1_nb, '-') || coalesce(r2_nb, '-') || fait_le) AS h FROM passage_boitage`)[0];
    constat(refus.length === 0 && apres.n === avant.n && apres.h === avant.h, `18.19 : ${cas.length} saisies invalides refusées en 400, rien d'écrit${refus.length ? ` (acceptées à tort : ${refus.join(', ')})` : ''}`);
    r = await bt('POST', JETON, { id: '01KF1900000000000000000009', corriger: { message: '1' } });
    const texteJson = await bt('POST', JETON, null, 'pas du json');
    const autreType = await appeler(`${E}/api/boitage`, { method: 'POST', headers: { 'cf-access-jwt-assertion': JETON, 'Content-Type': 'text/plain', Origin: E }, body: JSON.stringify({ ajouter: bon }) });
    constat(r.status === 404 && texteJson.status === 400 && autreType.status === 400, '18.19 : passage inconnu 404 ; corps illisible, pas en JSON 400');
    const sans = await appeler(`${E}/api/boitage`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: E }, body: JSON.stringify({ ajouter: bon }) });
    const sansGet = await appeler(`${E}/api/boitage`, { redirect: 'manual' });
    const clau = await bt('POST', JETON_C, { ajouter: bon });
    const clauGet = await bt('GET', JETON_C);
    constat(sans.status === 403 && sansGet.status === 403 && clau.status === 403 && clauGet.status === 403 && sql(`SELECT count(*) AS n FROM passage_boitage WHERE ville = '${P} Refus'`)[0].n === 0,
      `18.19 : /api/boitage refusé sans jeton et avec le jeton de Claude (403), rien écrit (${[sans, sansGet, clau, clauGet].map((x) => x.status).join(', ')})`);

    const trop = await bt('POST', JETON, null, JSON.stringify({ ajouter: { ...bon, commentaire: 'x'.repeat(21000) } }));
    constat(trop.status === 413 && sql(`SELECT count(*) AS n FROM passage_boitage WHERE ville = '${P} Refus'`)[0].n === 0, '18.19 : une demande de plus de 20 000 caractères est refusée (413)');

    // La page, à 1280 px : colonnes dans l'ordre, ajout, modification en place, pas de défilement horizontal.
    const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const o = await ctx.newPage();
    const erreursPage = []; o.on('pageerror', (e) => erreursPage.push(e.message));
    await o.goto(`${E}/actions`);
    constat(await o.locator('[data-onglet-boitage]').count() === 1 && await o.locator('[data-actions], [data-action-form]').count() >= 1 && await o.locator('[data-boitage]').count() === 0,
      '18.19 : /actions garde ses actions ; l\'onglet « Boîtage » y mène');
    await o.goto(`${E}/actions?onglet=boitage`);
    await o.waitForSelector('[data-bt-ajout]');
    const entetes = await o.$$eval('[data-bt-tableau] thead th', (t) => t.map((x) => x.textContent.trim()));
    constat(entetes.slice(0, 9).join('|') === 'Date|Ville|Quartier|Type de bien|Flyers|Message|R1|R2|Commentaires' && entetes.length === 10,
      `18.19 : colonnes dans l'ordre demandé (${entetes.slice(0, 9).join(', ')}) plus la colonne des boutons`);
    const lignesPage = await o.$$eval('[data-bt-lignes] tr[data-bt-ligne]', (t) => t.map((x) => [x.dataset.btLigne, x.children[1].textContent]));
    constat(lignesPage.length >= 4 && lignesPage.findIndex(([, v]) => v === `${P} Annemasse`) < lignesPage.findIndex(([, v]) => v === `${P} Thonon`) && lignesPage.findIndex(([, v]) => v === `${P} Thonon`) < lignesPage.findIndex(([, v]) => v === `${P} Evian`),
      '18.19 : la page montre les lignes du plus récent au plus ancien');
    const lecturePage = await o.$$eval('[data-bt-lignes] tr[data-bt-ligne]', (t, ville) => t.filter((x) => x.children[1].textContent === ville).map((x) => [...x.children].map((c) => c.textContent.trim())), `${P} Thonon`);
    constat(lecturePage[0]?.[6] === '3' && lecturePage[0]?.[7] === '—' && lecturePage[0]?.[5] === '12' && lecturePage[0]?.[2] === '—', '18.19 : une valeur vide se lit « — », le numéro de message est affiché');

    // Ajout par la ligne du haut (Entrée valide). Date, ville, quartier et type restent pour le passage suivant.
    const ligneAjout = o.locator('[data-bt-ajout]');
    await ligneAjout.locator('[name=fait_le]').fill(J.milieu);
    await ligneAjout.locator('[name=ville]').fill(`${P} Sciez`);
    await ligneAjout.locator('[name=quartier]').fill('Chavannex');
    await ligneAjout.locator('[name=type_bien]').selectOption('maison');
    await ligneAjout.locator('[name=flyers]').fill('220');
    await ligneAjout.locator('[name=message]').fill('7');
    await ligneAjout.locator('[name=commentaire]').fill('<img src=x onerror=window.__xss=1>');
    await ligneAjout.locator('[name=commentaire]').press('Enter');
    await o.waitForSelector(`[data-bt-ligne] td:text-is("${P} Sciez")`);
    const sciez = sql(`SELECT * FROM passage_boitage WHERE ville = '${P} Sciez'`)[0];
    const reste = await o.evaluate(() => ({ ville: document.querySelector('[data-bt-ajout] [name=ville]').value, flyers: document.querySelector('[data-bt-ajout] [name=flyers]').value, xss: window.__xss === 1, img: document.querySelectorAll('[data-bt-lignes] img').length }));
    constat(sciez?.mots === 220 && sciez.message === '7' && sciez.secteur === `${P} Sciez · Chavannex` && reste.ville === `${P} Sciez` && reste.flyers === '' && !reste.xss && reste.img === 0,
      '18.19 : ajout par la ligne du haut ; ville gardée pour le suivant, flyers vidés ; le texte saisi n\'est jamais interprété comme du HTML');
    // Erreur affichée dans la page sans rien perdre.
    await ligneAjout.locator('[name=ville]').fill('');
    await ligneAjout.locator('[data-bt-enregistrer]').click();
    await o.waitForSelector('[data-bt-erreur]:not([hidden])');
    constat((await o.textContent('[data-bt-erreur]')).includes('ville') && await ligneAjout.locator('[name=flyers]').count() === 1 && sql(`SELECT count(*) AS n FROM passage_boitage WHERE ville LIKE '${P}%'`)[0].n === 4,
      '18.19 : sans ville, le message s\'affiche dans la page et rien n\'est écrit');
    await ligneAjout.locator('[name=ville]').fill(`${P} Sciez`);

    // Modification en place.
    const idEvian = evian;
    await o.locator(`[data-bt-ligne="${idEvian}"] [data-bt-modifier]`).click();
    await o.waitForSelector(`[data-bt-edition="${idEvian}"]`);
    const edition = o.locator(`[data-bt-edition="${idEvian}"]`);
    constat(await edition.locator('[name=type_bien]').inputValue() === 'appartement' && await edition.locator('[name=flyers]').inputValue() === '0' && await o.locator('[data-bt-edition]').count() === 1,
      '18.19 : « Modifier » ouvre la ligne en place avec ses valeurs');
    await edition.locator('[name=flyers]').fill('125');
    await edition.locator('[name=r1]').fill('2');
    await edition.locator('[name=commentaire]').fill('Deuxième passage');
    await edition.locator('[data-bt-enregistrer]').click();
    await o.waitForSelector(`[data-bt-ligne="${idEvian}"]`);
    const apresEdition = ligneSql(idEvian);
    constat(apresEdition.mots === 125 && apresEdition.r1_nb === 2 && apresEdition.commentaire === 'Deuxième passage' && await o.locator('[data-bt-edition]').count() === 0
      && (await o.textContent(`[data-bt-ligne="${idEvian}"]`)).includes('Deuxième passage'), '18.19 : modification enregistrée en place, la ligne redevient lisible');
    await o.locator(`[data-bt-ligne="${idEvian}"] [data-bt-modifier]`).click();
    await o.locator(`[data-bt-edition="${idEvian}"] [name=commentaire]`).fill('Ne doit pas partir');
    await o.locator(`[data-bt-edition="${idEvian}"] [name=commentaire]`).press('Escape');
    constat(ligneSql(idEvian).commentaire === 'Deuxième passage' && await o.locator('[data-bt-edition]').count() === 0, '18.19 : Échap annule la modification, rien n\'est écrit');

    const largeur = await o.evaluate(() => ({ boite: document.querySelector('.bt-boite').scrollWidth - document.querySelector('.bt-boite').clientWidth, page: document.documentElement.scrollWidth - window.innerWidth }));
    constat(largeur.boite <= 0 && largeur.page <= 0, `18.19 : pas de défilement horizontal à 1280 px (tableau ${largeur.boite}, page ${largeur.page})`);
    await o.screenshot({ path: path.join(OUT, 'espace-boitage-1280.png'), fullPage: true });
    constat(erreursPage.length === 0, `18.19 : aucune erreur JavaScript dans la page${erreursPage.length ? ` (${erreursPage[0]})` : ''}`);
    await ctx.close();
    nettoyer();
  }
  // Story 18.20 (tickets n° 256 à 258) : R1 et R2 sont des rendez-vous. Passage noté sur /ajouter (ville, quartier, flyers, R1, R2,
  // commentaire) qui arrive dans le tableau du boîtage avec le secteur « ville · quartier » ; /api/boitage : R1 et R2 en nombres
  // (une date, un négatif, 10000 refusés) ; fiche d'un contact : dates R1 et R2 posées, R2 avant R1 refusé, effacées, étape
  // du suivi intacte ; page Contacts : colonnes R1 et R2 affichées, triées et masquables.
  // Lancé seul avec E2E_1820_SEUL=1 (après le démarrage des serveurs).
  async function bloc1820() {
    const P = 'E1820';
    const nettoyer = () => { sql(`DELETE FROM passage_boitage WHERE secteur LIKE '${P}%' OR ville LIKE '${P}%'`); sql(`DELETE FROM contact WHERE id IN ('01KF2000000000000000000001', '01KF2000000000000000000002')`); };
    nettoyer();
    const jourDe = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
    const bt = async (corps) => {
      const x = await appeler(`${E}/api/boitage`, { method: 'POST', redirect: 'manual', headers: { 'cf-access-jwt-assertion': JETON, 'Content-Type': 'application/json', Origin: E }, body: JSON.stringify(corps) });
      let d = null; try { d = await x.json(); } catch {}
      return { status: x.status, d };
    };

    // 1. /ajouter : le formulaire du passage écrit par le même chemin que le tableau.
    let r = await page('/ajouter', { quoi: 'passage', fait_le: auj, ville: `${P} Sciez`, quartier: 'Chavannex', flyers: '400', cout: '39,90', r1: '3', r2: '1', commentaire: 'Boîtes <b>pleines</b>' });
    const p1 = sql(`SELECT * FROM passage_boitage WHERE ville = '${P} Sciez'`)[0];
    constat(r.status === 303 && r.headers.get('location') === '/ajouter?m=passage#passage' && p1?.secteur === `${P} Sciez · Chavannex` && p1.quartier === 'Chavannex' && p1.mots === 400
      && p1.cout_centimes === 3990 && p1.r1_nb === 3 && p1.r2_nb === 1 && p1.r1 === null && p1.r2 === null && p1.commentaire === 'Boîtes <b>pleines</b>' && p1.fait_le === auj,
      '18.20 : /ajouter (ville, quartier, flyers, coût, R1, R2, commentaire) écrit un passage complet, secteur « ville · quartier »');
    r = await page('/ajouter', { quoi: 'passage', fait_le: auj, ville: `${P} Anthy` });
    const p2 = sql(`SELECT * FROM passage_boitage WHERE ville = '${P} Anthy'`)[0];
    constat(r.status === 303 && p2?.secteur === `${P} Anthy` && p2.quartier === null && p2.mots === null && p2.r1_nb === null && p2.r2_nb === null && p2.commentaire === null && p2.cout_centimes === null,
      '18.20 : /ajouter avec la ville seule : secteur = la ville, le reste vide');
    // Refus : la saisie reste affichée, rien n'est écrit.
    const avant = sql(`SELECT count(*) AS n FROM passage_boitage`)[0].n;
    const refus = [];
    for (const [nom, champs, texte] of [
      ['sans ville', { fait_le: auj, ville: ' ', r1: '2' }, 'ville'], ['R1 négatif', { fait_le: auj, ville: `${P} X`, r1: '-1' }, 'nombres entiers'], ['R2 de 10000', { fait_le: auj, ville: `${P} X`, r2: '10000' }, 'R2'],
      ['R1 décimal', { fait_le: auj, ville: `${P} X`, r1: '1.5' }, 'nombres entiers'], ['date future', { fait_le: jourDe(3), ville: `${P} X` }, 'futur'], ['coût illisible', { fait_le: auj, ville: `${P} X`, cout: 'beaucoup' }, 'coût'],
    ]) {
      r = await page('/ajouter', { quoi: 'passage', flyers: '5', commentaire: 'garde-moi', ...champs });
      const h = await r.text();
      if (r.status !== 200 || !h.includes('data-erreur') || !h.toLowerCase().includes(texte.toLowerCase()) || !h.includes('garde-moi')) refus.push(nom);
    }
    constat(refus.length === 0 && sql(`SELECT count(*) AS n FROM passage_boitage`)[0].n === avant, `18.20 : saisies invalides de /ajouter refusées avec un message, la saisie gardée, rien d'écrit${refus.length ? ` (à revoir : ${refus.join(', ')})` : ''}`);
    r = await appeler(`${E}/ajouter`, { headers: avecJeton() });
    const h = await r.text();
    constat(h.includes('name="ville"') && h.includes('name="quartier"') && h.includes('name="flyers"') && h.includes('name="r1"') && h.includes('name="r2"') && h.includes('name="commentaire"') && !h.includes('name="secteur"') && !h.includes('name="mots"')
      && h.includes(`value="${P} Sciez"`) && h.includes('Nombre de flyers'), '18.20 : le formulaire du passage a Ville, Quartier, Nombre de flyers, R1, R2 et Commentaires (plus de « Secteur »), les villes connues en suggestion');

    // 2. Le tableau du boîtage les montre, avec R1 et R2 en nombres.
    let x = await appeler(`${E}/api/boitage`, { headers: avecJeton() });
    const lignes = (await x.json()).lignes;
    const l1 = lignes.find((l) => l.ville === `${P} Sciez`);
    constat(l1?.quartier === 'Chavannex' && l1.flyers === 400 && l1.r1 === 3 && l1.r2 === 1 && l1.commentaire === 'Boîtes <b>pleines</b>', '18.20 : le passage de /ajouter est dans le tableau du boîtage (R1 3, R2 1)');

    // 3. /api/boitage : nombres acceptés, dates et hors bornes refusés.
    r = await bt({ ajouter: { fait_le: auj, ville: `${P} Evian`, r1: 0, r2: 9999 } });
    const ev = r.d?.id ? sql(`SELECT * FROM passage_boitage WHERE id = '${r.d.id}'`)[0] : null;
    constat(r.status === 201 && ev?.r1_nb === 0 && ev.r2_nb === 9999 && r.d.ligne.r1 === 0 && r.d.ligne.r2 === 9999, '18.20 : /api/boitage accepte R1 = 0 et R2 = 9999 (0 n\'est pas « vide »)');
    r = await bt({ id: ev.id, corriger: { r1: 12, r2: '' } });
    const ev2 = sql(`SELECT * FROM passage_boitage WHERE id = '${ev.id}'`)[0];
    constat(r.status === 200 && ev2.r1_nb === 12 && ev2.r2_nb === null && r.d.ligne.r2 === null, '18.20 : corriger R1 en nombre et vider R2');
    const avantApi = sql(`SELECT count(*) AS n, group_concat(coalesce(r1_nb, '-') || coalesce(r2_nb, '-') || coalesce(r1, '-') || coalesce(r2, '-')) AS h FROM passage_boitage`)[0];
    const bon = { fait_le: auj, ville: `${P} Refus` };
    const cas = [
      ['R1 en date', { ajouter: { ...bon, r1: jourDe(1) } }], ['R1 négatif', { ajouter: { ...bon, r1: -1 } }], ['R1 = 10000', { ajouter: { ...bon, r1: 10000 } }], ['R2 = 10000', { ajouter: { ...bon, r2: 10000 } }],
      ['R1 décimal', { ajouter: { ...bon, r1: 1.5 } }], ['R1 en texte', { ajouter: { ...bon, r1: '3' } }], ['corriger : R1 en date', { id: ev.id, corriger: { r1: jourDe(-2) } }],
      ['corriger : R2 négatif', { id: ev.id, corriger: { r2: -4 } }], ['corriger : R1 = 10000', { id: ev.id, corriger: { r1: 10000 } }], ['coût par l\'API', { ajouter: { ...bon, cout_centimes: 100 } }],
    ];
    const mal = [];
    for (const [nom, corps] of cas) { const y = await bt(corps); if (y.status !== 400 || y.d?.ok !== false) mal.push(`${nom} ${y.status}`); }
    const apresApi = sql(`SELECT count(*) AS n, group_concat(coalesce(r1_nb, '-') || coalesce(r2_nb, '-') || coalesce(r1, '-') || coalesce(r2, '-')) AS h FROM passage_boitage`)[0];
    constat(mal.length === 0 && apresApi.n === avantApi.n && apresApi.h === avantApi.h, `18.20 : ${cas.length} valeurs de R1 / R2 refusées en 400 (date, négatif, 10000, décimal, texte), rien d'écrit${mal.length ? ` (acceptées à tort : ${mal.join(', ')})` : ''}`);

    // 4. La fiche d'un contact : dates R1 et R2.
    const C = '01KF2000000000000000000001', C2 = '01KF2000000000000000000002';
    sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, categorie_id, projet, temperature, telephone, etape, prochaine_action, prochaine_action_le) VALUES
         ('${C}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Rose', 'Rdvun${NUM}', '${P}-ville', 'edb', 'vendeur', 'avec_anne', '+33652${NUM}', 'premier_rdv', 'Rappeler', '2026-12-01')`);
    sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, categorie_id, projet, telephone) VALUES
         ('${C2}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Remi', 'Rdvdeux${NUM}', '${P}-ville', 'edb', 'vendeur', '+33653${NUM}')`);
    const fiche = async (corps, id = null, methode = 'POST') => {
      const y = await appeler(`${E}/api/fiche${id ? `?id=${id}` : ''}`, { method: methode, redirect: 'manual', headers: { 'cf-access-jwt-assertion': JETON, ...(methode === 'POST' ? { 'Content-Type': 'application/json' } : {}), Origin: E }, body: methode === 'POST' ? JSON.stringify(corps) : undefined });
      let d = null; try { d = await y.json(); } catch {}
      return { status: y.status, d };
    };
    const ligneC = (id) => sql(`SELECT * FROM contact WHERE id = '${id}'`)[0];
    const evC = (id) => { const e = sql(`SELECT type, source, donnees, par FROM contact_evenement WHERE contact_id = '${id}' ORDER BY id DESC LIMIT 1`)[0]; return e ? { ...e, d: JSON.parse(e.donnees) } : null; };
    const R1 = jourDe(-10), R2 = jourDe(-3);
    r = await fiche({ id: C, corriger: { r1_le: R1, r2_le: R2 } });
    const e1 = evC(C);
    constat(r.status === 200 && ligneC(C).r1_le === R1 && ligneC(C).r2_le === R2 && r.d.fiche.r1_le === R1 && r.d.fiche.r2_le === R2 && r.d.ligne.r1_le === R1 && r.d.ligne.r2_le === R2
      && e1.type === 'classement' && e1.source === 'anne' && !!e1.par && e1.d.avant.r1_le === null && e1.d.apres.r1_le === R1 && e1.d.apres.r2_le === R2
      && ligneC(C).etape === 'premier_rdv' && ligneC(C).temperature === 'avec_anne' && ligneC(C).prochaine_action === 'Rappeler' && ligneC(C).last_activity_at === '2026-10-01T08:00:00Z',
      '18.20 : dates R1 et R2 posées sur la fiche (avant-image gardée), étape, température et rappel du suivi intacts');
    r = await fiche(null, C, 'GET');
    constat(r.status === 200 && r.d.fiche.r1_le === R1 && r.d.fiche.r2_le === R2, '18.20 : GET /api/fiche renvoie r1_le et r2_le');
    const avantC = JSON.stringify(ligneC(C)), nEv = sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${C}'`)[0].n;
    const cas2 = [['R2 avant R1 (les deux)', { r1_le: R2, r2_le: R1 }, 'ordre'], ['R2 avant le R1 déjà noté', { r2_le: jourDe(-20) }, 'ordre'], ['R1 après le R2 déjà noté', { r1_le: jourDe(-1) }, 'ordre'],
      ['date impossible', { r1_le: '2026-02-31' }, 'correction'], ['date mal formée', { r2_le: '12/11/2026' }, 'correction'], ['date en nombre', { r1_le: 20261112 }, 'correction']];
    const mal2 = [];
    for (const [nom, corriger, code] of cas2) {
      const y = await fiche({ id: C, corriger });
      if (y.status !== 400 || y.d?.error?.code !== code || (code === 'ordre' && !/R2.*R1/.test(y.d.error.message))) mal2.push(`${nom} ${y.status} ${y.d?.error?.code}`);
    }
    constat(mal2.length === 0 && JSON.stringify(ligneC(C)) === avantC && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${C}'`)[0].n === nEv,
      `18.20 : R2 avant R1 et dates invalides refusés (400, message clair), contact et historique intacts${mal2.length ? ` (à revoir : ${mal2.join(', ')})` : ''}`);
    r = await fiche({ id: C, corriger: { r1_le: R1, r2_le: R2 } });
    constat(r.status === 200 && r.d.changes.length === 0, '18.20 : redire les mêmes dates ne change rien');
    r = await fiche({ id: C, corriger: { r2_le: null } });
    constat(r.status === 200 && ligneC(C).r2_le === null && ligneC(C).r1_le === R1 && evC(C).d.avant.r2_le === R2 && evC(C).d.apres.r2_le === null, '18.20 : effacer R2 garde R1, avant-image notée');
    r = await fiche({ id: C, corriger: { r1_le: null } });
    constat(r.status === 200 && ligneC(C).r1_le === null && ligneC(C).r2_le === null, '18.20 : effacer R1 aussi');
    r = await fiche({ id: C2, corriger: { r2_le: R2 } });
    constat(r.status === 200 && ligneC(C2).r2_le === R2 && ligneC(C2).r1_le === null, '18.20 : un R2 seul, sans R1, est permis');
    r = await fiche({ id: C2, corriger: { r1_le: jourDe(-30) } });
    constat(r.status === 200 && ligneC(C2).r1_le === jourDe(-30), '18.20 : R1 posé ensuite, avant le R2');
    // Le jeton de Claude ne passe pas.
    x = await appeler(`${E}/api/fiche`, { method: 'POST', headers: { 'cf-access-jwt-assertion': JETON_C, 'Content-Type': 'application/json', Origin: E }, body: JSON.stringify({ id: C, corriger: { r1_le: R1 } }) });
    constat(x.status === 403 && ligneC(C).r1_le === null, '18.20 : le jeton de Claude ne peut pas écrire une date de rendez-vous (403)');
    // On remet R1 et R2 pour la page.
    await fiche({ id: C, corriger: { r1_le: R1, r2_le: R2 } });

    // 5. La page Contacts : colonnes R1 et R2, tri, masquage ; la fiche dans le panneau.
    const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const o = await ctx.newPage();
    const erreursPage = []; o.on('pageerror', (e) => erreursPage.push(e.message));
    await o.goto(`${E}/`);
    const attendre = () => o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
    await attendre();
    await o.fill('[data-recherche]', `rdv`); await o.waitForTimeout(400); await attendre();
    const entetes = await o.$$eval('[data-entetes] th', (t) => t.map((x) => x.textContent.replace(/[▲▼]/g, '').trim()));
    const iR1 = entetes.indexOf('R1'), iR2 = entetes.indexOf('R2');
    constat(iR1 > 0 && iR2 === iR1 + 1 && await o.locator('[data-trier=r1]').count() === 1 && await o.locator('[data-trier=r2]').count() === 1, `18.20 : colonnes R1 et R2 dans le tableau, triables (${entetes.join(', ')})`);
    const court = (d) => new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${d}T00:00:00Z`));
    const cellules = async (id) => o.$$eval(`tr[data-contact="${id}"] td`, (t) => t.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
    const cA = await cellules(C), cB = await cellules(C2);
    constat(cA[iR1] === court(R1) && cA[iR2] === court(R2) && cB[iR1] === court(jourDe(-30)) && cB[iR2] === court(R2) && (await o.locator(`tr[data-contact="${C}"] td`).nth(iR1).innerText()).includes(court(R1)),
      `18.20 : la table montre les dates en français court (${cA[iR1]}, ${cA[iR2]})`);
    // Tri par R1 : C2 (R1 plus ancien) avant C en croissant, après en décroissant ; un contact sans R1 reste en fin de liste.
    const ordre = async () => o.$$eval('[data-lignes] tr[data-contact]', (t) => t.map((x) => x.dataset.contact));
    await o.fill('[data-recherche]', `rdv`); await o.waitForTimeout(300);
    await o.click('[data-trier=r1]'); await o.waitForTimeout(200); await attendre();
    const asc = await ordre();
    await o.click('[data-trier=r1]'); await o.waitForTimeout(200); await attendre();
    const desc = await ordre();
    constat(asc.indexOf(C2) >= 0 && asc.indexOf(C2) < asc.indexOf(C) && desc.indexOf(C) < desc.indexOf(C2), `18.20 : tri par R1, croissant puis décroissant (${court(jourDe(-30))} avant ${court(R1)})`);
    // Masquer une colonne : elle disparaît du tableau.
    await o.click('[data-colonnes] summary');
    await o.uncheck('[data-colonnes-liste] input[value=r1]');
    await o.waitForTimeout(200);
    const sansR1 = await o.$$eval('[data-entetes] th', (t) => t.map((x) => x.textContent.replace(/[▲▼]/g, '').trim()));
    constat(!sansR1.includes('R1') && sansR1.includes('R2'), '18.20 : la colonne R1 se masque depuis le menu Colonnes');
    await o.check('[data-colonnes-liste] input[value=r1]');
    // La fiche : champs de date, correction par le panneau, message clair pour R2 avant R1.
    await o.click(`tr[data-contact="${C}"] [data-ouvrir-fiche]`);
    await o.waitForSelector('[data-fiche-form]');
    const champs = await o.$$eval('[data-fiche-form] input[type=date]', (t) => t.map((x) => [x.name, x.value]));
    constat(champs.some(([n, v]) => n === 'r1_le' && v === R1) && champs.some(([n, v]) => n === 'r2_le' && v === R2) && (await o.textContent('[data-fiche-form]')).includes('R1 (premier rendez-vous)') && (await o.textContent('[data-fiche-form]')).includes('R2 (second rendez-vous)'),
      '18.20 : la fiche a deux champs date « R1 (premier rendez-vous) » et « R2 (second rendez-vous) », avec les valeurs notées');
    await o.fill('[data-fiche-form] input[name=r2_le]', jourDe(-40));
    await o.click('[data-fiche-enregistrer]');
    await o.waitForSelector('[data-fiche-message].erreur');
    constat((await o.textContent('[data-fiche-message]')).includes('R2') && ligneC(C).r2_le === R2, '18.20 : dans la fiche, R2 avant R1 affiche un message clair et rien n\'est écrit');
    await o.fill('[data-fiche-form] input[name=r2_le]', '');
    await o.fill('[data-fiche-form] input[name=r1_le]', jourDe(-12));
    await o.click('[data-fiche-enregistrer]');
    await o.waitForSelector('[data-fiche-message]:not(.erreur)');
    const apres = ligneC(C);
    await o.waitForTimeout(200);
    constat(apres.r1_le === jourDe(-12) && apres.r2_le === null && (await o.locator(`tr[data-contact="${C}"]`).innerText()).includes(court(jourDe(-12))),
      '18.20 : enregistrer la fiche change R1, efface R2, et la ligne du tableau suit sans recharger');
    const largeur = await o.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    constat(largeur <= 0 && erreursPage.length === 0, `18.20 : pas de défilement horizontal de la page à 1440 px ni d'erreur JavaScript${erreursPage.length ? ` (${erreursPage[0]})` : ''}`);
    await o.screenshot({ path: path.join(OUT, 'espace-contacts-r1-r2-1440.png') });
    await ctx.close();

    // 6. L'import (claude-import) n'écrit pas ces colonnes : ni dans le code de l'import, ni dans celui des lots.
    const sources = ['scripts/claude-import.mjs', 'src/server/import.ts'].map((f) => fs.readFileSync(path.join(ICI, f), 'utf8')).join('\n');
    constat(!/r1_le|r2_le/.test(sources), '18.20 : les outils d\'import ne nomment ni r1_le ni r2_le');
    nettoyer();
  }
  // Story 18.21 (tickets n° 264 à 266) : projet « Aucun » (sans température), colonne « Source » = origine d'affaires (`contact.canal`)
  // changée par une liste de six choix dans le tableau et sur la fiche, sources d'import sur la fiche seulement, ambassadeur « Partant »
  // noté à la main (fiche et pastille du tableau), vert, trié et filtré ; jeton de Claude refusé ; l'import n'écrit rien de tout cela.
  // Lancé seul avec E2E_1821_SEUL=1 (après le démarrage des serveurs).
  async function bloc1821() {
    const P = 'E1821';
    const ids = Array.from({ length: 9 }, (_, i) => `01KF21${String(i + 1).padStart(2, '0')}${NUM}${'0'.repeat(12)}`);
    const [A, B, E5, Q1, Q2, Q3, Q4, V1, V2] = ids;
    const nettoyer = () => { sql(`DELETE FROM contact WHERE id IN (${ids.map((i) => `'${i}'`).join(',')})`); sql(`DELETE FROM vue WHERE nom LIKE '${P}%'`); };
    nettoyer();
    const jourParis = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const nomDe = (n) => `Sourcea${P}${NUM}${n}`;
    const ins = (id, n, cols) => sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, categorie_id, telephone${Object.keys(cols).map((k) => `, ${k}`).join('')}) VALUES
      ('${id}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Sam', '${nomDe(n)}', '${P}-ville', 'edb', '+3366${NUM}${n}'${Object.values(cols).map((v) => `, ${v === null ? 'NULL' : `'${v}'`}`).join('')})`);
    ins(A, 1, { projet: 'vendeur', temperature: 'chaud', canal: 'site' });
    ins(B, 2, { projet: 'a_qualifier' });
    ins(E5, 3, { projet: 'vendeur', temperature: 'chaud' });
    ins(Q1, 4, { projet: 'ambassadeur' });
    ins(Q2, 5, { projet: 'ambassadeur' });
    ins(Q3, 6, { projet: 'ambassadeur', ambassadeur_partant_le: '2026-11-01' });
    ins(Q4, 7, { projet: 'ambassadeur', ambassadeur_inscrit_le: '2026-10-05T08:00:00Z', ambassadeur_reglement: 'v1' });
    ins(V1, 8, { projet: 'vendeur' });
    ins(V2, 9, { projet: 'acheteur', ambassadeur_inscrit_le: '2026-10-05T08:00:00Z', ambassadeur_reglement: 'v1' });
    // Q2 est « contacté » : un modèle lui a été envoyé (événement qui porte envoi_modele).
    sql(`INSERT INTO contact_evenement (contact_id, a, type, source, texte, donnees, par) VALUES ('${Q2}', '2026-10-20T08:00:00Z', 'email', 'anne', 'Modèle envoyé', '{"envoi_modele":"essai"}', 'anne@example.com')`);
    // A garde ses sources d'import (visibles sur la fiche seulement).
    sql(`INSERT INTO contact_source (contact_id, source, a) VALUES ('${A}', 'telephone', '2026-10-01T08:00:00Z'), ('${A}', 'linkedin', '2026-10-02T08:00:00Z')`);
    const api = async (route, corps, jeton = JETON) => {
      const y = await appeler(`${E}/api/${route}`, { method: 'POST', redirect: 'manual', headers: { 'cf-access-jwt-assertion': jeton, 'Content-Type': 'application/json', Origin: E }, body: JSON.stringify(corps) });
      let d = null; try { d = await y.json(); } catch {}
      return { status: y.status, d };
    };
    const fiche = (id, corriger, jeton) => api('fiche', { id, corriger }, jeton);
    const carnet = (idsL, changements, jeton) => api('carnet', { ids: idsL, changements }, jeton);
    const ligne = (id) => sql(`SELECT * FROM contact WHERE id = '${id}'`)[0];
    const evDernier = (id) => { const e = sql(`SELECT type, source, donnees, par FROM contact_evenement WHERE contact_id = '${id}' ORDER BY id DESC LIMIT 1`)[0]; return e ? { ...e, d: JSON.parse(e.donnees) } : null; };
    const nEv = (id) => sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${id}'`)[0].n;
    const refusee = (q) => { try { sql(q); return false; } catch { return true; } };

    // 1. La base (migration 0025) : « aucun » sans température, « pige » en canal, nouvelle colonne en dates.
    constat(!refusee(`UPDATE contact SET projet = 'aucun' WHERE id = '${V1}'`) && refusee(`UPDATE contact SET temperature = 'froid' WHERE id = '${V1}'`) && !refusee(`UPDATE contact SET projet = 'vendeur' WHERE id = '${V1}'`),
      '18.21 : la base accepte le projet « aucun » mais pas avec une température');
    constat(!refusee(`UPDATE contact SET canal = 'pige' WHERE id = '${V1}'`) && refusee(`UPDATE contact SET canal = 'telephone' WHERE id = '${V1}'`) && !refusee(`UPDATE contact SET canal = NULL WHERE id = '${V1}'`)
      && !refusee(`UPDATE contact SET ambassadeur_partant_le = '2026-11-10' WHERE id = '${V1}'`) && refusee(`UPDATE contact SET ambassadeur_partant_le = 'oui' WHERE id = '${V1}'`) && !refusee(`UPDATE contact SET ambassadeur_partant_le = NULL WHERE id = '${V1}'`),
      '18.21 : la base accepte le canal « pige » et une date « partant » (pas un texte), refuse un canal inconnu');

    // 2. Projet « Aucun » (ticket 266) : par la fiche et par le carnet, sans température.
    let r = await fiche(B, { projet: 'aucun' });
    let e = evDernier(B);
    constat(r.status === 200 && ligne(B).projet === 'aucun' && ligne(B).temperature === null && r.d.ligne.projet === 'aucun' && e.type === 'classement' && e.d.avant.projet === 'a_qualifier' && e.d.apres.projet === 'aucun' && !!e.par,
      '18.21 : projet « Aucun » posé depuis la fiche, avant-image gardée');
    r = await fiche(E5, { projet: 'aucun' });
    constat(r.status === 200 && ligne(E5).projet === 'aucun' && ligne(E5).temperature === null && evDernier(E5).d.avant.temperature === 'chaud' && evDernier(E5).d.apres.temperature === null,
      '18.21 : un contact vendeur « chaud » passé à « Aucun » perd sa température (gardée dans l\'avant-image)');
    const nE5 = nEv(E5);
    r = await carnet([E5], { temperature: 'chaud' });
    constat(r.status === 200 && r.d.touches === 0 && r.d.ignores === 1 && ligne(E5).temperature === null && nEv(E5) === nE5, '18.21 : pas de température pour « Aucun » : demande ignorée, rien d\'écrit (carnet)');
    r = await fiche(E5, { temperature: 'froid' });
    constat(r.status === 200 && r.d.ignore === true && ligne(E5).temperature === null, '18.21 : pas de température pour « Aucun » : demande ignorée (fiche)');
    r = await carnet([V1], { projet: 'aucun' });
    constat(r.status === 200 && r.d.touches === 1 && ligne(V1).projet === 'aucun', '18.21 : projet « Aucun » posé par le carnet (lot)');
    r = await carnet([V1], { projet: 'vendeur' });
    r = await carnet([V1], { projet: 'sponsorise' });
    constat(r.status === 400 && ligne(V1).projet === 'vendeur', '18.21 : un projet inconnu reste refusé (400)');
    r = await fiche(E5, { projet: 'vendeur' });

    // 3. Source = canal (ticket 265) : les six choix, l'effacement, le refus du reste.
    const CHOIX = ['pige', 'boitage', 'portail', 'recommandation', 'evenement', 'autre'];
    const mal = [];
    for (const c of CHOIX) {
      const n0 = nEv(B);
      const y = await carnet([B], { canal: c });
      const ev = evDernier(B);
      if (y.status !== 200 || y.d.touches !== 1 || ligne(B).canal !== c || y.d.lignes[0].canal !== c || ev.type !== 'classement' || ev.d.apres.canal !== c || nEv(B) !== n0 + 1 || !ev.par) mal.push(c);
    }
    constat(mal.length === 0 && evDernier(B).d.avant.canal === 'evenement', `18.21 : les six choix de la source (pige, boîtage, portail, reco, évènementiel, autre) s'écrivent dans canal, chacun avec son événement et son avant-image${mal.length ? ` (à revoir : ${mal.join(', ')})` : ''}`);
    r = await carnet([B], { canal: null });
    constat(r.status === 200 && ligne(B).canal === null && evDernier(B).d.avant.canal === 'autre', '18.21 : la source s\'efface (valeur vide)');
    const avantB = JSON.stringify(ligne(B)), nB = nEv(B);
    const refus = [];
    for (const [nom, c] of [['telephone', 'telephone'], ['ancien canal site', 'site'], ['ancien canal reseaux', 'reseaux'], ['rencontre', 'rencontre'], ['vide', ''], ['nombre', 3], ['liste', ['pige']], ['majuscule', 'Pige'], ['injection', "pige'; DROP TABLE contact;--"]]) {
      const y = await carnet([B], { canal: c });
      if (y.status !== 400) refus.push(`${nom} ${y.status}`);
      const z = await fiche(B, { canal: c });
      if (z.status !== 400) refus.push(`fiche ${nom} ${z.status}`);
    }
    constat(refus.length === 0 && JSON.stringify(ligne(B)) === avantB && nEv(B) === nB, `18.21 : un canal hors des six choix est refusé en 400 (carnet et fiche), rien n'est écrit${refus.length ? ` (acceptés à tort : ${refus.join(', ')})` : ''}`);
    r = await fiche(B, { canal: 'pige' });
    constat(r.status === 200 && ligne(B).canal === 'pige' && r.d.fiche.canal === 'pige' && r.d.ligne.canal === 'pige', '18.21 : « pige » accepté par la fiche, renvoyé par la fiche et par la ligne');
    // Annuler un lot de source.
    r = await carnet([B], { canal: 'boitage' });
    const lot = r.d.lot;
    const an = await api('carnet', { annuler: lot });
    constat(an.status === 200 && an.d.rendus === 1 && ligne(B).canal === 'pige', '18.21 : annuler un changement de source remet la source d\'avant');
    // Un ancien canal (site) se garde tant qu'Anne ne le change pas : corriger autre chose ne le touche pas.
    r = await fiche(A, { entreprise: 'Laiterie 1821' });
    constat(r.status === 200 && ligne(A).canal === 'site' && ligne(A).entreprise === 'Laiterie 1821', '18.21 : un contact au canal « site » le garde quand on corrige autre chose');
    // Le formulaire /ajouter propose « Pige » ; une action marketing ne le propose pas (son canal est limité par la base).
    const hA = await (await appeler(`${E}/ajouter`, { headers: avecJeton() })).text();
    const hAct = await (await appeler(`${E}/actions`, { headers: avecJeton() })).text();
    constat(/name="canal" value="pige"/.test(hA) && !/<option value="pige"/.test(hAct) && /<option value="boitage"/.test(hAct), '18.21 : /ajouter propose « Pige » ; le formulaire des actions marketing ne le propose pas');
    r = await page('/ajouter', { quoi: 'contact', prenom: 'Pia', nom: `Pige${P}${NUM}`, telephone: `06 63 ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4, 6)}`, canal: 'pige', parcours: 'vendeur' });
    const pige = sql(`SELECT canal FROM contact WHERE nom = 'Pige${P}${NUM}'`)[0];
    constat(r.status === 200 || r.status === 303 ? pige?.canal === 'pige' : false, '18.21 : un contact créé par /ajouter avec la pige a le canal « pige »');
    sql(`DELETE FROM contact WHERE nom = 'Pige${P}${NUM}'`);
    // Actions marketing : « pige » refusé par la validation.
    constat(refusee(`INSERT INTO action_marketing (id, created_at, maj_le, nom, canal, debut) VALUES ('AMX1821', 'a', 'a', 'Essai pige', 'pige', '2026-11-01')`), '18.21 : la base refuse « pige » comme canal d\'une action marketing (inchangé)');

    // 4. Ambassadeur « Partant » (ticket 264) : fiche et API.
    r = await fiche(Q1, { partant: true });
    e = evDernier(Q1);
    constat(r.status === 200 && ligne(Q1).ambassadeur_partant_le === jourParis && r.d.fiche.ambassadeur_etat === 'partant' && r.d.ligne.ambassadeur_etat === 'partant' && r.d.ligne.ambassadeur_partant === true && r.d.fiche.ambassadeur_partant_le === jourParis
      && e.type === 'classement' && e.d.avant.ambassadeur_partant_le === null && e.d.apres.ambassadeur_partant_le === jourParis && !!e.par && ligne(Q1).projet === 'ambassadeur' && ligne(Q1).ambassadeur_inscrit_le === null,
      '18.21 : « partant » noté sur la fiche, daté d\'aujourd\'hui, sans inscription ; avant-image gardée');
    r = await fiche(Q1, { partant: true });
    constat(r.status === 200 && r.d.changes.length === 0 && ligne(Q1).ambassadeur_partant_le === jourParis, '18.21 : le noter deux fois ne change rien (la date reste)');
    r = await fiche(Q1, { partant: false });
    constat(r.status === 200 && ligne(Q1).ambassadeur_partant_le === null && r.d.fiche.ambassadeur_etat === 'a_contacter' && evDernier(Q1).d.avant.ambassadeur_partant_le === jourParis, '18.21 : « partant » retiré : l\'état redevient « à contacter », avant-image gardée');
    r = await fiche(Q2, { partant: true });
    constat(r.status === 200 && r.d.fiche.ambassadeur_etat === 'partant', '18.21 : partant l\'emporte sur contacté');
    r = await fiche(Q2, { partant: false });
    constat(r.d.fiche.ambassadeur_etat === 'contacte', '18.21 : partant retiré : contacté revient');
    r = await fiche(V2, { partant: true });
    constat(r.d.fiche.ambassadeur_etat === 'inscrit' && ligne(V2).ambassadeur_partant_le === jourParis, '18.21 : inscrit l\'emporte sur partant (la date est quand même gardée)');
    await fiche(V2, { partant: false });
    // Contact qui n'est pas de projet ambassadeur : permis, et il devient visible comme ambassadeur.
    r = await fiche(V1, { partant: true });
    constat(r.status === 200 && r.d.fiche.ambassadeur_etat === 'partant' && ligne(V1).projet === 'vendeur' && r.d.ligne.ambassadeur_etat === 'partant', '18.21 : un contact d\'un autre projet peut être noté partant : il apparaît comme ambassadeur, son projet ne change pas');
    const avantQ = JSON.stringify(ligne(Q3)), nQ = nEv(Q3);
    const refusP = [];
    for (const v of ['oui', 1, null, 'true', ['x']]) { const y = await fiche(Q3, { partant: v }); if (y.status !== 400) refusP.push(`fiche ${JSON.stringify(v)} ${y.status}`); const z = await carnet([Q3], { partant: v }); if (z.status !== 400) refusP.push(`carnet ${JSON.stringify(v)} ${z.status}`); }
    constat(refusP.length === 0 && JSON.stringify(ligne(Q3)) === avantQ && nEv(Q3) === nQ, `18.21 : « partant » veut vrai ou faux (400 sinon), rien d'écrit${refusP.length ? ` (à revoir : ${refusP.join(', ')})` : ''}`);
    // Jeton de Claude : refusé partout.
    const avantC = JSON.stringify([ligne(Q3), ligne(B)]);
    const clau = [await fiche(Q3, { partant: false }, JETON_C), await carnet([Q3], { partant: false }, JETON_C), await fiche(B, { canal: 'autre' }, JETON_C), await carnet([B], { canal: 'autre' }, JETON_C), await fiche(B, { projet: 'aucun' }, JETON_C)];
    constat(clau.every((y) => y.status === 403) && JSON.stringify([ligne(Q3), ligne(B)]) === avantC, '18.21 : le jeton de service de Claude ne peut écrire ni source, ni « partant », ni projet (403)');
    const lectureC = await appeler(`${E}/api/fiche?id=${B}`, { headers: avecJeton(JETON_C) });
    constat(lectureC.status === 403, '18.21 : ni lire la fiche (403)');

    // 5. La page Contacts.
    const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const o = await ctx.newPage();
    const erreursPage = []; o.on('pageerror', (x) => erreursPage.push(x.message));
    await o.goto(`${E}/`);
    const attendre = () => o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
    await attendre();
    const rech = async (t) => { await o.fill('[data-recherche]', t); await o.waitForTimeout(400); await attendre(); };
    const ordre = async () => o.$$eval('[data-lignes] tr[data-contact]', (t) => t.map((x) => x.dataset.contact));
    const entetes = await o.$$eval('[data-entetes] th', (t) => t.map((x) => x.textContent.replace(/[▲▼]/g, '').trim()));
    const iSource = entetes.indexOf('Source');
    constat(iSource > 0 && await o.locator('[data-trier=canal]').count() === 1, `18.21 : la colonne « Source » est dans le tableau, triable (${entetes.join(', ')})`);
    // Le projet « Aucun » est juste après « À qualifier » dans le filtre.
    const optsProjet = await o.$$eval('[data-filtre=projet] option', (t) => t.map((x) => x.textContent.trim()));
    const iQ = optsProjet.indexOf('À qualifier');
    constat(iQ > 0 && optsProjet[iQ + 1] === 'Aucun', `18.21 : « Aucun » est juste après « À qualifier » dans la liste des projets (${optsProjet.join(', ')})`);
    await rech(`${P}${NUM}`);
    const cell = async (id, i) => (await o.locator(`tr[data-contact="${id}"] td`).nth(i).innerText()).replace(/[▾\s]+/g, ' ').trim();
    constat((await cell(A, iSource)) === 'Site' && (await cell(B, iSource)) === 'Pige' && (await cell(V1, iSource)) === '—',
      `18.21 : la colonne Source montre le canal : « Site » pour un ancien canal, « Pige », « — » sans canal (${await cell(A, iSource)} / ${await cell(B, iSource)} / ${await cell(V1, iSource)})`);
    const txtA = await o.locator(`tr[data-contact="${A}"]`).innerText();
    constat(!/Téléphone|LinkedIn/.test(txtA), '18.21 : les sources d\'import (Téléphone, LinkedIn) ne sont plus dans le tableau');
    // La liste de la source : les six choix dans l'ordre, plus le choix vide.
    await o.click(`tr[data-contact="${B}"] [data-classer=canal]`);
    const choix = await o.$$eval('select[data-liste=canal] option', (t) => t.map((x) => [x.value, x.textContent.trim(), x.disabled]));
    constat(JSON.stringify(choix.map((c) => c[1])) === JSON.stringify(['Aucune', 'Pige', 'Boîtage', "Portails d'annonce", 'Reco', 'Évènementiel', 'Autres']) && JSON.stringify(choix.map((c) => c[0])) === JSON.stringify(['', 'pige', 'boitage', 'portail', 'recommandation', 'evenement', 'autre']),
      `18.21 : la liste de la source propose exactement Pige, Boîtage, Portails d'annonce, Reco, Évènementiel, Autres (et « Aucune ») dans cet ordre (${choix.map((c) => c[1]).join(', ')})`);
    const n0 = nEv(B);
    await o.selectOption('select[data-liste=canal]', 'recommandation');
    await o.waitForFunction((id) => document.querySelector(`tr[data-contact="${id}"]`)?.textContent.includes('Reco'), B);
    e = evDernier(B);
    constat(ligne(B).canal === 'recommandation' && nEv(B) === n0 + 1 && e.type === 'classement' && e.d.avant.canal === 'pige' && e.d.apres.canal === 'recommandation' && (await cell(B, iSource)).includes('Reco'),
      '18.21 : choisir « Reco » dans la cellule écrit canal et un événement avec avant-image, la ligne suit sans recharger');
    // Choix vide : efface.
    await o.click(`tr[data-contact="${B}"] [data-classer=canal]`);
    await o.selectOption('select[data-liste=canal]', '');
    await o.waitForFunction((id) => !document.querySelector(`tr[data-contact="${id}"]`)?.textContent.includes('Reco'), B);
    constat(ligne(B).canal === null && (await cell(B, iSource)) === '—', '18.21 : « Aucune » efface la source depuis le tableau');
    // Un ancien canal : affiché, non choisissable ; Entrée sans rien changer n'écrit rien.
    await o.click(`tr[data-contact="${A}"] [data-classer=canal]`);
    const choixA = await o.$$eval('select[data-liste=canal] option', (t) => t.map((x) => [x.value, x.textContent.trim(), x.disabled, x.selected]));
    const nA = nEv(A);
    await o.keyboard.press('Enter');
    await o.waitForTimeout(500);
    constat(choixA[0][1] === 'Site' && choixA[0][2] && choixA[0][3] && choixA.length === 8 && ligne(A).canal === 'site' && nEv(A) === nA, '18.21 : un ancien canal (Site) reste affiché dans la liste, non choisissable ; Entrée sans choix n\'écrit rien');
    await rech(`${P}${NUM}`);
    // Filtre « Source » (canal) et vue enregistrée.
    await o.selectOption('[data-filtre=canal]', 'site'); await attendre();
    const filtreSite = await ordre();
    const pastilleSource = (await o.locator('[data-pastilles] [data-retirer]').allInnerTexts()).some((t) => t.includes('Source : Site'));
    constat(filtreSite.length === 1 && filtreSite[0] === A && pastilleSource, '18.21 : le filtre « Source » filtre sur le canal (pastille « Source : Site »)');
    const optsFiltre = await o.$$eval('[data-filtre=canal] option', (t) => t.map((x) => x.textContent.trim()));
    constat(JSON.stringify(optsFiltre.slice(0, 7)) === JSON.stringify(['Source', 'Pige', 'Boîtage', "Portails d'annonce", 'Reco', 'Évènementiel', 'Autres']) && optsFiltre.includes('Site') && !optsFiltre.includes('Téléphone') && !optsFiltre.includes('LinkedIn'),
      `18.21 : le filtre « Source » propose les six choix (puis les anciens canaux présents), plus les sources d'import (${optsFiltre.join(', ')})`);
    await o.click('[data-retirer="canal"][data-valeur="site"]'); await attendre();
    // Vue enregistrée avec l'ancienne clé « source » : signalée, jamais une erreur.
    sql(`INSERT INTO vue (id, nom, ordre, filtre, created_at, maj_le) VALUES ('01KF21VUE${NUM}00000000000000', '${P} ancienne', 998, '{"source":["telephone"]}', '2026-11-01T00:00:00Z', '2026-11-01T00:00:00Z')`);
    const vueNeuve = await api('vues', { nom: `${P} nouvelle`, filtre: { canal: ['pige', 'autre'] } });
    const vueAncienne = await api('vues', { nom: `${P} vieille cle`, filtre: { source: ['telephone'] } });
    const hP = await (await appeler(`${E}/`, { headers: avecJeton() })).text();
    const reglagesJson = JSON.parse(hP.match(/id="ct-reglages"[^>]*>([\s\S]*?)<\/script>/)[1]);
    const vAnc = reglagesJson.vues.find((v) => v.nom === `${P} ancienne`), vNeuve = reglagesJson.vues.find((v) => v.nom === `${P} nouvelle`);
    constat(vueAncienne.status === 400 && vueNeuve.status === 201 && !!vAnc?.invalide && JSON.stringify(vAnc.filtre) === '{}' && JSON.stringify(vNeuve?.filtre) === '{"canal":["pige","autre"]}',
      `18.21 : une vue avec l'ancienne clé « source » est refusée à l'écriture et signalée invalide à la lecture (filtre vide, pas d'erreur) ; la nouvelle clé « canal » s'enregistre (${vueAncienne.status}, ${vueNeuve.status}, ${vAnc?.invalide})`);
    await o.reload(); await attendre();
    constat(await o.locator('[data-vue].ct-vue-invalide').count() >= 1 && erreursPage.length === 0, '18.21 : la page s\'ouvre avec la vue à l\'ancienne clé, signalée « à refaire », sans erreur JavaScript');
    await rech(`${P}${NUM}`);

    // Ambassadeur : pastille, couleur, tri, filtre, changement dans la cellule.
    const iAmb = entetes.indexOf('Ambassadeur');
    const pastilleAmb = async (id) => o.locator(`tr[data-contact="${id}"] [data-ambassadeur]`).first();
    const vert = 'rgb(46, 107, 63)';
    const fond = async (id) => (await pastilleAmb(id)).evaluate((x) => getComputedStyle(x).backgroundColor);
    constat(await (await pastilleAmb(Q3)).getAttribute('data-ambassadeur') === 'partant' && (await (await pastilleAmb(Q3)).innerText()).trim() === 'Partant' && await fond(Q3) === vert && await fond(Q4) === vert
      && await fond(Q1) !== vert && await fond(Q2) !== vert, '18.21 : « Partant » s\'affiche en vert comme « Inscrit » ; « À contacter » et « Contacté » ne le sont pas');
    constat(await o.locator(`tr[data-contact="${V1}"] [data-ambassadeur]`).count() === 1 && (await (await pastilleAmb(V1)).innerText()).trim() === 'Partant', '18.21 : le contact d\'un autre projet noté partant montre la pastille « Partant »');
    await fiche(V1, { partant: false });
    // Tri : À contacter, Contacté, Partant, Inscrit.
    await o.reload(); await attendre(); await rech(`${P}${NUM}`);
    await o.click('[data-trier=ambassadeur]'); await o.waitForTimeout(250); await attendre();
    const asc = (await ordre()).filter((x) => [Q1, Q2, Q3, Q4].includes(x));
    await o.click('[data-trier=ambassadeur]'); await o.waitForTimeout(250); await attendre();
    const desc = (await ordre()).filter((x) => [Q1, Q2, Q3, Q4].includes(x));
    constat(JSON.stringify(asc) === JSON.stringify([Q1, Q2, Q3, Q4]) && JSON.stringify(desc) === JSON.stringify([Q4, Q3, Q2, Q1]), '18.21 : tri de la colonne Ambassadeur : À contacter, Contacté, Partant, Inscrit (puis l\'inverse)');
    // Filtre « État ambassadeur : Partant ».
    const optsAmb = await o.$$eval('[data-filtre=autres] optgroup[label="État ambassadeur"] option', (t) => t.map((x) => x.textContent.trim()));
    await o.selectOption('[data-filtre=autres]', 'ambassadeur_etat:partant'); await attendre();
    const fp = await ordre();
    const pastP = (await o.locator('[data-pastilles] [data-retirer]').allInnerTexts()).some((t) => t.includes('Ambassadeur : Partant'));
    constat(optsAmb.includes('Partant') && fp.length === 1 && fp[0] === Q3 && pastP, `18.21 : le filtre « État ambassadeur » accepte « Partant » (${optsAmb.join(', ')})`);
    await o.click('[data-retirer="ambassadeur_etat"][data-valeur="partant"]'); await attendre();
    // Changer dans la cellule : noter partant, puis retirer.
    await o.click(`tr[data-contact="${Q1}"] [data-classer=ambassadeur]`);
    const choixAmb = await o.$$eval('select[data-liste=ambassadeur] option', (t) => t.map((x) => x.textContent.trim()));
    await o.selectOption('select[data-liste=ambassadeur]', 'partant');
    await o.waitForFunction((id) => document.querySelector(`tr[data-contact="${id}"] [data-ambassadeur]`)?.getAttribute('data-ambassadeur') === 'partant', Q1);
    e = evDernier(Q1);
    constat(JSON.stringify(choixAmb) === JSON.stringify(['Partant', 'Pas partant']) && ligne(Q1).ambassadeur_partant_le === jourParis && e.d.apres.ambassadeur_partant_le === jourParis && e.d.avant.ambassadeur_partant_le === null && await fond(Q1) === vert,
      '18.21 : la pastille du tableau se change (Partant / Pas partant) : daté d\'aujourd\'hui, événement avec avant-image, vert tout de suite');
    await o.click(`tr[data-contact="${Q1}"] [data-classer=ambassadeur]`);
    await o.selectOption('select[data-liste=ambassadeur]', 'non_partant');
    await o.waitForFunction((id) => document.querySelector(`tr[data-contact="${id}"] [data-ambassadeur]`)?.getAttribute('data-ambassadeur') === 'a_contacter', Q1);
    constat(ligne(Q1).ambassadeur_partant_le === null, '18.21 : « Pas partant » dans le tableau retire la marque (« à contacter » revient)');
    // Contact sans état ambassadeur : la cellule vide est aussi cliquable.
    await o.click(`tr[data-contact="${V1}"] [data-classer=ambassadeur]`);
    await o.selectOption('select[data-liste=ambassadeur]', 'partant');
    await o.waitForFunction((id) => document.querySelector(`tr[data-contact="${id}"] [data-ambassadeur]`)?.getAttribute('data-ambassadeur') === 'partant', V1);
    constat(ligne(V1).ambassadeur_partant_le === jourParis && ligne(V1).projet === 'vendeur', '18.21 : « partant » depuis la cellule d\'un contact sans état ambassadeur : permis, projet inchangé');
    await fiche(V1, { partant: false });

    // La fiche : source, partant, sources d'import.
    await rech(`${P}${NUM}`);
    await o.click(`tr[data-contact="${A}"] [data-ouvrir-fiche]`);
    await o.waitForSelector('[data-fiche-form]');
    const importe = (await o.textContent('[data-fiche-sources]')) ?? '';
    const selFiche = await o.$$eval('[data-fiche-canal] option', (t) => t.map((x) => [x.value, x.textContent.trim(), x.disabled]));
    constat(/Importé depuis/.test(importe) && importe.includes('Téléphone') && importe.includes('LinkedIn') && selFiche[0][1] === 'Site' && selFiche[0][2] && selFiche.length === 8,
      `18.21 : la fiche montre « Importé depuis : Téléphone, LinkedIn » et la source « Site » (ancien canal, non choisissable) (${importe.trim()})`);
    await o.fill('[data-fiche-form] input[name=entreprise]', 'Laiterie 1821 bis');
    await o.click('[data-fiche-enregistrer]');
    await o.waitForSelector('[data-fiche-message]:not(.erreur)');
    constat(ligne(A).canal === 'site' && ligne(A).entreprise === 'Laiterie 1821 bis', '18.21 : enregistrer la fiche sans toucher à la source garde l\'ancien canal');
    await o.selectOption('[data-fiche-canal]', 'pige');
    await o.click('[data-fiche-enregistrer]');
    await o.waitForSelector('[data-fiche-message]:not(.erreur)');
    e = evDernier(A);
    await o.waitForTimeout(200);
    constat(ligne(A).canal === 'pige' && e.d.avant.canal === 'site' && e.d.apres.canal === 'pige' && (await cell(A, iSource)).includes('Pige'), '18.21 : changer la source depuis la fiche écrit canal (avant-image « site »), la ligne suit');
    await o.selectOption('[data-fiche-canal]', '');
    await o.click('[data-fiche-enregistrer]');
    await o.waitForSelector('[data-fiche-message]:not(.erreur)');
    constat(ligne(A).canal === null, '18.21 : « Aucune » sur la fiche efface la source');
    // Partant par la fiche (case), puis retiré.
    await o.click('[data-fiche-fermer]').catch(() => {});
    await o.click(`tr[data-contact="${Q1}"] [data-ouvrir-fiche]`);
    await o.waitForSelector('[data-fiche-form]');
    const caseP = o.locator('[data-fiche-partant] input[name=partant]');
    const libP = (await o.textContent('[data-fiche-partant]')) ?? '';
    await caseP.check();
    await o.click('[data-fiche-enregistrer]');
    await o.waitForSelector('[data-fiche-message]:not(.erreur)');
    await o.waitForTimeout(200);
    const pastFiche = await o.getAttribute('[data-fiche-ambassadeur]', 'data-fiche-ambassadeur');
    constat(/préviendrait/.test(libP) && ligne(Q1).ambassadeur_partant_le === jourParis && pastFiche === 'partant' && (await pastilleAmb(Q1)) !== null && (await (await pastilleAmb(Q1)).getAttribute('data-ambassadeur')) === 'partant',
      '18.21 : la case « M\'a dit qu\'il me préviendrait » de la fiche note « partant » daté d\'aujourd\'hui, la pastille et la ligne du tableau suivent');
    await o.locator('[data-fiche-partant] input[name=partant]').uncheck();
    await o.click('[data-fiche-enregistrer]');
    await o.waitForSelector('[data-fiche-message]:not(.erreur)');
    constat(ligne(Q1).ambassadeur_partant_le === null && await o.locator('[data-fiche-partant] input[name=partant]').isChecked() === false, '18.21 : décocher la case retire « partant »');
    const largeur = await o.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    constat(largeur <= 0 && erreursPage.length === 0, `18.21 : pas de défilement horizontal de la page à 1440 px ni d'erreur JavaScript${erreursPage.length ? ` (${erreursPage[0]})` : ''}`);
    await o.screenshot({ path: path.join(OUT, 'espace-contacts-source-partant-1440.png') });
    await ctx.close();

    // 6. L'import (claude-import) n'écrit ni la source, ni « partant », ni le projet « aucun » ; sa table est toujours utilisable.
    const sources = ['scripts/claude-import.mjs', 'src/server/import.ts'].map((f) => fs.readFileSync(path.join(ICI, f), 'utf8')).join('\n');
    const colImport = fs.readFileSync(path.join(ICI, 'src/server/carnet.ts'), 'utf8').match(/const COLONNES_IMPORT[^\n]*\n?[^\n]*/)?.[0] ?? '';
    constat(!/ambassadeur_partant|\bpartant\b/.test(sources) && !/\bcanal\b/.test(sources) && !/canal|partant/.test(colImport), '18.21 : les outils d\'import ne nomment ni canal, ni « partant » (ils ne peuvent écrire ni l\'un ni l\'autre)');
    sql(`DELETE FROM vue WHERE nom LIKE '${P}%'`);
    nettoyer();
  }
  if (process.env.E2E_1821_SEUL) { await bloc1821(); await nav.close(); throw new Error(echecs ? 'E2E_1821_SEUL : échecs' : 'E2E_1821_SEUL : terminé') }
  if (process.env.E2E_1820_SEUL) { await bloc1820(); await nav.close(); throw new Error(echecs ? 'E2E_1820_SEUL : échecs' : 'E2E_1820_SEUL : terminé') }
  if (process.env.E2E_1819_SEUL) { await bloc1819(); await nav.close(); throw new Error(echecs ? 'E2E_1819_SEUL : échecs' : 'E2E_1819_SEUL : terminé') }
  if (process.env.E2E_1818_SEUL) { await bloc1818(); await nav.close(); throw new Error(echecs ? 'E2E_1818_SEUL : échecs' : 'E2E_1818_SEUL : terminé') }
  r = await page('/ajouter', { quoi: 'contact', prenom: 'Bea', nom: `Boitage${ESSAI}`, telephone: TEL, canal: 'boitage', parcours: 'vendeur' });
  constat(r.status === 200 && (await r.text()).includes('data-erreur') && sql(`SELECT count(*) AS n FROM contact WHERE telephone = '${TEL164}'`)[0].n === 0,
    'saisie : boîtage sans passage refusé, rien enregistré, la saisie reste affichée');
  r = await page('/ajouter', { quoi: 'contact', prenom: 'Bea', nom: `Boitage${ESSAI}`, telephone: TEL, canal: 'boitage', passage_id: passage.id, parcours: 'vendeur', note: 'Maison 5 pièces, vend au printemps' });
  const saisie = sql(`SELECT * FROM contact WHERE telephone = '${TEL164}'`)[0];
  constat(r.status === 303 && r.headers.get('location') === `/contacts/fiche?id=${saisie?.id}&m=ajoute` && saisie.etape === 'a_qualifier' && saisie.canal === 'boitage'
    && saisie.passage_id === passage.id && saisie.parcours === 'vendeur' && saisie.prochaine_action_le === auj,
    'saisie : contact créé « à qualifier », rattaché au passage, rappel prévu aujourd\'hui');
  constat(sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${saisie.id}' AND source = 'anne' AND par = 'anne@example.com'`)[0].n === 2,
    'saisie : création et note dans l\'historique, avec le compte qui a agi');
  const MAILB = `bea+${ESSAI}@example.com`;
  r = await page('/ajouter', { quoi: 'contact', telephone: TEL164, email: MAILB, canal: 'rencontre' });
  constat(r.headers.get('location') === `/contacts/fiche?id=${saisie.id}&m=existant` && sql(`SELECT count(*) AS n FROM contact WHERE telephone = '${TEL164}'`)[0].n === 1
    && sql(`SELECT email, canal FROM contact WHERE id = '${saisie.id}'`)[0].email === MAILB && sql(`SELECT canal FROM contact WHERE id = '${saisie.id}'`)[0].canal === 'boitage',
    'saisie d\'un numéro déjà connu : la fiche existante est ouverte et complétée (e-mail), l\'origine gardée, rien en double');
  r = await page('/ajouter', { quoi: 'contact', prenom: 'Rémi', nom: `Reco${ESSAI}`, email: `remi+${ESSAI}@example.com`, canal: 'recommandation', prescripteur_nom: `Maître Durand ${ESSAI}`, prescripteur_role: 'Notaire, Thonon' });
  const reco = sql(`SELECT c.id, p.nom, p.role FROM contact c JOIN prescripteur p ON p.id = c.prescripteur_id WHERE c.email = 'remi+${ESSAI}@example.com'`)[0];
  constat(r.status === 303 && reco?.nom === `Maître Durand ${ESSAI}` && reco.role === 'Notaire, Thonon', 'saisie : recommandation, nouveau prescripteur créé et rattaché');
  r = await appeler(`${E}/contacts/fiche?id=${saisie.id}&m=existant`, { headers: avecJeton() });
  html = await r.text();
  constat(r.status === 200 && html.includes(`Boitage${ESSAI}`) && html.includes(`Boîtage ${SECTEUR}`) && html.includes('Maison 5 pièces') && html.includes('existait déjà'),
    'fiche : origine précise (secteur du passage), note et message « existait déjà »');
  r = await appeler(`${E}/contacts?q=${encodeURIComponent(TEL)}`, { headers: avecJeton() });
  constat((await r.text()).includes(`data-contact="${saisie.id}"`), 'liste des contacts : recherche par numéro au format « 06 … »');

  // Story 18.9 : l'ancien import de la page /importer est retiré (l'import passe par Claude, essais plus bas). Les trois
  // contacts que cet import créait, et que les essais suivants utilisent (qualifier, Aujourd'hui, accord e-mail, migration
  // 0013), sont posés tels qu'il les laissait : suivis « à qualifier », origine événement, événement de création « import ».
  const [idCarla, idDidier, idEmma] = [sid(), sid(), sid()];
  const maint = new Date().toISOString();
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, email, commune, etape, prochaine_action, prochaine_action_le, canal, origine_detail, rappel_individuel_seul, categorie_id, verifie_le, email_accord_le, email_accord_source) VALUES
    ('${idCarla}', '${maint}', '${maint}', 'Carla', 'Forum${ESSAI}', NULL, 'carla+${ESSAI}@example.com', 'Anthy', 'a_qualifier', 'Rappeler pour qualifier', '${auj}', 'evenement', 'Forum ${ESSAI}', 1, 'demandes_recues', '${maint}', NULL, NULL),
    ('${idDidier}', '${maint}', '${maint}', 'Didier', 'Forum${ESSAI}', '+33601${NUM}', NULL, 'Margencel', 'a_qualifier', 'Rappeler pour qualifier', '${auj}', 'evenement', 'Forum ${ESSAI}', 1, 'demandes_recues', '${maint}', NULL, NULL),
    ('${idEmma}', '${maint}', '${maint}', 'Emma', 'Xlsx${ESSAI} & fils', '+33699${NUM}', NULL, NULL, 'a_qualifier', 'Rappeler pour qualifier', '${auj}', 'evenement', 'Salon', 0, 'demandes_recues', '${maint}', '${maint}', 'import');
    INSERT INTO contact_evenement (contact_id, a, type, source, texte, par) VALUES
    ('${idCarla}', '${maint}', 'creation', 'import', 'Contact importé · Événement : Forum ${ESSAI}', 'anne@example.com'),
    ('${idDidier}', '${maint}', 'creation', 'import', 'Contact importé · Événement : Forum ${ESSAI}', 'anne@example.com'),
    ('${idEmma}', '${maint}', 'creation', 'import', 'Contact importé · Événement : Salon', 'anne@example.com')`);
  r = await appeler(`${E}/importer`, { headers: avecJeton() });
  constat(r.status === 404, `18.9 : l'ancienne page /importer est retirée (${r.status})`);

  // 5 ter. Qualifier en deux minutes (story 13.6).
  r = await appeler(`${E}/contacts/qualifier?id=${saisie.id}`, { headers: avecJeton() });
  html = await r.text();
  constat(r.status === 200 && (html.match(/name="q_/g) ?? []).length >= 20 && html.includes('Et maintenant'), 'qualifier : les cinq questions et les suites');
  const qualif = (id, champs) => page(`/contacts/qualifier?id=${id}`, champs);
  const Q = { q_delai: 'Dans 6 mois', q_agence: 'Non', q_bien: 'Maison', q_motif: 'Succession', q_vend_avant: 'Sans objet' };
  r = await qualif(saisie.id, Q);
  constat(r.status === 200 && (await r.text()).includes('data-erreur') && sql(`SELECT qualifie_le FROM contact WHERE id = '${saisie.id}'`)[0].qualifie_le === null,
    'qualifier sans suite : refusé, rien enregistré');
  r = await qualif(saisie.id, { ...Q, issue: 'perdu' });
  constat(r.status === 200 && (await r.text()).includes('le bilan du lundi compte les motifs'), 'perdu sans motif : refusé');
  r = await qualif(saisie.id, { ...Q, issue: 'rdv' });
  constat(r.status === 200 && (await r.text()).includes('date et l&#39;heure du rendez-vous'), 'rendez-vous sans date : refusé');
  r = await qualif(saisie.id, { ...Q, issue: 'sommeil', reveil_choix: '3m' });
  const dans3mois = (() => { const d = new Date(`${auj}T12:00:00Z`); d.setUTCMonth(d.getUTCMonth() + 3); return d.toISOString().slice(0, 10); })();
  let q1 = sql(`SELECT etape, reveil_le, qualification, qualifie_le FROM contact WHERE id = '${saisie.id}'`)[0];
  constat(r.headers.get('location') === `/contacts/fiche?id=${saisie.id}&m=qualifie` && q1.etape === 'en_sommeil' && q1.reveil_le === dans3mois
    && JSON.parse(q1.qualification).motif === 'Succession' && !!q1.qualifie_le, 'en sommeil dans 3 mois : étape, date de réveil et cinq réponses enregistrées');
  constat(sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${saisie.id}' AND type IN ('qualification', 'etape') AND par = 'anne@example.com'`)[0].n === 2,
    'historique : la qualification et le changement d\'étape, avec le compte');
  r = await appeler(`${E}/contacts/fiche?id=${saisie.id}&m=qualifie`, { headers: avecJeton() });
  html = await r.text();
  constat(html.includes('data-reponses') && html.includes('Succession') && html.includes('En sommeil, à réveiller'), 'fiche : les réponses et la date de réveil');
  // Un contact déjà qualifié passe à « Perdu » par « Noter la suite » (story 13.22), plus par la qualification.
  r = await page(`/contacts/suite?id=${saisie.id}`, { resultat: 'note', note: 'Vend avec une autre agence', etape: 'perdu', motif: 'Hors secteur' });
  q1 = sql(`SELECT etape, motif_perte, prochaine_action_le FROM contact WHERE id = '${saisie.id}'`)[0];
  constat(q1.etape === 'perdu' && q1.motif_perte === 'Hors secteur' && q1.prochaine_action_le === null, 'perdu : motif enregistré, plus de rappel');
  r = await qualif(reco.id, { ...Q, issue: 'rdv', rdv_le: '2027-01-15T10:00' });
  constat(r.status === 200 && (await r.text()).includes('vendre ou acheter'), 'rendez-vous d\'un contact sans parcours : il faut dire vendre ou acheter');
  r = await qualif(reco.id, { ...Q, parcours: 'vendeur', issue: 'rdv', rdv_le: '2027-01-15T10:00' });
  const q2 = sql(`SELECT etape, parcours, prochaine_action, prochaine_action_le FROM contact WHERE id = '${reco.id}'`)[0];
  constat(q2.etape === 'premier_rdv' && q2.parcours === 'vendeur' && q2.prochaine_action === 'Premier rendez-vous' && q2.prochaine_action_le === '2027-01-15T09:00:00.000Z',
    'rendez-vous le 15 janvier à 10 h (Paris) : « Premier rendez-vous », heure rangée en UTC (9 h)');
  const carla = sql(`SELECT id FROM contact WHERE email = 'carla+${ESSAI}@example.com'`)[0].id;
  r = await qualif(carla, { issue: 'rappel', rappel_choix: '1j' });
  const demain = (() => { const d = new Date(`${auj}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); })();
  const q3 = sql(`SELECT etape, prochaine_action, prochaine_action_le, qualifie_le FROM contact WHERE id = '${carla}'`)[0];
  constat(q3.etape === 'a_qualifier' && q3.prochaine_action_le === demain && /pas joint/.test(q3.prochaine_action) && q3.qualifie_le === null,
    'pas joint : reste à qualifier, rappel demain');

  // « Aujourd'hui » montre au plus 100 contacts par liste, 50 prescripteurs et 10 secteurs, et la base locale garde les
  // données des essais précédents : au-delà de quelques passages, les contacts de cet essai n'y entraient plus. Pour lire
  // la page, on met de côté le temps d'une lecture tout ce qui n'est pas à cet essai (contacts suivis, prescripteurs à
  // relancer, passages de boîtage), puis on le remet exactement comme avant. `gardes` : identifiants laissés tels quels.
  // 5 quater. Aujourd'hui (story 13.5).
  const didier = sql(`SELECT id FROM contact WHERE telephone = '+33601${NUM}'`)[0].id;
  const vieux = `VIEUX${NUM}`, retard = `RETARD${NUM}`, reveil = `REVEIL${NUM}`, avenir = `AVENIR${NUM}`;
  const hier = (() => { const d = new Date(`${auj}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); })();
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, etape, prochaine_action, prochaine_action_le, canal, is_test) VALUES
    ('${vieux}', '2026-01-02T08:00:00Z', '2026-01-02T08:00:00Z', 'Ancien${NUM}', 'a_qualifier', 'Écrire pour qualifier (pas de téléphone)', '2026-01-02T08:00:00Z', 'site', 1),
    ('${retard}', '2026-02-01T08:00:00Z', '2026-02-01T08:00:00Z', 'Retard${NUM}', 'estimation', 'Envoyer l''estimation', '${hier}', 'rencontre', 1),
    ('${avenir}', '2026-02-01T08:00:00Z', '2026-02-01T08:00:00Z', 'Avenir${NUM}', 'second_rdv', 'Second rendez-vous', '2099-01-01', 'rencontre', 1)`);
  // Story 10.15 : un ancien contact avec téléphone passe avant Didier, qui passe avant l'ancien sans téléphone.
  const vieuxTel = `VIEUXTEL${NUM}`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, telephone, etape, prochaine_action, prochaine_action_le, canal, is_test) VALUES
    ('${vieuxTel}', '2026-01-03T08:00:00Z', '2026-01-03T08:00:00Z', 'AncienTel${NUM}', '+33608${NUM}', 'a_qualifier', 'Rappeler pour qualifier', '2026-01-03T08:00:00Z', 'site', 1)`);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, etape, prochaine_action, prochaine_action_le, reveil_le, canal, is_test) VALUES
    ('${reveil}', '2026-03-01T08:00:00Z', '2026-03-01T08:00:00Z', 'Reveil${NUM}', 'en_sommeil', 'Réveiller : rappeler', '${auj}', '${auj}', 'autre', 1)`);
  sql(`INSERT INTO passage_boitage (id, created_at, secteur, fait_le, mots) VALUES ('PASS${NUM}', '2026-01-01T00:00:00Z', 'Margencel-${NUM}', '2026-01-10', 150)`);
  sql(`UPDATE prescripteur SET prochaine_relance_le = '${auj}', relance_raison = 'Lui montrer la vente d''Anthy' WHERE nom = 'Maître Durand ${ESSAI}'`);
  // Les contacts dont la page doit dire qu'ils n'y sont pas (carla, avenir, reco) restent aussi tels quels.
  const passagesEssai = sql(`SELECT id FROM passage_boitage WHERE secteur IN ('Margencel-${NUM}', '${SECTEUR}')`).map((x) => x.id);
  html = await surAujourdhui({ contacts: [vieuxTel, didier, vieux, retard, reveil, avenir, carla, reco.id], passages: passagesEssai,
    prescripteurs: sql(`SELECT id FROM prescripteur WHERE nom = 'Maître Durand ${ESSAI}'`).map((x) => x.id) });
  const zone = (attr) => html.split(attr)[1]?.split('</section>')[0] ?? '';
  const nouveauxZone = zone('data-nouveaux'), rappelsZone = zone('data-rappels'), prospection = zone('data-prospection');
  const ordre = [vieuxTel, didier, vieux].map((id) => nouveauxZone.indexOf(`data-contact="${id}"`));
  constat(ordre.every((i) => i >= 0) && ordre[0] < ordre[1] && ordre[1] < ordre[2]
    && nouveauxZone.includes(`/contacts/qualifier?id=${didier}`) && nouveauxZone.includes('href="tel:') && nouveauxZone.includes('Écrire pour qualifier (pas de téléphone)'),
    'aujourd\'hui : nouveaux contacts à qualifier en tête, ceux qui ont un téléphone d\'abord, puis le plus ancien, avec Appeler (ou Écrire) et Qualifier');
  constat(!html.includes(`data-contact="${carla}"`), 'aujourd\'hui : un contact pas joint à rappeler demain n\'y est pas encore');
  constat(rappelsZone.includes(`data-contact="${retard}"`) && rappelsZone.split(`data-contact="${retard}"`)[1].split('</article>')[0].includes('data-retard')
    && rappelsZone.includes(`data-contact="${reveil}"`) && !html.includes(`data-contact="${avenir}"`) && !html.includes(`data-contact="${reco.id}"`),
    'aujourd\'hui : rappels dus (en retard signalé) et contact en sommeil à réveiller ; rien de ce qui est prévu plus tard');
  constat(prospection.includes(`Repasser à Margencel-${NUM}`) && !prospection.includes(`Repasser à ${SECTEUR}`) && prospection.includes(`Relancer Maître Durand ${ESSAI}`) && prospection.includes('vente d&#39;Anthy'),
    'aujourd\'hui : secteur de boîtage à refaire (6 semaines et plus), pas le passage du jour ; prescripteur à relancer avec sa raison');
  r = await appeler(`${E}/gestion`, { headers: avecJeton() });
  constat((await r.text()).includes('data-retour'), 'demandes : lien de retour vers l\'espace');

  // 5 quater bis. Noter la suite d'un contact en cours (story 13.22).
  const SUITE = `01KFSV${NUM}${'0'.repeat(14)}`;
  const jPlus = (n) => { const d = new Date(`${auj}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, parcours, etape, prochaine_action, prochaine_action_le, qualifie_le, canal, is_test) VALUES
    ('${SUITE}', '2026-02-01T08:00:00Z', '2026-02-01T08:00:00Z', 'Sylvie', 'Suite${NUM}', '+33645${NUM}', 'vendeur', 'estimation', 'Envoyer l''estimation', '${hier}', '2026-02-01T09:00:00Z', 'rencontre', 1)`);
  const etatSuite = () => sql(`SELECT etape, prochaine_action, prochaine_action_le FROM contact WHERE id = '${SUITE}'`)[0];
  const derniereNote = () => sql(`SELECT texte FROM contact_evenement WHERE contact_id = '${SUITE}' AND type = 'note' ORDER BY id DESC LIMIT 1`)[0]?.texte ?? '';
  html = await surAujourdhui({ contacts: [SUITE] });
  const carteSuite = html.split(`data-contact="${SUITE}"`)[1]?.split('</article>')[0] ?? '';
  constat(carteSuite.includes(`/contacts/suite?id=${SUITE}`) && !carteSuite.includes('/contacts/qualifier'), 'aujourd\'hui : « Noter la suite » d\'un rappel ouvre le formulaire de suite, pas la qualification');
  r = await appeler(`${E}/contacts/suite?id=${SUITE}&retour=jour`, { headers: avecJeton() });
  html = await r.text();
  constat(r.status === 200 && html.includes('data-suite-form') && (html.split('data-prevu')[1] ?? '').split('</p>')[0].includes('estimation') && html.includes('Estimation en préparation (actuelle)'),
    'suite : formulaire avec l\'action prévue et l\'étape actuelle');
  r = await appeler(`${E}/contacts/suite?id=${didier}`, { headers: avecJeton(), redirect: 'manual' });
  constat(r.status === 303 && r.headers.get('location') === `/contacts/qualifier?id=${didier}`, 'suite d\'un contact à qualifier : renvoie vers la qualification');
  const suite = (champs) => page(`/contacts/suite?id=${SUITE}&retour=jour`, champs);
  r = await suite({ etape: 'estimation' });
  constat(r.status === 200 && (await r.text()).includes('data-erreur') && etatSuite().prochaine_action_le === hier, 'suite sans résultat : refusée, rien enregistré');
  r = await suite({ resultat: 'fait', etape: 'estimation', action: 'Second rendez-vous', quand: 'autre', le: jPlus(3) });
  let st = etatSuite();
  constat(r.headers.get('location') === `/aujourdhui?m=suite#c-${SUITE}` && st.etape === 'estimation' && st.prochaine_action === 'Second rendez-vous' && st.prochaine_action_le === jPlus(3)
    && derniereNote().startsWith('Fait : Envoyer l\'estimation') && derniereNote().includes('Prochaine action : Second rendez-vous'),
    'fait, prochaine action « second rendez-vous » à J+3 : l\'étape reste « Estimation en préparation », historique noté');
  r = await suite({ resultat: 'pas_joint', quand: '1j' });
  st = etatSuite();
  constat(st.etape === 'estimation' && st.prochaine_action === 'Second rendez-vous' && st.prochaine_action_le === jPlus(1) && derniereNote().startsWith('Pas joint, à rappeler le'),
    'pas joint : étape et action gardées (pas de « Rappeler pour qualifier »), rappel demain');
  r = await suite({ resultat: 'note' });
  constat(r.status === 200 && (await r.text()).includes('Écrivez la note'), 'juste une note sans texte : refusé');
  r = await suite({ resultat: 'note', etape: 'estimation', action: 'Second rendez-vous', note: 'Attend le passage du diagnostiqueur' });
  st = etatSuite();
  constat(st.prochaine_action_le === jPlus(1) && derniereNote() === 'Attend le passage du diagnostiqueur', 'juste une note sans date : l\'action garde sa date, la note est dans l\'historique');
  r = await suite({ resultat: 'fait', etape: 'perdu' });
  constat(r.status === 200 && (await r.text()).includes('compte les motifs') && etatSuite().etape === 'estimation', 'suite vers « Perdu » sans motif : refusé');
  r = await suite({ resultat: 'fait', etape: 'second_rdv', action: 'Second rendez-vous', quand: '7j', heure: '10:00', note: 'Rendez-vous pris chez eux' });
  st = etatSuite();
  constat(st.etape === 'second_rdv' && st.prochaine_action_le.startsWith(jPlus(7)) && st.prochaine_action_le.length > 10
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${SUITE}' AND type = 'etape' AND texte LIKE 'Estimation en préparation → R2%'`)[0].n === 1,
    'fait et étape choisie : passe à « R2 » à J+7, 10 h, changement d\'étape noté');
  r = await appeler(`${E}/contacts/fiche?id=${SUITE}`, { headers: avecJeton() });
  html = await r.text();
  constat(html.includes('data-suite-lien') && html.includes('Requalifier') && html.includes('Rendez-vous pris chez eux'), 'fiche d\'un contact en cours : « Noter la suite » en premier, « Requalifier » en second, la note dans l\'historique');
  r = await appeler(`${E}/contacts/qualifier?id=${SUITE}`, { headers: avecJeton() });
  html = await r.text();
  constat(html.includes('data-en-cours') && !html.includes('Et maintenant'), 'requalifier un contact en cours : seules les réponses, pas de suite qui changerait l\'étape');
  r = await qualif(SUITE, { q_delai: 'Dans 3 mois', q_bien: 'Maison' });
  st = etatSuite();
  constat(r.headers.get('location') === `/contacts/fiche?id=${SUITE}&m=qualification-corrigee` && st.etape === 'second_rdv' && st.prochaine_action_le.startsWith(jPlus(7))
    && JSON.parse(sql(`SELECT qualification FROM contact WHERE id = '${SUITE}'`)[0].qualification).delai === 'Dans 3 mois',
    'réponses corrigées : l\'étape et la prochaine action n\'ont pas bougé');

  // 5 quater ter. Fiche modifiable, note, export et effacement (story 13.23).
  const surFiche = (id, champs) => page(`/contacts/fiche?id=${id}`, champs);
  r = await appeler(`${E}/contacts/fiche?id=${SUITE}`, { headers: avecJeton() });
  html = await r.text();
  constat(/<details[^>]*data-modifier/.test(html) && !/<details[^>]*open[^>]*data-modifier/.test(html) && html.includes('data-note') && html.includes(`/api/contacts/export?id=${SUITE}`) && !html.includes('/gestion?q='),
    'fiche : modification repliée, note, export et effacement sur la fiche (plus de renvoi vers les demandes)');
  const COORD = { quoi: 'coordonnees', prenom: 'Silvie', nom: `Suite${NUM}`, telephone: `06 46 ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4, 6)}`, email: '', commune: 'Thonon', parcours: 'vendeur', canal: 'rencontre', origine_detail: '' };
  r = await surFiche(SUITE, COORD);
  let co = sql(`SELECT prenom, telephone, commune FROM contact WHERE id = '${SUITE}'`)[0];
  // Revue de code 18.8 : les coordonnées passent par carnet.corrigerFiche (événement « classement » avec avant-image, AD-29).
  const evCoord = sql(`SELECT texte FROM contact_evenement WHERE contact_id = '${SUITE}' AND type = 'classement' ORDER BY id DESC LIMIT 1`)[0]?.texte ?? '';
  constat(r.headers.get('location') === `/contacts/fiche?id=${SUITE}&m=modifie` && co.prenom === 'Silvie' && co.telephone === `+33646${NUM}` && co.commune === 'Thonon'
    && evCoord.startsWith('Fiche corrigée') && evCoord.includes('téléphones') && !evCoord.includes('+33645'),
    'coordonnées corrigées (prénom, numéro rangé en +33, commune) par le carnet, texte de l\'historique sans l\'ancienne valeur');
  r = await surFiche(SUITE, { ...COORD, telephone: `+33601${NUM}` });
  html = await r.text();
  constat(r.status === 200 && html.includes(`data-conflit`) && html.includes(`/contacts/fiche?id=${didier}`) && sql(`SELECT telephone FROM contact WHERE id = '${SUITE}'`)[0].telephone === `+33646${NUM}`,
    'numéro déjà porté par un autre contact : refusé, lien vers sa fiche, rien changé');
  r = await surFiche(SUITE, { ...COORD, canal: 'boitage' });
  constat(r.status === 200 && (await r.text()).includes('passage de boîtage'), 'origine « Boîtage » sans passage : refusée');
  const NOTE = `01KFNT${NUM}${'0'.repeat(14)}`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, etape, prochaine_action, prochaine_action_le, canal, is_test) VALUES
    ('${NOTE}', '2026-02-01T08:00:00Z', '2026-02-01T08:00:00Z', 'Noté${NUM}', 'estimation', 'Envoyer l''estimation', '${hier}', 'rencontre', 1)`);
  r = await surFiche(NOTE, { quoi: 'note', note: `Note libre ${NUM} : rappeler après les vacances` });
  constat(r.headers.get('location') === `/contacts/fiche?id=${NOTE}&m=note`, 'note libre ajoutée depuis la fiche');
  html = await surAujourdhui({ contacts: [NOTE] });
  constat((html.split(`data-contact="${NOTE}"`)[1]?.split('</article>')[0] ?? '').includes(`Note libre ${NUM}`), 'aujourd\'hui : la note libre est le dernier texte du rappel');
  r = await page('/ajouter', { quoi: 'contact', nom: `Boitage${NUM}`, telephone: `06 47 ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4, 6)}`, canal: 'rencontre', note: 'Rencontré au marché' });
  const sansMail = sql(`SELECT id FROM contact WHERE telephone = '+33647${NUM}'`)[0].id;
  const droits = (type) => sql(`SELECT count(*) AS n FROM droit_exerce WHERE type = '${type}'`)[0].n;
  const accesAvant = droits('acces'), effAvant = droits('effacement');
  r = await appeler(`${E}/api/contacts/export?id=${sansMail}`, { headers: avecJeton() });
  const expContact = await r.json();
  constat(r.status === 200 && expContact.contact?.telephone === `+33647${NUM}` && expContact.contact.historique?.some((h) => h.texte === 'Rencontré au marché') && droits('acces') === accesAvant + 1,
    'export d\'un contact sans e-mail : fiche et historique, droit noté au journal');
  r = await surFiche(sansMail, { quoi: 'effacer', confirmation: 'oui' });
  constat(r.status === 200 && (await r.text()).includes('Tapez SUPPRIMER') && sql(`SELECT count(*) AS n FROM contact WHERE id = '${sansMail}'`)[0].n === 1, 'effacement sans confirmation : refusé');
  sql(`INSERT INTO leedflow_ecarte (telephone, a, categorie) VALUES ('+33647${NUM}', '2026-10-01T00:00:00Z', 'pro')`);
  r = await surFiche(sansMail, { quoi: 'effacer', confirmation: 'supprimer' });
  constat(r.headers.get('location') === '/contacts?m=efface' && sql(`SELECT count(*) AS n FROM contact WHERE id = '${sansMail}'`)[0].n === 0
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${sansMail}'`)[0].n === 0 && sql(`SELECT count(*) AS n FROM leedflow_ecarte WHERE telephone = '+33647${NUM}'`)[0].n === 0
    && droits('effacement') === effAvant + 1, 'effacement d\'un contact sans e-mail : fiche, historique et numéro classé effacés, droit noté au journal');
  r = await appeler(`${E}/gestion`, { headers: avecJeton() });
  constat(r.status === 200, 'les demandes du site se lisent toujours après un effacement');
  html = await (await appeler(`${E}/contacts/fiche?id=${SUITE}`, { headers: avecJeton() })).text();
  constat(html.includes('Écrire la synthèse') && html.includes('## Qui est ce contact'), 'synthèse d\'un contact hors Leedflow : à écrire, avec les rubriques proposées');
  r = await surFiche(SUITE, { quoi: 'synthese', synthese: `## Qui est ce contact\nVendeuse à Thonon ${NUM}` });
  html = await (await appeler(`${E}/contacts/fiche?id=${SUITE}`, { headers: avecJeton() })).text();
  constat(html.includes('data-synthese-par="anne"') && html.includes(`Vendeuse à Thonon ${NUM}`), 'synthèse écrite à la main, affichée en tête de la fiche');
  r = await appeler(`${E}/api/contacts/export?id=${SUITE}`, { headers: avecJeton() });
  constat((await r.json()).contact?.synthese?.includes(`Vendeuse à Thonon ${NUM}`), 'export : la synthèse est comprise');

  // 5 quater ter bis. Accord pour les e-mails groupés (story 13.26).
  const accordDe = (id) => sql(`SELECT email_accord_le, email_accord_source, email_desinscrit_le FROM contact WHERE id = '${id}'`)[0];
  const carteAccord = async (id) => { const h = await (await appeler(`${E}/contacts/fiche?id=${id}`, { headers: avecJeton() })).text(); return { statut: /data-accord-email="([a-z_]+)"/.exec(h)?.[1], html: h.split('data-accord-email')[1]?.split('</section>')[0] ?? '' }; };
  const emmaId = sql(`SELECT id FROM contact WHERE nom = 'Xlsx${ESSAI} & fils'`)[0].id;
  const carlaAcc = accordDe(carla);
  constat(accordDe(emmaId).email_accord_source === 'import' && carlaAcc.email_accord_le === null && (await carteAccord(emmaId)).statut === 'sans_email',
    'accord e-mail : import avec la case cochée noté « import », import sans la case sans accord ; un contact sans adresse le dit');
  let ca = await carteAccord(carla);
  constat(ca.statut === 'sans_accord' && ca.html.includes('data-accord-form'), 'fiche : contact sans accord, case « D\'accord pour recevoir mes e-mails » proposée');
  r = await surFiche(carla, { quoi: 'accord', accord: 'oui' });
  ca = await carteAccord(carla);
  constat(r.headers.get('location') === `/contacts/fiche?id=${carla}&m=accord` && accordDe(carla).email_accord_source === 'anne' && ca.statut === 'accord' && ca.html.includes('donné à vous')
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${carla}' AND texte LIKE 'Accord pour recevoir%donné à Anne'`)[0].n === 1,
    'accord noté par Anne : daté, affiché, tracé dans l\'historique');
  r = await surFiche(carla, { quoi: 'accord', accord: 'non' });
  constat(r.headers.get('location') === `/contacts/fiche?id=${carla}&m=accord-retire` && accordDe(carla).email_accord_le === null && (await carteAccord(carla)).statut === 'sans_accord',
    'accord retiré par Anne : plus de campagnes');
  await surFiche(carla, { quoi: 'accord', accord: 'oui' });
  r = await surFiche(carla, { quoi: 'refus' });
  ca = await carteAccord(carla);
  constat(r.headers.get('location') === `/contacts/fiche?id=${carla}&m=refus` && accordDe(carla).email_desinscrit_le && ca.statut === 'desinscrit' && !ca.html.includes('data-accord-form'),
    'refus noté : désinscrit, la case n\'est plus proposée');
  r = await surFiche(carla, { quoi: 'accord', accord: 'oui' });
  constat(r.status === 200 && (await r.text()).includes('désinscrite') && (await carteAccord(carla)).statut === 'desinscrit',
    'après un refus, Anne ne peut pas remettre l\'accord elle-même');
  // Accord donné sur le site : une demande avec la case cochée, rattachée au contact.
  const SITEACC = `01KFAC${NUM}${'0'.repeat(14)}`;
  const leadAcc = (id, opt, unsub = null) => sql(`INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at, newsletter_opt_in_at, newsletter_unsubscribed_at, is_test, contact_id)
    VALUES ('${id}', 'acc-${id}', '${opt}', '${opt}', 'fr', 'guide', 'acc${NUM}@example.com', '${opt}', '${opt}', ${unsub ? `'${unsub}'` : 'NULL'}, 1, '${SITEACC}')`);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, email, etape, prochaine_action, prochaine_action_le, canal, is_test) VALUES
    ('${SITEACC}', '2026-03-01T08:00:00Z', '2026-03-01T08:00:00Z', 'Site${NUM}', 'acc${NUM}@example.com', 'a_qualifier', 'Qualifier', '${auj}', 'site', 1)`);
  leadAcc(`01KFAL${NUM}${'0'.repeat(14)}`, '2026-03-01T08:00:00Z');
  ca = await carteAccord(SITEACC);
  r = await surFiche(SITEACC, { quoi: 'accord', accord: 'non' });
  constat(ca.statut === 'accord' && ca.html.includes('sur le site le') && !ca.html.includes('data-accord-retirer') && r.status === 200 && (await carteAccord(SITEACC)).statut === 'accord',
    'accord donné sur le site : lu sur la demande, affiché avec sa date, Anne ne peut pas le retirer (seulement noter un refus)');
  sql(`UPDATE lead SET newsletter_unsubscribed_at = '2026-04-01T08:00:00Z' WHERE contact_id = '${SITEACC}'`);
  constat((await carteAccord(SITEACC)).statut === 'desinscrit', 'désinscription de la séquence du site : vaut pour les campagnes');
  leadAcc(`01KFAM${NUM}${'0'.repeat(14)}`, '2026-05-01T08:00:00Z');
  constat((await carteAccord(SITEACC)).statut === 'accord', 'nouvelle case cochée sur le site après la désinscription : l\'accord revient');
  const CLIENT = `01KFCC${NUM}${'0'.repeat(14)}`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, email, etape, canal, is_test) VALUES
    ('${CLIENT}', '2026-01-01T08:00:00Z', '2026-01-01T08:00:00Z', 'Client${NUM}', 'client${NUM}@example.com', 'vendu', 'recommandation', 1)`);
  ca = await carteAccord(CLIENT);
  constat(ca.statut === 'client' && ca.html.includes('ancien client') && ca.html.includes('data-refus'), 'ancien client (vendu) : reçoit les campagnes tant qu\'il ne les refuse pas');
  // Reprise de la migration 0013 sur un contact importé avant elle (case cochée, accord pas encore noté).
  sql(`UPDATE contact SET email_accord_le = NULL, email_accord_source = NULL WHERE id = '${emmaId}'`);
  const reprise = fs.readFileSync(path.join(SITE, 'migrations', '0013-accord-email.sql'), 'utf8').split('-- Reprise')[1].split('\n').slice(1).filter((l) => !l.startsWith('--')).join(' ');
  sql(reprise);
  constat(accordDe(emmaId).email_accord_source === 'import' && accordDe(carla).email_accord_source === 'anne' && sql(`SELECT count(*) AS n FROM contact WHERE nom = 'Forum${ESSAI}' AND id <> '${carla}' AND email_accord_le IS NOT NULL`)[0].n === 0,
    'migration 0013 : l\'accord des contacts importés avec la case est repris, pas celui des imports sans la case');
  r = await appeler(`${E}/api/contacts/export?id=${carla}`, { headers: avecJeton() });
  constat((await r.json()).contact?.email_desinscrit_le, 'export : le refus des e-mails est compris');

  // 5 quater ter ter. Campagnes e-mail (story 13.27) : brouillon, qui reçoit et qui est écarté, essai, envoi étalé, désinscription.
  sql(`DELETE FROM campagne_destinataire WHERE campagne_id IN (SELECT id FROM campagne WHERE nom LIKE 'Essai campagne%')`);
  sql(`DELETE FROM campagne WHERE nom LIKE 'Essai campagne%'`);
  const COMMUNE_K = `Camp${NUM}`;
  const K = Object.fromEntries(['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((l) => [l, `01KGC${l}${NUM}${'0'.repeat(14)}`]));
  const contactK = (l, { email = `k${l.toLowerCase()}${NUM}@example.com`, etape = 'a_qualifier', parcours = 'vendeur', accord = null, refus = null, prenom = `P${l}` } = {}) =>
    `('${K[l]}', '2026-02-01T08:00:00Z', '2026-02-01T08:00:00Z', '${prenom}', 'Camp${NUM}${l}', ${email ? `'${email}'` : 'NULL'}, '${etape}', ${etape === 'vendu' ? 'NULL' : "'Rappeler'"}, ${etape === 'vendu' ? 'NULL' : `'${auj}'`},
      'rencontre', '${COMMUNE_K}', '${parcours}', 1, ${accord ? `'${accord}', 'anne'` : 'NULL, NULL'}, ${refus ? `'${refus}'` : 'NULL'})`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, email, etape, prochaine_action, prochaine_action_le, canal, commune, parcours, is_test, email_accord_le, email_accord_source, email_desinscrit_le) VALUES
    ${[contactK('A', { accord: '2026-02-02T08:00:00Z', prenom: 'Alice' }), contactK('B', { etape: 'vendu', prenom: 'Bruno' }), contactK('C'),
      contactK('D', { accord: '2026-02-02T08:00:00Z', refus: '2026-02-03T08:00:00Z' }), contactK('E', { accord: '2026-02-02T08:00:00Z', parcours: 'acheteur' }),
      contactK('F', { email: null, accord: '2026-02-02T08:00:00Z' })].join(',\n')}`);
  r = await appeler(`${E}/campagnes`, { headers: avecJeton() });
  constat(r.status === 200 && (await r.text()).includes('data-creer'), 'campagnes : la page s\'ouvre, on peut en commencer une');
  r = await page('/campagnes', { quoi: 'creer', nom: `Essai campagne ${NUM}` });
  const kid = /id=([0-9A-Z]{26})/.exec(r.headers.get('location') ?? '')?.[1];
  constat(r.status === 303 && !!kid && sql(`SELECT statut FROM campagne WHERE id = '${kid}'`)[0]?.statut === 'brouillon', 'campagne commencée : un brouillon');
  const contenuK = (autres = []) => [['quoi', 'enregistrer'], ['nom', `Essai campagne ${NUM}`], ['objet', 'Le marché cet automne'],
    ['texte', 'Bonjour [Prénom],\n\nLes prix **tiennent** à Thonon.'], ['bouton_libelle', 'Faire mon diagnostic'], ['bouton_lien', '/diagnostic'],
    ['commune', COMMUNE_K], ['parcours', ''], ['canal', ''], ...['a_qualifier', 'vendu', 'besoin_defini'].map((e) => ['etapes', e]), ...autres];
  const ficheK = async (id = kid) => (await appeler(`${E}/campagnes?id=${id}`, { headers: avecJeton() })).text();
  r = await page(`/campagnes?id=${kid}`, contenuK());
  let hk = await ficheK();
  constat(r.headers.get('location') === `/campagnes?id=${kid}&m=enregistree` && hk.includes('data-recoivent="3"') && (hk.match(/data-ecartes=/g) ?? []).length === 3,
    'filtres enregistrés : 3 recevront (accord, ancien client, acheteur d\'accord), 3 écartés par raison (sans accord, désinscrit, sans adresse)');
  constat(hk.includes('data-apercu') && hk.includes('Bonjour Marie') && /utm_campaign=essai-campagne-\d+/.test(hk) && hk.includes('utm_medium=email'),
    'aperçu de l\'e-mail avec un prénom d\'exemple, bouton vers le site avec les paramètres de la campagne');
  // Revue de code 18.8 : la méthode de la catégorie restreint l'envoi groupé, jamais ne l'élargit. Alice (accord) passe dans
  // « Proches » (pas d'envoi groupé) : écartée ; la personne sans accord (C) dans « Demandes reçues » (envoi permis) : toujours écartée.
  sql(`UPDATE contact SET categorie_id = 'proches' WHERE id = '${K.A}'`);
  sql(`UPDATE contact SET categorie_id = 'demandes_recues' WHERE id = '${K.C}'`);
  await page(`/campagnes?id=${kid}`, contenuK());
  hk = await ficheK();
  constat(hk.includes('data-recoivent="2"') && hk.includes('Catégorie sans envoi groupé') && (hk.match(/data-ecartes=/g) ?? []).length === 4,
    'revue 18.8 : une catégorie sans envoi groupé écarte ses contacts même avec leur accord (raison « Catégorie sans envoi groupé ») ; une catégorie qui le permet n\'ajoute pas une personne sans accord');
  sql(`UPDATE contact SET categorie_id = NULL WHERE id IN ('${K.A}', '${K.C}')`);
  await page(`/campagnes?id=${kid}`, contenuK());
  r = await page(`/campagnes?id=${kid}`, contenuK().map(([k, v]) => [k, k === 'parcours' ? 'vendeur' : v]));
  constat((await ficheK()).includes('data-recoivent="2"'), 'filtre vendeurs : l\'acheteur n\'est plus compté');
  r = await page(`/campagnes?id=${kid}`, contenuK().map(([k, v]) => [k, k === 'bouton_lien' ? 'javascript:alert(1)' : v]));
  constat(r.status === 200 && (await r.text()).includes('data-erreur') && sql(`SELECT bouton_lien FROM campagne WHERE id = '${kid}'`)[0].bouton_lien === '/diagnostic',
    'lien de bouton refusé s\'il n\'est ni une page du site ni une adresse https');
  await page(`/campagnes?id=${kid}`, contenuK());
  const avantEssai = recus.length;
  r = await page(`/campagnes?id=${kid}`, contenuK().map(([k, v]) => [k, k === 'quoi' ? 'essai' : v]));
  const essaiK = recus.slice(avantEssai);
  constat(r.headers.get('location') === `/campagnes?id=${kid}&m=essai` && essaiK.length === 1 && essaiK[0].subject === '[TEST] [ESSAI] Le marché cet automne'
    && essaiK[0].text.includes('parti vers anne@example.com') && !essaiK[0].headers,
    'essai : envoyé à la personne connectée (ici la boîte de test), objet marqué [ESSAI], sans lien de désinscription d\'un contact');
  r = await page(`/campagnes?id=${kid}`, [['quoi', 'lancer']]);
  constat(r.status === 200 && (await r.text()).includes('data-erreur') && sql(`SELECT statut FROM campagne WHERE id = '${kid}'`)[0].statut === 'brouillon',
    'envoi sans la case de confirmation : refusé');
  r = await page(`/campagnes?id=${kid}`, [['quoi', 'lancer'], ['confirme', 'oui']]);
  const destK = () => Object.fromEntries(sql(`SELECT contact_id, statut FROM campagne_destinataire WHERE campagne_id = '${kid}'`).map((d) => [d.contact_id, d.statut]));
  constat(r.headers.get('location') === `/campagnes?id=${kid}&m=lancee` && JSON.stringify(Object.keys(destK()).sort()) === JSON.stringify([K.A, K.B, K.E].sort())
    && sql(`SELECT statut FROM campagne WHERE id = '${kid}'`)[0].statut === 'envoi', 'envoi : liste figée sur les 3 personnes qui peuvent la recevoir');
  r = await page(`/campagnes?id=${kid}`, contenuK());
  constat(r.status === 200 && (await r.text()).includes('déjà partie'), 'une campagne partie ne se modifie plus');
  // Entre l'envoi et le passage de la tâche : une personne se désinscrit d'un autre e-mail. Elle est écartée au dernier moment.
  sql(`UPDATE contact SET email_desinscrit_le = '${new Date().toISOString()}' WHERE id = '${K.E}'`);
  const passeK = async () => {
    const t0 = destK();
    await appeler(`${E}/cdn-cgi/handler/scheduled`);
    for (let i = 0; i < 40 && JSON.stringify(destK()) === JSON.stringify(t0); i++) await pause(250);
    await pause(500);
  };
  const avantK = recus.length;
  await passeK();
  let dk = destK();
  constat(Object.values(dk).filter((s) => s === 'envoye').length === 2 && dk[K.E] === 'a_envoyer', 'tâche planifiée : un paquet de 2 au plus par passage (réglage d\'essai)');
  await passeK();
  dk = destK();
  constat(dk[K.E] === 'annule' && sql(`SELECT erreur FROM campagne_destinataire WHERE contact_id = '${K.E}'`)[0].erreur === 'désinscrit'
    && sql(`SELECT statut FROM campagne WHERE id = '${kid}'`)[0].statut === 'envoyee', 'désinscrit après l\'envoi : écarté au dernier moment, campagne terminée');
  const mailA = recus.slice(avantK).find((m) => m.idempotence === `campagne:${kid}:${K.A}`);
  const lienA = /(http\S+\/desabonnement\?c=\S+)/.exec(mailA?.text ?? '')?.[1];
  constat(!!mailA && mailA.subject === '[TEST] Le marché cet automne' && mailA.html.includes('Bonjour Alice') && mailA.html.includes('>tiennent</strong>')
    && mailA.text.includes('utm_source=espace') && mailA.reply_to === 'avialtissot@gmail.com' && !!lienA && lienA.includes(`c=${K.A}`)
    && mailA.headers?.['List-Unsubscribe'] === `<${lienA.replace('/desabonnement?', '/api/desabonnement?')}>` && mailA.headers?.['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click',
    'e-mail de campagne : prénom, mise en forme, paramètres de la campagne, réponses vers Anne, lien et en-têtes de désinscription en un clic');
  constat(recus.slice(avantK).filter((m) => m.idempotence?.startsWith(`campagne:${kid}:`)).length === 2, 'chaque personne reçoit la campagne une fois');
  const avantRejeu = recus.length;
  await appeler(`${E}/cdn-cgi/handler/scheduled`);
  await pause(1500);
  constat(!recus.slice(avantRejeu).some((m) => m.idempotence?.startsWith(`campagne:${kid}:`)), 'passage suivant : rien n\'est renvoyé');
  hk = (await (await appeler(`${E}/contacts/fiche?id=${K.A}`, { headers: avecJeton() })).text());
  constat(sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${K.A}' AND type = 'email' AND source_id = 'campagne:${kid}:${K.A}'`)[0].n === 1
    && hk.includes(`Campagne « Essai campagne ${NUM} » envoyée`), 'fiche du contact : la campagne reçue est dans l\'historique');
  hk = await ficheK();
  constat(hk.includes('data-envoyes="2"') && hk.includes('data-rates'), 'page de la campagne : 2 envoyés, ce qui n\'est pas parti avec la raison');
  // Désinscription par le lien de l'e-mail (page du site, bouton), puis en un clic depuis la messagerie.
  r = await appeler(lienA);
  const pageDes = await r.text();
  constat(r.status === 200 && pageDes.includes('e-mails d’information') && !sql(`SELECT email_desinscrit_le FROM contact WHERE id = '${K.A}'`)[0].email_desinscrit_le,
    'lien de désinscription ouvert : la page demande confirmation, rien n\'est fait à l\'ouverture');
  r = await appeler(lienA, { method: 'POST', headers: { Origin: S, 'Content-Type': 'application/x-www-form-urlencoded' }, body: '' });
  constat(r.status === 200 && !!sql(`SELECT email_desinscrit_le FROM contact WHERE id = '${K.A}'`)[0].email_desinscrit_le
    && (await (await appeler(`${E}/contacts/fiche?id=${K.A}`, { headers: avecJeton() })).text()).includes('data-accord-email="desinscrit"'),
    'désinscription confirmée sur le site : le contact est désinscrit de toutes les campagnes, la fiche le dit');
  const lienB = /(http\S+\/desabonnement\?c=\S+)/.exec(recus.find((m) => m.idempotence === `campagne:${kid}:${K.B}`)?.text ?? '')?.[1] ?? '';
  const unClicB = lienB.replace('/desabonnement?', '/api/desabonnement?');
  r = await appeler(unClicB.replace(/s=[^&]+/, 's=faux'), { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
  const refuseB = r.status;
  r = await appeler(unClicB, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
  constat(refuseB === 404 && r.status === 200 && !!sql(`SELECT email_desinscrit_le FROM contact WHERE id = '${K.B}'`)[0].email_desinscrit_le,
    'désinscription en un clic depuis la messagerie (ancien client compris) ; un lien mal signé est refusé');
  // Effacement d'un contact : ses lignes de campagne partent avec lui.
  r = await surFiche(K.A, { quoi: 'effacer', confirmation: 'supprimer' });
  constat(sql(`SELECT count(*) AS n FROM campagne_destinataire WHERE contact_id = '${K.A}'`)[0].n === 0 && sql(`SELECT count(*) AS n FROM contact WHERE id = '${K.A}'`)[0].n === 0,
    'effacement RGPD d\'un contact : il disparaît aussi des campagnes');
  // Un brouillon gardé pour les captures, avec une personne d'accord pour qu'il ne soit pas vide.
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, email, etape, prochaine_action, prochaine_action_le, canal, commune, parcours, is_test, email_accord_le, email_accord_source, email_desinscrit_le) VALUES
    ${contactK('G', { accord: '2026-02-02T08:00:00Z', prenom: 'Gaëlle' })}`);
  r = await page('/campagnes', { quoi: 'creer', nom: `Essai campagne brouillon ${NUM}` });
  const kbrouillon = /id=([0-9A-Z]{26})/.exec(r.headers.get('location') ?? '')?.[1];
  await page(`/campagnes?id=${kbrouillon}`, contenuK().map(([k, v]) => [k, k === 'nom' ? `Essai campagne brouillon ${NUM}` : v]));

  // 5 quater quater. Listes et recherche pensées téléphone (story 13.24).
  const cherche = async (q, f = '') => (await appeler(`${E}/contacts?${new URLSearchParams({ q, ...(f ? { f } : {}) })}`, { headers: avecJeton() })).text();
  const trouve = (h, id) => h.includes(`data-carte="${id}"`);
  constat(trouve(await cherche('0646'), SUITE) && trouve(await cherche(`06 46 ${NUM.slice(0, 2)}`), SUITE) && !trouve(await cherche('0699999'), SUITE),
    'recherche : un début de numéro tapé en 0 (« 0646 », « 06 46 xx ») trouve le contact rangé en +33');
  constat(trouve(await cherche(`silvie suite${NUM}`), SUITE) && trouve(await cherche(`suite${NUM} thonon`), SUITE) && !trouve(await cherche(`silvie paris${NUM}`), SUITE),
    'recherche : plusieurs mots cherchés chacun dans prénom, nom et commune (« prénom nom », « nom commune »)');
  constat(trouve(await cherche(`carla+${ESSAI}@exa`), carla), 'recherche : un e-mail partiel marche toujours');
  html = await cherche('', 'retard');
  constat(trouve(html, NOTE) && (html.split(`data-carte="${NOTE}"`)[1]?.split('</li>')[0] ?? '').includes('data-retard') && !trouve(html, SUITE),
    'filtre « En retard » : le contact dont l\'action est passée, signalé en rouge ; pas celui prévu plus tard');
  constat(!trouve(await cherche('', 'a_qualifier'), SUITE) && trouve(await cherche('', 'vendeurs'), SUITE) && trouve(await cherche('', 'a_qualifier'), didier),
    'filtres « À qualifier » et « Vendeurs »');
  html = await cherche(`suite${NUM}`);
  constat((html.split(`data-carte="${SUITE}"`)[1]?.split('</li>')[0] ?? '').includes('Second rendez-vous') && html.includes('data-contacts'),
    'contacts : une carte par contact avec étape et prochaine action, le tableau gardé pour l\'ordinateur');
  html = await (await appeler(`${E}/contacts/fiche?id=${SUITE}`, { headers: avecJeton() })).text();
  constat((html.split('data-tel')[1] ?? '').includes(`06 46 ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4, 6)}`), 'fiche : numéro affiché « 06 46 … » (gardé en +33 dans la base)');
  html = await (await appeler(`${E}/gestion?q=${encodeURIComponent('olga orphelin')}`, { headers: avecJeton() })).text();
  constat(html.includes(`/gestion/lead?id=ORPH${ESSAI}`), 'demandes du site : la recherche « prénom nom » marche aussi');
  html = await (await appeler(`${E}/pipeline?parcours=vendeur&etape=second_rdv`, { headers: avecJeton() })).text();
  constat(/data-etape-lien="second_rdv"[^>]*>|aria-current="page"[^>]*data-etape-lien="second_rdv"/.test(html) && /class="pl-colonne[^"]*pl-autre[^"]*"[^>]*data-colonne="estimation"/.test(html)
    && !/class="pl-colonne[^"]*pl-autre[^"]*"[^>]*data-colonne="second_rdv"/.test(html),
    'pipeline : pastilles d\'étapes, seule l\'étape choisie est montrée sur téléphone');
  html = await (await appeler(`${E}/aujourdhui`, { headers: avecJeton() })).text();
  constat(/data-date[^>]*>[a-zé]/.test(html) && !html.includes('text-transform:capitalize'), 'aujourd\'hui : la date en minuscules (« samedi 24 octobre »)');

  // 5 quinquies. Bilan du lundi par canal (story 13.13) : les chiffres suivent la base, sans saisie.
  const ligneCanal = async (canal) => {
    const h = await (await appeler(`${E}/bilan?p=semaine`, { headers: avecJeton() })).text();
    const l = h.split(`data-canal="${canal}"`)[1]?.split('</tr>')[0] ?? '';
    return { html: h, chiffres: [...l.matchAll(/class="n"[^>]*>(\d+)</g)].map((m) => Number(m[1])) };
  };
  const avantReco = await ligneCanal('recommandation');
  r = await page('/ajouter', { quoi: 'contact', prenom: 'Zoé', nom: `Bilan${NUM}`, email: `zoe+${ESSAI}@example.com`, canal: 'recommandation', parcours: 'vendeur', prescripteur_nom: `Maître Durand ${ESSAI}` });
  const zoe = sql(`SELECT id FROM contact WHERE email = 'zoe+${ESSAI}@example.com'`)[0].id;
  await qualif(zoe, { ...Q, issue: 'rdv', rdv_le: '2027-02-01T09:30' });
  const apresReco = await ligneCanal('recommandation');
  const [c0, q0, rdv0] = avantReco.chiffres, [c1, q1b, rdv1] = apresReco.chiffres;
  constat(c1 === c0 + 1 && q1b === q0 + 1 && rdv1 === rdv0 + 1, `bilan : un contact recommandé qualifié en rendez-vous ajoute 1 contact, 1 qualifié, 1 rendez-vous à « Recommandation » (${c0}/${q0}/${rdv0} → ${c1}/${q1b}/${rdv1})`);
  html = apresReco.html;
  const boitage = html.split('data-boitage')[1]?.split('</section>')[0] ?? '';
  constat(boitage.includes(`data-secteur="${SECTEUR}"`) && boitage.split(`data-secteur="${SECTEUR}"`)[1].split('</tr>')[0].includes('Repasser vers le')
    && boitage.split(`data-secteur="Margencel-${NUM}"`)[1]?.split('</tr>')[0].includes('Repasser cette semaine'),
    'bilan : boîtage par secteur, avec la suite (repasser vers une date, ou cette semaine)');
  constat((html.split('data-perdus')[1] ?? '').includes('Hors secteur'), 'bilan : les motifs de perte de la période');
  constat(/Délai moyen de rappel<\/div><div class="b-chiffre"[^>]*>\d+ (min|h|j)</.test(html), 'bilan : délai moyen de rappel calculé');
  constat(html.includes('data-constats') && html.includes('donne le plus de rendez-vous'), 'bilan : « ce que la période dit », tiré des chiffres');
  r = await appeler(`${E}/bilan?p=trimestre`, { headers: avecJeton() });
  constat(r.status === 200 && (await r.text()).includes('3 derniers mois'), 'bilan : période de 3 mois');

  // 5 quinquies bis. Entonnoir du diagnostic (story 10.12) : passages comptés par le site, lus par campagne.
  const passages = [
    ...[1, 2, 3].map((i) => [`E2E${ESSAI}A${i}`, 'arrivee', '']), ...[1, 2].map((i) => [`E2E${ESSAI}A${i}`, 'ecran', 'q01']),
    [`E2E${ESSAI}A1`, 'ecran', 'q10a'], [`E2E${ESSAI}A1`, 'ecran', 'q10b'], [`E2E${ESSAI}A1`, 'coordonnees', ''],
  ];
  sql(`INSERT INTO entonnoir (parcours, etape, ecran, source, support, contenu, lang, is_test, at) VALUES ${passages.map(([p, e, q]) => `('${p}', '${e}', '${q}', 'facebook', 'paid', 'carrousel-${ESSAI.toLowerCase()}', 'fr', 1, '${new Date().toISOString()}')`).join(', ')}, ('E2E${ESSAI}B1', 'arrivee', '', '', '', '', 'fr', 1, '${new Date().toISOString()}')`);
  // Story 10.13 : A1 et A2 (question 1) en navigateur intégré sur iPhone, A1 touché ; A2 non touché.
  sql(`UPDATE entonnoir SET integre = 1, appareil = 'ios', affichage = CASE parcours WHEN 'E2E${ESSAI}A1' THEN 'moins-2s' ELSE 'cachee' END
       WHERE parcours IN ('E2E${ESSAI}A1', 'E2E${ESSAI}A2') AND etape = 'ecran' AND ecran = 'q01'`);
  sql(`INSERT INTO entonnoir (parcours, etape, ecran, source, support, contenu, lang, is_test, at) VALUES
       ('E2E${ESSAI}A1', 'interaction', '', 'facebook', 'paid', 'carrousel-${ESSAI.toLowerCase()}', 'fr', 1, '${new Date().toISOString()}'),
       ('E2E${ESSAI}A1', 'ecran', 'q02', 'facebook', 'paid', 'carrousel-${ESSAI.toLowerCase()}', 'fr', 1, '${new Date().toISOString()}')`);
  // Story 10.15 : A4 et A5 suivent le nouveau parcours (écran d'entrée, prénom et e-mail, avant la question 1), sur iPhone dans
  // l'application ; A4 touche l'écran d'entrée et passe à la question 1, A5 (préchargé) ne fait rien.
  const nouveaux = [[`E2E${ESSAI}A4`, 'arrivee', ''], [`E2E${ESSAI}A4`, 'coordonnees', 'entree'], [`E2E${ESSAI}A4`, 'interaction', ''], [`E2E${ESSAI}A4`, 'ecran', 'q01'],
    [`E2E${ESSAI}A5`, 'arrivee', ''], [`E2E${ESSAI}A5`, 'coordonnees', 'entree']];
  sql(`INSERT INTO entonnoir (parcours, etape, ecran, source, support, contenu, lang, is_test, at, integre, appareil, affichage) VALUES ${nouveaux.map(([p, e, q]) => `('${p}', '${e}', '${q}', 'facebook', 'paid', 'carrousel-${ESSAI.toLowerCase()}', 'fr', 1, '${new Date().toISOString()}', 1, 'ios', '${e === 'coordonnees' ? (p.endsWith('A4') ? 'moins-2s' : 'cachee') : ''}')`).join(', ')}`);
  // Story 10.14 : version « accueil » du test A/B. 4 arrivées sur l'accueil (H1 clique le diagnostic, H2 l'estimation),
  // D1 va jusqu'à la question 2, C1 touche l'agenda et le formulaire (une estimation commencée) puis réserve.
  const ab = [
    ...[1, 2, 3, 4].map((i) => [`E2E${ESSAI}H${i}`, 'accueil', '']), [`E2E${ESSAI}H1`, 'clic', 'diagnostic'], [`E2E${ESSAI}H2`, 'clic', 'estimation'],
    [`E2E${ESSAI}D1`, 'arrivee', ''], [`E2E${ESSAI}D2`, 'ecran', 'q01'], [`E2E${ESSAI}D2`, 'ecran', 'q02'],
    [`E2E${ESSAI}C1`, 'estimation', 'agenda'], [`E2E${ESSAI}C1`, 'estimation', 'formulaire'], [`E2E${ESSAI}C1`, 'estimation', 'reservation'],
  ];
  sql(`INSERT INTO entonnoir (parcours, etape, ecran, source, support, campagne, contenu, lang, is_test, at) VALUES ${ab.map(([p, e, q]) => `('${p}', '${e}', '${q}', 'meta', 'pub', 'diagnostic-2026', 'accueil-${ESSAI.toLowerCase()}', 'fr', 1, '${new Date().toISOString()}')`).join(', ')}`);
  const cleAb = `meta|pub|diagnostic-2026|accueil-${ESSAI.toLowerCase()}`;
  const cleE2e = `facebook|paid||carrousel-${ESSAI.toLowerCase()}`;
  r = await appeler(`${E}/bilan?p=semaine&d=${encodeURIComponent(cleE2e)}`, { headers: avecJeton() });
  html = await r.text();
  const ligneCampagne = html.split(`data-campagne="${cleE2e}"`)[1]?.split('</tr>')[0] ?? '';
  const nCampagne = [...ligneCampagne.matchAll(/class="n"[^>]*>(\d+)</g)].map((m) => Number(m[1]));
  const detail = html.split(`data-detail="${cleE2e}"`)[1]?.split('</table>')[0] ?? '';
  const q10 = detail.split('data-etape="q10"')[1]?.split('</tr>')[0] ?? '';
  constat(r.status === 200 && ligneCampagne.includes(`facebook · paid · carrousel-${ESSAI.toLowerCase()}`) && nCampagne.slice(0, 4).join(',') === '5,2,3,0',
    `bilan : entonnoir par campagne, 5 arrivées, 2 prénom et e-mail, 3 commencés, aucun à la question 8 (${nCampagne.join(',')})`);
  const lignesDetail = (cle) => [...(detail.split(`data-etape="${cle}"`)[1]?.split('</tr>')[0] ?? '').matchAll(/class="n"[^>]*>([^<]*)</g)].map((m) => m[1]);
  constat(lignesDetail('coordonnees-entree')[0] === '2' && lignesDetail('coordonnees')[0] === '1' && detail.indexOf('data-etape="coordonnees-entree"') < detail.indexOf('data-etape="q01"'),
    `bilan : écran d'entrée avant la question 1, ancien écran des coordonnées gardé pour la période (${lignesDetail('coordonnees-entree')} · ${lignesDetail('coordonnees')})`);
  const ventil = html.split('data-question1')[1]?.split('</table>')[0] ?? '';
  const ligneVentil = (libelle) => [...(ventil.split(libelle)[1]?.split('</tr>')[0] ?? '').matchAll(/class="n"[^>]*>([^<]+)</g)].map((m) => m[1]).join(',');
  // Premier écran : la question 1 pour A1 et A2 (suite : question 2), l'écran d'entrée pour A4 et A5 (suite : question 1).
  constat(ligneVentil('Application Instagram ou Facebook') === '4,2,2,50\u00a0%' && ligneVentil('iPhone ou iPad') === '4,2,2,50\u00a0%'
    && ligneVentil('Affiché en moins de 2 s') === '2,2,2,100\u00a0%' && ligneVentil('préchargée ou en arrière-plan') === '2,0,0,0\u00a0%',
    `bilan : premier écran → suite par navigateur, appareil et affichage (${ligneVentil('Application Instagram ou Facebook')} · ${ligneVentil('préchargée ou en arrière-plan')})`);
  const ligneAb = [...(html.split(`data-ab-campagne="${cleAb}"`)[1]?.split('</tr>')[0] ?? '').matchAll(/class="n"[^>]*>([^<]+)</g)].map((m) => m[1]).join(',');
  constat(ligneAb === '4,4,1,1,1,1,1,2,50\u00a0%', `bilan : test A/B, version accueil (entrées, accueil, clics, question 2, estimation, rendez-vous, objectif, taux : ${ligneAb})`);
  constat(q10.includes('>1<') && html.includes('Sans lien de campagne') && html.includes(`Étape par étape : facebook · paid · carrousel-${ESSAI.toLowerCase()}`),
    'bilan : étape par étape pour la campagne choisie, questions 10 a et b comptées une fois, visite sans campagne à part');

  // 5 sexies. Prescripteurs (story 13.14).
  const durand = sql(`SELECT id FROM prescripteur WHERE nom = 'Maître Durand ${ESSAI}'`)[0].id;
  r = await appeler(`${E}/prescripteurs`, { headers: avecJeton() });
  html = await r.text();
  const ligneDurand = html.split(`data-prescripteur="${durand}"`)[1]?.split('</tr>')[0] ?? '';
  const nombres = [...ligneDurand.matchAll(/class="n"[^>]*>(\d+)</g)].map((m) => Number(m[1]));
  constat(r.status === 200 && nombres[0] === 2 && nombres[1] === 0 && ligneDurand.includes('Cette semaine') && ligneDurand.includes('vente d&#39;Anthy'),
    'prescripteurs : 2 recommandés sur 12 mois, 0 mandat, relance due « cette semaine » avec sa raison');
  sql(`UPDATE contact SET etape = 'mandat_exclusif' WHERE id = '${zoe}'`);
  r = await appeler(`${E}/prescripteurs`, { headers: avecJeton() });
  const apres = (await r.text()).split(`data-prescripteur="${durand}"`)[1]?.split('</tr>')[0] ?? '';
  constat([...apres.matchAll(/class="n"[^>]*>(\d+)</g)].map((m) => Number(m[1]))[1] === 1, 'prescripteurs : un contact recommandé passé en mandat compte 1 mandat');
  r = await page(`/prescripteurs/fiche?id=${durand}`, { quoi: 'echange', relance_choix: '3m', relance_raison: 'Vœux et nouvelles du quartier', note: 'Café à Thonon' });
  const pd = sql(`SELECT dernier_contact_le, prochaine_relance_le, relance_raison, notes FROM prescripteur WHERE id = '${durand}'`)[0];
  constat(r.headers.get('location') === `/prescripteurs/fiche?id=${durand}&m=echange` && pd.dernier_contact_le === auj && pd.prochaine_relance_le === dans3mois
    && pd.relance_raison === 'Vœux et nouvelles du quartier' && pd.notes.includes('Café à Thonon'), 'échange noté : dernier contact aujourd\'hui, relance dans 3 mois avec sa raison, note gardée');
  r = await appeler(`${E}/aujourdhui`, { headers: avecJeton() });
  constat(!(await r.text()).includes(`Relancer Maître Durand ${ESSAI}`), 'aujourd\'hui : le prescripteur relancé n\'y est plus');
  r = await page('/prescripteurs', { nom: `Avocate ${ESSAI}`, role: 'Droit de la famille, Thonon', telephone: '04 50 00 00 00', prochaine_relance_le: auj, relance_raison: 'Premier rendez-vous de présentation' });
  const avocate = sql(`SELECT id, telephone FROM prescripteur WHERE nom = 'Avocate ${ESSAI}'`)[0];
  constat(r.headers.get('location') === `/prescripteurs/fiche?id=${avocate?.id}&m=ajoute` && avocate.telephone === '+33450000000', 'nouveau prescripteur ajouté depuis la liste');
  r = await page('/prescripteurs', { nom: '' });
  constat(r.status === 200 && (await r.text()).includes('data-erreur'), 'prescripteur sans nom : refusé');
  r = await appeler(`${E}/prescripteurs/fiche?id=${durand}`, { headers: avecJeton() });
  constat((await r.text()).includes(`/contacts/fiche?id=${zoe}`), 'fiche du prescripteur : ses contacts recommandés');

  // 5 septies. Acheteurs actifs (story 13.15).
  const ANTHY = `Anthy-${NUM}`;
  const ajouterAcheteur = async (prenom, mail) => {
    await page('/ajouter', { quoi: 'contact', prenom, nom: `Acheteur${NUM}`, email: mail, canal: 'portail', parcours: 'acheteur', commune: 'Genève' });
    return sql(`SELECT id FROM contact WHERE email = '${mail}'`)[0].id;
  };
  const ach1 = await ajouterAcheteur('Hugo', `hugo+${ESSAI}@example.com`), ach2 = await ajouterAcheteur('Inès', `ines+${ESSAI}@example.com`);
  r = await appeler(`${E}/contacts/qualifier?id=${ach1}`, { headers: avecJeton() });
  constat((await r.text()).includes('name="a_budget"'), 'qualifier un acheteur : budget, secteur et financement demandés');
  await qualif(ach1, [['q_bien', 'Maison'], ['q_vend_avant', 'Oui'], ['a_types', 'Maison'], ['a_pieces', 'T5 et plus'], ['a_pieces', 'T4'], ['a_pieces', 'Château'], ['a_surface', '120 m²'],
    ['a_exterieur', 'Jardin'], ['a_autres', 'Vue lac, plain-pied'], ['a_budget', '700 k€'], ['a_secteur', `${ANTHY}, Sciez`], ['a_financement', 'Après sa vente'], ['issue', 'rdv'], ['rdv_le', '2027-02-02T10:00']]);
  await qualif(ach2, { q_bien: 'Maison', q_vend_avant: 'Non', a_budget: '900 k€ à 1,1 M€', a_secteur: ANTHY, a_financement: 'Vérifié', issue: 'rdv', rdv_le: '2027-02-03T10:00' });
  constat(sql(`SELECT etape FROM contact WHERE id = '${ach1}'`)[0].etape === 'besoin_defini' && JSON.parse(sql(`SELECT qualification FROM contact WHERE id = '${ach1}'`)[0].qualification).budget === '700 k€',
    'acheteur qualifié en rendez-vous : étape « Besoin défini », budget gardé');
  // Critères de recherche (story 13.30) : plusieurs choix par critère, gardés dans l'ordre de la liste, choix inconnu ignoré.
  const crit1 = JSON.parse(sql(`SELECT qualification FROM contact WHERE id = '${ach1}'`)[0].qualification);
  constat(crit1.types === 'Maison' && crit1.pieces === 'T4, T5 et plus' && crit1.surface === '120' && crit1.exterieur === 'Jardin' && crit1.autres === 'Vue lac, plain-pied' && !crit1.stationnement,
    'critères acheteur : type, pièces (plusieurs, dans l\'ordre, « Château » ignoré), surface sans « m² », extérieur, autres critères');
  html = await (await appeler(`${E}/contacts/qualifier?id=${ach1}`, { headers: avecJeton() })).text();
  constat(/value="T4"\s+checked/.test(html) && /value="T5 et plus"\s+checked/.test(html) && !/value="T3"\s+checked/.test(html) && html.includes('value="120"'),
    'corriger la qualification : les critères cochés et la surface sont repris');
  html = await (await appeler(`${E}/contacts/fiche?id=${ach1}`, { headers: avecJeton() })).text();
  const rech1 = html.split('data-recherche')[1]?.split('</section>')[0] ?? '';
  constat(rech1.includes('T4, T5 et plus') && rech1.includes('120 m²') && rech1.includes('Vue lac') && rech1.includes('700 k€') && !rech1.includes('Stationnement'),
    'fiche acheteur : « Ce qu\'il ou elle cherche » ne montre que les critères renseignés');
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, commune, parcours, etape, prochaine_action, prochaine_action_le, reveil_le, canal, is_test) VALUES
    ('DORT${NUM}', '2026-05-01T08:00:00Z', '2026-05-01T08:00:00Z', 'Dormeur${NUM}', '${ANTHY}', 'vendeur', 'en_sommeil', 'Réveiller : rappeler', '2027-03-01', '2027-03-01', 'boitage', 1)`);
  r = await appeler(`${E}/acheteurs`, { headers: avecJeton() });
  html = await r.text();
  const l1 = html.split(`data-acheteur="${ach1}"`)[1]?.split('</tr>')[0] ?? '', l2 = html.split(`data-acheteur="${ach2}"`)[1]?.split('</tr>')[0] ?? '';
  constat(l1.includes('data-aussi-vendeur') && l1.includes('700 k€') && l1.includes('Maison · T4, T5 et plus · 120 m² et plus · Jardin') && !l2.includes('data-aussi-vendeur') && l2.includes('Vérifié'),
    'acheteurs actifs : critères affichés, celui qui doit d\'abord vendre signalé « aussi vendeur »');
  constat(html.includes(`data-secteur="${ANTHY.toLowerCase()}"`) && html.includes('2 acheteur(s)'), 'acheteurs : la commune cherchée par 2 acheteurs');
  r = await appeler(`${E}/acheteurs?secteur=${encodeURIComponent(ANTHY.toLowerCase())}`, { headers: avecJeton() });
  constat((await r.text()).includes(`data-vendeur="DORT${NUM}"`), 'depuis la commune : les vendeurs en sommeil du même secteur');
  r = await appeler(`${E}/aujourdhui`, { headers: avecJeton() });
  constat((await r.text()).includes(`data-lettre="${ANTHY.toLowerCase()}"`), 'aujourd\'hui : lettre « j\'ai un acheteur » proposée pour la commune');

  // 5 octies. Vue pipeline (story 13.16).
  r = await appeler(`${E}/pipeline?parcours=acheteur`, { headers: avecJeton() });
  html = await r.text();
  constat(r.status === 200 && (html.split('data-colonne="besoin_defini"')[1]?.split('</section>')[0] ?? '').includes(`data-contact="${ach1}"`),
    'pipeline acheteurs : l\'acheteur qualifié est dans la colonne « Besoin défini »');
  r = await page(`/pipeline?parcours=acheteur`, { id: ach1, etape: 'visites', action: '' });
  constat(r.status === 200 && (await r.text()).includes('data-erreur') && sql(`SELECT etape FROM contact WHERE id = '${ach1}'`)[0].etape === 'besoin_defini',
    'déplacer vers une étape active sans prochaine action : refusé');
  r = await page(`/pipeline?parcours=acheteur`, { id: ach1, etape: 'visites', action: 'Visite à Anthy', le: '2027-02-10', heure: '14:30' });
  const pv = sql(`SELECT etape, prochaine_action, prochaine_action_le FROM contact WHERE id = '${ach1}'`)[0];
  constat(r.headers.get('location') === `/pipeline?parcours=acheteur&etape=visites&m=deplace#c-${ach1}` && pv.etape === 'visites' && pv.prochaine_action === 'Visite à Anthy' && pv.prochaine_action_le === '2027-02-10T13:30:00.000Z'
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${ach1}' AND type = 'etape' AND texte LIKE '%→ Visites%'`)[0].n === 1,
    'déplacé vers « Visites » avec action datée (14 h 30 à Paris), changement noté');
  r = await page(`/pipeline?parcours=acheteur`, { id: ach2, etape: 'perdu', motif: 'Pas de projet' });
  constat(sql(`SELECT etape, motif_perte FROM contact WHERE id = '${ach2}'`)[0].motif_perte === 'Pas de projet', 'déplacé vers « Perdu » avec son motif');
  r = await page(`/pipeline?parcours=vendeur`, { id: reco.id, etape: 'en_sommeil', reveil_le: '2020-01-01' });
  constat(r.status === 200 && sql(`SELECT etape FROM contact WHERE id = '${reco.id}'`)[0].etape === 'premier_rdv', 'en sommeil avec une date passée : refusé');

  // 5 nonies. Relève Leedflow (story 13.10), sur l'imitation locale de son API.
  sql('DELETE FROM leedflow_releve'); // repartir de zéro : la base locale garde le curseur d'un essai à l'autre
  const maintenant = Date.now(), MIN = 60_000, JOUR = 86_400_000;
  const KLF = `01KFDW${NUM}${'0'.repeat(14)}`;
  const TELK = `+33688${NUM}`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, etape, prochaine_action, prochaine_action_le, canal)
       VALUES ('${KLF}', '2026-09-01T08:00:00Z', '2026-09-01T08:00:00Z', 'Luc', 'Leedflow${ESSAI}', '${TELK}', 'a_qualifier', 'Rappeler pour qualifier', '${auj}', 'autre')`);
  const INCONNU = `+33677${NUM}`, PERSO = `+33655${NUM}`, ANCIEN = `+33666${NUM}`, CAPTURE = `+33633${NUM}`;
  const PRO = `+33622${NUM}`, MANQUE = `+33611${NUM}`, DEMARCHE = `+33699${NUM}`; // story 13.19
  LF.appels.push(
    { id: `a1-${NUM}`, created: maintenant - 60 * MIN, customer: `06 88 ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4)}`, direction: 'inbound', duration: 240, missed: false,
      transcription: '## Résumé\n- Veut vendre sa maison à **Sciez**\n- <b>Rappeler</b> jeudi', transcription_srt: 'TRANSCRIPTION COMPLÈTE', recording_url: 'https://exemple.invalid/a1.mp3', id_contact: `lfc1-${NUM}` },
    { id: `a2-${NUM}`, created: maintenant - 120 * MIN, customer: TELK, direction: 'outbound', duration: 0, missed: true, transcription: null, id_contact: `lfc1-${NUM}` },
    { id: `a3-${NUM}`, created: maintenant - 30 * MIN, customer: INCONNU, direction: 'inbound', duration: 90, missed: false, transcription: 'Demande d’estimation pour un appartement à Thonon\n- Budget **450 k€**', id_contact: `lfc3-${NUM}` },
    { id: `a4-${NUM}`, created: maintenant - 60 * JOUR, customer: ANCIEN, direction: 'inbound', duration: 60, missed: false, transcription: 'Vieil appel' },
    { id: `a7-${NUM}`, created: maintenant - 10 * MIN, customer: CAPTURE, direction: 'inbound', duration: 420, missed: false,
      transcription: '## Synthèse\n- Maison à Annemasse, étage loué\n- **Coupures** d\'eau signalées\n## Prochaines étapes\n- Rappeler après le passage du plombier' },
    { id: `a5-${NUM}`, created: maintenant - 20 * MIN, customer: PERSO, direction: 'inbound', duration: 300, missed: false, transcription: 'Appel personnel' },
    { id: `a8-${NUM}`, created: maintenant - 25 * MIN, customer: PRO, direction: 'inbound', duration: 200, missed: false, transcription: 'Étude notariale : signature à caler' },
    { id: `a9-${NUM}`, created: maintenant - 26 * MIN, customer: MANQUE, direction: 'inbound', duration: 0, missed: true, transcription: null },
    { id: `a10-${NUM}`, created: maintenant - 27 * MIN, customer: DEMARCHE, direction: 'inbound', duration: 45, missed: false, transcription: 'Offre de panneaux solaires' },
    // De quoi remplir une deuxième page : l'appel le plus ancien, d'un numéro connu, s'y trouve (reprise de l'historique).
    ...Array.from({ length: 110 }, (_, i) => ({ id: `f${i}-${NUM}`, created: maintenant - 40 * JOUR - i * MIN, customer: `+33644${String(i).padStart(6, '0')}`, direction: 'inbound', duration: 10, missed: false, transcription: null })),
    { id: `a6-${NUM}`, created: maintenant - 100 * JOUR, customer: TELK, direction: 'inbound', duration: 120, missed: false, transcription: 'Ancien échange : pense à vendre dans un an' },
  );
  LF.vocaux.push({ id: `v1-${NUM}`, created: maintenant - 30 * MIN, customer: TELK, duration: 30, transcription: 'Message : rappeler pour la visite' });
  LF.sms.push({ id: `s1-${NUM}`, created: maintenant - 20 * MIN, customer: TELK, role: 'user', message: 'Bonjour, dispo demain ?' });
  LF.taches.push(
    { id: `t1-${NUM}`, created: maintenant - 58 * MIN, status: 'todo', task: 'Envoyer l’estimation', timestamp: Date.UTC(2027, 0, 20, 11), id_contact: `lfc1-${NUM}` },
    { id: `t2-${NUM}`, created: maintenant - 50 * MIN, status: 'todo', task: 'Préparer la visite', timestamp: null, id_contact: `lfc9-${NUM}` },
    { id: `t3-${NUM}`, created: maintenant - 40 * MIN, status: 'done', task: 'Déjà fait', timestamp: null, id_contact: `lfc1-${NUM}` },
    { id: `t4-${NUM}`, created: maintenant - 29 * MIN, status: 'todo', task: 'Envoyer une estimation à Thonon', timestamp: null, id_contact: `lfc3-${NUM}` },
  );
  LF.contacts[`lfc3-${NUM}`] = { id: `lfc3-${NUM}`, firstname: 'Ines', lastname: `Martin${NUM}`, email: `ines+${NUM}@example.com`, phone: INCONNU };
  LF.contacts[`lfc9-${NUM}`] = { id: `lfc9-${NUM}`, phone: `0033688${NUM}` }; // contact Leedflow vu seulement par sa fiche
  // Story 13.25 : la synthèse IA de Leedflow est dans `details` ; enveloppe `data.data`, comme la liste lue par JB.
  const SYNTH1 = `## Qui est ce contact\nVendeur d'une maison à Sciez ${NUM}.\n## Notre relation\n- Prospect chaud`;
  LF.contacts[`lfc1-${NUM}`] = { data: { id: `lfc1-${NUM}`, firstname: 'Luc', lastname: `Leedflow${NUM}`, phone: TELK, details: SYNTH1, updated: maintenant - 60 * MIN } };
  const releve = async () => {
    const t0 = new Date().toISOString();
    await appeler(`${E}/cdn-cgi/handler/scheduled`);
    for (let i = 0; i < 80; i++) {
      const r = sql(`SELECT count(*) AS n, sum(erreur IS NOT NULL) AS e FROM leedflow_releve WHERE passe_le >= '${t0}'`)[0];
      if (r.n >= 4 || r.e > 0) break;
      await pause(250);
    }
    await pause(800);
  };
  await releve();
  const evLF = () => sql(`SELECT source_id, texte FROM contact_evenement WHERE contact_id = '${KLF}' AND source = 'leedflow' ORDER BY a`);
  let ev = evLF();
  constat(ev.length === 5 && ['appel:a1', 'appel:a2', 'appel:a6', 'vocal:v1', 'sms:s1'].every((k) => ev.some((e) => e.source_id === `${k}-${NUM}`)),
    `leedflow : appels, message vocal et SMS du numéro connu rangés dans son historique (${ev.length}/5), numéro écrit « 06 … » reconnu`);
  constat(ev.some((e) => e.source_id === `appel:a6-${NUM}` && e.texte.includes('Ancien échange')), 'leedflow : l\'historique ancien d\'un numéro connu est repris (deuxième page lue)');
  constat(LF.requetes.length > 0 && LF.requetes.every((q) => q.auth === `Bearer ${LF.cle}`) && LF.requetes.some((q) => q.chemin === '/calls' && q.params.page === '2'),
    'leedflow : chaque requête porte la clé, la deuxième page des appels est demandée');
  const a1 = ev.find((e) => e.source_id === `appel:a1-${NUM}`);
  constat(!!a1 && a1.texte.startsWith('Appel reçu · 4 min') && a1.texte.includes('**Sciez**') && !ev.some((e) => e.texte.includes('TRANSCRIPTION COMPLÈTE') || e.texte.includes('a1.mp3')),
    'leedflow : le résumé, le sens et la durée gardés ; ni transcription complète ni enregistrement');
  const inconnus = sql(`SELECT telephone FROM leedflow_inconnu WHERE telephone IN ('${INCONNU}', '${PERSO}', '${ANCIEN}')`).map((r) => r.telephone);
  constat(inconnus.includes(INCONNU) && inconnus.includes(PERSO) && !inconnus.includes(ANCIEN) && sql(`SELECT count(*) AS n FROM contact WHERE telephone = '${INCONNU}'`)[0].n === 0,
    'leedflow : numéro inconnu récent proposé, jamais créé d\'office ; un inconnu de plus de 30 jours ignoré');
  const taches = sql(`SELECT id, statut, echeance FROM leedflow_tache WHERE contact_id = '${KLF}'`);
  constat(taches.length === 2 && taches.some((t) => t.id === `t1-${NUM}` && t.echeance === '2027-01-20') && taches.some((t) => t.id === `t2-${NUM}`) && taches.every((t) => t.statut === 'proposee'),
    'leedflow : tâches à faire proposées (dont une rangée par la fiche du contact Leedflow), tâche faite écartée');
  r = await appeler(`${E}/aujourdhui`, { headers: avecJeton() });
  html = await r.text();
  const zoneLF = html.split('data-leedflow')[1]?.split('</section>')[0] ?? '';
  constat(zoneLF.includes(`data-tache="t1-${NUM}"`) && zoneLF.includes('href="/a-trier"') && /\d+ numéro\(s\) à trier/.test(zoneLF) && !zoneLF.includes('data-inconnu') && !zoneLF.includes(INCONNU)
    && /data-etat-leedflow[^>]*>Leedflow : appels relevés/.test(html),
    'aujourd\'hui : tâche proposée, les numéros inconnus réduits à une ligne vers « À trier », état de la relève');
  constat(sql(`SELECT count(*) AS n FROM leedflow_inconnu WHERE telephone = '${INCONNU}' AND json_extract(donnees, '$.nom_leedflow') = 'Martin${NUM}'`)[0].n === 2
    && sql(`SELECT count(*) AS n FROM leedflow_inconnu WHERE source_id = 'tache:t4-${NUM}'`)[0].n === 1,
    'leedflow : numéro inconnu nommé depuis la fiche Leedflow, sa tâche gardée avec lui');
  r = await appeler(`${E}/a-trier`, { headers: avecJeton() });
  html = await r.text();
  const carte = html.split(`data-numero="${INCONNU}"`)[1]?.split('</article>')[0] ?? '';
  constat(r.status === 200 && carte.includes(`Ines Martin${NUM}`) && carte.includes('1 tâche(s)') && carte.includes('prenom=Ines') && !carte.includes('<strong>450')
    && html.includes(`data-numero="${INCONNU}" data-categorie="a_trier"`),
    'à trier : la carte du numéro montre le nom Leedflow, la catégorie « à trier » et une seule ligne, pas le résumé complet');
  constat(!html.includes(`data-numero="${MANQUE}"`) && html.includes('data-manques') && html.includes(`data-numero="${PRO}"`),
    'à trier : un appel manqué sans message est masqué par défaut, avec le lien pour l\'afficher');
  r = await appeler(`${E}/a-trier?manques=1`, { headers: avecJeton() });
  html = await r.text();
  constat(html.includes(`data-numero="${MANQUE}"`) && html.split(`data-numero="${MANQUE}"`)[1].split('</article>')[0].includes('Appel(s) manqué(s)'),
    'à trier : « afficher » montre les appels manqués sans message, signalés comme tels');
  r = await appeler(`${E}/inconnu?tel=${encodeURIComponent(INCONNU)}`, { headers: avecJeton() });
  html = await r.text();
  constat(r.status === 200 && html.includes(`Ines Martin${NUM}`) && html.includes('<strong>450 k€</strong>') && html.includes('Envoyer une estimation à Thonon') && html.includes('data-creer'),
    'page du numéro inconnu : nom, résumé complet mis en forme, tâche détectée, créer le contact');
  r = await appeler(`${E}/contacts/fiche?id=${KLF}`, { headers: avecJeton() });
  html = await r.text();
  constat(html.includes('<strong>Sciez</strong>') && html.includes('&lt;b&gt;Rappeler') && html.includes(`data-tache="t1-${NUM}"`) && html.includes('Appel passé, sans réponse'),
    'fiche : résumés Leedflow mis en forme (texte échappé), tâches proposées');
  // Synthèse du contact (story 13.25).
  const synth = () => sql(`SELECT synthese, synthese_leedflow, synthese_leedflow_le, synthese_lue_le FROM contact WHERE id = '${KLF}'`)[0];
  constat(synth().synthese_leedflow === SYNTH1 && synth().synthese_leedflow_le === new Date(maintenant - 60 * MIN).toISOString(),
    'synthèse : lue sur la fiche Leedflow (enveloppe data.data), avec la date de Leedflow');
  constat(html.includes('data-synthese-par="leedflow"') && (html.split('data-synthese')[1] ?? '').includes(`maison à Sciez ${NUM}`) && html.indexOf('data-synthese') < html.indexOf('Prochaine action</h2>'),
    'fiche : la synthèse Leedflow en tête, mise en forme, signée « Mise à jour par Leedflow »');
  r = await page(`/contacts/fiche?id=${KLF}`, { quoi: 'synthese', synthese: `${SYNTH1}\n## À retenir\n- Préfère les SMS ${NUM}` });
  constat(r.headers.get('location') === `/contacts/fiche?id=${KLF}&m=synthese` && synth().synthese.includes(`Préfère les SMS ${NUM}`) && synth().synthese_leedflow === SYNTH1,
    'synthèse modifiée par Anne : sa version gardée à côté de celle de Leedflow');
  LF.contacts[`lfc1-${NUM}`].data.details = `${SYNTH1}\n## Situation actuelle\nEstimation demandée ${NUM}`;
  LF.contacts[`lfc1-${NUM}`].data.updated = Date.now() + 60_000;
  sql(`UPDATE contact SET synthese_lue_le = '2000-01-01T00:00:00Z' WHERE id = '${KLF}'`); // le tour quotidien est dû
  await releve();
  html = await (await appeler(`${E}/contacts/fiche?id=${KLF}`, { headers: avecJeton() })).text();
  constat(synth().synthese_leedflow.includes(`Estimation demandée ${NUM}`) && synth().synthese.includes(`Préfère les SMS ${NUM}`) && html.includes('data-plus-recente') && html.includes('data-synthese-par="anne"'),
    'nouvelle version de Leedflow : la version d\'Anne n\'est pas écrasée, « Leedflow a une version plus récente » proposé');
  r = await page(`/contacts/fiche?id=${KLF}`, { quoi: 'synthese-reprendre' });
  html = await (await appeler(`${E}/contacts/fiche?id=${KLF}`, { headers: avecJeton() })).text();
  constat(synth().synthese === null && html.includes('data-synthese-par="leedflow"') && html.includes(`Estimation demandée ${NUM}`) && !html.includes('data-plus-recente'),
    '« La reprendre » : la synthèse de Leedflow reprend la main');
  const luAvant = synth().synthese_lue_le;
  await releve();
  // Le dernier échange de ce contact date de moins d'une heure : Leedflow réécrit sa synthèse après un appel, elle est relue.
  constat(synth().synthese_lue_le > luAvant, 'synthèse : relue à chaque passage dans l\'heure qui suit un échange');
  r = await appeler(`${E}/contacts/qualifier?id=${KLF}`, { headers: avecJeton() });
  constat((await r.text()).split('data-dernier-appel')[1]?.includes('Message : rappeler pour la visite'), 'qualifier : le dernier résumé Leedflow affiché en tête');
  // Le résumé d'un appel arrive après coup : complété au passage suivant, sans doublon.
  LF.appels.find((a) => a.id === `a2-${NUM}`).transcription = 'Pas de réponse, rappeler demain matin';
  LF.requetes.length = 0;
  await releve();
  ev = evLF();
  constat(ev.length === 5 && ev.find((e) => e.source_id === `appel:a2-${NUM}`)?.texte.includes('rappeler demain matin')
    && LF.requetes.filter((q) => q.chemin === '/calls').every((q) => Number(q.params.created_after) > maintenant - 26 * 3_600_000),
    'leedflow : résumé arrivé après coup complété, aucun doublon, la relève reprend au curseur (24 h de recouvrement)');
  // Tâches : acceptée (devient la prochaine action), ignorée.
  r = await page('/api/leedflow/tache', { id: `t1-${NUM}`, choix: 'accepter' });
  const kl = sql(`SELECT prochaine_action, prochaine_action_le, etape FROM contact WHERE id = '${KLF}'`)[0];
  constat(r.headers.get('location') === '/aujourdhui?m=tache-acceptee' && kl.prochaine_action === 'Envoyer l’estimation' && kl.prochaine_action_le === '2027-01-20' && kl.etape === 'a_qualifier'
    && sql(`SELECT statut FROM leedflow_tache WHERE id = 't1-${NUM}'`)[0].statut === 'acceptee'
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${KLF}' AND type = 'note' AND texte LIKE '%acceptée%' AND par = 'anne@example.com'`)[0].n === 1,
    'tâche acceptée : prochaine action et date fixées, étape inchangée, noté avec le compte');
  r = await page('/api/leedflow/tache', { id: `t2-${NUM}`, choix: 'ignorer', retour: 'fiche' });
  constat(r.headers.get('location') === `/contacts/fiche?id=${KLF}&m=tache-ignoree` && sql(`SELECT statut FROM leedflow_tache WHERE id = 't2-${NUM}'`)[0].statut === 'ignoree',
    'tâche ignorée depuis la fiche');
  // Story 13.19 : classer les numéros. Privé et Démarchage : plus proposés, échanges effacés, même au passage suivant ;
  // Pro : échanges gardés, peut devenir un prescripteur ; reclassement et remise à trier.
  r = await page('/api/leedflow/classer', { telephone: PERSO, categorie: 'prive', retour: '/a-trier' });
  const r2 = await page('/api/leedflow/classer', { telephone: PRO, categorie: 'pro', retour: `/inconnu?tel=${encodeURIComponent(PRO)}` });
  const r3 = await page('/api/leedflow/classer', { telephone: DEMARCHE, categorie: 'demarchage', retour: 'https://exemple.invalid/' });
  await releve();
  const classe = (t) => sql(`SELECT categorie FROM leedflow_ecarte WHERE telephone = '${t}'`)[0]?.categorie ?? null;
  const gardes = (t) => sql(`SELECT count(*) AS n FROM leedflow_inconnu WHERE telephone = '${t}'`)[0].n;
  constat(r.headers.get('location') === '/a-trier?m=prive' && classe(PERSO) === 'prive' && gardes(PERSO) === 0
    && r3.headers.get('location') === '/a-trier?m=demarchage' && classe(DEMARCHE) === 'demarchage' && gardes(DEMARCHE) === 0,
    'numéro classé Privé ou Démarchage : plus proposé, échanges effacés même après une nouvelle relève, retour jamais vers une autre adresse');
  constat(r2.headers.get('location') === `/inconnu?tel=${encodeURIComponent(PRO)}&m=pro` && classe(PRO) === 'pro' && gardes(PRO) === 1,
    'numéro classé Pro : ses échanges restent gardés après une nouvelle relève, sans doublon');
  r = await page('/api/leedflow/classer', { telephone: PRO, categorie: 'inconnue' });
  constat(r.status === 400 && classe(PRO) === 'pro', 'catégorie inconnue : refusée');
  r = await appeler(`${E}/a-trier`, { headers: avecJeton() });
  html = await r.text();
  constat(![PERSO, PRO, DEMARCHE].some((t) => html.includes(`data-numero="${t}"`)) && /data-filtre="pro"[^>]*>Pros <span[^>]*>\d+/.test(html),
    'à trier : les numéros classés n\'y sont plus, chaque filtre affiche son compte');
  r = await appeler(`${E}/a-trier?f=pro`, { headers: avecJeton() });
  html = await r.text();
  const cartePro = html.split(`data-numero="${PRO}"`)[1]?.split('</article>')[0] ?? '';
  constat(cartePro.includes('Étude notariale') && cartePro.includes('data-prescripteur') && cartePro.includes(`telephone=${encodeURIComponent(PRO)}`) && cartePro.includes('Remettre à trier') && !html.includes(`data-numero="${PERSO}"`),
    'filtre Pros : le numéro, son dernier échange, « en faire un prescripteur » et « remettre à trier »');
  r = await appeler(`${E}/a-trier?f=demarchage`, { headers: avecJeton() });
  html = await r.text();
  constat(html.split(`data-numero="${DEMARCHE}"`)[1]?.split('</article>')[0].includes('Échanges effacés'), 'filtre Démarchage : le numéro classé, ses échanges effacés');
  r = await appeler(`${E}/prescripteurs?nom=Etude${ESSAI}&telephone=${encodeURIComponent(PRO)}`, { headers: avecJeton() });
  html = await r.text();
  constat(html.includes(`value="Etude${ESSAI}"`) && html.includes(`value="${PRO}"`), 'en faire un prescripteur : nom et téléphone préremplis');
  r = await appeler(`${E}/inconnu?tel=${encodeURIComponent(PRO)}`, { headers: avecJeton() });
  html = await r.text();
  constat(/data-categorie="pro"[^>]*>Catégorie : <strong[^>]*>Pro</.test(html) && html.includes('data-classer') && html.includes('value="a_trier"') && html.includes('Étude notariale'),
    'page du numéro : sa catégorie et les gestes pour le reclasser');
  r = await page('/api/leedflow/classer', { telephone: DEMARCHE, categorie: 'a_trier', retour: '/a-trier?f=demarchage' });
  constat(r.headers.get('location') === '/a-trier?f=demarchage&m=a_trier' && classe(DEMARCHE) === null, 'numéro remis à trier : sa catégorie retirée');
  // Créer le contact depuis un numéro inconnu : numéro prérempli, appel rattaché aussitôt.
  r = await appeler(`${E}/ajouter?telephone=${encodeURIComponent(INCONNU)}&prenom=Ines&nom=Martin${NUM}`, { headers: avecJeton() });
  html = await r.text();
  constat(html.includes(`value="${INCONNU}"`) && html.includes(`value="Martin${NUM}"`), 'créer le contact : numéro et nom préremplis');
  r = await page('/ajouter', { quoi: 'contact', telephone: INCONNU, prenom: 'Ines', nom: `Inconnue${ESSAI}`, canal: 'autre', origine_detail: 'Appel reçu', parcours: 'vendeur' });
  const ines = sql(`SELECT id FROM contact WHERE telephone = '${INCONNU}'`)[0]?.id;
  constat(!!ines && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${ines}' AND source_id = 'appel:a3-${NUM}'`)[0].n === 1
    && sql(`SELECT count(*) AS n FROM leedflow_inconnu WHERE telephone = '${INCONNU}'`)[0].n === 0
    && sql(`SELECT count(*) AS n FROM leedflow_tache WHERE id = 't4-${NUM}' AND contact_id = '${ines}' AND statut = 'proposee'`)[0].n === 1,
    'contact créé depuis un numéro inconnu : son appel passe dans l\'historique, sa tâche devient une proposition');
  // 5 septies. Actions marketing (story 13.17).
  r = await page('/actions', { nom: '', canal: 'rencontre', debut: auj });
  constat(r.status === 200 && (await r.text()).includes('data-erreur'), 'action sans nom : refusée, la saisie reste affichée');
  r = await page('/actions', { nom: `Essai Flyers ${ESSAI}`, canal: 'rencontre', debut: auj, budget: 'beaucoup' });
  constat(r.status === 200 && (await r.text()).includes('Le budget ne semble pas valable'), 'action au budget illisible : refusée');
  r = await page('/actions', { nom: `Essai Flyers ${ESSAI}`, canal: 'rencontre', debut: auj, fin: auj, budget: '120', cout: '' });
  const flyers = sql(`SELECT * FROM action_marketing WHERE nom = 'Essai Flyers ${ESSAI}'`)[0];
  constat(r.headers.get('location') === '/actions?m=ajoutee' && flyers?.budget_centimes === 12000 && flyers.cout_centimes === null && flyers.auteur === 'anne' && flyers.par === 'anne@example.com',
    'action notée : canal, dates, budget en centimes, auteur Anne');
  r = await page('/ajouter', { quoi: 'contact', prenom: 'Rita', nom: `Rencontre${ESSAI}`, email: `rita+${ESSAI}@example.com`, canal: 'rencontre' });
  const rita = sql(`SELECT id, action_id FROM contact WHERE email = 'rita+${ESSAI}@example.com'`)[0];
  constat(rita?.action_id === flyers.id, 'contact arrivé pendant la seule action de son canal : rattaché d\'office par la base');
  r = await page('/actions', { nom: `Essai Salon ${ESSAI}`, canal: 'rencontre', debut: auj, fin: auj, cout: '300,50' });
  const salon = sql(`SELECT * FROM action_marketing WHERE nom = 'Essai Salon ${ESSAI}'`)[0];
  constat(salon?.cout_centimes === 30050, 'coût réel saisi « 300,50 » : 30 050 centimes');
  r = await page('/ajouter', { quoi: 'contact', prenom: 'Sam', nom: `Salon${ESSAI}`, email: `sam+${ESSAI}@example.com`, canal: 'rencontre' });
  const sam = sql(`SELECT id, action_id FROM contact WHERE email = 'sam+${ESSAI}@example.com'`)[0];
  constat(sam?.action_id === null, 'deux actions du canal en cours : pas de rattachement d\'office, Anne choisira');
  r = await appeler(`${E}/contacts/qualifier?id=${sam.id}`, { headers: avecJeton() });
  html = await r.text();
  constat(html.includes('data-action-qualifier') && html.includes(`Essai Salon ${ESSAI}`), 'qualifier : l\'action marketing se choisit dans la liste');
  r = await qualif(sam.id, { issue: 'rappel', rappel_choix: '1j', action: salon.id });
  constat(sql(`SELECT action_id FROM contact WHERE id = '${sam.id}'`)[0].action_id === salon.id
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${sam.id}' AND texte = 'Action marketing : Essai Salon ${ESSAI}'`)[0].n === 1,
    'qualification : action choisie, rattachée et notée dans l\'historique');
  r = await appeler(`${E}/api/actions/rattacher`, { method: 'POST', redirect: 'manual', headers: avecJeton(JETON, { 'Content-Type': 'application/x-www-form-urlencoded', Origin: E }), body: new URLSearchParams({ contact: rita.id, action: '' }).toString() });
  constat(r.headers.get('location') === `/contacts/fiche?id=${rita.id}&m=action` && sql(`SELECT action_id FROM contact WHERE id = '${rita.id}'`)[0].action_id === null, 'fiche : « Aucune » retire l\'action');
  r = await appeler(`${E}/api/actions/rattacher`, { method: 'POST', redirect: 'manual', headers: avecJeton(JETON, { 'Content-Type': 'application/x-www-form-urlencoded', Origin: E }), body: new URLSearchParams({ contact: rita.id, action: flyers.id }).toString() });
  constat(sql(`SELECT action_id FROM contact WHERE id = '${rita.id}'`)[0].action_id === flyers.id, 'fiche : action remise');
  r = await appeler(`${E}/contacts/fiche?id=${rita.id}`, { headers: avecJeton() });
  html = await r.text();
  constat(/data-action-contact[\s\S]*<option value="[^"]+" selected[^>]*>Essai Flyers/.test(html), 'fiche : l\'action du contact est préchoisie');
  r = await page('/ajouter', { quoi: 'passage', ville: `Essai-${ESSAI}`, fait_le: auj, cout: '45' });
  constat(sql(`SELECT cout_centimes FROM passage_boitage WHERE secteur = 'Essai-${ESSAI}'`)[0]?.cout_centimes === 4500, 'passage de boîtage avec son coût');
  r = await appeler(`${E}/bilan?p=semaine`, { headers: avecJeton() });
  html = (await r.text()).replace(/\u00a0/g, ' '); // les montants gardent une espace insécable avant « € »
  const ligneRencontre = html.split('data-cout="rencontre"')[1]?.split('</tr>')[0] ?? '';
  constat(ligneRencontre.includes('420,50 €') && html.includes('data-cout="boitage"') && html.includes('Dépensé'),
    'bilan : coût par canal (rencontre 120 € prévus + 300,50 € = 420,50 €), boîtage compté, tuile « Dépensé »');
  r = await appeler(`${E}/actions`, { headers: avecJeton() });
  html = (await r.text()).replace(/\u00a0/g, ' ');
  const carteFlyers = html.split(`data-action="${flyers.id}"`)[1]?.split('</li>')[0] ?? '';
  constat(carteFlyers.includes('1 contact(s)') && carteFlyers.includes('120 € par contact') && carteFlyers.includes('prévus'), 'page Actions : contacts rattachés et coût par contact (budget prévu)');
  r = await page(`/actions?id=${salon.id}`, { nom: `Essai Salon ${ESSAI}`, canal: 'rencontre', debut: auj, fin: auj, cout: '280' });
  constat(r.headers.get('location') === '/actions?m=modifiee' && sql(`SELECT cout_centimes FROM action_marketing WHERE id = '${salon.id}'`)[0].cout_centimes === 28000, 'action modifiée (coût réel)');

  // Accès de Claude : un jeton de service (sans e-mail) n'ouvre que /api/claude/…, et seulement le sien.
  const JETON_CLAUDE = jetonAcces({ email: undefined, common_name: 'essai-claude.access' });
  const claude = (chemin, options = {}, jeton = JETON_CLAUDE) => appeler(`${E}${chemin}`, { ...options, redirect: 'manual', headers: { 'cf-access-jwt-assertion': jeton, 'Content-Type': 'application/json' } });
  r = await claude('/api/claude/actions');
  const listeClaude = await r.json();
  const vueFlyers = listeClaude.actions?.find((a) => a.id === flyers.id);
  constat(r.status === 200 && vueFlyers?.contacts === 1 && !JSON.stringify(listeClaude).includes('@example.com') && !JSON.stringify(listeClaude).includes('+33'),
    'Claude : liste des actions avec leurs totaux, sans aucune coordonnée');
  r = await claude('/api/claude/actions', { method: 'POST', body: JSON.stringify({ nom: `Essai Pub Facebook ${ESSAI}`, canal: 'reseaux', debut: auj, budget_centimes: 15000, note: 'Campagne décidée dans le projet' }) });
  const creee = await r.json();
  const pub = sql(`SELECT * FROM action_marketing WHERE id = '${creee.id}'`)[0];
  constat(r.status === 201 && pub?.auteur === 'claude' && pub.budget_centimes === 15000 && pub.par === 'claude', 'Claude : action créée, marquée « créée par Claude »');
  r = await claude('/api/claude/actions', { method: 'POST', body: JSON.stringify({ id: creee.id, nom: `Essai Pub Facebook ${ESSAI}`, canal: 'reseaux', debut: auj, budget_centimes: 15000, cout_centimes: 13240 }) });
  constat(r.status === 200 && sql(`SELECT cout_centimes, auteur FROM action_marketing WHERE id = '${creee.id}'`)[0].cout_centimes === 13240, 'Claude : coût réel corrigé');
  r = await claude('/api/claude/actions', { method: 'POST', body: JSON.stringify({ nom: 'Essai sans canal', debut: auj }) });
  constat(r.status === 400 && sql(`SELECT count(*) AS n FROM action_marketing WHERE nom = 'Essai sans canal'`)[0].n === 0, 'Claude : action incomplète refusée');
  r = await claude('/api/claude/actions', { method: 'POST', body: JSON.stringify({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV', nom: 'Essai fantôme', canal: 'reseaux', debut: auj }) });
  constat(r.status === 404, 'Claude : modifier une action qui n\'existe pas, refusé');
  r = await claude('/api/claude/bilan?p=semaine');
  const bilanClaude = await r.json();
  constat(r.status === 200 && bilanClaude.canaux?.find((l) => l.canal === 'rencontre')?.cout_centimes >= 40000 && !JSON.stringify(bilanClaude).includes('@'),
    'Claude : bilan par canal avec les coûts, sans aucune coordonnée');
  constat(bilanClaude.diagnostic?.campagnes?.some((c) => c.libelle === `facebook · paid · carrousel-${ESSAI.toLowerCase()}` && c.arrivees === 5 && c.coordonnees === 2 && c.commences === 3),
    'Claude : entonnoir du diagnostic par campagne dans le bilan');
  constat(bilanClaude.diagnostic?.campagnes?.some((c) => c.cle === cleAb && c.ab?.entrees === 4 && c.ab?.objectif === 2 && c.ab?.reservations === 1),
    'Claude : test A/B (entrées et objectif) dans le bilan');
  constat(bilanClaude.diagnostic?.question1?.toutes?.some((g) => g.titre === 'Navigateur' && g.lignes.some((l) => l.libelle === 'Application Instagram ou Facebook' && l.question1 >= 2)),
    'Claude : ventilation de la question 1 dans le bilan');
  r = await appeler(`${E}/actions`, { headers: avecJeton() });
  constat((await r.text()).includes('créée par Claude'), 'page Actions : l\'action de Claude porte « créée par Claude »');
  const refusClaude = [
    ['jeton de Claude sur la page Aujourd\'hui', await claude('/')],
    ['jeton de Claude sur une fiche', await claude(`/contacts/fiche?id=${rita.id}`)],
    ['jeton de Claude sur l\'export RGPD', await claude('/api/gestion/export?email=x')],
    ['Anne (connectée) sur l\'adresse de Claude', await claude('/api/claude/actions', {}, JETON)],
    ['autre jeton de service', await claude('/api/claude/actions', {}, jetonAcces({ email: undefined, common_name: 'pirate.access' }))],
    ['jeton de service d\'une autre application', await claude('/api/claude/actions', {}, jetonAcces({ email: undefined, common_name: 'essai-claude.access', aud: ['autre-aud'] }))],
    ['en-tête interne forgé', await appeler(`${E}/api/claude/actions`, { headers: { 'x-gestion-compte': 'claude' } })],
  ];
  for (const [quoi, rep] of refusClaude) constat(rep.status === 403, `refusé (403) : ${quoi}`);

  // ——— Story 18.9 : l'import par Claude (/api/claude/import), avec des fichiers FICTIFS de même forme que les vrais ———
  {
    const IMP = (corps, jeton = JETON_CLAUDE, autres = {}) => appeler(`${E}/api/claude/import`, { method: 'POST', redirect: 'manual',
      headers: { ...(jeton ? { 'cf-access-jwt-assertion': jeton } : {}), 'Content-Type': 'application/json', ...autres }, body: typeof corps === 'string' ? corps : JSON.stringify(corps) });
    const tel = (k) => `06 3${k} ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4)}`;
    const t164 = (k) => `+3363${k}${NUM}`;
    const hmacOpp = (v) => createHmac('sha256', 'essai').update(`opposition:${v}`).digest('hex');
    const compte = () => sql(`SELECT (SELECT count(*) FROM contact) AS c, (SELECT count(*) FROM contact_source) AS s, (SELECT count(*) FROM contact_coordonnee) AS k,
      (SELECT count(*) FROM import_lot) AS l, (SELECT count(*) FROM contact_evenement) AS e`)[0];
    // Contacts déjà là : un vérifié, un écarté, un non vérifié complétable, un homonyme ; une personne en opposition.
    const [V, X, S, P] = [sid(), sid(), sid(), sid()];
    const ilYa = '2026-06-01T08:00:00.000Z';
    sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, email, categorie_id, verifie_le, ecarte_le) VALUES
      ('${V}', '${ilYa}', '${ilYa}', 'Vera', 'Verif${ESSAI}', '${t164(1)}', NULL, 'anciens_clients', '${ilYa}', NULL),
      ('${X}', '${ilYa}', '${ilYa}', 'Xavier', 'Ecarte${ESSAI}', '${t164(2)}', NULL, 'proches', NULL, '${ilYa}'),
      ('${S}', '${ilYa}', '${ilYa}', 'Sam', 'Sur${ESSAI}', NULL, 'sur+${ESSAI.toLowerCase()}@example.com', 'lointains', NULL, NULL),
      ('${P}', '${ilYa}', '${ilYa}', 'Paula', 'Homonyme${ESSAI}', '${t164(3)}', NULL, 'proches', NULL, NULL);
      INSERT INTO contact_source (contact_id, source, a) VALUES ('${P}', 'telephone', '${ilYa}');
      INSERT INTO opposition (empreinte, le) VALUES ('${hmacOpp(t164(4))}', '${ilYa}') ON CONFLICT DO NOTHING`);
    const MJ = `jerome+${ESSAI.toLowerCase()}@example.com`, MJP = `jerome.pro+${ESSAI.toLowerCase()}@example.com`;
    // Export Samsung (vCard 2.1) : QUOTED-PRINTABLE en UTF-8 avec saut doux, ligne repliée, plusieurs TEL et EMAIL, et des
    // propriétés jamais importées (adresse, anniversaire, note, photo, site).
    const vcf = [
      'BEGIN:VCARD', 'VERSION:2.1',
      `N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Nouv=C3=A9au=`, `${ESSAI};J=C3=A9r=C3=B4me;;;`,
      'FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:J=C3=A9r=C3=B4me Nouv=C3=A9au', `TEL;CELL:${tel(0)}`, 'TEL;HOME:+41 79 123 45 67', `TEL;WORK;PREF:${tel(5)}`,
      `EMAIL;HOME:${MJ}`, `EMAIL;WORK:${MJP.toUpperCase().slice(0, 12)}`, ` ${MJP.toUpperCase().slice(12)}`,
      'ADR;HOME:;;12 rue des Fleurs;Thonon;;74200;France', 'BDAY:1980-05-04', 'NOTE;ENCODING=QUOTED-PRINTABLE:Code porte 1234 =', 'suite secr=C3=A8te',
      'PHOTO;ENCODING=BASE64;JPEG:/9j/4AAQ', ' SkZJRgABAQ==', '', 'item1.URL:https://example.com/perso', 'ORG:Entreprise Fictive', 'END:VCARD',
      'BEGIN:VCARD', 'VERSION:2.1', 'N:Nom;Autre;;;', `TEL;CELL:${tel(1)}`, `TEL;CELL:${tel(6)}`, 'END:VCARD',
      'BEGIN:VCARD', 'VERSION:2.1', 'N:Revient;Xavier;;;', `TEL;CELL:${tel(2)}`, 'END:VCARD',
      'BEGIN:VCARD', 'VERSION:3.0', `N:Sur${ESSAI};Sam;;;`, `TEL;TYPE=CELL:${tel(7)}`, `EMAIL;TYPE=INTERNET:SUR+${ESSAI}@example.com`, 'ORG:Boulangerie;Vente', 'END:VCARD',
      'BEGIN:VCARD', 'VERSION:4.0', `N:Homonyme${ESSAI};Paula;;;`, `TEL;VALUE=uri;TYPE=cell:tel:${t164(8)}`, 'END:VCARD',
      'BEGIN:VCARD', 'VERSION:2.1', 'N:Oppose;Olga;;;', `TEL;CELL:${tel(4)}`, 'END:VCARD',
      'BEGIN:VCARD', 'VERSION:2.1', 'NOTE:fiche sans nom ni numéro', 'END:VCARD',
      'BEGIN:VCARD', 'VERSION:2.1', 'FN:Jerome bis', `TEL;CELL:${tel(9)}`, `EMAIL:${MJ}`, 'END:VCARD',
    ].join('\r\n');
    const fVcf = { format: 'vcard', nom: 'C:\\Users\\anne\\Téléphone\\contacts.vcf', genre: 'telephone', contenu: vcf };
    const avant = compte();
    r = await IMP({ action: 'apercu', fichier: fVcf });
    const ap = (await r.json()).apercu;
    const texteAp = JSON.stringify(ap);
    constat(r.status === 200 && ap?.lignes === 8 && ap.nouveaux === 1 && ap.complements === 2 && ap.complements_verifies === 1 && ap.doublons_probables === 1
      && ap.rejetes === 3 && ap.raisons.ecarte === 1 && ap.raisons.opposition === 1 && ap.raisons.vide === 1 && ap.fusionnees_dans_le_fichier === 1 && ap.categories.proches === 1 && /^[0-9a-f]{64}$/.test(ap.empreinte),
      `18.9 : aperçu vCard (8 fiches) : 1 nouveau, 2 compléments dont 1 vérifié, 1 doublon probable, 3 rejetés (écarté, opposition, vide), 1 fusionnée dans le fichier, empreinte (${JSON.stringify({ n: ap?.nouveaux, c: ap?.complements, d: ap?.doublons_probables, r: ap?.raisons })})`);
    constat(['ADR', 'BDAY', 'NOTE', 'PHOTO', 'URL'].every((p) => ap?.champs_ignores.includes(`propriété vCard ${p}`)), `18.9 : aperçu : adresse, anniversaire, note, photo et site signalés comme ignorés (${ap?.champs_ignores.join(' | ')})`);
    const dP = ap?.doublons?.[0];
    constat(dP?.ligne === '0:5' && dP.existants.length === 1 && dP.existants[0].id === P && dP.existants[0].nom === `Paula Homonyme${ESSAI}` && JSON.stringify(dP.existants[0].sources) === '["telephone"]',
      '18.9 : doublon probable (même nom, aucune coordonnée commune) : repère de la ligne, et du contact existant seulement son nom et ses sources');
    constat(!texteAp.includes(t164(3)) && !texteAp.includes(`Verif${ESSAI}`) && !texteAp.includes(`Ecarte${ESSAI}`) && !texteAp.includes('Vera') && !texteAp.includes('Fleurs') && !texteAp.includes('1234'),
      '18.9 : l\'aperçu ne renvoie aucune donnée d\'un autre contact de la base (ni numéro de l\'homonyme, ni nom du vérifié ou de l\'écarté), ni champ interdit');
    constat(JSON.stringify(compte()) === JSON.stringify(avant), '18.9 : l\'aperçu n\'écrit rien (contacts, sources, coordonnées, lots, historique inchangés)');
    r = await IMP({ action: 'importer', fichier: fVcf });
    const r2 = await IMP({ action: 'importer', fichier: fVcf, empreinte: ap.empreinte.replace(/^./, (c) => (c === 'a' ? 'b' : 'a')) });
    const r3 = await IMP({ action: 'importer', fichier: { ...fVcf, contenu: vcf.replace('Entreprise Fictive', 'Autre') }, empreinte: ap.empreinte });
    constat(r.status === 409 && r2.status === 409 && r3.status === 409 && (await r.json()).error?.code === 'empreinte' && JSON.stringify(compte()) === JSON.stringify(avant),
      `18.9 : import refusé sans l'empreinte, avec une autre, ou pour un fichier changé depuis l'aperçu (${r.status}, ${r2.status}, ${r3.status}), rien d'écrit`);
    const actSAvant = sql(`SELECT last_activity_at FROM contact WHERE id = '${S}'`)[0].last_activity_at;
    let t0 = performance.now();
    r = await IMP({ action: 'importer', fichier: fVcf, empreinte: ap.empreinte });
    const imp = (await r.json()).import;
    const msVcf = Math.round(performance.now() - t0);
    constat(r.status === 201 && imp?.nouveaux === 1 && imp.complements === 2 && imp.doublons_laisses === 1 && imp.rejetes === 3 && /^[0-9A-Z]{26}$/.test(imp.lot),
      `18.9 : import réel avec l'empreinte : 1 créé, 2 complétés, le doublon sans décision laissé de côté (${msVcf} ms)`);
    const lotV = sql(`SELECT * FROM import_lot WHERE id = '${imp?.lot}'`)[0];
    constat(lotV?.fichier === 'contacts.vcf' && lotV.empreinte === ap.empreinte && lotV.source === 'telephone' && lotV.nouveaux === 1 && lotV.completes === 2 && lotV.doublons === 1 && lotV.rejetes === 3 && lotV.par === 'claude',
      '18.9 : import_lot : nom du fichier seulement (sans chemin), empreinte, source, compteurs, par Claude');
    const jer = sql(`SELECT * FROM contact WHERE email = '${MJ}'`)[0];
    const coordJ = jer ? sql(`SELECT type, valeur FROM contact_coordonnee WHERE contact_id = '${jer.id}' ORDER BY valeur`).map((x) => x.valeur) : [];
    constat(jer?.prenom === 'Jérôme' && jer.nom === `Nouvéau${ESSAI}` && jer.telephone === t164(0) && jer.entreprise === 'Entreprise Fictive' && jer.categorie_id === 'proches'
      && jer.verifie_le === null && jer.canal === null && jer.etape === null && jer.action_id === null && jer.commune === null && jer.projet === 'a_qualifier',
      '18.9 : nouveau contact : nom décodé (QUOTED-PRINTABLE UTF-8, saut doux), téléphone E.164, catégorie proposée « proches », à vérifier, canal NULL, hors suivi, sans adresse');
    constat(JSON.stringify(coordJ) === JSON.stringify(['+41791234567', t164(5), t164(9), MJP].sort()),
      `18.9 : plusieurs TEL et EMAIL (ligne repliée, fiche en double fusionnée) : premier sur le contact, les autres en coordonnées, en E.164 et en minuscules (${coordJ.join(', ')})`);
    const evJ = jer ? sql(`SELECT type, source, source_id, texte, donnees FROM contact_evenement WHERE contact_id = '${jer.id}'`) : [];
    const srcJ = jer ? sql(`SELECT source, import_lot_id FROM contact_source WHERE contact_id = '${jer.id}'`) : [];
    constat(evJ.length === 1 && evJ[0].type === 'import' && evJ[0].source === 'claude' && evJ[0].source_id === `${imp.lot}.${jer.id}` && JSON.parse(evJ[0].donnees).creation === true
      && JSON.stringify(JSON.parse(evJ[0].donnees).avant) === '{}' && srcJ.length === 1 && srcJ[0].source === 'telephone' && srcJ[0].import_lot_id === imp.lot,
      '18.9 : source « telephone » liée au lot, événement d\'import avec son avant-image (vide pour une création)');
    const interdits = sql(`SELECT count(*) AS n FROM contact_evenement WHERE texte LIKE '%Fleurs%' OR texte LIKE '%1234%' OR donnees LIKE '%Fleurs%' OR donnees LIKE '%1980-05-04%' OR donnees LIKE '%example.com/perso%'`)[0].n
      + sql(`SELECT count(*) AS n FROM contact_coordonnee WHERE valeur LIKE '%example.com/perso%'`)[0].n;
    constat(interdits === 0, '18.9 : champs interdits ignorés : ni adresse, ni anniversaire, ni note du téléphone, ni site, nulle part en base');
    const v = sql(`SELECT prenom, nom, telephone, categorie_id, verifie_le, (SELECT group_concat(valeur) FROM contact_coordonnee WHERE contact_id = '${V}') AS k,
      (SELECT group_concat(source) FROM contact_source WHERE contact_id = '${V}') AS s, (SELECT donnees FROM contact_evenement WHERE contact_id = '${V}' AND source = 'claude') AS d FROM contact WHERE id = '${V}'`)[0];
    constat(v.prenom === 'Vera' && v.nom === `Verif${ESSAI}` && v.telephone === t164(1) && v.categorie_id === 'anciens_clients' && v.verifie_le === ilYa && v.k === t164(6) && v.s === 'telephone'
      && JSON.stringify(JSON.parse(v.d).apres) === '{}', '18.9 : contact vérifié non modifié (nom, catégorie, vérifié gardés) : seulement une source et le numéro manquant ajoutés');
    const x = sql(`SELECT ecarte_le, (SELECT count(*) FROM contact_source WHERE contact_id = '${X}') AS s, (SELECT count(*) FROM contact_evenement WHERE contact_id = '${X}') AS e FROM contact WHERE id = '${X}'`)[0];
    constat(x.ecarte_le === ilYa && x.s === 0 && x.e === 0, '18.9 : contact écarté non ressuscité : toujours écarté, ni source ni événement');
    const s = sql(`SELECT telephone, entreprise, categorie_id, verifie_le, last_activity_at FROM contact WHERE id = '${S}'`)[0];
    constat(s.telephone === t164(7) && s.entreprise === 'Boulangerie' && s.categorie_id === 'proches' && s.verifie_le === null && s.last_activity_at === actSAvant,
      '18.9 : doublon sûr (même e-mail, à la casse près) complété : téléphone manquant, entreprise, catégorie proposée plus haute (proches > relations lointaines), date d\'activité inchangée');
    constat(sql(`SELECT count(*) AS n FROM contact WHERE telephone = '${t164(4)}'`)[0].n === 0 && sql(`SELECT count(*) AS n FROM contact_coordonnee WHERE valeur = '${t164(4)}'`)[0].n === 0,
      '18.9 : personne de la liste d\'opposition rejetée, jamais recréée');
    constat(sql(`SELECT count(*) AS n FROM contact WHERE telephone = '${t164(8)}'`)[0].n === 0, '18.9 : doublon probable sans décision : pas créé');
    r = await IMP({ action: 'importer', fichier: fVcf, empreinte: ap.empreinte });
    constat(r.status === 409 && (await r.json()).error?.code === 'deja_importe', `18.9 : le même fichier ne s'importe pas deux fois tant que son lot n'est pas annulé (${r.status})`);

    // Décisions de JB sur un doublon probable : fusionner avec le contact proposé ; une fusion vers un autre contact est refusée.
    const fDoublon = { format: 'csv', nom: 'homonyme.csv', genre: 'telephone', contenu: `Prénom;Nom;Téléphone\nPaula;Homonyme${ESSAI};${tel(8)}\n` };
    r = await IMP({ action: 'apercu', fichier: fDoublon, doublons: { '0:2': `fusionner:${V}` } });
    const apF = (await r.json()).apercu;
    r = await IMP({ action: 'apercu', fichier: fDoublon, doublons: { '0:2': `fusionner:${P}` } });
    const apD = (await r.json()).apercu;
    r = await IMP({ action: 'importer', fichier: fDoublon, empreinte: apD.empreinte, doublons: { '0:2': `fusionner:${P}` } });
    const impD = (await r.json()).import;
    constat(apF?.raisons?.fusion_invalide === 1 && apD?.complements === 1 && apD.doublons_probables === 0 && impD?.complements === 1
      && sql(`SELECT count(*) AS n FROM contact_coordonnee WHERE contact_id = '${P}' AND valeur = '${t164(8)}'`)[0].n === 1,
      '18.9 : doublon probable confirmé par JB (« fusionner ») : le numéro rejoint le contact existant ; une fusion vers un contact non proposé est refusée');

    // Export LinkedIn (CSV, virgules) : profil, entreprise ; colonnes interdites ou inutiles ignorées ; un contact déjà importé
    // retrouvé par son e-mail secondaire garde ses deux sources et sa catégorie la plus haute.
    const csvLi = `First Name,Last Name,URL,Email Address,Company,Position,Connected On,Adresse,Date de naissance,Notes\n`
      + `Lina,Csv${ESSAI},https://www.linkedin.com/in/lina-csv-${ESSAI}/,lina+${ESSAI}@example.com,Fictive SA,Directrice,01 Jan 2024,3 rue Imaginaire,1990-01-01,note perso\n`
      + `Jérôme,Nouvéau${ESSAI},,${MJP},,,,,,\n`;
    r = await IMP({ action: 'apercu', fichier: { format: 'csv', nom: 'Connections.csv', genre: 'linkedin', contenu: csvLi } });
    const apL = (await r.json()).apercu;
    r = await IMP({ action: 'importer', fichier: { format: 'csv', nom: 'Connections.csv', genre: 'linkedin', contenu: csvLi }, empreinte: apL?.empreinte });
    const lina = sql(`SELECT id, entreprise, categorie_id, commune FROM contact WHERE email = 'lina+${ESSAI.toLowerCase()}@example.com'`)[0];
    const profilLina = lina ? sql(`SELECT reseau, valeur FROM contact_coordonnee WHERE contact_id = '${lina.id}'`)[0] : null;
    const jer2 = sql(`SELECT categorie_id, (SELECT group_concat(source, ',') FROM (SELECT source FROM contact_source WHERE contact_id = '${jer.id}' ORDER BY source)) AS s FROM contact WHERE id = '${jer.id}'`)[0];
    constat(r.status === 201 && apL.nouveaux === 1 && apL.complements === 1 && ['Position', 'Connected On', 'Adresse', 'Date de naissance', 'Notes'].every((c) => apL.champs_ignores.includes(`colonne « ${c} »`))
      && lina?.entreprise === 'Fictive SA' && lina.categorie_id === 'lointains' && lina.commune === null && profilLina?.reseau === 'linkedin' && profilLina.valeur === `https://linkedin.com/in/lina-csv-${ESSAI}`
      && jer2.categorie_id === 'proches' && jer2.s === 'linkedin,telephone'
      && sql(`SELECT count(*) AS n FROM contact_evenement WHERE donnees LIKE '%Imaginaire%' OR donnees LIKE '%note perso%' OR donnees LIKE '%Directrice%'`)[0].n === 0,
      '18.9 : CSV LinkedIn : relations lointaines, lien de profil gardé, colonnes interdites ignorées ; un contact des deux fichiers garde ses deux sources et « proches »');

    // Classeur d'Anne (onglets lus par le script et envoyés en cellules) : EDB avec projet, commentaire et accord e-mail,
    // Feuil1 qui complète sans créer, PARTENAIRES (règle la plus haute de FR-9), numéros rangés comme des nombres.
    const onglets = [
      { nom: 'EDB', genre: 'edb', detail: 'EDB Thonon, mars 2026', lignes: [
        ['Prénom', 'Nom', 'Téléphone', 'Mail', 'Ville', 'Projet vente OUI', 'Projet achat OUI', 'Commentaire', 'Adresse', 'Date de naissance'],
        ['Eva', `Edb${ESSAI}`, `640${NUM}`, `eva+${ESSAI}@example.com`, 'Sciez', 'OUI', 'oui', 'Rappeler en juin', '5 chemin Inventé', '1975-02-02'],
        ['Félix', `Edb${ESSAI}`, `641${NUM}`, '', 'Anthy', '', 'OUI', '', '', ''],
      ] },
      { nom: 'Feuil1', genre: 'complement', lignes: [['Nom', 'Téléphone', 'Commentaire'], [`Edb${ESSAI}`, `641${NUM}`, 'Complément Feuil1'], ['Inconnu', `649${NUM}`, 'rien']] },
      { nom: 'PARTENAIRES', genre: 'partenaires', lignes: [['Prénom', 'Nom', 'Portable', 'Société', 'E-mail'], ['Paul', `Notaire${ESSAI}`, `642${NUM}`, 'Étude fictive', ''], ['Sam', `Sur${ESSAI}`, '', '', `sur+${ESSAI}@example.com`]] },
    ];
    const fXl = { format: 'tableur', nom: 'SUIVI PROSPECTION.xlsx', onglets };
    r = await IMP({ action: 'apercu', fichier: fXl });
    const apX = (await r.json()).apercu;
    t0 = performance.now();
    r = await IMP({ action: 'importer', fichier: fXl, empreinte: apX?.empreinte });
    const impX = (await r.json()).import;
    const eva = sql(`SELECT id, telephone, commune, projet, categorie_id, email_accord_source, email_accord_le FROM contact WHERE email = 'eva+${ESSAI.toLowerCase()}@example.com'`)[0];
    const felix = sql(`SELECT id, projet, categorie_id, email_accord_le FROM contact WHERE telephone = '+33641${NUM}'`)[0];
    const paul = sql(`SELECT id, categorie_id, entreprise FROM contact WHERE telephone = '+33642${NUM}'`)[0];
    const notes = (id) => sql(`SELECT texte FROM contact_evenement WHERE contact_id = '${id}' AND type = 'note'`).map((n) => n.texte);
    constat(apX?.nouveaux === 3 && apX.complements === 1 && apX.raisons.complement_sans_contact === 1 && apX.accords === 1 && apX.champs_ignores.includes('colonne « Adresse » (EDB)') && impX?.accords === 1,
      `18.9 : classeur : 3 nouveaux, 1 complément, la ligne de Feuil1 sans contact rejetée, 1 accord EDB, colonne Adresse ignorée (${JSON.stringify(apX?.raisons)})`);
    constat(eva?.telephone === `+33640${NUM}` && eva.commune === 'Sciez' && eva.projet === 'vendeur_acheteur' && eva.categorie_id === 'edb' && eva.email_accord_source === 'import' && !!eva.email_accord_le
      && JSON.stringify(notes(eva.id)) === JSON.stringify(['Note du fichier (EDB Thonon, mars 2026) : Rappeler en juin'])
      && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${eva.id}' AND (donnees LIKE '%Inventé%' OR donnees LIKE '%1975%' OR texte LIKE '%Inventé%')`)[0].n === 0,
      '18.9 : onglet EDB : numéro rangé comme un nombre remis en E.164, « rencontrés à l\'EDB », projet vendeur et acheteur, commentaire en note, accord e-mail « import » (FR-10), adresse ignorée');
    constat(felix?.projet === 'acheteur' && felix.categorie_id === 'edb' && felix.email_accord_le === null && JSON.stringify(notes(felix.id)) === JSON.stringify(['Note du fichier (EDB Thonon, mars 2026) : Complément Feuil1'])
      && paul?.categorie_id === 'partenaires' && paul.entreprise === 'Étude fictive' && sql(`SELECT categorie_id FROM contact WHERE id = '${S}'`)[0].categorie_id === 'partenaires'
      && sql(`SELECT count(*) AS n FROM contact WHERE telephone = '+33649${NUM}'`)[0].n === 0,
      '18.9 : Feuil1 complète la note sans créer personne ; PARTENAIRES → partenaires pros, et la règle la plus haute l\'emporte pour un contact non vérifié (proches → partenaires)');

    // Annulation : Eva a été modifiée depuis (une note d'Anne) et reste, listée par son repère de ligne ; les autres
    // contacts créés sont supprimés ; le contact complété retrouve sa catégorie, sa source de ce lot disparaît.
    sql(`INSERT INTO contact_evenement (contact_id, a, type, source, texte, par) VALUES ('${eva.id}', '${new Date().toISOString()}', 'note', 'anne', 'Appelée', 'anne@example.com')`);
    r = await IMP({ action: 'annuler', lot: impX.lot });
    const ann = (await r.json()).annulation;
    constat(r.status === 200 && ann?.supprimes === 2 && ann.rendus === 1 && ann.gardes.length === 1 && ann.gardes[0].ligne === '0:2' && ann.gardes[0].raison === 'modifie_depuis'
      && !JSON.stringify(ann).includes('Eva') && !JSON.stringify(ann).includes('@'),
      `18.9 : annulation d'un lot : 2 contacts créés supprimés, 1 complété rendu, le contact modifié depuis gardé et listé par sa ligne, sans ses données (${JSON.stringify(ann)})`);
    const s2 = sql(`SELECT categorie_id, (SELECT count(*) FROM contact_source WHERE contact_id = '${S}' AND import_lot_id = '${impX.lot}') AS src FROM contact WHERE id = '${S}'`)[0];
    constat(sql(`SELECT count(*) AS n FROM contact WHERE id IN ('${felix.id}', '${paul.id}')`)[0].n === 0 && s2.categorie_id === 'proches' && s2.src === 0
      && sql(`SELECT count(*) AS n FROM contact WHERE id = '${eva.id}'`)[0].n === 1 && !!sql(`SELECT annule_le FROM import_lot WHERE id = '${impX.lot}'`)[0].annule_le,
      '18.9 : après annulation : contacts créés effacés (avec leurs coordonnées, sources, notes), avant-image rejouée, lot marqué annulé');
    r = await IMP({ action: 'annuler', lot: impX.lot });
    const r404 = await IMP({ action: 'annuler', lot: sid() });
    constat(r.status === 409 && r404.status === 404, `18.9 : un lot déjà annulé (${r.status}) ou inconnu (${r404.status}) n'annule rien`);

    // ——— Story 18.17 : la rencontre (lieu, mois) est une donnée filtrable ; repasser un fichier déjà importé ———
    // Six contacts « déjà importés » (le premier import avait perdu Projet HA, DATE, EDB et RELANCE) : R1 non vérifié vendeur avec
    // la note du premier import ; R2 vérifié ; R3 qui a déjà sa rencontre de décembre ; R4 sans ligne de source ; R6 vendeur.
    {
      const raw = (k) => `66${k}${NUM}`, e164 = (k) => `+33${raw(k)}`;
      const [R1, R2, R3, R4, R6] = [sid(), sid(), sid(), sid(), sid()];
      const ilYaR = '2026-11-02T08:00:00.000Z';
      sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, categorie_id, projet, verifie_le) VALUES
        ('${R1}', '${ilYaR}', '${ilYaR}', 'Pat1', 'Rencontre1${ESSAI}', '${e164(1)}', 'edb', 'vendeur', NULL),
        ('${R2}', '${ilYaR}', '${ilYaR}', 'Pat2', 'Rencontre2${ESSAI}', '${e164(2)}', 'edb', 'a_qualifier', '${ilYaR}'),
        ('${R3}', '${ilYaR}', '${ilYaR}', 'Pat3', 'Rencontre3${ESSAI}', '${e164(3)}', 'edb', 'a_qualifier', NULL),
        ('${R4}', '${ilYaR}', '${ilYaR}', 'Pat4', 'Rencontre4${ESSAI}', '${e164(4)}', 'edb', 'vendeur', NULL),
        ('${R6}', '${ilYaR}', '${ilYaR}', 'Pat6', 'Rencontre6${ESSAI}', '${e164(6)}', 'edb', 'vendeur', NULL);
        INSERT INTO contact_source (contact_id, source, lieu, mois, a) VALUES ('${R1}', 'edb', NULL, NULL, '${ilYaR}'), ('${R2}', 'edb', NULL, NULL, '${ilYaR}'),
          ('${R3}', 'edb', 'Publier', '2024-12', '${ilYaR}'), ('${R6}', 'edb', NULL, NULL, '${ilYaR}');
        INSERT INTO contact_evenement (contact_id, a, type, source, texte, par) VALUES
          ('${R1}', '${ilYaR}', 'note', 'claude', 'Note du fichier (EDB) : Rappeler en juin', 'claude')`);
      const entetes = ['EDB', 'DATE', 'NOM', 'PRENOM', 'TEL', 'EMAIL', 'Projet HA', 'Projet Vente', 'Commentaire', 'R1', 'RELANCE 1'];
      const ligneEdb = (lieu, date, k, ha, pv, comm = '', relance = '', email = '') => [lieu, date, `Rencontre${k}${ESSAI}`, `Pat${k}`, raw(k), email, ha, pv, comm, 'ambigu', relance];
      const lignesR = [
        ligneEdb('PUBLIER', '45627', 1, 'OUI', '1', 'Rappeler en juin', 'Appelé le 3 décembre'),
        ligneEdb('MARGENCEL', '45689', 2, 'OUI', 'NON', 'Veut visiter'),
        ligneEdb('PUBLIER', '45627', 3, 'OUI', 'NON'),
        ligneEdb('MARGENCEL', '45689', 3, 'OUI', 'NON'),
        ligneEdb('MARGENCEL', '45689', 4, 'OUI', 'NON'),
        ligneEdb('ANNEMASSE', '45689', 5, 'OUI', 'NON', '', '', `rencontre5+${ESSAI.toLowerCase()}@example.com`),
        ligneEdb('PUBLIER', '45627', 6, 'NON', 'OUI'),
      ];
      const fR = (detail) => ({ format: 'tableur', nom: 'rencontres-essai.xlsx', onglets: [{ nom: 'EDB', genre: 'edb', ...(detail ? { detail } : {}), lignes: [entetes, ...lignesR] }] });
      const avantR = compte();
      r = await IMP({ action: 'apercu', fichier: fR() });
      const apR = (await r.json()).apercu;
      const bR = apR?.bilan ?? {};
      constat(r.status === 200 && apR.lignes === 7 && apR.nouveaux === 1 && apR.complements === 5 && apR.fusionnees_dans_le_fichier === 1
        && bR.rencontres_ajoutees === 3 && bR.rencontres_completees === 3 && bR.notes_ajoutees === 2 && bR.notes_deja_presentes === 1 && bR.projets_poses === 1 && bR.vendeur_vers_vendeur_acheteur === 1
        && !apR.champs_ignores.some((c) => /EDB|DATE|RELANCE|Projet HA/i.test(c.replace('(EDB)', ''))),
        `18.17 : aperçu du fichier avec Projet HA, DATE, EDB et RELANCE 1 : 1 nouveau, 5 compléments, 3 rencontres ajoutées, 3 complétées, 2 notes ajoutées, 1 déjà présente, 1 projet posé, 1 vendeur → vendeur et acheteur (${JSON.stringify(bR)} ; lignes ${apR?.lignes}, nouveaux ${apR?.nouveaux}, compléments ${apR?.complements}, fusionnées ${apR?.fusionnees_dans_le_fichier}, ignorés ${JSON.stringify(apR?.champs_ignores)})`);
      constat(JSON.stringify(compte()) === JSON.stringify(avantR) && !JSON.stringify(apR).includes(raw(1)) && !JSON.stringify(apR).includes('Rencontre1'),
        '18.17 : l\'aperçu n\'écrit rien et ne montre aucune donnée personnelle (seulement des nombres)');
      r = await IMP({ action: 'importer', fichier: fR(), empreinte: apR.empreinte });
      const impR = (await r.json()).import;
      const R5 = sql(`SELECT id, projet, email_accord_source FROM contact WHERE telephone = '${e164(5)}'`)[0];
      const src = (id) => sql(`SELECT source, lieu, mois, import_lot_id FROM contact_source WHERE contact_id = '${id}' ORDER BY id`);
      const notesR = (id) => sql(`SELECT texte FROM contact_evenement WHERE contact_id = '${id}' AND type = 'note' ORDER BY id`).map((n) => n.texte);
      const proj = (id) => sql(`SELECT projet, categorie_id, nom FROM contact WHERE id = '${id}'`)[0];
      const rowsR1 = src(R1), rowsR3 = src(R3);
      constat(r.status === 201 && impR?.nouveaux === 1 && impR.complements === 5 && impR.bilan?.rencontres_ajoutees === 3 && impR.bilan.notes_ajoutees === 2,
        `18.17 : import du fichier de rencontres : 1 créé, 5 complétés (${JSON.stringify(impR?.bilan)})`);
      constat(rowsR1.length === 1 && rowsR1[0].lieu === 'Publier' && rowsR1[0].mois === '2024-12' && rowsR1[0].import_lot_id === null
        && src(R2).length === 1 && src(R2)[0].lieu === 'Margencel' && src(R2)[0].mois === '2025-02'
        && src(R6).length === 1 && src(R6)[0].lieu === 'Publier' && src(R6)[0].mois === '2024-12',
        '18.17 : la rencontre complète la ligne de source sans lieu ni mois (casse de titre : PUBLIER → Publier ; date Excel 45627 → 2024-12), sans ajouter de ligne');
      constat(rowsR3.length === 2 && rowsR3[0].lieu === 'Publier' && rowsR3[0].import_lot_id === null && rowsR3[1].lieu === 'Margencel' && rowsR3[1].mois === '2025-02' && rowsR3[1].import_lot_id === impR.lot
        && src(R4).length === 1 && src(R4)[0].lieu === 'Margencel' && R5?.projet === 'acheteur' && src(R5.id).length === 1 && src(R5.id)[0].lieu === 'Annemasse' && src(R5.id)[0].mois === '2025-02'
        && R5.email_accord_source === 'import',
        '18.17 : rencontre déjà présente non répétée, deuxième rencontre ajoutée, contact sans source qui en reçoit une, nouveau contact avec sa rencontre');
      const nR1 = notesR(R1), nR2 = notesR(R2);
      constat(nR1.length === 2 && nR1[0] === 'Note du fichier (EDB) : Rappeler en juin' && nR1[1] === 'Note du fichier : Relance 1 : Appelé le 3 décembre'
        && nR2.length === 1 && nR2[0] === 'Note du fichier : Veut visiter' && proj(R2).projet === 'a_qualifier' && proj(R2).nom === `Rencontre2${ESSAI}`
        && sql(`SELECT count(*) AS n FROM contact_evenement WHERE texte LIKE '%ambigu%' OR donnees LIKE '%ambigu%'`)[0].n === 0,
        '18.17 : le commentaire déjà en note n\'est pas répété, RELANCE 1 devient une note, un contact vérifié reçoit sa note mais pas de projet, la colonne R1 est ignorée');
      constat(proj(R1).projet === 'vendeur_acheteur' && proj(R3).projet === 'acheteur' && proj(R4).projet === 'vendeur' && proj(R6).projet === 'vendeur'
        && proj(R1).categorie_id === 'edb',
        '18.17 : projet : vendeur → vendeur et acheteur (achat et vente OUI), à qualifier → acheteur, rien d\'autre (vendeur avec achat seul et vendeur avec vente seule inchangés)');

      // Annulation du lot : lieu et mois rendus, notes retirées, projet rendu, contact créé supprimé.
      r = await IMP({ action: 'annuler', lot: impR.lot });
      const annR = (await r.json()).annulation;
      constat(r.status === 200 && annR?.supprimes === 1 && annR.rendus === 5 && annR.gardes.length === 0
        && src(R1)[0].lieu === null && src(R1)[0].mois === null && src(R2)[0].lieu === null && src(R6)[0].lieu === null
        && src(R3).length === 1 && src(R3)[0].lieu === 'Publier' && src(R4).length === 0 && sql(`SELECT count(*) AS n FROM contact WHERE telephone = '${e164(5)}'`)[0].n === 0
        && notesR(R1).length === 1 && notesR(R2).length === 0 && proj(R1).projet === 'vendeur' && proj(R3).projet === 'a_qualifier',
        `18.17 : annulation du lot : lignes de source complétées ou ajoutées défaites, notes retirées (celle d'avant gardée), projets rendus (${JSON.stringify(annR)})`);

      // Repasser le fichier : même fichier après annulation, puis une troisième fois avec un autre détail (empreinte différente).
      r = await IMP({ action: 'importer', fichier: fR(), empreinte: apR.empreinte });
      const impR2 = (await r.json()).import;
      const detailsAvant = () => ({ s: sql(`SELECT count(*) AS n FROM contact_source WHERE contact_id IN ('${R1}', '${R2}', '${R3}', '${R4}', '${R6}')`)[0].n,
        n: sql(`SELECT count(*) AS n FROM contact_evenement WHERE type = 'note' AND contact_id IN ('${R1}', '${R2}', '${R3}', '${R4}', '${R6}')`)[0].n });
      const avantRepasse = detailsAvant();
      r = await IMP({ action: 'apercu', fichier: fR('Reprise') });
      const apRep = (await r.json()).apercu, bRep = apRep?.bilan ?? {};
      constat(r.status === 200 && impR2?.complements === 5 && apRep.nouveaux === 0 && apRep.complements === 6
        && bRep.rencontres_ajoutees === 0 && bRep.rencontres_completees === 0 && bRep.notes_ajoutees === 0 && bRep.notes_deja_presentes === 3 && bRep.projets_poses === 0 && bRep.vendeur_vers_vendeur_acheteur === 0,
        `18.17 : repasser le même fichier (autre détail) : aperçu à zéro (rien à ajouter, 3 commentaires déjà présents) (${JSON.stringify(bRep)})`);
      r = await IMP({ action: 'importer', fichier: fR('Reprise'), empreinte: apRep.empreinte });
      const apresRepasse = detailsAvant();
      constat(r.status === 201 && JSON.stringify(apresRepasse) === JSON.stringify(avantRepasse) && src(R3).length === 2 && src(R1).length === 1
        && proj(R1).projet === 'vendeur_acheteur',
        '18.17 : repasser le fichier une fois de plus n\'ajoute ni ligne de source ni note ni projet');
      sql(`DELETE FROM contact WHERE id IN ('${R1}', '${R2}', '${R3}', '${R4}', '${R6}') OR telephone = '${e164(5)}'`);
    }

    // Accès : le jeton d'Anne ou de JB, l'absence de jeton, un autre jeton de service sont refusés ; JSON seulement, plafond.
    const refusImport = [
      ['Anne connectée', await IMP({ action: 'apercu', fichier: fVcf }, JETON), 403],
      ['sans jeton', await IMP({ action: 'apercu', fichier: fVcf }, null), 403],
      ['autre jeton de service', await IMP({ action: 'apercu', fichier: fVcf }, jetonAcces({ email: undefined, common_name: 'pirate.access' })), 403],
      ['corps qui n\'est pas du JSON', await IMP('format=vcard', JETON_CLAUDE, { 'Content-Type': 'application/x-www-form-urlencoded' }), 415],
      ['corps trop grand', await IMP({ action: 'apercu', fichier: { ...fVcf, contenu: 'x'.repeat(4_100_000) } }), 413],
      ['action inconnue', await IMP({ action: 'lire' }), 400],
      ['genre inconnu', await IMP({ action: 'apercu', fichier: { ...fVcf, genre: 'pige' } }), 400],
      ['champ inconnu', await IMP({ action: 'apercu', fichier: fVcf, contacts: true }), 400],
      ['CSV sans titres reconnus', await IMP({ action: 'apercu', fichier: { format: 'csv', nom: 'x.csv', genre: 'telephone', contenu: 'A;B\nx;y\n' } }), 400],
    ];
    for (const [quoi, rep, attendu] of refusImport) constat(rep.status === attendu, `18.9 : /api/claude/import refuse (${attendu}) : ${quoi} (${rep.status})`);

    // Revue de code 18.9 (2026-11-02) : suites QUOTED-PRINTABLE d'une note, CSV sans titres, accord e-mail lors d'une fusion.
    {
      const t65 = (k) => `+3365${k}${NUM}`, l65 = (k) => `06 5${k} ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4)}`;
      const nTel = (v) => sql(`SELECT (SELECT count(*) FROM contact WHERE telephone = '${v}') + (SELECT count(*) FROM contact_coordonnee WHERE valeur = '${v}') AS n`)[0].n;
      // 1. vCard 2.1 : une note QUOTED-PRINTABLE poursuivie après un « = » final, dont la suite (sans espace en tête) porte
      // « Tel: » et le numéro d'un tiers ; une ligne cassée qui ressemble à une propriété.
      const vcfQp = ['BEGIN:VCARD', 'VERSION:2.1', `N:Qp${NUM};Quentin;;;`, `TEL;CELL:${l65(0)}`,
        'NOTE;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:Rappeler son voisin =', `Tel: ${l65(1)} =`, 'Mme Secr=C3=A8te', 'Rappeler Mme Dupont: demain', 'END:VCARD'].join('\r\n');
      r = await IMP({ action: 'apercu', fichier: { format: 'vcard', nom: 'qp.vcf', genre: 'telephone', contenu: vcfQp } });
      const apQ = (await r.json()).apercu;
      constat(r.status === 200 && apQ?.nouveaux === 1 && apQ.telephones_invalides === 0 && apQ.champs_ignores.includes('propriété vCard NOTE')
        && apQ.champs_ignores.includes('lignes vCard illisibles (non lues) : 1') && !/Dupont|RAPPELER|Secr|TEL:|Tel/.test(JSON.stringify(apQ.champs_ignores)),
        `revue 18.9 : vCard 2.1, la suite QUOTED-PRINTABLE d'une note reste dans la note ; une ligne cassée est comptée « illisible », jamais renvoyée (${apQ?.champs_ignores.join(' | ')})`);
      // Le même fichier par le script de Claude : le contact n'a que son numéro, jamais celui du tiers cité dans la note.
      const dossierQp = fs.mkdtempSync(path.join(os.tmpdir(), 'essai-qp-'));
      const cheminQp = path.join(dossierQp, 'qp.vcf');
      fs.writeFileSync(cheminQp, vcfQp);
      const scriptQp = (args) => spawnSync('node', [path.join(ICI, 'scripts', 'claude-import.mjs'), ...args],
        { encoding: 'utf8', env: { ...sansProxy, ESPACE_URL: E, ESPACE_JETON_ESSAI: JETON_CLAUDE } });
      let so = scriptQp(['apercu', cheminQp, '--genre', 'telephone']);
      const empQ = /Empreinte : ([0-9a-f]{64})/.exec(so.stdout)?.[1];
      const ignoresQ = so.stdout;
      so = scriptQp(['importer', cheminQp, '--genre', 'telephone', '--empreinte', empQ ?? '', '--oui']);
      const lotQ = /lot ([0-9A-Z]{26})/.exec(so.stdout)?.[1];
      const kQ = sql(`SELECT id FROM contact WHERE telephone = '${t65(0)}'`)[0];
      constat(!!empQ && !!lotQ && !!kQ && nTel(t65(1)) === 0 && sql(`SELECT count(*) AS n FROM contact_coordonnee WHERE contact_id = '${kQ.id}'`)[0].n === 0
        && /Téléphones \/ e-mails illisibles\s+0 \/ 0/.test(ignoresQ) && !/Secr|Dupont|voisin/.test(ignoresQ),
        'revue 18.9 : script, vCard 2.1 avec « Tel: » dans la suite QUOTED-PRINTABLE d\'une note : le numéro du tiers n\'est ni envoyé ni importé');
      if (lotQ) scriptQp(['annuler', lotQ, '--oui']);
      fs.rmSync(dossierQp, { recursive: true, force: true });

      // 2. CSV sans ligne de titres (adresses gmail) : la première ligne n'est pas renvoyée dans les colonnes ignorées.
      const csvSans = `Jean,Sanstitre,jean.sanstitre${NUM}@gmail.com,${l65(2)}\nMarie,Sanstitre,marie.sanstitre${NUM}@gmail.com,${l65(3)}\n`;
      r = await IMP({ action: 'apercu', fichier: { format: 'csv', nom: 'sans-titres.csv', genre: 'telephone', contenu: csvSans } });
      const dS = await r.json().catch(() => ({}));
      const brutS = JSON.stringify(dS);
      constat(r.status >= 400 && !dS.apercu && /ligne de titres/.test(brutS) && !/Jean|Sanstitre|Estelle|Villeneuve|@gmail|\d{6}/.test(brutS) && !brutS.includes(NUM),
        `revue 18.9 : CSV sans ligne de titres (une cellule avec « @ ») : refusé « la première ligne doit être une ligne de titres », rien de son contenu renvoyé (${r.status} ${brutS.slice(0, 160)})`);
      // Sans « @ » ni chiffres : « Estelle » et « Villeneuve » ne sont pas reconnus comme téléphone et ville ; les titres inconnus sont comptés, jamais nommés.
      const csvSans2 = `Jean,Sanstitre,Villeneuve,Estelle\nMarie,Autre,Evian,Zoe\n`;
      r = await IMP({ action: 'apercu', fichier: { format: 'csv', nom: 'sans-titres2.csv', genre: 'telephone', contenu: csvSans2 } });
      const dS2 = await r.json().catch(() => ({}));
      const brutS2 = JSON.stringify(dS2);
      constat(!/Jean|Sanstitre|Estelle|Villeneuve/.test(brutS2), `revue 18.9 : CSV sans titres ni « @ » : aucun de ses mots ne ressort (${r.status} ${brutS2.slice(0, 160)})`);
      // Un vrai fichier à titres : colonnes inconnues comptées, titre connu (« Adresse ») nommé.
      const csvTitres = `Prénom,Nom,Téléphone,Adresse,Rubrique secrète\nZoé,Titres${NUM},${l65(4)},1 rue X,a\n`;
      r = await IMP({ action: 'apercu', fichier: { format: 'csv', nom: 'titres.csv', genre: 'telephone', contenu: csvTitres } });
      const igT = JSON.stringify((await r.json().catch(() => ({}))).apercu?.champs_ignores ?? []);
      constat(r.status === 200 && igT.includes('Adresse') && !igT.includes('Rubrique') && /titre non affiché[^"]*: 1/.test(igT), `revue 18.9 : titre connu nommé, titre inconnu seulement compté (${igT})`);

      // 3. Fusion CONTACTS + EDB avec deux adresses différentes : l'accord ne va qu'à l'adresse de l'onglet EDB.
      const KF = sid();
      sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, categorie_id) VALUES ('${KF}', '${ilYa}', '${ilYa}', 'Fanny', 'Fusion${NUM}', '${t65(5)}', 'lointains')`);
      const mC = (q) => `${q}.contacts${NUM}@example.com`, mE = (q) => `${q}.edb${NUM}@example.com`;
      const titres = ['Prénom', 'Nom', 'Téléphone', 'Mail'];
      const fFus = { format: 'tableur', nom: 'fusion.xlsx', onglets: [
        { nom: 'CONTACTS', genre: 'relations', lignes: [titres, ['Rita', `Fusion${NUM}`, `654${NUM}`, mC('rita')], ['Fanny', `Fusion${NUM}`, `655${NUM}`, mC('fanny')]] },
        { nom: 'EDB', genre: 'edb', lignes: [titres, ['Rita', `Fusion${NUM}`, `654${NUM}`, mE('rita')], ['Fanny', `Fusion${NUM}`, `655${NUM}`, mE('fanny')]] },
      ] };
      r = await IMP({ action: 'apercu', fichier: fFus });
      const apF = (await r.json()).apercu;
      r = await IMP({ action: 'importer', fichier: fFus, empreinte: apF?.empreinte });
      const impF = (await r.json()).import;
      const rita = sql(`SELECT id, email, email_accord_le FROM contact WHERE telephone = '${t65(4)}'`)[0];
      const fanny = sql(`SELECT email, email_accord_le FROM contact WHERE id = '${KF}'`)[0];
      constat(apF?.nouveaux === 1 && apF.complements === 1 && apF.accords === 1 && impF?.accords === 1
        && rita?.email === mE('rita') && !!rita.email_accord_le && sql(`SELECT count(*) AS n FROM contact_coordonnee WHERE contact_id = '${rita.id}' AND valeur = '${mC('rita')}'`)[0].n === 1
        && fanny?.email === mC('fanny') && fanny.email_accord_le === null,
        `revue 18.9 : fusion CONTACTS + EDB à deux adresses : l'accord va à l'adresse de l'onglet EDB (nouveau contact), jamais à celle de CONTACTS (complément) ; l'aperçu compte les accords des compléments (${JSON.stringify({ a: apF?.accords, i: impF?.accords })})`);
      if (impF?.lot) await IMP({ action: 'annuler', lot: impF.lot });
      sql(`DELETE FROM contact WHERE id = '${KF}'`);
    }
    // Seule la route d'import touche aux contacts : les autres routes /api/claude/… n'importent ni le carnet ni l'import.
    const dossierClaude = path.join(ICI, 'src', 'pages', 'api', 'claude');
    const autres = fs.readdirSync(dossierClaude).filter((f) => f !== 'import.ts').map((f) => fs.readFileSync(path.join(dossierClaude, f), 'utf8'));
    const routeImport = fs.readFileSync(path.join(dossierClaude, 'import.ts'), 'utf8');
    constat(autres.length >= 2 && autres.every((t) => !/server\/(import|carnet|tableau|vues|fiche)['"]/.test(t)) && !/server\/(tableau|vues|fiche|carnet)['"]/.test(routeImport),
      '18.9 : seule /api/claude/import ouvre les contacts au jeton de Claude, et seulement par server/import (ni tableau, ni vues, ni fiche)');

    // Le script de Claude, sur un vrai .xlsx fictif : n'affiche que des nombres, n'importe qu'avec --oui et l'empreinte.
    const zlib = await import('node:zlib');
    const zip = (fichiers) => {
      const locaux = [], centraux = []; let decalage = 0;
      for (const [nom, texte] of Object.entries(fichiers)) {
        const brut = Buffer.from(texte), comp = zlib.deflateRawSync(brut), n = Buffer.from(nom);
        const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
        local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(brut.length, 22); local.writeUInt16LE(n.length, 26);
        const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(8, 10);
        central.writeUInt32LE(comp.length, 20); central.writeUInt32LE(brut.length, 24); central.writeUInt16LE(n.length, 28); central.writeUInt32LE(decalage, 42);
        locaux.push(local, n, comp); centraux.push(central, n); decalage += 30 + n.length + comp.length;
      }
      const tailleCentrale = centraux.reduce((t, b) => t + b.length, 0);
      const fin = Buffer.alloc(22); fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(Object.keys(fichiers).length, 8); fin.writeUInt16LE(Object.keys(fichiers).length, 10);
      fin.writeUInt32LE(tailleCentrale, 12); fin.writeUInt32LE(decalage, 16);
      return Buffer.concat([...locaux, ...centraux, fin]);
    };
    const dossierXl = fs.mkdtempSync(path.join(os.tmpdir(), 'essai-import-'));
    const cheminXl = path.join(dossierXl, 'clients.xlsx');
    fs.writeFileSync(cheminXl, zip({
      'xl/workbook.xml': '<workbook><sheets><sheet name="PIGE" sheetId="1" r:id="rId1"/><sheet name="Clients &amp; amis" sheetId="2" r:id="rId2"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels': '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Target="worksheets/sheet2.xml"/></Relationships>',
      'xl/sharedStrings.xml': `<sst><si><t>Prénom</t></si><si><t>Nom</t></si><si><t>Téléphone</t></si><si><t>Claire</t></si><si><t>Client${ESSAI}</t></si><si><t>Inconnu PIGE</t></si></sst>`,
      'xl/worksheets/sheet1.xml': `<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>1</v></c><c r="B1" t="s"><v>2</v></c></row><row r="2"><c r="A2" t="s"><v>5</v></c><c r="B2"><v>643${NUM}</v></c></row></sheetData></worksheet>`,
      'xl/worksheets/sheet2.xml': `<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>`
        + `<row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2" t="s"><v>4</v></c><c r="C2"><v>644${NUM}</v></c></row></sheetData></worksheet>`,
    }));
    const script = (args) => spawnSync('node', [path.join(ICI, 'scripts', 'claude-import.mjs'), ...args],
      { encoding: 'utf8', env: { ...sansProxy, ESPACE_URL: E, ESPACE_JETON_ESSAI: JETON_CLAUDE } });
    const onglet = ['--onglet', 'Clients & amis=anciens_clients'];
    let sortie = script(['apercu', cheminXl, ...onglet]);
    const empreinteXl = /Empreinte : ([0-9a-f]{64})/.exec(sortie.stdout)?.[1];
    constat(sortie.status === 0 && /Nouveaux\s+1/.test(sortie.stdout) && /anciens_clients 1/.test(sortie.stdout) && !!empreinteXl
      && !/Claire|Client|PIGE|\+33|0644|644/.test(sortie.stdout.replace(empreinteXl ?? '-', '')),
      '18.9 : script : aperçu d\'un .xlsx lu localement (onglet choisi, PIGE non envoyé), seulement des nombres à l\'écran');
    sortie = script(['importer', cheminXl, ...onglet, '--empreinte', empreinteXl ?? '']);
    const pasEncore = sql(`SELECT count(*) AS n FROM contact WHERE telephone = '+33644${NUM}'`)[0].n;
    const sortie2 = script(['importer', cheminXl, ...onglet, '--empreinte', empreinteXl ?? '', '--oui']);
    const lotXl = /lot ([0-9A-Z]{26})/.exec(sortie2.stdout)?.[1];
    const claire = sql(`SELECT categorie_id, prenom FROM contact WHERE telephone = '+33644${NUM}'`)[0];
    constat(sortie.status === 2 && pasEncore === 0 && sortie2.status === 0 && !!lotXl && claire?.categorie_id === 'anciens_clients' && claire.prenom === 'Claire'
      && sql(`SELECT count(*) AS n FROM contact WHERE telephone = '+33643${NUM}'`)[0].n === 0,
      '18.9 : script : pas d\'import sans --oui ; avec --oui et l\'empreinte, le contact est créé en « anciens clients », l\'onglet PIGE jamais importé');
    sortie = script(['annuler', lotXl ?? '', '--oui']);
    constat(sortie.status === 0 && /Contacts créés supprimés\s+1/.test(sortie.stdout) && sql(`SELECT count(*) AS n FROM contact WHERE telephone = '+33644${NUM}'`)[0].n === 0,
      '18.9 : script : annulation du lot');
    fs.rmSync(dossierXl, { recursive: true, force: true });

    // Vitesse : un fichier de 900 fiches (comme les 882 du téléphone d'Anne), aperçu, import, annulation.
    const lignes900 = Array.from({ length: 900 }, (_, i) => `Prénom${i};Masse${ESSAI};+44 70${NUM}${String(i).padStart(3, '0')};masse${i}+${ESSAI}@example.com;+44 71${NUM}${String(i).padStart(3, '0')}`);
    const f900 = { format: 'csv', nom: 'masse.csv', genre: 'telephone', contenu: `Prénom;Nom;Mobile;E-mail;Téléphone 2\n${lignes900.join('\n')}\n` };
    t0 = performance.now();
    r = await IMP({ action: 'apercu', fichier: f900 });
    const ap900 = (await r.json()).apercu;
    const msAp = Math.round(performance.now() - t0);
    t0 = performance.now();
    r = await IMP({ action: 'importer', fichier: f900, empreinte: ap900?.empreinte });
    const imp900 = (await r.json()).import;
    const msImp = Math.round(performance.now() - t0);
    const n900 = sql(`SELECT count(*) AS n, count(DISTINCT k.contact_id) AS k FROM contact c LEFT JOIN contact_coordonnee k ON k.contact_id = c.id WHERE c.nom = 'Masse${ESSAI}'`)[0];
    t0 = performance.now();
    r = await IMP({ action: 'annuler', lot: imp900?.lot });
    const ann900 = (await r.json()).annulation;
    const msAnn = Math.round(performance.now() - t0);
    constat(ap900?.nouveaux === 900 && imp900?.nouveaux === 900 && n900.n === 900 && n900.k === 900 && ann900?.supprimes === 900
      && sql(`SELECT count(*) AS n FROM contact WHERE nom = 'Masse${ESSAI}'`)[0].n === 0 && msAp < 5000 && msImp < 15000 && msAnn < 10000,
      `18.9 : 900 fiches : aperçu ${msAp} ms, import ${msImp} ms (900 créés, chacun avec son second numéro), annulation ${msAnn} ms`);
    console.log(`  mesures 18.9 : vCard ${msVcf} ms ; 900 fiches : aperçu ${msAp} ms, import ${msImp} ms, annulation ${msAnn} ms`);
    // Les fixtures de cet essai sont retirées (les contacts importés restants et ceux posés pour l'essai).
    sql(`DELETE FROM contact WHERE id IN ('${V}', '${X}', '${S}', '${P}', '${eva.id}', '${jer.id}', '${lina?.id ?? ''}')`);
  }

  // Bouton « Un retour ? » (story 13.20) : la remarque devient un ticket GitHub étiqueté retour-apercu.
  const retour = (corps, jeton = JETON) => appeler(`${E}/api/retour`, { method: 'POST', headers: avecJeton(jeton, { 'Content-Type': 'application/json' }), body: JSON.stringify(corps) });
  r = await retour({ page: '/inconnu?tel=+33612345678', texte: 'Le bouton Pro est mal placé\nDétail sur deux lignes', ecran: '390×844' });
  const reponseRetour = await r.json();
  const ticket = GH.tickets.at(-1);
  constat(r.status === 200 && reponseRetour.ok && reponseRetour.numero === 9001 && ticket?.chemin === '/github/repos/jbcholat-Dev/Anne-Immo---Website/issues'
    && ticket.auth === `Bearer ${GH.cle}` && ticket.labels?.[0] === 'retour-apercu' && ticket.title === '[Retour espace] /inconnu : Le bouton Pro est mal placé'
    && ticket.body.includes('**Auteur :** anne@example.com') && ticket.body.includes('/inconnu') && !JSON.stringify(ticket).includes('+33612'),
    'un retour : ticket GitHub « retour-apercu » créé avec l\'auteur vérifié, la page sans ses paramètres (aucun numéro)');
  r = await retour({ page: '/', texte: '   ' });
  constat(r.status === 400 && GH.tickets.length === 1, 'un retour vide : refusé, aucun ticket');
  r = await appeler(`${E}/api/retour`, { method: 'POST', redirect: 'manual', headers: { 'cf-access-jwt-assertion': JETON_CLAUDE, 'Content-Type': 'application/json' }, body: JSON.stringify({ page: '/', texte: 'x' }) });
  constat(r.status === 403 && GH.tickets.length === 1, 'un retour avec le jeton de Claude : refusé (403)');
  r = await appeler(`${E}/`, { headers: avecJeton() });
  html = await r.text();
  constat(html.includes('data-retour-ouvrir') && html.includes('data-retour-public'), 'le bouton « Un retour ? » est sur les pages de l\'espace, avec le rappel que le ticket est public');

  // Story 18.2 : le carnet (migration 0018). Contacts hors suivi (étape NULL), autres numéros, date d'entrée dans le suivi.
  // Cas laissé par la story 18.1 : un contact du carnet qui appelle ne reçoit pas l'appel, le numéro reste inconnu, et
  // rattacherInconnus ne le supprime pas.
  const CARNET = `01KFCA${NUM}${'0'.repeat(14)}`, AMIE = `01KFSA${NUM}${'0'.repeat(14)}`;
  const TELC = `+33645${NUM}`, TELA = `+33643${NUM}`, TEL2K = `+33642${NUM}`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, categorie_id) VALUES
       ('${CARNET}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Carla', 'Carnet${NUM}', '${TELC}', 'proches'),
       ('${AMIE}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Alice', 'Amie${NUM}', '${TELA}', 'proches')`);
  sql(`INSERT INTO contact_coordonnee (contact_id, type, valeur, ajoute_le) VALUES ('${KLF}', 'telephone', '${TEL2K}', '2026-10-01T08:00:00Z')`);
  const t18 = Date.now();
  LF.appels.push(
    { id: `c1-${NUM}`, created: t18 - 5 * MIN, customer: TELC, direction: 'inbound', duration: 120, missed: false, transcription: 'Appel privé de Carla' },
    { id: `c2-${NUM}`, created: t18 - 4 * MIN, customer: TEL2K, direction: 'inbound', duration: 60, missed: false, transcription: 'Luc appelle de son autre numéro' },
    { id: `c3-${NUM}`, created: t18 - 3 * MIN, customer: TELA, direction: 'inbound', duration: 60, missed: false, transcription: 'Appel privé d\'Alice' },
  );
  await releve();
  const carnet = () => sql(`SELECT etape, suivi_le, prochaine_action_le, canal, projet, temperature FROM contact WHERE id = '${CARNET}'`)[0];
  const evDe = (id) => sql(`SELECT source_id FROM contact_evenement WHERE contact_id = '${id}' AND source = 'leedflow'`).map((e) => e.source_id);
  constat(carnet().etape === null && evDe(CARNET).length === 0 && gardes(TELC) === 1 && evDe(AMIE).length === 0 && gardes(TELA) === 1,
    '18.1/18.2 : un contact du carnet (hors suivi) qui appelle ne reçoit pas l\'appel ; le numéro reste dans les inconnus, même après rattacherInconnus');
  constat(evDe(KLF).includes(`appel:c2-${NUM}`), '18.2 : un appel depuis l\'autre numéro d\'un contact suivi (contact_coordonnee) va sur sa fiche');
  r = await appeler(`${E}/contacts`, { headers: avecJeton() });
  html = await r.text();
  const rp = await appeler(`${E}/pipeline`, { headers: avecJeton() });
  const ra = await appeler(`${E}/aujourdhui`, { headers: avecJeton() });
  const absent = (h) => !h.includes(`fiche?id=${CARNET}`) && !h.includes(`fiche?id=${AMIE}`);
  constat(absent(html) && absent(await rp.text()) && absent(await ra.text()), '18.2 : les contacts du carnet n\'apparaissent ni dans « Contacts suivis », ni dans le pipeline, ni sur « Aujourd\'hui »');
  // L'amie entre seule dans le suivi (ce que fera une demande du site, story 18.3) : `suivi_le` posé ; ses appels
  // d'avant ne sont pas versés dans son historique, ceux d'après oui.
  const suiviLe = new Date().toISOString();
  sql(`UPDATE contact SET etape = 'a_qualifier', prochaine_action = 'Rappeler pour qualifier', prochaine_action_le = '${auj}', suivi_le = '${suiviLe}' WHERE id = '${AMIE}'`);
  await pause(20);
  LF.appels.push({ id: `c4-${NUM}`, created: Date.now(), customer: TELA, direction: 'inbound', duration: 60, missed: false, transcription: 'Alice rappelle pour son projet' });
  await releve();
  constat(evDe(AMIE).includes(`appel:c4-${NUM}`) && !evDe(AMIE).includes(`appel:c3-${NUM}`) && gardes(TELA) === 1,
    '18.2 : entrée seule dans le suivi (suivi_le) : l\'appel d\'après rangé, l\'appel privé d\'avant reste dans les inconnus');
  // « Ajouter » d'Anne sur un numéro du carnet : le contact entre dans le suivi par sa décision, l'historique est repris.
  r = await page('/ajouter', { quoi: 'contact', telephone: TELC, canal: 'rencontre', parcours: 'vendeur' });
  const c18 = carnet();
  constat(r.headers.get('location') === `/contacts/fiche?id=${CARNET}&m=existant` && c18.etape === 'a_qualifier' && c18.suivi_le === null && c18.prochaine_action_le === auj
    && c18.canal === 'rencontre' && c18.projet === 'vendeur' && c18.temperature === 'avec_anne',
    '18.2 : « Ajouter » sur un contact du carnet : entré dans le suivi (à qualifier aujourd\'hui, origine et projet notés, avec Anne), suivi_le laissé vide');
  constat(evDe(CARNET).includes(`appel:c1-${NUM}`) && gardes(TELC) === 0
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${CARNET}' AND type = 'etape' AND json_extract(donnees, '$.vers') = 'a_qualifier'`)[0].n === 1,
    '18.2 : son historique Leedflow est repris et le numéro quitte les inconnus ; l\'entrée dans le suivi est notée');
  r = await appeler(`${E}/contacts`, { headers: avecJeton() });
  constat((await r.text()).includes(`fiche?id=${CARNET}`), '18.2 : une fois suivi, il apparaît dans Contacts');
  // Revue de code 18.2. Une tâche Leedflow trouvée par le lien Leedflow d'un contact entré seul dans le suivi n'est
  // proposée que si elle date d'après `suivi_le`.
  sql(`INSERT OR IGNORE INTO leedflow_lien (leedflow_contact, contact_id) VALUES ('lfa-${NUM}', '${AMIE}')`);
  LF.taches.push(
    { id: `ta1-${NUM}`, created: Date.parse(suiviLe) - 2 * MIN, status: 'todo', task: 'Tâche privée d’avant', timestamp: null, id_contact: `lfa-${NUM}` },
    { id: `ta2-${NUM}`, created: Date.now(), status: 'todo', task: 'Tâche du projet', timestamp: null, id_contact: `lfa-${NUM}` },
  );
  // Un numéro principal d'un contact suivi et secondaire d'un autre : l'échange gardé va au premier seulement.
  const PRIN = `01KFPR${NUM}${'0'.repeat(14)}`, SECD = `01KFSD${NUM}${'0'.repeat(14)}`, TELP = `+33641${NUM}`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, telephone, etape, prochaine_action, prochaine_action_le, canal) VALUES
       ('${PRIN}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Principal${NUM}', '${TELP}', 'a_qualifier', 'Rappeler', '${auj}', 'autre'),
       ('${SECD}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Secondaire${NUM}', NULL, 'a_qualifier', 'Rappeler', '${auj}', 'autre')`);
  sql(`INSERT INTO contact_coordonnee (contact_id, type, valeur, ajoute_le) VALUES ('${SECD}', 'telephone', '${TELP}', '2026-10-01T08:00:00Z')`);
  sql(`INSERT INTO leedflow_inconnu (source_id, telephone, a, texte, donnees) VALUES ('appel:p1-${NUM}', '${TELP}', '${new Date().toISOString()}', 'Appel', '{}')`);
  await releve();
  const tachesAmie = sql(`SELECT id FROM leedflow_tache WHERE contact_id = '${AMIE}'`).map((t) => t.id);
  constat(tachesAmie.includes(`ta2-${NUM}`) && !tachesAmie.includes(`ta1-${NUM}`),
    'revue 18.2 : une tâche trouvée par le lien Leedflow d\'un contact entré seul dans le suivi n\'est proposée que si elle suit suivi_le');
  constat(evDe(PRIN).includes(`appel:p1-${NUM}`) && !evDe(SECD).includes(`appel:p1-${NUM}`),
    'revue 18.2 : un numéro principal d\'un contact et secondaire d\'un autre : l\'échange va au contact dont c\'est le numéro principal');
  html = await (await appeler(`${E}/a-trier`, { headers: avecJeton() })).text();
  constat(gardes(TELA) === 1 && !html.includes(`data-numero="${TELA}"`),
    'revue 18.2 : « À trier » ne montre plus les échanges d\'avant suivi_le d\'un numéro désormais suivi (gardés à part jusqu\'à la purge)');
  // Un contact du carnet déplacé dans le pipeline (geste d'Anne) : libellé « Carnet → », température selon AD-24, suivi_le vide.
  const PIPE = `01KFPN${NUM}${'0'.repeat(14)}`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, projet, categorie_id) VALUES ('${PIPE}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Pipe${NUM}', 'vendeur', 'proches')`);
  r = await page('/pipeline?parcours=vendeur', { id: PIPE, etape: 'premier_rdv', action: 'Premier rendez-vous', le: auj });
  const pipe = sql(`SELECT etape, temperature, suivi_le FROM contact WHERE id = '${PIPE}'`)[0];
  const evPipe = sql(`SELECT texte FROM contact_evenement WHERE contact_id = '${PIPE}' AND type = 'etape'`).map((e) => e.texte);
  constat(r.status === 303 && pipe.etape === 'premier_rdv' && pipe.temperature === 'avec_anne' && pipe.suivi_le === null && evPipe.length === 1 && evPipe[0].startsWith('Carnet → R1'),
    `revue 18.2 : un contact du carnet déplacé dans le pipeline : « Carnet → R1 », avec Anne, suivi_le vide (${evPipe[0]})`);
  // « Ajouter » : le projet suit le parcours retenu (celui du contact), et une deuxième fois rien n'est noté à tort.
  const PARC = `01KFPA${NUM}${'0'.repeat(14)}`, TELPA = `+33640${NUM}`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, telephone, parcours, categorie_id) VALUES ('${PARC}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Parc${NUM}', '${TELPA}', 'acheteur', 'proches')`);
  await page('/ajouter', { quoi: 'contact', telephone: TELPA, canal: 'rencontre', parcours: 'vendeur' });
  await page('/ajouter', { quoi: 'contact', telephone: TELPA, canal: 'rencontre', parcours: 'vendeur' });
  const parc = sql(`SELECT parcours, projet, temperature FROM contact WHERE id = '${PARC}'`)[0];
  constat(parc.parcours === 'acheteur' && parc.projet === 'acheteur' && parc.temperature === 'avec_anne'
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${PARC}' AND type = 'etape'`)[0].n === 1,
    'revue 18.2 : « Ajouter » : le projet suit le parcours retenu (acheteur), une deuxième saisie ne note pas une seconde entrée dans le suivi');

  // Story 18.3 : demandes du site et droits sur le nouveau carnet.
  // Une demande du site faite avec l'autre numéro d'un contact du carnet : retrouvé, il entre dans le suivi avec suivi_le.
  const DSEC = `01KFDS${NUM}${'0'.repeat(14)}`, TELD1 = `+33639${NUM}`, TELD2 = `+33638${NUM}`, MAILD = `dora+${ESSAI}@example.com`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, categorie_id) VALUES ('${DSEC}', '2026-09-01T08:00:00Z', '2026-09-01T08:00:00Z', 'Dora', 'Dorac${NUM}', '${TELD1}', 'proches')`);
  sql(`INSERT INTO contact_coordonnee (contact_id, type, valeur, ajoute_le) VALUES ('${DSEC}', 'telephone', '${TELD2}', '2026-09-01T08:00:00Z')`);
  const sd = sid();
  await poster('contact', { submission_id: sd, prenom: 'Dora', nom: `Dorac${NUM}`, email: MAILD, telephone: `06 38 ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4)}`, projet: 'vente', message: 'Je pense vendre.' });
  const leadD = leadDe(sd);
  for (let i = 0; i < 24 && !contactDe(leadD); i++) await pause(250);
  const dora = sql(`SELECT * FROM contact WHERE id = '${DSEC}'`)[0];
  constat(contactDe(leadD) === DSEC && sql(`SELECT count(*) AS n FROM contact WHERE nom = 'Dorac${NUM}'`)[0].n === 1,
    '18.3 : une demande du site faite avec l\'autre numéro d\'un contact du carnet (contact_coordonnee) lui est rattachée, sans doublon');
  constat(dora.etape === 'a_qualifier' && !!dora.suivi_le && !!dora.prochaine_action_le && dora.prochaine_action === 'Rappeler pour qualifier'
    && dora.parcours === 'vendeur' && dora.projet === 'vendeur' && dora.temperature === 'avec_anne' && dora.categorie_id === 'proches'
    && dora.canal === 'site' && dora.origine_detail === 'contact' && dora.email === MAILD && dora.telephone === TELD1,
    '18.3 : il entre dans le suivi (à qualifier, à rappeler, suivi_le posé), projet tiré de la demande, avec Anne, catégorie gardée, origine site, e-mail complété');
  const nouveauD = sql(`SELECT n.source, n.contact_id, n.vu_le, e.source_id FROM nouveau n LEFT JOIN contact_evenement e ON e.id = n.evenement_id WHERE n.contact_id = '${DSEC}'`);
  constat(nouveauD.length === 1 && nouveauD[0].source === 'site' && nouveauD[0].source_id === leadD && nouveauD[0].vu_le === null
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${DSEC}' AND type = 'etape' AND texte LIKE 'Carnet → À qualifier%'`)[0].n === 1
    && sql(`SELECT count(*) AS n FROM contact_source WHERE contact_id = '${DSEC}' AND source = 'site'`)[0].n === 1,
    '18.3 : une ligne « Nouveaux » de source site, liée à l\'événement de la demande ; entrée dans le suivi notée ; source « site » ajoutée');
  // Revue 18.3 : la même demande traitée deux fois (rattachement perdu puis refait par la tâche planifiée) ne donne qu'une
  // ligne « Nouveaux » et une seule entrée dans le suivi.
  sql(`UPDATE lead SET contact_id = NULL WHERE id = '${leadD}'`);
  await appeler(`${S}/cdn-cgi/handler/scheduled`);
  for (let i = 0; i < 24 && !contactDe(leadD); i++) await pause(250);
  const nParDemande = (l) => sql(`SELECT count(*) AS n FROM nouveau n JOIN contact_evenement e ON e.id = n.evenement_id WHERE e.source = 'site' AND e.source_id = '${l}'`)[0].n;
  constat(contactDe(leadD) === DSEC && nParDemande(leadD) === 1 && sql(`SELECT count(*) AS n FROM nouveau WHERE contact_id = '${DSEC}'`)[0].n === 1
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${DSEC}' AND type = 'etape'`)[0].n === 1,
    'revue 18.3 : la même demande traitée deux fois : une seule ligne « Nouveaux » et un seul événement d\'entrée dans le suivi');
  // Une deuxième demande : une seconde ligne « Nouveaux », pas de seconde entrée dans le suivi.
  const sd2 = sid();
  await poster('guide', { submission_id: sd2, prenom: 'Dora', nom: `Dorac${NUM}`, email: MAILD });
  for (let i = 0; i < 24 && !contactDe(leadDe(sd2)); i++) await pause(250);
  constat(contactDe(leadDe(sd2)) === DSEC && sql(`SELECT count(*) AS n FROM nouveau WHERE contact_id = '${DSEC}'`)[0].n === 2 && nParDemande(leadDe(sd2)) === 1
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${DSEC}' AND type = 'etape'`)[0].n === 1 && sql(`SELECT suivi_le FROM contact WHERE id = '${DSEC}'`)[0].suivi_le === dora.suivi_le,
    '18.3 : une deuxième demande (même e-mail) : seconde ligne « Nouveaux » (une par demande), suivi_le et étape inchangés');
  // Une demande d'une personne inconnue : contact créé en « Demandes reçues » avec sa ligne « Nouveaux » (vérifié sur Paul plus haut pour la catégorie).
  const ninc = sql(`SELECT count(*) AS n FROM nouveau n JOIN lead l ON l.contact_id = n.contact_id WHERE l.id = 'ORPH${ESSAI}'`)[0].n;
  constat(ninc === 1, '18.3 : la demande rattachée par la tâche planifiée a aussi sa ligne « Nouveaux »');

  // Inscription au programme ambassadeurs (epic 17) : le type de demande et ses colonnes n'existent pas encore dans `lead` ;
  // l'essai les imite sur la base locale (colonnes ajoutées puis retirées, contrôle de la source suspendu pour l'insertion).
  sql(`ALTER TABLE lead ADD COLUMN reglement_version TEXT`);
  sql(`ALTER TABLE lead ADD COLUMN reglement_accepte_le TEXT`);
  try {
    const MAILA = `ambre+${ESSAI}@example.com`;
    sql(`PRAGMA ignore_check_constraints = 1; INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at, is_test, prenom, nom, telephone, reglement_version, reglement_accepte_le) VALUES
      ('AMB1${ESSAI}', 'amb1-${ESSAI}', '2026-11-01T09:00:00Z', '2026-11-01T09:00:00Z', 'fr', 'ambassadeur', '${MAILD}', '2026-11-01T09:00:00Z', 1, 'Dora', 'Dorac${NUM}', NULL, 'v2026-11', '2026-11-01T09:00:00Z'),
      ('AMB2${ESSAI}', 'amb2-${ESSAI}', '2026-11-01T09:05:00Z', '2026-11-01T09:05:00Z', 'fr', 'ambassadeur', '${MAILA}', '2026-11-01T09:05:00Z', 1, 'Ambre', 'Nouvelle${NUM}', NULL, NULL, NULL)`);
    // Revue 18.3 : un projet différent du parcours de la demande (acheteur, Dora est entrée comme vendeuse), pour voir qu'il ne bouge pas.
    sql(`UPDATE contact SET projet = 'acheteur' WHERE id = '${DSEC}'`);
    await appeler(`${S}/cdn-cgi/handler/scheduled`);
    for (let i = 0; i < 24 && !(contactDe(`AMB1${ESSAI}`) && contactDe(`AMB2${ESSAI}`)); i++) await pause(250);
    const amb = sql(`SELECT etape, projet, categorie_id, temperature, ambassadeur_inscrit_le, ambassadeur_reglement FROM contact WHERE id = '${DSEC}'`)[0];
    constat(contactDe(`AMB1${ESSAI}`) === DSEC && amb.ambassadeur_inscrit_le === '2026-11-01T09:00:00Z' && amb.ambassadeur_reglement === 'v2026-11'
      && amb.projet === 'acheteur' && amb.categorie_id === 'proches' && amb.etape === 'a_qualifier' && amb.temperature === 'avec_anne'
      && sql(`SELECT count(*) AS n FROM nouveau WHERE contact_id = '${DSEC}'`)[0].n === 3,
      '18.3 : inscription ambassadeur d\'une personne connue : marque posée (date, version du règlement), projet, catégorie et étape inchangés, ligne « Nouveaux »');
    const nouvelle = sql(`SELECT c.etape, c.projet, c.categorie_id, c.ambassadeur_inscrit_le, c.ambassadeur_reglement, c.canal, (SELECT count(*) FROM nouveau n WHERE n.contact_id = c.id) AS nouveaux
      FROM contact c JOIN lead l ON l.contact_id = c.id WHERE l.id = 'AMB2${ESSAI}'`)[0];
    constat(!!nouvelle && nouvelle.etape === null && nouvelle.projet === 'a_qualifier' && nouvelle.categorie_id === 'demandes_recues' && nouvelle.canal === 'site'
      && nouvelle.ambassadeur_inscrit_le === '2026-11-01T09:05:00Z' && nouvelle.ambassadeur_reglement === null && nouvelle.nouveaux === 1,
      '18.3 : inscription ambassadeur d\'une inconnue : contact du carnet (hors suivi) en « Demandes reçues », marque posée (version absente : vide), ligne « Nouveaux »');
  } finally {
    sql(`DELETE FROM lead WHERE id IN ('AMB1${ESSAI}', 'AMB2${ESSAI}')`);
    sql(`UPDATE contact SET projet = 'vendeur' WHERE id = '${DSEC}'`);
    sql(`ALTER TABLE lead DROP COLUMN reglement_version`);
    sql(`ALTER TABLE lead DROP COLUMN reglement_accepte_le`);
  }

  // Revue 18.3 : un contact du carnet au projet « ambassadeur » qui demande une vente devient vendeur en entrant dans le suivi (AD-24).
  const AMBV = `01KFAV${NUM}${'0'.repeat(14)}`, TELAV = `+33637${NUM}`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, categorie_id, projet) VALUES ('${AMBV}', '2026-09-01T08:00:00Z', '2026-09-01T08:00:00Z', 'Aube', 'Ambas${NUM}', '${TELAV}', 'proches', 'ambassadeur')`);
  const sav = sid();
  await poster('contact', { submission_id: sav, prenom: 'Aube', nom: `Ambas${NUM}`, email: `aube+${ESSAI}@example.com`, telephone: `06 37 ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4)}`, projet: 'vente', message: 'Je vends.' });
  for (let i = 0; i < 24 && !contactDe(leadDe(sav)); i++) await pause(250);
  const aube = sql(`SELECT etape, projet, parcours, temperature FROM contact WHERE id = '${AMBV}'`)[0];
  constat(contactDe(leadDe(sav)) === AMBV && aube.etape === 'a_qualifier' && aube.projet === 'vendeur' && aube.parcours === 'vendeur' && aube.temperature === 'avec_anne',
    'revue 18.3 : un contact « ambassadeur » du carnet qui demande une vente entre dans le suivi comme vendeur, avec Anne');

  // Revue 18.3 : une autre personne, sa demande et le classement d'un numéro rangé sur elle doivent survivre à l'effacement ;
  // une demande restée sans contact faite avec l'un des numéros de Dora part avec elle.
  const AUTRE = `01KFAU${NUM}${'0'.repeat(14)}`, TELD3 = `+33636${NUM}`, MAILO = `orpheline+${ESSAI}@example.com`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, categorie_id) VALUES ('${AUTRE}', '2026-09-01T08:00:00Z', '2026-09-01T08:00:00Z', 'Autre', 'Personne${NUM}', '+33635${NUM}', 'proches')`);
  sql(`INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at, is_test, contact_id) VALUES ('LAUT${ESSAI}', 'laut-${ESSAI}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'fr', 'guide', 'autre+${ESSAI}@example.com', '2026-10-01T08:00:00Z', 1, '${AUTRE}'),
    ('LORP${ESSAI}', 'lorp-${ESSAI}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'fr', 'contact', '${MAILO}', '2026-10-01T08:00:00Z', 1, NULL)`);
  sql(`UPDATE lead SET telephone = '${TELD2}' WHERE id = 'LORP${ESSAI}'`);
  sql(`INSERT INTO contact_coordonnee (contact_id, type, valeur, ajoute_le) VALUES ('${DSEC}', 'telephone', '${TELD3}', '2026-09-01T08:00:00Z')`);
  sql(`INSERT INTO leedflow_ecarte (telephone, a, categorie, contact_id) VALUES ('${TELD3}', '2026-10-01T00:00:00Z', 'pro', '${AUTRE}')`);

  // Effacement (AD-31, AD-32) : opposition remplie (empreintes HMAC du téléphone et de l'e-mail), autres coordonnées,
  // sources et « Nouveaux » vidés ; le numéro classé Privé reste classé, détaché ; le classement « prospect » part.
  sql(`INSERT INTO leedflow_ecarte (telephone, a, categorie, contact_id) VALUES ('${TELD1}', '2026-10-01T00:00:00Z', 'prive', '${DSEC}'), ('${TELD2}', '2026-10-01T00:00:00Z', 'prospect', '${DSEC}')`);
  sql(`INSERT INTO leedflow_inconnu (source_id, telephone, a, texte, donnees) VALUES ('appel:d1-${NUM}', '${TELD2}', '${new Date().toISOString()}', 'Appel', '{}')`);
  r = await surFiche(DSEC, { quoi: 'effacer', confirmation: 'supprimer' });
  const hmac = (v) => createHmac('sha256', 'essai').update(`opposition:${v}`).digest('hex');
  const opp = new Set(sql(`SELECT empreinte FROM opposition WHERE empreinte IN ('${[TELD1, TELD2, MAILD].map(hmac).join("', '")}')`).map((o) => o.empreinte));
  constat(r.headers.get('location') === '/contacts?m=efface' && sql(`SELECT count(*) AS n FROM contact WHERE id = '${DSEC}'`)[0].n === 0
    && [TELD1, TELD2, MAILD].every((v) => opp.has(hmac(v)))
    && sql(`SELECT count(*) AS n FROM opposition WHERE empreinte IN ('${TELD1}', '${TELD2}', '${TELD3}', '${MAILD}', '${MAILO}') OR length(empreinte) <> 64 OR empreinte GLOB '*[^0-9a-f]*'`)[0].n === 0,
    '18.3 : effacement : l\'empreinte HMAC des deux téléphones et de l\'e-mail est ajoutée à « opposition » (aucune valeur en clair)');
  constat(sql(`SELECT count(*) AS n FROM contact_coordonnee WHERE contact_id = '${DSEC}' OR valeur IN ('${TELD2}')`)[0].n === 0
    && sql(`SELECT count(*) AS n FROM contact_source WHERE contact_id = '${DSEC}'`)[0].n === 0
    && sql(`SELECT count(*) AS n FROM nouveau WHERE contact_id = '${DSEC}'`)[0].n === 0
    && sql(`SELECT count(*) AS n FROM leedflow_inconnu WHERE telephone = '${TELD2}'`)[0].n === 0,
    '18.3 : effacement : autres coordonnées, sources, lignes « Nouveaux » et échanges Leedflow de l\'autre numéro vidés');
  const ecartes = Object.fromEntries(sql(`SELECT telephone, categorie, contact_id FROM leedflow_ecarte WHERE telephone IN ('${TELD1}', '${TELD2}')`).map((e) => [e.telephone, e]));
  constat(ecartes[TELD1]?.categorie === 'prive' && ecartes[TELD1].contact_id === null && !ecartes[TELD2],
    '18.3 : effacement : le numéro classé Privé reste classé (sans lien vers le contact), le classement « prospect » part');
  constat(sql(`SELECT count(*) AS n FROM lead WHERE id = 'LORP${ESSAI}'`)[0].n === 0 && sql(`SELECT count(*) AS n FROM opposition WHERE empreinte = '${hmac(MAILO)}'`)[0].n === 0,
    'revue 18.3 et 18.4 : effacement : la demande restée sans contact faite avec l\'un de ses numéros part aussi ; trouvée par le seul téléphone, son e-mail (peut-être celui d\'un proche) ne va pas dans « opposition »');
  constat(sql(`SELECT count(*) AS n FROM contact WHERE id = '${AUTRE}'`)[0].n === 1 && sql(`SELECT count(*) AS n FROM lead WHERE id = 'LAUT${ESSAI}'`)[0].n === 1
    && sql(`SELECT contact_id FROM leedflow_ecarte WHERE telephone = '${TELD3}' AND categorie = 'pro'`)[0]?.contact_id === AUTRE,
    'revue 18.3 : effacement : une autre personne, sa demande et le classement « pro » d\'un numéro rangé sur elle sont épargnés');
  sql(`DELETE FROM leedflow_ecarte WHERE telephone = '${TELD3}'`);
  sql(`DELETE FROM lead WHERE id = 'LAUT${ESSAI}'`);
  sql(`DELETE FROM contact WHERE id = '${AUTRE}'`);
  // Recherche par adresse (droits depuis /gestion) : un e-mail secondaire retrouve le contact.
  const EMS = `01KFEM${NUM}${'0'.repeat(14)}`, MAIL2 = `second+${ESSAI}@example.com`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, email, categorie_id) VALUES ('${EMS}', '2026-09-01T08:00:00Z', '2026-09-01T08:00:00Z', 'Emma${NUM}', 'principal+${ESSAI}@example.com', 'proches')`);
  sql(`INSERT INTO contact_coordonnee (contact_id, type, valeur, ajoute_le) VALUES ('${EMS}', 'email', '${MAIL2}', '2026-09-01T08:00:00Z')`);
  r = await appeler(`${E}/api/gestion/export?email=${encodeURIComponent(MAIL2)}`, { headers: avecJeton() });
  const expEms = await r.json();
  constat(expEms.contacts?.length === 1 && expEms.contacts[0].id === EMS && expEms.contacts[0].autres_coordonnees?.[0]?.valeur === MAIL2,
    '18.3 : export par adresse : un e-mail secondaire (contact_coordonnee) retrouve le contact, ses autres coordonnées sont dans l\'export');
  r = await formulaire('effacer', { email: MAIL2, confirmation: MAIL2 });
  constat(sql(`SELECT count(*) AS n FROM contact WHERE id = '${EMS}'`)[0].n === 0 && sql(`SELECT count(*) AS n FROM contact_coordonnee WHERE valeur = '${MAIL2}'`)[0].n === 0
    && sql(`SELECT count(*) AS n FROM opposition WHERE empreinte IN ('${hmac(MAIL2)}', '${hmac(`principal+${ESSAI}@example.com`)}')`)[0].n === 2,
    '18.3 : effacement par adresse : le contact de l\'e-mail secondaire est effacé, ses deux e-mails vont dans « opposition »');
  // Revue 18.4 : effacement par adresse d'une personne sans contact : le téléphone de sa demande va dans « opposition » et
  // emporte la demande d'un proche faite du même numéro (ligne fixe), sans mettre l'e-mail de ce proche en opposition.
  const MAILP = `perso+${ESSAI}@example.com`, MAILC = `conjoint+${ESSAI}@example.com`, TELF = `+33450${NUM}`;
  sql(`INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at, is_test, contact_id, telephone) VALUES
    ('LPER${ESSAI}', 'lper-${ESSAI}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'fr', 'contact', '${MAILP}', '2026-10-01T08:00:00Z', 1, NULL, '${TELF}'),
    ('LCON${ESSAI}', 'lcon-${ESSAI}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'fr', 'contact', '${MAILC}', '2026-10-01T08:00:00Z', 1, NULL, '${TELF}')`);
  r = await formulaire('effacer', { email: MAILP, confirmation: MAILP });
  const oppDe = (v) => sql(`SELECT count(*) AS n FROM opposition WHERE empreinte = '${hmac(v)}'`)[0].n;
  constat(sql(`SELECT count(*) AS n FROM lead WHERE id IN ('LPER${ESSAI}', 'LCON${ESSAI}')`)[0].n === 0 && oppDe(MAILP) === 1 && oppDe(TELF) === 1 && oppDe(MAILC) === 0,
    'revue 18.4 : effacement par adresse : le téléphone d\'une demande restée sans contact va dans « opposition » et emporte la demande du même numéro, sans l\'e-mail du proche');
  // Projet et température (AD-24) : la base refuse une température incohérente.
  const T = (projet, temperature, n) => `INSERT INTO contact (id, created_at, last_activity_at, nom, projet, temperature) VALUES ('T${n}${ESSAI}', '2026-11-01', '2026-11-01', 'Essai', '${projet}', '${temperature}')`;
  constat(refuse(T('a_qualifier', 'chaud', 1)) && refuse(T('ambassadeur', 'froid', 2)) && refuse(T('acheteur', 'en_vente', 3)) && refuse(T('vendeur', 'recherche_active', 4))
    && refuse(T('vendeur', 'brulant', 5)) && refuse(T('inconnu', 'froid', 6)),
    '18.2 : la base refuse une température sur « à qualifier » ou « ambassadeur », « en vente » sur un acheteur, « recherche active » sur un vendeur, une valeur inconnue');
  constat(!refuse(T('vendeur', 'chaud', 7)) && !refuse(T('acheteur', 'recherche_active', 8)), '18.2 : vendeur chaud et acheteur en recherche active acceptés');
  sql(`DELETE FROM contact WHERE id IN ('T7${ESSAI}', 'T8${ESSAI}')`);
  const cats = Object.fromEntries(sql('SELECT id, appel_permis, envoi_groupe_permis FROM categorie ORDER BY id').map((c) => [c.id, `${c.appel_permis}${c.envoi_groupe_permis}`]));
  constat(JSON.stringify(cats) === JSON.stringify({ anciens_clients: '11', demandes_recues: '11', edb: '01', lointains: '00', partenaires: '11', proches: '10' }),
    `18.2 : les six catégories de départ existent avec leurs autorisations d'appel et d'envoi groupé (${JSON.stringify(cats)})`);
  const bea = sql(`SELECT categorie_id, projet FROM contact WHERE nom = 'Boitage${ESSAI}'`)[0];
  constat(bea?.categorie_id === 'demandes_recues' && bea.projet === 'vendeur', '18.2 : un contact ajouté à la main est rangé en « Demandes reçues », projet tiré du parcours');
  constat(sql('SELECT count(*) AS n FROM vue')[0].n >= 5 && refuse(`INSERT INTO vue (id, nom, filtre, created_at, maj_le) VALUES ('V${ESSAI}', 'x', 'pas du json', '2026-11-01', '2026-11-01')`)
    && refuse(`INSERT INTO leedflow_ecarte (telephone, a, categorie) VALUES ('+33600${NUM}', '2026-11-01', 'inconnue')`)
    && !refuse(`INSERT INTO leedflow_ecarte (telephone, a, categorie, contact_id) VALUES ('+33600${NUM}', '2026-11-01', 'prospect', '${CARNET}')`),
    '18.2 : vues de départ présentes (filtre JSON exigé), numéro classé « prospect » avec son contact accepté');
  sql(`DELETE FROM leedflow_ecarte WHERE telephone = '+33600${NUM}'`);

  // Clé refusée (révoquée) : la relève le note et « Aujourd'hui » le dit.
  LF.refuse = true;
  await releve();
  r = await appeler(`${E}/aujourdhui`, { headers: avecJeton() });
  constat(sql(`SELECT count(*) AS n FROM leedflow_releve WHERE erreur = 'HTTP 401'`)[0].n >= 1 && /data-etat-leedflow[^>]*>Leedflow : la dernière relève a échoué \(HTTP 401\)/.test(await r.text()),
    'clé refusée : erreur notée et signalée sur « Aujourd\'hui »');
  LF.refuse = false;
  await releve();
  constat(sql(`SELECT count(*) AS n FROM leedflow_releve WHERE erreur IS NOT NULL`)[0].n === 0, 'clé de nouveau acceptée : l\'erreur disparaît');

  // Story 18.4 : la page Contacts, page d'accueil. Un contact du carnet hors suivi avec un autre numéro, un lien de profil
  // et une entreprise ; un contact écarté.
  const C4 = `01KFC4${NUM}${'0'.repeat(14)}`, ECART = `01KFEC${NUM}${'0'.repeat(14)}`, TEL4 = `+33634${NUM}`, TEL4B = `+33633${NUM}`;
  const telLisible = (t) => `0${t.slice(3)}`.replace(/(\d{2})(?=\d)/g, '$1 ');
  const ENT4 = `Fromagerie${NUM}`, PROFIL4 = `https://www.linkedin.com/in/essai-${NUM}`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, email, commune, entreprise, categorie_id, projet, temperature, verifie_le, dernier_contact_le, dernier_contact_canal) VALUES
       ('${C4}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Zoé', 'Tableau${NUM}', '${TEL4}', 'zoe.tableau+${ESSAI}@example.com', 'Évian', '${ENT4}', 'partenaires', 'vendeur', 'tiede', '2026-10-02T08:00:00Z', '2026-10-28T09:00:00Z', 'whatsapp')`);
  const HEL = `01KFHE${NUM}${'0'.repeat(14)}`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, categorie_id) VALUES ('${HEL}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Hélène', 'Accentuée${NUM}', 'proches')`);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, categorie_id, ecarte_le) VALUES ('${ECART}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Écarté', 'Tableau${NUM}', '+33632${NUM}', 'lointains', '2026-10-05T08:00:00Z')`);
  sql(`INSERT INTO contact_coordonnee (contact_id, type, reseau, valeur, ajoute_le) VALUES ('${C4}', 'telephone', NULL, '${TEL4B}', '2026-10-01T08:00:00Z'), ('${C4}', 'profil', 'linkedin', '${PROFIL4}', '2026-10-01T08:00:00Z')`);
  sql(`INSERT INTO contact_source (contact_id, source, a) VALUES ('${C4}', 'linkedin', '2026-10-01T08:00:00Z')`);
  r = await appeler(`${E}/`, { headers: avecJeton() });
  html = await r.text();
  const donnees = JSON.parse(html.split('id="ct-donnees">')[1]?.split('</script>')[0] ?? '[]');
  const z = donnees.find((l) => l.id === C4);
  constat(r.status === 200 && html.includes('<h1>Contacts</h1>') && z?.suivi === false && donnees.some((l) => l.id === KLF && l.suivi === true)
    && z?.telephones.join() === `${TEL4},${TEL4B}` && z.profils[0]?.url === PROFIL4 && z.sources.includes('linkedin') && z.categorie === 'Partenaires pros' && donnees.find((l) => l.id === ECART)?.ecarte === true,
    '18.4 : la page Contacts est l\'accueil et charge tout le carnet (contacts hors suivi et suivis, autres numéros, profil, sources, catégorie, écartés marqués)');
  const nonEcartes = sql('SELECT count(*) AS n FROM contact WHERE ecarte_le IS NULL')[0].n;
  constat(donnees.length === sql('SELECT count(*) AS n FROM contact')[0].n, `18.4 : une ligne par contact non effacé (${donnees.length})`);
  r = await appeler(`${E}/?m=suite`, { headers: avecJeton(), redirect: 'manual' });
  const rj = await appeler(`${E}/aujourdhui`, { headers: avecJeton() });
  constat(r.status === 302 && r.headers.get('location') === '/aujourdhui?m=suite' && rj.status === 200 && (await rj.text()).includes('Bonjour Anne'),
    '18.4 : l\'ancienne page d\'accueil « Aujourd\'hui » reste joignable à /aujourdhui, ses anciens retours (/?m=…) y sont renvoyés');
  const outils = [...html.matchAll(/<a href="([^"]+)"[^>]*data-outil="([^"]+)"/g)].map((m) => [m[2], m[1].replace(/&amp;/g, '&')]);
  const reponses = await Promise.all(outils.map(([, h]) => appeler(`${E}${h}`, { headers: avecJeton() }).then((x) => x.status)));
  const attendus = ['aujourdhui', 'pipeline', 'suivis', 'qualifier', 'ajouter', 'prescripteurs', 'acheteurs', 'actions', 'campagnes', 'bilan', 'a-trier', 'demandes'];
  constat(attendus.every((k) => outils.some(([o]) => o === k)) && reponses.every((x) => x === 200) && html.includes('>Autres outils</summary>'),
    `18.4 : le menu « Autres outils » mène à toutes les pages actuelles, chacune répond (${outils.length} entrées : ${reponses.join(', ')})`);
  constat((await appeler(`${E}/contacts/fiche?id=${C4}`, { headers: avecJeton() })).status === 200,
    '18.4 : le nom d\'un contact du carnet ouvre sa fiche');
  for (const largeur of [1440, 1280]) {
    const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const o = await ctx.newPage();
    await o.goto(`${E}/`);
    await o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
    if (largeur === 1440) {
      const compte = await o.textContent('[data-compteur]');
      constat(compte === `${nonEcartes} contacts sur ${nonEcartes}`, `18.4 : le compteur « N contacts sur M » (${compte})`);
      constat(await o.isVisible(`tr[data-contact="${C4}"]`) && await o.isVisible(`tr[data-contact="${KLF}"]`) && await o.locator(`tr[data-contact="${ECART}"]`).count() === 0,
        '18.4 : le tableau montre un contact du carnet hors suivi et un contact suivi ; l\'écarté est masqué');
      const ligne4 = await o.locator(`tr[data-contact="${C4}"]`).innerText();
      const lien = o.locator(`tr[data-contact="${C4}"] a[href="${PROFIL4}"]`);
      constat(['Zoé Tableau', ENT4, 'Partenaires pros', 'Vendeur', 'Tiède', 'LinkedIn', 'Évian', telLisible(TEL4), `zoe.tableau+${ESSAI}@example.com`, '28/10/2026 · WhatsApp', 'Sans accord', '✓ vérifié'].every((t) => ligne4.includes(t))
        && await lien.count() === 1 && (await lien.getAttribute('rel'))?.includes('noopener'),
        '18.4 : les colonnes de FR-1 (nom, entreprise, catégorie, projet, température, source, ville, téléphone, e-mail, profil, dernier contact, accord, état)');
      // Recherche par un morceau du milieu de l'autre numéro, tapé avec des espaces ; puis par l'entreprise. Le tableau se
      // recalcule 120 ms après la dernière frappe : l'essai attend 300 ms.
      const chercher = async (v) => { await o.fill('[data-recherche]', v); await o.waitForTimeout(300); await o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' }); return o.locator('[data-lignes] tr[data-contact]').evaluateAll((t) => t.map((x) => x.dataset.contact)); };
      const parNumero = await chercher(`33 ${NUM.slice(0, 2)} ${NUM.slice(2, 4)}`);
      const parDebut = await chercher(`06 33 ${NUM.slice(0, 2)}`);
      const parAccent = await chercher(`helene accentuee${NUM}`);
      const parChiffres = await chercher(NUM);
      const parEntreprise = await chercher(ENT4.toLowerCase());
      constat(parNumero.includes(C4) && parDebut.includes(C4) && !parDebut.includes(KLF) && parEntreprise.join() === C4 && (await o.textContent('[data-compteur]')) === `1 contact sur ${nonEcartes}`,
        '18.4 : recherche par un morceau de numéro (autre numéro compris, début tapé en 06), par l\'entreprise ; le compteur suit');
      constat(parAccent.join() === HEL && parChiffres.includes(C4) && parChiffres.includes(HEL),
        'revue 18.4 : « helene » trouve « Hélène » (accents ignorés) ; des chiffres cherchent aussi dans le texte (entreprise, nom)');
      await chercher('');
      // Tri par ville, puis à l'envers : vides en fin de liste dans les deux sens.
      // Story 18.17 : la colonne de la ville se repère par son en-tête (une colonne « Rencontre » a été ajoutée avant elle).
      const villes = () => o.locator('[data-lignes] tr[data-contact]').evaluateAll((t) => { const i = [...document.querySelectorAll('thead th')].findIndex((h) => h.getAttribute('data-cle') === 'ville') + 1; return t.map((x) => x.querySelector(`:scope > td:nth-child(${i})`)?.textContent ?? ''); });
      const ordonne = (l, sens) => { const v = l.filter((x) => x !== '—'); const c = new Intl.Collator('fr', { sensitivity: 'base', numeric: true }); return v.every((x, i) => i === 0 || sens * c.compare(v[i - 1], x) <= 0) && l.slice(v.length).every((x) => x === '—'); };
      // Story 18.5 : les lignes s'écrivent par paquets ; attendre la dernière (`data-complet`).
      const complet = () => o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
      await o.click('th[data-cle=ville] button'); await complet();
      const v1 = await villes(), s1 = await o.getAttribute('th[data-cle=ville]', 'aria-sort');
      await o.click('th[data-cle=ville] button'); await complet();
      const v2 = await villes(), s2 = await o.getAttribute('th[data-cle=ville]', 'aria-sort');
      constat(s1 === 'ascending' && s2 === 'descending' && ordonne(v1, 1) && ordonne(v2, -1) && v1.length === nonEcartes,
        '18.4 : tri par une colonne, puis à l\'envers (vides en fin de liste)');
      // Colonne masquée, gardée au rechargement.
      await o.click('[data-colonnes] summary');
      await o.uncheck('[data-colonnes] input[value=email]');
      const masquee = await o.locator('th[data-cle=email]').count() === 0;
      await o.reload();
      await o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
      constat(masquee && await o.locator('th[data-cle=email]').count() === 0 && !(await o.isChecked('[data-colonnes] input[value=email]')) && await o.locator('th[data-cle=telephone]').count() === 1,
        '18.4 : une colonne masquée (E-mail) le reste après rechargement');
      await o.screenshot({ path: path.join(OUT, 'espace-contacts-sans-email-1440.png') });
      await o.click('[data-colonnes] summary');
      await o.check('[data-colonnes] input[value=email]');
      // Ticket n° 233 : monter la colonne Ville d'un cran la place avant Téléphone, tout de suite et après rechargement ; le nom reste premier.
      const entetesCles = () => o.locator('th[data-cle]').evaluateAll((t) => t.map((x) => x.getAttribute('data-cle')));
      const avant = await entetesCles();
      await o.click('[data-col=telephone] [data-monter]');
      const apresMonter = await entetesCles();
      await o.reload();
      await o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
      const apresRecharge = await entetesCles();
      const iTel = avant.indexOf('telephone');
      constat(apresMonter.indexOf('telephone') === iTel - 1 && apresMonter.indexOf('ville') === iTel && apresMonter[0] === 'nom'
        && JSON.stringify(apresRecharge) === JSON.stringify(apresMonter) && await o.isDisabled('[data-col=entreprise] [data-monter]'),
        'ticket 233 : monter une colonne (Téléphone) la passe devant Ville tout de suite, l\'ordre est gardé au rechargement, le nom reste premier');
      await o.click('[data-colonnes] summary');
      await o.click('[data-col=telephone] [data-descendre]');
      constat(JSON.stringify(await entetesCles()) === JSON.stringify(avant), 'ticket 233 : descendre la colonne rend l\'ordre d\'origine');
      await o.click('h1');
      await o.click('[data-outils] summary');
      constat(await o.isVisible('[data-outils] a[href="/aujourdhui"]'), '18.4 : le menu « Autres outils » s\'ouvre et montre ses pages');
      await o.screenshot({ path: path.join(OUT, 'espace-contacts-menu-1440.png') });
      await o.click('h1');
      constat(await o.isVisible('[data-retour-ouvrir]'), '18.4 : le bouton « Un retour ? » est sur la page Contacts');
    }
    await o.screenshot({ path: path.join(OUT, `espace-contacts-${largeur}.png`) });
    constat(!(await o.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), `18.4 : page Contacts à ${largeur} px : pas de débordement horizontal`);
    await ctx.close();
  }
  // Story 18.5 : filtres et vues enregistrées. Quatre contacts d'une même ville propre à cet essai (plus un écarté), pour
  // vérifier chaque filtre de FR-2 (plus « à rappeler ») sans dépendre du reste de la base.
  const VILLE5 = `Filtreville${NUM}`;
  const F1 = `01KF5A${NUM}${'0'.repeat(14)}`, F2 = `01KF5B${NUM}${'0'.repeat(14)}`, F3 = `01KF5C${NUM}${'0'.repeat(14)}`, F4 = `01KF5D${NUM}${'0'.repeat(14)}`;
  const jourParis = (decalage) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + decalage * 86_400_000));
  const ilYa = (jours) => new Date(Date.now() - jours * 86_400_000).toISOString();
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, entreprise, categorie_id, projet, temperature, verifie_le, a_rappeler_le, telephone) VALUES
       ('${F1}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Fanny', 'Filtreun${NUM}', '${VILLE5}', 'Laiterie${NUM}', 'edb', 'vendeur', 'chaud', '2026-10-02T08:00:00Z', '${jourParis(-1)}', '+33651${NUM}')`);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, categorie_id, projet, temperature, email, email_accord_le, email_accord_source, dernier_contact_le, dernier_contact_canal, ambassadeur_inscrit_le, a_rappeler_le) VALUES
       ('${F2}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Félix', 'Filtredeux${NUM}', '${VILLE5}', 'edb', 'acheteur', 'tiede', 'felix.filtre+${ESSAI}@example.com', '2026-10-01T08:00:00Z', 'anne', '${ilYa(200)}', 'sms', '2026-10-03T08:00:00Z', '${jourParis(1)}')`);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, categorie_id, ecarte_le, telephone) VALUES
       ('${F3}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Firmin', 'Filtretrois${NUM}', '${VILLE5}', 'edb', '2026-10-05T08:00:00Z', '+33652${NUM}')`);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, categorie_id, telephone, etape, parcours, prochaine_action_le, dernier_contact_le, dernier_contact_canal) VALUES
       ('${F4}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Flore', 'Filtrequatre${NUM}', '${VILLE5}', 'proches', '+33653${NUM}', 'premier_rdv', 'vendeur', '2026-12-01', '${ilYa(10)}', 'appel')`);
  sql(`INSERT INTO contact_source (contact_id, source, a) VALUES ('${F1}', 'site', '2026-10-01T08:00:00Z')`);
  sql(`UPDATE contact SET canal = 'site' WHERE id = '${F1}'`); // story 18.21 : la « Source » du tableau est le canal
  // Story 18.17 : F1 a rencontré Anne à Publier en décembre 2024 ; F2 à Publier en février 2025 et à Margencel en décembre 2024.
  // Lieux propres à cet essai (la base locale garde les essais d'avant) ; les mois d'avant sont retirés pour que le filtre « mois » seul reste exact.
  const PUB5 = `Publier${NUM}`, MARG5 = `Margencel${NUM}`;
  sql(`DELETE FROM contact_source WHERE source = 'edb' AND mois IN ('2024-12', '2025-02')`);
  sql(`INSERT INTO contact_source (contact_id, source, lieu, mois, a) VALUES ('${F1}', 'edb', '${PUB5}', '2024-12', '2026-10-01T08:00:00Z'),
       ('${F2}', 'edb', '${PUB5}', '2025-02', '2026-10-01T08:00:00Z'), ('${F2}', 'edb', '${MARG5}', '2024-12', '2026-10-01T08:00:01Z')`);
  sql(`DELETE FROM vue WHERE nom LIKE 'Essai vue%'`);
  const vuesAvant = sql('SELECT count(*) AS n FROM vue')[0].n;
  {
    const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const o = await ctx.newPage();
    await o.goto(`${E}/`);
    await o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
    const ids = () => o.locator('[data-lignes] tr[data-contact]').evaluateAll((t) => t.map((x) => x.dataset.contact));
    const attendre = () => o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
    const choisir = async (filtre, valeur) => { await o.selectOption(`[data-filtre=${filtre}]`, String(valeur)); await attendre(); return ids(); };
    const retirerP = async (cle, valeur) => { await o.click(`[data-retirer="${cle}"]${valeur ? `[data-valeur="${valeur}"]` : ''}`); await attendre(); return ids(); };
    const memes = (a, b) => a.length === b.length && b.every((x) => a.includes(x));
    const pastillesVues = () => o.locator('[data-pastilles] [data-retirer]').allInnerTexts();
    const essais = [];
    let l = await choisir('ville', VILLE5);
    essais.push(['ville', memes(l, [F1, F2, F4])]);
    const chipVille = (await pastillesVues()).some((t) => t.includes(`Ville : ${VILLE5}`));
    l = await choisir('categorie_id', 'edb'); essais.push(['catégorie', memes(l, [F1, F2])]);
    l = await choisir('projet', 'vendeur'); essais.push(['projet', memes(l, [F1])]);
    l = await choisir('projet', 'acheteur'); essais.push(['projet, deux valeurs', memes(l, [F1, F2])]);
    l = await retirerP('projet', 'vendeur'); essais.push(['pastille retirée (une valeur)', memes(l, [F2])]);
    l = await retirerP('projet', 'acheteur'); l = await retirerP('categorie_id', 'edb');
    essais.push(['pastilles retirées', memes(l, [F1, F2, F4])]);
    l = await choisir('temperature', 'tiede'); essais.push(['température', memes(l, [F2])]); await retirerP('temperature', 'tiede');
    // Story 18.21 : le filtre « Source » filtre sur le canal d'origine du contact (plus sur les sources d'import).
    l = await choisir('canal', 'site'); essais.push(['source (canal)', memes(l, [F1])]); await retirerP('canal', 'site');
    await o.fill('[data-filtre-texte=entreprise_contient]', `laiterie${NUM}`); await o.waitForTimeout(300); await attendre();
    l = await ids(); essais.push(['entreprise contient', memes(l, [F1])]); await retirerP('entreprise_contient');
    essais.push(['case entreprise vidée', (await o.inputValue('[data-filtre-texte=entreprise_contient]')) === '']);
    l = await choisir('etat', 'verifie:oui'); essais.push(['vérifiés', memes(l, [F1])]);
    l = await choisir('etat', 'verifie:non'); essais.push(['à vérifier', memes(l, [F2, F4])]);
    l = await choisir('etat', 'ecarte:oui'); essais.push(['écartés (seuls)', memes(l, [F3])]);
    l = await retirerP('ecarte'); essais.push(['sans le filtre « écartés », l\'écarté est masqué', memes(l, [F1, F2, F4])]);
    l = await choisir('autres', 'accord:accord'); essais.push(['accord', memes(l, [F2])]); await retirerP('accord', 'accord');
    l = await choisir('dernier_contact', 'jamais'); essais.push(['jamais recontacté', memes(l, [F1])]);
    l = await choisir('dernier_contact', '90'); essais.push(['dernier contact plus ancien que 3 mois', memes(l, [F1, F2])]); await retirerP('dernier_contact');
    l = await choisir('autres', 'pipeline:dans'); essais.push(['dans le suivi', memes(l, [F4])]);
    l = await choisir('autres', 'pipeline:hors'); essais.push(['hors suivi', memes(l, [F1, F2])]); await retirerP('pipeline');
    l = await choisir('autres', 'ambassadeur:oui'); essais.push(['ambassadeurs', memes(l, [F2])]); await retirerP('ambassadeur');
    l = await choisir('autres', 'a_rappeler:oui'); essais.push(['à rappeler (date arrivée)', memes(l, [F1])]); await retirerP('a_rappeler');
    // Story 18.17 : lieu et mois de rencontre ; avec les deux, une même rencontre doit avoir les deux (F2 : Publier et décembre 2024, mais pas ensemble).
    l = await choisir('lieu', PUB5); essais.push(['lieu de rencontre', memes(l, [F1, F2])]);
    const colRencontre = await o.locator(`tr[data-contact="${F2}"] td`).allInnerTexts();
    essais.push(['colonne Rencontre (plusieurs, la plus récente d\'abord)', colRencontre.includes(`EDB ${PUB5} · févr. 2025 + EDB ${MARG5} · déc. 2024`)]);
    l = await choisir('mois', '2024-12'); essais.push(['lieu et mois sur la même rencontre', memes(l, [F1])]);
    essais.push(['pastilles lieu et mois', (await pastillesVues()).some((t) => t.includes(`Lieu de rencontre : ${PUB5}`)) && (await pastillesVues()).some((t) => t.includes('Mois de rencontre : déc. 2024'))]);
    await retirerP('lieu', PUB5); l = await ids(); essais.push(['mois de rencontre seul', memes(l, [F1, F2])]); await retirerP('mois', '2024-12');
    const rates = essais.filter(([, ok]) => !ok).map(([n]) => n);
    constat(!rates.length && chipVille, `18.5 : chaque filtre (${essais.length} essais : ${essais.map(([n]) => n).join(', ')})${rates.length ? ` ; ratés : ${rates.join(', ')}` : ''}`);
    // Combinaison avec la recherche : ville + catégorie, puis un nom.
    await choisir('categorie_id', 'edb');
    await o.fill('[data-recherche]', `filtredeux${NUM}`); await o.waitForTimeout(300); await attendre();
    const combine = await ids();
    await o.fill('[data-recherche]', `filtrequatre${NUM}`); await o.waitForTimeout(300); await attendre();
    const horsFiltre = await ids();
    await o.fill('[data-recherche]', ''); await o.waitForTimeout(300); await attendre();
    constat(memes(combine, [F2]) && horsFiltre.length === 0 && (await o.textContent('[data-compteur]')).startsWith('2 contacts sur'),
      '18.5 : les filtres se combinent avec la recherche (un nom hors de la catégorie choisie ne sort pas) ; le compteur suit');
    await o.click('[data-retirer-tout]'); await attendre();
    constat((await o.locator('[data-pastilles] [data-retirer]').count()) === 0 && (await ids()).length === nonEcartes + 3,
      '18.5 : « Tout retirer » enlève toutes les pastilles, le tableau revient à tous les contacts non écartés');
    await o.screenshot({ path: path.join(OUT, 'espace-contacts-filtres-1440.png') });
    // Nouvelle vue avec ces filtres : nom avec du HTML, montré tel quel.
    await choisir('ville', VILLE5); await choisir('projet', 'vendeur');
    await o.screenshot({ path: path.join(OUT, 'espace-contacts-pastilles-1440.png') });
    const NOMV = `Essai vue <b>${NUM}</b>`;
    await o.click('[data-nouvelle-vue]');
    await o.fill('[data-form-vue] input[name=nom]', NOMV);
    await o.screenshot({ path: path.join(OUT, 'espace-contacts-nouvelle-vue-1440.png') });
    await o.click('[data-form-vue] button[type=submit]');
    await o.waitForFunction((n) => [...document.querySelectorAll('[data-vues] .ct-vue span')].some((s) => s.textContent === n), NOMV);
    const enBase = sql(`SELECT id, filtre FROM vue WHERE nom = '${NOMV.replace(/'/g, "''")}'`)[0];
    const filtreBase = enBase ? JSON.parse(enBase.filtre) : null;
    const boutonVue = o.locator(`[data-vue="${enBase?.id}"]`);
    constat(!!enBase && filtreBase?.projet?.join() === 'vendeur' && filtreBase?.ville?.join() === VILLE5 && Object.keys(filtreBase).length === 2,
      `18.5 : « Nouvelle vue avec ces filtres » enregistre les filtres sous un nom (${enBase?.filtre})`);
    constat(await o.locator('[data-vues] b').count() === 0 && (await boutonVue.locator('small').textContent()) === '1' && (await boutonVue.getAttribute('aria-pressed')) === 'true',
      '18.5 : le nom de la vue est échappé (montré tel quel, sans balise), avec son compteur, et la vue est choisie');
    await o.click('[data-vue=tous]'); await attendre();
    const tous = await ids();
    await boutonVue.click(); await attendre();
    constat(tous.length === nonEcartes + 3 && memes(await ids(), [F1]) && (await pastillesVues()).length === 2,
      '18.5 : « Tous les contacts » retire les filtres ; un clic sur la vue les retrouve');
    // Renommer.
    await o.hover(`[data-vue="${enBase.id}"]`); // revue 18.5 : ✎ et × ne reçoivent un clic qu'au survol
    await o.click(`[data-renommer-vue="${enBase.id}"]`);
    await o.fill('[data-form-vue] input[name=nom]', `Essai vue renommée ${NUM}`);
    await o.click('[data-form-vue] button[type=submit]');
    await o.waitForFunction((id) => document.querySelector(`[data-vue="${id}"] span`)?.textContent?.startsWith('Essai vue renommée'), enBase.id);
    const renommee = sql(`SELECT nom, filtre FROM vue WHERE id = '${enBase.id}'`)[0];
    constat(renommee?.nom === `Essai vue renommée ${NUM}` && renommee.filtre === enBase.filtre, '18.5 : une vue se renomme (filtres inchangés)');
    // Supprimer, puis annuler tout de suite.
    await o.hover(`[data-vue="${enBase.id}"]`); // revue 18.5 : ✎ et × ne reçoivent un clic qu'au survol
    await o.click(`[data-supprimer-vue="${enBase.id}"]`);
    await o.waitForSelector('[data-toast-annuler]:visible');
    const supprimee = sql(`SELECT count(*) AS n FROM vue WHERE id = '${enBase.id}'`)[0].n === 0 && await o.locator(`[data-vue="${enBase.id}"]`).count() === 0;
    await o.screenshot({ path: path.join(OUT, 'espace-contacts-vue-supprimee-1440.png') });
    constat(supprimee && (await o.textContent('[data-toast-texte]')).includes('supprimée'), '18.5 : une vue se supprime, l\'annulation est proposée tout de suite');
    await o.click('[data-toast-annuler]');
    await o.waitForSelector(`[data-vue="${enBase.id}"]`);
    const remise = sql(`SELECT nom, filtre FROM vue WHERE id = '${enBase.id}'`)[0];
    constat(remise?.nom === `Essai vue renommée ${NUM}` && remise.filtre === enBase.filtre, '18.5 : « Annuler » remet la vue (même identifiant, même nom, mêmes filtres)');
    constat(await o.locator('.ct-vue-l:has([data-vue=tous]) [data-supprimer-vue], .ct-vue-l:has([data-vue=tous]) [data-renommer-vue]').count() === 0
      && await o.locator('[data-supprimer-vue]').count() === sql('SELECT count(*) AS n FROM vue')[0].n,
      '18.5 : « Tous les contacts » n\'a ni bouton de suppression ni de renommage ; chaque vue de la table en a un');
    // Vues de départ : « Vendeurs chauds » trouve le vendeur chaud de cet essai.
    const vc = sql(`SELECT id FROM vue WHERE id = '01M6A6FT000000000000000003'`)[0];
    if (vc) { await o.click(`[data-vue="${vc.id}"]`); await attendre(); }
    constat(!vc || (await ids()).includes(F1), '18.5 : la vue de départ « Vendeurs chauds » s\'applique (vendeur chaud de l\'essai trouvé)');
    await o.click('[data-vue=tous]');
    await ctx.close();
  }
  // Les écritures passent par /api/vues, qui valide le filtre contre le vocabulaire fermé d'AD-27.
  const vues = (methode, corps, { jeton = JETON, type = 'application/json', id } = {}) => appeler(`${E}/api/vues${id ? `?id=${encodeURIComponent(id)}` : ''}`, {
    method: methode, redirect: 'manual', headers: { 'cf-access-jwt-assertion': jeton, 'Content-Type': type, Origin: E }, body: corps === undefined ? undefined : typeof corps === 'string' ? corps : JSON.stringify(corps),
  });
  const nVues = () => sql('SELECT count(*) AS n FROM vue')[0].n;
  const n0 = nVues();
  const refusVues = [
    ['clé inconnue', await vues('POST', { nom: 'Essai vue refusée', filtre: { inconnu: 'x' } })],
    ['valeur inconnue (projet)', await vues('POST', { nom: 'Essai vue refusée', filtre: { projet: ['roi'] } })],
    ['catégorie inconnue', await vues('POST', { nom: 'Essai vue refusée', filtre: { categorie_id: ['inexistante'] } })],
    ['durée hors bornes', await vues('POST', { nom: 'Essai vue refusée', filtre: { dernier_contact: 0 } })],
    ['liste attendue', await vues('POST', { nom: 'Essai vue refusée', filtre: { projet: 'vendeur' } })],
    ['nom vide', await vues('POST', { nom: '  ', filtre: { verifie: 'non' } })],
    ['corps qui n\'est pas du JSON', await vues('POST', 'nom=x', { type: 'application/x-www-form-urlencoded' })],
  ];
  constat(refusVues.every(([, x]) => x.status === 400) && nVues() === n0, `18.5 : /api/vues refuse un filtre hors du vocabulaire fermé (400 : ${refusVues.map(([n, x]) => `${n} ${x.status}`).join(', ')}), rien n'est écrit`);
  r = await vues('POST', { nom: 'Essai vue API', filtre: { verifie: 'non', dernier_contact: 45, ecarte: 'non', recherche: 'thonon', a_rappeler: 'oui', categorie_id: ['proches'] } });
  const creeeApi = (await r.json()).vue;
  constat(r.status === 201 && !!creeeApi?.id && nVues() === n0 + 1, '18.5 : /api/vues accepte un filtre du vocabulaire (201)');
  // Story 18.17 : une vue enregistrée « EDB Publier, décembre 2024 » (lieu + mois) est acceptée, relue, appliquée par la page.
  {
    const refusR = [['mois mal formé', { mois: ['décembre 2024'] }], ['mois impossible', { mois: ['2024-13'] }], ['lieu vide', { lieu: [] }], ['lieu en texte', { lieu: PUB5 }]];
    const reponsesR = [];
    for (const [, f] of refusR) reponsesR.push((await vues('POST', { nom: 'Essai vue refusée', filtre: f })).status);
    r = await vues('POST', { nom: 'Essai vue rencontre', filtre: { lieu: [PUB5], mois: ['2024-12'] } });
    const vr = (await r.json()).vue;
    const ctxR = await nav.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const pR = await ctxR.newPage();
    await pR.goto(`${E}/`);
    await pR.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
    await pR.click(`[data-vue="${vr?.id}"]`);
    await pR.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
    const idsR = await pR.locator('[data-lignes] tr[data-contact]').evaluateAll((t) => t.map((x) => x.dataset.contact));
    await ctxR.close();
    constat(reponsesR.every((x) => x === 400) && r.status === 201 && vr?.filtre?.lieu?.join() === PUB5 && vr.filtre.mois?.join() === '2024-12' && idsR.length === 1 && idsR[0] === F1,
      `18.17 : /api/vues refuse un mois ou un lieu mal formé (${reponsesR.join(', ')}) ; la vue « lieu Publier, mois 2024-12 » s'enregistre et la page la retrouve (${idsR.length} contact)`);
    await vues('DELETE', undefined, { id: vr?.id });
  }
  const refusDelete = [await vues('DELETE', undefined, { id: 'tous' }), await vues('DELETE', undefined, { id: 'Tous les contacts' }), await vues('DELETE', undefined, { id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' })];
  constat(refusDelete[0].status === 400 && refusDelete[1].status === 400 && refusDelete[2].status === 404 && nVues() === n0 + 1,
    `18.5 : « Tous les contacts » ne peut pas être supprimée (${refusDelete.map((x) => x.status).join(', ')}), aucune vue n'est touchée`);
  const accesVues = [
    ['sans jeton', await appeler(`${E}/api/vues`, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nom: 'Essai vue pirate', filtre: {} }) })],
    ['jeton de Claude', await vues('POST', { nom: 'Essai vue pirate', filtre: {} }, { jeton: JETON_CLAUDE })],
    ['jeton de Claude (suppression)', await vues('DELETE', undefined, { jeton: JETON_CLAUDE, id: creeeApi.id })],
  ];
  constat(accesVues.every(([, x]) => x.status === 403) && nVues() === n0 + 1, `18.5 : /api/vues réservé à Anne et JB (${accesVues.map(([n, x]) => `${n} ${x.status}`).join(', ')})`);
  r = await vues('DELETE', undefined, { id: creeeApi.id });
  constat(r.status === 200 && nVues() === n0, '18.5 : la vue créée par l\'essai est supprimée');
  // Revue de code 18.5 : vue invalide, boutons au survol, double clic, jours de Paris, « à rappeler » daté, refus de la route.
  {
    const VINV = '01KFR5A0000000000000000001', VMIX = '01KFR5B0000000000000000001';
    sql(`DELETE FROM vue WHERE id IN ('${VINV}', '${VMIX}')`);
    sql(`INSERT INTO vue (id, nom, ordre, filtre, created_at, maj_le) VALUES
         ('${VINV}', 'Essai vue disparue', 900, '{"categorie_id":["disparue_x"],"ville":["${VILLE5}"]}', '2026-11-02T00:00:00Z', '2026-11-02T00:00:00Z'),
         ('${VMIX}', 'Essai vue en partie', 901, '{"categorie_id":["disparue_y","edb"],"ville":["${VILLE5}"]}', '2026-11-02T00:00:00Z', '2026-11-02T00:00:00Z')`);
    // Un dernier contact au tout début du jour de Paris d'il y a 90 jours : pas « plus de 3 mois » en jours de Paris.
    const j90 = jourParis(-90);
    const decalage = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', hourCycle: 'h23' }).format(new Date(`${j90}T00:00:00Z`)));
    const tot = new Date(Date.parse(`${j90}T00:30:00Z`) - decalage * 3_600_000).toISOString();
    const FJ = `01KF5E${NUM}${'0'.repeat(14)}`;
    sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, dernier_contact_le, dernier_contact_canal, a_rappeler_le) VALUES
         ('${FJ}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Fabien', 'Filtrejour${NUM}', '${VILLE5}', '${tot}', 'appel', '${jourParis(0)}T23:00:00Z')`);
    const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const o = await ctx.newPage();
    await o.goto(`${E}/`);
    const attendre = () => o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
    await attendre();
    const ids = () => o.locator('[data-lignes] tr[data-contact]').evaluateAll((t) => t.map((x) => x.dataset.contact));
    const reg = await o.evaluate(() => JSON.parse(document.getElementById('ct-reglages').textContent));
    const vinv = reg.vues.find((v) => v.id === VINV), vmix = reg.vues.find((v) => v.id === VMIX);
    await o.click(`[data-vue="${VINV}"]`); await attendre();
    const message = await o.textContent('[data-lignes]');
    constat(vinv?.invalide === 'une catégorie a disparu' && (await ids()).length === 0 && message.includes('Vue à refaire : une catégorie a disparu')
      && (await o.textContent(`[data-vue="${VINV}"] small`)) === 'à refaire' && vmix && !vmix.invalide && vmix.filtre.categorie_id.join() === 'edb',
      'revue 18.5 : une vue dont toutes les catégories ont disparu ne garde aucun contact et l\'écran dit « vue à refaire » ; une vue qui en garde une ne perd que la valeur disparue');
    constat(JSON.stringify(vinv?.filtre) === '{}', 'revue 18.6 : une vue invalide arrive dans la page avec un filtre vide (aucune valeur non vérifiée)');
    await o.click('[data-vue=tous]'); await attendre();
    // Jours de Paris et « à rappeler » avec une heure.
    await o.selectOption('[data-filtre=ville]', VILLE5); await attendre();
    await o.selectOption('[data-filtre=dernier_contact]', '90'); await attendre();
    const vieux = await ids();
    await o.click('[data-retirer=dernier_contact]'); await attendre();
    await o.selectOption('[data-filtre=autres]', 'a_rappeler:oui'); await attendre();
    const rappel = await ids();
    await o.click('[data-retirer-tout]'); await attendre();
    constat(!vieux.includes(FJ) && vieux.includes(F1) && rappel.includes(FJ),
      `revue 18.5 : « plus de 3 mois » compte en jours de Paris (dernier contact le ${tot}, il y a 90 jours de Paris : exclu) ; « à rappeler » lit le jour d'une date avec heure`);
    // Boutons ✎ et × : invisibles et sans clic hors survol.
    const style = await o.locator(`.ct-vue-l:has([data-vue="${VMIX}"]) .ct-vue-gestes`).evaluate((x) => getComputedStyle(x).pointerEvents);
    await o.hover(`[data-vue="${VMIX}"]`);
    const survol = await o.locator(`.ct-vue-l:has([data-vue="${VMIX}"]) .ct-vue-gestes`).evaluate((x) => getComputedStyle(x).pointerEvents);
    constat(style === 'none' && survol === 'auto', `revue 18.5 : les boutons ✎ et × ne reçoivent un clic qu'au survol ou au clavier (${style}, puis ${survol})`);
    // Double clic sur × : une seule suppression ; puis deux vues supprimées, deux annulations.
    await o.hover(`[data-vue="${VMIX}"]`);
    await o.dblclick(`[data-supprimer-vue="${VMIX}"]`);
    await o.waitForSelector('[data-toast-annuler]:visible');
    const apresDouble = await o.textContent('[data-toast-texte]');
    await o.hover(`[data-vue="${VINV}"]`);
    await o.click(`[data-supprimer-vue="${VINV}"]`);
    await o.waitForFunction(() => document.querySelector('[data-toast-texte]')?.textContent?.includes('disparue'));
    const deux = sql(`SELECT count(*) AS n FROM vue WHERE id IN ('${VINV}', '${VMIX}')`)[0].n;
    await o.click('[data-toast-annuler]');
    await o.waitForFunction(() => document.querySelector('[data-toast-texte]')?.textContent?.includes('en partie'));
    const premiere = await o.textContent('[data-toast-texte]');
    await o.click('[data-toast-annuler]');
    await o.waitForFunction(() => document.querySelector('[data-toast-texte]')?.textContent?.includes('remise'));
    await o.waitForTimeout(200);
    const remises = sql(`SELECT id FROM vue WHERE id IN ('${VINV}', '${VMIX}')`).map((x) => x.id);
    constat(apresDouble.includes('supprimée') && !apresDouble.includes('Erreur') && deux === 0 && premiere.includes('Vue « Essai vue en partie » supprimée') && remises.includes(VMIX),
      `revue 18.5 : un double clic sur × ne supprime qu'une fois et garde l'annulation ; deux vues supprimées ont chacune leur « Annuler » (${premiere})`);
    // La vue invalide ne se remet pas (son filtre n'est plus valable) : c'est attendu, la page le dit.
    // Double clic sur « Enregistrer » : une seule vue.
    await o.selectOption('[data-filtre=ville]', VILLE5); await attendre();
    await o.click('[data-nouvelle-vue]');
    await o.fill('[data-form-vue] input[name=nom]', `Essai vue double ${NUM}`);
    await o.dblclick('[data-form-vue] button[type=submit]');
    await o.waitForTimeout(800);
    constat(sql(`SELECT count(*) AS n FROM vue WHERE nom = 'Essai vue double ${NUM}'`)[0].n === 1, 'revue 18.5 : un double clic sur « Enregistrer » ne crée qu\'une vue');
    await ctx.close();
    sql(`DELETE FROM vue WHERE nom LIKE 'Essai vue%' OR id IN ('${VINV}', '${VMIX}')`);
    sql(`DELETE FROM contact WHERE id = '${FJ}'`);
  }
  {
    const n1 = nVues();
    const gros = JSON.stringify({ nom: 'Essai vue grosse', filtre: { recherche: 'x' }, rembourrage: 'x'.repeat(9000) });
    const refus = [
      ['ambassadeur « non »', await vues('POST', { nom: 'Essai vue refusée', filtre: { ambassadeur: 'non' } })],
      ['filtre vide', await vues('POST', { nom: 'Essai vue refusée', filtre: {} })],
    ];
    // Ordre déjà pris à l'annulation : la vue revient en dernière position.
    const prise = sql('SELECT ordre FROM vue ORDER BY ordre LIMIT 1')[0]?.ordre ?? 1;
    const max = sql('SELECT coalesce(max(ordre), 0) AS m FROM vue')[0].m;
    const rr = await vues('POST', { id: '01KFR5C0000000000000000001', nom: 'Essai vue rétablie', ordre: prise, filtre: { verifie: 'non' } });
    const retablie = (await rr.json()).vue;
    // Plafond de 100 vues.
    const manque = Math.max(0, 100 - nVues());
    if (manque) sql(`WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < ${manque}) INSERT INTO vue (id, nom, ordre, filtre, created_at, maj_le) SELECT '01KFR5D' || printf('%019d', i), 'Essai vue plafond ' || i, 1000 + i, '{"verifie":"non"}', '2026-11-02T00:00:00Z', '2026-11-02T00:00:00Z' FROM n`);
    const r101 = await vues('POST', { nom: 'Essai vue de trop', filtre: { verifie: 'oui' } });
    // Revue de code 18.6 : une remise en place (annulation d'une suppression) n'est pas soumise au plafond.
    const rRemise = await vues('POST', { id: '01KFR5C0000000000000000002', nom: 'Essai vue remise au plafond', ordre: 5000, filtre: { verifie: 'oui' } });
    const nPlafond = nVues();
    // Revue de code 18.7 : une remise en place reste plafonnée (moins de 101 vues).
    const rRemise2 = await vues('POST', { id: '01KFR5C0000000000000000003', nom: 'Essai vue remise de trop', ordre: 5001, filtre: { verifie: 'oui' } });
    // En dernier : le serveur local de wrangler perd la requête qui suit un corps refusé sans être lu (pas Cloudflare) ;
    // une requête jetable vient donc après.
    const r413 = await vues('POST', gros);
    await appeler(`${E}/`, { headers: avecJeton() }).catch(() => {});
    sql(`DELETE FROM vue WHERE nom LIKE 'Essai vue%'`);
    constat(refus.every(([, x]) => x.status === 400) && r413.status === 413 && retablie?.ordre === max + 1 && r101.status === 400 && nVues() === n1,
      `revue 18.5 : /api/vues refuse « ambassadeur : non » et un filtre vide (400), un corps annoncé trop grand (${r413.status}), une 101e vue (${r101.status}) ; une vue rétablie sur un ordre pris va en dernier (${retablie?.ordre} = ${max} + 1)`);
    constat(r101.status === 400 && rRemise.status === 201 && nPlafond === 101, `revue 18.6 : plafond de 100 vues vérifié dans l'insertion (101e refusée, ${r101.status}) ; une remise en place après suppression passe (${rRemise.status})`);
    constat(rRemise2.status === 400, `revue 18.7 : une remise en place au-delà de 101 vues est refusée (${rRemise2.status})`);
  }
  // Les routes /api/claude/… ne lisent ni les contacts ni les vues : aucune n'importe le tableau ni les vues, et leurs
  // (story 18.9 : sauf /api/claude/import, vérifiée à part : elle n'ouvre que l'import, jamais la lecture)
  // réponses ne contiennent aucun nom de vue.
  const routesClaude = fs.readdirSync(path.join(ICI, 'src', 'pages', 'api', 'claude')).filter((f) => f !== 'import.ts').map((f) => fs.readFileSync(path.join(ICI, 'src', 'pages', 'api', 'claude', f), 'utf8'));
  const repClaude = (await (await claude('/api/claude/actions')).text()) + (await (await claude('/api/claude/bilan?p=semaine')).text());
  constat(routesClaude.length >= 2 && routesClaude.every((t) => !/vues|tableau|carnet|FROM vue\b/.test(t)) && !repClaude.includes('Vendeurs chauds') && !repClaude.includes(`Filtreun${NUM}`),
    '18.5 : les routes /api/claude/… ne lisent ni les contacts du tableau ni les vues');
  sql(`DELETE FROM vue WHERE nom LIKE 'Essai vue%'`);
  constat(nVues() === vuesAvant, `18.5 : vues de l'essai retirées (${vuesAvant} vues en base)`);
  // Story 18.6 : classer plusieurs contacts à la fois, une seule ligne, écarter, annuler. Quatre contacts d'une ville propre
  // à cet essai, dont un du suivi des ventes ; toutes les écritures passent par /api/carnet (`server/carnet`, AD-29).
  const VILLE6 = `Classeville${NUM}`;
  const G1 = `01KF6A${NUM}${'0'.repeat(14)}`, G2 = `01KF6B${NUM}${'0'.repeat(14)}`, G3 = `01KF6C${NUM}${'0'.repeat(14)}`, GP = `01KF6D${NUM}${'0'.repeat(14)}`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, categorie_id, projet, temperature, telephone) VALUES
       ('${G1}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Gabin', 'Classeun${NUM}', '${VILLE6}', 'lointains', 'vendeur', 'en_vente', '+33661${NUM}')`);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, projet, temperature, telephone) VALUES
       ('${G2}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Gina <i>x</i>', 'Classedeux${NUM}', '${VILLE6}', 'acheteur', 'recherche_active', '+33662${NUM}')`);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, categorie_id, verifie_le, telephone) VALUES
       ('${G3}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Gaspard', 'Classetrois${NUM}', '${VILLE6}', 'proches', '2026-10-02T08:00:00Z', '+33663${NUM}')`);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, categorie_id, projet, temperature, telephone, etape, parcours, prochaine_action, prochaine_action_le, dernier_contact_le, dernier_contact_canal) VALUES
       ('${GP}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Gilles', 'Classesuivi${NUM}', '${VILLE6}', 'demandes_recues', 'vendeur', 'avec_anne', '+33664${NUM}', 'premier_rdv', 'vendeur', 'Rappeler', '2026-12-01', '2026-10-20T09:00:00Z', 'appel')`);
  const CLASSEMENT = 'categorie_id, projet, temperature, verifie_le, ecarte_le';
  const etatG = (ids = [G1, G2, G3, GP]) => JSON.stringify(sql(`SELECT id, ${CLASSEMENT} FROM contact WHERE id IN (${ids.map((x) => `'${x}'`).join(',')}) ORDER BY id`));
  const un = (id) => sql(`SELECT ${CLASSEMENT}, etape, parcours, prochaine_action, prochaine_action_le, dernier_contact_le, dernier_contact_canal FROM contact WHERE id = '${id}'`)[0];
  const nEv = () => sql(`SELECT count(*) AS n FROM contact_evenement WHERE type = 'classement'`)[0].n;
  const api = async (corps, { jeton = JETON, type = 'application/json' } = {}) => {
    const x = await appeler(`${E}/api/carnet`, { method: 'POST', redirect: 'manual', headers: { 'cf-access-jwt-assertion': jeton, 'Content-Type': type, Origin: E }, body: typeof corps === 'string' ? corps : JSON.stringify(corps) });
    let d = null; try { d = await x.json(); } catch {}
    return { status: x.status, d };
  };
  {
    // Lot : catégorie sur trois contacts, avant-image gardée, « vérifié » posé (sans changer une date déjà là), puis annulation.
    const avant = etatG();
    let x = await api({ ids: [G1, G2, G3], changements: { categorie_id: 'edb' } });
    const evs = sql(`SELECT contact_id, donnees, source, par FROM contact_evenement WHERE type = 'classement' AND json_extract(donnees, '$.lot') = '${x.d?.lot}' ORDER BY contact_id`);
    const d1 = evs.map((e) => JSON.parse(e.donnees));
    constat(x.status === 200 && x.d.ok && x.d.touches === 3 && evs.length === 3 && d1[0].avant.categorie_id === 'lointains' && d1[0].apres.categorie_id === 'edb' && d1[1].avant.categorie_id === null
      && d1[0].avant.verifie_le === null && !!d1[0].apres.verifie_le && !('verifie_le' in d1[2].apres) && evs.every((e) => e.source === 'anne' && e.par) && x.d.lignes.length === 3,
      `18.6 : un lot de trois contacts change leur catégorie et garde pour chacun son avant-image dans contact_evenement, avec un lot commun (${x.d?.lot})`);
    constat(un(G1).categorie_id === 'edb' && !!un(G1).verifie_le && !!un(G2).verifie_le && un(G3).verifie_le === '2026-10-02T08:00:00Z',
      '18.6 : changer la catégorie marque « vérifié » (une date de vérification déjà posée est gardée)');
    const lot1 = x.d.lot;
    x = await api({ annuler: lot1 });
    const apresAnnul = etatG();
    const y = await api({ annuler: lot1 });
    constat(x.status === 200 && x.d.rendus === 3 && apresAnnul === avant && y.status === 200 && y.d.rendus === 0 && etatG() === avant,
      '18.6 : annuler le lot rend l\'état exact d\'avant (catégorie, vérifié) ; une seconde annulation ne rend plus rien');
    // Projet sans température : la température est effacée ; un projet incompatible aussi (déjà en vente → acheteur).
    x = await api({ ids: [G1, G2], changements: { projet: 'ambassadeur' } });
    const amb = [un(G1), un(G2)];
    await api({ annuler: x.d.lot });
    x = await api({ ids: [G1, G2], changements: { projet: 'acheteur' } });
    constat(amb.every((c) => c.projet === 'ambassadeur' && c.temperature === null) && x.d.touches === 1 && x.d.inchanges === 1 && un(G1).projet === 'acheteur' && un(G1).temperature === null && un(G2).temperature === 'recherche_active',
      '18.6 : un projet sans température (ambassadeur) efface la température ; « déjà en vente » ne passe pas chez un acheteur ; un contact déjà dans l\'état demandé n\'est pas touché');
    // Température : posée seulement là où elle s'applique ; un contact suivi garde celle du suivi.
    x = await api({ ids: [G1, G3, GP], changements: { temperature: 'chaud' } });
    constat(x.d.touches === 1 && x.d.ignores === 2 && un(G1).temperature === 'chaud' && un(G3).temperature === null && un(GP).temperature === 'avec_anne',
      `18.6 : une température groupée ne touche que les vendeurs ou acheteurs hors suivi en cours (${x.d.touches} touché, ${x.d.ignores} ignorés)`);
    // Le contact du suivi des ventes : classé (catégorie, projet) sans que son étape ni son dernier contact bougent.
    const p0 = un(GP);
    x = await api({ ids: [GP], changements: { categorie_id: 'partenaires' } });
    const x2 = await api({ ids: [GP], changements: { projet: 'vendeur_acheteur' } });
    const p1 = un(GP);
    constat(x.d.touches === 1 && x2.d.touches === 1 && p1.categorie_id === 'partenaires' && p1.projet === 'vendeur_acheteur' && p1.temperature === 'avec_anne'
      && ['etape', 'parcours', 'prochaine_action', 'prochaine_action_le', 'dernier_contact_le', 'dernier_contact_canal'].every((k) => p1[k] === p0[k]),
      '18.6 : un contact du suivi des ventes se classe sans que son étape, sa prochaine action ni son dernier contact bougent (température « avec Anne » gardée)');
    // Écarter puis faire revenir.
    x = await api({ ids: [G3], changements: { ecarte: true } });
    const ecarte = un(G3).ecarte_le;
    const x3 = await api({ ids: [G3], changements: { ecarte: false } });
    constat(x.d.touches === 1 && !!ecarte && x3.d.touches === 1 && un(G3).ecarte_le === null, '18.6 : écarter pose « écarté », faire revenir l\'enlève, par le carnet');
    // Annulation d'un lot dont un contact a été modifié depuis : celui-là est gardé (AD-29).
    const a = await api({ ids: [G1, G2], changements: { categorie_id: 'lointains' } });
    await api({ ids: [G2], changements: { categorie_id: 'proches' } });
    x = await api({ annuler: a.d.lot });
    constat(x.d.rendus === 1 && x.d.gardes === 1 && un(G2).categorie_id === 'proches', '18.6 : annuler un lot garde un contact modifié depuis par une autre écriture');
    // Revue de code 18.6 : un classement ne fait pas avancer la date d'activité (purge des trois ans, « récents »).
    constat(sql(`SELECT last_activity_at FROM contact WHERE id IN ('${G1}', '${G2}', '${G3}', '${GP}')`).every((c) => c.last_activity_at === '2026-10-01T08:00:00Z'),
      'revue 18.6 : classer et annuler ne touchent pas last_activity_at');
    // Revue de code 18.6 : un contact qui a reçu un événement après le lot (une note) est gardé à l'annulation (AD-29).
    {
      const l = await api({ ids: [G3], changements: { categorie_id: 'edb' } });
      const note = await appeler(`${E}/api/fiche`, { method: 'POST', headers: { 'cf-access-jwt-assertion': JETON, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: G3, note: 'Note après le lot' }) });
      const an = await api({ annuler: l.d.lot });
      constat(note.status === 200 && an.status === 200 && an.d.rendus === 0 && an.d.gardes === 1 && un(G3).categorie_id === 'edb',
        'revue 18.6 : une note écrite après un lot suffit à garder le contact à l\'annulation (événement plus récent, AD-29)');
      await api({ ids: [G3], changements: { categorie_id: 'proches' } });
    }
    // Revue de code 18.6 : une annulation qui remettrait une catégorie supprimée garde le contact au lieu d'échouer (500) ;
    // un contact effacé après le lot n'empêche pas d'annuler les autres.
    {
      const TMP = `essai_tmp_${NUM.replace(/\d/g, (d) => 'abcdefghij'[d])}`;
      sql(`INSERT INTO categorie (id, nom, ordre) VALUES ('${TMP}', 'Essai temporaire', 99) ON CONFLICT DO NOTHING`);
      await api({ ids: [G2], changements: { categorie_id: TMP } });
      const b = await api({ ids: [G2], changements: { categorie_id: 'lointains' } });
      sql(`DELETE FROM categorie WHERE id = '${TMP}'`);
      const an = await api({ annuler: b.d.lot });
      const GD = `01KF6E${NUM}${'0'.repeat(14)}`;
      sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, commune) VALUES ('${GD}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Effaceun${NUM}', 'Ailleurs${NUM}')`);
      const g1Avant = JSON.stringify(un(G1));
      const c = await api({ ids: [GD, G1], changements: { projet: 'ambassadeur' } });
      sql(`DELETE FROM contact WHERE id = '${GD}'`);
      const an2 = await api({ annuler: c.d.lot });
      constat(an.status === 200 && an.d.rendus === 0 && an.d.gardes === 1 && un(G2).categorie_id === 'lointains' && c.d.touches === 2 && an2.status === 200 && an2.d.rendus === 1 && JSON.stringify(un(G1)) === g1Avant,
        `revue 18.6 : annuler un lot dont la catégorie d'avant a été supprimée garde le contact (${an.status}, ${an.d?.gardes} gardé) ; un contact effacé depuis n'empêche pas d'annuler les autres (${an2.status}, ${an2.d?.rendus} rendu)`);
    }
    // Refus : 400 pour toute valeur hors vocabulaire, rien n'est écrit ; 404 pour un lot inconnu ; 403 sans jeton ou avec celui de Claude.
    const e0 = nEv(), s0 = etatG();
    const trop = Array.from({ length: 2001 }, (_, i) => `01KF6Z${String(i).padStart(20, '0')}`);
    const refus = [
      ['catégorie inconnue', await api({ ids: [G1], changements: { categorie_id: 'inexistante' } })],
      ['projet inconnu', await api({ ids: [G1], changements: { projet: 'roi' } })],
      ['température « avec Anne »', await api({ ids: [G1], changements: { temperature: 'avec_anne' } })],
      ['température « terminé »', await api({ ids: [G1], changements: { temperature: 'termine' } })],
      ['température inconnue', await api({ ids: [G1], changements: { temperature: 'brulant' } })],
      ['vérifié non booléen', await api({ ids: [G1], changements: { verifie: 'oui' } })],
      ['changement inconnu', await api({ ids: [G1], changements: { etape: 'vendu' } })],
      ['dernier contact', await api({ ids: [G1], changements: { dernier_contact_le: '2026-10-01' } })],
      ['aucun changement', await api({ ids: [G1], changements: {} })],
      ['aucun identifiant', await api({ ids: [], changements: { verifie: true } })],
      ['identifiant mal formé', await api({ ids: ["x' OR 1=1"], changements: { verifie: true } })],
      ['2 001 identifiants', await api({ ids: trop, changements: { verifie: true } })],
      ['lot mal formé', await api({ annuler: 'tous' })],
      ['corps qui n\'est pas du JSON', await api('ids=x', { type: 'application/x-www-form-urlencoded' })],
    ];
    constat(refus.every(([, r]) => r.status === 400 && r.d?.ok === false) && nEv() === e0 && etatG() === s0,
      `18.6 : /api/carnet refuse toute valeur hors vocabulaire (400 : ${refus.map(([n, r]) => `${n} ${r.status}`).join(', ')}), rien n'est écrit`);
    const inconnu = await api({ annuler: '01ARZ3NDEKTSV4RRFFQ69G5FAV' });
    const acces = [
      ['sans jeton', await appeler(`${E}/api/carnet`, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [G1], changements: { ecarte: true } }) })],
      ['jeton de Claude', await api({ ids: [G1], changements: { ecarte: true } }, { jeton: JETON_CLAUDE })],
      ['jeton de Claude (annulation)', await api({ annuler: a.d.lot }, { jeton: JETON_CLAUDE })],
    ];
    constat(inconnu.status === 404 && acces.every(([, r]) => r.status === 403) && nEv() === e0 && etatG() === s0,
      `18.6 : lot inconnu 404 ; /api/carnet réservé à Anne et JB (${acces.map(([n, r]) => `${n} ${r.status}`).join(', ')})`);
    // Story 18.16 (ticket 243) : le projet « sponsoring » a une température froid, tiède ou chaud, jamais « en vente ».
    {
      const g3Avant = JSON.stringify(un(G3));
      const x = await api({ ids: [G3], changements: { projet: 'sponsoring', temperature: 'chaud' } });
      const y = await api({ ids: [G3], changements: { temperature: 'en_vente' } });
      const z = await api({ ids: [G3], changements: { temperature: 'recherche_active' } });
      const apresSp = un(G3);
      const r = await api({ annuler: x.d?.lot });
      constat(x.status === 200 && x.d.touches === 1 && apresSp.projet === 'sponsoring' && apresSp.temperature === 'chaud' && y.status === 200 && y.d.ignores === 1 && z.d.ignores === 1
        && r.d?.rendus === 1 && JSON.stringify(un(G3)) === g3Avant,
        `18.16 : projet « sponsoring » + chaud accepté par /api/carnet, « en vente » et « en recherche active » refusés (ignorés), annulation rend le contact (${x.status}, ${y.d?.ignores}, ${z.d?.ignores})`);
    }
  }
  // La page : cases, Maj + clic, barre d'actions groupées, annulation, une seule ligne, écarter et faire revenir.
  for (const largeur of [1440, 1280]) {
    const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const o = await ctx.newPage();
    await o.goto(`${E}/`);
    const attendre = () => o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
    await attendre();
    await o.selectOption('[data-filtre=ville]', VILLE6); await attendre();
    const ids = () => o.locator('[data-lignes] tr[data-contact]').evaluateAll((t) => t.map((x) => x.dataset.contact));
    const cochees = () => o.locator('[data-lignes] tr[data-contact]:has(input[data-cocher]:checked)').evaluateAll((t) => t.map((x) => x.dataset.contact));
    const caseDe = (id) => `tr[data-contact="${id}"] input[data-cocher]`;
    if (largeur === 1440) {
      const ordre = await ids();
      await o.click(caseDe(ordre[0]));
      await o.click(caseDe(ordre[2]), { modifiers: ['Shift'] });
      const plage = await cochees();
      constat(plage.length === 3 && plage.join() === ordre.slice(0, 3).join() && (await o.textContent('[data-lot-n]')).startsWith('3 sélectionnés') && await o.isVisible('[data-lot]'),
        '18.6 : Maj + clic coche toute la plage entre la case cliquée juste avant et celle-ci ; la barre d\'actions annonce « 3 sélectionnés »');
      await o.click(caseDe(ordre[2]), { modifiers: ['Shift'] });
      await o.click(caseDe(ordre[0]), { modifiers: ['Shift'] });
      const decoche = await cochees();
      await o.click(caseDe(ordre[0])); await o.click(caseDe(ordre[2]), { modifiers: ['Shift'] });
      constat(decoche.length === 0 && (await cochees()).length === 3, '18.6 : Maj + clic sur une case décochée décoche toute la plage');
      await o.click('th[data-cle=nom] button'); await attendre();
      const apresTri = await cochees();
      await o.fill('[data-recherche]', `classeun${NUM}`); await o.waitForTimeout(300); await attendre();
      const pendant = (await o.textContent('[data-lot-n]')) ?? '';
      await o.fill('[data-recherche]', ''); await o.waitForTimeout(300); await attendre();
      constat(apresTri.length === 3 && plage.every((x) => apresTri.includes(x)) && /3 sélectionnés \(dont \d hors de l'affichage\)/.test(pendant) && (await cochees()).length === 3,
        `18.6 : les cases cochées gardent leur état quand le tableau est retrié ou filtré (${pendant})`);
      constat(await o.locator('[data-lignes] i').count() === 0 && (await o.getAttribute(caseDe(G2), 'aria-label')) === `Cocher Gina <i>x</i> Classedeux${NUM}`,
        '18.6 : un nom avec des balises reste du texte (case et cellules échappées)');
      // Action groupée : catégorie ; tableau mis à jour sans recharger ; Annuler rend l'état d'avant.
      const avant = etatG(plage);
      await o.evaluate(() => { window.__marque = 'meme-page'; });
      await o.selectOption('[data-lot-action=categorie_id]', 'anciens_clients');
      await o.waitForSelector('[data-toast-annuler]:visible');
      const message = await o.textContent('[data-toast-texte]');
      const cellules = await Promise.all(plage.map((id) => o.locator(`tr[data-contact="${id}"]`).innerText()));
      const enBase = plage.map((id) => un(id).categorie_id);
      await o.screenshot({ path: path.join(OUT, 'espace-contacts-lot-fait-1440.png') });
      constat(message.startsWith('3 contacts touchés') && enBase.every((c) => c === 'anciens_clients') && cellules.every((t) => t.includes('Anciens clients') && t.includes('✓ vérifié'))
        && (await o.evaluate(() => window.__marque)) === 'meme-page' && (await cochees()).length === 0 && await o.isHidden('[data-lot]'),
        `18.6 : la barre change la catégorie des cochés : « ${message} », tableau mis à jour sans recharger, cases vidées`);
      await o.click('[data-toast-annuler]');
      await o.waitForFunction(() => document.querySelector('[data-toast-texte]')?.textContent?.includes('remis comme avant'));
      await attendre();
      const textes = await Promise.all(plage.map((id) => o.locator(`tr[data-contact="${id}"]`).innerText()));
      constat(etatG(plage) === avant && textes.every((t) => !t.includes('Anciens clients')),
        '18.6 : « Annuler » rend l\'état exact d\'avant le lot, en base et dans le tableau');
      // Revue de code 18.6 : au clavier, une flèche sur une liste fermée change la valeur affichée sans rien écrire ; Entrée écrit.
      {
        await o.click(caseDe(G1));
        const cat0 = un(G1).categorie_id;
        await o.focus('[data-lot-action=categorie_id]');
        await o.keyboard.press('ArrowDown');
        await o.waitForTimeout(600);
        const apresFleche = un(G1).categorie_id, affichee = await o.inputValue('[data-lot-action=categorie_id]');
        await o.keyboard.press('Enter');
        await o.waitForFunction(() => document.querySelector('[data-toast-texte]')?.textContent?.includes('touché'));
        const apresEntree = un(G1).categorie_id;
        await o.click('[data-toast-annuler]');
        await o.waitForFunction(() => document.querySelector('[data-toast-texte]')?.textContent?.includes('remis comme avant'));
        await attendre();
        const p0 = un(G1).projet;
        await o.click(`tr[data-contact="${G1}"] [data-classer=projet]`);
        await o.keyboard.press('ArrowDown');
        await o.waitForTimeout(600);
        const pFleche = un(G1).projet;
        await o.keyboard.press('Enter');
        await o.waitForFunction(() => document.querySelector('[data-toast-texte]')?.textContent?.includes('touché'));
        const pEntree = un(G1).projet;
        await o.click('[data-toast-annuler]');
        await o.waitForFunction(() => document.querySelector('[data-toast-texte]')?.textContent?.includes('remis comme avant'));
        await attendre();
        constat(apresFleche === cat0 && affichee && apresEntree === affichee && un(G1).categorie_id === cat0 && pFleche === p0 && pEntree !== p0 && un(G1).projet === p0,
          `revue 18.6 : au clavier, une flèche dans la barre ou dans une cellule n'écrit rien, Entrée écrit (catégorie ${cat0} → ${apresEntree}, projet ${p0} → ${pEntree}), puis annulé`);
      }
      // Une seule ligne : projet puis température directement dans la cellule.
      await o.click(`tr[data-contact="${G3}"] [data-classer=projet]`);
      await o.selectOption(`tr[data-contact="${G3}"] select[data-liste=projet]`, 'vendeur');
      await o.waitForFunction((id) => document.querySelector(`tr[data-contact="${id}"]`)?.textContent?.includes('Vendeur'), G3);
      await o.click(`tr[data-contact="${G3}"] [data-classer=temperature]`);
      const choixTemp = await o.locator(`tr[data-contact="${G3}"] select[data-liste=temperature] option`).evaluateAll((t) => t.map((x) => x.value));
      await o.selectOption(`tr[data-contact="${G3}"] select[data-liste=temperature]`, 'tiede');
      await o.waitForFunction((id) => document.querySelector(`tr[data-contact="${id}"]`)?.textContent?.includes('Tiède'), G3);
      const g3 = un(G3);
      constat(g3.projet === 'vendeur' && g3.temperature === 'tiede' && choixTemp.includes('en_vente') && !choixTemp.includes('recherche_active') && !choixTemp.includes('avec_anne')
        && (await o.textContent('[data-toast-texte]')).startsWith('1 contact touché'),
        `18.6 : une seule ligne se classe dans sa cellule (projet puis température, choix permis seulement : ${choixTemp.join(', ')})`);
      constat(await o.locator(`tr[data-contact="${GP}"] [data-classer=temperature]`).count() === 0 && await o.locator(`tr[data-contact="${GP}"] [data-classer=projet]`).count() === 1,
        '18.6 : la température d\'un contact du suivi en cours ne se choisit pas dans le tableau (elle suit l\'étape)');
      // Écarter depuis la barre, puis faire revenir depuis le filtre « Écartés ».
      await o.click(caseDe(G3));
      await o.click('[data-lot-ecarter]');
      await o.waitForSelector(`tr[data-contact="${G3}"]`, { state: 'detached' });
      const ecarte = !!un(G3).ecarte_le;
      await o.selectOption('[data-filtre=etat]', 'ecarte:oui'); await attendre();
      const dansEcartes = (await ids()).includes(G3);
      await o.click(caseDe(G3));
      const libelle = await o.textContent('[data-lot-ecarter]');
      await o.click('[data-lot-ecarter]');
      await o.waitForSelector(`tr[data-contact="${G3}"]`, { state: 'detached' });
      await o.click('[data-retirer=ecarte]'); await attendre();
      constat(ecarte && dansEcartes && libelle === 'Faire revenir' && un(G3).ecarte_le === null && (await ids()).includes(G3),
        '18.6 : un contact écarté disparaît du tableau, se retrouve avec le filtre « Écartés » et en revient par « Faire revenir »');
      // Tout cocher : toutes les lignes affichées.
      await o.click('[data-tout]');
      const toutes = await cochees(), affichees = await ids();
      await o.screenshot({ path: path.join(OUT, 'espace-contacts-lot-1440.png') });
      await o.click('[data-lot-aucun]');
      constat(toutes.length === affichees.length && affichees.length >= 4 && (await cochees()).length === 0, `18.6 : la case d'en-tête coche toutes les lignes affichées (${toutes.length}) ; « Désélectionner » les décoche`);
    } else {
      await o.click(caseDe(G1)); await o.click(caseDe(G2));
      await o.screenshot({ path: path.join(OUT, `espace-contacts-lot-${largeur}.png`) });
    }
    constat(!(await o.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), `18.6 : page Contacts avec la barre d'actions à ${largeur} px : pas de débordement horizontal`);
    await ctx.close();
  }
  // Story 18.7 : fiche d'un contact (lecture, correction de chaque champ avec avant-image, note, contact hors séance) et
  // création à la main (doublon proposé, opposition), par /api/fiche ; puis le panneau et la fenêtre dans la page.
  const KVILLE7 = `Ficheville${NUM}`;
  const K1 = `01KF7A${NUM}${'0'.repeat(14)}`, KX = `01KF7B${NUM}${'0'.repeat(14)}`, KP = `01KF7C${NUM}${'0'.repeat(14)}`;
  const KT1 = `+33671${NUM}`, KTX = `+33672${NUM}`, KTP = `+33673${NUM}`, KEX2 = `secondaire${NUM}@example.com`;
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, categorie_id, projet, temperature, telephone, email) VALUES
       ('${K1}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Fanny <b>x</b>', 'Ficheun${NUM}', '${KVILLE7}', 'lointains', 'vendeur', 'froid', '${KT1}', 'fanny${NUM}@example.com')`);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, telephone) VALUES
       ('${KX}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Xavier', 'Fichedeux${NUM}', '${KVILLE7}', '${KTX}')`);
  sql(`INSERT INTO contact_coordonnee (contact_id, type, valeur, ajoute_le) VALUES ('${KX}', 'email', '${KEX2}', '2026-10-01T08:00:00Z')`);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, categorie_id, projet, temperature, telephone, etape, parcours, prochaine_action, prochaine_action_le) VALUES
       ('${KP}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Paul', 'Fichesuivi${NUM}', '${KVILLE7}', 'demandes_recues', 'vendeur', 'avec_anne', '${KTP}', 'premier_rdv', 'vendeur', 'Rappeler', '2026-12-01')`);
  const apiFiche = async (corps, { jeton = JETON, type = 'application/json', methode = 'POST', id = null } = {}) => {
    const x = await appeler(`${E}/api/fiche${id ? `?id=${id}` : ''}`, { method: methode, redirect: 'manual', headers: { 'cf-access-jwt-assertion': jeton, ...(methode === 'POST' ? { 'Content-Type': type } : {}), Origin: E }, body: methode === 'POST' ? (typeof corps === 'string' ? corps : JSON.stringify(corps)) : undefined });
    let d = null; try { d = await x.json(); } catch {}
    return { status: x.status, d };
  };
  const c7 = (id) => sql(`SELECT * FROM contact WHERE id = '${id}'`)[0];
  const dernierEv = (id) => { const e = sql(`SELECT type, source, texte, donnees, par FROM contact_evenement WHERE contact_id = '${id}' ORDER BY id DESC LIMIT 1`)[0]; return e ? { ...e, d: e.donnees ? JSON.parse(e.donnees) : null } : null; };
  const nEv7 = () => sql(`SELECT count(*) AS n FROM contact_evenement`)[0].n;
  {
    let x = await apiFiche(null, { methode: 'GET', id: K1 });
    constat(x.status === 200 && x.d.fiche.nom === `Ficheun${NUM}` && x.d.fiche.telephones[0] === KT1 && x.d.fiche.categorie === 'Relations lointaines' && x.d.fiche.appel_permis_categorie === false
      && Array.isArray(x.d.fiche.seances) && x.d.fiche.seances.length === 0 && x.d.fiche.etape === null,
      '18.7 : GET /api/fiche lit la fiche (coordonnées, catégorie et sa règle d\'appel, séances vides, hors suivi)');
    // Chaque champ corrigé, avec son avant-image (AD-29) ; une correction ne fait pas avancer last_activity_at.
    const champs = [
      ['prenom', 'Fanny', `Fanny <b>x</b>`, (c) => c.prenom === 'Fanny'],
      ['nom', `Fichecorrige${NUM}`, `Ficheun${NUM}`, (c) => c.nom === `Fichecorrige${NUM}`],
      ['entreprise', 'Boulangerie Essai', null, (c) => c.entreprise === 'Boulangerie Essai'],
      ['commune', `${KVILLE7}-sur-Léman`, KVILLE7, (c) => c.commune === `${KVILLE7}-sur-Léman`],
      ['categorie_id', 'proches', 'lointains', (c) => c.categorie_id === 'proches' && !!c.verifie_le],
      ['projet', 'vendeur_acheteur', 'vendeur', (c) => c.projet === 'vendeur_acheteur' && c.temperature === 'froid'],
      ['temperature', 'chaud', 'froid', (c) => c.temperature === 'chaud'],
      ['appel_autorise', false, null, (c) => c.appel_autorise === 0],
      ['a_rappeler_le', '2026-12-15', null, (c) => c.a_rappeler_le === '2026-12-15'],
    ];
    const bilan = [];
    for (const [cle, valeur, avant, verifier] of champs) {
      x = await apiFiche({ id: K1, corriger: { [cle]: valeur } });
      const ev = dernierEv(K1);
      const attenduAvant = cle === 'appel_autorise' ? null : avant;
      const ok = x.status === 200 && x.d.changes.includes(cle) && verifier(c7(K1)) && ev.type === 'classement' && ev.source === 'anne' && !!ev.par
        && JSON.stringify(ev.d.avant[cle]) === JSON.stringify(attenduAvant) && ev.d.apres[cle] !== undefined && !!ev.d.lot && x.d.ligne?.id === K1;
      bilan.push(`${cle} ${ok ? 'ok' : 'NON'}`);
    }
    constat(bilan.every((b) => b.endsWith('ok')) && c7(K1).last_activity_at === '2026-10-01T08:00:00Z',
      `18.7 : chaque champ de la fiche se corrige par /api/fiche avec son avant-image, sans toucher la date d'activité (${bilan.join(', ')})`);
    // Téléphones et e-mails multiples : le premier sur contact, les autres dans contact_coordonnee ; retrait d'un secondaire.
    const T1b = `06 74 ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4, 6)}`;
    x = await apiFiche({ id: K1, corriger: { telephones: [KT1, T1b], emails: [`fanny${NUM}@example.com`, `Autre${NUM}@Example.com`] } });
    const sec = sql(`SELECT type, valeur FROM contact_coordonnee WHERE contact_id = '${K1}' ORDER BY type, valeur`);
    const ev1 = dernierEv(K1);
    constat(x.status === 200 && sec.length === 2 && sec.some((s) => s.valeur === `+33674${NUM}`) && sec.some((s) => s.valeur === `autre${NUM}@example.com`)
      && JSON.stringify(ev1.d.avant.telephones) === JSON.stringify([KT1]) && ev1.d.apres.telephones.length === 2 && x.d.fiche.telephones.length === 2,
      '18.7 : plusieurs téléphones et e-mails (normalisés E.164 et en minuscules) : le premier sur la fiche, les autres en coordonnées, avant-image gardée');
    x = await apiFiche({ id: K1, corriger: { telephones: [`+33674${NUM}`] } });
    constat(x.status === 200 && c7(K1).telephone === `+33674${NUM}` && sql(`SELECT count(*) AS n FROM contact_coordonnee WHERE contact_id = '${K1}' AND type = 'telephone'`)[0].n === 0,
      '18.7 : un numéro secondaire devenu principal quitte les coordonnées secondaires, l\'ancien principal retiré disparaît');
    // Conflit : téléphone principal ou e-mail secondaire d'un autre contact → 409 avec ce contact, rien n'est écrit.
    const e0 = nEv7(), avantConflit = JSON.stringify(c7(K1));
    const k1 = await apiFiche({ id: K1, corriger: { telephones: [`+33674${NUM}`, KTX] } });
    const k2 = await apiFiche({ id: K1, corriger: { emails: [KEX2] } });
    constat(k1.status === 409 && k1.d.existant?.id === KX && k2.status === 409 && k2.d.existant?.id === KX && nEv7() === e0 && JSON.stringify(c7(K1)) === avantConflit,
      '18.7 : un téléphone ou un e-mail (même secondaire) d\'un autre contact est refusé avec ce contact (409), rien n\'est écrit');
    // Écarter et faire revenir depuis la fiche.
    x = await apiFiche({ id: K1, corriger: { ecarte: true } });
    const ecarte7 = !!c7(K1).ecarte_le;
    x = await apiFiche({ id: K1, corriger: { ecarte: false } });
    constat(ecarte7 && c7(K1).ecarte_le === null, '18.7 : la fiche écarte le contact et le fait revenir');
    // Note : un échange, la date d'activité avance.
    x = await apiFiche({ id: K1, note: 'Rappeler après les vacances <script>' });
    const evN = dernierEv(K1);
    constat(x.status === 200 && evN.type === 'note' && evN.texte === 'Rappeler après les vacances <script>' && c7(K1).last_activity_at > '2026-10-01T08:00:00Z' && evN.d.avant.last_activity_at === '2026-10-01T08:00:00Z',
      '18.7 : une note s\'ajoute à l\'historique (avant-image de la date d\'activité gardée)');
    // Contact hors séance : met à jour le dernier contact ; un contact plus ancien ne le remplace pas ; date future refusée.
    const auj7 = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());
    x = await apiFiche({ id: K1, contact: { jour: auj7, canal: 'rencontre', note: 'Croisée au marché' } });
    const apresContact = c7(K1), evC = dernierEv(K1);
    constat(x.status === 200 && x.d.remplace === true && apresContact.dernier_contact_canal === 'rencontre' && !!apresContact.dernier_contact_le && x.d.ligne.dernier_canal === 'rencontre'
      && evC.d.avant.dernier_contact_le === null && evC.d.apres.dernier_contact_canal === 'rencontre' && evC.texte.includes('Croisée au marché'),
      '18.7 : un contact fait hors séance (date, canal) met à jour le dernier contact, avec son avant-image');
    x = await apiFiche({ id: K1, contact: { jour: '2026-09-01', canal: 'appel' } });
    const futur = await apiFiche({ id: K1, contact: { jour: '2099-01-01', canal: 'appel' } });
    constat(x.status === 200 && x.d.remplace === false && c7(K1).dernier_contact_canal === 'rencontre' && dernierEv(K1).texte.includes('1 septembre 2026') && futur.status === 400,
      '18.7 : un contact plus ancien que le dernier connu est noté sans le remplacer ; une date future est refusée');
    // Contact du suivi : classé sans que l'étape bouge, température du suivi gardée, lien vers la fiche de suivi.
    x = await apiFiche({ id: KP, corriger: { projet: 'vendeur_acheteur', temperature: 'froid', appel_autorise: true } });
    const fp = c7(KP);
    constat(x.status === 200 && x.d.ignore === true && fp.etape === 'premier_rdv' && fp.prochaine_action_le === '2026-12-01' && fp.temperature === 'avec_anne' && fp.projet === 'vendeur_acheteur'
      && fp.appel_autorise === 1 && x.d.fiche.etape_libelle && x.d.fiche.en_cours === true,
      '18.7 : un contact du suivi des ventes se corrige sans que son étape ni sa température (« avec Anne ») bougent');
    // Accord e-mail par la fiche (module accord).
    x = await apiFiche({ id: K1, accord: 'oui' });
    const accordOk = x.status === 200 && x.d.fiche.accord.statut === 'accord' && !!c7(K1).email_accord_le;
    x = await apiFiche({ id: K1, accord: 'retirer' });
    constat(accordOk && x.d.fiche.accord.statut === 'sans_accord', '18.7 : l\'accord e-mail se note et se retire depuis la fiche');
    // Création à la main.
    const nomC = `Fichenouveau${NUM}`;
    x = await apiFiche({ creer: { prenom: 'Nina', nom: nomC, commune: KVILLE7, categorie_id: 'partenaires', projet: 'vendeur', temperature: 'tiede', note: 'Rencontrée au salon' } });
    const nc = x.d?.id ? c7(x.d.id) : null;
    constat(x.status === 201 && nc && !!nc.verifie_le && nc.etape === null && nc.canal === null && nc.categorie_id === 'partenaires' && nc.temperature === 'tiede'
      && sql(`SELECT source FROM contact_source WHERE contact_id = '${x.d.id}'`).map((s) => s.source).join() === 'saisie'
      && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${x.d.id}' AND type IN ('creation', 'note')`)[0].n === 2 && !('sources' in x.d.ligne) && (await appeler(`${E}/api/fiche?id=${x.d.id}`, { headers: avecJeton() }).then((y) => y.json())).fiche.sources.some((z) => z.source === 'saisie'),
      '18.7 : « + Nouveau contact » crée un contact vérifié, hors suivi, source « saisie à la main », avec sa note');
    const d1 = await apiFiche({ creer: { nom: 'Doublon', telephone: `07 74 ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4, 6)}`.replace(/^07/, '06'), categorie_id: 'proches' } });
    const d2 = await apiFiche({ creer: { nom: 'Doublon', email: KEX2.toUpperCase(), categorie_id: 'proches' } });
    constat(d1.status === 409 && d1.d.error.code === 'existant' && d1.d.existant.id === K1 && d2.status === 409 && d2.d.existant.id === KX && d2.d.existant.nom === `Xavier Fichedeux${NUM}`,
      '18.7 : un téléphone (saisi en 06…) ou un e-mail (même secondaire, en majuscules) déjà connu propose d\'ouvrir le contact existant (409)');
    const TO = `+33675${NUM}`;
    const empreinte = createHmac('sha256', 'essai').update(`opposition:${TO}`).digest('hex');
    sql(`INSERT INTO opposition (empreinte, le) VALUES ('${empreinte}', '2026-10-01T08:00:00Z') ON CONFLICT DO NOTHING`);
    const n0 = sql(`SELECT count(*) AS n FROM contact`)[0].n;
    const op = await apiFiche({ creer: { nom: 'Opposée', telephone: TO, categorie_id: 'proches' } });
    constat(op.status === 409 && op.d.error.code === 'opposition' && sql(`SELECT count(*) AS n FROM contact`)[0].n === n0,
      '18.7 : une personne qui a demandé l\'effacement (liste d\'opposition) n\'est pas recréée à la main (409)');
    // Refus : 400 hors vocabulaire, rien n'est écrit ; 403 sans jeton ou avec celui de Claude.
    const e1 = nEv7(), s1 = JSON.stringify(c7(K1));
    const refus = [
      ['champ inconnu', await apiFiche({ id: K1, corriger: { etape: 'vendu' } })],
      ['dernier contact', await apiFiche({ id: K1, corriger: { dernier_contact_le: '2026-10-01' } })],
      ['catégorie inconnue', await apiFiche({ id: K1, corriger: { categorie_id: 'rois' } })],
      ['température avec Anne', await apiFiche({ id: K1, corriger: { temperature: 'avec_anne' } })],
      ['date à rappeler invalide', await apiFiche({ id: K1, corriger: { a_rappeler_le: '2026-13-40' } })],
      ['téléphone invalide', await apiFiche({ id: K1, corriger: { telephones: ['12'] } })],
      ['11 téléphones', await apiFiche({ id: K1, corriger: { telephones: Array.from({ length: 11 }, (_, i) => `+3360000000${i}`) } })],
      ['tout vidé', await apiFiche({ id: K1, corriger: { nom: null, telephones: [], emails: [] } })],
      ['deux gestes', await apiFiche({ id: K1, note: 'a', contact: { jour: '2026-10-01', canal: 'appel' } })],
      ['canal inconnu', await apiFiche({ id: K1, contact: { jour: '2026-10-01', canal: 'pigeon' } })],
      ['note vide', await apiFiche({ id: K1, note: '  ' })],
      ['identifiant mal formé', await apiFiche({ id: "x' OR 1=1", note: 'a' })],
      ['création sans nom ni téléphone', await apiFiche({ creer: { prenom: 'Seul', email: `seul${NUM}@example.com`, categorie_id: 'proches' } })],
      ['création sans catégorie', await apiFiche({ creer: { nom: 'Sanscat' } })],
      ['création température sans objet', await apiFiche({ creer: { nom: 'Amb', categorie_id: 'proches', projet: 'ambassadeur', temperature: 'chaud' } })],
      ['corps qui n\'est pas du JSON', await apiFiche('id=x', { type: 'application/x-www-form-urlencoded' })],
    ];
    constat(refus.every(([, r]) => r.status === 400 && r.d?.ok === false) && nEv7() === e1 && JSON.stringify(c7(K1)) === s1,
      `18.7 : /api/fiche refuse toute valeur hors vocabulaire (400 : ${refus.map(([n, r]) => `${n} ${r.status}`).join(', ')}), rien n'est écrit`);
    const acces = [
      ['lecture sans jeton', await appeler(`${E}/api/fiche?id=${K1}`, { redirect: 'manual' })],
      ['écriture sans jeton', await appeler(`${E}/api/fiche`, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: K1, note: 'x' }) })],
      ['lecture avec le jeton de Claude', await apiFiche(null, { methode: 'GET', id: K1, jeton: JETON_CLAUDE })],
      ['note avec le jeton de Claude', await apiFiche({ id: K1, note: 'x' }, { jeton: JETON_CLAUDE })],
      ['création avec le jeton de Claude', await apiFiche({ creer: { nom: 'Pirate', categorie_id: 'proches' } }, { jeton: JETON_CLAUDE })],
    ];
    const inconnu7 = await apiFiche(null, { methode: 'GET', id: '01ARZ3NDEKTSV4RRFFQ69G5FAV' });
    constat(acces.every(([, r]) => r.status === 403) && inconnu7.status === 404 && nEv7() === e1,
      `18.7 : /api/fiche réservé à Anne et JB (${acces.map(([n, r]) => `${n} ${r.status}`).join(', ')}) ; contact inconnu 404`);
  }
  // Revue de code 18.7 : un accord vaut pour une adresse (accord noté retiré, accord du site « à reconfirmer ») ; une
  // coordonnée d'une personne en opposition est refusée à la correction (409).
  {
    const KA = `01KF7D${NUM}${'0'.repeat(14)}`, KB = `01KF7E${NUM}${'0'.repeat(14)}`, KO = `01KF7F${NUM}${'0'.repeat(14)}`;
    const MA = `accorda${NUM}@example.com`, MS = `accords${NUM}@example.com`, MB = `accordb${NUM}@example.com`, MB2 = `accordb2${NUM}@example.com`;
    sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, email, email_accord_le, email_accord_source, categorie_id) VALUES
         ('${KA}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Accordun${NUM}', '${MA}', '2026-10-01T08:00:00Z', 'anne', 'proches'),
         ('${KB}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Accorddeux${NUM}', '${MB}', NULL, NULL, 'proches'),
         ('${KO}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Opposun${NUM}', NULL, NULL, NULL, 'proches')`);
    sql(`INSERT INTO contact_coordonnee (contact_id, type, valeur, ajoute_le) VALUES ('${KA}', 'email', '${MS}', '2026-10-01T08:00:00Z')`);
    sql(`INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at, newsletter_opt_in_at, is_test, contact_id)
         VALUES ('LACC${NUM}', 'acc-r-${NUM}', '2026-10-02T08:00:00Z', '2026-10-02T08:00:00Z', 'fr', 'guide', '${MB}', '2026-10-02T08:00:00Z', '2026-10-02T08:00:00Z', 1, '${KB}')`);
    let a = await apiFiche(null, { methode: 'GET', id: KA }), b = await apiFiche(null, { methode: 'GET', id: KB });
    const avantA = a.d.fiche.accord.statut, avantB = b.d.fiche.accord.statut;
    // Le secondaire devient premier : l'accord noté par Anne ne suit pas.
    a = await apiFiche({ id: KA, corriger: { emails: [MS, MA] } });
    const evA = dernierEv(KA);
    // Nouvelle adresse sur un contact dont l'accord vient du site : à reconfirmer.
    b = await apiFiche({ id: KB, corriger: { emails: [MB2] } });
    const evB = dernierEv(KB);
    const tableauB = b.d?.ligne?.accord;
    constat(avantA === 'accord' && a.status === 200 && c7(KA).email === MS && c7(KA).email_accord_le === null && c7(KA).email_accord_source === null
      && a.d.fiche.accord.statut === 'sans_accord' && evA.d.email_change?.accord_note_retire === true && evA.d.email_change.avant === MA && evA.d.email_change.apres === MS
      && evA.texte.includes('à reconfirmer'),
      'revue 18.7 : le premier e-mail changé (un secondaire passé premier) retire l\'accord noté, par `accord`, et l\'événement le dit');
    constat(avantB === 'accord' && b.status === 200 && b.d.fiche.accord.statut === 'sans_accord' && b.d.fiche.accord.a_reconfirmer === true
      && evB.d.email_change?.accord_site_a_reconfirmer === true && tableauB === 'sans_accord',
      'revue 18.7 : l\'accord donné sur le site pour l\'ancienne adresse ne suit pas la nouvelle : la fiche dit « accord à reconfirmer », le tableau « sans accord »');
    // Opposition : un téléphone ou un e-mail d'une personne effacée est refusé à la correction.
    const TELO = `+33679${NUM}`, MAILO2 = `opposee${NUM}@example.com`;
    const hmacO = (v) => createHmac('sha256', 'essai').update(`opposition:${v}`).digest('hex');
    sql(`INSERT INTO opposition (empreinte, le) VALUES ('${hmacO(TELO)}', '2026-10-01T08:00:00Z'), ('${hmacO(MAILO2)}', '2026-10-01T08:00:00Z') ON CONFLICT DO NOTHING`);
    const e0 = nEv7();
    const o1 = await apiFiche({ id: KO, corriger: { telephones: [TELO] } });
    const o2 = await apiFiche({ id: KO, corriger: { emails: [MAILO2.toUpperCase()] } });
    constat(o1.status === 409 && o1.d?.error?.code === 'opposition' && o2.status === 409 && o2.d?.error?.code === 'opposition' && c7(KO).telephone === null && c7(KO).email === null && nEv7() === e0,
      'revue 18.7 : à la correction d\'une fiche, un téléphone ou un e-mail d\'une personne en opposition est refusé (409 « opposition »), rien n\'est écrit');
    sql(`DELETE FROM opposition WHERE empreinte IN ('${hmacO(TELO)}', '${hmacO(MAILO2)}')`);
    sql(`DELETE FROM lead WHERE id = 'LACC${NUM}'`);
    sql(`DELETE FROM contact WHERE id IN ('${KA}', '${KB}', '${KO}')`);
  }
  // Revue de code 18.8 : l'ancienne fiche (/contacts/fiche, « Modifier ») passe par carnet.corrigerFiche : l'accord ne suit
  // pas une adresse changée, une coordonnée d'une personne en opposition est refusée ; la saisie à la main (/ajouter) refuse
  // aussi l'opposition ; une demande du site faite avec une autre adresse ne donne pas l'accord pour celle du contact.
  {
    const KC = `01KF8C${NUM}${'0'.repeat(14)}`, KD = `01KF8D${NUM}${'0'.repeat(14)}`, KE8 = `01KF8E${NUM}${'0'.repeat(14)}`;
    const MC = `vieillec${NUM}@example.com`, MC2 = `nouvellec${NUM}@example.com`, MD = `vieilled${NUM}@example.com`, MD2 = `nouvelled${NUM}@example.com`;
    const MX = `autrex${NUM}@example.com`, MY = `contacty${NUM}@example.com`, TELY = `+33678${NUM}`;
    sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, telephone, email, etape, prochaine_action, prochaine_action_le, canal, email_accord_le, email_accord_source, categorie_id) VALUES
         ('${KC}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Fichec${NUM}', NULL, '${MC}', 'estimation', 'Rappeler', '${auj}', 'rencontre', '2026-10-01T08:00:00Z', 'anne', 'proches'),
         ('${KD}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Fiched${NUM}', NULL, '${MD}', 'estimation', 'Rappeler', '${auj}', 'rencontre', NULL, NULL, 'proches'),
         ('${KE8}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Fichee${NUM}', '${TELY}', '${MY}', NULL, NULL, NULL, NULL, NULL, NULL, 'proches')`);
    sql(`INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at, newsletter_opt_in_at, is_test, contact_id) VALUES
         ('LACD${NUM}', 'acc-d-${NUM}', '2026-10-02T08:00:00Z', '2026-10-02T08:00:00Z', 'fr', 'guide', '${MD}', '2026-10-02T08:00:00Z', '2026-10-02T08:00:00Z', 1, '${KD}'),
         ('LACX${NUM}', 'acc-x-${NUM}', '2026-10-02T08:00:00Z', '2026-10-02T08:00:00Z', 'fr', 'guide', '${MX}', '2026-10-02T08:00:00Z', '2026-10-02T08:00:00Z', 1, '${KE8}')`);
    const ancienne = (id, nom, email) => page(`/contacts/fiche?id=${id}`, { quoi: 'coordonnees', prenom: '', nom, telephone: '', email, commune: '', parcours: '', canal: 'rencontre', origine_detail: '' });
    const avantC = (await apiFiche(null, { methode: 'GET', id: KC })).d.fiche.accord.statut, avantD = (await apiFiche(null, { methode: 'GET', id: KD })).d.fiche.accord.statut;
    let x = await ancienne(KC, `Fichec${NUM}`, MC2);
    const evC = dernierEv(KC);
    constat(avantC === 'accord' && x.headers.get('location') === `/contacts/fiche?id=${KC}&m=modifie` && c7(KC).email === MC2 && c7(KC).email_accord_le === null
      && evC.type === 'classement' && evC.d.email_change?.accord_note_retire === true && evC.d.avant?.emails?.[0] === MC
      && (await apiFiche(null, { methode: 'GET', id: KC })).d.fiche.accord.statut === 'sans_accord',
      'revue 18.8 : l\'e-mail changé par l\'ancienne fiche passe par le carnet : l\'accord noté est retiré (événement « classement » avec avant-image)');
    x = await ancienne(KD, `Fiched${NUM}`, MD2);
    const fD = (await apiFiche(null, { methode: 'GET', id: KD })).d.fiche.accord;
    constat(avantD === 'accord' && x.headers.get('location') === `/contacts/fiche?id=${KD}&m=modifie` && c7(KD).email === MD2 && fD.statut === 'sans_accord' && fD.a_reconfirmer === true
      && dernierEv(KD).d.email_change?.accord_site_a_reconfirmer === true,
      'revue 18.8 : l\'accord donné sur le site pour l\'ancienne adresse ne suit pas l\'e-mail changé par l\'ancienne fiche (« à reconfirmer »)');
    const fE = (await apiFiche(null, { methode: 'GET', id: KE8 })).d.fiche.accord;
    constat(fE.statut === 'sans_accord',
      `revue 18.8 : une demande du site faite avec une autre adresse (case cochée, rattachée par le téléphone) ne donne pas l'accord pour l'adresse du contact (statut ${fE.statut})`);
    // Opposition : refusée par l'ancienne fiche et par la saisie à la main.
    const MAILO8 = `opposee8${NUM}@example.com`, TELO8 = `+33677${NUM}`;
    const hmac8 = (v) => createHmac('sha256', 'essai').update(`opposition:${v}`).digest('hex');
    sql(`INSERT INTO opposition (empreinte, le) VALUES ('${hmac8(MAILO8)}', '2026-10-01T08:00:00Z'), ('${hmac8(TELO8)}', '2026-10-01T08:00:00Z') ON CONFLICT DO NOTHING`);
    const n8 = () => sql(`SELECT count(*) AS n FROM contact_evenement`)[0].n;
    const e8 = n8();
    x = await ancienne(KC, `Fichec${NUM}`, MAILO8);
    const hO = await x.text();
    const avantAjout = sql(`SELECT count(*) AS n FROM contact`)[0].n;
    const aj = await page('/ajouter', { quoi: 'contact', prenom: 'Oppo', nom: `Ajout${NUM}`, telephone: TELO8, canal: 'rencontre', parcours: 'vendeur' });
    const hA = await aj.text();
    constat(x.status === 200 && /demandé l(&#39;|')effacement/.test(hO) && c7(KC).email === MC2 && n8() === e8
      && aj.status === 200 && /effacement/.test(hA) && sql(`SELECT count(*) AS n FROM contact`)[0].n === avantAjout,
      'revue 18.8 : un e-mail d\'une personne en opposition est refusé par l\'ancienne fiche, et un téléphone en opposition par la saisie à la main : rien n\'est écrit');
    sql(`DELETE FROM opposition WHERE empreinte IN ('${hmac8(MAILO8)}', '${hmac8(TELO8)}')`);
    sql(`DELETE FROM lead WHERE id IN ('LACD${NUM}', 'LACX${NUM}')`);
    sql(`DELETE FROM contact WHERE id IN ('${KC}', '${KD}', '${KE8}')`);
  }
  // La page : le nom ouvre le panneau ; corriger, noter, contact hors séance ; « + Nouveau contact » et doublon proposé.
  for (const largeur of [1440, 1280]) {
    const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const o = await ctx.newPage();
    await o.goto(`${E}/`);
    const attendre = () => o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
    await attendre();
    await o.fill('[data-recherche]', `fichedeux${NUM}`); await o.waitForTimeout(300); await attendre();
    await o.evaluate(() => { window.__marque = 'meme-page'; });
    await o.click(`tr[data-contact="${KX}"] [data-ouvrir-fiche]`);
    await o.waitForSelector('[data-fiche-form]');
    const titre = await o.textContent('#fc-titre');
    const url7 = new URL(o.url()).searchParams.get('fiche');
    if (largeur === 1440) {
      await o.fill('[data-fiche-form] input[name=commune]', `${KVILLE7}-Plage`);
      await o.click('[data-fiche-enregistrer]');
      await o.waitForSelector('[data-fiche-message]');
      const msg = await o.textContent('[data-fiche-message]');
      const ligneTxt = await o.locator(`tr[data-contact="${KX}"]`).innerText();
      constat(titre === `Xavier Fichedeux${NUM}` && url7 === KX && msg.startsWith('Fiche enregistrée') && c7(KX).commune === `${KVILLE7}-Plage` && ligneTxt.includes(`${KVILLE7}-Plage`)
        && (await o.evaluate(() => window.__marque)) === 'meme-page',
        '18.7 : un clic sur le nom ouvre la fiche dans un panneau (adresse « ?fiche= »), une correction s\'enregistre et la ligne du tableau suit sans recharger');
      await o.fill('[data-fiche-note] textarea', 'Note depuis le panneau');
      await o.click('[data-fiche-note] button[type=submit]');
      await o.waitForFunction(() => document.querySelector('[data-fiche-historique]')?.textContent?.includes('Note depuis le panneau'));
      await o.selectOption('[data-fiche-contact] select[name=canal]', 'whatsapp');
      await o.click('[data-fiche-contact] button[type=submit]');
      await o.waitForFunction(() => document.querySelector('[data-fiche-dernier-texte]')?.textContent?.includes('WhatsApp'));
      const ligne2 = await o.locator(`tr[data-contact="${KX}"]`).innerText();
      constat(c7(KX).dernier_contact_canal === 'whatsapp' && ligne2.includes('WhatsApp'), '18.7 : dans le panneau, une note et un contact hors séance s\'enregistrent ; le dernier contact du tableau suit');
      // Téléphone pris par un autre contact : message et lien vers sa fiche.
      await o.fill('[data-fiche-form] [data-liste-telephone] input', telLisible(`+33674${NUM}`));
      await o.click('[data-fiche-enregistrer]');
      await o.waitForSelector('[data-fiche-message] [data-ouvrir]');
      await o.screenshot({ path: path.join(OUT, 'espace-fiche-panneau-conflit-1440.png') });
      await o.click('[data-fiche-message] [data-ouvrir]');
      await o.waitForFunction((n) => document.querySelector('#fc-titre')?.textContent === n, `Fanny Fichecorrige${NUM}`);
      constat(c7(KX).telephone === KTX && await o.locator('[data-fiche-historique] script').count() === 0 && (await o.textContent('[data-fiche-historique]')).includes('<script>'),
        '18.7 : un numéro déjà pris est refusé dans le panneau avec « Ouvrir la fiche de … » ; le texte d\'une note reste du texte');
      await o.screenshot({ path: path.join(OUT, 'espace-fiche-panneau-1440.png') });
      await o.click('[data-fiche-fermer]');
      // « + Nouveau contact » : doublon proposé, puis création.
      await o.click('[data-nouveau-contact]');
      await o.fill('[data-creation] input[name=nom]', 'Essai doublon');
      await o.fill('[data-creation] input[name=telephone]', telLisible(KTX));
      await o.screenshot({ path: path.join(OUT, 'espace-nouveau-contact-1440.png') });
      await o.click('[data-creation] button[type=submit]');
      await o.waitForSelector('[data-ouvrir-existant]');
      await o.click('[data-ouvrir-existant]');
      await o.waitForFunction((n) => document.querySelector('#fc-titre')?.textContent === n, `Xavier Fichedeux${NUM}`);
      await o.click('[data-fiche-fermer]');
      await o.click('[data-nouveau-contact]');
      await o.fill('[data-creation] input[name=prenom]', 'Noé');
      await o.fill('[data-creation] input[name=nom]', `Fichepage${NUM}`);
      await o.fill('[data-creation] input[name=commune]', KVILLE7);
      await o.click('[data-creation] button[type=submit]');
      await o.waitForFunction(() => document.querySelector('[data-toast-texte]')?.textContent?.includes('ajouté aux contacts'));
      await o.fill('[data-recherche]', `fichepage${NUM}`); await o.waitForTimeout(300); await attendre();
      constat(await o.locator('[data-lignes] tr[data-contact]').count() === 1 && sql(`SELECT count(*) AS n FROM contact WHERE nom = 'Fichepage${NUM}' AND verifie_le IS NOT NULL`)[0].n === 1,
        '18.7 : « + Nouveau contact » propose la fiche existante pour un numéro connu, puis crée un contact qui apparaît dans le tableau sans recharger');
    } else {
      await o.screenshot({ path: path.join(OUT, `espace-fiche-panneau-${largeur}.png`) });
      constat(titre === `Xavier Fichedeux${NUM}`, `18.7 : fiche ouverte à ${largeur} px`);
    }
    constat(!(await o.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), `18.7 : page Contacts avec le panneau à ${largeur} px : pas de débordement horizontal`);
    await ctx.close();
  }
  // Lien direct : /?fiche=<id> ouvre la page avec la fiche ouverte.
  {
    const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const o = await ctx.newPage();
    await o.goto(`${E}/?fiche=${KP}`);
    await o.waitForSelector('[data-fiche-suivi-lien]');
    constat((await o.getAttribute('[data-fiche-suivi-lien]', 'href')) === `/contacts/fiche?id=${KP}` && await o.isDisabled('[data-fiche-form] input[disabled]'),
      '18.7 : /?fiche=… ouvre la fiche ; un contact du suivi garde le lien vers sa fiche de suivi, sa température n\'est pas modifiable');
    await o.screenshot({ path: path.join(OUT, 'espace-fiche-suivi-1280.png') });
    await ctx.close();
  }
  await bloc1818();
  await bloc1819();
  await bloc1820();
  // Story 18.8 : catégories et méthodes, par /api/categories puis dans la page /categories. Les catégories de départ sont
  // remises comme avant à la fin (nom, ordre, méthode), les catégories d'essai retirées (marque « E188 » dans le nom).
  const ancienne8 = sql(`SELECT id FROM categorie WHERE nom LIKE '%E188%'`).map((c) => `'${c.id}'`).join(',');
  if (ancienne8) { sql(`DELETE FROM contact WHERE categorie_id IN (${ancienne8})`); sql(`DELETE FROM categorie WHERE id IN (${ancienne8})`); }
  const departs8 = sql(`SELECT id, nom, ordre, canal_conseille, demande, appel_permis, envoi_groupe_permis FROM categorie ORDER BY id`);
  const apiCat = async (corps, { jeton = JETON, type = 'application/json', methode = 'POST' } = {}) => {
    const x = await appeler(`${E}/api/categories`, { method: methode, redirect: 'manual', headers: { 'cf-access-jwt-assertion': jeton, ...(methode === 'POST' ? { 'Content-Type': type } : {}), Origin: E }, body: methode === 'POST' ? (typeof corps === 'string' ? corps : JSON.stringify(corps)) : undefined });
    let d = null; try { d = await x.json(); } catch {}
    return { status: x.status, d };
  };
  const reglagesAccueil = async () => {
    const h = await (await appeler(`${E}/`, { headers: avecJeton() })).text();
    return JSON.parse(/<script type="application\/json" id="ct-reglages">([\s\S]*?)<\/script>/.exec(h)?.[1] ?? '{}');
  };
  const C8A = `01KF8A${NUM}${'0'.repeat(14)}`, C8B = `01KF8B${NUM}${'0'.repeat(14)}`;
  const NOM8 = `Voisins <i>E188</i> ${NUM}`;
  let cat8 = null, vue8 = null;
  try {
    // Les six méthodes de départ (PRD FR-12, question 1 tranchée par JB le 01/11 à 21 h 47).
    let x = await apiCat(null, { methode: 'GET' });
    const parId = Object.fromEntries((x.d?.categories ?? []).map((c) => [c.id, c]));
    const attendu8 = { anciens_clients: [true, 'accord_ou_client'], proches: [true, 'non'], edb: [false, 'accord_ou_client'], partenaires: [true, 'accord_ou_client'], lointains: [false, 'non'], demandes_recues: [true, 'accord_ou_client'] };
    constat(x.status === 200 && Object.entries(attendu8).every(([id, [appel, envoi]]) => parId[id]?.appel_permis === appel && parId[id]?.envoi_groupe === envoi && parId[id].gardee === (id === 'demandes_recues') && parId[id].canal_conseille && parId[id].demande)
      && parId.proches.nom === 'Proches' && parId.edb.nom === 'Rencontrés à l\'EDB' && typeof parId.proches.contacts === 'number',
      '18.8 : les six méthodes de départ sont celles du PRD (appel permis pour proches, anciens clients, partenaires et demandes reçues ; non permis pour l\'EDB et les relations lointaines ; envoi groupé sauf proches et lointains), avec leur nombre de contacts');

    // Ajouter.
    x = await apiCat({ ajouter: { nom: `  ${NOM8}  ` } });
    cat8 = x.d?.id;
    const ajoutee = x.d?.categories?.find((c) => c.id === cat8);
    constat(x.status === 201 && /^[0-9A-HJKMNP-TV-Z]{26}$/.test(cat8 ?? '') && ajoutee?.nom === NOM8 && !ajoutee.gardee && ajoutee.contacts === 0 && !ajoutee.appel_permis && ajoutee.envoi_groupe === 'non'
      && x.d.categories.at(-1).id === cat8,
      '18.8 : une catégorie s\'ajoute (identifiant ULID, en dernière position, sans appel ni envoi groupé, aucun contact)');
    const doublon8 = await apiCat({ ajouter: { nom: NOM8.toUpperCase().replace('VOISINS', 'VOÏSINS') } });
    constat(doublon8.status === 409 && doublon8.d?.error?.code === 'existe', '18.8 : un nom déjà pris (à la casse et aux accents près) est refusé (409)');

    // Deux contacts dans la catégorie (un écarté) et une vue qui la cite.
    sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, categorie_id) VALUES
         ('${C8A}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Victor', 'Voisinun${NUM}', '+33681${NUM}', '${cat8}')`);
    sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, categorie_id, ecarte_le) VALUES
         ('${C8B}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Vera', 'Voisindeux${NUM}', '+33682${NUM}', '${cat8}', '2026-10-05T08:00:00Z')`);
    const rv = await appeler(`${E}/api/vues`, { method: 'POST', headers: avecJeton(JETON, { 'Content-Type': 'application/json' }), body: JSON.stringify({ nom: `Vue E188 ${NUM}`, filtre: { categorie_id: [cat8], verifie: 'non' } }) });
    vue8 = (await rv.json()).vue?.id;

    // Renommer : ni les contacts, ni la vue, ni l'historique ne bougent ; l'identifiant reste.
    const contacts8 = () => JSON.stringify(sql(`SELECT * FROM contact WHERE id IN ('${C8A}', '${C8B}') ORDER BY id`));
    const vueBase8 = () => JSON.stringify(sql(`SELECT * FROM vue WHERE id = '${vue8}'`));
    const ev8 = () => sql(`SELECT count(*) AS n FROM contact_evenement`)[0].n;
    const proches8 = () => JSON.stringify(sql(`SELECT id, categorie_id, verifie_le FROM contact WHERE categorie_id = 'proches' ORDER BY id`));
    const avant8 = [contacts8(), vueBase8(), ev8(), proches8()];
    x = await apiCat({ id: cat8, renommer: `Voisins renommés E188 ${NUM}` });
    const y = await apiCat({ id: 'proches', renommer: 'Proches et amis' });
    const regl8 = await reglagesAccueil();
    const vueLue8 = regl8.vues?.find((v) => v.id === vue8);
    constat(x.status === 200 && y.status === 200 && x.d.categories.find((c) => c.id === cat8)?.nom === `Voisins renommés E188 ${NUM}` && x.d.categories.find((c) => c.id === cat8)?.contacts === 2
      && x.d.categories.find((c) => c.id === cat8)?.ecartes === 1
      && JSON.stringify([contacts8(), vueBase8(), ev8(), proches8()]) === JSON.stringify(avant8)
      && vueLue8 && !vueLue8.invalide && vueLue8.filtre.categorie_id?.[0] === cat8 && regl8.categories.find((c) => c.id === 'proches')?.nom === 'Proches et amis',
      '18.8 : renommer (une catégorie ajoutée, puis « Proches ») ne change ni les contacts, ni la vue qui la cite, ni l\'historique ; l\'identifiant reste et le tableau montre le nouveau nom');
    const renomDoublon = await apiCat({ id: cat8, renommer: 'proches ET AMIS' });
    constat(renomDoublon.status === 409, '18.8 : renommer vers le nom d\'une autre catégorie est refusé (409)');
    await apiCat({ id: 'proches', renommer: 'Proches' });

    // Méthode et messages types.
    const m8 = { canal_conseille: 'Mot dans la boîte aux lettres', demande: 'Recommander Anne', appel_permis: true, envoi_groupe: 'accord_ou_client',
      messages: [{ nom: 'Bonjour', texte: 'Bonjour {prénom}, je suis votre voisine.' }, { nom: 'Relance', texte: 'Re-bonjour {prénom} !' }] };
    x = await apiCat({ id: cat8, methode: m8 });
    let k8 = sql(`SELECT * FROM categorie WHERE id = '${cat8}'`)[0];
    let msgs8 = sql(`SELECT * FROM message_type WHERE categorie_id = '${cat8}' ORDER BY ordre`);
    constat(x.status === 200 && k8.canal_conseille === m8.canal_conseille && k8.demande === m8.demande && k8.appel_permis === 1 && k8.envoi_groupe_permis === 1
      && msgs8.length === 2 && msgs8[0].nom === 'Bonjour' && msgs8[0].texte === m8.messages[0].texte && msgs8[1].ordre === 2
      && x.d.categories.find((c) => c.id === cat8)?.messages.length === 2,
      '18.8 : la méthode s\'enregistre (canal conseillé, demande, appel permis, envoi groupé avec accord) avec ses messages types dans l\'ordre');
    const id1 = msgs8[0].id;
    x = await apiCat({ id: cat8, methode: { ...m8, appel_permis: false, envoi_groupe: 'non', messages: [{ nom: 'Troisième', texte: 'Salut {prénom}' }, { id: id1, nom: 'Bonjour', texte: 'Bonjour {prénom}, texte revu.' }] } });
    k8 = sql(`SELECT * FROM categorie WHERE id = '${cat8}'`)[0];
    msgs8 = sql(`SELECT * FROM message_type WHERE categorie_id = '${cat8}' ORDER BY ordre`);
    constat(x.status === 200 && k8.appel_permis === 0 && k8.envoi_groupe_permis === 0 && msgs8.length === 2 && msgs8[0].nom === 'Troisième' && msgs8[1].id === id1 && msgs8[1].texte === 'Bonjour {prénom}, texte revu.',
      '18.8 : un message type modifié garde son identifiant, un message retiré de la liste disparaît, un nouveau s\'ajoute ; l\'ordre suit la liste');

    // Envoi groupé hors règle (FR-13, AD-21) : seules « non » et « accord_ou_client » existent.
    const s8 = () => JSON.stringify([sql(`SELECT * FROM categorie ORDER BY id`), sql(`SELECT * FROM message_type ORDER BY id`)]);
    const etat8 = s8();
    const horsRegle = [
      ['tous', await apiCat({ id: cat8, methode: { ...m8, envoi_groupe: 'tous' } })],
      ['sans accord', await apiCat({ id: 'proches', methode: { ...m8, envoi_groupe: 'sans_accord' } })],
      ['vrai', await apiCat({ id: cat8, methode: { ...m8, envoi_groupe: true } })],
      ['oui', await apiCat({ id: 'lointains', methode: { ...m8, envoi_groupe: 'oui' } })],
    ];
    constat(horsRegle.every(([, r]) => r.status === 400 && /accord/.test(r.d?.error?.message ?? '')) && s8() === etat8,
      `18.8 : un envoi groupé qui irait au-delà des contacts avec accord ou anciens clients est refusé (400 : ${horsRegle.map(([n, r]) => `${n} ${r.status}`).join(', ')}), rien n'est écrit`);

    // Valeurs hors vocabulaire : 400, rien n'est écrit.
    const msgAutre = sql(`SELECT id FROM message_type WHERE categorie_id <> '${cat8}' LIMIT 1`)[0]?.id ?? '01ARZ3NDEKTSV4RRFFQ69G5FAV';
    const refus8 = [
      ['champ inconnu', await apiCat({ id: cat8, couleur: 'rouge' })],
      ['deux gestes', await apiCat({ id: cat8, renommer: 'X', retirer: true })],
      ['nom vide', await apiCat({ ajouter: { nom: '   ' } })],
      ['nom trop long', await apiCat({ ajouter: { nom: 'x'.repeat(41) } })],
      ['ajout avec un champ en plus', await apiCat({ ajouter: { nom: 'Ok', ordre: 1 } })],
      ['identifiant mal formé', await apiCat({ id: "x' OR 1=1", renommer: 'X' })],
      ['méthode incomplète', await apiCat({ id: cat8, methode: { canal_conseille: 'x' } })],
      ['appel « oui »', await apiCat({ id: cat8, methode: { ...m8, appel_permis: 'oui' } })],
      ['champ inconnu dans la méthode', await apiCat({ id: cat8, methode: { ...m8, priorite: 1 } })],
      ['11 messages', await apiCat({ id: cat8, methode: { ...m8, messages: Array.from({ length: 11 }, (_, i) => ({ nom: `M${i}`, texte: 't' })) } })],
      ['champ {nom} dans un message', await apiCat({ id: cat8, methode: { ...m8, messages: [{ nom: 'A', texte: 'Bonjour {nom}' }] } })],
      ['message sans texte', await apiCat({ id: cat8, methode: { ...m8, messages: [{ nom: 'A', texte: ' ' }] } })],
      ['deux messages de même nom', await apiCat({ id: cat8, methode: { ...m8, messages: [{ nom: 'A', texte: 'x' }, { nom: 'a', texte: 'y' }] } })],
      ['message d\'une autre catégorie', await apiCat({ id: cat8, methode: { ...m8, messages: [{ id: msgAutre, nom: 'Vol', texte: 'x' }] } })],
      ['ordre incomplet', await apiCat({ ordre: ['proches', 'edb'] })],
      ['retirer « oui »', await apiCat({ id: cat8, retirer: 'oui' })],
      ['corps qui n\'est pas du JSON', await apiCat('id=x', { type: 'application/x-www-form-urlencoded' })],
    ];
    // Revue de code 18.8 : un ordre incomplet répond 409 avec la liste à jour (la liste a pu changer ailleurs).
    constat(refus8.every(([n, r]) => r.status === (n === 'ordre incomplet' ? 409 : 400) && r.d?.ok === false) && s8() === etat8,
      `18.8 : /api/categories refuse toute valeur hors vocabulaire (400, 409 pour l'ordre incomplet : ${refus8.map(([n, r]) => `${n} ${r.status}`).join(', ')}), rien n'est écrit`);
    const acces8 = [
      ['lecture sans jeton', await appeler(`${E}/api/categories`, { redirect: 'manual' })],
      ['écriture sans jeton', await appeler(`${E}/api/categories`, { method: 'POST', redirect: 'manual', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ajouter: { nom: 'Pirate' } }) })],
      ['lecture avec le jeton de Claude', await apiCat(null, { methode: 'GET', jeton: JETON_CLAUDE })],
      ['ajout avec le jeton de Claude', await apiCat({ ajouter: { nom: 'Pirate E188' } }, { jeton: JETON_CLAUDE })],
      ['retrait avec le jeton de Claude', await apiCat({ id: cat8, retirer: true }, { jeton: JETON_CLAUDE })],
      ['page avec le jeton de Claude', await appeler(`${E}/categories`, { redirect: 'manual', headers: avecJeton(JETON_CLAUDE) })],
    ];
    const inconnue8 = await apiCat({ id: '01ARZ3NDEKTSV4RRFFQ69G5FAV', renommer: 'X' });
    constat(acces8.every(([, r]) => r.status === 403) && inconnue8.status === 404 && s8() === etat8,
      `18.8 : /api/categories et la page réservés à Anne et JB (${acces8.map(([n, r]) => `${n} ${r.status}`).join(', ')}) ; catégorie inconnue 404`);

    // Ordre.
    const ordre8 = x.d.categories.map((c) => c.id);
    const inverse8 = [ordre8[1], ordre8[0], ...ordre8.slice(2)];
    x = await apiCat({ ordre: inverse8 });
    constat(x.status === 200 && JSON.stringify(x.d.categories.map((c) => c.id)) === JSON.stringify(inverse8), '18.8 : l\'ordre des catégories se change (les deux premières échangées)');
    await apiCat({ ordre: ordre8 });
    // Revue de code 18.8 : un ordre qui ne cite plus chaque catégorie (liste changée ailleurs) est refusé avec la liste à jour.
    x = await apiCat({ ordre: ordre8.slice(1) });
    constat(x.status === 409 && x.d?.error?.code === 'ordre' && JSON.stringify(x.d.categories?.map((c) => c.id)) === JSON.stringify(ordre8),
      'revue 18.8 : un ordre refusé (catégorie ajoutée ou retirée ailleurs) renvoie la liste à jour (409), que la page redessine');

    // Retirer : refusé tant qu'il reste un contact (écarté compris) sans catégorie où les ranger, et pour « Demandes reçues » (story 18.15), puis accepté.
    x = await apiCat({ id: cat8, retirer: true });
    const gardee8 = await apiCat({ id: 'demandes_recues', retirer: true });
    constat(x.status === 409 && x.d?.error?.code === 'pas_vide' && x.d.contacts === 2 && /choisissez où/.test(x.d.error.message) && gardee8.status === 409 && gardee8.d?.error?.code === 'gardee'
      && sql(`SELECT count(*) AS n FROM categorie WHERE id IN ('${cat8}', 'demandes_recues')`)[0].n === 2,
      '18.8 : retirer une catégorie qui a des contacts sans dire où les ranger est refusé avec leur nombre (409, écartés compris) ; « Demandes reçues » ne se retire pas (409 gardee)');
    const deplace8 = await appeler(`${E}/api/carnet`, { method: 'POST', headers: avecJeton(JETON, { 'Content-Type': 'application/json' }), body: JSON.stringify({ ids: [C8A], changements: { categorie_id: 'proches' } }) });
    x = await apiCat({ id: cat8, retirer: true });
    const unReste = x.status === 409 && x.d.contacts === 1;
    sql(`UPDATE contact SET categorie_id = 'lointains' WHERE id = '${C8B}'`);
    x = await apiCat({ id: cat8, retirer: true });
    const regl8b = await reglagesAccueil();
    const vueApres8 = regl8b.vues?.find((v) => v.id === vue8);
    constat(deplace8.status === 200 && unReste && x.status === 200 && !x.d.categories.some((c) => c.id === cat8) && sql(`SELECT count(*) AS n FROM message_type WHERE categorie_id = '${cat8}'`)[0].n === 0
      && vueApres8?.invalide === 'une catégorie a disparu' && JSON.stringify(vueApres8.filtre) === '{}',
      '18.8 : une fois vide, la catégorie se retire avec ses messages types ; la vue qui la citait est marquée « à refaire » et ne montre plus aucun contact');
    cat8 = null;

    // Story 18.15 (ticket 240) : une catégorie de départ se retire en rangeant ses contacts (écartés compris) ailleurs.
    // `partenaires` est retirée puis remise telle qu'elle était (ses lignes, ses messages types, ses contacts) pour ne rien changer aux essais suivants.
    {
      const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
      const insere = (table, l) => sql(`INSERT INTO ${table} (${Object.keys(l).join(', ')}) VALUES (${Object.values(l).map(q).join(', ')})`);
      const ligneP = sql(`SELECT * FROM categorie WHERE id = 'partenaires'`)[0];
      const msgsP = sql(`SELECT * FROM message_type WHERE categorie_id = 'partenaires'`);
      const dejaP = sql(`SELECT id FROM contact WHERE categorie_id = 'partenaires'`).map((c) => c.id);
      const ecartsAvant = sql(`SELECT id, categorie_id, ecarte_le, verifie_le FROM contact WHERE id IN ('${C8A}', '${C8B}')`);
      const dest = await apiCat({ ajouter: { nom: `Destination ${NUM}` } });
      const dest8 = dest.d.id;
      sql(`UPDATE contact SET categorie_id = 'partenaires' WHERE id = '${C8A}'`);
      // Revue de code 18.15 : C8B est « à vérifier » ; le retrait le range sans le marquer vérifié (`sansVerifier`).
      sql(`UPDATE contact SET categorie_id = 'partenaires', ecarte_le = '2026-10-05T08:00:00Z', verifie_le = NULL WHERE id = '${C8B}'`);
      const nP = dejaP.length + 2 - (dejaP.includes(C8A) ? 1 : 0) - (dejaP.includes(C8B) ? 1 : 0);
      const sansDest = await apiCat({ id: 'partenaires', retirer: true });
      const soi = await apiCat({ id: 'partenaires', retirer: true, ranger_dans: 'partenaires' });
      const inconnue = await apiCat({ id: 'partenaires', retirer: true, ranger_dans: '01KF8Z00000000000000000000' });
      const melange = await apiCat({ id: 'partenaires', renommer: 'Autre', ranger_dans: dest8 });
      const gardee = await apiCat({ id: 'demandes_recues', retirer: true, ranger_dans: dest8 });
      const intactAvant = sql(`SELECT count(*) AS n FROM categorie WHERE id = 'partenaires'`)[0].n === 1;
      const ok = await apiCat({ id: 'partenaires', retirer: true, ranger_dans: dest8 });
      const dedans = sql(`SELECT id, ecarte_le, verifie_le FROM contact WHERE categorie_id = '${dest8}'`);
      const evs = sql(`SELECT donnees FROM contact_evenement WHERE contact_id = '${C8B}' AND type = 'classement' ORDER BY id DESC LIMIT 1`).map((e) => JSON.parse(e.donnees));
      constat(sansDest.status === 409 && sansDest.d?.error?.code === 'pas_vide' && sansDest.d.contacts === nP
        && soi.status === 400 && inconnue.status === 404 && melange.status === 400 && gardee.status === 409 && gardee.d?.error?.code === 'gardee' && intactAvant
        && ok.status === 200 && !ok.d.categories.some((c) => c.id === 'partenaires')
        && sql(`SELECT count(*) AS n FROM categorie WHERE id = 'partenaires'`)[0].n === 0 && sql(`SELECT count(*) AS n FROM message_type WHERE categorie_id = 'partenaires'`)[0].n === 0
        && dedans.length === nP && dedans.some((c) => c.id === C8B && c.ecarte_le && c.verifie_le === null) && evs[0]?.avant?.categorie_id === 'partenaires' && evs[0]?.apres?.categorie_id === dest8,
        '18.15 : une catégorie de départ (partenaires) se retire en rangeant ses contacts, écartés compris, dans une autre (événement avec avant-image), sans marquer vérifié ; ranger_dans = elle-même, inconnue ou avec un autre geste est refusé, « Demandes reçues » reste gardée');
      // Remise en l'état.
      insere('categorie', ligneP);
      for (const m of msgsP) insere('message_type', m);
      sql(`UPDATE contact SET categorie_id = 'partenaires' WHERE categorie_id = '${dest8}' AND id IN (${dejaP.map(q).join(', ')})`);
      for (const c of ecartsAvant) sql(`UPDATE contact SET categorie_id = ${q(c.categorie_id)}, ecarte_le = ${q(c.ecarte_le)}, verifie_le = ${q(c.verifie_le)} WHERE id = '${c.id}'`);
      await apiCat({ id: dest8, retirer: true });
    }

    // La page : liste, aperçu d'un message type, enregistrement, renommage, retrait refusé puis accepté.
    x = await apiCat({ ajouter: { nom: NOM8 } });
    cat8 = x.d.id;
    sql(`UPDATE contact SET categorie_id = '${cat8}' WHERE id = '${C8B}'`);
    for (const largeur of [1440, 1280]) {
      const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
      const o = await ctx.newPage();
      o.on('dialog', (d) => d.accept());
      await o.goto(`${E}/`);
      await o.click('[data-outils] summary');
      const lienMenu = await o.getAttribute('[data-outil=categories]', 'href');
      const lienBloc = await o.getAttribute('[data-gerer-categories]', 'href');
      await o.goto(`${E}/categories?id=${cat8}`);
      await o.waitForSelector('[data-liste][data-pret]', { state: 'attached' });
      const nLignes = await o.locator('[data-liste] li').count();
      const titre8 = await o.textContent('#cm-titre');
      if (largeur === 1440) {
        constat(lienMenu === '/categories' && lienBloc === '/categories' && nLignes === sql('SELECT count(*) AS n FROM categorie')[0].n && titre8 === NOM8
          && await o.locator('#cm-titre i').count() === 0 && (await o.textContent('[data-compte]')).startsWith('1 contact (dont 1 écarté)'),
          '18.8 : « Catégories et méthodes » s\'ouvre depuis « Autres outils » et depuis la page Contacts ; la page liste chaque catégorie, le nom montré en texte, avec son nombre de contacts');
        await o.click('[data-ajouter-msg]');
        await o.fill('[data-msg] [name=msg-nom]', 'Bienvenue');
        await o.fill('[data-msg] [name=msg-texte]', 'Bonjour , ');
        await o.click('[data-msg] [name=msg-texte]');
        await o.evaluate(() => { const t = document.querySelector('[data-msg] [name=msg-texte]'); t.setSelectionRange(8, 8); });
        await o.click('[data-msg] [data-inserer]');
        await o.press('[data-msg] [name=msg-texte]', 'End');
        await o.type('[data-msg] [name=msg-texte]', 'bienvenue <b>dans</b> le quartier.');
        const apercu8 = await o.textContent('[data-msg] [data-apercu]');
        await o.fill('[data-methode] [name=canal_conseille]', 'Mot dans la boîte');
        await o.click('[data-methode] label:has(input[name=appel][value=oui]) span');
        await o.click('[data-methode] label:has(input[name=envoi][value=accord_ou_client]) span');
        await o.screenshot({ path: path.join(OUT, 'espace-categories-1440.png'), fullPage: true });
        await o.click('[data-enregistrer]');
        await o.waitForFunction(() => document.querySelector('[data-message]')?.textContent === 'Méthode enregistrée.');
        const k = sql(`SELECT * FROM categorie WHERE id = '${cat8}'`)[0], m = sql(`SELECT * FROM message_type WHERE categorie_id = '${cat8}'`);
        constat(apercu8 === 'Bonjour Claire, bienvenue <b>dans</b> le quartier.' && await o.locator('[data-apercu] b').count() === 0
          && k.canal_conseille === 'Mot dans la boîte' && k.appel_permis === 1 && k.envoi_groupe_permis === 1 && m.length === 1 && m[0].texte === 'Bonjour {prénom}, bienvenue <b>dans</b> le quartier.',
          `18.8 : dans la page, « Insérer {prénom} » et l'aperçu avec un prénom d'exemple (« ${apercu8} », en texte) ; la méthode et le message s'enregistrent`);
        await o.fill('[data-renommer] [name=nom]', `Voisins du lac E188 ${NUM}`);
        await o.click('[data-renommer] button[type=submit]');
        await o.waitForFunction(() => document.querySelector('[data-message]')?.textContent?.startsWith('Catégorie renommée'));
        const nomListe = await o.textContent(`[data-categorie="${cat8}"] .cm-nom`);
        await o.click('[data-retirer]');
        await o.waitForSelector('[data-message].erreur');
        const refusPage = await o.textContent('[data-message]');
        await o.screenshot({ path: path.join(OUT, 'espace-categories-retrait-refuse-1440.png') });
        constat(nomListe === `Voisins du lac E188 ${NUM}` && sql(`SELECT categorie_id FROM contact WHERE id = '${C8B}'`)[0].categorie_id === cat8 && /Choisissez d.abord la catégorie/.test(refusPage)
          && sql(`SELECT count(*) AS n FROM categorie WHERE id = '${cat8}'`)[0].n === 1,
          '18.8 : dans la page, un renommage s\'affiche dans la liste sans toucher au contact ; « Retirer » sur une catégorie non vide sans catégorie de destination choisie affiche un message clair et rien n\'est retiré');
        sql(`UPDATE contact SET categorie_id = 'lointains' WHERE id = '${C8B}'`);
        await o.reload();
        await o.waitForSelector('[data-liste][data-pret]', { state: 'attached' });
        await o.click('[data-retirer]');
        await o.waitForFunction(() => document.querySelector('[data-message]')?.textContent?.includes('retirée'));
        constat(sql(`SELECT count(*) AS n FROM categorie WHERE id = '${cat8}'`)[0].n === 0 && !(await o.locator(`[data-categorie="${cat8}"]`).count()),
          '18.8 : dans la page, une catégorie vide se retire (après confirmation) et quitte la liste');
        cat8 = null;
        // Ordre par les flèches : la deuxième monte, puis redescend.
        const avantFl = sql('SELECT id FROM categorie ORDER BY ordre, nom, id').map((c) => c.id);
        await o.click('[data-monter="1"]');
        await o.waitForFunction(() => document.querySelector('[data-message]')?.textContent === 'Ordre enregistré.');
        const apresFl = sql('SELECT id FROM categorie ORDER BY ordre, nom, id').map((c) => c.id);
        await o.click('[data-descendre="0"]');
        await o.waitForFunction((id) => document.querySelector('[data-liste] li')?.getAttribute('data-categorie') === id, avantFl[0]);
        constat(apresFl[0] === avantFl[1] && apresFl[1] === avantFl[0] && JSON.stringify(sql('SELECT id FROM categorie ORDER BY ordre, nom, id').map((c) => c.id)) === JSON.stringify(avantFl),
          '18.8 : dans la page, les flèches changent l\'ordre des catégories');
        await o.click(`[data-choisir="demandes_recues"]`);
        await o.waitForFunction(() => document.querySelector('.cm-ligne.actif')?.getAttribute('data-categorie') === 'demandes_recues');
        constat(await o.isDisabled('[data-retirer]') && await o.isChecked('[data-methode] input[name=appel][value=oui]') && await o.isChecked('[data-methode] input[name=envoi][value=accord_ou_client]'),
          '18.8 / 18.15 : « Demandes reçues » montre sa méthode, et son bouton « Retirer » est désactivé (la seule catégorie gardée)');
      }
      await o.screenshot({ path: path.join(OUT, `espace-categories-depart-${largeur}.png`), fullPage: true });
      constat(!(await o.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), `18.8 : page Catégories à ${largeur} px : pas de débordement horizontal`);
      await ctx.close();
    }
  } finally {
    sql(`DELETE FROM contact WHERE id IN ('${C8A}', '${C8B}')`);
    if (vue8) sql(`DELETE FROM vue WHERE id = '${vue8}'`);
    const restes8 = sql(`SELECT id FROM categorie WHERE nom LIKE '%E188%'`).map((c) => `'${c.id}'`).join(',');
    if (restes8) sql(`DELETE FROM categorie WHERE id IN (${restes8})`);
    for (const k of departs8) {
      sql(`UPDATE categorie SET nom = '${k.nom.replace(/'/g, "''")}', ordre = ${k.ordre}, canal_conseille = '${(k.canal_conseille ?? '').replace(/'/g, "''")}', demande = '${(k.demande ?? '').replace(/'/g, "''")}', appel_permis = ${k.appel_permis}, envoi_groupe_permis = ${k.envoi_groupe_permis} WHERE id = '${k.id}'`);
    }
  }
  // Story 18.11 : la barre « Nouveaux » (site et Leedflow), par /api/nouveaux puis dans la page. Une demande du site, quatre
  // numéros inconnus vus par Leedflow (dont un déjà porté par un contact du carnet, un en opposition) ; chaque geste,
  // son annulation, un numéro ajouté à une fiche qui ne revient plus.
  {
    const nv = async (corps, { jeton = JETON, type = 'application/json', methode = 'POST' } = {}) => {
      const rr = await appeler(`${E}/api/nouveaux`, methode === 'GET' ? { headers: avecJeton(jeton) }
        : { method: 'POST', headers: avecJeton(jeton, { 'Content-Type': type }), body: typeof corps === 'string' ? corps : JSON.stringify(corps) });
      return { status: rr.status, d: await rr.json().catch(() => ({})) };
    };
    const cartesNv = async () => (await nv(null, { methode: 'GET' })).d.cartes ?? [];
    const ligneNv = (id) => sql(`SELECT * FROM nouveau WHERE id = '${id}'`)[0];
    // Une demande du site (formulaire de contact, avec un message).
    const MSG11 = `Bonjour, je voudrais vendre mon T3 à Évian ${NUM} <b>vite</b>`;
    const s11 = sid();
    await poster('contact', { submission_id: s11, prenom: 'Sophie', nom: `Nouveaux${NUM}`, email: `sophie+nv${NUM}@example.com`, telephone: `0658${NUM}11`.slice(0, 10), message: MSG11, projet: 'vente' });
    let lead11 = null;
    for (let i = 0; i < 40 && !(lead11 = sql(`SELECT id, contact_id FROM lead WHERE submission_id = '${s11}' AND contact_id IS NOT NULL`)[0]); i++) await pause(250);
    const NS = sql(`SELECT n.id FROM nouveau n JOIN contact_evenement e ON e.id = n.evenement_id WHERE e.source = 'site' AND e.source_id = '${lead11?.id}'`)[0]?.id;
    const KS = lead11?.contact_id;
    let cartes = await cartesNv();
    const cs = cartes.find((c) => c.id === NS);
    if (!cs || cs.texte !== MSG11) console.log('Détail 18.11 :', NS, JSON.stringify(cs ?? null));
    constat(!!cs && cs.origine === 'Site' && cs.titre === 'Demande de contact' && cs.nom === `Sophie Nouveaux${NUM}` && cs.texte === MSG11 && cs.contact_id === KS
      && JSON.stringify(cs.gestes) === '["ranger","vu","ecarter"]',
      '18.11 : une demande du site arrive dans « Nouveaux » avec sa source, son nom, ses coordonnées et son message ; gestes Ranger, Vu, Écarter');
    // Vu, puis annulation, puis double geste.
    let x = await nv({ id: NS, geste: 'vu' });
    const vu1 = ligneNv(NS);
    constat(x.status === 200 && vu1.issue === 'vu' && !!vu1.vu_le && !(await cartesNv()).some((c) => c.id === NS), '18.11 : « Vu » sort la demande de la liste (vu_le et issue posés)');
    x = await nv({ id: NS, geste: 'vu' });
    constat(x.status === 409 && x.d.error?.code === 'traitee', '18.11 : un second geste sur une demande déjà traitée est refusé (409)');
    x = await nv({ annuler: NS });
    constat(x.status === 200 && ligneNv(NS).vu_le === null && ligneNv(NS).issue === null && (await cartesNv()).some((c) => c.id === NS), '18.11 : « Vu » s\'annule tout de suite, la demande revient');
    // Écarter, avec l'avant-image du carnet, puis annulation.
    x = await nv({ id: NS, geste: 'ecarter' });
    const evEc = sql(`SELECT donnees FROM contact_evenement WHERE contact_id = '${KS}' AND type = 'classement' ORDER BY id DESC LIMIT 1`)[0];
    constat(x.status === 200 && !!c7(KS).ecarte_le && ligneNv(NS).issue === 'ecarte' && JSON.parse(evEc.donnees).nouveau === NS && JSON.parse(evEc.donnees).avant.ecarte_le === null && x.d.ligne?.ecarte === true,
      '18.11 : « Écarter » écarte le contact par le carnet (avant-image gardée), la ligne du tableau suit');
    x = await nv({ annuler: NS });
    constat(x.status === 200 && c7(KS).ecarte_le === null && ligneNv(NS).vu_le === null && x.d.ligne?.ecarte === false, '18.11 : « Écarter » s\'annule : le contact revient, la demande aussi');
    // Ranger : la carte sort, le contact est renvoyé pour ouvrir sa fiche.
    x = await nv({ id: NS, geste: 'ranger' });
    constat(x.status === 200 && x.d.contact_id === KS && ligneNv(NS).issue === 'range' && x.d.ligne?.id === KS, '18.11 : « Ranger » sort la demande et renvoie le contact dont la page ouvre la fiche');
    x = await nv({ annuler: NS });
    constat(x.status === 200 && ligneNv(NS).vu_le === null, '18.11 : « Ranger » s\'annule');
    // Trop tard pour annuler : au-delà de dix minutes.
    await nv({ id: NS, geste: 'vu' });
    sql(`UPDATE nouveau SET vu_le = '${new Date(Date.now() - 11 * 60_000).toISOString()}' WHERE id = '${NS}'`);
    x = await nv({ annuler: NS });
    constat(x.status === 409 && x.d.error?.code === 'tard' && !!ligneNv(NS).vu_le, '18.11 : après dix minutes, l\'annulation depuis la barre est refusée');
    sql(`UPDATE nouveau SET vu_le = NULL, issue = NULL WHERE id = '${NS}'`);

    // Numéros inconnus de Leedflow. NV_A : inconnu (deux appels, une seule carte) ; NV_B : numéro d'un contact du carnet
    // hors suivi ; NV_C : à ignorer ; NV_D : personne en opposition.
    const NV_A = `+33761${NUM}`, NV_B = `+33762${NUM}`, NV_C = `+33763${NUM}`, NV_D = `+33764${NUM}`;
    const KB = `01KFNB${NUM}${'0'.repeat(14)}`;
    sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, categorie_id, projet) VALUES ('${KB}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Bruno', 'Carnet${NUM}', '${NV_B}', 'lointains', 'a_qualifier')`);
    sql(`INSERT INTO opposition (empreinte, le) VALUES ('${createHmac('sha256', 'essai').update(`opposition:${NV_D}`).digest('hex')}', '2026-10-01T00:00:00Z') ON CONFLICT DO NOTHING`);
    const t11 = Date.now();
    LF.appels.push(
      { id: `nva1-${NUM}`, created: t11 - 9 * 60_000, customer: NV_A, direction: 'inbound', duration: 130, missed: false, transcription: '## Résumé\n- Cherche à **vendre** une maison à Publier', id_contact: `lfnva-${NUM}` },
      { id: `nva2-${NUM}`, created: t11 - 8 * 60_000, customer: NV_A, direction: 'inbound', duration: 0, missed: true, transcription: null, id_contact: `lfnva-${NUM}` },
      { id: `nvb1-${NUM}`, created: t11 - 7 * 60_000, customer: NV_B, direction: 'inbound', duration: 60, missed: false, transcription: 'Rappelle au sujet de l\'estimation', id_contact: `lfnvb-${NUM}` },
      { id: `nvc1-${NUM}`, created: t11 - 6 * 60_000, customer: NV_C, direction: 'inbound', duration: 30, missed: false, transcription: 'Appel personnel <script>' },
      { id: `nvd1-${NUM}`, created: t11 - 5 * 60_000, customer: NV_D, direction: 'inbound', duration: 30, missed: false, transcription: 'Veut acheter' },
    );
    LF.contacts[`lfnva-${NUM}`] = { id: `lfnva-${NUM}`, firstname: 'Amel', lastname: `Leedflow${NUM}`, email: `amel+${NUM}@example.com`, phone: NV_A };
    await releve();
    const nvDe = (tel) => sql(`SELECT n.id FROM nouveau n JOIN leedflow_inconnu i ON i.source_id = n.leedflow_inconnu_id WHERE n.source = 'leedflow' AND n.vu_le IS NULL AND i.telephone = '${tel}'`);
    const [NA, NB, NC, ND] = [NV_A, NV_B, NV_C, NV_D].map((t) => nvDe(t));
    constat(NA.length === 1 && NB.length === 1 && NC.length === 1 && ND.length === 1, '18.11 : la relève écrit une ligne « Nouveaux » par numéro inconnu, une seule pour deux appels du même numéro');
    await releve();
    constat(nvDe(NV_A).length === 1, '18.11 : une seconde relève n\'en écrit pas d\'autre');
    cartes = await cartesNv();
    const ca = cartes.find((c) => c.id === NA[0]?.id), cb = cartes.find((c) => c.id === NB[0]?.id);
    constat(!!ca && ca.origine === 'Leedflow' && ca.telephone === NV_A && ca.nom === `Amel Leedflow${NUM}` && ca.connu === null && JSON.stringify(ca.gestes) === '["ajouter","ignorer"]'
      && ca.echanges === 2 && ca.prerempli?.email === `amel+${NUM}@example.com`,
      '18.11 : un numéro inconnu montre le nom lu dans Leedflow, ses échanges, et propose Ajouter aux contacts ou Ignorer');
    constat(!!cb && cb.connu?.id === KB && JSON.stringify(cb.gestes) === '["rattacher","ignorer"]' && cb.texte.includes('estimation'),
      '18.11 : un numéro déjà porté par un contact du carnet propose « Ajouter à sa fiche » et nomme ce contact');
    // Ignorer, annuler, ignorer.
    x = await nv({ id: NC[0].id, geste: 'ignorer' });
    const ecC = sql(`SELECT categorie, a FROM leedflow_ecarte WHERE telephone = '${NV_C}'`)[0];
    constat(x.status === 200 && ecC?.categorie === 'prive' && ecC.a === ligneNv(NC[0].id).vu_le && sql(`SELECT count(*) AS n FROM leedflow_inconnu WHERE telephone = '${NV_C}'`)[0].n === 1,
      '18.11 : « Ignorer » classe le numéro « privé » ; ses échanges restent le temps de l\'annulation');
    x = await nv({ annuler: NC[0].id });
    constat(x.status === 200 && !sql(`SELECT 1 FROM leedflow_ecarte WHERE telephone = '${NV_C}'`).length && (await cartesNv()).some((c) => c.id === NC[0].id && c.texte.includes('<script')),
      '18.11 : « Ignorer » s\'annule : le numéro revient à trier, sa carte avec son résumé');
    await nv({ id: NC[0].id, geste: 'ignorer' });
    sql(`UPDATE leedflow_ecarte SET a = '2026-01-01T00:00:00Z' WHERE telephone = '${NV_C}'`);
    await appeler(`${E}/cdn-cgi/handler/scheduled`);
    for (let i = 0; i < 40 && sql(`SELECT count(*) AS n FROM leedflow_inconnu WHERE telephone = '${NV_C}'`)[0].n; i++) await pause(250);
    constat(sql(`SELECT count(*) AS n FROM leedflow_inconnu WHERE telephone = '${NV_C}'`)[0].n === 0, '18.11 : après le délai d\'annulation, la tâche planifiée efface les échanges du numéro ignoré');
    // Story 18.13 : « Ajouter à sa fiche » complète seulement les champs VIDES (prénom, nom, e-mail), sans accord e-mail, et s'annule.
    const NV_E = `+33765${NUM}`, NV_F = `+33766${NUM}`;
    const KE = `01KFNE${NUM}${'0'.repeat(14)}`, KF = `01KFNF${NUM}${'0'.repeat(14)}`;
    sql(`INSERT INTO contact (id, created_at, last_activity_at, telephone, categorie_id, projet) VALUES ('${KE}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', '${NV_E}', 'lointains', 'a_qualifier')`);
    sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, email, categorie_id, projet) VALUES ('${KF}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Fanny', 'Remplie${NUM}', '${NV_F}', 'fanny+${NUM}@example.com', 'lointains', 'a_qualifier')`);
    LF.appels.push(
      { id: `nve1-${NUM}`, created: Date.now() - 4 * 60_000, customer: NV_E, direction: 'inbound', duration: 50, missed: false, transcription: 'Veut une estimation', id_contact: `lfnve-${NUM}` },
      { id: `nvf1-${NUM}`, created: Date.now() - 3 * 60_000, customer: NV_F, direction: 'inbound', duration: 50, missed: false, transcription: 'Rappelle', id_contact: `lfnvf-${NUM}` },
    );
    LF.contacts[`lfnve-${NUM}`] = { id: `lfnve-${NUM}`, firstname: 'Eva', lastname: `Leedflow${NUM}`, email: `eva+${NUM}@example.com`, phone: NV_E };
    LF.contacts[`lfnvf-${NUM}`] = { id: `lfnvf-${NUM}`, firstname: 'Autre', lastname: 'Nom', email: 'autre@example.com', phone: NV_F };
    await releve();
    const [NE] = nvDe(NV_E), [NF] = nvDe(NV_F);
    x = await nv({ id: NE.id, geste: 'rattacher' });
    let ke = c7(KE);
    constat(x.status === 200 && ke.prenom === 'Eva' && ke.nom === `Leedflow${NUM}` && ke.email === `eva+${NUM}@example.com` && ke.email_accord_le === null && ke.etape === 'a_qualifier',
      '18.13 : « Ajouter à sa fiche » complète prénom, nom et e-mail vides avec ceux de Leedflow, sans aucun accord e-mail');
    x = await nv({ id: NF.id, geste: 'rattacher' });
    const kf = c7(KF);
    constat(x.status === 200 && kf.prenom === 'Fanny' && kf.nom === `Remplie${NUM}` && kf.email === `fanny+${NUM}@example.com`,
      '18.13 : « Ajouter à sa fiche » n\'écrase jamais un prénom, un nom ou un e-mail déjà remplis');
    x = await nv({ annuler: NE.id });
    ke = c7(KE);
    constat(x.status === 200 && ke.prenom === null && ke.nom === null && ke.email === null && ke.etape === null && ligneNv(NE.id).vu_le === null,
      '18.13 : l\'annulation du geste remet vides le prénom, le nom et l\'e-mail complétés');
    await nv({ id: NE.id, geste: 'ignorer' }); // la carte ne reste pas dans la barre pour la suite
    // Ajouter à sa fiche, annuler, refaire.
    x = await nv({ id: NB[0].id, geste: 'rattacher' });
    let kb = c7(KB);
    const ecB = sql(`SELECT categorie, contact_id FROM leedflow_ecarte WHERE telephone = '${NV_B}'`)[0];
    constat(x.status === 200 && x.d.contact_id === KB && ecB?.categorie === 'prospect' && ecB.contact_id === KB && kb.etape === 'a_qualifier' && kb.suivi_le === null && kb.categorie_id === 'lointains',
      '18.11 : « Ajouter à sa fiche » classe le numéro « prospect » avec ce contact, qui entre dans le suivi (suivi_le NULL : son historique sera repris)');
    x = await nv({ annuler: NB[0].id });
    kb = c7(KB);
    constat(x.status === 200 && kb.etape === null && kb.prochaine_action === null && !sql(`SELECT 1 FROM leedflow_ecarte WHERE telephone = '${NV_B}'`).length && ligneNv(NB[0].id).vu_le === null,
      '18.11 : « Ajouter à sa fiche » s\'annule : contact remis au carnet, numéro remis à trier');
    x = await nv({ id: NB[0].id, geste: 'rattacher' });
    // Le numéro ne revient plus : un nouvel appel va sur la fiche, sans nouvelle carte ; passé le délai d'annulation,
    // les échanges gardés rejoignent l'historique du contact.
    LF.appels.push({ id: `nvb2-${NUM}`, created: Date.now() - 60_000, customer: NV_B, direction: 'inbound', duration: 40, missed: false, transcription: 'Confirme le rendez-vous' });
    await releve();
    constat(sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${KB}' AND source_id = 'appel:nvb2-${NUM}'`)[0].n === 1 && nvDe(NV_B).length === 0
      && !(await cartesNv()).some((c) => c.telephone === NV_B),
      '18.11 : un numéro ajouté à une fiche ne revient plus dans « Nouveaux » ; son nouvel appel va sur la fiche');
    sql(`UPDATE leedflow_ecarte SET a = '2026-01-01T00:00:00Z' WHERE telephone = '${NV_B}'`);
    await releve();
    constat(sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${KB}' AND source_id = 'appel:nvb1-${NUM}'`)[0].n === 1
      && sql(`SELECT count(*) AS n FROM leedflow_inconnu WHERE telephone = '${NV_B}'`)[0].n === 0,
      '18.11 : passé le délai d\'annulation, l\'appel d\'avant rejoint l\'historique du contact');
    // Ajouter aux contacts : saisie refusée, création, annulation (contact supprimé), création.
    x = await nv({ id: NA[0].id, geste: 'ajouter', saisie: { nom: 'X', telephone: '0600000000', categorie_id: 'demandes_recues' } });
    constat(x.status === 400, '18.11 : « Ajouter aux contacts » refuse un autre numéro que celui de la carte (400)');
    x = await nv({ id: NA[0].id, geste: 'ajouter', saisie: { prenom: 'Amel', nom: `Leedflow${NUM}`, email: `amel+${NUM}@example.com`, categorie_id: 'demandes_recues', projet: 'vendeur' } });
    const KA = x.d.contact_id;
    let ka = KA ? c7(KA) : null;
    constat(x.status === 200 && ka?.telephone === NV_A && ka.etape === 'a_qualifier' && ka.categorie_id === 'demandes_recues' && ka.projet === 'vendeur' && ka.temperature === 'avec_anne' && !!ka.verifie_le
      && sql(`SELECT source FROM contact_source WHERE contact_id = '${KA}'`).map((s) => s.source).join() === 'leedflow'
      && sql(`SELECT contact_id FROM leedflow_ecarte WHERE telephone = '${NV_A}' AND categorie = 'prospect'`)[0]?.contact_id === KA && x.d.ligne?.id === KA,
      '18.11 : « Ajouter aux contacts » crée le contact par le carnet (vérifié, source Leedflow, suivi), numéro classé « prospect » avec lui');
    x = await nv({ annuler: NA[0].id });
    constat(x.status === 200 && x.d.supprime === KA && !c7(KA) && !sql(`SELECT 1 FROM leedflow_ecarte WHERE telephone = '${NV_A}'`).length && ligneNv(NA[0].id).vu_le === null,
      '18.11 : « Ajouter aux contacts » s\'annule : le contact créé est supprimé, le numéro revient à trier');
    // Opposition : la personne a demandé l'effacement, le contact n'est pas créé, la carte reste.
    x = await nv({ id: ND[0].id, geste: 'ajouter', saisie: { nom: `Opposee${NUM}`, categorie_id: 'demandes_recues' } });
    constat(x.status === 409 && x.d.error?.code === 'opposition' && ligneNv(ND[0].id).vu_le === null && !sql(`SELECT 1 FROM contact WHERE telephone = '${NV_D}'`).length,
      '18.11 : « Ajouter aux contacts » refuse une personne en opposition ; la carte reste');
    // Contrôles de la route.
    const refusClaude = await nv({ id: NS, geste: 'vu' }, { jeton: JETON_CLAUDE });
    const getClaude = await nv(null, { methode: 'GET', jeton: JETON_CLAUDE });
    constat(refusClaude.status === 403 && getClaude.status === 403 && (await nv({ id: NS, geste: 'effacer' })).status === 400 && (await nv('id=x', { type: 'application/x-www-form-urlencoded' })).status === 400
      && (await nv({ id: NS, geste: 'vu', saisie: {} })).status === 400 && (await nv({ id: NS, geste: 'vu', x: 'x'.repeat(21_000) })).status === 413 && ligneNv(NS).vu_le === null,
      '18.11 : /api/nouveaux refuse le jeton de Claude (403), un geste inconnu, un formulaire, un champ en trop (400) et un corps trop grand (413)');

    // La page : la barre, ses cartes, un geste et son annulation, à 1440 et 1280 px.
    for (const largeur of [1440, 1280]) {
      const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
      const o = await ctx.newPage();
      await o.goto(`${E}/`);
      const n0 = Number(await o.textContent('[data-nv-compte]'));
      constat(n0 >= 3 && await o.isHidden('[data-nv-liste]') && (await o.textContent('[data-nv-src]')).includes('Site'), `18.11 : à ${largeur} px, la barre repliée donne le nombre de demandes (${n0}) et leurs sources`);
      await o.click('[data-nv-barre]');
      await o.waitForSelector(`[data-nv-carte="${NS}"]`);
      constat(await o.locator('[data-nv-liste] script').count() === 0, `18.11 : à ${largeur} px, un clic déroule les cartes ; un résumé reste du texte`);
      await o.locator(`[data-nv-carte="${NS}"]`).scrollIntoViewIfNeeded();
      await o.screenshot({ path: path.join(OUT, `espace-nouveaux-${largeur}.png`) });
      await o.click(`[data-nv-carte="${NS}"] [data-nv-geste=vu]`);
      await o.waitForSelector(`[data-nv-carte="${NS}"]`, { state: 'detached' });
      const n1 = Number(await o.textContent('[data-nv-compte]'));
      await o.click('[data-toast-annuler]');
      await o.waitForSelector(`[data-nv-carte="${NS}"]`);
      constat(n1 === n0 - 1 && Number(await o.textContent('[data-nv-compte]')) === n0 && ligneNv(NS).vu_le === null, `18.11 : à ${largeur} px, « Vu » sort la carte, « Annuler » la fait revenir`);
      if (largeur === 1440) {
        // Ajouter aux contacts depuis la page : la fenêtre de création s'ouvre préremplie, numéro non modifiable.
        await o.click(`[data-nv-carte="${NA[0].id}"] [data-nv-geste=ajouter]`);
        await o.waitForSelector('[data-creation][open]');
        const pre = { prenom: await o.inputValue('[data-creation] input[name=prenom]'), tel: await o.inputValue('[data-creation] input[name=telephone]'), lecture: await o.getAttribute('[data-creation] input[name=telephone]', 'readonly'), accord: await o.isVisible('[data-creation] input[name=accord]') };
        await o.screenshot({ path: path.join(OUT, `espace-nouveaux-ajouter-${largeur}.png`) });
        await o.click('[data-creation] button[type=submit]');
        await o.waitForSelector(`[data-nv-carte="${NA[0].id}"]`, { state: 'detached' });
        const kaPage = sql(`SELECT contact_id FROM leedflow_ecarte WHERE telephone = '${NV_A}'`)[0]?.contact_id;
        constat(pre.prenom === 'Amel' && pre.tel.replace(/\s/g, '') === `07${NV_A.slice(4)}` && pre.lecture !== null && !pre.accord && !!kaPage && (await o.locator(`tr[data-contact="${kaPage}"]`).count()) <= 1,
          '18.11 : « Ajouter aux contacts » ouvre la création préremplie (nom Leedflow, numéro non modifiable, sans case d\'accord), le contact est créé');
      }
      constat(!(await o.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), `18.11 : page Contacts avec la barre ouverte à ${largeur} px : pas de débordement horizontal`);
      await ctx.close();
    }
  }
  // Story 18.12 : les demandes des portails par e-mail, injectées dans le gestionnaire `email` du Worker par l'adresse locale
  // de wrangler (/cdn-cgi/handler/email). E-mails fictifs : notification Modelo d'une demande Leboncoin (texte,
  // quoted-printable, sujet encodé), e-mail de SeLoger (HTML en base64, tableau) qui complète un contact du carnet, e-mail
  // illisible, confirmation du transfert Gmail, personne en opposition, doublon, expéditeur refusé.
  {
    const A = 'demandes@entrant.annevialtissot.fr';
    const qp = (t) => Array.from(Buffer.from(t, 'utf8'), (o) => (o > 126 || o === 61 ? `=${o.toString(16).toUpperCase().padStart(2, '0')}` : String.fromCharCode(o))).join('');
    const b64 = (t) => Buffer.from(t, 'utf8').toString('base64').replace(/.{76}/g, '$&\r\n');
    const sujetEnc = (t) => `=?UTF-8?B?${Buffer.from(t, 'utf8').toString('base64')}?=`;
    // L'expéditeur d'enveloppe : celui du transfert automatique de la Gmail d'Anne (réglage PORTAILS_EXPEDITEUR_AUTORISE),
    // sauf pour la confirmation de Gmail, envoyée par Google lui-même, ou quand l'essai en donne un autre.
    const TRANSFERT = `anne.essai+caf_=demandes=entrant.annevialtissot.fr@example.com`;
    const recevoir = async (de, brut, enveloppe) => {
      const env = enveloppe ?? (de === 'forwarding-noreply@google.com' ? de : TRANSFERT);
      const r = await appeler(`${E}/cdn-cgi/handler/email?from=${encodeURIComponent(env)}&to=${encodeURIComponent(A)}`, { method: 'POST', body: brut });
      // wrangler répond 200 « Worker successfully processed email », ou 400 avec la raison du rejet.
      const t = await r.text();
      return { status: r.status, outcome: r.ok ? 'ok' : 'rejete', raison: t };
    };
    // Revue externe 18.12 : en tête, le contrôle SPF que Cloudflare ajoute pour l'expéditeur d'enveloppe (gmail.com).
    const SPF_PASS = 'Authentication-Results: mx.cloudflare.net; spf=pass smtp.mailfrom=gmail.com; dkim=pass';
    const enTete = (de, sujet, id, type, enc, spf = SPF_PASS) => [...(spf ? [spf] : []), `From: ${de}`, `To: ${A}`, `Subject: ${sujet}`, `Message-ID: <${id}@essai.example>`, 'Date: Mon, 02 Nov 2026 09:12:00 +0100', 'MIME-Version: 1.0',
      ...(type ? [`Content-Type: ${type}`] : []), ...(enc ? [`Content-Transfer-Encoding: ${enc}`] : [])].join('\r\n');
    const nvP = async () => {
      const rr = await appeler(`${E}/api/nouveaux`, { headers: avecJeton() });
      return (await rr.json().catch(() => ({}))).cartes ?? [];
    };
    const gesteP = async (corps) => {
      const rr = await appeler(`${E}/api/nouveaux`, { method: 'POST', headers: avecJeton(JETON, { 'Content-Type': 'application/json' }), body: JSON.stringify(corps) });
      return { status: rr.status, d: await rr.json().catch(() => ({})) };
    };
    const courrielDe = (mid) => sql(`SELECT * FROM portail_courriel WHERE message_id = '<${mid}@essai.example>'`)[0];
    const nouveauDe = (pcId) => sql(`SELECT * FROM nouveau WHERE portail_courriel_id = '${pcId}'`)[0];
    const TEL_LBC = `+33771${NUM}`, TEL_SL = `+33772${NUM}`, TEL_OPP = `+33773${NUM}`;
    const lisible = (t) => `0${t.slice(3, 4)} ${t.slice(4, 6)} ${t.slice(6, 8)} ${t.slice(8, 10)} ${t.slice(10, 12)}`;

    // 1. Leboncoin par Modelo : contact créé, catégorie « Demandes reçues », acheteur, référence du bien, source portail.
    const MID_LBC = `lbc-${NUM}`;
    const corpsLbc = `Bonjour,\r\n\r\nVous avez reçu une nouvelle demande de contact depuis la passerelle Leboncoin.\r\n\r\nPrénom : Lucie\r\nNom : Portail${NUM}\r\nE-mail : lucie.portail${NUM}@example.com\r\nTéléphone : ${lisible(TEL_LBC)}\r\nVille : Thonon-les-Bains\r\nRaison du contact : Demande de visite\r\nType de recherche : Achat\r\nMessage : Bonjour, cette maison avec jardin m'intéresse.\r\nEst-elle toujours disponible ? <script>alert(1)</script>\r\nRéférence du bien : AVT-${NUM}\r\n\r\nCordialement,\r\nNetty - Contacts passerelles\r\n`;
    let r = await recevoir('inbound@nettymail.com', `${enTete('"Netty - Contacts passerelles" <inbound@nettymail.com>', sujetEnc(`Nouveau contact Leboncoin - Réf. AVT-${NUM}`), MID_LBC, 'text/plain; charset=utf-8', 'quoted-printable')}\r\n\r\n${qp(corpsLbc)}`);
    const pcL = courrielDe(MID_LBC);
    const kL = sql(`SELECT * FROM contact WHERE telephone = '${TEL_LBC}'`)[0];
    const nL = pcL ? nouveauDe(pcL.id) : null;
    const evL = kL ? sql(`SELECT * FROM contact_evenement WHERE contact_id = '${kL.id}' AND type = 'demande' AND source = 'portail'`)[0] : null;
    constat(r.outcome === 'ok' && pcL?.etat === 'lu' && pcL.portail === 'leboncoin' && pcL.texte === null && pcL.sujet === null && pcL.expediteur === null && pcL.contact_id === kL?.id
      && kL?.prenom === 'Lucie' && kL.nom === `Portail${NUM}` && kL.email === `lucie.portail${NUM}@example.com` && kL.categorie_id === 'demandes_recues' && kL.projet === 'acheteur'
      && kL.parcours === 'acheteur' && kL.bien_ref === `AVT-${NUM}` && kL.canal === 'portail' && kL.origine_detail === 'Leboncoin' && kL.etape === 'a_qualifier' && kL.commune === 'Thonon-les-Bains'
      && sql(`SELECT source FROM contact_source WHERE contact_id = '${kL.id}'`).map((s) => s.source).join() === 'portail'
      && nL?.source === 'portail' && nL.contact_id === kL.id && nL.evenement_id === evL?.id && nL.vu_le === null,
      '18.12 : une demande Leboncoin (Modelo) crée le contact : « Demandes reçues », acheteur, référence du bien, source portail, ligne `nouveau` portail');
    let cartes = await nvP();
    const cL = cartes.find((c) => c.id === nL?.id);
    constat(!!cL && cL.origine === 'Leboncoin' && cL.titre === 'Demande de visite' && cL.nom === `Lucie Portail${NUM}` && cL.telephone === TEL_LBC && cL.annonce === `réf. AVT-${NUM}`
      && cL.texte.includes('toujours disponible') && cL.texte.includes('<script>') && JSON.stringify(cL.gestes) === '["ranger","vu","ecarter"]',
      '18.12 : sa carte « Nouveaux » : portail, raison, nom, coordonnées, message, référence ; gestes Ranger, Vu, Écarter');
    const evD = evL?.donnees ? JSON.parse(evL.donnees) : {};
    constat(Object.keys(evD).sort().join() === 'annonce,message,portail,raison,recherche,reference,ville' && !JSON.stringify(evD).includes('Netty'),
      '18.12 : seuls les champs utiles sont gardés dans l\'historique (ni l\'e-mail, ni sa signature)');
    // Le même e-mail reçu deux fois ne fait rien de plus.
    r = await recevoir('inbound@nettymail.com', `${enTete('"Netty - Contacts passerelles" <inbound@nettymail.com>', 'Nouveau contact', MID_LBC, 'text/plain; charset=utf-8', 'quoted-printable')}\r\n\r\n${qp(corpsLbc)}`);
    constat(r.outcome === 'ok' && sql(`SELECT count(*) AS n FROM portail_courriel WHERE message_id = '<${MID_LBC}@essai.example>'`)[0].n === 1
      && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${kL?.id}' AND type = 'demande'`)[0].n === 1 && sql(`SELECT count(*) AS n FROM nouveau WHERE contact_id = '${kL?.id}'`)[0].n === 1,
      '18.12 : un e-mail reçu deux fois (même Message-ID) ne crée ni second événement ni seconde carte');
    // Ranger : la carte sort, s'annule.
    let x = await gesteP({ id: nL?.id, geste: 'ranger' });
    const apresRanger = sql(`SELECT issue FROM nouveau WHERE id = '${nL?.id}'`)[0]?.issue;
    const annule = await gesteP({ annuler: nL?.id });
    constat(x.status === 200 && x.d.contact_id === kL?.id && apresRanger === 'range' && annule.status === 200 && sql(`SELECT vu_le FROM nouveau WHERE id = '${nL?.id}'`)[0]?.vu_le === null,
      '18.12 : « Ranger » sur une demande de portail ouvre son contact ; s\'annule');

    // 2. SeLoger, e-mail HTML en base64 : complète un contact du carnet (même téléphone), qui entre dans le suivi.
    const KSL = `01KFPS${NUM}${'0'.repeat(14)}`;
    sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, categorie_id, projet) VALUES ('${KSL}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Marc', 'Carnet${NUM}', '${TEL_SL}', 'lointains', 'a_qualifier')`);
    const MID_SL = `sl-${NUM}`;
    const html = `<html><head><style>td{padding:4px}</style></head><body><p>Bonjour,</p><p>Un internaute est int&eacute;ress&eacute; par votre annonce sur SeLoger.</p>
<table><tr><td><b>Nom et prénom</b></td><td>Marc Durand${NUM}</td></tr><tr><td>Téléphone</td><td>${lisible(TEL_SL)}</td></tr><tr><td>Email</td><td>marc.sl${NUM}@example.com</td></tr>
<tr><td>Annonce</td><td>Appartement T3 vue lac &ndash; Évian-les-Bains</td></tr><tr><td>Référence</td><td>SL-${NUM}</td></tr><tr><td>Message</td><td>Je souhaite visiter samedi.</td></tr></table>
<p>L'équipe SeLoger</p></body></html>`;
    const borne = `b-${NUM}`;
    r = await recevoir('notification@seloger.com', `${enTete('SeLoger <notification@seloger.com>', sujetEnc('Nouvelle demande sur votre annonce'), MID_SL, `multipart/alternative; boundary="${borne}"`)}\r\n\r\n--${borne}\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64(html)}\r\n--${borne}--\r\n`);
    const kS = sql(`SELECT * FROM contact WHERE id = '${KSL}'`)[0];
    const pcS = courrielDe(MID_SL);
    constat(r.outcome === 'ok' && pcS?.etat === 'lu' && pcS.portail === 'seloger' && pcS.contact_id === KSL && kS.prenom === 'Marc' && kS.nom === `Carnet${NUM}` && kS.email === `marc.sl${NUM}@example.com`
      && kS.bien_ref === `SL-${NUM}` && kS.etape === 'a_qualifier' && !!kS.suivi_le && kS.categorie_id === 'lointains' && sql(`SELECT count(*) AS n FROM contact WHERE telephone = '${TEL_SL}'`)[0].n === 1,
      '18.12 : une demande SeLoger (HTML, base64) complète le contact du carnet qui a ce téléphone (e-mail, référence ; rien n\'est remplacé) et le fait entrer dans le suivi');
    cartes = await nvP();
    const cS = cartes.find((c) => c.id === nouveauDe(pcS?.id)?.id);
    constat(!!cS && cS.origine === 'SeLoger' && cS.annonce === `Appartement T3 vue lac – Évian-les-Bains · réf. SL-${NUM}` && cS.texte === 'Je souhaite visiter samedi.',
      '18.12 : sa carte nomme SeLoger, l\'annonce et sa référence');
    x = await gesteP({ id: cS?.id, geste: 'ecarter' });
    const ecarte = sql(`SELECT ecarte_le FROM contact WHERE id = '${KSL}'`)[0]?.ecarte_le;
    const annuleE = await gesteP({ annuler: cS?.id });
    constat(x.status === 200 && !!ecarte && annuleE.status === 200 && sql(`SELECT ecarte_le FROM contact WHERE id = '${KSL}'`)[0]?.ecarte_le === null,
      '18.12 : « Écarter » sur une demande de portail écarte le contact ; s\'annule');

    // 3. Illisible : gardé avec son texte, carte « à lire à la main », seul « Vu » s'applique ; texte effacé après.
    const MID_ILL = `ill-${NUM}`;
    r = await recevoir('inbound@nettymail.com', `${enTete('"Netty" <inbound@nettymail.com>', 'Nouvelle demande', MID_ILL, 'text/plain; charset=utf-8')}\r\n\r\nUne personne a laissé un message pour le bien ${NUM} : rappeler Mme Illisible${NUM} au plus vite.\r\n`);
    const pcI = courrielDe(MID_ILL);
    const nI = pcI ? nouveauDe(pcI.id) : null;
    cartes = await nvP();
    const cI = cartes.find((c) => c.id === nI?.id);
    constat(r.outcome === 'ok' && pcI?.etat === 'illisible' && pcI.motif === 'champs' && pcI.contact_id === null && pcI.texte.includes(`Illisible${NUM}`) && pcI.expediteur === 'inbound@nettymail.com'
      && !sql(`SELECT 1 FROM contact WHERE nom LIKE '%Illisible${NUM}%'`).length && !!cI && cI.titre.includes('Format non reconnu') && cI.texte.includes(`Illisible${NUM}`)
      && cI.nom === 'Nouvelle demande' && JSON.stringify(cI.gestes) === '["vu"]',
      '18.12 : un e-mail illisible est gardé (expéditeur, sujet, texte) et signalé par une carte « à lire à la main », sans contact créé');
    x = await gesteP({ id: nI?.id, geste: 'ranger' });
    constat(x.status === 400 && sql(`SELECT vu_le FROM nouveau WHERE id = '${nI?.id}'`)[0]?.vu_le === null, '18.12 : sur un e-mail à lire à la main, seul « Vu » s\'applique (Ranger refusé, 400)');
    x = await gesteP({ id: nI?.id, geste: 'vu' });
    constat(x.status === 200 && courrielDe(MID_ILL)?.texte !== null, '18.12 : « Vu » sort la carte ; le texte reste le temps de l\'annulation');
    sql(`UPDATE nouveau SET vu_le = '2026-01-01T00:00:00Z' WHERE id = '${nI?.id}'`);
    await appeler(`${E}/cdn-cgi/handler/scheduled`);
    for (let i = 0; i < 40 && courrielDe(MID_ILL)?.texte !== null; i++) await pause(250);
    const pcI2 = courrielDe(MID_ILL);
    constat(pcI2?.texte === null && pcI2.sujet === null && pcI2.expediteur === null && pcI2.etat === 'illisible', '18.12 : passé le délai, la tâche planifiée efface le texte, le sujet et l\'expéditeur de l\'e-mail lu');
    // Confirmation du transfert Gmail : gardée pour en lire le code.
    const MID_GM = `gm-${NUM}`;
    r = await recevoir('forwarding-noreply@google.com', `${enTete('Gmail Team <forwarding-noreply@google.com>', `(#7${NUM}) Confirmation de transfert Gmail`, MID_GM, 'text/plain; charset=utf-8')}\r\n\r\navialtissot@gmail.com a demandé à transférer automatiquement ses e-mails à l'adresse ${A}.\r\nCode de confirmation : 7${NUM}\r\n`);
    const pcG = courrielDe(MID_GM);
    const cG = (await nvP()).find((c) => c.id === nouveauDe(pcG?.id)?.id);
    constat(r.outcome === 'ok' && pcG?.motif === 'confirmation' && !!cG && cG.titre.includes('Code de confirmation') && cG.texte.includes(`Code de confirmation : 7${NUM}`),
      '18.12 : la confirmation du transfert Gmail est montrée sur une carte, avec son code');

    // 4. Opposition : aucune donnée de la personne gardée, aucune fiche ; la carte dit qu'une demande est arrivée.
    sql(`INSERT INTO opposition (empreinte, le) VALUES ('${createHmac('sha256', 'essai').update(`opposition:${TEL_OPP}`).digest('hex')}', '2026-10-01T00:00:00Z') ON CONFLICT DO NOTHING`);
    const MID_OPP = `opp-${NUM}`;
    r = await recevoir('inbound@nettymail.com', `${enTete('"Netty - Contacts passerelles" <inbound@nettymail.com>', 'Nouveau contact Leboncoin', MID_OPP, 'text/plain; charset=utf-8')}\r\n\r\nPrénom : Olga\r\nNom : Opposee${NUM}\r\nTéléphone : ${lisible(TEL_OPP)}\r\nMessage : Encore moi.\r\nRéférence du bien : OPP-${NUM}\r\n`);
    const pcO = courrielDe(MID_OPP);
    const cO = (await nvP()).find((c) => c.id === nouveauDe(pcO?.id)?.id);
    constat(r.outcome === 'ok' && pcO?.etat === 'opposition' && pcO.texte === null && pcO.sujet === null && pcO.expediteur === null && pcO.contact_id === null && pcO.motif === `Réf. OPP-${NUM}`
      && !sql(`SELECT 1 FROM contact WHERE telephone = '${TEL_OPP}' OR nom = 'Opposee${NUM}'`).length && !!cO && JSON.stringify(cO.gestes) === '["vu"]' && !JSON.stringify(cO).includes('Olga') && cO.annonce === `Réf. OPP-${NUM}`,
      '18.12 : une personne en opposition : ni contact ni donnée gardée ; la carte signale la demande (référence du bien seulement)');

    // 5. Expéditeur qui n'est pas un portail : refusé, rien gardé.
    const MID_X = `x-${NUM}`;
    r = await recevoir('inconnu@exemple.org', `${enTete('Inconnu <inconnu@exemple.org>', 'Publicité', MID_X, 'text/plain; charset=utf-8')}\r\n\r\nPrénom : Pub\r\nTéléphone : 06 00 00 00 00\r\n`);
    constat(r.outcome !== 'ok' && /portails/.test(r.raison ?? '') && !courrielDe(MID_X), `18.12 : un expéditeur qui n'est pas un portail est rejeté (${r.outcome}), rien n'est gardé`);
    // Revue de code 18.12 : From falsifié (fausse adresse de portail dans le nom affiché), enveloppe qui n'est pas la Gmail
    // d'Anne, e-mail envoyé directement sans transfert : rejetés, rien de gardé, aucun contact.
    const TEL_FAUX = `+33774${NUM}`;
    const corpsFaux = `Prénom : Faux\r\nNom : Portail${NUM}\r\nTéléphone : ${lisible(TEL_FAUX)}\r\nRéférence du bien : FAUX-${NUM}\r\n`;
    const faux = [
      ['From dont le nom affiché porte une adresse de portail', `faux1-${NUM}`, '"Netty <inbound@nettymail.com>" <pirate@exemple.org>', undefined],
      ['enveloppe qui n\'est pas la Gmail d\'Anne', `faux2-${NUM}`, '"Netty - Contacts passerelles" <inbound@nettymail.com>', 'pirate@exemple.org'],
      ['enveloppe d\'un autre compte Gmail à « + »', `faux3-${NUM}`, '"Netty - Contacts passerelles" <inbound@nettymail.com>', 'anne.essaix+caf_=demandes@example.com'],
      ['e-mail du portail envoyé directement, sans transfert', `faux4-${NUM}`, '"Netty - Contacts passerelles" <inbound@nettymail.com>', 'inbound@nettymail.com'],
      ['fausse confirmation de Gmail envoyée hors de Google', `faux5-${NUM}`, 'Gmail Team <forwarding-noreply@google.com>', 'pirate@exemple.org'],
    ];
    for (const [quoi, mid, de, env] of faux) {
      r = await recevoir('inbound@nettymail.com', `${enTete(de, 'Nouveau contact Leboncoin', mid, 'text/plain; charset=utf-8')}\r\n\r\n${corpsFaux}`, env ?? TRANSFERT);
      constat(r.outcome !== 'ok' && /portails/.test(r.raison ?? '') && !courrielDe(mid) && !sql(`SELECT 1 FROM contact WHERE telephone = '${TEL_FAUX}' OR nom = 'Portail${NUM}' AND prenom = 'Faux'`).length,
        `revue 18.12 : ${quoi} : rejeté (${r.outcome}), rien de gardé, aucun contact`);
    }
    // L'adresse exacte du réglage (sans « + ») est acceptée.
    const MID_EXACT = `exact-${NUM}`, TEL_EXACT = `+33775${NUM}`;
    r = await recevoir('inbound@nettymail.com', `${enTete('"Netty - Contacts passerelles" <inbound@nettymail.com>', 'Nouveau contact Leboncoin', MID_EXACT, 'text/plain; charset=utf-8')}\r\n\r\nPrénom : Exacte\r\nNom : Portail${NUM}\r\nTéléphone : ${lisible(TEL_EXACT)}\r\n`, 'Anne.Essai@example.com');
    constat(r.outcome === 'ok' && courrielDe(MID_EXACT)?.etat === 'lu' && sql(`SELECT count(*) AS n FROM contact WHERE telephone = '${TEL_EXACT}'`)[0].n === 1,
      'revue 18.12 : enveloppe égale au réglage (casse comprise) : la demande est lue');
    // Revue externe 18.12 : sans SPF « pass » pour gmail.com en tête, ou avec un « pass » placé sous un « fail », l'e-mail
    // est gardé « à lire à la main » (carte), sans contact. Un « pass » en tête (Received-SPF ou ARC) est lu.
    const corpsSpf = (q, tel) => `Prénom : Spf${q}\r\nNom : Portail${NUM}\r\nTéléphone : ${lisible(tel)}\r\n`;
    const FROM_SPF = '"Netty - Contacts passerelles" <inbound@nettymail.com>';
    const cas = [
      ['SPF absent', 'absent', undefined, '+33776', false],
      ['SPF pass placé sous un fail', 'bas', 'Authentication-Results: mx.cloudflare.net; spf=fail smtp.mailfrom=gmail.com\r\nAuthentication-Results: mx.cloudflare.net; spf=pass smtp.mailfrom=gmail.com', '+33777', false],
      ['SPF pass pour un autre domaine', 'autre', 'Authentication-Results: mx.cloudflare.net; spf=pass smtp.mailfrom=evilgmail.com', '+33778', false],
      ['SPF pass fourni par l\'expéditeur sous un en-tête sans SPF', 'sous', 'Authentication-Results: mx.cloudflare.net; dkim=pass\r\nReceived-SPF: pass envelope-from=a@gmail.com', '+33779', false],
      ['Received-SPF pass en tête', 'rspf', 'Received-SPF: pass (cloudflare: domain of a@gmail.com designates 209.85.0.1 as permitted sender) client-ip=209.85.0.1; envelope-from=a@gmail.com; helo=mail-x.google.com', '+33780', true],
      ['ARC-Authentication-Results pass en tête', 'arc', 'ARC-Authentication-Results: i=1; mx.google.com; spf=pass smtp.mailfrom=anne+caf_=x@gmail.com', '+33781', true],
    ];
    for (const [quoi, k, spf, pref, lu] of cas) {
      const mid = `spf-${k}-${NUM}`, tel = `${pref}${NUM}`;
      const brut = `${spf ? spf + '\r\n' : ''}${enTete(FROM_SPF, 'Nouveau contact Leboncoin', mid, 'text/plain; charset=utf-8', undefined, '')}\r\n\r\n${corpsSpf(k, tel)}`;
      r = await recevoir('inbound@nettymail.com', brut);
      const pcS = courrielDe(mid);
      const nContact = sql(`SELECT count(*) AS n FROM contact WHERE telephone = '${tel}'`)[0].n;
      constat(r.outcome === 'ok' && (lu ? pcS?.etat === 'lu' && nContact === 1 : pcS?.etat === 'illisible' && pcS.motif === 'spf' && !!nouveauDe(pcS.id) && nContact === 0),
        `revue externe 18.12 : ${quoi} : ${lu ? 'demande lue, contact créé' : 'gardé « à lire à la main », aucun contact'} (${pcS?.etat}/${pcS?.motif}/${nContact})`);
    }
    // Un e-mail trop gros n'est pas lu, mais gardé et signalé.
    const MID_G = `gros-${NUM}`;
    r = await recevoir('inbound@nettymail.com', `${enTete('"Netty" <inbound@nettymail.com>', 'Pièce jointe', MID_G, 'text/plain; charset=utf-8')}\r\n\r\nTéléphone : ${lisible(TEL_LBC)}\r\n${'x'.repeat(1_100_000)}\r\n`);
    const pcGros = courrielDe(MID_G);
    constat(r.outcome === 'ok' && pcGros?.etat === 'illisible' && pcGros.motif === 'taille' && pcGros.texte === null && !!nouveauDe(pcGros.id), '18.12 : un e-mail trop gros n\'est pas lu, mais gardé et signalé (carte « à lire à la main »)');

    // La page : cartes des portails à 1440 et 1280 px.
    for (const largeur of [1440, 1280]) {
      const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
      const o = await ctx.newPage();
      await o.goto(`${E}/`);
      constat((await o.textContent('[data-nv-src]')).includes('Leboncoin'), `18.12 : à ${largeur} px, la barre repliée cite Leboncoin parmi les sources`);
      await o.click('[data-nv-barre]');
      await o.waitForSelector(`[data-nv-carte="${nL?.id}"]`);
      const lire = o.locator(`[data-nv-carte="${cG?.id}"] .nv-lire`);
      constat(await lire.count() === 1 && (await lire.textContent()).includes(`7${NUM}`) && await o.locator('[data-nv-liste] script').count() === 0,
        `18.12 : à ${largeur} px, une carte « à lire à la main » montre tout le texte de l'e-mail ; un message reste du texte`);
      await o.locator(`[data-nv-carte="${cG?.id}"]`).scrollIntoViewIfNeeded();
      await o.screenshot({ path: path.join(OUT, `espace-nouveaux-portails-${largeur}.png`) });
      constat(!(await o.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), `18.12 : cartes des portails à ${largeur} px : pas de débordement horizontal`);
      await ctx.close();
    }
  }
  // 1 150 contacts fictifs (environ 1 230 en tout, story 18.5) : tri, recherche et filtres dans le navigateur.
  sql(`DELETE FROM contact WHERE id LIKE 'PERF%'`);
  sql(`WITH RECURSIVE n(i) AS (SELECT 1 UNION ALL SELECT i + 1 FROM n WHERE i < 1150)
       INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, email, commune, entreprise, categorie_id, projet, is_test)
       SELECT 'PERF' || printf('%022d', i), '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Fictif', 'Perf' || i, '+33699' || printf('%06d', i),
         'perf' || i || '@example.com', CASE i % 4 WHEN 0 THEN 'Thonon' WHEN 1 THEN 'Évian' WHEN 2 THEN 'Publier' ELSE NULL END,
         CASE WHEN i % 3 = 0 THEN 'Entreprise ' || (i % 17) END, CASE i % 2 WHEN 0 THEN 'proches' ELSE 'edb' END, 'a_qualifier', 1 FROM n`);
  try {
    const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const o = await ctx.newPage();
    await o.goto(`${E}/`);
    await o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
    // Story 18.5 : chaque geste est mesuré depuis un tableau au repos (toutes les lignes écrites) jusqu'au tableau redessiné
    // et peint (image suivante), attente de 120 ms comprise pour la recherche ; seuil 300 ms. « complet » : jusqu'à la
    // dernière ligne écrite (les suivantes s'ajoutent par paquets, sans bloquer la page).
    const mesure = await o.evaluate(async () => {
      const corps = document.querySelector('[data-lignes]');
      const q = document.querySelector('[data-recherche]');
      const repos = () => new Promise((ok) => { const v = () => corps.hasAttribute('data-complet') ? setTimeout(ok, 50) : setTimeout(v, 10); v(); });
      const mesurer = async (agir) => {
        await repos();
        return new Promise((ok) => {
          const t = performance.now();
          let peint = null;
          const obs = new MutationObserver(() => {
            obs.disconnect();
            requestAnimationFrame(() => setTimeout(() => {
              peint = Math.round(performance.now() - t);
              const fin = () => corps.hasAttribute('data-complet') ? ok({ peint, complet: Math.round(performance.now() - t) }) : setTimeout(fin, 5);
              fin();
            }));
          });
          obs.observe(corps, { childList: true });
          agir();
        });
      };
      const taper = (v) => () => { q.value = v; q.dispatchEvent(new Event('input')); };
      const choisir = (cle, v) => () => { const s = document.querySelector(`[data-filtre=${cle}]`); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); };
      const cliquer = (sel) => () => document.querySelector(sel).click();
      const r = { lignes: document.querySelectorAll('[data-lignes] tr[data-contact]').length };
      r.triNom = await mesurer(cliquer('th[data-cle=nom] button'));
      r.triVille = await mesurer(cliquer('th[data-cle=ville] button'));
      r.triDernier = await mesurer(cliquer('th[data-cle=dernier] button'));
      r.rechercheMot = await mesurer(taper('perf'));
      r.rechercheNumero = await mesurer(taper('06 99 00 05'));
      r.rechercheVide = await mesurer(taper(''));
      r.filtreProjet = await mesurer(choisir('projet', 'a_qualifier'));
      r.filtreEtRecherche = await mesurer(choisir('categorie_id', 'edb'));
      r.rechercheDansFiltre = await mesurer(taper('perf1'));
      r.pastilleRetiree = await mesurer(cliquer('[data-retirer=categorie_id]'));
      r.pastilleProjetRetiree = await mesurer(cliquer('[data-retirer=projet]'));
      r.rechercheVide2 = await mesurer(taper(''));
      if (document.querySelector('[data-vue="01M6A6FT000000000000000001"]')) r.vueAVerifier = await mesurer(cliquer('[data-vue="01M6A6FT000000000000000001"]'));
      r.tousLesContacts = await mesurer(cliquer('[data-vue=tous]'));
      return r;
    });
    const gestes = Object.entries(mesure).filter(([k]) => k !== 'lignes');
    const pire = Math.max(...gestes.map(([, v]) => v.peint));
    constat(mesure.lignes >= 1000 && pire < 1000, `18.4 : avec ${mesure.lignes} contacts, tri, recherche et filtres en moins d'une seconde`);
    constat(mesure.lignes >= 1000 && pire < 300,
      `18.5 : avec ${mesure.lignes} contacts, chaque tri, recherche ou filtre redessine le tableau en moins de 300 ms, attente de 120 ms comprise (pire ${pire} ms ; ${gestes.map(([k, v]) => `${k} ${v.peint}/${v.complet}`).join(', ')} ms, redessiné/complet)`);
    // Story 18.6 : un lot de 1 000 contacts, par la route (catégorie puis annulation), puis par la page (tout cocher, catégorie, annuler).
    const perf = sql(`SELECT id, categorie_id FROM contact WHERE id LIKE 'PERF%' ORDER BY id LIMIT 1000`);
    const cats0 = JSON.stringify(perf);
    const appelLot = async (corps) => { const t0 = performance.now(); const x = await appeler(`${E}/api/carnet`, { method: 'POST', headers: { 'cf-access-jwt-assertion': JETON, 'Content-Type': 'application/json', Origin: E }, body: JSON.stringify(corps) }); const d = await x.json(); return { d, ms: Math.round(performance.now() - t0) }; };
    const l1 = await appelLot({ ids: perf.map((x) => x.id), changements: { categorie_id: 'lointains' } });
    const tous1000 = sql(`SELECT count(*) AS n FROM contact WHERE id LIKE 'PERF%' AND categorie_id = 'lointains'`)[0].n;
    const evs1000 = sql(`SELECT count(*) AS n FROM contact_evenement WHERE json_extract(donnees, '$.lot') = '${l1.d.lot}'`)[0].n;
    const l2 = await appelLot({ annuler: l1.d.lot });
    const rendu = JSON.stringify(sql(`SELECT id, categorie_id FROM contact WHERE id LIKE 'PERF%' ORDER BY id LIMIT 1000`)) === cats0;
    await o.fill('[data-recherche]', 'fictif'); await o.waitForTimeout(300);
    await o.waitForSelector('[data-lignes][data-complet]', { state: 'attached' });
    await o.click('[data-tout]');
    const nCoches = await o.textContent('[data-lot-n]');
    const page = await o.evaluate(async () => {
      const t0 = performance.now();
      const s = document.querySelector('[data-lot-action=categorie_id]');
      s.value = 'partenaires'; s.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((ok) => { const v = () => (!document.querySelector('[data-toast]').hidden && document.querySelector('[data-lignes]').hasAttribute('data-complet')) ? ok() : setTimeout(v, 5); v(); });
      const fait = Math.round(performance.now() - t0), message = document.querySelector('[data-toast-texte]').textContent;
      const t1 = performance.now();
      document.querySelector('[data-toast-annuler]').click();
      await new Promise((ok) => { const v = () => document.querySelector('[data-toast-texte]').textContent.includes('remis comme avant') && document.querySelector('[data-lignes]').hasAttribute('data-complet') ? ok() : setTimeout(v, 5); v(); });
      return { fait, annule: Math.round(performance.now() - t1), message };
    });
    const renduPage = JSON.stringify(sql(`SELECT id, categorie_id FROM contact WHERE id LIKE 'PERF%' ORDER BY id LIMIT 1000`)) === cats0;
    constat(l1.d.touches === 1000 && tous1000 === 1000 && evs1000 === 1000 && l2.d.rendus === 1000 && rendu && l1.ms < 3000 && l2.ms < 3000,
      `18.6 : un lot de 1 000 contacts par /api/carnet : ${l1.ms} ms (1 000 événements), annulation ${l2.ms} ms, état rendu à l'identique`);
    constat(Number(/^(\d+) contacts touchés/.exec(page.message)?.[1] ?? 0) >= 1000 && renduPage && page.fait < 3000 && page.annule < 3000,
      `18.6 : dans la page, ${nCoches} d'un clic (« ${page.message.split(' :')[0]} »), catégorie changée et tableau redessiné en ${page.fait} ms, annulé en ${page.annule} ms`);
    await ctx.close();
  } finally {
    sql(`DELETE FROM contact WHERE id LIKE 'PERF%'`);
  }

  // 6. Capture de la liste (ordinateur et téléphone).
  for (const [nom, viewport] of [['ordinateur', { width: 1280, height: 900 }], ['telephone', { width: 390, height: 844 }]]) {
    const ctx = await nav.newContext({ viewport, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const onglet = await ctx.newPage();
    for (const [nomPage, chemin] of [['accueil-contacts', '/'], ['aujourdhui', '/aujourdhui'], ['gestion', '/gestion'], ['ajouter', '/ajouter'], ['contacts', '/contacts'], ['fiche', `/contacts/fiche?id=${saisie.id}`], ['qualifier', `/contacts/qualifier?id=${carla}`], ['suite', `/contacts/suite?id=${SUITE}`], ['bilan', '/bilan'], ['prescripteurs', '/prescripteurs'], ['prescripteur', `/prescripteurs/fiche?id=${durand}`], ['acheteurs', `/acheteurs?secteur=${encodeURIComponent(ANTHY.toLowerCase())}`], ['qualifier-acheteur', `/contacts/qualifier?id=${ach1}`], ['pipeline', '/pipeline'], ['fiche-leedflow', `/contacts/fiche?id=${KLF}`], ['fiche-accord-site', `/contacts/fiche?id=${SITEACC}`], ['fiche-sans-accord', `/contacts/fiche?id=${saisie.id}`], ['qualifier-leedflow', `/contacts/qualifier?id=${KLF}`], ['inconnu', `/inconnu?tel=${encodeURIComponent(CAPTURE)}`], ['a-trier', '/a-trier'], ['actions', '/actions'], ['action', `/actions?id=${salon.id}`], ['campagnes', '/campagnes'], ['campagne', `/campagnes?id=${kbrouillon}`], ['campagne-envoyee', `/campagnes?id=${kid}`]]) {
      await onglet.goto(`${E}${chemin}`);
      if (nomPage === 'ajouter') {
        await onglet.click('[data-canaux] label:has(input[value=boitage]) span');
        constat(await onglet.isVisible('[data-si=boitage]') && !(await onglet.isVisible('[data-si=recommandation]')), `ajouter sur ${nom} : toucher « Boîtage » montre le choix du passage, cache le prescripteur`);
      }
      if (nomPage === 'fiche') {
        constat(!(await onglet.isVisible('[data-coordonnees] input[name=prenom]')), `fiche sur ${nom} : la modification est repliée`);
        await onglet.click('[data-modifier] summary');
        await onglet.selectOption('[data-canal]', 'boitage');
        constat(await onglet.isVisible('[data-coordonnees] input[name=prenom]') && await onglet.isVisible('[data-si-canal=boitage]') && !(await onglet.isVisible('[data-si-canal=recommandation]')),
          `fiche sur ${nom} : « Modifier » ouvre les coordonnées, l'origine Boîtage montre le choix du passage`);
        await onglet.screenshot({ path: path.join(OUT, `espace-fiche-modifier-${nom}.png`), fullPage: true });
        await onglet.goto(`${E}${chemin}`);
      }
      if (nomPage === 'pipeline') {
        const colonnesVues = await onglet.locator('.pl-colonne:visible').count();
        constat(nom === 'telephone' ? colonnesVues === 1 && await onglet.isVisible('[data-etapes]') : colonnesVues > 3 && !(await onglet.isVisible('[data-etapes]')),
          `pipeline sur ${nom} : ${nom === 'telephone' ? 'une étape à la fois, pastilles en haut' : 'colonnes côte à côte'}`);
      }
      if (nomPage === 'contacts') {
        constat(nom === 'telephone' ? await onglet.isVisible('[data-cartes]') && !(await onglet.isVisible('[data-contacts]')) : await onglet.isVisible('[data-contacts]') && !(await onglet.isVisible('[data-cartes]')),
          `contacts sur ${nom} : ${nom === 'telephone' ? 'des cartes' : 'le tableau'}`);
      }
      if (nomPage === 'suite') {
        await onglet.click('[data-resultat] label:has(input[value=pas_joint]) span');
        constat(!(await onglet.isVisible('[data-action]')) && !(await onglet.isVisible('.su-etapes')) && (await onglet.textContent('[data-legende-quand]')) === 'Le rappeler quand ?',
          `suite sur ${nom} : « Pas joint » ne demande que la date du rappel`);
        await onglet.click('[data-resultat] label:has(input[value=fait]) span');
        constat(await onglet.isVisible('[data-action]') && await onglet.isVisible('.su-etapes summary'), `suite sur ${nom} : « Fait » demande la prochaine action, l'étape se change en dépliant`);
      }
      if (nomPage === 'accueil-contacts' && nom === 'telephone') {
        constat(await onglet.getAttribute('.e-menu-bas a:nth-child(2)', 'href') === '/contacts', 'revue 18.4 : sur téléphone, « Contacts » du menu du bas mène à la liste en cartes');
      }
      if (nomPage === 'aujourdhui') {
        const bouton = await onglet.locator('[data-retour-ouvrir]').boundingBox();
        const menu = nom === 'telephone' ? await onglet.locator('.e-menu-bas').boundingBox() : null;
        constat(!!bouton && (!menu || bouton.y + bouton.height <= menu.y), `un retour sur ${nom} : le bouton est visible et ne cache pas le menu du bas`);
        await onglet.click('[data-retour-ouvrir]');
        constat(await onglet.isVisible('[data-retour-dialog] textarea'), `un retour sur ${nom} : le bouton ouvre le formulaire`);
        if (nom === 'telephone') await onglet.screenshot({ path: path.join(OUT, `espace-retour-${nom}.png`) });
        await onglet.click('[data-retour-fermer]');
      }
      await onglet.screenshot({ path: path.join(OUT, `espace-${nomPage}-${nom}.png`), fullPage: true });
      const deborde = await onglet.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      constat(!deborde, `${nomPage} sur ${nom} : pas de débordement horizontal`);
    }
    // L'e-mail de campagne tel que reçu (logo joint remis en image intégrée pour la capture).
    if (mailA) {
      await onglet.setContent(mailA.html.replace('cid:logo', `data:image/png;base64,${fs.readFileSync(path.join(SITE, 'src', 'server', 'email-logo.png')).toString('base64')}`));
      await onglet.screenshot({ path: path.join(OUT, `email-campagne-${nom}.png`), fullPage: true });
      constat(!(await onglet.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)), `e-mail de campagne sur ${nom} : pas de débordement horizontal`);
    }
    await ctx.close();
  }
  await nav.close();
} catch (e) {
  console.error(e);
  echecs++;
} finally {
  try { process.kill(-espace.pid); } catch {}
  imitationLeedflow.close();
  site.arreter();
  fs.rmSync(reglages, { force: true });
}
console.log(echecs ? `\n${echecs} échec(s). Journaux : ${site.journal}, ${journal}` : '\nTout est bon.');
process.exit(echecs ? 1 : 0);
