// Contrôle automatique des écrans (story 8.2) : sert dist/ en local et, pour chaque page et chaque largeur,
// signale un défilement horizontal, un élément qui sort à droite, ou une cible tactile de moins de 44 px sur téléphone.
//   npm run build && node scripts/ecrans.mjs                 → 390, 900, 1024, 1280, 1440 px
//   W=900,1100,1360 node scripts/ecrans.mjs                  → largeurs choisies
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import fs from 'node:fs'; import path from 'node:path';
import { fileURLToPath } from 'node:url';
const DIST=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const T={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.woff2':'font/woff2','.mp4':'video/mp4','.webm':'video/webm'};
const s=createServer((q,r)=>{let p=decodeURIComponent(new URL(q.url,'http://x').pathname);let f=path.join(DIST,p);if(fs.existsSync(f+'.html'))f+='.html';else if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!fs.existsSync(f)){f=path.join(DIST,'404.html');r.statusCode=404}r.setHeader('Content-Type',T[path.extname(f)]??'application/octet-stream');fs.createReadStream(f).pipe(r)});
await new Promise(o=>s.listen(4398,o));
const pages=['/','/en','/a-propos','/vendre','/acheter','/contact','/guide','/realisation','/en/track-record','/realisation/appartement-cascade-2024','/diagnostic','/diagnostic/questions','/diagnostic/resultats','/mentions-legales','/confidentialite','/cookies','/404'];
const stories=fs.readdirSync(DIST+'/realisation').filter(f=>f.endsWith('.html')).map(f=>'/realisation/'+f.replace('.html',''));
const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH ?? (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined)});
for (const w of (process.env.W||"390,900,1024,1280,1440").split(",").map(Number)) for (const v of [...new Set([...pages,...stories])]) {
  const p=await b.newPage({viewport:{width:w,height:w<900?844:900}}); await p.goto('http://localhost:4398'+v,{waitUntil:'load'}); await p.evaluate(()=>document.fonts.ready); await p.waitForTimeout(150);
  const r=await p.evaluate((w)=>{const out=[];const de=document.documentElement;if(de.scrollWidth>w+1)out.push('défilement horizontal '+de.scrollWidth);
    for(const el of document.querySelectorAll('body *')){const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||el.closest('[hidden],.menu-mobile,svg,[aria-hidden=true],.sr-only'))continue;const b=el.getBoundingClientRect();if(b.width===0)continue;
      if(b.right>w+1&&!el.closest('[data-pile],.pile')){let anc=el.parentElement,clip=false;while(anc&&anc!==document.body){const o=getComputedStyle(anc).overflowX;if(o==='hidden'||o==='clip'||o==='auto'||o==='scroll'){clip=true;break}anc=anc.parentElement}if(!clip)out.push('déborde à droite: '+el.tagName.toLowerCase()+'.'+[...el.classList].join('.')+' ('+Math.round(b.right)+')')}
      if(w<900&&el.matches('.btn,button,input,select,textarea')&&b.height<44&&!el.matches('[type=radio],[type=checkbox]'))out.push('cible petite: '+el.tagName.toLowerCase()+'.'+[...el.classList].join('.')+' '+Math.round(b.height)+'px');
      if(el.scrollWidth>el.clientWidth+1&&cs.overflowX==='hidden'&&el.children.length===0&&el.textContent.trim())out.push('texte coupé: '+el.tagName.toLowerCase()+'.'+[...el.classList].join('.'));
    }return [...new Set(out)].slice(0,8)},w);
  if(r.length)console.log(w,v,'\n  '+r.join('\n  '));
  await p.close();
}
await b.close(); s.close(); console.log('Contrôle des écrans terminé.');
