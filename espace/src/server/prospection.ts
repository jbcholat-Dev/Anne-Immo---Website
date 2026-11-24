// Canaux de prospection (story 20.7, AD-36) : la page « Ma semaine » montre, canal par canal, l'effort d'Anne face à son
// objectif, les leads et les rendez-vous de la semaine (lundi au dimanche, en jours de Paris). Seul ce module écrit
// `prospection_effort`, `resultat` et `prospection_objectif` (migration 0026).
// Les canaux sont une liste fixe du code (AD-35). Deux efforts sont lus ailleurs, pour ne rien saisir deux fois :
//   - les flyers du boîtage sont les passages de `passage_boitage` (story 18.19) ; en noter ici écrit un passage ;
//   - les messages aux contacts comptent aussi les modèles envoyés depuis l'espace (événements `envoi_modele`, story 18.18).
// Les leads du site et des portails sont comptés seuls, depuis la file « Nouveaux » (AD-34) : hors objectif, en bonus.
// Aucun nom, téléphone ni e-mail : seulement des nombres. `totauxSemaine` sert aussi l'accès de Claude (/api/claude/bilan).
import type { EnvSite } from '@site/server/env';
import { ulid } from '@site/server/ulid';
import { ajouterBoitage } from './boitage';

/** Les canaux suivis, dans l'ordre de la page, avec leur unité d'effort et leur objectif de départ par semaine (modèle Priestley, JB 2026-11-08). */
export const CANAUX_PROSPECTION = {
  boitage: { libelle: 'Boîtage', unite: 'flyers', saisie: 'Flyers déposés', objectif: 1500 },
  cartes: { libelle: 'Cartes ambassadeur', unite: 'cartes données', saisie: 'Cartes données', objectif: 10 },
  messages: { libelle: 'Messages ambassadeur', unite: 'messages', saisie: 'Messages envoyés', objectif: 20 },
  reseaux: { libelle: 'Réseaux sociaux', unite: 'publications', saisie: 'Publications', objectif: 7 },
  magasin: { libelle: 'Opérations en magasin', unite: 'opérations', saisie: 'Opérations faites', objectif: 0 },
} as const;
export type CanalProspection = keyof typeof CANAUX_PROSPECTION;

/** Hors objectif : leads et rendez-vous seulement, sans effort (spec Priestley : site et portails en bonus). */
export const CANAUX_BONUS = {
  site: 'Site et portails',
  autre: 'Autre (bouche-à-oreille, pige…)',
} as const;
export type CanalBonus = keyof typeof CANAUX_BONUS;
export type CanalResultat = CanalProspection | CanalBonus;

export const LIBELLES_CANAL: Record<CanalResultat, string> = {
  ...Object.fromEntries(Object.entries(CANAUX_PROSPECTION).map(([k, v]) => [k, v.libelle])),
  ...CANAUX_BONUS,
} as Record<CanalResultat, string>;

/** Objectifs de départ de la semaine : 3 rendez-vous et 3 leads (2,3 et 2,9 arrondis au-dessus, règle de JB du 2026-11-08). */
export const OBJECTIFS_DEPART = { rdv: 3, leads: 3 } as const;

export const TYPES_LEAD = { direct: 'Direct (demande un rendez-vous)', diagnostic: 'Diagnostic (coordonnées laissées)' } as const;
export type TypeLead = keyof typeof TYPES_LEAD;

