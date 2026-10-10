// Encode la vidéo d'ouverture du hero (A-01, D-1) à partir de la source d'Anne, hors Git.
// Entrée : ../contenu-anne/videos/ouverture-source.mp4 (le montage qu'Anne a fait exprès pour le site, 4K 52 s depuis le 2026-10-05 — encodé avec --debut 0.1,
// diffusé en entier et en boucle — décision JB 2026-09-26, D-27).
// Sorties (suivies par Git) :
//   public/video/ouverture.mp4            — ordinateur : H.264, 1920 px, crf 27, 30 i/s, sans son, lecture progressive (faststart)
//   public/video/ouverture-telephone.mp4  — téléphone (écran ≤ 900 px) : H.264, 1280 px, crf 26
//   ../contenu-anne/photos/ouverture-poster.jpg — première image du passage retenu (poster du hero, D-27)
// Puis : npm run images (dérive le poster en webp/jpg, identifiant photos/ouverture-poster).
//
//   npm run video                                        — toute la vidéo (défaut)
//   npm run video -- --debut 53 --duree 10 [--crf 27] [--largeur 1920] [--recadrage 0.86]   (--crf et --largeur : version ordinateur)
//
// --duree 0 : jusqu'à la fin. --recadrage r : garde la fraction r du cadre (coin haut gauche, 16:9) puis remet à
//   l'échelle (sert à sortir une incrustation d'angle) ; 1 = pas de recadrage.
// Qualité (story 8.13, 2026-10-10, montage de 52 s) : l'ancien réglage (1440 px, crf 30, 7,8 Mo ; WebM VP9 en plus) donnait une image
// pâteuse, VMAF 77 (MP4) et 60 (WebM, pourtant servi en premier à Chrome et Firefox) sur 100 face à la source. Mesures à 1920 px :
// crf 23 → 30 Mo, VMAF 94 (au-dessus de la limite de 25 Mio par fichier de Cloudflare) ; crf 26 → 21 Mo, 92 ; crf 27 → 18 Mo, 91 (retenu).
// Le WebM VP9 est abandonné : à poids égal il notait moins bien que le H.264 (1920 px, 23 Mo, VMAF 75).
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
const CRF = arg('crf', 27);
const LARGEUR = arg('largeur', 1920);
const CRF_TEL = 26;
const LARGEUR_TEL = 1280;
const RECADRAGE = arg('recadrage', 1);

if (!fs.existsSync(SOURCE)) {
  console.error(`Source absente : ${SOURCE}\nElle est hors Git : la récupérer via contenu-anne/videos/liens.md.`);
  process.exit(1);
}
fs.mkdirSync(SORTIE, { recursive: true });

// Filtre image commun : recadrage éventuel (coin haut gauche, ratio conservé) puis échelle à la largeur voulue, hauteur paire.
const crop = RECADRAGE < 1 ? `crop=iw*${RECADRAGE}:ih*${RECADRAGE}:0:0,` : '';
const vf = `${crop}scale=${LARGEUR}:-2`;
const vfTel = `${crop}scale=${LARGEUR_TEL}:-2`;
const decoupe = ['-ss', String(DEBUT), ...(DUREE > 0 ? ['-t', String(DUREE)] : []), '-i', SOURCE];

const run = (args, libelle) => {
  process.stdout.write(`→ ${libelle}… `);
  execFileSync(FFMPEG, ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  console.log('ok');
};
const mo = (f) => (fs.statSync(f).size / 1024 / 1024).toFixed(2) + ' Mo';

const h264 = (filtre, crf, sortie) => [...decoupe, '-an', '-vf', filtre, '-r', '30', '-c:v', 'libx264', '-preset', 'slower', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', sortie];
const mp4 = path.join(SORTIE, 'ouverture.mp4');
run(h264(vf, CRF, mp4), 'MP4 ordinateur (H.264)');
const mp4Tel = path.join(SORTIE, 'ouverture-telephone.mp4');
run(h264(vfTel, CRF_TEL, mp4Tel), 'MP4 téléphone (H.264)');

run([...decoupe, '-an', '-vf', vf, '-frames:v', '1', '-q:v', '2', POSTER], 'poster JPG');

console.log(`\nPassage : ${DEBUT}s → ${DUREE > 0 ? (DEBUT + DUREE).toFixed(1) + 's' : 'fin'}, recadrage ${RECADRAGE}, largeur ${LARGEUR}, crf ${CRF}`);
console.log(`  ${path.relative(SITE, mp4)}   ${mo(mp4)}  (budget README : 6 Mo pour 12 s ; écart assumé pour l'intégrale)`);
console.log(`  ${path.relative(SITE, mp4Tel)}   ${mo(mp4Tel)}`);
console.log(`  ${path.relative(SITE, POSTER)}  ${mo(POSTER)}`);
console.log('\nPuis : npm run images');
if (fs.statSync(mp4).size > 24 * 1024 * 1024) console.warn('⚠ MP4 au-dessus de 24 Mo, trop près de la limite de 25 Mio par fichier de Cloudflare : réessayer avec --crf 28.');
