// Corrections de conformité charte + cohérence, appliquées aux artboards.
import { readFileSync, writeFileSync } from 'node:fs';

const files = ['Main.dc.html', 'AccueilMobile.dc.html', 'Diagnostic.dc.html', 'Question.dc.html',
               'Resultats.dc.html', 'HeroA.dc.html', 'HeroB.dc.html', 'HeroC.dc.html'];

const edits = {
  '*': [
    // Aucune teinte inventée : le survol garde le Klein et gagne un soulignement
    // (ne repose plus sur la couleur seule — meilleur pour l'accessibilité).
    ['a:hover { color: #001F6F; }', 'a:hover { color: #002FA7; text-decoration: underline; }']
  ],
  'Main.dc.html': [
    ['color:#3d4966', 'color:#33405C'],
    // logo du pied de page : Italiana ne descend pas sous 22px
    ['font-family:Italiana,serif;font-size:19px;letter-spacing:.03em;color:#F7F2EA',
     'font-family:Italiana,serif;font-size:22px;letter-spacing:.03em;color:#F7F2EA']
  ],
  'AccueilMobile.dc.html': [
    ['color:#3d4966', 'color:#33405C'],
    // en-tête mobile : le symbole seul remplace le nom, qui ne tient pas à 22px
    ['<svg viewBox="24 26 108 108" width="26" height="26" aria-hidden="true"><defs><clipPath id="mm">',
     '<svg viewBox="24 26 108 108" width="32" height="32" role="img" aria-label="Anne VIAL-TISSOT"><defs><clipPath id="mm">'],
    ['\n      <span style="font-family:Italiana,serif;font-size:16px;letter-spacing:.03em">Anne VIAL-TISSOT</span>', ''],
    ['font-family:Italiana,serif;font-size:17px;color:#F7F2EA',
     'font-family:Italiana,serif;font-size:22px;color:#F7F2EA']
  ],
  'Diagnostic.dc.html': [
    ['font-family:Italiana,serif;font-size:19px;letter-spacing:.03em',
     'font-family:Italiana,serif;font-size:22px;letter-spacing:.03em'],
    ['border-top:1px solid #D6C9B6', 'border-top:1px solid #D8CDBB']
  ],
  'Question.dc.html': [
    ['.opt:hover { border-color: #C4623E; background: #FDFBF7; }',
     '.opt:hover { border-color: #C4623E; background: #F7F2EA; }'],
    // Le visiteur s'est vu promettre 15 questions : on compte en questions,
    // pas en écrans. La barre reste calée sur les 17 écrans réels.
    ['Écran 1 sur 17', 'Question 1 sur 15']
  ],
  'Resultats.dc.html': [
    ['font-family:Italiana,serif;font-size:19px;letter-spacing:.03em',
     'font-family:Italiana,serif;font-size:22px;letter-spacing:.03em'],
    // mini-couverture du guide : trop petit pour de l'Italiana, passe en DM Sans
    ['<span style="font-family:Italiana,serif;font-size:9.5px;line-height:1.3;color:#F7F2EA">Le guide<br>du vendeur</span>',
     '<span style="font-size:9px;line-height:1.35;letter-spacing:.06em;text-transform:uppercase;color:#F7F2EA">Le guide<br>du vendeur</span>']
  ]
};

let total = 0;
for (const f of files) {
  let src = readFileSync(f, 'utf8');
  const before = src;
  for (const [from, to] of [...edits['*'], ...(edits[f] ?? [])]) {
    if (!src.includes(from)) { console.log(`  ${f}: introuvable → ${from.slice(0, 60)}`); continue; }
    const n = src.split(from).length - 1;
    src = src.replaceAll(from, to);
    total += n;
  }
  if (src !== before) writeFileSync(f, src);
}

// contrôles finaux
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  const bad = [];
  for (const c of ['#001F6F', '#3d4966', '#D6C9B6', '#FDFBF7', '#8a8177', '#8A8177']) {
    if (s.includes(c)) bad.push(c);
  }
  for (const m of s.matchAll(/font-family:Italiana,serif;font-size:([\d.]+)px/g)) {
    if (parseFloat(m[1]) < 22) bad.push(`Italiana ${m[1]}px`);
  }
  console.log(bad.length ? `${f}: RESTE ${bad.join(', ')}` : `${f}: ok`);
}
console.log(`${total} remplacements`);
