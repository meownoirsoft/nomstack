import { writable, get } from 'svelte/store';
import { api } from '$lib/api.js';

// Helper functions for localStorage persistence
function getStoredMealPlanId() {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('currentMealPlanId');
    console.log('Loading meal plan ID from localStorage:', stored);
    return stored;
  }
  return null;
}

function setStoredMealPlanId(planId) {
  if (typeof window !== 'undefined') {
    console.log('Saving meal plan ID to localStorage:', planId);
    if (planId) {
      localStorage.setItem('currentMealPlanId', planId);
    } else {
      localStorage.removeItem('currentMealPlanId');
    }
  }
}

// Global meal plan state
export const currentMealPlan = writable(null);
export const mealPlans = writable([]);
export const loadingMealPlans = writable(false);

// Load all meal plans
export async function loadMealPlans() {
  try {
    loadingMealPlans.set(true);
    const result = await api.getMealPlans('active');
    
    if (result.success) {
      mealPlans.set(result.data);
      
      // Try to restore the stored meal plan
      const storedPlanId = getStoredMealPlanId();
      
      if (storedPlanId && result.data.length > 0) {
        const storedPlan = result.data.find(p => p.id === storedPlanId);
        if (storedPlan) {
          // Only update if the plan is different
          const currentPlan = get(currentMealPlan);
          if (!currentPlan || currentPlan.id !== storedPlan.id) {
            currentMealPlan.set(storedPlan);
          }
        } else {
          // Stored plan no longer exists, use the most recent
          const currentPlan = get(currentMealPlan);
          if (!currentPlan || currentPlan.id !== result.data[0].id) {
            currentMealPlan.set(result.data[0]);
          }
          setStoredMealPlanId(result.data[0].id);
        }
      } else if (result.data.length > 0) {
        // No stored plan, set the most recent plan as current
        const currentPlan = get(currentMealPlan);
        if (!currentPlan || currentPlan.id !== result.data[0].id) {
          currentMealPlan.set(result.data[0]);
        }
        setStoredMealPlanId(result.data[0].id);
      }
    }
  } catch (error) {
    console.error('Error loading meal plans:', error);
  } finally {
    loadingMealPlans.set(false);
  }
}

// Set the current meal plan
export async function setCurrentMealPlan(planId) {
  console.log('setCurrentMealPlan called with:', planId);
  if (!planId) {
    console.log('Clearing current meal plan');
    currentMealPlan.set(null);
    setStoredMealPlanId(null);
    return;
  }
  
  const plans = get(mealPlans);
  const plan = plans.find(p => p.id === planId);
  if (plan) {
    console.log('Setting current meal plan to:', plan.title);
    currentMealPlan.set(plan);
    setStoredMealPlanId(planId);
  } else {
    console.log('Plan not found in meal plans list');
  }
}

// Create a new meal plan
export async function createMealPlan(title) {
  try {
    const result = await api.createMealPlan({ title });
    if (result.success) {
      // Reload meal plans to include the new one
      await loadMealPlans();
      // Set the new plan as current
      if (result.data) {
        currentMealPlan.set(result.data);
        setStoredMealPlanId(result.data.id);
      }
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Error creating meal plan:', error);
    return null;
  }
}

// Update meal plan title
export async function updateMealPlan(planId, updates) {
  try {
    const result = await api.updateMealPlan(planId, updates);
    if (result.success) {
      // Update the current plan if it's the one being updated
      const current = await currentMealPlan;
      if (current && current.id === planId) {
        currentMealPlan.set({ ...current, ...updates });
      }
      // Reload meal plans to get updated data
      await loadMealPlans();
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Error updating meal plan:', error);
    return null;
  }
}

// Delete meal plan
export async function deleteMealPlan(planId) {
  try {
    const result = await api.deleteMealPlan(planId);
    if (result.success) {
      // If we deleted the current plan, clear it
      const current = await currentMealPlan;
      if (current && current.id === planId) {
        currentMealPlan.set(null);
      }
      // Reload meal plans to get updated data
      await loadMealPlans();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting meal plan:', error);
    return false;
  }
}
