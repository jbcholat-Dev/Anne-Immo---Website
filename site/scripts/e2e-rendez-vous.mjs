// Essai de bout en bout du rendez-vous Cal.com (story 10.6) : serveur local Cloudflare (wrangler dev) + base locale, avec
// l'imitation de Resend de serveur-essai.mjs et le secret de webhook `essai`. Vérifie : signature exigée, une réservation =
// un seul lead `rdv` même rejouée, case de confidentialité obligatoire, annulation ignorée, notification à Anne avec le
// téléphone et la date ; puis, dans un navigateur, que l'agenda de Cal.com n'est chargé qu'au clic (script de Cal.com imité,
// car cal.com n'est pas joignable depuis l'environnement de Claude).
// Préalable : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run base:local`.
// Lancer : `node scripts/e2e-rendez-vous.mjs`.
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { demarrer, ICI, pause } from './serveur-essai.mjs';

const OUT = path.join(ICI, '.verif');
fs.mkdirSync(OUT, { recursive: true });
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };
const serveur = await demarrer({ nom: 'rendez-vous' });
const { U, recus, appeler, sql, arreter, essai: ESSAI } = serveur;

const signer = (corps, secret = 'essai') => createHmac('sha256', secret).update(corps).digest('hex');
const webhook = (message, { signature, secret } = {}) => {
  const corps = JSON.stringify(message);
  const entetes = { 'Content-Type': 'application/json' };
  if (signature !== null) entetes['X-Cal-Signature-256'] = signature ?? signer(corps, secret);
  return appeler(`${U}/api/webhook-cal`, { method: 'POST', headers: entetes, body: corps }).then(async (r) => ({ statut: r.status, ...(await r.json().catch(() => ({}))) }));
};
// Forme constatée le 2026-10-07 (story 10.1), avec le lieu « numéro du participant » (décision du 2026-10-08).
const reservation = (uid, reponses = {}, evenement = 'BOOKING_CREATED') => ({
  triggerEvent: evenement,
  createdAt: new Date().toISOString(),
  payload: {
    uid, startTime: '2026-10-16T09:00:00Z', endTime: '2026-10-16T09:30:00Z',
    attendees: [{ name: 'Paul Essai', email: `paul+${ESSAI}@example.com`, language: { locale: 'fr' } }],
    responses: {
      name: { value: 'Paul Essai' }, email: { value: `paul+${ESSAI}@example.com` },
      location: { value: { value: 'phone', optionValue: '06 98 76 54 32' } },
      notes: { value: 'Maison à Thonon, vente au printemps.' }, confidentialite: { value: true },
      ...reponses,
    },
  },
});

