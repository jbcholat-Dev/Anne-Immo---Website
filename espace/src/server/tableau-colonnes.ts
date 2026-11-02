// Page Contacts (story 18.4, FR-1, FR-3, AD-27) : ce que le serveur et l'îlot du navigateur partagent, sans accès à la
// base. Une ligne du tableau, les colonnes (libellé, tri), les libellés des valeurs fermées (AD-24, AD-25) et la recherche.
// Le serveur (`tableau.ts`) charge une fois tous les contacts non effacés ; le navigateur trie, cherche et filtre seul.
// Les filtres et vues enregistrées (story 18.5) sont dans `vues.ts` (vocabulaire fermé d'AD-27) et s'appuient sur l'index
// calculé ici une seule fois par ligne, au chargement (`indexer`).
import { lireRecherche } from '@site/server/recherche';

export type Accord = 'accord' | 'client' | 'sans_accord' | 'desinscrit' | 'sans_email';

/** Une ligne du tableau : un contact non effacé, avec ses coordonnées principales puis secondaires. */
export interface LigneTableau {
  id: string;
  prenom: string | null;
  nom: string | null;
  entreprise: string | null;
  categorie_id: string | null;
  categorie: string | null;
  projet: string;
  temperature: string | null;
  sources: string[];
  ville: string | null;
  /** E.164, le principal d'abord. */
  telephones: string[];
  /** En minuscules, le principal d'abord. */
  emails: string[];
  /** Liens de profil (http ou https seulement). */
  profils: { reseau: string | null; url: string }[];
  dernier_le: string | null;
  dernier_canal: string | null;
  accord: Accord;
  verifie: boolean;
  ecarte: boolean;
  /** Dans le suivi des ventes (étape renseignée), ou au carnet seulement. */
  suivi: boolean;
  /** Date « à rappeler le » (AAAA-MM-JJ, FR-16), ou null. */
  a_rappeler_le: string | null;
  /** Inscrit au programme ambassadeurs (marque à part du projet, glossaire du PRD). */
  ambassadeur_inscrit: boolean;
}

export type CleColonne = 'nom' | 'entreprise' | 'categorie' | 'projet' | 'temperature' | 'sources' | 'ville' | 'telephone' | 'email' | 'profil' | 'dernier' | 'accord' | 'verifie';

/** Les colonnes de FR-1, dans l'ordre affiché. Le nom ne se masque pas. */
export const COLONNES: { cle: CleColonne; libelle: string; masquable: boolean }[] = [
  { cle: 'nom', libelle: 'Nom', masquable: false },
  { cle: 'entreprise', libelle: 'Entreprise', masquable: true },
  { cle: 'categorie', libelle: 'Catégorie', masquable: true },
  { cle: 'projet', libelle: 'Projet', masquable: true },
  { cle: 'temperature', libelle: 'Température', masquable: true },
  { cle: 'sources', libelle: 'Source', masquable: true },
  { cle: 'ville', libelle: 'Ville', masquable: true },
  { cle: 'telephone', libelle: 'Téléphone', masquable: true },
  { cle: 'email', libelle: 'E-mail', masquable: true },
  { cle: 'profil', libelle: 'Profil', masquable: true },
  { cle: 'dernier', libelle: 'Dernier contact', masquable: true },
  { cle: 'accord', libelle: 'Accord e-mail', masquable: true },
  { cle: 'verifie', libelle: 'État', masquable: true },
];

export const PROJETS: Record<string, string> = {
  a_qualifier: 'À qualifier', vendeur: 'Vendeur', acheteur: 'Acheteur', vendeur_acheteur: 'Vendeur et acheteur', ambassadeur: 'Ambassadeur',
};
export const TEMPERATURES: Record<string, string> = {
  froid: 'Froid', tiede: 'Tiède', chaud: 'Chaud', en_vente: 'Déjà en vente', recherche_active: 'En recherche active', avec_anne: 'Avec Anne', termine: 'Terminé',
};
export const CANAUX_CONTACT: Record<string, string> = {
  whatsapp: 'WhatsApp', sms: 'SMS', email: 'E-mail', appel: 'Appel', rencontre: 'Rencontre', autre: 'Autre',
};
export const ACCORDS: Record<Accord, string> = {
  accord: 'Accord', client: 'Ancien client', sans_accord: 'Sans accord', desinscrit: 'Désinscrit', sans_email: '',
};
/** Les sources écrites dans `contact_source` (migration 0018), en mots d'Anne ; une source inconnue s'affiche telle quelle. */
export const SOURCES: Record<string, string> = {
  espace: 'Espace', site: 'Site', portail: 'Portail', leedflow: 'Leedflow', telephone: 'Téléphone', linkedin: 'LinkedIn',
  edb: 'Animations EDB', suivi: 'Fichier de suivi', saisie: 'Saisie à la main',
};
export const libelleSource = (s: string) => SOURCES[s] ?? s;

