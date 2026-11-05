// L'import des contacts par Claude (story 18.9, PRD FR-7 à FR-10, AD-26, AD-29, AD-31). Seul chemin d'entrée d'un fichier
// de contacts dans le carnet : il n'y a ni écran ni bouton d'import dans l'espace (JB, 01/11 21 h 16). Appelé seulement par
// la route /api/claude/import, avec le jeton de service de Claude.
// Ce module lit et prépare ; les écritures sur `contact`, `contact_coordonnee`, `contact_source` et `contact_evenement`
// passent par `carnet` (`ecrireImport`, `annulerImport`), l'accord e-mail par `accord` (AD-21, AD-22). Il écrit seulement
// `import_lot`.
//
// Formats lus (`fichier.format`) :
// - `vcard` : texte d'un export de carnet d'adresses (Samsung, vCard 2.1, 3.0, 4.0) : lignes repliées, QUOTED-PRINTABLE,
//   CHARSET, plusieurs TEL et EMAIL. Seuls N, FN, TEL, EMAIL et ORG sont lus ; tout le reste (ADR, BDAY, NOTE, PHOTO…)
//   est ignoré et seulement compté.
// - `csv` : texte d'un tableur ou d'un export LinkedIn ; colonnes reconnues par leur titre.
// - `tableur` : les onglets d'un classeur Excel, lus côté Claude par le script (`scripts/claude-import.mjs`) et envoyés
//   comme lignes de cellules (texte brut, sans interprétation) ; mêmes titres de colonnes reconnus que pour un CSV. Choix
//   de la story 18.9 : un .xlsx est une archive zip, que le Worker saurait ouvrir (`tableur.ts`), mais l'envoyer en base64
//   dans du JSON grossit la requête d'un tiers, et ne lire que des cellules texte ici garde une seule règle de colonnes,
//   appliquée côté serveur, pour le CSV et l'Excel : ce que Claude envoie de plus est ignoré par l'espace, pas par le script.
//
// Champs importés (fiche légale, règle 1 ; AD-26) : prénom, nom, téléphones, e-mails, lien de profil, ville, entreprise ;
// pour le fichier d'Anne (genres edb, complement, relations, partenaires, anciens_clients) le projet et le commentaire.
// Story 18.17 : pour ces mêmes genres, la rencontre (colonne `EDB` : lieu ; colonne `DATE` : mois) est une donnée filtrable
// écrite sur la ligne de `contact_source` (lieu « Publier », mois « AAAA-MM »), pas une note ; `RELANCE 1` et `RELANCE 2`
// sont des commentaires ; `Projet HA`, `HA`, `PA` valent achat et `PV` vente. Repasser un fichier déjà importé complète les
// contacts retrouvés (rencontre, notes absentes, projet) sans doublon ; tout passe par le lot, donc par `annuler`.
// Jamais les adresses, dates de naissance, photos ni notes du téléphone : une colonne ou une propriété qui n'est pas dans
// cette liste n'est pas lue.
//
// Deux temps : `apercu` (rien n'est écrit ; compteurs, et seulement les lignes du fichier, plus le nom et les sources du
// contact existant pour un doublon probable) puis `importer`, qui exige l'empreinte renvoyée par l'aperçu (SHA-256 des
// lignes normalisées) : un fichier différent exige un nouvel aperçu, et un fichier déjà importé (lot non annulé) est refusé.
import type { EnvSite } from '@site/server/env';
import { journal } from '@site/server/journal';
import { empreinteOpposition } from '@site/server/opposition';
import { emailValide } from '@site/server/schema';
import { ulid } from '@site/server/ulid';
import { annulerImport, ecrireImport, telephoneSaisi, type EcritureImport, type LigneSourceImport, type ResultatAnnulationImport, type SourceCompletee } from './carnet';
import { lireCsv } from './tableur';

/** Plafonds : un import vise ~900 fiches ; au-delà, découper le fichier. */
export const MAX_LIGNES = 3000;
export const MAX_ONGLETS = 20;
export const MAX_CONTENU = 3_000_000;
/** Contacts écrits par exécution D1 : une charge JSON par requête, bien sous les 2 Mo d'une valeur liée de D1. */
export const PAR_LOT_D1 = 250;

/**
 * Le genre d'un fichier ou d'un onglet décide de sa source et de sa catégorie de départ (FR-9). `cree` : faux pour un onglet
 * qui ne crée personne et complète seulement (Feuil1 du fichier d'Anne, extrait de l'onglet EDB). `anne` : fichier d'Anne
 * (projet et commentaire importés). `accord` : les personnes ont coché la case des e-mails (animations EDB, FR-10).
 */
export const GENRES = {
  telephone: { source: 'telephone', categorie: 'proches', anne: false, cree: true, accord: false },
  linkedin: { source: 'linkedin', categorie: 'lointains', anne: false, cree: true, accord: false },
  reseaux: { source: 'reseaux', categorie: 'lointains', anne: false, cree: true, accord: false },
  edb: { source: 'edb', categorie: 'edb', anne: true, cree: true, accord: true },
  complement: { source: 'edb', categorie: 'edb', anne: true, cree: false, accord: false },
  relations: { source: 'tableur', categorie: 'lointains', anne: true, cree: true, accord: false },
  partenaires: { source: 'tableur', categorie: 'partenaires', anne: true, cree: true, accord: false },
  anciens_clients: { source: 'tableur', categorie: 'anciens_clients', anne: true, cree: true, accord: false },
} as const;
export type Genre = keyof typeof GENRES;
/** FR-9 : pour un contact à plusieurs sources, la règle la plus haute de cette liste l'emporte. */
export const RANG_CATEGORIES = ['anciens_clients', 'partenaires', 'edb', 'proches', 'lointains'] as const;
const rang = (c: string | null) => { const i = (RANG_CATEGORIES as readonly string[]).indexOf(c ?? ''); return i < 0 ? 99 : i; };

export const RAISONS_REJET = {
  vide: 'ni nom ni téléphone ni e-mail',
  opposition: 'la personne a demandé l\'effacement (liste d\'opposition)',
  ecarte: 'contact écarté : un import ne le fait jamais revenir',
  plusieurs_contacts: 'ses coordonnées sont celles de deux contacts différents',
  complement_sans_contact: 'onglet de complément : aucun contact à compléter',
  doublon_en_attente: 'doublon probable sans décision de JB : laissé de côté',
  fusion_invalide: 'décision de fusion vers un contact qui n\'est pas proposé',
} as const;
export type Raison = keyof typeof RAISONS_REJET;

/** Une ligne du fichier, après lecture et nettoyage (seulement les champs permis). */
export interface Ligne {
  ref: string; genre: Genre; prenom: string | null; nom: string | null; telephones: string[]; emails: string[]; profils: string[];
  ville: string | null; entreprise: string | null; projet: string | null; commentaires: string[];
  /** Story 18.17 : lieu et mois (« AAAA-MM ») de la rencontre du fichier, ou null. */
  rencontre: { lieu: string | null; mois: string | null } | null;
}
interface Onglet { nom: string; genre: Genre; detail: string | null; lignes: Ligne[] }
export interface Lecture { nom: string; onglets: Onglet[]; lignesLues: number; ignores: string[]; telephonesInvalides: number; emailsInvalides: number; empreinte: string }

export class ErreurImport extends Error {
  constructor(public code: string, message: string, public statut = 400) { super(message); }
}

// ——— Nettoyage d'une valeur ———

const texte = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.replace(/\s+/g, ' ').trim();
  return t ? t.slice(0, max) : null;
};
const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
/** Clé de comparaison d'un nom : minuscules, sans accents ni ponctuation, mots triés (« Martin Paul » = « Paul Martin »). */
export const cleNomComplet = (prenom: string | null, nom: string | null) =>
  sansAccents(`${prenom ?? ''} ${nom ?? ''}`).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ');

