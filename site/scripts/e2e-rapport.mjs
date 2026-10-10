// Essai de bout en bout du rapport PDF du diagnostic (story 10.10), sur le serveur local (wrangler dev, base locale,
// imitation de Turnstile et de Resend, secret des liens `essai`, voir serveur-essai.mjs).
// Vérifie : gabarit à jour de ses sources, lien signé sur la page de résultats et dans l'e-mail du résumé (7 jours),
// PDF servi (nom, score, profil, priorités, pages attendues), 404 si le lien est modifié, expiré, d'un guide ou d'un lead
// inconnu, temps de fabrication. Rapports et captures des pages dans .verif/rapport/.
// Préalable : `PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run build` et `npm run base:local`.
// Lancer : `node scripts/e2e-rapport.mjs`.
import { createHmac } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { demarrer, ICI, pause, sid } from './serveur-essai.mjs';
import { empreinteSources } from './rapport-gabarit.mjs';

const OUT = path.join(ICI, '.verif/rapport');
fs.mkdirSync(OUT, { recursive: true });
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };

const plan = JSON.parse(fs.readFileSync(path.join(ICI, 'src/server/rapport-gabarit.json'), 'utf8'));
constat(plan.empreinte === empreinteSources(), 'gabarit à jour de ses textes (sinon : node scripts/rapport-gabarit.mjs, puis npm run build)');

const serveur = await demarrer({ nom: 'rapport' });
const { U, recus, appeler, sql, arreter, essai: ESSAI } = serveur;
const signe = (message) => createHmac('sha256', 'essai').update(message).digest('base64url');

const ORDRE = ['q01', 'q02', 'q03', 'q04', 'q05', 'q06', 'q07', 'q08', 'q09', 'q10a', 'q10b', 'q11a', 'q11b', 'q12', 'q13', 'q14', 'q15'];
const reponses = (choix) => Object.fromEntries(ORDRE.map((q, i) => [q, choix[i] === 'passer' ? [] : Array.isArray(choix[i]) ? (choix[i].length ? choix[i] : [`${q}.i`]) : [choix[i]]]));
// Profil fragile, sortie B (Claire) et profil préparé, sortie A (Marc) : les deux extrêmes du gabarit.
const CHOIX_R = ['q01.d', 'q02.c', 'q03.c', 'q04.c', 'q05.e', 'q06.d', [], 'q08.d', 'q09.c', 'q10a.d', 'q10b.c', 'q11a.a', 'q11b.e', 'q12.b', ['q13.a'], 'q14.c', 'passer'];
const CHOIX_A = ['q01.b', 'q02.a', 'q03.a', 'q04.a', 'q05.a', 'q06.a', ['q07.a', 'q07.b', 'q07.c', 'q07.d', 'q07.e', 'q07.f'], 'q08.a', 'q09.a', 'q10a.a', 'q10b.b', 'q11a.b', 'q11b.a', 'q12.c', ['q13.g'], 'q14.a', 'passer'];
let ip = 0;
const diagnostic = (prenom, nom, choix) =>
  appeler(`${U}/api/diagnostic`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'cf-connecting-ip': `198.51.100.${++ip}` },
    body: JSON.stringify({ lang: 'fr', turnstile: 'jeton', journey_id: 'essai', submission_id: sid(), reponses: reponses(choix), prenom, nom, email: `${prenom.toLowerCase()}+${ESSAI}@example.com`, telephone: '06 12 34 56 78', privacy: 'on' }),
  }).then((r) => r.json());
