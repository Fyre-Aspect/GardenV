import { test, expect } from '@playwright/test';

/**
 * PWA installability + offline behaviour.
 *
 * This is the "will it actually install and run on my phone" suite. It verifies
 * the four things a browser checks before offering "Add to Home Screen":
 *   1. a linked, valid web app manifest with the required fields,
 *   2. reachable icons (incl. a 512px icon),
 *   3. a registered + active service worker,
 *   4. the app still loads offline once the SW has cached it.
 *
 * Requires the production build (the SW is disabled in `next dev`), which the
 * Playwright webServer in playwright.config.ts handles.
 */
test.describe('PWA manifest', () => {
  test('is linked from the document head', async ({ page }) => {
    await page.goto('/');
    const href = await page
      .locator('link[rel="manifest"]')
      .getAttribute('href');
    expect(href).toBeTruthy();
  });

  test('serves a valid manifest with installability fields', async ({
    page,
    request,
  }) => {
    await page.goto('/');
    const href =
      (await page.locator('link[rel="manifest"]').getAttribute('href')) ??
      '/manifest.json';

    const res = await request.get(href);
    expect(res.ok()).toBe(true);

    const manifest = await res.json();
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    // Installable display modes per the web app manifest spec.
    expect(['standalone', 'fullscreen', 'minimal-ui']).toContain(
      manifest.display
    );

    // At least one icon >= 512px is required for installability.
    const sizes: string[] = (manifest.icons ?? []).flatMap(
      (i: { sizes?: string }) => (i.sizes ? i.sizes.split(' ') : [])
    );
    const has512 = sizes.some((s) => {
      const dim = parseInt(s.split('x')[0] ?? '0', 10);
      return dim >= 512;
    });
    expect(has512).toBe(true);
  });

  test('all manifest icons are reachable', async ({ page, request }) => {
    await page.goto('/');
    const href =
      (await page.locator('link[rel="manifest"]').getAttribute('href')) ??
      '/manifest.json';
    const manifest = await (await request.get(href)).json();

    for (const icon of manifest.icons ?? []) {
      const iconRes = await request.get(new URL(icon.src, page.url()).href);
      expect(iconRes.ok(), `icon ${icon.src} should load`).toBe(true);
    }
  });
});

/**
 * Drives the SW to "activated" without ever awaiting a promise that can hang.
 * We kick off registration ourselves (idempotent with next-pwa's own auto
 * registration) and then poll the registration state, so a racing/never-firing
 * `serviceWorker.ready` can't stall the whole test.
 */
async function waitForActiveServiceWorker(page: import('@playwright/test').Page) {
  const regError = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'no-sw-api';
    try {
      await navigator.serviceWorker.register('/sw.js');
      return null;
    } catch (e) {
      return String(e);
    }
  });
  expect(regError, 'service worker should register without error').toBeNull();

  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          if (!('serviceWorker' in navigator)) return 'unsupported';
          const reg = await navigator.serviceWorker.getRegistration();
          return reg?.active?.state ?? 'none';
        }),
      { timeout: 45_000, intervals: [250, 500, 1000] }
    )
    .toBe('activated');
}

test.describe('Service worker', () => {
  test('registers and becomes active', async ({ page }) => {
    await page.goto('/');
    await waitForActiveServiceWorker(page);
  });

  test('app still loads when offline after first visit', async ({
    page,
    context,
  }) => {
    // First visit registers the SW but the page isn't controlled by it yet, so
    // that navigation is NOT cached. Reload once (now controlled + online) so
    // the SW's start-url NetworkFirst actually stores the response.
    await page.goto('/');
    await waitForActiveServiceWorker(page);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), {
        timeout: 15_000,
      })
      .toBe(true);
    // Let Workbox finish writing the navigation into the cache.
    await page.waitForTimeout(500);

    await context.setOffline(true);
    try {
      // Fetch the app shell through the (controlled) SW. NetworkFirst can't
      // reach the network, so it must serve the cached document — proving the
      // app opens offline, which is the whole point of installing it.
      const result = await page.evaluate(async () => {
        const res = await fetch('/', { cache: 'no-store' });
        return { status: res.status, body: await res.text() };
      });
      expect(result.status).toBe(200);
      expect(result.body).toContain('Kindred');
    } finally {
      await context.setOffline(false);
    }
  });
});
