// Filtres et vues enregistrées de la page Contacts (story 18.5, FR-2, FR-16, AD-27). Le vocabulaire fermé des filtres est
// défini ici, une seule fois : le serveur s'en sert pour refuser une vue mal formée (`verifierFiltre`, route /api/vues),
// l'îlot du tableau pour filtrer dans le navigateur (`preparerFiltre`) et écrire les pastilles (`pastilles`). Sans accès
// à la base (importé par le navigateur) ; les lectures et écritures de la table `vue` sont dans `vues-base.ts`.
// Une vue = { nom, filtre } ; un filtre = un objet JSON dont chaque clé est dans VOCABULAIRE. Les clés à plusieurs
// valeurs (catégorie, projet…) gardent un contact qui a l'une d'elles ; des clés différentes se combinent (et).
import {
  ACCORDS, PROJETS, SOURCES, TEMPERATURES, libelleSource, sansAccents, type Accord, type IndexLigne, type LigneTableau,
} from './tableau-colonnes';

/** Un filtre de vue, dans le vocabulaire d'AD-27 (plus `ambassadeur`, migration 0018, et `a_rappeler`, FR-16). */
export interface Filtre {
  categorie_id?: string[];
  projet?: string[];
  temperature?: string[];
  source?: string[];
  entreprise_contient?: string;
  ville?: string[];
  verifie?: 'oui' | 'non';
  /** Absent ou « non » : les écartés sont masqués (FR-1) ; « oui » : seulement les écartés. */
  ecarte?: 'oui' | 'non';
  accord?: Accord[];
  /** « jamais » : jamais recontacté ; un nombre de jours : dernier contact plus ancien (jamais recontacté compris). */
  dernier_contact?: 'jamais' | number;
  pipeline?: 'dans' | 'hors';
  recherche?: string;
  /** Inscrit au programme ou de projet ambassadeur (AD-22). */
  ambassadeur?: 'oui' | 'non';
  /** La date « à rappeler le » est arrivée (aujourd'hui ou avant, heure de Paris). */
  a_rappeler?: 'oui';
}
export type CleFiltre = keyof Filtre;

const ACCORDS_CLES = Object.keys(ACCORDS) as Accord[];
const ID_CATEGORIE = /^(?:[a-z_]{1,40}|[0-9A-HJKMNP-TV-Z]{26})$/;
const MAX_VALEURS = 30;

/** Les durées proposées pour « dernier contact plus ancien que » ; toute durée de 1 à 3 650 jours est acceptée. */
export const DUREES: { jours: number; libelle: string }[] = [
  { jours: 30, libelle: 'plus d\'un mois' }, { jours: 90, libelle: 'plus de 3 mois' },
  { jours: 180, libelle: 'plus de 6 mois' }, { jours: 365, libelle: 'plus d\'un an' },
];

type Regle = { liste: (v: string) => boolean } | { texte: number } | { choix: readonly string[] } | { dernier: true };

/** Le vocabulaire fermé : une clé absente d'ici, ou une valeur hors de sa règle, est refusée. */
export const VOCABULAIRE: Record<CleFiltre, Regle> = {
  categorie_id: { liste: (v) => ID_CATEGORIE.test(v) },
  projet: { liste: (v) => v in PROJETS },
  temperature: { liste: (v) => v in TEMPERATURES },
  source: { liste: (v) => v in SOURCES },
  entreprise_contient: { texte: 80 },
  ville: { liste: (v) => v.trim().length > 0 && v.length <= 80 && !/[\u0000-\u001f]/.test(v) },
  verifie: { choix: ['oui', 'non'] },
  ecarte: { choix: ['oui', 'non'] },
  accord: { liste: (v) => (ACCORDS_CLES as string[]).includes(v) },
  dernier_contact: { dernier: true },
  pipeline: { choix: ['dans', 'hors'] },
  recherche: { texte: 100 },
  ambassadeur: { choix: ['oui', 'non'] },
  a_rappeler: { choix: ['oui'] },
};

/**
 * Vérifie un filtre reçu (JSON déjà lu) contre le vocabulaire fermé. Renvoie le filtre, recopié clé par clé, ou le
 * message d'erreur. `categories` : les identifiants connus de la table `categorie` (une catégorie inconnue est refusée).
 */
