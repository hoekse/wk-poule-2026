import type { BeeldSleutel } from '@/lib/beelden';

export type Wereld = {
  slug: string;
  naam: string;
  verhaal: string; // titel van het verhaal (productnaam)
  personage?: string;
  beeld: BeeldSleutel;
  /** focuspunt voor staande uitsneden (object-position) */
  focus: string;
  kleur: string; // accentkleur voor de wereld
  seoTitel: string; // max ~55 tekens, merknaam wordt toegevoegd
  metaBeschrijving: string;
  h1: string;
  intro: string;
  alineas: string[];
  zoekwoorden: string[];
  alt: string;
};

export const werelden: Wereld[] = [
  {
    slug: 'rembrandt-museum',
    naam: 'Rembrandt Museum',
    verhaal: 'De magische kwast van Rembrandt',
    personage: 'rembrandt-2-0',
    beeld: 'rembrandt-museum',
    focus: '47% 50%',
    kleur: '#C8963E',
    seoTitel: 'Kunst in de kinderkamer: Rembrandt Museum behang',
    metaBeschrijving: 'Breng kunst naar de kinderkamer: fotobehang, posters en behangcirkels uit het Rembrandt Museum van Wallstories Kids. Op maat gemaakt, PVC-vrij.',
    h1: 'Kunst in de kinderkamer: het Rembrandt Museum',
    intro: 'In een zaal vol gouden lijsten werkt Rembrandt 2.0 aan zijn mooiste schilderij. Wie goed kijkt, ziet de molens draaien en de portretten knipogen.',
    alineas: [
      'Kinderen die opgroeien tussen kunst, leren vanzelf kijken. In deze wereld nodigt Rembrandt 2.0 – onze meesterverteller – je kind uit in zijn atelier vol warme tinten, molens en stillevens.',
      'De wereld past prachtig bij hout, linnen en okerkleuren en groeit makkelijk mee van babykamer tot tienerkamer.',
    ],
    zoekwoorden: ['kunst kinderkamer', 'museum behang', 'oude meesters kinderkamer'],
    alt: 'Illustratie van een vriendelijke oude schilder met baret en palet in een gouden museumzaal vol schilderijen',
  },
  {
    slug: 'onderwater',
    naam: 'Onderwater',
    verhaal: 'Op reis met de grote walvis',
    beeld: 'onderwater',
    focus: '55% 50%',
    kleur: '#4F8FA6',
    seoTitel: 'Onderwater behang kinderkamer – walvis & oceaan',
    metaBeschrijving: 'Duik de oceaan in met een vriendelijke walvis: onderwater fotobehang op maat, behangcirkels en posters voor de kinderkamer. PVC-vrij en op maat geprint.',
    h1: 'Onderwater behang voor de kinderkamer',
    intro: 'Diep onder de golven zwemt een reuzenwalvis met een klein duikertje aan zijn zij. Samen ontdekken ze koraal, schildpadden en scholen zilveren visjes.',
    alineas: [
      'Blauwgroene tinten zijn rustgevend – ideaal voor een slaapkamer. Deze wereld brengt die rust naar de muur, met genoeg details om elke avond iets nieuws te ontdekken.',
      'Combineer met een behangcirkel van de walvis boven het bedje of een poster in de speelhoek.',
    ],
    zoekwoorden: ['onderwater behang', 'oceaan behang kinderkamer', 'walvis behang'],
    alt: 'Illustratie van een grote vriendelijke walvis en een klein duikertje tussen koraal en vissen',
  },
  {
    slug: 'ruimte',
    naam: 'Ruimte',
    verhaal: 'Kees Komeet en de sterrenraket',
    personage: 'kees-komeet',
    beeld: 'ruimte',
    focus: '50% 50%',
    kleur: '#26365E',
    seoTitel: 'Ruimte behang kinderkamer – planeten & raketten',
    metaBeschrijving: 'Ruimte behang voor de kinderkamer met Kees Komeet, raketten en planeten. Fotobehang op exacte muurmaat, behangcirkels, posters en stickers.',
    h1: 'Ruimte behang voor de kinderkamer',
    intro: 'Kees Komeet zwaait vanaf de maan. Zijn raket staat klaar, de planeten draaien en overal fonkelen gouden sterren.',
    alineas: [
      'Diep nachtblauw met warm goud: een combinatie die avontuurlijk is én rustig genoeg om bij in slaap te vallen.',
      'Maak het af met muurstickers van Kees Komeet rond de deur of een poster met de naam van je kleine astronaut.',
    ],
    zoekwoorden: ['ruimte behang kinderkamer', 'planeten behang', 'astronaut behang'],
    alt: 'Illustratie van astronautje Kees Komeet die zwaait naast een raket tussen planeten en sterren',
  },
  {
    slug: 'dino',
    naam: 'Dino',
    verhaal: 'Het dal van de vrolijke dino’s',
    beeld: 'dino',
    focus: '58% 50%',
    kleur: '#6F8A4E',
    seoTitel: 'Dinosaurus behang kinderkamer – vrolijke dino’s',
    metaBeschrijving: 'Dinosaurus behang voor de kinderkamer: een vrolijke T-rex, babydino’s en een rokende vulkaan. Fotobehang op maat, behangcirkels en posters.',
    h1: 'Dinosaurus behang voor de kinderkamer',
    intro: 'In een groen dal vol varens en palmbomen speelt een vrolijke T-rex met twee babydino’s. In de verte rookt een vulkaan.',
    alineas: [
      'Dino’s blijven favoriet bij kinderen van twee tot tien. Deze wereld is stoer en vriendelijk tegelijk – nergens eng, overal iets te ontdekken.',
      'Warm groen en zand passen bij naturel hout en rotan, en de wereld groeit mee tot ver in de basisschooltijd.',
    ],
    zoekwoorden: ['dinosaurus behang', 'dino fotobehang', 'dino kinderkamer'],
    alt: 'Illustratie van een vrolijke groene T-rex en babydino’s in een groen dal met een vulkaan',
  },
  {
    slug: 'bouwplaats',
    naam: 'Bouwplaats',
    verhaal: 'De grote graafdag',
    beeld: 'bouwplaats',
    focus: '47% 50%',
    kleur: '#E2A93B',
    seoTitel: 'Bouwplaats behang – graafmachine & kiepwagen',
    metaBeschrijving: 'Bouwplaats behang voor de kinderkamer met graafmachine, kiepwagen en kraan. Fotobehang op maat, posters en behangcirkels van Wallstories Kids.',
    h1: 'Bouwplaats behang voor de kinderkamer',
    intro: 'Vandaag is het graafdag. De gele graafmachine schept, de kiepwagen rijdt af en aan en de kraan tilt de zwaarste balken.',
    alineas: [
      'Voor kinderen die elke graafmachine op straat aanwijzen. Een vrolijke, warme wereld vol machines – zonder dat het druk wordt op de muur.',
      'Mooi in combinatie met okergeel, zandtinten en groen.',
    ],
    zoekwoorden: ['bouwplaats behang', 'graafmachine behang', 'werkauto behang'],
    alt: 'Illustratie van een gele graafmachine, kiepwagen en kraan op een bouwplaats tussen groene heuvels',
  },
  {
    slug: 'sprookjes',
    naam: 'Sprookjes',
    verhaal: 'Het kasteel achter de heuvels',
    personage: 'bella-ballon',
    beeld: 'sprookjes',
    focus: '47% 50%',
    kleur: '#E58F86',
    seoTitel: 'Sprookjes behang kinderkamer – kasteel & bloemen',
    metaBeschrijving: 'Sprookjes behang voor de kinderkamer: een pastelkasteel, bloemenweides en luchtballonnen. Fotobehang op maat, behangcirkels en posters.',
    h1: 'Sprookjes behang voor de kinderkamer',
    intro: 'Achter de heuvels staat een kasteel met roze en blauwe torens. Een meisje loopt over het bloemenpad, en hoog in de lucht zweeft Bella Ballon voorbij.',
    alineas: [
      'Zachte pasteltinten en een kronkelpad dat uitnodigt om verhalen te verzinnen. Romantisch zonder zoet te worden.',
      'Prachtig in een babykamer en net zo mooi in een kamer van een kind van acht.',
    ],
    zoekwoorden: ['sprookjes behang', 'kasteel behang', 'prinsessen behang'],
    alt: 'Illustratie van een pastelkleurig sprookjeskasteel op een heuvel met een meisje op een bloemenpad',
  },
];

export const wereldBySlug = (slug: string) => werelden.find((w) => w.slug === slug);
