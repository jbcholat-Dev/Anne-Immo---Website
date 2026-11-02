// L'import des contacts par Claude (story 18.9, AD-26) : lit un fichier local, en demande l'aperçu à l'espace, puis
// l'importe sur demande explicite, ou annule un lot. N'affiche que des nombres : aucun nom, téléphone ni e-mail à l'écran.
// Les doublons probables (nom et source du contact existant) ne s'écrivent que dans un fichier local (--doublons-vers),
// pour que JB décide dans le fil ; ses décisions reviennent par --decisions.
// Ne jamais lancer sur les vrais fichiers d'Anne avant la validation de la fiche légale par JB (story 18.10).
//
// Réglages (environnement cloud « Anne Immo », jamais dans le dépôt) : ESPACE_CLAUDE_ID et ESPACE_CLAUDE_SECRET (jeton de
// service Cloudflare Access de Claude, RUNBOOK § 4 sexies), ESPACE_URL facultatif. Passer par le proxy de l'environnement :
//   NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt node scripts/claude-import.mjs …
// Essai local seulement (scripts/e2e-espace.mjs) : ESPACE_JETON_ESSAI, un jeton Access d'essai, à la place des deux réglages.
//
// Commandes :
//   apercu   <fichier> --genre <genre> [--detail "EDB Thonon, mars 2026"] [--doublons-vers doublons.json] [--decisions d.json]
//   importer <fichier> --genre <genre> --empreinte <empreinte de l'aperçu> [--decisions d.json] --oui
//   annuler  <lot> --oui
// Pour un classeur Excel (.xlsx), --genre est remplacé par un --onglet par onglet à importer (les autres ne sont pas
// envoyés) : --onglet "EDB=edb:EDB Thonon, mars 2026" --onglet "Feuil1=complement" --onglet "CONTACTS=relations".
// Genres : telephone, linkedin, reseaux, edb, complement, relations, partenaires, anciens_clients (server/import.ts).
// Formats : .vcf (vCard), .csv, .xlsx. Le fichier est lu ici ; pour un .vcf, les propriétés que l'espace n'importe jamais
// (PHOTO, ADR, BDAY, NOTE) ne sont pas envoyées.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const BASE = (process.env.ESPACE_URL ?? 'https://espace.annevialtissot.fr').replace(/\/+$/, '');
const id = process.env.ESPACE_CLAUDE_ID, secret = process.env.ESPACE_CLAUDE_SECRET, essai = process.env.ESPACE_JETON_ESSAI;
const sortir = (texte, code = 2) => { console.error(texte); process.exit(code); };
if (!essai && (!id || !secret)) sortir('ESPACE_CLAUDE_ID et ESPACE_CLAUDE_SECRET manquent dans les réglages de l\'environnement (RUNBOOK § 4 sexies).');
const entetes = essai ? { 'cf-access-jwt-assertion': essai } : { 'CF-Access-Client-Id': id, 'CF-Access-Client-Secret': secret };

// ——— Arguments ———
const [commande, cible, ...reste] = process.argv.slice(2);
const options = { onglet: [] };
for (let i = 0; i < reste.length; i++) {
  const a = reste[i];
  if (a === '--oui') options.oui = true;
  else if (a.startsWith('--') && reste[i + 1] !== undefined) { const k = a.slice(2); if (k === 'onglet') options.onglet.push(reste[++i]); else options[k] = reste[++i]; }
  else sortir(`Argument inconnu : ${a}`);
}

// ——— Lecture d'un .xlsx (archive zip de fichiers XML), sans bibliothèque ———
function zipFichiers(o) {
  let fin = -1;
  for (let i = o.length - 22; i >= Math.max(0, o.length - 65557); i--) if (o.readUInt32LE(i) === 0x06054b50) { fin = i; break; }
  if (fin < 0) throw new Error('fichier xlsx illisible');
  const n = o.readUInt16LE(fin + 10);
  let p = o.readUInt32LE(fin + 16);
  const sortie = new Map();
  for (let k = 0; k < n; k++) {
    if (o.readUInt32LE(p) !== 0x02014b50) throw new Error('fichier xlsx illisible');
    const methode = o.readUInt16LE(p + 10), taille = o.readUInt32LE(p + 20);
    const lNom = o.readUInt16LE(p + 28), lExtra = o.readUInt16LE(p + 30), lCom = o.readUInt16LE(p + 32), local = o.readUInt32LE(p + 42);
    const nom = o.subarray(p + 46, p + 46 + lNom).toString('utf8');
    p += 46 + lNom + lExtra + lCom;
    const debut = local + 30 + o.readUInt16LE(local + 26) + o.readUInt16LE(local + 28);
    const brut = o.subarray(debut, debut + taille);
    sortie.set(nom, (methode === 0 ? brut : zlib.inflateRawSync(brut)).toString('utf8'));
  }
  return sortie;
}
const entites = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d))).replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, '&');
const textesDe = (xml) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => entites(m[1])).join('');
const colonne = (ref) => [...ref.replace(/\d+/g, '')].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;

