import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { user } from './auth.js';

// User tier types
export const TIER_TYPES = {
  FREE: 'free',
  PLUS: 'plus'
};

// Feature limits for each tier
export const TIER_LIMITS = {
  [TIER_TYPES.FREE]: {
    maxRecipes: 50,
    maxMealPlans: 3,
    maxStores: 1,
    features: {
      recipeImport: true,
      photoImport: false, // Photo import is Plus only
      mealPlanning: true,
      shoppingLists: true,
      pantryTracking: true,
      smartPantry: false, // Smart pantry (auto-remove from shopping) is Plus only
      themeCustomization: false,
      advancedFilters: false,
      exportData: false,
      prioritySupport: false
    }
  },
  [TIER_TYPES.PLUS]: {
    maxRecipes: -1, // unlimited
    maxMealPlans: -1, // unlimited
    maxStores: -1, // unlimited
    features: {
      recipeImport: true,
      photoImport: true, // Photo import is Plus only
      mealPlanning: true,
      shoppingLists: true,
      pantryTracking: true,
      smartPantry: true, // Smart pantry (auto-remove from shopping) is Plus only
      themeCustomization: true,
      advancedFilters: true,
      exportData: true,
      prioritySupport: true
    }
  }
};

// Current user tier (defaults to free, determined by actual subscription status)
const getInitialTier = () => {
  if (browser) {
    // Check for manual Plus activation first
    const manualTier = localStorage.getItem('nomstack-user-tier');
    if (manualTier === TIER_TYPES.PLUS) {
      console.log('Loading manual Plus tier from localStorage');
      return TIER_TYPES.PLUS;
    }
    // Check for cached tier as fallback
    const cachedTier = localStorage.getItem('nomstack-cached-tier');
    if (cachedTier) {
      console.log('Loading cached tier from localStorage:', cachedTier);
      return cachedTier;
    }
    return TIER_TYPES.FREE;
  }
  return TIER_TYPES.FREE;
};

export const userTier = writable(getInitialTier());

// User subscription status - initialize with cached data if available
const getInitialSubscriptionStatus = () => {
  const initialTier = getInitialTier();
  return {
    tier: initialTier,
    isActive: initialTier === TIER_TYPES.PLUS,
    expiresAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null
  };
};

export const subscriptionStatus = writable(getInitialSubscriptionStatus());

// Check if user has access to a specific feature
export function hasFeatureAccess(feature) {
  let currentTier;
  
  userTier.subscribe(tier => {
    currentTier = tier;
  })();
  
  return TIER_LIMITS[currentTier]?.features[feature] || false;
}

// Check if user is within limits for a specific resource
export function isWithinLimit(resource, currentCount) {
  let currentTier;
  
  userTier.subscribe(tier => {
    currentTier = tier;
  })();
  
  const limit = TIER_LIMITS[currentTier]?.[resource];
  if (limit === -1) return true; // unlimited
  return currentCount < limit;
}

// Get the limit for a specific resource
export function getLimit(resource) {
  let currentTier;
  
  userTier.subscribe(tier => {
    currentTier = tier;
  })();
  
  return TIER_LIMITS[currentTier]?.[resource] || 0;
}

// Check if user needs to upgrade for a feature
export function needsUpgrade(feature) {
  return !hasFeatureAccess(feature);
}

// Check if user needs to upgrade for a resource limit
export function needsUpgradeForLimit(resource, currentCount) {
  return !isWithinLimit(resource, currentCount);
}

// Load user subscription status from API
export async function loadSubscriptionStatus() {
  if (!user) return;
  
  // Check for manual Plus activation first
  if (browser && localStorage.getItem('nomstack-user-tier') === TIER_TYPES.PLUS) {
    console.log('Using manual Plus tier from localStorage');
    const subscriptionData = {
      tier: TIER_TYPES.PLUS,
      isActive: true,
      expiresAt: localStorage.getItem('nomstack-subscription-expires') || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      stripeCustomerId: localStorage.getItem('nomstack-stripe-customer-id') || 'cus_manual',
      stripeSubscriptionId: localStorage.getItem('nomstack-stripe-subscription-id') || 'sub_manual'
    };
    subscriptionStatus.set(subscriptionData);
    userTier.set(TIER_TYPES.PLUS);
    return;
  }
  
  try {
    // Import apiRequest to include auth headers
    const { apiRequest } = await import('$lib/api.js');
    const data = await apiRequest('/api/stripe/status');
    
    if (data && !data.error) {
      // Update both stores with the same data
      subscriptionStatus.set(data);
      userTier.set(data.tier);
      // Cache the tier for faster loading next time
      if (browser) {
        localStorage.setItem('nomstack-cached-tier', data.tier);
      }
    } else {
      // If API fails, default to free tier
      const defaultData = {
        tier: TIER_TYPES.FREE,
        isActive: false,
        expiresAt: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null
      };
      subscriptionStatus.set(defaultData);
      userTier.set(TIER_TYPES.FREE);
    }
  } catch (error) {
    console.error('Error loading subscription status:', error);
    // Default to free tier on error
    const defaultData = {
      tier: TIER_TYPES.FREE,
      isActive: false,
      expiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    };
    subscriptionStatus.set(defaultData);
    userTier.set(TIER_TYPES.FREE);
  }
}

// Subscribe to user changes to load subscription status
user.subscribe(async (currentUser) => {
  if (currentUser) {
    await loadSubscriptionStatus();
  } else {
    // Reset to free tier when user logs out
    subscriptionStatus.set({
      tier: TIER_TYPES.FREE,
      isActive: false,
      expiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    });
    userTier.set(TIER_TYPES.FREE);
  }
});

// userTier is now the single source of truth
// Both stores are updated together in loadSubscriptionStatus()
