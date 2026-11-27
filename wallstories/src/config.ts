/**
 * Centrale merk- en winkelinstellingen.
 * Alles wat met de merknaam, contactgegevens en winkelbeleid te maken heeft staat HIER,
 * zodat een eventuele naamswijziging (zie strategisch plan: merkcheck) één aanpassing is.
 */
export const merk = {
  naam: 'Wallstories Kids',
  korteNaam: 'Wallstories',
  tagline: 'Verhalen voor kleine dromers',
  domein: 'wallstories.nl',
  email: 'hallo@wallstories.nl', // TODO: bevestigen
  telefoon: '', // TODO: invullen of leeg laten
  kvk: '[KvK-nummer]',
  btw: '[Btw-nummer]',
  adres: { straat: '[Straat + nr]', postcode: '[Postcode]', plaats: '[Plaats]', land: 'NL' },
  social: {
    instagram: 'https://www.instagram.com/wallstorieskids', // TODO: account claimen
    pinterest: 'https://www.pinterest.com/wallstorieskids', // TODO: account claimen
  },
} as const;

export const winkel = {
  valuta: 'EUR',
  btwPercentage: 21,
  verzendkostenCent: 495,
  gratisVerzendingVanafCent: 5000,
  landen: ['NL'] as const,
  levertijd: { maatwerk: '5–7 werkdagen', standaard: '2–4 werkdagen' },
  /** Optionele dienst: aanbrengen door een vakschilder. Zet op false als je dit (nog) niet aanbiedt. */
  aanbrengservice: true,
} as const;

/**
 * Productspecificaties zoals ze op de site staan.
 * ⚠️ Laten bevestigen door de drukpartner vóór livegang (misleidende claims = ACM-risico).
 */
export const specs = [
  'PVC-vrij vliesbehang',
  'Papier uit verantwoord beheerde bossen (FSC)',
  'Watergedragen latexinkt, geurarm',
  'Plak-de-muur-methode: lijm op de muur, niet op het behang',
  'Droog afneembaar bij verwijderen',
] as const;
