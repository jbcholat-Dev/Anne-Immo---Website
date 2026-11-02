// Les demandes des portails d'annonces par e-mail (story 18.12, ex-13.8 ; FR-27 ; AD-20 entrée 3, AD-34). Quand un bien
// d'Anne est publié, chaque demande faite sur Leboncoin, SeLoger ou un autre portail arrive dans sa boîte pro : en
// notification de Modelo (« Netty - Contacts passerelles » <inbound@nettymail.com>, champs fixes : prénom, nom, e-mail,
// téléphone, ville, raison du contact, type de recherche, message, référence du bien ; vérifié sur capture par JB le
// 2026-10-10), ou directement du portail. Un filtre de la Gmail d'Anne les fait suivre à une adresse du sous-domaine
// reçu par Cloudflare Email Routing (proposé : `demandes@entrant.annevialtissot.fr`), qui les remet au gestionnaire
// `email` du Worker de l'espace (worker.ts), puis ici.
// - Expéditeur accepté : nettymail.com, leboncoin.fr, seloger.com (et leurs sous-domaines), ou le message de confirmation
//   du transfert de Gmail. Tout autre expéditeur est refusé (rejet SMTP), sans rien garder. L'en-tête From s'écrit
//   librement : l'expéditeur d'enveloppe doit en plus être la Gmail d'Anne (réglage PORTAILS_EXPEDITEUR_AUTORISE,
//   `enveloppeAutorisee`) ; vide, tout est refusé. Non vérifié : la signature DKIM (en-tête Authentication-Results), dont la
//   présence et la forme après le transfert de Gmail et Email Routing ne sont pas connues (mineur restant, revue de code 18.12).
// - Un même message reçu deux fois ne fait rien de plus (identifiant Message-ID, ou empreinte du message s'il n'en a pas).
// - Lisible (portail reconnu, téléphone ou e-mail valable) : le contact est créé ou complété par `pipeline`
//   (catégorie « Demandes reçues », projet acheteur, référence du bien, source `portail`), avec la ligne `nouveau`.
// - Personne qui a demandé l'effacement (table `opposition`, AD-31) : aucun contact, rien de ses données ; une carte
//   « Nouveaux » signale qu'une demande est arrivée et qu'elle est dans la boîte pro.
// - Illisible (champs introuvables, message trop gros, confirmation de Gmail, opposition invérifiable) : gardé avec son
//   sujet, son expéditeur et son texte, signalé par une carte « à lire à la main » ; jamais perdu. Le texte est effacé une
//   fois la carte traitée et le délai d'annulation passé (`menagePortails`, tâche planifiée).
// Champs gardés : prénom, nom, téléphone, e-mail, ville, message (1 000 caractères), référence et titre de l'annonce,
// raison du contact et type de recherche. Rien d'autre n'est lu ; l'e-mail lisible lui-même n'est pas gardé.
import { enProduction, type EnvSite } from '@site/server/env';
import { journal } from '@site/server/journal';
import { emailValide } from '@site/server/schema';
import { ulid } from '@site/server/ulid';
import type { EnvEspace } from './env';
import { enOpposition, telephoneSaisi } from './carnet';
import { lireCourriel } from './courriel';
import { ANNULATION_MS } from './leedflow';
import { rattacherDemandePortail } from './pipeline';

export type Portail = 'leboncoin' | 'seloger' | 'autre';
export const PORTAILS: Record<Portail, string> = { leboncoin: 'Leboncoin', seloger: 'SeLoger', autre: 'Portail d\'annonces' };
/** Au-delà, l'e-mail n'est pas lu (une notification de portail fait quelques kilo-octets) : gardé comme illisible, sans texte. */
export const TAILLE_MAX = 1_000_000;
const TEXTE_GARDE = 20_000;
const DOMAINES = ['nettymail.com', 'leboncoin.fr', 'seloger.com'];
const GMAIL_CONFIRMATION = 'forwarding-noreply@google.com';
const TROIS_ANS_MS = 3 * 365 * 86_400_000;

export interface DemandePortail {
  portail: Portail;
  prenom: string | null; nom: string | null; telephone: string | null; email: string | null; ville: string | null;
  message: string | null; reference: string | null; annonce: string | null; raison: string | null; recherche: string | null;
}

