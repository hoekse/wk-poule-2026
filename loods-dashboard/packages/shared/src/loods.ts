// Vaste gegevens over de loods en vaste teksten voor de interface.
import type { BewegingType, Categorie, Telwijze, VerfStatus, Vulling } from './types';

/** Binnenmaat in meters. x langs de ladderwand, z langs de voorgevel. */
export const loods = {
  adres: 'Industrieweg 3-U, 8263 AA Kampen',
  breedte: 10.6, // x
  diepte: 9.4, // z
  hoogte: 3.6, // y (plafond, geschat)
} as const;

export const categorieen: { waarde: Categorie; label: string; prefix: string }[] = [
  { waarde: 'steiger', label: 'Steiger', prefix: 'ST' },
  { waarde: 'ladder', label: 'Ladder', prefix: 'LA' },
  { waarde: 'gereedschap', label: 'Gereedschap', prefix: 'GE' },
  { waarde: 'verf', label: 'Verf', prefix: 'VF' },
  { waarde: 'verbruik', label: 'Verbruik', prefix: 'VB' },
];

export const categorieLabel = (c: Categorie): string =>
  categorieen.find((x) => x.waarde === c)?.label ?? c;

export const telwijzen: { waarde: Telwijze; label: string; uitleg: string }[] = [
  { waarde: 'per_stuk', label: 'Per stuk', uitleg: 'Eigen nummer en QR-label, bijv. een ladder of boormachine' },
  { waarde: 'aantal', label: 'Aantal', uitleg: 'Eén label voor een stapel, bijv. 24 staanders of kit' },
];

export const bewegingLabels: Record<BewegingType, string> = {
  mee: 'Meegenomen',
  terug: 'Teruggebracht',
  correctie: 'Correctie',
  verbruikt: 'Verbruikt',
};

export const vullingen: { waarde: Vulling; label: string }[] = [
  { waarde: 'vol', label: 'Vol' },
  { waarde: '3/4', label: '¾' },
  { waarde: '1/2', label: '½' },
  { waarde: '1/4', label: '¼' },
];

export const glansgraden = ['Mat', 'Zijdemat', 'Zijdeglans', 'Hoogglans'] as const;

export const inhoudKeuzes = [0.5, 1, 2.5, 5, 10] as const;

export const verfMerken = ['Sikkens', 'Sigma', 'Wijzonol', 'Flexa', 'Histor', 'Trimetal', 'Herbol'] as const;

export const verfStatusLabels: Record<VerfStatus, string> = {
  aanwezig: 'Aanwezig',
  gebruikt: 'Gebruikt',
  afgevoerd: 'Afgevoerd',
};

/** Standaardzone voor restverf. */
export const restverfZone = 'D2';
