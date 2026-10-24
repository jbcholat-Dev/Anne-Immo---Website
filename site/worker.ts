// Point d'entrée Cloudflare du site (stories 9.6 et 10.2).
// Les pages prérendues sont servies directement par Cloudflare, sans passer par ce code.
// /api/* passe ici (run_worker_first dans wrangler.jsonc) :
// - /api/retour : remarque faite depuis l'aperçu, enregistrée comme ticket GitHub (story 9.6) ;
// - /api/desabonnement : désinscription en un clic depuis la messagerie (en-tête List-Unsubscribe, story 10.5 ; campagnes
//   de l'espace avec `c=`, story 13.27), servie ici
//   car les messageries postent sans en-tête Origin, ce que le contrôle d'origine d'Astro refuserait ;
// - le reste est confié à Astro (handle), qui sert les routes de src/pages/api/ (ex. /api/sante, /api/webhook-cal),
//   la page de résultats du diagnostic et la page /desabonnement.
// /api/retour n'accepte que les personnes connectées par Cloudflare Access (jeton vérifié ici, comme pour /gestion) :
// depuis l'ouverture au public, Access ne couvre plus tout annevialtissot.fr, et sans ce contrôle n'importe qui pourrait
// créer des tickets retour-apercu dans le dépôt. L'auteur du ticket est l'adresse lue dans le jeton vérifié.
// /gestion et /api/gestion/* : espace de gestion des demandes d'Anne (story 10.7). Le jeton de Cloudflare Access y est vérifié
// ici, avant tout le reste (src/server/acces.ts) ; sans jeton valable, rien n'est servi (403).
// `scheduled` : tâche planifiée, toutes les 15 minutes (wrangler.jsonc) : réessaie les e-mails en échec (story 10.3),
// envoie les e-mails de la séquence arrivés à échéance (story 10.5), purge les demandes de plus de 3 ans (story 10.7) et
// rattache à leur contact les demandes qui ne le sont pas encore (story 13.4) ; le test quotidien s'y ajoutera (10.8).
import { handle } from '@astrojs/cloudflare/handler';
import { compteAcces, ENTETE_COMPTE } from './src/server/acces';
import { rattacherOrphelins } from './src/server/contacts';
import { rejouer } from './src/server/delivery';
import type { EnvSite } from './src/server/env';
import { journal } from './src/server/journal';
import { desabonner, desinscrireContact, verifierDesabonnement, verifierDesinscriptionContact } from './src/server/liens';
import { purger } from './src/server/purge';
import { creerTicketRetour } from './src/server/retours';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

// En-têtes de sécurité, les mêmes que public/_headers (qui ne vaut que pour les pages fixes).
const SECURITE: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

function securiser(reponse: Response): Response {
  if (reponse.status === 101) return reponse;
  const r = new Response(reponse.body, reponse);
  for (const [nom, valeur] of Object.entries(SECURITE)) if (!r.headers.has(nom)) r.headers.set(nom, valeur);
  return r;
}

export default {
  async fetch(request, env, ctx) {
    return securiser(await repondre(request, env, ctx));
  },
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(Promise.all([rejouer(env), purger(env), rattacherOrphelins(env)]));
  },
} satisfies ExportedHandler<EnvSite>;

async function repondre(request: Request, env: EnvSite, ctx: ExecutionContext): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/api/retour') return retour(request, env);
  if (url.pathname === '/api/desabonnement') return desabonnementUnClic(request, env, url);
  if (/^\/(api\/)?gestion(\/|\.|$)/i.test(url.pathname)) return gestion(request, env, ctx);
  // Partout ailleurs, l'en-tête interne du compte ne peut venir que d'un visiteur : il est retiré.
  if (request.headers.has(ENTETE_COMPTE)) {
    const entetes = new Headers(request.headers);
    entetes.delete(ENTETE_COMPTE);
    return handle(new Request(request, { headers: entetes }), env, ctx);
  }
  return handle(request, env, ctx);
}

/** Espace de gestion : seulement avec un jeton Access valable ; l'adresse vérifiée est transmise aux pages par un en-tête interne. */
async function gestion(request: Request, env: EnvSite, ctx: ExecutionContext): Promise<Response> {
  const compte = await compteAcces(env, request);
  if (!compte) {
    journal('gestion_refus', { chemin: new URL(request.url).pathname });
    return new Response('Accès refusé : cet espace est réservé à Anne et à Jean-Baptiste, connectés par Cloudflare Access.', {
      status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
    });
  }
  const entetes = new Headers(request.headers);
  entetes.set(ENTETE_COMPTE, compte);
  const reponse = await handle(new Request(request, { headers: entetes }), env, ctx);
  const finale = new Response(reponse.body, reponse);
  finale.headers.set('Cache-Control', 'no-store');
  finale.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return finale;
}

/** Désinscription en un clic (RFC 8058) : la messagerie poste `List-Unsubscribe=One-Click` sur l'adresse de l'en-tête. */
async function desabonnementUnClic(request: Request, env: EnvSite, url: URL): Promise<Response> {
  if (request.method !== 'POST') return json({ ok: false, error: { code: 'methode' } }, 405);
  // Campagne de l'espace d'Anne (story 13.27) : le lien désigne un contact.
  if (url.searchParams.has('c')) {
    const contactId = await verifierDesinscriptionContact(env, url);
    if (!contactId) return json({ ok: false, error: { code: 'lien' } }, 404);
    await desinscrireContact(env, contactId);
    journal('desinscription_campagnes', { contact: contactId, mode: 'un_clic' });
    return json({ ok: true });
  }
  const leadId = await verifierDesabonnement(env, url);
  if (!leadId) return json({ ok: false, error: { code: 'lien' } }, 404);
  await desabonner(env, leadId);
  journal('desabonnement', { lead: leadId, mode: 'un_clic' });
  return json({ ok: true });
}

async function retour(request: Request, env: EnvSite): Promise<Response> {
  if (request.method !== 'POST') return json({ ok: false, error: { code: 'methode' } }, 405);
  const auteur = await compteAcces(env, request);
  if (!auteur) return json({ ok: false, error: { code: 'acces' } }, 403);
  return creerTicketRetour(request, env, auteur, 'aperçu');
}
