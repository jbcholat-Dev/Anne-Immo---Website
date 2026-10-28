// Comptage anonyme de l'entonnoir du diagnostic (story 10.12, AD-11). Chaque page tire un numéro de passage au hasard
// (sans horodatage, contrairement à un ULID),
// gardé en mémoire de la page seulement (jamais dans le navigateur : ni cookie, ni stockage local), et l'envoie avec
// l'étape atteinte et les paramètres de campagne (utm_*) de l'adresse. Rien d'autre : ni réponse, ni coordonnées.
// L'envoi passe par sendBeacon, qui part même si la page change juste après (redirection vers les résultats).
// Story 10.13 : sur la question 1, le temps mis à l'afficher, en paliers (le serveur ajoute le type de navigateur et
// d'appareil, lus dans l'en-tête que tout navigateur envoie).

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

/** Palier du temps d'affichage de la page, mesuré depuis le début de son chargement ; « cachee » si elle n'est pas à
 * l'écran à ce moment (préchargée par l'application avant le clic, ou ouverte en arrière-plan). */
export function palierAffichage(): 'moins-2s' | '2-5s' | 'plus-5s' | 'cachee' {
  if (document.visibilityState !== 'visible') return 'cachee';
  const ms = performance.now();
  return ms < 2000 ? 'moins-2s' : ms <= 5000 ? '2-5s' : 'plus-5s';
}

export function compter(etape: 'arrivee' | 'reprise' | 'ecran' | 'interaction' | 'coordonnees' | 'envoi' | 'echec' | 'resultat', ecran?: string, affichage?: string) {
  const corps = JSON.stringify({ parcours, etape, ecran, affichage, utm, lang });
  try {
    if (navigator.sendBeacon?.('/api/entonnoir', new Blob([corps], { type: 'text/plain' }))) return;
    void fetch('/api/entonnoir', { method: 'POST', body: corps, headers: { 'Content-Type': 'text/plain' }, keepalive: true }).catch(() => {});
  } catch { /* le comptage ne doit jamais gêner le parcours */ }
}
