-- Migration 0019 (story 18.12, ex-13.8 ; FR-27, AD-20 entrée 3, AD-34) : les demandes des portails d'annonces par e-mail.
-- Chaque e-mail reçu par le gestionnaire `email` du Worker de l'espace (espace/src/server/portails.ts) laisse une ligne
-- dans `portail_courriel` : elle évite de traiter deux fois le même message (identifiant Message-ID, ou empreinte), et
-- garde, pour être lu à la main, un e-mail illisible (champs introuvables, trop gros, confirmation du transfert de Gmail,
-- liste d'opposition invérifiable). Un e-mail lu ne garde ni son expéditeur, ni son sujet, ni son texte : la demande
-- est dans le contact et son événement. Une personne qui a demandé l'effacement (AD-31) ne laisse que le portail et la
-- référence du bien. La carte « Nouveaux » d'un e-mail pointe sa ligne (`nouveau.portail_courriel_id`).
-- Purge : texte effacé une fois la carte traitée, ligne retirée après trois ans (tâche planifiée de l'espace).
-- Migration additive : aucune table existante n'est reconstruite, rien n'est copié ni supprimé. 0018 n'est pas touchée.

CREATE TABLE IF NOT EXISTS portail_courriel (
  id TEXT PRIMARY KEY,                        -- ULID
  recu_le TEXT NOT NULL,
  message_id TEXT NOT NULL UNIQUE,            -- en-tête Message-ID, ou « sha256:… » du message s'il n'en a pas
  portail TEXT NOT NULL CHECK (portail IN ('leboncoin', 'seloger', 'autre')),
  etat TEXT NOT NULL CHECK (etat IN ('lu', 'illisible', 'opposition')),
  motif TEXT,                                 -- illisible : confirmation, taille, champs, opposition_inverifiable, echec, en_cours ; opposition : « Réf. … »
  contact_id TEXT REFERENCES contact (id) ON DELETE SET NULL,
  expediteur TEXT,
  sujet TEXT,
  texte TEXT,
  -- Seul un e-mail à lire à la main garde son expéditeur, son sujet et son texte.
  CHECK (etat = 'illisible' OR (expediteur IS NULL AND sujet IS NULL AND texte IS NULL))
);
CREATE INDEX IF NOT EXISTS portail_courriel_recu ON portail_courriel (recu_le);

ALTER TABLE nouveau ADD COLUMN portail_courriel_id TEXT REFERENCES portail_courriel (id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS nouveau_portail ON nouveau (portail_courriel_id) WHERE portail_courriel_id IS NOT NULL;
