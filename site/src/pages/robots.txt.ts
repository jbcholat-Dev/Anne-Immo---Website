import type { APIRoute } from 'astro';

// robots.txt (story 9.2) : le petit fichier qui dit aux moteurs de recherche ce qu'ils peuvent indexer.
// Aperçu (PUBLIC_INDEXATION absent ou ≠ « oui ») : tout est interdit. Production : tout est permis.
// Le plan du site (sitemap) sera annoncé ici par la story 11.3, quand il existera.
export const GET: APIRoute = () => {
  const indexable = import.meta.env.PUBLIC_INDEXATION === 'oui';
  const corps = indexable
    ? `User-agent: *\nAllow: /\n`
    : `User-agent: *\nDisallow: /\n`;
  return new Response(corps, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
