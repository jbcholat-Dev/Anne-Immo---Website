// Contacts de l'espace d'Anne (story 13.4, AD-20, CAP-12 v7) : une personne = un contact, quel que soit le nombre de demandes.
// Ce module est la seule porte du site vers les tables `contact` et `contact_evenement` (et depuis la story 18.3,
// `nouveau` et `contact_source`) : le rattachement d'une demande
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
  premier_rdv: 'R1',
  estimation: 'Estimation en préparation',
  second_rdv: 'R2',
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
/** Story 10.15 : un contact du site sans téléphone (guide, ou diagnostic du 30 octobre 2026, story 10.15) se qualifie par e-mail, après ceux qui ont
 * laissé un numéro (rangés en tête de « À rappeler maintenant » dans l'espace). */
export const ACTION_QUALIFIER_EMAIL = 'Écrire pour qualifier (pas de téléphone)';

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
  // Inscription sur /ambassadeurs (epic 17, autre fil) : la version et la date du règlement accepté. Ces colonnes ne sont
  // pas encore dans `lead` : la demande est lue avec `SELECT *` et ces champs valent undefined tant qu'ils manquent.
  reglement_version?: string | null;
  reglement_accepte_le?: string | null;
}

const LIBELLES_SOURCES: Record<string, string> = {
  diagnostic: 'diagnostic',
  contact: 'contact',
  guide: 'guide',
  rdv: 'prise de rendez-vous',
  estimation: "demande d'estimation",
  ambassadeur: 'inscription au programme ambassadeurs',
};

/** Parcours déduit de la demande : un vendeur pour le diagnostic, le guide et l'estimation ; selon le projet pour le contact. */
export function parcoursDeLaDemande(source: string, projet: string | null): 'vendeur' | 'acheteur' | null {
  if (source === 'contact') return projet === 'achat' ? 'acheteur' : projet === 'vente' ? 'vendeur' : null;
  if (source === 'diagnostic' || source === 'guide' || source === 'estimation') return 'vendeur';
  return null;
}

export interface ContactTrouve { id: string; etape: Etape | null }

/**
 * Le contact de ce téléphone ou de cet e-mail, cherché sur `contact` et dans ses autres coordonnées (`contact_coordonnee`,
 * story 18.3, AD-26). Le téléphone l'emporte sur l'e-mail quand les deux désignent des contacts différents, et la
 * coordonnée principale sur une coordonnée secondaire. Aussi utilisé par la saisie de l'espace (pipeline.contactConnu).
 */
export async function trouver(env: EnvSite, telephone: string | null, email: string | null): Promise<ContactTrouve | null> {
  return env.DB.prepare(
    `SELECT c.id, c.etape FROM (
       SELECT id AS contact_id, 0 AS rang FROM contact WHERE ?1 IS NOT NULL AND telephone = ?1
       UNION ALL SELECT contact_id, 1 FROM contact_coordonnee WHERE ?1 IS NOT NULL AND type = 'telephone' AND valeur = ?1
       UNION ALL SELECT id, 2 FROM contact WHERE ?2 IS NOT NULL AND email = ?2
       UNION ALL SELECT contact_id, 3 FROM contact_coordonnee WHERE ?2 IS NOT NULL AND type = 'email' AND valeur = ?2
     ) t JOIN contact c ON c.id = t.contact_id ORDER BY t.rang LIMIT 1`,
  ).bind(telephone, email).first<ContactTrouve>();
}

/**
 * Rattache une demande à son contact, en le créant au besoin. Sans effet si elle l'est déjà. Renvoie l'id du contact.
 * Carnet (story 18.3, AD-22, AD-32, AD-34) : un contact du carnet (étape NULL) entre dans le suivi « à qualifier », avec
 * `suivi_le` (la relève Leedflow ne lui verse que les échanges postérieurs) ; chaque demande écrit une ligne `nouveau`
 * de source `site` (la barre « Nouveaux » de l'espace). Une inscription au programme ambassadeurs (source `ambassadeur`)
 * pose seulement la marque « inscrit ambassadeur » : ni projet, ni catégorie, ni étape ne changent.
 */
