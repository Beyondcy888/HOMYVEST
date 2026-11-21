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
  // Two builds, so both funnel outcomes are tested without real credentials (U01_08 §2). Fake values are passed
  // through the environment only, never written to a file.
  //  :4173  no Supabase settings (blank, so a local .env.local can never leak in) → the WhatsApp handoff
  //  :4174  a fake Supabase URL and key; the funnel specs intercept its requests with page.route
  // Note: reuseExistingServer means a server already on these ports is used as it is. Stop any old preview
  // server so the tests never run against a stale build.
  webServer: [
    {
      command: 'npm run build && npm run preview',
      port: 4173,
      reuseExistingServer: true,
      timeout: 240_000,
      env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '', VITE_SUPABASE_ANON_KEY: '' },
    },
    {
      command: 'npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port 4174 --strictPort',
      port: 4174,
      reuseExistingServer: true,
      timeout: 240_000,
      env: { VITE_SUPABASE_URL: 'https://e2e-fake.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'e2e-fake-key' },
    },
  ],
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
