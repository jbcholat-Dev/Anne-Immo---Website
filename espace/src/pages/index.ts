// Accueil de l'espace d'Anne (story 13.3) : pour l'instant, la liste des demandes. La page « Aujourd'hui » (story 13.5) la remplacera.
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ redirect }) => redirect('/gestion', 302);
