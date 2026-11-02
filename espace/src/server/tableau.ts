// Page Contacts (story 18.4, FR-1, AD-27) : tous les contacts non effacés (un effacement supprime la ligne, AD-31), du
// carnet comme du suivi des ventes, écartés compris (masqués par défaut dans le navigateur), lus en trois requêtes et
// réunis ici. Lecture seule : les écritures du tableau passeront par `carnet` (AD-22, stories 18.6 et 18.7).
// Story 18.5 : la date « à rappeler le » et la marque ambassadeur (filtres d'AD-27), et la liste des catégories.
import type { EnvSite } from '@site/server/env';
import { etatEmail, SQL_ACCORD, type DonneesAccord } from './accord';
import type { LigneTableau } from './tableau-colonnes';

interface LigneContact extends DonneesAccord {
  id: string; prenom: string | null; nom: string | null; telephone: string | null; entreprise: string | null;
  categorie_id: string | null; categorie: string | null; projet: string; temperature: string | null; commune: string | null;
  dernier_contact_le: string | null; dernier_contact_canal: string | null; verifie_le: string | null; ecarte_le: string | null;
  a_rappeler_le: string | null; ambassadeur_inscrit_le: string | null;
}

/** Une adresse de profil n'est gardée que si elle commence par http(s) : jamais de lien « javascript: » dans la page. */
const LIEN_WEB = /^https?:\/\/[^\s"'<>]+$/i;

export async function lireTableau(env: EnvSite): Promise<LigneTableau[]> {
  const [contacts, coordonnees, sources] = await env.DB.batch([
    env.DB.prepare(
      `SELECT c.id, c.prenom, c.nom, c.telephone, c.entreprise, c.categorie_id, k.nom AS categorie, c.projet, c.temperature, c.commune,
         c.dernier_contact_le, c.dernier_contact_canal, c.verifie_le, c.ecarte_le, c.a_rappeler_le, c.ambassadeur_inscrit_le, ${SQL_ACCORD}
       FROM contact c LEFT JOIN categorie k ON k.id = c.categorie_id`,
    ),
    env.DB.prepare('SELECT contact_id, type, reseau, valeur FROM contact_coordonnee ORDER BY id'),
    env.DB.prepare('SELECT contact_id, source FROM contact_source ORDER BY a, id'),
  ]) as [D1Result<LigneContact>, D1Result<{ contact_id: string; type: string; reseau: string | null; valeur: string }>, D1Result<{ contact_id: string; source: string }>];

  const autres = new Map<string, { telephones: string[]; emails: string[]; profils: { reseau: string | null; url: string }[] }>();
  for (const k of coordonnees.results) {
    const a = autres.get(k.contact_id) ?? { telephones: [], emails: [], profils: [] };
    if (k.type === 'telephone') a.telephones.push(k.valeur);
    else if (k.type === 'email') a.emails.push(k.valeur);
    else if (LIEN_WEB.test(k.valeur)) a.profils.push({ reseau: k.reseau, url: k.valeur });
    autres.set(k.contact_id, a);
  }
  const parContact = new Map<string, string[]>();
  for (const s of sources.results) {
    const l = parContact.get(s.contact_id) ?? [];
    if (!l.includes(s.source)) l.push(s.source);
    parContact.set(s.contact_id, l);
  }

  return contacts.results.map((c) => {
    const a = autres.get(c.id);
    return {
      id: c.id, prenom: c.prenom, nom: c.nom, entreprise: c.entreprise, categorie_id: c.categorie_id, categorie: c.categorie,
      projet: c.projet, temperature: c.temperature, sources: parContact.get(c.id) ?? [], ville: c.commune,
      telephones: [c.telephone, ...(a?.telephones ?? [])].filter((t): t is string => !!t),
      emails: [c.email, ...(a?.emails ?? [])].filter((e): e is string => !!e),
      profils: a?.profils ?? [],
      dernier_le: c.dernier_contact_le, dernier_canal: c.dernier_contact_canal,
      accord: etatEmail(c).statut, verifie: !!c.verifie_le, ecarte: !!c.ecarte_le, suivi: c.etape !== null,
      a_rappeler_le: c.a_rappeler_le, ambassadeur_inscrit: !!c.ambassadeur_inscrit_le,
    };
  });
}

/** Les catégories, dans leur ordre (AD-25) : choix du filtre « Catégorie » et libellés de ses pastilles. */
export async function lireCategories(env: EnvSite): Promise<{ id: string; nom: string }[]> {
  return (await env.DB.prepare('SELECT id, nom FROM categorie ORDER BY ordre, nom').all<{ id: string; nom: string }>()).results;
}
