// Répétition de la migration 0025 (story 18.21, tickets n° 264 à 266 : projet « aucun », canal « pige », colonne
// `ambassadeur_partant_le`) sur une base locale neuve, sans toucher à la base locale des autres essais : 0001 à 0024
// appliquées, puis des données d'essai fictives dans `contact` (colonnes `r1_le` et `r2_le` de 0024 comprises) et dans chaque
// table qui la référence (événements, tâches et liens Leedflow, destinataires de campagne, coordonnées, sources avec lieu et
// mois de 0021, cartes « Nouveaux », numéros classés rattachés, demandes du site, e-mails de portail). La migration reconstruit
// `contact` : comptes et empreintes de chaque table avant et après, index et déclencheur comparés dans `sqlite_master`, clés
// étrangères vérifiées, puis `aucun` accepté (sans température), `pige` accepté comme canal, la nouvelle colonne acceptée
// (dates seulement), et les règles existantes toujours tenues. Vérifie aussi la relance après un arrêt à mi-chemin (copie
// `_sauve_*` laissée). Lancer depuis site/ : `node scripts/e2e-migration-0025.mjs` (aucun préalable).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIG = path.join(ICI, 'migrations');
const DOSSIER = fs.mkdtempSync(path.join(os.tmpdir(), 'essai-0025-'));
const ETAT = path.join(DOSSIER, 'etat');
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };

const wrangler = (args) => execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--persist-to', ETAT, '--json', ...args],
  { cwd: ICI, encoding: 'utf8', env: { ...process.env, CI: 'true' }, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
const fichier = (f) => wrangler(['--file', f]);
const sql = (q) => JSON.parse(wrangler(['--command', q]))[0].results;
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
/** Une écriture est-elle refusée par la base (CHECK) ? */
const refusee = (requete) => { try { sql(requete); return false; } catch { return true; } };

// 1. Base 0001 à 0024.
const avant25 = fs.readdirSync(MIG).filter((f) => /^\d{4}-.*\.sql$/.test(f) && f < '0025').sort();
const tout = path.join(DOSSIER, '0001-0024.sql');
fs.writeFileSync(tout, avant25.map((f) => fs.readFileSync(path.join(MIG, f), 'utf8')).join('\n;\n'));
fichier(tout);
constat(avant25.length === 24, `base neuve : ${avant25.length} migrations appliquées (0001 à 0024)`);

// 2. Données d'essai, toutes fictives (exemple.invalid, numéros +336990…).
const COMBOS = [ // [projet, température, parcours, étape]
  ['a_qualifier', null, null, null], ['a_qualifier', null, null, 'a_qualifier'], ['vendeur', 'chaud', 'vendeur', null],
  ['vendeur', 'en_vente', 'vendeur', null], ['vendeur', 'avec_anne', 'vendeur', 'estimation'], ['vendeur', 'termine', 'vendeur', 'vendu'],
  ['acheteur', 'recherche_active', 'acheteur', null], ['acheteur', 'tiede', 'acheteur', null], ['acheteur', 'avec_anne', 'acheteur', 'visites'],
  ['vendeur_acheteur', 'en_vente', 'vendeur', null], ['vendeur_acheteur', 'froid', null, null], ['ambassadeur', null, null, null],
  ['a_qualifier', null, null, 'en_sommeil'], ['a_qualifier', null, null, 'perdu'],
];
const lignes = [];
lignes.push(`INSERT INTO passage_boitage (id, created_at, secteur, fait_le, mots, cout_centimes) VALUES ('PB1', '2026-09-01T08:00:00Z', 'Sciez', '2026-09-01', 300, 4500)`);
lignes.push(`INSERT INTO prescripteur (id, created_at, last_activity_at, nom, role) VALUES ('PR1', '2026-09-01T08:00:00Z', '2026-09-01T08:00:00Z', 'Maître Fictif', 'notaire')`);
lignes.push(`INSERT INTO action_marketing (id, created_at, maj_le, nom, canal, debut) VALUES ('AM1', '2026-09-01T08:00:00Z', '2026-09-01T08:00:00Z', 'Essai salon', 'evenement', '2026-09-01')`);
lignes.push(`INSERT INTO campagne (id, created_at, maj_le, nom, statut) VALUES ('CA1', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'Lettre d''essai', 'envoyee')`);
lignes.push(`INSERT INTO import_lot (id, fichier, source, a) VALUES ('IL1', 'essai.csv', 'telephone', '2026-10-01T08:00:00Z')`);
const contacts = [];
COMBOS.forEach(([projet, temperature, parcours, etape], i) => {
  const n = i + 1, id = `C${String(n).padStart(3, '0')}`;
  const sansDate = !etape || ['vendu', 'acte_signe', 'perdu', 'en_sommeil'].includes(etape);
  const c = {
    id, created_at: `2026-0${1 + (n % 9)}-1${n % 10}T08:00:00Z`, last_activity_at: `2026-10-${String(1 + n).padStart(2, '0')}T09:00:00Z`,
    prenom: n % 5 ? `Prénom${n}` : null, nom: `Fictif${n}`, telephone: n % 4 ? `+3369900${String(n).padStart(4, '0')}` : null,
    email: n % 3 ? `essai${n}@exemple.invalid` : null, parcours, etape,
    prochaine_action: sansDate ? null : 'Rappeler', prochaine_action_le: sansDate ? null : '2026-11-05',
    reveil_le: etape === 'en_sommeil' ? '2027-03-01' : null, motif_perte: etape === 'perdu' ? 'Prix' : null,
    canal: n % 3 === 0 ? null : ['boitage', 'recommandation', 'evenement', 'site', 'portail', 'reseaux', 'rencontre', 'autre'][n % 8], origine_detail: n % 2 ? 'détail' : null,
    passage_id: n % 3 && n % 4 === 0 ? 'PB1' : null, prescripteur_id: n % 3 && n % 4 === 1 ? 'PR1' : null,
    bien_ref: n % 7 ? null : 'REF-1', commune: n % 2 ? 'Sciez' : 'Anthy', qualification: n % 6 ? null : '{"delai":"3 mois"}', qualifie_le: n % 6 ? null : '2026-10-02',
    rappel_individuel_seul: n % 8 ? 0 : 1, is_test: n % 9 ? 0 : 1, action_id: n % 3 && n % 4 === 2 ? 'AM1' : null,
    synthese_leedflow: n % 5 ? null : '## Synthèse', synthese_leedflow_le: n % 5 ? null : '2026-10-03T08:00:00Z', synthese_lue_le: n % 5 ? null : '2026-10-04T08:00:00Z',
    synthese: n % 10 ? null : "Version d'Anne", synthese_le: n % 10 ? null : '2026-10-05T08:00:00Z',
    email_accord_le: n % 3 && n % 2 ? '2026-10-06T08:00:00Z' : null, email_accord_source: n % 3 && n % 2 ? (n % 4 ? 'anne' : 'import') : null,
    email_desinscrit_le: n % 11 ? null : '2026-10-07T08:00:00Z',
    projet, temperature, categorie_id: ['anciens_clients', 'proches', 'edb', 'partenaires', 'lointains', 'demandes_recues'][n % 6],
    entreprise: n % 2 ? 'Société Fictive' : null, verifie_le: n % 2 ? '2026-10-08T08:00:00Z' : null, ecarte_le: n === 13 ? '2026-10-09T08:00:00Z' : null,
    dernier_contact_le: n % 3 ? '2026-10-10T08:00:00Z' : null, dernier_contact_canal: n % 3 ? 'appel' : null, appel_autorise: n % 4 === 0 ? 1 : n % 4 === 1 ? 0 : null,
    a_rappeler_le: n % 5 ? null : '2026-12-01',
    ambassadeur_inscrit_le: projet === 'ambassadeur' ? '2026-10-11T08:00:00Z' : null, ambassadeur_reglement: projet === 'ambassadeur' ? 'v1' : null,
    suivi_le: n % 6 ? null : '2026-10-12T08:00:00Z',
    r1_le: n % 2 ? '2026-10-20' : null, r2_le: n % 4 === 1 ? '2026-10-27' : null,
  };
  if (!c.telephone && !c.email) c.telephone = `+3369901${String(n).padStart(4, '0')}`;
  contacts.push(c);
  const cols = Object.keys(c);
  lignes.push(`INSERT INTO contact (${cols.join(', ')}) VALUES (${cols.map((k) => q(c[k])).join(', ')})`);
  for (let k = 0; k < 1 + (n % 3); k++) {
    lignes.push(`INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees, par) VALUES ('${id}', '2026-10-1${k}T08:00:00Z',
      '${['creation', 'note', 'appel', 'seance'][k % 4]}', '${['anne', 'site', 'leedflow', 'claude'][k % 4]}', ${k === 1 ? `'src-${id}'` : 'NULL'}, 'Texte ${k}', '{"k":${k}}', 'anne@exemple.invalid')`);
  }
  if (n % 3 === 0) {
    lignes.push(`INSERT INTO leedflow_tache (id, contact_id, a, texte, echeance, statut) VALUES ('T${id}', '${id}', '2026-10-20T08:00:00Z', 'Rappeler', '2026-11-02', '${['proposee', 'acceptee', 'ignoree'][n % 3]}')`);
    lignes.push(`INSERT INTO leedflow_lien (leedflow_contact, contact_id) VALUES ('LF${id}', '${id}')`);
    lignes.push(`INSERT INTO leedflow_ecarte (telephone, a, par, categorie, contact_id) VALUES ('+3369920${String(n).padStart(4, '0')}', '2026-10-01T08:00:00Z', 'anne', 'prospect', '${id}')`);
  }
  if (c.email && n % 2) lignes.push(`INSERT INTO campagne_destinataire (campagne_id, contact_id, email, prenom, statut, prochain_essai) VALUES ('CA1', '${id}', '${c.email}', ${q(c.prenom)}, 'envoye', '2026-10-01T08:00:00Z')`);
  if (c.email && n % 3 === 1) {
    lignes.push(`INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at, contact_id)
      VALUES ('L${id}', 'sub-${id}', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'fr', 'contact', '${c.email}', '2026-10-01T08:00:00Z', '${id}')`);
  }
  lignes.push(`INSERT INTO contact_coordonnee (contact_id, type, reseau, valeur, ajoute_le) VALUES ('${id}', 'profil', 'linkedin', 'https://exemple.invalid/in/${id}', '2026-10-01T08:00:00Z')`);
  lignes.push(`INSERT INTO contact_source (contact_id, source, import_lot_id, a, lieu, mois) VALUES ('${id}', '${n % 2 ? 'telephone' : 'edb'}', ${n % 2 ? "'IL1'" : 'NULL'}, '2026-10-01T08:00:00Z', ${n % 3 ? "'Publier'" : 'NULL'}, ${n % 3 ? "'2024-12'" : 'NULL'})`);
  if (n % 4 === 1) {
    lignes.push(`INSERT INTO nouveau (id, source, recu_le, contact_id, evenement_id) VALUES ('N${id}', 'site', '2026-10-15T08:00:00Z', '${id}', (SELECT min(id) FROM contact_evenement WHERE contact_id = '${id}'))`);
  }
  if (n % 5 === 2) {
    lignes.push(`INSERT INTO portail_courriel (id, recu_le, message_id, portail, etat, contact_id) VALUES ('PC${id}', '2026-10-16T08:00:00Z', 'm-${id}', 'seloger', 'lu', '${id}')`);
    lignes.push(`INSERT INTO nouveau (id, source, recu_le, contact_id, portail_courriel_id) VALUES ('NP${id}', 'portail', '2026-10-16T08:00:00Z', '${id}', 'PC${id}')`);
  }
});
// Sans contact : ne doivent pas bouger.
lignes.push(`INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at) VALUES ('LSANS', 'sub-sans', '2026-10-01T08:00:00Z', '2026-10-01T08:00:00Z', 'fr', 'guide', 'sans@exemple.invalid', '2026-10-01T08:00:00Z')`);
lignes.push(`INSERT INTO leedflow_ecarte (telephone, a, par, categorie) VALUES ('+33699100001', '2026-10-01T08:00:00Z', 'anne', 'prive')`);
lignes.push(`INSERT INTO leedflow_inconnu (source_id, telephone, a, texte, donnees) VALUES ('appel:i1', '+33699100009', '2026-10-30T08:00:00Z', 'Appel', '{}')`);
lignes.push(`INSERT INTO portail_courriel (id, recu_le, message_id, portail, etat, expediteur, sujet, texte) VALUES ('PCSANS', '2026-10-16T08:00:00Z', 'm-sans', 'autre', 'illisible', 'x@exemple.invalid', 'Sujet', 'Texte')`);
lignes.push(`INSERT INTO nouveau (id, source, recu_le, leedflow_inconnu_id, portail_courriel_id) VALUES ('NSANS', 'leedflow', '2026-10-17T08:00:00Z', 'appel:i1', NULL)`);
const donnees = path.join(DOSSIER, 'donnees.sql');
fs.writeFileSync(donnees, lignes.join(';\n') + ';\n');
fichier(donnees);

// 3. Comptes et empreintes avant ; schéma (hors table contact elle-même) avant.
const TABLES = {
  contact_evenement: 'id, contact_id, a, type, source, source_id, texte, donnees, par',
  leedflow_tache: 'id, contact_id, a, texte, echeance, statut, decide_le, par',
  leedflow_lien: 'leedflow_contact, contact_id',
  campagne_destinataire: 'campagne_id, contact_id, email, prenom, statut, essais, prochain_essai, envoye_le, erreur',
  contact_coordonnee: 'id, contact_id, type, reseau, valeur, ajoute_le',
  contact_source: 'id, contact_id, source, import_lot_id, a, lieu, mois',
  nouveau: 'id, source, recu_le, contact_id, leedflow_inconnu_id, evenement_id, vu_le, issue, portail_courriel_id',
  lead: 'id, contact_id, email, source',
  portail_courriel: 'id, contact_id, message_id, etat, expediteur, sujet, texte',
  leedflow_ecarte: 'telephone, a, par, categorie, contact_id',
  leedflow_inconnu: 'source_id, telephone, a, texte, donnees',
  campagne: 'id, nom, statut', action_marketing: 'id, nom, canal', prescripteur: 'id, nom', passage_boitage: 'id, secteur', import_lot: 'id, fichier',
  categorie: 'id, nom', vue: 'id, nom, filtre',
  contact: Object.keys(contacts[0]).join(', '),
};
const empreinte = (table, cols) => {
  const r = sql(`SELECT ${cols} FROM ${table} ORDER BY 1, 2`);
  return { n: r.length, h: createHash('sha256').update(JSON.stringify(r)).digest('hex').slice(0, 16) };
};
const avant = Object.fromEntries(Object.entries(TABLES).map(([t, c]) => [t, empreinte(t, c)]));
const schema = () => sql(`SELECT type, name, tbl_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY type, name`);
const seq = () => JSON.stringify(sql(`SELECT name, seq FROM sqlite_sequence ORDER BY name`));
const schemaAvant = schema(), seqAvant = seq();
const schemaCols = sql(`PRAGMA table_info(contact)`).map((c) => c.name);
constat(avant.contact.n === COMBOS.length && avant.nouveau.n > 0 && avant.lead.n > 1 && avant.portail_courriel.n > 1, `données d'essai : ${avant.contact.n} contacts, ${avant.nouveau.n} cartes « Nouveaux », ${avant.contact_evenement.n} événements`);
constat(refusee(`INSERT INTO contact (id, created_at, last_activity_at, nom, projet) VALUES ('X1', 'a', 'a', 'Essai', 'aucun')`), 'avant 0025 : projet « aucun » refusé (la migration est nécessaire)');
constat(refusee(`INSERT INTO contact (id, created_at, last_activity_at, nom, canal) VALUES ('X2', 'a', 'a', 'Essai', 'pige')`), 'avant 0025 : canal « pige » refusé');
constat(refusee(`UPDATE contact SET ambassadeur_partant_le = '2026-11-01' WHERE id = 'C001'`), 'avant 0025 : la colonne ambassadeur_partant_le n\'existe pas');

// 4. Un essai précédent arrêté à mi-chemin a laissé des copies : la relance ne doit pas buter dessus.
sql(`CREATE TABLE _sauve_contact_evenement AS SELECT * FROM contact_evenement WHERE 0`);
sql(`CREATE TABLE contact_neuf (x TEXT)`);
let erreur = null;
try { fichier(path.join(MIG, '0025-contacts-source-projet-aucun.sql')); } catch (e) { erreur = `${e.stdout ?? ''}${e.stderr ?? ''}`.slice(-600); }
constat(!erreur, `0025 appliquée sans erreur, malgré des copies laissées par un arrêt à mi-chemin${erreur ? ` : ${erreur}` : ''}`);

// 5. Rien de perdu ni de changé.
const apres = Object.fromEntries(Object.entries(TABLES).map(([t, c]) => [t, empreinte(t, c)]));
for (const t of Object.keys(TABLES)) {
  constat(avant[t].n === apres[t].n && avant[t].h === apres[t].h, `${t} : ${avant[t].n} lignes avant, ${apres[t].n} après, empreinte ${avant[t].h === apres[t].h ? 'identique' : `différente (${avant[t].h} → ${apres[t].h})`}`);
}
const seqApres = seq();
constat(seqApres === seqAvant, `compteurs des tables à numéro automatique inchangés (${seqAvant})`);

// 6. Schéma : tout identique sauf la table contact (seul son CHECK de projet change) ; index et déclencheur présents.
const sa = new Map(schemaAvant.map((r) => [`${r.type}:${r.name}`, r])), sp = new Map(schema().map((r) => [`${r.type}:${r.name}`, r]));
const manquants = [...sa.keys()].filter((k) => !sp.has(k)), nouveaux = [...sp.keys()].filter((k) => !sa.has(k));
constat(manquants.length === 0 && nouveaux.length === 0, `mêmes objets dans sqlite_master (${sa.size}), aucune table _sauve_* ni contact_neuf restante${manquants.length + nouveaux.length ? ` ; écarts : ${[...manquants, ...nouveaux].join(', ')}` : ''}`);
const changes = [...sa.keys()].filter((k) => sp.has(k) && sa.get(k).sql !== sp.get(k).sql);
constat(changes.length === 1 && changes[0] === 'table:contact', `seul le schéma de la table contact change${changes.length === 1 && changes[0] === 'table:contact' ? '' : ` (changés : ${changes.join(', ')})`}`);
const colsApres = sql(`PRAGMA table_info(contact)`).map((c) => c.name);
constat(colsApres.length === schemaCols.length + 1 && schemaCols.every((c, i) => colsApres[i] === c) && colsApres.at(-1) === 'ambassadeur_partant_le',
  `table contact : les ${schemaCols.length} colonnes d'avant dans le même ordre, plus ambassadeur_partant_le (${colsApres.length})`);
const ddl = sp.get('table:contact').sql;
constat(/'sponsoring', 'aucun'\)\)/.test(ddl) && /canal IN \('pige', 'boitage'/.test(ddl) && /NOT IN \('a_qualifier', 'ambassadeur', 'aucun'\)/.test(ddl)
  && /r1_le TEXT CHECK/.test(ddl) && /r2_le TEXT CHECK/.test(ddl), 'table contact : « aucun » dans projet et dans la règle sans température, « pige » dans canal, r1_le et r2_le gardés avec leur CHECK');