/** Les onglets d'un classeur : { nom, lignes: string[][] } (valeurs seulement, ni formules ni mise en forme). */
function lireXlsx(octets) {
  const f = zipFichiers(octets);
  const partages = [...(f.get('xl/sharedStrings.xml') ?? '').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textesDe(m[1]));
  const liens = new Map([...(f.get('xl/_rels/workbook.xml.rels') ?? '').matchAll(/<Relationship\b([^>]*)\/?>/g)]
    .map((m) => [/Id="([^"]+)"/.exec(m[1])?.[1], /Target="([^"]+)"/.exec(m[1])?.[1]]));
  const feuilles = [...(f.get('xl/workbook.xml') ?? '').matchAll(/<sheet\b([^>]*)\/?>/g)].map((m) => {
    const nom = entites(/name="([^"]*)"/.exec(m[1])?.[1] ?? '');
    const cible = liens.get(/r:id="([^"]+)"/.exec(m[1])?.[1]) ?? '';
    return { nom, chemin: cible.startsWith('/') ? cible.slice(1) : `xl/${cible.replace(/^\.\//, '')}` };
  });
  return feuilles.filter((x) => f.has(x.chemin)).map(({ nom, chemin }) => {
    const lignes = [];
    for (const r of f.get(chemin).matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const ligne = [];
      for (const c of r[1].matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = c[1], contenu = c[2] ?? '';
        const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1], type = /t="(\w+)"/.exec(attrs)?.[1];
        const brute = /<v>([\s\S]*?)<\/v>/.exec(contenu)?.[1];
        const valeur = type === 's' ? partages[Number(brute)] ?? '' : type === 'inlineStr' ? textesDe(contenu) : entites(brute ?? '');
        const i = ref ? colonne(ref) : ligne.length;
        while (ligne.length < i) ligne.push('');
        ligne[i] = valeur;
      }
      if (ligne.some((v) => v.trim())) lignes.push(ligne.slice(0, 80));
    }
    return { nom, lignes };
  });
}

/** Le `fichier` envoyé à l'espace, lu depuis le disque. */
function fichier(chemin) {
  if (!chemin || !fs.existsSync(chemin)) sortir(`Fichier introuvable : ${chemin ?? '(aucun)'}`);
  const nom = path.basename(chemin), ext = path.extname(chemin).toLowerCase();
  if (ext === '.xlsx') {
    if (!options.onglet.length) sortir('Pour un .xlsx, nommez chaque onglet à importer : --onglet "NOM=genre[:détail]".');
    const classeur = lireXlsx(fs.readFileSync(chemin));
    const onglets = options.onglet.map((spec) => {
      const m = /^(.+?)=([a-z_]+)(?::(.+))?$/.exec(spec);
      if (!m) sortir(`--onglet attendu sous la forme "NOM=genre[:détail]" : ${spec}`);
      const o = classeur.find((x) => x.nom === m[1]);
      if (!o) sortir(`Onglet introuvable : « ${m[1]} » (onglets du classeur : ${classeur.map((x) => x.nom).join(', ')})`);
      return { nom: o.nom, genre: m[2], ...(m[3] ? { detail: m[3] } : {}), lignes: o.lignes };
    });
    return { format: 'tableur', nom, onglets };
  }
  if (!options.genre) sortir('--genre attendu (telephone, linkedin, reseaux, edb, relations, partenaires, anciens_clients…).');
  let contenu = fs.readFileSync(chemin, 'utf8');
  if (ext === '.vcf') {
    // Propriétés jamais importées (fiche légale, règle 1) : retirées avant l'envoi, lignes de suite comprises.
    contenu = contenu.replace(/\r\n|\r/g, '\n').replace(/^(?:[^.:\n]*\.)?(PHOTO|ADR|BDAY|NOTE|LOGO|SOUND|KEY)[;:][^\n]*(?:\n[ \t][^\n]*)*\n?/gim, '');
  }
  return { format: ext === '.vcf' ? 'vcard' : 'csv', nom, genre: options.genre, ...(options.detail ? { detail: options.detail } : {}), contenu };
}

