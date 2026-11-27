// Soorten foto's, namen voor onderdelen en eigen kleuren (bewaard op dit toestel).

export type Ruimte = { id: string; naam: string; buiten: boolean };

export const ruimtes: Ruimte[] = [
  { id: 'voorgevel', naam: 'Voorgevel', buiten: true },
  { id: 'achtergevel', naam: 'Achtergevel', buiten: true },
  { id: 'zijgevel', naam: 'Zijgevel', buiten: true },
  { id: 'woonkamer', naam: 'Woonkamer', buiten: false },
  { id: 'slaapkamer', naam: 'Slaapkamer', buiten: false },
  { id: 'keuken', naam: 'Keuken', buiten: false },
  { id: 'badkamer', naam: 'Badkamer', buiten: false },
  { id: 'kantoor', naam: 'Kantoor', buiten: false },
  { id: 'hal', naam: 'Hal / trap', buiten: false },
  { id: 'anders', naam: 'Anders', buiten: false },
];

export const onderdeelNamenBuiten = [
  'Kozijnen', 'Ramen', 'Voordeur', 'Achterdeur', 'Garagedeur', 'Boeiboord', 'Dakgoot', 'Windveren',
  'Dakkapel', 'Gevel', 'Plint', 'Luiken', 'Hekwerk', 'Schutting', 'Balkon',
];

export const onderdeelNamenBinnen = [
  'Muren', 'Accentmuur', 'Plafond', 'Deuren', 'Kozijnen', 'Plinten', 'Radiator', 'Trap', 'Trapleuning',
  'Kasten', 'Lambrisering', 'Balken',
];

export type GekozenKleur = {
  hex: string;
  /** Bijvoorbeeld "RAL 9001" of "Sikkens F6.05.80". */
  code?: string;
  naam?: string;
};

export function kleurLabel(k: GekozenKleur): string {
  return [k.code, k.naam].filter(Boolean).join(' ') || k.hex;
}

const SLEUTEL = 'kleurvoorbeeld.mijnKleuren';

/** Eigen kleuren (bijv. Sikkens- of Flexa-codes) blijven bewaard op dit toestel. */
export function leesMijnKleuren(): GekozenKleur[] {
  try {
    const v = JSON.parse(localStorage.getItem(SLEUTEL) ?? '[]');
    return Array.isArray(v) ? v.filter((k) => typeof k?.hex === 'string') : [];
  } catch {
    return [];
  }
}

export function bewaarMijnKleur(k: GekozenKleur): GekozenKleur[] {
  const lijst = [k, ...leesMijnKleuren().filter((x) => !(x.hex === k.hex && (x.code ?? '') === (k.code ?? '')))].slice(0, 40);
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(lijst));
  } catch {
    /* opslag vol of uitgeschakeld: dan alleen voor nu */
  }
  return lijst;
}

export function verwijderMijnKleur(k: GekozenKleur): GekozenKleur[] {
  const lijst = leesMijnKleuren().filter((x) => !(x.hex === k.hex && (x.code ?? '') === (k.code ?? '')));
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(lijst));
  } catch {
    /* negeren */
  }
  return lijst;
}
