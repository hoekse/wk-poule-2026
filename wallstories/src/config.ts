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
  levertijd: { maatwerk: '3–5 werkdagen', standaard: '2–4 werkdagen' },
} as const;

/**
 * Aanbrengservice via partner Multiwalls: € 75 per uur excl. btw.
 * Consumenten zien de prijs incl. 21% btw (wettelijk verplicht). Geldt het 9%-tarief voor arbeid
 * in woningen ouder dan 2 jaar? Laat de boekhouder dat bevestigen en pas dan tariefTekst aan.
 */
export const aanbrengen = {
  actief: true,
  partner: 'Multiwalls',
  partnerUrl: 'https://www.multiwalls.nl',
  uurtariefExclBtwCent: 7500,
  tariefTekst: '€ 90,75 per uur incl. btw (€ 75 excl. btw), exclusief reiskosten',
  tariefZakelijk: '€ 75 per uur excl. btw, exclusief reiskosten',
  regio: 'Kampen, Zwolle, Dronten, Lelystad, Hattem en omgeving; elders in Nederland op aanvraag',
} as const;

/**
 * Productspecificaties zoals ze op de site staan – afgestemd op de materialen van drukpartner Probo
 * (ProVlies mat, WalltexPro, Gekkotex, FSC-posterpapier). Bij een ander materiaal: hier aanpassen.
 */
export const specs = [
  'Pvc-vrij en brandvertragend',
  'Vlies mat: 200 g/m², FSC-gecertificeerd, genummerde banen die naad-op-naad aansluiten',
  'Textiel naadloos: in één stuk tot 290 cm hoog, geurloze inkt op waterbasis',
  'Plak-de-muur-methode: lijm op de muur, niet op het behang',
  'Later droog in zijn geheel van de muur te halen',
] as const;
