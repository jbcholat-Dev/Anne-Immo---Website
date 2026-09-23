// Vérifie que chaque lien interne des pages construites mène quelque part (fichier ou ancre) — « chaque lien de la nav et du footer mène quelque part ».
import fs from 'node:fs'; import path from 'node:path';
const DIST = path.resolve('dist');
const pages = []; (function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); fs.statSync(p).isDirectory() ? walk(p) : p.endsWith('.html') && pages.push(p); } })(DIST);
const existe = (u) => { const p = u.replace(/^\//, ''); return fs.existsSync(path.join(DIST, p + '.html')) || fs.existsSync(path.join(DIST, p, 'index.html')) || fs.existsSync(path.join(DIST, p)) || (p === '' && fs.existsSync(path.join(DIST, 'index.html'))); };
const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
let n = 0, ko = 0;
for (const f of pages) {
  const html = fs.readFileSync(f, 'utf8'); const mesIds = ids(html);
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const h = m[1]; n++;
    if (/^(https?:|mailto:|tel:)/.test(h)) continue;
    const [chemin, ancre] = h.split('#');
    const cible = chemin ? chemin.replace(/\?.*$/, '') : null;
    if (cible && !existe(cible)) { ko++; console.log(`✗ ${path.relative(DIST, f)} → ${h} (page absente)`); continue; }
    if (ancre) { const ht = cible ? fs.readFileSync(path.join(DIST, (cible.replace(/^\//, '') || 'index') + (cible === '/' ? '.html' : '.html')), 'utf8') : html; const set = cible ? ids(ht) : mesIds; if (!set.has(ancre)) { ko++; console.log(`✗ ${path.relative(DIST, f)} → ${h} (ancre absente)`); } }
  }
}
console.log(`${pages.length} pages, ${n} liens vérifiés, ${ko} cassé(s).`);
process.exit(ko ? 1 : 0);
