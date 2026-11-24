// Repérer et masquer les numéros de téléphone dans un texte (revues de code 18.25 et 18.27), sans prendre une date ni un
// prix pour un numéro. Servi au tri (texte envoyé à l'API Claude) et au brief de la semaine (texte refusé s'il en contient).

/** D'abord les numéros à la forme sûre : français (06 12 34 56 78) ou international (+41 79 123 45 67, 0041…). */
const FORME_SURE = /(?:\+|00)\d{1,3}(?:[ .-]?\d){7,12}|(?<!\d)0[1-9](?:[ .-]?\d{2}){4}(?!\d)/g;
/** Puis toute autre suite de 9 chiffres au moins, sauf une date ou un montant. */
const SUITE = /\d[\d .-]{7,}\d/g;

function suiteOuPas(m: string, a: number, texte: string): string {
  const suite = texte.slice(a + m.length, a + m.length + 8);
  if (/^\s*(€|euros?\b|k€|eur\b|chf\b|m²|m2\b)/i.test(suite)) return m;
  if (/^\d{4}-\d{2}-\d{2}$|^\d{1,2}[./-]\d{1,2}[./-]\d{2,4}$/.test(m)) return m;
  return m.replace(/\D/g, '').length >= 9 ? '[téléphone]' : m;
}

export function masquerTelephones(texte: string): string {
  return texte.replace(FORME_SURE, '[téléphone]').replace(SUITE, (m, a: number, t: string) => suiteOuPas(m, a, t));
}

export const contientTelephone = (texte: string): boolean => masquerTelephones(texte) !== texte;
