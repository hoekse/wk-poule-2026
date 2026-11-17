/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'icons/favicon-32.png'],
      manifest: {
        name: 'Kracht – trainen bij FitButiq',
        short_name: 'Kracht',
        description: 'Persoonlijk krachtschema, trainingslog, slaap, CPAP en herstel.',
        lang: 'nl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#07080B',
        background_color: '#07080B',
        icons: [
          { src: '/icons/icoon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icoon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icoon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: { host: true, port: 5174 },
  preview: { port: 4174 },
  test: { include: ['tests/**/*.test.ts'] },
});
