import { writable } from 'svelte/store';
import { api } from '$lib/api.js';
import { userTier, TIER_TYPES, hasFeatureAccess } from './userTier.js';

export const mealFilters = writable([]);
export const loadingMealFilters = writable(false);

// Default meal filters for free users
const DEFAULT_FREE_FILTERS = [
  { id: 'all', name: 'All', order: 0, is_default: true, is_system: true },
  { id: 'breakfast', name: 'Breakfast', order: 1, is_default: true, is_system: true, category_id: 'breakfast' },
  { id: 'lunch', name: 'Lunch', order: 2, is_default: true, is_system: true, flag: 'lunch' },
  { id: 'dinner', name: 'Dinner', order: 3, is_default: true, is_system: true, flag: 'dinner' },
  { id: 'snack', name: 'Snack', order: 4, is_default: true, is_system: true, category_id: 'snack' },
  { id: 'dessert', name: 'Dessert', order: 5, is_default: true, is_system: true, category_id: 'dessert' },
  { id: 'side', name: 'Side', order: 6, is_default: true, is_system: true, category_id: 'side' }
];

export async function loadMealFilters() {
  loadingMealFilters.set(true);
  try {
    // Check if user has access to advanced filters
    if (!hasFeatureAccess('advancedFilters')) {
      // Free users get default filters only
      // We need to get the actual category IDs for the category-based filters
      const freeFilters = await getFreeUserFiltersWithCategoryIds();
      mealFilters.set(freeFilters);
      loadingMealFilters.set(false);
      return;
    }

    const result = await api.getMealFilters();
    if (result.success) {
      mealFilters.set(result.data);
    } else {
      console.error('Failed to load meal filters:', result.error);
      // Set default filters based on user tier
      const defaultFilters = hasFeatureAccess('advancedFilters') 
        ? [{ id: 'all', name: 'All', order: 0, is_default: true }]
        : DEFAULT_FREE_FILTERS;
      mealFilters.set(defaultFilters);
    }
  } catch (error) {
    console.error('Error loading meal filters:', error);
    // Set default filters based on user tier
    const defaultFilters = hasFeatureAccess('advancedFilters') 
      ? [{ id: 'all', name: 'All', order: 0, is_default: true }]
      : DEFAULT_FREE_FILTERS;
    mealFilters.set(defaultFilters);
  } finally {
    loadingMealFilters.set(false);
  }
}

// Get free user filters with actual category IDs
async function getFreeUserFiltersWithCategoryIds() {
  try {
    // Get categories to map names to IDs
    const categoriesResult = await api.getCategories();
    const categories = categoriesResult || [];
    
    // Create a map of category names to IDs
    const categoryNameToId = new Map();
    categories.forEach(cat => {
      categoryNameToId.set(cat.name.toLowerCase(), cat.id);
    });
    
    // Update the default filters with actual category IDs
    const filtersWithIds = DEFAULT_FREE_FILTERS.map(filter => {
      if (filter.category_id && typeof filter.category_id === 'string') {
        // Look up the actual category ID
        const actualId = categoryNameToId.get(filter.category_id.toLowerCase());
        return {
          ...filter,
          category_id: actualId || null
        };
      }
      return filter;
    });
    
    return filtersWithIds;
  } catch (error) {
    console.error('Error getting category IDs for free filters:', error);
    // Fallback to original filters if there's an error
    return DEFAULT_FREE_FILTERS;
  }
}

// Check if user can customize meal filters
export function canCustomizeMealFilters() {
  return hasFeatureAccess('advancedFilters');
}
