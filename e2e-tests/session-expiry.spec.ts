import { expect, test } from '@playwright/test';

import {
  sessionTimeoutMetaRefreshContent,
  sessionTimeoutMs,
} from './fixtures/session-config';
import {
  selectAgreeOnChildArrangementsOption,
  selectChildSafetyOption,
  selectContactChildArrangementsOption,
  selectDomesticAbuseOption,
  selectHelpToAgreeOnChildArrangementsOption,
  startJourney,
} from './fixtures/test-helpers';

const TIMEOUT_TITLE = "Sorry, you'll have to start again";
const SESSION_TIMEOUT_MS = String(sessionTimeoutMs);

test.describe.configure({ mode: 'serial' });

test.describe('Session Expiry', () => {
  test('should automatically redirect to the timeout page after idle period', async ({ page }) => {
    test.setTimeout(60_000);

    await startJourney(page);
    await expect(page).toHaveURL(/child-safety/);

    await page.clock.install();
    await page.reload();
    await page.clock.fastForward(sessionTimeoutMs);

    await expect(page).toHaveURL(/session-timed-out/);
    await expect(page.locator('h1')).toHaveText(TIMEOUT_TITLE);
  });

  test('should show the session timeout page when session expires mid-journey and user navigates', async ({ page }) => {
    await startJourney(page);
    await selectChildSafetyOption(page, 'No');
    await expect(page).toHaveURL(/domestic-abuse/);
    await page.context().clearCookies();
    await page.goto('/other-options');
    await expect(page.locator('h1')).toHaveText(TIMEOUT_TITLE);
  });

  test('should allow user to start a new journey after session expires', async ({ page }) => {
    await startJourney(page);
    await selectChildSafetyOption(page, 'No');
    await selectDomesticAbuseOption(page, 'No')
    await selectContactChildArrangementsOption(page, 'I can contact them but they do not respond')
    await page.context().clearCookies();
    await startJourney(page);
    await expect(page).toHaveURL(/child-safety/);
  });

  test('should show the session timeout page for a deep-linked page after session expires', async ({ page }) => {
    await startJourney(page);
    await selectChildSafetyOption(page, 'No');
    await selectDomesticAbuseOption(page, 'Yes');
    await page.getByRole('button', { name: /continue/i }).click();
    await selectContactChildArrangementsOption(page, 'Yes');
    await selectAgreeOnChildArrangementsOption(page, 'No, we do not agree');
    await selectHelpToAgreeOnChildArrangementsOption(page, 'Someone else to guide our conversations');
    await expect(page).toHaveURL('/other-options');
    await page.context().clearCookies();
    await page.goto('/other-options');
    await expect(page.locator('h1')).toHaveText(TIMEOUT_TITLE);
    await expect(page.getByRole('button', { name: /start again/i })).toBeVisible();
  });

  test('should configure an idle timer on journey pages', async ({ page }) => {
    await startJourney(page);
    await expect(page).toHaveURL(/child-safety/);

    await expect(page.locator('body')).toHaveAttribute('data-session-timeout-ms', SESSION_TIMEOUT_MS);
    await expect(page.locator('body')).toHaveAttribute('data-session-timeout-path', '/session-timed-out?lang=en');
  });

  test('should remove meta refresh when JavaScript is available', async ({ page }) => {
    await startJourney(page);
    await expect(page.locator('meta#session-timeout-refresh')).toHaveCount(0);
  });

  test('should keep meta refresh for browsers without JavaScript', async ({ browser }) => {
    const jsContext = await browser.newContext();
    const jsPage = await jsContext.newPage();
    await startJourney(jsPage);
    const storageState = await jsContext.storageState();
    await jsContext.close();

    const context = await browser.newContext({ javaScriptEnabled: false, storageState });
    const page = await context.newPage();

    await page.goto('/child-safety');

    await expect(page.locator('meta#session-timeout-refresh')).toHaveAttribute('http-equiv', 'refresh');
    await expect(page.locator('meta#session-timeout-refresh')).toHaveAttribute(
      'content',
      sessionTimeoutMetaRefreshContent,
    );

    await context.close();
  });
});
