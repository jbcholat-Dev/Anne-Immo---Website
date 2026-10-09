// Mise en page des e-mails envoyés aux prospects (story 10.9, AD-8) : un seul gabarit, à la charte (écru, brun, bleu Klein,
// terracotta), appliqué à des textes écrits dans un petit Markdown. Les textes d'Anne (contenu-anne/guide/sequence-emails/)
// restent la seule source : ce module les met en forme sans les réécrire. Chaque e-mail part en deux versions, HTML et texte,
// tirées du même Markdown ; la notification à Anne n'utilise pas ce module (texte brut, à recopier dans Modelo).
//
// Markdown reconnu : `## titre`, `### sous-titre`, paragraphes (ligne vide entre deux), `**gras**`, `*italique*`,
// listes `- ` et `1. `, `[libellé](adresse)`, `> encadré`, `—` seul sur sa ligne (filet). Un paragraphe fait d'un seul lien
// devient un bouton.
//
// Contraintes des messageries (Gmail, Outlook, Apple Mail) : mise en page en tableaux, styles écrits sur chaque balise,
// polices de secours (les polices du site ne s'y chargent pas), aucune image distante (le logo est joint à l'e-mail et
// appelé par `cid:logo`), largeur 600 px qui se réduit sur téléphone.

const C = { ecru: '#F7F2EA', brun: '#26201A', klein: '#002FA7', terra: '#C4623E', galet: '#E9E0D2', brume: '#E7EDF9', muet: '#5C5248', blanc: '#FFFFFF' };
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Identifiant du logo joint à chaque e-mail HTML (`<img src="cid:logo">`). */
export const CID_LOGO = 'logo';

const echapper = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

type Bloc =
  | { t: 'titre'; niveau: 2 | 3; texte: string }
  | { t: 'para'; texte: string }
  | { t: 'liste'; ordonnee: boolean; items: string[] }
  | { t: 'encadre'; texte: string }
  | { t: 'filet' };

/** Découpe le Markdown en blocs. */
function blocs(md: string): Bloc[] {
  const sortie: Bloc[] = [];
  const lignes = md.replace(/\r\n/g, '\n').split('\n');
  let i = 0;
  while (i < lignes.length) {
    const l = lignes[i];
    if (!l.trim()) { i++; continue; }
    const titre = /^(#{2,3})\s+(.+)$/.exec(l);
    if (titre) { sortie.push({ t: 'titre', niveau: titre[1].length === 2 ? 2 : 3, texte: titre[2].trim() }); i++; continue; }
    if (/^\s*(—|---)\s*$/.test(l)) { sortie.push({ t: 'filet' }); i++; continue; }
    const puce = /^\s*(-|\d+\.)\s+/;
    if (puce.test(l)) {
      const ordonnee = /^\s*\d+\./.test(l);
      const items: string[] = [];
      while (i < lignes.length && puce.test(lignes[i])) { items.push(lignes[i].replace(puce, '').trim()); i++; }
      sortie.push({ t: 'liste', ordonnee, items });
      continue;
    }
    if (/^>\s?/.test(l)) {
      const contenu: string[] = [];
      while (i < lignes.length && /^>\s?/.test(lignes[i])) { contenu.push(lignes[i].replace(/^>\s?/, '')); i++; }
      sortie.push({ t: 'encadre', texte: contenu.join('\n').trim() });
      continue;
    }
    const para: string[] = [];
    while (i < lignes.length && lignes[i].trim() && !/^(#{2,3}\s|>|\s*(-|\d+\.)\s|\s*(—|---)\s*$)/.test(lignes[i])) { para.push(lignes[i]); i++; }
    sortie.push({ t: 'para', texte: para.join('\n') });
  }
  return sortie;
}

const LIEN = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const lienSeul = (texte: string) => /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(texte.trim());

// ——— Version texte ———

function enLigne(texte: string): string {
  return texte
    .replace(LIEN, (_, libelle: string, url: string) => (libelle === url || url.endsWith(libelle) ? url : `${libelle} (${url})`))
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1$2');
}

/** Version texte d'un e-mail : titres en capitales, liens écrits en clair, marques retirées. */
export function enTexte(md: string): string {
  return blocs(md).map((b) => {
    if (b.t === 'titre') return enLigne(b.texte).toUpperCase();
    if (b.t === 'filet') return '—';
    if (b.t === 'liste') return b.items.map((it, n) => `${b.ordonnee ? `${n + 1}.` : '-'} ${enLigne(it)}`).join('\n');
    if (b.t === 'encadre') return enLigne(b.texte);
    const seul = lienSeul(b.texte);
    return seul ? `${seul[1]} :\n${seul[2]}` : enLigne(b.texte);
  }).join('\n\n');
}

// ——— Version HTML ———

const styleLien = `color:${C.klein};text-decoration:underline;`;

function enLigneHtml(texte: string): string {
  return echapper(texte)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, libelle: string, url: string) => `<a href="${url}" style="${styleLien}">${libelle}</a>`)
    .replace(/\*\*(.+?)\*\*/g, `<strong style="font-weight:bold;color:${C.brun};">$1</strong>`)
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\n/g, '<br>');
}

