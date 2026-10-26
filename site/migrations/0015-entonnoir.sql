-- Migration 0015 (story 10.12, part « mesure » de la story 10.8, AD-11) : l'entonnoir du diagnostic, compté sans cookie.
-- Une ligne = un passage à une étape du parcours (arrivée sur la page, une question, l'écran des coordonnées, l'envoi,
-- le résultat). `parcours` est un nombre tiré au hasard à l'ouverture de la page, gardé en mémoire de la page seulement :
-- jamais déposé dans le navigateur, jamais relié à une demande (`lead`), aucune donnée personnelle (ni adresse IP, ni
-- navigateur). On compte des passages, pas des personnes. Les paramètres de campagne (utm_*) sont ceux du lien suivi.
-- Conservation : 13 mois (src/server/purge.ts).
CREATE TABLE entonnoir (
  parcours TEXT NOT NULL,                     -- ULID tiré à l'ouverture de la page
  etape TEXT NOT NULL CHECK (etape IN ('arrivee', 'reprise', 'ecran', 'coordonnees', 'envoi', 'echec', 'resultat')),
  ecran TEXT NOT NULL DEFAULT '',             -- identifiant de la question (q01…q15) pour l'étape « ecran », sinon vide
  source TEXT NOT NULL DEFAULT '',            -- utm_source (facebook, instagram…) ; vide = venu sans lien de campagne
  support TEXT NOT NULL DEFAULT '',           -- utm_medium
  campagne TEXT NOT NULL DEFAULT '',          -- utm_campaign
  contenu TEXT NOT NULL DEFAULT '',           -- utm_content (carrousel-1…)
  lang TEXT NOT NULL CHECK (lang IN ('fr', 'en')),
  is_test INTEGER NOT NULL DEFAULT 0 CHECK (is_test IN (0, 1)),
  at TEXT NOT NULL
);

-- Un passage compte une fois par étape : revenir en arrière puis repasser une question n'ajoute rien.
CREATE UNIQUE INDEX entonnoir_passage ON entonnoir (parcours, etape, ecran);
CREATE INDEX entonnoir_at ON entonnoir (at);
