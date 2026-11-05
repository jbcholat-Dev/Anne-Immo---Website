-- Migration 0021 (story 18.17) : la rencontre d'un contact devient une donnée filtrable, pas une note. Une ligne de
-- `contact_source` garde, pour une rencontre, son lieu (« Publier », casse de titre) et son mois (« AAAA-MM »), par exemple
-- une animation commerciale EDB en magasin. Les deux colonnes sont vides pour toutes les sources déjà écrites : un simple
-- ajout de colonnes, sans reconstruire la table (elle est référencée par `contact`, voir 0018 et 0020 pour la raison).
-- La 0020 copie `contact_source` en listant ses colonnes d'avant ; elle passe avant celle-ci, rien à y changer.
-- Une erreur se corrige par une migration 0022, jamais en modifiant celle-ci une fois poussée.

ALTER TABLE contact_source ADD COLUMN lieu TEXT;
ALTER TABLE contact_source ADD COLUMN mois TEXT CHECK (mois IS NULL OR mois GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]');

-- Retrouver les rencontres (filtres « lieu » et « mois » de l'espace, reprise d'un fichier déjà importé).
CREATE INDEX contact_source_rencontre ON contact_source (source, lieu, mois) WHERE lieu IS NOT NULL OR mois IS NOT NULL;
