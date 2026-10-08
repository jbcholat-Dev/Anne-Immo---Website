// Fabrique le PDF du guide « Les 10 erreurs fatales » à la charte (story 10.5, en attendant la story 7.8) :
// le texte de contenu-anne/guide/texte-actuel.md, sans les notes « ⚠️ à vérifier » ni l'en-tête de travail, mis en page
// avec les couleurs et les polices du site, puis imprimé en PDF par le navigateur d'essai (Playwright).
// Le PDF est rangé dans site/prive/, hors du dossier public : il n'est servi que par un lien signé (/api/guide/telecharger).
// Tant qu'Anne n'a pas relu le texte, il porte la mention « version provisoire » (statut dans contenu-anne/guide/guide.md).
// Lancer : `node scripts/guide-pdf.mjs` (après chaque correction du texte), puis committer site/prive/guide.pdf.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ICI } from './serveur-essai.mjs';

const RACINE = path.resolve(ICI, '..');
const SOURCE = path.join(RACINE, 'contenu-anne/guide/texte-actuel.md');
const FICHE = path.join(RACINE, 'contenu-anne/guide/guide.md');
const SORTIE = path.join(ICI, 'prive/guide.pdf');
const POLICES = path.join(ICI, 'public/fonts');

const statut = /^statut:\s*(\S+)/m.exec(fs.readFileSync(FICHE, 'utf8'))?.[1] ?? 'brouillon';
const provisoire = statut !== 'publie';

const echapper = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const enLigne = (t) => echapper(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');

// Markdown simple du texte d'Anne : titres ##, listes « - », citations « > », paragraphes.
function versHtml(md) {
  const lignes = md.split('\n');
  const debut = lignes.findIndex((l) => l.startsWith('## Couverture'));
  const blocs = [];
  let liste = null;
  let para = [];
  const fermer = () => {
    if (para.length) { blocs.push(`<p>${enLigne(para.join(' '))}</p>`); para = []; }
    if (liste) { blocs.push(`<ul>${liste.map((li) => `<li>${enLigne(li)}</li>`).join('')}</ul>`); liste = null; }
  };
  for (const l of lignes.slice(debut + 1)) {
    if (l.startsWith('> ⚠️') || l.trim() === '---') { fermer(); continue; }
    if (l.startsWith('## ')) { fermer(); blocs.push(`<h2>${enLigne(l.slice(3))}</h2>`); continue; }
    if (l.startsWith('### ')) { fermer(); blocs.push(`<h3>${enLigne(l.slice(4))}</h3>`); continue; }
    if (/^- \[ \] /.test(l)) { if (para.length) fermer(); (liste ??= []).push(`☐ ${l.slice(6)}`); continue; }
    if (l.startsWith('- ')) { if (para.length) fermer(); (liste ??= []).push(l.slice(2)); continue; }
    if (l.startsWith('> ')) { fermer(); blocs.push(`<blockquote>${enLigne(l.slice(2))}</blockquote>`); continue; }
    if (!l.trim()) { fermer(); continue; }
    para.push(l.trim());
  }
  fermer();
  return blocs.join('\n');
}

// La couverture : les trois premières lignes après « ## Couverture ».
const md = fs.readFileSync(SOURCE, 'utf8');
const [titre, sousTitre, auteur] = md.split('## Couverture')[1].split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('>')).slice(0, 3)
  .map((l) => l.replace(/\*\*/g, ''));
const corps = versHtml(md.slice(md.indexOf('## Pourquoi') - 1));
const police = (nom, fichier, poids, style = 'normal') =>
  `@font-face{font-family:'${nom}';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(POLICES, fichier)).toString('base64')}) format('woff2');font-weight:${poids};font-style:${style}}`;
const logo = fs.readFileSync(path.join(RACINE, 'design-system/assets/logo-horizontal-descripteur.svg'), 'utf8');

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${echapper(titre)}</title><style>
${police('Italiana', 'italiana-400.woff2', 400)}${police('DM Sans', 'dm-sans-400-normal.woff2', 400)}${police('DM Sans', 'dm-sans-500-normal.woff2', 500)}${police('DM Sans', 'dm-sans-700-normal.woff2', 700)}${police('DM Sans', 'dm-sans-400-italic.woff2', 400, 'italic')}
@page { size: A4; margin: 22mm 20mm 24mm; }
body { font-family: 'DM Sans', sans-serif; color: #26201A; font-size: 10.5pt; line-height: 1.6; margin: 0; }
.couverture { height: 245mm; display: flex; flex-direction: column; justify-content: space-between; break-after: page; }
.couverture .logo svg { width: 62mm; height: auto; }
.couverture h1 { font-family: 'Italiana', serif; font-weight: 400; font-size: 40pt; line-height: 1.08; color: #002FA7; margin: 0 0 8mm; }
.couverture .sous { font-size: 14pt; line-height: 1.4; max-width: 120mm; }
.couverture .ligne { width: 40mm; height: 2px; background: #C4623E; margin: 10mm 0; }
.couverture .auteur { font-size: 11pt; color: #6B6157; }
.provisoire { font-size: 9pt; color: #A34E30; letter-spacing: .08em; text-transform: uppercase; }
h2 { font-family: 'Italiana', serif; font-weight: 400; font-size: 22pt; line-height: 1.15; color: #002FA7; margin: 12mm 0 4mm; break-after: avoid; }
h2:first-child { margin-top: 0; }
h3 { font-size: 11pt; margin: 6mm 0 2mm; break-after: avoid; }
p { margin: 0 0 3mm; }
ul { margin: 0 0 4mm; padding-left: 5mm; }
li { margin-bottom: 1.2mm; }
strong { font-weight: 700; }
blockquote { margin: 4mm 0; padding: 4mm 6mm; background: #E7EDF9; border-radius: 3mm; font-style: italic; }
</style></head><body>
<section class="couverture">
  <div class="logo">${logo}</div>
  <div><h1>${echapper(titre)}</h1><div class="sous">${echapper(sousTitre)}</div><div class="ligne"></div><div class="auteur">${echapper(auteur)}</div></div>
  <div>${provisoire ? '<div class="provisoire">Version provisoire, en cours de relecture par Anne</div>' : ''}<div class="auteur">annevialtissot.fr</div></div>
</section>
${corps}
</body></html>`;

const navigateur = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
const page = await navigateur.newPage();
await page.setContent(html, { waitUntil: 'load' });
fs.mkdirSync(path.dirname(SORTIE), { recursive: true });
await page.pdf({
  path: SORTIE, format: 'A4', printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `<div style="font-family:sans-serif;font-size:7.5pt;color:#6B6157;width:100%;padding:0 20mm;display:flex;justify-content:space-between"><span>Anne VIAL-TISSOT · annevialtissot.fr${provisoire ? ' · version provisoire' : ''}</span><span class="pageNumber"></span></div>`,
});
await navigateur.close();
console.log(`${path.relative(RACINE, SORTIE)} : ${Math.round(fs.statSync(SORTIE).size / 1024)} Ko, ${provisoire ? 'version provisoire' : 'version relue'}.`);
