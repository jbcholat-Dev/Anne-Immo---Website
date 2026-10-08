// Écriture d'un lead (AD-4, AD-6) : seul module qui crée des lignes `lead` et `lead_delivery`.
// Une seule transaction écrit le lead et ce qui doit partir pour lui. La clé d'idempotence `submission_id`
// (générée par la page) rend le renvoi sans effet : la deuxième fois, rien n'est écrit et on retrouve le premier lead.
import type { EnvSite } from './env';
import type { Diagnostic } from './diagnostic';
import type { LeadFormulaire } from './schema';
import { lignesSequence } from './sequence';
import { ulid } from './ulid';

export interface Ecriture {
  leadId: string;
  /** Faux si ce `submission_id` avait déjà été écrit (renvoi). */
  nouveau: boolean;
  /** Jeton de la page de résultats (diagnostic) : celui du premier envoi, même pour un renvoi. */
  token: string | null;
}

/** Ce qui part pour chaque source. Guide : la confirmation au prospect porte le lien signé du guide (story 10.5).
 * Une inscription à la séquence ajoute en plus une ligne `sequence:<étape>` par e-mail (sequence.ts). */
export const CANAUX: Record<LeadFormulaire['source'], string[]> = {
  contact: ['notify_anne', 'confirm_prospect'],
  estimation: ['notify_anne', 'confirm_prospect'],
  guide: ['notify_anne', 'confirm_prospect'],
  diagnostic: ['notify_anne', 'confirm_prospect'],
  // Rendez-vous : Cal.com envoie lui-même les confirmations au prospect et à Anne ; le site prévient Anne au format Modelo (AD-8).
  rdv: ['notify_anne'],
};

export async function ecrireLead(env: EnvSite, lead: LeadFormulaire, submissionId: string, isTest: boolean, diag: Diagnostic | null = null): Promise<Ecriture> {
  const id = ulid();
  const maintenant = new Date().toISOString();
  const insertion = env.DB.prepare(
    `INSERT INTO lead (id, submission_id, created_at, last_activity_at, lang, source, email, privacy_accepted_at,
       newsletter_opt_in_at, utm, is_test, prenom, nom, telephone, message, projet, commune_bien, type_bien,
       token, answers, scores, band, orientation, rdv_start)
     VALUES (?1, ?2, ?3, ?3, ?4, ?5, ?6, ?3, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22)
     ON CONFLICT (submission_id) DO NOTHING`,
  ).bind(
    id, submissionId, maintenant, lead.lang, lead.source, lead.email,
    lead.newsletter ? maintenant : null, lead.utm, isTest ? 1 : 0,
    lead.prenom, lead.nom, lead.telephone, lead.message, lead.projet, lead.commune_bien, lead.type_bien,
    diag?.token ?? null, diag?.answers ?? null, diag?.scores ?? null, diag?.band ?? null, diag?.orientation ?? null,
    lead.rdv_start ?? null,
  );
  const envois = CANAUX[lead.source].map((canal) =>
    env.DB.prepare(
      `INSERT INTO lead_delivery (lead_id, channel, due_at)
       SELECT id, ?1, ?2 FROM lead WHERE submission_id = ?3
       ON CONFLICT (lead_id, channel) DO NOTHING`,
    ).bind(canal, maintenant, submissionId),
  );
  // Séquence : seulement si ce lead vient d'être créé (un renvoi ne trouve pas `id` et n'ajoute rien).
  const sequence = lead.newsletter ? lignesSequence(env, id, lead.lang, maintenant) : [];
  const lecture = env.DB.prepare('SELECT id, token FROM lead WHERE submission_id = ?1').bind(submissionId);
  const resultats = await env.DB.batch([insertion, ...envois, ...sequence, lecture]);
  const ecrit = resultats.at(-1)?.results?.[0] as { id?: string; token?: string | null } | undefined;
  if (!ecrit?.id) throw new Error('lead introuvable après écriture');
  return { leadId: ecrit.id, nouveau: ecrit.id === id, token: ecrit.token ?? null };
}
