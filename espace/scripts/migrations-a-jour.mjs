// Garde-fou de la construction de l'espace chez Cloudflare (story 18.2, AD-23).
// Le schéma de la base ne change que par site/migrations/, appliquées par la construction du site. L'espace lit et écrit la
// même base : s'il était mis en ligne avant qu'une migration y soit appliquée, il tournerait sur l'ancien schéma. Pendant une
// construction chez Cloudflare (WORKERS_CI=1), on demande donc à la base liée (DB, après le choix de scripts/base.mjs) la
// liste des migrations de ../site/migrations (champ migrations_dir de wrangler.jsonc) qui n'y sont pas encore appliquées ;
// s'il en reste une, on revérifie toutes les 30 s pendant 10 min au plus (la construction du site, lancée par la même
// poussée, a le temps de l'appliquer), puis la construction s'arrête. Une erreur de lecture (droits du jeton, réseau) ne
// bloque pas : avertissement, et la construction continue (revue de code 18.2). En local, rien n'est demandé à la base
// distante. Réglages d'essai : MIGRATIONS_ATTENTE_S (durée totale, 600 par défaut), MIGRATIONS_PAS_S (30 par défaut).
// Essai sans Cloudflare : `node scripts/migrations-a-jour.mjs --essai <dossier d'état local>` fait la même vérification sur
// une base locale (par exemple ../site/.wrangler/state).
import { execFileSync } from 'node:child_process';

const i = process.argv.indexOf('--essai');
const essai = i > 0 ? process.argv[i + 1] : null;
if (!essai && process.env.WORKERS_CI !== '1') {
  console.log('migrations-a-jour : construction locale, base distante non interrogée.');
  process.exit(0);
}

const ATTENTE_MS = Number(process.env.MIGRATIONS_ATTENTE_S ?? 600) * 1000;
const PAS_MS = Number(process.env.MIGRATIONS_PAS_S ?? 30) * 1000;

/** La sortie de `wrangler d1 migrations list`, ou null si la base n'a pas pu être lue. */
function lire() {
  try {
    return execFileSync('npx', ['wrangler', 'd1', 'migrations', 'list', 'DB', ...(essai ? ['--local', '--persist-to', essai] : ['--remote'])], {
      encoding: 'utf8',
      env: { ...process.env, CI: 'true' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    console.warn(`migrations-a-jour : AVERTISSEMENT, impossible de lire l'état des migrations de la base (droits du jeton ou réseau). La construction continue sans cette vérification.\n${e.stdout ?? ''}${e.stderr ?? ''}`);
    return null;
  }
}

const debut = Date.now();
for (;;) {
  const sortie = lire();
  if (sortie === null) process.exit(0);
  if (/No migrations to apply/i.test(sortie)) {
    console.log('migrations-a-jour : toutes les migrations de site/migrations sont appliquées sur la base liée.');
    process.exit(0);
  }
  const manquantes = [...new Set(sortie.match(/\d{4}-[\w.-]+\.sql/g) ?? [])];
  const liste = manquantes.join(', ') || '(voir la sortie de wrangler)';
  if (Date.now() - debut + PAS_MS > ATTENTE_MS) {
    console.log(sortie);
    console.error(`migrations-a-jour : migration(s) toujours pas appliquée(s) sur la base liée : ${liste}.`);
    console.error("La construction de l'espace s'arrête pour ne pas tourner sur l'ancien schéma. Relancer une fois la construction du site terminée.");
    process.exit(1);
  }
  console.log(`migrations-a-jour : en attente de ${liste} (construction du site en cours ?) ; nouvel essai dans ${PAS_MS / 1000} s.`);
  await new Promise((ok) => setTimeout(ok, PAS_MS));
}
