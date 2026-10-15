// Choix de la base pendant la construction chez Cloudflare (story 13.3).
// Une construction de la branche `main` (WORKERS_CI=1 et WORKERS_CI_BRANCH=main, posés par Cloudflare Workers Builds)
// branche l'espace sur la base de production `anne-leads`, celle du site en ligne, et sur l'adresse publique du site.
// Toute autre construction (branches de travail, poste local) reste sur la base d'aperçu.
// Contrairement au site, pas de variable LANCEMENT : le site est en ligne depuis le 2026-10-11.
// Essai sans Cloudflare : `node scripts/base.mjs --essai` affiche la configuration produite, sans rien écrire.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CONFIG = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'wrangler.jsonc');

const PRODUCTION = { nom: 'anne-leads', id: '59b15fb0-cb56-45a7-a61a-378548fd6fe4', url: 'https://annevialtissot.fr' };
const APERCU = { nom: 'anne-leads-apercu', id: '06a92884-c6f1-4d02-afbe-976d11543385', url: 'https://apercu-anne-vial-tissot-site.jbcholat.workers.dev' };

const essai = process.argv.includes('--essai');
const branche = process.env.WORKERS_CI_BRANCH ?? '';
if (!essai && !(process.env.WORKERS_CI === '1' && branche === 'main')) {
  console.log(`base : aperçu (${process.env.WORKERS_CI !== '1' ? 'construction locale' : `branche ${branche || 'inconnue'}`}), configuration inchangée.`);
  process.exit(0);
}

// Remplacements exacts : si wrangler.jsonc a changé de forme, on s'arrête plutôt que de mettre en ligne un espace à moitié basculé.
const remplacements = [
  [`"database_name": "${APERCU.nom}"`, `"database_name": "${PRODUCTION.nom}"`],
  [`"database_id": "${APERCU.id}"`, `"database_id": "${PRODUCTION.id}"`],
  ['"ENVIRONNEMENT": "apercu"', '"ENVIRONNEMENT": "production"'],
  [`"URL_SITE": "${APERCU.url}"`, `"URL_SITE": "${PRODUCTION.url}"`],
];
let config = fs.readFileSync(CONFIG, 'utf8');
for (const [avant, apres] of remplacements) {
  const n = config.split(avant).length - 1;
  if (n !== 1) {
    console.error(`base : « ${avant} » trouvé ${n} fois dans wrangler.jsonc au lieu d'une. Construction arrêtée.`);
    process.exit(1);
  }
  config = config.replace(avant, apres);
}
if (essai) {
  console.log(config);
  process.exit(0);
}
fs.writeFileSync(CONFIG, config);
console.log('base : production (branche main), base anne-leads.');