function profil(v: string): string | null {
  const t = v.trim();
  if (!/^https?:\/\/[^\s]+$/i.test(t) || t.length > 300) return null;
  try {
    const u = new URL(t);
    return `https://${u.hostname.toLowerCase().replace(/^www\./, '')}${u.pathname.replace(/\/+$/, '')}`;
  } catch { return null; }
}

const OUI = /^(oui|x|yes|1|vrai|o)$/i;
function projetDe(v: string | null, vente: string | null, achat: string | null): string | null {
  const ve = !!vente && OUI.test(vente.trim()), ac = !!achat && OUI.test(achat.trim());
  if (ve && ac) return 'vendeur_acheteur';
  if (ve) return 'vendeur';
  if (ac) return 'acheteur';
  const p = v ? sansAccents(v).toLowerCase() : '';
  if (/vend/.test(p) && /ach/.test(p)) return 'vendeur_acheteur';
  if (/vend/.test(p)) return 'vendeur';
  if (/ach/.test(p)) return 'acheteur';
  return null;
}

/** Un nombre de série Excel (jours depuis le 30/12/1899) → « AAAA-MM » ; null hors de 2000 à 2100. */
function moisDeSerie(n: number): string | null {
  if (!Number.isFinite(n) || n < 36526 || n > 73050) return null;
  return new Date(Math.round((n - 25569) * 86_400_000)).toISOString().slice(0, 7);
}
/**
 * Le mois d'une cellule « date » (story 18.17) : nombre de série Excel (ce que le script envoie pour une cellule de date),
 * « jj/mm/aaaa », « mm/aaaa », « aaaa-mm » ou « aaaa-mm-jj » → « AAAA-MM » ; null si la valeur n'est pas une date lisible.
 */
export function moisDe(v: string | null | undefined): string | null {
  const t = (v ?? '').trim();
  if (!t) return null;
  const ok = (a: string, m: string) => (+m >= 1 && +m <= 12 && +a >= 2000 && +a <= 2100 ? `${a}-${m.padStart(2, '0')}` : null);
  let m: RegExpExecArray | null;
  if (/^\d{5}(\.\d+)?$/.test(t)) return moisDeSerie(Number(t));
  if ((m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t))) return ok(m[3], m[2]);
  if ((m = /^(\d{1,2})[/.-](\d{4})$/.exec(t))) return ok(m[2], m[1]);
  if ((m = /^(\d{4})-(\d{1,2})(?:-\d{1,2})?(?:[T ].*)?$/.exec(t))) return ok(m[1], m[2]);
  return null;
}
/** Le lieu d'une rencontre en casse de titre (« PUBLIER » → « Publier ») ; un lieu déjà en casse mixte reste tel quel. */
function lieuDe(v: string | null | undefined): string | null {
  const t = texte(v, 60);
  if (!t) return null;
  if (t !== t.toUpperCase() && t !== t.toLowerCase()) return t;
  return t.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase());
}
/** Une cellule de relance qui est une date Excel (« 45627 ») devient « jj/mm/aaaa » ; tout autre texte reste tel quel. */
function relanceLisible(v: string): string {
  const t = v.trim();
  if (!/^\d{5}(\.\d+)?$/.test(t) || moisDeSerie(Number(t)) === null) return t;
  const d = new Date(Math.round((Number(t) - 25569) * 86_400_000));
  return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
}

/** « RELANCE 1 » → « Relance 1 » : le titre de la colonne, devant le texte de la cellule. */
const etiquetteRelance = (titre: string) => { const t = titre.trim().replace(/\s+/g, ' ').toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };

interface Brut {
  prenom?: string | null; nom?: string | null; nomComplet?: string | null; telephones: string[]; emails: string[]; profils: string[];
  ville?: string | null; entreprise?: string | null; projet?: string | null; vente?: string | null; achat?: string | null; commentaires: string[];
  lieu?: string | null; date?: string | null;
}
interface Compteurs { tel: number; mail: number }

function nettoyer(b: Brut, ref: string, genre: Genre, c: Compteurs): Ligne {
  const g = GENRES[genre];
  const telephones: string[] = [], emails: string[] = [], profils: string[] = [];
  for (const brut of b.telephones) for (const morceau of brut.split(/[;,/]|\s{3,}/)) {
    if (!morceau.trim()) continue;
    const t = telephoneSaisi(morceau);
    if (t) { if (!telephones.includes(t)) telephones.push(t); } else c.tel++;
  }
  for (const brut of b.emails) for (const morceau of brut.split(/[;,\s]+/)) {
    const m = morceau.trim().toLowerCase().replace(/^mailto:/, '');
    if (!m) continue;
    if (emailValide(m)) { if (!emails.includes(m)) emails.push(m); } else c.mail++;
  }
  for (const brut of b.profils) { const p = profil(brut); if (p && !profils.includes(p)) profils.push(p); }
  let prenom = texte(b.prenom, 80), nom = texte(b.nom, 80);
  if (!prenom && !nom) nom = texte(b.nomComplet, 80);
  // Story 18.17 : un fragment par cellule de commentaire (sans doublon), pour retrouver ceux qu'une fiche porte déjà.
  const commentaires = g.anne ? [...new Set(b.commentaires.map((x) => texte(x, 1000)).filter((x): x is string => !!x))].slice(0, 10) : [];
  const lieu = g.anne ? lieuDe(b.lieu) : null, mois = g.anne ? moisDe(b.date) : null;
  return {
    ref, genre, prenom, nom, telephones: telephones.slice(0, 10), emails: emails.slice(0, 10), profils: profils.slice(0, 5),
    ville: texte(b.ville, 80), entreprise: texte(b.entreprise, 120),
    projet: g.anne ? projetDe(texte(b.projet, 80), b.vente ?? null, b.achat ?? null) : null, commentaires,
    rencontre: lieu || mois ? { lieu, mois } : null,
  };
}

// ——— Colonnes d'un CSV ou d'un onglet Excel ———

type Champ = 'prenom' | 'nom' | 'nomComplet' | 'telephones' | 'emails' | 'profils' | 'ville' | 'entreprise' | 'projet' | 'vente' | 'achat' | 'commentaires' | 'lieu' | 'date';

/** Le champ d'un titre de colonne, ou null (colonne ignorée). L'ordre compte : e-mail avant adresse, interdits avant le reste. */
export function champDe(titre: string): Champ | null {
  const s = sansAccents(titre).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!s || /(type|label|libelle)/.test(s)) return null;
  // « gmail », « hotmail » : un domaine pris dans une première ligne de données n'est pas un titre (revue de code 18.9).
  if (/(courriel|(?<![gt])mail)/.test(s)) return 'emails';
  // Jamais : adresse, naissance, notes du téléphone, photo, code postal (fiche légale, règle 1).
  if (/(adresse|address|rue|street|naissance|birth|anniv|note|photo|postal|zip|cedex)/.test(s)) return null;
  if (/^(prenom|firstname|givenname|first)$/.test(s)) return 'prenom';
  if (/^(nom|lastname|familyname|nomdefamille|last|surname|nomdenaissance)$/.test(s)) return 'nom';
  if (/^(nomcomplet|name|fullname|displayname|contact|nometprenom|prenometnom)$/.test(s)) return 'nomComplet';
  if (/(^tel($|[0-9]|ephone|fixe|perso|pro|mobile|portable|dom|trav|bur)|phone|portable|mobile|gsm)/.test(s)) return 'telephones';
  if (/(url|profil|profile|linkedin)/.test(s)) return 'profils';
  if (/^(ville|city|commune|localite)([0-9]|domicile|perso|pro|value)*$/.test(s)) return 'ville';
  if (/(entreprise|societe|company|organisation|organization|employeur)/.test(s)) return 'entreprise';
  // Story 18.17 : « Projet HA » (achat) du fichier d'Anne, « PA » et « PV » de Feuil1 ; exacts seulement, jamais « pa » dans un mot.
  if (/projet.*vente/.test(s) || /^(projet)?pv$/.test(s)) return 'vente';
  if (/projet.*achat/.test(s) || /^(projet)?(ha|pa)$/.test(s)) return 'achat';
  if (/^projet$/.test(s)) return 'projet';
  // La rencontre (animation EDB) : colonne « EDB » = le lieu, « DATE » = le mois.
  if (/^(edb|lieurencontre|lieuderencontre)$/.test(s)) return 'lieu';
  if (/^(date|daterencontre|datedelarencontre|moisderencontre)$/.test(s)) return 'date';
  if (/(commentaire|remarque|rappel)/.test(s) || /^relance[0-9]*$/.test(s)) return 'commentaires';
  return null;
}

