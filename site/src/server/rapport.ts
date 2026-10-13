// Rapport PDF personnalisé du diagnostic (story 10.10, amendement AD-5 / AD-8 du 2026-10-10). Le gabarit (toutes les
// pages possibles, déjà mises en page à la charte) est fabriqué par scripts/rapport-gabarit.mjs ; ici, le serveur choisit
// les pages du vendeur (couverture de son profil, page des priorités, une partie par axe au niveau atteint, suite A ou B)
// et écrit dans les emplacements prévus : prénom et date, scores, barres, étiquette de chaque recommandation (« En
// priorité » sous la moitié des points, « À améliorer », « Point solide »), sa réponse, la liste de ses priorités, le
// pied de page. Aucun service extérieur : pdf-lib assemble le PDF dans le Worker.
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import gabaritPdf from '../../prive/rapport/gabarit.pdf?inline';
import gildaTtf from '../../prive/polices/gilda-display-400.ttf?inline';
import jostTtf from '../../prive/polices/jost-400-normal.ttf?inline';
import jost500Ttf from '../../prive/polices/jost-500-normal.ttf?inline';
import plan from './rapport-gabarit.json';
import contenu from '../content/diagnostic/questions.json';
import { pointsQuestion, type Categorie, type Reponses } from './scoring';
import type { Scores } from './diagnostic';

type Emplacement = { page: number; x: number; y: number; l: number; h: number; base?: number; taille?: number };
type Partie = { pages: number[]; emplacements: Record<string, Emplacement> };
const PARTIES = plan.parties as Record<string, Partie>;
const [, HAUTEUR] = plan.page;

const octets = (dataUrl: string) => Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), (c) => c.charCodeAt(0));
const GABARIT = octets(gabaritPdf);
const POLICES = { gilda: octets(gildaTtf), jost: octets(jostTtf), jost500: octets(jost500Ttf) };

const C = {
  klein: rgb(0, 47 / 255, 167 / 255), terra: rgb(196 / 255, 98 / 255, 62 / 255), brun: rgb(38 / 255, 32 / 255, 26 / 255),
  muet: rgb(92 / 255, 82 / 255, 72 / 255), brume: rgb(231 / 255, 237 / 255, 249 / 255), ecru: rgb(247 / 255, 242 / 255, 234 / 255),
  terraFonce: rgb(163 / 255, 78 / 255, 48 / 255), galet: rgb(233 / 255, 224 / 255, 210 / 255), blanc: rgb(1, 1, 1),
};

export const AXES: Record<Categorie, { nom: string; questions: string[] }> = {
  preparation: { nom: 'Préparation à la vente', questions: ['q01', 'q02', 'q03', 'q04'] },
  visibilite: { nom: 'Visibilité & Attractivité', questions: ['q05', 'q06', 'q07', 'q08'] },
  efficacite: { nom: 'Efficacité commerciale', questions: ['q09', 'q10'] },
};
const MAX_QUESTION = 10;
// Titres des recommandations (contenu-anne/guide/rapport-diagnostic.md), rangés avec le gabarit pour la page des priorités.
const TITRES = plan.titres as Record<string, string>;

export type Etat = 'priorite' | 'ameliorer' | 'solide';
export const etatDe = (points: number): Etat => (points < MAX_QUESTION / 2 ? 'priorite' : points >= MAX_QUESTION ? 'solide' : 'ameliorer');

type Ecran = { id: string; options: { id: string; libelle: string }[] };
const LIBELLES = new Map((contenu.ecrans as Ecran[]).flatMap((e) => (e.options ?? []).map((o) => [o.id, o.libelle] as const)));

/** La réponse du vendeur à une question, en clair. */
export function reponseLisible(q: string, r: Reponses): string {
  if (q === 'q07') {
    const choix = (r.q07 ?? []).filter((x) => x && x !== 'q07.i');
    if (!choix.length) return 'Aucune diffusion active';
    return `${choix.map((x) => LIBELLES.get(x) ?? 'Autre').join(', ')} (${choix.length} plateforme${choix.length > 1 ? 's' : ''})`;
  }
  if (q === 'q10') {
    const a = LIBELLES.get(r.q10a?.[0] ?? ''), b = LIBELLES.get(r.q10b?.[0] ?? '');
    return a && b ? `${a}, ${b.toLowerCase()}` : 'Non renseigné';
  }
  return (r[q] ?? []).map((x) => LIBELLES.get(x) ?? x).join(', ') || 'Non renseigné';
}

