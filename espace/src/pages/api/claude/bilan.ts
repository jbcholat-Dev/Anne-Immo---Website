// Accès de Claude au bilan (story 13.17) : les totaux par canal sur une période, avec ce que chaque canal a coûté.
// Story 10.12 : avec l'entonnoir du diagnostic par campagne. Aucun nom, téléphone ni e-mail : seulement des nombres. GET /api/claude/bilan?p=semaine|mois|trimestre
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { coutsParCanal } from '../../../server/actions';
import { COMPTE_CLAUDE, pourSite as env } from '../../../server/env';
import { entonnoir, question1, TOUTES } from '../../../server/entonnoir';
import { bilan, PERIODES, type Periode } from '../../../server/pipeline';

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  if (request.headers.get(ENTETE_COMPTE) !== COMPTE_CLAUDE) return new Response(JSON.stringify({ erreur: 'Accès refusé' }), { status: 403 });
  const demandee = url.searchParams.get('p') ?? 'mois';
  const periode: Periode = demandee in PERIODES ? (demandee as Periode) : 'mois';
  const b = await bilan(env, periode);
  const couts = await coutsParCanal(env, b.debut);
  const diag = await entonnoir(env, b.debut);
  return new Response(JSON.stringify({
    periode, depuis: b.debut, total: { ...b.total, cout_centimes: [...couts.values()].reduce((t, c) => t + c, 0) },
    canaux: b.lignes.map((l) => ({ ...l, cout_centimes: couts.get(l.canal) ?? 0 })),
    delai_rappel_heures: b.delaiHeures, perdus: b.perdus,
    diagnostic: {
      total: diag.total, campagnes: diag.campagnes,
      // Story 10.13 : question 1 → question 2 par navigateur, appareil et temps d'affichage, toutes campagnes puis chacune.
      question1: { toutes: await question1(env, b.debut, TOUTES), ...Object.fromEntries(await Promise.all(diag.campagnes.map(async (c) => [c.libelle, await question1(env, b.debut, c.cle)]))) },
    },
  }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
