// Répétition de la migration 0022 (story 17.2 : source `ambassadeur` dans `lead`) sur une base locale neuve, sans toucher
// à la base locale des autres essais : 0001 à 0021 appliquées, puis des demandes fictives de chaque source, avec leurs
// envois (`lead_delivery`) et des contacts rattachés. La migration reconstruit `lead` : comptes et empreintes de `lead`
// et `lead_delivery` avant et après, index comparés dans `sqlite_master`, clés étrangères vérifiées (effacer un contact
// remet `lead.contact_id` à NULL, effacer une demande efface ses envois), puis `ambassadeur` accepté avec son règlement,
// refusé sans, règlement refusé sur une autre source, source inconnue toujours refusée. Vérifie aussi la relance après
// un arrêt à mi-chemin (copie `_sauve_lead_delivery` laissée).
// La migration a vécu dans migrations-a-relire/ jusqu'à sa relecture (une migration poussée dans migrations/ part
// tout de suite sur la vraie base). Le script la cherche dans migrations/ puis dans migrations-a-relire/.
// Lancer depuis site/ : `node scripts/e2e-migration-0022.mjs` (aucun préalable).
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIG = path.join(ICI, 'migrations');
const NOM = '0022-lead-ambassadeur.sql';
const F22 = [path.join(MIG, NOM), path.join(ICI, 'migrations-a-relire', NOM)].find((f) => fs.existsSync(f));
const DOSSIER = fs.mkdtempSync(path.join(os.tmpdir(), 'essai-0022-'));
const ETAT = path.join(DOSSIER, 'etat');
let echecs = 0;
const constat = (ok, texte) => { console.log(`${ok ? '✓' : '✗'} ${texte}`); if (!ok) echecs++; };

const wrangler = (args, etat = ETAT) => execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--persist-to', etat, '--json', ...args],
  { cwd: ICI, encoding: 'utf8', env: { ...process.env, CI: 'true' }, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 << 20 });
