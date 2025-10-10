import { writable } from 'svelte/store';
import { api } from '$lib/api.js';

export const mealFilters = writable([]);
export const loadingMealFilters = writable(false);

export async function loadMealFilters() {
  loadingMealFilters.set(true);
  try {
    const result = await api.getMealFilters();
    if (result.success) {
      mealFilters.set(result.data);
    } else {
      console.error('Failed to load meal filters:', result.error);
      // Set default "All" filter if loading fails
      mealFilters.set([{ 
        id: 'all', 
        name: 'All', 
        order: 0, 
        is_default: true 
      }]);
    }
  } catch (error) {
    console.error('Error loading meal filters:', error);
    // Set default "All" filter if loading fails
    mealFilters.set([{ 
      id: 'all', 
      name: 'All', 
      order: 0, 
      is_default: true 
    }]);
  } finally {
    loadingMealFilters.set(false);
  }
}
