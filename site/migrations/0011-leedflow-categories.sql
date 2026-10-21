-- Migration 0011 (story 13.19) : les numéros inconnus vus par Leedflow se rangent dans une catégorie au lieu d'être
-- seulement « écartés ». La table `leedflow_ecarte` devient la liste des numéros classés : Privé (famille, amis),
-- Pro (notaire, artisan, collègue : ses échanges restent visibles, il peut devenir prescripteur) ou Démarchage.
-- Un numéro qui n'y est pas est « à trier ». Les numéros déjà écartés deviennent Privés. Retirer un numéro de la liste
-- le remet à trier.
ALTER TABLE leedflow_ecarte ADD COLUMN categorie TEXT NOT NULL DEFAULT 'prive' CHECK (categorie IN ('prive', 'pro', 'demarchage'));
CREATE INDEX leedflow_ecarte_categorie ON leedflow_ecarte (categorie, a);
