-- Migration 0003 (story 10.4) : la page de résultats du diagnostic ne s'ouvre que dans un navigateur (AD-5).
-- Le premier navigateur qui ouvre le lien reçoit une clé (cookie) ; la base n'en garde que l'empreinte SHA-256.
-- Un autre navigateur avec le même lien obtient une page « lien plus valable » (404).
ALTER TABLE lead ADD COLUMN token_browser TEXT;
