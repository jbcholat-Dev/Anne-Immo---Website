// Garde-fou de la construction de l'espace chez Cloudflare (story 18.2, AD-23).
// Le schéma de la base ne change que par site/migrations/, appliquées par la construction du site. L'espace lit et écrit la
// même base : s'il était mis en ligne avant qu'une migration y soit appliquée, il tournerait sur l'ancien schéma. Pendant une
// construction chez Cloudflare (WORKERS_CI=1), on demande donc à la base liée (DB, après le choix de scripts/base.mjs) la
// liste des migrations de ../site/migrations (champ migrations_dir de wrangler.jsonc) qui n'y sont pas encore appliquées ;
// s'il en reste une, la construction s'arrête. Il suffit alors de relancer la construction de l'espace une fois celle du
// site terminée. En local, rien n'est demandé à la base distante.
// Essai sans Cloudflare : `node scripts/migrations-a-jour.mjs --essai <dossier d'état local>` fait la même vérification sur
// une base locale (par exemple ../site/.wrangler/state).
import { execFileSync } from 'node:child_process';

const i = process.argv.indexOf('--essai');
const essai = i > 0 ? process.argv[i + 1] : null;
if (!essai && process.env.WORKERS_CI !== '1') {
  console.log('migrations-a-jour : construction locale, base distante non interrogée.');
  process.exit(0);
}

let sortie = '';
try {
  sortie = execFileSync('npx', ['wrangler', 'd1', 'migrations', 'list', 'DB', ...(essai ? ['--local', '--persist-to', essai] : ['--remote'])], {
    encoding: 'utf8',
    env: { ...process.env, CI: 'true' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (e) {
  console.error(`migrations-a-jour : impossible de lire l'état des migrations de la base. Construction arrêtée.\n${e.stdout ?? ''}${e.stderr ?? ''}`);
  process.exit(1);
}
console.log(sortie);
if (/No migrations to apply/i.test(sortie)) {
  console.log('migrations-a-jour : toutes les migrations de site/migrations sont appliquées sur la base liée.');
} else {
  const manquantes = [...new Set(sortie.match(/\d{4}-[\w.-]+\.sql/g) ?? [])];
  console.error(`migrations-a-jour : migration(s) pas encore appliquée(s) sur la base liée : ${manquantes.join(', ') || '(voir ci-dessus)'}.`);
  console.error("La construction de l'espace s'arrête pour ne pas tourner sur l'ancien schéma. Relancer une fois la construction du site terminée.");
  process.exit(1);
}
