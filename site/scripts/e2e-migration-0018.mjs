// Répétition de la migration 0018 (story 18.2, AD-23 ; revue de code 18.2) sur une base locale neuve, sans toucher à la
// base locale des autres essais : 0001 à 0017 appliquées, puis la base remplie de données d'essai fictives dans chaque
// table qui référence `contact` (contacts de tous les cas : parcours inconnu à une étape avancée, en sommeil, perdus,
// vendus, actes signés, avec action marketing, synthèse, accord e-mail ; événements, tâches et liens Leedflow,
// destinataires de campagne, demandes rattachées, numéros classés). Comptes et empreintes de chaque table avant et après
// 0018 : une seule ligne perdue ou changée fait échouer l'essai. Vérifie aussi la reprise (projet, température,
// catégorie), la relance après un arrêt à mi-chemin (copie `_sauve_*` laissée par un essai interrompu) et la garde de
// construction de l'espace (espace/scripts/migrations-a-jour.mjs).
// Lancer depuis site/ : `node scripts/e2e-migration-0018.mjs` (aucun préalable).
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIG = path.join(ICI, 'migrations');
const DOSSIER = fs.mkdtempSync(path.join(os.tmpdir(), 'essai-0018-'));
const ETAT = path.join(DOSSIER, 'etat');
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };

const wrangler = (args) => execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--persist-to', ETAT, '--json', ...args],
  { cwd: ICI, encoding: 'utf8', env: { ...process.env, CI: 'true' }, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
const fichier = (f) => wrangler(['--file', f]);
const sql = (q) => JSON.parse(wrangler(['--command', q]))[0].results;
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);

// 1. Base 0001 à 0017.
const avant18 = fs.readdirSync(MIG).filter((f) => /^\d{4}-.*\.sql$/.test(f) && f < '0018').sort();
const tout = path.join(DOSSIER, '0001-0017.sql');
fs.writeFileSync(tout, avant18.map((f) => fs.readFileSync(path.join(MIG, f), 'utf8')).join('\n;\n'));
fichier(tout);
constat(avant18.length === 17, `base neuve : ${avant18.length} migrations appliquées (0001 à 0017)`);

// 2. Données d'essai, toutes fictives (exemple.invalid, numéros +336990…).
const ETAPES = ['a_qualifier', 'premier_rdv', 'estimation', 'second_rdv', 'mandat_exclusif', 'en_vente', 'vendu', 'besoin_defini',
  'mandat_recherche', 'visites', 'offre_acceptee', 'acte_signe', 'en_sommeil', 'perdu'];