export interface DonneesRapport {
  prenom: string;
  nom: string;
  date: Date;
  scores: Scores;
  orientation: 'A' | 'B';
  reponses: Reponses;
}

/** Remplace les caractères absents de la police (elle ne couvre que l'alphabet latin) : accent retiré, sinon « ? ». */
function lisible(police: PDFFont, texte: string): string {
  const jeu = new Set(police.getCharacterSet());
  return [...texte].map((c) => {
    if (jeu.has(c.codePointAt(0)!)) return c;
    const sans = c.normalize('NFD').replace(/\p{M}/gu, '');
    return [...sans].every((x) => jeu.has(x.codePointAt(0)!)) ? sans : '?';
  }).join('');
}

/** Réduit puis coupe un texte pour qu'il tienne dans une largeur. */
function ajuster(police: PDFFont, texte: string, taille: number, largeur: number, min = taille * 0.8): { texte: string; taille: number } {
  let t = lisible(police, texte), s = taille;
  while (police.widthOfTextAtSize(t, s) > largeur && s > min) s -= 0.25;
  if (police.widthOfTextAtSize(t, s) <= largeur) return { texte: t, taille: s };
  while (t.length > 1 && police.widthOfTextAtSize(`${t}…`, s) > largeur) t = t.slice(0, -1);
  return { texte: `${t.trimEnd()}…`, taille: s };
}

/** Une pilule (rectangle aux bouts arrondis), coordonnées depuis le haut de la page. */
function pilule(page: PDFPage, x: number, y: number, l: number, h: number, couleur: RGB) {
  if (l <= 0) return;
  const r = Math.min(h / 2, l / 2);
  page.drawRectangle({ x: x + r, y: HAUTEUR - y - h, width: Math.max(0, l - 2 * r), height: h, color: couleur });
  page.drawEllipse({ x: x + r, y: HAUTEUR - y - h / 2, xScale: r, yScale: h / 2, color: couleur });
  page.drawEllipse({ x: x + l - r, y: HAUTEUR - y - h / 2, xScale: r, yScale: h / 2, color: couleur });
}

