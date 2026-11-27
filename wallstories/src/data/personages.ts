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
  feiten: [string, string][];
  uitspraak: string;
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
      'Eigenlijk heet hij Remmert van den Brandt. Maar omdat hij schildert als de oude meester, noemen alle kinderen hem Rembrandt 2.0. Hij heeft altijd een vlekje verf op zijn neus en zoekt zijn kwast terwijl die gewoon achter zijn oor zit.',
      'Het eerste wat hij ooit schilderde, was een boogvormig raam met een zon, een ster en heuvels: het verhalenraam. Elke muur die hij beschildert, wordt zo’n raam naar een andere wereld. En als het licht in de kamer uitgaat, gaat het verhaal aan.',
    ],
    feiten: [['Echte naam', 'Remmert van den Brandt'], ['Leeftijd', 'Ouder dan zijn baret, jonger dan zijn kwast'], ['Maatje', 'Penseel, een rode kater met witte sokjes'], ['Kracht', 'Schildert ramen naar andere werelden']],
    uitspraak: 'Elke muur heeft een verhaal. Je moet alleen goed kijken.',
    wereld: 'rembrandts-atelier',
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
      'Bella is acht en heeft een vliegeniersmuts, een koperen verrekijker en een luchtballon die Wolkje heet. Ze is nooit bang om te verdwalen, want verdwalen is gewoon ontdekken zonder plan. In haar reisdagboek tekent ze een kaart van elke wereld die ze bezoekt.',
      'Soms rent ze iets te hard vooruit. Dan leert ze weer dat je af en toe moet wachten op de goede wind. Kijk maar goed: in elke wereld zweeft Bella ergens in de lucht.',
    ],
    feiten: [['Leeftijd', '8 jaar'], ['Luchtballon', 'Wolkje'], ['Altijd bij zich', 'Verrekijker en reisdagboek'], ['Kracht', 'Brengt je van wereld naar wereld']],
    uitspraak: 'Verdwalen is gewoon ontdekken zonder plan!',
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
      'Kees is zes en gaat altijd als eerste. Hij telt elke avond de sterren en raakt altijd weer de tel kwijt. Met zijn raketrugzak vliegt hij naar plekken waar nog niemand is geweest.',
      'Zijn geheimpje: vroeger vond hij het donker eng. Daarom heeft hij een eigen sterretje in zijn zak, Flonker. Flonker geeft licht als je je dapper voelt, en Kees leent hem graag uit aan kinderen die het nodig hebben.',
    ],
    feiten: [['Leeftijd', '6 jaar'], ['In zijn zak', 'Flonker, een sterretje dat licht geeft'], ['Telt', 'Elke avond de sterren'], ['Kracht', 'Laat zien dat dapper zijn mag beginnen met een klein beetje']],
    uitspraak: 'Drie, twee, één… op avontuur!',
    wereld: 'ruimte',
    seoTitel: 'Kees Komeet – de kleine astronaut',
    metaBeschrijving: 'Maak kennis met Kees Komeet, de kleine astronaut van Wallstories. Ontdek zijn ruimtewereld, posters en muurstickers voor de kinderkamer.',
    alt: 'Kees Komeet, een lachend astronautje met raketrugzak dat zwaait',
  },
];

export const personageBySlug = (slug: string) => personages.find((p) => p.slug === slug);
