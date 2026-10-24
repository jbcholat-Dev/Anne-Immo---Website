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
  /** Identifiant client du jeton de service Cloudflare Access de Claude (story 13.17), posé par JB en secret de ce Worker.
   * Absent : l'accès /api/claude/… est fermé. */
  ACCESS_CLAUDE_ID?: string;
  /** Clé GitHub limitée au dépôt, droit « Issues » seulement (bouton « Un retour ? », story 13.20), posée par JB en secret
   * de ce Worker. Absente : le bouton répond que l'envoi n'est pas branché. */
  GITHUB_TOKEN?: string;
  /** Adresse de l'API GitHub, seulement pour l'essai de bout en bout (imitation locale). */
  GITHUB_API?: string;
  /** Clé d'API Resend des campagnes (story 13.27, AD-21), la même que celle du site ou une clé dédiée, posée par JB en secret
   * de ce Worker. Absente : aucune campagne ne part, l'essai répond que l'envoi n'est pas branché. */
  RESEND_API_KEY?: string;
  /** Boîte qui reçoit les campagnes hors production et les envois aux contacts de test (AD-12), comme pour le site. */
  BOITE_TEST?: string;
  /** Essais en local seulement : adresse de l'imitation de Resend (site/README.md). */
  URL_SERVICES_ESSAI?: string;
  /** Réglages facultatifs de l'envoi étalé (story 13.27) : e-mails par passage (défaut 8, toutes les 10 minutes) et plafond
   * du jour, site compris (défaut 90, sous les 100 de l'offre gratuite de Resend). */
  CAMPAGNE_PAR_PASSAGE?: string;
  CAMPAGNE_QUOTA_JOUR?: string;
}

/** Le « compte » transmis aux pages pour une requête du programme de Claude (jamais une adresse e-mail). */
export const COMPTE_CLAUDE = 'claude';

export const envEspace = envCloudflare as EnvEspace;
/** Vue de l'espace pour le code partagé du site. */
export const pourSite = envEspace as unknown as EnvSite;
