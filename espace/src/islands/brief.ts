// Brief du jour (story 18.26) : les trois boutons de chaque ligne, l'annulation, et « Préparer maintenant ».
// Tout passe par /api/brief ; la page ne change que la ligne touchée. « Accepter » ouvre ensuite la fiche ou la carte.
type Reponse = { ok: boolean; message?: string; lien?: string; error?: { message: string } };
const ETATS: Record<string, string> = { accepte: 'Acceptée', plus_tard: 'Remise à demain', ecarte: 'Écartée pour 7 jours' };

async function envoyer(corps: unknown): Promise<Reponse> {
  try {
    const r = await fetch('/api/brief', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    return (await r.json()) as Reponse;
  } catch { return { ok: false, error: { message: 'Pas de réseau : rien n\'a été noté.' } }; }
}

export function brancherBrief() {
  const zone = document.querySelector<HTMLElement>('[data-brief]');
  if (!zone) return;
  const info = zone.querySelector<HTMLElement>('[data-brief-info]');
  const dire = (t: string) => { if (info) info.textContent = t; };
  zone.addEventListener('click', async (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('button[data-brief-geste], button[data-brief-annuler], button[data-brief-preparer]');
    if (!b || b.disabled) return;
    b.disabled = true;
    if (b.hasAttribute('data-brief-preparer')) {
      const r = await envoyer({ preparer: true });
      dire(r.ok ? r.message ?? '' : r.error?.message ?? 'Erreur');
      if (r.ok) location.reload(); else b.disabled = false;
      return;
    }
    const ligne = b.closest<HTMLElement>('[data-brief-ligne]')!;
    const id = ligne.dataset.briefLigne!;
    const decision = b.dataset.briefGeste;
    const r = decision ? await envoyer({ id, decision }) : await envoyer({ annuler: id });
    b.disabled = false;
    if (!r.ok) { dire(r.error?.message ?? 'Erreur'); return; }
    ligne.dataset.decision = decision ?? '';
    const etat = ligne.querySelector<HTMLElement>('[data-brief-etat]')!;
    etat.textContent = decision ? ETATS[decision] : '';
    ligne.querySelectorAll<HTMLElement>('[data-brief-geste]').forEach((x) => { x.hidden = !!decision; });
    ligne.querySelector<HTMLElement>('[data-brief-annuler]')!.hidden = !decision;
    dire(r.message ?? '');
    if (decision === 'accepte' && r.lien && /^\/(?![\/\\])/.test(r.lien)) location.assign(r.lien);
  });
  // Lien « /?nouveaux=1 » d'une ligne d'appel : la barre « Nouveaux » s'ouvre.
  if (new URLSearchParams(location.search).get('nouveaux') === '1') document.querySelector<HTMLButtonElement>('[data-nv-barre]')?.click();
}
