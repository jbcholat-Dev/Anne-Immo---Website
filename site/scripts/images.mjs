// Dérive les formats web des photos réelles de contenu-anne/ (AD-15 : formats produits au build, jamais d'original > 500 Ko en double).
// Entrée : contenu-anne/stories/<slug>/photos/ — photos web de chaque story : photo-*.jpg (scripts/preparer-photos)
//          et *.webp / *.png (envoyées par l'espace d'édition, déjà réduites, story 7.13) ;
//          + contenu-anne/photos/*.jpg (photos hors story).
// Lancé avant chaque construction (`npm run build`), pour que les photos envoyées depuis l'espace d'édition apparaissent.
// Sortie : public/img/<groupe>/<nom>-<largeur>.{webp,jpg} + src/data/images.json (dimensions, srcset).
//   npm run images
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(ICI, '..');
const CONTENU = path.resolve(SITE, '../contenu-anne');
const PUBLIC = path.join(SITE, 'public', 'img');
const LARGEURS = [640, 1280, 1920];
const JPG_LARGEUR = 1280; // repli JPEG unique
const QUALITE_WEBP = 76;
const QUALITE_JPG = 78;

const manifeste = {};

async function deriver(groupe, nom, source) {
  const dossier = path.join(PUBLIC, groupe);
  fs.mkdirSync(dossier, { recursive: true });
  const meta = await sharp(source).metadata();
  const ratio = meta.width / meta.height;
  const entree = { largeur: meta.width, hauteur: meta.height, ratio: +ratio.toFixed(4), webp: [], jpg: '' };
  for (const w of LARGEURS) {
    if (w > meta.width) continue;
    const cible = path.join(dossier, `${nom}-${w}.webp`);
    if (!fs.existsSync(cible) || fs.statSync(cible).mtimeMs < fs.statSync(source).mtimeMs) {
      await sharp(source).rotate().resize({ width: w }).webp({ quality: QUALITE_WEBP }).toFile(cible);
    }
    entree.webp.push({ w, src: `/img/${groupe}/${nom}-${w}.webp` });
  }
  const jw = Math.min(JPG_LARGEUR, meta.width);
  const jpg = path.join(dossier, `${nom}-${jw}.jpg`);
  if (!fs.existsSync(jpg) || fs.statSync(jpg).mtimeMs < fs.statSync(source).mtimeMs) {
    await sharp(source).rotate().resize({ width: jw }).jpeg({ quality: QUALITE_JPG, mozjpeg: true }).toFile(jpg);
  }
  entree.jpg = `/img/${groupe}/${nom}-${jw}.jpg`;
  manifeste[`${groupe}/${nom}`] = entree;
  const ko = (f) => Math.round(fs.statSync(f).size / 1024);
  console.log(`✓ ${groupe}/${nom}  ${meta.width}×${meta.height}  webp ${entree.webp.map((e) => e.w).join('/')}  jpg ${ko(jpg)} Ko`);
}

// 1. stories
const stories = path.join(CONTENU, 'stories');
for (const slug of fs.readdirSync(stories)) {
  const dossier = path.join(stories, slug, 'photos');
  if (!fs.existsSync(dossier)) continue;
  // Les autres .jpg du dossier seraient des HD posées là par erreur (ignorées par Git) : on ne les prend pas.
  const web = fs.readdirSync(dossier).filter((f) => /^photo-.*\.jpe?g$/i.test(f) || /\.(webp|png)$/i.test(f)).sort();
  for (const f of web) {
    await deriver(`stories/${slug}`, f.replace(/\.[^.]+$/, ''), path.join(dossier, f));
  }
}
// 2. photos hors story
const photos = path.join(CONTENU, 'photos');
for (const f of fs.readdirSync(photos).filter((f) => /\.jpe?g$/i.test(f))) {
  await deriver('photos', f.replace(/\.jpe?g$/i, ''), path.join(photos, f));
}

fs.writeFileSync(path.join(SITE, 'src', 'data', 'images.json'), JSON.stringify(manifeste, null, 2) + '\n');
console.log(`\n${Object.keys(manifeste).length} images → src/data/images.json`);
