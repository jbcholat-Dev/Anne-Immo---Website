// Prépare les photos des stories pour le site.
// Source : contenu-anne/Stories  photos/<dossier>/ (HD, hors Git).
// Sélection : l'en-tête de contenu-anne/stories/<id>/fr.md (dossier_photos, photo_principale, photos).
// Sortie : contenu-anne/stories/<id>/photos/ — version web (3 200 px max, sRGB, sans métadonnées)
//          + photos.json (le manifeste = les objets Media de la story).
// Le dossier photos/ appartient au script : ce qui n'est plus sélectionné y est supprimé.
//
//   npm run photos              toutes les stories qui ont un dossier_photos
//   npm run photos -- <id>…     seulement ces stories

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import yaml from 'js-yaml';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const CONTENU = path.resolve(ICI, '../../contenu-anne');
const SOURCES = path.join(CONTENU, 'Stories  photos');
const STORIES = path.join(CONTENU, 'stories');
const COTE_MAX = 3200;   // plus grand côté ; marge pour le plein cadre sur écran retina
const QUALITE = 85;

const enTete = (fichier) => {
  const m = fs.readFileSync(fichier, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? yaml.load(m[1]) ?? {} : {};
};

// « 047 », « Allinges (EXP Immo) - 047 - HD.jpg » ou tout fragment unique du nom
function trouver(fichiers, valeur, story) {
  const v = String(valeur).trim();
  const exact = fichiers.find((f) => f === v);
  if (exact) return exact;
  const num = /^\d+$/.test(v) ? new RegExp(`(^|\\D)${v}(\\D|$)`) : null;
  const trouves = fichiers.filter((f) => (num ? num.test(f) : f.includes(v)));
  if (trouves.length !== 1)
    throw new Error(`${story} : « ${v} » désigne ${trouves.length} photo(s) dans le dossier (il en faut exactement une)`);
  return trouves[0];
}

const nomWeb = (source) => {
  const nums = source.match(/\d+/g);
  const base = nums ? nums[nums.length - 1] : source.replace(/\.[^.]+$/, '');
  return 'photo-' + base.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.jpg';
};

async function preparer(id) {
  const fr = path.join(STORIES, id, 'fr.md');
  const h = enTete(fr);
  if (!h.dossier_photos) return console.log(`– ${id} : pas de dossier_photos, ignorée`);
  const dossier = path.join(SOURCES, h.dossier_photos);
  if (!fs.existsSync(dossier)) throw new Error(`${id} : dossier introuvable « ${h.dossier_photos} » dans Stories  photos`);
  const dispo = fs.readdirSync(dossier).filter((f) => /\.jpe?g$/i.test(f));
  const choix = [h.photo_principale, ...(h.photos ?? [])].filter((v) => v != null && String(v).trim() !== '');
  if (!choix.length) return console.log(`– ${id} : aucune photo choisie, rien à faire`);

  const sortie = path.join(STORIES, id, 'photos');
  fs.mkdirSync(sortie, { recursive: true });
  const media = [];
  for (const [i, valeur] of choix.entries()) {
    const source = trouver(dispo, valeur, id);
    const fichier = nomWeb(source);
    if (media.some((m) => m.fichier === fichier)) throw new Error(`${id} : « ${valeur} » est choisie deux fois`);
    const cible = path.join(sortie, fichier);
    const src = path.join(dossier, source);
    // ne refait pas une photo déjà produite depuis une source inchangée
    if (!fs.existsSync(cible) || fs.statSync(cible).mtimeMs < fs.statSync(src).mtimeMs) {
      await sharp(src)
        .rotate() // applique l'orientation EXIF avant que les métadonnées soient retirées
        .resize({ width: COTE_MAX, height: COTE_MAX, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: QUALITE, mozjpeg: true }) // sharp convertit en sRGB et retire EXIF/GPS par défaut
        .toFile(cible);
    }
    const { width, height, size } = await sharp(cible).metadata().then(async (m) => ({ ...m, size: fs.statSync(cible).size }));
    media.push({
      id: `${id}/${fichier.replace(/\.jpg$/, '')}`,
      fichier: `photos/${fichier}`,
      role: i === 0 ? 'principale' : 'secondaire',
      choix: String(valeur),
      source: `${h.dossier_photos}/${source}`,
      largeur: width,
      hauteur: height,
      orientation: width > height ? 'paysage' : width < height ? 'portrait' : 'carre',
      ko: Math.round(size / 1024),
    });
  }
  const gardes = new Set(media.map((m) => path.basename(m.fichier)));
  const orphelins = fs.readdirSync(sortie).filter((f) => f.endsWith('.jpg') && !gardes.has(f));
  orphelins.forEach((f) => fs.unlinkSync(path.join(sortie, f)));
  fs.writeFileSync(path.join(sortie, 'photos.json'), JSON.stringify({
    _genere_par: 'scripts/preparer-photos — ne pas modifier à la main',
    story: id, dossier_photos: h.dossier_photos, photos: media,
  }, null, 2) + '\n');
  const total = media.reduce((s, m) => s + m.ko, 0);
  console.log(`✓ ${id} : ${media.length} photo(s), ${(total / 1024).toFixed(1)} Mo${orphelins.length ? `, ${orphelins.length} retirée(s)` : ''}`);
}

const demandes = process.argv.slice(2);
const ids = demandes.length ? demandes
  : fs.readdirSync(STORIES).filter((d) => !d.startsWith('_') && fs.existsSync(path.join(STORIES, d, 'fr.md')));
let erreurs = 0;
for (const id of ids) {
  try { await preparer(id); } catch (e) { erreurs++; console.error('✗ ' + e.message); }
}
process.exit(erreurs ? 1 : 0);
