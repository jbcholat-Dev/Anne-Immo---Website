// Gate du diagnostic (CAP-5, AD-5) : POST /api/diagnostic, traité par src/server/capture.ts (story 10.4).
// Réponse : { ok: true, url } vers la page de résultats liée au jeton du lead.
import type { APIRoute } from 'astro';
import { traiterCapture } from '../../server/capture';

export const prerender = false;

export const POST: APIRoute = (context) => traiterCapture('diagnostic', context);
