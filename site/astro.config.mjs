// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import planDuSite from './integrations/plan-du-site.mjs';

// Noyau serveur (story 10.2) : l'adaptateur Cloudflare construit le Worker. Les pages restent toutes prérendues
// (output: 'static') ; seules les routes /api/* passent par le serveur (worker.ts).
// imageService 'passthrough' : le site prépare ses images lui-même (scripts/images.mjs), pas de liaison IMAGES.
// session: false : pas de sessions Astro, donc pas de stockage KV créé automatiquement.
export default defineConfig({
  site: 'https://annevialtissot.fr',
  output: 'static',
  adapter: cloudflare({ imageService: 'passthrough', prerenderEnvironment: 'node' }),
  session: false,
  // Plan du site (story 11.3) : sitemap.xml écrit après la construction, depuis les pages indexables.
  integrations: [planDuSite()],
  trailingSlash: 'never',
  build: { format: 'file' },
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  vite: {
    // les collections lisent contenu-anne/ (hors du dossier site/)
    server: { fs: { allow: ['..'] } },
  },
});
