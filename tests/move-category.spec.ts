import { test, expect } from '@playwright/test';

test.describe('Move Category to Store', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to shopping page and ensure we have test data
    await page.goto('/shopping');
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="category-section-Produce"]', { timeout: 10000 });
  });

  test('should move entire category to another store', async ({ page }) => {
    // Get initial count of ingredients in Produce category
    const initialCount = await page.textContent('[data-testid="category-count-Produce"]');
    console.log('Initial Produce count:', initialCount);
    
    // Click the move category button for Produce
    await page.click('[data-testid="move-category-Produce"]');
    
    // Wait for dropdown to appear
    await page.waitForSelector('[data-testid="move-category-to-list-Produce"]', { timeout: 5000 });
    
    // Click to move to List (unassigned)
    await page.click('[data-testid="move-category-to-list-Produce"]');
    
    // Wait for success notification
    await page.waitForSelector('.toast', { timeout: 5000 });
    
    // Verify the category moved by checking if Produce section is gone from current store
    // or if the count changed
    await page.waitForTimeout(1000); // Wait for UI to update
    
    // Check that the move was successful by looking for the success message
    const toast = page.locator('.toast');
    await expect(toast).toContainText('Moved Produce category to List');
  });

  test('should move category to specific store', async ({ page }) => {
    // First, ensure we have at least one store other than the current one
    const storeButtons = page.locator('[data-testid^="move-category-to-"]').filter({ hasText: /^move-category-to-(?!list)/ });
    const storeButtonCount = await storeButtons.count();
    
    if (storeButtonCount > 0) {
      // Get the first store button (not the "List" button)
      const firstStoreButton = storeButtons.first();
      const buttonId = await firstStoreButton.getAttribute('data-testid');
      
      // Click the move category button for Produce
      await page.click('[data-testid="move-category-Produce"]');
      
      // Wait for dropdown to appear
      await page.waitForSelector('[data-testid="move-category-to-list-Produce"]', { timeout: 5000 });
      
      // Click to move to the specific store
      await page.click(`[data-testid="${buttonId}"]`);
      
      // Wait for success notification
      await page.waitForSelector('.toast', { timeout: 5000 });
      
      // Verify the move was successful
      const toast = page.locator('.toast');
      await expect(toast).toContainText('Moved Produce category to');
    }
  });

  test('should update ingredient counts after moving category', async ({ page }) => {
    // Get initial count
    const initialCountElement = page.locator('[data-testid="category-count-Produce"]');
    const initialCount = await initialCountElement.textContent();
    const initialCountNum = parseInt(initialCount?.match(/\d+/)?.[0] || '0');
    
    if (initialCountNum > 0) {
      // Move the category
      await page.click('[data-testid="move-category-Produce"]');
      await page.waitForSelector('[data-testid="move-category-to-list-Produce"]', { timeout: 5000 });
      await page.click('[data-testid="move-category-to-list-Produce"]');
      
      // Wait for the move to complete
      await page.waitForSelector('.toast', { timeout: 5000 });
      await page.waitForTimeout(1000);
      
      // Verify the count changed (either to 0 or the section disappeared)
      const countAfterMove = await initialCountElement.textContent().catch(() => null);
      
      if (countAfterMove) {
        const countAfterMoveNum = parseInt(countAfterMove.match(/\d+/)?.[0] || '0');
        expect(countAfterMoveNum).toBeLessThan(initialCountNum);
      } else {
        // Section might have disappeared entirely
        const sectionExists = await page.locator('[data-testid="category-section-Produce"]').count() > 0;
        expect(sectionExists).toBeFalsy();
      }
    }
  });
});
