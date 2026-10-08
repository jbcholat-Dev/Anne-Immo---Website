// Demande du guide (CAP-8) : POST /api/guide, traité par src/server/capture.ts (story 10.3).
import type { APIRoute } from 'astro';
import { traiterCapture } from '../../server/capture';

export const prerender = false;

export const POST: APIRoute = (context) => traiterCapture('guide', context);