const JOUR = /^\d{4}-\d{2}-\d{2}$/;
const PREMIER_JOUR = '2025-01-01';
/** Une clé propre à la liste (revue de code 20.7 : `in` accepterait aussi `toString` ou `constructor`). */
export const dansListe = (liste: object, cle: string | null | undefined): boolean => typeof cle === 'string' && Object.hasOwn(liste, cle);
export const jourParis = (t: number | Date = Date.now()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' }).format(t);
/** Dernier jour accepté dans l'adresse : la fin de l'année prochaine (revue de code 20.7 : pas d'année 10000). */
const dernierJour = () => `${Number(jourParis().slice(0, 4)) + 1}-12-31`;
const jourValide = (v: unknown): v is string =>
  typeof v === 'string' && JOUR.test(v) && v <= dernierJour() && !Number.isNaN(Date.parse(`${v}T12:00:00Z`)) && new Date(`${v}T12:00:00Z`).toISOString().slice(0, 10) === v;
const decaler = (jour: string, n: number) => new Date(Date.parse(`${jour}T12:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

/** Le lundi de la semaine qui contient ce jour (AAAA-MM-JJ). */
export function lundiDe(jour: string): string {
  const j = new Date(`${jour}T12:00:00Z`).getUTCDay(); // 0 dimanche … 6 samedi
  return decaler(jour, j === 0 ? -6 : 1 - j);
}

/** Le lundi demandé dans l'adresse (`?s=`), ramené au lundi de sa semaine ; la semaine en cours sinon. */
export function semaineDemandee(s: string | null): string {
  return lundiDe(jourValide(s) && s >= PREMIER_JOUR ? s : jourParis());
}
export const semaineSuivante = (lundi: string) => decaler(lundi, 7);
export const semainePrecedente = (lundi: string) => decaler(lundi, -7);
export const dimancheDe = (lundi: string) => decaler(lundi, 6);

/** « du 23 au 29 novembre », « du 30 décembre 2026 au 5 janvier 2027 » */
export function libelleSemaine(lundi: string): string {
  const d = dimancheDe(lundi);
  const f = (j: string, o: Intl.DateTimeFormatOptions) => new Date(`${j}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: 'UTC', ...o });
  const memeAnnee = lundi.slice(0, 4) === d.slice(0, 4);
  const memeMois = memeAnnee && lundi.slice(5, 7) === d.slice(5, 7);
  const debut = memeMois ? f(lundi, { day: 'numeric' }) : f(lundi, memeAnnee ? { day: 'numeric', month: 'long' } : { day: 'numeric', month: 'long', year: 'numeric' });
  return `du ${debut} au ${f(d, { day: 'numeric', month: 'long', year: memeAnnee && lundi.slice(0, 4) === jourParis().slice(0, 4) ? undefined : 'numeric' })}`;
}

