// Textes des e-mails automatiques des stories 10.3, 10.4 et 10.5 (à relire par Anne avant le lancement).
import bareme from '../content/diagnostic/bareme.json';
import contenu from '../content/diagnostic/questions.json';
import type { Scores } from './diagnostic';
import { sujetEtape, texteEtape, type EtapeSequence } from './sequence';

// - notify_anne : prévient Anne d'une demande, prêt à recopier dans la fiche contact Modelo (AD-14) :
//   un bloc par champ, dans l'ordre de la fiche (Nom, Prénom, Téléphone, E-mail, Type de contact, Commune, Type de bien, Notes).
//   « Répondre » dans sa messagerie écrit directement au prospect.
// - confirm_prospect : accuse réception au prospect, dans la langue de la page ; « Répondre » écrit à Anne.
//   Guide : porte le lien signé du guide, valable 7 jours (story 10.5).
// - guide : le lien du guide demandé depuis la page de résultats du diagnostic (story 10.5).
// - sequence:<étape> : un e-mail de la séquence d'Anne, avec son lien de désabonnement (story 10.5).

export interface LigneLead {
  id: string;
  created_at: string;
  lang: 'fr' | 'en';
  source: 'contact' | 'estimation' | 'guide' | 'diagnostic' | 'rdv';
  email: string;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
  projet: 'vente' | 'achat' | null;
  message: string | null;
  commune_bien: string | null;
  type_bien: string | null;
  newsletter_opt_in_at: string | null;
  answers?: string | null;
  scores?: string | null;
  orientation?: 'A' | 'B' | null;
  rdv_start?: string | null;
  utm: string | null;
  is_test: number;
}

export interface Message {
  objet: string;
  texte: string;
}

/** +33612345678 → « +33 6 12 34 56 78 » ; les autres numéros restent tels quels. */
export function telephoneLisible(t: string | null): string {
  if (!t) return '';
  const fr = /^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(t);
  return fr ? `+33 ${fr.slice(1).join(' ')}` : t;
}

const dateParis = (iso: string) =>
  new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));

const ORIGINE: Record<string, string> = {
  contact: 'formulaire de contact',
  estimation: "demande d'estimation",
  guide: 'demande du guide « Les 10 erreurs fatales »',
  diagnostic: 'diagnostic vendeur',
  rdv: 'rendez-vous réservé dans Cal.com',
};

/** « jeudi 9 octobre à 11:00 » (heure de Paris). */
const rendezVous = (iso: string) => {
  const d = new Date(iso);
  const jour = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  const heure = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' }).format(d);
  return `${jour} à ${heure}`;
};

const AXES = ['preparation', 'visibilite', 'efficacite'] as const;
const NOMS_AXES = contenu.categories as Record<string, { resultat?: string }>;

/** Score, profil et sous-scores d'un lead diagnostic (null pour les autres sources). */
function resultat(l: LigneLead): { scores: Scores; profil: string; axes: string[] } | null {
  if (l.source !== 'diagnostic' || !l.scores) return null;
  const scores = JSON.parse(l.scores) as Scores;
  const profil = bareme.profils.find((p) => p.id === scores.profil)?.libelle ?? scores.profil;
  const axes = AXES.map((k) => `${NOMS_AXES[k]?.resultat ?? k} : ${scores.categories[k].brut} / ${scores.categories[k].max}`);
  return { scores, profil, axes };
}

/** Les réponses du diagnostic en clair, une ligne par question, pour qu'Anne prépare son appel. */
function reponsesLisibles(l: LigneLead): string[] {
  if (!l.answers) return [];
  const { reponses, autre } = JSON.parse(l.answers) as { reponses: Record<string, string[]>; autre: Record<string, string> };
  return contenu.ecrans.flatMap((e) => {
    const ids = reponses[e.id] ?? [];
    if (e.type === 'texte' || !ids.length) return [];
    const libelles = ids.map((id) => (id === 'autre' ? `autre : ${autre[e.id] ?? ''}` : (e.options ?? []).find((o) => o.id === id)?.libelle ?? id));
    return [`${e.question} ${libelles.join(', ')}`];
  });
}

const SIGNATURE = 'Anne VIAL-TISSOT\nConsultante en immobilier · Chablais, Léman · réseau eXp France\nhttps://annevialtissot.fr';
const SIGNATURE_EN = 'Anne VIAL-TISSOT\nReal estate consultant · Chablais, Lake Geneva · eXp France network\nhttps://annevialtissot.fr';

