// Remarque faite avec le bouton « Un retour ? », enregistrée comme ticket GitHub étiqueté « retour-apercu » (story 9.6).
// Partagé par le site (aperçu, /api/retour de worker.ts) et l'espace d'Anne (story 13.20, src/pages/api/retour.ts) :
// chacun vérifie d'abord qui écrit (jeton Cloudflare Access), puis confie le reste ici. JB et Claude traitent ces
// tickets comme des stories. Le dépôt est public : la page est envoyée sans ses paramètres (un numéro de téléphone peut
// y figurer, par exemple /inconnu?tel=…), et le formulaire de l'espace demande de ne pas citer de client.

const REPO_DEFAUT = 'jbcholat-Dev/Anne-Immo---Website';
const ETIQUETTE = 'retour-apercu';
const MAX_TEXTE = 2000;

export interface EnvRetours {
  /** Clé GitHub limitée à ce dépôt, droit « Issues » seulement (RUNBOOK § 4 bis). */
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  /** Adresse de l'API GitHub, seulement pour l'essai de bout en bout (imitation locale). Absente : l'adresse réelle. */
  GITHUB_API?: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

/** Lit la remarque envoyée par le bouton et crée le ticket. `auteur` : l'adresse lue dans le jeton Access vérifié. */
export async function creerTicketRetour(request: Request, env: EnvRetours, auteur: string, source: 'aperçu' | 'espace'): Promise<Response> {
  if (!env.GITHUB_TOKEN) return json({ ok: false, error: { code: 'cle_absente' } }, 503);

  let corps: Record<string, unknown>;
  try {
    corps = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ ok: false, error: { code: 'corps' } }, 400);
  }
  const texte = typeof corps.texte === 'string' ? corps.texte.trim() : '';
  if (!texte || texte.length > MAX_TEXTE) return json({ ok: false, error: { code: 'texte' } }, 400);
  const page = typeof corps.page === 'string' && corps.page.startsWith('/') ? corps.page.split(/[?#]/)[0].slice(0, 300) : '/';
  const ecran = typeof corps.ecran === 'string' ? corps.ecran.slice(0, 60) : '';

  const navigateur = (request.headers.get('user-agent') || '').slice(0, 200);
  const origine = new URL(request.url).origin;
  const titre = `[Retour ${source}] ${page} : ${texte.split('\n')[0].slice(0, 70)}`;
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
    fetch(`${env.GITHUB_API || 'https://api.github.com'}/repos/${depot}/issues`, {
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
