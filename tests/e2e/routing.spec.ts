import { test, expect } from '@playwright/test';

/**
 * Route guards. The garden is private — an unauthenticated visit must bounce
 * back to the landing page rather than flash the dashboard.
 */
test.describe('Route protection', () => {
  test('redirects unauthenticated visitors away from /garden', async ({
    page,
  }) => {
    await page.goto('/garden');

    // The guard waits for Firebase auth to resolve (onAuthStateChanged) before
    // router.replace('/'). That first auth resolution can be slow in a cold
    // headless browser, so we allow generous headroom.
    await expect(page).toHaveURL('/', { timeout: 30_000 });
    await expect(
      page.getByRole('navigation').getByRole('button', { name: 'Sign in' })
    ).toBeVisible();
  });
});
