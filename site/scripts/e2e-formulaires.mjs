// Essai de bout en bout des formulaires réels (story 10.3) : serveur local Cloudflare (wrangler dev) + base locale,
// avec une imitation de Turnstile et de Resend (le serveur local ne peut pas les joindre). Vérifie :
// barrières anti-robot, validation, écriture en base, idempotence, e-mails routés vers la boîte de test, échec puis rejeu,
// et un vrai envoi depuis la page /contact dans un navigateur (avec la clé d'essai Turnstile de Cloudflare).
// Préalable : construire avec la clé d'essai, `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build`,
// et la base locale à jour, `npm run base:local`. Lancer : `node scripts/e2e-formulaires.mjs`.
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ICI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ICI, '.verif');
const PORT = 8788, PORT_IMITATION = 8790, U = `http://localhost:${PORT}`;
const ESSAI = `run-${Date.now().toString(36)}`;
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };

// Imitation de Turnstile (accepte tout jeton sauf « refuse ») et de Resend (garde les e-mails reçus ; en panne sur demande).
const recus = [];
let enPanne = false;
const imitation = createServer((req, res) => {
  let corps = '';
  req.on('data', (c) => (corps += c));
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');
    if (req.url === '/turnstile') return res.end(JSON.stringify({ success: !corps.includes('response=refuse'), 'error-codes': [] }));
    if (req.url === '/resend') {
      if (enPanne) { res.statusCode = 500; return res.end(JSON.stringify({ name: 'imitation_en_panne', message: 'panne simulée' })); }
      recus.push({ ...JSON.parse(corps), idempotence: req.headers['idempotency-key'] });
      return res.end(JSON.stringify({ id: `imitation-${recus.length}` }));
    }
    res.statusCode = 404; res.end('{}');
  });
});
await new Promise((ok) => imitation.listen(PORT_IMITATION, ok));

const reglages = path.join(os.tmpdir(), `essai-formulaires-${ESSAI}.vars`);
fs.writeFileSync(reglages, [
  'TURNSTILE_SECRET_KEY=essai', 'RESEND_API_KEY=essai', 'BOITE_TEST=boite-test@example.com',
  `URL_SERVICES_ESSAI=http://localhost:${PORT_IMITATION}`,
].join('\n'));
fs.mkdirSync(OUT, { recursive: true });
const JOURNAL = path.join(os.tmpdir(), `e2e-formulaires-${ESSAI}.log`); // journal du serveur local, hors du dossier du site
const journalServeur = fs.openSync(JOURNAL, 'w');
// Sans réglage de proxy : wrangler ferait passer par lui les appels du serveur local vers l'imitation, qui est sur cette machine.
const sansProxy = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(https?|all|no)_proxy$/i.test(k)));
const serveur = spawn('npx', ['wrangler', 'dev', '--port', String(PORT), '--env-file', reglages, '--test-scheduled'], { cwd: ICI, detached: true, stdio: ['ignore', journalServeur, journalServeur], env: sansProxy });
const arreter = () => { try { process.kill(-serveur.pid); } catch {} imitation.close(); fs.rmSync(reglages, { force: true }); };
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`${U}/api/sante`)).ok) break; } catch {}
  await new Promise((ok) => setTimeout(ok, 1000));
}

