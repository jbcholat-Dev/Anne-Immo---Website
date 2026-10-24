-- Migration 0014 (story 13.27, AD-21) : les campagnes e-mail écrites et envoyées depuis l'espace d'Anne.
-- Une campagne est un brouillon tant qu'Anne ne l'envoie pas ; à l'envoi, la liste de ses destinataires est figée dans
-- `campagne_destinataire` (seulement des contacts qui peuvent la recevoir, espace/src/server/accord.ts), puis la tâche
-- planifiée de l'espace l'envoie par paquets. Un destinataire disparaît avec son contact (effacement RGPD, purge).
CREATE TABLE campagne (
  id TEXT PRIMARY KEY,                        -- ULID
  created_at TEXT NOT NULL,
  maj_le TEXT NOT NULL,
  nom TEXT NOT NULL,                          -- pour Anne seulement (« Lettre d'octobre »)
  objet TEXT NOT NULL DEFAULT '',
  texte TEXT NOT NULL DEFAULT '',             -- petit Markdown des e-mails du site (site/src/server/email-html.ts) ; [Prénom] remplacé
  bouton_libelle TEXT,
  bouton_lien TEXT,
  filtres TEXT NOT NULL DEFAULT '{}',         -- JSON : parcours, étapes, commune, canal
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoi', 'envoyee')),
  lancee_le TEXT,
  finie_le TEXT,
  par TEXT                                    -- compte qui a écrit ou envoyé en dernier
);

CREATE TABLE campagne_destinataire (
  campagne_id TEXT NOT NULL REFERENCES campagne (id) ON DELETE CASCADE,
  contact_id TEXT NOT NULL REFERENCES contact (id) ON DELETE CASCADE,
  email TEXT NOT NULL,                        -- adresse au moment de l'envoi
  prenom TEXT,
  statut TEXT NOT NULL DEFAULT 'a_envoyer' CHECK (statut IN ('a_envoyer', 'envoye', 'echec', 'annule')),
  essais INTEGER NOT NULL DEFAULT 0,
  prochain_essai TEXT NOT NULL,               -- ISO UTC
  envoye_le TEXT,
  erreur TEXT,
  PRIMARY KEY (campagne_id, contact_id)
);
CREATE INDEX campagne_destinataire_a_envoyer ON campagne_destinataire (statut, prochain_essai);
CREATE INDEX campagne_destinataire_contact ON campagne_destinataire (contact_id);
