// La barre « Nouveaux » de la page Contacts (story 18.11, FR-27, AD-32, AD-34) : les demandes reçues qu'Anne n'a pas
// encore regardées, lues dans la table `nouveau` (lignes dont `vu_le` est NULL), et les gestes qu'elle fait sur chacune.
// Écrivains de `nouveau` : site/src/server/contacts.ts (demandes du site), `leedflow` (numéros inconnus), ce module
// (`vu_le` et `issue`, seul à les poser et à les remettre à NULL). Les autres écritures passent par leur module :
// `carnet` (écarter, création d'un contact), `pipeline` (entrée dans le suivi), `leedflow` (classement du numéro).
// Gestes :
// - demande du site : « Ranger » (la carte sort, la page ouvre la fiche du contact, story 18.7), « Vu », « Écarter »
//   (`carnet.classer`, avant-image gardée) ;
// - numéro inconnu vu par Leedflow : « Ajouter aux contacts » (création par `carnet`, avec le contrôle d'opposition, numéro
//   classé « prospect » avec ce contact, contact suivi), « Ajouter à sa fiche » quand le numéro est déjà dans le carnet
//   (numéro classé « prospect » avec ce contact, qui entre dans le suivi pour que ses appels lui soient rattachés), « Ignorer »
//   (numéro classé « privé »).
// Chaque geste pose `vu_le` et `issue`, d'abord (un double clic ne fait rien deux fois), puis écrit ; si l'écriture est
// refusée, la ligne est rouverte. L'annulation, possible pendant `ANNULATION_MS`, rejoue l'avant-image (AD-29) : lot du
// carnet annulé, suivi remis comme avant, contact créé supprimé s'il n'a rien reçu d'autre, classement du numéro retiré ;
// puis `vu_le` revient à NULL.
// Jamais appelé par les routes /api/claude/… (Claude ne lit ni n'écrit les contacts).
import type { EnvSite } from '@site/server/env';
import { trouver } from '@site/server/contacts';
import type { EnvEspace } from './env';
import { annulerCreation, annulerLot, classer, creerContact, type Saisie } from './carnet';
import { ANNULATION_MS, classerDepuisNouveaux, declasserDepuisNouveaux, extrait, resumesInconnus } from './leedflow';
import { annulerSuiviParGeste, suivreParGeste } from './pipeline';

export type Geste = 'ranger' | 'vu' | 'ecarter' | 'ajouter' | 'rattacher' | 'ignorer';
export const GESTES: readonly Geste[] = ['ranger', 'vu', 'ecarter', 'ajouter', 'rattacher', 'ignorer'];
const ISSUES: Record<Geste, string> = { ranger: 'range', vu: 'vu', ecarter: 'ecarte', ajouter: 'ajoute', rattacher: 'rattache', ignorer: 'ignore' };
const PAR_SOURCE: Record<string, readonly Geste[]> = { site: ['ranger', 'vu', 'ecarter'], portail: ['ranger', 'vu', 'ecarter'], leedflow: ['ajouter', 'rattacher', 'ignorer'] };
/** Au plus tant de cartes lues ; le compteur dit combien en tout. */
const MAX_CARTES = 200;

export interface CarteNouveau {
  id: string;
  source: 'site' | 'portail' | 'leedflow';
  recu_le: string;
  /** La pastille : « Site », « Leedflow »… */
  origine: string;
  /** Le genre de demande : « Demande d'estimation », « Appel reçu · 2 min »… */
  titre: string;
  contact_id: string | null;
  nom: string | null;
  telephone: string | null;
  email: string | null;
  /** Le message de la demande ou le résumé du dernier échange, en texte simple. */
  texte: string | null;
  /** Annonce concernée (portails, story 18.12). */
  annonce: string | null;
  /** Numéro inconnu de Leedflow déjà porté par un contact du carnet : « Ajouter à sa fiche ». */
  connu: { id: string; nom: string; categorie: string | null } | null;
  /** Ce que Leedflow sait d'un numéro inconnu, pour préremplir « Ajouter aux contacts ». */
  prerempli: { prenom: string | null; nom: string | null; email: string | null } | null;
  echanges: number;
  ecarte: boolean;
  gestes: Geste[];
}

