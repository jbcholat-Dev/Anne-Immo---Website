// Tableau du boîtage (story 18.19, ticket n° 249), pour l'onglet « Boîtage » de /actions. Toute écriture passe par
// `server/boitage`. Mêmes contrôles que /api/categories : réservé à Anne et JB (en-tête du compte posé par worker.ts après
// Cloudflare Access), jeton de service de Claude refusé (403) ; corps en JSON seulement, 20 000 caractères au plus (413).
// Chaque réponse réussie renvoie la liste à jour (`lignes`, du plus récent au plus ancien).
//   GET  /api/boitage                                → 200 { ok, lignes }
//   POST /api/boitage { ajouter: { fait_le, ville, quartier?, type_bien?, flyers?, message?, r1?, r2?, commentaire? } }
//        → 201 { ok, id, ligne, lignes } ; 400 date absente ou future, ville absente, valeur hors vocabulaire, champ inconnu
//   POST /api/boitage { id, corriger: { …les champs à changer… } }
//        → 200 { ok, ligne, lignes } ; 404 passage inconnu ; 400 sinon (une relance avant le passage ou R2 avant R1 : 400 'ordre')
// type_bien ∈ { maison, appartement } ; flyers : entier de 0 à 999 999 ; r1 et r2 : dates AAAA-MM-JJ ; un champ facultatif vide
// ('' ou null) l'efface. `secteur` (obligatoire en base) est tenu à jour : « ville · quartier » ou la ville seule.
// Réponses `{ ok, ... }` ou `{ ok: false, error: { code, message } }`.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { ajouterBoitage, corrigerBoitage, incoherence, listerBoitage, lireBoitage, verifierBoitage, type ChampsBoitage } from '../../server/boitage';
import { COMPTE_CLAUDE, pourSite as env } from '../../server/env';
import { ULID } from '../../server/formulaires';

export const prerender = false;
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const erreur = (status: number, code: string, message: string) => json({ ok: false, error: { code, message } }, status);
const MAX_CORPS = 20_000;
const autorise = (request: Request) => { const c = request.headers.get(ENTETE_COMPTE); return !!c && c !== COMPTE_CLAUDE; };
const objet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export const GET: APIRoute = async ({ request }) => {
  if (!autorise(request)) return erreur(403, 'acces', 'Accès refusé');
  return json({ ok: true, lignes: await listerBoitage(env) });
};

export const POST: APIRoute = async ({ request }) => {
  if (!autorise(request)) return erreur(403, 'acces', 'Accès refusé');
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return erreur(400, 'corps', 'Corps JSON attendu');
  if (Number(request.headers.get('content-length') ?? 0) > MAX_CORPS) return erreur(413, 'taille', 'Demande trop grande');
  const texte = await request.text();
  if (texte.length > MAX_CORPS) return erreur(413, 'taille', 'Demande trop grande');
  let d: Record<string, unknown>;
  try {
    const brut = JSON.parse(texte) as unknown;
    if (!objet(brut)) return erreur(400, 'corps', 'Corps JSON attendu');
    d = brut;
  } catch { return erreur(400, 'corps', 'Corps JSON attendu'); }

  if (d.ajouter !== undefined) {
    if (Object.keys(d).length !== 1 || !objet(d.ajouter)) return erreur(400, 'corps', 'Un seul geste à la fois : ajouter ou corriger');
    const c = verifierBoitage(d.ajouter, true);
    if (typeof c === 'string') return erreur(400, 'champ', c);
    const complet: ChampsBoitage = { quartier: null, type_bien: null, flyers: null, message: null, r1: null, r2: null, commentaire: null, ...c } as ChampsBoitage;
    const ordre = incoherence(complet);
    if (ordre) return erreur(400, 'ordre', ordre);
    const id = await ajouterBoitage(env, complet);
    return json({ ok: true, id, ligne: await lireBoitage(env, id), lignes: await listerBoitage(env) }, 201);
  }

  if (typeof d.id !== 'string' || !ULID.test(d.id)) return erreur(400, 'id', 'Identifiant invalide');
  if (Object.keys(d).length !== 2 || !objet(d.corriger)) return erreur(400, 'corps', 'Un seul geste à la fois : ajouter ou corriger');
  const c = verifierBoitage(d.corriger, false);
  if (typeof c === 'string') return erreur(400, 'champ', c);
  if (Object.keys(c).length === 0) return erreur(400, 'champ', 'Rien à corriger.');
  const r = await corrigerBoitage(env, d.id, c);
  if (r === null) return erreur(404, 'passage', 'Passage inconnu');
  if (typeof r === 'string') return erreur(400, 'ordre', r);
  return json({ ok: true, ligne: r, lignes: await listerBoitage(env) });
};
