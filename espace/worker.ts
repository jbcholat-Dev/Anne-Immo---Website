// Point d'entrée Cloudflare de l'espace de travail d'Anne (story 13.3, AD-19).
// Tout passe ici (run_worker_first: true dans wrangler.jsonc) : le jeton de Cloudflare Access est vérifié avant
// toute autre chose (@site/server/acces.ts, le même contrôle que le /gestion du site). Sans jeton valable,
// rien n'est servi (403), pas même une feuille de style. L'adresse vérifiée est transmise aux pages par un en-tête
// interne, que le visiteur ne peut pas poser lui-même : il est toujours remplacé ici.
// Accès de Claude (story 13.17) : un jeton de service Cloudflare Access (programme, sans e-mail) n'ouvre que les adresses
// /api/claude/…, et seulement si son identifiant client est celui posé en secret ACCESS_CLAUDE_ID. À l'inverse, ces
// adresses refusent une personne connectée : elles ne servent qu'au programme. Toute autre page reste réservée à Anne et JB.
// Tâche planifiée (toutes les 10 minutes, wrangler.jsonc) : la relève Leedflow (story 13.10, src/server/leedflow.ts) et
// l'envoi des campagnes e-mail par paquets (story 13.27, src/server/campagnes.ts) et le ménage des numéros ignorés depuis
// la barre « Nouveaux » (story 18.11), le ménage des e-mails des portails (story 18.12).
// E-mails entrants (story 18.12, AD-20 entrée 3) : Cloudflare Email Routing remet ici chaque e-mail envoyé à l'adresse du
// sous-domaine de réception (RUNBOOK § 4 sexies, « Demandes des portails par e-mail ») ; src/server/portails.ts le lit.
// Un expéditeur qui n'est pas un portail, ou un e-mail qui n'a pas été transféré par la Gmail d'Anne (enveloppe, réglage
// PORTAILS_EXPEDITEUR_AUTORISE), est rejeté ; un e-mail illisible est gardé pour être lu à la main, jamais perdu.
// En local, `wrangler dev` les accepte à l'adresse /cdn-cgi/handler/email (scripts/e2e-espace.mjs).
// Les e-mails relancés depuis l'espace partent toujours par celle du site (toutes les 15 minutes).
import { handle } from '@astrojs/cloudflare/handler';
import { ENTETE_COMPTE, identiteAcces } from '@site/server/acces';
import { journal } from '@site/server/journal';
import { COMPTE_CLAUDE, pourSite, type EnvEspace } from './src/server/env';
import { envoyerCampagnes } from './src/server/campagnes';
import { nettoyerIgnores, relever } from './src/server/leedflow';
import { menagePortails, recevoirCourriel, TAILLE_MAX } from './src/server/portails';

/** Le message brut en texte d'un caractère par octet (ce que lit src/server/courriel.ts) ; au-delà de TAILLE_MAX, le début seulement. */
async function lireBrut(flux: ReadableStream<Uint8Array>): Promise<string> {
  const lecteur = flux.getReader();
  const morceaux: string[] = [];
  let lu = 0;
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done || !value) break;
    const reste = TAILLE_MAX + 1 - lu;
    const partie = value.length > reste ? value.subarray(0, reste) : value;
    for (let i = 0; i < partie.length; i += 8192) morceaux.push(String.fromCharCode(...partie.subarray(i, i + 8192)));
    lu += partie.length;
    if (lu > TAILLE_MAX) { await lecteur.cancel().catch(() => {}); break; }
  }
  return morceaux.join('');
}

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
      // Story 18.11 : échanges des numéros ignorés depuis la barre « Nouveaux », effacés une fois le délai d'annulation passé.
      nettoyerIgnores(env).catch((e) => journal('nouveaux_echec', { detail: String(e).slice(0, 200) })),
      // Story 18.12 : texte des e-mails « à lire à la main » effacé une fois traités ; lignes de plus de trois ans retirées.
      menagePortails(env).catch((e) => journal('portail_menage_echec', { detail: String(e).slice(0, 200) })),
    ]));
  },
  async email(message, env) {
    const brut = await lireBrut(message.raw);
    // Une erreur ici (base injoignable) remonte à Cloudflare, qui ne remet pas le message : rien n'est perdu pour autant,
    // le filtre Gmail ne fait suivre qu'une copie et l'e-mail reste dans la boîte d'Anne.
    // `message.from` : l'expéditeur d'enveloppe (SMTP), contrôlé en plus de l'en-tête From (revue de code 18.12).
    const issue = await recevoirCourriel(env, brut, message.rawSize, message.from);
    if (issue === 'refuse') message.setReject('Adresse réservée aux demandes des portails immobiliers.');
  },
} satisfies ExportedHandler<EnvEspace>;
