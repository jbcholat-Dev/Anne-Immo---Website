// Fabrique le PDF du guide « Les 10 erreurs fatales » à la charte (story 10.5, en attendant la story 7.8) :
// le texte de contenu-anne/guide/texte-actuel.md, sans les notes « ⚠️ à vérifier » ni l'en-tête de travail, mis en page
// avec les couleurs et les polices du site, puis imprimé en PDF par le navigateur d'essai (Playwright).
// Le PDF est rangé dans site/prive/, hors du dossier public : il n'est servi que par un lien signé (/api/guide/telecharger).
// Tant qu'Anne n'a pas relu le texte, il porte la mention « version provisoire » (statut dans contenu-anne/guide/guide.md).
// Fait aussi l'image de la couverture pour la page /guide (site/public/img/guide-couverture.jpg).
// Lancer : `node scripts/guide-pdf.mjs` (après chaque correction du texte), puis committer site/prive/guide.pdf et l'image.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ICI } from './serveur-essai.mjs';

const RACINE = path.resolve(ICI, '..');
const SOURCE = path.join(RACINE, 'contenu-anne/guide/texte-actuel.md');
const FICHE = path.join(RACINE, 'contenu-anne/guide/guide.md');
const SORTIE = path.join(ICI, 'prive/guide.pdf');
const COUVERTURE = path.join(ICI, 'public/img/guide-couverture.jpg');
const POLICES = path.join(ICI, 'public/fonts');

const statut = /^statut:\s*(\S+)/m.exec(fs.readFileSync(FICHE, 'utf8'))?.[1] ?? 'brouillon';
const provisoire = statut !== 'publie';

const echapper = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const enLigne = (t) => echapper(t).replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>');

