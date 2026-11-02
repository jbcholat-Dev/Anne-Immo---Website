// Point d'entrée Cloudflare de l'espace de travail d'Anne (story 13.3, AD-19).
// Tout passe ici (run_worker_first: true dans wrangler.jsonc) : le jeton de Cloudflare Access est vérifié avant
// toute autre chose (@site/server/acces.ts, le même contrôle que le /gestion du site). Sans jeton valable,
// rien n'est servi (403), pas même une feuille de style. L'adresse vérifiée est transmise aux pages par un en-tête
// interne, que le visiteur ne peut pas poser lui-même : il est toujours remplacé ici.
// Accès de Claude (story 13.17) : un jeton de service Cloudflare Access (programme, sans e-mail) n'ouvre que les adresses
// /api/claude/…, et seulement si son identifiant client est celui posé en secret ACCESS_CLAUDE_ID. À l'inverse, ces
// adresses refusent une personne connectée : elles ne servent qu'au programme. Toute autre page reste réservée à Anne et JB.
// Tâche planifiée (toutes les 10 minutes, wrangler.jsonc) : la relève Leedflow (story 13.10, src/server/leedflow.ts) et
// l'envoi des campagnes e-mail par paquets (story 13.27, src/server/campagnes.ts).
// Les e-mails relancés depuis l'espace partent toujours par celle du site (toutes les 15 minutes).
import { handle } from '@astrojs/cloudflare/handler';
import { ENTETE_COMPTE, identiteAcces } from '@site/server/acces';
import { journal } from '@site/server/journal';
import { COMPTE_CLAUDE, pourSite, type EnvEspace } from './src/server/env';
import { envoyerCampagnes } from './src/server/campagnes';
import { relever } from './src/server/leedflow';

// En-têtes de sécurité, les mêmes que ceux du site, plus : jamais en cache, jamais indexé.
const SECURITE: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
};

function securiser(reponse: Response): Response {
  const r = new Response(reponse.body, reponse);
  for (const [nom, valeur] of Object.entries(SECURITE)) r.headers.set(nom, valeur);
  return r;
}

export default {
  async fetch(request, env, ctx) {
    const qui = await identiteAcces(pourSite, request);
    const pourClaude = new URL(request.url).pathname.startsWith('/api/claude/');
    const compte = pourClaude
      ? (qui?.service && env.ACCESS_CLAUDE_ID && qui.service === env.ACCESS_CLAUDE_ID ? COMPTE_CLAUDE : null)
      : qui?.email ?? null;
    if (!compte) {
      journal('espace_refus', { chemin: new URL(request.url).pathname });
      return securiser(new Response('Accès refusé : cet espace est réservé à Anne et à Jean-Baptiste, connectés par Cloudflare Access.', {
        status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      }));
    }
    const entetes = new Headers(request.headers);
    entetes.set(ENTETE_COMPTE, compte);
    return securiser(await handle(new Request(request, { headers: entetes }), env, ctx));
  },
  async scheduled(_controleur, env, ctx) {
    ctx.waitUntil(Promise.all([
      relever(env).catch((e) => journal('leedflow_echec', { detail: String(e).slice(0, 200) })),
      envoyerCampagnes(pourSite).catch((e) => journal('campagnes_echec', { detail: String(e).slice(0, 200) })),
    ]));
  },
} satisfies ExportedHandler<EnvEspace>;
