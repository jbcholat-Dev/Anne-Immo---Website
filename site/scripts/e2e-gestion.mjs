// Essai de bout en bout de l'espace de gestion des demandes et des droits RGPD (story 10.7), sur le serveur local
// (wrangler dev, base locale, imitation de Turnstile, de Resend et de Cloudflare Access, voir serveur-essai.mjs).
// Vérifie : accès refusé sans jeton Access valable (absent, mal signé, autre application, périmé, autre équipe, en-tête
// interne forgé), liste et recherche, fiche, relance d'un envoi en échec, marque Modelo, export des données d'une adresse,
// effacement (refusé sans confirmation exacte, puis fait), journal des droits exercés, purge des demandes de plus de 3 ans
// par la tâche planifiée, puis les pages dans un navigateur (ordinateur et téléphone). Captures dans .verif/.
// Préalable : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run base:local`.
// Lancer : `node scripts/e2e-gestion.mjs`.
import { generateKeyPairSync } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { demarrer, ICI, pause, sid } from './serveur-essai.mjs';

const OUT = path.join(ICI, '.verif');
fs.mkdirSync(OUT, { recursive: true });
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };
const serveur = await demarrer({ nom: 'gestion' });
const { U, recus, etat, appeler, sql, arreter, essai: ESSAI, jetonAcces } = serveur;

