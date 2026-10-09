// Maquette des e-mails aux prospects (story 10.9) : fait partir chaque e-mail du site sur le serveur local (wrangler dev,
// base locale, imitation de Resend, voir serveur-essai.mjs) et garde ce que Resend aurait reçu. Vérifie la forme des
// e-mails (HTML et texte, logo joint, aucune image distante, aucune marque Markdown restante), puis les enregistre dans
// .verif/emails/ : un fichier HTML par e-mail, une capture ordinateur et une capture téléphone, et une page qui les réunit
// (maquette.html), à relire par JB et Anne avant le branchement.
// Préalable : `npm run build` et `npm run base:local`. Lancer : `node scripts/maquette-emails.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { demarrer, ICI, pause, sid } from './serveur-essai.mjs';

const OUT = path.join(ICI, '.verif/emails');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };
const serveur = await demarrer({ nom: 'maquette' });
const { recus, sql, appeler, arreter, U, essai: ESSAI } = serveur;

const maintenant = new Date().toISOString();
const scores = (total, profil) => JSON.stringify({ total, profil, categories: {
  preparation: { brut: Math.round(total * 0.35), max: 35 }, visibilite: { brut: Math.round(total * 0.3), max: 30 }, efficacite: { brut: Math.round(total * 0.35), max: 35 } } });
// Un lead par e-mail à montrer, écrit directement en base, puis ses envois à échéance immédiate.
const cas = [
  { nom: 'contact', titre: 'Accusé de réception · contact', lead: { source: 'contact', projet: 'vente', message: 'Bonjour, nous pensons vendre notre maison à Thonon au printemps.\nPouvez-vous nous rappeler ?' }, canaux: ['confirm_prospect'] },
  { nom: 'estimation', titre: "Accusé de réception · demande d'estimation", lead: { source: 'estimation', commune_bien: 'Évian-les-Bains', type_bien: 'Maison' }, canaux: ['confirm_prospect'] },
  { nom: 'guide', titre: 'Guide demandé depuis la page Guide', lead: { source: 'guide', newsletter_opt_in_at: maintenant }, canaux: ['confirm_prospect'] },
  { nom: 'diagnostic-a', titre: 'Résultats du diagnostic · sortie A', lead: { source: 'diagnostic', orientation: 'A', scores: scores(78, 'prepare') }, canaux: ['confirm_prospect'] },
  { nom: 'diagnostic-b', titre: 'Résultats du diagnostic · sortie B (avec le guide)', lead: { source: 'diagnostic', orientation: 'B', scores: scores(41, 'risque') }, canaux: ['confirm_prospect'] },
  { nom: 'guide-resultats', titre: 'Guide demandé depuis les résultats', lead: { source: 'diagnostic', orientation: 'B', scores: scores(52, 'solide') }, canaux: ['guide'] },
  { nom: 'sequence', titre: 'Séquence', lead: { source: 'guide', newsletter_opt_in_at: maintenant }, canaux: [1, 2, 3, 4, 5, 6].map((n) => `sequence:${n}`) },
];
const q = (v) => (v == null ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);

