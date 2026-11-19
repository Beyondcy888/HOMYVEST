import { defineConfig, devices } from '@playwright/test';

// GPU flags: headless Chromium otherwise falls back to software WebGL (SwiftShader),
// which makes 3D screenshots slow and frame timings meaningless.
const gpuArgs = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl'];

export default defineConfig({
  testDir: 'qa',
  testMatch: /.*\.spec\.ts$/,
  timeout: 90_000,
  retries: 0,
  workers: 3,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'off',
    launchOptions: { args: gpuArgs },
  },
  // Note: reuseExistingServer means a server already on :4173 is used as it is. Stop any old preview
  // server (or run `npm run build` first) so the tests never run against a stale build.
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: true,
    timeout: 240_000,
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /screenshots\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      testIgnore: /screenshots\.spec\.ts$/,
      use: { ...devices['Pixel 7'] },
    },
    // `npm run shots`: the screenshot review set (docs/10 §3). Not part of `npm run e2e`.
    {
      name: 'shots',
      testMatch: /screenshots\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
