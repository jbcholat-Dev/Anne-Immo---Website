// Refait le logo des e-mails (story 10.9) : src/server/email-logo.png, depuis design-system/assets/logo-horizontal.svg,
// avec la police Gilda Display du site (les messageries n'affichent ni le SVG ni les polices du site).
// Image en 3x (660 px de large, affichée à 220 px) sur fond transparent. Lancer : `node scripts/email-logo.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ICI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = fs.readFileSync(path.join(ICI, '../design-system/assets/logo-horizontal.svg'), 'utf8').replace(/@import url\([^)]*\);/, '');
const police = fs.readFileSync(path.join(ICI, 'public/fonts/gilda-display-400.woff2')).toString('base64');
const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await navigateur.newPage({ viewport: { width: 680, height: 160 }, deviceScaleFactor: 1 });
await page.setContent(`<style>@font-face{font-family:'Gilda Display';src:url(data:font/woff2;base64,${police}) format('woff2')}
  html,body{margin:0;background:transparent} svg{display:block;width:660px;height:155.3px}</style>${svg}`);
await page.evaluate(() => document.fonts.ready);
await page.locator('svg').screenshot({ path: path.join(ICI, 'src/server/email-logo.png'), omitBackground: true });
await navigateur.close();
console.log('src/server/email-logo.png refait.');
