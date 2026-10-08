// Serveur local pour les essais de bout en bout (stories 10.3, 10.4 et 10.6) : `wrangler dev` sur la base locale, avec une
// imitation de Turnstile (accepte tout jeton sauf « refuse ») et de Resend (garde les e-mails reçus ; en panne sur demande),
// car le serveur local ne peut pas joindre ces services depuis l'environnement de Claude. Utilisé par e2e-formulaires.mjs
// et e2e-diagnostic.mjs. Préalable : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run base:local`.
import { spawn, execFileSync } from 'node:child_process';
import { createSign, generateKeyPairSync } from 'node:crypto';
import { createServer } from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ICI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const pause = (ms) => new Promise((ok) => setTimeout(ok, ms));

export async function demarrer({ nom, port = 8788, portImitation = 8790 }) {
  const recus = [];
  const etat = { enPanne: false };
  // Imitation de Cloudflare Access (story 10.7) : une paire de clés d'essai, la clé publique servie comme celles de l'équipe Access.
  const ACCESS = `http://localhost:${portImitation}/access`;
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const certs = JSON.stringify({ keys: [{ ...publicKey.export({ format: 'jwk' }), kid: 'cle-essai', alg: 'RS256', use: 'sig' }] });
  const imitation = createServer((req, res) => {
    let corps = '';
    req.on('data', (c) => (corps += c));
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      // Une connexion par appel : le serveur local réutilise sinon une connexion que l'imitation a déjà fermée
      // (« Network connection lost » sur le deuxième e-mail d'un même lead).
      res.setHeader('Connection', 'close');
      if (req.url === '/access/cdn-cgi/access/certs') return res.end(certs);
      if (req.url === '/turnstile') return res.end(JSON.stringify({ success: !corps.includes('response=refuse'), 'error-codes': [] }));
      if (req.url === '/resend') {
        if (etat.enPanne) { res.statusCode = 500; return res.end(JSON.stringify({ name: 'imitation_en_panne', message: 'panne simulée' })); }
        recus.push({ ...JSON.parse(corps), idempotence: req.headers['idempotency-key'] });
        return res.end(JSON.stringify({ id: `imitation-${recus.length}` }));
      }
      res.statusCode = 404; res.end('{}');
    });
  });
  await new Promise((ok) => imitation.listen(portImitation, ok));

  const essai = `${nom}-${Date.now().toString(36)}`;
  const reglages = path.join(os.tmpdir(), `essai-${essai}.vars`);
  fs.writeFileSync(reglages, [
    'TURNSTILE_SECRET_KEY=essai', 'RESEND_API_KEY=essai', 'BOITE_TEST=boite-test@example.com', 'CAL_WEBHOOK_SECRET=essai', 'LIEN_SECRET=essai',
    `URL_SERVICES_ESSAI=http://localhost:${portImitation}`, `URL_SITE=http://localhost:${port}`,
    `ACCESS_EQUIPE=${ACCESS}`, 'ACCESS_AUD=essai-aud',
  ].join('\n'));
  const journal = path.join(os.tmpdir(), `e2e-${essai}.log`); // journal du serveur local, hors du dossier du site
  const sortie = fs.openSync(journal, 'w');
  // Sans réglage de proxy : wrangler ferait passer par lui les appels du serveur local vers l'imitation, qui est sur cette machine.
  const sansProxy = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(https?|all|no)_proxy$/i.test(k)));
  const serveur = spawn('npx', ['wrangler', 'dev', '--port', String(port), '--env-file', reglages, '--test-scheduled'], { cwd: ICI, detached: true, stdio: ['ignore', sortie, sortie], env: sansProxy });
  const U = `http://localhost:${port}`;
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`${U}/api/sante`)).ok) break; } catch {}
    await pause(1000);
  }
  /** Jeton tel que Cloudflare Access l'ajoute à chaque requête (en-tête Cf-Access-Jwt-Assertion) ; `champs` remplace les valeurs par défaut. */
  const jetonAcces = (champs = {}, cle = privateKey) => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    const t = Math.floor(Date.now() / 1000);
    const corps = `${b64({ alg: 'RS256', kid: 'cle-essai', typ: 'JWT' })}.${b64({ aud: ['essai-aud'], iss: ACCESS, email: 'anne@example.com', iat: t, nbf: t, exp: t + 3600, ...champs })}`;
    return `${corps}.${createSign('RSA-SHA256').update(corps).sign(cle).toString('base64url')}`;
  };
  return {
    U, recus, etat, journal, essai, jetonAcces,
    arreter() { try { process.kill(-serveur.pid); } catch {} imitation.close(); fs.rmSync(reglages, { force: true }); },
    // Le serveur local ferme parfois une connexion réutilisée : on réessaie une fois avant de conclure.
    appeler: (url, options) => fetch(url, options).catch(() => pause(500).then(() => fetch(url, options))),
    sql: (requete) =>
      JSON.parse(execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--json', '--command', requete], { cwd: ICI, encoding: 'utf8' }))[0].results,
  };
}

/** Remplace le script Turnstile dans le navigateur d'essai : le vrai widget ne se charge pas depuis l'environnement de Claude
 * (iframe de Cloudflare refusée par le réseau). L'imitation rend un jeton ; le vrai widget est essayé sur l'aperçu. */
export async function imiterTurnstile(page, scripts = []) {
  page.on('request', (q) => { if (q.url().includes('challenges.cloudflare.com')) scripts.push(q.url()); });
  await page.route('https://challenges.cloudflare.com/**', (route) => route.fulfill({
    contentType: 'text/javascript',
    body: `window.turnstile = { _o: {}, render(el, o) { const id = 'w' + Math.random(); this._o[id] = o; return id; },
      execute(id) { setTimeout(() => this._o[id].callback('jeton-navigateur'), 50); }, remove(id) { delete this._o[id]; } };`,
  }));
  return scripts;
}

export const ALPHABET_ULID = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const sid = () => Array.from({ length: 26 }, () => ALPHABET_ULID[Math.floor(Math.random() * 32)]).join('');
