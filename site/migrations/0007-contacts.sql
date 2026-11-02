-- Migration 0007 (story 13.4, AD-20, CAP-12 v7) : les contacts de l'espace d'Anne.
-- Une ligne `contact` par personne, quel que soit le nombre de demandes ; chaque demande du site (`lead`) y est rattachée
-- par `lead.contact_id`. L'historique vit dans `contact_evenement`. Les passages de boîtage et les prescripteurs sont les
-- deux origines « précises » d'un contact (boîtage, recommandation). Dates : texte ISO 8601 en UTC ; une date sans heure
-- (prochaine action, réveil, passage) est écrite AAAA-MM-JJ.

CREATE TABLE prescripteur (
  id TEXT PRIMARY KEY,                        -- ULID
  created_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL,
  nom TEXT NOT NULL,
  role TEXT,                                  -- notaire, conseiller en patrimoine, ancienne cliente…
  commune TEXT,
  telephone TEXT,                             -- E.164
  email TEXT,                                 -- en minuscules
  notes TEXT,
  dernier_contact_le TEXT,
  prochaine_relance_le TEXT,
  relance_raison TEXT,
  is_test INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0, 1))
);

CREATE TABLE passage_boitage (
  id TEXT PRIMARY KEY,                        -- ULID
  created_at TEXT NOT NULL,
  secteur TEXT NOT NULL,
  fait_le TEXT NOT NULL,                      -- AAAA-MM-JJ
  mots INTEGER CHECK (mots IS NULL OR mots >= 0),
  is_test INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0, 1))
);
CREATE INDEX passage_boitage_secteur ON passage_boitage (secteur, fait_le);

CREATE TABLE contact (
  id TEXT PRIMARY KEY,                        -- ULID
  created_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL,
  prenom TEXT,
  nom TEXT,
  telephone TEXT,                             -- E.164
  email TEXT,                                 -- en minuscules
  -- Parcours : connu dès l'arrivée pour la plupart des sources, sinon fixé à la qualification.
  parcours TEXT CHECK (parcours IS NULL OR parcours IN ('vendeur', 'acheteur')),
  etape TEXT NOT NULL CHECK (etape IN (
    'a_qualifier',
    'premier_rdv', 'estimation', 'second_rdv', 'mandat_exclusif', 'en_vente', 'vendu',
    'besoin_defini', 'mandat_recherche', 'visites', 'offre_acceptee', 'acte_signe',
    'en_sommeil', 'perdu'
  )),
  prochaine_action TEXT,
  prochaine_action_le TEXT,                   -- AAAA-MM-JJ ou date et heure ISO
  reveil_le TEXT,                             -- AAAA-MM-JJ, seulement en sommeil
  motif_perte TEXT,                           -- seulement perdu
  -- Origine précise (CAP-12 v7) : le canal, et quand il y a lieu le passage de boîtage ou le prescripteur.
  canal TEXT NOT NULL CHECK (canal IN ('boitage', 'recommandation', 'evenement', 'site', 'portail', 'reseaux', 'rencontre', 'autre')),
  origine_detail TEXT,                        -- formulaire du site, nom de l'événement, référence de l'annonce…
  passage_id TEXT REFERENCES passage_boitage (id) ON DELETE SET NULL,
  prescripteur_id TEXT REFERENCES prescripteur (id) ON DELETE SET NULL,
  bien_ref TEXT,
  commune TEXT,
  -- Qualification en deux minutes (story 13.6) : les cinq réponses, en JSON, et la date où elle a été faite.
  qualification TEXT,
  qualifie_le TEXT,
  rappel_individuel_seul INTEGER NOT NULL DEFAULT 0 CHECK (rappel_individuel_seul IN (0, 1)),
  is_test INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0, 1)),
  -- Règle métier d'AD-20, tenue par la base elle-même : un contact actif a toujours une prochaine action datée,
  -- un contact en sommeil une date de réveil, un contact perdu un motif.
  CHECK (
    etape IN ('vendu', 'acte_signe')
    OR (etape = 'perdu' AND motif_perte IS NOT NULL AND motif_perte <> '')
    OR (etape = 'en_sommeil' AND reveil_le IS NOT NULL)
    OR (etape NOT IN ('perdu', 'en_sommeil') AND prochaine_action_le IS NOT NULL)
  ),
  CHECK (telephone IS NOT NULL OR email IS NOT NULL OR nom IS NOT NULL)
);
-- Une personne n'existe qu'une fois : même téléphone E.164 ou même e-mail = même contact.
CREATE UNIQUE INDEX contact_telephone ON contact (telephone) WHERE telephone IS NOT NULL;
CREATE UNIQUE INDEX contact_email ON contact (email) WHERE email IS NOT NULL;
CREATE INDEX contact_etape ON contact (etape, prochaine_action_le);
CREATE INDEX contact_reveil ON contact (reveil_le) WHERE etape = 'en_sommeil';
CREATE INDEX contact_derniere_activite ON contact (last_activity_at);

CREATE TABLE contact_evenement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id TEXT NOT NULL REFERENCES contact (id) ON DELETE CASCADE,
  a TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('creation', 'demande', 'note', 'etape', 'qualification', 'appel', 'email')),
  source TEXT NOT NULL CHECK (source IN ('site', 'anne', 'import', 'portail', 'leedflow')),
  source_id TEXT,                             -- identifiant dans la source (lead, appel Leedflow, e-mail) : idempotence
  texte TEXT,
  donnees TEXT,                               -- JSON
  par TEXT                                    -- compte qui a agi, quand c'est Anne ou JB
);
CREATE UNIQUE INDEX contact_evenement_source ON contact_evenement (source, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX contact_evenement_contact ON contact_evenement (contact_id, a);

-- Chaque demande du site est rattachée à son contact (rattachement : site/src/server/contacts.ts).
ALTER TABLE lead ADD COLUMN contact_id TEXT REFERENCES contact (id) ON DELETE SET NULL;
CREATE INDEX lead_contact ON lead (contact_id);
