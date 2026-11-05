// Catégories et méthodes (story 18.8, FR-12, FR-13, AD-25) : le vocabulaire et les règles, sans accès à la base, pour
// que le serveur (`categories.ts`, route /api/categories) et la page (`pages/categories.astro`) lisent la même chose.
// Les séances (epic 19, FR-15, FR-16) reprendront `remplirMessage` pour insérer le prénom dans un message type.
//
// Envoi groupé (FR-13, AD-21) : la loi vise la personne, pas la catégorie. Un e-mail groupé ne part que vers un contact
// qui a un accord enregistré ou qui est ancien client, et `accord` le revérifie juste avant chaque envoi. La case de la
// catégorie ne peut donc que restreindre : « non permis » écarte toute la catégorie, « permis » veut dire « permis pour
// ceux de ses contacts qui ont un accord ou sont anciens clients », jamais au-delà. Le vocabulaire de l'API le dit en
// toutes lettres : `envoi_groupe` vaut `non` ou `accord_ou_client`, et toute autre valeur (`tous`, `oui`, `true`…), qui
// prétendrait ouvrir l'envoi groupé sans accord, est refusée (400). En base, `envoi_groupe_permis` = 1 signifie
// `accord_ou_client`.

/**
 * Les catégories de départ (AD-25) portent des identifiants fixes, mais seule `demandes_recues` est gardée (story 18.15,
 * ticket 238 : toutes les autres se retirent) : le site et les portails y rangent les nouvelles demandes. Elle se
 * renomme, ne se retire pas. Les autres départs (`anciens_clients`, `proches`, `edb`, `partenaires`, `lointains`) sont
 * citées par l'import et `accord` mais leur absence est tolérée (l'import range alors « à ranger »).
 */
export const CATEGORIES_GARDEES = ['demandes_recues'] as const;
export const estGardee = (id: string) => (CATEGORIES_GARDEES as readonly string[]).includes(id);

/** Au plus 30 catégories : un filtre de vue n'en cite pas plus (`vues.ts`, MAX_VALEURS). */
export const MAX_CATEGORIES = 30;
/** Au plus 10 messages types par catégorie. */
export const MAX_MESSAGES = 10;
export const MAX_NOM_CATEGORIE = 40;
export const MAX_CANAL = 200;
export const MAX_DEMANDE = 300;
export const MAX_NOM_MESSAGE = 60;
export const MAX_TEXTE_MESSAGE = 2000;

/** Le seul champ remplacé dans un message type (FR-13). */
export const CHAMP_PRENOM = '{prénom}';
/** Le prénom d'exemple de l'aperçu. */
export const PRENOM_EXEMPLE = 'Claire';

export type EnvoiGroupe = 'non' | 'accord_ou_client';
export const ENVOIS_GROUPES: Record<EnvoiGroupe, string> = {
  non: 'Non permis : aucun contact de cette catégorie ne reçoit les campagnes, même avec son accord',
  accord_ou_client: 'Permis, seulement aux contacts avec accord ou anciens clients',
};

export interface MessageType { id: string; nom: string; texte: string; ordre: number }
/** Une catégorie telle que la page la reçoit. */
export interface Categorie {
  id: string; nom: string; ordre: number; canal_conseille: string | null; demande: string | null;
  appel_permis: boolean; envoi_groupe: EnvoiGroupe; gardee: boolean;
  /** Contacts rangés dans la catégorie, écartés compris (à ranger ailleurs pour retirer la catégorie, AD-25). */
  contacts: number; ecartes: number;
  messages: MessageType[];
}

/** Message type reçu : `id` absent pour un nouveau message. */
export interface MessageRecu { id?: string; nom: string; texte: string }
export interface Methode {
  canal_conseille: string | null; demande: string | null; appel_permis: boolean; envoi_groupe: EnvoiGroupe; messages: MessageRecu[];
}