try {
  // 1. Signature : absente, fausse, ou faite avec un autre secret → 401, rien d'écrit.
  const uid = `essai-${ESSAI}`;
  let r = await webhook(reservation(uid), { signature: null });
  constat(r.statut === 401, `signature absente refusée (${r.statut})`);
  r = await webhook(reservation(uid), { signature: 'abc' });
  constat(r.statut === 401, `signature fausse refusée (${r.statut})`);
  r = await webhook(reservation(uid), { secret: 'autre' });
  constat(r.statut === 401, `signature d'un autre secret refusée (${r.statut})`);
  constat(sql(`SELECT count(*) AS n FROM lead WHERE submission_id = 'cal:${uid}'`)[0].n === 0, 'aucun lead écrit après ces refus');

  // 2. Réservation valide, puis rejouée par Cal.com : un seul lead, un seul e-mail.
  r = await webhook(reservation(uid));
  constat(r.statut === 200 && r.ok === true, `réservation acceptée (${r.statut})`);
  r = await webhook(reservation(uid));
  constat(r.statut === 200 && r.ok === true, 'réservation rejouée acceptée');
  const lignes = sql(`SELECT id, source, prenom, nom, telephone, rdv_start, message, is_test, privacy_accepted_at FROM lead WHERE submission_id = 'cal:${uid}'`);
  constat(lignes.length === 1, `un seul lead pour deux webhooks (${lignes.length})`);
  const l = lignes[0] ?? {};
  constat(l.source === 'rdv' && l.prenom === null && l.nom === 'Paul Essai' && l.is_test === 1, 'lead rdv, nom complet de Cal.com, marqué test');
  constat(l.telephone === '+33698765432', `téléphone du lieu Cal.com en E.164 (${l.telephone})`);
  constat(l.rdv_start === '2026-10-16T09:00:00.000Z', `date du rendez-vous gardée (${l.rdv_start})`);
  constat(l.message === 'Maison à Thonon, vente au printemps.' && !!l.privacy_accepted_at, 'note du prospect et acceptation gardées');
  const canaux = sql(`SELECT channel, status FROM lead_delivery WHERE lead_id = '${l.id}'`);
  constat(canaux.length === 1 && canaux[0].channel === 'notify_anne', `seule la notification à Anne est prévue (${canaux.map((c) => c.channel).join(', ')})`);
  for (let i = 0; i < 20 && !recus.some((e) => e.idempotence === `${l.id}:notify_anne`); i++) await pause(250);
  const mails = recus.filter((e) => e.idempotence?.startsWith(`${l.id}:`));
  constat(mails.length === 1, `un seul e-mail parti (${mails.length})`);
  const m = mails[0] ?? { to: [], subject: '', text: '' };
  constat(m.to?.[0] === 'boite-test@example.com', 'e-mail routé vers la boîte de test');
  constat(m.subject === '[TEST] Nouvelle demande · Rendez-vous vendredi 16 octobre à 11:00 · Paul Essai', `objet : ${m.subject}`);
  constat(m.text.includes('À faire : appeler +33 6 98 76 54 32 le vendredi 16 octobre à 11:00'), 'consigne d\'appel avec le numéro et l\'heure de Paris');
  constat(m.text.includes('Rendez-vous « Premier échange » le vendredi 16 octobre à 11:00 (heure de Paris), par téléphone.'), 'notes Modelo : rendez-vous par téléphone');
  constat(m.text.includes('Type de contact\nÀ préciser pendant l\'appel'), 'type de contact à préciser');
  constat(m.reply_to === `paul+${ESSAI}@example.com`, 'Répondre écrit au prospect');
  fs.writeFileSync(path.join(OUT, 'e2e-rendez-vous-notification.txt'), `${m.subject}\n\n${m.text}`);

  // 3. Réservation sans case de confidentialité : refusée, rien d'écrit.
  const uid2 = `${uid}-sans-case`;
  r = await webhook(reservation(uid2, { confidentialite: { value: false } }));
  constat(r.statut === 422 && r.error?.champ === 'privacy', `case de confidentialité non cochée refusée (${r.statut} ${r.error?.champ})`);
  constat(sql(`SELECT count(*) AS n FROM lead WHERE submission_id = 'cal:${uid2}'`)[0].n === 0, 'aucun lead écrit');

  // 4. Annulation : acceptée, ignorée.
  r = await webhook(reservation(uid, {}, 'BOOKING_CANCELLED'));
  constat(r.statut === 200 && r.ignore === true, `annulation ignorée (${r.statut})`);
  constat(sql(`SELECT count(*) AS n FROM lead WHERE submission_id LIKE 'cal:${uid}%'`)[0].n === 1, 'toujours un seul lead');

  // 5. Navigateur : rien de Cal.com avant le clic, l'agenda ensuite ; un échec de chargement se rattrape.
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
  const appelsCal = [];
  const erreurs = [];
  page.on('console', (c) => { if (c.type() === 'error') erreurs.push(c.text()); });
  page.on('request', (q) => { if (/cal\.com/.test(q.url())) appelsCal.push(q.url()); });
  let enPanne = true;
  await page.route('https://app.cal.com/**', (route) => enPanne ? route.abort() : route.fulfill({
    contentType: 'text/javascript',
    // Imitation du script de Cal.com : lit la file d'attente du chargeur, pose un agenda factice et signale « linkReady ».
    body: `(() => { const ns = window.Cal.ns.rdv; for (const [action, o] of ns.q) {
      if (action === 'inline') document.querySelector(o.elementOrSelector).innerHTML = '<p data-agenda-imite>Agenda imité : ' + o.calLink + '</p>';
      if (action === 'on' && o.action === 'linkReady') setTimeout(o.callback, 50); } })();`,
  }));
  await page.goto(`${U}/contact`, { waitUntil: 'networkidle' });
  constat(appelsCal.length === 0, `aucun appel à Cal.com avant le clic (${appelsCal.length})`);
  await page.click('[data-agenda-ouvrir]');
  await page.waitForSelector('[data-agenda-echec]:not([hidden])', { timeout: 5000 }).catch(() => {});
  constat(await page.isVisible('[data-agenda-echec]'), 'agenda injoignable : message d\'échec affiché');
  constat(await page.isEnabled('[data-agenda-ouvrir]'), 'le bouton reste utilisable pour réessayer');
  enPanne = false;
  await page.click('[data-agenda-ouvrir]');
  await page.waitForSelector('[data-agenda-imite]', { timeout: 5000 }).catch(() => {});
  constat((await page.textContent('[data-agenda-imite]').catch(() => '')).includes('annevialtissot/premier-echange'), 'agenda chargé au deuxième clic, lien premier-echange');
  await page.waitForSelector('[data-agenda]', { state: 'hidden', timeout: 5000 }).catch(() => {});
  constat(!(await page.isVisible('[data-agenda-ouvrir]')), 'bouton masqué une fois l\'agenda prêt');
  await page.screenshot({ path: path.join(OUT, 'e2e-rendez-vous-contact.png') });

  // Arriver par /contact#reserver vaut demande : l'agenda se charge seul.
  const page2 = await navigateur.newPage();
  await page2.route('https://app.cal.com/**', (route) => route.fulfill({ contentType: 'text/javascript', body: `document.querySelector('#agenda-cal').innerHTML = '<p data-agenda-imite>ok</p>';` }));
  await page2.goto(`${U}/contact#reserver`, { waitUntil: 'networkidle' });
  constat(await page2.isVisible('[data-agenda-imite]'), 'arrivée par #reserver : agenda chargé sans clic');
  const autres = erreurs.filter((e) => !/ERR_FAILED|net::/.test(e)); // la coupure volontaire de l'étape 5 produit une erreur réseau
  constat(autres.length === 0, `aucune autre erreur console (${autres.join(' | ')})`);
  await navigateur.close();
} finally {
  arreter();
}
console.log(echecs ? `\n${echecs} constat(s) en échec` : '\nTous les constats sont bons');
process.exit(echecs ? 1 : 0);
