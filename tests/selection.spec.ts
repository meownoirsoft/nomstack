import { test, expect } from '@playwright/test';

test.describe('Meal selection flow', () => {
  test('toggles a meal selection and recovers gracefully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const mealCheckbox = page.getByRole('checkbox').first();
    await expect(mealCheckbox).toBeVisible();

    const initiallyChecked = await mealCheckbox.isChecked();

    await mealCheckbox.click();
    await expect(mealCheckbox).toHaveJSProperty('checked', !initiallyChecked);

    // Toggle back to original state to avoid persisting test data
    await mealCheckbox.click();
    await expect(mealCheckbox).toHaveJSProperty('checked', initiallyChecked);

    const firstMealRow = page.locator('ul li').first();
    const mealName = (await firstMealRow.innerText()).trim();
    expect(mealName.length).toBeGreaterThan(0);
  });
});
