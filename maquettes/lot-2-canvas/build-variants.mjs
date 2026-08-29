// Génère HeroB et HeroC à partir de HeroA : même composition, une seule variable change.
import { readFileSync, writeFileSync } from 'node:fs';

const a = readFileSync('HeroA.dc.html', 'utf8');

const reId = (s, from, to) =>
  s.replaceAll(`id="${from}Sky"`, `id="${to}Sky"`)
   .replaceAll(`id="${from}Wat"`, `id="${to}Wat"`)
   .replaceAll(`id="${from}Vig"`, `id="${to}Vig"`)
   .replaceAll(`id="${from}Veil"`, `id="${to}Veil"`)
   .replaceAll(`url(#${from}Sky)`, `url(#${to}Sky)`)
   .replaceAll(`url(#${from}Wat)`, `url(#${to}Wat)`)
   .replaceAll(`url(#${from}Vig)`, `url(#${to}Vig)`)
   .replaceAll(`url(#${from}Veil)`, `url(#${to}Veil)`)
   .replaceAll('href="#a"', `href="#${to}"`);

// --- Variante B : même image, mais c'est une vidéo -------------------------
let b = reId(a, 'a', 'b');
b = b.replace(
  "<b style=\"color:#26201A\">Variante A</b> — photo fixe · appel à l'action en lien souligné",
  "<b style=\"color:#26201A\">Variante B</b> — vidéo drone en boucle · appel à l'action en lien souligné"
);
b = b.replace(
  '<span style="position:absolute;right:14px;top:14px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;background:rgba(38,32,26,.62);color:#F7F2EA;padding:3px 9px;border-radius:999px">visuel de maquette</span>',
  `<span style="position:absolute;right:14px;top:14px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;background:rgba(38,32,26,.62);color:#F7F2EA;padding:3px 9px;border-radius:999px">vidéo drone — placeholder de maquette</span>
    <div style="position:absolute;left:48px;top:20px;display:flex;align-items:center;gap:9px;background:rgba(38,32,26,.42);border-radius:999px;padding:6px 14px 6px 11px">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="#F7F2EA" aria-hidden="true"><path d="M8 5 L19 12 L8 19 Z"/></svg>
      <span style="font-size:11.5px;letter-spacing:.06em;color:#F7F2EA">Lecture en boucle · sans son</span>
    </div>
    <div style="position:absolute;left:0;right:0;bottom:0;height:2px;background:rgba(247,242,234,.22)"><div style="width:38%;height:100%;background:rgba(247,242,234,.75)"></div></div>`
);

// --- Variante C : même image fixe, appel à l'action en pilule --------------
let c = reId(a, 'a', 'c');
c = c.replace(
  "<b style=\"color:#26201A\">Variante A</b> — photo fixe · appel à l'action en lien souligné",
  "<b style=\"color:#26201A\">Variante C</b> — photo fixe · appel à l'action en pilule terracotta"
);
c = c.replace(
  '<a href="#c" style="color:#F7F2EA;font-size:15.5px;border-bottom:1.5px solid #C4623E;padding-bottom:3px">Faire le point sur votre vente — 3 minutes</a>',
  '<a href="#c" style="display:inline-block;background:#C4623E;color:#F7F2EA;border-radius:999px;padding:14px 30px;font-weight:500;font-size:16px">Faire le point sur votre vente — 3 minutes</a>'
);

writeFileSync('HeroB.dc.html', b);
writeFileSync('HeroC.dc.html', c);

const check = (name, src, needles) => {
  const missing = needles.filter((n) => !src.includes(n));
  console.log(missing.length ? `${name}: MANQUE ${missing.join(' | ')}` : `${name}: ok`);
};
check('HeroB', b, ['Variante B', 'vidéo drone — placeholder', 'Lecture en boucle', 'url(#bSky)']);
check('HeroC', c, ['Variante C', 'border-radius:999px;padding:14px 30px', 'url(#cSky)']);
