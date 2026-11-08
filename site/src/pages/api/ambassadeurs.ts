// Inscription au programme ambassadeurs (epic 17) : POST /api/ambassadeurs, traité par src/server/capture.ts (story 17.2).
import type { APIRoute } from 'astro';
import { traiterCapture } from '../../server/capture';

export const prerender = false;

export const POST: APIRoute = (context) => traiterCapture('ambassadeur', context);
