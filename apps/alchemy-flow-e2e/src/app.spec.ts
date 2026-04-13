import { test } from '@playwright/test';

test.describe('Alchemy Flow App', () => {
  test('should capture workflows page', async ({ page }) => {
    await page.goto('/workflows');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/01-workflows-list.png', fullPage: true });
  });

  test('should capture executions page', async ({ page }) => {
    await page.goto('/executions');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/02-executions.png', fullPage: true });
  });

  test('should capture schedules page', async ({ page }) => {
    await page.goto('/schedules');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/03-schedules.png', fullPage: true });
  });

  test('should capture workflow editor', async ({ page }) => {
    await page.goto('/workflows/eb9de52b-9255-4fa3-a5f9-086ef836a37e');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/04-workflow-editor.png', fullPage: true });
  });
});