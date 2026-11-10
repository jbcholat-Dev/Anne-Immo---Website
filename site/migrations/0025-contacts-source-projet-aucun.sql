-- Migration 0025 (story 18.21, tickets n° 264, 265 et 266 d'Anne) : trois changements sur `contact`, qui imposent de reconstruire la
-- table (SQLite ne sait pas élargir un CHECK, comme en 0018 et 0020) :
--   1. projet « aucun » (n° 266) : accepté dans la liste de `projet`. Comme « à qualifier » et « ambassadeur », il n'a pas de
--      température (le CHECK de cohérence le range avec eux).
--   2. canal « pige » (n° 265) : accepté dans la liste de `canal`. La colonne « Source » du tableau des contacts devient
--      l'origine d'affaires d'Anne (pige, boîtage, portails d'annonce, reco, évènementiel, autres), écrite dans `canal`.
--   3. colonne `ambassadeur_partant_le` (n° 264) : date (AAAA-MM-JJ) à laquelle Anne a noté « m'a dit qu'il me préviendrait »
--      pour un ambassadeur qui n'est pas inscrit sur le site ; vide = pas noté. Posée et retirée à la main, jamais par un import.
-- La table est reconstruite à l'identique de son état après 0024 (colonnes `r1_le` et `r2_le` de 0024 comprises), avec ces trois
-- changements. Même méthode que 0020 (voir son en-tête) : D1 efface en cascade les tables filles quand `contact` est supprimée,
-- même avec des clés différées ; on copie donc d'abord ces tables dans des tables ordinaires `_sauve_*`, on reconstruit
-- `contact`, puis on restaure et on supprime les copies. Seule différence avec 0020 : `contact_source` a deux colonnes de plus
-- depuis 0021 (`lieu`, `mois`), restaurées elles aussi. Rien n'est perdu : la répétition `site/scripts/e2e-migration-0025.mjs`
-- compare chaque table avant et après. Une erreur se corrige par une migration 0026, jamais en modifiant celle-ci une fois poussée.

PRAGMA defer_foreign_keys = true;

-- Relance après un arrêt à mi-chemin : des copies d'un essai interrompu ne doivent pas faire buter la création.
DROP TABLE IF EXISTS _sauve_contact_evenement;
DROP TABLE IF EXISTS _sauve_leedflow_tache;
DROP TABLE IF EXISTS _sauve_leedflow_lien;
DROP TABLE IF EXISTS _sauve_campagne_destinataire;
DROP TABLE IF EXISTS _sauve_contact_coordonnee;
DROP TABLE IF EXISTS _sauve_contact_source;
DROP TABLE IF EXISTS _sauve_nouveau;
DROP TABLE IF EXISTS _sauve_leedflow_ecarte;
DROP TABLE IF EXISTS _sauve_lead_contact;
DROP TABLE IF EXISTS _sauve_portail_contact;
DROP TABLE IF EXISTS contact_neuf;

-- 1. Sauvegarde de tout ce qui référence `contact`.
CREATE TABLE _sauve_contact_evenement AS SELECT * FROM contact_evenement;
CREATE TABLE _sauve_leedflow_tache AS SELECT * FROM leedflow_tache;
CREATE TABLE _sauve_leedflow_lien AS SELECT * FROM leedflow_lien;
CREATE TABLE _sauve_campagne_destinataire AS SELECT * FROM campagne_destinataire;
CREATE TABLE _sauve_contact_coordonnee AS SELECT * FROM contact_coordonnee;
CREATE TABLE _sauve_contact_source AS SELECT * FROM contact_source;
CREATE TABLE _sauve_nouveau AS SELECT * FROM nouveau;
CREATE TABLE _sauve_leedflow_ecarte AS SELECT * FROM leedflow_ecarte WHERE contact_id IS NOT NULL;
CREATE TABLE _sauve_lead_contact AS SELECT id, contact_id FROM lead WHERE contact_id IS NOT NULL;
CREATE TABLE _sauve_portail_contact AS SELECT id, contact_id FROM portail_courriel WHERE contact_id IS NOT NULL;

-- 2. La nouvelle table : le schéma de `contact` à jour de 0001 à 0024, avec les trois changements ci-dessus.
CREATE TABLE contact_neuf (
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
  canal TEXT CHECK (canal IS NULL OR canal IN ('pige', 'boitage', 'recommandation', 'evenement', 'site', 'portail', 'reseaux', 'rencontre', 'autre')),
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
  projet TEXT NOT NULL DEFAULT 'a_qualifier' CHECK (projet IN ('a_qualifier', 'vendeur', 'acheteur', 'vendeur_acheteur', 'ambassadeur', 'sponsoring', 'aucun')),
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
  r1_le TEXT CHECK (r1_le IS NULL OR r1_le GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),  -- 0024 : date du premier rendez-vous
  r2_le TEXT CHECK (r2_le IS NULL OR r2_le GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),  -- 0024 : date du second rendez-vous
  ambassadeur_partant_le TEXT CHECK (ambassadeur_partant_le IS NULL OR ambassadeur_partant_le GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),  -- 0025 : « m'a dit qu'il me préviendrait » (à la main)
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
  CHECK (temperature IS NULL OR projet NOT IN ('a_qualifier', 'ambassadeur', 'aucun')),
  CHECK (temperature IS NOT 'en_vente' OR projet IN ('vendeur', 'vendeur_acheteur')),
  CHECK (temperature IS NOT 'recherche_active' OR projet = 'acheteur'),
  CHECK (ambassadeur_reglement IS NULL OR ambassadeur_inscrit_le IS NOT NULL)
);

