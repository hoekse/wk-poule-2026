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
        name: 'Loods Hoeksema',
        short_name: 'Loods',
        description: 'Materiaal meenemen, terugbrengen en restverf invoeren.',
        lang: 'nl',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#2D2E32',
        background_color: '#1E1F22',
        icons: [
          { src: '/icons/icoon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icoon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icoon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,ttf,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@zxing')) return 'scanner';
          if (id.includes('node_modules/@supabase')) return 'supabase';
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'react';
        },
      },
    },
  },
  server: { host: true, port: 5173 },
});
