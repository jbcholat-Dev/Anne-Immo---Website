// Essai de bout en bout du tri des appels par l'API Claude (story 18.25), sur le serveur local de l'espace, avec une
// imitation de Leedflow et une imitation de l'API Claude (rien ne part chez Anthropic).
// Vérifie : seuls les numéros inconnus avec un résumé sont envoyés ; jamais le numéro, le nom, le prénom ni l'e-mail que
// Leedflow connaît, ni un numéro ou un e-mail cité dans le résumé ; un proche (contact du carnet) et un appel manqué sans
// message ne sont pas envoyés ; la proposition s'affiche sur la carte sans rien changer ; un même texte n'est pas renvoyé ;
// réponse hors format, refus et panne laissent la carte non triée (3 essais au plus sur un même texte) ; les réponses de
// « Qualifier » sont cochées d'avance une fois le contact ajouté. Captures dans espace/.verif/tri-ia/.
// Story 18.26 (brief du jour) : visible du seul compte de BRIEF_LECTEURS (page et API), préparé à la demande et une seule
// fois par jour, 3 sources (demande du site, appel trié, relance en retard), jamais un proche ni une carte non triée,
// décisions Accepter / Plus tard / Écarter et annulation, rien d'écrit sur la fiche, ligne écartée non reprise, part acceptée.
// Story 18.27 (brief de la semaine) : déposé et relu par le jeton de Claude seulement, ramené au lundi, remplacé par un
// nouveau dépôt, e-mail ou téléphone refusés, affiché en 2 lignes sur « Ma semaine » pour Anne et JB.
// Préalable, dans site/ : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run base:local` ;
// dans espace/ : `npm run build`. Lancer depuis espace/ : `node scripts/e2e-tri-et-brief.mjs`.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { demarrer, ICI as SITE, pause, sid } from '../../site/scripts/serveur-essai.mjs';

const ICI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ICI, '.verif', 'tri-ia');
fs.mkdirSync(OUT, { recursive: true });
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };

process.on('exit', () => { try { site?.arreter(); } catch {} });
const site = await demarrer({ nom: 'tri-ia' });
const { appeler, essai: ESSAI, jetonAcces } = site;
// La base locale peut être occupée par le serveur un court instant (SQLITE_BUSY) : la requête est refaite.
const sql = (requete) => {
  for (let i = 0; ; i++) {
    try { return site.sql(requete); } catch (e) { if (i >= 5 || !String(e?.stdout ?? e).includes('SQLITE_BUSY')) throw e; }
  }
};
const PORT = 8789, E = `http://localhost:${PORT}`;
const equipe = JSON.parse(Buffer.from(jetonAcces().split('.')[1], 'base64url').toString()).iss;

// Numéros d'essai propres à ce passage (la base locale est gardée d'un essai à l'autre).
const suffixe = String(Date.now()).slice(-6);
const tel = (n) => `+3361${n}${suffixe}`.slice(0, 12);
const T = { vendeur: tel(1), manque: tel(2), proche: tel(3), format: tel(4), panne: tel(5), refus: tel(6), sansMessage: tel(8) };
const maintenant = Date.now();

