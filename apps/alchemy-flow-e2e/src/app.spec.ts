import { test, expect } from '@playwright/test';

test.describe('Alchemy Flow App', () => {
  test('should load the app and show sidebar', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    const screenshot1 = await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/01-landing.png' });
    console.log('Saved: 01-landing.png');
    
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible({ timeout: 5000 });
    
    await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/02-sidebar.png' });
    console.log('Saved: 02-sidebar.png');
  });

  test('should navigate to executions', async ({ page }) => {
    await page.goto('/executions');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/03-executions.png' });
    console.log('Saved: 03-executions.png');
  });

  test('should navigate to schedules', async ({ page }) => {
    await page.goto('/schedules');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/04-schedules.png' });
    console.log('Saved: 04-schedules.png');
  });

  test('should navigate to workflow editor', async ({ page }) => {
    await page.goto('/workflows');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'apps/alchemy-flow-e2e/src/screenshots/05-workflows-list.png' });
    console.log('Saved: 05-workflows-list.png');
  });
});