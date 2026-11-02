// Îlot de la barre « Nouveaux » (story 18.11, FR-27, AD-34), sur la page Contacts, au-dessus de la recherche. Repliée,
// elle donne le nombre de demandes à voir et leurs sources ; un clic la déroule en cartes (maquette `ux-espace-anne`).
// Chaque geste part par /api/nouveaux ; la carte sort tout de suite et le message du bas propose « Annuler », qui la fait
// revenir (/api/nouveaux { annuler }). « Ranger » ouvre la fiche du contact (story 18.7) ; « Ajouter aux contacts » ouvre
// la fenêtre de création préremplie. La ligne du contact touché revient dans le tableau sans recharger. Tout texte venu
// des données passe par `esc` avant d'entrer dans le HTML.
import { telLisible } from '@site/server/recherche';
import type { Prerempli, Reponse } from './fiche-contact';
import type { CarteNouveau, Geste } from '../server/nouveaux';
import type { LigneTableau } from '../server/tableau-colonnes';

interface Reglages {
  fiches: { ouvrirFiche: (id: string) => Promise<void>; ouvrirCreation: (pre?: Prerempli | null) => void };
  surLigne: (l: LigneTableau) => void;
  retirer: (id: string) => void;
  montrer: (texte: string, annuler?: (() => void) | null) => void;
}
type ReponseNouveaux = Reponse & { message?: string; contact_id?: string; supprime?: string; total?: number; cartes?: CarteNouveau[] };

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const LIBELLES: Record<Geste, string> = {
  ranger: 'Ranger', vu: 'Vu', ecarter: 'Écarter', ajouter: 'Ajouter aux contacts', rattacher: 'Ajouter à sa fiche', ignorer: 'Ignorer',
};
const PRINCIPAL: Geste[] = ['ranger', 'ajouter', 'rattacher'];
const JOUR = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' });
function quand(iso: string): string {
  const t = Date.parse(iso);
  const heure = new Date(t).toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).replace(':', ' h ');
  if (JOUR.format(t) === JOUR.format(Date.now())) return `aujourd'hui ${heure}`;
  if (JOUR.format(t) === JOUR.format(Date.now() - 86_400_000)) return `hier ${heure}`;
  return `${new Date(t).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short' })} ${heure}`;
}

async function envoyer(corps: unknown, methode: 'GET' | 'POST' = 'POST'): Promise<ReponseNouveaux> {
  try {
    const r = await fetch('/api/nouveaux', methode === 'GET' ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corps) });
    const d = await r.json().catch(() => ({}));
    return { ...d, ok: r.ok && d.ok !== false, status: r.status, error: d.error ?? (r.ok ? undefined : { code: 'http', message: `Erreur ${r.status}` }) };
  } catch { return { ok: false, status: 0, error: { code: 'reseau', message: 'Pas de connexion : réessayez.' } }; }
}