export async function rattacherLead(env: EnvSite, leadId: string): Promise<string | null> {
  const lead = await env.DB.prepare('SELECT * FROM lead WHERE id = ?1').bind(leadId).first<LeadARattacher>();
  if (!lead) return null;
  if (lead.contact_id) return lead.contact_id;
  const email = lead.email ? lead.email.trim().toLowerCase() : null;
  const telephone = lead.telephone || null;
  const maintenant = new Date().toISOString();
  const ambassadeur = lead.source === 'ambassadeur';
  const parcours = parcoursDeLaDemande(lead.source, lead.projet);

  let contact = await trouver(env, telephone, email);
  if (!contact) {
    await env.DB.prepare(
      // Carnet (story 18.2, AD-22, AD-24) : catégorie « Demandes reçues » (c'est sa définition, donc vérifiée), projet tiré
      // du parcours, et température « avec Anne » quand il est connu. Une inscription ambassadeur crée un contact du
      // carnet, hors suivi (étape NULL) : ce n'est pas un projet immobilier à qualifier.
      `INSERT INTO contact (id, created_at, last_activity_at, prenom, nom, telephone, email, parcours, etape,
         prochaine_action, prochaine_action_le, canal, origine_detail, commune, is_test, categorie_id, verifie_le, projet, temperature)
       VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, CASE WHEN ?12 THEN NULL ELSE 'a_qualifier' END,
         CASE WHEN ?12 THEN NULL ELSE ?8 END, CASE WHEN ?12 THEN NULL ELSE ?2 END, 'site', ?9, ?10, ?11,
         'demandes_recues', ?2, coalesce(?7, 'a_qualifier'), CASE WHEN ?7 IS NOT NULL THEN 'avec_anne' END)
       ON CONFLICT DO NOTHING`,
    ).bind(ulid(), lead.created_at, lead.prenom, lead.nom, telephone, email, parcours,
      telephone ? ACTION_QUALIFIER : ACTION_QUALIFIER_EMAIL, lead.source, lead.commune_bien, lead.is_test, ambassadeur ? 1 : 0).run();
    // Relu dans tous les cas : si une autre demande a créé le même contact entre-temps, c'est le sien qu'on prend.
    contact = await trouver(env, telephone, email);
    if (!contact) throw new Error('contact introuvable après création');
  }

  const libelle = LIBELLES_SOURCES[lead.source] ?? lead.source;
  const lot = [
    // Complète ce qui manque, sans prendre un téléphone ou un e-mail déjà porté par un contact (principal ou secondaire).
    env.DB.prepare(
      `UPDATE contact SET
         last_activity_at = ?2,
         prenom = COALESCE(prenom, ?3),
         nom = COALESCE(nom, ?4),
         telephone = COALESCE(telephone, CASE WHEN ?5 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM contact WHERE telephone = ?5)
           AND NOT EXISTS (SELECT 1 FROM contact_coordonnee WHERE valeur = ?5) THEN ?5 END),
         email = COALESCE(email, CASE WHEN ?6 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM contact WHERE email = ?6)
           AND NOT EXISTS (SELECT 1 FROM contact_coordonnee WHERE valeur = ?6) THEN ?6 END),
         commune = COALESCE(commune, ?7)
       WHERE id = ?1`,
    ).bind(contact.id, maintenant, lead.prenom, lead.nom, telephone, email, lead.commune_bien),
    // Story 10.15 : un contact à qualifier par e-mail qui laisse enfin un téléphone redevient à rappeler.
    env.DB.prepare(`UPDATE contact SET prochaine_action = ?2 WHERE id = ?1 AND prochaine_action = ?3 AND telephone IS NOT NULL`)
      .bind(contact.id, ACTION_QUALIFIER, ACTION_QUALIFIER_EMAIL),
    env.DB.prepare(
      `INSERT INTO contact_evenement (contact_id, a, type, source, source_id, texte, donnees)
       VALUES (?1, ?2, 'demande', 'site', ?3, ?4, ?5) ON CONFLICT DO NOTHING`,
    ).bind(contact.id, lead.created_at, lead.id, `Demande depuis le site : ${libelle}`,
      JSON.stringify({ source: lead.source, type_bien: lead.type_bien, commune: lead.commune_bien })),
    env.DB.prepare('UPDATE lead SET contact_id = ?2 WHERE id = ?1').bind(lead.id, contact.id),
  ];
  if (ambassadeur) {
    // La marque « inscrit ambassadeur » (AD-22) : date et version du règlement accepté, la plus récente inscription l'emporte.
    const le = lead.reglement_accepte_le || lead.created_at;
    lot.push(env.DB.prepare(
      `UPDATE contact SET ambassadeur_inscrit_le = ?2, ambassadeur_reglement = ?3
       WHERE id = ?1 AND (ambassadeur_inscrit_le IS NULL OR ambassadeur_inscrit_le <= ?2)`,
    ).bind(contact.id, le, lead.reglement_version ?? null));
  } else if (contact.etape === null) {
    // Un contact du carnet entre dans le suivi par une demande (AD-22, AD-32) : à qualifier tout de suite, `suivi_le` posé.
    // Parcours pris du projet s'il est vendeur ou acheteur, sinon de la demande ; projet tiré de la demande s'il était à
    // qualifier ; origine « site » s'il n'en avait pas (contact importé). Le téléphone est lu après le complément ci-dessus.
    lot.push(
      env.DB.prepare(
        `UPDATE contact SET etape = 'a_qualifier', prochaine_action = CASE WHEN telephone IS NULL THEN ?4 ELSE ?3 END,
           prochaine_action_le = ?2, reveil_le = NULL, motif_perte = NULL, suivi_le = ?2,
           parcours = coalesce(parcours, CASE WHEN projet IN ('vendeur', 'acheteur') THEN projet END, ?5),
           projet = CASE WHEN projet = 'a_qualifier' AND ?5 IS NOT NULL THEN ?5 ELSE projet END,
           canal = coalesce(canal, 'site'), origine_detail = CASE WHEN canal IS NULL THEN ?6 ELSE origine_detail END
         WHERE id = ?1 AND etape IS NULL`,
      ).bind(contact.id, maintenant, ACTION_QUALIFIER, ACTION_QUALIFIER_EMAIL, parcours, lead.source),
      // Température (AD-24) : « avec Anne » pour un projet connu de vendeur ou d'acheteur, aucune sinon (à qualifier,
      // ambassadeur). Seulement si l'entrée vient d'avoir lieu (même `suivi_le`).
      env.DB.prepare(
        `UPDATE contact SET temperature = CASE WHEN projet IN ('vendeur', 'acheteur', 'vendeur_acheteur') THEN 'avec_anne' END
         WHERE id = ?1 AND suivi_le = ?2`,
      ).bind(contact.id, maintenant),
      env.DB.prepare(
        `INSERT INTO contact_evenement (contact_id, a, type, source, texte, donnees) VALUES (?1, ?2, 'etape', 'site', ?3, ?4)`,
      ).bind(contact.id, maintenant, `Carnet → ${LIBELLES_ETAPES.a_qualifier} : demande depuis le site`,
        JSON.stringify({ de: null, vers: 'a_qualifier' })),
    );
  } else if (contact.etape === 'en_sommeil' || contact.etape === 'perdu') {
    // Un contact en sommeil ou perdu qui refait une demande revient à qualifier, le jour même.
    lot.push(
      env.DB.prepare(
        // Le téléphone lu après la mise à jour qui précède dans le lot : celui du contact, ou celui de la nouvelle demande.
        `UPDATE contact SET etape = 'a_qualifier', prochaine_action = CASE WHEN telephone IS NULL THEN ?4 ELSE ?3 END,
           prochaine_action_le = ?2, reveil_le = NULL, motif_perte = NULL
         WHERE id = ?1`,
      ).bind(contact.id, maintenant, ACTION_QUALIFIER, ACTION_QUALIFIER_EMAIL),
      env.DB.prepare(
        `INSERT INTO contact_evenement (contact_id, a, type, source, texte, donnees) VALUES (?1, ?2, 'etape', 'site', ?3, ?4)`,
      ).bind(contact.id, maintenant, `${LIBELLES_ETAPES[contact.etape]} → À qualifier : nouvelle demande`,
        JSON.stringify({ de: contact.etape, vers: 'a_qualifier' })),
    );
  }
  // D'où vient le contact (AD-26) : la source « site », une fois par contact.
  lot.push(env.DB.prepare(
    `INSERT INTO contact_source (contact_id, source, a) SELECT ?1, 'site', ?2
     WHERE NOT EXISTS (SELECT 1 FROM contact_source WHERE contact_id = ?1 AND source = 'site')`,
  ).bind(contact.id, lead.created_at));
  // La file « Nouveaux » (AD-34) : une ligne par demande, liée à l'événement « demande » qu'on vient d'écrire.
  lot.push(env.DB.prepare(
    `INSERT INTO nouveau (id, source, recu_le, contact_id, evenement_id)
     SELECT ?1, 'site', ?2, ?3, (SELECT id FROM contact_evenement WHERE source = 'site' AND source_id = ?4)
     WHERE NOT EXISTS (SELECT 1 FROM nouveau n JOIN contact_evenement e ON e.id = n.evenement_id WHERE e.source = 'site' AND e.source_id = ?4)`,
  ).bind(ulid(), lead.created_at, contact.id, lead.id));
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
