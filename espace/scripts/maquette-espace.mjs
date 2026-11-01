// Recopie de l'espace d'Anne dans la maquette (story 13.34, demande de JB du 2026-10-26) : démarre le site et l'espace
// sur la base locale, y range des contacts fictifs, ouvre chaque page à la largeur d'un ordinateur et l'enregistre
// en écran de maquette (.dc.html) : le rendu tel qu'il est en ligne, feuilles de style comprises, sans les scripts.
// Préalable : celui de e2e-espace.mjs (dans site/ : build et base:local ; dans espace/ : build).
// Lancer depuis espace/ : `node scripts/maquette-espace.mjs <dossier de sortie>`.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { demarrer, ICI as SITE, pause } from '../../site/scripts/serveur-essai.mjs';

const ICI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = path.resolve(process.argv[2] ?? path.join(ICI, '.verif', 'maquette'));
fs.mkdirSync(SORTIE, { recursive: true });
const LARGEUR = 1440;

const site = await demarrer({ nom: 'maquette' });
const { U: S, sql, essai: ESSAI, jetonAcces } = site;
const PORT = 8789;
const E = `http://localhost:${PORT}`;
const reglages = path.join(os.tmpdir(), `essai-${ESSAI}-maquette.vars`);
const equipe = JSON.parse(Buffer.from(jetonAcces().split('.')[1], 'base64url').toString()).iss;
fs.writeFileSync(reglages, [`ACCESS_EQUIPE=${equipe}`, 'ACCESS_AUD=essai-aud', 'LIEN_SECRET=essai', `URL_SITE=${S}`].join('\n'));
const sansProxy = Object.fromEntries(Object.entries(process.env).filter(([k]) => !/^(https?|all|no)_proxy$/i.test(k)));
const journal = path.join(os.tmpdir(), `maquette-${ESSAI}-espace.log`);
const espace = spawn('npx', ['wrangler', 'dev', '--port', String(PORT), '--env-file', reglages, '--persist-to', path.join(SITE, '.wrangler', 'state')],
  { cwd: ICI, detached: true, stdio: ['ignore', fs.openSync(journal, 'w'), fs.openSync(journal, 'a')], env: sansProxy });
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(`${E}/gestion`)).status === 403) break; } catch {}
  await pause(1000);
}

// Données fictives : noms, numéros et adresses inventés.
const q = (v) => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
const jour = (d) => { const x = new Date(); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };
const quand = (d, h = '09:00') => `${jour(d)}T${h}:00Z`;
sql('DELETE FROM contact_evenement'); sql('DELETE FROM contact'); sql('DELETE FROM prescripteur'); sql('DELETE FROM passage_boitage'); sql('DELETE FROM action_marketing');
sql(`INSERT INTO action_marketing (id, created_at, maj_le, nom, canal, debut, fin, budget_centimes, cout_centimes) VALUES
  ('01K80000000000000000000AM1', ${q(quand(-40))}, ${q(quand(-40))}, 'Boîtage Sciez-Chavannex', 'boitage', ${q(jour(-20))}, NULL, 15000, 9000),
  ('01K80000000000000000000AM2', ${q(quand(-30))}, ${q(quand(-30))}, 'Vidéo Instagram « Vendre à Thonon »', 'reseaux', ${q(jour(-30))}, ${q(jour(-2))}, 20000, 18000)`);
sql(`INSERT INTO passage_boitage (id, created_at, secteur, fait_le, mots) VALUES
  ('01K80000000000000000000PB1', ${q(quand(-20))}, 'Sciez-Chavannex', ${q(jour(-20))}, 180), ('01K80000000000000000000PB2', ${q(quand(-45))}, 'Margencel', ${q(jour(-45))}, 150)`);
