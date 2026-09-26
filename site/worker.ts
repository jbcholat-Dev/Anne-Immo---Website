// Point d'entrée Cloudflare du site (story 9.6).
// Tout ce qui n'est pas /api/* est servi directement depuis les fichiers construits (dist) par Cloudflare,
// sans passer par ce code (réglage run_worker_first dans wrangler.jsonc).
// /api/retour : reçoit une remarque faite depuis l'aperçu et l'enregistre comme ticket GitHub.
// Le site est protégé par Cloudflare Access : seules les personnes autorisées atteignent cette route,
// et Access transmet leur adresse dans l'en-tête cf-access-authenticated-user-email.
// Ce fichier disparaîtra au profit du noyau serveur de l'epic 10 (adaptateur Astro + worker.ts, AD-4 à AD-8).

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Secret Cloudflare (jamais dans le dépôt) : clé GitHub limitée à ce dépôt, droits « Issues : lecture et écriture ». */
  GITHUB_TOKEN?: string;
  /** Variable publique : dépôt qui reçoit les tickets. */
  GITHUB_REPO?: string;
}

const REPO_DEFAUT = 'jbcholat-Dev/Anne-Immo---Website';
const ETIQUETTE = 'retour-apercu';
const MAX_TEXTE = 2000;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/retour') return retour(request, env);
    if (url.pathname.startsWith('/api/')) return json({ ok: false, error: { code: 'inconnu' } }, 404);
    return env.ASSETS.fetch(request);
  },
};

async function retour(request: Request, env: Env): Promise<Response> {
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
