// Fiche d'un contact et création à la main (story 18.7, FR-26, FR-28), pour le panneau de la page Contacts. Toutes les
// écritures passent par `server/carnet` (avant-image gardée, AD-29), l'accord e-mail par `server/accord` (AD-21). Mêmes
// contrôles que /api/carnet : réservé à Anne et JB (en-tête du compte posé par worker.ts après Cloudflare Access), jeton
// de service de Claude refusé (403) ; corps en JSON seulement, 20 000 caractères au plus (413).
//   GET  /api/fiche?id=…                                  → 200 { ok, fiche }            ; 404 contact inconnu
//   POST /api/fiche { id, corriger: { prenom?, nom?, entreprise?, commune?, telephones?, emails?, categorie_id?, projet?,
//                     temperature?, verifie?, ecarte?, appel_autorise?, a_rappeler_le? } }
//        → 200 { ok, fiche, ligne, changes, ignore } ; 409 { error: { code: 'existant' }, existant: { id, nom } } (téléphone ou
//          e-mail d'un autre contact) ; 409 'modifie' (contact changé entre la lecture et l'écriture)
//   POST /api/fiche { id, note: "…" }                     → 200 { ok, fiche, ligne }
//   POST /api/fiche { id, contact: { jour, canal, note? } } → 200 { ok, fiche, ligne, remplace }  (contact fait hors séance)
//   POST /api/fiche { id, accord: 'oui' | 'retirer' | 'refus' } → 200 { ok, fiche, ligne } ; 409 si impossible
//   POST /api/fiche { creer: { prenom?, nom?, telephone?, email?, commune?, entreprise?, categorie_id, projet?, temperature?,
//                     note?, accord? } }
//        → 201 { ok, id, ligne } ; 409 'existant' (proposer d'ouvrir le contact existant) ; 409 'opposition'
// Revue de code 18.7 : une correction qui ajoute un téléphone ou un e-mail d'une personne en opposition → 409 'opposition' ;
// sans LIEN_SECRET et avec une liste d'opposition non vide, création et ajout de coordonnée → 503 'opposition_indisponible'.
// 400 pour toute valeur hors vocabulaire. Réponses `{ ok, ... }` ou `{ ok: false, error: { code, message } }`.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { ajouterNote, corrigerFiche, creerContact, lireContactNote, lireCorrection, lireSaisie, noterContact } from '../../server/carnet';
import { noterAccord, noterRefus } from '../../server/accord';
import { COMPTE_CLAUDE, envEspace, pourSite as env } from '../../server/env';
import { lireFiche } from '../../server/fiche';
import { ULID } from '../../server/formulaires';
import { rattacherInconnus } from '../../server/leedflow';
import { lireTableau } from '../../server/tableau';
import { idsCategories } from '../../server/vues-base';

export const prerender = false;
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const erreur = (status: number, code: string, message: string, plus: Record<string, unknown> = {}) => json({ ok: false, error: { code, message }, ...plus }, status);
const MAX_CORPS = 20_000;
/** Revue de code 18.7 : sans LIEN_SECRET, la liste d'opposition ne peut pas être lue ; si elle n'est pas vide, on refuse. */
const INDISPONIBLE = 'La liste des personnes qui ont demandé l\'effacement ne peut pas être vérifiée (réglage LIEN_SECRET absent) : ajout refusé, prévenez JB.';
const compteDe = (request: Request) => { const c = request.headers.get(ENTETE_COMPTE); return !c || c === COMPTE_CLAUDE ? null : c; };

/** La fiche et la ligne du tableau d'un contact, après une écriture. */
async function etat(id: string, plus: Record<string, unknown> = {}, status = 200) {
  const [fiche, lignes] = await Promise.all([lireFiche(env, id), lireTableau(env, id)]);
  if (!fiche) return erreur(404, 'contact', 'Contact inconnu');
  return json({ ok: true, ...plus, fiche, ligne: lignes[0] ?? null }, status);
}

export const GET: APIRoute = async ({ request, url }) => {
  if (!compteDe(request)) return erreur(403, 'acces', 'Accès refusé');
  const id = url.searchParams.get('id') ?? '';
  if (!ULID.test(id)) return erreur(400, 'id', 'Identifiant invalide');
  const fiche = await lireFiche(env, id);
  return fiche ? json({ ok: true, fiche }) : erreur(404, 'contact', 'Contact inconnu');
};

