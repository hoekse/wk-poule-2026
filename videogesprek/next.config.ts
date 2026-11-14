import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
      {
        // Clips mogen in de browsercache, maar worden bij elk bezoek opnieuw
        // gecontroleerd (ETag). Zo is een vervangen clip direct zichtbaar.
        source: '/clips/:path*',
        headers: [{ key: 'Cache-Control', value: 'private, no-cache' }],
      },
    ];
  },
};

export default nextConfig;