const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const CONTROLE = /[\u0000-\u001f\u007f]/;
const CONTROLE_SAUF_LIGNE = /[\u0000-\u0009\u000b-\u001f\u007f]/;

/** Le nom d'une catégorie : 1 à 40 caractères, espaces resserrés, sans caractère de contrôle ; ou null. */
export function nomCategorie(brut: unknown): string | null {
  if (typeof brut !== 'string') return null;
  const nom = brut.replace(/\s+/g, ' ').trim();
  return nom && nom.length <= MAX_NOM_CATEGORIE && !CONTROLE.test(nom) ? nom : null;
}

/** Deux noms identiques à la casse, aux accents et aux espaces près sont un doublon. */
export const cleNom = (nom: string) => nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Les champs entre accolades d'un texte, autres que `{prénom}` : refusés (seul le prénom est remplacé). */
export const champsInconnus = (texte: string) => [...texte.matchAll(/\{[^{}]*\}/g)].map((m) => m[0]).filter((c) => c !== CHAMP_PRENOM);

/** Texte libre facultatif : null si vide, sinon le texte borné ; ou le message d'erreur. */
function texteLibre(v: unknown, libelle: string, max: number): string | null | { erreur: string } {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'string') return { erreur: `${libelle} : un texte est attendu.` };
  const t = v.replace(/\s+/g, ' ').trim();
  if (t.length > max) return { erreur: `${libelle} : ${max} caractères au plus.` };
  if (CONTROLE.test(t)) return { erreur: `${libelle} : caractère non permis.` };
  return t || null;
}

/**
 * Lit la méthode complète d'une catégorie (les cinq clés sont exigées : la page envoie toujours le tout), dans le
 * vocabulaire fermé ; ou le message d'erreur (400).
 */
export function lireMethode(brut: unknown): Methode | string {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return 'Méthode attendue.';
  const d = brut as Record<string, unknown>;
  const cles = ['canal_conseille', 'demande', 'appel_permis', 'envoi_groupe', 'messages'];
  const inconnue = Object.keys(d).find((k) => !cles.includes(k));
  if (inconnue) return `Champ inconnu : ${inconnue.slice(0, 40)}`;
  const manque = cles.find((k) => !(k in d));
  if (manque) return `Champ manquant : ${manque}`;
  const canal = texteLibre(d.canal_conseille, 'Canal conseillé', MAX_CANAL);
  if (canal && typeof canal === 'object') return canal.erreur;
  const demande = texteLibre(d.demande, 'Ce qu\'on demande', MAX_DEMANDE);
  if (demande && typeof demande === 'object') return demande.erreur;
  if (typeof d.appel_permis !== 'boolean') return 'Appel permis : vrai ou faux attendu.';
  if (d.envoi_groupe !== 'non' && d.envoi_groupe !== 'accord_ou_client') {
    return 'Envoi groupé : « non » ou « accord_ou_client ». Un envoi groupé ne vise jamais que les contacts qui ont un accord enregistré ou sont anciens clients (FR-13) : aucune catégorie ne peut l\'ouvrir à d\'autres.';
  }
  if (!Array.isArray(d.messages)) return 'Messages types : une liste est attendue.';
  if (d.messages.length > MAX_MESSAGES) return `Au plus ${MAX_MESSAGES} messages types par catégorie.`;
  const messages: MessageRecu[] = [];
  const noms = new Set<string>(), ids = new Set<string>();
  for (const [i, m] of d.messages.entries()) {
    const n = i + 1;
    if (!m || typeof m !== 'object' || Array.isArray(m)) return `Message ${n} : objet attendu.`;
    const x = m as Record<string, unknown>;
    const autre = Object.keys(x).find((k) => k !== 'id' && k !== 'nom' && k !== 'texte');
    if (autre) return `Message ${n} : champ inconnu ${autre.slice(0, 40)}.`;
    if (x.id !== undefined && (typeof x.id !== 'string' || !ULID.test(x.id))) return `Message ${n} : identifiant invalide.`;
    if (typeof x.id === 'string') { if (ids.has(x.id)) return `Message ${n} : identifiant en double.`; ids.add(x.id); }
    const nom = typeof x.nom === 'string' ? x.nom.replace(/\s+/g, ' ').trim() : '';
    if (!nom || nom.length > MAX_NOM_MESSAGE || CONTROLE.test(nom)) return `Message ${n} : donnez-lui un nom de 1 à ${MAX_NOM_MESSAGE} caractères.`;
    if (noms.has(cleNom(nom))) return `Deux messages types s'appellent « ${nom} ».`;
    noms.add(cleNom(nom));
    const texte = typeof x.texte === 'string' ? x.texte.normalize('NFC').replace(/\r\n?/g, '\n').trim() : '';
    if (!texte || texte.length > MAX_TEXTE_MESSAGE || CONTROLE_SAUF_LIGNE.test(texte)) return `Message « ${nom} » : un texte de 1 à ${MAX_TEXTE_MESSAGE} caractères est attendu.`;
    const inconnus = champsInconnus(texte);
    if (inconnus.length) return `Message « ${nom} » : seul ${CHAMP_PRENOM} est remplacé (trouvé : ${inconnus[0].slice(0, 30)}).`;
    messages.push({ ...(typeof x.id === 'string' ? { id: x.id } : {}), nom, texte });
  }
  return { canal_conseille: canal as string | null, demande: demande as string | null, appel_permis: d.appel_permis, envoi_groupe: d.envoi_groupe, messages };
}

