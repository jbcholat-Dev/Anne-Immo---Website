-- Migration 0010 (story 13.17) : le journal des actions marketing de l'espace d'Anne.
-- Une action = une campagne ou une dépense de prospection (flyers, publicité, salon…), avec son canal, ses dates et ce
-- qu'elle a coûté. Chaque contact peut être rattaché à l'action qui l'a amené : le bilan du lundi en tire le coût par
-- contact, par rendez-vous et par mandat. Une action n'est pas une donnée personnelle ; le lien vit sur le contact et
-- disparaît avec lui. Les montants sont en centimes d'euro, pour des calculs exacts.

CREATE TABLE action_marketing (
  id TEXT PRIMARY KEY,                        -- ULID
  created_at TEXT NOT NULL,
  maj_le TEXT NOT NULL,
  nom TEXT NOT NULL,
  canal TEXT NOT NULL CHECK (canal IN ('boitage', 'recommandation', 'evenement', 'site', 'portail', 'reseaux', 'rencontre', 'autre')),
  debut TEXT NOT NULL,                        -- AAAA-MM-JJ
  fin TEXT,                                   -- AAAA-MM-JJ, NULL tant que l'action continue
  budget_centimes INTEGER CHECK (budget_centimes IS NULL OR budget_centimes >= 0),   -- prévu
  cout_centimes INTEGER CHECK (cout_centimes IS NULL OR cout_centimes >= 0),         -- réellement dépensé
  note TEXT,
  auteur TEXT NOT NULL DEFAULT 'anne' CHECK (auteur IN ('anne', 'claude')),          -- « créée par Claude » (accès /api/claude)
  par TEXT,                                   -- compte qui a créé ou modifié en dernier
  CHECK (fin IS NULL OR fin >= debut)
);
CREATE INDEX action_marketing_canal ON action_marketing (canal, debut);

ALTER TABLE contact ADD COLUMN action_id TEXT REFERENCES action_marketing (id) ON DELETE SET NULL;
CREATE INDEX contact_action ON contact (action_id);

-- Un passage de boîtage peut aussi avoir un coût (impression des mots).
ALTER TABLE passage_boitage ADD COLUMN cout_centimes INTEGER CHECK (cout_centimes IS NULL OR cout_centimes >= 0);

-- Rattachement d'office, quel que soit le chemin d'arrivée (site, saisie, import) : s'il y a exactement une action du
-- canal du contact en cours le jour de son arrivée, le contact y est rattaché. Sinon Anne choisit à la qualification.
CREATE TRIGGER contact_action_auto AFTER INSERT ON contact
WHEN NEW.action_id IS NULL AND (
  SELECT count(*) FROM action_marketing a
  WHERE a.canal = NEW.canal AND a.debut <= substr(NEW.created_at, 1, 10) AND (a.fin IS NULL OR a.fin >= substr(NEW.created_at, 1, 10))
) = 1
BEGIN
  UPDATE contact SET action_id = (
    SELECT a.id FROM action_marketing a
    WHERE a.canal = NEW.canal AND a.debut <= substr(NEW.created_at, 1, 10) AND (a.fin IS NULL OR a.fin >= substr(NEW.created_at, 1, 10))
  ) WHERE id = NEW.id;
END;
