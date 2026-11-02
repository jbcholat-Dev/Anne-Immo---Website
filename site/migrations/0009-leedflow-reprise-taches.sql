-- Migration 0009 (story 13.10, retour de JB du 2026-10-21) : les tâches Leedflow d'un numéro inconnu de l'espace sont
-- désormais gardées avec lui (montrées sur sa page, proposées à la création du contact). Celles des 30 derniers jours
-- avaient été écartées par les premiers passages : la relève des tâches repart du début pour les reprendre.
-- Sans risque de doublon (une tâche par identifiant Leedflow) ni de retour d'une tâche déjà acceptée ou ignorée.
UPDATE leedflow_releve SET curseur = 0 WHERE genre = 'tache';
