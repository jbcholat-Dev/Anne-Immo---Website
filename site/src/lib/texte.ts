/** Tiret insécable U+2011 dans les titres (« VIAL‑TISSOT », communes) : la ligne ne se coupe jamais au tiret.
 *  Historique : Italiana avait un tiret ASCII quasi invisible. Gilda Display (D-31) n'a pas de glyphe U+2011 : le navigateur
 *  le dessine avec la police de secours, comme avant. */
export const tiret = (s: string) => s.replace(/-/g, '‑');
