import type { MetadataRoute } from 'next';
import { NAAM } from '@/lib/antwoorden';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: NAAM,
    short_name: NAAM,
    description: `Videogesprek met ${NAAM}`,
    start_url: '/',
    scope: '/',
    display: 'fullscreen',
    display_override: ['fullscreen', 'standalone'],
    orientation: 'portrait',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
