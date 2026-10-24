-- Migration 0012 (story 13.25) : la synthèse d'un contact, en tête de sa fiche dans l'espace d'Anne.
-- Leedflow écrit une « Synthèse IA » de chaque contact (qui est ce contact, notre relation, à retenir, situation,
-- échanges récents), lisible par son API dans le champ `details` de la fiche (essai de JB du 2026-10-24).
-- La relève de l'espace la recopie ici ; Anne peut la modifier, ou l'écrire pour un contact hors Leedflow.
-- Sa version n'est jamais écrasée : quand Leedflow en a une plus récente, la fiche le signale et Anne choisit.
ALTER TABLE contact ADD COLUMN synthese_leedflow TEXT;        -- dernier texte lu chez Leedflow (Markdown)
ALTER TABLE contact ADD COLUMN synthese_leedflow_le TEXT;     -- ISO UTC : quand ce texte a changé chez Leedflow
ALTER TABLE contact ADD COLUMN synthese_lue_le TEXT;          -- ISO UTC : dernière lecture de la fiche Leedflow
ALTER TABLE contact ADD COLUMN synthese TEXT;                 -- la version d'Anne, si elle l'a écrite ou modifiée
ALTER TABLE contact ADD COLUMN synthese_le TEXT;              -- ISO UTC : quand Anne l'a enregistrée
