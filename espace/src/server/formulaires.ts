// Lecture des formulaires des pages de l'espace : texte nettoyé et borné, date AAAA-MM-JJ, champs d'un prescripteur.
import { e164, emailValide } from '@site/server/schema';
import type { ChampsPrescripteur } from './pipeline';

export const champ = (f: FormData, k: string, max = 200) => { const v = f.get(k); return typeof v === 'string' ? v.trim().slice(0, max) : ''; };
export const date = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
export const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/** Champs d'un prescripteur, ou le message d'erreur à afficher. */
export function lirePrescripteur(f: FormData): ChampsPrescripteur | string {
  const nom = champ(f, 'nom', 120);
  if (!nom) return 'Indiquez au moins le nom.';
  const tel = champ(f, 'telephone', 40), mail = champ(f, 'email', 254).toLowerCase();
  const telephone = tel ? e164(tel) : null;
  if (tel && !telephone) return 'Le téléphone ne semble pas valable.';
  if (mail && !emailValide(mail)) return "L'adresse e-mail ne semble pas valable.";
  const relance = champ(f, 'prochaine_relance_le');
  if (relance && !date(relance)) return 'La date de relance ne semble pas valable.';
  return {
    nom, role: champ(f, 'role', 120) || null, commune: champ(f, 'commune', 80) || null, telephone, email: mail || null,
    notes: champ(f, 'notes', 2000) || null, prochaine_relance_le: date(relance), relance_raison: champ(f, 'relance_raison') || null,
  };
}
