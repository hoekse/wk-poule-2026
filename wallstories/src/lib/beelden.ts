import type { ImageMetadata } from 'astro';
import heroSchilder from '@/assets/sfeer/hero-schilder.jpg';
import babykamerWalvis from '@/assets/sfeer/babykamer-walvis.jpg';
import rembrandtMuseum from '@/assets/werelden/rembrandt-museum.jpg';
import onderwater from '@/assets/werelden/onderwater.jpg';
import ruimte from '@/assets/werelden/ruimte.jpg';
import dino from '@/assets/werelden/dino.jpg';
import bouwplaats from '@/assets/werelden/bouwplaats.jpg';
import sprookjes from '@/assets/werelden/sprookjes.jpg';
import pRembrandt from '@/assets/personages/rembrandt.png';
import pBella from '@/assets/personages/bella-ballon.png';
import pKees from '@/assets/personages/kees-komeet.png';

export const beelden = {
  'hero-schilder': heroSchilder,
  'babykamer-walvis': babykamerWalvis,
  'rembrandt-museum': rembrandtMuseum,
  onderwater,
  ruimte,
  dino,
  bouwplaats,
  sprookjes,
  'personage-rembrandt-2-0': pRembrandt,
  'personage-bella-ballon': pBella,
  'personage-kees-komeet': pKees,
} satisfies Record<string, ImageMetadata>;

export type BeeldSleutel = keyof typeof beelden;