const SITE: Record<string, string> = {
  diagnostic: 'Diagnostic du site', contact: 'Demande de contact', guide: 'Demande du guide', rdv: 'Prise de rendez-vous',
  estimation: 'Demande d\'estimation', ambassadeur: 'Inscription au programme ambassadeurs',
};
const nomDe = (p: string | null, n: string | null) => [p, n].filter(Boolean).join(' ') || null;
const court = (t: string | null | undefined, max = 600) => { const s = (t ?? '').replace(/\s+/g, ' ').trim(); return s ? (s.length > max ? `${s.slice(0, max - 1)}…` : s) : null; };

interface Ligne {
  id: string; source: 'site' | 'portail' | 'leedflow'; recu_le: string; contact_id: string | null; leedflow_tel: string | null;
  prenom: string | null; nom: string | null; telephone: string | null; email: string | null; ecarte_le: string | null;
  ev_texte: string | null; ev_donnees: string | null; lead_source: string | null; message: string | null; commune_bien: string | null; type_bien: string | null;
}

/** Les cartes à voir, la plus récente d'abord, et leur nombre. */
export async function lireNouveaux(envE: EnvEspace): Promise<{ total: number; cartes: CarteNouveau[] }> {
  const env = envE as unknown as EnvSite;
  const { results } = await env.DB.prepare(
    `SELECT n.id, n.source, n.recu_le, n.contact_id, i.telephone AS leedflow_tel,
       c.prenom, c.nom, c.telephone, c.email, c.ecarte_le,
       e.texte AS ev_texte, e.donnees AS ev_donnees, l.source AS lead_source, l.message, l.commune_bien, l.type_bien
     FROM nouveau n
       LEFT JOIN contact c ON c.id = n.contact_id
       LEFT JOIN contact_evenement e ON e.id = n.evenement_id
       LEFT JOIN lead l ON e.source = 'site' AND l.id = e.source_id
       LEFT JOIN leedflow_inconnu i ON i.source_id = n.leedflow_inconnu_id
     WHERE n.vu_le IS NULL
       -- Une ligne de Leedflow dont l'échange a disparu (rattaché, purgé) n'a plus rien à montrer : la relève la ferme.
       AND (n.source <> 'leedflow' OR i.telephone IS NOT NULL)
       AND (n.source = 'leedflow' OR c.id IS NOT NULL)
     ORDER BY n.recu_le DESC, n.id DESC`,
  ).all<Ligne>();
  const lues = results.slice(0, MAX_CARTES);
  const tels = [...new Set(lues.filter((l) => l.source === 'leedflow' && l.leedflow_tel).map((l) => l.leedflow_tel!))];
  const [resumes, connus] = await Promise.all([resumesInconnus(envE, tels), contactsDesNumeros(env, tels)]);
  const cartes = lues.map((l): CarteNouveau => {
    if (l.source === 'leedflow') {
      const tel = l.leedflow_tel!;
      const r = resumes.get(tel);
      const dernier = r?.echanges[0];
      const connu = connus.get(tel) ?? null;
      return {
        id: l.id, source: 'leedflow', recu_le: l.recu_le, origine: 'Leedflow',
        titre: dernier?.titre || (r?.taches.length ? 'Tâche détectée par Leedflow' : 'Appel reçu'),
        contact_id: null, nom: r ? nomDe(r.prenom || null, r.nom || null) : null, telephone: tel, email: r?.email || null,
        texte: dernier ? court(extrait(dernier.resume)) ?? 'Pas de résumé (appel sans message).' : court(r?.taches[0]?.titre),
        annonce: null, connu, prerempli: r ? { prenom: r.prenom || null, nom: r.nom || null, email: r.email || null } : null,
        echanges: (r?.echanges.length ?? 0) + (r?.taches.length ?? 0), ecarte: false,
        gestes: connu ? ['rattacher', 'ignorer'] : ['ajouter', 'ignorer'],
      };
    }
    let d: Record<string, unknown> = {};
    try { d = l.ev_donnees ? JSON.parse(l.ev_donnees) : {}; } catch {}
    const lieu = [l.type_bien, l.commune_bien].filter(Boolean).join(' · ');
    return {
      id: l.id, source: l.source, recu_le: l.recu_le, origine: 'Site',
      titre: SITE[l.lead_source ?? String(d.source ?? '')] ?? (l.ev_texte ?? 'Demande reçue'),
      contact_id: l.contact_id, nom: nomDe(l.prenom, l.nom), telephone: l.telephone, email: l.email,
      texte: court(l.message) ?? (lieu || null), annonce: null, connu: null, prerempli: null, echanges: 0, ecarte: !!l.ecarte_le,
      gestes: [...PAR_SOURCE[l.source]] as Geste[],
    };
  });
  return { total: results.length, cartes };
}

