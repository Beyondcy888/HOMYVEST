import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { fileURLToPath } from 'node:url';

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

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
  build: {
    target: 'es2020',
    sourcemap: false,
    chunkSizeWarningLimit: 1500,
    // Two real pages (U01_01 §6): the main page and the full portfolio. Static hosting needs no rewrites.
    rolldownOptions: {
      input: {
        main: here('./index.html'),
        portofolio: here('./portofolio/index.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // The report function imports pdf-lib the Deno way; in tests it resolves to the npm package.
    alias: { 'npm:pdf-lib@1.17.1': 'pdf-lib' },
  },
});
