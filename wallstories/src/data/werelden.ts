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
    slug: 'rembrandts-atelier',
    naam: 'Rembrandts Atelier',
    verhaal: 'De magische kwast van Rembrandt',
    personage: 'rembrandt-2-0',
    beeld: 'rembrandts-atelier',
    focus: '66% 50%',
    kleur: '#C8963E',
    seoTitel: 'Kunst in de kinderkamer: Rembrandts Atelier',
    metaBeschrijving: 'Breng kunst naar de kinderkamer: fotobehang, posters en behangcirkels uit Rembrandts Atelier van Wallstories Kids. Op maat gemaakt, pvc-vrij.',
    h1: 'Kunst in de kinderkamer: Rembrandts Atelier',
    intro: 'In zijn atelier vol gouden lijsten staat Rembrandt 2.0 voor een leeg raam. Door het verhalenraam zweven Bella Ballon en Kees Komeet naar binnen, en ergens tussen de verfpotten verstopt kater Penseel zich.',
    alineas: [
      'Kinderen die opgroeien tussen kunst, leren vanzelf kijken. In deze wereld nodigt Rembrandt 2.0 – onze meesterverteller – je kind uit in zijn atelier vol warme tinten, molens en stillevens.',
      'De wereld past prachtig bij hout, linnen en okerkleuren en groeit makkelijk mee van babykamer tot tienerkamer.',
    ],
    zoekwoorden: ['kunst kinderkamer', 'schilderij behang kinderkamer', 'oude meesters kinderkamer'],
    alt: 'Illustratie van Rembrandt 2.0 met palet in zijn atelier vol gouden lijsten; door een boogvenster zweven Bella Ballon en Kees Komeet naar binnen',
  },
  {
    slug: 'onderwater',
    naam: 'Onderwater',
    verhaal: 'Op reis met de grote walvis',
    beeld: 'onderwater',
    focus: '50% 50%',
    kleur: '#4F8FA6',
    seoTitel: 'Onderwater behang kinderkamer – walvis & oceaan',
    metaBeschrijving: 'Duik de oceaan in met een vriendelijke walvis: onderwater fotobehang op maat, behangcirkels en posters voor de kinderkamer. PVC-vrij en op maat geprint.',
    h1: 'Onderwater behang voor de kinderkamer',
    intro: 'Diep onder de golven zingt walvis Walter zijn laagste slaapliedje. Duikje zwemt mee naar de koraalboog, waar een schelp een zeegroene parel bewaart.',
    alineas: [
      'Blauwgroene tinten zijn rustgevend – ideaal voor een slaapkamer. Deze wereld brengt die rust naar de muur, met genoeg details om elke avond iets nieuws te ontdekken.',
      'Combineer met een behangcirkel van de walvis boven het bedje of een poster in de speelhoek.',
    ],
    zoekwoorden: ['onderwater behang', 'oceaan behang kinderkamer', 'walvis behang'],
    alt: 'Illustratie van walvis Walter en duikertje Duikje onder water, bij een koraalboog met een schelp en een zeegroene parel',
  },
  {
    slug: 'ruimte',
    naam: 'Ruimte',
    verhaal: 'Kees Komeet en de sterrenraket',
    personage: 'kees-komeet',
    beeld: 'ruimte',
    focus: '52% 50%',
    kleur: '#26365E',
    seoTitel: 'Ruimte behang kinderkamer – planeten & raketten',
    metaBeschrijving: 'Ruimte behang voor de kinderkamer met Kees Komeet, raketten en planeten. Fotobehang op exacte muurmaat, behangcirkels, posters en stickers.',
    h1: 'Ruimte behang voor de kinderkamer',
    intro: 'Kees Komeet zwaait vanuit de sterrenhemel, met Flonker, zijn eigen sterretje, in zijn hand. Zijn zilveren raket staat klaar en een boog van sterren wijst de weg.',
    alineas: [
      'Diep nachtblauw met warm goud: een combinatie die avontuurlijk is én rustig genoeg om bij in slaap te vallen.',
      'Maak het af met muurstickers van Kees Komeet rond de deur of een poster met de naam van je kleine astronaut.',
    ],
    zoekwoorden: ['ruimte behang kinderkamer', 'planeten behang', 'astronaut behang'],
    alt: 'Illustratie van astronautje Kees Komeet met het lichtgevende sterretje Flonker, een zilveren raket en een boog van sterren',
  },
  {
    slug: 'dino',
    naam: 'Dino',
    verhaal: 'Het dal van de vrolijke dino’s',
    beeld: 'dino',
    focus: '40% 50%',
    kleur: '#6F8A4E',
    seoTitel: 'Dinosaurus behang kinderkamer – vrolijke dino’s',
    metaBeschrijving: 'Dinosaurus behang voor de kinderkamer: een vrolijke T-rex, babydino’s en een rokende vulkaan. Fotobehang op maat, behangcirkels en posters.',
    h1: 'Dinosaurus behang voor de kinderkamer',
    intro: 'In een groen dal vol varens staat Rex op zijn tenen. Hij is groot en stoer, maar eet alleen bladeren. En er zit een vlinder op zijn neus.',
    alineas: [
      'Dino’s blijven favoriet bij kinderen van twee tot tien. Deze wereld is stoer en vriendelijk tegelijk – nergens eng, overal iets te ontdekken.',
      'Warm groen en zand passen bij naturel hout en rotan, en de wereld groeit mee tot ver in de basisschooltijd.',
    ],
    zoekwoorden: ['dinosaurus behang', 'dino fotobehang', 'dino kinderkamer'],
    alt: 'Illustratie van de vrolijke groene T-rex Rex met een vlinder op zijn neus, naast een stenen boog waar Bella Ballon doorheen zweeft',
  },
  {
    slug: 'bouwplaats',
    naam: 'Bouwplaats',
    verhaal: 'De grote graafdag',
    beeld: 'bouwplaats',
    focus: '55% 50%',
    kleur: '#E2A93B',
    seoTitel: 'Bouwplaats behang – graafmachine & kiepwagen',
    metaBeschrijving: 'Bouwplaats behang voor de kinderkamer met graafmachine, kiepwagen en kraan. Fotobehang op maat, posters en behangcirkels van Wallstories Kids.',
    h1: 'Bouwplaats behang voor de kinderkamer',
    intro: 'Vandaag is het de grote graafdag. Graaf Gijs graaft, nooit zonder helm, en Kees Komeet telt de scheppen. Diep in het zand glimt iets zonnegeels.',
    alineas: [
      'Voor kinderen die elke graafmachine op straat aanwijzen. Een vrolijke, warme wereld vol machines – zonder dat het druk wordt op de muur.',
      'Mooi in combinatie met okergeel, zandtinten en groen.',
    ],
    zoekwoorden: ['bouwplaats behang', 'graafmachine behang', 'werkauto behang'],
    alt: 'Illustratie van graafmachine Graaf Gijs met een gele helm op een zonnige bouwplaats, met Kees Komeet en een boogvormige poort',
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
    intro: 'Achter de heuvels staat een kasteel met rozen tot in de hoogste toren. Pien klimt in de boom om de ballon van Bella los te maken, en Kees Komeet kijkt toe.',
    alineas: [
      'Zachte pasteltinten en een kronkelpad dat uitnodigt om verhalen te verzinnen. Romantisch zonder zoet te worden.',
      'Prachtig in een babykamer en net zo mooi in een kamer van een kind van acht.',
    ],
    zoekwoorden: ['sprookjes behang', 'kasteel behang', 'prinsessen behang'],
    alt: 'Illustratie van een pastelkasteel met rozen, Pien die in een boom klimt en Bella Ballon in haar gestreepte luchtballon',
  },
  // ---- Dierenwerelden (trendstijlen: waterverf, toile in zandtinten, lijntekening) ----
  {
    slug: 'hertenbos',
    naam: 'Hertenbos',
    verhaal: 'De hertjes in het herfstbos',
    beeld: 'hertenbos',
    focus: '50% 50%',
    kleur: '#B07A45',
    seoTitel: 'Bosbehang kinderkamer – hertjes & bosdieren',
    metaBeschrijving: 'Bosbehang voor de kinderkamer met hertjes, een vos, egel en uiltje in zachte waterverf. Fotobehang op maat, behangcirkels en posters. Pvc-vrij.',
    h1: 'Bosbehang met hertjes voor de kinderkamer',
    intro: 'In een zacht herfstbos staat een hertenfamilie op een open plek. Een vos slaapt opgerold, een egel scharrelt door de blaadjes en een uiltje houdt de wacht.',
    alineas: [
      'Waterverf in oker, salie en stoffig blauw: rustig genoeg voor een babykamer en warm genoeg om jaren mee te gaan.',
      'Kijk goed: hoog in de lucht zweeft Bella Ballon voorbij, en tussen de gevallen blaadjes verstopt kater Penseel zich.',
    ],
    zoekwoorden: ['bosbehang kinderkamer', 'hertjes behang', 'dieren behang', 'bosdieren behang babykamer'],
    alt: 'Waterverfillustratie van een hertenfamilie in een zacht herfstbos met een vos, egel, konijnen en een uiltje',
  },
  {
    slug: 'jungle',
    naam: 'Jungle',
    verhaal: 'Een middag in de stille jungle',
    beeld: 'jungle',
    focus: '50% 50%',
    kleur: '#B49A78',
    seoTitel: 'Jungle behang kinderkamer – dieren in zandtinten',
    metaBeschrijving: 'Jungle behang voor de kinderkamer in rustige zandtinten: giraffe, olifantje, zebra en toekan tussen palmbladeren. Fotobehang op maat, pvc-vrij.',
    h1: 'Jungle behang voor de kinderkamer',
    intro: 'Tussen grote palmbladeren staan een jonge giraf en een babyolifant zij aan zij. Een aapje slingert aan een liaan en een toekan kijkt nieuwsgierig toe.',
    alineas: [
      'Alles in warme zand-, beige- en taupetinten, als een moderne toile. Een neutrale keuze die past bij hout, linnen en rotan en die meegroeit tot in de tienerjaren.',
      'De bladeren buigen samen tot een boog, net als het verhalenraam. Wie goed zoekt, vindt ook Penseel tussen het groen.',
    ],
    zoekwoorden: ['jungle behang kinderkamer', 'dieren behang babykamer', 'neutraal behang babykamer', 'safari behang'],
    alt: 'Illustratie in zandtinten van een jungle met een giraf, babyolifant, zebra, aapje en toekan tussen palmbladeren',
  },
  {
    slug: 'safari',
    naam: 'Safari',
    verhaal: 'Op safari met potlood en papier',
    beeld: 'safari',
    focus: '50% 50%',
    kleur: '#7F8A5E',
    seoTitel: 'Safari behang – dieren in lijntekening',
    metaBeschrijving: 'Safari behang met dieren in fijne lijntekening: giraffe, zebra, olifant en leeuwtje op een rustige crème achtergrond. Fotobehang op maat, pvc-vrij.',
    h1: 'Safari behang met dieren in lijntekening',
    intro: 'Een giraf steekt zijn nek in de wolken, een olifant wandelt met haar kalfje en een leeuwtje ligt lui in het gras. Getekend met fijne lijnen en veel rust eromheen.',
    alineas: [
      'Minimalistisch en licht, in olijfgroen en warm grijs op crème. Ideaal als je een rustige muur wilt waarop toch veel te ontdekken valt.',
      'Ook hier zweeft Bella Ballon in de lucht, en heeft kater Penseel een plekje in het gras gevonden.',
    ],
    zoekwoorden: ['safari behang', 'lijntekening behang', 'giraffe behang', 'dieren behang kinderkamer'],
    alt: 'Lijntekening van safaridieren op crème: een giraf, zebra, olifant met kalfje, leeuwtje en toekan tussen palmbomen',
  },
];

export const wereldBySlug = (slug: string) => werelden.find((w) => w.slug === slug);
/** Werelden met dieren in de hoofdrol (voor de landingspagina Dierenbehang). */
export const dierenWerelden = ['hertenbos', 'jungle', 'safari', 'onderwater', 'dino'];
