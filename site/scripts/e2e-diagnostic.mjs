// Essai de bout en bout du diagnostic (stories 3.x et 10.4) sur le serveur local (wrangler dev, base locale, imitation de
// Turnstile et de Resend, voir serveur-essai.mjs). Vérifie le gate côté serveur (AD-5) : réponses revérifiées, score calculé
// par le serveur, lead écrit avec son jeton, renvoi sans second lead, page de résultats rendue par le serveur dans un seul
// navigateur pendant 24 heures (404 sinon), inscription à la séquence, e-mails ; puis les 17 écrans dans un navigateur
// (sortie A, sortie B, « Stratégie à risque », abandon et reprise, échec puis « Renvoyer »). Captures dans .verif/.
// Préalable : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run base:local`.
// Lancer : `node scripts/e2e-diagnostic.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { demarrer, imiterTurnstile, ICI, pause, sid } from './serveur-essai.mjs';

const OUT = path.join(ICI, '.verif');
fs.mkdirSync(OUT, { recursive: true });
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };
const serveur = await demarrer({ nom: 'diagnostic' });
const { U, recus, appeler, sql, arreter, journal: JOURNAL, essai: ESSAI } = serveur;

// Les 17 écrans : réponses par identifiants, comme l'îlot les envoie.
const ORDRE = ['q01', 'q02', 'q03', 'q04', 'q05', 'q06', 'q07', 'q08', 'q09', 'q10a', 'q10b', 'q11a', 'q11b', 'q12', 'q13', 'q14', 'q15'];
const reponses = (choix) => Object.fromEntries(ORDRE.map((q, i) => [q, choix[i] === 'texte' ? ['q15.texte'] : choix[i] === 'passer' ? [] : Array.isArray(choix[i]) ? (choix[i].length ? choix[i] : [`${q}.i`]) : [choix[i]]]));
// Sortie A : bonnes réponses, q14 premium, q12 « sereinement »
const CHOIX_A = ['q01.b', 'q02.a', 'q03.a', 'q04.a', 'q05.a', 'q06.a', ['q07.a', 'q07.b', 'q07.c', 'q07.d', 'q07.e', 'q07.f'], 'q08.a', 'q09.a', 'q10a.a', 'q10b.b', 'q11a.b', 'q11b.a', 'q12.c', ['q13.g'], 'q14.a', 'texte'];
// Sortie B : réponses moyennes, q12 minimiser
const CHOIX_B = ['q01.a', 'q02.b', 'q03.b', 'q04.b', 'q05.c', 'q06.b', ['q07.a', 'q07.b'], 'q08.b', 'q09.b', 'q10a.b', 'q10b.a', 'q11a.c', 'q11b.a', 'q12.d', ['q13.a', 'q13.c'], 'q14.b', 'passer'];
// Risque : mauvaises réponses
const CHOIX_R = ['q01.d', 'q02.c', 'q03.c', 'q04.c', 'q05.e', 'q06.d', [], 'q08.d', 'q09.c', 'q10a.d', 'q10b.c', 'q11a.a', 'q11b.e', 'q12.b', ['q13.a'], 'q14.c', 'passer'];

