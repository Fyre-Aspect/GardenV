import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Kindred's E2E + PWA tests.
 *
 * IMPORTANT: the service worker and manifest behaviour we want to verify only
 * exist in a *production* build — `next-pwa` is disabled in `next dev` (see
 * next.config.mjs). So `webServer` runs `next build` then `next start` rather
 * than the dev server. The first run is slow (it compiles); later runs reuse
 * the running server locally.
 *
 * We test in the Pixel 5 (Android Chrome) device profile because installability
 * is a mobile concern — this is the closest headless approximation of "does it
 * work on my phone".
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  // The first service-worker registration after a cold `next start` has to
  // precache the app shell while the server is still warming, which can exceed
  // Playwright's 30s default. Give every test more headroom.
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Run serially. The suite is small and fast; the PWA/offline tests drive the
  // service worker and toggle network state, and a single shared `next start`
  // server under parallel headless Chromium starves on modest machines (browser
  // crashes, navigation timeouts). Determinism > a few saved seconds here.
  workers: 1,
  reporter: process.env.CI ? 'html' : 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    // Serve the *production* build so the PWA service worker is active (it's
    // disabled in `next dev`). The build itself is run by the `test:e2e` script
    // (and in CI) before Playwright starts — keeping it out of here means a fast
    // server boot and no false "webServer timed out" during a slow compile.
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
