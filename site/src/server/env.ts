// Ce que le serveur reçoit de Cloudflare (stories 10.2 et 10.3).
// Les liaisons et variables publiques viennent de wrangler.jsonc (type `Env` généré par `wrangler types`) ;
// les secrets sont posés dans Cloudflare (Settings → Variables and Secrets), jamais dans le dépôt (AD-8, RUNBOOK § 4 quater).
import { env as envCloudflare } from 'cloudflare:workers';

export interface EnvSite extends Env {
  /** Clé GitHub limitée à ce dépôt (bouton « Un retour ? » de l'aperçu, story 9.6). */
  GITHUB_TOKEN?: string;
  /** Le même texte que le champ « Secret » du webhook Cal.com (route /api/webhook-cal, story 10.6). */
  CAL_WEBHOOK_SECRET?: string;
  /** Clé d'API Resend, droit d'envoi seulement, domaine annevialtissot.fr (story 10.3). */
  RESEND_API_KEY?: string;
  /** Clé secrète du widget Turnstile `site-anne` (story 10.3). */
  TURNSTILE_SECRET_KEY?: string;
  /** Secret qui signe les liens envoyés par e-mail : guide (7 jours) et désabonnement de la séquence (story 10.5). */
  LIEN_SECRET?: string;
  /** Boîte qui reçoit tous les e-mails tant que le site n'est pas lancé, et ceux des leads de test (AD-12). */
  BOITE_TEST?: string;
  /** Essais en local seulement (fichier de réglages de `wrangler dev`, jamais dans Cloudflare) : adresse d'une
   * imitation de Turnstile et de Resend, car le serveur local ne peut pas joindre ces services (site/README.md). */
  URL_SERVICES_ESSAI?: string;
}

export const envSite = envCloudflare as EnvSite;

/** Production seulement si wrangler.jsonc le dit (story 12.4) ; tout le reste est un aperçu. */
export const enProduction = (e: EnvSite) => (e.ENVIRONNEMENT as string) === 'production';