const idx = [...sp.values()].filter((r) => r.tbl_name === 'contact' && r.type !== 'table').map((r) => r.name).sort();
constat(idx.length === 8 && idx.includes('contact_action_auto'), `index et déclencheur de contact recréés (${idx.join(', ')})`);

// 7. Intégrité.
constat(sql('PRAGMA foreign_key_check').length === 0, 'aucune clé étrangère orpheline (PRAGMA foreign_key_check)');
const refs = [];
for (const t of Object.keys(TABLES)) for (const f of sql(`PRAGMA foreign_key_list(${t})`)) if (f.table === 'contact') refs.push(`${t}:${f.on_delete}`);
constat(refs.length === 10, `${refs.length} références vers contact, toutes résolues (${refs.join(', ')})`);

// 8. Les nouveautés et les règles de cohérence.
let k = 0;
const insere = (projet, temperature, canal = null, partant = null) => {
  k++; return `INSERT INTO contact (id, created_at, last_activity_at, nom, projet, temperature, canal, ambassadeur_partant_le) VALUES ('S${k}', '2026-11-04T08:00:00Z', '2026-11-04T08:00:00Z', 'Essai', ${q(projet)}, ${q(temperature)}, ${q(canal)}, ${q(partant)})`;
};
constat(!refusee(insere('aucun', null)), 'projet « aucun » sans température : accepté');
constat(refusee(insere('aucun', 'chaud')) && refusee(insere('aucun', 'froid')) && refusee(insere('aucun', 'en_vente')), 'projet « aucun » avec une température : refusé');
constat(!refusee(insere('a_qualifier', null, 'pige')) && !refusee(insere('vendeur', 'chaud', 'pige')), 'canal « pige » : accepté');
constat(['boitage', 'recommandation', 'evenement', 'site', 'portail', 'reseaux', 'rencontre', 'autre'].every((c) => !refusee(insere('a_qualifier', null, c))), 'les huit canaux d\'avant restent acceptés');
constat(refusee(insere('a_qualifier', null, 'telephone')) && refusee(insere('a_qualifier', null, '')), 'un canal inconnu reste refusé');
constat(!refusee(insere('ambassadeur', null, null, '2026-11-04')) && !refusee(insere('vendeur', 'chaud', null, '2026-11-04')), 'ambassadeur_partant_le : une date AAAA-MM-JJ est acceptée, quel que soit le projet');
constat(refusee(insere('ambassadeur', null, null, '04/11/2026')) && refusee(insere('ambassadeur', null, null, 'oui')), 'ambassadeur_partant_le : un texte qui n\'est pas une date est refusé');
constat(!refusee(insere('sponsoring', 'chaud')) && !refusee(insere('sponsoring', 'froid')) && refusee(insere('sponsoring', 'en_vente')) && refusee(insere('sponsoring', 'recherche_active')), 'sponsoring (0020) : froid, tiède, chaud acceptés, en_vente et recherche_active refusés, comme avant');
constat(refusee(insere('inconnu', null)), 'un projet inconnu reste refusé');
constat(refusee(insere('vendeur', 'recherche_active')) && refusee(insere('acheteur', 'en_vente')) && refusee(insere('ambassadeur', 'chaud')) && !refusee(insere('vendeur', 'en_vente')), 'règles des projets existants inchangées');
constat(sql(`SELECT count(*) AS n FROM contact WHERE ambassadeur_partant_le IS NOT NULL AND id LIKE 'C%'`)[0].n === 0, 'aucun contact d\'avant n\'a de date « partant » (colonne vide à la reconstruction)');
constat(sql(`SELECT count(*) AS n FROM contact_source WHERE lieu = 'Publier' AND mois = '2024-12'`)[0].n > 0, 'contact_source : lieu et mois (0021) restaurés avec leurs valeurs');
sql(`INSERT INTO action_marketing (id, created_at, maj_le, nom, canal, debut) VALUES ('AM2', '2026-11-01T00:00:00Z', '2026-11-01T00:00:00Z', 'Essai déclencheur', 'reseaux', '2026-11-01')`);
sql(`INSERT INTO contact (id, created_at, last_activity_at, nom, canal) VALUES ('TRG', '2026-11-04T08:00:00Z', '2026-11-04T08:00:00Z', 'Déclencheur', 'reseaux')`);
constat(sql(`SELECT action_id FROM contact WHERE id = 'TRG'`)[0].action_id === 'AM2', 'le déclencheur contact_action_auto rattache toujours une nouvelle demande à son action marketing');
// Un contact supprimé emporte toujours ses tables filles (cascade) et détache sa demande (SET NULL).
const cible = 'C004';
const filles = sql(`SELECT (SELECT count(*) FROM contact_evenement WHERE contact_id = '${cible}') AS e, (SELECT count(*) FROM lead WHERE contact_id = '${cible}') AS l`)[0];
sql(`DELETE FROM contact WHERE id = '${cible}'`);
const reste = sql(`SELECT (SELECT count(*) FROM contact_evenement WHERE contact_id = '${cible}') AS e, (SELECT count(*) FROM lead WHERE contact_id = '${cible}') AS l, (SELECT count(*) FROM lead WHERE id = 'L${cible}') AS lead_garde`)[0];
constat(filles.e > 0 && filles.l > 0 && reste.e === 0 && reste.l === 0 && reste.lead_garde === 1, `suppression d'un contact : ses ${filles.e} événements partent en cascade, ses demandes sont détachées (${filles.l} → ${reste.l})`);

fs.rmSync(DOSSIER, { recursive: true, force: true });
console.log(echecs ? `\n${echecs} échec(s).` : '\nTout est bon.');
process.exit(echecs ? 1 : 0);
