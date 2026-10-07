// Les trois barrières anti-robot passées avant toute écriture (AD-7), dans l'ordre de la story 10.3 :
// 1. le jeton Turnstile (preuve obtenue sans case à cocher, mode invisible) validé auprès de Cloudflare ;
// 2. le champ piège `site_web`, caché aux humains : rempli = robot ;
// 3. la limite de fréquence par adresse IP (liaison LIMITE_FORMULAIRES de wrangler.jsonc : 5 envois par minute).
// L'adresse IP sert seulement de clé de comptage ; elle n'est ni écrite en base ni journalisée.
import type { EnvSite } from './env';

export type Barriere = { ok: true } | { ok: false; code: 'ANTI_ROBOT' | 'ANTI_ROBOT_INDISPONIBLE' | 'TROP_DE_DEMANDES'; detail: string };

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function turnstile(env: EnvSite, jeton: unknown, ip: string | null): Promise<Barriere> {
  if (!env.TURNSTILE_SECRET_KEY) return { ok: false, code: 'ANTI_ROBOT_INDISPONIBLE', detail: 'TURNSTILE_SECRET_KEY absente' };
  if (typeof jeton !== 'string' || !jeton || jeton.length > 2048) return { ok: false, code: 'ANTI_ROBOT', detail: 'jeton absent' };
  const corps = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: jeton, ...(ip ? { remoteip: ip } : {}) });
  try {
    const reponse = await fetch(env.URL_SERVICES_ESSAI ? `${env.URL_SERVICES_ESSAI}/turnstile` : SITEVERIFY, { method: 'POST', body: corps, signal: AbortSignal.timeout(8000) });
    const r = (await reponse.json()) as { success?: boolean; 'error-codes'?: string[] };
    return r.success ? { ok: true } : { ok: false, code: 'ANTI_ROBOT', detail: (r['error-codes'] ?? []).join(',') || 'refus' };
  } catch (e) {
    return { ok: false, code: 'ANTI_ROBOT_INDISPONIBLE', detail: String(e).slice(0, 200) };
  }
}

export function champPiege(valeur: unknown): Barriere {
  return typeof valeur === 'string' && valeur.trim() ? { ok: false, code: 'ANTI_ROBOT', detail: 'champ piège rempli' } : { ok: true };
}

export async function frequence(env: EnvSite, ip: string | null): Promise<Barriere> {
  if (!ip) return { ok: true };
  const { success } = await env.LIMITE_FORMULAIRES.limit({ key: `formulaires:${ip}` });
  return success ? { ok: true } : { ok: false, code: 'TROP_DE_DEMANDES', detail: 'limite par adresse atteinte' };
}