export function notifierAnne(l: LigneLead): Message {
  const nomComplet = [l.prenom, l.nom].filter(Boolean).join(' ');
  const type = l.source === 'contact' && l.projet === 'achat' ? 'Acquéreur' : l.source === 'rdv' ? 'À préciser pendant l\'appel' : 'Vendeur';
  const detail = l.source === 'contact' ? ` (${l.projet === 'achat' ? 'achat' : 'vente'})` : '';
  const campagne = l.utm ? Object.values(JSON.parse(l.utm) as Record<string, string>).join(' · ') : '';
  const diag = resultat(l);
  const notes = [
    ...(diag ? [
      `Diagnostic : ${diag.scores.total} / 100, ${diag.profil}. ${diag.axes.join(' · ')}.`,
      `Sortie ${l.orientation} : ${l.orientation === 'A' ? 'prospect qualifié, la page lui propose un rendez-vous de 30 minutes' : 'prospect à accompagner, la page lui propose le guide'}.`,
      ...(l.message ? [`Message libre (question 15) : ${l.message}`] : []),
      'Réponses :',
      ...reponsesLisibles(l).map((r, i, t) => (i === t.length - 1 ? `${r}\n` : r)), // ligne vide avant la date de la demande
    ] : l.source === 'rdv' && l.rdv_start ? [
      `Rendez-vous « Premier échange » le ${rendezVous(l.rdv_start)} (heure de Paris), par téléphone.`,
      ...(l.message ? [`Note du prospect : ${l.message}`] : []),
    ] : [l.message ?? '']),
    `Demande du ${dateParis(l.created_at)} via annevialtissot.fr (${ORIGINE[l.source] ?? l.source}${detail}).`,
    `Séquence d'e-mails : ${l.newsletter_opt_in_at ? 'acceptée' : 'non demandée'}.`,
    l.lang === 'en' ? 'Demande faite depuis la version anglaise du site.' : '',
    campagne ? `Campagne : ${campagne}.` : '',
  ].filter(Boolean).join('\n');
  const blocs: [string, string | null][] = [
    ['Nom', l.nom],
    ['Prénom', l.prenom],
    ['Téléphone', telephoneLisible(l.telephone) || 'non indiqué'],
    ['E-mail', l.email],
    ['Type de contact', type],
    ['Commune du bien', l.commune_bien],
    ['Type de bien', l.type_bien],
    ['Notes', notes],
  ];
  const aFaire =
    l.source === 'rdv'
      ? `À faire : appeler ${telephoneLisible(l.telephone) || 'le prospect (numéro non transmis, voir l\'invitation Cal.com)'} le ${l.rdv_start ? rendezVous(l.rdv_start) : '(date dans l\'invitation Cal.com)'}. Cal.com a déjà envoyé les confirmations et l'invitation d'agenda.`
      : l.source === 'diagnostic'
      ? l.orientation === 'A'
        ? 'À faire : rappeler sous un jour ouvré pour proposer le rendez-vous stratégique (sortie A).'
        : 'À faire : un appel quand vous le jugez utile ; ses résultats lui proposent le guide (sortie B).'
      : l.source === 'guide'
      ? 'Le site lui a envoyé le guide par e-mail (lien valable 7 jours). À faire : un appel quand vous le jugez utile.'
      : l.source === 'estimation'
        ? 'À faire : rappeler sous un jour ouvré (le site le lui a promis).'
        : 'À faire : répondre sous un jour ouvré (le site le lui a promis).';
  const texte = [
    `Nouvelle demande reçue par le site le ${dateParis(l.created_at)} (heure de Paris) : ${ORIGINE[l.source] ?? l.source}${detail}.`,
    aFaire,
    '',
    'À recopier dans la fiche contact Modelo :',
    '',
    ...blocs.filter(([, v]) => v).map(([titre, v]) => `${titre}\n${v}\n`),
    `Répondre à cet e-mail écrit directement à ${nomComplet || l.email}.`,
    `Référence de la demande : ${l.id}`,
  ].join('\n');
  const libelle =
    l.source === 'contact' ? `Contact${detail}` : l.source === 'estimation' ? 'Estimation'
      : l.source === 'diagnostic' ? `Diagnostic ${diag?.scores.total ?? '?'}/100 (sortie ${l.orientation})`
      : l.source === 'rdv' ? `Rendez-vous ${l.rdv_start ? rendezVous(l.rdv_start) : ''}`.trim() : 'Guide';
  return { objet: `Nouvelle demande · ${libelle} · ${nomComplet}`, texte };
}

const PIED_SEQUENCE = (n: number) => `Vous recevrez aussi ${n} e-mails de conseils, à quelques jours d'intervalle. Chacun contient un lien pour arrêter.`;

