/**
 * Eén bron van waarheid voor prijzen. Wordt gebruikt door:
 *  - de configurator/winkelwagen in de browser (weergave), én
 *  - de API bij het afrekenen (herberekening – client-prijzen worden nooit vertrouwd).
 * Alle bedragen in centen, inclusief 21% btw.
 */
import { winkel } from '@/config';

export const tarieven = {
  fotobehang: {
    // Afgestemd op drukpartner Probo: ProVlies mat (banen) en WalltexPro (naadloos textiel, max. 290 cm hoog)
    materialen: {
      'vlies-mat': { naam: 'Vlies mat', sub: 'in banen van 53 cm', m2Cent: 4495, baanCm: 53, maxHoogteCm: 400 },
      'textiel-naadloos': { naam: 'Textiel naadloos', sub: 'in één stuk, geurloos', m2Cent: 5995, baanCm: 0, maxHoogteCm: 290 },
    },
    minM2: 3,
    naamCent: 1495,
    grenzen: { minCm: 50, maxBreedteCm: 1000, maxHoogteCm: 400 },
    overmaatCm: 5,
    baanbreedteCm: 53,
  },
  behangcirkel: { maten: { '70': 4995, '100': 6995, '125': 8995 } },
  poster: { maten: { '30x40': 1995, '50x70': 2995, '70x100': 4495 }, naamCent: 995 },
  muursticker: { maten: { s: 1995, l: 3495 } },
  naamsticker: { kleuren: ['diep-groen', 'koraal', 'zon-geel', 'lichtblauw', 'munt'] as const, prijsCent: 2495 },
  proefstaal: { prijsCent: 395 },
} as const;

export type MateriaalKey = keyof typeof tarieven.fotobehang.materialen;
export type CirkelMaat = keyof typeof tarieven.behangcirkel.maten;
export type PosterMaat = keyof typeof tarieven.poster.maten;
export type StickerMaat = keyof typeof tarieven.muursticker.maten;

export const maatLabels: Record<string, string> = {
  '70': 'Ø 70 cm', '100': 'Ø 100 cm', '125': 'Ø 125 cm',
  '30x40': '30 × 40 cm', '50x70': '50 × 70 cm', '70x100': '70 × 100 cm',
  s: 'Set S – 1 vel A3', l: 'Set L – 2 vellen A2',
};

export type Config =
  | { type: 'fotobehang'; breedte: number; hoogte: number; materiaal: MateriaalKey; naam?: string; uitsnede?: number }
  | { type: 'behangcirkel'; maat: CirkelMaat }
  | { type: 'poster'; maat: PosterMaat; naam?: string }
  | { type: 'muursticker'; maat: StickerMaat }
  | { type: 'naamsticker'; naam: string; kleur: (typeof tarieven.naamsticker.kleuren)[number] }
  | { type: 'proefstaal' };

export const NAAM_MAX = 14;
const NAAM_RE = /^[\p{L}][\p{L} '\-]{0,13}$/u;

export function schoneNaam(n: unknown): string | undefined {
  if (typeof n !== 'string') return undefined;
  const s = n.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!s) return undefined;
  if (s.length > NAAM_MAX || !NAAM_RE.test(s)) throw new PrijsFout('Een naam mag maximaal 14 letters bevatten (spaties, - en \' toegestaan).');
  return s;
}

export class PrijsFout extends Error {}

/** Oppervlakte in m², naar boven afgerond op 0,1 m², met minimum. */
export function m2(breedteCm: number, hoogteCm: number): number {
  const ruw = (breedteCm * hoogteCm) / 10000;
  return Math.max(tarieven.fotobehang.minM2, Math.ceil(ruw * 10 - 1e-9) / 10);
}

export function aantalBanen(breedteCm: number, materiaal: MateriaalKey = 'vlies-mat') {
  const baan = tarieven.fotobehang.materialen[materiaal].baanCm;
  return baan ? Math.ceil((breedteCm + 2 * tarieven.fotobehang.overmaatCm) / baan) : 1;
}

const isInt = (v: unknown, min: number, max: number) => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;

