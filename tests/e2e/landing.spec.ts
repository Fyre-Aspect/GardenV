import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * Landing page + auth dialog UI.
 *
 * These cover the first thing a new visitor sees and the gateway into the app.
 * They deliberately avoid completing a real Firebase sign-in (that needs live
 * credentials and a network round-trip) — they verify the UI a user drives,
 * which is what breaks most often during a redesign.
 */

/**
 * Open the auth dialog, tolerant of React hydration timing.
 *
 * The landing page lazy-loads a heavy three.js scene, so the "Sign in" button
 * paints (server HTML) before its onClick handler is wired up. A single click
 * can land pre-hydration and do nothing — so we retry click→assert until the
 * dialog actually opens, which is the Playwright-recommended way to handle a
 * hydration race rather than a brittle fixed wait.
 */
async function openAuthDialog(page: Page): Promise<Locator> {
  const navSignIn = page
    .getByRole('navigation')
    .getByRole('button', { name: 'Sign in' });
  const dialog = page.getByRole('dialog');

  await expect(async () => {
    await navSignIn.click();
    await expect(dialog).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 20_000 });

  return dialog;
}

test.describe('Landing page', () => {
  test('shows branding and a sign-in entry point', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('navigation')).toContainText('Kindred');
    await expect(
      page.getByRole('navigation').getByRole('button', { name: 'Sign in' })
    ).toBeVisible();
  });

  test('opens the auth dialog from the nav', async ({ page }) => {
    await page.goto('/');
    const dialog = await openAuthDialog(page);

    await expect(dialog.getByText('Welcome back')).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: /continue with google/i })
    ).toBeVisible();
    await expect(dialog.getByLabel('Email')).toBeVisible();
    await expect(dialog.getByLabel('Password')).toBeVisible();
  });

  test('toggles between sign-in and sign-up modes', async ({ page }) => {
    await page.goto('/');
    const dialog = await openAuthDialog(page);

    await expect(dialog.getByText('Welcome back')).toBeVisible();

    await dialog.getByRole('button', { name: 'Sign up' }).click();
    await expect(dialog.getByText('Create your garden')).toBeVisible();

    await dialog.getByRole('button', { name: 'Sign in' }).click();
    await expect(dialog.getByText('Welcome back')).toBeVisible();
  });

  test('requires email and password before submitting', async ({ page }) => {
    await page.goto('/');
    const dialog = await openAuthDialog(page);

    // Submitting empty must not navigate away — native required validation holds.
    await dialog.getByRole('button', { name: 'Sign in' }).click();

    await expect(dialog).toBeVisible();
    const email = dialog.getByLabel('Email');
    const valid = await email.evaluate(
      (el: HTMLInputElement) => el.checkValidity()
    );
    expect(valid).toBe(false);
  });
});
