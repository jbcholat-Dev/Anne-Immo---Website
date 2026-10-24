// Fabrique le gabarit du rapport PDF du diagnostic (story 10.10) : toutes les pages possibles du rapport, mises en page à
// la charte par le navigateur d'essai (Playwright), avec des emplacements vides là où le serveur écrira ce qui est propre
// au vendeur (prénom, date, scores, barres, étiquettes « En priorité », réponses, liste des priorités, pied de page).
// Le serveur (src/server/rapport.ts) choisit les pages qui correspondent au vendeur (couverture de son profil, une partie
// par axe au niveau atteint, suite A ou B), puis écrit dans les emplacements.
//   - prive/rapport/gabarit.pdf : les pages ;
//   - src/server/rapport-gabarit.json : où se trouve chaque partie et chaque emplacement (en points PDF, depuis le haut).
// Sources : contenu-anne/guide/rapport-diagnostic.md (textes d'Anne), src/content/diagnostic/feedbacks.json (constats),
// bareme.json (profils). À relancer après chaque changement de ces textes : `node scripts/rapport-gabarit.mjs`, puis
// committer les deux fichiers. L'empreinte des sources est rangée dans le JSON ; e2e-rapport.mjs signale un gabarit périmé.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';
import { ICI } from './serveur-essai.mjs';

const RACINE = path.resolve(ICI, '..');
const SOURCES = ['../contenu-anne/guide/rapport-diagnostic.md', 'src/content/diagnostic/feedbacks.json', 'src/content/diagnostic/bareme.json', 'scripts/rapport-gabarit.mjs'];
export const empreinteSources = () => createHash('sha256').update(SOURCES.map((f) => fs.readFileSync(path.join(ICI, f))).join('\0')).digest('hex').slice(0, 16);

const lire = (f) => JSON.parse(fs.readFileSync(path.join(ICI, f), 'utf8'));
const bareme = lire('src/content/diagnostic/bareme.json');
const feedbacks = lire('src/content/diagnostic/feedbacks.json');
const NOMS = { preparation: 'Préparation à la vente', visibilite: 'Visibilité & Attractivité', efficacite: 'Efficacité commerciale' };
const MAX = { preparation: 40, visibilite: 40, efficacite: 20 };

