// Îlot diagnostic — raison : les 17 écrans du parcours (état par identifiants qNN, indépendant de la langue), reprise localStorage,
// confirmation d'abandon, gate de capture, puis envoi au serveur et redirection vers la page de résultats (story 10.4).
// Le navigateur ne calcule rien : POST /api/diagnostic (réponses par identifiants + coordonnées + journey_id + utm + submission_id),
// le serveur calcule le score et renvoie l'adresse des résultats, liée à un jeton (AD-5). Les réponses restent sur l'appareil
// jusqu'au succès ; « Renvoyer » réutilise la même clé submission_id (AD-4).
// Story 10.12 : chaque écran atteint, l'écran des coordonnées, l'envoi et son issue sont comptés sans donnée personnelle
// (îlot entonnoir), pour savoir où les visiteurs s'arrêtent. Story 10.15 : prénom et e-mail avant la question 1 (étape
// « coordonnees », précision « entree »), téléphone à la fin, plus de nom de famille. Story 10.16 : le téléphone redevient
// obligatoire (décision de JB du 2026-10-31 : un e-mail seul ne permet pas de qualifier le contact).
import contenu from '../content/diagnostic/questions.json';
import { compter, fixerCampagne, palierAffichage } from './entonnoir';
import { telephoneValide, emailValide, envoyer, ulid } from './formulaires';

type Reponses = Record<string, string[]>;

type Ecran = (typeof contenu.ecrans)[number];
type Etat = { ecran: number; reponses: Reponses; autre: Record<string, string>; texte: string; journey_id: string; utm: Record<string, string>; submission_id?: string };
const CLE = 'avt.diagnostic.v1';
const ECRANS = contenu.ecrans as Ecran[];
const N = ECRANS.length; // 17
const categories = contenu.categories as Record<string, { libelle: string }>;