type Champ = 'prenom' | 'nom' | 'nom_complet' | 'email' | 'telephone' | 'ville' | 'raison' | 'recherche' | 'message' | 'reference' | 'annonce' | 'portail';
const LIBELLES: Record<string, Champ> = {};
for (const [champ, libelles] of Object.entries({
  prenom: ['prenom'],
  nom: ['nom', 'nom de famille'],
  nom_complet: ['nom complet', 'nom et prenom', 'prenom et nom', 'nom prenom', 'contact', 'de la part de', 'expediteur'],
  email: ['email', 'e-mail', 'e mail', 'adresse e-mail', 'adresse email', 'adresse mail', 'courriel', 'mail'],
  telephone: ['telephone', 'tel', 'tel.', 'portable', 'mobile', 'numero de telephone', 'telephone portable', 'numero'],
  ville: ['ville', 'commune', 'localite', 'code postal / ville', 'cp / ville', 'localisation'],
  raison: ['raison du contact', 'raison', 'objet', 'objet de la demande', 'motif', 'type de demande'],
  recherche: ['type de recherche', 'recherche', 'projet', 'type de projet'],
  message: ['message', 'votre message', 'commentaire', 'commentaires', 'question', 'texte'],
  reference: ['reference du bien', 'reference', 'ref', 'ref.', 'reference de l annonce', 'reference annonce', 'ref. annonce', 'ref annonce', 'reference interne', 'numero de mandat', 'mandat'],
  annonce: ['annonce', 'titre de l annonce', 'titre', 'bien', 'bien concerne', 'annonce concernee'],
  portail: ['source', 'portail', 'passerelle', 'site', 'provenance', 'origine', 'site d origine'],
} as Record<Champ, string[]>)) for (const l of libelles) LIBELLES[l] = champ as Champ;

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const cle = (libelle: string) => sansAccents(libelle).toLowerCase().replace(/[’']/g, ' ').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
const borne = (v: string | undefined, max: number) => { const t = (v ?? '').replace(/\s+/g, ' ').trim(); return t ? t.slice(0, max) : null; };

/** Le portail d'où vient la demande, d'après l'expéditeur, le champ « source » ou le texte. */
export function portailDe(de: string, ...textes: (string | null | undefined)[]): Portail {
  const tout = [de, ...textes].join(' ').toLowerCase();
  if (/leboncoin|le bon coin/.test(tout)) return 'leboncoin';
  if (/seloger|se loger/.test(tout)) return 'seloger';
  return 'autre';
}

/** Les champs d'une notification, lus ligne à ligne « Libellé : valeur » ; un message peut courir sur plusieurs lignes. */
export function lireChamps(texte: string): Partial<Record<Champ, string>> {
  const champs: Partial<Record<Champ, string>> = {};
  let enCours: Champ | null = null;
  for (const brute of texte.split(/\r?\n/)) {
    const ligne = brute.replace(/^[>\s]+/, '').trimEnd();
    const m = /^([^:]{1,40}?)\s*:\s*(.*)$/.exec(ligne);
    const champ = m ? LIBELLES[cle(m[1])] : undefined;
    if (champ) {
      enCours = champ;
      if (!champs[champ]) champs[champ] = m![2].trim();
      else if (champ !== 'message') enCours = null;
      continue;
    }
    // Suite d'un message sur les lignes suivantes, jusqu'à une ligne vide suivie d'un autre libellé ou de la fin.
    if (enCours === 'message' && ligne.trim()) champs.message = `${champs.message ? `${champs.message}\n` : ''}${ligne.trim()}`;
    else if (!ligne.trim()) enCours = enCours === 'message' && champs.message ? null : enCours;
  }
  return champs;
}

/** Ce qu'on garde d'une notification lisible, ou null si on ne peut joindre personne (ni téléphone ni e-mail valables). */
export function lireDemande(de: string, sujet: string, texte: string): DemandePortail | null {
  const c = lireChamps(texte);
  const telephone = c.telephone ? telephoneSaisi(c.telephone) : null;
  const mail = (c.email ?? '').trim().toLowerCase().replace(/^mailto:/, '');
  const email = mail && emailValide(mail) && !mail.endsWith('@nettymail.com') ? mail : null;
  if (!telephone && !email) return null;
  let prenom = borne(c.prenom, 80), nom = borne(c.nom, 80);
  if (!prenom && !nom && c.nom_complet) {
    const mots = c.nom_complet.trim().split(/\s+/);
    prenom = borne(mots.slice(0, 1).join(' '), 80); nom = borne(mots.slice(1).join(' '), 80);
  }
  return {
    portail: portailDe(de, c.portail, sujet, texte), prenom, nom, telephone, email, ville: borne(c.ville, 80),
    message: c.message ? c.message.trim().slice(0, 1000) || null : null, reference: borne(c.reference, 60), annonce: borne(c.annonce, 120),
    raison: borne(c.raison, 120), recherche: borne(c.recherche, 120),
  };
}

const accepte = (de: string) => de === GMAIL_CONFIRMATION || DOMAINES.some((d) => de.endsWith(`@${d}`) || de.endsWith(`.${d}`));

/**
 * Revue de code 18.12 : l'en-tête From s'écrit librement. Seul est lu un e-mail transféré par la Gmail d'Anne : son
 * expéditeur d'enveloppe (SMTP) est l'adresse du réglage PORTAILS_EXPEDITEUR_AUTORISE, ou sa forme de transfert automatique
 * de Gmail (« avialtissot+caf_=demandes=…@gmail.com »). Exception : le message de confirmation du transfert, que Google envoie
 * lui-même (enveloppe en @google.com et From forwarding-noreply@google.com) ; il n'est jamais que « à lire à la main ».
 * Réglage vide ou absent : tout est refusé.
 */
export function enveloppeAutorisee(reglage: string | undefined, enveloppe: string | undefined, de: string): boolean {
  const attendue = (reglage ?? '').trim().toLowerCase();
  const env = (enveloppe ?? '').trim().toLowerCase();
  if (!attendue || !env) return false;
  if (de === GMAIL_CONFIRMATION) return env === GMAIL_CONFIRMATION || env.endsWith('@google.com');
  if (env === attendue) return true;
  const [local, domaine] = attendue.split('@');
  return !!local && !!domaine && env.endsWith(`@${domaine}`) && env.startsWith(`${local}+`);
}

async function empreinte(brut: string): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', Uint8Array.from(brut, (c) => c.charCodeAt(0) & 0xff)));
  return `sha256:${Array.from(h.slice(0, 16), (o) => o.toString(16).padStart(2, '0')).join('')}`;
}

export type Issue = 'refuse' | 'deja' | 'lu' | 'illisible' | 'opposition';

/**
 * Reçoit un e-mail (texte d'un caractère par octet). `taille` : taille annoncée par Cloudflare ; au-delà de TAILLE_MAX,
 * le corps n'est pas lu. Renvoie ce qui a été fait ; « refuse » demande au gestionnaire de rejeter le message.
 */
export async function recevoirCourriel(envE: EnvEspace, brut: string, taille: number, enveloppe?: string): Promise<Issue> {
  const env = envE as unknown as EnvSite;
  const gros = taille > TAILLE_MAX || brut.length > TAILLE_MAX;
  const c = lireCourriel(gros ? brut.slice(0, 64_000) : brut);
  if (!accepte(c.de)) { journal('portail_refuse', { domaine: c.de.split('@')[1] ?? '' }); return 'refuse'; }
  // Rien n'est gardé ni créé pour un e-mail refusé (ni ligne, ni carte, ni contact).
  if (!enveloppeAutorisee(envE.PORTAILS_EXPEDITEUR_AUTORISE, enveloppe, c.de)) {
    journal('portail_refuse', { motif: envE.PORTAILS_EXPEDITEUR_AUTORISE?.trim() ? 'enveloppe' : 'reglage_absent', domaine: (enveloppe ?? '').split('@')[1] ?? '' });
    return 'refuse';
  }
  const messageId = c.messageId ?? await empreinte(brut);
  if (await env.DB.prepare('SELECT 1 AS n FROM portail_courriel WHERE message_id = ?1').bind(messageId).first()) return 'deja';
  const recu = new Date().toISOString();
  const id = ulid();
  const portail = portailDe(c.de, c.sujet, gros ? '' : c.texte);
  /** Gardé pour être lu à la main, avec sa carte « Nouveaux ». */
  const garder = async (motif: string, avecTexte = true): Promise<Issue> => {
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO portail_courriel (id, recu_le, message_id, portail, etat, motif, expediteur, sujet, texte) VALUES (?1, ?2, ?3, ?4, 'illisible', ?5, ?6, ?7, ?8)
        ON CONFLICT (message_id) DO NOTHING`).bind(id, recu, messageId, portail, motif, c.de, c.sujet.slice(0, 200) || null, avecTexte ? c.texte.slice(0, TEXTE_GARDE) : null),
      env.DB.prepare(`INSERT INTO nouveau (id, source, recu_le, portail_courriel_id) SELECT ?1, 'portail', ?2, ?3 WHERE EXISTS (SELECT 1 FROM portail_courriel WHERE id = ?3)`).bind(ulid(), recu, id),
    ]);
    journal('portail_illisible', { motif, portail });
    return 'illisible';
  };
  if (c.de === GMAIL_CONFIRMATION) return garder('confirmation');
  if (gros) return garder('taille', false);
  const d = lireDemande(c.de, c.sujet, c.texte);
  if (!d) return garder('champs');
  const opp = await enOpposition(env, [d.telephone, d.email]);
  if (opp === 'sans_secret') return garder('opposition_inverifiable');
  if (opp === 'oui') {
    // Rien de la personne n'est gardé : seulement le portail et la référence du bien, pour que la carte le dise.
    await env.DB.batch([
      env.DB.prepare(`INSERT INTO portail_courriel (id, recu_le, message_id, portail, etat, motif) VALUES (?1, ?2, ?3, ?4, 'opposition', ?5) ON CONFLICT (message_id) DO NOTHING`)
        .bind(id, recu, messageId, d.portail, d.reference ? `Réf. ${d.reference}` : null),
      env.DB.prepare(`INSERT INTO nouveau (id, source, recu_le, portail_courriel_id) SELECT ?1, 'portail', ?2, ?3 WHERE EXISTS (SELECT 1 FROM portail_courriel WHERE id = ?3)`).bind(ulid(), recu, id),
    ]);
    journal('portail_opposition', { portail: d.portail });
    return 'opposition';
  }
  // La ligne d'abord, en « illisible » avec son texte et sa carte : si l'écriture du contact échoue ou s'interrompt,
  // l'e-mail reste à lire à la main. `pipeline` passe ensuite la ligne en « lu » et la carte sur le contact, en un lot.
  const [pris] = await env.DB.batch([
    env.DB.prepare(`INSERT INTO portail_courriel (id, recu_le, message_id, portail, etat, motif, expediteur, sujet, texte) VALUES (?1, ?2, ?3, ?4, 'illisible', 'en_cours', ?5, ?6, ?7)
      ON CONFLICT (message_id) DO NOTHING`).bind(id, recu, messageId, d.portail, c.de, c.sujet.slice(0, 200) || null, c.texte.slice(0, TEXTE_GARDE)),
    env.DB.prepare(`INSERT INTO nouveau (id, source, recu_le, portail_courriel_id) SELECT ?1, 'portail', ?2, ?3 WHERE EXISTS (SELECT 1 FROM portail_courriel WHERE id = ?3)`).bind(ulid(), recu, id),
  ]);
  if (!pris.meta.changes) return 'deja';
  try {
    await rattacherDemandePortail(env, d, id, recu, enProduction(env) ? 0 : 1);
  } catch (e) {
    journal('portail_echec', { detail: String(e).slice(0, 200) });
    await env.DB.prepare(`UPDATE portail_courriel SET motif = 'echec' WHERE id = ?1`).bind(id).run();
    return 'illisible';
  }
  journal('portail_lu', { portail: d.portail });
  return 'lu';
}

/** Tâche planifiée : texte d'un e-mail à lire à la main effacé une fois sa carte traitée (délai d'annulation passé) ;
 * lignes de plus de trois ans retirées (purge, AD-16, AD-31). */
export async function menagePortails(envE: EnvEspace): Promise<void> {
  const env = envE as unknown as EnvSite;
  const limite = new Date(Date.now() - ANNULATION_MS).toISOString();
  await env.DB.batch([
    env.DB.prepare(`UPDATE portail_courriel SET texte = NULL, sujet = NULL, expediteur = NULL
      WHERE texte IS NOT NULL AND id IN (SELECT portail_courriel_id FROM nouveau WHERE portail_courriel_id IS NOT NULL AND vu_le IS NOT NULL AND vu_le <= ?1)`).bind(limite),
    env.DB.prepare('DELETE FROM portail_courriel WHERE recu_le < ?1').bind(new Date(Date.now() - TROIS_ANS_MS).toISOString()),
  ]);
}