/**
 * Un message type avec le prénom du contact (FR-13, FR-16). Sans prénom, le champ disparaît et la ponctuation qui le
 * suivait se recolle (« Bonjour {prénom}, » devient « Bonjour, »).
 */
export function remplirMessage(texte: string, prenom: string | null | undefined): string {
  const p = (prenom ?? '').trim();
  const t = texte.normalize('NFC');
  if (p) return t.split(CHAMP_PRENOM).join(p);
  return t.split(CHAMP_PRENOM).join('').replace(/[ \t]+([,.!?;:])/g, '$1').replace(/[ \t]{2,}/g, ' ');
}

// ——— Formule d'appel d'un e-mail (story 18.18) ———
// Tirée de la catégorie, sans champ en plus : on s'adresse par le prénom aux proches, aux anciens clients et à toutes les
// catégories de départ ou ajoutées, sauf aux relations lointaines (`lointains`), à qui l'on écrit « Madame/Monsieur Nom ».
// Les contacts n'ont pas de civilité en base : sans elle, la formule lointaine est « Bonjour Prénom Nom ». La catégorie est
// reconnue par son identifiant (fixe), jamais par son nom, que l'on peut changer.
export const CATEGORIES_FORMELLES: readonly string[] = ['lointains'];
/** Le jeton de la formule dans le texte d'une campagne, à côté de [Prénom]. */
export const JETON_FORMULE = '[Formule]';

/** « Bonjour Claire », « Bonjour Madame Martin » (civilité connue) ou « Bonjour Claire Martin » ; « Bonjour » sans nom. Sans virgule : le texte la porte. */
export function formuleAppel(categorieId: string | null | undefined, prenom: string | null | undefined, nom: string | null | undefined, civilite?: 'madame' | 'monsieur' | null): string {
  const p = (prenom ?? '').trim(), n = (nom ?? '').trim();
  if (categorieId && CATEGORIES_FORMELLES.includes(categorieId)) {
    if (civilite && n) return `Bonjour ${civilite === 'madame' ? 'Madame' : 'Monsieur'} ${n}`;
    return `Bonjour${[p, n].filter(Boolean).map((x) => ` ${x}`).join('')}`;
  }
  return p ? `Bonjour ${p}` : 'Bonjour';
}
