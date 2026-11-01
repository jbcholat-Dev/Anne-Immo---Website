-- Migration 0018 (story 18.2, AD-22 à AD-27, AD-31, AD-34) : la table des contacts devient le carnet entier d'Anne.
-- Jusqu'ici chaque contact était « suivi » (dans le pipeline : étape et canal d'origine obligatoires). Le carnet accueille
-- désormais aussi les personnes qu'Anne connaît sans projet en cours (téléphone, LinkedIn, EDB…) : `etape` NULL = contact
-- du carnet, hors suivi ; `canal` NULL = pas d'origine marketing (import). La règle « prochaine action datée » (AD-20)
-- ne vaut plus que pour un contact suivi. Nouvelles colonnes : projet et température (AD-24), catégorie (AD-25),
-- entreprise, vérifié, écarté (AD-31), dernier contact (AD-28), appel autorisé, à rappeler, marque « inscrit ambassadeur »
-- (AD-22) et `suivi_le` (revue de la story 18.1 : date d'entrée dans le suivi d'un contact qui était au carnet ; NULL pour
-- un contact créé directement dans le suivi ; la relève Leedflow ne lui verse pas les échanges antérieurs).
--
-- ORDRE IMPOSÉ PAR D1 (AD-23) : supprimer `contact` efface en cascade ses tables filles, même avec des clés différées.
-- On les copie donc d'abord dans des tables ordinaires `_sauve_*` (une table TEMP ne survit pas d'une instruction à
-- l'autre dans D1), on reconstruit `contact`, puis on les restaure et on supprime les copies.
-- Une erreur se corrige par une migration 0019, jamais en modifiant celle-ci une fois poussée.

-- 1. Les catégories (AD-25, PRD FR-12, FR-13) : six catégories de départ à identifiants fixes, avec leur méthode.
-- `envoi_groupe_permis` = 1 : l'envoi groupé est possible, toujours sous réserve de l'accord vérifié par
-- espace/src/server/accord.ts (accord enregistré, ou ancien client ; désinscriptions vérifiées avant chaque envoi).
CREATE TABLE categorie (
  id TEXT PRIMARY KEY,                        -- identifiant fixe pour les six de départ, ULID pour les suivantes
  nom TEXT NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  canal_conseille TEXT,                       -- texte libre : « appel ou message personnel »…
  demande TEXT,                               -- ce qu'on demande : recommander, proposer le diagnostic…
  appel_permis INTEGER NOT NULL DEFAULT 0 CHECK (appel_permis IN (0, 1)),
  envoi_groupe_permis INTEGER NOT NULL DEFAULT 0 CHECK (envoi_groupe_permis IN (0, 1))
);
INSERT INTO categorie (id, nom, ordre, canal_conseille, demande, appel_permis, envoi_groupe_permis) VALUES
  ('anciens_clients', 'Anciens clients', 1, 'Appel ou message personnel', 'Un avis et une recommandation (parrainage, dès l''accord d''eXp)', 1, 1),
  ('proches', 'Proches', 2, 'Message personnel, un par un (SMS, WhatsApp, appel)', 'Prendre des nouvelles et parler du parrainage', 1, 0),
  ('edb', 'Rencontrés à l''EDB', 3, 'E-mail « on s''était vus à l''animation »', 'Proposer le diagnostic offert', 0, 1),
  ('partenaires', 'Partenaires pros', 4, 'Rencontre ou appel', 'Échanger des recommandations', 1, 1),
  ('lointains', 'Relations lointaines', 5, 'Message privé quand la personne réagit à une publication', 'Pas de message groupé', 0, 0),
  ('demandes_recues', 'Demandes reçues', 6, 'Appel ou e-mail, vite', 'Répondre à la demande (envoi groupé seulement avec l''accord)', 1, 1);

