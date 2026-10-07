-- Migration 0002 (story 10.2) : ce qui doit partir pour chaque lead (AD-4, AD-6).
-- channel : notify_anne, confirm_prospect, sequence:<étape>, modelo.
-- Une ligne est écrite avec le lead, puis exécutée et réessayée jusqu'à livraison.
CREATE TABLE lead_delivery (
  lead_id TEXT NOT NULL REFERENCES lead (id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (
    channel IN ('notify_anne', 'confirm_prospect', 'modelo') OR channel LIKE 'sequence:%'
  ),
  due_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  delivered_at TEXT,
  last_error TEXT,
  PRIMARY KEY (lead_id, channel)
);

CREATE INDEX lead_delivery_a_faire ON lead_delivery (status, due_at);
