# Automated UI Testing for nomStack

This directory contains comprehensive end-to-end tests to ensure that specific actions produce the expected results, especially for data-driven features.

## 🎯 **Test Coverage**

### **Critical Data Flows:**
- **Move Category to Store** (`move-category.spec.ts`)
  - Tests moving entire ingredient categories between stores
  - Verifies UI updates and ingredient counts change
  - Tests moving to "List" (unassigned) and specific stores

- **Ingredient State Management** (`ingredient-state.spec.ts`)
  - Tests "have this" toggle functionality
  - Verifies state persistence across page refreshes
  - Ensures visual feedback (strikethrough, "have this" text)

- **Meal Plan Workflow** (`meal-plan-workflow.spec.ts`)
  - Tests meal selection → shopping list generation
  - Verifies shopping list updates when meal plans change
  - Tests meal count badges on grouped ingredients

- **Data Persistence** (`data-persistence.spec.ts`)
  - Tests that changes persist across page refreshes
  - Verifies API error handling
  - Tests concurrent user actions
  - Ensures data consistency across browser tabs

- **Theme System** (`theme-changes.spec.ts`)
  - Tests theme changes affect all components
  - Verifies dark mode functionality
  - Ensures consistent primary color usage

## 🚀 **Running Tests**

### **All Tests:**
```bash
npm run test:e2e
```

### **Critical Tests Only:**
```bash
npm run test:critical
```

### **Specific Test Suites:**
```bash
npm run test:data      # Data persistence tests
npm run test:theme     # Theme system tests
```

### **Interactive Testing:**
```bash
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:headed  # Run with browser visible
npm run test:e2e:debug   # Debug mode
```

## 🔧 **Test Data Attributes**

The tests use `data-testid` attributes to reliably find elements:

### **Shopping List Components:**
- `data-testid="category-section-{category}"` - Category sections
- `data-testid="category-count-{category}"` - Ingredient counts
- `data-testid="move-category-{category}"` - Move category buttons
- `data-testid="move-category-to-{storeId}-{category}"` - Move to specific store
- `data-testid="move-category-to-list-{category}"` - Move to unassigned list
- `data-testid="ingredient-{ingredientId}"` - Individual ingredients
- `data-testid="ingredient-name-{ingredientId}"` - Ingredient names
- `data-testid="toggle-have-{ingredientId}"` - "Have this" toggle buttons

## 🐛 **Common Issues These Tests Catch**

### **Data Update Problems:**
- ✅ Ingredients not updating when moved between stores
- ✅ Category counts not reflecting actual ingredient counts
- ✅ "Have this" state not persisting across page refreshes
- ✅ Shopping list not updating when meal plans change

### **UI State Issues:**
- ✅ Move category dropdown not closing after selection
- ✅ Visual feedback not showing for ingredient state changes
- ✅ Theme colors not applying consistently across components
- ✅ Black text/icons remaining after theme updates

### **API Integration Issues:**
- ✅ API errors not handled gracefully
- ✅ Concurrent actions causing data inconsistencies
- ✅ Data not syncing across browser tabs

## 📝 **Adding New Tests**

When adding new features, follow this pattern:

1. **Add test data attributes** to your components:
   ```svelte
   <button data-testid="my-action-button">Action</button>
   ```

2. **Create test file** following the naming convention:
   ```typescript
   // tests/my-feature.spec.ts
   import { test, expect } from '@playwright/test';
   
   test.describe('My Feature', () => {
     test('should do specific action', async ({ page }) => {
       await page.goto('/my-page');
       await page.click('[data-testid="my-action-button"]');
       await expect(page.locator('[data-testid="result"]')).toBeVisible();
     });
   });
   ```

3. **Add to package.json scripts** if it's a critical feature:
   ```json
   "test:my-feature": "playwright test tests/my-feature.spec.ts"
   ```

## 🎯 **Test Strategy**

### **Focus Areas:**
1. **Data-driven features** - Where user actions change data
2. **Cross-component interactions** - Where changes in one place affect another
3. **State persistence** - Where data should survive page refreshes
4. **Visual feedback** - Where UI should reflect state changes
5. **Error handling** - Where things can go wrong

### **Test Philosophy:**
- **Test user workflows**, not implementation details
- **Verify end results**, not intermediate steps
- **Test with real data** when possible
- **Focus on critical paths** that users depend on

## 🔍 **Debugging Failed Tests**

1. **Run with UI mode** to see what's happening:
   ```bash
   npm run test:e2e:ui
   ```

2. **Check screenshots** in `test-results/` directory

3. **Add debugging** to your tests:
   ```typescript
   await page.screenshot({ path: 'debug.png' });
   console.log('Current URL:', page.url());
   ```

4. **Verify test data** exists in your app before running tests

These tests will help ensure that the data update and action issues you've been experiencing are caught and fixed permanently! 🎉
