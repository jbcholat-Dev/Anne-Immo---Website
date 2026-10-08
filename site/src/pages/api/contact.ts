// Formulaire « Écrire à Anne » (CAP-6) : POST /api/contact, traité par src/server/capture.ts (story 10.3).
import type { APIRoute } from 'astro';
import { traiterCapture } from '../../server/capture';

export const prerender = false;

export const POST: APIRoute = (context) => traiterCapture('contact', context);
