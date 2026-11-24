// Brief du jour (story 18.26) : les trois boutons de chaque ligne, l'annulation, et « Préparer maintenant ».
// Tout passe par /api/brief ; la page ne change que la ligne touchée. « Accepter » ouvre ensuite la fiche ou la carte.
// Story 18.29 (retour de JB) : une ligne décidée disparaît ; « Annuler » reste un instant sous le brief pour la faire revenir.
// Tout décidé, seul « Annuler » reste jusqu'au rechargement, puis le brief n'est plus affiché.
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
  const dire = (t: string, annulerId?: string, qui?: string) => {
    if (!info) return;
    info.textContent = qui ? `${qui} : ${t.charAt(0).toLowerCase()}${t.slice(1)}.` : t;
    if (annulerId) {
      const a = document.createElement('button');
      a.type = 'button'; a.className = 'ct-btn'; a.textContent = 'Annuler';
      a.setAttribute('data-brief-annuler', ''); a.dataset.pour = annulerId;
      info.append(a);
    }
  };
  const titre = zone.querySelector<HTMLElement>('[data-brief-titre]');
  const compter = () => {
    const n = zone.querySelectorAll('[data-brief-ligne][data-decision=""]').length;
    if (titre && n) titre.textContent = `${n} décision${n > 1 ? 's' : ''} à prendre`;
    zone.toggleAttribute('data-tout-decide', n === 0);
  };
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
    const pour = b.dataset.pour;
    const ligne = pour ? zone.querySelector<HTMLElement>(`[data-brief-ligne="${CSS.escape(pour)}"]`) : b.closest<HTMLElement>('[data-brief-ligne]');
    if (!ligne) return;
    const id = ligne.dataset.briefLigne!;
    const decision = b.dataset.briefGeste;
    const r = decision ? await envoyer({ id, decision }) : await envoyer({ annuler: id });
    b.disabled = false;
    const qui = ligne.querySelector<HTMLElement>('.br-qui')?.firstChild?.textContent?.trim();
    // Revue 18.29 : une annulation qui échoue garde son bouton « Annuler », sinon la décision ne se défait plus depuis la page.
    if (!r.ok) { dire(r.error?.message ?? 'Erreur', decision ? undefined : id, decision ? undefined : qui); return; }
    ligne.dataset.decision = decision ?? '';
    const etat = ligne.querySelector<HTMLElement>('[data-brief-etat]')!;
    etat.textContent = decision ? ETATS[decision] : '';
    ligne.querySelectorAll<HTMLElement>('[data-brief-geste]').forEach((x) => { x.hidden = !!decision; });
    ligne.querySelector<HTMLElement>('[data-brief-annuler]')!.hidden = !decision;
    compter();
    if (decision) dire(ETATS[decision], id, qui); else dire('');
    // Revue 18.29 : la ligne et son bouton disparaissent ; le curseur clavier va sur « Annuler », ou sur la ligne revenue.
    (decision ? info?.querySelector<HTMLElement>('button[data-brief-annuler]') : ligne.querySelector<HTMLElement>('[data-brief-geste]'))?.focus();
    if (decision === 'accepte' && r.lien && /^\/(?![\/\\])/.test(r.lien)) location.assign(r.lien);
  });
  // Lien « /?nouveaux=1 » d'une ligne d'appel : la barre « Nouveaux » s'ouvre.
  if (new URLSearchParams(location.search).get('nouveaux') === '1') document.querySelector<HTMLButtonElement>('[data-nv-barre]')?.click();
}
