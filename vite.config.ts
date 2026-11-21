import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { slimManifestModule } from './scripts/slim-manifest.mjs';

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

/**
 * The media manifest is imported by the page; the browser needs only a few of its fields, and its srcset strings
 * follow one pattern. This serves a slimmer module with exactly the same values (scripts/slim-manifest.mjs).
 */
function slimManifest(): Plugin {
  const VIRTUAL = '\0homyvest-media-manifest';
  const file = here('./src/content/media-manifest.json');
  return {
    name: 'homyvest-slim-manifest',
    enforce: 'pre',
    // a virtual id, so Vite's own JSON handling never sees it
    resolveId(source) {
      return /(^|\/)content\/media-manifest\.json$/.test(source) ? VIRTUAL : null;
    },
    load(id) {
      if (id !== VIRTUAL) return null;
      this.addWatchFile(file);
      return slimManifestModule(readFileSync(file, 'utf8'));
    },
  };
}

/**
 * The same redirects as the hosts (vercel.json, netlify.toml) for `npm run dev` and `vite preview`:
 * /portofolio, /portfolio and /portfolio/ → /portofolio/ (301). Without them the dev and preview servers fall
 * back to the main page for the slashless path.
 */
function portfolioRedirects(): Plugin {
  type Req = { url?: string };
  type Res = { statusCode: number; setHeader: (name: string, value: string) => void; end: () => void };
  const redirect = (req: Req, res: Res, next: () => void) => {
    const [path, query] = (req.url ?? '').split('?');
    if (path === '/portofolio' || path === '/portfolio' || path === '/portfolio/') {
      res.statusCode = 301;
      res.setHeader('Location', `/portofolio/${query ? `?${query}` : ''}`);
      res.end();
      return;
    }
    next();
  };
  return {
    name: 'homyvest-portfolio-redirects',
    configureServer(server) {
      server.middlewares.use(redirect);
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirect);
    },
  };
}

export default defineConfig({
  plugins: [slimManifest(), portfolioRedirects(), react(), preloadFont()],
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
