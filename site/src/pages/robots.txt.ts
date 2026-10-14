import type { APIRoute } from 'astro';

// robots.txt (story 9.2) : le petit fichier qui dit aux moteurs de recherche ce qu'ils peuvent indexer.
// Aperçu (PUBLIC_INDEXATION absent ou ≠ « oui ») : tout est interdit. Production : tout est permis.
// En production, il annonce aussi le plan du site (sitemap.xml, story 11.3), que la construction écrit à côté.
export const GET: APIRoute = () => {
  const indexable = import.meta.env.PUBLIC_INDEXATION === 'oui';
  const corps = indexable
    ? `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', import.meta.env.SITE).href}\n`
    : `User-agent: *\nDisallow: /\n`;
  return new Response(corps, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
