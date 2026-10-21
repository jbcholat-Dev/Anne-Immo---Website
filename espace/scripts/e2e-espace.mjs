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
// Story 13.6 : qualifier (suite obligatoire, date, réveil ou motif exigés, étape et prochaine action fixées, heure de Paris).
// Préalable, dans site/ : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run base:local` ;
// dans espace/ : `npm run build`.
// Lancer depuis espace/ : `node scripts/e2e-espace.mjs`.
import { spawn } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import fs from 'node:fs';
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
fs.writeFileSync(reglages, [`ACCESS_EQUIPE=${equipe}`, 'ACCESS_AUD=essai-aud', 'LIEN_SECRET=essai', `URL_SITE=${S}`].join('\n'));
const journal = path.join(os.tmpdir(), `e2e-${ESSAI}-espace.log`);
const sansProxy = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(https?|all|no)_proxy$/i.test(k)));
const espace = spawn('npx', ['wrangler', 'dev', '--port', String(PORT), '--env-file', reglages, '--persist-to', path.join(SITE, '.wrangler', 'state')],
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

  // 6. Capture de la liste (ordinateur et téléphone).
  const { chromium } = await import('../../site/node_modules/playwright/index.mjs');
  const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [nom, viewport] of [['ordinateur', { width: 1280, height: 900 }], ['telephone', { width: 390, height: 844 }]]) {
    const ctx = await nav.newContext({ viewport, extraHTTPHeaders: { 'cf-access-jwt-assertion': JETON } });
    const onglet = await ctx.newPage();
    for (const [nomPage, chemin] of [['aujourdhui', '/'], ['gestion', '/gestion'], ['ajouter', '/ajouter'], ['contacts', '/contacts'], ['fiche', `/contacts/fiche?id=${saisie.id}`], ['qualifier', `/contacts/qualifier?id=${carla}`], ['importer', '/importer']]) {
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
  site.arreter();
  fs.rmSync(reglages, { force: true });
}
console.log(echecs ? `\n${echecs} échec(s). Journaux : ${site.journal}, ${journal}` : '\nTout est bon.');
process.exit(echecs ? 1 : 0);
