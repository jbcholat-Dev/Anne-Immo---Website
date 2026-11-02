// Lecture d'un e-mail brut (story 18.12, AD-20 entrée 3, AD-34), sans bibliothèque : en-têtes (lignes repliées, mots
// encodés RFC 2047), parties MIME imbriquées, encodages de transfert (base64, quoted-printable, 7 et 8 bits) et jeux de
// caractères (UTF-8, ISO-8859-1, Windows-1252, et ce que le décodeur de la plateforme connaît). Rend l'expéditeur, le
// sujet, l'identifiant du message, et le corps en texte simple (la partie texte si elle existe, sinon la partie HTML
// remise en texte, une cellule de tableau suivie de la suivante devenant « libellé : valeur »). Ne lit jamais les pièces
// jointes. Fonctions pures, essayées par scripts/e2e-espace.mjs sur des e-mails fictifs.

export interface Courriel {
  /** Adresse de l'en-tête From, en minuscules. */
  de: string;
  sujet: string;
  messageId: string | null;
  /** Corps en texte simple, lignes conservées. */
  texte: string;
}

const WINDOWS_1252: Record<number, number> = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021, 0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160,
  0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
  0x98: 0x02dc, 0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153, 0x9e: 0x017e, 0x9f: 0x0178,
};

/** Octets → texte selon le jeu de caractères annoncé ; UTF-8 par défaut, ISO-8859-1 si l'UTF-8 n'est pas valable. */
export function decoder(octets: Uint8Array, charset = 'utf-8'): string {
  const cs = charset.trim().toLowerCase().replace(/^"|"$/g, '');
  if (['iso-8859-1', 'latin1', 'iso8859-1', 'us-ascii', 'ascii', 'windows-1252', 'cp1252', 'iso-8859-15'].includes(cs)) {
    return Array.from(octets, (o) => String.fromCharCode(WINDOWS_1252[o] ?? o)).join('');
  }
  try {
    return new TextDecoder(cs || 'utf-8', { fatal: true, ignoreBOM: false }).decode(octets);
  } catch {
    try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(octets); } catch { return decoder(octets, 'windows-1252'); }
  }
}

/** Texte « binaire » (un caractère par octet) → octets. */
const octetsDe = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0) & 0xff);

function base64(s: string): Uint8Array {
  const propre = s.replace(/[^A-Za-z0-9+/]/g, '');
  try { return octetsDe(atob(propre + '='.repeat((4 - (propre.length % 4)) % 4))); } catch { return new Uint8Array(); }
}

function quotedPrintable(s: string, entete = false): Uint8Array {
  const t = entete ? s.replace(/_/g, ' ') : s.replace(/=\r?\n/g, '');
  const sortie: number[] = [];
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === '=' && /^[0-9A-Fa-f]{2}$/.test(t.slice(i + 1, i + 3))) { sortie.push(parseInt(t.slice(i + 1, i + 3), 16)); i += 2; }
    else sortie.push(c.charCodeAt(0) & 0xff);
  }
  return Uint8Array.from(sortie);
}

/** Un en-tête avec ses mots encodés (=?utf-8?B?…?= ou =?iso-8859-1?Q?…?=) remis en texte. */
export function motsEncodes(v: string): string {
  return v.replace(/\?=\s+=\?/g, '?==?').replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, cs: string, enc: string, txt: string) =>
    decoder(enc.toUpperCase() === 'B' ? base64(txt) : quotedPrintable(txt, true), cs.split('*')[0]));
}

/** Sépare en-têtes et corps ; en-têtes repliés réunis, noms en minuscules (le premier l'emporte, sauf Received). */
function separer(brut: string): { entetes: Map<string, string>; corps: string } {
  const fin = brut.search(/\r?\n\r?\n/);
  const tete = fin < 0 ? brut : brut.slice(0, fin);
  const corps = fin < 0 ? '' : brut.slice(fin).replace(/^\r?\n\r?\n/, '');
  const entetes = new Map<string, string>();
  for (const ligne of tete.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/)) {
    const i = ligne.indexOf(':');
    if (i <= 0) continue;
    const nom = ligne.slice(0, i).trim().toLowerCase();
    if (!entetes.has(nom)) entetes.set(nom, ligne.slice(i + 1).trim());
  }
  return { entetes, corps };
}