/** Valideert een configuratie en geeft de stukprijs + leesbare omschrijving terug. Gooit PrijsFout bij ongeldige invoer. */
export function prijsVoor(c: Config): { cent: number; regels: string[]; maatwerk: boolean; config: Config } {
  switch (c?.type) {
    case 'fotobehang': {
      const t = tarieven.fotobehang;
      if (!isInt(c.breedte, t.grenzen.minCm, t.grenzen.maxBreedteCm)) throw new PrijsFout(`Breedte moet tussen ${t.grenzen.minCm} en ${t.grenzen.maxBreedteCm} cm liggen.`);
      if (!isInt(c.hoogte, t.grenzen.minCm, t.grenzen.maxHoogteCm)) throw new PrijsFout(`Hoogte moet tussen ${t.grenzen.minCm} en ${t.grenzen.maxHoogteCm} cm liggen.`);
      const mat = t.materialen[c.materiaal];
      if (!mat) throw new PrijsFout('Onbekend materiaal.');
      if (c.hoogte > mat.maxHoogteCm) throw new PrijsFout(`${mat.naam} kan tot ${mat.maxHoogteCm} cm hoog. Kies vlies mat voor hogere muren.`);
      const naam = schoneNaam(c.naam);
      const opp = m2(c.breedte, c.hoogte);
      const uitsnede = typeof c.uitsnede === 'number' ? Math.min(100, Math.max(0, Math.round(c.uitsnede))) : 50;
      const cent = Math.round(opp * mat.m2Cent) + (naam ? t.naamCent : 0);
      return {
        cent, maatwerk: true,
        config: { type: 'fotobehang', breedte: c.breedte, hoogte: c.hoogte, materiaal: c.materiaal, naam, uitsnede },
        regels: [`${c.breedte} × ${c.hoogte} cm (${opp.toLocaleString('nl-NL', { minimumFractionDigits: 1 })} m²)`, `${mat.naam}, ${mat.sub}`, ...(naam ? [`Met naam: ${naam}`] : [])],
      };
    }
    case 'behangcirkel': {
      const cent = tarieven.behangcirkel.maten[c.maat];
      if (!cent) throw new PrijsFout('Onbekende maat.');
      return { cent, maatwerk: false, config: { type: 'behangcirkel', maat: c.maat }, regels: [maatLabels[c.maat]] };
    }
    case 'poster': {
      const basis = tarieven.poster.maten[c.maat];
      if (!basis) throw new PrijsFout('Onbekende maat.');
      const naam = schoneNaam(c.naam);
      return {
        cent: basis + (naam ? tarieven.poster.naamCent : 0), maatwerk: !!naam,
        config: { type: 'poster', maat: c.maat, naam }, regels: [maatLabels[c.maat], ...(naam ? [`Met naam: ${naam}`] : [])],
      };
    }
    case 'muursticker': {
      const cent = tarieven.muursticker.maten[c.maat];
      if (!cent) throw new PrijsFout('Onbekende maat.');
      return { cent, maatwerk: false, config: { type: 'muursticker', maat: c.maat }, regels: [maatLabels[c.maat]] };
    }
    case 'naamsticker': {
      const naam = schoneNaam(c.naam);
      if (!naam) throw new PrijsFout('Vul een naam in.');
      if (!tarieven.naamsticker.kleuren.includes(c.kleur)) throw new PrijsFout('Onbekende kleur.');
      return { cent: tarieven.naamsticker.prijsCent, maatwerk: true, config: { type: 'naamsticker', naam, kleur: c.kleur }, regels: [`Naam: ${naam}`, `Kleur: ${c.kleur.replace('-', ' ')}`] };
    }
    case 'proefstaal':
      return { cent: tarieven.proefstaal.prijsCent, maatwerk: false, config: { type: 'proefstaal' }, regels: ['A4-proefstaal van deze wereld op vlies mat'] };
    default:
      throw new PrijsFout('Onbekend producttype.');
  }
}

export function verzendkosten(subtotaalCent: number) {
  return subtotaalCent === 0 || subtotaalCent >= winkel.gratisVerzendingVanafCent ? 0 : winkel.verzendkostenCent;
}

export const euro = (cent: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(cent / 100);

/** "Vanaf"-prijs per producttype (voor kaarten, schema.org en feeds). */
export const vanafCent = {
  fotobehang: tarieven.fotobehang.materialen['vlies-mat'].m2Cent * tarieven.fotobehang.minM2,
  behangcirkel: tarieven.behangcirkel.maten['70'],
  poster: tarieven.poster.maten['30x40'],
  muursticker: tarieven.muursticker.maten.s,
  naamsticker: tarieven.naamsticker.prijsCent,
  proefstaal: tarieven.proefstaal.prijsCent,
} as const;