/** `lienGuide` : lien signé du guide (null si le secret des liens manque : l'e-mail renvoie alors à la page du guide). */
export function confirmerProspect(l: LigneLead, lienGuide: string | null = null, etapes = 0): Message {
  const tel = telephoneLisible(l.telephone);
  const diag = resultat(l);
  const sequence = l.newsletter_opt_in_at && etapes ? ['', PIED_SEQUENCE(etapes)] : [];
  if (l.source === 'guide') {
    return {
      objet: 'Votre guide « Les 10 erreurs fatales des vendeurs particuliers »',
      texte: [
        `Bonjour ${l.prenom ?? ''},`.trim(), '',
        'Merci pour votre demande. Voici votre guide, à télécharger :', '',
        lienGuide ?? 'Le lien de téléchargement vous sera envoyé par Anne sous un jour ouvré.', '',
        ...(lienGuide ? ['Ce lien est personnel et reste valable 7 jours.', ''] : []),
        'Une question sur votre vente ? Répondez simplement à cet e-mail.', ...sequence, '', SIGNATURE,
      ].join('\n'),
    };
  }
  if (diag) {
    // Pas de lien vers la page de résultats : elle ne s'ouvre que dans le navigateur du diagnostic (AD-5). L'e-mail en garde le résumé.
    const suite = l.orientation === 'A'
      ? "Votre score montre une vente déjà bien préparée. Pour optimiser ce qui reste, je vous propose un rendez-vous stratégique de 30 minutes : réservez un créneau sur https://annevialtissot.fr/contact, ou répondez simplement à cet e-mail."
      : lienGuide
        ? `Pour corriger les points faibles identifiés, voici mon guide « Les 10 erreurs fatales des vendeurs particuliers » (lien personnel, valable 7 jours) :\n${lienGuide}\n\nPour en parler de vive voix, répondez simplement à cet e-mail.`
        : "Pour corriger les points faibles identifiés, demandez mon guide « Les 10 erreurs fatales des vendeurs particuliers » sur https://annevialtissot.fr/guide. Pour en parler de vive voix, répondez simplement à cet e-mail.";
    return {
      objet: 'Votre diagnostic vendeur : vos résultats',
      texte: [
        `Bonjour ${l.prenom ?? ''},`.trim(), '',
        'Merci d\'avoir fait le diagnostic de votre vente. Voici le résumé de vos résultats :', '',
        `Score global : ${diag.scores.total} / 100 (${diag.profil})`,
        ...diag.axes, '',
        'Le détail et les recommandations restent affichés 24 heures dans le navigateur où vous avez fait le diagnostic.', '',
        suite, ...sequence, '', SIGNATURE,
      ].join('\n'),
    };
  }
  if (l.lang === 'en') {
    const corps =
      l.source === 'estimation'
        ? `Your valuation request has reached me. I will call you back within one working day${tel ? ` on ${tel}` : ''} to ask a few questions about the property in ${l.commune_bien}, then we will arrange a visit. No figure is given in writing before that visit.`
        : `Your message has reached me. I will reply within one working day, by e-mail${tel ? ` or on ${tel}` : ''}.`;
    return {
      objet: l.source === 'estimation' ? 'Your valuation request to Anne VIAL-TISSOT' : 'Your message to Anne VIAL-TISSOT',
      texte: [`Hello ${l.prenom ?? ''},`.trim(), '', corps, ...(l.message ? ['', 'Your message:', l.message] : []), '', 'To add anything, simply reply to this e-mail.', '', SIGNATURE_EN].join('\n'),
    };
  }
  const corps =
    l.source === 'estimation'
      ? `Votre demande d'estimation est bien arrivée. Je vous rappelle sous un jour ouvré${tel ? ` au ${tel}` : ''}, pour quelques questions sur votre bien à ${l.commune_bien}, puis nous fixerons une visite. Aucun chiffre n'est donné par écrit avant cette visite.`
      : `Votre message est bien arrivé. Je vous réponds sous un jour ouvré, par e-mail${tel ? ` ou au ${tel}` : ''}.`;
  return {
    objet: l.source === 'estimation' ? "Votre demande d'estimation à Anne VIAL-TISSOT" : 'Votre message à Anne VIAL-TISSOT',
    texte: [`Bonjour ${l.prenom ?? ''},`.trim(), '', corps, ...(l.message ? ['', 'Pour rappel, votre message :', l.message] : []), '', 'Pour ajouter une précision, répondez simplement à cet e-mail.', '', SIGNATURE].join('\n'),
  };
}

/** Le guide demandé depuis la page de résultats du diagnostic (envoi `guide`). */
export function envoyerGuide(l: LigneLead, lienGuide: string): Message {
  return {
    objet: 'Votre guide « Les 10 erreurs fatales des vendeurs particuliers »',
    texte: [
      `Bonjour ${l.prenom ?? ''},`.trim(), '',
      'Voici le guide demandé depuis vos résultats du diagnostic :', '',
      lienGuide, '',
      'Ce lien est personnel et reste valable 7 jours.', '',
      'Une question sur votre vente ? Répondez simplement à cet e-mail.', '', SIGNATURE,
    ].join('\n'),
  };
}

/** Un e-mail de la séquence d'Anne (`sequence:<étape>`), avec le lien de désabonnement en pied. */
export function etapeSequence(l: LigneLead, e: EtapeSequence, lienDesabonnement: string): Message {
  const pied = l.lang === 'en'
    ? `You receive this e-mail because you asked for Anne's advice series. To stop: ${lienDesabonnement}`
    : `Vous recevez cet e-mail parce que vous avez demandé la série de conseils d'Anne. Pour ne plus la recevoir : ${lienDesabonnement}`;
  return { objet: sujetEtape(e, l.prenom), texte: [texteEtape(e, l.prenom), '', '—', pied, '', l.lang === 'en' ? SIGNATURE_EN : SIGNATURE].join('\n') };
}
