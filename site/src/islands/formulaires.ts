// Îlot formulaires — raison : validation côté client (formats AD-6), états erreur / envoi / confirmation / échec,
// puis envoi réel au serveur (story 10.3) : POST /api/<source> (contact, estimation, guide), qui vérifie, écrit en base
// et prévient Anne (AD-4, AD-7). Chaque formulaire porte une clé d'idempotence (ULID) gardée tant qu'il n'est pas parti :
// « Renvoyer » après un échec ne crée jamais deux demandes. Le script anti-robot Turnstile n'est chargé qu'au premier
// envoi, jamais à l'ouverture de la page (AD-11).

type Champ = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Reponse = { ok: true } | { ok: false; error: { code: string; message?: string } };

export function telephoneValide(v: string) {
  const chiffres = v.replace(/\D/g, '');
  if (v.trim().startsWith('+')) return chiffres.length >= 10 && chiffres.length <= 13;
  return chiffres.length === 10;
}
export const emailValide = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function messageDe(c: Champ): string | null {
  const v = c.value ?? '';
  const requis = c.required;
  if (c instanceof HTMLInputElement && c.type === 'checkbox') return requis && !c.checked ? (c.dataset.message ?? 'Nécessaire pour envoyer.') : null;
  if (requis && !v.trim()) return c.dataset.erreur ?? 'Ce champ est nécessaire.';
  if (!v.trim()) return null;
  if (c instanceof HTMLInputElement && c.type === 'email' && !emailValide(v)) return 'Cette adresse ne semble pas complète.';
  if (c instanceof HTMLInputElement && c.type === 'tel' && !telephoneValide(v)) return 'Dix chiffres attendus.';
  return null;
}

function afficher(c: Champ, msg: string | null) {
  if (c instanceof HTMLInputElement && c.type === 'checkbox') {
    const cadre = c.closest('[data-case]');
    const zone = cadre?.querySelector<HTMLElement>('[data-case-message]');
    if (zone) { zone.textContent = msg ?? ''; zone.hidden = !msg; }
    cadre?.toggleAttribute('data-invalide', !!msg);
    c.setAttribute('aria-invalid', String(!!msg));
    return;
  }
  const zone = document.getElementById(c.getAttribute('aria-describedby') ?? '');
  if (zone) zone.textContent = msg ?? '';
  if (msg) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid');
}

export function valider(form: HTMLFormElement): boolean {
  let premier: Champ | null = null as Champ | null;
  let n = 0;
  form.querySelectorAll<Champ>('input, select, textarea').forEach((c) => {
    if (c.type === 'hidden' || c.type === 'radio') return;
    const m = messageDe(c);
    afficher(c, m);
    if (m) { n++; premier ??= c; }
  });
  const global = form.querySelector<HTMLElement>('[data-erreurs-globales]');
  if (global) { global.hidden = n === 0; global.textContent = n === 1 ? 'Un champ à corriger avant d’envoyer.' : `${n} champs à corriger avant d’envoyer.`; }
  if (premier) (premier as Champ).focus();
  return n === 0;
}

/** Envoi simulé, encore utilisé par le diagnostic et sa page de résultats : résout après 700 ms.
 * TODO(backend) : remplacé par POST /api/diagnostic à la story 10.4. */
export function envoyerSimule(source: string, donnees: Record<string, unknown>): Promise<Reponse> {
  console.info(`[TODO backend] lead source=${source}`, donnees);
  return new Promise((ok) => setTimeout(() => ok({ ok: true }), 700));
}

// Identifiant ULID (26 caractères, triable par date) : la clé d'idempotence d'un envoi.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export function ulid(): string {
  let temps = '';
  for (let t = Date.now(), i = 0; i < 10; i++, t = Math.floor(t / 32)) temps = ALPHABET[t % 32] + temps;
  return temps + Array.from(crypto.getRandomValues(new Uint8Array(16)), (o) => ALPHABET[o % 32]).join('');
}

// Turnstile (Cloudflare) : vérifie sans case à cocher que l'envoi vient d'un humain. Clé publique du widget `site-anne` ;
// PUBLIC_TURNSTILE_SITE_KEY la remplace pour les essais en local (clé d'essai de Cloudflare, voir site/README.md).
const CLE_TURNSTILE = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAFObEZB3ELjZO2n_';
type Turnstile = {
  render: (el: HTMLElement, o: Record<string, unknown>) => string;
  execute: (id: string) => void;
  remove: (id: string) => void;
};
let chargement: Promise<Turnstile> | null = null;
function chargerTurnstile(): Promise<Turnstile> {
  chargement ??= new Promise<Turnstile>((ok, ko) => {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => ((window as unknown as { turnstile?: Turnstile }).turnstile ? ok((window as unknown as { turnstile: Turnstile }).turnstile) : ko(new Error('turnstile')));
    s.onerror = () => { chargement = null; ko(new Error('turnstile')); };
    document.head.append(s);
  });
  return chargement;
}