/** Titres de colonnes ignorés que l'aperçu peut nommer (liste fermée, sans accent ni ponctuation) : tout autre titre est seulement compté. */
const TITRES_CONNUS = new Set([
  'adresse', 'adresse1', 'adresse2', 'rue', 'codepostal', 'cp', 'pays', 'region', 'departement', 'naissance', 'datedenaissance',
  'anniversaire', 'note', 'notes', 'commentaire', 'commentaires', 'remarque', 'remarques', 'type', 'civilite', 'titre', 'photo',
  'siteweb', 'site', 'fax', 'position', 'connectedon', 'jobtitle', 'dateajoutee', 'categorie', 'categories', 'groupe', 'groupes', 'etiquettes', 'fonction', 'poste', 'service',
]);

function lireGrille(grille: string[][], nomOnglet: string, genre: Genre, io: number, c: Compteurs, ignores: Set<string>): Ligne[] {
  const [entetes = [], ...corps] = grille;
  const champs = entetes.map((t) => champDe(String(t ?? '')));
  // Revue de code 18.9 : un fichier sans ligne de titres fait prendre sa première ligne de données pour des titres.
  // 1. Une première ligne qui ressemble à des données (« @ » ou six chiffres ou plus dans une cellule) refuse l'import,
  //    sans rien en dire. 2. Un titre ignoré n'est nommé que s'il figure dans la courte liste fermée TITRES_CONNUS ; tous
  //    les autres sont seulement comptés.
  if (entetes.some((t) => { const x = String(t ?? ''); return x.includes('@') || (x.match(/[0-9]/g)?.length ?? 0) >= 6; })) {
    throw new ErreurImport('colonnes', `La première ligne doit être une ligne de titres${nomOnglet ? ` (onglet « ${nomOnglet.slice(0, 40)} »)` : ''} : le fichier semble commencer directement par des contacts.`);
  }
  let masques = 0;
  entetes.forEach((t, i) => {
    const titre = String(t ?? '').trim();
    if (champs[i] || !titre) return;
    const cle = sansAccents(titre).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (TITRES_CONNUS.has(cle)) ignores.add(`colonne « ${titre.slice(0, 40)} »${nomOnglet ? ` (${nomOnglet.slice(0, 40)})` : ''}`);
    else masques++;
  });
  if (masques) ignores.add(`colonnes au titre non affiché${nomOnglet ? ` (${nomOnglet.slice(0, 40)})` : ''} : ${masques}`);
  if (!champs.some((x) => x === 'telephones' || x === 'emails' || x === 'nom' || x === 'nomComplet' || x === 'prenom')) {
    throw new ErreurImport('colonnes', `Aucune colonne reconnue${nomOnglet ? ` dans l'onglet « ${nomOnglet.slice(0, 40)} »` : ''} : la première ligne doit porter les titres (Prénom, Nom, Téléphone, E-mail…).`);
  }
  const lignes: Ligne[] = [];
  corps.forEach((cellules, i) => {
    if (!cellules.some((v) => String(v ?? '').trim())) return;
    const b: Brut = { telephones: [], emails: [], profils: [], commentaires: [] };
    champs.forEach((ch, k) => {
      const v = String(cellules[k] ?? '');
      if (!ch || !v.trim()) return;
      if (ch === 'commentaires') b.commentaires.push(/^relance/i.test(sansAccents(String(entetes[k] ?? '')).trim()) ? `${etiquetteRelance(String(entetes[k]))} : ${relanceLisible(v)}` : v);
      else if (ch === 'telephones' || ch === 'emails' || ch === 'profils') b[ch].push(v);
      else if (!b[ch]) b[ch] = v;
    });
    lignes.push(nettoyer(b, `${io}:${i + 2}`, genre, c));
  });
  return lignes;
}

// ——— vCard ———

function decoderQp(v: string, charset: string): string {
  const octets: number[] = [];
  for (let i = 0; i < v.length; i++) {
    if (v[i] === '=' && /^[0-9A-Fa-f]{2}$/.test(v.slice(i + 1, i + 3))) { octets.push(parseInt(v.slice(i + 1, i + 3), 16)); i += 2; }
    else for (const o of new TextEncoder().encode(v[i])) octets.push(o);
  }
  try { return new TextDecoder(charset || 'utf-8').decode(new Uint8Array(octets)); } catch { return new TextDecoder('utf-8').decode(new Uint8Array(octets)); }
}
const deseparer = (v: string) => v.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1');
const composants = (v: string) => v.split(/(?<!\\);/).map(deseparer);

/** Nom de propriété vCard acceptable dans l'aperçu (RFC 6350 : lettres, chiffres, tirets). */
const NOM_PROPRIETE = /^[A-Z][A-Z0-9-]{0,29}$/;

/**
 * Les lignes logiques d'une vCard : une ligne repliée (suite commençant par une espace ou une tabulation, RFC 6350) et,
 * en vCard 2.1, une valeur QUOTED-PRINTABLE poursuivie après un « = » final (saut doux, suite sans espace en tête) sont
 * réunies avant toute lecture. Le saut doux passe d'abord : la suite d'une valeur QUOTED-PRINTABLE garde son espace de
 * tête. Même règle dans scripts/claude-import.mjs, qui retire les propriétés interdites avant l'envoi (revue de code 18.9).
 */
export function lignesLogiquesVcard(t: string): string[] {
  const logiques: string[] = [];
  for (const l of t.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/)) {
    const i = logiques.length - 1;
    if (i >= 0 && logiques[i].endsWith('=') && /QUOTED-PRINTABLE/i.test(logiques[i].split(':')[0])) { logiques[i] = logiques[i].slice(0, -1) + l; continue; }
    if (i >= 0 && /^[ \t]/.test(l)) { logiques[i] += l.slice(1); continue; }
    logiques.push(l);
  }
  return logiques;
}

