-- Migration 0008 (story 13.10, AD-20 entrée 4) : la relève des appels Leedflow par l'espace d'Anne.
-- Leedflow (le logiciel qui résume par IA les appels d'Anne) n'a pas de webhook : l'espace l'interroge toutes les
-- 10 minutes. Un appel, un message vocal ou un SMS d'un numéro connu devient une ligne `contact_evenement`
-- (type `appel`, source `leedflow`, source_id = genre:identifiant Leedflow). Le reste vit ici : où en est la relève,
-- ce qui vient de numéros inconnus (proposé à Anne, jamais un contact d'office), les numéros qu'elle a écartés,
-- les tâches détectées par Leedflow (proposées comme prochaine action) et la correspondance des contacts Leedflow.

-- Où en est la relève, par genre : `curseur` = date de création (en millisecondes, celle de Leedflow) du plus récent
-- élément traité. Chaque passage reprend 24 heures avant, pour compléter un résumé produit après coup.
CREATE TABLE leedflow_releve (
  genre TEXT PRIMARY KEY CHECK (genre IN ('appel', 'vocal', 'sms', 'tache')),
  curseur INTEGER NOT NULL DEFAULT 0,
  passe_le TEXT,                              -- ISO UTC, dernier passage
  erreur TEXT                                 -- dernière erreur (« HTTP 401 »…), NULL si le passage a réussi
);

-- Ce qui vient d'un numéro inconnu des 30 derniers jours. Rattaché au contact dès qu'un contact porte ce numéro,
-- puis effacé d'ici ; effacé au bout de 90 jours sinon (purge du site).
CREATE TABLE leedflow_inconnu (
  source_id TEXT PRIMARY KEY,                 -- genre:identifiant Leedflow, comme dans contact_evenement
  telephone TEXT NOT NULL,                    -- E.164
  a TEXT NOT NULL,                            -- ISO UTC
  texte TEXT,
  donnees TEXT                                -- JSON
);
CREATE INDEX leedflow_inconnu_telephone ON leedflow_inconnu (telephone, a);

-- Numéros qu'Anne a écartés (appels personnels) : plus jamais proposés.
CREATE TABLE leedflow_ecarte (
  telephone TEXT PRIMARY KEY,                 -- E.164
  a TEXT NOT NULL,
  par TEXT
);

-- Tâches détectées par Leedflow dans un appel, proposées comme prochaine action du contact.
CREATE TABLE leedflow_tache (
  id TEXT PRIMARY KEY,                        -- identifiant Leedflow
  contact_id TEXT NOT NULL REFERENCES contact (id) ON DELETE CASCADE,
  a TEXT NOT NULL,                            -- création dans Leedflow, ISO UTC
  texte TEXT NOT NULL,
  echeance TEXT,                              -- AAAA-MM-JJ (heure de Paris), si Leedflow en donne une
  statut TEXT NOT NULL DEFAULT 'proposee' CHECK (statut IN ('proposee', 'acceptee', 'ignoree')),
  decide_le TEXT,
  par TEXT
);
CREATE INDEX leedflow_tache_contact ON leedflow_tache (contact_id, statut);

-- Contact Leedflow → contact de l'espace, appris par le numéro de téléphone : sert à ranger les tâches, qui ne portent
-- que l'identifiant du contact Leedflow.
CREATE TABLE leedflow_lien (
  leedflow_contact TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL REFERENCES contact (id) ON DELETE CASCADE
);
CREATE INDEX leedflow_lien_contact ON leedflow_lien (contact_id);
