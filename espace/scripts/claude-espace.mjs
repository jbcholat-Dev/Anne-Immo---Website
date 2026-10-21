// Accès de Claude à l'espace d'Anne (story 13.17) : créer ou modifier une action marketing décidée dans le projet,
// lire les actions avec ce qu'elles ont rapporté, lire le bilan par canal. Jamais de contact : l'adresse /api/claude/…
// ne renvoie que des totaux.
// Réglages (environnement cloud « Anne Immo », jamais dans le dépôt) : ESPACE_CLAUDE_ID et ESPACE_CLAUDE_SECRET, les deux
// valeurs du jeton de service Cloudflare Access de Claude (RUNBOOK § 4 sexies) ; ESPACE_URL facultatif.
// Exemples :
//   node scripts/claude-espace.mjs actions
//   node scripts/claude-espace.mjs bilan mois
//   node scripts/claude-espace.mjs creer '{"nom":"Pub Facebook novembre","canal":"reseaux","debut":"2026-11-01","budget_centimes":15000}'
//   node scripts/claude-espace.mjs modifier 01J… '{"nom":"Pub Facebook novembre","canal":"reseaux","debut":"2026-11-01","cout_centimes":13240}'
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
else if (commande === 'bilan') await appel(`/api/claude/bilan?p=${encodeURIComponent(a ?? 'mois')}`);
else if (commande === 'creer') await appel('/api/claude/actions', { method: 'POST', body: JSON.stringify(JSON.parse(a)) });
else if (commande === 'modifier') await appel('/api/claude/actions', { method: 'POST', body: JSON.stringify({ ...JSON.parse(b), id: a }) });
else { console.error('Commandes : actions | bilan [semaine|mois|trimestre] | creer <json> | modifier <id> <json>'); process.exit(2); }
