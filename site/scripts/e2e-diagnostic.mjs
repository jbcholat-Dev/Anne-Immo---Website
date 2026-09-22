// Parcours de bout en bout du diagnostic (preuve) : 17 écrans → gate → résultats, sortie A puis sortie B, reprise et abandon. Captures dans .verif/.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(ICI, '../dist'); const OUT = path.resolve(ICI, '../.verif');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const srv = createServer((req, res) => { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); let f = path.join(DIST, p); if (fs.existsSync(f + '.html')) f += '.html'; else if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html'); if (!fs.existsSync(f)) { res.statusCode = 404; return res.end('404'); } res.setHeader('Content-Type', TYPES[path.extname(f)] ?? 'application/octet-stream'); fs.createReadStream(f).pipe(res); });
await new Promise((ok) => srv.listen(4323, ok));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const erreurs = [];
async function parcours(nom, viewport, choix, coord) {
  const ctx = await b.newContext({ viewport, ignoreHTTPSErrors: true });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => erreurs.push(`${nom}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') erreurs.push(`${nom}: ${m.text()}`); });
  await p.goto('http://localhost:4323/diagnostic/questions', { waitUntil: 'networkidle' });
  const captures = [1, 7, 15];
  for (let i = 0; i < 17; i++) {
    await p.waitForSelector('[data-ecran] h1');
    const repere = await p.textContent('[data-repere-question]');
    const h1 = await p.textContent('[data-ecran] h1');
    if (captures.includes(i + 1)) await p.screenshot({ path: path.join(OUT, `diag-${nom}-ecran-${i + 1}.png`) });
    const c = choix[i];
    if (c === 'texte') { await p.fill('[data-texte]', 'Test de bout en bout.'); await p.click('[data-suivant]'); }
    else if (c === 'passer') await p.click('[data-passer]');
    else if (Array.isArray(c)) { for (const o of c) await p.click(`[data-option="${o}"]`); await p.click('[data-suivant]'); }
    else await p.click(`[data-option="${c}"]`);
    console.log(`${nom} · ${repere} · ${h1.slice(0, 50)}…`);
    if (i === 6 && nom === 'A') { // abandon puis reprise à l'écran 8
      await p.waitForSelector('[data-ecran] h1');
      await p.click('[data-abandon]'); await p.waitForSelector('dialog[open]'); await p.screenshot({ path: path.join(OUT, `diag-${nom}-abandon.png`) });
      await p.click('[data-abandon-continuer]');
      await p.reload({ waitUntil: 'networkidle' }); await p.waitForSelector('[data-reprendre]'); await p.screenshot({ path: path.join(OUT, `diag-${nom}-reprise.png`) });
      await p.click('[data-reprendre]');
    }
  }
  await p.waitForSelector('[data-gate]');
  await p.screenshot({ path: path.join(OUT, `diag-${nom}-gate.png`), fullPage: true });
  await p.click('[data-gate-bouton]'); await p.waitForTimeout(200);
  await p.screenshot({ path: path.join(OUT, `diag-${nom}-gate-erreurs.png`), fullPage: true });
  await p.fill('[name="prenom"]', coord.prenom); await p.fill('[name="nom"]', 'Test'); await p.fill('[name="email"]', 'test@exemple.fr'); await p.fill('[name="telephone"]', '06 12 34 56 78'); await p.check('[name="privacy"]');
  if (coord.newsletter) await p.check('[name="newsletter"]');
  await p.click('[data-gate-bouton]');
  await p.waitForURL('**/diagnostic/resultats'); await p.waitForSelector('.rs-score b');
  const score = await p.textContent('.rs-score b'); const pastille = await p.textContent('.rs-pastille'); const sortie = await p.textContent('.rs-sortie h2');
  console.log(`${nom} → score ${score} · ${pastille} · sortie « ${sortie} » · ton ${await p.getAttribute('[data-resultats]', 'data-ton')}`);
  const btn = await p.$('[data-guide]'); if (btn) { await btn.click(); await p.waitForSelector('[data-etat-guide]:not([hidden])'); }
  const seq = await p.$('[data-sequence]:not([hidden])'); if (seq) { await seq.click(); await p.waitForSelector('[data-etat-sequence]:not([hidden])'); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(OUT, `diag-${nom}-resultats.png`), fullPage: true });
  await ctx.close();
}
// Sortie A : bonnes réponses, q14 premium, q12 « sereinement »
await parcours('A', { width: 390, height: 844 }, ['q01.b', 'q02.a', 'q03.a', 'q04.a', 'q05.a', 'q06.a', ['q07.a', 'q07.b', 'q07.c', 'q07.d', 'q07.e', 'q07.f'], 'q08.a', 'q09.a', 'q10a.a', 'q10b.b', 'q11a.b', 'q11b.a', 'q12.c', ['q13.g'], 'q14.a', 'texte'], { prenom: 'Claire', newsletter: false });
// Sortie B : réponses moyennes, q12 minimiser
await parcours('B', { width: 1440, height: 900 }, ['q01.a', 'q02.b', 'q03.b', 'q04.b', 'q05.c', 'q06.b', ['q07.a', 'q07.b'], 'q08.b', 'q09.b', 'q10a.b', 'q10b.a', 'q11a.c', 'q11b.a', 'q12.d', ['q13.a', 'q13.c'], 'q14.b', 'passer'], { prenom: 'Marc', newsletter: false });
// Risque : mauvaises réponses
await parcours('R', { width: 390, height: 844 }, ['q01.d', 'q02.c', 'q03.c', 'q04.c', 'q05.e', 'q06.d', [], 'q08.d', 'q09.c', 'q10a.d', 'q10b.c', 'q11a.a', 'q11b.e', 'q12.b', ['q13.a'], 'q14.c', 'passer'], { prenom: 'Léa', newsletter: true });
// Résultats sans session → lien expiré
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true }); const p = await ctx.newPage();
await p.goto('http://localhost:4323/diagnostic/resultats'); await p.waitForSelector('[data-expire]:not([hidden])'); await p.screenshot({ path: path.join(OUT, 'diag-resultats-expire.png') }); await ctx.close();
await b.close(); srv.close();
console.log(erreurs.length ? 'ERREURS :\n' + erreurs.join('\n') : 'Aucune erreur JS/console.');
