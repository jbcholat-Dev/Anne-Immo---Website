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
  /** Secret Cloudflare (jamais dans le dépôt) : le même texte que le champ « Secret » du webhook Cal.com. Essai de la story 10.1. */
  CAL_WEBHOOK_SECRET?: string;
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
    if (url.pathname === '/api/essai-cal') return essaiCal(request, env);
    if (url.pathname.startsWith('/api/')) return json({ ok: false, error: { code: 'inconnu' } }, 404);
    return env.ASSETS.fetch(request);
  },
};

// Essai du webhook Cal.com (story 10.1), provisoire : remplacé par la vraie route de la story 10.6.
// Cal.com appelle cette adresse à chaque réservation. On vérifie la signature X-Cal-Signature-256
// (HMAC SHA-256 du corps brut, calculé avec CAL_WEBHOOK_SECRET) et, si elle est bonne, on consigne
// un ticket GitHub étiqueté `essai-cal` avec ce que l'essai doit constater (fuseaux, case de confidentialité,
// statut). Aucun nom, e-mail ni téléphone n'est recopié : seulement les noms des champs et la case à cocher.
// Signature absente ou fausse : 401 et un ticket de diagnostic sans contenu (noms des en-têtes, longueurs).
async function essaiCal(request: Request, env: Env): Promise<Response> {
  // Visite dans un navigateur : dit seulement si les deux secrets sont posés (jamais leur valeur).
  if (request.method !== 'POST')
    return json(
      { ok: false, error: { code: 'methode' }, secret_cal: !!env.CAL_WEBHOOK_SECRET, cle_github: !!env.GITHUB_TOKEN },
      405,
    );
  if (!env.CAL_WEBHOOK_SECRET || !env.GITHUB_TOKEN) return json({ ok: false, error: { code: 'cle_absente' } }, 503);
  console.log('essai-cal : message reçu');

  const brut = await request.text();
  const recue = (request.headers.get('x-cal-signature-256') || '').trim().toLowerCase();
  const cle = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.CAL_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const calcul = new Uint8Array(await crypto.subtle.sign('HMAC', cle, new TextEncoder().encode(brut)));
  const attendue = [...calcul].map((o) => o.toString(16).padStart(2, '0')).join('');
  let ecart = recue.length === attendue.length ? 0 : 1;
  for (let i = 0; i < attendue.length; i++) ecart |= attendue.charCodeAt(i) ^ (recue.charCodeAt(i) || 0);
  if (!recue || ecart !== 0) {
    // Pendant l'essai, chaque refus est consigné pour en trouver la cause, sans le contenu du message
    // (seulement les noms des en-têtes et des longueurs).
    console.log('essai-cal : signature refusée', { recue: recue.length, corps: brut.length });
    {
      let evenement = null;
      try {
        evenement = JSON.parse(brut).triggerEvent ?? null;
      } catch {
        /* corps illisible */
      }
      await ticketEssai(
        env,
        '[Essai Cal.com] signature refusée',
        [
          `Message reçu le ${new Date().toISOString()}, signature refusée.`,
          '',
          `- événement : ${evenement ?? 'illisible'}`,
          `- longueur de la signature reçue : ${recue.length} (attendu : 64)`,
          `- en-têtes reçus : ${[...request.headers.keys()].join(', ')}`,
          `- longueur du corps : ${brut.length}`,
          `- longueur du secret posé côté Cloudflare : ${env.CAL_WEBHOOK_SECRET.length}`,
        ].join('\n'),
      );
    }
    return json({ ok: false, error: { code: 'signature' } }, 401);
  }

  let corps: Record<string, any> = {};
  try {
    corps = JSON.parse(brut);
  } catch {
    corps = {};
  }
  const p = (corps.payload || {}) as Record<string, any>;
  const reponses = (p.responses || {}) as Record<string, any>;
  const conf = reponses.confidentialite;
  const releve = {
    evenement: corps.triggerEvent ?? null,
    cree_le: corps.createdAt ?? null,
    type: p.type ?? p.eventTypeSlug ?? null,
    debut: p.startTime ?? null,
    fin: p.endTime ?? null,
    statut: p.status ?? null,
    fuseau_anne: p.organizer?.timeZone ?? null,
    fuseaux_prospect: Array.isArray(p.attendees) ? p.attendees.map((a: any) => a?.timeZone ?? null) : null,
    lieu: typeof p.location === 'string' ? p.location.slice(0, 80) : null,
    champs_du_formulaire: Object.keys(reponses),
    case_confidentialite: conf && typeof conf === 'object' ? (conf.value ?? null) : (conf ?? null),
    cles_payload: Object.keys(p),
  };
  const body = [
    `Webhook Cal.com reçu le ${new Date().toISOString()} sur ${new URL(request.url).origin}.`,
    '',
    '**Signature X-Cal-Signature-256 : valide.**',
    '',
    '```json',
    JSON.stringify(releve, null, 2),
    '```',
    '',
    'Essai de la story 10.1, aucune donnée personnelle recopiée.',
  ].join('\n');

  const r = await ticketEssai(env, `[Essai Cal.com] ${releve.evenement ?? 'webhook'}`, body);
  console.log('essai-cal : signature valide, ticket', r);
  if (!r.ok) return json({ ok: false, error: { code: r.code, statut: r.statut } }, 502);
  return json({ ok: true });
}

async function ticketEssai(env: Env, titre: string, body: string): Promise<{ ok: boolean; code?: string; statut?: number }> {
  const depot = env.GITHUB_REPO || REPO_DEFAUT;
  const creer = (labels?: string[]) =>
    fetch(`https://api.github.com/repos/${depot}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'anne-vial-tissot-site/essai-cal',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify(labels ? { title: titre, body, labels } : { title: titre, body }),
    });
  try {
    let r = await creer(['essai-cal']);
    if (r.status === 422) r = await creer(); // étiquette refusée : ticket sans elle
    return r.ok ? { ok: true } : { ok: false, code: 'github', statut: r.status };
  } catch {
    return { ok: false, code: 'reseau' };
  }
}

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
