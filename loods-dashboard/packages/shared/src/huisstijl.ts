// Huisstijl Hoeksema Schilderwerken (zie CLAUDE.md, hoofdstuk 8).

export const kleuren = {
  donker: '#2D2E32',
  grijs: '#646464',
  antraciet: '#636466',
  rood: '#DC0014',
  geel: '#F0B400',
  groen: '#8CB400',
  blauw: '#008CDC',
} as const;

/** Volgorde van de vier blokjes in het logo-kenmerk. */
export const logoBlokjes = [kleuren.rood, kleuren.geel, kleuren.blauw, kleuren.groen] as const;

export const lettertype = '"Square 721", "Square 721 BT", "Square721 BT", "Eurostile", "Arial", sans-serif';

/** Vaste avatarkleuren (tv). Nieuwe medewerkers kiezen hun kleur in Beheer. */
export const medewerkerKleuren: Record<string, string> = {
  Raymond: kleuren.blauw,
  Lesley: kleuren.groen,
  Bas: kleuren.geel,
  Dennis: kleuren.rood,
};

export type StatusKleur = 'groen' | 'geel' | 'rood' | 'grijs';

export const statusKleuren: Record<StatusKleur, { hex: string; tekst: string }> = {
  groen: { hex: kleuren.groen, tekst: 'Compleet aanwezig' },
  geel: { hex: kleuren.geel, tekst: 'Deels onderweg' },
  rood: { hex: kleuren.rood, tekst: 'Leeg of onder minimum' },
  grijs: { hex: '#8A8B90', tekst: 'Geen voorraad' },
};

/** Kleur van een "ladder-sporten"-meter: groen ≥ 90 %, geel ≥ 60 %, anders rood. */
export function meterKleur(aandeel: number): string {
  if (aandeel >= 0.9) return kleuren.groen;
  if (aandeel >= 0.6) return kleuren.geel;
  return kleuren.rood;
}
