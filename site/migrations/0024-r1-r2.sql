-- Migration 0024 (story 18.20, tickets n° 256, 257 et 258) : R1 et R2 sont les premiers et seconds RENDEZ-VOUS, pas des dates
-- de relance (la story 18.19 s'était trompée, Anne l'a précisé). Deux endroits les portent :
--   - une ligne du tableau du boîtage compte ses rendez-vous : `r1_nb` (combien de premiers rendez-vous ce passage a amenés)
--     et `r2_nb` (combien de seconds), des entiers de 0 à 9999, vides tant qu'Anne ne les a pas notés ;
--   - une fiche contact garde la date de son premier et de son second rendez-vous : `r1_le` et `r2_le` (AAAA-MM-JJ).
-- Les colonnes `r1` et `r2` de `passage_boitage` (dates, migration 0023) restent dans la table mais ne sont plus ni lues ni
-- écrites par aucun code : on ne supprime rien d'une base en production (SQLite ne retire pas une colonne sans reconstruire
-- la table, que `contact` référence, voir 0018 et 0020). Elles sont vides : 18.19 est en ligne depuis peu.
-- Un simple ajout de colonnes, sans reconstruire de table ni toucher aux données existantes ; tout est facultatif.
-- Une erreur se corrige par une migration 0025, jamais en modifiant celle-ci une fois poussée.

ALTER TABLE passage_boitage ADD COLUMN r1_nb INTEGER CHECK (r1_nb IS NULL OR (r1_nb >= 0 AND r1_nb <= 9999));  -- nombre de premiers rendez-vous
ALTER TABLE passage_boitage ADD COLUMN r2_nb INTEGER CHECK (r2_nb IS NULL OR (r2_nb >= 0 AND r2_nb <= 9999));  -- nombre de seconds rendez-vous

ALTER TABLE contact ADD COLUMN r1_le TEXT CHECK (r1_le IS NULL OR r1_le GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]');  -- date du premier rendez-vous
ALTER TABLE contact ADD COLUMN r2_le TEXT CHECK (r2_le IS NULL OR r2_le GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]');  -- date du second rendez-vous
