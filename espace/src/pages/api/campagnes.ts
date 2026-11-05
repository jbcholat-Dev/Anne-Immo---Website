// Modèles d'e-mail pour le tableau des contacts et les fiches (story 18.18). Réservé à Anne et JB (en-tête du compte posé
// par worker.ts après Cloudflare Access) ; le jeton de service de Claude n'y passe jamais (Claude ne lit pas les contacts,
// AD-26). Corps en JSON seulement, 100 000 caractères au plus. Rien n'est envoyé d'ici : la campagne créée est un brouillon
// que la page /campagnes fait relire, essayer et envoyer, et la règle d'accord (accord.ts) s'y applique comme partout.
//   GET  /api/campagnes?modeles=1                       → 200 { ok, modeles: [{ id, nom, objet, statut, verso }] }
//   GET  /api/campagnes?modele=…&contact=…              → 200 { ok, a, objet, texte, modele } (message à écrire à la main, formule remplie)
//   POST /api/campagnes { modele?, ids? | vue? }        → 201 { ok, id } (brouillon pour les contacts cochés ou la vue)
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { creerDepuisModele, ecritureAMain, listerModeles } from '../../server/campagnes';
import { COMPTE_CLAUDE, pourSite as env } from '../../server/env';
import { ULID } from '../../server/formulaires';

export const prerender = false;
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const erreur = (status: number, code: string, message: string) => json({ ok: false, error: { code, message } }, status);
const MAX_CORPS = 100_000;
const compteDe = (request: Request) => { const c = request.headers.get(ENTETE_COMPTE); return !c || c === COMPTE_CLAUDE ? null : c; };

export const GET: APIRoute = async ({ request, url }) => {
  if (!compteDe(request)) return erreur(403, 'acces', 'Accès refusé');
  if (url.searchParams.get('modeles')) return json({ ok: true, modeles: await listerModeles(env) });
  const modele = url.searchParams.get('modele') ?? '', contact = url.searchParams.get('contact') ?? '';
  if (!ULID.test(modele) || !ULID.test(contact)) return erreur(400, 'id', 'Identifiant invalide');
  const r = await ecritureAMain(env, modele, contact);
  return 'erreur' in r ? erreur(404, 'modele', r.erreur) : json({ ok: true, ...r });
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
  if (Object.keys(d).some((k) => !['modele', 'ids', 'vue'].includes(k))) return erreur(400, 'corps', 'Champ inconnu');
  if (d.modele !== undefined && (typeof d.modele !== 'string' || !ULID.test(d.modele))) return erreur(400, 'modele', 'Modèle invalide');
  if (d.vue !== undefined && (typeof d.vue !== 'string' || !ULID.test(d.vue))) return erreur(400, 'vue', 'Vue invalide');
  if (d.ids !== undefined && (!Array.isArray(d.ids) || !d.ids.every((x) => typeof x === 'string' && ULID.test(x)))) return erreur(400, 'ids', 'Liste de contacts invalide');
  const r = await creerDepuisModele(env, { modele: d.modele as string | undefined, ids: d.ids as string[] | undefined, vue: d.vue as string | undefined }, compte);
  return typeof r === 'string' ? json({ ok: true, id: r }, 201) : erreur(400, 'campagne', r.erreur);
};
