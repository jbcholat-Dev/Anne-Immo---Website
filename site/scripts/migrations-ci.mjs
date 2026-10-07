// Migrations de la base pendant la construction chez Cloudflare (story 10.2).
// Cloudflare Workers Builds pose WORKERS_CI=1 : on applique alors les migrations de migrations/ sur la base
// liée (DB) avant la mise en ligne. En local, rien ne se passe (pour la base locale : npm run base:local).
// Un échec arrête la construction : mieux vaut pas de mise en ligne qu'un code qui attend des tables absentes.
import { execSync } from 'node:child_process';

if (process.env.WORKERS_CI !== '1') {
  console.log('migrations-ci : construction locale, base distante non touchée.');
} else {
  console.log('migrations-ci : application des migrations sur la base distante…');
  execSync('npx wrangler d1 migrations apply DB --remote', { stdio: 'inherit', env: { ...process.env, CI: 'true' } });
}