/** Le contact du carnet qui porte chacun de ces numéros (principal d'abord, puis autre numéro), quelle que soit son étape. */
async function contactsDesNumeros(env: EnvSite, tels: string[]): Promise<Map<string, { id: string; nom: string; categorie: string | null }>> {
  if (!tels.length) return new Map();
  const { results } = await env.DB.prepare(
    `SELECT x.tel, c.id, c.prenom, c.nom, c.email, k.nom AS categorie FROM (
       SELECT t.value AS tel, c.id AS cid, 0 AS rang FROM json_each(?1) t JOIN contact c ON c.telephone = t.value
       UNION ALL SELECT t.value, k.contact_id, 1 FROM json_each(?1) t JOIN contact_coordonnee k ON k.valeur = t.value AND k.type = 'telephone'
     ) x JOIN contact c ON c.id = x.cid LEFT JOIN categorie k ON k.id = c.categorie_id ORDER BY x.rang DESC`,
  ).bind(JSON.stringify(tels)).all<{ tel: string; id: string; prenom: string | null; nom: string | null; email: string | null; categorie: string | null }>();
  // Rang décroissant : le numéro principal, lu en dernier, l'emporte.
  return new Map(results.map((r) => [r.tel, { id: r.id, nom: nomDe(r.prenom, r.nom) ?? r.email ?? r.tel, categorie: r.categorie }]));
}

export type ResultatNouveaux =
  | { ok: true; message: string; contact_id?: string; supprime?: string }
  | { ok: false; status: number; code: string; message: string; existant?: { id: string; nom: string } };
const refus = (status: number, code: string, message: string, plus: { existant?: { id: string; nom: string } } = {}): ResultatNouveaux => ({ ok: false, status, code, message, ...plus });

interface LigneNouveau { id: string; source: string; contact_id: string | null; vu_le: string | null; issue: string | null; tel: string | null }
async function lireLigne(env: EnvSite, id: string): Promise<LigneNouveau | null> {
  return env.DB.prepare(
    `SELECT n.id, n.source, n.contact_id, n.vu_le, n.issue, i.telephone AS tel FROM nouveau n
     LEFT JOIN leedflow_inconnu i ON i.source_id = n.leedflow_inconnu_id WHERE n.id = ?1`,
  ).bind(id).first<LigneNouveau>();
}
const rouvrir = (env: EnvSite, id: string, vu: string) => env.DB.prepare('UPDATE nouveau SET vu_le = NULL, issue = NULL WHERE id = ?1 AND vu_le = ?2').bind(id, vu).run();

/**
 * Un geste sur une carte. `saisie` : seulement pour « Ajouter aux contacts » (la fenêtre de création préremplie, lue par
 * `carnet.lireSaisie` dans la route). Le numéro de la carte est celui du contact créé.
 */