/** Valeur principale et paramètres d'un en-tête comme Content-Type (« text/plain; charset=utf-8 »). */
function parametres(v: string): { valeur: string; p: Record<string, string> } {
  const [valeur, ...reste] = v.split(';');
  const p: Record<string, string> = {};
  for (const x of reste) {
    const i = x.indexOf('=');
    if (i > 0) p[x.slice(0, i).trim().toLowerCase()] = x.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  return { valeur: valeur.trim().toLowerCase(), p };
}

/** Les parties texte et HTML d'un message, en descendant dans les parties multiples (pièces jointes ignorées). */
function parties(brut: string, profondeur = 0): { texte: string[]; html: string[] } {
  const { entetes, corps } = separer(brut);
  const type = parametres(entetes.get('content-type') ?? 'text/plain');
  const disposition = (entetes.get('content-disposition') ?? '').toLowerCase();
  if (type.valeur.startsWith('multipart/') && type.p.boundary && profondeur < 6) {
    const morceaux = corps.split(new RegExp(`(?:^|\\r?\\n)--${type.p.boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:--)?[ \\t]*(?=\\r?\\n|$)`));
    const r = { texte: [] as string[], html: [] as string[] };
    for (const m of morceaux.slice(1)) {
      if (!m.trim()) continue;
      const sous = parties(m.replace(/^\r?\n/, ''), profondeur + 1);
      r.texte.push(...sous.texte); r.html.push(...sous.html);
    }
    return r;
  }
  if (disposition.startsWith('attachment')) return { texte: [], html: [] };
  if (type.valeur === 'message/rfc822' && profondeur < 6) return parties(corps, profondeur + 1);
  if (type.valeur !== 'text/plain' && type.valeur !== 'text/html') return { texte: [], html: [] };
  const enc = (entetes.get('content-transfer-encoding') ?? '').toLowerCase();
  const octets = enc === 'base64' ? base64(corps) : enc === 'quoted-printable' ? quotedPrintable(corps) : octetsDe(corps);
  const t = decoder(octets, type.p.charset ?? 'utf-8');
  return type.valeur === 'text/html' ? { texte: [], html: [t] } : { texte: [t], html: [] };
}

const ENTITES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë', agrave: 'à', acirc: 'â',
  ccedil: 'ç', ocirc: 'ô', ucirc: 'û', ugrave: 'ù', icirc: 'î', iuml: 'ï', Eacute: 'É', Egrave: 'È', Agrave: 'À', euro: '€', rsquo: '’',
  lsquo: '‘', laquo: '«', raquo: '»', hellip: '…', ndash: '–', mdash: '—', deg: '°', sup2: '²', oelig: 'œ',
};
/** Le HTML d'un e-mail remis en texte : une ligne par paragraphe ou ligne de tableau, « libellé : valeur » pour deux cellules. */
export function htmlEnTexte(html: string): string {
  return html
    .replace(/<(style|script|head)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/t[dh]>\s*<t[dh][^>]*>/gi, ' : ')
    .replace(/<br\s*\/?>|<\/(p|div|tr|li|h[1-6]|table|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e: string) => {
      if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : ''; }
      return ENTITES[e] ?? m;
    })
    .replace(/[ \t ]+/g, ' ')
    .split('\n').map((l) => l.trim()).filter((l, i, t) => l || (i > 0 && t[i - 1])).join('\n').trim();
}

/** Un en-tête : octets bruts lus en UTF-8 (RFC 6532, envoyé tel quel par certaines messageries), puis mots encodés. */
const entete = (v: string | undefined) => motsEncodes(decoder(octetsDe(v ?? '')));

/** Lit un e-mail brut (texte d'un caractère par octet, tel que reçu). */
export function lireCourriel(brut: string): Courriel {
  const { entetes } = separer(brut);
  const from = entete(entetes.get('from'));
  const adresse = (/<([^>]+)>/.exec(from)?.[1] ?? from).trim().toLowerCase();
  const { texte, html } = parties(brut);
  const corps = texte.find((t) => t.trim()) ?? (html.length ? htmlEnTexte(html.join('\n')) : '');
  return {
    de: /^[^\s@<>]+@[^\s@<>]+$/.test(adresse) ? adresse : '',
    sujet: entete(entetes.get('subject')).trim(),
    messageId: (entetes.get('message-id') ?? '').trim().slice(0, 300) || null,
    texte: corps.replace(/\r\n/g, '\n'),
  };
}