export function verifierFiltre(brut: unknown, categories?: ReadonlySet<string>): Filtre | string {
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return 'Le filtre doit être un objet.';
  const sortie: Record<string, unknown> = {};
  for (const [cle, valeur] of Object.entries(brut as Record<string, unknown>)) {
    if (!Object.prototype.hasOwnProperty.call(VOCABULAIRE, cle)) return `Clé de filtre inconnue : ${cle.slice(0, 40)}`;
    const regle = VOCABULAIRE[cle as CleFiltre];
    if ('liste' in regle) {
      if (!Array.isArray(valeur) || !valeur.length || valeur.length > MAX_VALEURS) return `${cle} : une liste de 1 à ${MAX_VALEURS} valeurs est attendue.`;
      if (!valeur.every((v) => typeof v === 'string' && regle.liste(v))) return `${cle} : valeur inconnue.`;
      if (cle === 'categorie_id' && categories && !valeur.every((v) => categories.has(v))) return 'categorie_id : catégorie inconnue.';
      if (new Set(valeur).size !== valeur.length) return `${cle} : valeur en double.`;
      sortie[cle] = [...valeur];
    } else if ('texte' in regle) {
      if (typeof valeur !== 'string' || !valeur.trim() || valeur.length > regle.texte || /[\u0000-\u001f]/.test(valeur)) return `${cle} : un texte de 1 à ${regle.texte} caractères est attendu.`;
      sortie[cle] = valeur.trim();
    } else if ('choix' in regle) {
      if (typeof valeur !== 'string' || !regle.choix.includes(valeur)) return `${cle} : valeur inconnue.`;
      sortie[cle] = valeur;
    } else {
      if (valeur !== 'jamais' && !(Number.isInteger(valeur) && (valeur as number) >= 1 && (valeur as number) <= 3650)) return 'dernier_contact : « jamais » ou un nombre de jours (1 à 3 650) est attendu.';
      sortie[cle] = valeur;
    }
  }
  return sortie as Filtre;
}

/** Le nom d'une vue : 1 à 60 caractères, sans caractère de contrôle ; ou null. */
export function nomVue(brut: unknown): string | null {
  if (typeof brut !== 'string') return null;
  const nom = brut.replace(/\s+/g, ' ').trim();
  return nom && nom.length <= 60 && !/[\u0000-\u001f\u007f]/.test(nom) ? nom : null;
}

/** Une vue enregistrée, telle que la page la reçoit. */
export interface Vue { id: string; nom: string; ordre: number; filtre: Filtre }

