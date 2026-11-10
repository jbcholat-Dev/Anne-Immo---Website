// Page Contacts (story 18.4, FR-1, FR-3, AD-27) : ce que le serveur et l'îlot du navigateur partagent, sans accès à la
// base. Une ligne du tableau, les colonnes (libellé, tri), les libellés des valeurs fermées (AD-24, AD-25) et la recherche.
// Le serveur (`tableau.ts`) charge une fois tous les contacts non effacés ; le navigateur trie, cherche et filtre seul.
// Les filtres et vues enregistrées (story 18.5) sont dans `vues.ts` (vocabulaire fermé d'AD-27) et s'appuient sur l'index
// calculé ici une seule fois par ligne, au chargement (`indexer`).
import { lireRecherche } from '@site/server/recherche';

export type Accord = 'accord' | 'client' | 'sans_accord' | 'desinscrit' | 'sans_email';

/** Une rencontre : la source (edb…), le lieu (« Publier ») et le mois (« AAAA-MM ») ; l'un des deux peut manquer (story 18.17). */
export interface Rencontre { source: string; lieu: string | null; mois: string | null }

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
  /** Origine d'affaires d'Anne (story 18.21, ticket n° 265) : `contact.canal` (pige, boîtage, portail, recommandation, évènement, autre ; site, réseaux et rencontre pour les anciens contacts), ou null. Les sources d'import (`contact_source`) ne sont plus dans le tableau : elles sont sur la fiche. */
  canal: string | null;
  /** Rencontres (animation EDB…) : lieu et mois de `contact_source` (story 18.17), la plus récente d'abord. */
  rencontres: Rencontre[];
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
  /** Dans le suivi et en cours (ni perdu ni en sommeil) : la température y suit l'étape (AD-24), elle ne se choisit pas. */
  en_cours: boolean;
  /** Date « à rappeler le » (AAAA-MM-JJ, FR-16), ou null. */
  a_rappeler_le: string | null;
  /** Dates du premier et du second rendez-vous (R1, R2, story 18.20), AAAA-MM-JJ, ou null. */
  r1_le: string | null;
  r2_le: string | null;
  /** Inscrit au programme ambassadeurs (marque à part du projet, glossaire du PRD). */
  ambassadeur_inscrit: boolean;
  /** Ambassadeur « partant » (story 18.21, ticket n° 264) : Anne a noté à la main qu'il la préviendrait, sans inscription sur le site. */
  ambassadeur_partant: boolean;
  /** Etat ambassadeur (story 18.18) : null si le contact n'est ni de projet « ambassadeur » ni inscrit. */
  ambassadeur_etat: EtatAmbassadeur | null;
  /** Un modèle lui a déjà été envoyé (sert à recalculer l'état quand le projet change dans le tableau). */
  ambassadeur_contacte: boolean;
}

/**
 * Inscrit : `ambassadeur_inscrit_le` renseigné (inscription faite sur le site). Partant (story 18.21, ticket n° 264) :
 * `ambassadeur_partant_le` renseigné, noté à la main par Anne (« m'a dit qu'il me préviendrait ») ; il rend le contact
 * visible comme ambassadeur même si son projet est autre. Contacté : ni l'un ni l'autre, mais un modèle lui a été envoyé
 * (e-mail groupé ou « Envoyé » de la fiche : un événement porte `envoi_modele`). À contacter : rien de tout cela.
 * L'ordre de priorité : inscrit, partant, contacté, à contacter.
 */
export type EtatAmbassadeur = 'inscrit' | 'partant' | 'contacte' | 'a_contacter';
export const ETATS_AMBASSADEUR: Record<EtatAmbassadeur, string> = { inscrit: 'Inscrit', partant: 'Partant', contacte: 'Contacté', a_contacter: 'À contacter' };
export function etatAmbassadeur(projet: string, inscrit: boolean, modeleEnvoye: boolean, partant = false): EtatAmbassadeur | null {
  if (inscrit) return 'inscrit';
  if (partant) return 'partant';
  if (projet !== 'ambassadeur') return null;
  return modeleEnvoye ? 'contacte' : 'a_contacter';
}

