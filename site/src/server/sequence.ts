// Séquence d'e-mails de la sortie B (story 10.5, AD-1, AD-8, AD-16) : les e-mails écrits par Anne dans
// contenu-anne/guide/sequence-emails/etape-N/<langue>.md, lus à la construction et embarqués dans le serveur.
// L'étape 0 (J+0) est le résumé des résultats, déjà envoyé par `confirm_prospect` : la séquence commence à l'étape 1.
// Chaque inscription (gate, formulaire du guide, bouton de la page de résultats) crée une ligne `sequence:<étape>`
// par e-mail, à échéance inscription + `delai_jours` ; la tâche planifiée les envoie (delivery.ts).
import type { EnvSite } from './env';

export type Langue = 'fr' | 'en';
export interface EtapeSequence {
  etape: number;
  delai_jours: number;
  sujet: string;
  corps: string;
  statut: string;
}

const FICHIERS = import.meta.glob('../../../contenu-anne/guide/sequence-emails/etape-*/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const GUIDE = import.meta.glob('../../../contenu-anne/guide/guide.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** Les champs simples d'un en-tête `---` (clé: valeur sur une ligne, guillemets facultatifs). */
function entete(md: string): { champs: Record<string, string>; corps: string } {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(md.replace(/\r\n/g, '\n'));
  if (!m) return { champs: {}, corps: md };
  const champs: Record<string, string> = {};
  for (const l of m[1].split('\n')) {
    const c = /^([a-z_]+):\s*(.*)$/.exec(l);
    if (c) champs[c[1]] = c[2].trim().replace(/^"(.*)"$/, '$1');
  }
  return { champs, corps: m[2].trim() };
}

function lire(): Record<Langue, EtapeSequence[]> {
  const parLangue: Record<Langue, EtapeSequence[]> = { fr: [], en: [] };
  for (const [chemin, md] of Object.entries(FICHIERS)) {
    const langue = /\/(fr|en)\.md$/.exec(chemin)?.[1] as Langue | undefined;
    if (!langue) continue;
    const { champs, corps } = entete(md);
    const etape = Number(champs.etape);
    const delai = Number(champs.delai_jours);
    if (!Number.isInteger(etape) || !Number.isFinite(delai) || !champs.sujet || !corps) {
      throw new Error(`Séquence d'e-mails : ${chemin} doit avoir etape, delai_jours, sujet et un texte (story 10.5).`);
    }
    if (etape === 0) continue;
    parLangue[langue].push({ etape, delai_jours: delai, sujet: champs.sujet, corps, statut: champs.statut ?? 'brouillon' });
  }
  for (const l of Object.keys(parLangue) as Langue[]) parLangue[l].sort((a, b) => a.etape - b.etape);
  return parLangue;
}

export const ETAPES = lire();
export const STATUT_GUIDE = entete(Object.values(GUIDE)[0] ?? '').champs.statut ?? 'brouillon';

/** Une langue livrée a toute sa séquence : même nombre d'étapes que le français. Sinon les leads de cette langue
 * ne reçoivent pas de séquence (le site n'a pas encore de page anglaise qui la propose). */
export const etapesDe = (lang: Langue): EtapeSequence[] => (ETAPES[lang].length === ETAPES.fr.length ? ETAPES[lang] : []);
export const NOMBRE_ETAPES = ETAPES.fr.length;
export const PREMIER_DELAI = ETAPES.fr[0]?.delai_jours ?? 0;

// Garde-fou du lancement (AD-2) : le site public ne part pas avec un e-mail ou un guide encore en brouillon.
// L'évaluation de ce module à la construction (page /guide, prérendue) fait échouer `npm run build`.
if (import.meta.env.PUBLIC_INDEXATION === 'oui') {
  const brouillons = ETAPES.fr.filter((e) => e.statut !== 'publie').map((e) => `etape-${e.etape}`);
  if (STATUT_GUIDE !== 'publie') brouillons.push('guide.md');
  if (brouillons.length) throw new Error(`Lancement refusé : contenu du guide ou de la séquence encore en brouillon (${brouillons.join(', ')}). Anne passe chaque fichier en « publie » après relecture.`);
}

/** Crée une ligne `sequence:<étape>` par e-mail (échéance = inscription + délai). Sans effet si elles existent déjà. */
export function lignesSequence(env: EnvSite, leadId: string, lang: Langue, inscription: string): D1PreparedStatement[] {
  const depart = Date.parse(inscription);
  return etapesDe(lang).map((e) =>
    env.DB.prepare(
      `INSERT INTO lead_delivery (lead_id, channel, due_at) SELECT ?1, ?2, ?3
       WHERE EXISTS (SELECT 1 FROM lead WHERE id = ?1 AND newsletter_unsubscribed_at IS NULL)
       ON CONFLICT (lead_id, channel) DO NOTHING`,
    ).bind(leadId, `sequence:${e.etape}`, new Date(depart + e.delai_jours * 86_400_000).toISOString()),
  );
}

/** L'objet d'un e-mail de la séquence, prénom remplacé (sans prénom : « [Prénom], on fait… » devient « On fait… »). */
export function sujetEtape(e: EtapeSequence, prenom: string | null): string {
  if (prenom) return e.sujet.replace(/\[Prénom\]/g, prenom);
  const s = e.sujet.replace(/\[Prénom\],?\s*/g, '').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
