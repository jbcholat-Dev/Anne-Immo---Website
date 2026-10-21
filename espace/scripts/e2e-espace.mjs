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
// Story 13.13 : bilan par canal recalculé depuis la base, boîtage par secteur, motifs de perte, délai de rappel.
// Story 13.14 : prescripteurs (recommandés, mandats, relance due sur Aujourd'hui, échange noté, ajout).
// Story 13.15 : acheteurs actifs (critères, « aussi vendeur », vendeurs en sommeil du secteur, lettre sur Aujourd'hui).
// Story 13.16 : vue pipeline (colonnes par étape, déplacement avec prochaine action, réveil ou motif exigés).
// Story 13.6 : qualifier (suite obligatoire, date, réveil ou motif exigés, étape et prochaine action fixées, heure de Paris).
// Story 13.10 : relève Leedflow sur une imitation locale de son API (clé exigée, pages lues de la plus ancienne à la plus
// récente, historique repris pour un numéro connu, résumé complété après coup sans doublon, numéro inconnu proposé puis
// rattaché à la création du contact, page « À trier » avec ses filtres et ses catégories (13.19), tâches proposées puis acceptées ou ignorées, clé refusée signalée).
// Story 13.17 : actions marketing (ajout, erreurs, rattachement d'office par la base, choix à la qualification et sur la
// fiche, coût des passages, coûts du bilan) et accès de Claude par jeton de service (actions et totaux seulement,
// rien d'autre ouvert, une personne refusée sur /api/claude/…, aucun contact dans les réponses).
// Préalable, dans site/ : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run base:local` ;
// dans espace/ : `npm run build`.
// Lancer depuis espace/ : `node scripts/e2e-espace.mjs`.
import { spawn } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
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
const imitationLeedflow = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  LF.requetes.push({ chemin: u.pathname, params: Object.fromEntries(u.searchParams), auth: req.headers.authorization });
  const json = (code, corps) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(corps)); };
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
  `LEEDFLOW_API_KEY=${LF.cle}`, `LEEDFLOW_URL=http://localhost:${PORT_LF}`, 'ACCESS_CLAUDE_ID=essai-claude.access'].join('\n'));
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

  // 2. Base partagée : la demande du site est dans l'espace, sans délai.
  let r = await appeler(`${E}/`, { headers: avecJeton(), redirect: 'manual' });
  let html = await r.text();
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
  r = await page('/ajouter', { quoi: 'passage', secteur: SECTEUR, fait_le: auj, mots: '150' });
  const passage = sql(`SELECT id, mots FROM passage_boitage WHERE secteur = '${SECTEUR}'`)[0];
  constat(r.status === 303 && r.headers.get('location') === '/ajouter?m=passage#passage' && passage?.mots === 150, 'passage de boîtage noté (secteur, date, 150 mots)');
  const NUM = String(Date.now()).slice(-6); // chiffres propres à cet essai, pour des numéros qui ne se croisent pas d'un essai à l'autre
  const TEL = `06 12 ${NUM.slice(0, 2)} ${NUM.slice(2, 4)} ${NUM.slice(4)}`;
  const TEL164 = `+33${TEL.replace(/\s/g, '').slice(1)}`;
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

  // Import d'un .csv (Excel français : point-virgule) : une personne connue, deux nouvelles, une ligne en double.
  const decode = (v) => v.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const importerFichier = async (nom, contenu, type, champs) => {
    const corps = new FormData();
    corps.set('quoi', 'apercu');
    for (const [k, v] of Object.entries(champs)) corps.set(k, v);
    corps.set('fichier', new Blob([contenu], { type }), nom);
    const rep = await appeler(`${E}/importer`, { method: 'POST', headers: avecJeton(JETON, { Origin: E }), body: corps });
    return rep.text();
  };
  const enregistrer = (apercu) => {
    const champs = Object.fromEntries([...apercu.matchAll(/<input type="hidden" name="([a-z_]+)" value="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]));
    return page('/importer', champs);
  };
  const csv = `Prénom;Nom;Portable;E-mail;Ville\nBea;Boitage${ESSAI};${TEL};;Sciez\nCarla;Forum${ESSAI};;carla+${ESSAI}@example.com;Anthy\nDidier;Forum${ESSAI};601${NUM};;Margencel\nCarla;Forum${ESSAI};;CARLA+${ESSAI}@example.com;Anthy\n`;
  let apercu = await importerFichier('forum.csv', csv, 'text/csv', { canal: 'evenement', origine_detail: `Forum ${ESSAI}`, parcours: '' });
  constat(apercu.includes('3 personne(s) : 2 nouvelle(s), 1 déjà connue(s)') && apercu.includes('1 ligne(s) ignorée(s)') && apercu.includes('rappel individuel seulement'),
    'import .csv, aperçu : 2 nouvelles, 1 déjà connue, le doublon du fichier écarté, avertissement « rappel individuel »');
  constat(sql(`SELECT count(*) AS n FROM contact WHERE nom = 'Forum${ESSAI}'`)[0].n === 0, 'import : rien enregistré à l\'aperçu');
  r = await enregistrer(apercu);
  const forum = sql(`SELECT telephone, canal, origine_detail, rappel_individuel_seul FROM contact WHERE nom = 'Forum${ESSAI}' ORDER BY prenom`);
  constat(r.headers.get('location') === '/contacts?m=import-2-1' && forum.length === 2 && forum.every((c) => c.canal === 'evenement' && c.origine_detail === `Forum ${ESSAI}` && c.rappel_individuel_seul === 1)
    && forum[1].telephone === `+33601${NUM}`,
    'import enregistré : 2 contacts créés (origine événement, rappel individuel seulement, 0 rendu au numéro), 1 complété');
  constat(sql(`SELECT count(*) AS n FROM contact WHERE telephone = '${TEL164}'`)[0].n === 1 && sql(`SELECT commune FROM contact WHERE id = '${saisie.id}'`)[0].commune === 'Sciez'
    && sql(`SELECT count(*) AS n FROM contact_evenement WHERE contact_id = '${saisie.id}' AND source = 'import'`)[0].n === 1,
    'import : la personne déjà connue est complétée (commune) et notée, pas recréée');

  // Import d'un .xlsx (fabriqué ici : une archive zip de trois fichiers XML), avec la case de consentement cochée.
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
  const xlsx = zip({
    'xl/sharedStrings.xml': `<sst><si><t>Prénom</t></si><si><t>Nom</t></si><si><t>Téléphone</t></si><si><t>Emma</t></si><si><t>Xlsx${ESSAI} &amp; fils</t></si></sst>`,
    'xl/worksheets/sheet1.xml': `<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c></row>`
      + `<row r="2"><c r="A2" t="s"><v>3</v></c><c r="B2" t="s"><v>4</v></c><c r="C2"><v>699${NUM}</v></c></row></sheetData></worksheet>`,
    '[Content_Types].xml': '<Types/>',
  });
  apercu = await importerFichier('salon.xlsx', xlsx, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', { canal: 'evenement', origine_detail: 'Salon', consentement: 'oui' });
  r = await enregistrer(apercu);
  const emma = sql(`SELECT telephone, rappel_individuel_seul FROM contact WHERE nom = 'Xlsx${ESSAI} & fils'`)[0];
  constat(apercu.includes('1 personne(s) : 1 nouvelle(s)') && emma?.telephone === `+33699${NUM}` && emma.rappel_individuel_seul === 0,
    'import .xlsx : lu (textes partagés, numéro rangé comme un nombre), consentement coché donc pas de « rappel individuel seulement »');
  apercu = await importerFichier('vide.csv', 'Colonne A;Colonne B\nx;y\n', 'text/csv', { canal: 'evenement' });
  constat(apercu.includes('Aucune colonne reconnue'), 'import : un fichier sans titres reconnus est refusé avec une explication');

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
  r = await qualif(saisie.id, { ...Q, issue: 'perdu', motif: 'Hors secteur' });
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

  // 5 quater. Aujourd'hui (story 13.5).
  const didier = sql(`SELECT id FROM contact WHERE telephone = '+33601${NUM}'`)[0].id;
  const vieux = `VIEUX${NUM}`, retard = `RETARD${NUM}`, reveil = `REVEIL${NUM}`, avenir = `AVENIR${NUM}`;
  const hier = (() => { const d = new Date(`${auj}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); })();
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, etape, prochaine_action, prochaine_action_le, canal, is_test) VALUES
    ('${vieux}', '2026-01-02T08:00:00Z', '2026-01-02T08:00:00Z', 'Ancien${NUM}', 'a_qualifier', 'Rappeler pour qualifier', '2026-01-02T08:00:00Z', 'site', 1),
    ('${retard}', '2026-02-01T08:00:00Z', '2026-02-01T08:00:00Z', 'Retard${NUM}', 'estimation', 'Envoyer l''estimation', '${hier}', 'rencontre', 1),
    ('${avenir}', '2026-02-01T08:00:00Z', '2026-02-01T08:00:00Z', 'Avenir${NUM}', 'second_rdv', 'Second rendez-vous', '2099-01-01', 'rencontre', 1)`);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, etape, prochaine_action, prochaine_action_le, reveil_le, canal, is_test) VALUES
    ('${reveil}', '2026-03-01T08:00:00Z', '2026-03-01T08:00:00Z', 'Reveil${NUM}', 'en_sommeil', 'Réveiller : rappeler', '${auj}', '${auj}', 'autre', 1)`);
  sql(`INSERT INTO passage_boitage (id, created_at, secteur, fait_le, mots) VALUES ('PASS${NUM}', '2026-01-01T00:00:00Z', 'Margencel-${NUM}', '2026-01-10', 150)`);
  sql(`UPDATE prescripteur SET prochaine_relance_le = '${auj}', relance_raison = 'Lui montrer la vente d''Anthy' WHERE nom = 'Maître Durand ${ESSAI}'`);
  r = await appeler(`${E}/`, { headers: avecJeton() });
  html = await r.text();
  const zone = (attr) => html.split(attr)[1]?.split('</section>')[0] ?? '';
  const nouveauxZone = zone('data-nouveaux'), rappelsZone = zone('data-rappels'), prospection = zone('data-prospection');
  constat(nouveauxZone.includes(`data-contact="${vieux}"`) && nouveauxZone.includes(`data-contact="${didier}"`) && nouveauxZone.indexOf(vieux) < nouveauxZone.indexOf(didier)
    && nouveauxZone.includes(`/contacts/qualifier?id=${didier}`) && nouveauxZone.includes('href="tel:'),
    'aujourd\'hui : nouveaux contacts à qualifier en tête, le plus ancien d\'abord, avec Appeler et Qualifier');
  constat(!html.includes(`data-contact="${carla}"`), 'aujourd\'hui : un contact pas joint à rappeler demain n\'y est pas encore');
  constat(rappelsZone.includes(`data-contact="${retard}"`) && rappelsZone.split(`data-contact="${retard}"`)[1].split('</article>')[0].includes('data-retard')
    && rappelsZone.includes(`data-contact="${reveil}"`) && !html.includes(`data-contact="${avenir}"`) && !html.includes(`data-contact="${reco.id}"`),
    'aujourd\'hui : rappels dus (en retard signalé) et contact en sommeil à réveiller ; rien de ce qui est prévu plus tard');
  constat(prospection.includes(`Repasser à Margencel-${NUM}`) && !prospection.includes(`Repasser à ${SECTEUR}`) && prospection.includes(`Relancer Maître Durand ${ESSAI}`) && prospection.includes('vente d&#39;Anthy'),
    'aujourd\'hui : secteur de boîtage à refaire (6 semaines et plus), pas le passage du jour ; prescripteur à relancer avec sa raison');
  r = await appeler(`${E}/gestion`, { headers: avecJeton() });
  constat((await r.text()).includes('data-retour'), 'demandes : lien de retour vers l\'espace');

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
  r = await appeler(`${E}/`, { headers: avecJeton() });
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
  await qualif(ach1, { q_bien: 'Maison', q_vend_avant: 'Oui', a_budget: '700 k€', a_secteur: `${ANTHY}, Sciez`, a_financement: 'Après sa vente', issue: 'rdv', rdv_le: '2027-02-02T10:00' });
  await qualif(ach2, { q_bien: 'Maison', q_vend_avant: 'Non', a_budget: '900 k€ à 1,1 M€', a_secteur: ANTHY, a_financement: 'Vérifié', issue: 'rdv', rdv_le: '2027-02-03T10:00' });
  constat(sql(`SELECT etape FROM contact WHERE id = '${ach1}'`)[0].etape === 'besoin_defini' && JSON.parse(sql(`SELECT qualification FROM contact WHERE id = '${ach1}'`)[0].qualification).budget === '700 k€',
    'acheteur qualifié en rendez-vous : étape « Besoin défini », budget gardé');
  sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, commune, parcours, etape, prochaine_action, prochaine_action_le, reveil_le, canal, is_test) VALUES
    ('DORT${NUM}', '2026-05-01T08:00:00Z', '2026-05-01T08:00:00Z', 'Dormeur${NUM}', '${ANTHY}', 'vendeur', 'en_sommeil', 'Réveiller : rappeler', '2027-03-01', '2027-03-01', 'boitage', 1)`);
  r = await appeler(`${E}/acheteurs`, { headers: avecJeton() });
  html = await r.text();
  const l1 = html.split(`data-acheteur="${ach1}"`)[1]?.split('</tr>')[0] ?? '', l2 = html.split(`data-acheteur="${ach2}"`)[1]?.split('</tr>')[0] ?? '';
  constat(l1.includes('data-aussi-vendeur') && l1.includes('700 k€') && !l2.includes('data-aussi-vendeur') && l2.includes('Vérifié'),
    'acheteurs actifs : critères affichés, celui qui doit d\'abord vendre signalé « aussi vendeur »');
  constat(html.includes(`data-secteur="${ANTHY.toLowerCase()}"`) && html.includes('2 acheteur(s)'), 'acheteurs : la commune cherchée par 2 acheteurs');
  r = await appeler(`${E}/acheteurs?secteur=${encodeURIComponent(ANTHY.toLowerCase())}`, { headers: avecJeton() });
  constat((await r.text()).includes(`data-vendeur="DORT${NUM}"`), 'depuis la commune : les vendeurs en sommeil du même secteur');
  r = await appeler(`${E}/`, { headers: avecJeton() });
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
  constat(r.headers.get('location') === `/pipeline?parcours=acheteur&m=deplace#c-${ach1}` && pv.etape === 'visites' && pv.prochaine_action === 'Visite à Anthy' && pv.prochaine_action_le === '2027-02-10T13:30:00.000Z'
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
  r = await appeler(`${E}/`, { headers: avecJeton() });
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
  constat(r.headers.get('location') === '/?m=tache-acceptee' && kl.prochaine_action === 'Envoyer l’estimation' && kl.prochaine_action_le === '2027-01-20' && kl.etape === 'a_qualifier'
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
  r = await page('/ajouter', { quoi: 'passage', secteur: `Essai-${ESSAI}`, fait_le: auj, cout: '45' });
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

  // Clé refusée (révoquée) : la relève le note et « Aujourd'hui » le dit.
  LF.refuse = true;
  await releve();
  r = await appeler(`${E}/`, { headers: avecJeton() });
  constat(sql(`SELECT count(*) AS n FROM leedflow_releve WHERE erreur = 'HTTP 401'`)[0].n >= 1 && /data-etat-leedflow[^>]*>Leedflow : la dernière relève a échoué \(HTTP 401\)/.test(await r.text()),
    'clé refusée : erreur notée et signalée sur « Aujourd\'hui »');
  LF.refuse = false;
  await releve();
  constat(sql(`SELECT count(*) AS n FROM leedflow_releve WHERE erreur IS NOT NULL`)[0].n === 0, 'clé de nouveau acceptée : l\'erreur disparaît');

  // 6. Capture de la liste (ordinateur et téléphone).
  const { chromium } = await import('../../site/node_modules/playwright/index.mjs');
  const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [nom, viewport] of [['ordinateur', { width: 1280, height: 900 }], ['telephone', { width: 390, height: 844 }]]) {
    const ctx = await nav.newContext({ viewport, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const onglet = await ctx.newPage();
    for (const [nomPage, chemin] of [['aujourdhui', '/'], ['gestion', '/gestion'], ['ajouter', '/ajouter'], ['contacts', '/contacts'], ['fiche', `/contacts/fiche?id=${saisie.id}`], ['qualifier', `/contacts/qualifier?id=${carla}`], ['bilan', '/bilan'], ['prescripteurs', '/prescripteurs'], ['prescripteur', `/prescripteurs/fiche?id=${durand}`], ['acheteurs', `/acheteurs?secteur=${encodeURIComponent(ANTHY.toLowerCase())}`], ['qualifier-acheteur', `/contacts/qualifier?id=${ach1}`], ['pipeline', '/pipeline'], ['importer', '/importer'], ['fiche-leedflow', `/contacts/fiche?id=${KLF}`], ['qualifier-leedflow', `/contacts/qualifier?id=${KLF}`], ['inconnu', `/inconnu?tel=${encodeURIComponent(CAPTURE)}`], ['a-trier', '/a-trier'], ['actions', '/actions'], ['action', `/actions?id=${salon.id}`]]) {
      await onglet.goto(`${E}${chemin}`);
      if (nomPage === 'ajouter') {
        await onglet.click('[data-canaux] label:has(input[value=boitage]) span');
        constat(await onglet.isVisible('[data-si=boitage]') && !(await onglet.isVisible('[data-si=recommandation]')), `ajouter sur ${nom} : toucher « Boîtage » montre le choix du passage, cache le prescripteur`);
      }
      await onglet.screenshot({ path: path.join(OUT, `espace-${nomPage}-${nom}.png`), fullPage: true });
      const deborde = await onglet.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      constat(!deborde, `${nomPage} sur ${nom} : pas de débordement horizontal`);
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
