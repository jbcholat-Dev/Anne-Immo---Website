// Îlot de la fiche d'un contact et de la création à la main (story 18.7, FR-26, FR-28), sur la page Contacts. La fiche
// s'ouvre dans un panneau à droite du tableau (un clic sur le nom), lue et écrite par /api/fiche ; « + Nouveau contact »
// ouvre la fenêtre de saisie de la maquette. Après chaque écriture, la ligne renvoyée par le serveur est remise dans le
// tableau par `surLigne`, sans recharger. Tout texte venu des données passe par `esc` avant d'entrer dans le HTML.
import { telLisible } from '@site/server/recherche';
import {
  CANAUX_CONTACT, ETATS_AMBASSADEUR, PROJETS, PROJETS_AVEC_TEMPERATURE, TEMPERATURES, TEMPERATURES_CHOIX, temperaturePermise, type LigneTableau,
} from '../server/tableau-colonnes';
import type { Fiche } from '../server/fiche';

/** Une création préremplie (story 18.11) : valeurs des champs, et l'envoi par la barre « Nouveaux ». */
export interface Prerempli { valeurs: Record<string, string | null>; envoyer: (saisie: Record<string, unknown>) => Promise<Reponse> }
interface Reglages { categories: { id: string; nom: string }[]; surLigne: (l: LigneTableau) => void; annoncer: (texte: string) => void }
export type Reponse = { ok: boolean; status: number; error?: { code: string; message: string }; existant?: { id: string; nom: string }; fiche?: Fiche; ligne?: LigneTableau | null; id?: string; ignore?: boolean; remplace?: boolean; changes?: string[] };

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const JOUR_PARIS = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit' });
const aujourdhui = () => JOUR_PARIS.format(Date.now());
const quand = (iso: string | null) => iso ? new Date(iso).toLocaleString('fr-FR', { timeZone: 'Europe/Paris', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
const jour = (iso: string | null) => iso ? new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString('fr-FR', { timeZone: iso.length === 10 ? 'UTC' : 'Europe/Paris', day: 'numeric', month: 'short', year: 'numeric' }) : '';
const nomDe = (f: Pick<Fiche, 'prenom' | 'nom' | 'telephones' | 'emails'>) => [f.prenom, f.nom].filter(Boolean).join(' ') || telLisible(f.telephones[0]) || f.emails[0] || 'Sans nom';
const options = (liste: [string, string][], actuelle: string | null) => liste.map(([v, t]) => `<option value="${esc(v)}"${v === (actuelle ?? '') ? ' selected' : ''}>${esc(t)}</option>`).join('');
const RESEAUX: Record<string, string> = { linkedin: 'LinkedIn', instagram: 'Instagram', facebook: 'Facebook' };
const STATUT_ACCORD: Record<string, string> = {
  accord: 'Reçoit vos campagnes', client: 'Reçoit vos campagnes en tant qu\'ancien client', sans_accord: 'Ne reçoit pas vos campagnes : pas d\'accord noté',
  desinscrit: 'Ne reçoit plus vos campagnes : désinscrit (seule une nouvelle inscription sur le site peut changer cela)', sans_email: 'Pas d\'adresse e-mail',
};

async function appeler(methode: 'GET' | 'POST', corps?: unknown, id?: string): Promise<Reponse> {
  try {
    const r = await fetch(`/api/fiche${id ? `?id=${encodeURIComponent(id)}` : ''}`, {
      method: methode, headers: corps ? { 'Content-Type': 'application/json' } : {}, body: corps ? JSON.stringify(corps) : undefined,
    });
    const d = await r.json().catch(() => ({}));
    return { ...d, ok: r.ok && d.ok !== false, status: r.status, error: d.error ?? (r.ok ? undefined : { code: 'http', message: `Erreur ${r.status}` }) };
  } catch { return { ok: false, status: 0, error: { code: 'reseau', message: 'Pas de connexion : réessayez.' } }; }
}

export function brancherFiche(r: Reglages) {
  const panneau = document.querySelector<HTMLDialogElement>('[data-fiche]')!;
  const corps = panneau.querySelector<HTMLElement>('[data-fiche-corps]')!;
  const creation = document.querySelector<HTMLDialogElement>('[data-creation]')!;
  const formCreation = creation.querySelector<HTMLFormElement>('form')!;
  const erreurCreation = creation.querySelector<HTMLElement>('[data-creation-erreur]')!;
  let fiche: Fiche | null = null;
  let message: { texte: string; erreur: boolean; existant?: { id: string; nom: string } } | null = null;
  let occupe = false;

  const categories: [string, string][] = r.categories.map((c) => [c.id, c.nom]);
  const temperatures = (projet: string): [string, string][] => [['', PROJETS_AVEC_TEMPERATURE.includes(projet) ? 'À préciser' : '—'],
    ...TEMPERATURES_CHOIX.filter((t) => temperaturePermise(t, projet)).map((t): [string, string] => [t, TEMPERATURES[t]])];

  function majUrl(id: string | null) {
    const u = new URL(location.href);
    if (id) u.searchParams.set('fiche', id); else u.searchParams.delete('fiche');
    history.replaceState(history.state, '', u);
  }

  const liste = (nom: string, valeurs: string[], type: string, libelle: string) => `<div class="fc-liste" data-liste-${nom}>
      ${(valeurs.length ? valeurs : ['']).map((v, i) => `<input name="${nom}" type="${type}" value="${esc(v)}" aria-label="${esc(libelle)} ${i + 1}" autocomplete="off" />`).join('')}
      <button type="button" class="fc-lien" data-ajouter-${nom}>+ ${nom === 'telephone' ? 'un autre numéro' : 'une autre adresse'}</button></div>`;

  function rendre() {
    const f = fiche!;
    const nom = nomDe(f);
    const appelRegle = f.appel_permis_categorie === null ? 'pas de catégorie' : f.appel_permis_categorie ? 'appel permis' : 'appel non permis';
    const tempTexte = f.temperature ? TEMPERATURES[f.temperature] ?? f.temperature : '—';
    const hist = f.historique.map((e) => `<li class="${e.type === 'note' ? 'fc-note' : ''}"><div class="fc-muet">${esc(quand(e.a))}${e.par ? ` · ${esc(e.par)}` : e.source === 'leedflow' ? ' · Leedflow' : e.source === 'site' ? ' · site' : ''}</div><div class="fc-texte">${esc(e.texte)}</div></li>`).join('');
    const accordGestes = [
      f.accord.statut === 'sans_accord' ? '<button type="button" class="ct-btn" data-accord="oui">Elle ou il est d\'accord</button>' : '',
      f.accord.statut === 'accord' && (f.accord.source === 'anne' || f.accord.source === 'import') ? '<button type="button" class="ct-btn" data-accord="retirer">Retirer l\'accord</button>' : '',
      f.accord.statut === 'accord' || f.accord.statut === 'client' ? '<button type="button" class="ct-btn" data-accord="refus">Ne veut plus d\'e-mails</button>' : '',
    ].join('');
    corps.innerHTML = `
      <header class="fc-tete">
        <div><h2 id="fc-titre" tabindex="-1">${esc(nom)}</h2>
          <div class="fc-pastilles">${f.categorie ? `<span class="ct-pastille">${esc(f.categorie)}</span>` : '<span class="ct-pastille aq">à ranger</span>'}
            <span class="ct-pastille">${esc(PROJETS[f.projet] ?? f.projet)}</span>${f.temperature ? `<span class="ct-pastille t-${esc(f.temperature)}">${esc(tempTexte)}</span>` : ''}
            ${f.ecarte_le ? '<span class="ct-etat">écarté</span>' : f.verifie_le ? '<span class="ct-etat ok">✓ vérifié</span>' : '<span class="ct-etat av">à vérifier</span>'}
            ${f.ambassadeur_etat ? `<span class="ct-pastille amb-${esc(f.ambassadeur_etat)}" data-fiche-ambassadeur="${esc(f.ambassadeur_etat)}">Ambassadeur : ${esc(ETATS_AMBASSADEUR[f.ambassadeur_etat])}</span>` : ''}</div>
        </div>
        <button type="button" class="fc-fermer" data-fiche-fermer aria-label="Fermer la fiche">×</button>
      </header>
      ${message ? `<p class="fc-message${message.erreur ? ' erreur' : ''}" role="${message.erreur ? 'alert' : 'status'}" data-fiche-message>${esc(message.texte)}${message.existant ? ` <button type="button" class="fc-lien" data-ouvrir="${esc(message.existant.id)}">Ouvrir la fiche de ${esc(message.existant.nom)}</button>` : ''}</p>` : ''}
      ${f.etape ? `<section class="fc-bloc fc-suivi" data-fiche-suivi><strong>Suivi des ventes : ${esc(f.etape_libelle)}</strong>${f.prochaine_action ? ` · ${esc(f.prochaine_action)}${f.prochaine_action_le ? `, ${esc(jour(f.prochaine_action_le))}` : ''}` : ''}
        <a href="/contacts/fiche?id=${esc(f.id)}" data-fiche-suivi-lien>Ouvrir sa fiche de suivi</a></section>` : ''}
      <form class="fc-bloc fc-form" data-fiche-form>
        <h3>Informations</h3>
        <div class="fc-grille">
          <label class="ct-champ">Prénom<input name="prenom" value="${esc(f.prenom)}" maxlength="80" autocomplete="off" /></label>
          <label class="ct-champ">Nom<input name="nom" value="${esc(f.nom)}" maxlength="80" autocomplete="off" /></label>
          <label class="ct-champ">Entreprise<input name="entreprise" value="${esc(f.entreprise)}" maxlength="120" autocomplete="off" /></label>
          <label class="ct-champ">Ville<input name="commune" value="${esc(f.commune)}" maxlength="80" autocomplete="off" /></label>
          <div class="ct-champ">Téléphones${liste('telephone', f.telephones.map(telLisible), 'tel', 'Téléphone')}</div>
          <div class="ct-champ">E-mails${liste('email', f.emails, 'email', 'E-mail')}</div>
          <label class="ct-champ">Catégorie<select name="categorie_id">${f.categorie_id ? '' : '<option value="" selected>À ranger</option>'}${options(categories, f.categorie_id)}</select></label>
          <label class="fc-case"><input type="checkbox" name="verifie"${f.verifie_le ? ' checked' : ''} /> Catégorie vérifiée</label>
          <label class="ct-champ">Projet<select name="projet">${options(Object.entries(PROJETS), f.projet)}</select></label>
          <label class="ct-champ">Température${f.en_cours ? `<input value="${esc(tempTexte)}" disabled title="Suit l'étape du suivi des ventes" /><input type="hidden" name="temperature-fixe" />` : `<select name="temperature" data-fiche-temperature>${options(temperatures(f.projet), f.temperature)}</select>`}</label>
          <label class="ct-champ">Appel autorisé<select name="appel_autorise">${options([['', `Selon la catégorie (${appelRegle})`], ['oui', 'Oui, pour cette personne'], ['non', 'Non, ne pas l\'appeler']], f.appel_autorise === null ? '' : f.appel_autorise ? 'oui' : 'non')}</select></label>
          <label class="ct-champ">À rappeler le<input type="date" name="a_rappeler_le" value="${esc(f.a_rappeler_le)}" /></label>
          <label class="ct-champ">R1 (premier rendez-vous)<input type="date" name="r1_le" value="${esc(f.r1_le)}" /></label>
          <label class="ct-champ">R2 (second rendez-vous)<input type="date" name="r2_le" value="${esc(f.r2_le)}" /></label>
        </div>
        ${f.profils.length ? `<p class="fc-muet">Profils : ${f.profils.map((p) => `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${esc(p.reseau ? RESEAUX[p.reseau.toLowerCase()] ?? p.reseau : 'Profil')}</a>`).join(' · ')}</p>` : ''}
        <div class="fc-boutons"><button type="submit" class="ct-btn bleu" data-fiche-enregistrer>Enregistrer</button></div>
      </form>
      <section class="fc-bloc" data-fiche-accord="${esc(f.accord.statut)}">
        <h3>Accord e-mail</h3>
        <p>${esc(STATUT_ACCORD[f.accord.statut])}${f.accord.le ? ` (${esc(jour(f.accord.le))})` : ''}.</p>
        ${f.accord.a_reconfirmer ? '<p class="fc-muet" data-accord-reconfirmer>Accord à reconfirmer : il avait été donné sur le site pour une autre adresse e-mail.</p>' : ''}
        ${accordGestes ? `<div class="fc-boutons gauche">${accordGestes}</div>` : ''}
      </section>
      <section class="fc-bloc" data-fiche-dernier>
        <h3>Dernier contact</h3>
        <p data-fiche-dernier-texte>${f.dernier_contact_le ? `${esc(jour(f.dernier_contact_le))}${f.dernier_contact_canal ? ` · ${esc(CANAUX_CONTACT[f.dernier_contact_canal] ?? f.dernier_contact_canal)}` : ''}` : 'Jamais recontacté'}</p>
        <form class="fc-ligne" data-fiche-contact>
          <label class="ct-champ">Date<input type="date" name="jour" value="${aujourdhui()}" max="${aujourdhui()}" required /></label>
          <label class="ct-champ">Canal<select name="canal">${options(Object.entries(CANAUX_CONTACT), 'appel')}</select></label>
          <label class="ct-champ fc-large">Ce qui s'est dit (facultatif)<input name="note" maxlength="2000" autocomplete="off" /></label>
          <button type="submit" class="ct-btn">Noter ce contact</button>
        </form>
        <p class="fc-muet">Un appel reçu, une rencontre : un contact fait en dehors d'une séance.</p>
      </section>
      ${!f.envoi_groupe && f.emails.length ? `<section class="fc-bloc" data-fiche-ecrire>
        <h3>Écrire à la main</h3>
        <p class="fc-muet">${f.accord.statut === 'desinscrit' ? 'Cette personne ne veut plus d\'e-mails groupés : un message personnel reste possible, à vous d\'en juger.' : 'Pas d\'envoi groupé pour ce contact (pas d\'accord noté, ou catégorie sans envoi groupé) : le message s\'ouvre dans votre messagerie, vous l\'envoyez vous-même.'}</p>
        <label class="ct-champ">Modèle<select data-ecrire-modele><option value="">Chargement…</option></select></label>
        <div class="fc-boutons gauche"><a class="ct-btn bleu" data-ecrire-lien aria-disabled="true" href="#">Écrire</a><button type="button" class="ct-btn" data-ecrire-envoye disabled>Envoyé</button></div>
        <p class="fc-muet">« Écrire » ouvre le message prêt dans votre messagerie ; une fois envoyé, « Envoyé » note le dernier contact et la trace sur cette fiche.</p>
      </section>` : ''}
      <form class="fc-bloc" data-fiche-note>
        <h3>Ajouter une note</h3>
        <textarea name="note" rows="2" maxlength="2000" aria-label="Note" placeholder="Une idée, ce qu'il faut retenir"></textarea>
        <div class="fc-boutons"><button type="submit" class="ct-btn">Ajouter la note</button></div>
      </form>
      <section class="fc-bloc fc-deux">
        <div><h3>Sources</h3><ul class="fc-simple" data-fiche-sources>${f.sources.map((s) => `<li>${esc(s.libelle)} <span class="fc-muet">${esc(jour(s.a))}</span></li>`).join('') || '<li class="fc-muet">—</li>'}</ul>${f.rencontres.length ? `<h3>Rencontres</h3><ul class="fc-simple" data-fiche-rencontres>${f.rencontres.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}</div>
        <div><h3>Séances</h3><ul class="fc-simple" data-fiche-seances>${f.seances.map((s) => `<li>${esc(s.nom)}</li>`).join('') || '<li class="fc-muet">Aucune séance pour l\'instant.</li>'}</ul></div>
      </section>
      ${f.demandes.length ? `<section class="fc-bloc" data-fiche-demandes><h3>Demandes reçues du site</h3>${f.demandes.map((d) => `<div class="fc-demande"><div class="fc-muet">${esc(d.libelle)} · ${esc(quand(d.created_at))}${d.type_bien || d.commune_bien ? ` · ${esc([d.type_bien, d.commune_bien].filter(Boolean).join(', '))}` : ''}</div>${d.message ? `<div class="fc-texte">${esc(d.message)}</div>` : ''}</div>`).join('')}</section>` : ''}
      <section class="fc-bloc"><h3>Notes et historique</h3><ol class="fc-historique" data-fiche-historique>${hist || '<li class="fc-muet">Rien pour l\'instant.</li>'}</ol></section>
      <footer class="fc-pied">
        <button type="button" class="ct-btn" data-fiche-ecarter>${f.ecarte_le ? 'Faire revenir dans le tableau' : 'Écarter ce contact'}</button>
        <span class="fc-muet">Accès ou effacement de ses données (RGPD) : <a href="/contacts/fiche?id=${esc(f.id)}#donnees">fiche complète</a>.</span>
      </footer>`;
    const projet = corps.querySelector<HTMLSelectElement>('select[name=projet]')!;
    const temp = corps.querySelector<HTMLSelectElement>('[data-fiche-temperature]');
    brancherEcrire();
    projet.addEventListener('change', () => { if (temp) { const v = temp.value; temp.innerHTML = options(temperatures(projet.value), temperaturePermise(v || null, projet.value) ? v : ''); } });
  }

  /** Story 18.18 : « Écrire » (mailto: prêt, formule remplie) puis « Envoyé » (dernier contact + trace), pour un contact sans envoi groupé. */
  let ecrireModele = '';
  let ecrireNom = '', ecrireObjet = '';
  function brancherEcrire() {
    const bloc = corps.querySelector<HTMLElement>('[data-fiche-ecrire]');
    if (!bloc || !fiche) return;
    const choix = bloc.querySelector<HTMLSelectElement>('[data-ecrire-modele]')!;
    const lien = bloc.querySelector<HTMLAnchorElement>('[data-ecrire-lien]')!;
    const envoye = bloc.querySelector<HTMLButtonElement>('[data-ecrire-envoye]')!;
    const id = fiche.id;
    const preparer = async () => {
      ecrireModele = choix.value;
      lien.setAttribute('aria-disabled', 'true'); lien.setAttribute('href', '#'); envoye.disabled = true;
      if (!ecrireModele) return;
      try {
        const r = await fetch(`/api/campagnes?modele=${encodeURIComponent(ecrireModele)}&contact=${encodeURIComponent(id)}`);
        const d = await r.json() as { ok?: boolean; a?: string; objet?: string; texte?: string; modele?: string };
        if (!r.ok || !d.a || fiche?.id !== id || choix.value !== ecrireModele) return;
        ecrireNom = d.modele ?? ''; ecrireObjet = d.objet ?? '';
        lien.setAttribute('href', `mailto:${d.a.replace(/[^A-Za-z0-9@.+_'!$*=\/^`{|}~-]/g, encodeURIComponent)}?subject=${encodeURIComponent(d.objet ?? '')}&body=${encodeURIComponent((d.texte ?? '').replace(/\n/g, '\r\n'))}`);
        lien.removeAttribute('aria-disabled');
        envoye.disabled = false;
      } catch {}
    };
    fetch('/api/campagnes?modeles=1').then((r) => r.json()).then((d: { modeles?: { id: string; nom: string }[] }) => {
      const l = d.modeles ?? [];
      choix.innerHTML = l.length ? l.map((m) => `<option value="${esc(m.id)}">${esc(m.nom)}</option>`).join('') : '<option value="">Aucun modèle : marquez une campagne « modèle »</option>';
      void preparer();
    }).catch(() => { choix.innerHTML = '<option value="">Modèles indisponibles</option>'; });
    choix.addEventListener('change', () => void preparer());
    lien.addEventListener('click', (e) => { if (lien.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
    envoye.addEventListener('click', () => {
      if (!ecrireModele) return;
      void ecrire({ contact: { jour: aujourdhui(), canal: 'email', note: `Modèle « ${ecrireNom} » envoyé à la main : ${ecrireObjet}`, envoi_modele: ecrireNom || 'modèle' } }, 'Noté : dernier contact aujourd\'hui, par e-mail, avec le modèle envoyé.');
    });
  }

  /** Applique une réponse d'écriture : fiche, ligne du tableau, message. */
  function recevoir(x: Reponse, ok: string) {
    if (x.fiche) fiche = x.fiche;
    if (x.ligne) r.surLigne(x.ligne);
    message = x.ok ? { texte: ok, erreur: false } : { texte: x.error?.message ?? 'Erreur', erreur: true, existant: x.existant };
    rendre();
    corps.querySelector('[data-fiche-message]')?.scrollIntoView({ block: 'nearest' });
  }
  async function ecrire(corpsJson: Record<string, unknown>, ok: string) {
    if (occupe || !fiche) return;
    occupe = true;
    corps.querySelectorAll<HTMLButtonElement>('button[type=submit], [data-accord], [data-fiche-ecarter]').forEach((b) => { b.disabled = true; });
    const x = await appeler('POST', { id: fiche.id, ...corpsJson });
    occupe = false;
    // Contact changé entre-temps : la fiche est relue avant de laisser recommencer.
    if (x.error?.code === 'modifie') { const y = await appeler('GET', undefined, fiche.id); if (y.fiche) x.fiche = y.fiche; }
    recevoir(x, ok);
  }

  /** La correction : seuls les champs changés depuis la lecture sont envoyés. */
  function correction(form: HTMLFormElement): Record<string, unknown> {
    const f = fiche!, d = new FormData(form), c: Record<string, unknown> = {};
    const v = (k: string) => String(d.get(k) ?? '').trim();
    for (const k of ['prenom', 'nom', 'entreprise', 'commune'] as const) if (v(k) !== (f[k] ?? '')) c[k] = v(k) || null;
    const tels = d.getAll('telephone').map((x) => String(x).trim()).filter(Boolean);
    if (tels.join('|') !== f.telephones.map(telLisible).join('|')) c.telephones = tels;
    const mails = d.getAll('email').map((x) => String(x).trim()).filter(Boolean);
    if (mails.join('|').toLowerCase() !== f.emails.join('|')) c.emails = mails;
    if (v('categorie_id') && v('categorie_id') !== f.categorie_id) c.categorie_id = v('categorie_id');
    if (d.has('verifie') !== !!f.verifie_le && c.categorie_id === undefined) c.verifie = d.has('verifie');
    if (v('projet') !== f.projet) c.projet = v('projet');
    if (d.has('temperature') && (v('temperature') || null) !== (temperaturePermise(f.temperature, v('projet')) ? f.temperature : null)) c.temperature = v('temperature') || null;
    const appel = v('appel_autorise') === '' ? null : v('appel_autorise') === 'oui';
    if (appel !== f.appel_autorise) c.appel_autorise = appel;
    if ((v('a_rappeler_le') || null) !== f.a_rappeler_le) c.a_rappeler_le = v('a_rappeler_le') || null;
    for (const k of ['r1_le', 'r2_le'] as const) if ((v(k) || null) !== f[k]) c[k] = v(k) || null;
    return c;
  }

  corps.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    if (form.matches('[data-fiche-form]')) {
      const c = correction(form);
      if (!Object.keys(c).length) { message = { texte: 'Rien n\'a changé.', erreur: false }; rendre(); return; }
      void ecrire({ corriger: c }, 'Fiche enregistrée, gardée dans l\'historique.');
    } else if (form.matches('[data-fiche-note]')) {
      const note = String(new FormData(form).get('note') ?? '').trim();
      if (note) void ecrire({ note }, 'Note ajoutée.');
    } else if (form.matches('[data-fiche-contact]')) {
      const d = new FormData(form);
      const note = String(d.get('note') ?? '').trim();
      void ecrire({ contact: { jour: String(d.get('jour') ?? ''), canal: String(d.get('canal') ?? ''), ...(note ? { note } : {}) } }, 'Contact noté.');
    }
  });
  corps.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const ajout = t.closest<HTMLElement>('[data-ajouter-telephone], [data-ajouter-email]');
    if (ajout) {
      const nom = ajout.hasAttribute('data-ajouter-telephone') ? 'telephone' : 'email';
      const i = document.createElement('input');
      Object.assign(i, { name: nom, type: nom === 'telephone' ? 'tel' : 'email', autocomplete: 'off' });
      i.setAttribute('aria-label', `${nom === 'telephone' ? 'Téléphone' : 'E-mail'} ${ajout.parentElement!.querySelectorAll('input').length + 1}`);
      ajout.before(i);
      i.focus();
      return;
    }
    if (t.closest('[data-fiche-fermer]')) { panneau.close(); return; }
    const ouvrir = t.closest<HTMLElement>('[data-ouvrir]');
    if (ouvrir) { void ouvrirFiche(ouvrir.dataset.ouvrir!); return; }
    const accord = t.closest<HTMLElement>('[data-accord]');
    if (accord) { void ecrire({ accord: accord.dataset.accord }, accord.dataset.accord === 'oui' ? 'Accord noté : elle ou il recevra vos campagnes.' : accord.dataset.accord === 'retirer' ? 'Accord retiré.' : 'Noté : plus d\'e-mails groupés.'); return; }
    if (t.closest('[data-fiche-ecarter]') && fiche) void ecrire({ corriger: { ecarte: !fiche.ecarte_le } }, fiche.ecarte_le ? 'Contact revenu dans le tableau.' : 'Contact écarté (filtre « Écartés » pour le revoir).');
  });
  panneau.addEventListener('close', () => { fiche = null; majUrl(null); });
  // Un clic sur le fond (hors du panneau) le ferme.
  panneau.addEventListener('click', (e) => { if (e.target === panneau) panneau.close(); });

  async function ouvrirFiche(id: string) {
    message = null;
    corps.innerHTML = '<p class="fc-muet">Chargement de la fiche…</p>';
    if (!panneau.open) panneau.showModal();
    const x = await appeler('GET', undefined, id);
    if (!x.fiche) { corps.innerHTML = `<p class="fc-message erreur" role="alert">${esc(x.error?.message ?? 'Erreur')}</p><button type="button" class="ct-btn" data-fiche-fermer>Fermer</button>`; return; }
    fiche = x.fiche;
    majUrl(id);
    rendre();
    corps.querySelector<HTMLElement>('#fc-titre')?.focus();
  }

  // « + Nouveau contact » (FR-26) : au moins un nom ou un téléphone ; un numéro ou un e-mail connu propose la fiche existante.
  const projetC = formCreation.querySelector<HTMLSelectElement>('select[name=projet]')!;
  const tempC = formCreation.querySelector<HTMLSelectElement>('select[name=temperature]')!;
  const majTempC = () => { tempC.innerHTML = options(temperatures(projetC.value), ''); tempC.disabled = !PROJETS_AVEC_TEMPERATURE.includes(projetC.value); };
  projetC.addEventListener('change', majTempC);
  // Story 18.11 : « Ajouter aux contacts » d'une carte « Nouveaux » ouvre la même fenêtre, préremplie avec ce que la
  // demande sait, le numéro de la carte non modifiable et sans case d'accord (un appel ne vaut pas accord) ; l'envoi passe
  // alors par la barre (`envoyer`, /api/nouveaux), qui classe aussi le numéro.
  const titreCreation = creation.querySelector<HTMLElement>('#ct-creation-titre')!;
  const introCreation = creation.querySelector<HTMLElement>('[data-creation-intro]');
  const introSaisie = introCreation?.textContent ?? '';
  const telC = formCreation.querySelector<HTMLInputElement>('input[name=telephone]')!;
  const accordC = formCreation.querySelector<HTMLElement>('input[name=accord]')!.closest<HTMLElement>('label')!;
  let depuisNouveau: Prerempli | null = null;
  function ouvrirCreation(pre: Prerempli | null = null) {
    formCreation.reset();
    depuisNouveau = pre;
    titreCreation.textContent = pre ? 'Ajouter aux contacts' : 'Nouveau contact';
    if (introCreation) introCreation.textContent = pre ? 'Le contact est créé vérifié, source « Leedflow », avec le numéro de la carte ; il entre dans le suivi pour que ses appels lui soient rangés.' : introSaisie;
    telC.readOnly = !!pre;
    accordC.hidden = !!pre;
    if (pre) {
      for (const [k, v] of Object.entries(pre.valeurs)) {
        const champ = formCreation.querySelector<HTMLInputElement | HTMLSelectElement>(`[name=${k}]`);
        if (champ && v) champ.value = v;
      }
    }
    majTempC();
    erreurCreation.hidden = true;
    creation.showModal();
    formCreation.querySelector<HTMLInputElement>(pre?.valeurs.prenom ? 'input[name=nom]' : 'input[name=prenom]')?.focus();
  }
  creation.querySelector('[data-creation-annuler]')!.addEventListener('click', () => creation.close());
  formCreation.addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = new FormData(formCreation);
    const v = (k: string) => String(d.get(k) ?? '').trim();
    if (!v('nom') && !v('telephone')) { erreurCreation.textContent = 'Il faut au moins un nom ou un téléphone.'; erreurCreation.hidden = false; return; }
    const bouton = formCreation.querySelector<HTMLButtonElement>('button[type=submit]')!;
    if (bouton.disabled) return;
    bouton.disabled = true;
    const saisie: Record<string, unknown> = { categorie_id: v('categorie_id'), projet: v('projet'), accord: d.has('accord') };
    for (const k of ['prenom', 'nom', 'telephone', 'email', 'commune', 'entreprise', 'note']) if (v(k)) saisie[k] = v(k);
    if (v('temperature')) saisie.temperature = v('temperature');
    const pre = depuisNouveau;
    if (pre) { delete saisie.telephone; delete saisie.accord; }
    const x = pre ? await pre.envoyer(saisie) : await appeler('POST', { creer: saisie });
    bouton.disabled = false;
    if (pre && x.ok) { creation.close(); return; }
    if (x.ok && x.ligne) {
      creation.close();
      r.surLigne(x.ligne);
      r.annoncer(`${nomDe({ prenom: x.ligne.prenom, nom: x.ligne.nom, telephones: x.ligne.telephones, emails: x.ligne.emails })} ajouté aux contacts`);
      return;
    }
    erreurCreation.innerHTML = `${esc(x.error?.message ?? 'Erreur')}${x.existant ? ` <button type="button" class="fc-lien" data-ouvrir-existant="${esc(x.existant.id)}">Ouvrir la fiche de ${esc(x.existant.nom)}</button>` : ''}`;
    erreurCreation.hidden = false;
  });
  erreurCreation.addEventListener('click', (e) => {
    const b = (e.target as Element).closest<HTMLElement>('[data-ouvrir-existant]');
    if (b) { creation.close(); void ouvrirFiche(b.dataset.ouvrirExistant!); }
  });
  return { ouvrirFiche, ouvrirCreation };
}
