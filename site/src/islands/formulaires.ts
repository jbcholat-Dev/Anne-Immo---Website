// Îlot formulaires — raison : validation côté client (formats AD-6), états erreur / envoi / confirmation / échec,
// soumission SIMULÉE en v1 (aucun backend). TODO(backend) : remplacer `envoyer()` par un POST vers /api/<source> (AD-4, AD-7 :
// Turnstile, champ piège, clé d'idempotence ULID, écriture D1 avant diffusion). Test de l'échec : ajouter ?simuler=echec à l'URL.

type Champ = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
const ECHEC = new URLSearchParams(location.search).get('simuler') === 'echec';

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

/** Envoi simulé : résout après 700 ms, échoue si ?simuler=echec. TODO(backend). */
export function envoyer(source: string, donnees: Record<string, unknown>): Promise<{ ok: true } | { ok: false; error: { code: string } }> {
  console.info(`[TODO backend] lead source=${source}`, donnees);
  return new Promise((ok) => setTimeout(() => ok(ECHEC ? { ok: false, error: { code: 'SIMULATION_ECHEC' } } : { ok: true }), 700));
}

function brancher(form: HTMLFormElement) {
  const source = form.dataset.formulaire!;
  const bouton = form.querySelector<HTMLButtonElement>('[type="submit"]');
  const libelle = bouton?.textContent ?? '';
  const confirmation = document.querySelector<HTMLElement>(`[data-confirmation="${source}"]`);
  const echec = form.querySelector<HTMLElement>('[data-echec]');
  form.noValidate = true;
  form.querySelectorAll<Champ>('input, select, textarea').forEach((c) => c.addEventListener('input', () => { if (c.getAttribute('aria-invalid') === 'true' || c.closest('[data-invalide]')) afficher(c, messageDe(c)); }));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (echec) echec.hidden = true;
    if (!valider(form)) return;
    const donnees = Object.fromEntries(new FormData(form).entries());
    form.setAttribute('data-envoi', '1');
    if (bouton) { bouton.setAttribute('aria-busy', 'true'); bouton.disabled = true; bouton.textContent = 'Envoi en cours…'; }
    form.querySelectorAll<Champ>('input, select, textarea').forEach((c) => { if ('readOnly' in c) c.readOnly = true; });
    const res = await envoyer(source, donnees);
    form.removeAttribute('data-envoi');
    if (bouton) { bouton.removeAttribute('aria-busy'); bouton.disabled = false; bouton.textContent = libelle; }
    form.querySelectorAll<Champ>('input, select, textarea').forEach((c) => { if ('readOnly' in c) c.readOnly = false; });
    if (res.ok) {
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