/** Lit un export vCard : une ligne par fiche. Les propriétés non lues sont comptées dans `ignores` (par nom seulement). */
export function lireVcard(t: string, genre: Genre, c: Compteurs, ignores: Set<string>): Ligne[] {
  const logiques = lignesLogiquesVcard(t);
  const lignes: Ligne[] = [];
  let b: Brut | null = null, n = 0, illisibles = 0;
  for (const l of logiques) {
    const deux = l.indexOf(':');
    if (deux < 0) { if (b && l.trim()) illisibles++; continue; }
    const tete = l.slice(0, deux), brute = l.slice(deux + 1);
    const [nomProp, ...params] = tete.split(';');
    const prop = nomProp.replace(/^[^.]*\./, '').toUpperCase();
    // Revue de code 18.9 : un nom de propriété qui n'en est pas un (morceau de note, ligne cassée) n'est jamais renvoyé dans
    // l'aperçu, seulement compté : il pourrait porter une donnée.
    if (!NOM_PROPRIETE.test(prop)) { if (b) illisibles++; continue; }
    if (prop === 'BEGIN' && /^VCARD$/i.test(brute.trim())) { b = { telephones: [], emails: [], profils: [], commentaires: [] }; continue; }
    if (prop === 'END' && /^VCARD$/i.test(brute.trim())) {
      if (b) lignes.push(nettoyer(b, `0:${++n}`, genre, c));
      b = null; continue;
    }
    if (!b) continue;
    const p = params.map((x) => x.toUpperCase());
    const qp = p.some((x) => x === 'QUOTED-PRINTABLE' || x === 'ENCODING=QUOTED-PRINTABLE');
    const charset = /^CHARSET=(.+)$/i.exec(params.find((x) => /^CHARSET=/i.test(x)) ?? '')?.[1] ?? 'utf-8';
    const valeur = qp ? decoderQp(brute, charset) : brute;
    switch (prop) {
      case 'N': { const [famille, donne] = composants(valeur); b.nom ??= famille || null; b.prenom ??= donne || null; break; }
      case 'FN': b.nomComplet ??= deseparer(valeur); break;
      case 'TEL': b.telephones.push(valeur.replace(/^tel:/i, '')); break;
      case 'EMAIL': b.emails.push(valeur); break;
      case 'ORG': b.entreprise ??= composants(valeur)[0] || null; break;
      case 'VERSION': case 'PRODID': case 'UID': case 'REV': break;
      default: ignores.add(`propriété vCard ${prop}`);
    }
  }
  if (illisibles) ignores.add(`lignes vCard illisibles (non lues) : ${illisibles}`);
  return lignes;
}

// ——— Lecture de la demande ———

async function sha256(t: string): Promise<string> {
  const o = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)));
  return Array.from(o, (x) => x.toString(16).padStart(2, '0')).join('');
}

const estGenre = (g: unknown): g is Genre => typeof g === 'string' && Object.prototype.hasOwnProperty.call(GENRES, g);

/** Lit `fichier` (format, nom, genre, contenu ou onglets) ; lève une ErreurImport (400) au premier défaut. */
export async function lireFichier(brut: unknown): Promise<Lecture> {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) throw new ErreurImport('fichier', 'fichier attendu.');
  const f = brut as Record<string, unknown>;
  const inconnu = Object.keys(f).find((k) => !['format', 'nom', 'genre', 'detail', 'contenu', 'onglets'].includes(k));
  if (inconnu) throw new ErreurImport('fichier', `Champ inconnu dans fichier : ${inconnu.slice(0, 40)}`);
  // Le nom du fichier seulement, jamais un chemin (AD-31).
  const nom = typeof f.nom === 'string' ? f.nom.split(/[\\/]/).pop()!.trim().slice(0, 120) : '';
  if (!nom) throw new ErreurImport('fichier', 'Nom du fichier attendu.');
  const c: Compteurs = { tel: 0, mail: 0 };
  const ignores = new Set<string>();
  const onglets: Onglet[] = [];
  if (f.format === 'vcard' || f.format === 'csv') {
    if (!estGenre(f.genre)) throw new ErreurImport('genre', `Genre inconnu ; attendus : ${Object.keys(GENRES).join(', ')}.`);
    if (typeof f.contenu !== 'string' || !f.contenu.trim()) throw new ErreurImport('contenu', 'Contenu du fichier attendu (texte).');
    if (f.contenu.length > MAX_CONTENU) throw new ErreurImport('trop_grand', 'Fichier trop grand : découpez-le.', 413);
    const lignes = f.format === 'vcard' ? lireVcard(f.contenu, f.genre, c, ignores) : lireGrille(lireCsv(f.contenu), '', f.genre, 0, c, ignores);
    onglets.push({ nom: '', genre: f.genre, detail: texte(f.detail, 120), lignes });
  } else if (f.format === 'tableur') {
    if (!Array.isArray(f.onglets) || !f.onglets.length || f.onglets.length > MAX_ONGLETS) throw new ErreurImport('onglets', `De 1 à ${MAX_ONGLETS} onglets attendus.`);
    let io = 0;
    for (const o of f.onglets as unknown[]) {
      if (!o || typeof o !== 'object' || Array.isArray(o)) throw new ErreurImport('onglets', 'Onglet mal formé.');
      const x = o as Record<string, unknown>;
      if (Object.keys(x).some((k) => !['nom', 'genre', 'detail', 'lignes'].includes(k))) throw new ErreurImport('onglets', 'Champ inconnu dans un onglet.');
      if (!estGenre(x.genre)) throw new ErreurImport('genre', `Genre d'onglet inconnu ; attendus : ${Object.keys(GENRES).join(', ')}.`);
      const grille = x.lignes;
      if (!Array.isArray(grille) || !grille.every((l) => Array.isArray(l) && l.length <= 80 && l.every((v) => typeof v === 'string' && v.length <= 4000))) {
        throw new ErreurImport('onglets', 'Lignes d\'onglet attendues : des listes de textes (80 cellules au plus).');
      }
      const nomOnglet = texte(x.nom, 60) ?? `onglet ${io + 1}`;
      onglets.push({ nom: nomOnglet, genre: x.genre, detail: texte(x.detail, 120), lignes: lireGrille(grille as string[][], nomOnglet, x.genre, io, c, ignores) });
      io++;
    }
  } else throw new ErreurImport('format', 'Format attendu : vcard, csv ou tableur.');
  const lignesLues = onglets.reduce((t, o) => t + o.lignes.length, 0);
  if (!lignesLues) throw new ErreurImport('vide', 'Aucune ligne lisible dans ce fichier.');
  if (lignesLues > MAX_LIGNES) throw new ErreurImport('trop_grand', `Au plus ${MAX_LIGNES} lignes par import : découpez le fichier.`, 413);
  // L'empreinte porte sur les lignes normalisées (et le nom, le genre et le détail de chaque onglet), pas sur la mise en forme.
  const empreinte = await sha256(JSON.stringify({ nom, onglets }));
  return { nom, onglets, lignesLues, ignores: [...ignores].sort(), telephonesInvalides: c.tel, emailsInvalides: c.mail, empreinte };
}

// ——— Les personnes du fichier ———

/** Une personne du fichier : ses lignes (fusionnées quand elles partagent un téléphone, un e-mail ou un profil). */
interface RencontreFichier { source: string; lieu: string | null; mois: string | null }
interface Personne {
  ref: string; refs: string[]; genres: Set<Genre>; details: Set<string>;
  prenom: string | null; nom: string | null; telephones: string[]; emails: string[]; profils: string[];
  ville: string | null; entreprise: string | null; projet: string | null;
  /** Les fragments de commentaire du fichier (un par cellule), sans doublon. */
  notes: string[];
  /** Story 18.17 : les rencontres du fichier (source de la ligne, lieu, mois), sans doublon. */
  rencontres: RencontreFichier[];
  /** Revue de code 18.9 : les seules adresses venues d'une ligne où la personne a donné son accord (onglet EDB, FR-10).
   * Une adresse venue d'un autre onglet, même fusionnée dans la même personne, n'en reçoit jamais. */
  emailsAccord: string[];
}