export type CleColonne = 'nom' | 'entreprise' | 'categorie' | 'projet' | 'temperature' | 'canal' | 'rencontre' | 'ville' | 'telephone' | 'email' | 'profil' | 'dernier' | 'accord' | 'ambassadeur' | 'r1' | 'r2' | 'verifie';

/** Les colonnes de FR-1, dans l'ordre affiché. Le nom ne se masque pas. */
export const COLONNES: { cle: CleColonne; libelle: string; masquable: boolean }[] = [
  { cle: 'nom', libelle: 'Nom', masquable: false },
  { cle: 'entreprise', libelle: 'Entreprise', masquable: true },
  { cle: 'categorie', libelle: 'Catégorie', masquable: true },
  { cle: 'projet', libelle: 'Projet', masquable: true },
  { cle: 'ambassadeur', libelle: 'Ambassadeur', masquable: true },
  { cle: 'temperature', libelle: 'Température', masquable: true },
  { cle: 'canal', libelle: 'Source', masquable: true },
  { cle: 'rencontre', libelle: 'Rencontre', masquable: true },
  { cle: 'ville', libelle: 'Ville', masquable: true },
  { cle: 'telephone', libelle: 'Téléphone', masquable: true },
  { cle: 'email', libelle: 'E-mail', masquable: true },
  { cle: 'profil', libelle: 'Profil', masquable: true },
  { cle: 'dernier', libelle: 'Dernier contact', masquable: true },
  { cle: 'accord', libelle: 'Accord e-mail', masquable: true },
  { cle: 'r1', libelle: 'R1', masquable: true },
  { cle: 'r2', libelle: 'R2', masquable: true },
  { cle: 'verifie', libelle: 'État', masquable: true },
];

export const PROJETS: Record<string, string> = {
  a_qualifier: 'À qualifier', aucun: 'Aucun', vendeur: 'Vendeur', acheteur: 'Acheteur', vendeur_acheteur: 'Vendeur et acheteur', ambassadeur: 'Ambassadeur',
  sponsoring: 'Sponsoring', // story 18.16 (ticket n° 243) : futurs collaborateurs qu'Anne recrute dans le réseau eXp
};
export const TEMPERATURES: Record<string, string> = {
  froid: 'Froid', tiede: 'Tiède', chaud: 'Chaud', en_vente: 'Déjà en vente', recherche_active: 'En recherche active', avec_anne: 'Avec Anne', termine: 'Terminé',
};
/** Les températures qu'Anne ou JB choisissent ; « avec Anne » et « terminé » sont posées par le suivi des ventes (AD-24). */
export const TEMPERATURES_CHOIX = ['froid', 'tiede', 'chaud', 'en_vente', 'recherche_active'] as const;
/** Les projets du suivi des ventes (pipeline vendeur et acheteur) : leur température « avec Anne » ou « terminé » suit l'étape (AD-24). */
export const PROJETS_DU_SUIVI: readonly string[] = ['vendeur', 'acheteur', 'vendeur_acheteur'];
/** Les projets qui ont une température (FR-4) ; à qualifier, aucun (story 18.21, ticket n° 266 : pas de projet) et ambassadeur n'en ont pas. Sponsoring en a une (froid, tiède, chaud), sans suivi des ventes (18.16). */
export const PROJETS_AVEC_TEMPERATURE: readonly string[] = [...PROJETS_DU_SUIVI, 'sponsoring'];
/** Une température est-elle permise pour ce projet (CHECK des migrations 0018 et 0020, AD-24) ? null l'est toujours. */
export function temperaturePermise(t: string | null, projet: string): boolean {
  if (t === null) return true;
  if (!PROJETS_AVEC_TEMPERATURE.includes(projet)) return false;
  if (projet === 'sponsoring') return t === 'froid' || t === 'tiede' || t === 'chaud'; // ni en vente, ni recherche active, ni suivi des ventes
  if (t === 'en_vente') return projet === 'vendeur' || projet === 'vendeur_acheteur';
  if (t === 'recherche_active') return projet === 'acheteur';
  return true;
}
/** Dans le suivi des ventes et en cours (étape autre que perdu ou en sommeil). */
export const suiviEnCours = (etape: string | null) => etape !== null && etape !== 'perdu' && etape !== 'en_sommeil';
export const CANAUX_CONTACT: Record<string, string> = {
  whatsapp: 'WhatsApp', sms: 'SMS', email: 'E-mail', appel: 'Appel', rencontre: 'Rencontre', autre: 'Autre',
};
export const ACCORDS: Record<Accord, string> = {
  accord: 'Accord', client: 'Ancien client', sans_accord: 'Sans accord', desinscrit: 'Désinscrit', sans_email: '',
};
/**
 * Les choix de la colonne « Source » (story 18.21, ticket n° 265), dans l'ordre d'Anne : l'origine d'affaires du contact,
 * écrite dans `contact.canal`. Une valeur vide efface l'origine.
 */
