import { test, expect } from '@playwright/test';

const TIMEOUT_TITLE = "Sorry, you'll have to start again";
const YOUR_SESSION_TEXT =
  "Your session automatically ends if you don’t use the service for 120 minutes.";
const PERSONAL_INFO_TEXT = "We haven’t saved any personal information.";
const START_AGAIN_TEXT = "You need to start again.";

test.describe('Session timed out page', () => {
  test('should respond with 403 and HTML content type', async ({ request }) => {
    const response = await request.get('/session-timed-out');

    expect(response.status()).toBe(403);
    expect(response.headers()['content-type']).toContain('text/html');
  });

  test('should display the page with correct url and title', async ({ page }) => {
    await page.goto('/session-timed-out');

    await expect(page).toHaveURL(/session-timed-out/);
    await expect(page).toHaveTitle(
      `${TIMEOUT_TITLE} – Get help finding a child arrangement option – GOV.UK`,
    );
    await expect(page.locator('h1')).toHaveText(TIMEOUT_TITLE);
  });

  test('should display session timeout guidance', async ({ page }) => {
    await page.goto('/session-timed-out');

    await expect(page.getByText(YOUR_SESSION_TEXT)).toBeVisible();
    await expect(page.getByText(PERSONAL_INFO_TEXT)).toBeVisible();
    await expect(page.getByText(START_AGAIN_TEXT)).toBeVisible();
  });

  test('should not render generic or not-found error pages', async ({ request }) => {
    const body = await (await request.get('/session-timed-out')).text();

    expect(body).not.toContain('Page not found');
    expect(body).not.toContain('Sorry, there is a problem with the service');
  });

  test('should provide a start again button linking to child safety', async ({ page }) => {
    await page.goto('/session-timed-out');

    const startAgainButton = page.getByRole('button', { name: /start again/i });
    await expect(startAgainButton).toBeVisible();
    await expect(startAgainButton).toHaveAttribute('href', '/child-safety?lang=en');
  });

  test('should allow the user to restart the journey from the timeout page', async ({ page }) => {
    await page.goto('/session-timed-out');

    await page.getByRole('button', { name: /start again/i }).click();
    await expect(page).toHaveURL(/child-safety/);

    await page.getByRole('radio', { name: 'No', exact: true }).check();
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page).toHaveURL(/domestic-abuse/);
  });
});
