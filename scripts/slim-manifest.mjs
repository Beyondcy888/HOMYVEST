// Turns src/content/media-manifest.json into a smaller ES module for the browser (used by vite.config.ts).
// The site reads only: width, height, hasAlpha, lowRes, dominant, lqip, largestUrl and srcset.{avif,webp}.
// The srcset strings follow one pattern ("/media/<group>/<slug>-<w>.<ext> <w>w"), so they are stored as a URL
// base plus a width list and rebuilt once at load, giving exactly the same strings as the JSON.
// Build-only fields (source path, group, aspect, generatedAt …) are dropped.

const parse = (srcset, ext) => {
  const items = srcset.split(', ').map((s) => {
    const [url, w] = s.split(' ');
    return { url, w: parseInt(w, 10) };
  });
  const base = items[0].url.replace(new RegExp(`-${items[0].w}\\.${ext}$`), '');
  const ok = items.every((it) => it.url === `${base}-${it.w}.${ext}`);
  return ok ? { base, widths: items.map((it) => it.w) } : null;
};

export function slimManifestModule(json) {
  const manifest = JSON.parse(json);
  const out = {};
  const raw = {};
  for (const [id, e] of Object.entries(manifest.images)) {
    const avif = parse(e.srcset.avif, 'avif');
    const webp = parse(e.srcset.webp, 'webp');
    const compact = avif && webp && avif.base === webp.base && avif.widths.join() === webp.widths.join() && e.largestUrl === `${webp.base}-${webp.widths.at(-1)}.webp`;
    const keep = { width: e.width, height: e.height, hasAlpha: e.hasAlpha, lowRes: e.lowRes, dominant: e.dominant, lqip: e.lqip };
    if (compact) out[id] = { ...keep, b: webp.base, w: webp.widths };
    else raw[id] = { ...keep, largestUrl: e.largestUrl, srcset: e.srcset }; // any irregular entry is kept as it was
  }
  return [
    `const c = ${JSON.stringify(out)};`,
    `const r = ${JSON.stringify(raw)};`,
    'const s = (b, w, x) => w.map((n) => `${b}-${n}.${x} ${n}w`).join(", ");',
    'const images = { ...r };',
    'for (const k in c) { const e = c[k]; images[k] = { width: e.width, height: e.height, hasAlpha: e.hasAlpha, lowRes: e.lowRes, dominant: e.dominant, lqip: e.lqip, largestUrl: `${e.b}-${e.w[e.w.length - 1]}.webp`, srcset: { avif: s(e.b, e.w, "avif"), webp: s(e.b, e.w, "webp") } }; }',
    'export { images };',
    'export default { images };',
  ].join('\n');
}
