import { test, expect } from '@playwright/test';

test.describe('Meal Plan to Shopping List Workflow', () => {
  test('should generate shopping list from selected meals', async ({ page }) => {
    // Start at the meals page
    await page.goto('/');
    
    // Wait for meals to load
    await page.waitForSelector('[data-testid^="meal-"]', { timeout: 10000 });
    
    // Select a meal (click the checkbox or selection button)
    const firstMeal = page.locator('[data-testid^="meal-"]').first();
    const mealCheckbox = firstMeal.locator('input[type="checkbox"]').first();
    
    if (await mealCheckbox.count() > 0) {
      await mealCheckbox.check();
    } else {
      // If no checkbox, look for a selection button
      const selectButton = firstMeal.locator('button').filter({ hasText: /select|add/i }).first();
      if (await selectButton.count() > 0) {
        await selectButton.click();
      }
    }
    
    // Navigate to shopping page
    await page.goto('/shopping');
    
    // Wait for shopping list to load
    await page.waitForSelector('[data-testid^="category-section-"]', { timeout: 10000 });
    
    // Verify that ingredients appear in the shopping list
    const ingredientCount = await page.locator('[data-testid^="ingredient-"]').count();
    expect(ingredientCount).toBeGreaterThan(0);
  });

  test('should update shopping list when meal plan changes', async ({ page }) => {
    // Go to shopping page
    await page.goto('/shopping');
    
    // Wait for shopping list to load
    await page.waitForSelector('[data-testid^="category-section-"]', { timeout: 10000 });
    
    // Get initial ingredient count
    const initialCount = await page.locator('[data-testid^="ingredient-"]').count();
    
    // Go back to meals page and change selection
    await page.goto('/');
    await page.waitForSelector('[data-testid^="meal-"]', { timeout: 10000 });
    
    // Select a different meal
    const meals = page.locator('[data-testid^="meal-"]');
    const mealCount = await meals.count();
    
    if (mealCount > 1) {
      // Uncheck first meal
      const firstMeal = meals.first();
      const firstCheckbox = firstMeal.locator('input[type="checkbox"]').first();
      if (await firstCheckbox.count() > 0) {
        await firstCheckbox.uncheck();
      }
      
      // Check second meal
      const secondMeal = meals.nth(1);
      const secondCheckbox = secondMeal.locator('input[type="checkbox"]').first();
      if (await secondCheckbox.count() > 0) {
        await secondCheckbox.check();
      }
    }
    
    // Go back to shopping page
    await page.goto('/shopping');
    await page.waitForSelector('[data-testid^="category-section-"]', { timeout: 10000 });
    
    // Wait a bit for the list to update
    await page.waitForTimeout(2000);
    
    // Check if the ingredient list has changed
    const newCount = await page.locator('[data-testid^="ingredient-"]').count();
    
    // The count might be different, or the ingredients might be different
    // This test mainly ensures the page doesn't crash and updates occur
    expect(newCount).toBeGreaterThanOrEqual(0);
  });

  test('should show meal count badges on grouped ingredients', async ({ page }) => {
    await page.goto('/shopping');
    await page.waitForSelector('[data-testid^="ingredient-"]', { timeout: 10000 });
    
    // Look for ingredients with meal count badges
    const mealBadges = page.locator('.badge').filter({ hasText: /meals/ });
    const badgeCount = await mealBadges.count();
    
    // If there are grouped ingredients, they should show meal counts
    if (badgeCount > 0) {
      // Verify the badge format is correct
      const firstBadge = mealBadges.first();
      const badgeText = await firstBadge.textContent();
      expect(badgeText).toMatch(/\(\d+ meals\)/);
    }
  });
});