export const POST: APIRoute = async ({ request }) => {
  const compte = compteDe(request);
  if (!compte) return erreur(403, 'acces', 'Accès refusé');
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return erreur(400, 'corps', 'Corps JSON attendu');
  if (Number(request.headers.get('content-length') ?? 0) > MAX_CORPS) return erreur(413, 'taille', 'Demande trop grande');
  const texte = await request.text();
  if (texte.length > MAX_CORPS) return erreur(413, 'taille', 'Demande trop grande');
  let d: Record<string, unknown>;
  try {
    const brut = JSON.parse(texte) as unknown;
    if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return erreur(400, 'corps', 'Corps JSON attendu');
    d = brut as Record<string, unknown>;
  } catch { return erreur(400, 'corps', 'Corps JSON attendu'); }

  if (d.creer !== undefined) {
    if (Object.keys(d).length !== 1) return erreur(400, 'corps', 'Champ inconnu');
    const s = lireSaisie(d.creer, await idsCategories(env));
    if (typeof s === 'string') return erreur(400, 'saisie', s);
    const r = await creerContact(env, s, compte);
    if (r.ok) return etat(r.id, { id: r.id }, 201);
    if ('existant' in r) return erreur(409, 'existant', `Ce téléphone ou cet e-mail est déjà celui de ${r.existant.nom} : ouvrez sa fiche plutôt que d'en créer une seconde.`, { existant: r.existant });
    if ('indisponible' in r) return erreur(503, 'opposition_indisponible', INDISPONIBLE);
    return erreur(409, 'opposition', 'Cette personne a demandé l\'effacement de ses données : elle ne peut pas être ajoutée au carnet.');
  }

  if (typeof d.id !== 'string' || !ULID.test(d.id)) return erreur(400, 'id', 'Identifiant invalide');
  const id = d.id;
  const gestes = ['corriger', 'note', 'contact', 'accord'].filter((k) => d[k] !== undefined);
  if (gestes.length !== 1 || Object.keys(d).length !== 2) return erreur(400, 'corps', 'Un seul geste à la fois : corriger, note, contact ou accord');
  const geste = gestes[0];

  if (geste === 'corriger') {
    const c = lireCorrection(d.corriger, await idsCategories(env));
    if (typeof c === 'string') return erreur(400, 'correction', c);
    const r = await corrigerFiche(env, id, c, compte);
    if (!r) return erreur(404, 'contact', 'Contact inconnu');
    if (!r.ok) {
      if ('conflit' in r) return erreur(409, 'existant', `Ce téléphone ou cet e-mail est déjà celui de ${r.conflit.nom} : rien n'a été changé.`, { existant: r.conflit });
      if ('opposition' in r) return erreur(409, 'opposition', 'Ce téléphone ou cet e-mail est celui d\'une personne qui a demandé l\'effacement de ses données : rien n\'a été changé.');
      if ('indisponible' in r) return erreur(503, 'opposition_indisponible', INDISPONIBLE);
      return erreur(r.refus.startsWith('Il faut') ? 400 : 409, r.refus.startsWith('Il faut') ? 'correction' : 'modifie', r.refus);
    }
    // Un nouveau numéro principal peut avoir des appels déjà relevés par Leedflow (contact du suivi seulement, AD-32).
    if (r.telephoneChange) await rattacherInconnus(envEspace).catch(() => {});
    return etat(id, { changes: r.changes, ignore: r.ignore });
  }
  if (geste === 'note') {
    const note = typeof d.note === 'string' ? d.note.trim() : '';
    if (!note) return erreur(400, 'note', 'Écrivez la note.');
    if (note.length > 2000) return erreur(400, 'note', 'Note : 2 000 caractères au plus.');
    return (await ajouterNote(env, id, note, compte)) ? etat(id) : erreur(404, 'contact', 'Contact inconnu');
  }
  if (geste === 'contact') {
    const c = lireContactNote(d.contact);
    if (typeof c === 'string') return erreur(400, 'contact', c);
    const r = await noterContact(env, id, c, compte);
    return r ? etat(id, { remplace: r.remplace }) : erreur(404, 'contact', 'Contact inconnu');
  }
  // Accord e-mail : écrit par `accord`, qui refuse ce que la loi ou la personne interdit (désinscrit, accord du site).
  const a = d.accord;
  if (a !== 'oui' && a !== 'retirer' && a !== 'refus') return erreur(400, 'accord', 'Accord : oui, retirer ou refus');
  const fait = a === 'refus' ? await noterRefus(env, id, compte) : await noterAccord(env, id, a === 'oui', compte);
  if (!fait) {
    if (!(await lireFiche(env, id))) return erreur(404, 'contact', 'Contact inconnu');
    return erreur(409, 'accord', a === 'oui' ? 'Impossible de noter cet accord : la personne s\'est désinscrite, ou n\'a pas d\'adresse e-mail.' : 'Cet accord a été donné sur le site : notez plutôt qu\'elle ne veut plus d\'e-mails.');
  }
  return etat(id);
};