const P = `margin:0 0 16px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.brun};`;

function bouton(libelle: string, url: string): string {
  // Bouton « à l'épreuve des balles » : un tableau à fond terracotta, lisible même quand Outlook ignore les arrondis.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;"><tr><td align="center" bgcolor="${C.terra}" style="border-radius:999px;background:${C.terra};">`
    + `<a href="${echapper(url)}" style="display:inline-block;padding:14px 28px;font-family:${SANS};font-size:16px;font-weight:bold;line-height:1.2;color:${C.blanc};text-decoration:none;border-radius:999px;">${echapper(libelle)}</a>`
    + '</td></tr></table>';
}

function blocHtml(b: Bloc): string {
  if (b.t === 'titre') {
    return b.niveau === 2
      ? `<h2 style="margin:32px 0 12px;font-family:${SERIF};font-size:22px;font-weight:normal;line-height:1.3;color:${C.klein};">${enLigneHtml(b.texte)}</h2>`
      : `<h3 style="margin:24px 0 8px;font-family:${SERIF};font-size:18px;font-weight:normal;line-height:1.3;color:${C.brun};">${enLigneHtml(b.texte)}</h3>`;
  }
  if (b.t === 'filet') return `<hr style="border:0;border-top:1px solid ${C.galet};margin:24px 0;">`;
  if (b.t === 'liste') {
    const balise = b.ordonnee ? 'ol' : 'ul';
    return `<${balise} style="margin:0 0 16px;padding:0 0 0 24px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.brun};">`
      + b.items.map((it) => `<li style="margin:0 0 6px;">${enLigneHtml(it)}</li>`).join('') + `</${balise}>`;
  }
  if (b.t === 'encadre') {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 20px;"><tr>`
      + `<td style="background:${C.brume};border-left:3px solid ${C.klein};padding:16px 18px;font-family:${SANS};font-size:16px;line-height:1.6;color:${C.brun};">${enLigneHtml(b.texte)}</td></tr></table>`;
  }
  const seul = lienSeul(b.texte);
  return seul ? bouton(seul[1], seul[2]) : `<p style="${P}">${enLigneHtml(b.texte)}</p>`;
}

export interface Habillage {
  lang: 'fr' | 'en';
  /** Phrase d'aperçu affichée par la messagerie à côté de l'objet (cachée dans l'e-mail). */
  apercu?: string;
  /** Pied en petit (désabonnement de la séquence), en Markdown. */
  pied?: string;
}

const SIGNATURE = {
  fr: { role: 'Conseillère en immobilier', zone: 'Chablais · Léman · réseau eXp France' },
  en: { role: 'Real estate advisor', zone: 'Chablais · Lake Geneva · eXp France network' },
};

/** Le Markdown d'un e-mail mis dans le gabarit de la charte. `logo` : adresse de l'image (par défaut la pièce jointe `cid:logo`). */
export function enHtml(md: string, h: Habillage, logo = `cid:${CID_LOGO}`): string {
  const s = SIGNATURE[h.lang];
  const corps = blocs(md).map(blocHtml).join('\n');
  const pied = h.pied
    ? `<p style="margin:0;font-family:${SANS};font-size:13px;line-height:1.5;color:${C.muet};">${enLigneHtml(h.pied)}</p>`
    : '';
  return `<!doctype html>
<html lang="${h.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title></title>
<style>
  @media (max-width: 620px) { .cadre { padding: 28px 20px !important; } .exterieur { padding: 12px 8px !important; } }
  a { color: ${C.klein}; }
</style>
</head>
<body style="margin:0;padding:0;background:${C.ecru};">
${h.apercu ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.ecru};">${echapper(h.apercu)}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.ecru}" style="background:${C.ecru};">
<tr><td class="exterieur" align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
<tr><td style="padding:0 0 20px 4px;"><img src="${logo}" width="220" height="52" alt="Anne VIAL-TISSOT" style="display:block;border:0;width:220px;height:auto;"></td></tr>
<tr><td class="cadre" bgcolor="${C.blanc}" style="background:${C.blanc};border:1px solid ${C.galet};border-radius:12px;padding:40px 44px;">
${corps}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;border-top:2px solid ${C.terra};"><tr><td style="padding:14px 0 0;">
<p style="margin:0;font-family:${SERIF};font-size:18px;line-height:1.3;color:${C.brun};">Anne VIAL-TISSOT</p>
<p style="margin:4px 0 0;font-family:${SANS};font-size:14px;line-height:1.5;color:${C.muet};">${s.role}<br>${s.zone}<br><a href="https://annevialtissot.fr" style="${styleLien}">annevialtissot.fr</a></p>
</td></tr></table>
</td></tr>
${pied ? `<tr><td style="padding:20px 8px 0;">${pied}</td></tr>` : ''}
</table>
</td></tr>
</table>
</body>
</html>`;
}
