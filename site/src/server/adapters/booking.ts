// Adaptateur Cal.com (AD-8, story 10.6) : le seul endroit du site qui comprend les messages de Cal.com, le service de prise
// de rendez-vous. Sans état : il vérifie la signature d'un webhook et traduit une réservation en lead `rdv`.
// Cal.com signe chaque message (en-tête X-Cal-Signature-256 : HMAC SHA-256 du corps brut, en hexadécimal, calculé avec le
// secret saisi dans le webhook Cal.com et posé dans Cloudflare sous CAL_WEBHOOK_SECRET). Format constaté le 2026-10-07
// (story 10.1, tickets #25 et #26).
import { e164, type LeadFormulaire } from '../schema';

/** Vrai si la signature reçue correspond au corps et au secret (comparaison en temps constant). */
export async function signatureValide(corps: string, recue: string | null, secret: string): Promise<boolean> {
  const attendue = Array.from(
    new Uint8Array(await crypto.subtle.sign('HMAC',
      await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']),
      new TextEncoder().encode(corps))),
    (o) => o.toString(16).padStart(2, '0'),
  ).join('');
  const r = (recue ?? '').trim().toLowerCase();
  let ecart = r.length === attendue.length ? 0 : 1;
  for (let i = 0; i < attendue.length; i++) ecart |= attendue.charCodeAt(i) ^ (r.charCodeAt(i) || 0);
  return r.length > 0 && ecart === 0;
}

type Reponse = { value?: unknown };
const valeur = (r: Reponse | undefined) => (r && typeof r === 'object' ? r.value : undefined);
const texte = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export type Reservation =
  | { ok: true; uid: string; lead: LeadFormulaire; creeLe: string }
  | { ok: false; raison: string };

/** Traduit un BOOKING_CREATED en lead `rdv` (AD-6) : nom complet Cal.com, téléphone en E.164, case de confidentialité obligatoire. */
export function reservation(message: Record<string, unknown>): Reservation {
  const p = (message.payload ?? {}) as Record<string, unknown>;
  const reponses = (p.responses ?? {}) as Record<string, Reponse>;
  const uid = texte(p.uid);
  if (!uid || uid.length > 100) return { ok: false, raison: 'uid' };
  const attendee = (Array.isArray(p.attendees) ? p.attendees[0] : null) as Record<string, unknown> | null;
  const nom = texte(valeur(reponses.name)) || texte(attendee?.name);
  const email = (texte(valeur(reponses.email)) || texte(attendee?.email)).toLowerCase();
  if (!nom || nom.length > 200) return { ok: false, raison: 'nom' };
  if (!email || email.length > 254) return { ok: false, raison: 'email' };
  if (valeur(reponses.confidentialite) !== true) return { ok: false, raison: 'privacy' };
  // Rendez-vous par téléphone (décision du 2026-10-08) : le numéro est dans le champ téléphone, ou dans le lieu « numéro du participant ».
  const lieu = valeur(reponses.location) as { optionValue?: unknown } | undefined;
  const brut = texte(valeur(reponses.attendeePhoneNumber)) || texte(lieu?.optionValue) || texte(attendee?.phoneNumber);
  const telephone = brut ? e164(brut) : null;
  const debut = texte(p.startTime);
  if (!debut || Number.isNaN(Date.parse(debut))) return { ok: false, raison: 'startTime' };
  const langue = texte((attendee?.language as { locale?: unknown } | undefined)?.locale);
  const notes = texte(valeur(reponses.notes)) || texte(p.additionalNotes);
  return {
    ok: true,
    uid,
    creeLe: texte(message.createdAt) || new Date().toISOString(),
    lead: {
      source: 'rdv', lang: langue.startsWith('en') ? 'en' : 'fr', prenom: null, nom, email, telephone,
      projet: null, message: notes ? notes.slice(0, 1000) : null, commune_bien: null, type_bien: null,
      newsletter: false, utm: null, rdv_start: new Date(debut).toISOString(),
    },
  };
}
