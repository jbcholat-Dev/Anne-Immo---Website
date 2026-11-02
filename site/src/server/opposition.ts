// Opposition (story 18.3, AD-31) : les personnes qui ont demandé l'effacement. On ne garde d'elles qu'une empreinte HMAC
// SHA-256 de leur téléphone (E.164) et de leur e-mail (en minuscules), dans la table `opposition` (migration 0018).
// L'import du carnet (story 18.10) la lit pour rejeter ces personnes, et après une restauration de la base, les
// effacements faits depuis le point restauré se rejouent à partir d'elle.
// Secret : LIEN_SECRET, le seul secret que le site et l'espace partagent déjà (RUNBOOK § 4 quater et § 4 sexies), posé
// dans Cloudflare, jamais dans le dépôt. Le message est préfixé « opposition: » pour qu'aucune empreinte ne ressemble à
// celle d'un lien signé. Sans secret, l'effacement se fait quand même (c'est l'obligation) et l'absence est notée au
// journal. Changer LIEN_SECRET rend les empreintes déjà notées méconnaissables : l'import ne les rejetterait plus.
import type { EnvSite } from './env';
import { journal } from './journal';

/** Forme comparée : téléphone tel quel (déjà en E.164), e-mail sans espaces et en minuscules. */
export const valeurOpposition = (v: string) => (v.includes('@') ? v.trim().toLowerCase() : v.trim());

/** Empreinte HMAC SHA-256 (hexadécimal) d'un téléphone E.164 ou d'un e-mail. */
export async function empreinteOpposition(secret: string, valeur: string): Promise<string> {
  const cle = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const octets = new Uint8Array(await crypto.subtle.sign('HMAC', cle, new TextEncoder().encode(`opposition:${valeurOpposition(valeur)}`)));
  return Array.from(octets, (o) => o.toString(16).padStart(2, '0')).join('');
}

/** Les requêtes qui ajoutent ces téléphones et e-mails à `opposition` (vide sans secret ou sans valeur). */
export async function ecrituresOpposition(env: EnvSite, valeurs: (string | null | undefined)[], le: string): Promise<D1PreparedStatement[]> {
  const uniques = [...new Set(valeurs.filter((v): v is string => !!v && !!v.trim()).map(valeurOpposition))];
  if (!uniques.length) return [];
  if (!env.LIEN_SECRET) {
    journal('opposition_sans_secret', { valeurs: uniques.length });
    return [];
  }
  const secret = env.LIEN_SECRET;
  const empreintes = await Promise.all(uniques.map((v) => empreinteOpposition(secret, v)));
  return empreintes.map((e) => env.DB.prepare('INSERT INTO opposition (empreinte, le) VALUES (?1, ?2) ON CONFLICT DO NOTHING').bind(e, le));
}