/** « lun. 24 nov. » */
export const jourCourt = (j: string) => new Date(`${j}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });

// ---- Objectifs ----

export type CleObjectif = 'rdv' | 'leads' | `effort:${CanalProspection}`;
export const CLES_OBJECTIF: CleObjectif[] = ['rdv', 'leads', ...(Object.keys(CANAUX_PROSPECTION) as CanalProspection[]).map((c) => `effort:${c}` as const)];
export type Objectifs = Record<CleObjectif, number>;

export function objectifsDepart(): Objectifs {
  const o = { rdv: OBJECTIFS_DEPART.rdv, leads: OBJECTIFS_DEPART.leads } as Objectifs;
  for (const [c, v] of Object.entries(CANAUX_PROSPECTION)) o[`effort:${c as CanalProspection}`] = v.objectif;
  return o;
}

/** Les objectifs en vigueur : ceux de départ, remplacés par ceux qu'Anne ou JB ont réglés. */
export async function lireObjectifs(env: EnvSite): Promise<Objectifs> {
  const o = objectifsDepart();
  const { results } = await env.DB.prepare('SELECT cle, valeur FROM prospection_objectif').all<{ cle: string; valeur: number }>();
  for (const r of results) if ((CLES_OBJECTIF as string[]).includes(r.cle)) o[r.cle as CleObjectif] = r.valeur;
  return o;
}

/** Lit le formulaire des objectifs : un entier de 0 à 99 999 par clé, toutes présentes ; ou l'erreur. */
export function lireFormObjectifs(f: FormData): Objectifs | string {
  const o = {} as Objectifs;
  for (const cle of CLES_OBJECTIF) {
    const v = f.get(cle);
    const s = typeof v === 'string' ? v.trim().replace(/\s/g, '') : '';
    if (!/^\d{1,5}$/.test(s)) return 'Chaque objectif est un nombre entier, de 0 à 99 999.';
    o[cle] = Number(s);
  }
  return o;
}

/** Story 20.8 : le nom signé par le chief of staff (Claude, par son badge) sur ce qu'il écrit dans « Ma semaine ». */
export const PAR_CHIEF = 'chief of staff';
/** Le commentaire d'un passage de boîtage noté par le chief of staff : sa signature (la table n'a pas de colonne « par »). */
const NOTE_CHIEF = 'Noté par le chief of staff';

/**
 * Enregistre les objectifs. Par Anne ou JB (la page) : toutes les clés, et les traces laissées par le chief of staff
 * disparaissent (la valeur a été revue). Par le chief of staff : seulement les clés qui changent ; la valeur d'avant est
 * gardée sous `avant:<clé>` (valeur, qui, quand), pour que la page la montre et qu'Anne puisse la remettre (AD-29).
 */
export async function enregistrerObjectifs(env: EnvSite, o: Partial<Objectifs>, par: string): Promise<CleObjectif[]> {
  const maintenant = new Date().toISOString();
  const chief = par === PAR_CHIEF;
  const actuels = chief ? await lireReglages(env) : new Map<string, Reglage>();
  const depart = objectifsDepart();
  // Seules les clés qui changent sont écrites, par la page comme par le chief of staff : un objectif réglé par le chief of
  // staff qu'Anne ne touche pas garde sa signature et sa trace (revue de code 20.8).
  const avantTout = chief ? actuels : await lireReglages(env);
  const cles = CLES_OBJECTIF.filter((cle) => o[cle] !== undefined && o[cle] !== (avantTout.get(cle)?.valeur ?? depart[cle]));
  if (!cles.length) return [];
  const lot = cles.flatMap((cle) => {
    const ecrire = env.DB.prepare(
      `INSERT INTO prospection_objectif (cle, valeur, par, maj_le) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur, par = excluded.par, maj_le = excluded.maj_le`,
    ).bind(cle, o[cle]!, par, maintenant);
    if (!chief) return [env.DB.prepare('DELETE FROM prospection_objectif WHERE cle = ?1').bind(`avant:${cle}`), ecrire];
    const avant = actuels.get(cle);
    const trace = actuels.get(`avant:${cle}`);
    // Retour à la valeur d'avant : la trace part et la valeur reprend la signature d'avant (revue de code 20.8).
    if (avant?.par === PAR_CHIEF && trace && trace.valeur === o[cle]) {
      return [env.DB.prepare('DELETE FROM prospection_objectif WHERE cle = ?1').bind(`avant:${cle}`),
        trace.par === 'départ' ? env.DB.prepare('DELETE FROM prospection_objectif WHERE cle = ?1').bind(cle)
          : env.DB.prepare('UPDATE prospection_objectif SET valeur = ?2, par = ?3, maj_le = ?4 WHERE cle = ?1').bind(cle, trace.valeur, trace.par, trace.maj_le)];
    }
    // Une seule trace par clé : la valeur d'Anne (ou de départ) d'avant la première retouche du chief of staff.
    if (avant?.par === PAR_CHIEF && actuels.has(`avant:${cle}`)) return [ecrire];
    return [env.DB.prepare(
      `INSERT INTO prospection_objectif (cle, valeur, par, maj_le) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT (cle) DO UPDATE SET valeur = excluded.valeur, par = excluded.par, maj_le = excluded.maj_le`,
    ).bind(`avant:${cle}`, avant?.valeur ?? depart[cle], avant?.par ?? 'départ', avant?.maj_le ?? maintenant), ecrire];
  });
  await env.DB.batch(lot);
  return cles;
}

export interface Reglage { valeur: number; par: string | null; maj_le: string }
/** Les lignes de `prospection_objectif`, objectifs et traces `avant:` comprises. */
export async function lireReglages(env: EnvSite): Promise<Map<string, Reglage>> {
  const { results } = await env.DB.prepare('SELECT cle, valeur, par, maj_le FROM prospection_objectif').all<{ cle: string } & Reglage>();
  return new Map(results.map((x) => [x.cle, { valeur: x.valeur, par: x.par, maj_le: x.maj_le }]));
}

/** Story 20.8 : objectifs envoyés par le chief of staff, en JSON : seulement les clés données, entiers de 0 à 99 999. */
export function lireObjectifsJson(d: unknown): Partial<Objectifs> | string {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return 'Objectifs : un objet { clé: nombre } est attendu.';
  const o: Partial<Objectifs> = {};
  for (const [cle, v] of Object.entries(d)) {
    if (!(CLES_OBJECTIF as string[]).includes(cle)) return `Objectif inconnu : ${cle.slice(0, 40)}. Clés : ${CLES_OBJECTIF.join(', ')}.`;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 99999) return 'Chaque objectif est un nombre entier, de 0 à 99 999.';
    o[cle as CleObjectif] = v;
  }
  if (!Object.keys(o).length) return 'Aucun objectif donné.';
  return o;
}

/** Story 20.8 : une saisie du chief of staff en JSON, lue par les mêmes règles que celles de la page. */
const CHAMPS_JSON = ['quoi', 'canal', 'jour', 'quantite', 'ville', 'type_lead'];
/** Un nom de commune : lettres, espaces, tirets, apostrophes, 40 caractères au plus ; ni chiffre, ni « chez », ni civilité. */
const COMMUNE = /^[\p{L}][\p{L}' \-·]{0,39}$/u;
const PAS_UNE_COMMUNE = /\b(chez|m|mr|mme|mlle|monsieur|madame|famille)\b/iu;
export function lireSaisieJson(d: Record<string, unknown>): Saisie | string {
  const inconnu = Object.keys(d).find((k) => !CHAMPS_JSON.includes(k));
  if (inconnu) return `Champ inconnu : ${inconnu.slice(0, 40)}. Champs : ${CHAMPS_JSON.join(', ')}.`;
  // Story 20.8 : la ville du boîtage est le seul texte que le chief of staff écrit ; ce doit être un nom de commune, pas un nom de personne.
  if (d.ville !== undefined && (typeof d.ville !== 'string' || !COMMUNE.test(d.ville.trim()) || PAS_UNE_COMMUNE.test(d.ville))) {
    return 'Ville : un nom de commune seulement (lettres, espaces, tirets, 40 caractères au plus), jamais un nom de personne.';
  }
  const f = new FormData();
  for (const k of CHAMPS_JSON) {
    const v = d[k];
    if (typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v))) f.set(k, String(v));
  }
  return lireSaisie(f);
}

/** Story 20.8 : le chief of staff ne retire que ce qu'il a lui-même noté ; la saisie d'Anne n'est jamais touchée. */
export async function retirerSaisieDe(env: EnvSite, genre: 'effort' | 'resultat', id: string, par: string): Promise<boolean> {
  const table = genre === 'effort' ? 'prospection_effort' : 'resultat';
  const r = await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?1 AND par = ?2`).bind(id, par).run();
  return r.meta.changes === 1;
}

