-- Migration 0013 (story 13.26, AD-21) : l'accord d'un contact pour recevoir les campagnes e-mail d'Anne.
-- L'accord donné sur le site reste sur la demande (`lead.newsletter_opt_in_at`, AD-16) et se lit de là ; ces colonnes
-- portent ce que le site ne sait pas : l'accord noté par Anne ou venu d'un import, et le refus d'en recevoir.
-- La décision « peut recevoir une campagne » est prise par une seule fonction (espace/src/server/accord.ts).
ALTER TABLE contact ADD COLUMN email_accord_le TEXT;        -- ISO UTC : accord noté par Anne ou donné à l'import
ALTER TABLE contact ADD COLUMN email_accord_source TEXT CHECK (email_accord_source IS NULL OR email_accord_source IN ('anne', 'import'));
ALTER TABLE contact ADD COLUMN email_desinscrit_le TEXT;    -- ISO UTC : ne veut plus d'e-mails groupés (lien, ou demande faite à Anne)
-- Un prescripteur reçoit les messages liés à son métier (règle des professionnels) tant qu'il ne les refuse pas.
ALTER TABLE prescripteur ADD COLUMN email_desinscrit_le TEXT;

-- Reprise : un contact importé avec la case « accepte d'être recontacté » cochée a donné son accord à cette date.
UPDATE contact SET email_accord_le = created_at, email_accord_source = 'import'
 WHERE rappel_individuel_seul = 0 AND email_accord_le IS NULL
   AND EXISTS (SELECT 1 FROM contact_evenement e WHERE e.contact_id = contact.id AND e.type = 'creation' AND e.source = 'import');
