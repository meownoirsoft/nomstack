<script>
  import { createEventDispatcher } from 'svelte';
  import { subscriptionStatus, TIER_TYPES, hasFeatureAccess, needsUpgrade } from '$lib/stores/userTier.js';
  import { Crown, Lock, ArrowRight } from 'lucide-svelte';
  import { goto } from '$app/navigation';

  const dispatch = createEventDispatcher();

  export let feature = null; // Feature name to check access for
  export let resource = null; // Resource type (e.g., 'maxRecipes')
  export let currentCount = 0; // Current count of the resource
  export let showUpgradeButton = true;
  export let customMessage = null;
  export let children = null; // Content to show when access is granted

  let showUpgradeModal = false;

  // Check if user has access
  $: hasAccess = feature ? hasFeatureAccess(feature) : true;
  $: needsUpgradeForResource = resource ? !isWithinLimit(resource, currentCount) : false;
  $: shouldShowGate = !hasAccess || needsUpgradeForResource;

  function isWithinLimit(resourceType, count) {
    let currentTier;
    subscriptionStatus.subscribe(status => {
      currentTier = status.tier;
    })();
    
    const limits = {
      [TIER_TYPES.FREE]: {
        maxRecipes: 50,
        maxMealPlans: 3,
        maxStores: 5
      },
      [TIER_TYPES.PLUS]: {
        maxRecipes: -1,
        maxMealPlans: -1,
        maxStores: -1
      }
    };
    
    const limit = limits[currentTier]?.[resourceType];
    if (limit === -1) return true; // unlimited
    return count < limit;
  }

  function handleUpgrade() {
    if (showUpgradeButton) {
      goto('/upgrade');
    }
    dispatch('upgrade');
  }

  function getUpgradeMessage() {
    if (customMessage) return customMessage;
    
    if (feature) {
      return `This feature is available with nomStack Plus. Upgrade to unlock advanced features and unlimited recipes.`;
    }
    
    if (resource) {
      const limits = {
        maxRecipes: 'recipes',
        maxMealPlans: 'meal plans',
        maxStores: 'stores'
      };
      const resourceName = limits[resource] || resource;
      return `You've reached your limit of ${getLimit(resource)} ${resourceName}. Upgrade to nomStack Plus for unlimited ${resourceName}.`;
    }
    
    return 'Upgrade to nomStack Plus to unlock this feature.';
  }

  function getLimit(resourceType) {
    let currentTier;
    subscriptionStatus.subscribe(status => {
      currentTier = status.tier;
    })();
    
    const limits = {
      [TIER_TYPES.FREE]: {
        maxRecipes: 50,
        maxMealPlans: 3,
        maxStores: 5
      },
      [TIER_TYPES.PLUS]: {
        maxRecipes: -1,
        maxMealPlans: -1,
        maxStores: -1
      }
    };
    
    return limits[currentTier]?.[resourceType] || 0;
  }
</script>

{#if shouldShowGate}
  <div class="pay-gate bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6 text-center">
    <div class="flex flex-col items-center gap-4">
      <div class="p-3 bg-primary/10 rounded-full">
        {#if feature}
          <Lock class="h-8 w-8 text-primary" />
        {:else}
          <Crown class="h-8 w-8 text-primary" />
        {/if}
      </div>
      
      <div>
        <h3 class="text-lg font-semibold text-primary mb-2">
          {#if feature}
            Premium Feature
          {:else}
            Upgrade Required
          {/if}
        </h3>
        <p class="text-primary/70 text-sm max-w-md">
          {getUpgradeMessage()}
        </p>
      </div>
      
      {#if showUpgradeButton}
        <button
          class="btn btn-primary btn-sm"
          on:click={handleUpgrade}
        >
          <Crown class="h-4 w-4" />
          Upgrade to Plus
          <ArrowRight class="h-4 w-4" />
        </button>
      {/if}
    </div>
  </div>
{:else}
  <slot />
{/if}

<style>
  .pay-gate {
    backdrop-filter: blur(4px);
  }
</style>
