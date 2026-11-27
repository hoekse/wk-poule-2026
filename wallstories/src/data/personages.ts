import type { BeeldSleutel } from '@/lib/beelden';

export type Personage = {
  slug: string;
  naam: string;
  rol: string;
  kaartKleur: string;
  beeld: BeeldSleutel;
  kort: string;
  verhaal: string[];
  wereld?: string;
  seoTitel: string;
  metaBeschrijving: string;
  alt: string;
};

export const personages: Personage[] = [
  {
    slug: 'rembrandt-2-0',
    naam: 'Rembrandt 2.0',
    rol: 'De meesterverteller',
    kaartKleur: '#EFE7DA',
    beeld: 'personage-rembrandt-2-0',
    kort: 'Hij schildert verhalen op muren en brengt werelden tot leven met zijn magische kwast.',
    verhaal: [
      'Rembrandt 2.0 heeft de grootste kwast van het land – en de meeste verf op zijn jas. Elke muur is voor hem een leeg boek dat wacht op een verhaal.',
      'Waar hij schildert, gebeurt iets bijzonders: walvissen gaan vliegen, kastelen groeien uit de heuvels en raketten vertrekken naar de sterren. Hij is de verteller achter alle werelden van Wallstories.',
    ],
    wereld: 'rembrandt-museum',
    seoTitel: 'Rembrandt 2.0 – de meesterverteller',
    metaBeschrijving: 'Maak kennis met Rembrandt 2.0, de schilder die verhalen op muren tovert. Ontdek zijn wereld, posters en muurstickers voor de kinderkamer.',
    alt: 'Rembrandt 2.0, een vriendelijke oude schilder met baret, kwast en palet',
  },
  {
    slug: 'bella-ballon',
    naam: 'Bella Ballon',
    rol: 'De ontdekker',
    kaartKleur: '#F2E9DE',
    beeld: 'personage-bella-ballon',
    kort: 'Zij vliegt naar plekken die niemand anders ziet en vindt de mooiste avonturen.',
    verhaal: [
      'Bella Ballon heeft een vliegeniersmuts, een verrekijker en een luchtballon in alle kleuren van de regenboog. Ze is nooit bang om te verdwalen – want verdwalen is gewoon ontdekken zonder plan.',
      'Je vindt haar boven het sprookjeskasteel, naast de vliegende walvis en soms gewoon boven het bed van een kind dat droomt van verre reizen.',
    ],
    wereld: 'sprookjes',
    seoTitel: 'Bella Ballon – de ontdekker in de luchtballon',
    metaBeschrijving: 'Maak kennis met Bella Ballon, de ontdekker in de luchtballon. Ontdek haar verhaal, posters en muurstickers voor de kinderkamer.',
    alt: 'Bella Ballon, een meisje met vliegeniersmuts dat zwaait vanuit een gestreepte luchtballon',
  },
  {
    slug: 'kees-komeet',
    naam: 'Kees Komeet',
    rol: 'De avonturier',
    kaartKleur: '#DCE7EE',
    beeld: 'personage-kees-komeet',
    kort: 'Hij schiet door de ruimte en gaat altijd als eerste op ontdekkingstocht.',
    verhaal: [
      'Kees Komeet past precies in zijn ruimtepak en heeft een raketrugzak die nooit leeg raakt. Hij telt de sterren elke avond – en raakt altijd weer de tel kwijt.',
      'Hij is de held van de ruimtewereld en het favoriete maatje van iedereen die graag weet wat er achter de maan zit.',
    ],
    wereld: 'ruimte',
    seoTitel: 'Kees Komeet – de kleine astronaut',
    metaBeschrijving: 'Maak kennis met Kees Komeet, de kleine astronaut van Wallstories. Ontdek zijn ruimtewereld, posters en muurstickers voor de kinderkamer.',
    alt: 'Kees Komeet, een lachend astronautje met raketrugzak dat zwaait',
  },
];

export const personageBySlug = (slug: string) => personages.find((p) => p.slug === slug);