-- Messages types d'une catégorie (AD-25), écrits par JB ; `{prénom}` est remplacé à l'affichage.
CREATE TABLE message_type (
  id TEXT PRIMARY KEY,                        -- ULID
  categorie_id TEXT NOT NULL REFERENCES categorie (id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  texte TEXT NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX message_type_categorie ON message_type (categorie_id, ordre);

-- 2. Sauvegarde des tables filles et des rattachements des demandes du site.
CREATE TABLE _sauve_contact_evenement AS SELECT * FROM contact_evenement;
CREATE TABLE _sauve_leedflow_tache AS SELECT * FROM leedflow_tache;
CREATE TABLE _sauve_leedflow_lien AS SELECT * FROM leedflow_lien;
CREATE TABLE _sauve_campagne_destinataire AS SELECT * FROM campagne_destinataire;
CREATE TABLE _sauve_lead_contact AS SELECT id, contact_id FROM lead WHERE contact_id IS NOT NULL;

-- 3. La nouvelle table : colonnes de 0007, 0010, 0012, 0013, puis celles d'AD-22 et AD-24.
CREATE TABLE contact_nouveau (
  id TEXT PRIMARY KEY,                        -- ULID
  created_at TEXT NOT NULL,
  last_activity_at TEXT NOT NULL,
  prenom TEXT,
  nom TEXT,
  telephone TEXT,                             -- E.164
  email TEXT,                                 -- en minuscules
  parcours TEXT CHECK (parcours IS NULL OR parcours IN ('vendeur', 'acheteur')),
  -- NULL = contact du carnet, hors suivi (AD-22).
  etape TEXT CHECK (etape IS NULL OR etape IN (
    'a_qualifier',
    'premier_rdv', 'estimation', 'second_rdv', 'mandat_exclusif', 'en_vente', 'vendu',
    'besoin_defini', 'mandat_recherche', 'visites', 'offre_acceptee', 'acte_signe',
    'en_sommeil', 'perdu'
  )),
  prochaine_action TEXT,
  prochaine_action_le TEXT,
  reveil_le TEXT,
  motif_perte TEXT,
  -- NULL = pas d'origine marketing (contact importé) : le déclencheur `contact_action_auto` ne fait rien.
  canal TEXT CHECK (canal IS NULL OR canal IN ('boitage', 'recommandation', 'evenement', 'site', 'portail', 'reseaux', 'rencontre', 'autre')),
  origine_detail TEXT,
  passage_id TEXT REFERENCES passage_boitage (id) ON DELETE SET NULL,
  prescripteur_id TEXT REFERENCES prescripteur (id) ON DELETE SET NULL,
  bien_ref TEXT,
  commune TEXT,
  qualification TEXT,
  qualifie_le TEXT,
  rappel_individuel_seul INTEGER NOT NULL DEFAULT 0 CHECK (rappel_individuel_seul IN (0, 1)),
  is_test INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0, 1)),
  action_id TEXT REFERENCES action_marketing (id) ON DELETE SET NULL,           -- 0010
  synthese_leedflow TEXT,                                                       -- 0012
  synthese_leedflow_le TEXT,
  synthese_lue_le TEXT,
  synthese TEXT,
  synthese_le TEXT,
  email_accord_le TEXT,                                                         -- 0013
  email_accord_source TEXT CHECK (email_accord_source IS NULL OR email_accord_source IN ('anne', 'import')),
  email_desinscrit_le TEXT,
  -- Carnet (AD-22, AD-24, AD-25, AD-28, AD-31).
  projet TEXT NOT NULL DEFAULT 'a_qualifier' CHECK (projet IN ('a_qualifier', 'vendeur', 'acheteur', 'vendeur_acheteur', 'ambassadeur')),
  temperature TEXT CHECK (temperature IS NULL OR temperature IN ('froid', 'tiede', 'chaud', 'en_vente', 'recherche_active', 'avec_anne', 'termine')),
  categorie_id TEXT REFERENCES categorie (id),  -- une catégorie ne se supprime que vide (AD-25)
  entreprise TEXT,
  verifie_le TEXT,                            -- ISO UTC : catégorie confirmée par Anne ou JB
  ecarte_le TEXT,                             -- ISO UTC : écarté (pas effacé, AD-31)
  dernier_contact_le TEXT,                    -- ISO UTC : écrit seulement par la coche « contacté » d'une séance (AD-28)
  dernier_contact_canal TEXT CHECK (dernier_contact_canal IS NULL OR dernier_contact_canal IN ('whatsapp', 'sms', 'email', 'appel', 'rencontre', 'autre')),
  appel_autorise INTEGER CHECK (appel_autorise IS NULL OR appel_autorise IN (0, 1)),   -- NULL = règle de la catégorie
  a_rappeler_le TEXT,                         -- AAAA-MM-JJ
  ambassadeur_inscrit_le TEXT,                -- ISO UTC : inscription au programme ambassadeurs (marque à part du projet)
  ambassadeur_reglement TEXT,                 -- version du règlement accepté
  suivi_le TEXT,                              -- ISO UTC : entrée dans le suivi d'un contact qui était au carnet
  -- Règle d'AD-20, pour les seuls contacts suivis.
  CHECK (
    etape IS NULL
    OR etape IN ('vendu', 'acte_signe')
    OR (etape = 'perdu' AND motif_perte IS NOT NULL AND motif_perte <> '')
    OR (etape = 'en_sommeil' AND reveil_le IS NOT NULL)
    OR (etape NOT IN ('perdu', 'en_sommeil') AND prochaine_action_le IS NOT NULL)
  ),
  CHECK (telephone IS NOT NULL OR email IS NOT NULL OR nom IS NOT NULL),
  -- Cohérence projet / température (AD-24).
  CHECK (temperature IS NULL OR projet NOT IN ('a_qualifier', 'ambassadeur')),
  CHECK (temperature IS NOT 'en_vente' OR projet IN ('vendeur', 'vendeur_acheteur')),
  CHECK (temperature IS NOT 'recherche_active' OR projet = 'acheteur'),
  CHECK (ambassadeur_reglement IS NULL OR ambassadeur_inscrit_le IS NOT NULL)
);

