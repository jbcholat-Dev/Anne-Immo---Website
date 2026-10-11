// Fabrique la vidéo « l'espace vendeur » de la page Vendre (story 15.2) depuis scripts/video-portail/scene.html.
// Le navigateur sans fenêtre de Playwright dessine chaque image (rendu(t)), ffmpeg les assemble.
// Sorties (suivies par Git, comme la vidéo d'ouverture) :
//   public/video/portail-vendeur.mp4            — ordinateur : H.264, 1920 × 1080, 30 i/s, sans son, faststart
//   public/video/portail-vendeur-telephone.mp4  — téléphone (écran ≤ 900 px) : 1280 × 720
//   public/video/portail-vendeur-poster.jpg     — image d'attente (un instant du portail)
//
//   node scripts/video-portail.mjs                    — tout le film
//   node scripts/video-portail.mjs --images 3,20,40   — seulement des images fixes dans .verif/video-portail/ (pour relire la mise en page)
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);
const FFMPEG = require('ffmpeg-static');
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(ICI, '..');
const SCENE = pathToFileURL(path.join(ICI, 'video-portail', 'scene.html')).href;
const SORTIE = path.join(SITE, 'public', 'video');
const IPS = 30;
const POSTER_T = 20.5; // l'onglet « Avancement », rendez-vous affiché

const i = process.argv.indexOf('--images');
const images = i > -1 ? process.argv[i + 1].split(',').map(Number) : null;

const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined) });
const page = await navigateur.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(SCENE);
await page.evaluate(() => document.fonts.ready);
const DUREE = await page.evaluate(() => window.DUREE);
const image = async (t, opts = {}) => { await page.evaluate((x) => window.rendu(x), t); return page.screenshot({ type: 'jpeg', quality: 95, ...opts }); };

if (images) {
  const dossier = path.join(SITE, '.verif', 'video-portail');
  fs.mkdirSync(dossier, { recursive: true });
  for (const t of images) await image(t, { path: path.join(dossier, `t-${String(t).padStart(5, '0')}.jpg`) });
  console.log(`${images.length} image(s) dans ${path.relative(SITE, dossier)}`);
  await navigateur.close();
  process.exit(0);
}

fs.mkdirSync(SORTIE, { recursive: true });
const encodeur = (fichier, largeur, crf) => {
  const p = spawn(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(IPS), '-c:v', 'mjpeg', '-i', '-',
    '-vf', `scale=${largeur}:-2:flags=lanczos`, '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', String(crf),
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', fichier], { stdio: ['pipe', 'inherit', 'inherit'] });
  const fini = new Promise((ok, ko) => p.on('close', (c) => (c ? ko(new Error(`ffmpeg ${c}`)) : ok())));
  return { p, fini };
};
const ordi = encodeur(path.join(SORTIE, 'portail-vendeur.mp4'), 1920, 24);
const tel = encodeur(path.join(SORTIE, 'portail-vendeur-telephone.mp4'), 1280, 24);
const ecrire = (flux, buf) => new Promise((ok) => (flux.write(buf) ? ok() : flux.once('drain', ok)));
const total = Math.round(DUREE * IPS);
for (let n = 0; n < total; n++) {
  const buf = await image(n / IPS);
  await Promise.all([ecrire(ordi.p.stdin, buf), ecrire(tel.p.stdin, buf)]);
  if (n % (IPS * 5) === 0) console.log(`${(n / IPS).toFixed(0)} s / ${DUREE} s`);
}
ordi.p.stdin.end(); tel.p.stdin.end();
await Promise.all([ordi.fini, tel.fini]);
await image(POSTER_T, { path: path.join(SORTIE, 'portail-vendeur-poster.jpg'), quality: 82 });
await navigateur.close();
for (const f of ['portail-vendeur.mp4', 'portail-vendeur-telephone.mp4', 'portail-vendeur-poster.jpg']) {
  console.log(f, (fs.statSync(path.join(SORTIE, f)).size / 1e6).toFixed(1), 'Mo');
}
