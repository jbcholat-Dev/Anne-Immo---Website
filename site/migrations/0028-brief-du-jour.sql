-- Migration 0028 (story 18.26, fiche de poste du chief of staff § 4 et § 6, AD-37) : le brief du jour de l'espace d'Anne.
-- Une table neuve, aucune table existante touchée :
--   - `brief_ligne` : une décision proposée un jour donné (3 à 5, 7 au plus), avec ce qu'Anne ou JB en a fait :
--     acceptée, remise à plus tard, écartée. `cle` dit d'où vient la ligne (« contact:<id> », « nouveau:<id> ») : une même
--     source n'est proposée qu'une fois par jour, et une ligne écartée n'est plus proposée pendant 7 jours.
--     `qui` porte le prénom et l'initiale du nom seulement. Écrivain unique : espace/src/server/brief.ts.
-- Phase 1 (fiche de poste § 6) : le brief n'est visible que des comptes listés dans le réglage BRIEF_LECTEURS ; rien ne part
-- par e-mail. Ménage : lignes de plus de 90 jours effacées (les totaux de la part acceptée portent sur 4 semaines).
-- Une erreur se corrige par une migration suivante, jamais en modifiant celle-ci une fois poussée.

CREATE TABLE brief_ligne (
  id TEXT PRIMARY KEY,                        -- ULID
  jour TEXT NOT NULL CHECK (jour GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  rang INTEGER NOT NULL CHECK (rang >= 1 AND rang <= 7),
  cle TEXT NOT NULL,
  genre TEXT NOT NULL,                        -- relance, demande, appel (vérifié par le code, AD-35)
  qui TEXT NOT NULL,
  raison TEXT NOT NULL,
  action TEXT NOT NULL,
  lien TEXT NOT NULL,                         -- adresse de l'espace à ouvrir (toujours « /… »)
  decision TEXT CHECK (decision IS NULL OR decision IN ('accepte', 'plus_tard', 'ecarte')),
  decide_le TEXT,
  decide_par TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (jour, cle),
  UNIQUE (jour, rang)
);
CREATE INDEX brief_ligne_cle ON brief_ligne (cle, decision);