-- Reprise (AD-23, AD-24) : projet = parcours, sinon à qualifier ; température « avec Anne » pour un contact suivi de
-- projet connu, ni perdu ni en sommeil, « terminé » pour une vente ou un achat conclu (projet connu seulement) ;
-- tous les contacts existants sont des demandes reçues (site, saisie, import de l'espace), catégorie vérifiée.
INSERT INTO contact_nouveau (
  id, created_at, last_activity_at, prenom, nom, telephone, email, parcours, etape, prochaine_action, prochaine_action_le,
  reveil_le, motif_perte, canal, origine_detail, passage_id, prescripteur_id, bien_ref, commune, qualification, qualifie_le,
  rappel_individuel_seul, is_test, action_id, synthese_leedflow, synthese_leedflow_le, synthese_lue_le, synthese, synthese_le,
  email_accord_le, email_accord_source, email_desinscrit_le,
  projet, temperature, categorie_id, verifie_le
)
SELECT
  id, created_at, last_activity_at, prenom, nom, telephone, email, parcours, etape, prochaine_action, prochaine_action_le,
  reveil_le, motif_perte, canal, origine_detail, passage_id, prescripteur_id, bien_ref, commune, qualification, qualifie_le,
  rappel_individuel_seul, is_test, action_id, synthese_leedflow, synthese_leedflow_le, synthese_lue_le, synthese, synthese_le,
  email_accord_le, email_accord_source, email_desinscrit_le,
  coalesce(parcours, 'a_qualifier'),
  CASE
    WHEN parcours IS NULL THEN NULL
    WHEN etape IN ('vendu', 'acte_signe') THEN 'termine'
    WHEN etape NOT IN ('perdu', 'en_sommeil') THEN 'avec_anne'
  END,
  'demandes_recues',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM contact;

-- 4. Remplacement. La suppression vide en cascade les tables filles et détache les demandes (sauvegardées en 2).
DROP TABLE contact;
ALTER TABLE contact_nouveau RENAME TO contact;

-- Les six index de 0007 et 0010, dont l'unicité partielle téléphone et e-mail, puis ceux du carnet.
CREATE UNIQUE INDEX contact_telephone ON contact (telephone) WHERE telephone IS NOT NULL;
CREATE UNIQUE INDEX contact_email ON contact (email) WHERE email IS NOT NULL;
CREATE INDEX contact_etape ON contact (etape, prochaine_action_le);
CREATE INDEX contact_reveil ON contact (reveil_le) WHERE etape = 'en_sommeil';
CREATE INDEX contact_derniere_activite ON contact (last_activity_at);
CREATE INDEX contact_action ON contact (action_id);
CREATE INDEX contact_categorie ON contact (categorie_id);

-- Le rattachement d'office à une action marketing (0010), sans effet pour un contact sans canal (import).
CREATE TRIGGER contact_action_auto AFTER INSERT ON contact
WHEN NEW.action_id IS NULL AND NEW.canal IS NOT NULL AND (
  SELECT count(*) FROM action_marketing a
  WHERE a.canal = NEW.canal AND a.debut <= substr(NEW.created_at, 1, 10) AND (a.fin IS NULL OR a.fin >= substr(NEW.created_at, 1, 10))
) = 1
BEGIN
  UPDATE contact SET action_id = (
    SELECT a.id FROM action_marketing a
    WHERE a.canal = NEW.canal AND a.debut <= substr(NEW.created_at, 1, 10) AND (a.fin IS NULL OR a.fin >= substr(NEW.created_at, 1, 10))
  ) WHERE id = NEW.id;
END;

-- 5. L'historique, reconstruit avec les types et sources élargis (import, fusion, séance, classement ; source claude).
DROP TABLE contact_evenement;
CREATE TABLE contact_evenement (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id TEXT NOT NULL REFERENCES contact (id) ON DELETE CASCADE,
  a TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('creation', 'demande', 'note', 'etape', 'qualification', 'appel', 'email', 'import', 'fusion', 'seance', 'classement')),
  source TEXT NOT NULL CHECK (source IN ('site', 'anne', 'import', 'portail', 'leedflow', 'claude')),
  source_id TEXT,
  texte TEXT,
  donnees TEXT,                               -- JSON ; pour une écriture du carnet : { avant, apres, lot } (AD-29)
  par TEXT
);
CREATE UNIQUE INDEX contact_evenement_source ON contact_evenement (source, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX contact_evenement_contact ON contact_evenement (contact_id, a);
INSERT INTO contact_evenement (id, contact_id, a, type, source, source_id, texte, donnees, par)
  SELECT id, contact_id, a, type, source, source_id, texte, donnees, par FROM _sauve_contact_evenement;

-- 6. Restauration des autres tables filles et des rattachements des demandes.
INSERT INTO leedflow_tache (id, contact_id, a, texte, echeance, statut, decide_le, par)
  SELECT id, contact_id, a, texte, echeance, statut, decide_le, par FROM _sauve_leedflow_tache;
INSERT INTO leedflow_lien (leedflow_contact, contact_id) SELECT leedflow_contact, contact_id FROM _sauve_leedflow_lien;
INSERT INTO campagne_destinataire (campagne_id, contact_id, email, prenom, statut, essais, prochain_essai, envoye_le, erreur)
  SELECT campagne_id, contact_id, email, prenom, statut, essais, prochain_essai, envoye_le, erreur FROM _sauve_campagne_destinataire;
UPDATE lead SET contact_id = (SELECT s.contact_id FROM _sauve_lead_contact s WHERE s.id = lead.id)
  WHERE id IN (SELECT id FROM _sauve_lead_contact);

DROP TABLE _sauve_contact_evenement;
DROP TABLE _sauve_leedflow_tache;
DROP TABLE _sauve_leedflow_lien;
DROP TABLE _sauve_campagne_destinataire;
DROP TABLE _sauve_lead_contact;

-- 7. Numéros classés de Leedflow : catégorie `prospect` en plus (numéro rattaché à la main à un contact du carnet,
-- AD-32, AD-34), avec le contact choisi. Reconstruction, car SQLite ne sait pas élargir un CHECK.
CREATE TABLE leedflow_ecarte_nouveau (
  telephone TEXT PRIMARY KEY,                 -- E.164
  a TEXT NOT NULL,
  par TEXT,
  categorie TEXT NOT NULL DEFAULT 'prive' CHECK (categorie IN ('prive', 'pro', 'demarchage', 'prospect')),
  contact_id TEXT REFERENCES contact (id) ON DELETE CASCADE
);
INSERT INTO leedflow_ecarte_nouveau (telephone, a, par, categorie) SELECT telephone, a, par, categorie FROM leedflow_ecarte;
DROP TABLE leedflow_ecarte;
ALTER TABLE leedflow_ecarte_nouveau RENAME TO leedflow_ecarte;
CREATE INDEX leedflow_ecarte_categorie ON leedflow_ecarte (categorie, a);
CREATE INDEX leedflow_ecarte_contact ON leedflow_ecarte (contact_id) WHERE contact_id IS NOT NULL;

-- 8. Autres numéros, e-mails et liens de profil d'un contact (AD-26) : le premier téléphone et le premier e-mail restent
-- sur `contact`. Une valeur n'appartient qu'à un contact.
CREATE TABLE contact_coordonnee (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id TEXT NOT NULL REFERENCES contact (id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('telephone', 'email', 'profil')),
  reseau TEXT,                                -- linkedin, instagram, facebook… pour un profil
  valeur TEXT NOT NULL UNIQUE,                -- E.164, e-mail en minuscules, ou adresse du profil
  ajoute_le TEXT NOT NULL,
  CHECK (reseau IS NULL OR type = 'profil')
);
CREATE INDEX contact_coordonnee_contact ON contact_coordonnee (contact_id);

-- Un import est un lot qui s'annule (AD-26). `fichier` ne garde que le nom du fichier, jamais son contenu (AD-31).
CREATE TABLE import_lot (
  id TEXT PRIMARY KEY,                        -- ULID
  fichier TEXT NOT NULL,                      -- nom du fichier seulement
  empreinte TEXT,                             -- empreinte du fichier, qui lie l'import à son aperçu
  source TEXT NOT NULL,                       -- telephone, linkedin, edb, suivi…
  a TEXT NOT NULL,
  par TEXT,
  nouveaux INTEGER NOT NULL DEFAULT 0,
  completes INTEGER NOT NULL DEFAULT 0,
  doublons INTEGER NOT NULL DEFAULT 0,
  rejetes INTEGER NOT NULL DEFAULT 0,
  annule_le TEXT
);

-- D'où vient chaque contact (une ou plusieurs sources). Reprise : les contacts existants viennent de l'espace.
CREATE TABLE contact_source (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id TEXT NOT NULL REFERENCES contact (id) ON DELETE CASCADE,
  source TEXT NOT NULL,                       -- espace, site, portail, leedflow, telephone, linkedin, edb, suivi, saisie…
  import_lot_id TEXT REFERENCES import_lot (id) ON DELETE SET NULL,
  a TEXT NOT NULL
);
CREATE INDEX contact_source_contact ON contact_source (contact_id);
CREATE INDEX contact_source_lot ON contact_source (import_lot_id) WHERE import_lot_id IS NOT NULL;
INSERT INTO contact_source (contact_id, source, a) SELECT id, 'espace', created_at FROM contact;

-- 9. Vues enregistrées du tableau (AD-27) : un nom et un filtre JSON, dans le vocabulaire fermé défini par
-- espace/src/server/vues (clés : categorie_id, projet, temperature, source, entreprise_contient, ville, verifie, ecarte,
-- accord, dernier_contact, pipeline, recherche, ambassadeur). « Tous les contacts » n'est pas en base.
CREATE TABLE vue (
  id TEXT PRIMARY KEY,                        -- ULID
  nom TEXT NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  filtre TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(filtre)),
  created_at TEXT NOT NULL,
  maj_le TEXT NOT NULL
);
INSERT INTO vue (id, nom, ordre, filtre, created_at, maj_le) VALUES
  ('01M6A6FT000000000000000001', 'À vérifier', 1, '{"verifie":"non"}', '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z'),
  ('01M6A6FT000000000000000002', 'Jamais recontactés', 2, '{"dernier_contact":"jamais"}', '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z'),
  ('01M6A6FT000000000000000003', 'Vendeurs chauds', 3, '{"projet":["vendeur","vendeur_acheteur"],"temperature":["chaud"]}', '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z'),
  ('01M6A6FT000000000000000004', 'Anciens clients', 4, '{"categorie_id":["anciens_clients"]}', '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z'),
  ('01M6A6FT000000000000000005', 'Ambassadeurs', 5, '{"ambassadeur":"oui"}', '2026-11-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z');

