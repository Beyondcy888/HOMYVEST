// Reports which WebGL renderer Playwright's Chromium gets, with and without GPU flags.
// Usage: node qa/tools/gpu-check.mjs
import { chromium } from '@playwright/test';

const probe = async (label, opts) => {
  const browser = await chromium.launch(opts);
  const page = await browser.newPage();
  const info = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    if (!gl) return { webgl2: false };
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return {
      webgl2: true,
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    };
  });
  console.log(label, JSON.stringify(info));
  await browser.close();
};

await probe('default headless :', {});
await probe('gpu flags headless:', { args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl'] });