export async function agir(envE: EnvEspace, id: string, geste: Geste, par: string, saisie?: Saisie): Promise<ResultatNouveaux> {
  const env = envE as unknown as EnvSite;
  const n = await lireLigne(env, id);
  if (!n) return refus(404, 'nouveau', 'Demande inconnue.');
  if (n.vu_le) return refus(409, 'traitee', 'Cette demande a déjà été traitée.');
  if (!PAR_SOURCE[n.source]?.includes(geste)) return refus(400, 'geste', 'Ce geste ne s\'applique pas à cette demande.');
  if (n.source === 'leedflow' && !n.tel) return refus(409, 'disparue', 'Ce numéro n\'est plus à trier (rattaché ou effacé entre-temps).');
  if (n.source !== 'leedflow' && !n.contact_id) return refus(409, 'disparue', 'Le contact de cette demande n\'existe plus.');
  if (geste === 'ajouter' && !saisie) return refus(400, 'saisie', 'Saisie du contact attendue.');
  const vu = new Date().toISOString();
  const pris = await env.DB.prepare('UPDATE nouveau SET vu_le = ?2, issue = ?3 WHERE id = ?1 AND vu_le IS NULL').bind(id, vu, ISSUES[geste]).run();
  if (!pris.meta.changes) return refus(409, 'traitee', 'Cette demande a déjà été traitée.');
  try {
    const r = await ecrireGeste(envE, env, n, geste, vu, par, saisie);
    if (!r.ok) await rouvrir(env, id, vu);
    return r;
  } catch (e) {
    await rouvrir(env, id, vu);
    throw e;
  }
}

async function ecrireGeste(envE: EnvEspace, env: EnvSite, n: LigneNouveau, geste: Geste, vu: string, par: string, saisie?: Saisie): Promise<ResultatNouveaux> {
  switch (geste) {
    case 'vu': return { ok: true, message: 'Demande marquée vue : le contact reste dans le tableau.' };
    case 'ranger': return { ok: true, message: 'Demande rangée : corrigez la catégorie, le projet et la température dans la fiche.', contact_id: n.contact_id! };
    case 'ecarter': {
      const r = await classer(env, [n.contact_id!], { ecarte: true }, par, { nouveau: n.id });
      if (!r.touches && !r.inchanges) return refus(409, 'modifie', 'Ce contact vient d\'être modifié ailleurs : rien n\'a été écarté, recommencez.');
      return { ok: true, message: 'Contact écarté (démarchage, erreur) : filtre « Écartés » pour le revoir.', contact_id: n.contact_id! };
    }
    case 'ignorer': {
      const classe = await classerDepuisNouveaux(envE, n.tel!, 'prive', null, vu, par);
      return { ok: true, message: classe ? 'Numéro ignoré (privé) : il ne sera plus proposé.' : 'Numéro déjà classé : la demande sort de la liste.' };
    }
    case 'rattacher': {
      const c = await trouver(env, n.tel!, null);
      if (!c) return refus(409, 'inconnu', 'Ce numéro n\'est plus celui d\'un contact du carnet : utilisez « Ajouter aux contacts ».');
      if (!(await classerDepuisNouveaux(envE, n.tel!, 'prospect', c.id, vu, par))) return refus(409, 'classe', 'Ce numéro vient d\'être classé ailleurs (page « À trier »).');
      if (!(await suivreParGeste(env, c.id, n.id, par))) {
        await declasserDepuisNouveaux(envE, n.tel!, 'prospect', vu);
        return refus(409, 'modifie', 'Ce contact vient d\'être modifié ailleurs : rien n\'a été changé, recommencez.');
      }
      return { ok: true, message: 'Numéro ajouté à sa fiche : ses appels y seront rangés, il ne reviendra plus ici.', contact_id: c.id };
    }
    case 'ajouter': {
      const r = await creerContact(env, { ...saisie!, telephone: n.tel!, accord: false }, par, { source: 'leedflow', nouveau: n.id });
      if (!r.ok) {
        if ('existant' in r) return refus(409, 'existant', `Ce téléphone ou cet e-mail est déjà celui de ${r.existant.nom} : ouvrez sa fiche plutôt que d'en créer une seconde.`, { existant: r.existant });
        if ('indisponible' in r) return refus(503, 'opposition_indisponible', 'La liste des personnes qui ont demandé l\'effacement ne peut pas être vérifiée (réglage LIEN_SECRET absent) : ajout refusé, prévenez JB.');
        return refus(409, 'opposition', 'Cette personne a demandé l\'effacement de ses données : elle ne peut pas être ajoutée au carnet.');
      }
      await classerDepuisNouveaux(envE, n.tel!, 'prospect', r.id, vu, par);
      await suivreParGeste(env, r.id, n.id, par);
      return { ok: true, message: 'Contact ajouté et suivi : ses appels y seront rangés.', contact_id: r.id };
    }
  }
}

