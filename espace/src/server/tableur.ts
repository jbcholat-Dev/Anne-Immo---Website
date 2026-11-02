// Lecture d'un CSV (story 13.7, gardée par la story 18.9 pour server/import) : séparateur ; , ou tabulation, détecté sur la
// première ligne ; champs entre guillemets. Le .xlsx n'est plus lu ici : depuis la story 18.9, c'est le script de Claude
// (scripts/claude-import.mjs) qui lit les onglets d'un classeur et envoie leurs cellules en texte, et l'ancienne page
// /importer, seule à envoyer un fichier binaire, est retirée.

export function lireCsv(t: string): string[][] {
  const premiere = t.split(/\r?\n/, 1)[0] ?? '';
  const sep = [';', '\t', ','].map((s) => [s, premiere.split(s).length] as const).sort((a, b) => b[1] - a[1])[0][0];
  const lignes: string[][] = [];
  let ligne: string[] = [], champ = '', guillemets = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (guillemets) {
      if (c === '"' && t[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"' && champ === '') guillemets = true;
    else if (c === sep) { ligne.push(champ); champ = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      ligne.push(champ); lignes.push(ligne); ligne = []; champ = '';
    } else champ += c;
  }
  if (champ || ligne.length) { ligne.push(champ); lignes.push(ligne); }
  return lignes.filter((l) => l.some((v) => v.trim()));
}
