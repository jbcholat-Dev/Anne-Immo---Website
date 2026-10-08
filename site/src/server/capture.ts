// Traitement commun des formulaires contact, estimation, guide (story 10.3) et du gate du diagnostic (story 10.4), AD-4, AD-7.
// Dans l'ordre : barrières anti-robot, validation du contenu, écriture en base, réponse au visiteur ;
// les e-mails partent ensuite, sans faire attendre le visiteur (et sans jamais le mettre en échec).
import type { APIContext } from 'astro';
import { diffuser } from './delivery';
import { evaluer, type Diagnostic } from './diagnostic';
import { enProduction, envSite } from './env';
import { empreinte, journal } from './journal';
import { ecrireLead } from './leads';
import { valider, type SourceFormulaire } from './schema';
import { ULID } from './ulid';
import { champPiege, frequence, turnstile } from './verification';

const MESSAGES: Record<string, string> = {
  REQUETE_INVALIDE: "La demande n'a pas pu être lue.",
  CHAMP_INVALIDE: 'Un champ est à corriger.',
  ANTI_ROBOT: "La vérification anti-robot n'a pas abouti. Réessayez.",
  ANTI_ROBOT_INDISPONIBLE: "La vérification anti-robot ne répond pas. Réessayez dans un instant.",
  TROP_DE_DEMANDES: 'Trop de demandes envoyées. Réessayez dans une minute.',
  BASE_INDISPONIBLE: "L'enregistrement n'a pas abouti. Vos informations sont conservées : vous pouvez renvoyer.",
};
const STATUTS: Record<string, number> = {
  REQUETE_INVALIDE: 400, CHAMP_INVALIDE: 400, ANTI_ROBOT: 403, ANTI_ROBOT_INDISPONIBLE: 503, TROP_DE_DEMANDES: 429, BASE_INDISPONIBLE: 503,
};
const ENTETES = { 'Cache-Control': 'no-store' };

const refus = (code: string, champ?: string) =>
  Response.json({ ok: false, error: { code, message: MESSAGES[code], ...(champ ? { champ } : {}) } }, { status: STATUTS[code], headers: ENTETES });

export async function traiterCapture(source: SourceFormulaire, { request, locals }: APIContext): Promise<Response> {
  const env = envSite;
  if (Number(request.headers.get('content-length') ?? 0) > 40_000) return refus('REQUETE_INVALIDE');
  let d: Record<string, unknown>;
  try {
    d = (await request.json()) as Record<string, unknown>;
    if (!d || typeof d !== 'object') throw new Error();
  } catch {
    return refus('REQUETE_INVALIDE');
  }
  const ip = request.headers.get('cf-connecting-ip');

  const barrieres = [() => turnstile(env, d.turnstile, ip), () => champPiege(d.site_web), () => frequence(env, ip)];
  for (const passer of barrieres) {
    const barriere = await passer();
    if (!barriere.ok) {
      journal('capture_refusee', { source, code: barriere.code, detail: barriere.detail });
      return refus(barriere.code);
    }
  }

  const submissionId = typeof d.submission_id === 'string' ? d.submission_id : '';
  if (!ULID.test(submissionId)) return refus('CHAMP_INVALIDE', 'submission_id');
  const verdict = valider(source, d);
  if (!verdict.ok) {
    journal('capture_refusee', { source, code: 'CHAMP_INVALIDE', champ: verdict.champ });
    return refus('CHAMP_INVALIDE', verdict.champ);
  }
  // Diagnostic : réponses revérifiées, score calculé ici, jamais dans le navigateur (AD-5).
  let diag: Diagnostic | null = null;
  if (source === 'diagnostic') {
    const evaluation = evaluer(d);
    if (!evaluation.ok) {
      journal('capture_refusee', { source, code: 'CHAMP_INVALIDE', champ: evaluation.champ });
      return refus('CHAMP_INVALIDE', evaluation.champ);
    }
    diag = evaluation.diagnostic;
  }

  const isTest = !enProduction(env);
  let ecriture;
  try {
    ecriture = await ecrireLead(env, verdict.lead, submissionId, isTest, diag);
  } catch (e) {
    journal('base_indisponible', { source, erreur: String(e).slice(0, 200) });
    return refus('BASE_INDISPONIBLE');
  }
  journal('lead_ecrit', { source, lead: ecriture.leadId, nouveau: ecriture.nouveau, test: isTest, email: await empreinte(verdict.lead.email) });

  const envoi = diffuser(env, ecriture.leadId).catch((e) => journal('diffusion_interrompue', { lead: ecriture.leadId, erreur: String(e).slice(0, 200) }));
  const cf = (locals as { cfContext?: ExecutionContext }).cfContext;
  if (cf) cf.waitUntil(envoi);
  else await envoi;
  // Diagnostic : la page de résultats, liée au jeton du lead (celui du premier envoi si c'est un renvoi).
  const suite = source === 'diagnostic' && ecriture.token ? { url: `/diagnostic/resultats?t=${ecriture.token}` } : {};
  return Response.json({ ok: true, ...suite }, { headers: ENTETES });
}
