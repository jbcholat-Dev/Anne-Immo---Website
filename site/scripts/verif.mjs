// Captures Playwright (preuve du travail — brief scroll-craft § 4). Sert dist/ en local, capture 1440 et 390.
//   npm run build && npm run verif            → .verif/*.png (jeu complet)
//   node scripts/verif.mjs --pages=/,/vendre  → pages choisies, pleine hauteur
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(ICI, '../dist');
const OUT = path.resolve(ICI, '../.verif');
fs.mkdirSync(OUT, { recursive: true });
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png' };

const serveur = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(DIST, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f = f + '.html';
  if (!fs.existsSync(f)) { f = path.join(DIST, '404.html'); res.statusCode = 404; }
  if (!fs.existsSync(f)) { res.statusCode = 404; return res.end('404'); }
  res.setHeader('Content-Type', TYPES[path.extname(f)] ?? 'application/octet-stream');
  fs.createReadStream(f).pipe(res);
});
await new Promise((ok) => serveur.listen(4321, ok));
const base = 'http://localhost:4321';
const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
const erreurs = [];

async function page(vue, largeur, hauteur, opts = {}) {
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: 1, reducedMotion: opts.reduit ? 'reduce' : 'no-preference', locale: 'fr-FR' });
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') erreurs.push(`${vue} : ${m.text()}`); });
  p.on('pageerror', (e) => erreurs.push(`${vue} : ${e.message}`));
  await p.goto(base + vue, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  return { p, ctx };
}
const nom = (vue, suffixe) => path.join(OUT, `${(vue === '/' ? 'accueil' : vue.replace(/^\//, '').replace(/\//g, '_')).replace(/[#?].*$/, '')}-${suffixe}.png`);

async function captureScroll(vue, largeur, hauteur, positions, prefixe) {
  const { p, ctx } = await page(vue, largeur, hauteur);
  for (const y of positions) {
    await p.evaluate((y) => window.scrollTo(0, y), y);
    await p.waitForTimeout(500);
    await p.screenshot({ path: nom(vue, `${prefixe}-y${y}`) });
  }
  await ctx.close();
}
async function capturePleine(vue, largeur, hauteur, suffixe, opts = {}) {
  const { p, ctx } = await page(vue, largeur, hauteur, opts);
  // révéler toutes les sections avant la capture pleine page
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
  await p.waitForTimeout(600);
  await p.screenshot({ path: nom(vue, suffixe), fullPage: true });
  await ctx.close();
}

const pagesDemandees = args.pages ? args.pages.split(',') : null;
if (pagesDemandees) {
  for (const v of pagesDemandees) { await capturePleine(v, 1440, 900, 'desktop'); await capturePleine(v, 390, 844, 'mobile'); }
} else {
  // Accueil : hero, pile à 3 positions, fermeture, mobile — 1440 puis 390
  await captureScroll('/', 1440, 900, [0, 1300, 1900, 2600, 3900], 'desktop');
  await capturePleine('/', 1440, 900, 'desktop-pleine');
  await captureScroll('/', 390, 844, [0, 900, 1500, 2200], 'mobile');
  await capturePleine('/', 390, 844, 'mobile-pleine');
  await capturePleine('/', 1440, 900, 'desktop-mouvement-reduit', { reduit: true });
  const autres = ['/realisation', '/realisation/appartement-cascade-2024', '/a-propos', '/vendre', '/acheter', '/diagnostic', '/diagnostic/questions', '/diagnostic/resultats', '/contact', '/guide', '/mentions-legales', '/confidentialite', '/cookies', '/en', '/en/track-record', '/404'];
  for (const v of autres) {
    if (!fs.existsSync(path.join(DIST, v === '/404' ? '404.html' : v.replace(/^\//, '') + '.html')) && !fs.existsSync(path.join(DIST, v.replace(/^\//, ''), 'index.html'))) continue;
    await capturePleine(v, 1440, 900, 'desktop');
    await capturePleine(v, 390, 844, 'mobile');
  }
}
await navigateur.close();
serveur.close();
if (erreurs.length) { console.log('Erreurs console :'); erreurs.forEach((e) => console.log(' -', e)); }
else console.log('Aucune erreur console.');
console.log(`Captures dans ${OUT}`);