function personnes(l: Lecture): { liste: Personne[]; rejets: { ligne: string; raison: Raison }[]; fusionnees: number } {
  const liste: Personne[] = [];
  const parCle = new Map<string, Personne>();
  const rejets: { ligne: string; raison: Raison }[] = [];
  let fusionnees = 0;
  for (const o of l.onglets) for (const x of o.lignes) {
    if (!x.nom && !x.prenom && !x.telephones.length && !x.emails.length) { rejets.push({ ligne: x.ref, raison: 'vide' }); continue; }
    if (!x.nom && !x.telephones.length && !x.emails.length) { rejets.push({ ligne: x.ref, raison: 'vide' }); continue; }
    const cles = [...x.telephones.map((v) => `t:${v}`), ...x.emails.map((v) => `e:${v}`), ...x.profils.map((v) => `p:${v}`)];
    const trouvees = [...new Set(cles.map((k) => parCle.get(k)).filter((p): p is Personne => !!p))];
    let p: Personne;
    if (!trouvees.length) {
      p = { ref: x.ref, refs: [], genres: new Set(), details: new Set(), prenom: null, nom: null, telephones: [], emails: [], profils: [], ville: null, entreprise: null, projet: null, notes: [], rencontres: [], emailsAccord: [] };
      liste.push(p);
    } else {
      p = trouvees[0];
      fusionnees++;
      // Deux personnes déjà vues que cette ligne relie : la seconde rejoint la première.
      for (const autre of trouvees.slice(1)) {
        fusionner(p, autre);
        liste.splice(liste.indexOf(autre), 1);
        for (const [k, v] of parCle) if (v === autre) parCle.set(k, p);
      }
    }
    fusionner(p, { ref: x.ref, refs: [x.ref], genres: new Set([x.genre]), details: new Set(o.detail ? [o.detail] : []), prenom: x.prenom, nom: x.nom,
      telephones: x.telephones, emails: x.emails, profils: x.profils, ville: x.ville, entreprise: x.entreprise, projet: x.projet, notes: x.commentaires,
      rencontres: x.rencontre ? [{ source: GENRES[x.genre].source, ...x.rencontre }] : [],
      emailsAccord: GENRES[x.genre].accord ? x.emails : [] });
    for (const k of cles) parCle.set(k, p);
  }
  return { liste, rejets, fusionnees };
}

function fusionner(p: Personne, q: Personne): void {
  p.refs.push(...q.refs);
  q.genres.forEach((g) => p.genres.add(g));
  q.details.forEach((d) => p.details.add(d));
  if (!p.prenom && !p.nom) { p.prenom = q.prenom; p.nom = q.nom; }
  for (const k of ['telephones', 'emails', 'profils', 'emailsAccord'] as const) for (const v of q[k]) if (!p[k].includes(v)) p[k].push(v);
  p.ville ??= q.ville; p.entreprise ??= q.entreprise;
  if (q.projet && (!p.projet || p.projet === 'a_qualifier')) p.projet = q.projet;
  for (const n of q.notes) if (!p.notes.includes(n)) p.notes.push(n);
  for (const r of q.rencontres) if (!p.rencontres.some((x) => x.source === r.source && x.lieu === r.lieu && x.mois === r.mois)) p.rencontres.push(r);
}

/**
 * La catégorie de départ d'une personne (la plus haute de ses genres, FR-9). Story 18.15 : si Anne a retiré cette
 * catégorie (`existantes` : celles de la table `categorie`), la fiche arrive « à ranger » (null) plutôt que d'échouer sur
 * la clé étrangère.
 */
const categorieDe = (p: Personne, existantes: ReadonlySet<string>): string | null => {
  const c = [...p.genres].map((g) => GENRES[g].categorie as string).sort((a, b) => rang(a) - rang(b))[0];
  return existantes.has(c) ? c : null;
};
const categoriesExistantes = async (env: EnvSite) => new Set((await env.DB.prepare('SELECT id FROM categorie').all<{ id: string }>()).results.map((c) => c.id));
const sourcesDe = (p: Personne): string[] =>
  [...new Set([...[...p.genres].filter((g) => GENRES[g].cree).map((g) => GENRES[g].source as string), ...p.rencontres.map((r) => r.source)])];
const cree = (p: Personne) => [...p.genres].some((g) => GENRES[g].cree);

// ——— Ce que la base sait déjà (lecture seule, rien de renvoyé hors du module) ———

interface Existant {
  id: string; prenom: string | null; nom: string | null; telephone: string | null; email: string | null; commune: string | null; entreprise: string | null;
  categorie_id: string | null; projet: string; temperature: string | null; verifie_le: string | null; ecarte_le: string | null; etape: string | null;
  email_accord_le: string | null; email_desinscrit_le: string | null;
}

/** Les personnes en opposition (AD-31), ou 'sans_secret' : même règle que la fiche (story 18.7, revue de code). */
async function oppositions(env: EnvSite, liste: Personne[]): Promise<Set<Personne> | 'sans_secret'> {
  const valeurs = [...new Set(liste.flatMap((p) => [...p.telephones, ...p.emails]))];
  if (!valeurs.length) return new Set();
  if (!env.LIEN_SECRET) {
    journal('opposition_sans_secret', { valeurs: valeurs.length, chemin: 'import' });
    return (await env.DB.prepare('SELECT 1 AS n FROM opposition LIMIT 1').first()) ? 'sans_secret' : new Set();
  }
  const secret = env.LIEN_SECRET;
  const parEmpreinte = new Map<string, string>();
  for (const v of valeurs) parEmpreinte.set(await empreinteOpposition(secret, v), v);
  const r = await env.DB.prepare('SELECT empreinte FROM opposition WHERE empreinte IN (SELECT value FROM json_each(?1))')
    .bind(JSON.stringify([...parEmpreinte.keys()])).all<{ empreinte: string }>();
  const refusees = new Set(r.results.map((x) => parEmpreinte.get(x.empreinte)!));
  return new Set(liste.filter((p) => [...p.telephones, ...p.emails].some((v) => refusees.has(v))));
}

const COLONNES_EXISTANT = 'id, prenom, nom, telephone, email, commune, entreprise, categorie_id, projet, temperature, verifie_le, ecarte_le, etape, email_accord_le, email_desinscrit_le';

async function lireBase(env: EnvSite, liste: Personne[]) {
  const valeurs = JSON.stringify([...new Set(liste.flatMap((p) => [...p.telephones, ...p.emails, ...p.profils]))]);
  const [prises, noms] = await env.DB.batch([
    env.DB.prepare(`SELECT id, telephone AS valeur FROM contact WHERE telephone IN (SELECT value FROM json_each(?1))
       UNION ALL SELECT id, email FROM contact WHERE email IN (SELECT value FROM json_each(?1))
       UNION ALL SELECT contact_id, valeur FROM contact_coordonnee WHERE valeur IN (SELECT value FROM json_each(?1))`).bind(valeurs),
    env.DB.prepare('SELECT id, prenom, nom FROM contact WHERE nom IS NOT NULL OR prenom IS NOT NULL'),
  ]) as [D1Result<{ id: string; valeur: string }>, D1Result<{ id: string; prenom: string | null; nom: string | null }>];
  const parValeur = new Map(prises.results.map((x) => [x.valeur, x.id]));
  const parNom = new Map<string, string[]>();
  for (const x of noms.results) {
    const k = cleNomComplet(x.prenom, x.nom);
    if (k.includes(' ')) parNom.set(k, [...(parNom.get(k) ?? []), x.id]);
  }
  return { parValeur, parNom };
}

/** Une ligne de `contact_source` d'un contact existant (story 18.17). */
interface SourceExistante { id: number; source: string; lieu: string | null; mois: string | null }

