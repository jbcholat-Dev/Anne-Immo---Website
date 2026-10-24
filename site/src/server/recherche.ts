// Recherche dans les contacts de l'espace et les demandes du site (story 13.24, audit 13.21) : ce qu'Anne tape au
// téléphone. Un début de numéro tapé en 0 (« 0612 », « 06 12 34 ») est cherché au format international où les numéros
// sont rangés (« +33612… ») ; plusieurs mots cherchent chacun de leur côté (« marie dupont », « dupont thonon »).

/** Ce qu'une recherche veut dire : un morceau de numéro au format de la base, ou des mots (en minuscules, sans % ni _). */
export function lireRecherche(q: string): { telephone: string | null; mots: string[] } {
  const r = q.trim().toLowerCase().replace(/[%_]/g, '');
  const chiffres = r.replace(/[\s.\-()/]/g, '');
  if (/^\+?\d{2,}$/.test(chiffres)) {
    const tel = chiffres.startsWith('+') ? chiffres : chiffres.startsWith('00') ? `+${chiffres.slice(2)}` : chiffres.startsWith('0') ? `+33${chiffres.slice(1)}` : chiffres;
    return { telephone: tel, mots: [] };
  }
  return { telephone: null, mots: r.split(/\s+/).filter(Boolean).slice(0, 5) };
}

/**
 * Le filtre SQL d'une recherche, pour une table dont on donne les colonnes de texte (concaténées : un mot peut
 * tomber dans le prénom, le nom ou la commune) et la colonne du téléphone. Les paramètres commencent à `premier`.
 */
export function filtreRecherche(q: string, colonnes: string[], telephone: string, premier: number): { sql: string; valeurs: string[] } | null {
  const { telephone: tel, mots } = lireRecherche(q);
  if (tel) return { sql: `coalesce(${telephone}, '') LIKE ?${premier}`, valeurs: [`%${tel}%`] };
  if (!mots.length) return null;
  const texte = `lower(${colonnes.map((c) => `coalesce(${c}, '')`).join(" || ' ' || ")})`;
  return { sql: mots.map((_, i) => `${texte} LIKE ?${premier + i}`).join(' AND '), valeurs: mots.map((m) => `%${m}%`) };
}

/** Un numéro rangé en +33 tel qu'on le lit en France : « 06 12 34 56 78 ». Les autres pays restent au format international. */
export function telLisible(tel: string | null | undefined): string {
  if (!tel) return '';
  const fr = /^\+33(\d{9})$/.exec(tel);
  return fr ? `0${fr[1]}`.replace(/(\d{2})(?=\d)/g, '$1 ') : tel;
}
