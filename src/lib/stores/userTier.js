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

// Current user tier (defaults to free, persists in localStorage for testing)
const getInitialTier = () => {
  if (browser) {
    const stored = localStorage.getItem('nomstack-test-tier');
    console.log('Loading tier from localStorage:', stored);
    console.log('Available localStorage keys:', Object.keys(localStorage));
    return stored || TIER_TYPES.FREE;
  }
  return TIER_TYPES.FREE;
};

export const userTier = writable(TIER_TYPES.FREE);

// Initialize from localStorage after browser is ready
if (browser) {
  // Set initial value from localStorage
  const storedTier = localStorage.getItem('nomstack-test-tier');
  if (storedTier) {
    console.log('Restoring tier from localStorage:', storedTier);
    userTier.set(storedTier);
  }
  
  // Subscribe to changes and persist to localStorage
  userTier.subscribe(value => {
    console.log('Saving tier to localStorage:', value);
    localStorage.setItem('nomstack-test-tier', value);
  });
}

// Function to clear test tier (reset to actual subscription tier)
export function clearTestTier() {
  if (browser) {
    localStorage.removeItem('nomstack-test-tier');
    userTier.set(TIER_TYPES.FREE);
  }
}

// User subscription status
export const subscriptionStatus = writable({
  tier: TIER_TYPES.FREE,
  isActive: false,
  expiresAt: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null
});

// Check if user has access to a specific feature
export function hasFeatureAccess(feature) {
  let testTier;
  
  userTier.subscribe(tier => {
    testTier = tier;
  })();
  
  // For testing, always use the test tier
  const activeTier = testTier;
  
  return TIER_LIMITS[activeTier]?.features[feature] || false;
}

// Check if user is within limits for a specific resource
export function isWithinLimit(resource, currentCount) {
  let testTier;
  
  userTier.subscribe(tier => {
    testTier = tier;
  })();
  
  // For testing, always use the test tier
  const activeTier = testTier;
  
  const limit = TIER_LIMITS[activeTier]?.[resource];
  if (limit === -1) return true; // unlimited
  return currentCount < limit;
}

// Get the limit for a specific resource
export function getLimit(resource) {
  let testTier;
  
  userTier.subscribe(tier => {
    testTier = tier;
  })();
  
  // For testing, always use the test tier
  const activeTier = testTier;
  
  return TIER_LIMITS[activeTier]?.[resource] || 0;
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
  
  try {
    const response = await fetch('/api/lemonsqueezy/status');
    if (response.ok) {
      const data = await response.json();
      subscriptionStatus.set(data);
      // Don't override test tier - only set if no test tier is stored
      if (!browser || !localStorage.getItem('nomstack-test-tier')) {
        userTier.set(data.tier);
      }
    }
  } catch (error) {
    console.error('Error loading subscription status:', error);
    // Default to free tier on error
    subscriptionStatus.set({
      tier: TIER_TYPES.FREE,
      isActive: false,
      expiresAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null
    });
    // Don't override test tier - only set if no test tier is stored
    if (!browser || !localStorage.getItem('nomstack-test-tier')) {
      userTier.set(TIER_TYPES.FREE);
    }
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
    // Don't override test tier - only set if no test tier is stored
    if (!browser || !localStorage.getItem('nomstack-test-tier')) {
      userTier.set(TIER_TYPES.FREE);
    }
  }
});
