// Adaptateur e-mail (AD-8) : le seul endroit du site qui parle à Resend, le service qui envoie les e-mails.
// Sans état, il n'écrit jamais en base. Changer de fournisseur = réécrire ce seul fichier.
// Routage des tests (AD-12) : un e-mail marqué `test` part vers la boîte de test (secret BOITE_TEST),
// jamais vers Anne ni vers un prospect. Tant que le site n'est pas lancé, tous les leads sont des tests.
import logo from '../email-logo.png?inline';
import { CID_LOGO } from '../email-html';
import type { EnvSite } from '../env';

/** Logo joint aux e-mails HTML et affiché par `cid:logo` : aucune image n'est chargée depuis un serveur (story 10.9). */
const LOGO_BASE64 = logo.slice(logo.indexOf(',') + 1);

export const EXPEDITEUR = 'Anne VIAL-TISSOT <anne@annevialtissot.fr>';

export interface Email {
  /** Destinataire réel (prospect ou boîte d'Anne), remplacé par la boîte de test si `test`. */
  a: string;
  objet: string;
  texte: string;
  /** Version HTML à la charte (story 10.9) ; la version texte part toujours avec elle. */
  html?: string;
  repondreA?: string;
  test: boolean;
  /** En-têtes ajoutés (désabonnement en un clic de la séquence, story 10.5). */
  entetes?: Record<string, string>;
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
    ...(e.html ? {
      html: e.test ? e.html.replace(/(<body[^>]*>)/, `$1<p style="margin:0;padding:8px;background:#E9E0D2;font:13px Arial,sans-serif;color:#26201A;text-align:center;">E-mail de test : en production, il serait parti vers ${e.a}.</p>`) : e.html,
      attachments: [{ filename: 'logo.png', content: LOGO_BASE64, content_type: 'image/png', content_id: CID_LOGO }],
    } : {}),
    ...(e.repondreA ? { reply_to: e.repondreA } : {}),
    ...(e.entetes ? { headers: e.entetes } : {}),
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
