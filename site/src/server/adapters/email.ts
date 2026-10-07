// Adaptateur e-mail (AD-8) : le seul endroit du site qui parle à Resend, le service qui envoie les e-mails.
// Sans état, il n'écrit jamais en base. Changer de fournisseur = réécrire ce seul fichier.
// Routage des tests (AD-12) : un e-mail marqué `test` part vers la boîte de test (secret BOITE_TEST),
// jamais vers Anne ni vers un prospect. Tant que le site n'est pas lancé, tous les leads sont des tests.
import type { EnvSite } from '../env';

export const EXPEDITEUR = 'Anne VIAL-TISSOT <anne@annevialtissot.fr>';

export interface Email {
  /** Destinataire réel (prospect ou boîte d'Anne), remplacé par la boîte de test si `test`. */
  a: string;
  objet: string;
  texte: string;
  repondreA?: string;
  test: boolean;
  /** Clé qui empêche Resend d'envoyer deux fois le même e-mail (même lead, même canal) pendant 24 h. */
  idempotence: string;
}

export type ResultatEnvoi = { ok: true; id: string } | { ok: false; erreur: string };

export async function envoyerEmail(env: EnvSite, e: Email): Promise<ResultatEnvoi> {
  if (!env.RESEND_API_KEY) return { ok: false, erreur: 'RESEND_API_KEY absente' };
  const a = e.test ? env.BOITE_TEST : e.a;
  if (!a) return { ok: false, erreur: e.test ? 'BOITE_TEST absente' : 'destinataire absent' };
  const corps = {
    from: EXPEDITEUR,
    to: [a],
    subject: e.test ? `[TEST] ${e.objet}` : e.objet,
    text: e.test ? `(E-mail de test : en production, il serait parti vers ${e.a}.)\n\n${e.texte}` : e.texte,
    ...(e.repondreA ? { reply_to: e.repondreA } : {}),
  };
  try {
    const r = await fetch(env.URL_SERVICES_ESSAI ? `${env.URL_SERVICES_ESSAI}/resend` : 'https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': e.idempotence,
      },
      body: JSON.stringify(corps),
      signal: AbortSignal.timeout(10000),
    });
    const reponse = (await r.json().catch(() => ({}))) as { id?: string; name?: string; message?: string };
    if (r.ok && reponse.id) return { ok: true, id: reponse.id };
    return { ok: false, erreur: `Resend ${r.status} ${reponse.name ?? ''} ${reponse.message ?? ''}`.trim().slice(0, 300) };
  } catch (err) {
    return { ok: false, erreur: `Resend injoignable : ${String(err).slice(0, 200)}` };
  }
}
