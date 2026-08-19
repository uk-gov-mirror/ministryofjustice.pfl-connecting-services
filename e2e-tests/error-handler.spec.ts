import { test, expect } from '@playwright/test';

import { startJourney } from './fixtures/test-helpers';

const TIMEOUT_PATH = '/create-timeout';
const TIMEOUT_TITLE = "Sorry, you'll have to start again";
const YOUR_SESSION_TEXT =
  "Your session automatically ends if you don’t use the service for 120 minutes.";
const PERSONAL_INFO_TEXT = "We haven’t saved any personal information.";
const START_AGAIN_TEXT = "You need to start again.";

test.describe('errorHandler – 403 session timeout', () => {
  test('should respond with 403 and HTML content type', async ({ request }) => {
    const response = await request.get(TIMEOUT_PATH);

    expect(response.status()).toBe(403);
    expect(response.headers()['content-type']).toContain('text/html');
  });

  test('should render the timeOut error page instead of generic or not-found pages', async ({ request }) => {
    const body = await (await request.get(TIMEOUT_PATH)).text();

    expect(body).toContain(YOUR_SESSION_TEXT);
    expect(body).not.toContain('Page not found');
    expect(body).not.toContain('Sorry, there is a problem with the service');
  });

  test('should set the page title from errors.timeOut.title', async ({ page }) => {
    await page.goto(TIMEOUT_PATH);

    await expect(page).toHaveTitle(
      `${TIMEOUT_TITLE} – Get help finding a child arrangement option – GOV.UK`,
    );
  });

  test('should display the session timeout heading and guidance', async ({ page }) => {
    await page.goto(TIMEOUT_PATH);

    await expect(page.locator('h1')).toHaveText(TIMEOUT_TITLE);
    await expect(page.getByText(YOUR_SESSION_TEXT)).toBeVisible();
    await expect(page.getByText(PERSONAL_INFO_TEXT)).toBeVisible();
    await expect(page.getByText(START_AGAIN_TEXT)).toBeVisible();
  });

  test('should expose the 403 status in non-production environments', async ({ page }) => {
    await page.goto(TIMEOUT_PATH);

    await expect(page.getByRole('heading', { name: '403' })).toBeVisible();
  });

  test('should provide a start again button linking to child safety', async ({ page }) => {
    await page.goto(TIMEOUT_PATH);

    const startAgainButton = page.getByRole('button', { name: /start again/i });
    await expect(startAgainButton).toBeVisible();
    await expect(startAgainButton).toHaveAttribute('href', '/child-safety?lang=en');
  });

  test('should allow the user to restart the journey from the timeout page', async ({ page }) => {
    await page.goto(TIMEOUT_PATH);

    await page.getByRole('button', { name: /start again/i }).click();
    await expect(page).toHaveURL(/child-safety/);

    await page.getByRole('radio', { name: 'No', exact: true }).check();
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page).toHaveURL(/domestic-abuse/);
  });

  test('should render the timeout page when a 403 occurs during an active journey', async ({ page }) => {
    await startJourney(page);
    await expect(page).toHaveURL(/child-safety/);

    await page.goto(TIMEOUT_PATH);

    await expect(page.locator('h1')).toHaveText(TIMEOUT_TITLE);
    await expect(page.getByText(PERSONAL_INFO_TEXT)).toBeVisible();
    await expect(page.getByText(START_AGAIN_TEXT)).toBeVisible();
  });
});
