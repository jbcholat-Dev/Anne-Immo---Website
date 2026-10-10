// Maquette du rapport PDF personnalisé du diagnostic (story 10.10), à relire par JB et Anne avant le branchement :
// deux vendeurs d'exemple (un profil fragile, sortie B ; un profil solide, sortie A), leurs réponses passées au barème,
// les constats par axe et par niveau (src/content/diagnostic/feedbacks.json) et les recommandations d'Anne
// (contenu-anne/guide/rapport-diagnostic.md), une par question, marquées « En priorité » quand le vendeur y a perdu des
// points (moins de la moitié des points de la question ; « À améliorer » entre la moitié et le maximum). Mis en page aux couleurs et aux polices du site, imprimé en PDF par le navigateur d'essai (Playwright).
// Sortie : .verif/rapport/<exemple>.pdf et une image par page (<exemple>-pN.png).
// Lancer : `node scripts/maquette-rapport.mjs`. La fabrication réelle (pages préparées puis complétées par le serveur)
// viendra après validation.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { ICI } from './serveur-essai.mjs';

const RACINE = path.resolve(ICI, '..');
const OUT = path.join(ICI, '.verif/rapport');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const lire = (f) => JSON.parse(fs.readFileSync(path.join(ICI, f), 'utf8'));
const bareme = lire('src/content/diagnostic/bareme.json');
const feedbacks = lire('src/content/diagnostic/feedbacks.json');
const contenu = lire('src/content/diagnostic/questions.json');
const ecrans = Object.fromEntries(contenu.ecrans.map((e) => [e.id, e]));
const NOMS = { preparation: 'Préparation à la vente', visibilite: 'Visibilité & Attractivité', efficacite: 'Efficacité commerciale' };
const MAX = { preparation: 40, visibilite: 40, efficacite: 20 };
const MAX_Q = { q10: 10 };

// Même calcul que src/server/scoring.ts.
function pointsQuestion(q, r) {
  const rep = r[q] ?? [];
  if (q === 'q07') { const n = rep.filter((x) => x !== 'q07.i').length; return n >= 6 ? bareme.q07_par_nombre['6+'] : (bareme.q07_par_nombre[String(n)] ?? 0); }
  if (q === 'q10') return bareme.q10_matrice[r.q10a?.[0]]?.[r.q10b?.[0]] ?? 0;
  return rep.reduce((s, id) => s + (bareme.points[id] ?? 0), 0);
}
const bande = (p) => (p <= 40 ? 'faible' : p <= 70 ? 'moyen' : 'eleve');
const libelle = (id) => { const e = ecrans[id.split('.')[0]]; return e?.options.find((o) => o.id === id)?.libelle ?? id; };
function reponseLisible(q, r) {
  if (q === 'q07') { const n = (r.q07 ?? []).filter((x) => x !== 'q07.i'); return n.length ? `${n.map(libelle).join(', ')} (${n.length} plateforme${n.length > 1 ? 's' : ''})` : 'Aucune diffusion active'; }
  if (q === 'q10') return `${libelle(r.q10a[0])}, ${libelle(r.q10b[0]).toLowerCase()}`;
  return (r[q] ?? []).map(libelle).join(', ');
}