/** Un jeton Turnstile neuf (il ne sert qu'une fois) pour ce formulaire. */
async function jetonTurnstile(form: HTMLFormElement): Promise<string> {
  const ts = await chargerTurnstile();
  let zone = form.querySelector<HTMLElement>('[data-turnstile]');
  if (!zone) {
    zone = document.createElement('div');
    zone.dataset.turnstile = '';
    zone.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; // hors du flux : la mise en page ne bouge pas
    form.append(zone);
  }
  return new Promise<string>((ok, ko) => {
    const delai = setTimeout(() => ko(new Error('turnstile délai')), 20000);
    const fin = (f: () => void) => { clearTimeout(delai); f(); };
    const options = {
      sitekey: CLE_TURNSTILE,
      execution: 'execute',
      appearance: 'interaction-only',
      callback: (jeton: string) => fin(() => ok(jeton)),
      'error-callback': () => fin(() => ko(new Error('turnstile erreur'))),
      'timeout-callback': () => fin(() => ko(new Error('turnstile expiré'))),
    };
    // Un jeton ne sert qu'une fois : pour un renvoi, on retire l'ancien widget et on en crée un neuf.
    if (zone.dataset.widget) ts.remove(zone.dataset.widget);
    zone.dataset.widget = ts.render(zone, options);
    ts.execute(zone.dataset.widget);
  });
}

function utm(): Record<string, string> {
  const p = new URLSearchParams(location.search);
  return Object.fromEntries([...p.entries()].filter(([k]) => k.startsWith('utm_')));
}

/** Envoi réel : jeton Turnstile, puis POST vers /api/<source>. Toute panne (réseau, anti-robot, base) = échec affiché. */
export async function envoyer(form: HTMLFormElement, source: string, donnees: Record<string, unknown>): Promise<Reponse> {
  try {
    const turnstile = await jetonTurnstile(form);
    const r = await fetch(`/api/${source}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...donnees, submission_id: form.dataset.submission, lang: document.documentElement.lang.slice(0, 2), utm: utm(), turnstile }),
    });
    return (await r.json()) as Reponse;
  } catch {
    return { ok: false, error: { code: 'RESEAU' } };
  }
}

function brancher(form: HTMLFormElement) {
  const source = form.dataset.formulaire!;
  const bouton = form.querySelector<HTMLButtonElement>('[type="submit"]');
  const libelle = bouton?.textContent ?? '';
  const confirmation = document.querySelector<HTMLElement>(`[data-confirmation="${source}"]`);
  const echec = form.querySelector<HTMLElement>('[data-echec]');
  form.noValidate = true;
  form.dataset.submission = ulid();
  form.querySelectorAll<Champ>('input, select, textarea').forEach((c) => c.addEventListener('input', () => { if (c.getAttribute('aria-invalid') === 'true' || c.closest('[data-invalide]')) afficher(c, messageDe(c)); }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (echec) echec.hidden = true;
    if (!valider(form)) return;
    const donnees = Object.fromEntries(new FormData(form).entries());
    form.setAttribute('data-envoi', '1');
    if (bouton) { bouton.setAttribute('aria-busy', 'true'); bouton.disabled = true; bouton.textContent = 'Envoi en cours…'; }
    form.querySelectorAll<Champ>('input, select, textarea').forEach((c) => { if ('readOnly' in c) c.readOnly = true; });
    const res = await envoyer(form, source, donnees);
    form.removeAttribute('data-envoi');
    if (bouton) { bouton.removeAttribute('aria-busy'); bouton.disabled = false; bouton.textContent = libelle; }
    form.querySelectorAll<Champ>('input, select, textarea').forEach((c) => { if ('readOnly' in c) c.readOnly = false; });
    if (res.ok) {
      form.dataset.submission = ulid();
      form.dispatchEvent(new CustomEvent('avt:envoye', { detail: donnees, bubbles: true }));
      if (confirmation) {
        confirmation.querySelectorAll<HTMLElement>('[data-champ]').forEach((el) => { el.textContent = String(donnees[el.dataset.champ!] ?? ''); });
        confirmation.hidden = false;
        form.hidden = true;
        confirmation.setAttribute('tabindex', '-1');
        confirmation.focus();
        confirmation.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    } else {
      if (echec) { echec.hidden = false; echec.focus?.(); }
      if (bouton) bouton.textContent = 'Renvoyer';
    }
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-formulaire]').forEach(brancher);