// ---- Saisies ----

export type Saisie =
  | { quoi: 'effort'; canal: CanalProspection; jour: string; quantite: number; note: string | null; ville: string | null }
  | { quoi: 'lead'; canal: CanalResultat; jour: string; quantite: number; type_lead: TypeLead }
  | { quoi: 'rdv'; canal: CanalResultat; jour: string; quantite: number };

const texte = (f: FormData, k: string, max: number) => { const v = f.get(k); return typeof v === 'string' ? v.trim().slice(0, max) : ''; };

/** Lit une saisie de la page (effort, lead ou rendez-vous) ; ou le message d'erreur à montrer. */
export function lireSaisie(f: FormData): Saisie | string {
  const quoi = texte(f, 'quoi', 20);
  const canal = texte(f, 'canal', 40);
  const jour = texte(f, 'jour', 20);
  const q = texte(f, 'quantite', 10).replace(/\s/g, '');
  if (quoi !== 'effort' && quoi !== 'lead' && quoi !== 'rdv') return 'Choisissez ce que vous notez : effort, lead ou rendez-vous.';
  const suivi = dansListe(CANAUX_PROSPECTION, canal);
  if (!suivi && !dansListe(CANAUX_BONUS, canal)) return 'Canal inconnu.';
  if (!jourValide(jour) || jour < PREMIER_JOUR) return 'Date invalide.';
  if (jour > jourParis()) return 'La date est dans le futur : notez ce qui est déjà fait.';
  const max = quoi === 'effort' ? 99999 : 99;
  if (!/^\d{1,5}$/.test(q) || Number(q) < 1 || Number(q) > max) return `Le nombre est un entier de 1 à ${max === 99 ? '99' : '99 999'}.`;
  const quantite = Number(q);
  if (quoi === 'effort') {
    if (!suivi) return "Ce canal n'a pas d'effort à noter : notez-y seulement des leads et des rendez-vous.";
    const ville = texte(f, 'ville', 120);
    if (canal === 'boitage' && !ville) return 'Pour le boîtage, indiquez la ville.';
    return { quoi, canal: canal as CanalProspection, jour, quantite, note: texte(f, 'note', 200) || null, ville: canal === 'boitage' ? ville : null };
  }
  if (quoi === 'lead') {
    if (canal === 'site') return 'Les leads du site et des portails se comptent seuls, depuis les demandes reçues.';
    const t = texte(f, 'type_lead', 20) || 'direct';
    if (!dansListe(TYPES_LEAD, t)) return 'Type de lead inconnu.';
    return { quoi, canal: canal as CanalResultat, jour, quantite, type_lead: t as TypeLead };
  }
  return { quoi, canal: canal as CanalResultat, jour, quantite };
}

