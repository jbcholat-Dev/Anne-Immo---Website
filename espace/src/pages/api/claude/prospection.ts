// Story 20.8 (demande de JB du 2026-11-24) : le chief of staff (Claude, par son badge) écrit dans « Ma semaine » ce qui a
// été décidé au brief avec JB, sans ressaisie à la main. worker.ts n'ouvre /api/claude/… qu'au badge de Claude.
// Des nombres de pilotage seulement : jamais un contact, ni un nom, ni le champ libre « lieu ou précision ».
// Chaque écriture est signée « chief of staff » et datée ; Anne la voit sur la page et peut la retirer ou la changer.
//   GET  /api/claude/prospection?s=AAAA-MM-JJ → { lundi, dimanche, objectifs: { clé: { valeur, par, maj_le, avant? } }, notes: [...] }
//        (notes de la semaine : id, genre, canal, jour, quoi, quantité, par ; sans lieu ni précision)
//   POST /api/claude/prospection, corps JSON, un geste par appel :
//     { "quoi": "objectifs", "objectifs": { "rdv": 3, "effort:cartes": 12, … } }  → seulement les clés données ; la valeur
//        d'avant est gardée et montrée sur la page (« avant : 10 »)
//     { "quoi": "effort" | "lead" | "rdv", "canal", "jour", "quantite", "ville" (boîtage), "type_lead" (lead) }  → une ligne
//        de plus, mêmes règles que la page ; rien n'est écrasé
//     { "quoi": "retirer", "genre": "effort" | "resultat", "id" }  → seulement une ligne notée par le chief of staff
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { COMPTE_CLAUDE, pourSite as env } from '../../../server/env';
import { ULID } from '../../../server/formulaires';
import {
  CLES_OBJECTIF, enregistrerObjectifs, enregistrerSaisie, lireObjectifsJson, lireReglages, lireSaisieJson, lireSemaine, objectifsDepart,
  PAR_CHIEF, retirerSaisieDe, semaineDemandee,
} from '../../../server/prospection';

export const prerender = false;
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const pourClaude = (request: Request) => request.headers.get(ENTETE_COMPTE) === COMPTE_CLAUDE;
/** Le compte d'Anne ou de JB n'est pas renvoyé : seulement « chief of staff », « départ » ou « espace ». */
const signe = (par: string | null) => (par === PAR_CHIEF || par === 'départ' ? par : par ? 'espace' : null);

export const GET: APIRoute = async ({ request, url }) => {
  if (!pourClaude(request)) return json({ erreur: 'Accès refusé' }, 403);
  const lundi = semaineDemandee(url.searchParams.get('s'));
  const [sem, reglages] = await Promise.all([lireSemaine(env, lundi), lireReglages(env)]);
  const depart = objectifsDepart();
  const objectifs = Object.fromEntries(CLES_OBJECTIF.map((cle) => {
    const r = reglages.get(cle), a = reglages.get(`avant:${cle}`);
    return [cle, { valeur: r?.valeur ?? depart[cle], par: r ? signe(r.par) : 'départ', maj_le: r?.maj_le ?? null, ...(a ? { avant: a.valeur } : {}) }];
  }));
  return json({
    lundi: sem.lundi, dimanche: sem.dimanche, objectifs,
    notes: sem.notes.map((n) => ({ id: n.id, genre: n.genre, canal: n.canal, jour: n.jour, quoi: n.quoi, quantite: n.quantite, par: signe(n.par) })),
  });
};

export const POST: APIRoute = async ({ request }) => {
  if (!pourClaude(request)) return json({ erreur: 'Accès refusé' }, 403);
  if (Number(request.headers.get('content-length') ?? 0) > 4000) return json({ erreur: 'Corps trop grand' }, 413);
  const texte = await request.text();
  if (texte.length > 4000) return json({ erreur: 'Corps trop grand' }, 413);
  let d: Record<string, unknown>;
  try { d = JSON.parse(texte) as Record<string, unknown>; } catch { return json({ erreur: 'Corps JSON attendu' }, 400); }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return json({ erreur: 'Corps JSON attendu' }, 400);
  if (d.quoi === 'objectifs') {
    const o = lireObjectifsJson(d.objectifs);
    if (typeof o === 'string') return json({ erreur: o }, 400);
    return json({ changes: await enregistrerObjectifs(env, o, PAR_CHIEF) });
  }
  if (d.quoi === 'retirer') {
    if ((d.genre !== 'effort' && d.genre !== 'resultat') || typeof d.id !== 'string' || !ULID.test(d.id)) return json({ erreur: 'genre (effort ou resultat) et id attendus' }, 400);
    return (await retirerSaisieDe(env, d.genre, d.id, PAR_CHIEF)) ? json({ retire: d.id }) : json({ erreur: 'Ligne absente, ou notée par Anne : seule Anne la retire.' }, 404);
  }
  // Le champ libre « lieu ou précision » est fermé au chief of staff (il pourrait recevoir un nom) ; la ville du boîtage
  // n'accepte qu'un nom de commune (revue de code 20.8).
  if ('note' in d) return json({ erreur: 'Le champ note n\'est pas ouvert au chief of staff.' }, 400);
  const s = lireSaisieJson(d);
  if (typeof s === 'string') return json({ erreur: s }, 400);
  return json({ id: await enregistrerSaisie(env, s, PAR_CHIEF), quoi: s.quoi, canal: s.canal, jour: s.jour, quantite: s.quantite }, 201);
};