/** Annule le geste fait sur une carte, pendant `ANNULATION_MS` ; la carte revient dans la barre. */
export async function annuler(envE: EnvEspace, id: string, par: string): Promise<ResultatNouveaux> {
  const env = envE as unknown as EnvSite;
  const n = await lireLigne(env, id);
  if (!n) return refus(404, 'nouveau', 'Demande inconnue.');
  if (!n.vu_le || !n.issue) return refus(409, 'ouverte', 'Cette demande n\'a pas été traitée : rien à annuler.');
  if (Date.parse(n.vu_le) < Date.now() - ANNULATION_MS) return refus(409, 'tard', 'Trop tard pour annuler depuis la barre : corrigez depuis la fiche du contact.');
  const modifie = refus(409, 'modifie', 'Ce contact a été modifié depuis : il est gardé tel quel, rien n\'a été annulé.');
  let touche: { contact_id?: string; supprime?: string } = {};
  switch (n.issue) {
    case 'ecarte': {
      const ev = await env.DB.prepare(`SELECT json_extract(donnees, '$.lot') AS lot FROM contact_evenement WHERE contact_id = ?1 AND type = 'classement'
        AND json_valid(donnees) AND json_extract(donnees, '$.nouveau') = ?2 ORDER BY id DESC LIMIT 1`).bind(n.contact_id, id).first<{ lot: string }>();
      if (ev?.lot) {
        const r = await annulerLot(env, ev.lot, par);
        if (r && r.gardes) return modifie;
      }
      touche = { contact_id: n.contact_id! };
      break;
    }
    case 'ignore':
      if (n.tel) await declasserDepuisNouveaux(envE, n.tel, 'prive', n.vu_le);
      break;
    case 'rattache': {
      const c = n.tel ? await env.DB.prepare(`SELECT contact_id FROM leedflow_ecarte WHERE telephone = ?1 AND categorie = 'prospect' AND a = ?2`).bind(n.tel, n.vu_le).first<{ contact_id: string }>() : null;
      if (c?.contact_id && (await annulerSuiviParGeste(env, c.contact_id, id, par)) === 'garde') return modifie;
      if (n.tel) await declasserDepuisNouveaux(envE, n.tel, 'prospect', n.vu_le);
      if (c?.contact_id) touche = { contact_id: c.contact_id };
      break;
    }
    case 'ajoute': {
      // Le contact créé : celui du classement « prospect » posé par le geste, sinon cherché par son événement de création.
      const c = (n.tel ? await env.DB.prepare(`SELECT contact_id FROM leedflow_ecarte WHERE telephone = ?1 AND categorie = 'prospect' AND a = ?2`).bind(n.tel, n.vu_le).first<{ contact_id: string }>() : null)
        ?? await env.DB.prepare(`SELECT contact_id FROM contact_evenement WHERE type = 'creation' AND source = 'anne'
          AND json_valid(donnees) AND json_extract(donnees, '$.nouveau') = ?1 LIMIT 1`).bind(id).first<{ contact_id: string }>();
      if (c) {
        const r = await annulerCreation(env, c.contact_id, id);
        if (r === 'garde') return modifie;
        if (r === 'supprime') touche = { supprime: c.contact_id };
      }
      break;
    }
  }
  await rouvrir(env, id, n.vu_le);
  return { ok: true, message: 'Geste annulé : la demande est revenue dans « Nouveaux ».', ...touche };
}
