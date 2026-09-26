/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
import { pluginSicurezza } from './scripts/csp.ts';

// Su GitHub Pages l'app è servita da https://<utente>.github.io/MyDiet/
const base = process.env.GITHUB_PAGES === 'true' ? '/MyDiet/' : '/';

export default defineConfig({
  base,
  plugins: [
    preact(),
    pluginSicurezza(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'MyDiet',
        short_name: 'MyDiet',
        description: 'Traccia gli alimenti mangiati durante la giornata e le relative calorie.',
        lang: 'it',
        theme_color: '#2e7d32',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
  },
});