-- 10. Personnes qui ont demandé l'effacement (AD-31) : empreinte HMAC du téléphone E.164 ou de l'e-mail en minuscules,
-- lue par l'import (rejet) et rejouée après une restauration de la base.
CREATE TABLE opposition (
  empreinte TEXT PRIMARY KEY,
  le TEXT NOT NULL
);

-- 11. File « Nouveaux » (AD-34) : demandes reçues qu'Anne n'a pas encore regardées.
CREATE TABLE nouveau (
  id TEXT PRIMARY KEY,                        -- ULID
  source TEXT NOT NULL CHECK (source IN ('site', 'portail', 'leedflow')),
  recu_le TEXT NOT NULL,
  contact_id TEXT REFERENCES contact (id) ON DELETE CASCADE,
  leedflow_inconnu_id TEXT,                   -- source_id de leedflow_inconnu (la ligne peut être purgée depuis)
  evenement_id INTEGER REFERENCES contact_evenement (id) ON DELETE SET NULL,
  vu_le TEXT,
  issue TEXT CHECK (issue IS NULL OR issue IN ('range', 'vu', 'ecarte', 'ajoute', 'rattache', 'ignore')),
  CHECK ((vu_le IS NULL) = (issue IS NULL))
);
CREATE INDEX nouveau_a_voir ON nouveau (recu_le) WHERE vu_le IS NULL;
CREATE INDEX nouveau_contact ON nouveau (contact_id) WHERE contact_id IS NOT NULL;
