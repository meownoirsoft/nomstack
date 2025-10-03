import { test, expect } from '@playwright/test';

test.describe('Print view', () => {
  test('renders lunch and dinner selections', async ({ page }) => {
    await page.goto('/print');
    await page.waitForLoadState('networkidle');

    const lunchHeading = page.getByRole('heading', { name: 'Lunch' });
    await expect(lunchHeading).toBeVisible();

    const dinnerHeading = page.getByRole('heading', { name: 'Dinner' });
    await expect(dinnerHeading).toBeVisible();

    const lunchListItems = page.locator('.list', { hasText: 'Lunch' }).locator('ul li');
    await expect(lunchListItems.first()).toBeVisible();

    const dinnerListItems = page.locator('.list', { hasText: 'Dinner' }).locator('ul li');
    await expect(dinnerListItems.first()).toBeVisible();
  });
});