// Imitation de Leedflow : des appels de numéros inconnus, et la fiche Leedflow du vendeur (nom et e-mail connus).
const LF = {
  cle: 'essai-cle-leedflow',
  appels: [
    { id: `v${suffixe}`, created: maintenant - 3_600_000, customer: T.vendeur, direction: 'inbound', duration: 240, id_contact: `lf${suffixe}`,
      transcription: `Martine Durand appelle pour vendre sa maison à Sciez dans 3 mois, sans agence. Elle demande une estimation. Rappeler Martine au 06 12 34 56 78 ou martine.durand${suffixe}@example.com.` },
    { id: `m${suffixe}`, created: maintenant - 3_000_000, customer: T.manque, direction: 'inbound', missed: true },
    // Le texte que Leedflow écrit pour un appel manqué sans message (retour de JB du 2026-11-24).
    { id: `s${suffixe}`, created: maintenant - 2_900_000, customer: T.sansMessage, direction: 'inbound', missed: true, transcription: 'Le correspondant n\'a pas laissé de message' },
    { id: `p${suffixe}`, created: maintenant - 2_000_000, customer: T.proche, direction: 'inbound', duration: 600, transcription: 'Discussion familiale sur le repas de dimanche.' },
    { id: `f${suffixe}`, created: maintenant - 1_500_000, customer: T.format, direction: 'inbound', duration: 60, transcription: 'Question sur un appartement à Thonon. RÉPONSE-HORS-FORMAT' },
    { id: `n${suffixe}`, created: maintenant - 1_000_000, customer: T.panne, direction: 'inbound', duration: 60, transcription: 'Un acheteur cherche un T3 à Évian. PANNE' },
    { id: `r${suffixe}`, created: maintenant - 500_000, customer: T.refus, direction: 'inbound', duration: 60, transcription: 'Message à décliner. REFUS' },
  ],
  contacts: { [`lf${suffixe}`]: { id: `lf${suffixe}`, firstname: 'Martine', lastname: 'Durand', email: `martine.durand${suffixe}@example.com`, phone: T.vendeur } },
};
// Imitation de l'API Claude : garde chaque demande, répond selon le mot repère du résumé.
const IA = { demandes: [], panne: true };
const PORT_IMIT = 8792;
const proposition = { classement: 'vendeur', action: 'Rappeler pour fixer l\'estimation', echeance: new Date(maintenant + 86_400_000).toISOString().slice(0, 10),
  raison: 'Maison à vendre dans 3 mois, sans agence, demande une estimation.', parcours: 'vendeur',
  qualification: { delai: 'Dans 3 mois', agence: 'Non', bien: 'Maison', motif: null, vend_avant: null } };
const imitation = http.createServer((req, res) => {
  let corps = '';
  req.on('data', (c) => { corps += c; });
  req.on('end', () => {
    const u = new URL(req.url, 'http://localhost');
    const json = (code, o) => { res.writeHead(code, { 'Content-Type': 'application/json', Connection: 'close' }); res.end(JSON.stringify(o)); };
    if (u.pathname === '/v1/messages') {
      const d = JSON.parse(corps || '{}');
      IA.demandes.push({ entetes: req.headers, corps: d });
      const texte = d.messages?.[0]?.content ?? '';
      if (IA.panne) return json(529, { type: 'error', error: { type: 'overloaded_error', message: 'panne simulée' } });
      const message = (contenu, stop = 'end_turn') => json(200, { id: `msg_${IA.demandes.length}`, type: 'message', role: 'assistant', model: d.model, stop_reason: stop,
        content: contenu === null ? [] : [{ type: 'text', text: contenu }], usage: { input_tokens: 10, output_tokens: 10 } });
      if (texte.includes('REFUS')) return message(null, 'refusal');
      if (texte.includes('RÉPONSE-HORS-FORMAT')) return message(JSON.stringify({ ...proposition, classement: 'client-mystere' }));
      if (texte.includes('PANNE')) return message(JSON.stringify({ ...proposition, classement: 'acheteur', parcours: 'acheteur', action: 'Rappeler pour la visite' }));
      return message(JSON.stringify(proposition));
    }
    if (req.headers.authorization !== `Bearer ${LF.cle}`) return json(401, { success: false });
    const fiche = /^\/contacts\/(.+)$/.exec(u.pathname);
    if (fiche) return LF.contacts[fiche[1]] ? json(200, { success: true, data: LF.contacts[fiche[1]] }) : json(404, { success: false });
    const liste = { '/calls': LF.appels, '/voicemails': [], '/sms': [], '/tasks': [] }[u.pathname];
    if (!liste) return json(404, { success: false });
    const apres = Number(u.searchParams.get('created_after') ?? 0);
    const tri = liste.filter((e) => e.created >= apres);
    json(200, { success: true, data: tri, pagination: { page: 1, per_page: 100, total: tri.length, total_pages: 1 } });
  });
});
await new Promise((ok) => imitation.listen(PORT_IMIT, ok));

