// Identifiants ULID (Conventions) : 26 caractères, triables par date de création.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export function ulid(maintenant = Date.now()): string {
  let temps = '';
  for (let t = maintenant, i = 0; i < 10; i++, t = Math.floor(t / 32)) temps = ALPHABET[t % 32] + temps;
  const hasard = crypto.getRandomValues(new Uint8Array(16));
  return temps + Array.from(hasard, (o) => ALPHABET[o % 32]).join('');
}
