// Page Contacts (story 18.4, FR-1, AD-27) : tous les contacts non effacés (un effacement supprime la ligne, AD-31), du
// carnet comme du suivi des ventes, écartés compris (masqués par défaut dans le navigateur), lus en trois requêtes et
// réunis ici. Lecture seule : le classement s'écrit par `carnet` (AD-22, story 18.6 ; fiche : story 18.7).
// Story 18.5 : la date « à rappeler le » et la marque ambassadeur (filtres d'AD-27), et la liste des catégories.
import type { EnvSite } from '@site/server/env';
import { etatEmail, SQL_ACCORD, type DonneesAccord } from './accord';
import { etatAmbassadeur, rencontresDe, suiviEnCours, type LigneTableau } from './tableau-colonnes';

interface LigneContact extends DonneesAccord {
  id: string; prenom: string | null; nom: string | null; telephone: string | null; entreprise: string | null;
  categorie_id: string | null; categorie: string | null; projet: string; temperature: string | null; commune: string | null;
  dernier_contact_le: string | null; dernier_contact_canal: string | null; verifie_le: string | null; ecarte_le: string | null;
  a_rappeler_le: string | null; r1_le: string | null; r2_le: string | null; ambassadeur_inscrit_le: string | null; ambassadeur_partant_le: string | null; canal: string | null; modele_envoye: number;
}

/** 1 si un modèle a déjà été envoyé au contact (story 18.18) : un événement de sa fiche porte `envoi_modele` (json_valid d'abord : un texte qui n'est pas du JSON ne doit pas faire échouer la lecture). */
export const SQL_MODELE_ENVOYE = `EXISTS (SELECT 1 FROM contact_evenement m WHERE m.contact_id = c.id AND m.type IN ('email', 'note')
  AND CASE WHEN json_valid(m.donnees) THEN json_type(m.donnees, '$.envoi_modele') END IS NOT NULL)`;

/** Une adresse de profil n'est gardée que si elle commence par http(s) : jamais de lien « javascript: » dans la page. */
const LIEN_WEB = /^https?:\/\/[^\s"'<>]+$/i;

/** Tous les contacts, ou un seul (`id` : la ligne à remettre dans le tableau après une écriture de la fiche, story 18.7). */
export async function lireTableau(env: EnvSite, id?: string): Promise<LigneTableau[]> {
  const seul = id ? ' WHERE c.id = ?1' : '', seulFille = id ? ' WHERE contact_id = ?1' : '';
  const lier = (p: D1PreparedStatement) => (id ? p.bind(id) : p);
  const [contacts, coordonnees, sources] = await env.DB.batch([
    lier(env.DB.prepare(
      `SELECT c.id, c.prenom, c.nom, c.telephone, c.entreprise, c.categorie_id, k.nom AS categorie, c.projet, c.temperature, c.commune,
         c.dernier_contact_le, c.dernier_contact_canal, c.verifie_le, c.ecarte_le, c.a_rappeler_le, c.r1_le, c.r2_le, c.ambassadeur_inscrit_le, c.ambassadeur_partant_le, c.canal, ${SQL_MODELE_ENVOYE} AS modele_envoye, ${SQL_ACCORD}
       FROM contact c LEFT JOIN categorie k ON k.id = c.categorie_id${seul}`,
    )),
    lier(env.DB.prepare(`SELECT contact_id, type, reseau, valeur FROM contact_coordonnee${seulFille} ORDER BY id`)),
    lier(env.DB.prepare(`SELECT contact_id, source, lieu, mois FROM contact_source${seulFille} ORDER BY a, id`)),
  ]) as [D1Result<LigneContact>, D1Result<{ contact_id: string; type: string; reseau: string | null; valeur: string }>, D1Result<{ contact_id: string; source: string; lieu: string | null; mois: string | null }>];

  const autres = new Map<string, { telephones: string[]; emails: string[]; profils: { reseau: string | null; url: string }[] }>();
  for (const k of coordonnees.results) {
    const a = autres.get(k.contact_id) ?? { telephones: [], emails: [], profils: [] };
    if (k.type === 'telephone') a.telephones.push(k.valeur);
    else if (k.type === 'email') a.emails.push(k.valeur);
    else if (LIEN_WEB.test(k.valeur)) a.profils.push({ reseau: k.reseau, url: k.valeur });
    autres.set(k.contact_id, a);
  }
  const rencontres = new Map<string, { source: string; lieu: string | null; mois: string | null }[]>();
  for (const s of sources.results) {
    if (s.lieu || s.mois) rencontres.set(s.contact_id, [...(rencontres.get(s.contact_id) ?? []), s]);
  }

  return contacts.results.map((c) => {
    const a = autres.get(c.id);
    return {
      id: c.id, prenom: c.prenom, nom: c.nom, entreprise: c.entreprise, categorie_id: c.categorie_id, categorie: c.categorie,
      projet: c.projet, temperature: c.temperature, canal: c.canal, rencontres: rencontresDe(rencontres.get(c.id) ?? []), ville: c.commune,
      telephones: [c.telephone, ...(a?.telephones ?? [])].filter((t): t is string => !!t),
      emails: [c.email, ...(a?.emails ?? [])].filter((e): e is string => !!e),
      profils: a?.profils ?? [],
      dernier_le: c.dernier_contact_le, dernier_canal: c.dernier_contact_canal,
      accord: etatEmail(c).statut, verifie: !!c.verifie_le, ecarte: !!c.ecarte_le, suivi: c.etape !== null, en_cours: suiviEnCours(c.etape),
      a_rappeler_le: c.a_rappeler_le, r1_le: c.r1_le, r2_le: c.r2_le, ambassadeur_inscrit: !!c.ambassadeur_inscrit_le, ambassadeur_partant: !!c.ambassadeur_partant_le,
      ambassadeur_etat: etatAmbassadeur(c.projet, !!c.ambassadeur_inscrit_le, !!c.modele_envoye, !!c.ambassadeur_partant_le), ambassadeur_contacte: !!c.modele_envoye,
    };
  });
}

/** Les catégories, dans leur ordre (AD-25) : choix du filtre « Catégorie » et libellés de ses pastilles. */
export async function lireCategories(env: EnvSite): Promise<{ id: string; nom: string }[]> {
  return (await env.DB.prepare('SELECT id, nom FROM categorie ORDER BY ordre, nom').all<{ id: string; nom: string }>()).results;
}
