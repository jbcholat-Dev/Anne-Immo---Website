// Catégories et méthodes (story 18.8, FR-12, FR-13, AD-25). Toute écriture passe par `server/categories` (seul écrivain
// des tables `categorie` et `message_type`). Mêmes contrôles que /api/fiche : réservé à Anne et JB (en-tête du compte posé
// par worker.ts après Cloudflare Access), jeton de service de Claude refusé (403) ; corps en JSON seulement, 40 000
// caractères au plus (413). Chaque réponse réussie renvoie la liste à jour des catégories.
//   GET  /api/categories                                       → 200 { ok, categories }
//   POST /api/categories { ajouter: { nom } }                  → 201 { ok, id, categories } ; 409 'existe' ; 409 'plein'
//   POST /api/categories { id, renommer: "nom" }               → 200 ; 404 ; 409 'existe'
//   POST /api/categories { id, methode: { canal_conseille, demande, appel_permis, envoi_groupe, messages: [{ id?, nom, texte }] } }
//        → 200 ; 404 ; envoi_groupe ∈ { non, accord_ou_client } (FR-13 : jamais au-delà des contacts avec accord ou anciens clients)
//   POST /api/categories { ordre: [id, …] }                    → 200 (chaque catégorie citée une fois) ; 409 + liste à jour sinon
//   POST /api/categories { id, retirer: true, ranger_dans?: id } → 200 ; 409 'pas_vide' { contacts } ; 409 'gardee' (demandes_recues) ; 404 ;
//        400 si ranger_dans est la catégorie elle-même ou une catégorie inconnue. Avec ranger_dans (story 18.15), les contacts de la
//        catégorie, écartés compris, y sont rangés d'abord (`classer`, avant-image AD-29) ; sans, la catégorie doit être vide.
// 400 pour toute valeur hors vocabulaire. Réponses `{ ok, ... }` ou `{ ok: false, error: { code, message } }`.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { nomCategorie, lireMethode, MAX_CATEGORIES } from '../../server/categories-regles';
import { ajouterCategorie, enregistrerMethode, listerCategories, rangerCategories, renommerCategorie, retirerCategorie } from '../../server/categories';
import { COMPTE_CLAUDE, pourSite as env } from '../../server/env';

export const prerender = false;
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const erreur = (status: number, code: string, message: string, plus: Record<string, unknown> = {}) => json({ ok: false, error: { code, message }, ...plus }, status);
const MAX_CORPS = 40_000;
const ID_CATEGORIE = /^(?:[a-z_]{1,40}|[0-9A-HJKMNP-TV-Z]{26})$/;
const autorise = (request: Request) => { const c = request.headers.get(ENTETE_COMPTE); return !!c && c !== COMPTE_CLAUDE; };
const liste = async (plus: Record<string, unknown> = {}, status = 200) => json({ ok: true, ...plus, categories: await listerCategories(env) }, status);