async function lireExistants(env: EnvSite, ids: string[]): Promise<{ etats: Map<string, Existant>; secondaires: Map<string, string[]>; sources: Map<string, SourceExistante[]>; notes: Map<string, string[]> }> {
  const etats = new Map<string, Existant>(), secondaires = new Map<string, string[]>(), sources = new Map<string, SourceExistante[]>(), notes = new Map<string, string[]>();
  if (!ids.length) return { etats, secondaires, sources, notes };
  const charge = JSON.stringify(ids);
  const [e, s, src, nts] = await env.DB.batch([
    env.DB.prepare(`SELECT ${COLONNES_EXISTANT} FROM contact WHERE id IN (SELECT value FROM json_each(?1))`).bind(charge),
    env.DB.prepare('SELECT contact_id, valeur FROM contact_coordonnee WHERE contact_id IN (SELECT value FROM json_each(?1))').bind(charge),
    env.DB.prepare('SELECT id, contact_id, source, lieu, mois FROM contact_source WHERE contact_id IN (SELECT value FROM json_each(?1)) ORDER BY id').bind(charge),
    env.DB.prepare(`SELECT contact_id, texte FROM contact_evenement WHERE type = 'note' AND texte IS NOT NULL AND contact_id IN (SELECT value FROM json_each(?1))`).bind(charge),
  ]) as [D1Result<Existant>, D1Result<{ contact_id: string; valeur: string }>, D1Result<SourceExistante & { contact_id: string }>, D1Result<{ contact_id: string; texte: string }>];
  for (const x of e.results) etats.set(x.id, x);
  for (const x of s.results) secondaires.set(x.contact_id, [...(secondaires.get(x.contact_id) ?? []), x.valeur]);
  for (const x of src.results) sources.set(x.contact_id, [...(sources.get(x.contact_id) ?? []), { id: x.id, source: x.source, lieu: x.lieu, mois: x.mois }]);
  for (const x of nts.results) notes.set(x.contact_id, [...(notes.get(x.contact_id) ?? []), x.texte]);
  return { etats, secondaires, sources, notes };
}

// ——— Le plan : ce que l'import ferait ———

export type Decision = 'garder' | `fusionner:${string}`;
interface Doublon { ligne: string; prenom: string | null; nom: string | null; existants: { id: string; nom: string; sources: string[] }[] }

interface Plan {
  nouveaux: { p: Personne }[];
  complements: { p: Personne; cible: Existant }[];
  doublons: Doublon[];
  rejets: { ligne: string; raison: Raison }[];
  fusionnees: number;
  secondaires: Map<string, string[]>;
  /** Story 18.17 : ce que la base porte déjà de chaque contact retrouvé (lignes de source, textes des notes). */
  sourcesExistantes: Map<string, SourceExistante[]>;
  notesExistantes: Map<string, string[]>;
}

async function planifier(env: EnvSite, l: Lecture, decisions: Record<string, Decision>): Promise<Plan> {
  const { liste, rejets, fusionnees } = personnes(l);
  const opp = await oppositions(env, liste);
  if (opp === 'sans_secret') throw new ErreurImport('opposition_indisponible', 'La liste d\'opposition ne peut pas être vérifiée (LIEN_SECRET absent) : import impossible.', 503);
  const { parValeur, parNom } = await lireBase(env, liste.filter((p) => !opp.has(p)));
  const sures = new Map<Personne, Set<string>>(), parNomTrouve = new Map<Personne, string[]>();
  for (const p of liste) {
    if (opp.has(p)) { rejets.push({ ligne: p.ref, raison: 'opposition' }); continue; }
    const ids = new Set([...p.telephones, ...p.emails, ...p.profils].map((v) => parValeur.get(v)).filter((x): x is string => !!x));
    sures.set(p, ids);
    if (!ids.size) { const k = cleNomComplet(p.prenom, p.nom); if (k.includes(' ') && parNom.has(k)) parNomTrouve.set(p, parNom.get(k)!.slice(0, 5)); }
  }
  const aLire = new Set<string>();
  for (const ids of sures.values()) ids.forEach((i) => aLire.add(i));
  for (const ids of parNomTrouve.values()) ids.forEach((i) => aLire.add(i));
  const { etats, secondaires, sources, notes } = await lireExistants(env, [...aLire]);
  const plan: Plan = { nouveaux: [], complements: [], doublons: [], rejets, fusionnees, secondaires, sourcesExistantes: sources, notesExistantes: notes };
  const parCible = new Map<string, { p: Personne; cible: Existant }>();
  const completer = (p: Personne, cible: Existant) => {
    if (cible.ecarte_le) { plan.rejets.push({ ligne: p.ref, raison: 'ecarte' }); return; }
    const deja = parCible.get(cible.id);
    if (deja) { fusionner(deja.p, p); return; }
    const x = { p, cible };
    parCible.set(cible.id, x);
    plan.complements.push(x);
  };
  for (const [p, ids] of sures) {
    if (ids.size > 1) { plan.rejets.push({ ligne: p.ref, raison: 'plusieurs_contacts' }); continue; }
    if (ids.size === 1) { const cible = etats.get([...ids][0]); if (cible) completer(p, cible); continue; }
    if (!cree(p)) { plan.rejets.push({ ligne: p.ref, raison: 'complement_sans_contact' }); continue; }
    const candidats = parNomTrouve.get(p);
    if (candidats) {
      const d = decisions[p.ref];
      if (d === 'garder') { plan.nouveaux.push({ p }); continue; }
      if (typeof d === 'string' && d.startsWith('fusionner:')) {
        const id = d.slice('fusionner:'.length);
        const cible = etats.get(id);
        if (cible && candidats.includes(id)) completer(p, cible);
        else plan.rejets.push({ ligne: p.ref, raison: 'fusion_invalide' });
        continue;
      }
      plan.doublons.push({
        ligne: p.ref, prenom: p.prenom, nom: p.nom,
        existants: candidats.map((id) => etats.get(id)).filter((c): c is Existant => !!c)
          .map((c) => ({ id: c.id, nom: [c.prenom, c.nom].filter(Boolean).join(' '), sources: [...new Set((sources.get(c.id) ?? []).map((x) => x.source))] })),
      });
      continue;
    }
    plan.nouveaux.push({ p });
  }
  return plan;
}

// ——— Aperçu ———

export interface Apercu {
  empreinte: string; fichier: string; lignes: number; personnes: number; fusionnees_dans_le_fichier: number;
  nouveaux: number; complements: number; complements_verifies: number; doublons_probables: number; rejetes: number;
  raisons: Partial<Record<Raison, number>>; categories: Record<string, number>; accords: number;
  telephones_invalides: number; emails_invalides: number; champs_ignores: string[];
  doublons: Doublon[]; rejets: { ligne: string; raison: Raison }[];
  /** Story 18.17 : rencontres, notes et projets que l'import ajouterait, en nombres. */
  bilan: Bilan;
}

/** Les écritures du plan, nouveaux puis compléments, et leur bilan en nombres (aperçu et import). */
function ecrituresDuPlan(plan: Plan, existantes: ReadonlySet<string>): { ecritures: EcritureImport[]; bilan: Bilan } {
  const bilan = bilanVide();
  const ecritures: EcritureImport[] = plan.nouveaux.map(({ p }) => {
    bilan.rencontres_ajoutees += p.rencontres.length;
    if (p.notes.length) bilan.notes_ajoutees++;
    return ecritureNouveau(p, existantes);
  });
  for (const x of plan.complements) {
    const { e, b } = ecritureComplement(x, plan.secondaires.get(x.cible.id) ?? [], existantes, plan.sourcesExistantes.get(x.cible.id) ?? [], plan.notesExistantes.get(x.cible.id) ?? []);
    ecritures.push(e);
    for (const k of Object.keys(b) as (keyof Bilan)[]) bilan[k] += b[k];
  }
  return { ecritures, bilan };
}

const compterRaisons = (r: { raison: Raison }[]) => r.reduce<Partial<Record<Raison, number>>>((t, x) => ({ ...t, [x.raison]: (t[x.raison] ?? 0) + 1 }), {});