const CANAUX = ['boitage', 'recommandation', 'evenement', 'site', 'portail', 'reseaux', 'rencontre', 'autre'];
const lignes = [];
lignes.push(`INSERT INTO passage_boitage (id, created_at, secteur, fait_le, mots, cout_centimes) VALUES ('PB1', '2026-09-01T08:00:00Z', 'Sciez', '2026-09-01', 300, 4500)`);
lignes.push(`INSERT INTO prescripteur (id, created_at, last_activity_at, nom, role) VALUES ('PR1', '2026-09-01T08:00:00Z', '2026-09-01T08:00:00Z', 'Maître Fictif', 'notaire')`);
lignes.push(`INSERT INTO action_marketing (id, created_at, maj_le, nom, canal, debut) VALUES ('AM1', '2026-09-01T08:00:00Z', '2026-09-01T08:00:00Z', 'Essai salon', 'evenement', '2026-09-01')`);
lignes.push(`INSERT INTO campagne (id, created_at, maj_le, nom, statut) VALUES ('CA1', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Lettre d''essai', 'envoyee')`);
const contacts = [];
let n = 0;
for (const etape of ETAPES) {
  for (const parcours of [null, 'vendeur', 'acheteur']) {
    n++;
    const id = `C${String(n).padStart(3, '0')}`;
    const c = {
      id, created_at: `2026-0${1 + (n % 9)}-1${n % 10}T08:00:00Z`, last_activity_at: `2026-10-${String(1 + (n % 28)).padStart(2, '0')}T09:00:00Z`,
      prenom: n % 5 ? `Prénom${n}` : null, nom: `Fictif${n}`, telephone: n % 4 ? `+3369900${String(n).padStart(4, '0')}` : null,
      email: n % 3 ? `essai${n}@exemple.invalid` : null, parcours, etape,
      prochaine_action: ['vendu', 'acte_signe', 'perdu'].includes(etape) ? null : 'Rappeler',
      prochaine_action_le: ['vendu', 'acte_signe', 'perdu'].includes(etape) ? null : '2026-11-05',
      reveil_le: etape === 'en_sommeil' ? '2027-03-01' : null, motif_perte: etape === 'perdu' ? 'Prix' : null,
      canal: CANAUX[n % CANAUX.length], origine_detail: n % 2 ? 'détail' : null,
      passage_id: CANAUX[n % CANAUX.length] === 'boitage' ? 'PB1' : null, prescripteur_id: CANAUX[n % CANAUX.length] === 'recommandation' ? 'PR1' : null,
      bien_ref: n % 7 ? null : 'REF-1', commune: n % 2 ? 'Sciez' : 'Anthy', qualification: n % 6 ? null : '{"delai":"3 mois"}', qualifie_le: n % 6 ? null : '2026-10-02',
      rappel_individuel_seul: n % 8 ? 0 : 1, is_test: n % 9 ? 0 : 1, action_id: CANAUX[n % CANAUX.length] === 'evenement' ? 'AM1' : null,
      synthese_leedflow: n % 5 ? null : '## Synthèse', synthese_leedflow_le: n % 5 ? null : '2026-10-03T08:00:00Z', synthese_lue_le: n % 5 ? null : '2026-10-04T08:00:00Z',
      synthese: n % 10 ? null : "Version d'Anne", synthese_le: n % 10 ? null : '2026-10-05T08:00:00Z',
      email_accord_le: n % 3 && n % 2 ? '2026-10-06T08:00:00Z' : null, email_accord_source: n % 3 && n % 2 ? (n % 4 ? 'anne' : 'import') : null,
      email_desinscrit_le: n % 11 ? null : '2026-10-07T08:00:00Z',
    };
    contacts.push(c);
    const cols = Object.keys(c);
    lignes.push(`INSERT INTO contact (${cols.join(', ')}) VALUES (${cols.map((k) => q(c[k])).join(', ')})`);
    for (let k = 0; k < 1 + (n % 3); k++) {
      lignes.push(`INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees, par) VALUES ('${id}', '2026-10-1${k}T08:00:00Z',
        '${['creation', 'note', 'appel', 'etape'][k % 4]}', '${['anne', 'site', 'leedflow'][k % 3]}', ${k === 1 ? `'src-${id}'` : 'NULL'}, 'Texte ${k}', '{"k":${k}}', 'anne@exemple.invalid')`);
    }
    if (n % 4 === 0) {
      lignes.push(`INSERT INTO leedflow_tache (id, contact_id, a, texte, echeance, statut) VALUES ('T${id}', '${id}', '2026-10-20T08:00:00Z', 'Rappeler', '2026-11-02', '${['proposee', 'acceptee', 'ignoree'][n % 3]}')`);
      lignes.push(`INSERT INTO leedflow_lien (leedflow_contact, contact_id) VALUES ('LF${id}', '${id}')`);
    }
    if (c.email && n % 2) lignes.push(`INSERT INTO campagne_destinataire (campagne_id, contact_id, email, prenom, statut, prochain_essai) VALUES ('CA1', '${id}', '${c.email}', ${q(c.prenom)}, 'envoye', '2026-10-01T08:00:00Z')`);
    if (c.email && n % 3 === 1) {
      lignes.push(`INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at, contact_id)
        VALUES ('L${id}', 'sub-${id}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'fr', 'contact', '${c.email}', '2026-10-01T08:00:00Z', '${id}')`);
    }
  }
}
lignes.push(`INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at) VALUES ('LSANS', 'sub-sans', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'fr', 'guide', 'sans@exemple.invalid', '2026-10-01T08:00:00Z')`);
lignes.push(`INSERT INTO leedflow_ecarte (telephone, a, par, categorie) VALUES ('+33699100001', '2026-10-01T08:00:00Z', 'anne', 'prive'), ('+33699100002', '2026-10-01T08:00:00Z', 'anne', 'pro'), ('+33699100003', '2026-10-01T08:00:00Z', 'anne', 'demarchage')`);
lignes.push(`INSERT INTO leedflow_inconnu (source_id, telephone, a, texte, donnees) VALUES ('appel:i1', '+33699100009', '2026-10-30T08:00:00Z', 'Appel', '{}'), ('tache:i2', '+33699100009', '2026-10-30T08:00:00Z', 'Tâche', '{"tache":"x"}')`);
const donnees = path.join(DOSSIER, 'donnees.sql');
fs.writeFileSync(donnees, lignes.join(';\n') + ';\n');
fichier(donnees);