sql(`INSERT INTO prescripteur (id, created_at, last_activity_at, nom, role, commune, telephone, email, dernier_contact_le, prochaine_relance_le, relance_raison) VALUES
  ('01K80000000000000000000PR1', ${q(quand(-90))}, ${q(quand(-50))}, 'Maître Claire Delorme', 'notaire', 'Thonon-les-Bains', '+33450000001', 'c.delorme@exemple.fr', ${q(jour(-50))}, ${q(jour(0))}, 'Lui montrer la vente d''Anthy'),
  ('01K80000000000000000000PR2', ${q(quand(-60))}, ${q(quand(-10))}, 'Marc Février', 'conseiller en patrimoine', 'Évian-les-Bains', '+33450000002', NULL, ${q(jour(-10))}, ${q(jour(20))}, 'Un café')`);
const contacts = [
  ['01K800000000000000000000N1', 'Sophie', 'Garnier', '+33600000101', null, 'vendeur', 'a_qualifier', 'Rappeler', jour(0), 'boitage', null, '01K80000000000000000000PB1', null, 'Sciez', null, -0.1],
  ['01K800000000000000000000N2', 'Julien', 'Perrin', '+33600000102', 'julien.perrin@exemple.fr', 'vendeur', 'a_qualifier', 'Rappeler', jour(-1), 'site', 'estimation', null, null, 'Thonon-les-Bains', null, -1],
  ['01K800000000000000000000N3', 'Laura', 'Mercier', '+33600000103', null, 'acheteur', 'a_qualifier', 'Rappeler', jour(0), 'portail', 'leboncoin', null, null, 'Genève', null, -0.2],
  ['01K800000000000000000000V1', 'Bernard', 'Roux', '+33600000104', 'b.roux@exemple.fr', 'vendeur', 'premier_rdv', "Envoyer l'estimation", jour(1), 'boitage', null, '01K80000000000000000000PB1', null, 'Sciez',
    { delai: 'Dans 6 mois', agence: 'Non', bien: 'Maison', motif: 'Succession', vend_avant: 'Sans objet' }, -2],
  ['01K800000000000000000000V2', 'Nadia', 'Lefèvre', '+33600000105', null, 'vendeur', 'estimation', "Préparer l'estimation", jour(2), 'recommandation', null, null, '01K80000000000000000000PR1', 'Évian-les-Bains',
    { delai: 'Dans 3 mois', agence: 'Oui, sans exclusivité', bien: 'Appartement', motif: 'Achète plus grand', vend_avant: 'Sans objet' }, -4],
  ['01K800000000000000000000V3', 'Thierry', 'Blanc', '+33600000106', null, 'vendeur', 'second_rdv', "Présenter l'estimation", jour(-1), 'site', 'diagnostic', null, null, 'Allinges',
    { delai: 'Ce mois-ci', agence: 'Non', bien: 'Maison', motif: 'Retraite, départ', vend_avant: 'Sans objet' }, -6],
  ['01K800000000000000000000V4', 'Hélène', 'Masson', '+33600000107', 'h.masson@exemple.fr', 'vendeur', 'mandat_exclusif', 'Photos du bien', jour(3), 'recommandation', null, null, '01K80000000000000000000PR2', 'Anthy-sur-Léman', null, -8],
  ['01K800000000000000000000A1', 'Karim', 'Benali', '+33600000108', 'karim.benali@exemple.fr', 'acheteur', 'visites', 'Proposer la maison de Margencel', jour(2), 'portail', 'leboncoin', null, null, 'Genève',
    { delai: 'Dans 3 mois', vend_avant: 'Non', types: 'Maison', pieces: 'T4, T5 et plus', surface: '120', exterieur: 'Jardin', stationnement: 'Garage', budget: '900 000 €', secteur: 'Anthy, Sciez', financement: 'Vérifié', autres: 'Vue lac' }, -3],
  ['01K800000000000000000000A2', 'Émilie', 'Vasseur', '+33600000109', null, 'acheteur', 'besoin_defini', 'Envoyer les biens du secteur', jour(5), 'site', 'contact', null, null, 'Lausanne',
    { delai: 'Dans 6 mois', vend_avant: 'Oui', types: 'Appartement', pieces: 'T3', surface: '80', exterieur: 'Terrasse', budget: '450 000 €', secteur: 'Thonon, Évian', financement: 'Après sa vente' }, -5],
  ['01K800000000000000000000S1', 'Paul', 'Girard', '+33600000110', null, 'vendeur', 'en_sommeil', null, null, 'boitage', null, '01K80000000000000000000PB2', null, 'Publier', null, -120],
  ['01K800000000000000000000P1', 'Denis', 'Moreau', '+33600000111', null, 'vendeur', 'perdu', null, null, 'site', 'estimation', null, null, 'Douvaine', null, -30],
];
for (const [id, prenom, nom, tel, email, parcours, etape, action, le, canal, detail, passage, prescripteur, commune, qualif, depuis] of contacts) {
  sql(`INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, email, parcours, etape, prochaine_action, prochaine_action_le,
      reveil_le, motif_perte, canal, origine_detail, passage_id, prescripteur_id, commune, qualification, qualifie_le, email_accord_le, email_accord_source)
    VALUES (${q(id)}, ${q(quand(Math.floor(depuis) - 6))}, ${q(quand(Math.floor(depuis), '14:30'))}, ${q(prenom)}, ${q(nom)}, ${q(tel)}, ${q(email)}, ${q(parcours)}, ${q(etape)},
      ${q(action)}, ${q(le)}, ${q(etape === 'en_sommeil' ? jour(0) : null)}, ${q(etape === 'perdu' ? 'Exclusif ailleurs' : null)}, ${q(canal)}, ${q(detail)},
      ${q(passage)}, ${q(prescripteur)}, ${q(commune)}, ${q(qualif ? JSON.stringify(qualif) : null)}, ${q(qualif ? quand(-10) : null)},
      ${q(email ? quand(-12) : null)}, ${q(email ? 'anne' : null)})`);
}
sql(`UPDATE contact SET synthese_leedflow = ${q("Maison 5 pièces à Sciez, héritée de ses parents. Veut vendre au printemps, après le partage avec son frère. A déjà reçu une agence, sans signer.")},
  synthese_leedflow_le = ${q(quand(-16))}, synthese_lue_le = ${q(quand(-1))} WHERE id IN ('01K800000000000000000000V1', '01K800000000000000000000N1')`);