/** Enregistre une saisie ; un effort de boîtage devient un passage du tableau du boîtage. Renvoie l'identifiant écrit. */
export async function enregistrerSaisie(env: EnvSite, s: Saisie, par: string): Promise<string> {
  const maintenant = new Date().toISOString();
  if (s.quoi === 'effort' && s.canal === 'boitage') {
    return ajouterBoitage(env, { fait_le: s.jour, ville: s.ville ?? '', quartier: null, type_bien: null, flyers: s.quantite, message: null, r1: null, r2: null,
      // Story 20.8 : un passage noté par le chief of staff le dit dans son commentaire (la table du boîtage n'a pas de colonne « par »).
      commentaire: par === PAR_CHIEF ? NOTE_CHIEF : s.note });
  }
  const id = ulid();
  if (s.quoi === 'effort') {
    await env.DB.prepare('INSERT INTO prospection_effort (id, canal, jour, quantite, note, par, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)')
      .bind(id, s.canal, s.jour, s.quantite, s.note, par, maintenant).run();
  } else {
    await env.DB.prepare('INSERT INTO resultat (id, type, canal, type_lead, le, quantite, par, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)')
      .bind(id, s.quoi, s.canal, s.quoi === 'lead' ? s.type_lead : null, s.jour, s.quantite, par, maintenant).run();
  }
  return id;
}

