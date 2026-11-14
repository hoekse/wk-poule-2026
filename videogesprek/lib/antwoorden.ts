import lijst from '@/data/antwoorden.json';
import instellingen from '@/data/instellingen.json';

export type Item = {
  id: string;
  clip: string;
  vragen: string[];
  antwoordtekst: string;
};

/** Vaste clips naast de antwoorden. Staan in /public/clips. */
export const SPECIALE_CLIPS = {
  idle: 'idle.mp4',
  begroeting: 'begroeting.mp4',
  onbekend: 'onbekend.mp4',
} as const;

export const ITEMS: Item[] = lijst as Item[];
export const NAAM: string = instellingen.naam;
export const FOTO: string = `/${instellingen.foto}`;

export const clipUrl = (bestand: string) => `/clips/${bestand}`;

/** Wat de server terugstuurt na een vraag. */
export type Keuze =
  | { soort: 'antwoord'; id: string; zekerheid: number }
  | { soort: 'onbekend'; zekerheid: number }
  /** Geen echte vraag gehoord (ruis, kuchje): niets afspelen, verder luisteren. */
  | { soort: 'stil' };

export type KeuzeAntwoord = Keuze & {
  tekst: string;
  bron: 'snel' | 'claude' | 'lokaal' | 'leeg' | 'fout';
  ms: number;
};
