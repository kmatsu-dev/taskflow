import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves under /<repo>/. Use that base only for production
// builds so `npm run dev` keeps working at the root (and the iPhone /
// LAN URL doesn't need a path suffix).
const PROD_BASE = '/taskflow/';

export default defineConfig(({ command }) => {
  const base = command === 'build' ? PROD_BASE : '/';
  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          name: 'TaskFlow',
          short_name: 'TaskFlow',
          description: 'タスク管理アプリ',
          lang: 'ja',
          theme_color: '#0F1117',
          background_color: '#0F1117',
          display: 'standalone',
          scope: base,
          start_url: base,
          icons: [
            {
              src: 'icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
  };
});
