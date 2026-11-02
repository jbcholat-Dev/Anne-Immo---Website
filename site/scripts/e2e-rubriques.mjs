// Story 8.21, décision D-46 : vérifie que les onglets Partenaires et Actualités suivent la règle du site public.
//   1. Sans fiche publiée : aucun lien vers /partenaires ni /actualites, pages en noindex, absentes du plan du site.
//   2. Avec une fiche « publie » et une fiche « brouillon » par rubrique : onglets présents, pages indexables et au plan
//      du site, brouillons invisibles.
// Usage (depuis site/) : node scripts/e2e-rubriques.mjs
// Construit deux fois le site en mode public (PUBLIC_INDEXATION=oui) avec des fiches d'essai, retirées à la fin
// même en cas d'échec. Refaire ensuite `npm run build` pour revenir au mode aperçu.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const RACINE = path.resolve(import.meta.dirname, '..');
const CONTENU = path.resolve(RACINE, '../contenu-anne');
const DIST = path.join(RACINE, 'dist/client');
const essais = {
  'partenaires/essai-e2e-publie.md': '---\nnom: Essai publié\nactivite: Notaire\nsite: https://exemple.fr\nordre:\nstatut: publie\n---\nTexte d\'essai.\n',
  'partenaires/essai-e2e-brouillon.md': '---\nnom: Essai brouillon\nactivite: Notaire\nstatut: brouillon\n---\n',
  'actualites/essai-e2e-publie.md': '---\ntitre: Article publié\ndate: 2026-01-15\nstatut: publie\n---\nTexte d\'essai.\n',
  'actualites/essai-e2e-brouillon.md': '---\ntitre: Article brouillon\ndate: 2026-01-16\nstatut: brouillon\n---\nTexte d\'essai.\n',
};
let echecs = 0;
const ok = (cond, msg) => { console.log(`${cond ? 'OK   ' : 'ÉCHEC'} ${msg}`); if (!cond) echecs++; };
const construire = () => execSync('npm run build', { cwd: RACINE, stdio: 'ignore', env: { ...process.env, PUBLIC_INDEXATION: 'oui' } });
const lire = (f) => fs.readFileSync(path.join(DIST, f), 'utf8');
const lienVers = (html, cible) => new RegExp(`href="${cible}"`).test(html);
const pagesHtml = () => fs.readdirSync(DIST, { recursive: true }).filter((f) => f.endsWith('.html') && !f.startsWith('partenaires') && !f.startsWith('actualites') && !f.startsWith('admin'));

function retirer() { for (const f of Object.keys(essais)) fs.rmSync(path.join(CONTENU, f), { force: true }); }

try {
  retirer();
  console.log('1. Site public sans fiche…');
  construire();
  const sansLien = pagesHtml().every((f) => { const h = lire(f); return !lienVers(h, '/partenaires') && !lienVers(h, '/actualites'); });
  ok(sansLien, 'aucune page ne pointe vers /partenaires ni /actualites');
  ok(/noindex/.test(lire('partenaires.html')), '/partenaires en noindex');
  ok(/noindex/.test(lire('actualites.html')), '/actualites en noindex');
  const plan1 = lire('sitemap.xml');
  ok(!plan1.includes('/partenaires') && !plan1.includes('/actualites'), 'plan du site sans les deux rubriques');

  console.log('2. Site public avec une fiche publiée et une fiche en brouillon par rubrique…');
  for (const [f, t] of Object.entries(essais)) fs.writeFileSync(path.join(CONTENU, f), t);
  construire();
  const accueil = lire('index.html');
  ok(lienVers(accueil, '/partenaires') && lienVers(accueil, '/actualites'), 'onglets présents sur l\'accueil');
  const part = lire('partenaires.html');
  ok(!/noindex/.test(part), '/partenaires indexable');
  ok(part.includes('Essai publié') && !part.includes('Essai brouillon'), 'partenaire publié visible, brouillon absent');
  ok(part.includes('href="https://exemple.fr"'), 'lien du partenaire en adresse complète');
  const actus = lire('actualites.html');
  ok(!/noindex/.test(actus), '/actualites indexable');
  ok(actus.includes('Article publié') && !actus.includes('Article brouillon'), 'article publié visible, brouillon absent');
  ok(fs.existsSync(path.join(DIST, 'actualites/essai-e2e-publie.html')) && !fs.existsSync(path.join(DIST, 'actualites/essai-e2e-brouillon.html')), 'page de l\'article publié construite, pas celle du brouillon');
  ok(actus.includes('15 janvier 2026'), 'date de l\'article affichée sans décalage de fuseau');
  const plan2 = lire('sitemap.xml');
  ok(plan2.includes('/partenaires') && plan2.includes('/actualites/essai-e2e-publie') && !plan2.includes('brouillon'), 'plan du site avec les rubriques, sans le brouillon');
} finally {
  retirer();
}
console.log(echecs ? `${echecs} vérification(s) en échec.` : 'Toutes les vérifications passent.');
process.exit(echecs ? 1 : 0);