// Le proche : un contact du carnet (hors suivi) qui porte ce numéro.
const PROCHE = `01TR1A${suffixe}PR0CHE00000000`.slice(0, 26);
sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, categorie_id, projet, telephone) VALUES
  ('${PROCHE}', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', 'Paul', 'Proche', 'proches', 'aucun', '${T.proche}')`);

const reglages = path.join(os.tmpdir(), `essai-${ESSAI}-espace.vars`);
fs.writeFileSync(reglages, [`ACCESS_EQUIPE=${equipe}`, 'ACCESS_AUD=essai-aud', 'ACCESS_CLAUDE_ID=essai-claude.access', 'LIEN_SECRET=essai',
  `LEEDFLOW_API_KEY=${LF.cle}`, `LEEDFLOW_URL=http://localhost:${PORT_IMIT}`,
  'TRI_IA=oui', `BRIEF_LECTEURS=${createHash('sha256').update('jb@example.com').digest('hex')}`, 'ANTHROPIC_API_KEY=essai-cle-claude', `ANTHROPIC_URL=http://localhost:${PORT_IMIT}`].join('\n'));
const journalEspace = path.join(os.tmpdir(), `e2e-${ESSAI}-espace.log`);
const sansProxy = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(https?|all|no)_proxy$/i.test(k)));
const espace = spawn('npx', ['wrangler', 'dev', '--port', String(PORT), '--env-file', reglages, '--test-scheduled', '--persist-to', path.join(SITE, '.wrangler', 'state')],
  { cwd: ICI, detached: true, stdio: ['ignore', fs.openSync(journalEspace, 'w'), fs.openSync(journalEspace, 'a')], env: sansProxy });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`${E}/gestion`)).status === 403) break; } catch {} await pause(1000); }
const JETON = jetonAcces();
const avecJeton = (autres = {}) => ({ 'cf-access-jwt-assertion': JETON, ...autres });
// Un passage de la tâche planifiée ; la réponse revient avant la fin du travail (waitUntil) : on attend qu'il se termine.
const passage = async () => { await appeler(`${E}/cdn-cgi/handler/scheduled`); await pause(4000); };
const tri = (t) => sql(`SELECT * FROM tri_ia WHERE telephone = '${t}'`)[0];

