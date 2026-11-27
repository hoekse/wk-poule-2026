import { werelden } from './werelden';
import { personages } from './personages';
import { vanafCent } from '@/lib/prijs';
import type { BeeldSleutel } from '@/lib/beelden';

export type ProductType = 'fotobehang' | 'behangcirkel' | 'poster' | 'muursticker' | 'naamsticker';

export type Categorie = {
  slug: string;
  type: ProductType | 'stickers';
  naam: string; // menu
  h1: string;
  seoTitel: string;
  metaBeschrijving: string;
  intro: string;
  usp: string[];
};

export const categorieen: Categorie[] = [
  {
    slug: 'fotobehang-kinderkamer', type: 'fotobehang', naam: 'Fotobehang',
    h1: 'Fotobehang voor de kinderkamer, op maat van jouw muur',
    seoTitel: 'Fotobehang kinderkamer op maat',
    metaBeschrijving: 'Fotobehang voor de kinderkamer op exacte muurmaat. Negen verhalende werelden, live preview, pvc-vrij vlies of naadloos textiel en levering in 3–5 werkdagen. Vanaf € 44,95 per m².',
    intro: 'Kies een wereld, vul je muurmaat in en zie meteen hoe het verhaal op jouw muur staat. Wij printen elke muur op bestelling, met 5 cm extra rondom.',
    usp: ['Op exacte muurmaat', 'Vlies of naadloos textiel', 'Naam van je kind toevoegen'],
  },
  {
    slug: 'behangcirkels', type: 'behangcirkel', naam: 'Behangcirkels',
    h1: 'Behangcirkels voor de kinderkamer',
    seoTitel: 'Behangcirkels kinderkamer – zelfklevend',
    metaBeschrijving: 'Behangcirkels voor de kinderkamer en babykamer met de werelden van Wallstories Kids. Zelfklevend textiel, pvc-vrij en verwijderbaar. In Ø 70, 100 en 125 cm.',
    intro: 'Een behangcirkel is een venster naar een verhaal. Perfect boven het bedje, achter de speelhoek of als blikvanger op een rustige wand.',
    usp: ['Zelfklevend', 'In 3 maten', '14 dagen bedenktijd'],
  },
  {
    slug: 'posters', type: 'poster', naam: 'Posters',
    h1: 'Posters voor de kinderkamer',
    seoTitel: 'Posters kinderkamer – ook met naam',
    metaBeschrijving: 'Posters voor de kinderkamer en babykamer uit de werelden van Wallstories Kids. In drie formaten op zijdemat FSC-papier, ook met de naam van je kind.',
    intro: 'De werelden van Wallstories als poster: op zijdemat FSC-papier van 250 g/m², in drie formaten en desgewenst met de naam van je kind erop.',
    usp: ['FSC-papier, 250 g/m²', '3 formaten', 'Met naam: + € 9,95'],
  },
  {
    slug: 'muurstickers', type: 'stickers', naam: 'Muurstickers',
    h1: 'Muurstickers voor de kinderkamer',
    seoTitel: 'Muurstickers kinderkamer – personages & naam',
    metaBeschrijving: 'Muurstickers voor de kinderkamer met Rembrandt 2.0, Bella Ballon en Kees Komeet. Of een naamsticker in jullie kleur. Makkelijk te plakken en te verwijderen.',
    intro: 'Laat de personages van Wallstories uit het behang stappen: als losse muurstickers rond de deur, boven het bed of bij de boekenkast.',
    usp: ['Verwijderbaar', 'Personages én naamstickers', 'Vanaf € 19,95'],
  },
];

export type Product = {
  key: string; // "categorie/slug" – uniek
  slug: string;
  categorie: string;
  type: ProductType;
  naam: string;
  ondertitel: string;
  wereld?: string;
  personage?: string;
  beeld: BeeldSleutel;
  focus?: string;
  url: string;
  vanafCent: number;
  maatwerk: boolean;
  personaliseerbaar: boolean;
  seoTitel: string;
  metaBeschrijving: string;
  alt: string;
};

const p = (x: Omit<Product, 'key' | 'url'>): Product => ({ ...x, key: `${x.categorie}/${x.slug}`, url: `/${x.categorie}/${x.slug}/` });