export function brancherNouveaux(r: Reglages) {
  const zone = document.querySelector<HTMLElement>('[data-nouveaux]')!;
  const barre = zone.querySelector<HTMLButtonElement>('[data-nv-barre]')!;
  const compte = zone.querySelector<HTMLElement>('[data-nv-compte]')!;
  const sources = zone.querySelector<HTMLElement>('[data-nv-src]')!;
  const liste = zone.querySelector<HTMLElement>('[data-nv-liste]')!;
  const depart = JSON.parse(document.getElementById('nv-donnees')?.textContent || '{"total":0,"cartes":[]}') as { total: number; cartes: CarteNouveau[] };
  let cartes = depart.cartes;
  let total = depart.total;
  let ouvert = false;
  let occupe = false;

  function carteHtml(c: CarteNouveau): string {
    const coord = [c.telephone ? telLisible(c.telephone) : '', c.email ?? ''].filter(Boolean).join(' · ');
    const nom = c.nom ?? (c.source === 'leedflow' ? 'Numéro inconnu' : 'Sans nom');
    return `<article class="nv-carte" data-nv-carte="${esc(c.id)}" data-source="${esc(c.source)}">
      <div class="nv-tete"><span class="nv-badge" data-s="${esc(c.source)}">${esc(c.origine)}</span><span>${esc(c.titre)} · ${esc(quand(c.recu_le))}</span></div>
      <div class="nv-nom">${esc(nom)}${coord ? ` <span class="nv-coord">${esc(coord)}</span>` : ''}</div>
      ${c.annonce ? `<div class="nv-info">Annonce : ${esc(c.annonce)}</div>` : ''}
      ${c.texte ? `<p class="nv-txt">${esc(c.texte)}</p>` : ''}
      ${c.echanges > 1 ? `<div class="nv-info">${c.echanges} échanges vus par Leedflow</div>` : ''}
      ${c.contact_id ? `<div class="nv-auto">${c.ecarte ? 'Contact écarté' : 'Contact créé automatiquement, à ranger'}</div>` : ''}
      ${c.connu ? `<div class="nv-dej">Déjà dans les contacts : <b>${esc(c.connu.nom)}</b>${c.connu.categorie ? ` (${esc(c.connu.categorie)})` : ''}</div>` : ''}
      <div class="nv-btns">${c.gestes.map((g) => `<button type="button" class="ct-btn${PRINCIPAL.includes(g) ? ' bleu' : ''}" data-nv-geste="${g}">${esc(LIBELLES[g])}</button>`).join('')}</div>
    </article>`;
  }

  function rendre() {
    const vide = total === 0;
    compte.textContent = String(total);
    barre.classList.toggle('vide', vide);
    barre.setAttribute('aria-expanded', String(ouvert && !vide));
    barre.querySelector('.nv-chev')!.textContent = ouvert ? '▴' : '▾';
    const noms = [...new Set(cartes.map((c) => c.origine))];
    sources.textContent = vide ? 'Aucune nouvelle demande' : noms.join(', ');
    liste.hidden = !ouvert || vide;
    if (!liste.hidden) {
      liste.innerHTML = cartes.map(carteHtml).join('')
        + (total > cartes.length ? `<p class="nv-vide">${total - cartes.length} autre(s) demande(s), plus anciennes : elles s'afficheront quand celles-ci seront traitées.</p>` : '');
    }
  }

  async function recharger() {
    const x = await envoyer(null, 'GET');
    if (x.ok && x.cartes) { cartes = x.cartes; total = x.total ?? x.cartes.length; rendre(); }
  }

  /** Après un geste réussi : la carte sort, la ligne du contact suit, « Annuler » est proposé. */
  function apres(c: CarteNouveau, x: ReponseNouveaux) {
    cartes = cartes.filter((k) => k.id !== c.id);
    total = Math.max(0, total - 1);
    rendre();
    if (x.ligne) r.surLigne(x.ligne);
    r.montrer(x.message ?? 'Fait', async () => {
      const a = await envoyer({ annuler: c.id });
      if (!a.ok) { r.montrer(a.error?.message ?? 'Erreur'); return; }
      if (a.ligne) r.surLigne(a.ligne);
      if (a.supprime) r.retirer(a.supprime);
      await recharger();
      r.montrer(a.message ?? 'Geste annulé');
    });
  }

  barre.addEventListener('click', () => { if (total === 0) return; ouvert = !ouvert; rendre(); });
  liste.addEventListener('click', async (e) => {
    const b = (e.target as Element).closest<HTMLButtonElement>('[data-nv-geste]');
    const el = b?.closest<HTMLElement>('[data-nv-carte]');
    const c = el ? cartes.find((k) => k.id === el.dataset.nvCarte) : undefined;
    if (!b || !c || occupe) return;
    const geste = b.dataset.nvGeste as Geste;
    if (geste === 'ajouter') {
      r.fiches.ouvrirCreation({
        valeurs: { prenom: c.prerempli?.prenom ?? null, nom: c.prerempli?.nom ?? null, email: c.prerempli?.email ?? null, telephone: c.telephone ? telLisible(c.telephone) : null, categorie_id: 'demandes_recues' },
        envoyer: async (saisie) => {
          const x = await envoyer({ id: c.id, geste, saisie });
          if (x.ok) apres(c, x);
          return x;
        },
      });
      return;
    }
    occupe = true;
    el!.querySelectorAll('button').forEach((k) => { k.disabled = true; });
    const x = await envoyer({ id: c.id, geste });
    occupe = false;
    if (!x.ok) {
      el!.querySelectorAll('button').forEach((k) => { k.disabled = false; });
      r.montrer(x.error?.message ?? 'Erreur');
      if (x.error?.code === 'traitee' || x.error?.code === 'disparue') await recharger();
      return;
    }
    apres(c, x);
    if (geste === 'ranger' && x.contact_id) void r.fiches.ouvrirFiche(x.contact_id);
  });
  rendre();
}