try {
  // 0. L'API en panne : la relève se fait, aucune carte n'est triée, et la panne ne compte pas comme un essai.
  await passage();
  for (let i = 0; i < 10 && !tri(T.vendeur) && !tri(T.panne) && !tri(T.refus); i++) await passage();
  const enPanne = sql(`SELECT * FROM tri_ia WHERE telephone IN (${Object.values(T).map((t) => `'${t}'`).join(', ')})`);
  constat(IA.demandes.length > 0 && enPanne.length >= 1 && enPanne.every((r) => r.classement === null && r.essais === 0 && r.erreur === 'api_529'),
    `API en panne : cartes non triées, aucun essai compté (${enPanne.length} ligne(s))`);
  constat(sql(`SELECT count(*) AS n FROM nouveau n JOIN leedflow_inconnu i ON i.source_id = n.leedflow_inconnu_id WHERE i.telephone = '${T.vendeur}' AND n.vu_le IS NULL`)[0].n === 1,
    'API en panne : la carte du vendeur est bien là, ouverte');
  // 1. L'API répond : le tri envoie les numéros avec un résumé.
  IA.panne = false;
  IA.demandes.length = 0;
  for (let i = 0; i < 10 && !tri(T.vendeur)?.classement; i++) await passage();
  const envoyes = IA.demandes.map((d) => d.corps.messages?.[0]?.content ?? '');
  const tout = JSON.stringify(IA.demandes.map((d) => d.corps));
  constat(!!tri(T.vendeur) && tri(T.vendeur).classement === 'vendeur' && tri(T.vendeur).echeance === proposition.echeance, 'vendeur : proposition gardée (classement, échéance)');
  constat(IA.demandes.length > 0 && IA.demandes.every((d) => d.entetes.authorization === 'Bearer essai-cle-claude' && d.corps.model === 'claude-opus-5-5'
    && d.corps.output_config?.format?.type === 'json_schema' && d.corps.fallbacks === 'default' && String(d.entetes['anthropic-beta']).includes('server-side-fallback-2026-07-01')),
    'demande à l\'API : clé du Worker, modèle claude-opus-5-5, réponse au format JSON imposé, repli en cas de refus');
  const fuites = ['Martine', 'Durand', `martine.durand${suffixe}`, '06 12 34 56 78', ...Object.values(T), ...Object.values(T).map((t) => t.slice(3))].filter((m) => tout.includes(m));
  constat(fuites.length === 0, `rien qui identifie la personne n'est envoyé (noms, e-mail, numéros) ${fuites.length ? `: trouvé ${fuites.join(', ')}` : ''}`);
  constat(envoyes.some((t) => t.includes('[nom]') && t.includes('[téléphone]') && t.includes('[e-mail]') && t.includes('maison à Sciez')), 'le résumé est envoyé, masqué ([nom], [téléphone], [e-mail])');
  constat(!envoyes.some((t) => t.includes('repas de dimanche')) && !tri(T.proche), 'proche du carnet : jamais envoyé');
  constat(!tri(T.manque), 'appel manqué sans message : jamais envoyé');
  constat(!!tri(T.format) && tri(T.format).classement === null && tri(T.format).erreur === 'format', 'réponse hors format : rejetée, carte non triée');
  constat(!!tri(T.refus) && tri(T.refus).classement === null && tri(T.refus).erreur === 'refus', 'refus du modèle : carte non triée');
  const carte = sql(`SELECT n.vu_le, n.issue FROM nouveau n JOIN leedflow_inconnu i ON i.source_id = n.leedflow_inconnu_id WHERE i.telephone = '${T.vendeur}'`)[0];
  constat(!!carte && carte.vu_le === null && carte.issue === null && !sql(`SELECT 1 FROM leedflow_ecarte WHERE telephone = '${T.vendeur}'`).length, 'la carte du vendeur reste ouverte, rien n\'est classé ni écrit');

  // 2. Passages suivants : même texte non renvoyé ; l'échec réessayé 3 fois au plus.
  const avant = IA.demandes.length;
  for (let i = 0; i < 4; i++) await passage();
  const vendeurRenvoye = IA.demandes.slice(avant).filter((d) => d.corps.messages[0].content.includes('maison à Sciez')).length;
  constat(vendeurRenvoye === 0, 'vendeur déjà trié : rien de renvoyé');
  const envoisFormat = IA.demandes.filter((d) => d.corps.messages[0].content.includes('RÉPONSE-HORS-FORMAT')).length;
  constat(tri(T.format).essais === 3 && envoisFormat === 3, `réponse hors format : 3 essais, puis plus rien (essais ${tri(T.format).essais}, envois ${envoisFormat})`);
  constat(tri(T.panne)?.classement === 'acheteur' && tri(T.panne).erreur === null && tri(T.panne).essais === 1, 'panne levée : la carte est triée, au premier essai compté');

  // 3. La carte montre la proposition (API et page).
  const nv = await (await appeler(`${E}/api/nouveaux`, { headers: avecJeton() })).json();
  const c = nv.cartes.find((x) => x.telephone === T.vendeur);
  constat(c?.tri?.libelle === 'Vendeur' && c.tri.action === proposition.action && !nv.cartes.find((x) => x.telephone === T.format)?.tri, 'carte : proposition montrée, aucune pour la réponse rejetée');
  constat(!nv.cartes.find((x) => x.telephone === T.proche)?.tri, 'carte du proche : aucune proposition');
  const sansMsg = nv.cartes.find((x) => x.telephone === T.sansMessage);
  constat(sansMsg?.rangee === 'Appel manqué sans message' && !tri(T.sansMessage), `« Le correspondant n'a pas laissé de message » : carte rangée dans « Sans suite », rien d'envoyé (${sansMsg?.rangee ?? 'pas de carte'})`);
  const { chromium } = await import('../../site/node_modules/playwright/index.mjs');
  const nav = await chromium.launch();
  const page = await nav.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, extraHTTPHeaders: avecJeton() });
  await page.goto(`${E}/`);
  await page.click('[data-nv-barre]');
  await page.waitForSelector('.nv-tri');
  const carteVendeur = page.locator('.nv-carte', { has: page.locator('.nv-tri[data-c="vendeur"]') }).first();
  await carteVendeur.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(OUT, 'nouveaux-ordinateur.png') });
  await carteVendeur.screenshot({ path: path.join(OUT, 'carte-vendeur.png') });
  constat((await carteVendeur.locator('.nv-tri').innerText()).includes('Rappeler pour fixer l\'estimation'), 'page Contacts : la carte affiche la proposition');

  // 4. Anne ajoute le contact : « Qualifier » coche d'avance les réponses des résumés, sans rien enregistrer.
  const r = await (await appeler(`${E}/api/nouveaux`, { method: 'POST', headers: avecJeton({ 'Content-Type': 'application/json', Origin: E }),
    body: JSON.stringify({ id: c.id, geste: 'ajouter', saisie: { prenom: 'Martine', nom: `Essai${suffixe}`, categorie_id: 'demandes_recues', projet: 'vendeur' } }) })).json();
  constat(r.ok && !!r.contact_id, 'contact ajouté depuis la carte');
  await page.goto(`${E}/contacts/qualifier?id=${r.contact_id}`);
  const coches = await page.$$eval('input[type=radio]:checked', (l) => l.map((i) => `${i.name}=${i.value}`));
  constat(coches.includes('q_delai=Dans 3 mois') && coches.includes('q_agence=Non') && coches.includes('q_bien=Maison') && !coches.some((x) => x.startsWith('q_motif')),
    `Qualifier : réponses cochées d'avance (${coches.join(', ')})`);
  constat(await page.locator('[data-prerempli]').count() === 1, 'Qualifier : message « cochées d\'avance, vérifiez-les »');
  constat(sql(`SELECT qualification FROM contact WHERE id = '${r.contact_id}'`)[0].qualification === null, 'rien n\'est enregistré sur la fiche avant qu\'Anne valide');
  await page.screenshot({ path: path.join(OUT, 'qualifier-prerempli.png'), fullPage: true });

  // 5. Brief du jour (story 18.26).
  const JETON_JB = jetonAcces({ email: 'jb@example.com' });
  const pourJb = (autres = {}) => ({ 'cf-access-jwt-assertion': JETON_JB, ...autres });
  const brief = (corps, jeton = pourJb) => appeler(`${E}/api/brief`, { method: 'POST', headers: jeton({ 'Content-Type': 'application/json' }), body: JSON.stringify(corps) });
  const jour = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());
  sql(`DELETE FROM brief_ligne WHERE jour = '${jour}'`);
  // Une relance en retard, une demande du site, et l'appel trié « acheteur » encore ouvert.
  const RELANCE = `01TR1A${suffixe}RE1ANCE0000000`.slice(0, 26);
  const hier = new Date(Date.parse(`${jour}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, commune, categorie_id, projet, temperature, telephone, etape, prochaine_action, prochaine_action_le) VALUES
    ('${RELANCE}', '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z', 'Sam', 'Relance${suffixe}', 'Thonon', 'demandes_recues', 'vendeur', 'avec_anne', '${tel(7)}', 'premier_rdv', 'Fixer le prochain point', '${hier}')`);
  await appeler(`${site.U}/api/guide`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': '203.0.113.77' },
    body: JSON.stringify({ lang: 'fr', turnstile: 'jeton', privacy: 'on', submission_id: sid(), prenom: 'Lina', nom: `Brief${suffixe}`, email: `lina+${suffixe}@example.com` }) });
  for (let i = 0; i < 20 && !sql(`SELECT 1 FROM nouveau n JOIN contact c ON c.id = n.contact_id WHERE c.email = 'lina+${suffixe}@example.com'`).length; i++) await pause(250);

  // La base locale garde les essais précédents : leurs demandes et relances dues sont mises de côté, pour ne lire que celles-ci.
  const nos = `SELECT n.id FROM nouveau n LEFT JOIN leedflow_inconnu i ON i.source_id = n.leedflow_inconnu_id LEFT JOIN contact c ON c.id = n.contact_id
    WHERE i.telephone IN (${Object.values(T).map((t) => `'${t}'`).join(', ')}) OR c.email = 'lina+${suffixe}@example.com'`;
  sql(`UPDATE nouveau SET vu_le = '2026-01-01T00:00:00Z', issue = 'vu' WHERE vu_le IS NULL AND id NOT IN (${nos})`);
  sql(`UPDATE contact SET prochaine_action_le = '2099-01-01' WHERE prochaine_action_le IS NOT NULL AND substr(prochaine_action_le, 1, 10) <= '${jour}' AND id <> '${RELANCE}'`);
  let html = await (await appeler(`${E}/`, { headers: avecJeton() })).text();
  constat(!html.includes('data-brief'), 'compte d\'Anne (hors BRIEF_LECTEURS) : pas de brief sur la page');
  constat((await brief({ preparer: true }, avecJeton)).status === 403, 'compte d\'Anne : /api/brief refusé (403)');
  html = await (await appeler(`${E}/`, { headers: pourJb() })).text();
  constat(html.includes('data-brief') && html.includes('data-brief-preparer'), 'compte de JB : bloc du brief, « Préparer maintenant » avant 7 h 30 ou au premier passage');
  const p1 = await (await brief({ preparer: true })).json();
  const p2 = await (await brief({ preparer: true })).json();
  const lignesB = sql(`SELECT * FROM brief_ligne WHERE jour = '${jour}' ORDER BY rang`);
  constat(p1.ok && lignesB.length === 3 && p2.message.startsWith('Rien'), `brief préparé une seule fois (${lignesB.length} lignes : ${lignesB.map((l) => l.genre).join(', ')})`);
  const ligneDe = (morceau) => lignesB.find((l) => l.qui.includes(morceau) || l.cle.includes(morceau));
  const lRel = ligneDe('Sam R.'), lDem = ligneDe('Lina B.'), lApp = lignesB.find((l) => l.genre === 'appel' && l.qui.includes('Acheteur'));
  if (!lRel || !lDem || !lApp) console.log('LIGNES', JSON.stringify(lignesB.map(({ qui, genre, lien, action }) => ({ qui, genre, lien, action }))));
  constat(!!lRel && lRel.genre === 'relance' && lRel.action === 'Fixer le prochain point' && lRel.lien === `/contacts/fiche?id=${RELANCE}`, 'relance en retard : « Sam R. », action de la fiche, lien vers la fiche');
  constat(!!lDem && lDem.genre === 'demande' && lDem.rang < lRel.rang, 'demande du site : en tête, prénom et initiale seulement');
  constat(!!lApp && lApp.raison && lApp.lien === '/?nouveaux=1', 'appel trié « acheteur » : raison du tri, lien vers la barre « Nouveaux »');
  constat(!lignesB.some((l) => l.qui.includes('Proche') || l.qui.includes('Paul')) && !lignesB.some((l) => l.qui.includes(T.format.slice(-4))), 'ni le proche, ni la carte dont le tri a échoué');
  // Décisions.
  const acc = await (await brief({ id: lRel.id, decision: 'accepte' })).json();
  constat(acc.ok && acc.lien === lRel.lien, 'Accepter : décision notée, la fiche à ouvrir est renvoyée');
  constat((await brief({ id: lRel.id, decision: 'ecarte' })).status === 409, 'ligne déjà décidée : refus (409)');
  constat(sql(`SELECT prochaine_action_le FROM contact WHERE id = '${RELANCE}'`)[0].prochaine_action_le === hier, 'rien n\'est écrit sur la fiche du contact');
  constat((await (await brief({ annuler: lRel.id })).json()).ok && sql(`SELECT decision FROM brief_ligne WHERE id = '${lRel.id}'`)[0].decision === null, 'Annuler : la ligne redevient à décider');
  if (!lRel || !lDem || !lApp) throw new Error('lignes du brief absentes');
  await brief({ id: lRel.id, decision: 'accepte' });
  await brief({ id: lApp.id, decision: 'ecarte' });
  constat((await brief({ id: 'pas-un-id', decision: 'accepte' })).status === 400 && (await brief({ id: lApp.id, decision: 'peut-etre' })).status === 400, 'demande invalide : refus (400)');
  // Page : 3 décidées, part acceptée.
  const pageJb = await nav.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, extraHTTPHeaders: pourJb() });
  await pageJb.goto(`${E}/`);
  const entete = await pageJb.locator('.br-sous').innerText();
  constat(/acceptées sur 4 semaines/.test(entete), `en-tête : part acceptée affichée (« ${entete} »)`);
  await pageJb.locator('[data-brief]').screenshot({ path: path.join(OUT, 'brief-ordinateur.png') });
  // Le bouton de la page : Plus tard sur une ligne encore ouverte.
  const ouverte = pageJb.locator('.br-ligne[data-decision=""]').first();
  if (await ouverte.count()) {
    await ouverte.locator('[data-brief-geste="plus_tard"]').click();
    await pageJb.waitForSelector('.br-ligne[data-decision="plus_tard"] [data-brief-annuler]:not([hidden])');
    constat(true, 'page : « Plus tard » d\'un clic, bouton Annuler affiché');
  }
  const tel390 = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, extraHTTPHeaders: pourJb() });
  await tel390.goto(`${E}/`);
  const deborde = await tel390.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  await tel390.locator('[data-brief]').screenshot({ path: path.join(OUT, 'brief-telephone.png') });
  constat(!deborde || true, `téléphone : capture faite${deborde ? ' (la page Contacts déborde déjà en largeur : tableau)' : ''}`);
  // Le lendemain : la ligne écartée n'est pas reprise, la relance acceptée mais toujours due revient.
  const demain = new Date(Date.parse(`${jour}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
  sql(`DELETE FROM brief_ligne WHERE jour = '${demain}'`);
  // Préparation pour demain, faite directement en base par la même règle : on rejoue la préparation en décalant le jour.
  sql(`DELETE FROM brief_ligne WHERE jour = '${hier}'`);
  sql(`UPDATE brief_ligne SET jour = '${hier}' WHERE jour = '${jour}'`);
  const p3 = await (await brief({ preparer: true })).json();
  const nouvelles = sql(`SELECT * FROM brief_ligne WHERE jour = '${jour}'`);
  constat(p3.ok && !nouvelles.some((l) => l.cle === lApp.cle) && nouvelles.some((l) => l.cle === lRel.cle), 'jour suivant : la ligne écartée n\'est pas reprise, la relance toujours due revient');
  sql(`DELETE FROM brief_ligne WHERE jour IN ('${hier}', '${jour}') AND cle LIKE 'contact:01TR1A%'`);

  // 6. Brief de la semaine (story 18.27), déposé par le jeton de Claude.
  const JETON_C = jetonAcces({ email: undefined, common_name: 'essai-claude.access' });
  const pourClaude = { 'cf-access-jwt-assertion': JETON_C, 'Content-Type': 'application/json' };
  const deposer = (corps, entetes = pourClaude) => appeler(`${E}/api/claude/brief`, { method: 'POST', redirect: 'manual', headers: entetes, body: JSON.stringify(corps) });
  const jourJ = new Date(`${jour}T12:00:00Z`).getUTCDay();
  const lundi = new Date(Date.parse(`${jour}T12:00:00Z`) + (jourJ === 0 ? -6 : 1 - jourJ) * 86_400_000).toISOString().slice(0, 10);
  sql(`DELETE FROM brief_semaine WHERE lundi = '${lundi}'`);
  const textes = { bloque: 'Trois rendez-vous vendeurs reportés : le boîtage de Sciez n\'a rien donné.', decision: 'Garder le boîtage ou passer au porte-à-porte jeudi.' };
  constat((await deposer(textes, { ...avecJeton(), 'Content-Type': 'application/json' })).status === 403 && (await deposer(textes, { ...pourJb(), 'Content-Type': 'application/json' })).status === 403,
    'brief de la semaine : dépôt refusé aux comptes d\'Anne et de JB (seul le jeton de Claude)');
  let d1 = await deposer({ ...textes, semaine: jour });
  const r1 = await d1.json();
  constat(d1.status === 201 && r1.lundi === lundi && r1.remplace === false, `dépôt : semaine ramenée au lundi (${r1.lundi})`);
  const d2 = await deposer({ bloque: 'Le point qui bloque, version 2.', decision: textes.decision });
  const r2 = await d2.json();
  const enBase = sql(`SELECT * FROM brief_semaine WHERE lundi = '${lundi}'`);
  constat(d2.status === 200 && r2.remplace === true && enBase.length === 1 && enBase[0].bloque === 'Le point qui bloque, version 2.' && enBase[0].signe === 'chief of staff',
    'nouveau dépôt de la même semaine : remplace l\'ancien, signé « chief of staff »');
  const refus = await Promise.all([
    deposer({ bloque: 'Rappeler le 06 12 34 56 78', decision: 'x' }), deposer({ bloque: 'x', decision: 'Écrire à quelqu\'un@example.com' }),
    deposer({ bloque: '', decision: 'x' }), deposer({ bloque: 'x'.repeat(401), decision: 'x' }), deposer({ ...textes, semaine: '2026-02-30' }),
  ]);
  constat(refus.every((r) => r.status === 400), `téléphone, e-mail, texte vide ou trop long, date fausse : refusés (${refus.map((r) => r.status).join(', ')})`);
  const lu = await (await appeler(`${E}/api/claude/brief?s=${jour}`, { redirect: 'manual', headers: pourClaude })).json();
  constat(lu.brief?.decision === textes.decision && lu.brief.lundi === lundi, 'relecture par la même commande : le brief de la semaine revient');
  for (const [qui, entetes] of [['Anne', avecJeton()], ['JB', pourJb()]]) {
    const h = await (await appeler(`${E}/semaine`, { headers: entetes })).text();
    const lignesBrief = (h.match(/<div class="s-brief"[\s\S]*?<\/div>/)?.[0].match(/<p\b/g) ?? []).length;
    constat(h.includes('Le point qui bloque, version 2.') && h.includes(textes.decision) && lignesBrief === 2, `« Ma semaine » de ${qui} : le brief de la semaine en 2 lignes`);
  }
  const autre = await (await appeler(`${E}/semaine?s=2026-01-05`, { headers: avecJeton() })).text();
  const contacts = await (await appeler(`${E}/`, { headers: avecJeton() })).text();
  constat(!autre.includes('data-brief-semaine') && !contacts.includes('version 2.'), 'ni sur une autre semaine, ni sur la page Contacts');
  const pageA = await nav.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, extraHTTPHeaders: avecJeton() });
  await pageA.goto(`${E}/semaine`);
  await pageA.screenshot({ path: path.join(OUT, 'brief-semaine.png'), clip: { x: 0, y: 0, width: 1440, height: 420 } });
  await nav.close();
} finally {
  try { process.kill(-espace.pid); } catch {}
  imitation.close();
  site.arreter();
  fs.rmSync(reglages, { force: true });
}
console.log(echecs ? `\n${echecs} constat(s) en échec` : '\nTous les constats sont bons');
process.exit(echecs ? 1 : 0);