export const producten: Product[] = [
  ...werelden.map((w) => p({
    slug: w.slug, categorie: 'fotobehang-kinderkamer', type: 'fotobehang',
    naam: `Fotobehang ${w.naam}`, ondertitel: w.verhaal, wereld: w.slug, beeld: w.beeld, focus: w.focus,
    vanafCent: vanafCent.fotobehang, maatwerk: true, personaliseerbaar: true,
    seoTitel: `${w.naam} fotobehang kinderkamer op maat`,
    metaBeschrijving: `${w.naam} fotobehang op maat: “${w.verhaal}”. Vul je muurmaat in, bekijk je uitsnede live en voeg de naam van je kind toe. PVC-vrij vlies.`,
    alt: `Fotobehang ${w.naam}: ${w.alt.charAt(0).toLowerCase()}${w.alt.slice(1)}`,
  })),
  ...werelden.map((w) => p({
    slug: w.slug, categorie: 'behangcirkels', type: 'behangcirkel',
    naam: `Behangcirkel ${w.naam}`, ondertitel: w.verhaal, wereld: w.slug, beeld: w.beeld, focus: w.focus,
    vanafCent: vanafCent.behangcirkel, maatwerk: false, personaliseerbaar: false,
    seoTitel: `Behangcirkel ${w.naam} – kinderkamer`,
    metaBeschrijving: `Behangcirkel ${w.naam} voor de kinderkamer: “${w.verhaal}”. Zelfklevend, in Ø 70, 100 of 125 cm. 14 dagen bedenktijd.`,
    alt: `Ronde behangcirkel met ${w.alt.charAt(0).toLowerCase()}${w.alt.slice(1)}`,
  })),
  ...werelden.map((w) => p({
    slug: w.slug, categorie: 'posters', type: 'poster',
    naam: `Poster ${w.naam}`, ondertitel: w.verhaal, wereld: w.slug, beeld: w.beeld, focus: w.focus,
    vanafCent: vanafCent.poster, maatwerk: false, personaliseerbaar: true,
    seoTitel: `Poster ${w.naam} kinderkamer – ook met naam`,
    metaBeschrijving: `Poster ${w.naam} voor de kinderkamer: “${w.verhaal}”. Zijdemat FSC-papier in 30×40, 50×70 of 70×100 cm, desgewenst met naam.`,
    alt: `Poster in lijst met ${w.alt.charAt(0).toLowerCase()}${w.alt.slice(1)}`,
  })),
  ...personages.map((c) => p({
    slug: c.slug, categorie: 'muurstickers', type: 'muursticker',
    naam: `Muurstickers ${c.naam}`, ondertitel: c.rol, personage: c.slug, wereld: c.wereld, beeld: c.beeld,
    vanafCent: vanafCent.muursticker, maatwerk: false, personaliseerbaar: false,
    seoTitel: `Muurstickers ${c.naam} – kinderkamer`,
    metaBeschrijving: `Muurstickers van ${c.naam}, ${c.rol.toLowerCase()}. Verwijderbaar en makkelijk te plakken. Set S of L, vanaf € 19,95.`,
    alt: `Muursticker van ${c.alt.charAt(0).toLowerCase()}${c.alt.slice(1)}`,
  })),
  p({
    slug: 'naamsticker', categorie: 'muurstickers', type: 'naamsticker',
    naam: 'Naamsticker', ondertitel: 'De naam van je kind op de muur', beeld: 'babykamer-walvis',
    vanafCent: vanafCent.naamsticker, maatwerk: true, personaliseerbaar: true,
    seoTitel: 'Naamsticker kinderkamer – naam op de muur',
    metaBeschrijving: 'Naamsticker voor de kinderkamer in het Wallstories-lettertype en jullie favoriete kleur. Ca. 60 cm breed, makkelijk aan te brengen. € 24,95.',
    alt: 'Kinderkamer met behang en een naamsticker op de muur',
  }),
];

export const productByKey = (key: string) => producten.find((x) => x.key === key);
export const productenInCategorie = (cat: string) => producten.filter((x) => x.categorie === cat);
export const productenInWereld = (w: string) => producten.filter((x) => x.wereld === w);
