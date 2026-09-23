// Convertit les captures PNG de .verif/ en JPEG (q 82) pour un dépôt Git léger.
import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path';
const OUT = path.resolve('.verif');
for (const f of fs.readdirSync(OUT).filter((f) => f.endsWith('.png'))) {
  await sharp(path.join(OUT, f)).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, f.replace(/\.png$/, '.jpg')));
  fs.unlinkSync(path.join(OUT, f));
}
console.log('ok');
