-- Migration 0016 (story 10.13, AD-11) : trois informations de plus sur l'entonnoir du diagnostic, pour savoir pourquoi
-- les visiteurs venus de la publicité s'arrêtent à la question 1 (panne, lenteur ou désintérêt) :
-- - l'étape « interaction » : premier toucher, clic ou touche du clavier sur la question 1 ;
-- - `integre` (navigateur intégré d'Instagram ou de Facebook, 1, ou navigateur normal, 0) et `appareil` (ios, android,
--   ordinateur), déduits par le serveur de l'en-tête User-Agent, qui n'est pas gardé ; NULL et vide = non mesuré
--   (passages d'avant cette migration) ;
-- - `affichage`, sur la ligne de la question 1 seulement : temps mis par la page à afficher la question, en paliers
--   (moins-2s, 2-5s, plus-5s), ou « cachee » si la page a été affichée sans être à l'écran (préchargée par l'application
--   avant le clic, ou ouverte en arrière-plan).
-- SQLite ne sait pas modifier une contrainte CHECK : la table est refaite, ses lignes recopiées, ses index recréés.
CREATE TABLE entonnoir_nouvelle (
  parcours TEXT NOT NULL,
  etape TEXT NOT NULL CHECK (etape IN ('arrivee', 'reprise', 'ecran', 'interaction', 'coordonnees', 'envoi', 'echec', 'resultat')),
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
INSERT INTO entonnoir_nouvelle (parcours, etape, ecran, source, support, campagne, contenu, lang, is_test, at)
  SELECT parcours, etape, ecran, source, support, campagne, contenu, lang, is_test, at FROM entonnoir;
DROP TABLE entonnoir;
ALTER TABLE entonnoir_nouvelle RENAME TO entonnoir;
CREATE UNIQUE INDEX entonnoir_passage ON entonnoir (parcours, etape, ecran);
CREATE INDEX entonnoir_at ON entonnoir (at);
