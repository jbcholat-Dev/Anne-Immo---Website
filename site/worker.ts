// Point d'entrée Cloudflare du site (stories 9.6 et 10.2).
// Les pages prérendues sont servies directement par Cloudflare, sans passer par ce code.
// /api/* passe ici (run_worker_first dans wrangler.jsonc) :
// - /api/retour : remarque faite depuis l'aperçu, enregistrée comme ticket GitHub (story 9.6) ;
// - le reste est confié à Astro (handle), qui sert les routes de src/pages/api/ (ex. /api/sante, /api/webhook-cal)
//   et la page de résultats du diagnostic.
// Le site est protégé par Cloudflare Access : seules les personnes autorisées atteignent /api/retour,
// et Access transmet leur adresse dans l'en-tête cf-access-authenticated-user-email.
// `scheduled` : tâche planifiée, toutes les 15 minutes (wrangler.jsonc) : réessaie les e-mails en échec (story 10.3) ;
// la séquence d'e-mails, le test quotidien et la purge s'y ajouteront (stories 10.5, 10.7, 10.8).
import { handle } from '@astrojs/cloudflare/handler';
import { rejouer } from './src/server/delivery';
import type { EnvSite } from './src/server/env';

const REPO_DEFAUT = 'jbcholat-Dev/Anne-Immo---Website';
const ETIQUETTE = 'retour-apercu';
const MAX_TEXTE = 2000;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/retour') return retour(request, env);
    return handle(request, env, ctx);
  },
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(rejouer(env));
  },
} satisfies ExportedHandler<EnvSite>;

async function retour(request: Request, env: EnvSite): Promise<Response> {
  if (request.method !== 'POST') return json({ ok: false, error: { code: 'methode' } }, 405);
  if (!env.GITHUB_TOKEN) return json({ ok: false, error: { code: 'cle_absente' } }, 503);

  let corps: Record<string, unknown>;
  try {
    corps = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: { code: 'corps' } }, 400);
  }
  const texte = typeof corps.texte === 'string' ? corps.texte.trim() : '';
  if (!texte || texte.length > MAX_TEXTE) return json({ ok: false, error: { code: 'texte' } }, 400);
  const page = typeof corps.page === 'string' && corps.page.startsWith('/') ? corps.page.slice(0, 300) : '/';
  const ecran = typeof corps.ecran === 'string' ? corps.ecran.slice(0, 60) : '';

  const auteur = request.headers.get('cf-access-authenticated-user-email') || 'inconnu';
  const navigateur = (request.headers.get('user-agent') || '').slice(0, 200);
  const origine = new URL(request.url).origin;
  const titre = `[Retour aperçu] ${page} : ${texte.split('\n')[0].slice(0, 70)}`;
  const body = [
    `**Page :** ${origine}${page}`,
    `**Auteur :** ${auteur}`,
    `**Écran :** ${ecran || 'non précisé'}`,
    `**Date :** ${new Date().toISOString()}`,
    `**Navigateur :** ${navigateur || 'non précisé'}`,
    '',
    '---',
    '',
    texte,
  ].join('\n');

  const depot = env.GITHUB_REPO || REPO_DEFAUT;
  const creer = (labels?: string[]) =>
    fetch(`https://api.github.com/repos/${depot}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'anne-vial-tissot-site/retours',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(labels ? { title: titre, body, labels } : { title: titre, body }),
    });

  let reponse: Response;
  try {
    reponse = await creer([ETIQUETTE]);
    if (reponse.status === 422) reponse = await creer(); // étiquette refusée : on crée le ticket sans elle
  } catch {
    return json({ ok: false, error: { code: 'reseau' } }, 502);
  }
  if (!reponse.ok) return json({ ok: false, error: { code: 'github', statut: reponse.status } }, 502);
  const cree = (await reponse.json()) as { number: number; html_url: string };
  return json({ ok: true, numero: cree.number, url: cree.html_url });
}
