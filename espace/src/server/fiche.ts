// Lecture de la fiche d'un contact (story 18.7, FR-28) : tout ce que le panneau de la page Contacts montre, en une seule
// exécution D1. Lecture seule : les écritures passent par `carnet` (AD-22) et `accord` (AD-21). Jamais lue par les routes
// /api/claude/… (Claude ne lit pas les contacts, AD-26).
import type { EnvSite } from '@site/server/env';
import { LIBELLES_ETAPES, type Etape } from '@site/server/contacts';
import { SOURCES as SOURCES_DEMANDE } from '@site/server/gestion-donnees';
import { etatEmail, SQL_ACCORD, type DonneesAccord, type EtatEmail } from './accord';
import { libelleRencontre, libelleSource, rencontresDe, suiviEnCours } from './tableau-colonnes';

const LIEN_WEB = /^https?:\/\/[^\s"'<>]+$/i;

export interface EvenementFiche { a: string; type: string; source: string; texte: string | null; par: string | null }

export interface Fiche {
  id: string; created_at: string;
  prenom: string | null; nom: string | null; entreprise: string | null; commune: string | null;
  telephones: string[]; emails: string[]; profils: { reseau: string | null; url: string }[];
  categorie_id: string | null; categorie: string | null; appel_permis_categorie: boolean | null;
  projet: string; temperature: string | null; verifie_le: string | null; ecarte_le: string | null;
  appel_autorise: boolean | null; a_rappeler_le: string | null;
  dernier_contact_le: string | null; dernier_contact_canal: string | null;
  ambassadeur_inscrit_le: string | null;
  /** Suivi des ventes : étape (null au carnet seulement), libellé, et « en cours » (la température y suit l'étape, AD-24). */
  etape: string | null; etape_libelle: string | null; en_cours: boolean;
  prochaine_action: string | null; prochaine_action_le: string | null;
  accord: EtatEmail;
  sources: { source: string; libelle: string; a: string }[];
  /** Rencontres (lieu et mois, story 18.17), « EDB Publier · déc. 2024 », la plus récente d'abord ; lecture seule. */
  rencontres: string[];
  /** Les séances où la personne a été mise (epic 19) : vide tant que les séances n'existent pas. */
  seances: { nom: string; contacte_le: string | null; canal: string | null }[];
  /** Demandes reçues du site, avec leur message (FR-27). */
  demandes: { id: string; source: string; libelle: string; created_at: string; message: string | null; commune_bien: string | null; type_bien: string | null }[];
  historique: EvenementFiche[];
}

interface Ligne extends DonneesAccord {
  id: string; created_at: string; prenom: string | null; nom: string | null; entreprise: string | null; commune: string | null; telephone: string | null;
  categorie_id: string | null; categorie: string | null; appel_permis: number | null; projet: string; temperature: string | null;
  verifie_le: string | null; ecarte_le: string | null; appel_autorise: number | null; a_rappeler_le: string | null;
  dernier_contact_le: string | null; dernier_contact_canal: string | null; ambassadeur_inscrit_le: string | null;
  prochaine_action: string | null; prochaine_action_le: string | null;
}

export async function lireFiche(env: EnvSite, id: string): Promise<Fiche | null> {
  const [c, coords, sources, demandes, historique] = await env.DB.batch([
    env.DB.prepare(`SELECT c.id, c.created_at, c.prenom, c.nom, c.entreprise, c.commune, c.telephone, c.categorie_id, k.nom AS categorie, k.appel_permis,
        c.projet, c.temperature, c.verifie_le, c.ecarte_le, c.appel_autorise, c.a_rappeler_le, c.dernier_contact_le, c.dernier_contact_canal,
        c.ambassadeur_inscrit_le, c.prochaine_action, c.prochaine_action_le, ${SQL_ACCORD}
      FROM contact c LEFT JOIN categorie k ON k.id = c.categorie_id WHERE c.id = ?1`).bind(id),
    env.DB.prepare('SELECT type, reseau, valeur FROM contact_coordonnee WHERE contact_id = ?1 ORDER BY id').bind(id),
    env.DB.prepare('SELECT source, a, lieu, mois FROM contact_source WHERE contact_id = ?1 ORDER BY a, id').bind(id),
    env.DB.prepare('SELECT id, source, created_at, message, commune_bien, type_bien FROM lead WHERE contact_id = ?1 ORDER BY created_at DESC LIMIT 50').bind(id),
    env.DB.prepare('SELECT a, type, source, texte, par FROM contact_evenement WHERE contact_id = ?1 ORDER BY a DESC, id DESC LIMIT 200').bind(id),
  ]) as [D1Result<Ligne>, D1Result<{ type: string; reseau: string | null; valeur: string }>, D1Result<{ source: string; a: string; lieu: string | null; mois: string | null }>,
    D1Result<{ id: string; source: string; created_at: string; message: string | null; commune_bien: string | null; type_bien: string | null }>, D1Result<EvenementFiche>];
  const l = c.results[0];
  if (!l) return null;
  const vus = new Set<string>();
  return {
    id: l.id, created_at: l.created_at, prenom: l.prenom, nom: l.nom, entreprise: l.entreprise, commune: l.commune,
    telephones: [l.telephone, ...coords.results.filter((x) => x.type === 'telephone').map((x) => x.valeur)].filter((x): x is string => !!x),
    emails: [l.email, ...coords.results.filter((x) => x.type === 'email').map((x) => x.valeur)].filter((x): x is string => !!x),
    profils: coords.results.filter((x) => x.type === 'profil' && LIEN_WEB.test(x.valeur)).map((x) => ({ reseau: x.reseau, url: x.valeur })),
    categorie_id: l.categorie_id, categorie: l.categorie, appel_permis_categorie: l.appel_permis === null ? null : !!l.appel_permis,
    projet: l.projet, temperature: l.temperature, verifie_le: l.verifie_le, ecarte_le: l.ecarte_le,
    appel_autorise: l.appel_autorise === null ? null : !!l.appel_autorise, a_rappeler_le: l.a_rappeler_le,
    dernier_contact_le: l.dernier_contact_le, dernier_contact_canal: l.dernier_contact_canal, ambassadeur_inscrit_le: l.ambassadeur_inscrit_le,
    etape: l.etape, etape_libelle: l.etape ? LIBELLES_ETAPES[l.etape as Etape] ?? l.etape : null, en_cours: suiviEnCours(l.etape),
    prochaine_action: l.prochaine_action, prochaine_action_le: l.prochaine_action_le,
    accord: etatEmail(l),
    sources: sources.results.filter((s) => !vus.has(s.source) && vus.add(s.source)).map((s) => ({ source: s.source, libelle: libelleSource(s.source), a: s.a })),
    rencontres: rencontresDe(sources.results).map(libelleRencontre).filter(Boolean),
    seances: [],
    demandes: demandes.results.map((d) => ({ ...d, libelle: SOURCES_DEMANDE[d.source] ?? d.source })),
    historique: historique.results,
  };
}
