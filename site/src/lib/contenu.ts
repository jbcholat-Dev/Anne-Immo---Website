import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { liaisonsAssumees } from '../config/site';
import { images } from './images';
import fs from 'node:fs';
import path from 'node:path';

export type Story = CollectionEntry<'stories'>;
export type Avis = CollectionEntry<'avis'>;

/**
 * Photos d'une story, dans l'ordre de l'en-tête de fr.md : `photo_principale` puis `photos`.
 * Une valeur est soit un chemin relatif au dossier de la story (« photos/sejour.webp », écrit par l'espace d'édition, story 7.13),
 * soit un ancien numéro de photo HD (« 6965 »), retrouvé dans photos.json produit par scripts/preparer-photos.
 * Seules les photos dont les formats web existent (src/data/images.json, `npm run images`) sont rendues.
 */
export type PhotoStory = { cle: string; role: 'principale' | 'secondaire' };
function manifesteHistorique(slug: string): { fichier: string; choix: string }[] {
  const f = path.resolve(process.cwd(), '../contenu-anne/stories', slug, 'photos/photos.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).photos : [];
}
function cleDePhoto(slug: string, valeur: string | null | undefined): string | null {
  if (valeur == null || String(valeur).trim() === '') return null;
  const v = String(valeur).trim();
  const fichier = /[/.]/.test(v) ? v : manifesteHistorique(slug).find((p) => p.choix === v)?.fichier;
  if (!fichier) return null;
  const cle = `stories/${slug}/${path.basename(fichier).replace(/\.[^.]+$/, '')}`;
  return images[cle] ? cle : null;
}
export function photosDeStory(story: Story): PhotoStory[] {
  const principale = cleDePhoto(story.id, story.data.photo_principale);
  const autres = story.data.photos.map((v) => cleDePhoto(story.id, v)).filter((c): c is string => c !== null && c !== principale);
  return [...(principale ? [{ cle: principale, role: 'principale' as const }] : []), ...autres.map((cle) => ({ cle, role: 'secondaire' as const }))];
}
export const photoPrincipale = (story: Story) => photosDeStory(story).find((p) => p.role === 'principale')?.cle ?? null;

/**
 * Les stories, triées par année décroissante puis slug.
 * Aperçu : toutes, brouillons compris, pour relire. Site public (PUBLIC_INDEXATION = « oui ») : seulement les « publie »,
 * (Anne ne passe une vente en « publie » qu'avec l'accord de ses clients, story 7.14).
 */
export async function stories(): Promise<Story[]> {
  const publiques = import.meta.env.PUBLIC_INDEXATION === 'oui';
  const all = (await getCollection('stories')).filter((s) => !publiques || s.data.statut === 'publie');
  return all.sort((a, b) => (Number(b.data.annee_vente ?? 0) - Number(a.data.annee_vente ?? 0)) || a.id.localeCompare(b.id));
}

/** Une story par son slug, seulement si elle est visible dans cette construction (sinon ni lien ni photo : rien d'un brouillon sur le site public). */
export async function storyVisible(slug: string | null | undefined): Promise<Story | null> {
  if (!slug) return null;
  return (await stories()).find((s) => s.id === slug) ?? null;
}

/** Story reliée à un avis : le champ `story` d'Anne d'abord, sinon la liaison assumée v1. */
export function storyDeAvis(a: Avis): string | null {
  return a.data.story ?? liaisonsAssumees[a.data.id] ?? null;
}
export async function avisDeStory(slug: string): Promise<Avis[]> {
  const all = await getCollection('avis');
  return all.filter((a) => storyDeAvis(a) === slug).sort((a, b) => (a.data.role === 'vendeur' ? -1 : 1) - (b.data.role === 'vendeur' ? -1 : 1));
}
export async function avisParId(id: string): Promise<Avis> {
  const a = await getEntry('avis', id);
  if (!a) throw new Error(`Avis introuvable : ${id}`);
  return a;
}
export async function instantane() {
  const [i] = await getCollection('instantane');
  if (!i) throw new Error('instantane.md introuvable');
  return i.data;
}

/** Libellé du rôle, accordé au pseudonyme quand il est manifestement féminin (Alexandra, Laetitia…) — v1, simple. */
export function roleLibelle(a: Avis, lang: 'fr' | 'en' = 'fr') {
  const fem = /^(alexandra|laetitia|isaline|sabine|cat )/i.test(a.data.auteur);
  if (lang === 'en') return a.data.role === 'vendeur' ? 'seller' : 'buyer';
  return a.data.role === 'vendeur' ? (fem ? 'vendeuse' : 'vendeur') : fem ? 'acheteuse' : 'acheteur';
}
export function dateLibelle(d: Date, lang: 'fr' | 'en' = 'fr') {
  return d.toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', { month: 'long', year: 'numeric' });
}
/** Le texte d'un avis, en paragraphes (tel quel, jamais corrigé). */
export const paragraphes = (body: string | undefined) => (body ?? '').trim().split(/\n\s*\n/).map((p) => p.replace(/\n/g, ' ').trim()).filter(Boolean);

/**
 * Portrait d'Anne (A-04) : champ `portrait` de la page À propos, choisi dans l'espace d'édition (story 7.16).
 * Le fichier vit à côté de la page (contenu-anne/pages/a-propos/) ou dans contenu-anne/photos/ ; renvoie la clé de l'image dérivée, ou null.
 */
export async function portraitAnne(): Promise<string | null> {
  const page = await getEntry('pages', 'a-propos');
  const valeur = page?.data.portrait;
  if (!valeur) return null;
  // L'espace d'édition range la photo à côté de la page (« portrait.webp ») ; « photos/x.webp » désigne contenu-anne/photos/ (story 7.18).
  const nom = path.basename(valeur).replace(/\.[^.]+$/, '');
  const cles = /^\/?photos\//.test(valeur) ? [`photos/${nom}`] : [`pages/a-propos/${nom}`, `photos/${nom}`];
  return cles.find((c) => images[c]) ?? null;
}

/**
 * Page À propos lue depuis contenu-anne/pages/a-propos/fr.md (story 7.17) : le texte modifié dans l'espace d'édition
 * est celui que le site affiche. Le texte est découpé selon ses titres :
 * - avant « # Ma méthode… » : la colonne « Qui suis-je ? », un bloc par titre « ## » ;
 * - « # Ma méthode : sous-titre », son premier paragraphe en introduction ;
 * - « ## …piliers » : un rang par paragraphe « **Nom :** texte » ;
 * - « ## Concrètement… » : un rang par titre « ### 1. Titre » ; une liste « Nom (précision) » devient la grille des partenaires ;
 * - tout autre « ## » : un rang simple (titre + texte) ;
 * - « # Cible » : un paragraphe d'introduction, puis un profil par titre « ## » (retour d'Anne n° 61, story 8.9) ;
 * - « # Réseau eXp » : un texte libre, avec ses éventuels titres « ## » (retour d'Anne n° 58, story 8.9).
 * Ces deux parties sont facultatives : absentes, la page garde ses textes par défaut.
 */
export type BlocTexte = { titre: string; html: string };
export type RangMethode = { chapeau: string; titre: string; html: string; partenaires?: [string, string][]; niveau: 3 | 4 };
export type APropos = {
  sousTitre?: string; qui: BlocTexte[];
  methode: { titre: string; sous?: string; intro: string; rangs: RangMethode[]; concretement?: string };
  cible?: { titre: string; intro: string; profils: BlocTexte[] };
  reseau?: { titre: string; html: string };
};

const sansBalises = (h: string) => h.replace(/<[^>]+>/g, '').replace(/&#x27;|&#39;/g, '’').replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
function decouper(html: string, niveau: 1 | 2 | 3): { titre: string; html: string }[] {
  const re = new RegExp(`<h${niveau}[^>]*>([\\s\\S]*?)</h${niveau}>`, 'g');
  const morceaux: { titre: string; html: string }[] = [];
  let dernier = 0, titre = '', m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    morceaux.push({ titre, html: html.slice(dernier, m.index) });
    titre = sansBalises(m[1]);
    dernier = m.index + m[0].length;
  }
  morceaux.push({ titre, html: html.slice(dernier) });
  return morceaux;
}
// Les tableaux vides (une ligne « | | » laissée par l'éditeur) et les commentaires ne s'affichent pas.
const nettoyer = (h: string) => h.replace(/<!--[\s\S]*?-->/g, '').replace(/<table>[\s\S]*?<\/table>/g, (t) => (sansBalises(t) ? t : '')).trim();

export async function aPropos(): Promise<APropos | null> {
  const page = await getEntry('pages', 'a-propos');
  const html = page?.rendered?.html;
  if (!page || !html) return null;
  const toutes = decouper(nettoyer(html), 1);
  const estCible = (t: string) => /^cible/i.test(t);
  const estReseau = (t: string) => /r[ée]seau/i.test(t);
  const pc = toutes.find((p) => estCible(p.titre));
  const pr = toutes.find((p) => estReseau(p.titre));
  const parties = toutes.filter((p) => !estCible(p.titre) && !estReseau(p.titre));
  const iMethode = parties.findIndex((p) => /m[ée]thode/i.test(p.titre));
  const avant = iMethode < 0 ? parties : parties.slice(0, iMethode);
  const qui = avant.flatMap((p) => decouper(p.html, 2)).filter((b) => b.titre || nettoyer(b.html)).map((b) => ({ titre: b.titre, html: nettoyer(b.html) }));
  const pm = iMethode < 0 ? { titre: 'Ma méthode', html: '' } : parties[iMethode];
  const [titre, sous] = pm.titre.split(/\s*:\s*/, 2);
  const [tete, ...sections] = decouper(pm.html, 2);
  const rangs: RangMethode[] = [];
  let concretement: string | undefined;
  for (const s of sections) {
    if (/piliers?/i.test(s.titre)) {
      let n = 0;
      for (const p of s.html.match(/<p>[\s\S]*?<\/p>/g) ?? []) {
        const m = p.match(/^<p><strong>([\s\S]*?)<\/strong>\s*([\s\S]*)<\/p>$/);
        if (!m) continue;
        rangs.push({ chapeau: `Pilier ${++n}`, titre: sansBalises(m[1]).replace(/\s*:\s*$/, ''), html: `<p>${m[2].replace(/^:\s*/, '')}</p>`, niveau: 3 });
      }
    } else if (/concr[èe]tement/i.test(s.titre)) {
      concretement = s.titre;
      for (const c of decouper(s.html, 3).slice(1)) {
        const m = c.titre.match(/^(\d+)\.?\s*(.*)$/);
        const rang: RangMethode = { chapeau: m ? m[1].padStart(2, '0') : '', titre: m ? m[2] : c.titre, html: nettoyer(c.html), niveau: 4 };
        const liste = rang.html.match(/<ul>([\s\S]*?)<\/ul>/);
        const items = liste ? [...liste[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((x) => sansBalises(x[1])) : [];
        if (items.length && items.every((x) => /\(.+\)\s*$/.test(x))) {
          rang.partenaires = items.map((x) => { const k = x.match(/^(.*?)\s*\((.*)\)\s*$/)!; return [k[1], k[2]]; });
          rang.html = rang.html.replace(liste![0], '<!--grille-->');
        }
        rangs.push(rang);
      }
    } else {
      rangs.push({ chapeau: /engagement/i.test(s.titre) ? 'Engagement' : '', titre: s.titre, html: nettoyer(s.html), niveau: 3 });
    }
  }
  let cible: APropos['cible'];
  if (pc) {
    const [intro, ...profils] = decouper(pc.html, 2);
    cible = { titre: pc.titre, intro: nettoyer(intro.html), profils: profils.map((b) => ({ titre: b.titre, html: nettoyer(b.html) })) };
  }
  const reseau = pr && nettoyer(pr.html) ? { titre: pr.titre, html: nettoyer(pr.html) } : undefined;
  return { sousTitre: page.data.sous_titre?.trim() || undefined, qui, methode: { titre: titre || 'Ma méthode', sous, intro: nettoyer(tete.html), rangs, concretement }, cible, reseau };
}