// Les textes d'Anne : ## <axe> · <nom>, ### <question> · <titre>, « Guide : … », puis des puces ; Introduction et Conclusion.
export function lireRecommandations() {
  const md = fs.readFileSync(path.join(RACINE, 'contenu-anne/guide/rapport-diagnostic.md'), 'utf8').split(/^---$/m).slice(2).join('---');
  const sections = {};
  let axe = null, reco = null;
  for (const l of md.split('\n')) {
    let m;
    if ((m = /^## (\w+) · (.+)$/.exec(l)) || (m = /^## (.+)$/.exec(l))) { axe = m[1]; sections[axe] = []; reco = null; continue; }
    if ((m = /^### (q\d+) · (.+)$/.exec(l))) { reco = { q: m[1], titre: m[2], guide: '', puces: [] }; sections[axe].push(reco); continue; }
    if (reco && l.startsWith('Guide : ')) { reco.guide = l.slice(8); continue; }
    if (reco && l.startsWith('- ')) { reco.puces.push(l.slice(2)); continue; }
    if (!reco && axe && l.trim()) sections[axe].push(l.trim());
  }
  return sections;
}

const echapper = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const enLigne = (t) => echapper(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const police = (nom, fichier, poids) =>
  `@font-face{font-family:'${nom}';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(ICI, 'public/fonts', fichier)).toString('base64')}) format('woff2');font-weight:${poids}}`;
const logo = fs.readFileSync(path.join(RACINE, 'design-system/assets/logo-horizontal-descripteur.svg'), 'utf8').replace(/@import url\([^)]*\);/, '');
// Un emplacement de texte : sa largeur, sa ligne de base (mesurée par le petit <i>) et ce que le serveur doit y écrire.
const slot = (nom, largeur, taille, extra = '') => `<span class="slot" data-slot="${nom}" data-taille="${taille}" style="width:${largeur};font-size:${taille}pt${extra}"><i class="base"></i>&#8203;</span>`;

function main() {
  const s = lireRecommandations();
  const flux = []; // [{ cle, blocs: [html] }] : chaque partie, découpée en pages par le navigateur.
  for (const p of bareme.profils) {
    flux.push({ cle: `couverture/${p.id}`, fixe: true, blocs: [`<div class="couverture">
      <div class="logo">${logo}</div>
      <div><h1>Votre rapport de diagnostic</h1><div class="pour">${slot('pour', '160mm', 12)}</div><div class="filet"></div>
        <div class="chapeau">Votre score global</div><div class="score">${slot('score', '120mm', 64)}</div>
        <div class="pastille">${echapper(p.libelle)}</div><p class="profil">${echapper(p.texte)}</p>
        <div class="resume">${Object.keys(MAX).map((k) => `<div><div class="resume-rang"><span>${NOMS[k]}</span>${slot(`valeur_${k}`, '30mm', 10, ';text-align:right')}</div><div class="barre" data-slot="barre_${k}"></div></div>`).join('')}</div></div>
      <div class="pied-couv">Anne VIAL-TISSOT · Conseillère en immobilier · Chablais, Léman · www.annevialtissot.fr</div></div>`] });
  }
  flux.push({ cle: 'priorites', fixe: true, blocs: [`<h2>Par où commencer</h2>${s.Introduction.map((p) => `<p>${enLigne(p)}</p>`).join('')}<div class="liste" data-slot="liste"></div>`] });
  Object.keys(MAX).forEach((k, n) => {
    for (const b of ['faible', 'moyen', 'eleve']) {
      const fb = feedbacks[k][b];
      flux.push({ cle: `axe/${k}/${b}`, blocs: [
        `<div class="chapeau">Axe ${n + 1} sur 3</div><h2>${NOMS[k]}</h2>
         <div class="axe-score">${slot('score', '120mm', 30)}</div><div class="barre axe-barre" data-slot="barre"></div>
         <p class="insight">${echapper(fb.insight)}</p><div class="impact"><div class="chapeau">Impact chiffré</div><p>${echapper(fb.impact)}</p></div>`,
        '<h4>Mes recommandations</h4>',
        ...s[k].filter((x) => typeof x === 'object').map((x) => `<article class="reco" data-slot="carte_${x.q}">
          <div class="reco-tete"><h3>${enLigne(x.titre)}</h3><span class="badge" data-slot="badge_${x.q}"></span></div>
          <p class="reponse">${slot(`reponse_${x.q}`, '100%', 9)}</p>
          <ul>${x.puces.map((p) => `<li>${enLigne(p)}</li>`).join('')}</ul><p class="guide">Pour aller plus loin : guide « Les 10 erreurs fatales », ${echapper(x.guide)}</p></article>`),
      ] });
    }
  });
  for (const o of ['A', 'B']) {
    const sortie = feedbacks.sorties[o];
    flux.push({ cle: `suite/${o}`, blocs: [`<h2>${echapper(sortie.titre)}</h2><p>${echapper(sortie.texte)}</p>
      ${s.Conclusion.map((p) => `<p>${enLigne(p)}</p>`).join('')}
      <div class="cta"><h3>${o === 'A' ? 'Parlons de votre vente' : 'Un regard extérieur sur votre vente'}</h3><p>Rendez-vous stratégique de 30 minutes, gratuit et sans engagement : nous passons en revue vos priorités et je vous dis ce que je ferais à votre place.</p><p><b>www.annevialtissot.fr/contact</b> · ou répondez simplement à l'e-mail qui accompagne ce rapport.</p></div>
      <div class="signature"><b>Anne VIAL-TISSOT</b>Conseillère en immobilier · Chablais · Léman · réseau eXp France<br>www.annevialtissot.fr</div>`] });
  }
  return flux;
}

const CSS = `${police('Gilda Display', 'gilda-display-400.woff2', 400)}${police('Jost', 'jost-400-normal.woff2', 400)}${police('Jost', 'jost-500-normal.woff2', 500)}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
body { font-family: 'Jost', sans-serif; color: #26201A; font-size: 10.5pt; line-height: 1.55; margin: 0; }
.page { width: 210mm; height: 297mm; padding: 20mm 20mm 0; overflow: hidden; break-after: page; position: relative; }
.contenu { height: 255mm; overflow: hidden; }
.slot { display: inline-block; white-space: nowrap; line-height: 1.2; vertical-align: baseline; }
.base { display: inline-block; width: 0; height: 0; vertical-align: baseline; }
.couverture { height: 255mm; display: flex; flex-direction: column; justify-content: space-between; }
.couverture .logo svg { width: 64mm; height: auto; }
h1 { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 34pt; line-height: 1.1; color: #002FA7; margin: 0 0 4mm; }
.pour { color: #5C5248; } .pied-couv { font-size: 12pt; color: #5C5248; }
.filet { width: 40mm; height: 2px; background: #C4623E; margin: 8mm 0; }
.score { line-height: 1; margin: 2mm 0; }
.pastille { display: inline-block; padding: 1.5mm 4mm; border-radius: 99px; background: #E7EDF9; color: #002FA7; font-weight: 500; font-size: 10pt; margin: 4mm 0 3mm; }
.profil { max-width: 130mm; font-size: 11pt; }
.resume { display: grid; gap: 4mm; max-width: 130mm; margin-top: 8mm; }
.resume-rang { display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 1.5mm; }
.barre { height: 2.2mm; background: #E9E0D2; border-radius: 99px; }
h2 { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 24pt; line-height: 1.15; color: #002FA7; margin: 0 0 5mm; }
.liste { height: 175mm; margin-top: 6mm; }
.chapeau { font-size: 8.5pt; letter-spacing: .1em; text-transform: uppercase; color: #5C5248; margin-bottom: 2mm; }
.axe-score { margin-bottom: 2mm; line-height: 1; } .axe-barre { max-width: 90mm; margin-bottom: 6mm; }
.insight { font-size: 11pt; } .impact { background: #F7F2EA; border-left: 3px solid #C4623E; padding: 3mm 5mm; margin: 4mm 0 8mm; } .impact p { margin: 0; }
h4 { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 16pt; margin: 0 0 4mm; }
.reco { border: 1px solid #E9E0D2; border-radius: 3mm; padding: 4mm 5mm 3mm; margin-bottom: 4mm; }
.reco-tete { display: flex; justify-content: space-between; gap: 4mm; align-items: flex-start; } h3 { font-weight: 500; font-size: 11.5pt; margin: 0 0 1mm; }
.badge { flex: none; width: 27mm; height: 5mm; }
.reponse { margin: 0 0 2mm; color: #5C5248; line-height: 1.4; } .reponse .slot { display: block; }
ul { margin: 0 0 2mm; padding-left: 5mm; } li { margin-bottom: 1mm; } .guide { font-size: 8.5pt; color: #5C5248; margin: 0; }
p { margin: 0 0 3mm; }
.cta { background: #002FA7; color: #F7F2EA; border-radius: 3mm; padding: 7mm 8mm; margin: 6mm 0; } .cta h3 { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 18pt; margin: 0 0 3mm; } .cta b { font-weight: 500; }
.signature { margin-top: 10mm; } .signature b { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 14pt; display: block; }`;

// Dans le navigateur : remplit des pages A4 bloc par bloc, puis mesure chaque emplacement (en points, depuis le haut de sa page).
function paginer(flux) {
  const PT = 0.75;
  const corps = document.body;
  const pages = [];
  const parties = {};
  for (const f of flux) {
    const indices = [];
    let contenu = null;
    const nouvelle = () => {
      const p = document.createElement('div'); p.className = 'page';
      contenu = document.createElement('div'); contenu.className = 'contenu';
      p.append(contenu); corps.append(p); pages.push(p); indices.push(pages.length - 1);
    };
    nouvelle();
    for (const html of f.blocs) {
      const t = document.createElement('template'); t.innerHTML = html.trim();
      const noeuds = [...t.content.childNodes];
      noeuds.forEach((n) => contenu.append(n));
      if (contenu.scrollHeight > contenu.clientHeight + 1 && contenu.childNodes.length > noeuds.length && !f.fixe) {
        noeuds.forEach((n) => n.remove()); nouvelle(); noeuds.forEach((n) => contenu.append(n));
      }
    }
    parties[f.cle] = { pages: indices, debordement: indices.some((i) => pages[i].firstChild.scrollHeight > pages[i].firstChild.clientHeight + 1), emplacements: {} };
  }
  for (const [cle, partie] of Object.entries(parties)) {
    for (const i of partie.pages) {
      const r0 = pages[i].getBoundingClientRect();
      for (const el of pages[i].querySelectorAll('[data-slot]')) {
        const r = el.getBoundingClientRect();
        const base = el.querySelector(':scope > .base');
        partie.emplacements[el.dataset.slot] = {
          page: i, x: +((r.left - r0.left) * PT).toFixed(2), y: +((r.top - r0.top) * PT).toFixed(2), l: +(r.width * PT).toFixed(2), h: +(r.height * PT).toFixed(2),
          ...(base ? { base: +((base.getBoundingClientRect().bottom - r0.top) * PT).toFixed(2), taille: +el.dataset.taille } : {}),
        };
      }
    }
    void cle;
  }
  return { parties, nombre: pages.length };
}

const SORTIE_PDF = path.join(ICI, 'prive/rapport/gabarit.pdf');
const SORTIE_JSON = path.join(ICI, 'src/server/rapport-gabarit.json');
if (import.meta.url === `file://${process.argv[1]}`) {
  const flux = main();
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await navigateur.newPage({ viewport: { width: 794, height: 1123 } });
  await page.setContent(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rapport de diagnostic</title><style>${CSS}</style></head><body></body></html>`);
  // Mesurer dans les conditions de l'impression : média « print » et polices chargées avant toute mise en page
  // (sinon les blocs sont mesurés avec une police de secours plus large et les emplacements tombent trop bas).
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => Promise.all([...document.fonts].map((f) => f.load())));
  const { parties, nombre } = await page.evaluate(paginer, flux);
  await page.evaluate(() => document.fonts.ready);
  const debordes = Object.entries(parties).filter(([, p]) => p.debordement).map(([c]) => c);
  if (debordes.length) { console.error(`Texte trop long pour une page : ${debordes.join(', ')}`); process.exit(1); }
  fs.mkdirSync(path.dirname(SORTIE_PDF), { recursive: true });
  await page.pdf({ path: SORTIE_PDF, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await navigateur.close();
  const titres = Object.fromEntries(Object.values(lireRecommandations()).flat().filter((x) => typeof x === 'object').map((x) => [x.q, x.titre.replace(/\*\*/g, '')]));
  const json = { _source: 'Fabriqué par scripts/rapport-gabarit.mjs (story 10.10). Ne pas modifier à la main.', empreinte: empreinteSources(), page: [595.28, 841.89], nombre, titres, parties };
  fs.writeFileSync(SORTIE_JSON, `${JSON.stringify(json, null, 1)}\n`);
  console.log(`${path.relative(ICI, SORTIE_PDF)} : ${nombre} pages, ${Math.round(fs.statSync(SORTIE_PDF).size / 1024)} Ko ; ${path.relative(ICI, SORTIE_JSON)} écrit.`);
}
