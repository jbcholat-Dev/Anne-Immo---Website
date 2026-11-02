// Espace de gestion des demandes du site (story 10.7) : les lectures et écritures viennent de gestion-donnees.ts,
// partagé avec l'application espace/ (story 13.3) ; ici seulement l'envoi immédiat d'un rejeu, par le module unique delivery.ts.
import { diffuser } from './delivery';
import type { EnvSite } from './env';
import { programmerRejeu } from './gestion-donnees';

export * from './gestion-donnees';

/** Relance un envoi en échec (ou bloqué après 5 essais) : compteur remis à zéro, puis envoi immédiat par delivery.ts. */
export async function rejouerEnvoi(env: EnvSite, id: string, canal: string, compte: string): Promise<boolean> {
  if (!(await programmerRejeu(env, id, canal, compte))) return false;
  await diffuser(env, id);
  return true;
}
