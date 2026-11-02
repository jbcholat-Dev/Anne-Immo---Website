-- Migration 0017 (story 10.14, AD-11) : test A/B de la publicité (atterrissage sur l'accueil ou directement sur la question 1).
-- Trois étapes de plus dans l'entonnoir, toujours sans cookie ni donnée personnelle :
-- - « accueil » : arrivée sur la page d'accueil ;
-- - « clic » : clic sur un des deux boutons de l'accueil (`ecran` = diagnostic ou estimation) ;
-- - « estimation » : sur la page Contact, premier geste dans l'agenda (`ecran` = agenda) ou dans le formulaire
--   (formulaire), rendez-vous réservé (reservation) et demande envoyée par le formulaire (demande).
-- SQLite ne sait pas modifier une contrainte CHECK : la table est refaite, ses lignes recopiées, ses index recréés.
CREATE TABLE entonnoir_nouvelle (
  parcours TEXT NOT NULL,
  etape TEXT NOT NULL CHECK (etape IN ('arrivee', 'reprise', 'ecran', 'interaction', 'coordonnees', 'envoi', 'echec', 'resultat', 'accueil', 'clic', 'estimation')),
  ecran TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT '',
  support TEXT NOT NULL DEFAULT '',
  campagne TEXT NOT NULL DEFAULT '',
  contenu TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL CHECK (lang IN ('fr', 'en')),
  is_test INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0, 1)),
  at TEXT NOT NULL,
  integre INTEGER CHECK (integre IS NULL OR integre IN (0, 1)),
  appareil TEXT NOT NULL DEFAULT '' CHECK (appareil IN ('', 'ios', 'android', 'ordinateur')),
  affichage TEXT NOT NULL DEFAULT '' CHECK (affichage IN ('', 'moins-2s', '2-5s', 'plus-5s', 'cachee'))
);
INSERT INTO entonnoir_nouvelle (parcours, etape, ecran, source, support, campagne, contenu, lang, is_test, at, integre, appareil, affichage)
  SELECT parcours, etape, ecran, source, support, campagne, contenu, lang, is_test, at, integre, appareil, affichage FROM entonnoir;
DROP TABLE entonnoir;
ALTER TABLE entonnoir_nouvelle RENAME TO entonnoir;
CREATE UNIQUE INDEX entonnoir_passage ON entonnoir (parcours, etape, ecran);
CREATE INDEX entonnoir_at ON entonnoir (at);
