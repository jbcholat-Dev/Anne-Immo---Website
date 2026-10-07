// Écriture d'un lead (AD-4, AD-6) : seul module qui crée des lignes `lead` et `lead_delivery`.
// Une seule transaction écrit le lead et ce qui doit partir pour lui. La clé d'idempotence `submission_id`
// (générée par la page) rend le renvoi sans effet : la deuxième fois, rien n'est écrit et on retrouve le premier lead.
import type { EnvSite } from './env';
import type { LeadFormulaire } from './schema';
import { ulid } from './ulid';

export interface Ecriture {
  leadId: string;
  /** Faux si ce `submission_id` avait déjà été écrit (renvoi). */
  nouveau: boolean;
}

/** Ce qui part pour chaque source. Guide : tant que la story 10.5 n'est pas livrée, Anne envoie le PDF à la main,
 * donc pas de confirmation automatique au prospect. TODO(backend) : 10.5 ajoute l'envoi du lien signé. */
export const CANAUX: Record<LeadFormulaire['source'], string[]> = {
  contact: ['notify_anne', 'confirm_prospect'],
  estimation: ['notify_anne', 'confirm_prospect'],
  guide: ['notify_anne'],
};

export async function ecrireLead(env: EnvSite, lead: LeadFormulaire, submissionId: string, isTest: boolean): Promise<Ecriture> {
  const id = ulid();
  const maintenant = new Date().toISOString();
  const insertion = env.DB.prepare(
    `INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at,
       newsletter_opt_in_at, utm, is_test, prenom, nom, telephone, message, projet, commune_bien, type_bien)
     VALUES (?1, ?2, ?3, ?3, ?4, ?5, ?6, ?3, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
     ON CONFLICT (submission_id) DO NOTHING`,
  ).bind(
    id, submissionId, maintenant, lead.lang, lead.source, lead.email,
    lead.newsletter ? maintenant : null, lead.utm, isTest ? 1 : 0,
    lead.prenom, lead.nom, lead.telephone, lead.message, lead.projet, lead.commune_bien, lead.type_bien,
  );
  const envois = CANAUX[lead.source].map((canal) =>
    env.DB.prepare(
      `INSERT INTO lead_delivery (lead_id, channel, due_at)
       SELECT id, ?1, ?2 FROM lead WHERE submission_id = ?3
       ON CONFLICT (lead_id, channel) DO NOTHING`,
    ).bind(canal, maintenant, submissionId),
  );
  const lecture = env.DB.prepare('SELECT id FROM lead WHERE submission_id = ?1').bind(submissionId);
  const resultats = await env.DB.batch([insertion, ...envois, lecture]);
  const ecrit = (resultats.at(-1)?.results?.[0] as { id?: string } | undefined)?.id;
  if (!ecrit) throw new Error('lead introuvable après écriture');
  return { leadId: ecrit, nouveau: ecrit === id };
}
