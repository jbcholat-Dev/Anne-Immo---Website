/** Italiana n'a pas de glyphe visible pour le tiret ASCII : dans les titres en Italiana, on emploie le tiret insécable U+2011. */
export const tiret = (s: string) => s.replace(/-/g, '‑');
