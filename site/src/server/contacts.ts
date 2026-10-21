// Contacts de l'espace d'Anne (story 13.4, AD-20, CAP-12 v7) : une personne = un contact, quel que soit le nombre de demandes.
// Ce module est la seule porte du site vers les tables `contact` et `contact_evenement` : le rattachement d'une demande
// (`lead`) au contact de même téléphone E.164 ou de même e-mail, sinon la création du contact. Il est appelé juste après
// l'écriture de la demande (AD-4 : la demande d'abord ; un échec ici ne fait jamais échouer l'envoi du visiteur) et,
// en filet, par la tâche planifiée pour les demandes restées sans contact. L'espace d'Anne écrit le reste
// (étapes, qualification, notes) par espace/src/server/pipeline.ts, avec les mêmes listes ci-dessous.
import type { EnvSite } from './env';
import { journal } from './journal';
import { ulid } from './ulid';

export const ETAPES_VENDEUR = ['a_qualifier', 'premier_rdv', 'estimation', 'second_rdv', 'mandat_exclusif', 'en_vente', 'vendu'] as const;
export const ETAPES_ACHETEUR = ['a_qualifier', 'besoin_defini', 'mandat_recherche', 'visites', 'offre_acceptee', 'acte_signe'] as const;
export const ETAPES_HORS_PARCOURS = ['en_sommeil', 'perdu'] as const;
export type Etape = (typeof ETAPES_VENDEUR)[number] | (typeof ETAPES_ACHETEUR)[number] | (typeof ETAPES_HORS_PARCOURS)[number];

export const LIBELLES_ETAPES: Record<Etape, string> = {
  a_qualifier: 'À qualifier',
  premier_rdv: 'Premier rendez-vous',
  estimation: 'Estimation en préparation',
  second_rdv: 'Second rendez-vous',
  mandat_exclusif: 'Mandat exclusif signé',
  en_vente: 'En vente',
  vendu: 'Vendu',
  besoin_defini: 'Besoin défini',
  mandat_recherche: 'Mandat de recherche signé',
  visites: 'Visites',
  offre_acceptee: 'Offre acceptée',
  acte_signe: 'Acte signé',
  en_sommeil: 'En sommeil',
  perdu: 'Perdu',
};

/** Les canaux d'origine (CAP-12 v7) ; le bilan du lundi (story 13.13) compte par canal. */
export const CANAUX_ORIGINE = {
  boitage: 'Boîtage',
  recommandation: 'Recommandation',
  evenement: 'Événement',
  site: 'Site',
  portail: "Portail d'annonces",
  reseaux: 'Réseaux sociaux',
  rencontre: 'Rencontre',
  autre: 'Autre',
} as const;
export type Canal = keyof typeof CANAUX_ORIGINE;

/** Action posée sur tout nouveau contact : le rappeler pour le qualifier, dès son arrivée. */
export const ACTION_QUALIFIER = 'Rappeler pour qualifier';

interface LeadARattacher {
  id: string;
  created_at: string;
  source: string;
  email: string;
  telephone: string | null;
  prenom: string | null;
  nom: string | null;
  projet: string | null;
  commune_bien: string | null;
  type_bien: string | null;
  is_test: number;
  contact_id: string | null;
}

const LIBELLES_SOURCES: Record<string, string> = {
  diagnostic: 'diagnostic',
  contact: 'contact',
  guide: 'guide',
  rdv: 'prise de rendez-vous',
  estimation: "demande d'estimation",
};

/** Parcours déduit de la demande : un vendeur pour le diagnostic, le guide et l'estimation ; selon le projet pour le contact. */
export function parcoursDeLaDemande(source: string, projet: string | null): 'vendeur' | 'acheteur' | null {
  if (source === 'contact') return projet === 'achat' ? 'acheteur' : projet === 'vente' ? 'vendeur' : null;
  if (source === 'diagnostic' || source === 'guide' || source === 'estimation') return 'vendeur';
  return null;
}

async function trouver(env: EnvSite, telephone: string | null, email: string | null): Promise<{ id: string; etape: Etape } | null> {
  // Le téléphone l'emporte sur l'e-mail quand les deux désignent des contacts différents.
  return env.DB.prepare(
    `SELECT id, etape FROM contact WHERE (?1 IS NOT NULL AND telephone = ?1) OR (?2 IS NOT NULL AND email = ?2)
     ORDER BY (telephone IS ?1) DESC LIMIT 1`,
  ).bind(telephone, email).first<{ id: string; etape: Etape }>();
}

