// @ts-check
import { defineConfig } from 'astro/config';

// v1 : build statique, sans adaptateur (le noyau serveur Cloudflare arrive avec le backend — voir README, TODO(backend)).
export default defineConfig({
  site: 'https://annevialtissot.fr',
  output: 'static',
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
