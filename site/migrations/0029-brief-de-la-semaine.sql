-- Migration 0029 (story 18.27, fiche de poste du chief of staff, demande de JB du 2026-11-24) : le brief de la semaine,
-- déposé par le chief of staff (Claude) après un point avec JB, par le jeton de service de Claude (/api/claude/brief).
-- Une table neuve, aucune table existante touchée :
--   - `brief_semaine` : une ligne par semaine (le lundi), avec deux textes courts de pilotage : « le point qui bloque » et
--     « la décision à prendre ». Un nouveau dépôt pour la même semaine remplace l'ancien. Aucun nom de contact : texte de
--     pilotage seulement ; le code refuse un texte qui contient un e-mail ou un numéro de téléphone.
--     Écrivain unique : espace/src/server/brief-semaine.ts.
-- Une erreur se corrige par une migration suivante, jamais en modifiant celle-ci une fois poussée.

CREATE TABLE brief_semaine (
  lundi TEXT PRIMARY KEY CHECK (lundi GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  bloque TEXT NOT NULL,
  decision TEXT NOT NULL,
  signe TEXT NOT NULL,                        -- « chief of staff »
  depose_par TEXT NOT NULL,                   -- compte qui a déposé (toujours le compte de service de Claude)
  depose_le TEXT NOT NULL
);
