-- Migration 0023 (story 18.19, ticket n° 249) : le boîtage d'Anne devient un tableau. En plus du secteur, de la date
-- (`fait_le`) et du nombre de flyers déposés (`mots`) qu'un passage portait déjà, chaque ligne garde sa ville, son quartier,
-- le type de bien visé, le numéro du message distribué (celui du classeur d'Anne), les dates de ses deux relances R1 et R2
-- et un commentaire. Tout est facultatif : les passages déjà notés restent tels quels, colonnes neuves vides.
-- Un simple ajout de colonnes et d'un index, sans toucher `secteur` (toujours obligatoire : le bilan par secteur et la liste
-- « boîtage à refaire » s'en servent) ni reconstruire la table (elle est référencée par `contact`, voir 0018 et 0020).
-- Une erreur se corrige par une migration 0024, jamais en modifiant celle-ci une fois poussée.

ALTER TABLE passage_boitage ADD COLUMN ville TEXT;
ALTER TABLE passage_boitage ADD COLUMN quartier TEXT;
ALTER TABLE passage_boitage ADD COLUMN type_bien TEXT CHECK (type_bien IS NULL OR type_bien IN ('maison', 'appartement'));
ALTER TABLE passage_boitage ADD COLUMN message TEXT;                 -- numéro du message dans le classeur d'Anne
ALTER TABLE passage_boitage ADD COLUMN r1 TEXT CHECK (r1 IS NULL OR r1 GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]');  -- date de la 1re relance
ALTER TABLE passage_boitage ADD COLUMN r2 TEXT CHECK (r2 IS NULL OR r2 GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]');  -- date de la 2e relance
ALTER TABLE passage_boitage ADD COLUMN commentaire TEXT;

-- Le tableau se lit du plus récent au plus ancien.
CREATE INDEX passage_boitage_date ON passage_boitage (fait_le DESC, created_at DESC);
