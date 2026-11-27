import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Beeldsleutels die artikelen mogen gebruiken (zie src/lib/beelden.ts). */
export const beeldSleutels = [
  'hero-schilder', 'babykamer-walvis',
  'rembrandts-atelier', 'onderwater', 'ruimte', 'dino', 'bouwplaats', 'sprookjes', 'hertenbos', 'jungle', 'safari', 'walvisbaai', 'koraalrif', 'zeeleven',
] as const;

const inspiratie = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/inspiratie' }),
  schema: z.object({
    titel: z.string().max(70),
    seoTitel: z.string().max(60).optional(),
    beschrijving: z.string().min(110).max(160),
    focusKeyword: z.string(),
    categorie: z.enum(['Inspiratie', 'Handleiding', 'Advies']),
    publicatiedatum: z.coerce.date(),
    bijgewerkt: z.coerce.date().optional(),
    leestijd: z.number().int(),
    afbeelding: z.enum(beeldSleutels),
    afbeeldingAlt: z.string(),
    wereld: z.string().optional(),
  }),
});

const paginas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/paginas' }),
  schema: z.object({
    titel: z.string(),
    seoTitel: z.string().max(60).optional(),
    beschrijving: z.string().max(160),
    bijgewerkt: z.coerce.date(),
    intro: z.string().optional(),
  }),
});

const verhalen = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/verhalen' }),
  schema: z.object({
    titel: z.string().max(70),
    wereld: z.enum(['rembrandts-atelier', 'onderwater', 'ruimte', 'dino', 'bouwplaats', 'sprookjes']),
    volgorde: z.number().int(),
    beschrijving: z.string().min(110).max(160),
    personages: z.array(z.string()),
    herhaalzin: z.string(),
    paletkleur: z.string(),
    leeftijd: z.string(),
    leestijd: z.number().int(),
  }),
});

export const collections = { inspiratie, paginas, verhalen };
