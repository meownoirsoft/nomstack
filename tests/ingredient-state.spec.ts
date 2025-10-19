import { test, expect } from '@playwright/test';

test.describe('Ingredient State Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/shopping');
    await page.waitForSelector('[data-testid^="ingredient-"]', { timeout: 10000 });
  });

  test('should toggle ingredient "have this" state', async ({ page }) => {
    // Find the first ingredient
    const firstIngredient = page.locator('[data-testid^="ingredient-"]').first();
    const ingredientId = await firstIngredient.getAttribute('data-testid');
    
    if (ingredientId) {
      const toggleButton = page.locator(`[data-testid="toggle-have-${ingredientId.replace('ingredient-', '')}"]`);
      const ingredientName = page.locator(`[data-testid="ingredient-name-${ingredientId.replace('ingredient-', '')}"]`);
      
      // Get initial state
      const initialTextDecoration = await ingredientName.evaluate(el => 
        window.getComputedStyle(el).textDecoration
      );
      
      // Click the toggle button
      await toggleButton.click();
      
      // Wait for the state to update
      await page.waitForTimeout(500);
      
      // Check if the ingredient is now crossed out (have this)
      const newTextDecoration = await ingredientName.evaluate(el => 
        window.getComputedStyle(el).textDecoration
      );
      
      // The text decoration should have changed
      expect(newTextDecoration).not.toBe(initialTextDecoration);
      
      // Click again to toggle back
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      // Should be back to original state
      const finalTextDecoration = await ingredientName.evaluate(el => 
        window.getComputedStyle(el).textDecoration
      );
      expect(finalTextDecoration).toBe(initialTextDecoration);
    }
  });

  test('should persist ingredient state across page refreshes', async ({ page }) => {
    // Find the first ingredient
    const firstIngredient = page.locator('[data-testid^="ingredient-"]').first();
    const ingredientId = await firstIngredient.getAttribute('data-testid');
    
    if (ingredientId) {
      const toggleButton = page.locator(`[data-testid="toggle-have-${ingredientId.replace('ingredient-', '')}"]`);
      const ingredientName = page.locator(`[data-testid="ingredient-name-${ingredientId.replace('ingredient-', '')}"]`);
      
      // Toggle the ingredient to "have this" state
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      // Get the state after toggle
      const toggledTextDecoration = await ingredientName.evaluate(el => 
        window.getComputedStyle(el).textDecoration
      );
      
      // Refresh the page
      await page.reload();
      await page.waitForSelector(`[data-testid="ingredient-name-${ingredientId.replace('ingredient-', '')}"]`, { timeout: 10000 });
      
      // Check if the state persisted
      const persistedTextDecoration = await ingredientName.evaluate(el => 
        window.getComputedStyle(el).textDecoration
      );
      
      expect(persistedTextDecoration).toBe(toggledTextDecoration);
    }
  });

  test('should show "have this" text when ingredient is checked', async ({ page }) => {
    // Find the first ingredient
    const firstIngredient = page.locator('[data-testid^="ingredient-"]').first();
    const ingredientId = await firstIngredient.getAttribute('data-testid');
    
    if (ingredientId) {
      const toggleButton = page.locator(`[data-testid="toggle-have-${ingredientId.replace('ingredient-', '')}"]`);
      
      // Toggle to "have this" state
      await toggleButton.click();
      await page.waitForTimeout(500);
      
      // Check if "have this" text appears
      const haveThisText = firstIngredient.locator('text=have this');
      await expect(haveThisText).toBeVisible();
    }
  });
});
