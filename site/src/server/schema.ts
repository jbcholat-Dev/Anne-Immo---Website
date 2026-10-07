// Validation serveur des formulaires (AD-6, AD-7) : le contrat de chaque source, revérifié ici même si
// le navigateur l'a déjà fait (une vérification faite seulement dans la page se contourne).
// Renvoie soit le lead prêt à écrire, soit le premier champ refusé.

export type SourceFormulaire = 'contact' | 'estimation' | 'guide';
export const SOURCES: readonly SourceFormulaire[] = ['contact', 'estimation', 'guide'];
export const TYPES_BIEN = ['Maison', 'Appartement', 'Chalet', 'Terrain', 'Autre'] as const;
const CLES_UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export interface LeadFormulaire {
  source: SourceFormulaire;
  lang: 'fr' | 'en';
  prenom: string;
  nom: string;
  email: string;
  telephone: string | null;
  projet: 'vente' | 'achat' | null;
  message: string | null;
  commune_bien: string | null;
  type_bien: string | null;
  newsletter: boolean;
  utm: string | null;
}

export type Verdict = { ok: true; lead: LeadFormulaire } | { ok: false; champ: string };

const texte = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const coche = (v: unknown) => v === true || v === 'on' || v === 'true';
export const emailValide = (v: string) => v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/** Téléphone au format international E.164. Un numéro sans indicatif (dix chiffres commençant par 0) est
 * considéré comme français ; un numéro suisse doit donc être saisi avec +41 (le champ le dit déjà : « dix chiffres »). */
export function e164(v: string): string | null {
  const chiffres = v.replace(/\D/g, '');
  if (v.trim().startsWith('+')) return chiffres.length >= 8 && chiffres.length <= 15 ? `+${chiffres}` : null;
  if (chiffres.startsWith('00') && chiffres.length >= 10 && chiffres.length <= 17) return `+${chiffres.slice(2)}`;
  if (chiffres.length === 10 && chiffres.startsWith('0')) return `+33${chiffres.slice(1)}`;
  return null;
}

function utm(v: unknown): string | null {
  if (!v || typeof v !== 'object') return null;
  const garde: Record<string, string> = {};
  for (const cle of CLES_UTM) {
    const valeur = texte((v as Record<string, unknown>)[cle]).slice(0, 200);
    if (valeur) garde[cle] = valeur;
  }
  return Object.keys(garde).length ? JSON.stringify(garde) : null;
}

export function valider(source: SourceFormulaire, d: Record<string, unknown>): Verdict {
  const refus = (champ: string): Verdict => ({ ok: false, champ });
  const lang = d.lang === 'en' ? 'en' : d.lang === 'fr' ? 'fr' : null;
  if (!lang) return refus('lang');

  const prenom = texte(d.prenom);
  const nom = texte(d.nom);
  if (!prenom || prenom.length > 100) return refus('prenom');
  if (!nom || nom.length > 100) return refus('nom');

  const email = texte(d.email).toLowerCase();
  if (!emailValide(email)) return refus('email');

  // Téléphone : obligatoire pour le contact et l'estimation, facultatif pour le guide (AD-6, décision du 2026-09-07).
  const telSaisi = texte(d.telephone);
  const telephone = telSaisi ? e164(telSaisi) : null;
  if (telSaisi && !telephone) return refus('telephone');
  if (!telephone && source !== 'guide') return refus('telephone');

  if (!coche(d.privacy)) return refus('privacy');

  let projet: LeadFormulaire['projet'] = null;
  let message: string | null = texte(d.message) || null;
  let commune_bien: string | null = null;
  let type_bien: string | null = null;
  if (message && message.length > 1000) return refus('message');

  if (source === 'contact') {
    if (d.projet !== 'vente' && d.projet !== 'achat') return refus('projet');
    projet = d.projet;
    if (!message) return refus('message');
  } else if (source === 'estimation') {
    commune_bien = texte(d.commune_bien);
    if (!commune_bien || commune_bien.length > 100) return refus('commune_bien');
    type_bien = texte(d.type_bien);
    if (!(TYPES_BIEN as readonly string[]).includes(type_bien)) return refus('type_bien');
  } else {
    message = null; // le guide n'a pas de message
  }

  return {
    ok: true,
    lead: { source, lang, prenom, nom, email, telephone, projet, message, commune_bien, type_bien, newsletter: coche(d.newsletter), utm: utm(d.utm) },
  };
}