const texteDe = (fichier) => execFileSync('pdftotext', ['-layout', fichier, '-'], { encoding: 'utf8' });
// Mots qui se chevauchent sur une même page (texte écrit par le serveur posé sur le texte du gabarit, par exemple).
function chevauchements(fichier) {
  const html = execFileSync('pdftotext', ['-bbox', fichier, '-'], { encoding: 'utf8' });
  const trouves = [];
  html.split('<page ').slice(1).forEach((page, n) => {
    const mots = [...page.matchAll(/<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)<\/word>/g)].map((m) => ({ x0: +m[1], y0: +m[2], x1: +m[3], y1: +m[4], t: m[5] }))
      .filter((m) => m.t.replace(/[\s\u200b]/g, '') !== ''); // les emplacements vides du gabarit ne comptent pas
    for (let i = 0; i < mots.length; i++) for (let j = i + 1; j < mots.length; j++) {
      const a = mots[i], b = mots[j];
      const l = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (l > 1 && h > 0.4 * Math.min(a.y1 - a.y0, b.y1 - b.y0)) trouves.push(`page ${n + 1} : « ${a.t} » / « ${b.t} »`);
    }
  });
  return trouves;
}
const pagesDe = (fichier) => Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [fichier], { encoding: 'utf8' }))[1]);

