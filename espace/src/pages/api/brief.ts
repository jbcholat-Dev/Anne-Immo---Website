// Brief du jour (story 18.26, AD-37) : décider d'une ligne, annuler la décision, ou préparer le brief à la demande.
// Réservé aux comptes dont l'empreinte est dans BRIEF_LECTEURS (phase 1 : JB seul) ; jeton de service de Claude refusé (403).
//   POST /api/brief { id, decision: 'accepte' | 'plus_tard' | 'ecarte' } → 200 { ok, message, lien? }
//   POST /api/brief { annuler: id }                                     → 200 { ok, message }
//   POST /api/brief { preparer: true }                                  → 200 { ok, message }
// Réponses `{ ok, ... }` ou `{ ok: false, error: { code, message } }`.
import type { APIRoute } from 'astro';
import { ENTETE_COMPTE } from '@site/server/acces';
import { decider, estDecision, peutVoir, preparerBrief } from '../../server/brief';
import { COMPTE_CLAUDE, envEspace } from '../../server/env';
import { ULID } from '../../server/formulaires';

export const prerender = false;
const json = (corps: unknown, status = 200) => new Response(JSON.stringify(corps), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const erreur = (status: number, code: string, message: string) => json({ ok: false, error: { code, message } }, status);

export const POST: APIRoute = async ({ request }) => {
  const compte = request.headers.get(ENTETE_COMPTE);
  if (!compte || compte === COMPTE_CLAUDE || !(await peutVoir(envEspace, compte))) return erreur(403, 'acces', 'Accès refusé');
  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return erreur(400, 'corps', 'Corps JSON attendu');
  const texte = await request.text();
  if (texte.length > 2000) return erreur(413, 'taille', 'Demande trop grande');
  let d: Record<string, unknown>;
  try {
    const brut = JSON.parse(texte) as unknown;
    if (!brut || typeof brut !== 'object' || Array.isArray(brut)) return erreur(400, 'corps', 'Corps JSON attendu');
    d = brut as Record<string, unknown>;
  } catch { return erreur(400, 'corps', 'Corps JSON attendu'); }
  const cles = Object.keys(d);
  if (d.preparer === true && cles.length === 1) {
    const n = await preparerBrief(envEspace);
    return json({ ok: true, message: n ? `Brief préparé : ${n} décision${n > 1 ? 's' : ''}.` : 'Rien à proposer pour l\'instant, ou brief déjà préparé.' });
  }
  const r = d.annuler !== undefined
    ? (typeof d.annuler === 'string' && ULID.test(d.annuler) && cles.length === 1 ? await decider(envEspace, d.annuler, null, compte) : null)
    : (typeof d.id === 'string' && ULID.test(d.id) && estDecision(d.decision) && cles.length === 2 ? await decider(envEspace, d.id, d.decision, compte) : null);
  if (!r) return erreur(400, 'corps', 'Demande invalide');
  return r.ok ? json(r) : erreur(r.status, r.code, r.message);
};
