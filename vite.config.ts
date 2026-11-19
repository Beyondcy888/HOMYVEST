import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

/** Preloads the Latin Archivo file (the only font needed for first paint) by its hashed build URL. */
function preloadFont(): Plugin {
  return {
    name: 'homyvest-preload-font',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const file = ctx.bundle && Object.keys(ctx.bundle).find((f) => /archivo-latin-wdth-normal.*\.woff2$/.test(f));
        if (!file) return html;
        return {
          html,
          tags: [
            {
              tag: 'link',
              attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${file}`, crossorigin: '' },
              injectTo: 'head-prepend',
            },
          ],
        };
      },
    },
  };
}

export default defineConfig({
  plugins: [react(), preloadFont()],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { target: 'es2020', sourcemap: false, chunkSizeWarningLimit: 1500 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
