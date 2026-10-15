// Fichiers communs avec le site (story 13.3, AD-19) : polices, icônes et curseur de la charte, copiés depuis site/public/
// avant chaque construction. Une seule source, celle du site : un changement de charte vaut pour les deux applications.
// Les copies sont ignorées par Git (espace/.gitignore).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.resolve(ICI, '../site/public');
const PUBLIC = path.join(ICI, 'public');
const FICHIERS = ['fonts', 'favicon.ico', 'favicon.svg', 'favicon-96.png', 'favicon-192.png', 'apple-touch-icon.png', 'curseur.svg'];

fs.mkdirSync(PUBLIC, { recursive: true });
for (const f of FICHIERS) fs.cpSync(path.join(SITE, f), path.join(PUBLIC, f), { recursive: true });
console.log(`partage : ${FICHIERS.length} éléments copiés depuis site/public.`);

// Le code partagé (site/src, importé par l'alias @site) est compilé par l'espace, mais ses dépendances (astro et la configuration
// TypeScript dont hérite site/tsconfig.json) se cherchent à côté de lui, dans site/node_modules. Chez Cloudflare, la construction
// de l'espace n'installe que espace/node_modules : on y fait pointer site/node_modules par un lien, seulement s'il n'existe pas
// (sur un poste où le site est installé, rien ne change).
const MODULES_SITE = path.resolve(ICI, '../site/node_modules');
if (!fs.existsSync(MODULES_SITE)) {
  fs.symlinkSync(path.join(ICI, 'node_modules'), MODULES_SITE, 'dir');
  console.log('partage : site/node_modules absent, lien vers espace/node_modules créé.');
}
