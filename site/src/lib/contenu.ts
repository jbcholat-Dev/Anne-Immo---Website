import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { liaisonsAssumees } from '../config/site';
import { images } from './images';
import fs from 'node:fs';
import path from 'node:path';

export type Story = CollectionEntry<'stories'>;
export type Avis = CollectionEntry<'avis'>;

/** Manifeste des photos d'une story (produit par scripts/preparer-photos dans contenu-anne). */
export type PhotoStory = { id: string; fichier: string; role: 'principale' | 'secondaire'; largeur: number; hauteur: number; orientation: string };
export function photosDeStory(slug: string): PhotoStory[] {
  const f = path.resolve(process.cwd(), '../contenu-anne/stories', slug, 'photos/photos.json');
  if (!fs.existsSync(f)) return [];
  return JSON.parse(fs.readFileSync(f, 'utf8')).photos as PhotoStory[];
}
export const cleImage = (slug: string, p: PhotoStory) => `stories/${slug}/${path.basename(p.fichier, '.jpg')}`;
export function photoPrincipale(slug: string) {
  const p = photosDeStory(slug).find((x) => x.role === 'principale');
  return p && images[cleImage(slug, p)] ? cleImage(slug, p) : null;
}

/** Les stories, triées par année décroissante puis slug. v1 : toutes les stories rédigées sont affichées (statut brouillon accepté — voir README). */
export async function stories(): Promise<Story[]> {
  const all = await getCollection('stories');
  return all.sort((a, b) => (Number(b.data.annee_vente ?? 0) - Number(a.data.annee_vente ?? 0)) || a.id.localeCompare(b.id));
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