try {
  for (const c of cas) {
    c.id = sid();
    const l = { prenom: 'Claire', nom: 'Martin', telephone: '+33612345678', ...c.lead };
    sql(`INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at, is_test,
      prenom, nom, telephone, projet, message, commune_bien, type_bien, newsletter_opt_in_at, scores, orientation)
      VALUES (${q(c.id)}, ${q(sid())}, ${q(maintenant)}, ${q(maintenant)}, 'fr', ${q(l.source)}, ${q(`claire+${c.nom}-${ESSAI}@example.com`)}, ${q(maintenant)}, 1,
      ${q(l.prenom)}, ${q(l.nom)}, ${q(l.telephone)}, ${q(l.projet)}, ${q(l.message)}, ${q(l.commune_bien)}, ${q(l.type_bien)}, ${q(l.newsletter_opt_in_at)}, ${q(l.scores)}, ${q(l.orientation)})`);
    sql(c.canaux.map((canal) => `INSERT INTO lead_delivery (lead_id, channel, due_at) VALUES (${q(c.id)}, ${q(canal)}, '2000-01-01T00:00:00.000Z')`).join('; '));
  }
  const attendus = cas.reduce((n, c) => n + c.canaux.length, 0);
  for (let i = 0; i < 4 && recus.length < attendus; i++) { await appeler(`${U}/cdn-cgi/handler/scheduled`); for (let j = 0; j < 20 && recus.length < attendus; j++) await pause(500); }
  constat(recus.length === attendus, `${recus.length} e-mails sur ${attendus} partis`);

  const emails = cas.flatMap((c) => c.canaux.map((canal) => {
    const e = recus.find((r) => r.idempotence === `${c.id}:${canal}`);
    return { nom: canal.startsWith('sequence:') ? `sequence-${canal.slice(9)}` : c.nom, titre: canal.startsWith('sequence:') ? `Séquence · e-mail ${canal.slice(9)}` : c.titre, e };
  }));
  const logo = `data:image/png;base64,${fs.readFileSync(path.join(ICI, 'src/server/email-logo.png')).toString('base64')}`;
  for (const { nom, e } of emails) {
    if (!e) { constat(false, `${nom} : e-mail reçu`); continue; }
    const pj = e.attachments?.[0];
    constat(!!e.html && !!e.text && pj?.content_id === 'logo' && e.html.includes('src="cid:logo"'), `${nom} : HTML et texte, logo joint`);
    const images = [...e.html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
    constat(images.every((s) => s.startsWith('cid:')) && !/url\(http/.test(e.html), `${nom} : aucune image ni police chargée depuis un serveur`);
    const visible = e.html.replace(/<[^>]+>/g, ' ');
    constat(!/\*\*|\]\(|^#{2,3} |\[Prénom\]/m.test(visible) && !/\*\*|\[Prénom\]/.test(e.text), `${nom} : aucune marque Markdown ni [Prénom] restante`);
    fs.writeFileSync(path.join(OUT, `${nom}.html`), e.html.replace(/cid:logo/g, logo));
    fs.writeFileSync(path.join(OUT, `${nom}.txt`), `Objet : ${e.subject}\n\n${e.text}`);
  }
  const seq = emails.filter((x) => x.nom.startsWith('sequence-')).map((x) => x.e);
  constat(seq.every((e) => e?.html.includes('/desabonnement?l=') && e.text.includes('/desabonnement?l=') && e.headers?.['List-Unsubscribe']), 'séquence : lien de désabonnement dans le HTML et le texte, en-têtes de désabonnement');
  const guide = emails.find((x) => x.nom === 'guide')?.e;
  constat(!!guide && /<a href="[^"]*\/api\/guide\/telecharger\?l=[^"]+"[^>]*>Télécharger le guide<\/a>/.test(guide.html) && guide.text.includes('/api/guide/telecharger?l='), 'guide : bouton « Télécharger le guide » et lien dans le texte');

  // Captures ordinateur et téléphone, puis la page de maquette qui les réunit.
  const navigateur = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [largeur, suffixe] of [[1280, 'ordinateur'], [390, 'telephone']]) {
    const page = await navigateur.newPage({ viewport: { width: largeur, height: 900 } });
    for (const { nom } of emails) {
      await page.goto(`file://${path.join(OUT, `${nom}.html`)}`);
      const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      if (suffixe === 'telephone') constat(!deborde, `${nom} sur téléphone : pas de défilement horizontal`);
      await page.screenshot({ path: path.join(OUT, `${nom}-${suffixe}.png`), fullPage: true });
    }
    await page.close();
  }
  await navigateur.close();
  fs.writeFileSync(path.join(OUT, 'liste.json'), JSON.stringify(emails.map(({ nom, titre, e }) => ({ nom, titre, objet: e?.subject ?? '', html: fs.readFileSync(path.join(OUT, `${nom}.html`), 'utf8'), texte: e?.text ?? '' }))));
  console.log(`\nFichiers dans ${path.relative(ICI, OUT)}/ (${emails.length} e-mails).`);
} finally {
  arreter();
}
console.log(echecs ? `\n${echecs} constat(s) en échec` : '\nTous les constats sont bons');
process.exit(echecs ? 1 : 0);
