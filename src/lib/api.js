import { supabase } from '$lib/supabaseClient.js';
import { get } from 'svelte/store';
import { accessToken } from '$lib/stores/auth.js';

// API helper functions

// Helper function to get the current session token
export async function getAuthToken() {
  // First try to get from store (faster)
  const storeToken = get(accessToken);
  if (storeToken) {
    return storeToken;
  }
  
  // Fallback to getting from Supabase
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

// Generic API request helper with auth
async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  };

  const response = await fetch(endpoint, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// API methods
export const api = {
  // Meals
  async getMeals(type = 'all') {
    return apiRequest(`/api/meal-get?type=${type}`);
  },

  async addMeal(meal) {
    return apiRequest('/api/meal-add', {
      method: 'POST',
      body: JSON.stringify(meal)
    });
  },

  async updateMeal(meal) {
    return apiRequest('/api/meal-upd', {
      method: 'POST',
      body: JSON.stringify(meal)
    });
  },

  async deleteMeal(id) {
    return apiRequest('/api/meal-del', {
      method: 'POST',
      body: JSON.stringify(id)
    });
  },

  // Categories
  async getCategories() {
    return apiRequest('/api/cat-get');
  },

  async addCategory(category) {
    return apiRequest('/api/cat-add', {
      method: 'POST',
      body: JSON.stringify(category)
    });
  },

  async updateCategories(categories) {
    return apiRequest('/api/cat-upd', {
      method: 'POST',
      body: JSON.stringify(categories)
    });
  },

  async deleteCategory(id) {
    return apiRequest('/api/cat-del', {
      method: 'POST',
      body: JSON.stringify(id)
    });
  },

  // Selections
  async getSelections(type = 'all') {
    return apiRequest(`/api/sels-get?type=${type}`);
  },

  async updateSelections(type, meals) {
    return apiRequest('/api/sels-upd', {
      method: 'POST',
      body: JSON.stringify({ type, meals })
    });
  },

  // Sources
  async getSources() {
    return apiRequest('/api/src-get');
  },

  // Restaurants
  async getRestaurants() {
    return apiRequest('/api/restaurants-get');
  },

  async addRestaurant(restaurant) {
    return apiRequest('/api/restaurants-add', {
      method: 'POST',
      body: JSON.stringify(restaurant)
    });
  },

  async updateRestaurant(restaurant) {
    return apiRequest('/api/restaurants-upd', {
      method: 'POST',
      body: JSON.stringify(restaurant)
    });
  },

  async deleteRestaurant(id) {
    return apiRequest('/api/restaurants-del', {
      method: 'POST',
      body: JSON.stringify({ id })
    });
  },

  // Recipes
  async getRecipe(mealId) {
    return apiRequest(`/api/recipe-get?mealId=${mealId}`);
  },

  async addRecipe(mealId, recipe) {
    return apiRequest('/api/recipe-add', {
      method: 'POST',
      body: JSON.stringify({ mealId, recipe })
    });
  },

  async updateRecipe(recipeId, recipe) {
    return apiRequest('/api/recipe-upd', {
      method: 'POST',
      body: JSON.stringify({ recipeId, recipe })
    });
  },

  async deleteRecipe(recipeId) {
    return apiRequest('/api/recipe-del', {
      method: 'POST',
      body: JSON.stringify({ recipeId })
    });
  }
};