const racine = document.querySelector<HTMLElement>('[data-diagnostic]');
if (racine) {
  const zone = racine.querySelector<HTMLElement>('[data-ecran]')!;
  const barre = racine.querySelector<HTMLElement>('[data-progression-barre]')!;
  const progression = racine.querySelector<HTMLElement>('.qz-progression')!;
  const repere = document.querySelector<HTMLElement>('[data-repere-question]');
  const dialogue = document.querySelector<HTMLDialogElement>('[data-dialogue-abandon]');

  const utm: Record<string, string> = {};
  new URLSearchParams(location.search).forEach((v, k) => { if (k.startsWith('utm_')) utm[k] = v; });

  const charger = (): Etat | null => { try { return JSON.parse(localStorage.getItem(CLE) ?? 'null'); } catch { return null; } };
  const sauver = () => { try { localStorage.setItem(CLE, JSON.stringify(etat)); } catch { /* stockage indisponible : le parcours continue en mémoire */ } };
  const neuf = (): Etat => ({ ecran: 0, reponses: {}, autre: {}, texte: '', journey_id: ulid(), utm });
  let etat: Etat = neuf();

  const html = (s: TemplateStringsArray, ...v: unknown[]) => s.reduce((a, b, i) => a + b + (v[i] ?? ''), '');
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

  function majProgression(i: number) {
    const e = ECRANS[Math.max(0, Math.min(i, N - 1))]; // -1 : écran d'entrée, avant la question 1
    barre.style.width = `${(Math.max(i + 1, 0) / N) * 100}%`;
    progression.setAttribute('aria-valuenow', String(Math.max(i + 1, 0)));
    if (repere) repere.textContent = i >= 0 && i < N ? `Question ${e.numero} / 15` : '';
  }

  let dejaCompte = ''; // écran déjà compté par le premier passage d'un parcours repris : pas recompté (story 10.12)
  let affiche = ''; // écran à l'écran en ce moment : le premier toucher n'est compté que sur l'écran d'entrée (stories 10.13, 10.15)
  let premierRendu = true; // temps d'affichage mesuré seulement sur le premier écran montré après le chargement (l'écran d'entrée)
  function rendreEcran(i: number) {
    const e = ECRANS[i];
    majProgression(i);
    affiche = e.id;
    if (e.id !== dejaCompte) compter('ecran', e.id);
    dejaCompte = '';
    const cat = categories[e.categorie]?.libelle ?? '';
    const retour = i > 0 ? html`<button type="button" class="qz-retour" data-retour>← Retour</button>` : '';
    let corps = '';
    if (e.type === 'unique') {
      corps = html`<h1 class="qz-question">${esc(e.question)}</h1>
        <div role="radiogroup" class="qz-options" aria-label="${esc(e.question)}">
          ${e.options!.map((o) => html`<button type="button" role="radio" aria-checked="${(etat.reponses[e.id] ?? []).includes(o.id)}" class="qz-option" data-option="${o.id}">${esc(o.libelle)}</button>`).join('')}
        </div>
        <div class="qz-note">Choisir une réponse passe à la question suivante.</div>`;
    } else if (e.type === 'multiple') {
      const choisis = etat.reponses[e.id] ?? [];
      corps = html`<h1 class="qz-question qz-question-long">${esc(e.question)}</h1><p class="qz-aide">${esc(e.aide ?? '')}</p>
        <div role="group" class="qz-options qz-options-serre" aria-label="${esc(e.question)}">
          ${e.options!.map((o) => html`<button type="button" role="checkbox" aria-checked="${choisis.includes(o.id)}" class="qz-option" data-option="${o.id}">${esc(o.libelle)}<svg aria-hidden="true"><use href="#ico-coche"></use></svg></button>`).join('')}
          ${e.autre ? html`<input type="text" class="qz-autre" placeholder="${esc(e.autre)}" aria-label="${esc(e.autre)}" data-autre value="${esc(etat.autre[e.id] ?? '')}" />` : ''}
        </div>
        <div class="qz-pied-ecran"><button type="button" class="btn btn-primaire qz-suivant" data-suivant>Suivant</button><span class="qz-note" style="padding:0;text-align:center">${esc(e.note_suivant ?? '')}</span></div>`;
    } else {
      corps = html`<h1 class="qz-question">${esc(e.question)}</h1>
        <label for="q15" class="qz-libelle">${esc(e.aide ?? 'Facultatif')}</label>
        <textarea id="q15" class="qz-texte" rows="7" maxlength="${e.max ?? 1000}" data-texte>${esc(etat.texte)}</textarea>
        <div class="qz-compteur"><span data-compteur>${etat.texte.length}</span> / ${e.max ?? 1000}</div>
        <div class="qz-pied-ecran"><button type="button" class="btn btn-primaire qz-suivant" data-suivant>Suivant</button><button type="button" class="qz-passer lien" style="background:none;border:0" data-passer>Passer</button></div>`;
    }
    zone.innerHTML = html`${retour}${cat ? html`<div class="qz-categorie">${esc(cat)}</div>` : ''}${corps}`;
    zone.querySelector<HTMLElement>('h1')?.setAttribute('tabindex', '-1');
    zone.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });

    zone.querySelector('[data-retour]')?.addEventListener('click', () => aller(i - 1));
    if (e.type === 'unique') {
      zone.querySelectorAll<HTMLButtonElement>('[data-option]').forEach((b) => b.addEventListener('click', () => {
        etat.reponses[e.id] = [b.dataset.option!];
        zone.querySelectorAll('[data-option]').forEach((x) => x.setAttribute('aria-checked', 'false'));
        b.setAttribute('aria-checked', 'true');
        setTimeout(() => aller(i + 1), 160);
      }));
    } else if (e.type === 'multiple') {
      zone.querySelectorAll<HTMLButtonElement>('[data-option]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.option!;
        let sel = new Set(etat.reponses[e.id] ?? []);
        if (id === e.aucune) sel = sel.has(id) ? new Set() : new Set([id]);
        else { sel.delete(e.aucune!); sel.has(id) ? sel.delete(id) : sel.add(id); }
        etat.reponses[e.id] = [...sel];
        zone.querySelectorAll<HTMLElement>('[data-option]').forEach((x) => x.setAttribute('aria-checked', String(sel.has(x.dataset.option!))));
      }));
      zone.querySelector<HTMLInputElement>('[data-autre]')?.addEventListener('input', (ev) => { etat.autre[e.id] = (ev.target as HTMLInputElement).value; });
      zone.querySelector('[data-suivant]')?.addEventListener('click', () => {
        const autre = (etat.autre[e.id] ?? '').trim();
        let sel = (etat.reponses[e.id] ?? []).filter((x) => x !== 'autre');
        if (autre) sel = sel.filter((x) => x !== e.aucune).concat('autre');
        if (!sel.length && e.aucune) sel = [e.aucune];
        etat.reponses[e.id] = sel;
        aller(i + 1);
      });
    } else {
      const ta = zone.querySelector<HTMLTextAreaElement>('[data-texte]')!;
      const cpt = zone.querySelector<HTMLElement>('[data-compteur]')!;
      ta.addEventListener('input', () => { etat.texte = ta.value; cpt.textContent = String(ta.value.length); });
      zone.querySelector('[data-suivant]')?.addEventListener('click', () => { etat.reponses[e.id] = etat.texte.trim() ? ['q15.texte'] : []; aller(N); });
      zone.querySelector('[data-passer]')?.addEventListener('click', () => { etat.texte = ''; etat.reponses[e.id] = []; aller(N); });
    }
  }

  // Story 10.15 : prénom, e-mail et accord demandés avant la question 1 (écran d'entrée), le téléphone seulement à la fin
  // (obligatoire depuis la story 10.16). Les coordonnées restent en mémoire de la page (jamais dans le stockage local, AD-11) : un parcours repris
  // après fermeture redemande l'écran d'entrée. Rien ne part au serveur avant l'envoi final.
  let coord: { prenom: string; email: string; privacy: string } | null = null;
  // Parcours repris : l'écran d'entrée qui suit redemande les coordonnées mais n'est pas un nouveau premier écran ; ni lui ni
  // son premier toucher ne sont comptés (sinon chaque reprise passerait pour un visiteur perdu avant la question 1).
  let repris = false;

  function rendreEntree(cible: number) {
    affiche = 'entree';
    majProgression(-1);
    if (repere) repere.textContent = '';
    if (!repris) compter('coordonnees', 'entree', premierRendu ? palierAffichage() : undefined);
    premierRendu = false;
    zone.innerHTML = html`<div class="qz-gate">
      <div class="qz-gate-tete"><div class="chapeau-muet">15 questions · 3 minutes</div><h1 class="qz-gate-titre">À qui envoyer votre rapport ?</h1>
      <p>Votre score sur 100, le détail par axe et vos recommandations, dans un rapport personnalisé envoyé par e-mail à la fin du questionnaire.</p></div>
      <form data-entree novalidate>
        <label class="champ">Prénom<input type="text" name="prenom" required autocomplete="given-name" aria-describedby="g1" value="${esc(coord?.prenom ?? '')}"><span class="champ-erreur" id="g1"></span></label>
        <label class="champ">E-mail<input type="email" name="email" required autocomplete="email" aria-describedby="g3" value="${esc(coord?.email ?? '')}"><span class="champ-erreur" id="g3"></span></label>
        <label class="case" data-case style="margin-top:6px"><input type="checkbox" name="privacy" required${coord ? ' checked' : ''}><span>J'accepte que mes coordonnées servent à m'envoyer ce diagnostic et à me recontacter. <a href="/confidentialite">Politique de confidentialité</a>.<span class="case-message" data-case-message hidden>Nécessaire pour recevoir le diagnostic.</span></span></label>
        <div class="alerte-douce" data-gate-erreurs hidden role="alert"></div>
        <button type="submit" class="btn btn-primaire" style="min-height:56px;margin-top:8px" data-entree-bouton>${coord ? 'Valider' : 'Commencer'}</button>
        <p class="qz-mention">Finalité : envoi du diagnostic et prise de contact. Conservation 3 ans. Responsable : Anne Vial-Tissot.</p>
      </form></div>`;
    zone.querySelector<HTMLElement>('h1')?.setAttribute('tabindex', '-1');
    zone.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
    const form = zone.querySelector<HTMLFormElement>('[data-entree]')!;
    const erreurs = form.querySelector<HTMLElement>('[data-gate-erreurs]')!;
    const champ = (n: string) => form.querySelector<HTMLInputElement>(`[name="${n}"]`)!;
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      let n = 0;
      n += marquer(form, 'prenom', 'g1', champ('prenom').value.trim() ? null : 'Indiquez votre prénom.');
      n += marquer(form, 'email', 'g3', emailValide(champ('email').value.trim()) ? null : 'Cette adresse ne semble pas complète.');
      n += marquerAccord(form);
      erreurs.hidden = n === 0;
      erreurs.textContent = n === 1 ? 'Un champ à corriger avant de commencer.' : `${n} champs à corriger avant de commencer.`;
      if (n) { form.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(); return; }
      coord = { prenom: champ('prenom').value.trim(), email: champ('email').value.trim(), privacy: 'on' };
      aller(cible);
    });
  }

  /** Message d'erreur d'un champ ; renvoie 1 s'il y en a un. */
  function marquer(form: HTMLElement, n: string, id: string, msg: string | null) {
    const c = form.querySelector<HTMLInputElement>(`[name="${n}"]`)!;
    form.querySelector<HTMLElement>(`#${id}`)!.textContent = msg ?? '';
    if (msg) c.setAttribute('aria-invalid', 'true'); else c.removeAttribute('aria-invalid');
    return msg ? 1 : 0;
  }
  function marquerAccord(form: HTMLElement) {
    const consent = form.querySelector<HTMLInputElement>('[name="privacy"]')!;
    const cadre = consent.closest('[data-case]')!;
    const msg = cadre.querySelector<HTMLElement>('[data-case-message]')!;
    if (consent.checked) { cadre.removeAttribute('data-invalide'); msg.hidden = true; consent.removeAttribute('aria-invalid'); return 0; }
    cadre.setAttribute('data-invalide', '1'); msg.hidden = false; consent.setAttribute('aria-invalid', 'true');
    return 1;
  }

  function rendreGate() {
    affiche = '';
    majProgression(N - 1);
    if (repere) repere.textContent = '';
    etat.submission_id ??= ulid(); // gardée jusqu'au succès : un renvoi ne crée jamais un second lead
    sauver();
    const c = coord!;
    zone.innerHTML = html`<div class="qz-gate">
      <div class="qz-gate-tete"><div class="chapeau-muet">Votre diagnostic est prêt</div><h1 class="qz-gate-titre">Votre score et vos recommandations</h1>
      <p>${esc(c.prenom)}, votre rapport part à <strong>${esc(c.email)}</strong>. <button type="button" style="background:none;border:0;padding:0;font:inherit;color:var(--avt-klein);text-decoration:underline;min-height:44px;cursor:pointer" data-modifier>Modifier</button></p></div>
      <form data-gate novalidate>
        <div class="piege" aria-hidden="true" style="position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden"><label>Site web <input type="text" name="site_web" tabindex="-1" autocomplete="off"></label></div>
        <div class="champ"><label for="tel">Téléphone</label><div class="qz-tel"><select name="indicatif" aria-label="Indicatif"><option value="+33">FR +33</option><option value="+41">CH +41</option></select><input id="tel" type="tel" name="telephone" placeholder="06 12 34 56 78" required autocomplete="tel" inputmode="tel" aria-describedby="g5 g4"></div><span class="qz-mention" id="g5">Votre rapport arrive par e-mail. Votre téléphone permet à Anne de vous rappeler pour en parler.</span><span class="champ-erreur" id="g4"></span></div>
        <label class="case" data-case><input type="checkbox" name="newsletter"><span>Je souhaite recevoir la séquence d'e-mails d'Anne (7 jours, désinscription à tout moment). Facultatif.</span></label>
        <div class="alerte-douce" data-gate-erreurs hidden role="alert"></div>
        <div data-gate-echec hidden><div class="alerte" role="alert" data-gate-echec-texte>L'envoi n'a pas abouti. Vos réponses et vos coordonnées sont conservées : rien à ressaisir.</div></div>
        <button type="submit" class="btn btn-primaire" style="min-height:56px;margin-top:8px" data-gate-bouton>Voir mon diagnostic</button>
      </form></div>`;
    zone.querySelector('[data-modifier]')?.addEventListener('click', () => rendreEntree(N));
    const form = zone.querySelector<HTMLFormElement>('[data-gate]')!;
    const erreurs = form.querySelector<HTMLElement>('[data-gate-erreurs]')!;
    const echec = form.querySelector<HTMLElement>('[data-gate-echec]')!;
    const texteEchec = form.querySelector<HTMLElement>('[data-gate-echec-texte]')!;
    const bouton = form.querySelector<HTMLButtonElement>('[data-gate-bouton]')!;
    const tel = form.querySelector<HTMLInputElement>('[name="telephone"]')!;
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      echec.hidden = true;
      const n = marquer(form, 'telephone', 'g4', !tel.value.trim() ? 'Indiquez votre téléphone.' : telephoneValide(tel.value) ? null : 'Dix chiffres attendus.');
      erreurs.hidden = n === 0;
      erreurs.textContent = 'Un champ à corriger avant d’afficher le diagnostic.';
      if (n) { tel.focus(); return; }
      bouton.setAttribute('aria-busy', 'true'); bouton.disabled = true; bouton.textContent = 'Envoi en cours…';
      compter('envoi');
      const saisie = Object.fromEntries(new FormData(form).entries());
      form.dataset.submission = etat.submission_id;
      const r = await envoyer(form, 'diagnostic', { journey_id: etat.journey_id, utm: etat.utm, reponses: etat.reponses, autre: etat.autre, message: etat.texte.trim(), ...c, ...saisie });
      bouton.removeAttribute('aria-busy'); bouton.disabled = false; bouton.textContent = 'Voir mon diagnostic';
      if (!r.ok || !r.url) {
        compter('echec');
        const champ = r.error?.champ ?? '';
        if (champ === 'telephone') { marquer(form, 'telephone', 'g4', 'Ce numéro ne semble pas valable.'); tel.focus(); }
        // Prénom, e-mail ou accord refusés par le serveur : ils se corrigent sur l'écran d'entrée (« Modifier »).
        const entree = champ === 'prenom' || champ === 'email' || champ === 'privacy';
        texteEchec.textContent = entree ? `${r.error?.message ?? 'Une coordonnée est à corriger.'} Utilisez « Modifier » ci-dessus.` : r.error?.message ?? "L'envoi n'a pas abouti. Vos réponses et vos coordonnées sont conservées : rien à ressaisir.";
        echec.hidden = false; bouton.textContent = 'Renvoyer'; return;
      }
      try { localStorage.removeItem(CLE); } catch { /* ignoré */ }
      compter('resultat');
      location.href = r.url;
    });
  }

  function aller(i: number) {
    etat.ecran = Math.max(0, Math.min(i, N));
    sauver();
    if (!coord) rendreEntree(etat.ecran);
    else if (etat.ecran >= N) rendreGate(); else rendreEcran(etat.ecran);
  }

  function rendreReprise(sauve: Etat) {
    affiche = '';
    premierRendu = false; // l'écran d'entrée qui suit n'est pas le premier écran de la page
    const e = ECRANS[Math.min(sauve.ecran, N - 1)];
    const n = Object.keys(sauve.reponses).length;
    majProgression(sauve.ecran);
    zone.innerHTML = html`<div class="qz-reprise"><h1>Vous étiez à la question ${e.numero}</h1>
      <p>${n === 1 ? 'Votre première réponse est gardée' : `Vos ${n} premières réponses sont gardées`} sur cet appareil.</p>
      <button type="button" class="btn btn-primaire" data-reprendre>Reprendre</button>
      <button type="button" class="qz-recommencer lien" style="background:none;border:0" data-recommencer>Recommencer</button></div>`;
    zone.querySelector('[data-reprendre]')?.addEventListener('click', () => { etat = sauve; fixerCampagne(sauve.utm); compter('reprise', ECRANS[sauve.ecran]?.id); repris = true; dejaCompte = ECRANS[sauve.ecran]?.id ?? ''; aller(sauve.ecran); });
    zone.querySelector('[data-recommencer]')?.addEventListener('click', () => { etat = neuf(); aller(0); });
  }

  // abandon : clic sur le logo → confirmation ; les réponses restent sur l'appareil
  document.querySelector('[data-abandon]')?.addEventListener('click', (ev) => {
    if (!dialogue || (affiche === 'entree' && !Object.keys(etat.reponses).length)) return; // rien à garder : le logo mène à l'accueil
    ev.preventDefault();
    const texte = dialogue.querySelector<HTMLElement>('[data-abandon-texte]');
    const e = ECRANS[Math.min(etat.ecran, N - 1)];
    if (texte) texte.textContent = `Vos réponses sont gardées sur cet appareil. Vous pourrez reprendre à la question ${e.numero}.`;
    dialogue.showModal();
  });
  dialogue?.querySelector('[data-abandon-continuer]')?.addEventListener('click', () => dialogue.close());

  // Story 10.13 : premier clic (ou toucher) ou touche du clavier dans le premier écran, compté une fois ; un simple défilement
  // ou un toucher sur l'en-tête ne compte pas. Un premier écran quitté sans interaction signale une page pas vue, ou un
  // visiteur qui n'a pas essayé de répondre. Depuis la story 10.15, le premier écran est l'écran d'entrée (avant : la question 1).
  const surInteraction = () => {
    if (affiche !== 'entree' || repris) return;
    for (const type of ['click', 'keydown']) zone.removeEventListener(type, surInteraction, { capture: true });
    compter('interaction');
  };
  for (const type of ['click', 'keydown']) zone.addEventListener(type, surInteraction, { capture: true, passive: true });

  const sauve = charger();
  if (sauve && sauve.ecran > 0 && sauve.ecran < N) rendreReprise(sauve);
  else aller(0);
}