// 3. Comptes et empreintes avant.
const TABLES = {
  contact_evenement: 'id, contact_id, a, type, source, source_id, texte, donnees, par',
  leedflow_tache: 'id, contact_id, a, texte, echeance, statut, decide_le, par',
  leedflow_lien: 'leedflow_contact, contact_id',
  campagne_destinataire: 'campagne_id, contact_id, email, prenom, statut, essais, prochain_essai, envoye_le, erreur',
  lead: 'id, contact_id, email, source',
  leedflow_ecarte: 'telephone, a, par, categorie',
  leedflow_inconnu: 'source_id, telephone, a, texte, donnees',
  campagne: 'id, nom, statut', action_marketing: 'id, nom, canal', prescripteur: 'id, nom', passage_boitage: 'id, secteur',
  contact: Object.keys(contacts[0]).join(', '),
};
const empreinte = (table, cols) => {
  const r = sql(`SELECT ${cols} FROM ${table} ORDER BY 1, 2`);
  return { n: r.length, h: createHash('sha256').update(JSON.stringify(r)).digest('hex').slice(0, 16) };
};
const avant = Object.fromEntries(Object.entries(TABLES).map(([t, c]) => [t, empreinte(t, c)]));
const seqAvant = sql(`SELECT seq FROM sqlite_sequence WHERE name = 'contact_evenement'`)[0]?.seq;

// 4. Un essai précédent arrêté à mi-chemin a laissé une copie : la relance ne doit pas buter dessus.
sql(`CREATE TABLE _sauve_contact_evenement AS SELECT * FROM contact_evenement WHERE 0`);
let erreur18 = null;
try { fichier(path.join(MIG, '0018-carnet.sql')); } catch (e) { erreur18 = `${e.stdout ?? ''}${e.stderr ?? ''}`.slice(-400); }
constat(!erreur18, `0018 appliquée sans erreur, malgré une copie _sauve_* laissée par un arrêt à mi-chemin${erreur18 ? ` : ${erreur18}` : ''}`);

// 5. Rien de perdu ni de changé.
const apres = Object.fromEntries(Object.entries(TABLES).map(([t, c]) => [t, empreinte(t, c)]));
for (const t of Object.keys(TABLES)) {
  constat(avant[t].n === apres[t].n && avant[t].h === apres[t].h, `${t} : ${avant[t].n} lignes avant, ${apres[t].n} après, empreinte ${avant[t].h === apres[t].h ? 'identique' : `différente (${avant[t].h} → ${apres[t].h})`}`);
}
const rattachees = sql('SELECT count(*) AS n FROM lead WHERE contact_id IS NOT NULL')[0].n;
constat(rattachees === contacts.filter((c, i) => c.email && (i + 1) % 3 === 1).length, `demandes du site rattachées : ${rattachees}, mêmes contacts`);
const seqApres = sql(`SELECT seq FROM sqlite_sequence WHERE name = 'contact_evenement'`)[0]?.seq;
constat(seqApres === seqAvant, `compteur des événements repris (${seqAvant} → ${seqApres})`);

