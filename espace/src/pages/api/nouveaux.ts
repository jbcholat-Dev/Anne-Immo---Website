// Barre « Nouveaux » de la page Contacts (story 18.11, FR-27, AD-34) : lire les demandes à voir, faire un geste, l'annuler.
// Tout passe par `server/nouveaux`, qui appelle `carnet`, `pipeline` et `leedflow` pour leurs colonnes. Mêmes contrôles
// que /api/carnet et /api/fiche : réservé à Anne et JB (en-tête du compte posé par worker.ts après Cloudflare Access),
// jeton de service de Claude refusé (403) ; corps en JSON seulement, 20 000 caractères au plus (413).
//   GET  /api/nouveaux                                 → 200 { ok, total, cartes }
//   POST /api/nouveaux { id, geste: 'ranger' | 'vu' | 'ecarter' | 'ignorer' | 'rattacher' }
//   POST /api/nouveaux { id, geste: 'ajouter', saisie: { prenom?, nom?, email?, commune?, entreprise?, categorie_id, projet?, temperature?, note? } }
//        → 200 { ok, message, contact_id?, ligne? } ; 409 'traitee' (déjà traitée), 'existant' (avec existant), 'opposition', 'modifie'…
//   POST /api/nouveaux { annuler: id }                 → 200 { ok, message } ; 409 'tard' après le délai d'annulation, 'modifie'
// Réponses `{ ok, ... }` ou `{ ok: false, error: { code, message } }`.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { lireSaisie } from '../../server/carnet';
import { COMPTE_CLAUDE, envEspace, pourSite as env } from '../../server/env';
import { ULID } from '../../server/formulaires';
import { agir, annuler, GESTES, lireNouveaux, type Geste, type ResultatNouveaux } from '../../server/nouveaux';
import { lireTableau } from '../../server/tableau';
import { idsCategories } from '../../server/vues-base';

export const prerender = false;
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const erreur = (status: number, code: string, message: string, plus: Record<string, unknown> = {}) => json({ ok: false, error: { code, message }, ...plus }, status);
const MAX_CORPS = 20_000;
const compteDe = (request: Request) => { const c = request.headers.get(ENTETE_COMPTE); return !c || c === COMPTE_CLAUDE ? null : c; };

async function repondre(r: ResultatNouveaux) {
  if (!r.ok) return erreur(r.status, r.code, r.message, r.existant ? { existant: r.existant } : {});
  // La ligne du tableau du contact touché, pour que la page la mette à jour sans recharger.
  const ligne = r.contact_id ? (await lireTableau(env, r.contact_id))[0] ?? null : null;
  return json({ ok: true, message: r.message, ...(r.contact_id ? { contact_id: r.contact_id, ligne } : {}), ...(r.supprime ? { supprime: r.supprime } : {}) });
}

export const GET: APIRoute = async ({ request }) => {
  if (!compteDe(request)) return erreur(403, 'acces', 'Accès refusé');
  return json({ ok: true, ...(await lireNouveaux(envEspace)) });
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

  if (d.annuler !== undefined) {
    if (typeof d.annuler !== 'string' || !ULID.test(d.annuler) || Object.keys(d).length !== 1) return erreur(400, 'id', 'Identifiant invalide');
    return repondre(await annuler(envEspace, d.annuler, compte));
  }
  if (typeof d.id !== 'string' || !ULID.test(d.id)) return erreur(400, 'id', 'Identifiant invalide');
  if (typeof d.geste !== 'string' || !(GESTES as readonly string[]).includes(d.geste)) return erreur(400, 'geste', 'Geste inconnu');
  const geste = d.geste as Geste;
  const permis = geste === 'ajouter' ? ['id', 'geste', 'saisie'] : ['id', 'geste'];
  if (Object.keys(d).some((k) => !permis.includes(k))) return erreur(400, 'corps', 'Champ inconnu');
  if (geste !== 'ajouter') return repondre(await agir(envEspace, d.id, geste, compte));
  // « Ajouter aux contacts » : la saisie de la fenêtre de création, sans téléphone (celui de la carte) ni accord e-mail
  // (un appel ne vaut pas accord : il se note ensuite sur la fiche).
  const brut = d.saisie;
  if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return erreur(400, 'saisie', 'Saisie du contact attendue');
  if ('telephone' in brut || 'accord' in brut) return erreur(400, 'saisie', 'Le numéro est celui de la carte, et l\'accord e-mail se note sur la fiche.');
  // Le nom peut manquer : le numéro de la carte suffit (FR-26 : un nom ou un téléphone).
  const s = lireSaisie({ ...brut, telephone: '+33600000000' }, await idsCategories(env));
  if (typeof s === 'string') return erreur(400, 'saisie', s);
  return repondre(await agir(envEspace, d.id, 'ajouter', compte, s));
};