export const CANAUX_SOURCE_CHOIX: [string, string][] = [
  ['pige', 'Pige'], ['boitage', 'Boîtage'], ['portail', "Portails d'annonce"], ['recommandation', 'Reco'], ['evenement', 'Évènementiel'], ['autre', 'Autres'],
];
/** Les anciens canaux (site, réseaux, rencontre) : gardés et affichés tant qu'Anne ne les change pas, mais plus proposés. */
export const CANAUX_SOURCE_ANCIENS: Record<string, string> = { site: 'Site', reseaux: 'Réseaux', rencontre: 'Rencontre' };
export const CANAUX_SOURCE: Record<string, string> = { ...Object.fromEntries(CANAUX_SOURCE_CHOIX), ...CANAUX_SOURCE_ANCIENS };
export const libelleCanalSource = (c: string | null) => (c ? CANAUX_SOURCE[c] ?? c : '');

/** Les sources d'import écrites dans `contact_source` (migration 0018), en mots d'Anne ; une source inconnue s'affiche telle quelle. Visibles sur la fiche seulement (story 18.21). */
export const SOURCES: Record<string, string> = {
  espace: 'Espace', site: 'Site', portail: 'Portail', leedflow: 'Leedflow', telephone: 'Téléphone', linkedin: 'LinkedIn',
  edb: 'Animations EDB', suivi: 'Fichier de suivi', saisie: 'Saisie à la main',
};
export const libelleSource = (s: string) => SOURCES[s] ?? s;

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
/** « 2024-12 » → « déc. 2024 » ; une valeur qui n'est pas un mois est rendue telle quelle (story 18.17). */
export function libelleMois(mois: string): string {
  const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(mois);
  return m ? `${MOIS_COURTS[Number(m[2]) - 1]} ${m[1]}` : mois;
}
/** Le nom court d'une source dans une rencontre : « EDB » plutôt que « Animations EDB ». */
const SOURCE_COURTE: Record<string, string> = { edb: 'EDB' };
/** « EDB Publier · déc. 2024 » (story 18.17) ; vide si la rencontre n'a ni lieu ni mois. */
export function libelleRencontre(r: Rencontre): string {
  const debut = [SOURCE_COURTE[r.source] ?? libelleSource(r.source), r.lieu].filter(Boolean).join(' ');
  return r.lieu || r.mois ? `${debut}${r.mois ? ` · ${libelleMois(r.mois)}` : ''}` : '';
}
/** Plusieurs rencontres séparées par « + », la plus récente d'abord (l'ordre vient de `rencontresDe`). */
export const libelleRencontres = (l: Rencontre[]) => l.map(libelleRencontre).filter(Boolean).join(' + ');
/** Les rencontres d'un contact à partir de ses lignes de `contact_source` : sans doublon, la plus récente d'abord, celles sans mois en fin. */
export function rencontresDe(lignes: { source: string; lieu: string | null; mois: string | null }[]): Rencontre[] {
  const vues = new Set<string>(), sortie: Rencontre[] = [];
  for (const x of lignes) {
    if (!x.lieu && !x.mois) continue;
    const cle = `${x.source}|${x.lieu ?? ''}|${x.mois ?? ''}`;
    if (!vues.has(cle)) { vues.add(cle); sortie.push({ source: x.source, lieu: x.lieu, mois: x.mois }); }
  }
  return sortie.sort((a, b) => (a.mois === b.mois ? 0 : a.mois === null ? 1 : b.mois === null ? -1 : a.mois < b.mois ? 1 : -1));
}

