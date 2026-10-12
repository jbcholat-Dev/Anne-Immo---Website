// Plan du site (story 11.3, AD-3) : le fichier sitemap.xml qui liste à Google toutes les pages à indexer, avec leur langue.
// Généré après la construction depuis les pages réellement construites : une page est retenue si elle n'a pas
// de balise noindex ; son adresse est sa canonique, et ses liens de langue (hreflang) sont recopiés tels quels.
// Sur l'aperçu, toutes les pages sont noindex : le plan est vide, et robots.txt ne l'annonce pas.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ECARTEES = ['admin/']; // l'espace d'édition (Sveltia CMS) n'est pas une page du site

function pages(dossier, base = dossier) {
  return fs.readdirSync(dossier, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dossier, e.name);
    if (e.isDirectory()) return pages(p, base);
    return e.name.endsWith('.html') ? [path.relative(base, p).split(path.sep).join('/')] : [];
  });
}

const echapper = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export default function planDuSite() {
  return {
    name: 'plan-du-site',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const racine = fileURLToPath(dir);
        const entrees = [];
        for (const fichier of pages(racine).sort()) {
          if (ECARTEES.some((e) => fichier.startsWith(e))) continue;
          const html = fs.readFileSync(path.join(racine, fichier), 'utf8');
          const tete = html.slice(0, html.indexOf('</head>'));
          if (/<meta name="robots" content="[^"]*noindex/.test(tete)) continue;
          const canonique = tete.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
          if (!canonique) continue;
          const langues = [...tete.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
            .map(([, l, h]) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${echapper(h)}"/>`);
          entrees.push(`  <url>\n    <loc>${echapper(canonique)}</loc>\n${langues.map((l) => l + '\n').join('')}  </url>`);
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entrees.join('\n')}${entrees.length ? '\n' : ''}</urlset>\n`;
        fs.writeFileSync(path.join(racine, 'sitemap.xml'), xml);
        logger.info(`sitemap.xml : ${entrees.length} page(s) indexable(s).`);
      },
    },
  };
}