INSERT INTO contact_neuf (
  id, created_at, last_activity_at, prenom, nom, telephone, email, parcours, etape, prochaine_action,
  prochaine_action_le, reveil_le, motif_perte, canal, origine_detail, passage_id, prescripteur_id, bien_ref, commune,
  qualification, qualifie_le, rappel_individuel_seul, is_test, action_id, synthese_leedflow, synthese_leedflow_le,
  synthese_lue_le, synthese, synthese_le, email_accord_le, email_accord_source, email_desinscrit_le, projet,
  temperature, categorie_id, entreprise, verifie_le, ecarte_le, dernier_contact_le, dernier_contact_canal,
  appel_autorise, a_rappeler_le, ambassadeur_inscrit_le, ambassadeur_reglement, suivi_le, r1_le, r2_le
)
SELECT
  id, created_at, last_activity_at, prenom, nom, telephone, email, parcours, etape, prochaine_action,
  prochaine_action_le, reveil_le, motif_perte, canal, origine_detail, passage_id, prescripteur_id, bien_ref, commune,
  qualification, qualifie_le, rappel_individuel_seul, is_test, action_id, synthese_leedflow, synthese_leedflow_le,
  synthese_lue_le, synthese, synthese_le, email_accord_le, email_accord_source, email_desinscrit_le, projet,
  temperature, categorie_id, entreprise, verifie_le, ecarte_le, dernier_contact_le, dernier_contact_canal,
  appel_autorise, a_rappeler_le, ambassadeur_inscrit_le, ambassadeur_reglement, suivi_le, r1_le, r2_le
FROM contact;

-- 3. Remplacement. La suppression vide en cascade les tables filles (sauvegardées en 1).
DROP TABLE contact;
ALTER TABLE contact_neuf RENAME TO contact;

-- Les index de 0007, 0010 et 0018 (unicité partielle du téléphone et de l'e-mail comprise) et le déclencheur de 0010.
CREATE UNIQUE INDEX contact_telephone ON contact (telephone) WHERE telephone IS NOT NULL;
CREATE UNIQUE INDEX contact_email ON contact (email) WHERE email IS NOT NULL;
CREATE INDEX contact_etape ON contact (etape, prochaine_action_le);
CREATE INDEX contact_reveil ON contact (reveil_le) WHERE etape = 'en_sommeil';
CREATE INDEX contact_derniere_activite ON contact (last_activity_at);
CREATE INDEX contact_action ON contact (action_id);
CREATE INDEX contact_categorie ON contact (categorie_id);

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

-- 4. Restauration, avec les mêmes identifiants (le compteur des événements est celui de la table, resté en place).
INSERT INTO contact_evenement (id, contact_id, a, type, source, source_id, texte, donnees, par)
  SELECT id, contact_id, a, type, source, source_id, texte, donnees, par FROM _sauve_contact_evenement;
INSERT INTO leedflow_tache (id, contact_id, a, texte, echeance, statut, decide_le, par)
  SELECT id, contact_id, a, texte, echeance, statut, decide_le, par FROM _sauve_leedflow_tache;
INSERT INTO leedflow_lien (leedflow_contact, contact_id) SELECT leedflow_contact, contact_id FROM _sauve_leedflow_lien;
INSERT INTO campagne_destinataire (campagne_id, contact_id, email, prenom, statut, essais, prochain_essai, envoye_le, erreur)
  SELECT campagne_id, contact_id, email, prenom, statut, essais, prochain_essai, envoye_le, erreur FROM _sauve_campagne_destinataire;
INSERT INTO contact_coordonnee (id, contact_id, type, reseau, valeur, ajoute_le)
  SELECT id, contact_id, type, reseau, valeur, ajoute_le FROM _sauve_contact_coordonnee;
INSERT INTO contact_source (id, contact_id, source, import_lot_id, a, lieu, mois)
  SELECT id, contact_id, source, import_lot_id, a, lieu, mois FROM _sauve_contact_source;
INSERT INTO leedflow_ecarte (telephone, a, par, categorie, contact_id)
  SELECT telephone, a, par, categorie, contact_id FROM _sauve_leedflow_ecarte;
-- « Nouveaux » : les cartes d'un contact ont été effacées en cascade ; celles sans contact ont pu perdre leur événement.
DELETE FROM nouveau;
INSERT INTO nouveau (id, source, recu_le, contact_id, leedflow_inconnu_id, evenement_id, vu_le, issue, portail_courriel_id)
  SELECT id, source, recu_le, contact_id, leedflow_inconnu_id, evenement_id, vu_le, issue, portail_courriel_id FROM _sauve_nouveau;
UPDATE lead SET contact_id = (SELECT s.contact_id FROM _sauve_lead_contact s WHERE s.id = lead.id)
  WHERE id IN (SELECT id FROM _sauve_lead_contact);
UPDATE portail_courriel SET contact_id = (SELECT s.contact_id FROM _sauve_portail_contact s WHERE s.id = portail_courriel.id)
  WHERE id IN (SELECT id FROM _sauve_portail_contact);

DROP TABLE _sauve_contact_evenement;
DROP TABLE _sauve_leedflow_tache;
DROP TABLE _sauve_leedflow_lien;
DROP TABLE _sauve_campagne_destinataire;
DROP TABLE _sauve_contact_coordonnee;
DROP TABLE _sauve_contact_source;
DROP TABLE _sauve_nouveau;
DROP TABLE _sauve_leedflow_ecarte;
DROP TABLE _sauve_lead_contact;
DROP TABLE _sauve_portail_contact;
