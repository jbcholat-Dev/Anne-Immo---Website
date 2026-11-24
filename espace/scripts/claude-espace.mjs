// Accès de Claude à l'espace d'Anne (story 13.17) : créer ou modifier une action marketing décidée dans le projet,
// lire les actions avec ce qu'elles ont rapporté, lire le bilan par canal. Jamais de contact : l'adresse /api/claude/…
// ne renvoie que des totaux.
// Réglages (environnement cloud « Anne Immo », jamais dans le dépôt) : ESPACE_CLAUDE_ID et ESPACE_CLAUDE_SECRET, les deux
// valeurs du jeton de service Cloudflare Access de Claude (RUNBOOK § 4 sexies) ; ESPACE_URL facultatif.
// Exemples :
//   node scripts/claude-espace.mjs actions
//   node scripts/claude-espace.mjs bilan mois   (avec l'entonnoir du diagnostic par campagne, story 10.12)
//   node scripts/claude-espace.mjs bilan semaine 2026-11-23   (story 20.7 : `prospection`, canaux de « Ma semaine » de cette semaine et de la précédente)
//   node scripts/claude-espace.mjs semaine 2026-11-23   (story 20.8 : objectifs et lignes notées de « Ma semaine », sans lieu ni précision)
//   node scripts/claude-espace.mjs objectifs '{"rdv":3,"effort:cartes":12}'   (le chief of staff règle des objectifs ; la valeur d'avant reste visible)
//   node scripts/claude-espace.mjs noter '{"quoi":"effort","canal":"cartes","jour":"2026-11-24","quantite":4}'   (aussi lead, rdv ; boîtage : "ville")
//   node scripts/claude-espace.mjs retirer effort|resultat 01J…   (seulement une ligne notée par le chief of staff)
//   node scripts/claude-espace.mjs creer '{"nom":"Pub Facebook novembre","canal":"reseaux","debut":"2026-11-01","budget_centimes":15000}'
//   node scripts/claude-espace.mjs modifier 01J… '{"nom":"Pub Facebook novembre","canal":"reseaux","debut":"2026-11-01","cout_centimes":13240}'
//   node scripts/claude-espace.mjs brief [AAAA-MM-JJ]   (story 18.27 : relire le brief de la semaine, la semaine en cours sinon)
//   node scripts/claude-espace.mjs deposer-brief '{"semaine":"2026-11-23","bloque":"…","decision":"…"}'
//     Le brief de la semaine du chief of staff, affiché à Anne et à JB en 2 lignes sur « Ma semaine » ; remplace celui de la même
//     semaine. Texte de pilotage seulement : jamais de nom de contact, ni e-mail ni téléphone (refusés), 400 caractères au plus.
const BASE = (process.env.ESPACE_URL ?? 'https://espace.annevialtissot.fr').replace(/\/+$/, '');
const id = process.env.ESPACE_CLAUDE_ID, secret = process.env.ESPACE_CLAUDE_SECRET;
if (!id || !secret) {
  console.error('ESPACE_CLAUDE_ID et ESPACE_CLAUDE_SECRET manquent dans les réglages de l\'environnement (RUNBOOK § 4 sexies).');
  process.exit(2);
}
const entetes = { 'CF-Access-Client-Id': id, 'CF-Access-Client-Secret': secret, 'Content-Type': 'application/json' };
const [commande, a, b] = process.argv.slice(2);
const appel = async (chemin, options = {}) => {
  const r = await fetch(`${BASE}${chemin}`, { ...options, headers: entetes, redirect: 'manual' });
  const texte = await r.text();
  if (!r.ok) { console.error(`HTTP ${r.status} : ${texte.slice(0, 300)}`); process.exit(1); }
  console.log(JSON.stringify(JSON.parse(texte), null, 2));
};
if (commande === 'actions') await appel('/api/claude/actions');
else if (commande === 'bilan') await appel(`/api/claude/bilan?p=${encodeURIComponent(a ?? 'mois')}${b ? `&s=${encodeURIComponent(b)}` : ''}`);
else if (commande === 'semaine') await appel(`/api/claude/prospection${a ? `?s=${encodeURIComponent(a)}` : ''}`);
else if (commande === 'objectifs') await appel('/api/claude/prospection', { method: 'POST', body: JSON.stringify({ quoi: 'objectifs', objectifs: JSON.parse(a) }) });
else if (commande === 'noter') await appel('/api/claude/prospection', { method: 'POST', body: JSON.stringify(JSON.parse(a)) });
else if (commande === 'retirer') await appel('/api/claude/prospection', { method: 'POST', body: JSON.stringify({ quoi: 'retirer', genre: a, id: b }) });
else if (commande === 'creer') await appel('/api/claude/actions', { method: 'POST', body: JSON.stringify(JSON.parse(a)) });
else if (commande === 'modifier') await appel('/api/claude/actions', { method: 'POST', body: JSON.stringify({ ...JSON.parse(b), id: a }) });
else if (commande === 'brief') await appel(`/api/claude/brief${a ? `?s=${encodeURIComponent(a)}` : ''}`);
else if (commande === 'deposer-brief' && !a) { console.error('deposer-brief attend un texte JSON : {"bloque":"…","decision":"…"}'); process.exit(2); }
else if (commande === 'deposer-brief') await appel('/api/claude/brief', { method: 'POST', body: JSON.stringify(JSON.parse(a)) });
else {
  console.error('Commandes : actions | bilan [semaine|mois|trimestre] [AAAA-MM-JJ] | semaine [AAAA-MM-JJ] | objectifs <json> | noter <json> | retirer effort|resultat <id> | creer <json> | modifier <id> <json> | brief [AAAA-MM-JJ] | deposer-brief <json>');
  console.error('deposer-brief : {"semaine":"AAAA-MM-JJ" (facultatif), "bloque":"…", "decision":"…"}. Texte de pilotage seulement, sans nom de contact.');
  process.exit(2);
}
