// Contrôle d'accès de l'espace de gestion des demandes (story 10.7, AD-9, AD-18).
// Cloudflare Access (le portail qui demande un code envoyé par e-mail) est placé devant /gestion et /api/gestion.
// Le serveur ne se contente pas de sa présence : il vérifie le jeton signé que Access ajoute à chaque requête
// (en-tête Cf-Access-Jwt-Assertion), avec les clés publiques de l'équipe Access et l'identifiant de l'application (AUD).
// Sans jeton valable, rien n'est servi. Ainsi, une adresse que Access ne protégerait pas par erreur reste fermée.
import type { EnvSite } from './env';

interface Cle extends JsonWebKey { kid?: string }
let cache: { equipe: string; cles: Cle[]; jusqua: number } | null = null;

const base64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const json = (s: string) => JSON.parse(new TextDecoder().decode(base64url(s)));

async function clesPubliques(equipe: string, forcer = false): Promise<Cle[]> {
  if (!forcer && cache && cache.equipe === equipe && cache.jusqua > Date.now()) return cache.cles;
  const r = await fetch(`${equipe}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error(`clés Access : ${r.status}`);
  const { keys } = (await r.json()) as { keys: Cle[] };
  cache = { equipe, cles: keys, jusqua: Date.now() + 3_600_000 };
  return keys;
}

/** Adresse e-mail de la personne connectée par Access, ou null si le jeton manque, est faux, périmé ou d'une autre application. */
export async function compteAcces(env: EnvSite, request: Request): Promise<string | null> {
  const equipe = String(env.ACCESS_EQUIPE ?? '').replace(/\/+$/, '');
  const auds = String(env.ACCESS_AUD ?? '').split(',').map((a) => a.trim()).filter(Boolean);
  const jeton = request.headers.get('cf-access-jwt-assertion') ?? '';
  if (!equipe || !auds.length || !jeton) return null;
  const [entete, charge, signature] = jeton.split('.');
  if (!entete || !charge || !signature) return null;
  try {
    const { alg, kid } = json(entete) as { alg: string; kid?: string };
    if (alg !== 'RS256') return null;
    let cle = (await clesPubliques(equipe)).find((k) => k.kid === kid);
    if (!cle) cle = (await clesPubliques(equipe, true)).find((k) => k.kid === kid); // clés renouvelées par Cloudflare
    if (!cle) return null;
    const publique = await crypto.subtle.importKey('jwk', { kty: cle.kty, n: cle.n, e: cle.e }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const valide = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', publique, base64url(signature), new TextEncoder().encode(`${entete}.${charge}`));
    if (!valide) return null;
    const c = json(charge) as { aud?: string | string[]; exp?: number; nbf?: number; iss?: string; email?: string };
    const maintenant = Date.now() / 1000;
    const audJeton = Array.isArray(c.aud) ? c.aud : [c.aud];
    if (!c.exp || c.exp < maintenant || (c.nbf && c.nbf > maintenant + 60)) return null;
    if (c.iss !== equipe || !audJeton.some((a) => a && auds.includes(a)) || !c.email) return null;
    return c.email.toLowerCase();
  } catch {
    return null;
  }
}

/** En-tête interne qui transmet aux pages l'adresse vérifiée (remplacé par worker.ts, jamais lu depuis le visiteur). */
export const ENTETE_COMPTE = 'x-gestion-compte';
