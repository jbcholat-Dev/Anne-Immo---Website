// Page de résultats du diagnostic rendue par le serveur (story 10.4, AD-5, CAP-5).
// Le lien `/diagnostic/resultats?t=<jeton>` vaut 24 heures et ne s'ouvre que dans un navigateur : le premier qui l'ouvre
// reçoit une clé (cookie `avt_resultats`, inaccessible au JavaScript de la page) dont la base garde l'empreinte, puis il est
// redirigé vers l'adresse sans jeton. Un autre navigateur, un jeton inconnu ou périmé, un lead sans score : 404.
import type { AstroCookies } from 'astro';
import { envSite } from './env';
import { journal } from './journal';
import type { Scores } from './diagnostic';

export const COOKIE = 'avt_resultats';
const DUREE_MS = 24 * 3600 * 1000;
const JETON = /^[A-Za-z0-9_-]{43}$/;
const CLE = /^[A-Za-z0-9_-]{43}$/;

export interface ResultatsLead {
  id: string;
  prenom: string;
  email: string;
  scores: Scores;
  orientation: 'A' | 'B';
  newsletter: boolean;
}

type Ligne = { id: string; prenom: string | null; email: string; scores: string | null; orientation: 'A' | 'B' | null; newsletter_opt_in_at: string | null; token_browser: string | null; created_at: string };

const aleatoire = () => btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function hacher(cle: string): Promise<string> {
  const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cle));
  return Array.from(new Uint8Array(octets), (o) => o.toString(16).padStart(2, '0')).join('');
}

async function lire(token: string): Promise<Ligne | null> {
  const l = await envSite.DB.prepare(
    `SELECT id, prenom, email, scores, orientation, newsletter_opt_in_at, token_browser, created_at
     FROM lead WHERE source = 'diagnostic' AND token = ?1`,
  ).bind(token).first<Ligne>();
  if (!l || !l.scores || !l.orientation) return null;
  if (Date.now() - Date.parse(l.created_at) > DUREE_MS) return null;
  return l;
}

const versResultats = (l: Ligne): ResultatsLead => ({
  id: l.id, prenom: l.prenom ?? '', email: l.email, scores: JSON.parse(l.scores!) as Scores,
  orientation: l.orientation!, newsletter: !!l.newsletter_opt_in_at,
});

/** Le navigateur qui présente le cookie : son lead s'il est encore valable, sinon null. */
export async function leadDuNavigateur(cookies: AstroCookies): Promise<Ligne | null> {
  const [token, cle] = (cookies.get(COOKIE)?.value ?? '').split('.');
  if (!token || !cle || !JETON.test(token) || !CLE.test(cle)) return null;
  const l = await lire(token);
  if (!l || !l.token_browser || l.token_browser !== (await hacher(cle))) return null;
  return l;
}

export type Ouverture = { etat: 'resultats'; resultats: ResultatsLead } | { etat: 'redirection' } | { etat: 'introuvable' };

/** Décide ce que montre la page : les résultats, une redirection après la première ouverture, ou « lien plus valable ». */
export async function ouvrir(url: URL, cookies: AstroCookies): Promise<Ouverture> {
  const token = url.searchParams.get('t');
  if (token !== null) {
    if (!JETON.test(token)) return { etat: 'introuvable' };
    const l = await lire(token);
    if (!l) return { etat: 'introuvable' };
    if (!l.token_browser) {
      // Première ouverture : ce navigateur devient le seul autorisé (à condition que personne ne l'ait réclamé entre-temps).
      const cle = aleatoire();
      const pris = await envSite.DB.prepare('UPDATE lead SET token_browser = ?2 WHERE id = ?1 AND token_browser IS NULL')
        .bind(l.id, await hacher(cle)).run();
      if (pris.meta.changes === 1) {
        const reste = Math.max(60, Math.floor((Date.parse(l.created_at) + DUREE_MS - Date.now()) / 1000));
        cookies.set(COOKIE, `${token}.${cle}`, { path: '/', httpOnly: true, secure: true, sameSite: 'lax', maxAge: reste });
        journal('resultats_ouverts', { lead: l.id });
        return { etat: 'redirection' };
      }
    }
    // Déjà ouvert : seulement dans le navigateur qui a la clé (rechargement de la page avec le jeton, par exemple).
    const moi = await leadDuNavigateur(cookies);
    return moi && moi.id === l.id ? { etat: 'redirection' } : { etat: 'introuvable' };
  }
  const l = await leadDuNavigateur(cookies);
  return l ? { etat: 'resultats', resultats: versResultats(l) } : { etat: 'introuvable' };
}