/** Sans accents ni majuscules : « Hélène » se trouve en tapant « helene » (revue de code 18.4). */
export const sansAccents = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Ce que la recherche et les filtres lisent d'une ligne, calculé une seule fois au chargement (revue de code 18.4 : une
 * recherche par numéro mesurée à 722 ms avec 1 228 contacts) : le texte où chercher les mots (story 13.24 : prénom, nom,
 * ville, e-mails ; FR-3 : entreprise), sans accents ; les numéros réduits aux chiffres, au format international et au
 * format français (« 33612345678 0612345678 ») ; la ville et l'entreprise sans accents et la date du dernier contact
 * (millisecondes), pour les filtres.
 */
export interface IndexLigne { texte: string; chiffres: string; ville: string; entreprise: string; dernier: number | null }

export function indexer(l: LigneTableau): IndexLigne {
  const chiffres = l.telephones.map((t) => {
    const d = t.replace(/\D/g, '');
    return t.startsWith('+33') ? `${d} 0${d.slice(2)}` : d;
  }).join(' ');
  return {
    texte: sansAccents([l.prenom, l.nom, l.ville, l.entreprise, ...l.emails].filter(Boolean).join(' ')),
    chiffres, ville: sansAccents(l.ville ?? '').trim(), entreprise: sansAccents(l.entreprise ?? ''),
    dernier: l.dernier_le ? Date.parse(l.dernier_le) : null,
  };
}

/**
 * La recherche de la story 13.24, dans le navigateur : un morceau de numéro (« 06 12 », « 34 56 », « +33 6 12 ») est
 * réduit aux chiffres et cherché dans tous les numéros du contact, et aussi tel quel dans le texte (une entreprise ou une
 * adresse avec des chiffres, revue de code 18.4) ; sinon chaque mot doit se trouver dans le texte du contact. Accents
 * ignorés des deux côtés. Ne lit que l'index déjà calculé (`indexer`) : aucune normalisation par ligne à chaque frappe.
 */
export function preparerRecherche(q: string): (x: IndexLigne) => boolean {
  const { telephone, mots } = lireRecherche(sansAccents(q));
  if (telephone) {
    const brut = sansAccents(q.trim());
    // « +33 6 12 » et « 0033 6 12 » se cherchent au format international, « 06 12 » au format français, « 3456 » dans les deux.
    const d = brut.replace(/\D/g, '');
    const cherche = d.startsWith('00') ? d.slice(2) : d;
    return (x) => x.chiffres.includes(cherche) || x.texte.includes(brut);
  }
  if (!mots.length) return () => true;
  return (x) => mots.every((m) => x.texte.includes(m));
}

/** Ordre de tri des valeurs fermées (dans l'ordre des listes ci-dessus). */
const ORDRE_PROJET = Object.keys(PROJETS), ORDRE_TEMP = Object.keys(TEMPERATURES), ORDRE_ACCORD: Accord[] = ['accord', 'client', 'sans_accord', 'desinscrit'];

/** La valeur de tri d'une ligne pour une colonne ; null = vide, toujours en fin de liste. */
export function valeurTri(l: LigneTableau, cle: CleColonne): string | number | null {
  switch (cle) {
    case 'nom': return [l.nom, l.prenom].filter(Boolean).join(' ') || l.emails[0] || l.telephones[0] || null;
    case 'entreprise': return l.entreprise || null;
    case 'categorie': return l.categorie || null;
    case 'projet': return ORDRE_PROJET.indexOf(l.projet);
    case 'temperature': return l.temperature ? ORDRE_TEMP.indexOf(l.temperature) : null;
    case 'sources': return l.sources.length ? libelleSource(l.sources[0]) : null;
    case 'ville': return l.ville || null;
    case 'telephone': return l.telephones[0] ?? null;
    case 'email': return l.emails[0] ?? null;
    case 'profil': return l.profils[0]?.reseau ?? (l.profils.length ? 'profil' : null);
    case 'dernier': return l.dernier_le;
    case 'accord': return l.accord === 'sans_email' ? null : ORDRE_ACCORD.indexOf(l.accord);
    case 'verifie': return l.ecarte ? 2 : l.verifie ? 1 : 0;
  }
}
