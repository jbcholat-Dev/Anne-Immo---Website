// Fusion automatique des demandes de fusion (PR) sans impact sur le code du site — story 9.7, décision de JB du 2026-10-10.
// Deux familles fusionnent seules dans main, une fois la construction Cloudflare au vert sur le dernier commit :
//   - « contenu » : un enregistrement de l'espace d'édition (branche cms/…) qui ne touche que contenu-anne/ ;
//   - « suivi » : une PR qui ne touche que des documents (stories, statut de sprint, notes, RUNBOOK, fichiers .md hors du site).
// Tout le reste (code, mise en page, back-end, réglages, ce fichier) attend la fusion de JB.
// Jamais fusionnées seules : PR en brouillon (dans l'espace d'édition : statut « Brouillon »), PR étiquetée « a-valider »,
// PR venant d'une copie du dépôt, PR qui ne vise pas main.
// Lancé par .github/workflows/fusion-auto.yml ; la règle de tri (classer) se teste seule : node .github/scripts/fusion-auto.mjs --essai

export const VERIFICATION = 'Workers Builds: anne-vial-tissot-site';
export const ETIQUETTE_MANUELLE = 'a-valider';

// Dossiers et fichiers qui ne changent rien au site construit.
const DOSSIERS_SUIVI = ['_bmad-output/', '_bmad/', '.claude/', 'maquettes/'];
// Dossiers lus par la construction du site : un .md qui s'y trouve est du contenu, pas un document.
const DOSSIERS_SITE = ['contenu-anne/', 'site/src/', 'site/public/', 'site/prive/', 'design-system/', '.github/'];

const estSuivi = (f) =>
  DOSSIERS_SUIVI.some((d) => f.startsWith(d)) ||
  (f.toLowerCase().endsWith('.md') && !DOSSIERS_SITE.some((d) => f.startsWith(d)));

// fichiers : chemins modifiés (un fichier renommé compte pour son ancien et son nouveau chemin).
// Renvoie { famille: 'contenu' | 'suivi' | null, raison }.
export function classer({ branche, fichiers }) {
  if (fichiers.length === 0) return { famille: null, raison: 'aucun fichier modifié' };
  if (branche.startsWith('cms/')) {
    const hors = fichiers.filter((f) => !f.startsWith('contenu-anne/'));
    return hors.length === 0
      ? { famille: 'contenu', raison: 'enregistrement de l’espace d’édition, contenu-anne/ seulement' }
      : { famille: null, raison: `branche cms/ qui touche aussi ${hors[0]}` };
  }
  const hors = fichiers.filter((f) => !estSuivi(f));
  return hors.length === 0
    ? { famille: 'suivi', raison: 'documents de suivi seulement' }
    : { famille: null, raison: `touche ${hors[0]}${hors.length > 1 ? ` (et ${hors.length - 1} autre(s))` : ''}` };
}

// --- Appels GitHub (jeton GITHUB_TOKEN du workflow) ---

const API = 'https://api.github.com';
const DEPOT = process.env.GITHUB_REPOSITORY;

async function gh(chemin, options = {}) {
  const r = await fetch(`${API}${chemin}`, {
    ...options,
    headers: {
      authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      ...(options.body ? { 'content-type': 'application/json' } : {}),
    },
  });
  const texte = await r.text();
  const corps = texte ? JSON.parse(texte) : null;
  if (!r.ok) throw Object.assign(new Error(`${options.method ?? 'GET'} ${chemin} : ${r.status} ${corps?.message ?? ''}`), { statut: r.status });
  return corps;
}

