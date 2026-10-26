// Comptage anonyme de l'entonnoir du diagnostic (story 10.12, AD-11). Chaque page tire un numéro de passage au hasard,
// gardé en mémoire de la page seulement (jamais dans le navigateur : ni cookie, ni stockage local), et l'envoie avec
// l'étape atteinte et les paramètres de campagne (utm_*) de l'adresse. Rien d'autre : ni réponse, ni coordonnées.
// L'envoi passe par sendBeacon, qui part même si la page change juste après (redirection vers les résultats).
import { ulid } from '../server/ulid'; // sans effet de bord : la page d'arrivée ne charge pas l'îlot des formulaires

const parcours = ulid();
const utm: Record<string, string> = {};
new URLSearchParams(location.search).forEach((v, k) => { if (k.startsWith('utm_')) utm[k] = v; });
const lang = document.documentElement.lang === 'en' ? 'en' : 'fr';

export function compter(etape: 'arrivee' | 'reprise' | 'ecran' | 'coordonnees' | 'envoi' | 'echec' | 'resultat', ecran?: string) {
  const corps = JSON.stringify({ parcours, etape, ecran, utm, lang });
  try {
    if (navigator.sendBeacon?.('/api/entonnoir', new Blob([corps], { type: 'text/plain' }))) return;
    void fetch('/api/entonnoir', { method: 'POST', body: corps, headers: { 'Content-Type': 'text/plain' }, keepalive: true }).catch(() => {});
  } catch { /* le comptage ne doit jamais gêner le parcours */ }
}
