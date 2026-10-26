// Comptage anonyme de l'entonnoir du diagnostic (story 10.12, AD-11). Chaque page tire un numéro de passage au hasard
// (sans horodatage, contrairement à un ULID),
// gardé en mémoire de la page seulement (jamais dans le navigateur : ni cookie, ni stockage local), et l'envoie avec
// l'étape atteinte et les paramètres de campagne (utm_*) de l'adresse. Rien d'autre : ni réponse, ni coordonnées.
// L'envoi passe par sendBeacon, qui part même si la page change juste après (redirection vers les résultats).

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const parcours = Array.from(crypto.getRandomValues(new Uint8Array(26)), (o) => ALPHABET[o % 32]).join('');
let utm: Record<string, string> = {};
new URLSearchParams(location.search).forEach((v, k) => { if (k.startsWith('utm_')) utm[k] = v; });
const lang = document.documentElement.lang === 'en' ? 'en' : 'fr';

/** Reprise d'un parcours interrompu : la campagne est celle du premier passage, gardée avec les réponses sur l'appareil
 * (rien de nouveau n'est déposé), même si le lien de retour n'a plus ses paramètres. */
export function fixerCampagne(u: Record<string, string> | undefined) {
  if (u && Object.keys(u).length) utm = u;
}

export function compter(etape: 'arrivee' | 'reprise' | 'ecran' | 'coordonnees' | 'envoi' | 'echec' | 'resultat', ecran?: string) {
  const corps = JSON.stringify({ parcours, etape, ecran, utm, lang });
  try {
    if (navigator.sendBeacon?.('/api/entonnoir', new Blob([corps], { type: 'text/plain' }))) return;
    void fetch('/api/entonnoir', { method: 'POST', body: corps, headers: { 'Content-Type': 'text/plain' }, keepalive: true }).catch(() => {});
  } catch { /* le comptage ne doit jamais gêner le parcours */ }
}
