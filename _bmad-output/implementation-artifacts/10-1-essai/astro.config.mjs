// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// ESSAI story 10.1 : adaptateur Cloudflare 14, pages toujours prérendues, seules /api/* sont des routes serveur.
export default defineConfig({
  site: 'https://annevialtissot.fr',
  output: 'static',
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
  trailingSlash: 'never',
  build: { format: 'file' },
  i18n: { defaultLocale: 'fr', locales: ['fr', 'en'], routing: { prefixDefaultLocale: false } },
  vite: { server: { fs: { allow: ['..'] } } },
});
