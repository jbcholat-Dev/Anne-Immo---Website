// Journaux du serveur (Conventions) : JSON structuré, sans donnée personnelle.
// Une adresse e-mail n'apparaît que sous forme d'empreinte (SHA-256 tronquée), qui permet de relier deux lignes
// du journal sans pouvoir retrouver l'adresse.

export async function empreinte(texte: string): Promise<string> {
  const octets = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte.trim().toLowerCase()));
  return Array.from(new Uint8Array(octets).slice(0, 8), (o) => o.toString(16).padStart(2, '0')).join('');
}

export function journal(evenement: string, details: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ evenement, ...details, a: new Date().toISOString() }));
}