const fichier = (f, etat) => wrangler(['--file', f], etat);
const sql = (q, etat) => JSON.parse(wrangler(['--command', q], etat))[0].results;
const q = (v) => (v === null || v === undefined ? 'NULL' : typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const refusee = (requete, etat) => { try { sql(requete, etat); return false; } catch { return true; } };
const empreinte = (lignes) => createHash('sha256').update(JSON.stringify(lignes)).digest('hex').slice(0, 16);

constat(!!F22, `migration trouvée : ${F22 ? path.relative(ICI, F22) : 'absente'}`);
if (!F22) process.exit(1);

// 1. Base 0001 à 0021.
const avant = fs.readdirSync(MIG).filter((f) => /^\d{4}-.*\.sql$/.test(f) && f < '0022').sort();
const tout = path.join(DOSSIER, 'avant.sql');
fs.writeFileSync(tout, avant.map((f) => fs.readFileSync(path.join(MIG, f), 'utf8')).join('\n;\n'));

/** Base neuve avec ses données d'essai, toutes fictives (exemple.invalid, numéros +336990…). */
function preparer(etat) {
  fichier(tout, etat);
  const lignes = [];
  for (let n = 1; n <= 4; n++) {
    lignes.push(`INSERT INTO contact (id, created_at, last_activity_at, nom, telephone, email) VALUES ('C${n}', '2026-10-0${n}T08:00:00Z', '2026-10-0${n}T08:00:00Z', 'Fictif${n}', '+33699000000${n}', 'c${n}@exemple.invalid')`);
  }
  const SOURCES = ['diagnostic', 'contact', 'guide', 'rdv', 'estimation'];
  const CANAUX = ['notify_anne', 'confirm_prospect', 'guide', 'modelo', 'sequence:j3'];
  for (let n = 1; n <= 25; n++) {
    const source = SOURCES[n % 5];
    const l = {
      id: `L${String(n).padStart(3, '0')}`, submission_id: `S${n}`, created_at: `2026-10-${String(n).padStart(2, '0')}T08:00:00Z`,
      last_activity_at: `2026-10-${String(n).padStart(2, '0')}T09:00:00Z`, lang: n % 7 ? 'fr' : 'en', source, email: `essai${n}@exemple.invalid`,
      privacy_accepted_at: `2026-10-${String(n).padStart(2, '0')}T08:00:00Z`, newsletter_opt_in_at: n % 2 ? '2026-10-01T08:00:00Z' : null,
      newsletter_unsubscribed_at: n % 6 ? null : '2026-10-20T08:00:00Z', utm: n % 3 ? null : '{"utm_source":"carte"}', is_test: n % 4 ? 0 : 1,
      prenom: `Prénom${n}`, nom: source === 'diagnostic' ? null : `Nom${n}`, telephone: source === 'guide' ? null : `+3369900${String(n).padStart(4, '0')}`,
      token: source === 'diagnostic' ? `T${n}` : null, answers: source === 'diagnostic' ? '{"q1":1}' : null, scores: source === 'diagnostic' ? '{"a":2}' : null,
      band: source === 'diagnostic' ? 'haut' : null, orientation: source === 'diagnostic' ? (n % 2 ? 'A' : 'B') : null,
      message: source === 'contact' ? "Message d'essai" : null, projet: source === 'contact' ? (n % 2 ? 'vente' : 'achat') : null,
      commune_bien: source === 'estimation' ? 'Sciez' : null, type_bien: source === 'estimation' ? 'Maison' : null,
      token_browser: n % 5 ? null : `B${n}`, rdv_start: source === 'rdv' ? '2026-11-10T09:00:00Z' : null, contact_id: n % 3 ? `C${1 + (n % 4)}` : null,
    };
    const cols = Object.keys(l);
    lignes.push(`INSERT INTO lead (${cols.join(', ')}) VALUES (${cols.map((k) => q(l[k])).join(', ')})`);
    for (let k = 0; k < 1 + (n % 3); k++) {
      lignes.push(`INSERT INTO lead_delivery (lead_id, channel, due_at, status, attempts, delivered_at, last_error) VALUES ('${l.id}', '${CANAUX[(n + k) % 5]}', '2026-10-01T08:00:00Z', '${['pending', 'delivered', 'failed', 'cancelled'][(n + k) % 4]}', ${k}, ${k ? "'2026-10-02T08:00:00Z'" : 'NULL'}, ${k === 2 ? "'erreur d''essai'" : 'NULL'})`);
    }
  }
  const donnees = path.join(DOSSIER, `donnees-${path.basename(etat)}.sql`);
  fs.writeFileSync(donnees, lignes.join(';\n') + ';\n');
  fichier(donnees, etat);
}

const COLS = 'id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at, newsletter_opt_in_at, newsletter_unsubscribed_at, utm, is_test, prenom, nom, telephone, token, answers, scores, band, orientation, message, projet, commune_bien, type_bien, token_browser, rdv_start, contact_id';
const photo = (etat) => ({
  lead: sql(`SELECT ${COLS} FROM lead ORDER BY id`, etat),
  lead_delivery: sql('SELECT * FROM lead_delivery ORDER BY lead_id, channel', etat),
  contact: sql('SELECT * FROM contact ORDER BY id', etat),
});
const indexDeLead = (etat) => sql("SELECT name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'lead' AND sql IS NOT NULL ORDER BY name", etat)
  .map((r) => `${r.name}: ${r.sql.replace(/\s+/g, ' ')}`);

preparer(ETAT);
const a = photo(ETAT);
const indexAvant = indexDeLead(ETAT);
constat(a.lead.length === 25 && a.lead_delivery.length > 25, `données d'essai : ${a.lead.length} demandes, ${a.lead_delivery.length} envois, ${a.contact.length} contacts`);

// 2. La migration.
fichier(F22);
const b = photo(ETAT);
for (const t of ['lead', 'lead_delivery', 'contact']) {
  constat(a[t].length === b[t].length && empreinte(a[t]) === empreinte(b[t]), `${t} : ${b[t].length} lignes, identiques avant et après (${empreinte(b[t])})`);
}
const indexApres = indexDeLead(ETAT);
constat(JSON.stringify(indexAvant) === JSON.stringify(indexApres), `index de lead identiques (${indexApres.length})`);
constat(sql("SELECT count(*) AS n FROM sqlite_master WHERE name IN ('_sauve_lead_delivery', 'lead_neuf')")[0].n === 0, 'aucune table temporaire restante');
const colonnes = sql("SELECT name FROM pragma_table_info('lead')").map((r) => r.name);
constat(colonnes.includes('reglement_version') && colonnes.includes('reglement_accepte_le'), 'colonnes reglement_version et reglement_accepte_le présentes');
constat(sql('PRAGMA foreign_key_check').length === 0, 'clés étrangères cohérentes');

// 3. Ce que la nouvelle table accepte et refuse.
const insertion = (source, version, le, n) => `INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at, prenom, nom, telephone, reglement_version, reglement_accepte_le)
  VALUES ('N${n}', 'NS${n}', '2026-11-05T08:00:00Z', '2026-11-05T08:00:00Z', 'fr', '${source}', 'n${n}@exemple.invalid', '2026-11-05T08:00:00Z', 'Claire', 'Fictive', '+33699001234', ${q(version)}, ${q(le)})`;
constat(!refusee(insertion('ambassadeur', 'v1', '2026-11-05T08:00:00Z', 1)), 'ambassadeur avec règlement : accepté');
constat(refusee(insertion('ambassadeur', null, null, 2)), 'ambassadeur sans règlement : refusé');
constat(refusee(insertion('ambassadeur', 'v1', null, 3)), 'ambassadeur sans date de règlement : refusé');
constat(refusee(insertion('contact', 'v1', '2026-11-05T08:00:00Z', 4)), 'règlement sur une autre source : refusé');
constat(refusee(insertion('parrainage', null, null, 5)), 'source inconnue : refusée');
constat(!refusee("INSERT INTO lead_delivery (lead_id, channel, due_at) VALUES ('N1', 'notify_anne', '2026-11-05T08:00:00Z')"), 'envoi accepté pour la nouvelle demande');
constat(refusee("INSERT INTO lead_delivery (lead_id, channel, due_at) VALUES ('ABSENT', 'notify_anne', '2026-11-05T08:00:00Z')"), 'envoi vers une demande absente : refusé (clé étrangère)');
sql("DELETE FROM lead WHERE id = 'L001'");
constat(sql("SELECT count(*) AS n FROM lead_delivery WHERE lead_id = 'L001'")[0].n === 0, 'effacer une demande efface ses envois (cascade conservée)');
sql("UPDATE lead SET contact_id = 'C2' WHERE id = 'N1'");
sql("DELETE FROM contact WHERE id = 'C2'");
constat(sql("SELECT count(*) AS n FROM lead WHERE contact_id = 'C2'")[0].n === 0 && sql("SELECT count(*) AS n FROM lead WHERE id = 'N1'")[0].n === 1,
  'effacer un contact remet contact_id à NULL sans effacer la demande');

// 4. Relance après un arrêt à mi-chemin : une copie `_sauve_lead_delivery` d'un essai interrompu est laissée.
const ETAT2 = path.join(DOSSIER, 'etat2');
preparer(ETAT2);
const a2 = photo(ETAT2);
sql('CREATE TABLE _sauve_lead_delivery AS SELECT * FROM lead_delivery', ETAT2);
fichier(F22, ETAT2);
const b2 = photo(ETAT2);
constat(empreinte(a2.lead) === empreinte(b2.lead) && empreinte(a2.lead_delivery) === empreinte(b2.lead_delivery), 'relance après un arrêt : données identiques');

fs.rmSync(DOSSIER, { recursive: true, force: true });
console.log(echecs ? `\n${echecs} échec(s)` : '\nRépétition réussie.');
process.exit(echecs ? 1 : 0);
