// Bascule du site en production pendant la construction chez Cloudflare (stories 12.4 et 12.5).
// Le site ne passe en production que si deux conditions sont réunies :
//   1. la construction porte sur la branche `main` (WORKERS_CI_BRANCH, posé par Cloudflare Workers Builds) ;
//   2. la variable de construction LANCEMENT vaut « oui » (Cloudflare → projet → Settings → Build → Variables).
// Alors, avant `astro build`, ce script :
//   - branche la base de production `anne-leads` à la place de `anne-leads-apercu` ;
//   - passe ENVIRONNEMENT à `production` (e-mails envoyés à Anne et aux prospects, plus à BOITE_TEST) ;
//   - met l'adresse publique dans URL_SITE (liens des e-mails) ;
//   - écrit PUBLIC_INDEXATION=oui dans .env.production (site indexable, ventes « publie » seulement, garde-fous de lancement).
// Toute autre branche (essais de design, travaux des fils) reste un aperçu : base d'aperçu, e-mails vers BOITE_TEST.
// Pourquoi ici et pas dans wrangler.jsonc : un réglage committé sur `main` passerait dans toutes les branches tirées de `main`,
// et leurs aperçus écriraient dans la vraie base. Retour arrière : retirer LANCEMENT, puis relancer la construction.
// Essai sans Cloudflare : `node scripts/lancement.mjs --essai` affiche la configuration produite, sans rien écrire.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = path.join(ICI, 'wrangler.jsonc');
const ENV = path.join(ICI, '.env.production');

/** Valeurs de production (RUNBOOK § 4 et § 4 quater). Publiques : aucun secret ici. */
const PRODUCTION = {
  base: { nom: 'anne-leads', id: '59b15fb0-cb56-45a7-a61a-378548fd6fe4' },
  url: 'https://annevialtissot.fr',
};
const APERCU = {
  base: { nom: 'anne-leads-apercu', id: '06a92884-c6f1-4d02-afbe-976d11543385' },
  url: 'https://anne-vial-tissot-site.jbcholat.workers.dev',
};

const essai = process.argv.includes('--essai');
const branche = process.env.WORKERS_CI_BRANCH ?? '';
const lancement = process.env.LANCEMENT === 'oui';

if (!essai && !(process.env.WORKERS_CI === '1' && branche === 'main' && lancement)) {
  const pourquoi = process.env.WORKERS_CI !== '1' ? 'construction locale' : branche !== 'main' ? `branche ${branche || 'inconnue'}` : 'LANCEMENT ≠ oui';
  console.log(`lancement : aperçu (${pourquoi}), configuration inchangée.`);
  process.exit(0);
}

// Remplacements exacts : si wrangler.jsonc a changé de forme, on s'arrête plutôt que de mettre en ligne une configuration à moitié basculée.
const remplacements = [
  [`"database_name": "${APERCU.base.nom}"`, `"database_name": "${PRODUCTION.base.nom}"`],
  [`"database_id": "${APERCU.base.id}"`, `"database_id": "${PRODUCTION.base.id}"`],
  ['"ENVIRONNEMENT": "apercu"', '"ENVIRONNEMENT": "production"'],
  [`"URL_SITE": "${APERCU.url}"`, `"URL_SITE": "${PRODUCTION.url}"`],
];
let config = fs.readFileSync(CONFIG, 'utf8');
for (const [avant, apres] of remplacements) {
  const n = config.split(avant).length - 1;
  if (n !== 1) {
    console.error(`lancement : « ${avant} » trouvé ${n} fois dans wrangler.jsonc au lieu d'une. Bascule arrêtée, rien n'est mis en ligne.`);
    process.exit(1);
  }
  config = config.replace(avant, apres);
}

if (essai) {
  console.log(config);
  console.log('lancement --essai : rien n’a été écrit. En production, .env.production recevrait PUBLIC_INDEXATION=oui.');
  process.exit(0);
}
fs.writeFileSync(CONFIG, config);
fs.writeFileSync(ENV, 'PUBLIC_INDEXATION=oui\n');
console.log(`lancement : PRODUCTION (branche main, LANCEMENT=oui) : base ${PRODUCTION.base.nom}, e-mails réels, adresse ${PRODUCTION.url}, site indexable.`);
