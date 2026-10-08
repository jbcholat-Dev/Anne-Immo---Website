-- Migration 0006 (story 10.7) : journal des droits RGPD exercés (AD-18) et index de la purge à 3 ans (AD-16).
-- Une ligne par demande traitée depuis l'espace de gestion : date, type (accès ou effacement), empreinte de l'adresse
-- e-mail (SHA-256 tronquée, l'adresse elle-même n'est pas gardée), nombre de demandes concernées, compte qui a agi.
CREATE TABLE droit_exerce (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  a TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('acces', 'effacement')),
  email_empreinte TEXT NOT NULL,
  leads INTEGER NOT NULL,
  par TEXT NOT NULL
);

CREATE INDEX lead_derniere_activite ON lead (last_activity_at);
