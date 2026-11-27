// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

const SITE = process.env.SITE_URL ?? 'https://www.wallstories.nl';

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  output: 'static', // pagina's statisch (snel + SEO); API-routes draaien serverless via `prerender = false`
  adapter: vercel({ imageService: false, webAnalytics: { enabled: false } }),
  integrations: [
    sitemap({
      filter: (page) => !/\/(winkelwagen|afrekenen|bedankt)\//.test(page),
      changefreq: 'weekly',
      i18n: undefined,
    }),
  ],
  image: {
    // Responsieve AVIF/WebP via sharp tijdens de build – scherp op retina, licht op mobiel
    responsiveStyles: false,
  },
  build: { inlineStylesheets: 'auto' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
});