const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));
// Le serveur local ferme parfois une connexion réutilisée : on réessaie une fois avant de conclure.
const appeler = (url, options) => fetch(url, options).catch(() => pause(500).then(() => fetch(url, options)));
const sql = (requete) =>
  JSON.parse(execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--json', '--command', requete], { cwd: ICI, encoding: 'utf8' }))[0].results;
let n = 0;
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const sid = () => { n++; return Array.from({ length: 26 }, () => ALPHABET[Math.floor(Math.random() * 32)]).join(''); };
// Chaque cas porte sa propre adresse IP pour ne pas épuiser la limite de 5 envois par minute.
const envoyer = (source, corps, ip = `198.51.100.${n}`) =>
  appeler(`${U}/api/${source}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': ip }, body: JSON.stringify({ lang: 'fr', turnstile: 'jeton', privacy: 'on', ...corps }) })
    .then(async (r) => ({ statut: r.status, ...(await r.json()) }));


try {
  const contact = { prenom: 'Marie', nom: 'Essai', email: `marie+${ESSAI}@example.com`, telephone: '06 12 34 56 78', projet: 'vente', message: 'Bonjour, je vends un T3.', utm: { utm_source: 'essai' } };

  // 1. Envoi valide, puis renvoi identique (idempotence).
  const s1 = sid();
  let r = await envoyer('contact', { ...contact, submission_id: s1 });
  constat(r.ok === true, `contact valide accepté (${r.statut})`);
  r = await envoyer('contact', { ...contact, submission_id: s1 });
  constat(r.ok === true, 'renvoi du même envoi accepté');
  const lignes = sql(`SELECT id, telephone, is_test, utm, lang FROM lead WHERE submission_id = '${s1}'`);
  constat(lignes.length === 1, `un seul lead pour deux envois (${lignes.length})`);
  constat(lignes[0]?.telephone === '+33612345678' && lignes[0]?.is_test === 1 && lignes[0]?.lang === 'fr', 'téléphone en E.164, lead marqué test (aperçu), langue fr');
  constat(lignes[0]?.utm === '{"utm_source":"essai"}', 'paramètres de campagne gardés');

  // 2. Barrières et validation : rien n'est écrit.
  const refus = [
    ['jeton anti-robot absent', 'contact', { ...contact, turnstile: '' }, 'ANTI_ROBOT', 403],
    ['jeton anti-robot refusé', 'contact', { ...contact, turnstile: 'refuse' }, 'ANTI_ROBOT', 403],
    ['champ piège rempli', 'contact', { ...contact, site_web: 'https://spam.example' }, 'ANTI_ROBOT', 403],
    ['message manquant', 'contact', { ...contact, message: '' }, 'CHAMP_INVALIDE', 400],
    ['téléphone faux', 'contact', { ...contact, telephone: '12 34' }, 'CHAMP_INVALIDE', 400],
    ['case de confidentialité non cochée', 'contact', { ...contact, privacy: undefined }, 'CHAMP_INVALIDE', 400],
    ['commune manquante (estimation)', 'estimation', { ...contact, type_bien: 'Maison' }, 'CHAMP_INVALIDE', 400],
    ['clé d\'idempotence invalide', 'contact', { ...contact, submission_id: 'abc' }, 'CHAMP_INVALIDE', 400],
  ];
  for (const [nom, source, corps, code, statut] of refus) {
    const id = sid();
    r = await envoyer(source, { submission_id: id, ...corps });
    const ecrit = sql(`SELECT count(*) AS n FROM lead WHERE submission_id = '${id}'`)[0].n;
    constat(r.ok === false && r.error?.code === code && r.statut === statut && ecrit === 0, `${nom} : ${r.error?.code} ${r.statut}, rien d'écrit`);
  }

  // 3. Limite de fréquence : le 6e envoi de la même adresse en une minute est refusé.
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await envoyer('contact', { ...contact, submission_id: sid() }, '203.0.113.7')).statut);
  constat(codes.at(-1) === 429, `limite de fréquence : ${codes.join(' ')}`);

  // 4. Guide sans téléphone : seulement la notification à Anne (Anne envoie le PDF à la main jusqu'à la story 10.5).
  const s4 = sid();
  r = await envoyer('guide', { submission_id: s4, prenom: 'Paul', nom: 'Guide', email: `paul+${ESSAI}@example.com`, newsletter: 'on' });
  const canaux = sql(`SELECT d.channel, l.newsletter_opt_in_at FROM lead l JOIN lead_delivery d ON d.lead_id = l.id WHERE l.submission_id = '${s4}'`);
  constat(r.ok && canaux.length === 1 && canaux[0].channel === 'notify_anne' && canaux[0].newsletter_opt_in_at, 'guide sans téléphone : accepté, notification à Anne seule, séquence horodatée');

  // 5. E-mails : tous vers la boîte de test, objets marqués [TEST], « Répondre » de la notification = le prospect.
  await pause(1500);
  const etats = sql(`SELECT d.channel, d.status, d.attempts FROM lead l JOIN lead_delivery d ON d.lead_id = l.id WHERE l.submission_id = '${s1}' ORDER BY d.channel`);
  constat(etats.length === 2 && etats.every((e) => e.status === 'delivered' && e.attempts === 1), `contact : ${etats.map((e) => `${e.channel}=${e.status}`).join(', ')}`);
  const notif = recus.find((e) => e.subject.includes('Nouvelle demande · Contact (vente) · Marie Essai'));
  const conf = recus.find((e) => e.subject.includes('Votre message à Anne'));
  constat(recus.every((e) => e.to[0] === 'boite-test@example.com' && e.subject.startsWith('[TEST]')), `${recus.length} e-mails, tous vers la boîte de test`);
  constat(notif?.reply_to === contact.email && /Nom\nEssai\n\nPrénom\nMarie\n\nTéléphone\n\+33 6 12 34 56 78/.test(notif.text), 'notification à Anne : blocs dans l\'ordre de la fiche Modelo, réponse au prospect');
  constat(!!conf && conf.text.includes('Bonjour Marie') && conf.text.includes('+33 6 12 34 56 78'), 'confirmation au prospect');
  constat(new Set(recus.map((e) => e.idempotence)).size === recus.length, 'une clé anti-doublon par e-mail');

  // 6. Resend en panne : le visiteur a quand même sa confirmation ; l'envoi est noté en échec, puis rejoué par la tâche planifiée.
  enPanne = true;
  const s6 = sid();
  r = await envoyer('estimation', { submission_id: s6, ...contact, message: '', commune_bien: 'Thonon-les-Bains', type_bien: 'Appartement' });
  await pause(1500);
  let e6 = sql(`SELECT d.status, d.attempts, d.last_error FROM lead l JOIN lead_delivery d ON d.lead_id = l.id WHERE l.submission_id = '${s6}'`);
  constat(r.ok && e6.length === 2 && e6.every((e) => e.status === 'failed' && e.attempts === 1 && e.last_error.includes('500')), `panne : visiteur ${r.ok ? 'confirmé' : 'en échec'}, envois ${e6.map((e) => e.status).join('/')}`);
  enPanne = false;
  await appeler(`${U}/cdn-cgi/handler/scheduled`);
  await pause(2000);
  e6 = sql(`SELECT d.status, d.attempts FROM lead l JOIN lead_delivery d ON d.lead_id = l.id WHERE l.submission_id = '${s6}'`);
  constat(e6.every((e) => e.status === 'delivered' && e.attempts === 2), `rejeu par la tâche planifiée : ${e6.map((e) => `${e.status} (${e.attempts} essais)`).join(', ')}`);

  // 7. Dans un navigateur : la page /contact charge Turnstile seulement à l'envoi, puis affiche la confirmation.
  // Le widget Turnstile ne se charge pas depuis cette machine (iframe de Cloudflare refusée par le réseau) : on sert à sa place
  // une imitation de son script, qui rend un jeton. On vérifie ainsi le comportement de la page ; le vrai widget est essayé sur l'aperçu.
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await (await navigateur.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.route('https://challenges.cloudflare.com/**', (route) => route.fulfill({
    contentType: 'text/javascript',
    body: `window.turnstile = { _o: {}, render(el, o) { const id = 'w' + Math.random(); this._o[id] = o; return id; },
      execute(id) { setTimeout(() => this._o[id].callback('jeton-navigateur'), 50); }, remove(id) { delete this._o[id]; } };`,
  }));
  const scripts = [];
  page.on('request', (q) => { if (q.url().includes('challenges.cloudflare.com')) scripts.push(q.url()); });
  const consoleNav = [];
  page.on('console', (m) => consoleNav.push(`${m.type()} ${m.text()}`));
  page.on('requestfailed', (q) => consoleNav.push(`échec ${q.url()} ${q.failure()?.errorText}`));
  await page.goto(`${U}/contact?utm_source=navigateur`, { waitUntil: 'networkidle' });
  constat(scripts.length === 0, 'Turnstile non chargé à l\'ouverture de la page');
  const f = page.locator('form[data-formulaire="contact"]').first();
  await f.locator('[name=prenom]').fill('Jeanne');
  await f.locator('[name=nom]').fill('Navigateur');
  await f.locator('[name=email]').fill(`jeanne+${ESSAI}@example.com`);
  await f.locator('[name=telephone]').fill('06 98 76 54 32');
  await f.locator('[name=message]').fill('Essai depuis le navigateur.');
  await f.locator('[name=privacy]').check();
  await f.locator('[type=submit]').click();
  const confirmation = page.locator('[data-confirmation="contact"]').first();
  await confirmation.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
  await page.screenshot({ path: path.join(OUT, 'e2e-formulaires-contact.png') });
  constat(await confirmation.isVisible(), `confirmation affichée après l'envoi (Turnstile chargé : ${scripts.length > 0})`);
  if (!(await confirmation.isVisible())) console.log(consoleNav.slice(-15).join('\n'));
  const jeanne = sql(`SELECT lang, utm, source FROM lead WHERE email = 'jeanne+${ESSAI}@example.com'`);
  constat(jeanne.length === 1 && jeanne[0].utm === '{"utm_source":"navigateur"}', 'lead du navigateur écrit, avec sa campagne');
  await navigateur.close();
} finally {
  arreter();
  // Écrit après l'arrêt du serveur local : une écriture dans le dossier du site pendant l'essai le fait redémarrer.
  fs.writeFileSync(path.join(OUT, 'e2e-formulaires-emails.txt'), recus.map((e) => `À : ${e.to}\nRépondre à : ${e.reply_to ?? '—'}\nObjet : ${e.subject}\n\n${e.text}`).join('\n\n==========\n\n'));
}
console.log(echecs ? `\n${echecs} constat(s) en échec. Journal du serveur local : ${JOURNAL}` : '\nTous les constats sont bons.');
process.exit(echecs ? 1 : 0);
