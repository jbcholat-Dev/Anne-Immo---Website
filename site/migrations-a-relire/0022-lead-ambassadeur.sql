-- Migration 0022 (story 17.2, epic 17 ; AD-6) : les inscriptions au programme ambassadeurs entrent dans `lead` avec la
-- source `ambassadeur`, et la demande garde la version et la date du règlement accepté (`reglement_version`,
-- `reglement_accepte_le`), que `contacts.ts` recopie sur le contact (marque « inscrit ambassadeur », story 18.3).
-- SQLite ne sait pas élargir un CHECK : `lead.source` n'accepte que cinq valeurs depuis 0001, la table est donc
-- reconstruite à l'identique (mêmes colonnes, mêmes contraintes, mêmes index), `ambassadeur` en plus dans la liste
-- de `source`, et les deux colonnes du règlement en plus à la fin.
--
-- ORDRE IMPOSÉ PAR D1 (comme 0018 et 0020) : supprimer `lead` efface en cascade `lead_delivery` (ON DELETE CASCADE),
-- même avec des clés différées. On copie donc d'abord `lead_delivery` dans une table ordinaire `_sauve_lead_delivery`,
-- on reconstruit `lead`, puis on restaure et on supprime la copie. `lead.contact_id` référence `contact` : rien ne
-- référence `lead` à part `lead_delivery`. La répétition `site/scripts/e2e-migration-0022.mjs` compare chaque table
-- avant et après. Une erreur se corrige par une migration 0023, jamais en modifiant celle-ci une fois poussée.

PRAGMA defer_foreign_keys = true;

-- Relance après un arrêt à mi-chemin.
DROP TABLE IF EXISTS _sauve_lead_delivery;
DROP TABLE IF EXISTS lead_neuf;

-- 1. Sauvegarde de ce qui référence `lead`.
CREATE TABLE _sauve_lead_delivery AS SELECT * FROM lead_delivery;

-- 2. La nouvelle table, identique à l'actuelle sauf la liste de `source` et les deux colonnes du règlement.
CREATE TABLE lead_neuf (
  id TEXT PRIMARY KEY,                       -- ULID
  submission_id TEXT NOT NULL UNIQUE,        -- clé d'idempotence : un envoi rejoué n'écrit pas deux fois (AD-4)
  created_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL,
  lang TEXT NOT NULL CHECK (lang IN ('fr', 'en')),
  source TEXT NOT NULL CHECK (source IN ('diagnostic', 'contact', 'guide', 'rdv', 'estimation', 'ambassadeur')),
  email TEXT NOT NULL,
  privacy_accepted_at TEXT NOT NULL,
  newsletter_opt_in_at TEXT,
  newsletter_unsubscribed_at TEXT,
  utm TEXT,
  is_test INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0, 1)),
  -- Colonnes par source
  prenom TEXT,
  nom TEXT,
  telephone TEXT,
  token TEXT,
  answers TEXT,
  scores TEXT,
  band TEXT,
  orientation TEXT CHECK (orientation IS NULL OR orientation IN ('A', 'B')),
  message TEXT CHECK (message IS NULL OR length(message) <= 1000),
  projet TEXT CHECK (projet IS NULL OR projet IN ('vente', 'achat')),
  commune_bien TEXT,
  type_bien TEXT,
  token_browser TEXT,                        -- 0003
  rdv_start TEXT,                            -- 0004
  contact_id TEXT REFERENCES contact (id) ON DELETE SET NULL,   -- 0007
  reglement_version TEXT,                    -- ambassadeur : version du règlement accepté (v1…)
  reglement_accepte_le TEXT,                 -- ambassadeur : date ISO UTC de l'acceptation
  CHECK (source = 'ambassadeur' OR (reglement_version IS NULL AND reglement_accepte_le IS NULL)),
  CHECK (source <> 'ambassadeur' OR (reglement_version IS NOT NULL AND reglement_accepte_le IS NOT NULL))
);

INSERT INTO lead_neuf (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at,
  newsletter_opt_in_at, newsletter_unsubscribed_at, utm, is_test, prenom, nom, telephone, token, answers, scores, band,
  orientation, message, projet, commune_bien, type_bien, token_browser, rdv_start, contact_id)
SELECT id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at,
  newsletter_opt_in_at, newsletter_unsubscribed_at, utm, is_test, prenom, nom, telephone, token, answers, scores, band,
  orientation, message, projet, commune_bien, type_bien, token_browser, rdv_start, contact_id
FROM lead;

-- 3. Remplacement (efface `lead_delivery` en cascade : d'où la copie de l'étape 1).
DROP TABLE lead;
ALTER TABLE lead_neuf RENAME TO lead;

CREATE UNIQUE INDEX lead_token_diagnostic ON lead (token) WHERE source = 'diagnostic';
CREATE INDEX lead_email ON lead (email);
CREATE INDEX lead_created_at ON lead (created_at);
CREATE INDEX lead_derniere_activite ON lead (last_activity_at);
CREATE INDEX lead_contact ON lead (contact_id);

-- 4. Restauration de `lead_delivery`, puis suppression de la copie.
DELETE FROM lead_delivery;
INSERT INTO lead_delivery (lead_id, channel, due_at, status, attempts, delivered_at, last_error)
SELECT lead_id, channel, due_at, status, attempts, delivered_at, last_error FROM _sauve_lead_delivery;
DROP TABLE _sauve_lead_delivery;
