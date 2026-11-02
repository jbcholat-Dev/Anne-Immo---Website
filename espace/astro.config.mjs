// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Espace de travail d'Anne (story 13.3, AD-19) : une application à part, servie par son propre Worker Cloudflare
// et réservée à Anne et à JB (Cloudflare Access, vérifié dans worker.ts). Toutes les pages sont rendues à la demande
// (output: 'server'), puisqu'elles lisent la base des leads.
// Tant que la gestion des demandes n'a pas quitté le site (phase 2 de la story 13.3), l'espace réutilise le code serveur
// du site par l'alias `@site` (site/src) : une seule version de chaque requête, rien n'est recopié.
export default defineConfig({
  site: 'https://espace.annevialtissot.fr',
  output: 'server',
  adapter: cloudflare({ imageService: 'passthrough' }),
  session: false,
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: {
    resolve: { alias: { '@site': fileURLToPath(new URL('../site/src', import.meta.url)) } },
    // le code partagé vit dans site/ et la charte dans design-system/, hors du dossier espace/
    server: { fs: { allow: ['..'] } },
  },
});
