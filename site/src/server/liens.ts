// Liens signés envoyés par e-mail (story 10.5, AD-8, AD-16) : téléchargement du guide (7 jours), du rapport PDF du
// diagnostic (7 jours, story 10.10) et désabonnement de la séquence. Chaque lien porte une empreinte HMAC SHA-256 calculée avec le secret LIEN_SECRET (posé dans Cloudflare,
// jamais dans le dépôt) : impossible à deviner ou à modifier sans ce secret. Sans secret, aucun lien n'est produit.
import type { EnvSite } from './env';

export const DUREE_GUIDE_MS = 7 * 86_400_000;
const ID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

async function empreinte(secret: string, message: string): Promise<string> {
  const cle = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const octets = new Uint8Array(await crypto.subtle.sign('HMAC', cle, new TextEncoder().encode(message)));
  return btoa(String.fromCharCode(...octets)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Comparaison en temps constant : ne dit pas, par sa durée, combien de caractères étaient justes. */
function egales(a: string, b: string): boolean {
  let ecart = a.length === b.length ? 0 : 1;
  for (let i = 0; i < b.length; i++) ecart |= b.charCodeAt(i) ^ (a.charCodeAt(i) || 0);
  return ecart === 0;
}

/** Adresse publique du site, sans barre finale (variable URL_SITE de wrangler.jsonc). */
export const urlSite = (env: EnvSite) => String(env.URL_SITE ?? '').replace(/\/+$/, '');

/** Lien de téléchargement du guide pour un lead, valable 7 jours à partir de maintenant. Null sans secret. */
export async function lienGuide(env: EnvSite, leadId: string, maintenant = Date.now()): Promise<string | null> {
  if (!env.LIEN_SECRET) return null;
  const expire = Math.floor((maintenant + DUREE_GUIDE_MS) / 1000);
  const s = await empreinte(env.LIEN_SECRET, `guide.${leadId}.${expire}`);
  return `${urlSite(env)}/api/guide/telecharger?l=${leadId}&e=${expire}&s=${s}`;
}

/** Le lead d'un lien de guide valable (bonne empreinte, pas expiré), sinon null. */
export async function verifierGuide(env: EnvSite, url: URL): Promise<string | null> {
  const [l, e, s] = ['l', 'e', 's'].map((k) => url.searchParams.get(k) ?? '');
  if (!env.LIEN_SECRET || !ID.test(l) || !/^\d{1,12}$/.test(e) || !s) return null;
  if (Number(e) * 1000 < Date.now()) return null;
  return egales(s, await empreinte(env.LIEN_SECRET, `guide.${l}.${e}`)) ? l : null;
}

/** Lien de téléchargement du rapport PDF du diagnostic (story 10.10), valable 7 jours. Null sans secret. */
export async function lienRapport(env: EnvSite, leadId: string, maintenant = Date.now()): Promise<string | null> {
  if (!env.LIEN_SECRET) return null;
  const expire = Math.floor((maintenant + DUREE_GUIDE_MS) / 1000);
  const s = await empreinte(env.LIEN_SECRET, `rapport.${leadId}.${expire}`);
  return `${urlSite(env)}/api/diagnostic/rapport?l=${leadId}&e=${expire}&s=${s}`;
}

/** Le lead d'un lien de rapport valable, sinon null. Une empreinte de guide n'ouvre pas un rapport (préfixe différent). */
export async function verifierRapport(env: EnvSite, url: URL): Promise<string | null> {
  const [l, e, s] = ['l', 'e', 's'].map((k) => url.searchParams.get(k) ?? '');
  if (!env.LIEN_SECRET || !ID.test(l) || !/^\d{1,12}$/.test(e) || !s) return null;
  if (Number(e) * 1000 < Date.now()) return null;
  return egales(s, await empreinte(env.LIEN_SECRET, `rapport.${l}.${e}`)) ? l : null;
}

/** Lien de désabonnement d'un lead (sans date de fin : il doit marcher depuis n'importe quel e-mail de la séquence). */
export async function lienDesabonnement(env: EnvSite, leadId: string): Promise<string | null> {
  if (!env.LIEN_SECRET) return null;
  return `${urlSite(env)}/desabonnement?l=${leadId}&s=${await empreinte(env.LIEN_SECRET, `desabonnement.${leadId}`)}`;
}

export async function verifierDesabonnement(env: EnvSite, url: URL): Promise<string | null> {
  const l = url.searchParams.get('l') ?? '';
  const s = url.searchParams.get('s') ?? '';
  if (!env.LIEN_SECRET || !ID.test(l) || !s) return null;
  return egales(s, await empreinte(env.LIEN_SECRET, `desabonnement.${l}`)) ? l : null;
}

/** Arrête la séquence d'un lead : horodate le désabonnement (une seule fois) et annule les e-mails pas encore partis. */
export async function desabonner(env: EnvSite, leadId: string): Promise<{ lang: 'fr' | 'en' } | null> {
  const maintenant = new Date().toISOString();
  const [, , lecture] = await env.DB.batch([
    env.DB.prepare('UPDATE lead SET newsletter_unsubscribed_at = ?2, last_activity_at = ?2 WHERE id = ?1 AND newsletter_unsubscribed_at IS NULL').bind(leadId, maintenant),
    env.DB.prepare(`UPDATE lead_delivery SET status = 'cancelled' WHERE lead_id = ?1 AND channel LIKE 'sequence:%' AND status IN ('pending', 'failed')`).bind(leadId),
    env.DB.prepare('SELECT lang FROM lead WHERE id = ?1').bind(leadId),
  ]);
  return (lecture.results?.[0] as { lang: 'fr' | 'en' } | undefined) ?? null;
}

/** Langue et état d'abonnement d'un lead (page /desabonnement). */
export async function abonnement(env: EnvSite, leadId: string): Promise<{ lang: 'fr' | 'en'; desabonne: boolean } | null> {
  const l = await env.DB.prepare('SELECT lang, newsletter_unsubscribed_at FROM lead WHERE id = ?1').bind(leadId)
    .first<{ lang: 'fr' | 'en'; newsletter_unsubscribed_at: string | null }>();
  return l ? { lang: l.lang, desabonne: !!l.newsletter_unsubscribed_at } : null;
}

// ——— Campagnes e-mail de l'espace d'Anne (story 13.27, AD-21) ———
// Le lien de désinscription d'une campagne désigne un contact, pas une demande : un contact saisi à la main ou importé
// n'a jamais rien demandé sur le site. Préfixe d'empreinte distinct : un lien de la séquence n'ouvre pas celui-ci.

/** Lien de désinscription des campagnes pour un contact (sans date de fin). Null sans secret. */
export async function lienDesinscriptionContact(env: EnvSite, contactId: string): Promise<string | null> {
  if (!env.LIEN_SECRET) return null;
  return `${urlSite(env)}/desabonnement?c=${contactId}&s=${await empreinte(env.LIEN_SECRET, `desinscription.${contactId}`)}`;
}

export async function verifierDesinscriptionContact(env: EnvSite, url: URL): Promise<string | null> {
  const c = url.searchParams.get('c') ?? '';
  const s = url.searchParams.get('s') ?? '';
  if (!env.LIEN_SECRET || !ID.test(c) || !s) return null;
  return egales(s, await empreinte(env.LIEN_SECRET, `desinscription.${c}`)) ? c : null;
}

/** Le contact ne veut plus d'e-mails groupés : horodaté une fois, envois de campagne pas encore partis annulés, noté dans son historique. */
export async function desinscrireContact(env: EnvSite, contactId: string): Promise<boolean> {
  const maintenant = new Date().toISOString();
  const r = await env.DB.prepare('UPDATE contact SET email_desinscrit_le = ?2, last_activity_at = ?2 WHERE id = ?1 AND email_desinscrit_le IS NULL')
    .bind(contactId, maintenant).run();
  await env.DB.prepare(`UPDATE campagne_destinataire SET statut = 'annule', erreur = 'désinscrit' WHERE contact_id = ?1 AND statut = 'a_envoyer'`).bind(contactId).run();
  if (r.meta.changes) {
    await env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, texte) VALUES (?1, ?2, 'note', 'site', 'Désinscrit des e-mails groupés d''Anne (lien d''un e-mail)')`)
      .bind(contactId, maintenant).run();
  }
  return true;
}

/** Le contact d'un lien de désinscription existe-t-il, et est-il déjà désinscrit ? */
export async function inscriptionContact(env: EnvSite, contactId: string): Promise<{ desinscrit: boolean } | null> {
  const c = await env.DB.prepare('SELECT email_desinscrit_le FROM contact WHERE id = ?1').bind(contactId).first<{ email_desinscrit_le: string | null }>();
  return c ? { desinscrit: !!c.email_desinscrit_le } : null;
}