async function appel(corps) {
  const r = await fetch(`${BASE}/api/claude/import`, { method: 'POST', headers: { ...entetes, 'Content-Type': 'application/json' }, body: JSON.stringify(corps), redirect: 'manual' });
  const texte = await r.text();
  let d; try { d = JSON.parse(texte); } catch { sortir(`HTTP ${r.status} : réponse illisible`, 1); }
  if (!r.ok || !d.ok) sortir(`HTTP ${r.status} : ${d?.error?.code ?? ''} ${d?.error?.message ?? ''}`.trim(), 1);
  return d;
}
const decisions = () => (options.decisions ? JSON.parse(fs.readFileSync(options.decisions, 'utf8')) : undefined);
const ligne = (libelle, n) => console.log(`${libelle.padEnd(34, ' ')} ${n}`);
const parRaison = (r) => Object.entries(r ?? {}).map(([k, n]) => `${k} ${n}`).join(', ') || '—';

if (commande === 'apercu') {
  const { apercu: a } = await appel({ action: 'apercu', fichier: fichier(cible), doublons: decisions() });
  console.log(`Aperçu de « ${a.fichier} » (rien n'est écrit)`);
  ligne('Lignes lues', a.lignes);
  ligne('Fusionnées dans le fichier', a.fusionnees_dans_le_fichier);
  ligne('Nouveaux', a.nouveaux);
  ligne('  par catégorie proposée', Object.entries(a.categories).map(([k, n]) => `${k} ${n}`).join(', ') || '—');
  ligne('  avec l\'accord e-mail (EDB)', a.accords);
  ligne('Compléments d\'un contact existant', a.complements);
  ligne('  dont vérifiés (source et coordonnées seulement)', a.complements_verifies);
  ligne('Doublons probables à confirmer', a.doublons_probables);
  ligne('Rejetés', `${a.rejetes} (${parRaison(a.raisons)})`);
  ligne('Téléphones / e-mails illisibles', `${a.telephones_invalides} / ${a.emails_invalides}`);
  ligne('Champs ignorés', a.champs_ignores.length ? a.champs_ignores.length : '—');
  for (const c of a.champs_ignores) console.log(`  · ${c}`);
  console.log(`Empreinte : ${a.empreinte}`);
  if (a.doublons.length) {
    if (options['doublons-vers']) {
      fs.writeFileSync(options['doublons-vers'], JSON.stringify(a.doublons, null, 2), { mode: 0o600 });
      console.log(`Doublons probables écrits dans ${options['doublons-vers']} (à montrer à JB, puis à supprimer).`);
    } else console.log('Doublons probables : relancer avec --doublons-vers <fichier> pour les détailler (jamais à l\'écran).');
  }
} else if (commande === 'importer') {
  if (!options.oui) sortir('Import réel : ajoutez --oui après avoir montré l\'aperçu à JB.');
  if (!options.empreinte) sortir('--empreinte attendue : celle que l\'aperçu a affichée.');
  const { import: r } = await appel({ action: 'importer', fichier: fichier(cible), empreinte: options.empreinte, doublons: decisions() });
  console.log(`Import fait : lot ${r.lot}`);
  ligne('Nouveaux', r.nouveaux);
  ligne('Compléments', r.complements);
  ligne('Accords e-mail notés', r.accords);
  ligne('Doublons laissés de côté', r.doublons_laisses);
  ligne('Rejetés', `${r.rejetes} (${parRaison(r.raisons)})`);
  ligne('Non écrits (changés entre-temps)', r.ignores_entre_temps);
} else if (commande === 'annuler') {
  if (!options.oui) sortir('Annulation : ajoutez --oui.');
  const { annulation: r } = await appel({ action: 'annuler', lot: cible });
  console.log(`Lot ${cible} annulé`);
  ligne('Contacts créés supprimés', r.supprimes);
  ligne('Contacts complétés rendus', r.rendus);
  ligne('Gardés (modifiés depuis)', r.gardes.length);
  for (const g of r.gardes) console.log(`  · ligne ${g.ligne} : ${g.raison}`);
} else sortir('Commandes : apercu <fichier> … | importer <fichier> … --empreinte <e> --oui | annuler <lot> --oui');