/** « Aujourd'hui » à Paris, AAAA-MM-JJ (AD-29 : les jours se comptent en heure de Paris). */
export const aujourdhuiParis = (maintenant = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(maintenant);

/**
 * Le prédicat d'un filtre, préparé une fois puis appliqué à chaque ligne avec son index (`indexer`, calculé au
 * chargement). La recherche (`recherche`) n'est pas traitée ici : l'îlot la combine avec `preparerRecherche`.
 */
export function preparerFiltre(f: Filtre, maintenant = new Date()): (l: LigneTableau, x: IndexLigne) => boolean {
  const ensemble = (l?: string[]) => (l?.length ? new Set(l) : null);
  const cat = ensemble(f.categorie_id), proj = ensemble(f.projet), temp = ensemble(f.temperature), src = ensemble(f.source);
  const acc = ensemble(f.accord), villes = f.ville?.length ? new Set(f.ville.map((v) => sansAccents(v).trim())) : null;
  const ent = f.entreprise_contient ? sansAccents(f.entreprise_contient) : '';
  const ecartes = f.ecarte === 'oui';
  const limite = typeof f.dernier_contact === 'number' ? maintenant.getTime() - f.dernier_contact * 86_400_000 : null;
  const jour = aujourdhuiParis(maintenant);
  return (l, x) => {
    if (l.ecarte !== ecartes) return false;
    if (cat && !(l.categorie_id && cat.has(l.categorie_id))) return false;
    if (proj && !proj.has(l.projet)) return false;
    if (temp && !(l.temperature && temp.has(l.temperature))) return false;
    if (src && !l.sources.some((s) => src.has(s))) return false;
    if (ent && !x.entreprise.includes(ent)) return false;
    if (villes && !villes.has(x.ville)) return false;
    if (f.verifie && l.verifie !== (f.verifie === 'oui')) return false;
    if (acc && !acc.has(l.accord)) return false;
    if (f.dernier_contact === 'jamais' && l.dernier_le) return false;
    if (limite !== null && x.dernier !== null && x.dernier >= limite) return false;
    if (f.pipeline && l.suivi !== (f.pipeline === 'dans')) return false;
    if (f.ambassadeur && (l.ambassadeur_inscrit || l.projet === 'ambassadeur') !== (f.ambassadeur === 'oui')) return false;
    if (f.a_rappeler && !(l.a_rappeler_le && l.a_rappeler_le <= jour)) return false;
    return true;
  };
}

/** Une pastille de filtre actif : son libellé, et ce qu'un clic retire (une valeur d'une liste, ou la clé entière). */
export interface Pastille { cle: CleFiltre; valeur: string | null; libelle: string }

export const LIBELLES_CLES: Record<CleFiltre, string> = {
  categorie_id: 'Catégorie', projet: 'Projet', temperature: 'Température', source: 'Source', entreprise_contient: 'Entreprise contient',
  ville: 'Ville', verifie: 'État', ecarte: 'État', accord: 'Accord e-mail', dernier_contact: 'Dernier contact', pipeline: 'Suivi des ventes',
  recherche: 'Recherche', ambassadeur: 'Ambassadeurs', a_rappeler: 'À rappeler',
};

/** Les pastilles d'un filtre, dans l'ordre du vocabulaire. `categories` : id → nom. La recherche a sa propre case. */
export function pastilles(f: Filtre, categories: ReadonlyMap<string, string>): Pastille[] {
  const p: Pastille[] = [];
  const liste = (cle: CleFiltre, valeurs: string[] | undefined, libelle: (v: string) => string) => {
    for (const v of valeurs ?? []) p.push({ cle, valeur: v, libelle: `${LIBELLES_CLES[cle]} : ${libelle(v)}` });
  };
  liste('categorie_id', f.categorie_id, (v) => categories.get(v) ?? v);
  liste('projet', f.projet, (v) => PROJETS[v] ?? v);
  liste('temperature', f.temperature, (v) => TEMPERATURES[v] ?? v);
  liste('source', f.source, libelleSource);
  if (f.entreprise_contient) p.push({ cle: 'entreprise_contient', valeur: null, libelle: `Entreprise contient : ${f.entreprise_contient}` });
  liste('ville', f.ville, (v) => v);
  if (f.verifie) p.push({ cle: 'verifie', valeur: null, libelle: f.verifie === 'oui' ? 'Vérifiés' : 'À vérifier' });
  if (f.ecarte === 'oui') p.push({ cle: 'ecarte', valeur: null, libelle: 'Écartés' });
  liste('accord', f.accord, (v) => ACCORDS[v as Accord] || 'Sans e-mail');
  if (f.dernier_contact !== undefined) {
    const d = f.dernier_contact;
    p.push({ cle: 'dernier_contact', valeur: null, libelle: d === 'jamais' ? 'Jamais recontactés'
      : `Dernier contact : ${DUREES.find((x) => x.jours === d)?.libelle ?? `plus de ${d} jours`}` });
  }
  if (f.pipeline) p.push({ cle: 'pipeline', valeur: null, libelle: f.pipeline === 'dans' ? 'Dans le suivi des ventes' : 'Hors suivi des ventes' });
  if (f.ambassadeur) p.push({ cle: 'ambassadeur', valeur: null, libelle: f.ambassadeur === 'oui' ? 'Ambassadeurs' : 'Sauf ambassadeurs' });
  if (f.a_rappeler) p.push({ cle: 'a_rappeler', valeur: null, libelle: 'À rappeler' });
  return p;
}

/** Retire une pastille d'un filtre (copie) : une valeur d'une liste, ou toute la clé. */
export function retirer(f: Filtre, cle: CleFiltre, valeur: string | null): Filtre {
  const copie: Record<string, unknown> = { ...f };
  const v = copie[cle];
  if (valeur !== null && Array.isArray(v)) {
    const reste = v.filter((x) => x !== valeur);
    if (reste.length) copie[cle] = reste; else delete copie[cle];
  } else delete copie[cle];
  return copie as Filtre;
}

/** Ajoute une valeur à un filtre (copie) : dans la liste pour une clé à plusieurs valeurs, sinon la remplace. */
export function ajouter(f: Filtre, cle: CleFiltre, valeur: string | number): Filtre {
  const copie: Record<string, unknown> = { ...f };
  if ('liste' in VOCABULAIRE[cle]) {
    const l = (copie[cle] as string[] | undefined) ?? [];
    if (!l.includes(String(valeur)) && l.length < MAX_VALEURS) copie[cle] = [...l, String(valeur)];
  } else copie[cle] = valeur;
  return copie as Filtre;
}