let ip = 0;
const coord = (prenom) => ({ prenom, nom: 'Essai', email: `${prenom.toLowerCase()}+${ESSAI}@example.com`, telephone: '06 12 34 56 78', privacy: 'on' });
const diagnostic = (corps) =>
  appeler(`${U}/api/diagnostic`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': `198.51.100.${++ip}` }, body: JSON.stringify({ lang: 'fr', turnstile: 'jeton', journey_id: 'essai', ...corps }) })
    .then(async (r) => ({ statut: r.status, ...(await r.json()) }));
const page = (url, cookie) => appeler(`${U}${url}`, { redirect: 'manual', headers: cookie ? { cookie } : {} });
const erreursNav = [];

try {
  // 1. Gate valide : le serveur calcule, écrit le lead avec son jeton et renvoie l'adresse des résultats.
  const s1 = sid();
  let r = await diagnostic({ submission_id: s1, reponses: reponses(CHOIX_A), message: 'Vente prévue au printemps.', utm: { utm_source: 'essai' }, ...coord('Claire') });
  const url = r.url ?? '';
  constat(r.ok === true && /^\/diagnostic\/resultats\?t=[A-Za-z0-9_-]{43}$/.test(url), `gate valide accepté, adresse des résultats liée à un jeton (${r.statut})`);
  const l1 = sql(`SELECT id, token, band, orientation, scores, answers, message, telephone, is_test FROM lead WHERE submission_id = '${s1}'`);
  const sc1 = JSON.parse(l1[0]?.scores ?? '{}');
  constat(l1.length === 1 && url.endsWith(l1[0].token) && l1[0].band === 'prepare' && l1[0].orientation === 'A' && sc1.total >= 71, `lead écrit : score ${sc1.total}, profil ${l1[0]?.band}, sortie ${l1[0]?.orientation}`);
  constat(sc1.categories?.efficacite?.brut === 20 && l1[0]?.message === 'Vente prévue au printemps.' && l1[0]?.is_test === 1, 'sous-scores, message libre (question 15) et marque de test écrits');

  // 2. Renvoi du même envoi : même adresse, un seul lead.
  r = await diagnostic({ submission_id: s1, reponses: reponses(CHOIX_A), ...coord('Claire') });
  constat(r.ok && r.url === url && sql(`SELECT count(*) AS n FROM lead WHERE submission_id = '${s1}'`)[0].n === 1, 'renvoi : même adresse de résultats, aucun second lead');

  // 3. Règles CAP-7 et indicatif suisse.
  const s3 = sid();
  r = await diagnostic({ submission_id: s3, reponses: reponses(CHOIX_B), ...coord('Marc'), telephone: '079 123 45 67', indicatif: '+41' });
  const l3 = sql(`SELECT orientation, band, telephone FROM lead WHERE submission_id = '${s3}'`)[0];
  constat(r.ok && l3?.orientation === 'B' && l3?.telephone === '+41791234567', `« minimiser les frais » force la sortie B ; numéro suisse écrit ${l3?.telephone}`);

  // 4. Réponses non conformes au questionnaire : refusées, rien d'écrit.
  const invalides = [
    ['option inconnue', { ...reponses(CHOIX_A), q01: ['q01.z'] }, 'q01'],
    ['question manquante', Object.fromEntries(Object.entries(reponses(CHOIX_A)).filter(([q]) => q !== 'q09')), 'q09'],
    ['« aucune » avec une autre réponse', { ...reponses(CHOIX_A), q07: ['q07.i', 'q07.a'] }, 'q07'],
    ['question inventée', { ...reponses(CHOIX_A), q99: ['q99.a'] }, 'reponses'],
    ['« autre » sans précision', { ...reponses(CHOIX_A), q07: ['q07.a', 'autre'] }, 'q07'],
  ];
  for (const [nom, rep, champ] of invalides) {
    const id = sid();
    r = await diagnostic({ submission_id: id, reponses: rep, ...coord('Refus') });
    const ecrit = sql(`SELECT count(*) AS n FROM lead WHERE submission_id = '${id}'`)[0].n;
    constat(!r.ok && r.statut === 400 && r.error?.champ === champ && ecrit === 0, `${nom} : ${r.error?.code} (${r.error?.champ}), rien d'écrit`);
  }
  r = await diagnostic({ submission_id: sid(), reponses: reponses(CHOIX_A), ...coord('Robot'), turnstile: 'refuse' });
  constat(r.statut === 403 && r.error?.code === 'ANTI_ROBOT', 'jeton anti-robot refusé : 403');

  // 5. Page de résultats : un seul navigateur, 24 heures, 404 sinon.
  let q = await page(url);
  const cookie = (q.headers.get('set-cookie') ?? '').split(';')[0];
  constat(q.status === 303 && q.headers.get('location') === '/diagnostic/resultats' && cookie.startsWith('avt_resultats=') && /HttpOnly/i.test(q.headers.get('set-cookie')), 'première ouverture : clé posée dans ce navigateur (cookie HttpOnly), redirection sans jeton');
  q = await page('/diagnostic/resultats', cookie);
  const html = await q.text();
  constat(q.status === 200 && html.includes(`<b>${sc1.total}</b>`) && html.includes('Bien préparé') && html.includes('/contact#reserver'), `résultats rendus par le serveur : score ${sc1.total}, sortie A`);
  constat((await page(url)).status === 404, 'même lien dans un autre navigateur : 404');
  constat((await page(url, cookie)).status === 303, 'même lien rouvert dans le navigateur d\'origine : accepté');
  constat((await page('/diagnostic/resultats')).status === 404, 'page de résultats sans clé : 404');
  constat((await page(`/diagnostic/resultats?t=${'x'.repeat(43)}`)).status === 404, 'jeton inconnu : 404');
  sql(`UPDATE lead SET created_at = '${new Date(Date.now() - 25 * 3600 * 1000).toISOString()}' WHERE submission_id = '${s1}'`);
  q = await page('/diagnostic/resultats', cookie);
  constat(q.status === 404 && (await q.text()).includes("Ce lien n'est plus valable"), 'après 24 heures : 404, « Ce lien n\'est plus valable »');

  // 6. Inscription à la séquence depuis les résultats (sortie B) : seulement avec la clé du navigateur.
  const urlB = (await diagnostic({ submission_id: s3, reponses: reponses(CHOIX_B), ...coord('Marc'), telephone: '079 123 45 67', indicatif: '+41' })).url;
  const cookieB = ((await page(urlB)).headers.get('set-cookie') ?? '').split(';')[0];
  // En-tête Origin : Astro refuse (403) un POST qui ne vient pas d'une page du site ; un navigateur l'envoie de lui-même.
  const sans = await appeler(`${U}/api/diagnostic/sequence`, { method: 'POST', headers: { origin: U } });
  const avec = await appeler(`${U}/api/diagnostic/sequence`, { method: 'POST', headers: { origin: U, cookie: cookieB } });
  const autreSite = await appeler(`${U}/api/diagnostic/sequence`, { method: 'POST', headers: { cookie: cookieB } });
  const optin = sql(`SELECT newsletter_opt_in_at FROM lead WHERE submission_id = '${s3}'`)[0].newsletter_opt_in_at;
  constat(sans.status === 404 && autreSite.status === 403 && avec.ok && !!optin, 'séquence : refusée sans la clé (404) ou hors du site (403), horodatée avec la clé');

  // 7. E-mails : notification à Anne avec le score et les réponses, résumé au prospect, tous vers la boîte de test.
  await pause(1500);
  const notif = recus.find((e) => e.subject.includes('Diagnostic') && e.subject.includes('Claire Essai'));
  const conf = recus.find((e) => e.subject.includes('Votre diagnostic vendeur') && e.text.includes('Bonjour Claire'));
  constat(recus.length > 0 && recus.every((e) => e.to[0] === 'boite-test@example.com' && e.subject.startsWith('[TEST]')), `${recus.length} e-mails, tous vers la boîte de test`);
  constat(!!notif && notif.text.includes(`Diagnostic : ${sc1.total} / 100`) && notif.text.includes('Sortie A') && notif.text.includes('Réponses :') && notif.reply_to === coord('Claire').email, 'notification à Anne : score, sortie, réponses en clair, réponse au prospect');
  constat(!!conf && conf.text.includes(`Score global : ${sc1.total} / 100`) && !conf.text.includes('?t='), 'résumé envoyé au prospect, sans lien vers la page de résultats');

  // 8. Dans un navigateur : les 17 écrans, le gate sans score, les résultats rendus par le serveur.
  const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  async function parcours(nom, viewport, choix, prenom, { newsletter = false, coupure = false } = {}) {
    const ctx = await nav.newContext({ viewport });
    const p = await ctx.newPage();
    const scripts = await imiterTurnstile(p);
    p.on('pageerror', (e) => erreursNav.push(`${nom}: ${e.message}`));
    p.on('console', (m) => { if (m.type() === 'error' && !(coupure && /ERR_FAILED/.test(m.text()))) erreursNav.push(`${nom}: ${m.text()}`); });
    const chargements = [];
    p.on('request', (rq) => chargements.push(rq.url()));
    await p.goto(`${U}/diagnostic/questions?utm_source=parcours`, { waitUntil: 'networkidle' });
    for (let i = 0; i < 17; i++) {
      await p.waitForSelector('[data-ecran] h1');
      if ([1, 7, 15].includes(i + 1)) await p.screenshot({ path: path.join(OUT, `diag-${nom}-ecran-${i + 1}.png`) });
      const c = choix[i];
      if (c === 'texte') { await p.fill('[data-texte]', 'Essai de bout en bout.'); await p.click('[data-suivant]'); }
      else if (c === 'passer') await p.click('[data-passer]');
      else if (Array.isArray(c)) { for (const o of c) await p.click(`[data-option="${o}"]`); await p.click('[data-suivant]'); }
      else await p.click(`[data-option="${c}"]`);
      if (i === 6 && nom === 'A') { // abandon puis reprise à l'écran 8
        await p.waitForSelector('[data-ecran] h1');
        await p.click('[data-abandon]'); await p.waitForSelector('dialog[open]'); await p.screenshot({ path: path.join(OUT, `diag-${nom}-abandon.png`) });
        await p.click('[data-abandon-continuer]');
        await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector('[data-reprendre]'); await p.screenshot({ path: path.join(OUT, `diag-${nom}-reprise.png`) });
        await p.click('[data-reprendre]');
      }
    }
    await p.waitForSelector('[data-gate]');
    const texteGate = await p.textContent('.qz-gate-tete');
    const largeurTel = await p.$eval('#tel', (el) => el.getBoundingClientRect().width);
    await p.screenshot({ path: path.join(OUT, `diag-${nom}-gate.png`), fullPage: true });
    constat(!/\d+\s*\/\s*100/.test(texteGate) && largeurTel > 150 && scripts.length === 0, `${nom} : gate sans score, case du téléphone ${Math.round(largeurTel)} px, Turnstile pas encore chargé`);
    await p.click('[data-gate-bouton]'); await pause(200);
    await p.screenshot({ path: path.join(OUT, `diag-${nom}-gate-erreurs.png`), fullPage: true });
    await p.fill('[name="prenom"]', prenom); await p.fill('[name="nom"]', 'Navigateur'); await p.fill('[name="email"]', `${prenom.toLowerCase()}+nav-${ESSAI}@example.com`); await p.fill('[name="telephone"]', '06 12 34 56 78'); await p.check('[name="privacy"]');
    if (newsletter) await p.check('[name="newsletter"]');
    if (coupure) { // première tentative coupée : échec affiché, réponses gardées, « Renvoyer » réussit sans second lead
      await p.route('**/api/diagnostic', (route) => route.abort(), { times: 1 });
      await p.click('[data-gate-bouton]');
      await p.waitForSelector('[data-gate-echec]:not([hidden])');
      await p.screenshot({ path: path.join(OUT, `diag-${nom}-gate-echec.png`), fullPage: true });
      constat((await p.textContent('[data-gate-bouton]')) === 'Renvoyer' && (await p.inputValue('[name="prenom"]')) === prenom, `${nom} : coupure, échec affiché, coordonnées gardées, bouton « Renvoyer »`);
    }
    await p.click('[data-gate-bouton]');
    await p.waitForURL('**/diagnostic/resultats', { timeout: 30000 }); await p.waitForSelector('.rs-score b');
    const score = await p.textContent('.rs-score b'); const pastille = await p.textContent('.rs-pastille'); const sortie = await p.textContent('.rs-sortie h2');
    const sauve = await p.evaluate(() => localStorage.getItem('avt.diagnostic.v1'));
    const bareme = chargements.some((u) => /bareme/.test(u));
    const leads = sql(`SELECT orientation, utm, newsletter_opt_in_at FROM lead WHERE email = '${prenom.toLowerCase()}+nav-${ESSAI}@example.com'`);
    constat(leads.length === 1 && leads[0].utm === '{"utm_source":"parcours"}' && !sauve && !bareme, `${nom} → score ${score} · ${pastille} · « ${sortie} » ; un lead, campagne gardée, sauvegarde locale effacée`);
    const seq = await p.$('[data-sequence]:not([hidden])');
    if (seq) { await seq.click(); await p.waitForSelector('[data-etat-sequence]:not([hidden])'); }
    if (newsletter) constat(!!leads[0].newsletter_opt_in_at && (await p.isVisible('[data-sequence-deja]')), `${nom} : séquence cochée au gate, écrite et affichée comme enregistrée`);
    await p.evaluate(() => window.scrollTo(0, 0)); await pause(400);
    await p.screenshot({ path: path.join(OUT, `diag-${nom}-resultats.png`), fullPage: true });
    await ctx.close();
    return { score, sortie };
  }
  await parcours('A', { width: 390, height: 844 }, CHOIX_A, 'Alice');
  await parcours('B', { width: 1440, height: 900 }, CHOIX_B, 'Bruno', { coupure: true });
  await parcours('R', { width: 390, height: 844 }, CHOIX_R, 'Lea', { newsletter: true });
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(`${U}/diagnostic/resultats`); await p.waitForSelector('[data-expire]');
  await p.screenshot({ path: path.join(OUT, 'diag-resultats-expire.png') });
  await nav.close();
  constat(erreursNav.length === 0, erreursNav.length ? `erreurs du navigateur :\n${erreursNav.join('\n')}` : 'aucune erreur dans le navigateur');
} finally {
  arreter();
  // Écrit après l'arrêt du serveur local : une écriture dans le dossier du site pendant l'essai le fait redémarrer.
  fs.writeFileSync(path.join(OUT, 'e2e-diagnostic-emails.txt'), recus.map((e) => `À : ${e.to}\nRépondre à : ${e.reply_to ?? '—'}\nObjet : ${e.subject}\n\n${e.text}`).join('\n\n==========\n\n'));
}
console.log(echecs ? `\n${echecs} constat(s) en échec. Journal du serveur local : ${JOURNAL}` : '\nTous les constats sont bons.');
process.exit(echecs ? 1 : 0);
