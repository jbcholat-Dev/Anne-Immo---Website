// L'import des contacts par Claude (story 18.9, AD-26) : la seule route qui ouvre les contacts au jeton de service de Claude,
// et seulement pour en faire entrer : aperçu, import, annulation d'un lot. Elle ne lit jamais le tableau ni les fiches : ses
// réponses ne contiennent que des compteurs, les lignes du fichier envoyé (repères « onglet:ligne »), et pour un doublon
// probable le nom et les sources du contact existant (le minimum pour que JB décide, AD-26).
// worker.ts n'ouvre /api/claude/… qu'au jeton de Claude ; une personne connectée (Anne, JB) y est refusée : l'import par
// Anne n'est pas en V1 (PRD § 6.2), et la route vérifie à nouveau le compte. JSON seulement, 4 Mo au plus (413).
//   POST { action: "apercu",   fichier, doublons? }            → { ok, apercu }
//   POST { action: "importer", fichier, empreinte, doublons? } → { ok, import }   (409 sans l'empreinte de l'aperçu)
//   POST { action: "annuler",  lot }                           → { ok, annulation }
// `fichier` : { format: "vcard"|"csv", nom, genre, detail?, contenu } ou { format: "tableur", nom, onglets: [{ nom, genre, detail?, lignes }] }
// (voir server/import.ts). `doublons` : { "<ligne>": "garder" | "fusionner:<id>" }, décisions de JB sur l'aperçu.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { COMPTE_CLAUDE, pourSite as env } from '../../../server/env';
import { ULID } from '../../../server/formulaires';
import { annuler, apercu, ErreurImport, importer, lireDecisions, lireFichier } from '../../../server/import';

export const prerender = false;
const MAX_CORPS = 4_000_000;
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
const erreur = (code: string, message: string, status: number) => json({ ok: false, error: { code, message } }, status);

export const POST: APIRoute = async ({ request }) => {
  if (request.headers.get(ENTETE_COMPTE) !== COMPTE_CLAUDE) return erreur('acces', 'Accès refusé', 403);
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return erreur('format', 'Corps JSON attendu.', 415);
  if (Number(request.headers.get('content-length') ?? 0) > MAX_CORPS) return erreur('trop_grand', 'Corps trop grand : découpez le fichier.', 413);
  const brut = await request.text();
  if (brut.length > MAX_CORPS) return erreur('trop_grand', 'Corps trop grand : découpez le fichier.', 413);
  let d: Record<string, unknown>;
  try { d = JSON.parse(brut); } catch { return erreur('format', 'Corps JSON attendu.', 400); }
  if (!d || typeof d !== 'object' || Array.isArray(d)) return erreur('format', 'Corps JSON attendu.', 400);
  const inconnu = Object.keys(d).find((k) => !['action', 'fichier', 'empreinte', 'doublons', 'lot'].includes(k));
  if (inconnu) return erreur('champ', `Champ inconnu : ${inconnu.slice(0, 40)}`, 400);
  try {
    if (d.action === 'annuler') {
      if (typeof d.lot !== 'string' || !ULID.test(d.lot)) return erreur('lot', 'Identifiant de lot invalide.', 400);
      const r = await annuler(env, d.lot, COMPTE_CLAUDE);
      return r ? json({ ok: true, annulation: r }) : erreur('lot', 'Lot inconnu.', 404);
    }
    if (d.action !== 'apercu' && d.action !== 'importer') return erreur('action', 'Action attendue : apercu, importer ou annuler.', 400);
    const lecture = await lireFichier(d.fichier);
    const decisions = lireDecisions(d.doublons);
    if (d.action === 'apercu') return json({ ok: true, apercu: await apercu(env, lecture, decisions) });
    return json({ ok: true, import: await importer(env, lecture, d.empreinte, decisions, COMPTE_CLAUDE) }, 201);
  } catch (e) {
    if (e instanceof ErreurImport) return erreur(e.code, e.message, e.statut);
    throw e;
  }
};
