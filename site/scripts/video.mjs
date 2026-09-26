// Encode la vidéo d'ouverture du hero (A-01, D-1) à partir de la source d'Anne, hors Git.
// Entrée : ../contenu-anne/videos/ouverture-source.mp4 (1080p, 95 s : le montage qu'Anne a fait exprès pour le site,
// diffusé en entier et en boucle — décision JB 2026-09-26, D-27).
// Sorties (suivies par Git) :
//   public/video/ouverture.mp4   — H.264, 1440 px, 30 i/s, sans son, lecture progressive (faststart)
//   public/video/ouverture.webm  — VP9, même image, sans son
//   ../contenu-anne/photos/ouverture-poster.jpg — première image du passage retenu (poster du hero, D-27)
// Puis : npm run images (dérive le poster en webp/jpg, identifiant photos/ouverture-poster).
//
//   npm run video                                        — toute la vidéo (défaut)
//   npm run video -- --debut 53 --duree 10 [--crf 30] [--largeur 1440] [--recadrage 0.86]
//
// --duree 0 : jusqu'à la fin. --recadrage r : garde la fraction r du cadre (coin haut gauche, 16:9) puis remet à
//   l'échelle (sert à sortir une incrustation d'angle) ; 1 = pas de recadrage.
// Poids mesurés (95 s, crf 30) : 1920 px ≈ 27 Mo, 1440 px ≈ 15 Mo, 1280 px ≈ 12 Mo. 1440 retenu : le hero fait 900 px de haut.
// VP9 : crf = CRF + 16 (46) ; à CRF + 8 le WebM pesait 27 Mo, plus que le MP4.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const FFMPEG = require('ffmpeg-static');
const ICI = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(ICI, '..');
const SOURCE = path.resolve(SITE, '../contenu-anne/videos/ouverture-source.mp4');
const SORTIE = path.join(SITE, 'public', 'video');
const POSTER = path.resolve(SITE, '../contenu-anne/photos/ouverture-poster.jpg');

const arg = (nom, defaut) => {
  const i = process.argv.indexOf(`--${nom}`);
  return i > -1 && process.argv[i + 1] !== undefined ? Number(process.argv[i + 1]) : defaut;
};
const DEBUT = arg('debut', 0);
const DUREE = arg('duree', 0); // 0 = jusqu'à la fin
const CRF = arg('crf', 30);
const LARGEUR = arg('largeur', 1440);
const RECADRAGE = arg('recadrage', 1);

if (!fs.existsSync(SOURCE)) {
  console.error(`Source absente : ${SOURCE}\nElle est hors Git : la récupérer via contenu-anne/videos/liens.md.`);
  process.exit(1);
}
fs.mkdirSync(SORTIE, { recursive: true });

// Filtre image commun : recadrage éventuel (coin haut gauche, ratio conservé) puis échelle à la largeur voulue, hauteur paire.
const crop = RECADRAGE < 1 ? `crop=iw*${RECADRAGE}:ih*${RECADRAGE}:0:0,` : '';
const vf = `${crop}scale=${LARGEUR}:-2`;
const decoupe = ['-ss', String(DEBUT), ...(DUREE > 0 ? ['-t', String(DUREE)] : []), '-i', SOURCE];

const run = (args, libelle) => {
  process.stdout.write(`→ ${libelle}… `);
  execFileSync(FFMPEG, ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  console.log('ok');
};
const mo = (f) => (fs.statSync(f).size / 1024 / 1024).toFixed(2) + ' Mo';

const mp4 = path.join(SORTIE, 'ouverture.mp4');
run([...decoupe, '-an', '-vf', vf, '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(CRF), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], 'MP4 (H.264)');

const webm = path.join(SORTIE, 'ouverture.webm');
run([...decoupe, '-an', '-vf', vf, '-r', '30', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(CRF + 16), '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', webm], 'WebM (VP9)');

run([...decoupe, '-an', '-vf', vf, '-frames:v', '1', '-q:v', '2', POSTER], 'poster JPG');

console.log(`\nPassage : ${DEBUT}s → ${DUREE > 0 ? (DEBUT + DUREE).toFixed(1) + 's' : 'fin'}, recadrage ${RECADRAGE}, largeur ${LARGEUR}, crf ${CRF}`);
console.log(`  ${path.relative(SITE, mp4)}   ${mo(mp4)}  (budget README : 6 Mo pour 12 s ; écart assumé pour l'intégrale)`);
console.log(`  ${path.relative(SITE, webm)}  ${mo(webm)}`);
console.log(`  ${path.relative(SITE, POSTER)}  ${mo(POSTER)}`);
console.log('\nPuis : npm run images');
if (fs.statSync(mp4).size > 16 * 1024 * 1024) console.warn('⚠ MP4 au-dessus de 16 Mo : réessayer avec --crf 32, puis --largeur 1280.');