try {
  for (const [prenom, nom, choix, profil, sortie] of [['Claire', 'Dupré', CHOIX_R, 'risque', 'B'], ['Marc', 'Essai', CHOIX_A, 'prepare', 'A']]) {
    // 1. Diagnostic, page de résultats ouverte dans « son » navigateur : le bouton du rapport porte un lien signé de 7 jours.
    const avant = Date.now();
    const r = await diagnostic(prenom, nom, choix);
    const lead = sql(`SELECT id, scores, orientation FROM lead WHERE token = '${new URL(r.url, U).searchParams.get('t')}'`)[0];
    const sc = JSON.parse(lead.scores);
    const cookie = ((await appeler(`${U}${r.url}`, { redirect: 'manual' })).headers.get('set-cookie') ?? '').split(';')[0];
    const html = await (await appeler(`${U}/diagnostic/resultats`, { headers: { cookie } })).text();
    const lien = (/href="([^"]*\/api\/diagnostic\/rapport\?[^"]+)"[^>]*data-rapport/.exec(html)?.[1] ?? '').replace(/&amp;/g, '&');
    const fin = Number(new URL(lien || U).searchParams.get('e'));
    constat(lien.startsWith(`${U}/api/diagnostic/rapport?l=${lead.id}&e=`) && Math.abs(fin * 1000 - (avant + 7 * 86400000)) < 120000, `${prenom} (${sc.profil}, sortie ${lead.orientation}) : bouton « Télécharger mon rapport » sur la page de résultats, lien de 7 jours`);
    const principal = /<div class="rs-sortie-boutons">\s*<a href="([^"]*)"/.exec(html)?.[1]?.replace(/&amp;/g, '&') ?? '';
    constat(sortie === 'B' ? principal === lien && html.includes('data-guide') : html.includes('Votre rapport personnalisé'),
      sortie === 'B' ? `${prenom} : le bouton principal de la sortie B mène au rapport, le guide reste proposé en dessous` : `${prenom} : encart « Votre rapport personnalisé » en sortie A`);
    constat(sc.profil === profil && lead.orientation === sortie, `${prenom} : profil ${profil} et sortie ${sortie} comme prévu`);

    // 2. L'e-mail du résumé porte le même genre de lien, à la place de la phrase des 24 heures.
    for (let i = 0; i < 24 && !recus.some((e) => e.idempotence === `${lead.id}:confirm_prospect`); i++) await pause(250);
    const conf = recus.find((e) => e.idempotence === `${lead.id}:confirm_prospect`);
    constat(!!conf && conf.text.includes(`${U}/api/diagnostic/rapport?l=${lead.id}&e=`) && conf.text.includes('valable 7 jours') && !conf.text.includes('24 heures')
      && conf.html.includes('Télécharger mon rapport (PDF)'), `${prenom} : e-mail du résumé avec le bouton du rapport, sans la phrase des 24 heures`);

    // 3. Le PDF : en-têtes, contenu personnalisé, pages attendues. Temps de fabrication sur cinq appels.
    const temps = [];
    let q;
    for (let i = 0; i < 5; i++) { const t = performance.now(); q = await appeler(lien); const corps = Buffer.from(await q.arrayBuffer()); temps.push(performance.now() - t); if (i === 0) fs.writeFileSync(path.join(OUT, `${prenom}.pdf`), corps); }
    const fichier = path.join(OUT, `${prenom}.pdf`);
    const debut = fs.readFileSync(fichier).subarray(0, 5).toString();
    constat(q.status === 200 && q.headers.get('content-type') === 'application/pdf' && debut === '%PDF-' && /filename="Rapport-diagnostic-[A-Za-z-]+\.pdf"/.test(q.headers.get('content-disposition') ?? '')
      && /no-store/.test(q.headers.get('cache-control') ?? '') && q.headers.get('x-robots-tag') === 'noindex', `${prenom} : PDF servi (nom de fichier sans accent, pas de cache, pas d'indexation)`);
    const texte = texteDe(fichier);
    const attendues = [`couverture/${sc.profil}`, 'priorites', ...['preparation', 'visibilite', 'efficacite'].map((k) => `axe/${k}/${sc.categories[k].bande}`), `suite/${lead.orientation}`]
      .reduce((n, c) => n + plan.parties[c].pages.length, 0);
    constat(texte.includes(`Préparé pour ${prenom} ${nom}`) && new RegExp(`\\b${sc.total}\\s+/ 100`).test(texte), `${prenom} : nom, date et score ${sc.total} / 100 écrits`);
    constat(pagesDe(fichier) === attendues && new RegExp(`\\b${attendues}\\s*/\\s*${attendues}\\b`).test(texte), `${prenom} : ${attendues} pages, pied de page numéroté`);
    const priorites = (texte.match(/EN PRIORITÉ/g) ?? []).length;
    constat(prenom === 'Claire' ? priorites >= 5 : !texte.includes('EN PRIORITÉ') && texte.includes('Aucun point faible'), `${prenom} : ${priorites} recommandation(s) « En priorité »`);
    const chev = chevauchements(fichier);
    constat(chev.length === 0, `${prenom} : aucun texte superposé${chev.length ? ` (${chev.slice(0, 3).join(' ; ')})` : ''}`);
    constat(texte.includes('Votre réponse :'), `${prenom} : réponses du vendeur en clair sous chaque recommandation`);
    temps.sort((a, b) => a - b);
    console.log(`  temps de fabrication (serveur local, 5 appels) : médiane ${Math.round(temps[2])} ms, plus rapide ${Math.round(temps[0])} ms`);
    execFileSync('pdftoppm', ['-png', '-r', '60', fichier, path.join(OUT, prenom)]);

    // 4. Liens refusés : empreinte modifiée, expiré (même signé), signature d'un guide, lead inconnu.
    const passe = Math.floor(Date.now() / 1000) - 60;
    const refus = [
      ['empreinte modifiée', `${lien.slice(0, -2)}xx`],
      ['expiré', `${U}/api/diagnostic/rapport?l=${lead.id}&e=${passe}&s=${signe(`rapport.${lead.id}.${passe}`)}`],
      ['signature de guide', `${U}/api/diagnostic/rapport?l=${lead.id}&e=${fin}&s=${signe(`guide.${lead.id}.${fin}`)}`],
      ['lead inconnu', `${U}/api/diagnostic/rapport?l=${sid()}&e=${fin}&s=${signe(`rapport.${'X'}.${fin}`)}`],
      ['sans paramètre', `${U}/api/diagnostic/rapport`],
    ];
    const statuts = await Promise.all(refus.map(([, x]) => appeler(x).then(async (k) => [k.status, (await k.text()).includes("Ce lien n'est plus valable")])));
    constat(statuts.every(([s, t]) => s === 404 && t), `${prenom} : 404 « Ce lien n'est plus valable » pour ${refus.map(([n]) => n).join(', ')}`);
  }
} finally {
  await arreter();
}
console.log(echecs ? `\n${echecs} constat(s) en échec.` : '\nTous les constats sont bons. Rapports et captures dans .verif/rapport/.');
process.exit(echecs ? 1 : 0);
