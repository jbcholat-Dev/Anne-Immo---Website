// Essai de bout en bout du programme ambassadeurs (story 17.2) sur le serveur local (wrangler dev, base locale, imitation de
// Turnstile et de Resend, voir serveur-essai.mjs). Vérifie : inscription écrite dans `lead` (source `ambassadeur`, version et
// date du règlement, origine `?c=`), e-mails de bienvenue et « Nouvel ambassadeur », pas de séquence de conseils, case du
// règlement obligatoire, renvoi sans doublon, seconde inscription (même e-mail ou même téléphone) sans nouvelle demande,
// rattachement au contact (nouveau contact hors suivi, ou contact existant marqué sans changer son projet), puis la page dans
// un navigateur (téléphone et ordinateur, formulaire, confirmation, « déjà ambassadeur », renvoi de /ambassadeur, noindex).
// Préalable : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run base:local`. Tant que la
// migration 0022 est dans migrations-a-relire/, le script l'applique lui-même à la base locale si elle manque.
// Lancer : `node scripts/e2e-ambassadeurs.mjs`. Captures dans .verif/ambassadeurs/.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { demarrer, imiterTurnstile, ICI, pause, sid } from './serveur-essai.mjs';

const OUT = path.join(ICI, '.verif', 'ambassadeurs');
fs.mkdirSync(OUT, { recursive: true });
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };

// Migration 0022 sur la base locale si elle n'y est pas encore (colonne `reglement_version` absente).
const colonnes = JSON.parse(execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--json', '--command', "SELECT name FROM pragma_table_info('lead')"], { cwd: ICI, encoding: 'utf8' }))[0].results.map((r) => r.name);
if (!colonnes.includes('reglement_version')) {
  const f = ['migrations', 'migrations-a-relire'].map((d) => path.join(ICI, d, '0022-lead-ambassadeur.sql')).find((x) => fs.existsSync(x));
  execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--file', f], { cwd: ICI, stdio: 'ignore' });
  console.log(`(migration 0022 appliquée à la base locale depuis ${path.relative(ICI, f)})`);
}

const serveur = await demarrer({ nom: 'ambassadeurs' });
const { U, recus, appeler, sql, arreter, essai: ESSAI } = serveur;
let ip = 0;
const poster = (route, corps) =>
  appeler(`${U}/api/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': `203.0.113.${++ip}` }, body: JSON.stringify({ lang: 'fr', turnstile: 'jeton', ...corps }) })
    .then(async (r) => ({ statut: r.status, ...(await r.json()) }));
const attendre = async (lead, canal) => { for (let i = 0; i < 24 && !recus.some((e) => e.idempotence === `${lead}:${canal}`); i++) await pause(250); };
const n = Date.now() % 100000;
const tel = (k) => `06 99 ${String(n).padStart(5, '0').slice(0, 2)} ${String(n).padStart(5, '0').slice(2, 4)} ${String(k).padStart(2, '0')}`;
const e164 = (k) => `+33${tel(k).replace(/\s/g, '').slice(1)}`;

try {
  // 1. Inscription complète, venue d'une carte de visite, avec la case des nouvelles.
  const s1 = sid();
  const claire = { prenom: 'Claire', nom: 'Essai', email: `claire+${ESSAI}@example.com`, telephone: tel(1) };
  let r = await poster('ambassadeurs', { submission_id: s1, ...claire, reglement: 'on', newsletter: 'on', c: 'carte' });
  constat(r.statut === 200 && r.ok && !r.deja, `inscription acceptée (${r.statut})`);
  const [l1] = sql(`SELECT * FROM lead WHERE submission_id = '${s1}'`);
  constat(l1?.source === 'ambassadeur' && l1.reglement_version === 'v1' && l1.reglement_accepte_le === l1.created_at, `demande ambassadeur, règlement v1 accepté le ${l1?.reglement_accepte_le}`);
  constat(l1?.telephone === e164(1) && l1.newsletter_opt_in_at && l1.message === null, 'téléphone au format international, accord des nouvelles gardé, pas de message');
  constat(l1?.utm === '{"utm_source":"carte"}', `origine gardée : ${l1?.utm}`);
  const envois = sql(`SELECT channel FROM lead_delivery WHERE lead_id = '${l1.id}' ORDER BY channel`).map((x) => x.channel);
  constat(JSON.stringify(envois) === '["confirm_prospect","notify_anne"]', `envois prévus : ${envois.join(', ')} (pas de séquence de conseils)`);
  await attendre(l1.id, 'confirm_prospect');
  await attendre(l1.id, 'notify_anne');
  const bienvenue = recus.find((e) => e.idempotence === `${l1.id}:confirm_prospect`);
  const alerte = recus.find((e) => e.idempotence === `${l1.id}:notify_anne`);
  constat(bienvenue?.subject?.endsWith('Bienvenue parmi mes ambassadeurs') && /jusqu'à 1 500 €/.test(bienvenue.text) && bienvenue.text.includes('/ambassadeurs/reglement'),
    `e-mail de bienvenue : « ${bienvenue?.subject} », avec le montant et le lien du règlement`);
  constat(/version 1 du règlement le \d+ \w+ 2026/.test(bienvenue?.text ?? '') && /06 71 99 17 54/.test(bienvenue?.text ?? ''), 'bienvenue : version et date du règlement, numéro d\'Anne');
  constat(alerte?.subject?.endsWith('Nouvel ambassadeur · Claire Essai') && /version v1/.test(alerte.text) && !/Modelo/.test(alerte.text), `alerte à Anne : « ${alerte?.subject} »`);
  fs.writeFileSync(path.join(OUT, 'emails.txt'), [bienvenue, alerte].map((e) => `Objet : ${e?.subject}\n\n${e?.text}`).join('\n\n=====\n\n'));
  if (bienvenue?.html) fs.writeFileSync(path.join(OUT, 'bienvenue.html'), bienvenue.html);

  // 2. Le contact : créé hors suivi, avec la marque ambassadeur.
  for (let i = 0; i < 20 && !sql(`SELECT contact_id FROM lead WHERE id = '${l1.id}'`)[0]?.contact_id; i++) await pause(250);
  const [c1] = sql(`SELECT c.* FROM contact c JOIN lead l ON l.contact_id = c.id WHERE l.id = '${l1.id}'`);
  constat(c1 && c1.etape === null && c1.ambassadeur_inscrit_le === l1.reglement_accepte_le && c1.ambassadeur_reglement === 'v1',
    `contact créé hors suivi, marqué ambassadeur (${c1?.ambassadeur_inscrit_le}, ${c1?.ambassadeur_reglement})`);
  constat(sql(`SELECT count(*) AS n FROM nouveau WHERE contact_id = '${c1?.id}'`)[0].n === 1, 'une carte dans la barre « Nouveaux » de l\'espace');

  // 3. Case du règlement obligatoire ; renvoi sans doublon.
  r = await poster('ambassadeurs', { submission_id: sid(), prenom: 'Sans', nom: 'Case', email: `sans+${ESSAI}@example.com`, telephone: tel(2) });
  constat(r.statut === 400 && r.error?.champ === 'reglement', `sans la case du règlement : refusé (${r.statut}, ${r.error?.champ})`);
  r = await poster('ambassadeurs', { submission_id: s1, ...claire, reglement: 'on', newsletter: 'on', c: 'carte' });
  constat(r.ok && !r.deja && sql(`SELECT count(*) AS n FROM lead WHERE submission_id = '${s1}'`)[0].n === 1, 'renvoi du même formulaire : accepté, une seule demande');

  // 4. Seconde inscription : même e-mail, puis même téléphone avec un autre e-mail.
  const avant = recus.length;
  r = await poster('ambassadeurs', { submission_id: sid(), ...claire, telephone: tel(3), reglement: 'on' });
  constat(r.ok && r.deja === true, 'même e-mail : « déjà ambassadeur »');
  r = await poster('ambassadeurs', { submission_id: sid(), ...claire, email: `autre+${ESSAI}@example.com`, reglement: 'on' });
  constat(r.ok && r.deja === true, 'même téléphone : « déjà ambassadeur »');
  await pause(1500);
  constat(sql(`SELECT count(*) AS n FROM lead WHERE source = 'ambassadeur' AND (email = '${claire.email}' OR telephone = '${e164(1)}')`)[0].n === 1 && recus.length === avant,
    'aucune nouvelle demande, aucun e-mail de plus');

  // 5. Une vendeuse déjà connue s'inscrit : même contact, marque posée, projet inchangé.
  const s2 = sid();
  const marie = { prenom: 'Marie', nom: 'Vendeuse', email: `marie+${ESSAI}@example.com`, telephone: tel(4) };
  r = await poster('contact', { submission_id: s2, ...marie, privacy: 'on', projet: 'vente', message: 'Je pense vendre ma maison.' });
  for (let i = 0; i < 20 && !sql(`SELECT contact_id FROM lead WHERE submission_id = '${s2}'`)[0]?.contact_id; i++) await pause(250);
  const [avantM] = sql(`SELECT c.id, c.projet, c.etape FROM contact c JOIN lead l ON l.contact_id = c.id WHERE l.submission_id = '${s2}'`);
  const s3 = sid();
  r = await poster('ambassadeurs', { submission_id: s3, ...marie, email: `marie.autre+${ESSAI}@example.com`, reglement: 'on' });
  for (let i = 0; i < 20 && !sql(`SELECT contact_id FROM lead WHERE submission_id = '${s3}'`)[0]?.contact_id; i++) await pause(250);
  const [apresM] = sql(`SELECT c.id, c.projet, c.etape, c.ambassadeur_inscrit_le FROM contact c JOIN lead l ON l.contact_id = c.id WHERE l.submission_id = '${s3}'`);
  constat(r.ok && !r.deja && apresM?.id === avantM?.id && apresM.projet === avantM.projet && apresM.etape === avantM.etape && apresM.ambassadeur_inscrit_le,
    `contact déjà connu : même fiche, projet « ${apresM?.projet} » et étape « ${apresM?.etape} » inchangés, marque ambassadeur posée`);

  // 6. La page dans un navigateur.
  const navigateur = await chromium.launch();
  for (const [nom, vue] of [['telephone', { width: 390, height: 844 }], ['ordinateur', { width: 1440, height: 900 }]]) {
    const page = await navigateur.newPage({ viewport: vue });
    await imiterTurnstile(page);
    await page.goto(`${U}/ambassadeurs?c=flyer`);
    constat(await page.locator('meta[name="robots"][content*="noindex"]').count() === 1, `${nom} : page non indexée`);
    constat((await page.locator('h1').textContent())?.includes('Tu connais un bon agent immobilier'), `${nom} : titre de la maquette`);
    const largeur = await page.evaluate(() => document.documentElement.scrollWidth);
    constat(largeur <= vue.width, `${nom} : pas de défilement horizontal (${largeur} px)`);
    await page.screenshot({ path: path.join(OUT, `page-${nom}.png`), fullPage: true });
    const email = `page-${nom}+${ESSAI}@example.com`;
    await page.fill('input[name="prenom"]', 'Paul');
    await page.fill('input[name="nom"]', 'Navigateur');
    await page.fill('input[name="telephone"]', tel(nom === 'telephone' ? 5 : 6));
    await page.fill('input[name="email"]', email);
    await page.click('button[type="submit"]');
    constat(await page.locator('[data-case][data-invalide]').count() === 1, `${nom} : sans la case, le formulaire ne part pas`);
    await page.check('input[name="reglement"]');
    await page.click('button[type="submit"]');
    await page.locator('[data-confirmation="ambassadeurs"]').waitFor({ state: 'visible', timeout: 15000 });
    constat(await page.locator('[data-titre-neuf]').isVisible() && (await page.locator('[data-titre-neuf]').textContent())?.includes('Paul'), `${nom} : confirmation « Bienvenue parmi les ambassadeurs, Paul »`);
    constat((await page.locator('a[href^="https://wa.me/33671991754"]').count()) === 1 && (await page.locator('a[href^="sms:+33671991754"]').count()) === 1, `${nom} : boutons WhatsApp et SMS vers Anne`);
    await page.screenshot({ path: path.join(OUT, `confirmation-${nom}.png`), fullPage: false });
    const [lp] = sql(`SELECT utm FROM lead WHERE email = '${email}'`);
    constat(lp?.utm === '{"utm_source":"flyer"}', `${nom} : origine du flyer gardée (${lp?.utm})`);
    // Seconde inscription depuis la page.
    const p2 = await navigateur.newPage({ viewport: vue });
    await imiterTurnstile(p2);
    await p2.goto(`${U}/ambassadeurs`);
    await p2.fill('input[name="prenom"]', 'Paul');
    await p2.fill('input[name="nom"]', 'Navigateur');
    await p2.fill('input[name="telephone"]', tel(nom === 'telephone' ? 7 : 8));
    await p2.fill('input[name="email"]', email);
    await p2.check('input[name="reglement"]');
    await p2.click('button[type="submit"]');
    await p2.locator('[data-confirmation="ambassadeurs"]').waitFor({ state: 'visible', timeout: 15000 });
    constat(await p2.locator('[data-titre-deja]').isVisible() && !(await p2.locator('[data-titre-neuf]').isVisible()), `${nom} : « Vous êtes déjà ambassadeur »`);
    await p2.close();
    await page.close();
  }
  const page = await navigateur.newPage();
  await page.goto(`${U}/ambassadeur?c=carte`);
  await page.waitForURL(/\/ambassadeurs\?c=carte$/, { timeout: 5000 }).catch(() => {});
  constat(/\/ambassadeurs\?c=carte$/.test(page.url()), `/ambassadeur?c=carte renvoie vers ${new URL(page.url()).pathname}${new URL(page.url()).search}`);
  await page.goto(`${U}/ambassadeurs/reglement`);
  constat((await page.locator('h1').textContent())?.includes('Règlement') && (await page.locator('article h2').count()) === 11, 'règlement publié : 11 articles');
  await page.screenshot({ path: path.join(OUT, 'reglement.png'), fullPage: true });
  await navigateur.close();
} finally {
  arreter();
}
console.log(echecs ? `\n${echecs} échec(s)` : '\nEssai réussi.');
process.exit(echecs ? 1 : 0);