/** Retire une saisie de la page (pas un passage de boîtage : il se corrige dans son tableau). Vrai si une ligne est partie. */
export async function retirerSaisie(env: EnvSite, genre: 'effort' | 'resultat', id: string): Promise<boolean> {
  const table = genre === 'effort' ? 'prospection_effort' : 'resultat';
  const r = await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?1`).bind(id).run();
  return r.meta.changes === 1;
}

// ---- La semaine ----

export interface LigneCanal {
  canal: CanalProspection;
  libelle: string;
  unite: string;
  saisie: string;
  objectif: number;
  effort: number;
  /** La part de l'effort comptée seule (modèles envoyés depuis l'espace pour les messages). */
  effortAuto: number;
  leads: number;
  rdv: number;
}
export interface LigneBonus { canal: CanalBonus; libelle: string; leads: number; rdv: number }
export interface Note {
  genre: 'effort' | 'resultat' | 'boitage';
  id: string;
  canal: CanalResultat;
  jour: string;
  quoi: 'effort' | 'lead' | 'rdv' | 'recommandation' | 'mandat';
  quantite: number;
  detail: string | null;
  par: string | null;
}
export interface Semaine {
  periode: Periode;
  /** Premier et dernier jour de la période (lundi et dimanche pour une semaine). */
  lundi: string;
  dimanche: string;
  objectifs: Objectifs;
  canaux: LigneCanal[];
  bonus: LigneBonus[];
  /**
   * `leads` et `rdv` : les canaux suivis seulement, face à l'objectif. Le bonus (site, portails, autre) est à part, dans
   * `leadsBonus` et `rdvBonus` (spec Priestley point 5 : « hors objectif, comptés en bonus » ; revue de code 20.7).
   * `leadsDirects` et `leadsDiagnostic` comptent tous les leads, bonus compris.
   */
  total: { leads: number; rdv: number; leadsBonus: number; rdvBonus: number; leadsDirects: number; leadsDiagnostic: number };
  notes: Note[];
}

export const PERIODES_PAGE = { semaine: 'Semaine', mois: 'Mois', annee: 'Année' } as const;
export type Periode = keyof typeof PERIODES_PAGE;
/** Semaines de travail par an (modèle de JB) : un objectif de semaine vaut 1/46 de l'année ; un mois, 1/12 de l'année. */
export const SEMAINES_PAR_AN = 46;

/** Premier et dernier jour de la période qui contient ce jour. */
export function bornes(periode: Periode, jour: string): { debut: string; fin: string } {
  if (periode === 'semaine') { const l = lundiDe(jour); return { debut: l, fin: dimancheDe(l) }; }
  if (periode === 'annee') return { debut: `${jour.slice(0, 4)}-01-01`, fin: `${jour.slice(0, 4)}-12-31` };
  const debut = `${jour.slice(0, 7)}-01`;
  const suivant = new Date(Date.UTC(Number(jour.slice(0, 4)), Number(jour.slice(5, 7)), 1, 12));
  return { debut, fin: decaler(suivant.toISOString().slice(0, 10), -1) };
}
/** La période voisine (avant ou après) : son premier jour. */
export function voisine(periode: Periode, debut: string, sens: 1 | -1): string {
  if (periode === 'semaine') return decaler(debut, 7 * sens);
  if (periode === 'annee') return `${Number(debut.slice(0, 4)) + sens}-01-01`;
  const d = new Date(Date.UTC(Number(debut.slice(0, 4)), Number(debut.slice(5, 7)) - 1 + sens, 1, 12));
  return d.toISOString().slice(0, 10);
}
/** Le jour demandé (`?s=`), ou aujourd'hui. */
export const jourDemande = (s: string | null) => (jourValide(s) && s >= PREMIER_JOUR ? s : jourParis());

/** Arrondi au-dessus (règle de JB) ; à la centaine au-dessus à partir de 1 000. */
const auDessus = (x: number) => (x >= 1000 ? Math.ceil(x / 100 - 1e-9) * 100 : Math.ceil(x - 1e-9));
/** Les objectifs de semaine ramenés au mois (× 46/12) ou à l'année (× 46). */
export function objectifsDePeriode(o: Objectifs, periode: Periode): Objectifs {
  if (periode === 'semaine') return o;
  const f = periode === 'annee' ? SEMAINES_PAR_AN : SEMAINES_PAR_AN / 12;
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, auDessus(v * f)])) as Objectifs;
}

/** « novembre 2026 », « 2026 » */
export function libellePeriode(periode: Periode, debut: string): string {
  if (periode === 'semaine') return libelleSemaine(debut);
  if (periode === 'annee') return debut.slice(0, 4);
  return new Date(`${debut}T12:00:00Z`).toLocaleDateString('fr-FR', { timeZone: 'UTC', month: 'long', year: 'numeric' });
}

/** ISO d'un instant → jour de Paris, et la fenêtre UTC large qui couvre la semaine de Paris (filtrée ensuite jour par jour). */
const fenetre = (debut: string, fin: string) => [`${decaler(debut, -1)}T00:00:00Z`, `${decaler(fin, 2)}T00:00:00Z`] as const;

export const lireSemaine = (env: EnvSite, lundi: string) => lirePeriode(env, 'semaine', lundi);

/** Une période de la page : la semaine du lundi donné, le mois ou l'année qui contiennent ce jour. Objectifs ramenés à la période. */
export async function lirePeriode(env: EnvSite, periode: Periode, jour: string): Promise<Semaine> {
  const { debut: lundi, fin: dimanche } = bornes(periode, jour);
  const [de, a] = fenetre(lundi, dimanche);
  const dans = (j: string) => j >= lundi && j <= dimanche;
  const [objectifs, efforts, resultats, passages, envois, nouveaux] = await Promise.all([
    lireObjectifs(env).then((o) => objectifsDePeriode(o, periode)),
    env.DB.prepare('SELECT id, canal, jour, quantite, note, par FROM prospection_effort WHERE jour BETWEEN ?1 AND ?2 ORDER BY jour DESC, created_at DESC')
      .bind(lundi, dimanche).all<{ id: string; canal: string; jour: string; quantite: number; note: string | null; par: string | null }>(),
    env.DB.prepare('SELECT id, type, canal, type_lead, le, quantite, par FROM resultat WHERE le BETWEEN ?1 AND ?2 ORDER BY le DESC, created_at DESC')
      .bind(lundi, dimanche).all<{ id: string; type: Note['quoi']; canal: string; type_lead: TypeLead | null; le: string; quantite: number; par: string | null }>(),
    env.DB.prepare('SELECT id, fait_le, coalesce(ville, secteur) AS ville, mots, commentaire FROM passage_boitage WHERE fait_le BETWEEN ?1 AND ?2 ORDER BY fait_le DESC, created_at DESC')
      .bind(lundi, dimanche).all<{ id: string; fait_le: string; ville: string; mots: number | null; commentaire: string | null }>(),
    // Messages ambassadeur : les modèles envoyés (à la main ou groupés) aux seuls ambassadeurs (projet « ambassadeur », inscrits
    // ou partants, comme le tableau des ambassadeurs) ; une campagne aux acheteurs ne compte pas (revue de code 20.7).
    // Le LIKE écarte vite les autres événements avant la lecture du JSON.
    env.DB.prepare(`SELECT e.a FROM contact_evenement e JOIN contact c ON c.id = e.contact_id
       WHERE e.a >= ?1 AND e.a < ?2 AND e.donnees LIKE '%envoi_modele%' AND json_valid(e.donnees) AND json_type(e.donnees, '$.envoi_modele') IS NOT NULL
         AND (c.projet = 'ambassadeur' OR c.ambassadeur_inscrit_le IS NOT NULL OR c.ambassadeur_partant_le IS NOT NULL)`)
      .bind(de, a).all<{ a: string }>(),
    // Demandes du site et des portails, sauf celles écartées de la file « Nouveaux » et les e-mails de portail restés illisibles
    // (confirmation Gmail, échec SPF, message trop gros). `origine` : la source du formulaire du site (diagnostic, guide…).
    env.DB.prepare(`SELECT n.recu_le, n.contact_id, n.source, CASE WHEN json_valid(e.donnees) THEN json_extract(e.donnees, '$.source') END AS origine
       FROM nouveau n LEFT JOIN contact_evenement e ON e.id = n.evenement_id LEFT JOIN portail_courriel p ON p.id = n.portail_courriel_id
       WHERE n.source IN ('site', 'portail') AND n.recu_le >= ?1 AND n.recu_le < ?2 AND (n.issue IS NULL OR n.issue <> 'ecarte')
         AND (n.source <> 'portail' OR p.etat IS NULL OR p.etat <> 'illisible')`)
      .bind(de, a).all<{ recu_le: string; contact_id: string | null; source: string; origine: unknown }>(),
  ]);

  const canaux: LigneCanal[] = (Object.entries(CANAUX_PROSPECTION) as [CanalProspection, (typeof CANAUX_PROSPECTION)[CanalProspection]][]).map(([canal, c]) => ({
    canal, libelle: c.libelle, unite: c.unite, saisie: c.saisie, objectif: objectifs[`effort:${canal}`], effort: 0, effortAuto: 0, leads: 0, rdv: 0,
  }));
  const parCanal = new Map<string, LigneCanal>(canaux.map((l) => [l.canal, l]));
  const bonus: LigneBonus[] = (Object.entries(CANAUX_BONUS) as [CanalBonus, string][]).map(([canal, libelle]) => ({ canal, libelle, leads: 0, rdv: 0 }));
  const parBonus = new Map<string, LigneBonus>(bonus.map((l) => [l.canal, l]));
  const total = { leads: 0, rdv: 0, leadsBonus: 0, rdvBonus: 0, leadsDirects: 0, leadsDiagnostic: 0 };
  const notes: Note[] = [];

  for (const e of efforts.results) {
    const l = parCanal.get(e.canal);
    if (!l) continue; // canal retiré du code depuis : la ligne reste en base, hors page
    l.effort += e.quantite;
    notes.push({ genre: 'effort', id: e.id, canal: l.canal, jour: e.jour, quoi: 'effort', quantite: e.quantite, detail: e.note, par: e.par });
  }
  const boitage = parCanal.get('boitage')!;
  for (const p of passages.results) {
    boitage.effort += p.mots ?? 0;
    notes.push({ genre: 'boitage', id: p.id, canal: 'boitage', jour: p.fait_le, quoi: 'effort', quantite: p.mots ?? 0, detail: p.ville, par: p.commentaire === NOTE_CHIEF ? PAR_CHIEF : null });
  }
  const messages = parCanal.get('messages')!;
  for (const e of envois.results) if (dans(jourParis(new Date(e.a)))) { messages.effort++; messages.effortAuto++; }

  for (const r of resultats.results) {
    const l = parCanal.get(r.canal) ?? parBonus.get(r.canal);
    if (!l) continue;
    const enBonus = parBonus.has(r.canal);
    if (r.type === 'lead') {
      l.leads += r.quantite;
      if (enBonus) total.leadsBonus += r.quantite; else total.leads += r.quantite;
      if (r.type_lead === 'diagnostic') total.leadsDiagnostic += r.quantite; else total.leadsDirects += r.quantite;
    } else if (r.type === 'rdv') { l.rdv += r.quantite; if (enBonus) total.rdvBonus += r.quantite; else total.rdv += r.quantite; }
    notes.push({ genre: 'resultat', id: r.id, canal: l.canal, jour: r.le, quoi: r.type, quantite: r.quantite, detail: r.type === 'lead' && r.type_lead ? TYPES_LEAD[r.type_lead].split(' (')[0] : null, par: r.par });
  }
  // Leads du site et des portails : une personne par période (deux demandes du même contact = un lead). Une inscription
  // au programme ambassadeurs n'est pas un lead. Diagnostic et guide : des coordonnées laissées (lead « diagnostic »),
  // le reste (contact, estimation, rendez-vous, portail) : une demande directe. Une personne venue des deux est directe.
  const site = parBonus.get('site')!;
  const parPersonne = new Map<string, TypeLead>();
  for (const n of nouveaux.results) {
    if (!dans(jourParis(new Date(n.recu_le)))) continue;
    if (n.origine === 'ambassadeur') continue;
    const type: TypeLead = n.source === 'site' && (n.origine === 'diagnostic' || n.origine === 'guide') ? 'diagnostic' : 'direct';
    const cle = n.contact_id ?? `${n.source}:${n.recu_le}`;
    if (parPersonne.get(cle) !== 'direct') parPersonne.set(cle, type);
  }
  for (const type of parPersonne.values()) {
    site.leads++; total.leadsBonus++;
    if (type === 'diagnostic') total.leadsDiagnostic++; else total.leadsDirects++;
  }
  notes.sort((x, y) => (x.jour < y.jour ? 1 : x.jour > y.jour ? -1 : 0));
  return { periode, lundi, dimanche, objectifs, canaux, bonus, total, notes };
}

/** Les totaux de la semaine pour l'accès de Claude : des nombres seulement, aucun compte ni lieu. */
export async function totauxSemaine(env: EnvSite, lundi: string) {
  const s = await lireSemaine(env, lundi);
  return {
    lundi: s.lundi,
    dimanche: s.dimanche,
    objectifs: { rdv: s.objectifs.rdv, leads: s.objectifs.leads },
    total: s.total,
    canaux: s.canaux.map(({ canal, unite, objectif, effort, effortAuto, leads, rdv }) => ({ canal, unite, objectif, effort, effort_auto: effortAuto, leads, rdv })),
    bonus: s.bonus.map(({ canal, leads, rdv }) => ({ canal, leads, rdv })),
  };
}

/** Part atteinte, de 0 à 100 (plafonnée pour la barre) ; null sans objectif. */
export const partAtteinte = (fait: number, vise: number) => (vise > 0 ? Math.min(100, Math.round((fait / vise) * 100)) : null);

/** « 1 500 » */
export const nombre = (n: number) => new Intl.NumberFormat('fr-FR').format(n).replace(/\s/g, ' ');
