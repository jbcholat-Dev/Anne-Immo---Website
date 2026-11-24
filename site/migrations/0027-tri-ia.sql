-- Migration 0027 (story 18.25, décision de JB du 2026-11-24, AD-37) : tri des appels par l'API Claude.
-- Une table neuve, aucune table existante touchée :
--   - `tri_ia` : la proposition de l'API pour un numéro inconnu de Leedflow (une ligne par numéro) : classement, action
--     datée, raison en une phrase, parcours et réponses préremplies de « Qualifier ». Rien n'est écrit sur une fiche ni sur
--     une carte : Anne décide d'un geste (AD-20). Écrivain unique : espace/src/server/tri-ia.ts.
--   - `empreinte` : l'empreinte du texte envoyé ; un même texte n'est pas renvoyé. `essais` et `erreur` : le dernier échec
--     (panne, refus, format), la carte reste alors non triée ; au-delà de 3 essais sur le même texte, plus d'envoi.
-- Les classements sont vérifiés par le code, pas par la base (AD-35). Ménage : une proposition de plus de 30 jours dont
-- le numéro n'a plus de carte ouverte est effacée (tri-ia.ts, `menageTri`).
-- Une erreur se corrige par une migration suivante, jamais en modifiant celle-ci une fois poussée.

CREATE TABLE tri_ia (
  telephone TEXT PRIMARY KEY,                 -- E.164, le numéro de la carte « Nouveaux »
  empreinte TEXT NOT NULL,
  classement TEXT,                            -- vendeur, acheteur, partenaire, prive, demarchage, sans_suite ; NULL tant qu'aucune réponse valable
  action TEXT,
  echeance TEXT CHECK (echeance IS NULL OR echeance GLOB '[0-9][0-9][0-9][0-9]-[0-1][0-9]-[0-3][0-9]'),
  raison TEXT,
  parcours TEXT CHECK (parcours IS NULL OR parcours IN ('vendeur', 'acheteur')),
  qualification TEXT,                         -- JSON des réponses de « Qualifier » données par les résumés
  modele TEXT NOT NULL,
  trie_le TEXT NOT NULL,
  essais INTEGER NOT NULL DEFAULT 1,
  erreur TEXT
);
CREATE INDEX tri_ia_trie_le ON tri_ia (trie_le);