/** L'aperçu : rien n'est écrit. Seules les lignes du fichier sont renvoyées, plus, pour un doublon probable, le nom et les sources du contact existant. */
export async function apercu(env: EnvSite, l: Lecture, decisions: Record<string, Decision> = {}): Promise<Apercu> {
  const plan = await planifier(env, l, decisions);
  const categories: Record<string, number> = {};
  const existantes = await categoriesExistantes(env);
  // « a_ranger » : la catégorie de départ a été retirée, la fiche arriverait sans catégorie (story 18.15).
  for (const { p } of plan.nouveaux) { const c = categorieDe(p, existantes) ?? 'a_ranger'; categories[c] = (categories[c] ?? 0) + 1; }
  const { ecritures, bilan } = ecrituresDuPlan(plan, existantes);
  return {
    empreinte: l.empreinte, fichier: l.nom, lignes: l.lignesLues,
    personnes: plan.nouveaux.length + plan.complements.length + plan.doublons.length, fusionnees_dans_le_fichier: plan.fusionnees,
    nouveaux: plan.nouveaux.length, complements: plan.complements.length, complements_verifies: plan.complements.filter((x) => x.cible.verifie_le).length,
    doublons_probables: plan.doublons.length, rejetes: plan.rejets.length, raisons: compterRaisons(plan.rejets), categories,
    // Les accords que l'import poserait : nouveaux et compléments (revue de code 18.9, l'aperçu oubliait les compléments).
    accords: ecritures.filter((e) => e.accord).length,
    telephones_invalides: l.telephonesInvalides, emails_invalides: l.emailsInvalides, champs_ignores: l.ignores,
    doublons: plan.doublons, rejets: plan.rejets, bilan,
  };
}

// ——— Import réel ———

/** Ce que l'import ajoute ou change, en nombres seulement (aperçu et résultat, story 18.17) : jamais une donnée. */
export interface Bilan {
  rencontres_ajoutees: number; rencontres_completees: number; notes_ajoutees: number; notes_deja_presentes: number;
  projets_poses: number; vendeur_vers_vendeur_acheteur: number;
}
const bilanVide = (): Bilan => ({ rencontres_ajoutees: 0, rencontres_completees: 0, notes_ajoutees: 0, notes_deja_presentes: 0, projets_poses: 0, vendeur_vers_vendeur_acheteur: 0 });

/** Un texte de note comparé sans accents, majuscules ni espaces en trop. */
const normaliserNote = (t: string) => sansAccents(t).toLowerCase().replace(/\s+/g, ' ').trim();
/** Ce commentaire est-il déjà sur la fiche ? Un long fragment se retrouve dans le texte d'une note, un court (« oui ») doit en être un morceau entier. */
const dejaNote = (fragment: string, notes: string[]) => {
  const k = normaliserNote(fragment);
  return notes.some((d) => (k.length >= 8 ? d.includes(k) : d.split(/ · | : /).some((m) => m === k)));
};

/**
 * Ce qu'un contact existant reçoit, selon AD-26, FR-8, FR-9 et la story 18.17. Un contact vérifié ne reçoit qu'une source, des
 * coordonnées, la rencontre du fichier, les commentaires qu'il n'a pas déjà en note et le passage de vendeur à vendeur et
 * acheteur ; un contact non vérifié reçoit en plus nom, ville, entreprise vides, catégorie proposée et projet. Un contact déjà
 * importé de la même source (`reprise`) ne change jamais de catégorie : Anne a pu la changer.
 */
function ecritureComplement(x: { p: Personne; cible: Existant }, secondairesActuels: string[], existantes: ReadonlySet<string>,
  sourcesActuelles: SourceExistante[], notesActuelles: string[]): { e: EcritureImport; b: Bilan } {
  const { p, cible: c } = x;
  const b = bilanVide();
  const verifie = !!c.verifie_le;
  const reprise = sourcesDe(p).some((s) => sourcesActuelles.some((a) => a.source === s));
  const connues = new Set([c.telephone, c.email, ...secondairesActuels].filter(Boolean));
  const tels = p.telephones.filter((v) => !connues.has(v)), mails = p.emails.filter((v) => !connues.has(v)), profils = p.profils.filter((v) => !connues.has(v));
  const avant: Record<string, string | null> = {}, apres: Record<string, string | null> = {};
  const poser = (k: keyof Existant, v: string | null) => { if (v !== null && v !== c[k]) { avant[k] = c[k] as string | null; apres[k] = v; } };
  if (!c.telephone && tels.length) poser('telephone', tels.shift()!);
  if (!c.email && mails.length) poser('email', mails.shift()!);
  if (!verifie) {
    if (!c.prenom && !c.nom) { poser('prenom', p.prenom); poser('nom', p.nom); }
    if (!c.commune) poser('commune', p.ville);
    if (!c.entreprise) poser('entreprise', p.entreprise);
    // FR-9 : la règle la plus haute l'emporte, entre la catégorie proposée d'avant et celle de ce fichier.
    const proposee = categorieDe(p, existantes);
    if (!reprise && proposee && (!c.categorie_id || (rang(c.categorie_id) < 99 && rang(proposee) < rang(c.categorie_id)))) poser('categorie_id', proposee);
    if (c.projet === 'a_qualifier' && c.etape === null && p.projet && p.projet !== 'a_qualifier') { poser('projet', p.projet); b.projets_poses++; }
  }
  // Story 18.17 : le fichier dit achat et vente, la fiche est encore « vendeur » sans suivi : elle devient « vendeur et acheteur ».
  if (c.projet === 'vendeur' && c.etape === null && p.projet === 'vendeur_acheteur') { poser('projet', 'vendeur_acheteur'); b.vendeur_vers_vendeur_acheteur++; }

  // Les rencontres : une ligne identique (source, lieu, mois) existe déjà, sinon on complète une ligne de la même source qui
  // n'a pas encore ce lieu ou ce mois, sinon on en ajoute une. Les sources sans rencontre n'ajoutent une ligne que si absentes.
  const lignesSource: LigneSourceImport[] = [], sourcesCompletees: SourceCompletee[] = [], prises = new Set<number>();
  for (const r of p.rencontres) {
    if (sourcesActuelles.some((s) => s.source === r.source && s.lieu === r.lieu && s.mois === r.mois)) continue;
    const cible = sourcesActuelles.find((s) => !prises.has(s.id) && s.source === r.source && (s.lieu === null || s.lieu === r.lieu) && (s.mois === null || s.mois === r.mois));
    if (cible) {
      prises.add(cible.id);
      sourcesCompletees.push({ id: cible.id, lieu: cible.lieu ?? r.lieu, mois: cible.mois ?? r.mois, avant_lieu: cible.lieu, avant_mois: cible.mois });
      b.rencontres_completees++;
    } else { lignesSource.push({ source: r.source, lieu: r.lieu, mois: r.mois }); b.rencontres_ajoutees++; }
  }
  for (const src of sourcesDe(p)) {
    if (!p.rencontres.some((r) => r.source === src) && !sourcesActuelles.some((s) => s.source === src)) lignesSource.push({ source: src, lieu: null, mois: null });
  }

  // Les commentaires du fichier, même pour une fiche vérifiée, sauf ceux que la fiche porte déjà (une seule note pour les nouveaux).
  const dejaLa = notesActuelles.map(normaliserNote);
  const nouvelles = p.notes.filter((n) => !dejaNote(n, dejaLa));
  b.notes_deja_presentes += p.notes.length - nouvelles.length;
  if (nouvelles.length) b.notes_ajoutees++;

  const emailFinal = apres.email ?? c.email;
  return { b, e: {
    id: c.id, nouveau: false, ligne: p.ref, avant, apres,
    garde: { prenom: c.prenom, nom: c.nom, telephone: c.telephone, email: c.email, commune: c.commune, entreprise: c.entreprise, categorie_id: c.categorie_id,
      projet: c.projet, temperature: c.temperature, verifie_le: c.verifie_le, ecarte_le: c.ecarte_le, etape: c.etape, email_accord_le: c.email_accord_le },
    secondaires: [...tels.map((v) => ({ type: 'telephone', valeur: v })), ...mails.map((v) => ({ type: 'email', valeur: v })), ...profils.map((v) => ({ type: 'profil', valeur: v, reseau: reseauDe(v) }))],
    sources: sourcesDe(p), lignesSource, sourcesCompletees,
    notes: nouvelles.length ? [noteAvecDetail(nouvelles.join(' · '), p)] : [],
    accord: !verifie && !!emailFinal && p.emailsAccord.includes(emailFinal) && !c.email_accord_le && !c.email_desinscrit_le,
    detail: [...p.details].join(' · ') || null,
  } };
}

