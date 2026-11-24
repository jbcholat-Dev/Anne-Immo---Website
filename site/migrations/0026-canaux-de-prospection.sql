-- Migration 0026 (story 20.7, demande de JB du 2026-11-24) : les canaux de prospection dans l'espace d'Anne.
-- Sur la page « Ma semaine », Anne note par canal ce qu'elle a fait (l'effort), les leads et les rendez-vous obtenus.
-- Trois tables neuves, aucune table existante touchée :
--   - `prospection_effort` : une quantité d'effort sur un canal, un jour (« 10 cartes données le 24/11 »). Le boîtage n'y
--     va pas : ses flyers restent dans `passage_boitage` (story 18.19), pour ne rien saisir deux fois ;
--   - `resultat` : un lead, un rendez-vous (ou plus tard une recommandation, un mandat), avec son canal (AD-33 amendée par
--     AD-36). Pas de colonne contact pour l'instant : la table ne garde aucune donnée personnelle ;
--   - `prospection_objectif` : les objectifs de la semaine que JB ou Anne ont changés ; les autres gardent leur valeur
--     de départ, écrite dans le code (espace/src/server/prospection.ts).
-- Les canaux sont vérifiés par le code, pas par la base (AD-35) : on peut en ajouter un sans reconstruire de table.
-- Une erreur se corrige par une migration 0027, jamais en modifiant celle-ci une fois poussée.

CREATE TABLE prospection_effort (
  id TEXT PRIMARY KEY,                        -- ULID
  canal TEXT NOT NULL,
  jour TEXT NOT NULL CHECK (jour GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  quantite INTEGER NOT NULL CHECK (quantite >= 1 AND quantite <= 99999),
  note TEXT,                                  -- lieu ou précision, 200 caractères au plus
  par TEXT,                                   -- le compte qui a noté (Anne ou JB)
  created_at TEXT NOT NULL
);
CREATE INDEX prospection_effort_jour ON prospection_effort (jour);

CREATE TABLE resultat (
  id TEXT PRIMARY KEY,                        -- ULID
  type TEXT NOT NULL CHECK (type IN ('lead', 'rdv', 'recommandation', 'mandat')),
  canal TEXT NOT NULL,
  type_lead TEXT CHECK (type_lead IS NULL OR type_lead IN ('direct', 'diagnostic')),
  le TEXT NOT NULL CHECK (le GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite >= 1 AND quantite <= 99),
  par TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX resultat_le ON resultat (le);

CREATE TABLE prospection_objectif (
  cle TEXT PRIMARY KEY,                       -- « rdv », « leads » ou « effort:<canal> »
  valeur INTEGER NOT NULL CHECK (valeur >= 0 AND valeur <= 99999),
  par TEXT,
  maj_le TEXT NOT NULL
);
