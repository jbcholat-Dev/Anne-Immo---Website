// Ce que l'espace reçoit de Cloudflare (story 13.3). Liaisons et variables publiques : wrangler.jsonc (type `Env`
// généré par `wrangler types`). Secrets : posés dans Cloudflare, jamais dans le dépôt (AD-8, RUNBOOK § 4 sexies).
// Le code partagé avec le site (@site/server/…) attend un `EnvSite` : l'espace en fournit le sous-ensemble utile
// (base, Access, adresse du site, LIEN_SECRET), les autres réglages du site restent absents ici.
import { env as envCloudflare } from 'cloudflare:workers';
import type { EnvSite } from '@site/server/env';

export interface EnvEspace extends Env {
  /** Le même secret que celui du site : sert seulement à afficher le lien du rapport du diagnostic. Facultatif. */
  LIEN_SECRET?: string;
  /** Clé d'API Leedflow d'Anne (story 13.10), posée par JB en secret de ce Worker. Sans elle, la relève ne fait rien. */
  LEEDFLOW_API_KEY?: string;
  /** Adresse de l'API Leedflow, seulement pour l'essai de bout en bout (imitation locale). Absente : l'adresse réelle. */
  LEEDFLOW_URL?: string;
}

export const envEspace = envCloudflare as EnvEspace;
/** Vue de l'espace pour le code partagé du site. */
export const pourSite = envEspace as unknown as EnvSite;