const ev = (c, d, type, texte, source = 'anne') => sql(`INSERT INTO contact_evenement (contact_id, a, type, source, texte) VALUES (${q(c)}, ${q(quand(d, '10:15'))}, ${q(type)}, ${q(source)}, ${q(texte)})`);
ev('01K800000000000000000000V1', -16, 'creation', 'Contact créé : boîtage Sciez-Chavannex'); ev('01K800000000000000000000V1', -16, 'appel', 'Appel reçu, 4 min', 'leedflow'); ev('01K800000000000000000000V1', -10, 'qualification', 'Qualifié : rendez-vous');
ev('01K800000000000000000000V1', -8, 'etape', 'À qualifier → R1'); ev('01K800000000000000000000V1', -6, 'appel', 'Pas joint'); ev('01K800000000000000000000V1', -2, 'note', "Attend l'estimation avant d'en parler à son frère.");
ev('01K800000000000000000000A1', -20, 'creation', 'Contact créé : Leboncoin'); ev('01K800000000000000000000A1', -12, 'qualification', 'Qualifié : rendez-vous'); ev('01K800000000000000000000A1', -3, 'note', 'Visite de la maison d\'Anthy : trop petite.');

// Les pages, à la largeur d'un ordinateur.
const PAGES = [
  ['Aujourdhui', '/', "Aujourd'hui"], ['Contacts', '/contacts', 'Contacts'], ['Fiche-vendeur', '/contacts/fiche?id=01K800000000000000000000V1', 'Fiche d\'un vendeur'],
  ['Fiche-acheteur', '/contacts/fiche?id=01K800000000000000000000A1', 'Fiche d\'un acheteur'], ['Qualifier', '/contacts/qualifier?id=01K800000000000000000000N1', 'Qualifier'], ['Suite', '/contacts/suite?id=01K800000000000000000000V1', 'Noter la suite'],
  ['Pipeline', '/pipeline', 'Pipeline'], ['Ajouter', '/ajouter', 'Ajouter un contact'], ['Bilan', '/bilan', 'Bilan'], ['Prospection', '/actions', 'Prospection'],
  ['Campagnes', '/campagnes', 'Campagnes'], ['Prescripteurs', '/prescripteurs', 'Prescripteurs'], ['Prescripteur', '/prescripteurs/fiche?id=01K80000000000000000000PR1', 'Fiche d\'un prescripteur'],
  ['Acheteurs', '/acheteurs', 'Acheteurs'], ['A-trier', '/a-trier', 'À trier'], ['Importer', '/importer', 'Importer'], ['Demandes', '/gestion', 'Demandes du site'],
];
const VERS = Object.fromEntries(PAGES.map(([f, c]) => [c, `${f}.dc.html`]));
for (const [f, c] of PAGES) VERS[c.split('?')[0]] ??= `${f}.dc.html`;
const { chromium } = await import('../../site/node_modules/playwright/index.mjs');
const nav = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const resultats = [];
try {
  const ctx = await nav.newContext({ viewport: { width: LARGEUR, height: 900 }, extraHTTPHeaders: { 'cf-access-jwt-assertion': jetonAcces() } });
  const onglet = await ctx.newPage();
  for (const [fichier, chemin, titre] of PAGES) {
    const r = await onglet.goto(`${E}${chemin}`, { waitUntil: 'networkidle' });
    const rendu = await onglet.evaluate(() => {
      const css = [...document.styleSheets].map((f) => { try { return [...f.cssRules].map((x) => x.cssText).join('\n'); } catch { return ''; } }).join('\n');
      document.querySelectorAll('script, [data-retour-ouvrir], dialog').forEach((n) => n.remove());
      return { css, corps: document.body.innerHTML, classe: document.body.className, hauteur: document.documentElement.scrollHeight };
    });
    const css = rendu.css.replace(/@font-face\s*\{[^}]*\}/g, '').replace(/\{\{|\}\}/g, (m) => m.split('').join(' '));
    let corps = rendu.corps.replace(/\{\{/g, '{ {').replace(/\}\}/g, '} }');
    // Les liens du menu et des pages mènent à l'écran correspondant de la maquette quand il existe.
    corps = corps.replace(/href="(\/[^"]*)"/g, (m, h) => { const c = h.replace(/&amp;/g, '&'); const cible = VERS[c] ?? VERS[c.split('?')[0]]; return cible ? `href="${cible}"` : 'href="#"'; });
    const hauteur = Math.max(900, rendu.hauteur);
    fs.writeFileSync(path.join(SORTIE, `${fichier}.dc.html`), `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${titre}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gilda+Display&amp;family=Jost:ital,wght@0,400;0,500;1,400&amp;display=swap">
<style>
${css}
</style>
</helmet>
<div class="${rendu.classe}" style="width:100%;min-height:${hauteur}px">
${corps.trim()}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":${LARGEUR},"height":${hauteur}}}'>
class Component extends DCLogic {
renderVals() {
return {};
}
}
</script>
</body>
</html>
`);
    resultats.push({ fichier: `${fichier}.dc.html`, titre, statut: r.status(), hauteur });
    await onglet.screenshot({ path: path.join(SORTIE, `${fichier}.png`), fullPage: true });
  }
} finally {
  await nav.close();
  try { process.kill(-espace.pid); } catch {}
  await site.arreter?.();
}
fs.writeFileSync(path.join(SORTIE, 'pages.json'), JSON.stringify(resultats, null, 2));
console.log(resultats.map((x) => `${x.statut} ${x.fichier} ${x.hauteur}px`).join('\n'));
process.exit(resultats.every((x) => x.statut === 200) ? 0 : 1);
