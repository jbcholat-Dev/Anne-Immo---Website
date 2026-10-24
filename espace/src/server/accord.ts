// Qui peut recevoir une campagne e-mail d'Anne (story 13.26, AD-21). Une seule fonction décide, pour la fiche et pour
// le choix des destinataires (story 13.27). La CNIL exige l'accord préalable d'un particulier pour la prospection par
// e-mail ; un ancien client peut recevoir des offres proches de ce qu'il a acheté tant qu'il ne refuse pas.
// Sources de l'accord : la case cochée sur le site (`lead.newsletter_opt_in_at`, lue sur les demandes du contact),
// l'import d'une liste dont les participants ont accepté d'être recontactés, ou l'accord dit à Anne et noté par elle.
// Un refus (lien de désinscription d'un e-mail, ou demande faite à Anne) vaut pour tous les envois groupés ; seule une
// nouvelle case cochée sur le site, après ce refus, le lève : Anne ne peut pas le lever elle-même.
import type { EnvSite } from '@site/server/env';
import type { Etape } from '@site/server/contacts';

export type StatutEmail = 'accord' | 'client' | 'sans_accord' | 'desinscrit' | 'sans_email';
export type SourceAccord = 'site' | 'import' | 'anne' | 'client';

export interface EtatEmail {
  statut: StatutEmail;
  /** Date de l'accord (ou du refus pour un désinscrit), ISO UTC. */
  le: string | null;
  source: SourceAccord | null;
}

export interface DonneesAccord {
  email: string | null;
  etape: Etape;
  email_accord_le: string | null;
  email_accord_source: 'anne' | 'import' | null;
  email_desinscrit_le: string | null;
  /** Dernière case cochée sur le site, sur l'une des demandes du contact. */
  site_accord_le: string | null;
  /** Dernier désabonnement de la séquence, sur l'une des demandes du contact. */
  site_desinscrit_le: string | null;
}

const plusRecent = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);

/** La règle, sans base : utilisée par la fiche et, en SQL équivalent, par le choix des destinataires. */
export function etatEmail(d: DonneesAccord): EtatEmail {
  if (!d.email) return { statut: 'sans_email', le: null, source: null };
  const refus = plusRecent(d.email_desinscrit_le, d.site_desinscrit_le);
  if (refus && !(d.site_accord_le && d.site_accord_le > refus)) return { statut: 'desinscrit', le: refus, source: null };
  const accord = plusRecent(d.site_accord_le, d.email_accord_le);
  if (accord) return { statut: 'accord', le: accord, source: accord === d.site_accord_le ? 'site' : d.email_accord_source };
  if (d.etape === 'vendu' || d.etape === 'acte_signe') return { statut: 'client', le: null, source: 'client' };
  return { statut: 'sans_accord', le: null, source: null };
}

export const peutRecevoirCampagne = (e: EtatEmail) => e.statut === 'accord' || e.statut === 'client';

/** Pourquoi un contact est écarté d'une campagne, en mots d'Anne. */
export const RAISONS_ECART: Record<Exclude<StatutEmail, 'accord' | 'client'>, string> = {
  sans_email: 'Pas d\'adresse e-mail',
  sans_accord: 'Pas d\'accord pour recevoir vos e-mails',
  desinscrit: 'Désinscrit',
};

/** Les colonnes de `DonneesAccord`, à joindre à une lecture de `contact` (alias `c`). */
export const SQL_ACCORD = `c.email, c.etape, c.email_accord_le, c.email_accord_source, c.email_desinscrit_le,
  (SELECT max(l.newsletter_opt_in_at) FROM lead l WHERE l.contact_id = c.id) AS site_accord_le,
  (SELECT max(l.newsletter_unsubscribed_at) FROM lead l WHERE l.contact_id = c.id) AS site_desinscrit_le`;

export async function lireAccord(env: EnvSite, contactId: string): Promise<EtatEmail | null> {
  const d = await env.DB.prepare(`SELECT ${SQL_ACCORD} FROM contact c WHERE c.id = ?1`).bind(contactId).first<DonneesAccord>();
  return d ? etatEmail(d) : null;
}

const noter = (env: EnvSite, contactId: string, a: string, texte: string, par: string) =>
  env.DB.prepare(`INSERT INTO contact_evenement (contact_id, a, type, source, texte, par) VALUES (?1, ?2, 'note', 'anne', ?3, ?4)`)
    .bind(contactId, a, texte, par);

/**
 * Anne note l'accord de la personne, ou le retire. Refusé (false) si le contact est désinscrit : seule la personne
 * peut revenir sur son refus, en cochant la case du site. Retirer un accord donné sur le site n'est pas possible
 * non plus : il faut alors noter son refus (`noterRefus`).
 */
export async function noterAccord(env: EnvSite, contactId: string, accord: boolean, par: string): Promise<boolean> {
  const etat = await lireAccord(env, contactId);
  if (!etat || etat.statut === 'desinscrit' || etat.statut === 'sans_email') return false;
  if (!accord && etat.source === 'site') return false;
  const maintenant = new Date().toISOString();
  await env.DB.batch([
    accord
      ? env.DB.prepare(`UPDATE contact SET email_accord_le = ?2, email_accord_source = 'anne', last_activity_at = ?2 WHERE id = ?1`).bind(contactId, maintenant)
      : env.DB.prepare('UPDATE contact SET email_accord_le = NULL, email_accord_source = NULL, last_activity_at = ?2 WHERE id = ?1').bind(contactId, maintenant),
    noter(env, contactId, maintenant, accord ? 'Accord pour recevoir les e-mails d\'Anne, donné à Anne' : 'Accord pour recevoir les e-mails d\'Anne retiré', par),
  ]);
  return true;
}

/** La personne ne veut plus d'e-mails groupés (demande faite à Anne) : vaut comme une désinscription. */
export async function noterRefus(env: EnvSite, contactId: string, par: string): Promise<boolean> {
  const maintenant = new Date().toISOString();
  const r = await env.DB.prepare('UPDATE contact SET email_desinscrit_le = ?2, last_activity_at = ?2 WHERE id = ?1').bind(contactId, maintenant).run();
  if (!r.meta.changes) return false;
  await noter(env, contactId, maintenant, 'Ne veut plus recevoir les e-mails groupés d\'Anne', par).run();
  return true;
}