// Les recommandations d'Anne : ## <axe> · <nom>, ### <question> · <titre>, « Guide : … », puis des puces.
const md = fs.readFileSync(path.join(RACINE, 'contenu-anne/guide/rapport-diagnostic.md'), 'utf8').split(/^---$/m).slice(2).join('---');
const sections = {};
let axe = null, reco = null;
for (const l of md.split('\n')) {
  let m;
  if ((m = /^## (\w+) · (.+)$/.exec(l))) { axe = m[1]; sections[axe] = []; reco = null; continue; }
  if ((m = /^## (.+)$/.exec(l))) { axe = m[1]; sections[axe] = []; reco = null; continue; }
  if ((m = /^### (q\d+) · (.+)$/.exec(l))) { reco = { q: m[1], titre: m[2], guide: '', puces: [] }; sections[axe].push(reco); continue; }
  if (reco && l.startsWith('Guide : ')) { reco.guide = l.slice(8); continue; }
  if (reco && l.startsWith('- ')) { reco.puces.push(l.slice(2)); continue; }
  if (!reco && axe && l.trim()) sections[axe].push(l.trim());
}

const exemples = [
  { nom: 'exemple-sortie-b', prenom: 'Claire', nom_famille: 'Martin', reponses: {
    q01: ['q01.c'], q02: ['q02.b'], q03: ['q03.b'], q04: ['q04.a'], q05: ['q05.d'], q06: ['q06.b'], q07: ['q07.a', 'q07.g'], q08: ['q08.c'],
    q09: ['q09.b'], q10a: ['q10a.b'], q10b: ['q10b.a'], q12: ['q12.d'], q14: ['q14.b'] } },
  { nom: 'exemple-sortie-a', prenom: 'Marc', nom_famille: 'Durand', reponses: {
    q01: ['q01.b'], q02: ['q02.a'], q03: ['q03.a'], q04: ['q04.b'], q05: ['q05.b'], q06: ['q06.a'], q07: ['q07.a', 'q07.b', 'q07.c', 'q07.d'], q08: ['q08.b'],
    q09: ['q09.a'], q10a: ['q10a.a'], q10b: ['q10b.b'], q12: ['q12.a'], q14: ['q14.a'] } },
];

const echapper = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const enLigne = (t) => echapper(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
const police = (nom, fichier, poids, style = 'normal') =>
  `@font-face{font-family:'${nom}';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(ICI, 'public/fonts', fichier)).toString('base64')}) format('woff2');font-weight:${poids};font-style:${style}}`;
const logo = fs.readFileSync(path.join(RACINE, 'design-system/assets/logo-horizontal-descripteur.svg'), 'utf8').replace(/@import url\([^)]*\);/, '');
const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

function rapport(ex) {
  const r = ex.reponses;
  const axes = Object.entries(bareme.categories).map(([k, qs]) => {
    const brut = qs.reduce((s, q) => s + pointsQuestion(q, r), 0);
    const pourcent = Math.round((brut / MAX[k]) * 100);
    return { k, brut, max: MAX[k], pourcent, bande: bande(pourcent), qs };
  });
  const total = axes.reduce((s, a) => s + a.brut, 0);
  const profil = bareme.profils.find((p) => total >= p.min && total <= p.max);
  const A = total >= bareme.orientation.seuil_a && r.q14?.includes(bareme.orientation.premium) && !r.q12?.includes(bareme.orientation.force_b);
  const sortie = feedbacks.sorties[A ? 'A' : 'B'];
  const priorites = [];
  const pageAxe = (a) => {
    const fb = feedbacks[a.k][a.bande];
    const recos = sections[a.k].filter((x) => typeof x === 'object').map((x) => {
      const pts = pointsQuestion(x.q, r), max = MAX_Q[x.q] ?? 10, prio = pts < max / 2, plein = pts >= max;
      if (prio) priorites.push({ ...x, axe: NOMS[a.k] });
      return `<article class="reco${prio ? ' prio' : ''}"><div class="reco-tete"><h3>${enLigne(x.titre)}</h3>${prio ? '<span class="badge">En priorité</span>' : plein ? '<span class="badge ok">Point solide</span>' : '<span class="badge moyen">À améliorer</span>'}</div>
        <p class="reponse">Votre réponse : ${echapper(reponseLisible(x.q, r))} · ${pts} / ${max} points</p>
        <ul>${x.puces.map((p) => `<li>${enLigne(p)}</li>`).join('')}</ul><p class="guide">Pour aller plus loin : guide « Les 10 erreurs fatales », ${echapper(x.guide.replace(/^erreur/, 'erreur'))}</p></article>`;
    }).join('');
    return `<section class="axe"><div class="chapeau">Axe ${axes.indexOf(a) + 1} sur 3</div><h2>${NOMS[a.k]}</h2>
      <div class="axe-score"><b>${a.brut}</b><span>/ ${a.max} · ${a.pourcent} %</span></div><div class="barre"><div style="width:${a.pourcent}%"></div></div>
      <p class="insight">${echapper(fb.insight)}</p><div class="impact"><div class="chapeau">Impact chiffré</div><p>${echapper(fb.impact)}</p></div>
      <h4>Mes recommandations</h4>${recos}</section>`;
  };
  const pagesAxes = axes.map(pageAxe).join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Rapport de diagnostic · ${echapper(ex.prenom)} ${echapper(ex.nom_famille)}</title><style>
${police('Gilda Display', 'gilda-display-400.woff2', 400)}${police('Jost', 'jost-400-normal.woff2', 400)}${police('Jost', 'jost-500-normal.woff2', 500)}
@page { size: A4; margin: 20mm 20mm 22mm; }
body { font-family: 'Jost', sans-serif; color: #26201A; font-size: 10.5pt; line-height: 1.55; margin: 0; }
.couverture { height: 250mm; display: flex; flex-direction: column; justify-content: space-between; break-after: page; }
.couverture .logo svg { width: 64mm; height: auto; }
h1 { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 34pt; line-height: 1.1; color: #002FA7; margin: 0 0 4mm; }
.pour { font-size: 12pt; color: #5C5248; }
.filet { width: 40mm; height: 2px; background: #C4623E; margin: 8mm 0; }
.score { display: flex; align-items: baseline; gap: 3mm; } .score b { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 64pt; line-height: 1; color: #002FA7; } .score span { font-size: 16pt; color: #5C5248; }
.pastille { display: inline-block; padding: 1.5mm 4mm; border-radius: 99px; background: #E7EDF9; color: #002FA7; font-weight: 500; font-size: 10pt; margin: 4mm 0 3mm; }
.profil { max-width: 130mm; font-size: 11pt; }
.resume { display: grid; gap: 4mm; max-width: 130mm; margin-top: 8mm; }
.resume-rang { display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 1.5mm; } .resume-rang b { font-weight: 500; }
.barre { height: 2.2mm; background: #E9E0D2; border-radius: 99px; overflow: hidden; } .barre div { height: 100%; background: #C4623E; border-radius: 99px; }
.intro { break-after: page; } .intro h2, .axe h2, .suite h2 { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 24pt; line-height: 1.15; color: #002FA7; margin: 0 0 5mm; }
.priorites { margin: 6mm 0 0; padding: 0; list-style: none; counter-reset: p; } .priorites li { counter-increment: p; display: flex; gap: 4mm; padding: 3mm 0; border-bottom: 1px solid #E9E0D2; }
.priorites li::before { content: counter(p); flex: none; width: 7mm; height: 7mm; border-radius: 99px; background: #C4623E; color: #fff; font-weight: 500; display: grid; place-items: center; font-size: 9pt; }
.priorites small { display: block; color: #5C5248; }
.axe { break-before: page; } .chapeau { font-size: 8.5pt; letter-spacing: .1em; text-transform: uppercase; color: #5C5248; margin-bottom: 2mm; }
.axe-score { display: flex; align-items: baseline; gap: 2mm; margin-bottom: 2mm; } .axe-score b { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 30pt; color: #002FA7; line-height: 1; } .axe-score span { color: #5C5248; }
.axe .barre { max-width: 90mm; margin-bottom: 6mm; }
.insight { font-size: 11pt; } .impact { background: #F7F2EA; border-left: 3px solid #C4623E; padding: 3mm 5mm; margin: 4mm 0 8mm; } .impact p { margin: 0; }
h4 { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 16pt; margin: 0 0 4mm; color: #26201A; }
.reco { border: 1px solid #E9E0D2; border-radius: 3mm; padding: 4mm 5mm 3mm; margin-bottom: 4mm; break-inside: avoid; } .reco.prio { border-color: #C4623E; border-left-width: 3px; }
.reco-tete { display: flex; justify-content: space-between; gap: 4mm; align-items: baseline; } h3 { font-weight: 500; font-size: 11.5pt; margin: 0 0 1mm; }
.badge { flex: none; font-size: 8pt; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; color: #fff; background: #C4623E; border-radius: 99px; padding: .8mm 3mm; } .badge.ok { background: #E7EDF9; color: #002FA7; } .badge.moyen { background: #F7F2EA; color: #A34E30; }
.reponse { font-size: 9pt; color: #5C5248; margin: 0 0 2mm; } ul { margin: 0 0 2mm; padding-left: 5mm; } li { margin-bottom: 1mm; } .guide { font-size: 8.5pt; color: #5C5248; margin: 0; }
.suite { break-before: page; } .cta { background: #002FA7; color: #F7F2EA; border-radius: 3mm; padding: 7mm 8mm; margin: 6mm 0; } .cta h3 { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 18pt; margin: 0 0 3mm; } .cta p { margin: 0 0 3mm; } .cta b { font-weight: 500; }
.signature { margin-top: 10mm; } .signature b { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 14pt; display: block; }
</style></head><body>
<section class="couverture">
  <div class="logo">${logo}</div>
  <div><h1>Votre rapport de diagnostic</h1><div class="pour">Préparé pour ${echapper(ex.prenom)} ${echapper(ex.nom_famille)} · ${date}</div><div class="filet"></div>
    <div class="chapeau">Votre score global</div><div class="score"><b>${total}</b><span>/ 100</span></div>
    <div class="pastille">${echapper(profil.libelle)}</div><p class="profil">${echapper(profil.texte)}</p>
    <div class="resume">${axes.map((a) => `<div><div class="resume-rang"><span>${NOMS[a.k]}</span><b>${a.brut} / ${a.max}</b></div><div class="barre"><div style="width:${a.pourcent}%"></div></div></div>`).join('')}</div></div>
  <div class="pour">Anne VIAL-TISSOT · Conseillère en immobilier · Chablais, Léman · annevialtissot.fr</div>
</section>
@@INTRO@@
${pagesAxes}
<section class="suite"><h2>${echapper(sortie.titre)}</h2><p>${echapper(sortie.texte)}</p>
  ${sections.Conclusion.map((p) => `<p>${enLigne(p)}</p>`).join('')}
  <div class="cta"><h3>${A ? 'Parlons de votre vente' : 'Un regard extérieur sur votre vente'}</h3><p>Rendez-vous stratégique de 30 minutes, gratuit et sans engagement : nous passons en revue vos priorités et je vous dis ce que je ferais à votre place.</p><p><b>annevialtissot.fr/contact</b> · ou répondez simplement à l'e-mail qui accompagne ce rapport.</p></div>
  <div class="signature"><b>Anne VIAL-TISSOT</b>Conseillère en immobilier · Chablais · Léman · réseau eXp France<br>annevialtissot.fr</div>
</section>
</body></html>`.replace('@@INTRO@@', `<section class="intro"><h2>Par où commencer</h2>${sections.Introduction.map((p) => `<p>${enLigne(p)}</p>`).join('')}
  ${priorites.length ? `<ol class="priorites">${priorites.map((p) => `<li><div>${enLigne(p.titre)}<small>${p.axe}</small></div></li>`).join('')}</ol>` : '<p>Aucun point faible marqué : vos priorités sont des ajustements fins, détaillés axe par axe.</p>'}</section>`);
}

const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const ex of exemples) {
  const page = await navigateur.newPage();
  await page.setContent(rapport(ex), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const pdf = path.join(OUT, `${ex.nom}.pdf`);
  await page.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-family:sans-serif;font-size:7.5pt;color:#5C5248;width:100%;padding:0 20mm;display:flex;justify-content:space-between"><span>Rapport de diagnostic · ${ex.prenom} ${ex.nom_famille} · annevialtissot.fr</span><span class="pageNumber"></span></div>` });
  await page.close();
  execFileSync('pdftoppm', ['-png', '-r', '70', pdf, path.join(OUT, ex.nom)]);
  const pages = fs.readdirSync(OUT).filter((f) => f.startsWith(`${ex.nom}-`) && f.endsWith('.png')).length;
  console.log(`${ex.nom}.pdf : ${Math.round(fs.statSync(pdf).size / 1024)} Ko, ${pages} pages`);
}
await navigateur.close();
