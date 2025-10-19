import { test, expect } from '@playwright/test';

test.describe('Data Persistence and API Interactions', () => {
  test('should persist ingredient state changes', async ({ page }) => {
    await page.goto('/shopping');
    await page.waitForSelector('[data-testid^="ingredient-"]', { timeout: 10000 });
    
    // Find first ingredient
    const firstIngredient = page.locator('[data-testid^="ingredient-"]').first();
    const ingredientId = await firstIngredient.getAttribute('data-testid');
    
    if (ingredientId) {
      const toggleButton = page.locator(`[data-testid="toggle-have-${ingredientId.replace('ingredient-', '')}"]`);
      
      // Toggle ingredient state
      await toggleButton.click();
      await page.waitForTimeout(1000);
      
      // Refresh page
      await page.reload();
      await page.waitForSelector(`[data-testid="ingredient-${ingredientId.replace('ingredient-', '')}"]`, { timeout: 10000 });
      
      // Check that state persisted
      const ingredientName = page.locator(`[data-testid="ingredient-name-${ingredientId.replace('ingredient-', '')}"]`);
      const textDecoration = await ingredientName.evaluate(el => 
        window.getComputedStyle(el).textDecoration
      );
      
      // Should still be in the toggled state
      expect(textDecoration).toContain('line-through');
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });
    
    await page.goto('/shopping');
    
    // Should show error state or loading state, not crash
    await page.waitForTimeout(3000);
    
    // Check that page doesn't crash and shows appropriate error handling
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Look for error messages or loading states
    const errorElements = page.locator('.error, .alert-error, [data-testid*="error"]');
    const loadingElements = page.locator('.loading, [data-testid*="loading"]');
    
    const hasErrorOrLoading = (await errorElements.count() > 0) || (await loadingElements.count() > 0);
    expect(hasErrorOrLoading).toBeTruthy();
  });

  test('should update UI when data changes', async ({ page }) => {
    await page.goto('/shopping');
    await page.waitForSelector('[data-testid^="category-section-"]', { timeout: 10000 });
    
    // Get initial category count
    const initialCategories = await page.locator('[data-testid^="category-section-"]').count();
    
    // Move a category to test UI updates
    const moveButton = page.locator('[data-testid^="move-category-"]').first();
    if (await moveButton.count() > 0) {
      await moveButton.click();
      await page.waitForSelector('[data-testid^="move-category-to-"]', { timeout: 5000 });
      
      const moveToListButton = page.locator('[data-testid^="move-category-to-list-"]').first();
      if (await moveToListButton.count() > 0) {
        await moveToListButton.click();
        
        // Wait for the move to complete
        await page.waitForSelector('.toast', { timeout: 5000 });
        await page.waitForTimeout(1000);
        
        // Check that UI updated
        const newCategories = await page.locator('[data-testid^="category-section-"]').count();
        
        // Category count should have changed
        expect(newCategories).not.toBe(initialCategories);
      }
    }
  });

  test('should handle concurrent user actions', async ({ page }) => {
    await page.goto('/shopping');
    await page.waitForSelector('[data-testid^="ingredient-"]', { timeout: 10000 });
    
    // Find multiple ingredients
    const ingredients = page.locator('[data-testid^="ingredient-"]');
    const ingredientCount = await ingredients.count();
    
    if (ingredientCount >= 2) {
      // Toggle multiple ingredients quickly
      const firstToggle = page.locator(`[data-testid="toggle-have-${(await ingredients.first().getAttribute('data-testid'))?.replace('ingredient-', '')}"]`);
      const secondToggle = page.locator(`[data-testid="toggle-have-${(await ingredients.nth(1).getAttribute('data-testid'))?.replace('ingredient-', '')}"]`);
      
      // Click both quickly
      await Promise.all([
        firstToggle.click(),
        secondToggle.click()
      ]);
      
      // Wait for both to process
      await page.waitForTimeout(1000);
      
      // Both should have been processed without errors
      const toastErrors = page.locator('.toast').filter({ hasText: /error/i });
      const errorCount = await toastErrors.count();
      
      expect(errorCount).toBe(0);
    }
  });

  test('should maintain data consistency across tabs', async ({ context }) => {
    // Create two tabs
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    // Both go to shopping page
    await page1.goto('/shopping');
    await page2.goto('/shopping');
    
    // Wait for both to load
    await page1.waitForSelector('[data-testid^="ingredient-"]', { timeout: 10000 });
    await page2.waitForSelector('[data-testid^="ingredient-"]', { timeout: 10000 });
    
    // Get ingredient count on both pages
    const count1 = await page1.locator('[data-testid^="ingredient-"]').count();
    const count2 = await page2.locator('[data-testid^="ingredient-"]').count();
    
    // Should be the same
    expect(count1).toBe(count2);
    
    // Make a change on page 1
    const firstIngredient = page1.locator('[data-testid^="ingredient-"]').first();
    const ingredientId = await firstIngredient.getAttribute('data-testid');
    
    if (ingredientId) {
      const toggleButton = page1.locator(`[data-testid="toggle-have-${ingredientId.replace('ingredient-', '')}"]`);
      await toggleButton.click();
      await page1.waitForTimeout(1000);
      
      // Refresh page 2
      await page2.reload();
      await page2.waitForSelector(`[data-testid="ingredient-${ingredientId.replace('ingredient-', '')}"]`, { timeout: 10000 });
      
      // Check that the change is reflected on page 2
      const ingredientName1 = page1.locator(`[data-testid="ingredient-name-${ingredientId.replace('ingredient-', '')}"]`);
      const ingredientName2 = page2.locator(`[data-testid="ingredient-name-${ingredientId.replace('ingredient-', '')}"]`);
      
      const decoration1 = await ingredientName1.evaluate(el => window.getComputedStyle(el).textDecoration);
      const decoration2 = await ingredientName2.evaluate(el => window.getComputedStyle(el).textDecoration);
      
      expect(decoration1).toBe(decoration2);
    }
    
    await page1.close();
    await page2.close();
  });
});
