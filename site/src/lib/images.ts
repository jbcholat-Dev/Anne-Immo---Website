import manifeste from '../data/images.json';

export type ImageDerivee = { largeur: number; hauteur: number; ratio: number; webp: { w: number; src: string }[]; jpg: string };
export const images = manifeste as Record<string, ImageDerivee>;
export const image = (id: string): ImageDerivee | undefined => images[id];
export const srcset = (img: ImageDerivee) => img.webp.map((e) => `${e.src} ${e.w}w`).join(', ');
