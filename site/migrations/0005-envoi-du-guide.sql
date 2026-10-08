-- Migration 0005 (story 10.5) : un nouvel envoi possible par lead, `guide` (le lien du guide demandé depuis la page de
-- résultats du diagnostic). SQLite ne sait pas modifier une contrainte CHECK : la table est recréée à l'identique avec la
-- nouvelle valeur, son contenu recopié, puis l'ancienne supprimée.
CREATE TABLE lead_delivery_nouvelle (
  lead_id TEXT NOT NULL REFERENCES lead (id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (
    channel IN ('notify_anne', 'confirm_prospect', 'guide', 'modelo') OR channel LIKE 'sequence:%'
  ),
  due_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  delivered_at TEXT,
  last_error TEXT,
  PRIMARY KEY (lead_id, channel)
);
INSERT INTO lead_delivery_nouvelle SELECT lead_id, channel, due_at, status, attempts, delivered_at, last_error FROM lead_delivery;
DROP TABLE lead_delivery;
ALTER TABLE lead_delivery_nouvelle RENAME TO lead_delivery;
CREATE INDEX lead_delivery_a_faire ON lead_delivery (status, due_at);
