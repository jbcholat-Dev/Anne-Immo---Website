// Essai de bout en bout du guide par lien signé et de la séquence d'e-mails (story 10.5), sur le serveur local
// (wrangler dev, base locale, imitation de Turnstile et de Resend, secret des liens `essai`, voir serveur-essai.mjs).
// Vérifie : lien signé du guide (PDF servi, 404 si modifié, expiré ou inconnu, aucune adresse publique du PDF),
// e-mails du guide (formulaire et page de résultats), lignes de séquence à la bonne échéance, envoi par la tâche planifiée,
// désabonnement (page en deux temps, un clic depuis la messagerie, second clic sans effet), puis la page /guide et le bouton
// de la page de résultats dans un navigateur. Captures dans .verif/.
// Préalable : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run base:local`.
// Lancer : `node scripts/e2e-guide.mjs`.
import { createHmac } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { demarrer, imiterTurnstile, ICI, pause, sid } from './serveur-essai.mjs';

const OUT = path.join(ICI, '.verif');
fs.mkdirSync(OUT, { recursive: true });
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };
const serveur = await demarrer({ nom: 'guide' });
const { U, recus, appeler, sql, arreter, essai: ESSAI } = serveur;

const signe = (message) => createHmac('sha256', 'essai').update(message).digest('base64url');
const lienGuide = (lead, fin) => `${U}/api/guide/telecharger?l=${lead}&e=${fin}&s=${signe(`guide.${lead}.${fin}`)}`;
let ip = 0;
const poster = (route, corps) =>
  appeler(`${U}/api/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': `203.0.113.${++ip}` }, body: JSON.stringify({ lang: 'fr', turnstile: 'jeton', privacy: 'on', ...corps }) })
    .then(async (r) => ({ statut: r.status, ...(await r.json()) }));
const mails = (lead) => recus.filter((e) => e.idempotence?.startsWith(`${lead}:`));
const attendre = async (lead, canal) => { for (let i = 0; i < 24 && !recus.some((e) => e.idempotence === `${lead}:${canal}`); i++) await pause(250); };
const etapes = fs.readdirSync(path.join(ICI, '../contenu-anne/guide/sequence-emails')).filter((d) => /^etape-[1-9]/.test(d))
  .map((d) => fs.readFileSync(path.join(ICI, '../contenu-anne/guide/sequence-emails', d, 'fr.md'), 'utf8'))
  .map((t) => ({ etape: Number(/^etape: (\d+)/m.exec(t)[1]), delai: Number(/^delai_jours: (\d+)/m.exec(t)[1]), sujet: /^sujet: "?(.*?)"?$/m.exec(t)[1] }))
  .sort((a, b) => a.etape - b.etape);

try {
  // 1. Demande du guide avec la séquence : lien signé renvoyé, e-mails, lignes de séquence à la bonne échéance.
  const s1 = sid();
  const avant = Date.now();
  let r = await poster('guide', { submission_id: s1, prenom: 'Lucie', nom: 'Essai', email: `lucie+${ESSAI}@example.com`, newsletter: 'on' });
  const lead = sql(`SELECT id, newsletter_opt_in_at FROM lead WHERE submission_id = '${s1}'`)[0] ?? {};
  constat(r.ok === true && typeof r.url === 'string' && r.url.startsWith(`${U}/api/guide/telecharger?l=${lead.id}&e=`), `demande du guide acceptée, lien signé renvoyé à la page (${r.statut})`);
  const fin = Number(new URL(r.url ?? U).searchParams.get('e'));
  constat(Math.abs(fin * 1000 - (avant + 7 * 86400000)) < 120000, 'le lien expire dans 7 jours');
  const lignes = sql(`SELECT channel, due_at, status FROM lead_delivery WHERE lead_id = '${lead.id}' ORDER BY channel`);
  const seq = lignes.filter((l) => l.channel.startsWith('sequence:'));
  constat(lignes.some((l) => l.channel === 'confirm_prospect') && lignes.some((l) => l.channel === 'notify_anne'), 'confirmation au prospect et notification à Anne prévues');
  const echeancesJustes = etapes.every((e) => {
    const l = seq.find((x) => x.channel === `sequence:${e.etape}`);
    return l && Math.abs(Date.parse(l.due_at) - (Date.parse(lead.newsletter_opt_in_at) + e.delai * 86400000)) < 1000;
  });
  constat(seq.length === etapes.length && echeancesJustes, `${seq.length} e-mails de séquence prévus, chacun à inscription + délai (${etapes.map((e) => `J+${e.delai}`).join(', ')})`);
  await attendre(lead.id, 'confirm_prospect');
  await attendre(lead.id, 'notify_anne');
  const conf = mails(lead.id).find((e) => e.idempotence.endsWith(':confirm_prospect'));
  constat(!!conf && conf.text.includes(`${U}/api/guide/telecharger?l=${lead.id}`) && conf.text.includes('valable 7 jours') && conf.text.includes(`${etapes.length} e-mails de conseils`), 'e-mail au prospect : lien du guide, 7 jours, annonce de la séquence');
  const notif = mails(lead.id).find((e) => e.idempotence.endsWith(':notify_anne'));
  constat(!!notif && notif.text.includes('Le site lui a envoyé le guide') && notif.text.includes('Séquence d\'e-mails : acceptée'), 'notification à Anne : guide envoyé par le site, séquence acceptée');

  // 2. Le lien du guide : le PDF ; modifié, expiré ou d'un lead inconnu : 404 ; aucune adresse publique du PDF.
  let q = await appeler(r.url);
  const pdf = Buffer.from(await q.arrayBuffer());
  constat(q.status === 200 && q.headers.get('content-type') === 'application/pdf' && pdf.subarray(0, 5).toString() === '%PDF-' && pdf.length > 50000, `lien valable : PDF servi (${Math.round(pdf.length / 1024)} Ko)`);
  constat(/no-store/.test(q.headers.get('cache-control') ?? '') && q.headers.get('x-robots-tag') === 'noindex', 'PDF ni gardé en cache ni indexé');
  const essais = [
    ['empreinte modifiée', r.url.replace(/s=./, 's=A')],
    ['date de fin repoussée', r.url.replace(`e=${fin}`, `e=${fin + 86400}`)],
    ['lien expiré (bien signé)', lienGuide(lead.id, Math.floor(Date.now() / 1000) - 60)],
    ['lead inconnu (bien signé)', lienGuide('01ARZ3NDEKTSV4RRFFQ69G5FAV', fin)],
    ['sans paramètres', `${U}/api/guide/telecharger`],
    ['ancienne adresse statique', `${U}/guide.pdf`],
    ['fichier du dossier privé', `${U}/prive/guide.pdf`],
  ];
  for (const [nom, adresse] of essais) {
    q = await appeler(adresse);
    const corps = await q.text();
    constat(q.status === 404 && !corps.startsWith('%PDF'), `${nom} : 404`);
  }

  // 3. Tâche planifiée : l'étape 1 arrivée à échéance part, avec son lien de désabonnement ; les autres attendent.
  sql(`UPDATE lead_delivery SET due_at = '2000-01-01T00:00:00.000Z' WHERE lead_id = '${lead.id}' AND channel = 'sequence:${etapes[0].etape}'`);
  await appeler(`${U}/cdn-cgi/handler/scheduled`);
  await attendre(lead.id, `sequence:${etapes[0].etape}`);
  const e1 = mails(lead.id).find((e) => e.idempotence.endsWith(`:sequence:${etapes[0].etape}`));
  const desabo = /(http\S+\/desabonnement\?l=\S+)/.exec(e1?.text ?? '')?.[1] ?? '';
  constat(e1?.subject === `[TEST] ${etapes[0].sujet}` && e1.to[0] === 'boite-test@example.com', `étape 1 envoyée par la tâche planifiée, vers la boîte de test : « ${e1?.subject} »`);
  constat(!!e1 && e1.text.includes('Bonjour Lucie') && !e1.text.includes('**') && !e1.text.includes('[Prénom]'), 'prénom remplacé, marques de mise en forme retirées');
  constat(!!desabo && e1.headers?.['List-Unsubscribe'] === `<${desabo.replace('/desabonnement?', '/api/desabonnement?')}>` && e1.headers?.['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click', 'lien de désabonnement en pied et en-têtes de désinscription en un clic');
  const etat = sql(`SELECT channel, status FROM lead_delivery WHERE lead_id = '${lead.id}' AND channel LIKE 'sequence:%'`);
  constat(etat.filter((l) => l.status === 'delivered').length === 1 && etat.filter((l) => l.status === 'pending').length === etapes.length - 1, 'une étape partie, les autres en attente de leur jour');

  // 4. Désabonnement : ouvrir le lien ne désabonne pas ; le bouton le fait ; un second envoi reste sans effet.
  q = await appeler(desabo);
  let html = await q.text();
  constat(q.status === 200 && html.includes('data-desabonner') && sql(`SELECT newsletter_unsubscribed_at AS d FROM lead WHERE id = '${lead.id}'`)[0].d === null, 'ouvrir le lien affiche le bouton, sans désabonner (messageries qui ouvrent les liens seules)');
  const formulaire = { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: U }, body: '' };
  q = await appeler(desabo, formulaire);
  html = await q.text();
  const apres = sql(`SELECT newsletter_unsubscribed_at AS d FROM lead WHERE id = '${lead.id}'`)[0].d;
  const restantes = sql(`SELECT status FROM lead_delivery WHERE lead_id = '${lead.id}' AND channel LIKE 'sequence:%' AND status = 'cancelled'`).length;
  constat(q.status === 200 && html.includes('data-desabonne') && !!apres && restantes === etapes.length - 1, `bouton : désabonnement horodaté, ${restantes} e-mails restants annulés`);
  q = await appeler(desabo, formulaire);
  html = await q.text();
  constat(q.status === 200 && html.includes('data-desabonne') && sql(`SELECT newsletter_unsubscribed_at AS d FROM lead WHERE id = '${lead.id}'`)[0].d === apres, 'second clic : même page, aucune erreur, date inchangée');
  q = await appeler(desabo.replace(/s=./, 's=A'));
  constat(q.status === 404 && (await q.text()).includes('data-lien-invalide'), 'lien de désabonnement modifié : 404');
  // Une étape remise à échéance après le désabonnement n'est pas envoyée.
  sql(`UPDATE lead_delivery SET status = 'pending', due_at = '2000-01-01T00:00:00.000Z' WHERE lead_id = '${lead.id}' AND channel = 'sequence:${etapes[1].etape}'`);
  const nAvant = mails(lead.id).length;
  await appeler(`${U}/cdn-cgi/handler/scheduled`);
  await pause(1500);
  constat(mails(lead.id).length === nAvant && sql(`SELECT status FROM lead_delivery WHERE lead_id = '${lead.id}' AND channel = 'sequence:${etapes[1].etape}'`)[0].status === 'cancelled', 'après désabonnement, une étape échue est annulée, pas envoyée');

  // 5. Désinscription en un clic depuis la messagerie (POST sans en-tête Origin).
  const s2 = sid();
  r = await poster('guide', { submission_id: s2, prenom: 'Paul', nom: 'Essai', email: `paul+${ESSAI}@example.com`, newsletter: 'on' });
  const lead2 = sql(`SELECT id FROM lead WHERE submission_id = '${s2}'`)[0].id;
  const unClic = `${U}/api/desabonnement?l=${lead2}&s=${signe(`desabonnement.${lead2}`)}`;
  q = await appeler(unClic, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'List-Unsubscribe=One-Click' });
  constat(q.status === 200 && sql(`SELECT count(*) AS n FROM lead_delivery WHERE lead_id = '${lead2}' AND status = 'cancelled'`)[0].n === etapes.length, 'un clic depuis la messagerie : désabonné, toute la séquence annulée');

  // 6. Sans la case « séquence » : aucune ligne de séquence.
  const s3 = sid();
  r = await poster('guide', { submission_id: s3, prenom: 'Zoé', nom: 'Essai', email: `zoe+${ESSAI}@example.com` });
  const lead3 = sql(`SELECT id FROM lead WHERE submission_id = '${s3}'`)[0].id;
  constat(r.ok && sql(`SELECT count(*) AS n FROM lead_delivery WHERE lead_id = '${lead3}' AND channel LIKE 'sequence:%'`)[0].n === 0, 'sans la case « séquence » : aucun e-mail de séquence prévu');

  // 7. Navigateur : page /guide (lien affiché après envoi), puis diagnostic en sortie B et bouton du guide des résultats.
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const erreurs = [];
  const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('console', (c) => { if (c.type() === 'error') erreurs.push(c.text()); });
  await imiterTurnstile(page);
  await page.goto(`${U}/guide`, { waitUntil: 'networkidle' });
  constat((await page.textContent('.g-note'))?.includes('7 jours') && (await page.textContent('form[data-formulaire="guide"]'))?.includes(`${etapes.length} e-mails de conseils`), `page /guide : « valable 7 jours », case « ${etapes.length} e-mails »`);
  await page.fill('input[name="prenom"]', 'Nina');
  await page.fill('input[name="nom"]', 'Essai');
  await page.fill('input[name="email"]', `nina+${ESSAI}@example.com`);
  await page.check('input[name="privacy"]', { force: true });
  await page.click('form[data-formulaire="guide"] button[type="submit"]');
  await page.waitForSelector('[data-confirmation="guide"]:not([hidden])', { timeout: 15000 }).catch(() => {});
  const href = await page.getAttribute('[data-lien-guide]', 'href').catch(() => null);
  constat(!!href && href.includes('/api/guide/telecharger?l=') && await page.isVisible('[data-lien-guide]'), 'confirmation : « Ouvrir le guide maintenant » mène au lien signé');
  await page.screenshot({ path: path.join(OUT, 'guide-confirmation.png') });

  // Diagnostic en sortie B (réponses de e2e-diagnostic), ouverture des résultats dans ce navigateur.
  const ORDRE = ['q01', 'q02', 'q03', 'q04', 'q05', 'q06', 'q07', 'q08', 'q09', 'q10a', 'q10b', 'q11a', 'q11b', 'q12', 'q13', 'q14', 'q15'];
  const B = ['q01.a', 'q02.b', 'q03.b', 'q04.b', 'q05.c', 'q06.b', ['q07.a', 'q07.b'], 'q08.b', 'q09.b', 'q10a.b', 'q10b.a', 'q11a.c', 'q11b.a', 'q12.d', ['q13.a', 'q13.c'], 'q14.b', []];
  const reponses = Object.fromEntries(ORDRE.map((q, i) => [q, Array.isArray(B[i]) ? B[i] : [B[i]]]));
  const s4 = sid();
  r = await poster('diagnostic', { submission_id: s4, reponses, prenom: 'Bruno', nom: 'Essai', email: `bruno+${ESSAI}@example.com`, telephone: '06 12 34 56 78', journey_id: 'essai' });
  const lead4 = sql(`SELECT id, orientation FROM lead WHERE submission_id = '${s4}'`)[0];
  await attendre(lead4.id, 'confirm_prospect');
  const confB = mails(lead4.id).find((e) => e.idempotence.endsWith(':confirm_prospect'));
  constat(lead4.orientation === 'B' && !!confB && confB.text.includes(`/api/guide/telecharger?l=${lead4.id}`), 'diagnostic en sortie B : le résumé des résultats porte le lien du guide');
  await page.goto(`${U}${r.url}`, { waitUntil: 'networkidle' });
  constat((await page.textContent('.rs-sequence p'))?.includes(`${etapes.length} e-mails`), `résultats : « séquence de ${etapes.length} e-mails » (nombre réel)`);
  await page.click('.rs-sortie [data-guide]');
  await page.waitForSelector('[data-etat-guide]:not([hidden])', { timeout: 10000 }).catch(() => {});
  const lienRes = await page.getAttribute('[data-etat-guide] [data-lien-guide]', 'href').catch(() => null);
  constat(await page.isVisible('[data-etat-guide]') && !!lienRes && lienRes.includes(`l=${lead4.id}`), 'bouton du guide : « Le guide est parti… 7 jours » et lien à ouvrir');
  await attendre(lead4.id, 'guide');
  constat(mails(lead4.id).filter((e) => e.idempotence.endsWith(':guide')).length === 1, 'e-mail du guide envoyé pour le lead du navigateur');
  await page.click('.rs-sortie [data-guide]');
  await pause(1500);
  constat(mails(lead4.id).filter((e) => e.idempotence.endsWith(':guide')).length === 1, 'second clic : pas de second e-mail');
  await page.click('[data-sequence]');
  await page.waitForSelector('[data-etat-sequence]:not([hidden])', { timeout: 10000 }).catch(() => {});
  const txtSeq = (await page.textContent('[data-etat-sequence]')) ?? '';
  const lienDesabo = await page.getAttribute('[data-etat-sequence] a', 'href');
  constat(txtSeq.includes(`Séquence de ${etapes.length} e-mails confirmée. Le premier arrive dans ${etapes[0].delai} jours`) && (lienDesabo ?? '').includes(`/desabonnement?l=${lead4.id}`), `inscription : « Séquence de ${etapes.length} e-mails confirmée. Le premier arrive dans ${etapes[0].delai} jours », lien de désinscription signé`);
  constat(sql(`SELECT count(*) AS n FROM lead_delivery WHERE lead_id = '${lead4.id}' AND channel LIKE 'sequence:%'`)[0].n === etapes.length, 'inscription depuis les résultats : la séquence est prévue');
  await page.screenshot({ path: path.join(OUT, 'resultats-guide-envoye.png'), fullPage: true });
  // Le dernier e-mail porte « [Prénom] » dans son objet : il doit être remplacé (retour de JB du 2026-10-08).
  const derniere = etapes.at(-1);
  sql(`UPDATE lead_delivery SET due_at = '2000-01-01T00:00:00.000Z' WHERE lead_id = '${lead4.id}' AND channel = 'sequence:${derniere.etape}'`);
  await appeler(`${U}/cdn-cgi/handler/scheduled`);
  await attendre(lead4.id, `sequence:${derniere.etape}`);
  const eDer = mails(lead4.id).find((e) => e.idempotence.endsWith(`:sequence:${derniere.etape}`));
  constat(eDer?.subject === `[TEST] ${derniere.sujet.replace(/\[Prénom\]/g, 'Bruno')}` && !eDer.subject.includes('[Prénom]'), `objet du dernier e-mail avec le prénom : « ${eDer?.subject} »`);
  await page.goto(lienDesabo, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(OUT, 'desabonnement.png') });
  await page.click('[data-desabonner]');
  await page.waitForSelector('[data-desabonne]', { timeout: 10000 }).catch(() => {});
  constat(await page.isVisible('[data-desabonne]'), 'page de désabonnement dans le navigateur : confirmation affichée');
  constat(erreurs.length === 0, `aucune erreur console (${erreurs.join(' | ')})`);
  await navigateur.close();
} finally {
  arreter();
}
console.log(echecs ? `\n${echecs} constat(s) en échec` : '\nTous les constats sont bons');
process.exit(echecs ? 1 : 0);