/** Sans accents ni majuscules : « Hélène » se trouve en tapant « helene » (revue de code 18.4). */
export const sansAccents = (t: string) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Ce que la recherche et les filtres lisent d'une ligne, calculé une seule fois au chargement (revue de code 18.4 : une
 * recherche par numéro mesurée à 722 ms avec 1 228 contacts) : le texte où chercher les mots (story 13.24 : prénom, nom,
 * ville, e-mails ; FR-3 : entreprise), sans accents ; les numéros réduits aux chiffres, au format international et au
 * format français (« 33612345678 0612345678 ») ; la ville et l'entreprise sans accents et le jour de Paris du dernier
 * contact (AAAA-MM-JJ), pour les filtres.
 */
export interface IndexLigne { texte: string; chiffres: string; ville: string; entreprise: string; dernier: string | null }

/** Le jour de Paris (AAAA-MM-JJ) d'un instant ISO (revue de code 18.5 : les durées se comptent en jours de Paris, AD-29). */
const JOUR_PARIS = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
export const jourParis = (iso: string) => { const t = Date.parse(iso); return Number.isNaN(t) ? iso.slice(0, 10) : JOUR_PARIS.format(t); };

export function indexer(l: LigneTableau): IndexLigne {
  const chiffres = l.telephones.map((t) => {
    const d = t.replace(/\D/g, '');
    return t.startsWith('+33') ? `${d} 0${d.slice(2)}` : d;
  }).join(' ');
  return {
    texte: sansAccents([l.prenom, l.nom, l.ville, l.entreprise, ...l.emails].filter(Boolean).join(' ')),
    chiffres, ville: sansAccents(l.ville ?? '').trim(), entreprise: sansAccents(l.entreprise ?? ''),
    dernier: l.dernier_le ? jourParis(l.dernier_le) : null,
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

/** Tri de la colonne Ambassadeur (JB) : À contacter, Contacté, Partant, Inscrit ; les contacts sans état, en fin de liste. */
const ORDRE_AMBASSADEUR: EtatAmbassadeur[] = ['a_contacter', 'contacte', 'partant', 'inscrit'];
/** Tri de la colonne Source : l'ordre des choix d'Anne, puis les anciens canaux. */
const ORDRE_CANAL = [...CANAUX_SOURCE_CHOIX.map(([k]) => k), ...Object.keys(CANAUX_SOURCE_ANCIENS)];

/** La valeur de tri d'une ligne pour une colonne ; null = vide, toujours en fin de liste. */
export function valeurTri(l: LigneTableau, cle: CleColonne): string | number | null {
  switch (cle) {
    case 'nom': return [l.nom, l.prenom].filter(Boolean).join(' ') || l.emails[0] || l.telephones[0] || null;
    case 'entreprise': return l.entreprise || null;
    case 'categorie': return l.categorie || null;
    case 'projet': return ORDRE_PROJET.indexOf(l.projet);
    case 'temperature': return l.temperature ? ORDRE_TEMP.indexOf(l.temperature) : null;
    case 'canal': return l.canal ? (ORDRE_CANAL.includes(l.canal) ? ORDRE_CANAL.indexOf(l.canal) : ORDRE_CANAL.length) : null;
    case 'rencontre': return l.rencontres[0]?.mois ?? null;
    case 'ville': return l.ville || null;
    case 'telephone': return l.telephones[0] ?? null;
    case 'email': return l.emails[0] ?? null;
    case 'profil': return l.profils[0]?.reseau ?? (l.profils.length ? 'profil' : null);
    case 'dernier': return l.dernier_le;
    case 'accord': return l.accord === 'sans_email' ? null : ORDRE_ACCORD.indexOf(l.accord);
    case 'ambassadeur': return l.ambassadeur_etat ? ORDRE_AMBASSADEUR.indexOf(l.ambassadeur_etat) : null;
    case 'r1': return l.r1_le;
    case 'r2': return l.r2_le;
    case 'verifie': return l.ecarte ? 2 : l.verifie ? 1 : 0;
  }
}