async function toutesLesPages(chemin) {
  const liste = [];
  for (let page = 1; ; page++) {
    const lot = await gh(`${chemin}${chemin.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    const elements = Array.isArray(lot) ? lot : lot.check_runs;
    liste.push(...elements);
    if (elements.length < 100) return liste;
  }
}

async function traiter(numero) {
  const pr = await gh(`/repos/${DEPOT}/pulls/${numero}`);
  const dire = (msg) => console.log(`PR #${numero} (${pr.head.ref}) : ${msg}`);

  if (pr.state !== 'open') return dire('fermée, rien à faire');
  if (pr.base.ref !== 'main') return dire(`vise ${pr.base.ref}, pas main : laissée à JB`);
  if (pr.head.repo?.full_name !== DEPOT) return dire('vient d’une copie du dépôt : laissée à JB');
  if (pr.draft) return dire('en brouillon : on attend qu’elle soit prête');
  if (pr.labels.some((l) => l.name === ETIQUETTE_MANUELLE)) return dire(`étiquette « ${ETIQUETTE_MANUELLE} » : laissée à JB`);

  const fichiers = (await toutesLesPages(`/repos/${DEPOT}/pulls/${numero}/files`))
    .flatMap((f) => (f.previous_filename ? [f.filename, f.previous_filename] : [f.filename]));
  const { famille, raison } = classer({ branche: pr.head.ref, fichiers });
  if (!famille) return dire(`impact sur le site (${raison}) : laissée à JB`);

  const sha = pr.head.sha;
  const verifs = (await toutesLesPages(`/repos/${DEPOT}/commits/${sha}/check-runs?check_name=${encodeURIComponent(VERIFICATION)}`));
  const derniere = verifs.sort((a, b) => (b.started_at ?? '').localeCompare(a.started_at ?? ''))[0];
  if (!derniere) return dire(`${famille} : la construction Cloudflare n’a pas encore commencé, on attend`);
  if (derniere.status !== 'completed') return dire(`${famille} : construction Cloudflare en cours, on attend`);
  if (derniere.conclusion !== 'success') return dire(`${famille} : construction Cloudflare en échec (${derniere.conclusion}) : laissée à JB`);

  try {
    // sha : on ne fusionne que le commit vérifié ; si un commit est arrivé entre-temps, GitHub refuse et on recommencera à sa vérification.
    await gh(`/repos/${DEPOT}/pulls/${numero}/merge`, {
      method: 'PUT',
      body: JSON.stringify({ sha, merge_method: 'merge' }),
    });
    dire(`${famille} (${raison}) : fusionnée automatiquement`);
  } catch (e) {
    // 405 : pas fusionnable (conflit, règle de protection) ; 409 : le commit a changé. Dans les deux cas, la PR reste ouverte.
    dire(`${famille} : fusion refusée par GitHub (${e.message}) : laissée ouverte`);
    if (e.statut !== 405 && e.statut !== 409) throw e;
  }
}

async function principal() {
  const evenement = JSON.parse(await (await import('node:fs/promises')).readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
  let numeros = [];
  if (evenement.pull_request) numeros = [evenement.pull_request.number];
  else if (evenement.check_run) {
    if (evenement.check_run.name !== VERIFICATION) return console.log(`vérification « ${evenement.check_run.name} » : ignorée`);
    const prs = await gh(`/repos/${DEPOT}/commits/${evenement.check_run.head_sha}/pulls`);
    numeros = prs.filter((p) => p.state === 'open').map((p) => p.number);
  } else {
    // Lancement à la main (onglet Actions) : on repasse toutes les PR ouvertes.
    numeros = (await toutesLesPages(`/repos/${DEPOT}/pulls?state=open`)).map((p) => p.number);
  }
  if (numeros.length === 0) return console.log('aucune PR ouverte concernée');
  for (const n of numeros) await traiter(n);
}

// --- Essai de la règle de tri, sans GitHub ---

function essai() {
  const cas = [
    ['cms/stories/sciez-2026', ['contenu-anne/stories/sciez-2026/index.md', 'contenu-anne/stories/sciez-2026/photos/a.webp'], 'contenu'],
    ['cms/textes/accueil', ['contenu-anne/textes/accueil.yml'], 'contenu'],
    ['cms/stories/x', ['contenu-anne/stories/x/index.md', 'site/src/pages/index.astro'], null],
    ['claude/suivi', ['_bmad-output/implementation-artifacts/sprint-status.yaml', 'RUNBOOK.md', 'site/README.md'], 'suivi'],
    ['claude/suivi', ['CLAUDE.md', 'maquettes/lot-3-complet/DECISIONS.md'], 'suivi'],
    ['claude/code', ['_bmad-output/x.md', 'site/src/pages/index.astro'], null],
    ['claude/contenu', ['contenu-anne/textes/accueil.yml'], null],
    ['claude/contenu-md', ['contenu-anne/stories/x/index.md'], null],
    ['claude/reglage', ['site/wrangler.jsonc'], null],
    ['claude/fusion', ['.github/workflows/fusion-auto.yml'], null],
    ['claude/fusion-md', ['.github/pull_request_template.md'], null],
    ['claude/legal', ['site/src/content/legal.md'], null],
    ['claude/vide', [], null],
  ];
  let echecs = 0;
  for (const [branche, fichiers, attendu] of cas) {
    const { famille, raison } = classer({ branche, fichiers });
    const ok = famille === attendu;
    if (!ok) echecs++;
    console.log(`${ok ? 'ok  ' : 'ÉCHEC'} ${branche} → ${famille ?? 'à JB'} (${raison})`);
  }
  console.log(echecs ? `${echecs} échec(s)` : `${cas.length} cas, tous corrects`);
  process.exit(echecs ? 1 : 0);
}

if (process.argv.includes('--essai')) essai();
else if (process.argv[1]?.endsWith('fusion-auto.mjs')) principal().catch((e) => { console.error(e); process.exit(1); });
