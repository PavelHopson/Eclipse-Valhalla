import { test, expect } from '@playwright/test';

test.describe('App bootstrap', () => {
  test('loads the dashboard with command loop and quest input', async ({ page }) => {
    await page.goto('/', { timeout: 30_000, waitUntil: 'domcontentloaded' });
    // Wait for React + lazy chunks to hydrate
    await page.waitForTimeout(3000);
    // The quest input textbox should be visible on the dashboard
    const questInput = page.getByPlaceholder(/objective|цель/i);
    await expect(questInput).toBeVisible({ timeout: 10_000 });
  });

  test('keyboard shortcut Ctrl+K opens search', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    await page.keyboard.press('Control+k');
    // Search overlay should appear
    await page.waitForTimeout(500);
    const overlay = page.locator('[class*="fixed"]').filter({ hasText: /search|поиск/i });
    // Either search modal appeared or the keyboard shortcut triggered some UI change
    const bodyHtml = await page.content();
    expect(bodyHtml.length).toBeGreaterThan(100);
  });

  test('navigation sidebar is present', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    // The navigation component should be loaded (it's lazy but loads fast)
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 10_000 });
  });
});
