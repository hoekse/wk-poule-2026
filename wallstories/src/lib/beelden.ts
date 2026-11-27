import type { ImageMetadata } from 'astro';
import heroSchilder from '@/assets/sfeer/hero-schilder.jpg';
import babykamerWalvis from '@/assets/sfeer/babykamer-walvis.jpg';
import rembrandtsAtelier from '@/assets/werelden/rembrandts-atelier.jpg';
import onderwater from '@/assets/werelden/onderwater.jpg';
import ruimte from '@/assets/werelden/ruimte.jpg';
import dino from '@/assets/werelden/dino.jpg';
import bouwplaats from '@/assets/werelden/bouwplaats.jpg';
import sprookjes from '@/assets/werelden/sprookjes.jpg';
import pRembrandt from '@/assets/personages/rembrandt.png';
import pBella from '@/assets/personages/bella-ballon.png';
import pKees from '@/assets/personages/kees-komeet.png';
import sRembrandt from '@/assets/sheets/rembrandt-2-0.jpg';
import sBella from '@/assets/sheets/bella-ballon.jpg';
import sKees from '@/assets/sheets/kees-komeet.jpg';

export const beelden = {
  'hero-schilder': heroSchilder,
  'babykamer-walvis': babykamerWalvis,
  'rembrandts-atelier': rembrandtsAtelier,
  onderwater,
  ruimte,
  dino,
  bouwplaats,
  sprookjes,
  'personage-rembrandt-2-0': pRembrandt,
  'personage-bella-ballon': pBella,
  'personage-kees-komeet': pKees,
  'sheet-rembrandt-2-0': sRembrandt,
  'sheet-bella-ballon': sBella,
  'sheet-kees-komeet': sKees,
} satisfies Record<string, ImageMetadata>;

export type BeeldSleutel = keyof typeof beelden;