// Markdown simple du texte d'Anne : titres ##, listes « - » et « 1. », tableaux, citations « > », paragraphes.
function versHtml(md) {
  const lignes = md.split('\n');
  const debut = lignes.findIndex((l) => l.startsWith('## Couverture'));
  const blocs = [];
  let liste = null;
  let balise = 'ul';
  let para = [];
  let tableau = null;
  let annonce = null;
  const fermer = () => {
    // Exemple d'annonce « ❌ Avant » / « ✅ Après » : une ligne = un paragraphe, la première ligne en gras = le titre de l'annonce.
    if (annonce) {
      const [premiere, ...suite] = annonce.lignes;
      const titreAnnonce = /^\*\*.+\*\*$/.test(premiere ?? '') ? `<div class="annonce-titre">${enLigne(premiere.replace(/\*\*/g, ''))}</div>` : '';
      const textes = (titreAnnonce ? suite : annonce.lignes).map((t) => `<p>${enLigne(t.replace(/^«\s*|\s*»$/g, ''))}</p>`).join('');
      blocs.push(`<div class="annonce annonce-${annonce.genre}"><span class="etiquette">${annonce.genre === 'avant' ? 'Avant · l’annonce catalogue' : 'Après · l’annonce qui raconte'}</span>${titreAnnonce}${textes}</div>`);
      annonce = null;
    }
    if (para.length) { blocs.push(`<p>${enLigne(para.join(' '))}</p>`); para = []; }
    if (tableau) {
      const [entete, ...rangs] = tableau.map((r) => r.replace(/^\||\|$/g, '').split('|').map((c) => enLigne(c.trim())));
      // Un intertitre juste au-dessus reste sur la même page que son tableau.
      const titre = /^<(h3|p><strong)>/.test(blocs.at(-1) ?? '') ? blocs.pop() : '';
      blocs.push(`<div class="bloc-tableau">${titre}<table><thead><tr>${entete.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rangs.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      tableau = null;
    }
    if (liste) { blocs.push(`<${balise}>${liste.map((li) => `<li>${enLigne(li)}</li>`).join('')}</${balise}>`); liste = null; }
  };
  for (const l of lignes.slice(debut + 1)) {
    const exemple = /^\*\*(❌ Avant|✅ Après)\*\*$/.exec(l.trim());
    if (exemple) { fermer(); annonce = { genre: exemple[1].includes('Avant') ? 'avant' : 'apres', lignes: [] }; continue; }
    if (annonce && l.trim() && !/^(\d+\. |- |## |### |\|)/.test(l)) { annonce.lignes.push(l.trim()); continue; }
    if (annonce) fermer();
    if (l.startsWith('> ⚠️') || l.trim() === '---') { fermer(); continue; }
    if (l.startsWith('## ')) { fermer(); blocs.push(`<h2>${enLigne(l.slice(3))}</h2>`); continue; }
    if (l.startsWith('### ')) { fermer(); blocs.push(`<h3>${enLigne(l.slice(4))}</h3>`); continue; }
    if (/^- \[ \] /.test(l)) { if (para.length) fermer(); (liste ??= []).push(`☐ ${l.slice(6)}`); continue; }
    if (l.startsWith('- ')) { if (para.length || balise !== 'ul') fermer(); balise = 'ul'; (liste ??= []).push(l.slice(2)); continue; }
    if (/^\d+\. /.test(l)) { if (para.length || (liste && balise !== 'ol')) fermer(); balise = 'ol'; (liste ??= []).push(l.replace(/^\d+\. /, '')); continue; }
    if (l.startsWith('|')) { if (!tableau) fermer(); if (!/^\|[\s:|-]+\|$/.test(l.trim())) (tableau ??= []).push(l.trim()); continue; }
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
// Une page par partie (demande de JB du 2026-10-10) : l'introduction et son sommaire, chaque erreur, la conclusion, la checklist.
// Chaque erreur porte son axe du diagnostic, le même que dans le rapport personnalisé (story 10.10), pour que les deux documents se répondent.
const AXES = { preparation: 'Préparation à la vente', visibilite: 'Visibilité & Attractivité', efficacite: 'Efficacité commerciale' };
const AXE_ERREUR = { 1: 'preparation', 2: 'preparation', 3: 'preparation', 4: 'preparation', 5: 'visibilite', 6: 'visibilite', 7: 'visibilite', 8: 'visibilite', 9: 'efficacite', 10: 'efficacite' };
const majuscule = (t) => t.charAt(0).toUpperCase() + t.slice(1);
// Encadrés : un « cas réel » sur fond sable, « la solution » sur fond bleu pâle, comme les blocs du rapport.
const encadres = (h) => h
  .replace(/<p><strong>(Cas réel[^<]*)<\/strong>/g, '<p class="cas"><span class="etiquette">Cas réel</span><strong>$1</strong>')
  .replace(/<p><strong>(La solution\.?)<\/strong>/g, '<p class="solution"><span class="etiquette">La solution</span>');
const parties = md.slice(md.indexOf('## Pourquoi')).split(/^(?=## )/m).filter((p) => p.trim());
const erreurs = [];
const corps = parties.map((partie) => {
  const [tete, ...reste] = partie.split('\n');
  const titre = tete.replace(/^## /, '').trim();
  const contenu = encadres(versHtml(reste.join('\n')));
  const m = /^Erreur n° (\d+) : (.+)$/.exec(titre);
  if (m) {
    const n = Number(m[1]);
    erreurs.push({ n, titre: majuscule(m[2]) });
    return `<section class="partie erreur"><div class="surtitre">Erreur n° ${n} sur 10 · ${AXES[AXE_ERREUR[n]]}</div><h2>${enLigne(majuscule(m[2]))}</h2>${contenu}</section>`;
  }
  return `<section class="partie"><h2>${enLigne(titre)}</h2>${contenu}<!--sommaire:${titre.startsWith('Pourquoi') ? 'oui' : ''}--></section>`;
}).join('\n').replace('<!--sommaire:oui-->', () => `<div class="sommaire"><h3>Au sommaire</h3>${Object.entries(AXES).map(([cle, nom]) =>
  `<div class="axe"><div class="surtitre">${nom}</div><ol>${erreurs.filter((e) => AXE_ERREUR[e.n] === cle).map((e) => `<li value="${e.n}">${enLigne(e.titre)}</li>`).join('')}</ol></div>`).join('')}</div>`)
  .replace(/<!--sommaire:-->/g, '');
const police = (nom, fichier, poids, style = 'normal') =>
  `@font-face{font-family:'${nom}';src:url(data:font/woff2;base64,${fs.readFileSync(path.join(POLICES, fichier)).toString('base64')}) format('woff2');font-weight:${poids};font-style:${style}}`;
const logo = fs.readFileSync(path.join(RACINE, 'design-system/assets/logo-horizontal-descripteur.svg'), 'utf8');

// En-tête et pied de page : boîtes de marge CSS (@page), aux polices du document ; aucune sur la couverture (@page :first).
const symbole = `data:image/svg+xml;base64,${Buffer.from(fs.readFileSync(path.join(RACINE, 'design-system/assets/symbole-seul.svg'), 'utf8').replace('<svg ', '<svg width="13" height="13" ')).toString('base64')}`;
const marges = `
@page { size: A4; margin: 30mm 20mm 24mm;
  @top-left { content: url("${symbole}") "  Anne VIAL-TISSOT"; font-family: 'Gilda Display', serif; font-size: 9pt; color: #26201A; vertical-align: bottom; padding-bottom: 2.5mm; margin-bottom: 7mm; border-bottom: .5pt solid #E9E0D2; }
  @top-right { content: "Les 10 erreurs des vendeurs"; font-family: 'Jost', sans-serif; font-size: 7pt; letter-spacing: .12em; text-transform: uppercase; color: #5C5248; vertical-align: bottom; padding-bottom: 2.5mm; margin-bottom: 7mm; border-bottom: .5pt solid #E9E0D2; }
  @bottom-left { content: "annevialtissot.fr${provisoire ? '  ·  version provisoire' : ''}"; font-family: 'Jost', sans-serif; font-size: 7.5pt; color: #5C5248; vertical-align: top; padding-top: 2.5mm; margin-top: 7mm; border-top: .5pt solid #E9E0D2; }
  @bottom-right { content: "— " counter(page) " / " counter(pages); font-family: 'Gilda Display', serif; font-size: 10pt; color: #002FA7; vertical-align: top; padding-top: 2mm; margin-top: 7mm; border-top: .5pt solid #E9E0D2; }
}
@page :first { margin: 0; @top-left { content: none; } @top-right { content: none; } @bottom-left { content: none; } @bottom-right { content: none; } }`;

const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${echapper(titre)}</title><style>
${police('Gilda Display', 'gilda-display-400.woff2', 400)}${police('Jost', 'jost-400-normal.woff2', 400)}${police('Jost', 'jost-500-normal.woff2', 500)}${police('Jost', 'jost-400-italic.woff2', 400, 'italic')}
${marges}
body { font-family: 'Jost', sans-serif; color: #26201A; font-size: 10.5pt; line-height: 1.6; margin: 0; }
.couverture { height: 297mm; box-sizing: border-box; padding: 22mm 20mm 24mm; display: flex; flex-direction: column; justify-content: space-between; break-after: page; }
.couverture .logo svg { width: 62mm; height: auto; }
.couverture h1 { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 40pt; line-height: 1.08; color: #002FA7; margin: 0 0 8mm; }
.couverture .sous { font-size: 14pt; line-height: 1.4; max-width: 120mm; }
.couverture .ligne { width: 40mm; height: 2px; background: #C4623E; margin: 10mm 0; }
.couverture .auteur { font-size: 11pt; color: #5C5248; }
.provisoire { font-size: 9pt; color: #A34E30; letter-spacing: .08em; text-transform: uppercase; }
h2 { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 24pt; line-height: 1.12; color: #002FA7; margin: 0 0 7mm; break-after: avoid; }
.partie { break-before: page; }
.surtitre { font-size: 8pt; letter-spacing: .14em; text-transform: uppercase; color: #5C5248; margin-bottom: 3mm; }
.erreur h2 { padding-bottom: 5mm; border-bottom: 2px solid #C4623E; display: inline-block; }
.cas, .solution { padding: 4mm 5mm; border-radius: 2.5mm; margin: 4mm 0; break-inside: avoid; }
.cas { background: #F3ECE0; border-left: 3px solid #C4623E; }
.solution { background: #E7EDF9; border-left: 3px solid #002FA7; }
.etiquette { display: block; font-size: 7.5pt; letter-spacing: .14em; text-transform: uppercase; color: #5C5248; margin-bottom: 1.5mm; }
.sommaire { break-before: page; break-inside: avoid; }
.sommaire h3 { font-family: 'Gilda Display', serif; font-weight: 400; font-size: 24pt; line-height: 1.12; color: #002FA7; margin: 0 0 8mm; }
.sommaire ol { margin: 1mm 0 0; padding-left: 7mm; }
.sommaire li { margin-bottom: 3mm; font-size: 11.5pt; }
.sommaire .axe { margin-bottom: 7mm; }
h3 { font-size: 11pt; margin: 6mm 0 2mm; break-after: avoid; }
p { margin: 0 0 3mm; }
ul, ol { margin: 0 0 4mm; padding-left: 5mm; }
li { margin-bottom: 1.2mm; }
strong { font-weight: 500; }
a { color: #002FA7; text-decoration: underline; text-underline-offset: 2px; }
.cas a { display: block; margin-top: 2mm; font-weight: 500; }
.bloc-tableau { break-inside: avoid; }
table { width: 100%; border-collapse: collapse; margin: 2mm 0 5mm; font-size: 9.5pt; break-inside: avoid; }
th { text-align: left; font-weight: 500; background: #E9E0D2; }
th, td { padding: 1.6mm 2.4mm; border-bottom: 1px solid #E9E0D2; vertical-align: top; }
.annonce { border-radius: 2.5mm; margin: 4mm 0; padding: 4mm 5mm; break-inside: avoid; }
.annonce p { margin: 0 0 2mm; }
.annonce p:last-child { margin-bottom: 0; }
.annonce-avant { background: #F4F1EC; color: #5C5248; font-size: 9.5pt; }
.annonce-apres { border: 1px solid #E9E0D2; border-top: 3px solid #002FA7; padding: 5mm 6mm; }
.annonce-titre { font-family: 'Gilda Display', serif; font-size: 15pt; line-height: 1.2; color: #002FA7; margin: 0 0 3mm; }
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
  path: SORTIE, format: 'A4', printBackground: true, preferCSSPageSize: true,
});
// La couverture seule, en image, pour la page /guide (bloc A-10) : même mise en page, sans la mention provisoire
// (le site public ne se construit qu'avec un guide relu). Une page A4 à l'écran, marges de @page reprises en bordure.
const couverture = html.replace(/<\/section>[\s\S]*<\/body>/, '</section></body>')
  .replace('<div class="provisoire">Version provisoire, en cours de relecture par Anne</div>', '')
  .replace('</style>', 'html,body{margin:0}body{width:210mm;height:297mm;padding:22mm 20mm 24mm;box-sizing:border-box;background:#fff}.couverture{height:100%}</style>');
const vue = await navigateur.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1.2 });
await vue.setContent(couverture, { waitUntil: 'load' });
fs.mkdirSync(path.dirname(COUVERTURE), { recursive: true });
await vue.screenshot({ path: COUVERTURE, type: 'jpeg', quality: 82 });
await navigateur.close();
console.log(`${path.relative(RACINE, COUVERTURE)} : ${Math.round(fs.statSync(COUVERTURE).size / 1024)} Ko.`);
console.log(`${path.relative(RACINE, SORTIE)} : ${Math.round(fs.statSync(SORTIE).size / 1024)} Ko, ${provisoire ? 'version provisoire' : 'version relue'}.`);
