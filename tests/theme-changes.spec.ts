import { test, expect } from '@playwright/test';

test.describe('Theme System', () => {
  test('should apply theme colors consistently across components', async ({ page }) => {
    // Test on multiple pages to ensure theme consistency
    const pages = ['/', '/shopping', '/pantry', '/settings'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      
      // Wait for page to load
      await page.waitForTimeout(1000);
      
      // Check that primary color is applied to buttons and text
      const primaryElements = page.locator('.text-primary, .btn-primary, .border-primary');
      const primaryCount = await primaryElements.count();
      
      // Should have some primary colored elements
      expect(primaryCount).toBeGreaterThan(0);
      
      // Check that no black text remains (should be primary or gray)
      const blackTextElements = page.locator('.text-black, .text-gray-900');
      const blackTextCount = await blackTextElements.count();
      
      // Should have minimal black text (only where intentionally black)
      expect(blackTextCount).toBeLessThan(5);
    }
  });

  test('should change theme and update all components', async ({ page }) => {
    // Go to settings page
    await page.goto('/settings');
    
    // Wait for settings to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Look for theme selection buttons
    const themeButtons = page.locator('button').filter({ hasText: /purple|blue|green|red|cyan|dark/i });
    
    if (await themeButtons.count() > 0) {
      // Get initial theme color
      const initialColor = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--primary');
      });
      
      // Click a different theme
      const secondThemeButton = themeButtons.nth(1);
      await secondThemeButton.click();
      
      // Wait for theme to apply
      await page.waitForTimeout(1000);
      
      // Check that the theme color changed
      const newColor = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--primary');
      });
      
      expect(newColor).not.toBe(initialColor);
      
      // Navigate to another page to verify theme persists
      await page.goto('/shopping');
      await page.waitForTimeout(1000);
      
      // Check that the new theme is still applied
      const persistedColor = await page.evaluate(() => {
        return getComputedStyle(document.documentElement).getPropertyValue('--primary');
      });
      
      expect(persistedColor).toBe(newColor);
    }
  });

  test('should handle dark mode correctly', async ({ page }) => {
    // Go to settings page
    await page.goto('/settings');
    
    // Look for dark mode toggle
    const darkModeButton = page.locator('button').filter({ hasText: /dark/i });
    
    if (await darkModeButton.count() > 0) {
      // Toggle dark mode
      await darkModeButton.click();
      await page.waitForTimeout(1000);
      
      // Check that dark mode classes are applied
      const bodyClasses = await page.locator('body').getAttribute('class');
      const htmlClasses = await page.locator('html').getAttribute('class');
      
      // Should have dark mode classes
      const hasDarkMode = (bodyClasses?.includes('dark') || htmlClasses?.includes('dark') || 
                          bodyClasses?.includes('dark-theme') || htmlClasses?.includes('dark-theme'));
      
      expect(hasDarkMode).toBeTruthy();
      
      // Check that text is still readable in dark mode
      const textElements = page.locator('h1, h2, h3, p, span').filter({ hasText: /./ });
      const firstTextElement = textElements.first();
      
      if (await firstTextElement.count() > 0) {
        const textColor = await firstTextElement.evaluate(el => 
          window.getComputedStyle(el).color
        );
        
        // Text should not be white on white background
        expect(textColor).not.toBe('rgb(255, 255, 255)');
      }
    }
  });
});
