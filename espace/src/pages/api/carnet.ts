// Classement des contacts depuis la page Contacts (story 18.6, FR-4, FR-5, AD-29) : en lot (cases cochées) ou pour une
// seule ligne, puis annulation. Toute écriture passe par `server/carnet` (seul écrivain du classement, AD-22). Réservé à
// Anne et JB (en-tête du compte posé par worker.ts après le contrôle Cloudflare Access) ; le jeton de service de Claude
// est refusé (403). Corps en JSON seulement (un formulaire d'un autre site ne peut pas l'envoyer sans l'accord du
// navigateur), 200 000 caractères au plus. Réponses `{ ok, ... }` ou `{ ok: false, error: { code, message } }`.
//   POST /api/carnet { ids: [...], changements: { categorie_id?, projet?, temperature?, verifie?, ecarte?, canal?, partant? } }
//        → 200 { ok, lot, touches, ignores, inchanges, inconnus, lignes }   (lot null si rien n'a changé)
//   POST /api/carnet { annuler: "<lot>" } → 200 { ok, lot, rendus, gardes, lignes } ; 404 pour un lot inconnu
// 400 pour toute valeur hors vocabulaire (catégorie absente de la table, projet ou température inconnus, « avec Anne »
// et « terminé » réservés au suivi des ventes), plus de 2 000 identifiants ou un identifiant mal formé.
// Story 18.21 : `canal` = la source (pige, boitage, portail, recommandation, evenement, autre, ou null pour l'effacer ; 400 pour toute
// autre valeur) ; `partant` = ambassadeur « partant » (true : noté aujourd'hui, false : retiré). Chaque changement a son événement avec avant-image.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { annulerLot, classer, lireChangements, lireIds } from '../../server/carnet';
import { COMPTE_CLAUDE, pourSite as env } from '../../server/env';
import { ULID } from '../../server/formulaires';
import { idsCategories } from '../../server/vues-base';

export const prerender = false;
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const erreur = (status: number, code: string, message: string) => json({ ok: false, error: { code, message } }, status);
const MAX_CORPS = 200_000;

export const POST: APIRoute = async ({ request }) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  if (!compte || compte === COMPTE_CLAUDE) return erreur(403, 'acces', 'Accès refusé');
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
    if (typeof d.annuler !== 'string' || !ULID.test(d.annuler) || Object.keys(d).length !== 1) return erreur(400, 'lot', 'Lot invalide');
    const r = await annulerLot(env, d.annuler, compte);
    return r ? json({ ok: true, ...r }) : erreur(404, 'lot', 'Lot inconnu');
  }
  const ids = lireIds(d.ids);
  if (typeof ids === 'string') return erreur(400, 'ids', ids);
  const ch = lireChangements(d.changements, await idsCategories(env));
  if (typeof ch === 'string') return erreur(400, 'changements', ch);
  if (Object.keys(d).some((k) => k !== 'ids' && k !== 'changements')) return erreur(400, 'corps', 'Champ inconnu');
  return json({ ok: true, ...(await classer(env, ids, ch, compte)) });
};