const JETON = jetonAcces();
const avecJeton = (jeton = JETON, autres = {}) => ({ 'cf-access-jwt-assertion': jeton, ...autres });
const formulaire = (route, champs, jeton = JETON) => appeler(`${U}/api/gestion/${route}`, {
  method: 'POST', redirect: 'manual', headers: avecJeton(jeton, { 'Content-Type': 'application/x-www-form-urlencoded', Origin: U }),
  body: new URLSearchParams(champs).toString(),
});
let ip = 0;
const poster = (route, corps) =>
  appeler(`${U}/api/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': `203.0.113.${++ip}` }, body: JSON.stringify({ lang: 'fr', turnstile: 'jeton', privacy: 'on', ...corps }) })
    .then(async (r) => ({ statut: r.status, ...(await r.json()) }));
const attendre = async (lead, canal) => { for (let i = 0; i < 24 && !recus.some((e) => e.idempotence === `${lead}:${canal}`); i++) await pause(250); };
const leadDe = (s) => sql(`SELECT id FROM lead WHERE submission_id = '${s}'`)[0]?.id;

try {
  // 0. Deux demandes de la même adresse ; la seconde arrive pendant une panne de l'envoi d'e-mails.
  const EMAIL = `claire+${ESSAI}@example.com`;
  const s1 = sid(), s2 = sid();
  await poster('guide', { submission_id: s1, prenom: 'Claire', nom: 'Essai', email: EMAIL });
  const lead1 = leadDe(s1);
  await attendre(lead1, 'confirm_prospect');
  etat.enPanne = true;
  await poster('guide', { submission_id: s2, prenom: 'Claire', nom: 'Essai', email: EMAIL.toUpperCase(), telephone: '0601020304' });
  const lead2 = leadDe(s2);
  for (let i = 0; i < 24 && sql(`SELECT count(*) AS n FROM lead_delivery WHERE lead_id = '${lead2}' AND status = 'failed'`)[0].n < 2; i++) await pause(250);
  etat.enPanne = false;
  constat(!!lead1 && !!lead2 && sql(`SELECT count(*) AS n FROM lead_delivery WHERE lead_id = '${lead2}' AND status = 'failed'`)[0].n >= 1, 'deux demandes de la même adresse, la seconde avec des envois en échec');

  // 1. Accès : sans jeton Access valable, rien n'est servi.
  const { privateKey: autreCle } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const refus = [
    ['sans jeton', {}],
    ['jeton mal signé', avecJeton(jetonAcces({}, autreCle))],
    ['jeton d\'une autre application', avecJeton(jetonAcces({ aud: ['autre-aud'] }))],
    ['jeton périmé', avecJeton(jetonAcces({ exp: Math.floor(Date.now() / 1000) - 10 }))],
    ['jeton d\'une autre équipe', avecJeton(jetonAcces({ iss: 'https://autre.cloudflareaccess.com' }))],
    ['jeton sans adresse', avecJeton(jetonAcces({ email: undefined }))],
    ['jeton tronqué', avecJeton(JETON.split('.').slice(0, 2).join('.'))],
    ['en-tête interne forgé', { 'x-gestion-compte': 'pirate@example.com' }],
  ];
  for (const [nom, entetes] of refus) {
    const pages = await Promise.all(['/gestion', `/gestion/lead?id=${lead1}`, `/api/gestion/export?email=${encodeURIComponent(EMAIL)}`, '/GESTION', '/gestion.html']
      .map((c) => appeler(`${U}${c}`, { headers: entetes }).then(async (r) => ({ statut: r.status, corps: await r.text() }))));
    constat(pages.slice(0, 3).every((p) => p.statut === 403) && pages.every((p) => [403, 404].includes(p.statut) && !p.corps.includes(EMAIL)),
      `${nom} : 403 sur la liste, la fiche et l'export ; variantes d'adresse en 403 ou 404, aucune donnée`);
  }
  let r = await formulaire('effacer', { email: EMAIL, confirmation: EMAIL }, jetonAcces({ aud: ['autre-aud'] }));
  constat(r.status === 403 && sql(`SELECT count(*) AS n FROM lead WHERE lower(email) = '${EMAIL}'`)[0].n === 2, 'effacement sans jeton valable : 403, rien effacé');

  // 2. Liste et recherche.
  r = await appeler(`${U}/gestion`, { headers: avecJeton() });
  let html = await r.text();
  constat(r.status === 200 && html.includes(`data-lead="${lead1}"`) && html.includes(`data-lead="${lead2}"`) && html.includes('anne@example.com'), 'liste : 200, les deux demandes, le compte connecté affiché');
  constat(/no-store/.test(r.headers.get('cache-control') ?? '') && /noindex/.test(r.headers.get('x-robots-tag') ?? ''), 'liste ni gardée en cache ni indexée');
  r = await appeler(`${U}/gestion?q=${encodeURIComponent(EMAIL)}`, { headers: avecJeton() });
  html = await r.text();
  constat(html.includes('data-droits') && html.includes(`data-lead="${lead1}"`) && html.includes(`data-lead="${lead2}"`), 'recherche par adresse : les deux demandes et le cadre des droits RGPD');
  r = await appeler(`${U}/gestion?q=${encodeURIComponent('06 01 02 03 04')}`, { headers: avecJeton() });
  html = await r.text();
  constat(html.includes(`data-lead="${lead2}"`) && !html.includes(`data-lead="${lead1}"`) && !html.includes('data-droits'), 'recherche par téléphone (« 06 01 02 03 04 ») : seulement la demande qui le porte');

  // 3. Fiche d'une demande.
  r = await appeler(`${U}/gestion/lead?id=${lead2}`, { headers: avecJeton() });
  html = await r.text();
  const tokenLead = sql(`SELECT token FROM lead WHERE id = '${lead2}'`)[0]?.token;
  constat(r.status === 200 && html.includes('+33601020304') && html.includes('data-envois') && (!tokenLead || !html.includes(tokenLead)), 'fiche : champs lisibles, envois, aucun jeton technique affiché');
  r = await appeler(`${U}/gestion/lead?id=01ARZ3NDEKTSV4RRFFQ69G5FAV`, { headers: avecJeton() });
  constat(r.status === 404, 'fiche d\'une demande inconnue : 404');

  // 4. Relance d'un envoi en échec.
  const enEchec = sql(`SELECT channel FROM lead_delivery WHERE lead_id = '${lead2}' AND status = 'failed' ORDER BY channel`)[0]?.channel;
  r = await formulaire('rejouer', { id: lead2, canal: enEchec });
  await attendre(lead2, enEchec);
  const apres = sql(`SELECT status, attempts FROM lead_delivery WHERE lead_id = '${lead2}' AND channel = '${enEchec}'`)[0];
  constat(r.status === 303 && r.headers.get('location') === `/gestion/lead?id=${lead2}&m=rejoue` && apres?.status === 'delivered' && recus.some((e) => e.idempotence === `${lead2}:${enEchec}`), `relance de « ${enEchec} » : e-mail parti, envoi marqué fait`);
  r = await formulaire('rejouer', { id: lead2, canal: enEchec });
  constat(r.headers.get('location')?.endsWith('m=rejeu-impossible'), 'relance d\'un envoi déjà fait : refusée');
  r = await formulaire('rejouer', { id: lead2, canal: 'modelo' });
  constat(r.headers.get('location')?.endsWith('m=rejeu-impossible'), 'relance d\'un canal qui n\'est pas un e-mail : refusée');

  // 5. Marque « recopiée dans Modelo ».
  r = await formulaire('modelo', { id: lead1, recopie: '1' });
  const modelo = sql(`SELECT status, delivered_at FROM lead_delivery WHERE lead_id = '${lead1}' AND channel = 'modelo'`)[0];
  constat(r.headers.get('location') === `/gestion/lead?id=${lead1}&m=modelo` && modelo?.status === 'delivered' && !!modelo.delivered_at, 'Modelo : marque posée, datée');
  html = await (await appeler(`${U}/gestion`, { headers: avecJeton() })).text();
  r = await formulaire('modelo', { id: lead1, recopie: '0' });
  constat(r.headers.get('location')?.endsWith('m=modelo-annule') && sql(`SELECT count(*) AS n FROM lead_delivery WHERE lead_id = '${lead1}' AND channel = 'modelo'`)[0].n === 0, 'Modelo : marque retirée');
  await formulaire('modelo', { id: lead1, recopie: '1' });
  r = await formulaire('modelo', { id: '01ARZ3NDEKTSV4RRFFQ69G5FAV', recopie: '1' });
  constat(r.status === 404, 'Modelo sur une demande inconnue : 404');

  // 6. Droit d'accès : export JSON.
  r = await appeler(`${U}/api/gestion/export?email=${encodeURIComponent(EMAIL.toUpperCase())}`, { headers: avecJeton() });
  const texte = await r.text();
  const exp = JSON.parse(texte);
  constat(r.status === 200 && /attachment; filename="donnees-/.test(r.headers.get('content-disposition') ?? '') && /no-store/.test(r.headers.get('cache-control') ?? ''), 'export : fichier JSON en pièce jointe, pas de cache');
  constat(exp.email === EMAIL && exp.demandes.length === 2 && exp.demandes.every((d) => d.email.toLowerCase() === EMAIL && Array.isArray(d.envois)), 'export : les deux demandes de l\'adresse, quelle que soit la casse, avec leurs envois');
  constat(!/"(token|token_browser|submission_id)"/.test(texte), 'export : aucun champ technique');
  const acces = sql(`SELECT type, email_empreinte, leads, par FROM droit_exerce ORDER BY id DESC LIMIT 1`)[0];
  constat(acces?.type === 'acces' && acces.leads === 2 && acces.par === 'anne@example.com' && !acces.email_empreinte.includes('@'), 'journal : droit d\'accès noté (empreinte de l\'adresse, pas l\'adresse)');

  // 7. Droit à l'effacement.
  r = await formulaire('effacer', { email: EMAIL, confirmation: 'claire@example.com' });
  constat(r.headers.get('location') === `/gestion?q=${encodeURIComponent(EMAIL)}&m=confirmation` && sql(`SELECT count(*) AS n FROM lead WHERE lower(email) = '${EMAIL}'`)[0].n === 2, 'effacement avec une confirmation fausse : refusé, rien effacé');
  r = await formulaire('effacer', { email: EMAIL, confirmation: ` ${EMAIL.toUpperCase()} ` });
  constat(r.headers.get('location') === '/gestion?m=efface-2', 'effacement confirmé : 2 demandes effacées');
  constat(sql(`SELECT count(*) AS n FROM lead WHERE lower(email) = '${EMAIL}'`)[0].n === 0 && sql(`SELECT count(*) AS n FROM lead_delivery WHERE lead_id IN ('${lead1}', '${lead2}')`)[0].n === 0, 'plus aucune demande ni envoi pour cette adresse');
  const eff = sql(`SELECT type, leads, par FROM droit_exerce ORDER BY id DESC LIMIT 1`)[0];
  constat(eff?.type === 'effacement' && eff.leads === 2 && eff.par === 'anne@example.com', 'journal : effacement noté');

  // 8. Purge par la tâche planifiée : plus de 3 ans sans activité, supprimée ; juste moins, gardée.
  const s3 = sid(), s4 = sid();
  await poster('guide', { submission_id: s3, prenom: 'Vieux', nom: 'Essai', email: `vieux+${ESSAI}@example.com` });
  await poster('guide', { submission_id: s4, prenom: 'Recent', nom: 'Essai', email: `recent+${ESSAI}@example.com` });
  const [vieux, recent] = [leadDe(s3), leadDe(s4)];
  const ilYa = (ans, jours) => { const d = new Date(); d.setUTCFullYear(d.getUTCFullYear() - ans); d.setUTCDate(d.getUTCDate() + jours); return d.toISOString(); };
  sql(`UPDATE lead SET last_activity_at = '${ilYa(3, -1)}', created_at = '${ilYa(3, -1)}' WHERE id = '${vieux}'`);
  sql(`UPDATE lead SET last_activity_at = '${ilYa(3, 1)}', created_at = '${ilYa(3, -10)}' WHERE id = '${recent}'`);
  await appeler(`${U}/cdn-cgi/handler/scheduled`);
  await pause(1000);
  constat(sql(`SELECT count(*) AS n FROM lead WHERE id = '${vieux}'`)[0].n === 0 && sql(`SELECT count(*) AS n FROM lead_delivery WHERE lead_id = '${vieux}'`)[0].n === 0, 'purge : demande sans activité depuis plus de 3 ans supprimée, avec ses envois');
  constat(sql(`SELECT count(*) AS n FROM lead WHERE id = '${recent}'`)[0].n === 1, 'purge : demande ancienne mais active depuis moins de 3 ans gardée');

  // 9. Navigateur : la liste, la fiche, le cadre des droits, sur ordinateur et téléphone.
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const erreurs = [];
  for (const [nom, viewport] of [['ordinateur', { width: 1280, height: 900 }], ['telephone', { width: 390, height: 844 }]]) {
    const ctx = await navigateur.newContext({ viewport, extraHTTPHeaders: avecJeton() });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
    await page.goto(`${U}/gestion`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUT, `gestion-liste-${nom}.png`), fullPage: true });
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    constat(!deborde, `liste sur ${nom} : pas de défilement horizontal de la page`);
    await page.goto(`${U}/gestion/lead?id=${recent}`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(OUT, `gestion-fiche-${nom}.png`), fullPage: true });
    constat(await page.isVisible('[data-fiche]'), `fiche sur ${nom} : affichée`);
    if (nom === 'ordinateur') {
      await page.goto(`${U}/gestion?q=${encodeURIComponent(`recent+${ESSAI}@example.com`)}`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(OUT, 'gestion-droits-ordinateur.png'), fullPage: true });
    }
    if (nom === 'telephone') {
      await page.click('form[action="/api/gestion/modelo"] button');
      await page.waitForSelector('[data-message]', { timeout: 10000 }).catch(() => {});
      constat(((await page.textContent('[data-message]').catch(() => '')) ?? '').includes('Modelo'), 'bouton Modelo dans le navigateur : message de confirmation');
      await page.goto(`${U}/gestion?q=${encodeURIComponent(`recent+${ESSAI}@example.com`)}`, { waitUntil: 'networkidle' });
      await page.screenshot({ path: path.join(OUT, 'gestion-droits-telephone.png'), fullPage: true });
      await page.fill('[data-effacer] input[name="confirmation"]', `recent+${ESSAI}@example.com`);
      await page.click('[data-effacer] button');
      await page.waitForSelector('[data-message]', { timeout: 10000 }).catch(() => {});
      constat(((await page.textContent('[data-message]').catch(() => '')) ?? '').includes('1 demande(s) effacée(s)'), 'effacement dans le navigateur : « 1 demande(s) effacée(s) »');
    }
    await ctx.close();
  }
  constat(erreurs.length === 0, `aucune erreur console (${erreurs.join(' | ')})`);
  await navigateur.close();
} finally {
  arreter();
}
console.log(echecs ? `\n${echecs} constat(s) en échec` : '\nTous les constats sont bons');
process.exit(echecs ? 1 : 0);
