-- Migration 0001 (story 10.2) : table des leads, une ligne par capture (AD-6).
-- Dates : texte ISO 8601 en UTC. Téléphones : E.164. JSON : answers, scores, utm.
-- Le contrat par source (champs obligatoires selon diagnostic, contact, guide, rdv, estimation)
-- est vérifié par le serveur avant l'écriture (AD-7), pas par la base.
CREATE TABLE lead (
  id TEXT PRIMARY KEY,                       -- ULID
  submission_id TEXT NOT NULL UNIQUE,        -- clé d'idempotence : un envoi rejoué n'écrit pas deux fois (AD-4)
  created_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL,
  lang TEXT NOT NULL CHECK (lang IN ('fr', 'en')),
  source TEXT NOT NULL CHECK (source IN ('diagnostic', 'contact', 'guide', 'rdv', 'estimation')),
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
  type_bien TEXT
);

-- Un jeton de résultat unique, seulement pour le diagnostic : un deuxième contact du même visiteur reste possible.
CREATE UNIQUE INDEX lead_token_diagnostic ON lead (token) WHERE source = 'diagnostic';
CREATE INDEX lead_email ON lead (email);
CREATE INDEX lead_created_at ON lead (created_at);
