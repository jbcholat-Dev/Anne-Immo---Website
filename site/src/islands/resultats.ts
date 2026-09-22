// Îlot résultats — raison : rendu de la page de résultats depuis sessionStorage (v1 sans serveur), états guide envoyé / séquence confirmée / lien expiré.
// TODO(backend, AD-5) : cette page devient une route serveur liée à un jeton ; l'îlot disparaît.
import feedbacks from '../content/diagnostic/feedbacks.json';
import contenu from '../content/diagnostic/questions.json';
import type { Resultat } from '../lib/scoring';
import { envoyer } from './formulaires';

type Stocke = Resultat & { prenom: string; email: string; newsletter: boolean; at: number };
const CLE = 'avt.diagnostic.resultat';
const racine = document.querySelector<HTMLElement>('[data-resultats]');
if (racine) {
  const zone = racine.querySelector<HTMLElement>('[data-contenu]')!;
  const expire = racine.querySelector<HTMLElement>('[data-expire]')!;
  let r: Stocke | null = null;
  try { r = JSON.parse(sessionStorage.getItem(CLE) ?? 'null'); } catch { r = null; }
  if (!r || Date.now() - r.at > 24 * 3600 * 1000) {
    expire.hidden = false;
  } else {
    const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
    const cats = contenu.categories as Record<string, { resultat?: string }>;
    const axes = (['preparation', 'visibilite', 'efficacite'] as const).map((k) => ({ k, nom: cats[k].resultat!, ...r!.categories[k], fb: (feedbacks as any)[k][r!.categories[k].bande] as { insight: string; impact: string } }));
    const s = feedbacks.sorties[r.orientation];
    const A = r.orientation === 'A';
    racine.setAttribute('data-ton', r.profil.ton);
    zone.innerHTML = `
      <div class="rs-tete">
        <div><div class="chapeau-muet" style="margin-bottom:10px">Votre score global</div><div class="rs-score"><b>${r.total}</b><span>/ 100</span></div>
          <div class="seulement-mobile"><span class="rs-pastille">${esc(r.profil.libelle)}</span><p class="rs-profil-texte">${esc(r.profil.texte)}</p></div></div>
        <div class="seulement-desktop"><span class="rs-pastille">${esc(r.profil.libelle)}</span><p class="rs-profil-texte">${esc(r.profil.texte)}</p></div>
      </div>
      <div class="rs-resume">${axes.map((a) => `<div><div class="rs-resume-rang"><span>${esc(a.nom)}</span><b>${a.brut} <small>/ ${a.max} · ${a.pourcent} %</small></b></div><div class="rs-barre"><div style="width:${a.pourcent}%"></div></div></div>`).join('')}</div>
      <div class="rs-axes">${axes.map((a) => `<section class="rs-axe"><div><div class="chapeau">${esc(a.nom)}<span class="seulement-mobile"> · ${a.brut} / ${a.max}</span></div><div class="rs-sous"><b>${a.brut}</b><span>/ ${a.max} · ${a.pourcent} %</span></div><div class="rs-barre"><div style="width:${a.pourcent}%"></div></div></div>
        <p class="rs-insight">${esc(a.fb.insight)}</p><div class="rs-impact"><div class="chapeau-muet">Impact chiffré</div><p>${esc(a.fb.impact)}</p></div></section>`).join('')}</div>
      <div class="rs-sortie"><div><h2>${esc(s.titre)}</h2><p class="seulement-desktop">${esc(s.texte)}</p><p class="seulement-mobile">${esc((s as any).texte_court ?? s.texte)}</p></div>
        <div class="rs-sortie-boutons">${A
          ? `<a href="/contact#reserver" class="btn btn-ecru">${esc(s.cta)}</a><a href="/contact#ecrire" class="btn btn-contour-ecru">${esc((s as any).cta2)}</a>`
          : `<button type="button" class="btn btn-ecru" data-guide>${esc(s.cta)}</button>`}</div></div>
      ${A
        ? `<div class="rs-guide"><div class="rs-guide-int"><div class="rs-guide-couv"></div><div><div class="rs-guide-titre">Les 10 erreurs fatales des vendeurs particuliers</div><div class="rs-guide-sous">Guide PDF, à la charte · A-10</div></div></div><button type="button" class="btn btn-secondaire btn-m" data-guide>Télécharger le guide</button></div>`
        : `<div class="rs-sequence"><p>${esc((s as any).sequence)}</p><button type="button" class="btn btn-secondaire btn-m" data-sequence ${r.newsletter ? 'hidden' : ''}>${esc((s as any).sequence_cta)}</button><span data-sequence-deja ${r.newsletter ? '' : 'hidden'} class="texte-muet" style="font-size:14px">Séquence de 7 e-mails confirmée à l'inscription.</span></div>`}
      <div class="rs-etats" data-etats hidden>
        <div class="rs-etat-guide" data-etat-guide hidden><div class="rs-guide-couv"></div><div><b>Le guide est parti</b><p>Vérifiez ${esc(r.email)}. Le lien de téléchargement est valable 48 heures.</p><a href="/guide" class="lien" style="font-size:14px;display:inline-block;margin-top:8px">Renvoyer le lien</a></div></div>
        <div class="rs-etat-sequence" data-etat-sequence hidden>Séquence de 7 e-mails confirmée. Le premier arrive demain matin. <a href="/confidentialite">Se désinscrire</a> à tout moment.</div>
      </div>`;
    const etats = zone.querySelector<HTMLElement>('[data-etats]')!;
    zone.querySelectorAll<HTMLButtonElement>('[data-guide]').forEach((b) => b.addEventListener('click', async () => {
      b.disabled = true; b.setAttribute('aria-busy', 'true'); const t = b.textContent; b.textContent = 'Envoi en cours…';
      await envoyer('guide', { email: r!.email, band: r!.profil.id }); // TODO(backend) : lien signé, e-mail Resend (AD-8)
      b.disabled = false; b.removeAttribute('aria-busy'); b.textContent = t;
      etats.hidden = false; zone.querySelector<HTMLElement>('[data-etat-guide]')!.hidden = false; etats.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }));
    zone.querySelector<HTMLButtonElement>('[data-sequence]')?.addEventListener('click', async (ev) => {
      const b = ev.currentTarget as HTMLButtonElement;
      b.disabled = true; b.setAttribute('aria-busy', 'true');
      await envoyer('newsletter', { email: r!.email }); // TODO(backend) : newsletter_opt_in_at (AD-6, AD-16)
      b.hidden = true; zone.querySelector<HTMLElement>('[data-sequence-deja]')!.hidden = false;
      etats.hidden = false; zone.querySelector<HTMLElement>('[data-etat-sequence]')!.hidden = false; etats.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
}
