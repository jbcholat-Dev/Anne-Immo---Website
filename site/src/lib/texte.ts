/** Italiana n'a pas de glyphe visible pour le tiret ASCII : dans les titres en Italiana, on emploie le tiret insécable U+2011. */
export const tiret = (s: string) => s.replace(/-/g, '‑');

/** Expérience 8.6 : un titre peut porter un mot-clé entre astérisques (« Des maisons *vendues* ») rendu en italique Klein.
 *  Renvoie du HTML échappé, à passer à `set:html`. */
export const accent = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ ([?!:;])/g, '\u00a0$1').replace(/\*([^*]+)\*/g, '<em>$1</em>');
/** Le même titre sans les astérisques (attributs, aria-label). */
export const sansAccent = (s: string) => s.replace(/\*/g, '');
