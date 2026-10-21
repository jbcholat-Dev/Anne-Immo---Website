// Lecture d'un tableur importé dans l'espace (story 13.7) : .csv (séparateur ; , ou tabulation, détecté) ou .xlsx
// (première feuille). Sans bibliothèque : un .xlsx est une archive zip de fichiers XML, que l'exécution Cloudflare
// sait décompresser (DecompressionStream). Seules les valeurs sont lues, pas les formules ni la mise en forme.

export const TAILLE_MAX = 2 * 1024 * 1024;

export async function lireTableur(nom: string, octets: Uint8Array): Promise<string[][]> {
  if (/\.xlsx$/i.test(nom) || (octets[0] === 0x50 && octets[1] === 0x4b)) return lireXlsx(octets);
  return lireCsv(decoderTexte(octets));
}

function decoderTexte(o: Uint8Array): string {
  const utf8 = new TextDecoder('utf-8').decode(o).replace(/^﻿/, '');
  // Un CSV enregistré par Excel en France est souvent en Windows-1252 : on le reconnaît aux caractères de remplacement.
  return utf8.includes('�') ? new TextDecoder('windows-1252').decode(o) : utf8;
}

export function lireCsv(t: string): string[][] {
  const premiere = t.split(/\r?\n/, 1)[0] ?? '';
  const sep = [';', '\t', ','].map((s) => [s, premiere.split(s).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const lignes: string[][] = [];
  let ligne: string[] = [], champ = '', guillemets = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (guillemets) {
      if (c === '"' && t[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"' && champ === '') guillemets = true;
    else if (c === sep) { ligne.push(champ); champ = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      ligne.push(champ); lignes.push(ligne); ligne = []; champ = '';
    } else champ += c;
  }
  if (champ || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return lignes.filter((l) => l.some((v) => v.trim()));
}

// ——— .xlsx ———

async function fichiersZip(o: Uint8Array, voulus: (nom: string) => boolean): Promise<Map<string, string>> {
  const v = new DataView(o.buffer, o.byteOffset, o.byteLength);
  // Fin du répertoire central : signature 0x06054b50, cherchée depuis la fin.
  let fin = -1;
  for (let i = o.length - 22; i >= Math.max(0, o.length - 65557); i--) if (v.getUint32(i, true) === 0x06054b50) { fin = i; break; }
  if (fin < 0) throw new Error('fichier xlsx illisible');
  const n = v.getUint16(fin + 10, true);
  let p = v.getUint32(fin + 16, true);
  const sortie = new Map<string, string>();
  for (let k = 0; k < n; k++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('fichier xlsx illisible');
    const methode = v.getUint16(p + 10, true);
    const taille = v.getUint32(p + 20, true);
    const lNom = v.getUint16(p + 28, true), lExtra = v.getUint16(p + 30, true), lCom = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const nom = new TextDecoder().decode(o.subarray(p + 46, p + 46 + lNom));
    p += 46 + lNom + lExtra + lCom;
    if (!voulus(nom)) continue;
    const debut = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    const brut = o.subarray(debut, debut + taille);
    let donnees: Uint8Array;
    if (methode === 0) donnees = brut;
    else if (methode === 8) donnees = new Uint8Array(await new Response(new Blob([brut]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
    else throw new Error('compression xlsx non prise en charge');
    sortie.set(nom, new TextDecoder().decode(donnees));
  }
  return sortie;
}

const entites = (s: string) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, '&');
const textesDe = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => entites(m[1])).join('');
const colonne = (ref: string) => [...ref.replace(/\d+/g, '')].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

async function lireXlsx(o: Uint8Array): Promise<string[][]> {
  const f = await fichiersZip(o, (n) => n === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet\d+\.xml$/.test(n));
  const feuille = [...f.keys()].filter((k) => k.startsWith('xl/worksheets/')).sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))[0];
  if (!feuille) throw new Error('aucune feuille dans le fichier');
  const partages = [...(f.get('xl/sharedStrings.xml') ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textesDe(m[1]));
  const lignes: string[][] = [];
  for (const r of f.get(feuille)!.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const ligne: string[] = [];
    for (const c of r[1].matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1], contenu = c[2] ?? '';
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const type = /t="(\w+)"/.exec(attrs)?.[1];
      const brute = /<v>([\s\S]*?)<\/v>/.exec(contenu)?.[1];
      const valeur = type === 's' ? partages[Number(brute)] ?? '' : type === 'inlineStr' ? textesDe(contenu) : entites(brute ?? '');
      const i = ref ? colonne(ref) : ligne.length;
      while (ligne.length < i) ligne.push('');
      ligne[i] = valeur;
    }
    if (ligne.some((v) => v.trim())) lignes.push(ligne);
  }
  return lignes;
}