/** Le rapport PDF d'un vendeur. */
export async function fabriquerRapport(d: DonneesRapport): Promise<Uint8Array> {
  const gabarit = await PDFDocument.load(GABARIT);
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [gilda, jost, jost500] = await Promise.all([doc.embedFont(POLICES.gilda), doc.embedFont(POLICES.jost), doc.embedFont(POLICES.jost500)]);
  const nomComplet = `${d.prenom} ${d.nom}`.trim();
  doc.setTitle(`Rapport de diagnostic · ${lisible(jost, nomComplet)}`);
  doc.setAuthor('Anne VIAL-TISSOT');
  doc.setCreator('www.annevialtissot.fr');

  const axes = (Object.keys(AXES) as Categorie[]).map((k) => {
    const c = d.scores.categories[k];
    return { k, ...c, questions: AXES[k].questions.map((q) => ({ q, points: pointsQuestion(q, d.reponses), etat: etatDe(pointsQuestion(q, d.reponses)) })) };
  });
  const cles = [`couverture/${d.scores.profil}`, 'priorites', ...axes.map((a) => `axe/${a.k}/${a.bande}`), `suite/${d.orientation}`];
  const parties = cles.map((c) => PARTIES[c]);
  if (parties.some((p) => !p)) throw new Error(`gabarit incomplet : ${cles.join(', ')}`);
  const indices = parties.flatMap((p) => p.pages);
  const copiees = await doc.copyPages(gabarit, indices);
  const pageDe = new Map(indices.map((i, n) => [i, copiees[n]]));
  copiees.forEach((p) => doc.addPage(p));

  const texte = (e: Emplacement, t: string, police: PDFFont, couleur: RGB, opts: { taille?: number; droite?: boolean; largeur?: number } = {}) => {
    const a = ajuster(police, t, opts.taille ?? e.taille ?? 10, opts.largeur ?? e.l);
    const l = police.widthOfTextAtSize(a.texte, a.taille);
    pageDe.get(e.page)!.drawText(a.texte, { x: opts.droite ? e.x + e.l - l : e.x, y: HAUTEUR - (e.base ?? e.y + e.h), size: a.taille, font: police, color: couleur });
    return l;
  };
  const barre = (e: Emplacement, pourcent: number) => pilule(pageDe.get(e.page)!, e.x, e.y, (e.l * Math.max(0, Math.min(100, pourcent))) / 100, e.h, C.terra);

  // Couverture.
  const couv = PARTIES[`couverture/${d.scores.profil}`].emplacements;
  const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' }).format(d.date);
  texte(couv.pour, `Préparé pour ${nomComplet} · ${date}`, jost, C.muet);
  const ls = texte(couv.score, String(d.scores.total), gilda, C.klein);
  texte({ ...couv.score, x: couv.score.x + ls + 8 }, '/ 100', jost, C.muet, { taille: 16 });
  for (const a of axes) {
    texte(couv[`valeur_${a.k}`], `${a.brut} / ${a.max}`, jost500, C.brun, { droite: true });
    barre(couv[`barre_${a.k}`], a.pourcent);
  }

  // Page « Par où commencer » : les recommandations « En priorité », dans l'ordre des axes.
  const zone = PARTIES.priorites.emplacements.liste;
  const page = pageDe.get(zone.page)!;
  const priorites = axes.flatMap((a) => a.questions.filter((q) => q.etat === 'priorite').map((q) => ({ ...q, axe: AXES[a.k].nom })));
  if (!priorites.length) {
    texte({ ...zone, base: zone.y + 14 }, 'Aucun point faible marqué : vos priorités sont des ajustements fins, détaillés axe par axe.', jost, C.brun, { taille: 10.5 });
  }
  priorites.forEach((p, n) => {
    const y = zone.y + n * 38;
    if (y + 38 > zone.y + zone.h) return;
    pilule(page, zone.x, y + 9, 20, 20, C.terra);
    const num = String(n + 1);
    page.drawText(num, { x: zone.x + 10 - jost500.widthOfTextAtSize(num, 9) / 2, y: HAUTEUR - y - 22, size: 9, font: jost500, color: C.blanc });
    texte({ ...zone, x: zone.x + 32, l: zone.l - 32, base: y + 17 }, TITRES[p.q] ?? p.q, jost, C.brun, { taille: 10.5 });
    texte({ ...zone, x: zone.x + 32, l: zone.l - 32, base: y + 29 }, p.axe, jost, C.muet, { taille: 8.5 });
    page.drawLine({ start: { x: zone.x, y: HAUTEUR - y - 37 }, end: { x: zone.x + zone.l, y: HAUTEUR - y - 37 }, thickness: 0.75, color: C.galet });
  });

  // Une partie par axe.
  for (const a of axes) {
    const em = PARTIES[`axe/${a.k}/${a.bande}`].emplacements;
    const l = texte(em.score, String(a.brut), gilda, C.klein);
    texte({ ...em.score, x: em.score.x + l + 6 }, `/ ${a.max} · ${a.pourcent} %`, jost, C.muet, { taille: 10.5 });
    barre(em.barre, a.pourcent);
    for (const q of a.questions) {
      const carte = em[`carte_${q.q}`], badge = em[`badge_${q.q}`], rep = em[`reponse_${q.q}`];
      const p = pageDe.get(carte.page)!;
      if (q.etat === 'priorite') p.drawRectangle({ x: carte.x, y: HAUTEUR - carte.y - carte.h + 8, width: 3, height: carte.h - 16, color: C.terra });
      const [libelle, fond, couleur] = q.etat === 'priorite' ? ['EN PRIORITÉ', C.terra, C.blanc] : q.etat === 'solide' ? ['POINT SOLIDE', C.brume, C.klein] : ['À AMÉLIORER', C.ecru, C.terraFonce];
      const lt = jost500.widthOfTextAtSize(libelle, 7.5);
      const lb = lt + 16;
      pilule(pageDe.get(badge.page)!, badge.x + badge.l - lb, badge.y, lb, badge.h, fond);
      pageDe.get(badge.page)!.drawText(libelle, { x: badge.x + badge.l - lb + 8, y: HAUTEUR - badge.y - badge.h / 2 - 2.6, size: 7.5, font: jost500, color: couleur });
      texte(rep, `Votre réponse : ${reponseLisible(q.q, d.reponses)} · ${q.points} / ${MAX_QUESTION} points`, jost, C.muet);
    }
  }

  // Pied de chaque page : nom et numéro.
  const pages = doc.getPages();
  pages.forEach((p, n) => {
    const gauche = ajuster(jost, `Rapport de diagnostic · ${nomComplet} · www.annevialtissot.fr`, 7.5, 400).texte;
    p.drawText(gauche, { x: 56.7, y: 28, size: 7.5, font: jost, color: C.muet });
    const num = `${n + 1} / ${pages.length}`;
    p.drawText(num, { x: 538.6 - jost.widthOfTextAtSize(num, 7.5), y: 28, size: 7.5, font: jost, color: C.muet });
  });
  return doc.save();
}