/** Rattache une demande à son contact, en le créant au besoin. Sans effet si elle l'est déjà. Renvoie l'id du contact. */
export async function rattacherLead(env: EnvSite, leadId: string): Promise<string | null> {
  const lead = await env.DB.prepare(
    `SELECT id, created_at, source, email, telephone, prenom, nom, projet, commune_bien, type_bien, is_test, contact_id
     FROM lead WHERE id = ?1`,
  ).bind(leadId).first<LeadARattacher>();
  if (!lead) return null;
  if (lead.contact_id) return lead.contact_id;
  const email = lead.email ? lead.email.trim().toLowerCase() : null;
  const telephone = lead.telephone || null;
  const maintenant = new Date().toISOString();

  let contact = await trouver(env, telephone, email);
  if (!contact) {
    await env.DB.prepare(
      `INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, email, parcours, etape,
         prochaine_action, prochaine_action_le, canal, origine_detail, commune, is_test)
       VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, 'a_qualifier', ?8, ?2, 'site', ?9, ?10, ?11)
       ON CONFLICT DO NOTHING`,
    ).bind(ulid(), lead.created_at, lead.prenom, lead.nom, telephone, email, parcoursDeLaDemande(lead.source, lead.projet),
      ACTION_QUALIFIER, lead.source, lead.commune_bien, lead.is_test).run();
    // Relu dans tous les cas : si une autre demande a créé le même contact entre-temps, c'est le sien qu'on prend.
    contact = await trouver(env, telephone, email);
    if (!contact) throw new Error('contact introuvable après création');
  }

  const libelle = LIBELLES_SOURCES[lead.source] ?? lead.source;
  const lot = [
    // Complète ce qui manque, sans prendre un téléphone ou un e-mail déjà porté par un autre contact.
    env.DB.prepare(
      `UPDATE contact SET
         last_activity_at = ?2,
         prenom = COALESCE(prenom, ?3),
         nom = COALESCE(nom, ?4),
         telephone = COALESCE(telephone, CASE WHEN ?5 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM contact WHERE telephone = ?5) THEN ?5 END),
         email = COALESCE(email, CASE WHEN ?6 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM contact WHERE email = ?6) THEN ?6 END),
         commune = COALESCE(commune, ?7)
       WHERE id = ?1`,
    ).bind(contact.id, maintenant, lead.prenom, lead.nom, telephone, email, lead.commune_bien),
    env.DB.prepare(
      `INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees)
       VALUES (?1, ?2, 'demande', 'site', ?3, ?4, ?5) ON CONFLICT DO NOTHING`,
    ).bind(contact.id, lead.created_at, lead.id, `Demande depuis le site : ${libelle}`,
      JSON.stringify({ source: lead.source, type_bien: lead.type_bien, commune: lead.commune_bien })),
    env.DB.prepare('UPDATE lead SET contact_id = ?2 WHERE id = ?1').bind(lead.id, contact.id),
  ];
  // Un contact en sommeil ou perdu qui refait une demande revient à qualifier, le jour même.
  if (contact.etape === 'en_sommeil' || contact.etape === 'perdu') {
    lot.push(
      env.DB.prepare(
        `UPDATE contact SET etape = 'a_qualifier', prochaine_action = ?3, prochaine_action_le = ?2, reveil_le = NULL, motif_perte = NULL
         WHERE id = ?1`,
      ).bind(contact.id, maintenant, ACTION_QUALIFIER),
      env.DB.prepare(
        `INSERT INTO contact_evenement (contact_id, a, type, source, texte, donnees) VALUES (?1, ?2, 'etape', 'site', ?3, ?4)`,
      ).bind(contact.id, maintenant, `${LIBELLES_ETAPES[contact.etape]} → À qualifier : nouvelle demande`,
        JSON.stringify({ de: contact.etape, vers: 'a_qualifier' })),
    );
  }
  await env.DB.batch(lot);
  return contact.id;
}

/** Filet de la tâche planifiée : rattache les demandes restées sans contact (échec passager, demandes antérieures à 13.4). */
export async function rattacherOrphelins(env: EnvSite, limite = 50): Promise<number> {
  const { results } = await env.DB.prepare('SELECT id FROM lead WHERE contact_id IS NULL ORDER BY created_at LIMIT ?1').bind(limite).all<{ id: string }>();
  let n = 0;
  for (const { id } of results) {
    try {
      if (await rattacherLead(env, id)) n++;
    } catch (e) {
      journal('rattachement_echec', { lead: id, erreur: String(e).slice(0, 200) });
    }
  }
  if (n) journal('rattachement_orphelins', { leads: n });
  return n;
}
