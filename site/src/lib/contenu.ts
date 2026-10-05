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
 * qui ont forcément leurs autorisations (règle du schéma, story 7.9).
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