const reseauDe = (url: string) => /linkedin\./.test(url) ? 'linkedin' : /instagram\./.test(url) ? 'instagram' : /facebook\.|fb\./.test(url) ? 'facebook' : null;
const noteAvecDetail = (n: string, p: Personne) => `Note du fichier${p.details.size ? ` (${[...p.details].join(' · ')})` : ''} : ${n}`;

/** Un nouveau contact reçoit l'accord seulement si son e-mail principal vient d'une ligne avec accord (revue de code 18.9) ;
 * une adresse avec accord passe donc en premier. */
const emailsNouveau = (p: Personne) => { const a = p.emails.find((m) => p.emailsAccord.includes(m)); return a ? [a, ...p.emails.filter((m) => m !== a)] : p.emails; };
const accordNouveau = (p: Personne) => { const m = emailsNouveau(p)[0]; return !!m && p.emailsAccord.includes(m); };

function ecritureNouveau(p: Personne, existantes: ReadonlySet<string>): EcritureImport {
  const emails = emailsNouveau(p);
  const apres: Record<string, string | null> = {
    prenom: p.prenom, nom: p.nom, telephone: p.telephones[0] ?? null, email: emails[0] ?? null, commune: p.ville, entreprise: p.entreprise,
    categorie_id: categorieDe(p, existantes), projet: p.projet ?? 'a_qualifier',
  };
  return {
    id: ulid(), nouveau: true, ligne: p.ref, avant: {}, apres, garde: {},
    secondaires: [...p.telephones.slice(1).map((v) => ({ type: 'telephone', valeur: v })), ...emails.slice(1).map((v) => ({ type: 'email', valeur: v })),
      ...p.profils.map((v) => ({ type: 'profil', valeur: v, reseau: reseauDe(v) }))],
    sources: sourcesDe(p), lignesSource: sourcesDe(p).flatMap((src) => {
      const r = p.rencontres.filter((x) => x.source === src);
      return r.length ? r.map((x) => ({ source: src, lieu: x.lieu, mois: x.mois })) : [{ source: src, lieu: null, mois: null }];
    }), sourcesCompletees: [],
    notes: p.notes.length ? [noteAvecDetail(p.notes.join(' · '), p)] : [], accord: accordNouveau(p),
    detail: [...p.details].join(' · ') || null,
  };
}

export interface ResultatImport {
  lot: string; nouveaux: number; complements: number; doublons_laisses: number; rejetes: number; raisons: Partial<Record<Raison, number>>;
  ignores_entre_temps: number; accords: number;
  /** Story 18.17 : rencontres, notes et projets prévus par le plan (moins ceux des contacts non écrits, `ignores_entre_temps`). */
  bilan: Bilan;
}

/**
 * L'import réel. Exige l'empreinte de l'aperçu (sinon 409) ; refuse un fichier déjà importé et non annulé (409). Crée
 * l'`import_lot` (nom du fichier seulement), puis écrit par `carnet` des morceaux de PAR_LOT_D1 contacts, chacun en une
 * exécution D1 (une transaction). Un contact changé ou une coordonnée prise entre l'aperçu et l'écriture n'est pas écrit
 * (`ignores_entre_temps`) ; le lot reste annulable en entier.
 */
export async function importer(env: EnvSite, l: Lecture, empreinte: unknown, decisions: Record<string, Decision>, par: string): Promise<ResultatImport> {
  if (typeof empreinte !== 'string' || empreinte !== l.empreinte) {
    throw new ErreurImport('empreinte', 'Empreinte absente ou différente de celle du fichier : refaites l\'aperçu de ce fichier avant d\'importer.', 409);
  }
  const deja = await env.DB.prepare('SELECT id FROM import_lot WHERE empreinte = ?1 AND annule_le IS NULL').bind(l.empreinte).first<{ id: string }>();
  if (deja) throw new ErreurImport('deja_importe', `Ce fichier est déjà importé (lot ${deja.id}) : annulez ce lot avant de le réimporter.`, 409);
  const plan = await planifier(env, l, decisions);
  const lot = ulid(), maintenant = new Date().toISOString();
  const source = [...new Set(l.onglets.map((o) => GENRES[o.genre].source as string))].join('+');
  await env.DB.prepare('INSERT INTO import_lot (id, fichier, empreinte, source, a, par, doublons, rejetes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)')
    .bind(lot, l.nom, l.empreinte, source, maintenant, par, plan.doublons.length, plan.rejets.length).run();
  const existantes = await categoriesExistantes(env);
  const { ecritures, bilan } = ecrituresDuPlan(plan, existantes);
  let nouveaux = 0, complements = 0, accords = 0;
  for (let i = 0; i < ecritures.length; i += PAR_LOT_D1) {
    const r = await ecrireImport(env, lot, ecritures.slice(i, i + PAR_LOT_D1), maintenant, par);
    nouveaux += r.nouveaux; complements += r.complements; accords += r.accords;
  }
  await env.DB.prepare('UPDATE import_lot SET nouveaux = ?2, completes = ?3 WHERE id = ?1').bind(lot, nouveaux, complements).run();
  journal('import_claude', { lot, lignes: l.lignesLues, nouveaux, complements, doublons: plan.doublons.length, rejetes: plan.rejets.length });
  return {
    lot, nouveaux, complements, doublons_laisses: plan.doublons.length, rejetes: plan.rejets.length, raisons: compterRaisons(plan.rejets),
    ignores_entre_temps: ecritures.length - nouveaux - complements, accords, bilan,
  };
}

/** Annule un lot (AD-26, AD-29) ; null si le lot n'existe pas. Lève 409 pour un lot déjà annulé. */
export async function annuler(env: EnvSite, lot: string, par: string): Promise<ResultatAnnulationImport | null> {
  const l = await env.DB.prepare('SELECT id, annule_le FROM import_lot WHERE id = ?1').bind(lot).first<{ id: string; annule_le: string | null }>();
  if (!l) return null;
  if (l.annule_le) throw new ErreurImport('deja_annule', 'Ce lot est déjà annulé.', 409);
  const r = await annulerImport(env, lot, par);
  await env.DB.prepare('UPDATE import_lot SET annule_le = ?2 WHERE id = ?1').bind(lot, new Date().toISOString()).run();
  journal('import_annule', { lot, supprimes: r.supprimes, rendus: r.rendus, gardes: r.gardes.length });
  return r;
}

/** Lit les décisions de JB sur les doublons probables : { "<ligne>": "garder" | "fusionner:<id>" }. */
export function lireDecisions(brut: unknown): Record<string, Decision> {
  if (brut === undefined || brut === null) return {};
  if (typeof brut !== 'object' || Array.isArray(brut)) throw new ErreurImport('doublons', 'doublons : objet { ligne: décision } attendu.');
  const d: Record<string, Decision> = {};
  for (const [k, v] of Object.entries(brut as Record<string, unknown>)) {
    if (!/^\d{1,2}:\d{1,5}$/.test(k) || typeof v !== 'string' || !(v === 'garder' || /^fusionner:[0-9A-HJKMNP-TV-Z]{26}$/.test(v) || /^fusionner:[A-Za-z0-9_-]{1,40}$/.test(v))) {
      throw new ErreurImport('doublons', 'Décision attendue : « garder » ou « fusionner:<identifiant> ».');
    }
    d[k] = v as Decision;
  }
  return d;
}
