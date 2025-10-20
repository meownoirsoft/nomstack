import { supabase } from '$lib/supabaseClient.js';
import { get } from 'svelte/store';
import { accessToken } from '$lib/stores/auth.js';

// API helper functions

// Helper function to get the current session token
export async function getAuthToken() {
  // Always get fresh session from Supabase to avoid stale tokens
  console.log('Getting fresh session from Supabase...');
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  console.log('Session found:', !!session);
  console.log('Access token found:', !!session?.access_token);
  console.log('Token preview:', session?.access_token?.substring(0, 20) + '...');
  
  return session?.access_token || null;
}

// Generic API request helper with auth
export async function apiRequest(endpoint, options = {}) {
  const token = await getAuthToken();
  
  if (!token) {
    console.error('No authentication token available for endpoint:', endpoint);
    console.error('Store token:', get(accessToken));
    throw new Error('Authentication required');
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
  async getSelections(type = 'all', planId = null) {
    const url = planId 
      ? `/api/sels-get?type=${type}&plan_id=${planId}`
      : `/api/sels-get?type=${type}`;
    return apiRequest(url);
  },

  async updateSelections(type, meals, planId = null) {
    return apiRequest('/api/sels-upd', {
      method: 'POST',
      body: JSON.stringify({ type, meals, plan_id: planId })
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
  },

  async parseRecipe(recipeText) {
    return apiRequest('/api/parse-recipe', {
      method: 'POST',
      body: JSON.stringify({ recipeText })
    });
  },

  async parseRecipeFromPhoto(photoFile) {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch('/api/parse-recipe-photo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async adjustRecipeServings(data) {
    return apiRequest('/api/adjust-recipe-servings', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // ===== SHOPPING LISTS API =====

  // Meal Plans
  async getMealPlans(status = 'active') {
    return apiRequest(`/api/meal-plans?status=${status}`);
  },

  async createMealPlan(planData) {
    return apiRequest('/api/meal-plans', {
      method: 'POST',
      body: JSON.stringify(planData)
    });
  },

  async updateMealPlan(planId, planData) {
    return apiRequest(`/api/meal-plans/${planId}`, {
      method: 'PATCH',
      body: JSON.stringify(planData)
    });
  },

  async deleteMealPlan(planId) {
    return apiRequest(`/api/meal-plans/${planId}`, {
      method: 'DELETE'
    });
  },

  // Stores
  async getStores() {
    return apiRequest('/api/stores');
  },

  async createStore(storeData) {
    return apiRequest('/api/stores', {
      method: 'POST',
      body: JSON.stringify(storeData)
    });
  },

  async updateStore(storeId, storeData) {
    return apiRequest(`/api/stores/${storeId}`, {
      method: 'PATCH',
      body: JSON.stringify(storeData)
    });
  },

  async deleteStore(storeId) {
    return apiRequest(`/api/stores/${storeId}`, {
      method: 'DELETE'
    });
  },

  // Shopping Lists
  async getShoppingLists(planId) {
    return apiRequest(`/api/shopping-lists?plan_id=${planId}`);
  },

  async createShoppingList(planId, storeId, title) {
    return apiRequest('/api/shopping-lists', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, store_id: storeId, title })
    });
  },

  async updateShoppingList(listId, listData) {
    return apiRequest(`/api/shopping-lists/${listId}`, {
      method: 'PATCH',
      body: JSON.stringify(listData)
    });
  },

  async deleteShoppingList(listId) {
    return apiRequest(`/api/shopping-lists/${listId}`, {
      method: 'DELETE'
    });
  },

  // Ingredients
  async getIngredients(filters = {}) {
    const params = new URLSearchParams();
    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.plan_id) params.append('plan_id', filters.plan_id);
    if (filters.category) params.append('category', filters.category);
    
    return apiRequest(`/api/ingredients?${params.toString()}`);
  },

  async createIngredient(ingredientData) {
    return apiRequest('/api/ingredients', {
      method: 'POST',
      body: JSON.stringify(ingredientData)
    });
  },

  async updateIngredient(ingredientId, ingredientData) {
    return apiRequest(`/api/ingredients/${ingredientId}`, {
      method: 'PATCH',
      body: JSON.stringify(ingredientData)
    });
  },

  async moveIngredient(ingredientId, storeId) {
    console.log('API moveIngredient called with:', ingredientId, storeId);
    return apiRequest(`/api/ingredients/${ingredientId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ store_id: storeId })
    });
  },

  async toggleIngredient(ingredientId, field) {
    return apiRequest(`/api/ingredients/${ingredientId}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ field })
    });
  },

  async deleteIngredient(ingredientId) {
    return apiRequest(`/api/ingredients/${ingredientId}`, {
      method: 'DELETE'
    });
  },

  async refreshIngredients(planId) {
    return apiRequest('/api/ingredients/refresh', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId })
    });
  },

  async regenerateIngredients(planId) {
    return apiRequest('/api/ingredients/regenerate', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId })
    });
  },

  // Meal Filters
  async getMealFilters() {
    return apiRequest('/api/meal-filters');
  },

  async updateMealFilters(filters) {
    return apiRequest('/api/meal-filters', {
      method: 'POST',
      body: JSON.stringify({ filters })
    });
  },


  // Sync status
  async getSyncStatus() {
    return apiRequest('/api/sync-status');
  },

  // Pantry management
  async getPantryItems() {
    return apiRequest('/api/pantry');
  },

  async addPantryItem(name, category = null) {
    return apiRequest('/api/pantry', {
      method: 'POST',
      body: JSON.stringify({ name, category })
    });
  },

  async updatePantryItem(id, name, category) {
    return apiRequest('/api/pantry', {
      method: 'PATCH',
      body: JSON.stringify({ id, name, category })
    });
  },

  async deletePantryItem(id) {
    return apiRequest('/api/pantry', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
  },

  async addPantryItemToPlan(pantryItemId, planId) {
    return apiRequest('/api/pantry/add-to-plan', {
      method: 'POST',
      body: JSON.stringify({ pantryItemId, planId })
    });
  },

  // Share Shopping List API
  async getShareLink(mealPlanId) {
    return apiRequest(`/api/share/${mealPlanId}`);
  },

  async createShareLink(mealPlanId, expiresAt) {
    return apiRequest('/api/share', {
      method: 'POST',
      body: JSON.stringify({ meal_plan_id: mealPlanId, expires_at: expiresAt })
    });
  },

  async regenerateShareLink(mealPlanId, expiresAt) {
    return apiRequest(`/api/share/${mealPlanId}/regenerate`, {
      method: 'POST',
      body: JSON.stringify({ expires_at: expiresAt })
    });
  },

  async getSharedShoppingList(token) {
    const response = await fetch(`/api/shared/${token}`);
    return response.json();
  },

  async addItemToSharedList(token, itemData) {
    const response = await fetch(`/api/shared/${token}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(itemData)
    });
    return response.json();
  },

        async addCommentToSharedList(token, ingredientId, comment, initials) {
          const response = await fetch(`/api/shared/${token}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ingredient_id: ingredientId, comment, created_by: initials })
          });
          return response.json();
        },

        async getSharedItemsForMealPlan(mealPlanId) {
          const response = await fetch(`/api/shared-items/${mealPlanId}`);
          return response.json();
        },

        async getCommentsForMealPlan(mealPlanId) {
          const response = await fetch(`/api/ingredients/${mealPlanId}/comments`);
          return response.json();
        },

        async deleteSharedComment(token, commentId) {
          const response = await fetch(`/api/shared/${token}/comments/${commentId}`, {
            method: 'DELETE'
          });
          return response.json();
        },

        async deleteSharedItem(token, itemId) {
          const response = await fetch(`/api/shared/${token}/items/${itemId}`, {
            method: 'DELETE'
          });
          return response.json();
        }
};