// 6. Reprise : projet, température, catégorie, source.
const attendu = (c) => {
  const projet = c.parcours ?? 'a_qualifier';
  const temperature = !c.parcours ? null : ['vendu', 'acte_signe'].includes(c.etape) ? 'termine' : ['perdu', 'en_sommeil'].includes(c.etape) ? null : 'avec_anne';
  return `${c.id}|${projet}|${temperature}|demandes_recues|1|espace|null`;
};
const reprise = sql(`SELECT c.id, c.projet, c.temperature, c.categorie_id, c.verifie_le IS NOT NULL AS verifie, s.source, c.suivi_le
  FROM contact c LEFT JOIN contact_source s ON s.contact_id = c.id ORDER BY c.id`).map((r) => `${r.id}|${r.projet}|${r.temperature}|${r.categorie_id}|${r.verifie}|${r.source}|${r.suivi_le}`);
const faux = reprise.filter((r, i) => r !== attendu(contacts[i]));
constat(reprise.length === contacts.length && faux.length === 0, `reprise des ${contacts.length} contacts : projet tiré du parcours, température selon AD-24, « Demandes reçues » vérifiée, source « espace »${faux.length ? ` ; écarts : ${faux.slice(0, 3).join(' ; ')}` : ''}`);

// 7. Intégrité.
constat(sql('PRAGMA foreign_key_check').length === 0, 'aucune clé étrangère orpheline (PRAGMA foreign_key_check)');
constat(sql(`SELECT count(*) AS n FROM sqlite_master WHERE name LIKE '\\_sauve\\_%' ESCAPE '\\'`)[0].n === 0, 'aucune table _sauve_* restante');
const idx = sql(`SELECT name FROM sqlite_master WHERE tbl_name = 'contact' AND type IN ('index', 'trigger') AND name NOT LIKE 'sqlite_%'`).map((r) => r.name).sort();
constat(idx.length === 8, `index et déclencheur de contact recréés (${idx.join(', ')})`);

// 8. Garde de construction de l'espace : une migration manquante arrête la construction (attente courte pour l'essai),
// une base à jour la laisse passer.
const garde = (etat) => spawnSync('node', [path.join(ICI, '..', 'espace', 'scripts', 'migrations-a-jour.mjs'), '--essai', etat],
  { cwd: path.join(ICI, '..', 'espace'), encoding: 'utf8', env: { ...process.env, MIGRATIONS_ATTENTE_S: '15', MIGRATIONS_PAS_S: '1' } });
const vide = path.join(DOSSIER, 'vide');
const g1 = garde(vide);
constat(g1.status === 1 && /toujours pas appliquée/.test(g1.stderr) && /en attente/.test(g1.stdout), 'garde de construction : migrations manquantes, nouvel essai puis arrêt (code 1)');
execFileSync('npx', ['wrangler', 'd1', 'migrations', 'apply', 'DB', '--local', '--persist-to', vide], { cwd: ICI, env: { ...process.env, CI: 'true' }, stdio: 'ignore' });
const g2 = garde(vide);
constat(g2.status === 0 && /toutes les migrations/.test(g2.stdout), 'garde de construction : base à jour, la construction continue (code 0)');

fs.rmSync(DOSSIER, { recursive: true, force: true });
console.log(echecs ? `\n${echecs} échec(s).` : '\nTout est bon.');
process.exit(echecs ? 1 : 0);