export const GET: APIRoute = async ({ request }) => {
  if (!autorise(request)) return erreur(403, 'acces', 'Accès refusé');
  return liste();
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
    if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return erreur(400, 'corps', 'Corps JSON attendu');
    d = brut as Record<string, unknown>;
  } catch { return erreur(400, 'corps', 'Corps JSON attendu'); }

  if (d.ajouter !== undefined) {
    if (Object.keys(d).length !== 1 || !d.ajouter || typeof d.ajouter !== 'object' || Array.isArray(d.ajouter)
      || Object.keys(d.ajouter).some((k) => k !== 'nom')) return erreur(400, 'corps', 'Champ inconnu');
    const nom = nomCategorie((d.ajouter as Record<string, unknown>).nom);
    if (!nom) return erreur(400, 'nom', 'Donnez à la catégorie un nom de 1 à 40 caractères.');
    const r = await ajouterCategorie(env, nom);
    if (r === 'existe') return erreur(409, 'existe', `Une catégorie s'appelle déjà « ${nom} ».`);
    if (r === 'plein') return erreur(409, 'plein', `Au plus ${MAX_CATEGORIES} catégories : retirez-en une vide d'abord.`);
    return liste({ id: r }, 201);
  }

  if (d.ordre !== undefined) {
    if (Object.keys(d).length !== 1 || !Array.isArray(d.ordre) || !d.ordre.every((x) => typeof x === 'string' && ID_CATEGORIE.test(x))) return erreur(400, 'ordre', 'Ordre : la liste des identifiants est attendue.');
    // Revue de code 18.8 : un ordre refusé (catégorie ajoutée ou retirée ailleurs) renvoie la liste à jour, que la page redessine.
    return (await rangerCategories(env, d.ordre as string[])) === 'ok' ? liste()
      : erreur(409, 'ordre', 'La liste des catégories a changé ailleurs : elle est rechargée, recommencez.', { categories: await listerCategories(env) });
  }

  if (typeof d.id !== 'string' || !ID_CATEGORIE.test(d.id)) return erreur(400, 'id', 'Identifiant invalide');
  const id = d.id;
  const gestes = ['renommer', 'methode', 'retirer'].filter((k) => d[k] !== undefined);
  // Un seul geste ; `ranger_dans` n'accompagne que `retirer` (story 18.15).
  const avecRange = d.ranger_dans !== undefined;
  if (gestes.length !== 1 || Object.keys(d).length !== 2 + (avecRange ? 1 : 0) || (avecRange && gestes[0] !== 'retirer')) return erreur(400, 'corps', 'Un seul geste à la fois : renommer, methode ou retirer');

  if (gestes[0] === 'renommer') {
    const nom = nomCategorie(d.renommer);
    if (!nom) return erreur(400, 'nom', 'Donnez à la catégorie un nom de 1 à 40 caractères.');
    const r = await renommerCategorie(env, id, nom);
    if (r === 'inconnue') return erreur(404, 'categorie', 'Catégorie inconnue');
    if (r === 'existe') return erreur(409, 'existe', `Une autre catégorie s'appelle déjà « ${nom} ».`);
    return liste();
  }
  if (gestes[0] === 'methode') {
    const m = lireMethode(d.methode);
    if (typeof m === 'string') return erreur(400, 'methode', m);
    const r = await enregistrerMethode(env, id, m);
    if (r === 'inconnue') return erreur(404, 'categorie', 'Catégorie inconnue');
    if (r === 'message') return erreur(400, 'methode', 'Un message type cité n\'appartient pas à cette catégorie.');
    return liste();
  }
  if (d.retirer !== true) return erreur(400, 'retirer', 'retirer : true attendu');
  if (avecRange && (typeof d.ranger_dans !== 'string' || !ID_CATEGORIE.test(d.ranger_dans) || d.ranger_dans === id)) return erreur(400, 'ranger_dans', 'Choisissez une autre catégorie où ranger les contacts.');
  const r = await retirerCategorie(env, id, avecRange ? d.ranger_dans as string : undefined, request.headers.get(ENTETE_COMPTE)!);
  if (r === 'gardee') return erreur(409, 'gardee', 'Cette catégorie se renomme, mais ne se retire pas : le site et les portails y rangent les nouvelles demandes.');
  if (r === 'inconnue') return erreur(404, 'categorie', 'Catégorie inconnue');
  if (r === 'destination') return erreur(404, 'ranger_dans', 'La catégorie où ranger les contacts n\'existe pas.');
  // Revue de code 18.15 : la liste à jour accompagne le refus, pour que la page montre le choix de destination (elle a pu
  // croire la catégorie vide) ; avec `ranger_dans`, des contacts y ont été rangés pendant le retrait.
  if (r === 'ok') return liste();
  const s = r.contacts > 1 ? 's' : '';
  return erreur(409, 'pas_vide', avecRange
    ? `${r.contacts} contact${s} ${r.contacts > 1 ? 'sont' : 'est'} encore dans cette catégorie (changé${s} pendant le retrait) : elle est gardée. La liste est rechargée, recommencez.`
    : `Cette catégorie contient ${r.contacts} contact${s} (écartés compris) : choisissez où les ranger pour la retirer.`, { contacts: r.contacts, categories: await listerCategories(env) });
};
